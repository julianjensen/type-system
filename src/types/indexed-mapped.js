/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/
"use strict";

import { Type } from "./base-type";

/**
 * @extends Type
 */
export class IndexedType extends Type
{
    /** */
    constructor()
    {
        super( 'indexed', true );
        this._objectType = null;
        this._indexType = null;
    }

    /**
     * @param {Type} [ot]
     * @return {IndexedType|Type}
     */
    objectType( ot )
    {
        if ( ot )
        {
            this._objectType = ot;
            return this;
        }

        return this._objectType;
    }

    /**
     * @param {Type} [it]
     * @return {Type|IndexedType}
     */
    indexType( it )
    {
        if ( it )
        {
            this._indexType = it;
            return this;
        }

        return this._indexType;
    }

}

/**
 * @extends Type
 */
export class MappedType extends Type
{
    /** */
    constructor()
    {
        super( 'mapped', true );
        this.isMapped = true;
        this._from = null;
        this._to = null;
    }

    /**
     * @param {Type} [f]
     * @return {MappedType|Type}
     */
    from( f )
    {
        if ( f )
        {
            this._from = f;
            return this;
        }

        return this._from;
    }

    /**
     * @param {Type} t
     * @return {MappedType|Type}
     */
    to( t )
    {
        if ( t )
        {
            this._to = t;
            return this;
        }

        return this._to;
    }

    /**
     * @return {string}
     */
    toString()
    {
        return `${this.from} in ${this.to}`
    }
}
