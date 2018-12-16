/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/
import { Type }                               from "./base-type";
import { SyntaxKind }                         from "typescript";
import { baseTypesToString, declare_handler } from "../ts-utils";
import { Scope }                              from "../scope";
import { Binding }                            from "../binding";

/**
 * @type {Map<string|number|boolean, StringLiteralType|NumericLiteralType|BooleanLiteralType>}
 */
const valueMap = new Map();

/** */
export class LiteralType extends Type
{
    /** */
    constructor( underlyingType, valueName )
    {
        super( 'literal' );
        this.baseType = baseTypesToString[ underlyingType ];
        this.valueName = valueName;
        this.__mangled = `${this.baseType}-"${this.valueName}"`;
    }
}

/** */
export class StringLiteralType extends LiteralType
{
    /**
     * @param {string} valueName
     */
    constructor( valueName )
    {
        super( 'string', valueName );
        valueMap.set( valueName, this );
    }

    /**
     * @return {string}
     */
    toString()
    {
        return `"${this.valueName}"`;
    }

    /**
     * @param {string} value
     * @return {StringLiteralType}
     */
    static byConstraint( value )
    {
        return valueMap.get( value );
    }
}

/** */
export class NumericLiteralType extends LiteralType
{
    /**
     * @param {string|number} valueName
     */
    constructor( valueName )
    {
        super( 'number', valueName );
        valueMap.set( Number( valueName ), this );
    }

    /**
     * @return {string}
     */
    toString()
    {
        return this.valueName.toString();
    }

    /**
     * @param value
     * @return {NumericLiteralType}
     */
    static byConstraint( value )
    {
        return valueMap.get( Number( value ) );
    }
}

/** */
export class BooleanLiteralType extends LiteralType
{
    /**
     * @param {boolean} valueName
     */
    constructor( valueName )
    {
        super( 'boolean', valueName );
        valueMap.set( valueName, this );
    }

    /**
     * @return {string}
     */
    toString()
    {
        return this.valueName ? 'true' : 'false';
    }

    /**
     * @param {boolean} value
     * @return {BooleanLiteralType}
     */
    static byConstraint( value )
    {
        return valueMap.get( value );
    }
}

/**
 * @param {ts.LiteralTypeNode} typeNode
 * @return {*}
 */
function create_literal_type( typeNode )
{
    /** @type {ts.LiteralExpression|ts.BooleanLiteral} */
    const litNode = typeNode.literal;

    if ( litNode.kind === SyntaxKind.TrueKeyword || litNode.kind === SyntaxKind.FalseKeyword )
    {
        const hardValue = litNode.kind === SyntaxKind.TrueKeyword;

        return BooleanLiteralType.byConstraint( hardValue ) || new BooleanLiteralType( hardValue );
    }

    if ( !litTypes[ litNode.kind ] )
        debugger;

    const LitType = litTypes[ litNode.kind ];
    return LitType.byConstraint( litNode.text ) || new LitType( litNode.text );
}

/**
 * @type {object<SyntaxKind.StringLiteral|SyntaxKind.NumericLiteral, StringLiteralType|NumericLiteralType>}
 */
const litTypes = {
    [ SyntaxKind.StringLiteral ]:  StringLiteralType,
    [ SyntaxKind.NumericLiteral ]: NumericLiteralType
};

declare_handler( create_literal_type, SyntaxKind.LiteralType );
