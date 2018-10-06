/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/
"use strict";

import { italic } from "./utils";
import { Scope } from "./scope";

/**
 * @param {Class} superclass
 * @return {{new(*=): IndexedType, prototype: IndexedType}}
 * @constructor
 */
const IIndexedType = superclass => class IndexedType extends superclass
{
    /**
     * @param name
     */
    constructor( name = italic`anonymous` )
    {
        super( italic`indexed` );
        this.__name = name;
        this.isIndexed = true;
        this.objectType = null;
        this.indexType = null;
        this.scope = Scope.current.add_inner( this );
    }

    /**
     * @return {string}
     */
    toString()
    {
        return `${this.objectType}[${this.indexType}]`;
    }
};

/**
 * @param {Class} superclass
 * @return {{new(*=): MappedType, prototype: MappedType}}
 * @constructor
 */
const IMappedType = superclass => class MappedType extends superclass
{
    /**
     * @param {string} name
     */
    constructor( name = italic`anonymous` )
    {
        super( italic`mapped` );
        this.__name = name;
        this.isMapped = true;
        this.from = null;
        this.to = null;
        this.scope = Scope.current.add_inner( this );
    }

    /**
     * @return {string}
     */
    toString()
    {
        return `{ [ ${this.from} ]: ${this.to} }`;
    }
};

export {
    IIndexedType,
    IMappedType
};
