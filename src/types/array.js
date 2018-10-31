/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/
"use strict";

import { Type } from "./base-type";

/** */
export class ArrayType extends Type
{
    /** */
    constructor()
    {
        super( 'array' );
        this.elementType = null;
    }

    /**
     * @return {string}
     */
    toString()
    {
        return `${this.elementType}[]`;
    }
}

/** */
export class TupleType extends Type
{
    /** */
    constructor()
    {
        super( 'tuple' );
        this.elementTypes = [];
    }

    /**
     * @return {string}
     */
    toString()
    {
        return `[${this.elementTypes.map( t => `${t}` )}]`;
    }
}
