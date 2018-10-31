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
class UnionIntersection extends Type
{
    constructor( typeName )
    {
        super( typeName );
        this.types = [];
    }

    add( type )
    {
        this.types.push( type );
    }

    has( typeClass )
    {
        return this.types.some( t => t instanceof typeClass );
    }

    same( typeInst )
    {
        return this.types.some( t => t.constructor === typeInst.constructor );
    }
}

/**
 * @extends UnionIntersection
 */
export class Union extends UnionIntersection
{
    toString()
    {
        return this.types.map( t => `${t}` ).join( ' | ' );
    }
}

/**
 * @extends UnionIntersection
 */
export class Intersection extends UnionIntersection
{
    toString()
    {
        return this.types.map( t => `${t}` ).join( ' & ' );
    }
}
