/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/

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
        this._elementType = null;
        this.baseType = baseTypesToString[ SyntaxKind.ObjectKeyword ];
        this.__mangled = 'array';
    }

    get elementType()
    {
        return this._elementType;
    }

    set elementType( et )
    {
        this._elementType = et;
        this.__mangled = `array~${et.__mangled}`;
    }

    /**
     * @return {string}
     */
    toString()
    {
        return `${this._elementType}[]`;
    }
}

/** */
export class TupleType extends Type
{
    /** */
    constructor()
    {
        super( 'tuple' );
        this._elementTypes = [];
        this.baseType = baseTypesToString[ SyntaxKind.ObjectKeyword ];
        this.__mangled = 'tuple';
    }

    set elementTypes( et )
    {
        this._elementTypes = et;
        this.__mangled = `tuple~${this._elementTypes.length}~${et.map( t => t.__mangled ).join( '~' )}`;
    }

    get elementTypes()
    {
        return this._elementTypes;
    }

    /**
     * @return {string}
     */
    toString()
    {
        return `[${this._elementTypes.map( t => `${t}` )}]`;
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
