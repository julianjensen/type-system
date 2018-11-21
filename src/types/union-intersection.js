/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/

import { Type }                                          from "./base-type";
import { declare_handler, get_source_info, handle_kind } from "../ts-utils";
import { SyntaxKind }                                    from "typescript";

/**
 * @extends Type
 */
class UnionIntersection extends Type
{
    /**
     * @param {string} typeName
     */
    constructor( typeName )
    {
        super( typeName );
        this.types = [];
        this.source = [];
        this.baseType = new Set();
        this.separator = '?';
    }

    /**
     * @param {Type} type
     * @param {*} [source]
     */
    add( type, source )
    {
        this.source[ this.types.length ] = source;
        this.types.push( type );
        this.baseType.add( type );
    }

    /**
     * @param {Type} typeClass
     * @return {boolean}
     */
    has( typeClass )
    {
        return this.types.some( t => t instanceof typeClass );
    }

    /**
     * @param {object|Type} typeInst
     * @return {boolean}
     */
    same( typeInst )
    {
        return this.types.some( t => t.constructor === typeInst.constructor );
    }

    toString()
    {
        return this.types.map( t => `${t}` || `no string for ${t.constructor.name}` ).join( ` ${this.separator} ` );
    }
}

/**
 * @extends UnionIntersection
 */
export class Union extends UnionIntersection
{
    constructor( typeName )
    {
        super( typeName );
        this.separator = '|';
    }
}

/**
 * @extends UnionIntersection
 */
export class Intersection extends UnionIntersection
{
    constructor( typeName )
    {
        super( typeName );
        this.separator = '&';
    }
}

const new_combined_type = Klass => typeNode => {
    const u = new Klass( Klass.name.toLowerCase() );

    typeNode.types.forEach( t => u.add( handle_kind( t ), get_source_info( t ) ) );

    return u;
};

/**
 * @param {ts.ParenthesizedTypeNode} typeNode
 * @return {Type}
 */
function new_parenthesized_type( typeNode )
{
    const t = handle_kind( typeNode.type );

    t.isParenthesized = true;

    return t;
}

declare_handler( new_combined_type( Union ), SyntaxKind.UnionType );
declare_handler( new_combined_type( Intersection ), SyntaxKind.IntersectionType );
declare_handler( new_parenthesized_type, SyntaxKind.ParenthesizedType );
