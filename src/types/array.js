/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/




"use strict";

import { Type }                                            from "./base-type";
import { baseTypesToString, declare_handler, handle_kind } from "../ts-utils";
import { SyntaxKind }                                      from "typescript";

/** */
export class ArrayType extends Type
{
    /** */
    constructor()
    {
        super( 'array' );
        this.elementType = null;
        this.baseType = baseTypesToString[ SyntaxKind.ObjectKeyword ];
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
        this.baseType = baseTypesToString[ SyntaxKind.ObjectKeyword ];
    }

    /**
     * @return {string}
     */
    toString()
    {
        return `[${this.elementTypes.map( t => `${t}` )}]`;
    }
}

/**
 * @param {ts.ArrayTypeNode} typeNode
 * @return {ArrayType}
 */
function read_array_type( typeNode )
{
    const at = new ArrayType();

    at.elementType = handle_kind( typeNode.elementType );

    return at;
}

/**
 * @param {ts.TupleTypeNode} typeNode
 * @return {TupleType}
 */
function read_tuple_type( typeNode )
{
    const tt = new TupleType();

    tt.elementTypes = typeNode.elementTypes.map( handle_kind );

    return tt;
}

declare_handler( read_array_type, SyntaxKind.ArrayType );
declare_handler( read_tuple_type, SyntaxKind.TupleType );
