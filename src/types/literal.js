/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/
import { Type }                                            from "./base-type";
import { SyntaxKind }                                      from "typescript";
import { Scope }                                           from "../scope";
import { baseTypesToString, declare_handler, handle_kind } from "../ts-utils";

/** */
export class LiteralType extends Type
{
    /** */
    constructor()
    {
        super( 'literal' );
        this._value = null;
        this.literalType = null;
        this.baseType = baseTypesToString[ SyntaxKind.UnknownKeyword ];
    }

    /**
     * @param {string} v
     * @return {LiteralType}
     */
    value( v )
    {
        if ( v === void 0 ) return this._value;
        this._value = v;
        return this;
    }

    /**
     * @param {ts.LiteralExpression|ts.BooleanLiteral|ts.PrefixUnaryExpression} t
     * @return {LiteralType}
     */
    valueType( t )
    {
        const keyword = SyntaxKind[ t.kind ].replace( /^(.*)(?:Literal|Keyword)$/, '$1' ).toLowerCase();
        this.literalType = Scope.global.resolve( keyword );
        if ( !this.literalType )
            console.error( `Unable to resolve alias "${keyword}" from "${SyntaxKind[ t.kind ]}"` );
        if ( this.literalType && this.literalType.value )
            this.baseType = this.literalType.value.baseType;
        return this;
    }

    /**
     * @return {string}
     */
    toString()
    {
        switch ( `${this.literalType.type}` )
        {
            case 'string':
                return `"${this._value}"`;

            case 'number':
                return String( Number( this._value ) );

            case 'boolean':
                return String( this._value === 'true' );

            default:
                return `Unknown literal type: ${this.literalType.type}`;
        }
    }
}

/**
 * @param {ts.LiteralTypeNode} typeNode
 * @return {LiteralType}
 */
function new_literal_type( typeNode )
{
    const lit = new LiteralType();

    return lit.value( handle_kind( typeNode.literal ) ).valueType( typeNode.literal );
}

/**
 * @param {ts.StringLiteral} typeNode
 * @return {string}
 */
function get_literal_value( typeNode )
{
    return typeNode.text;
}

declare_handler( new_literal_type, SyntaxKind.LiteralType );
declare_handler( get_literal_value, SyntaxKind.StringLiteral, SyntaxKind.NumericLiteral );
