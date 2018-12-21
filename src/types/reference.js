/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/

import { Scope }                                                                                            from "../scope";
import { Type }                                                                                             from "./base-type";
import { baseTypesToString, declare_handler, entity_name, handle_kind, identifier, stringify_type_parargs } from "../ts-utils";
import { SyntaxKind }                                                                                       from "typescript";
import { declaration }                                                                                      from "../create-type";
import { $, no_parent }                                                                                     from "../utils";

/**
 * @extends Type
 */
export class TypeReference extends Type
{
    /** */
    constructor()
    {
        super( 'reference' );
        this.resolvesTo = null;
        this.typeArguments = null;
        this.referenceName = null;
        this.baseType = baseTypesToString[ SyntaxKind.UnknownKeyword ];
        this.__mangled = 'reference';
    }

    /**
     * @param {string|Type} name
     */
    resolve( name )
    {
        this.referenceName = name;
        this.__mangled = 'reference->' + name;
        if ( typeof name === 'string' )
            this.resolvesTo = Scope.current.resolve( name );
        else
            this.resolvesTo = name;

        if ( this.resolvesTo )
            this.baseType = this.resolvesTo;

        return this.resolvesTo;
    }

    getMangled( name = '' )
    {
        return name + '-' + this.resolvesTo ? this.resolvesTo.getMangled() : this.__mangled;
    }

    /**
     * @return {Type}
     */
    follow()
    {
        if ( !this.resolvesTo )
            throw new Error( `Unable to follow unresolved reference` );

        let p = this.resolvesTo;

        if ( p && p instanceof TypeReference )
            return p.follow();

        return p;
    }

    /**
     * @return {string}
     */
    toString()
    {
        const ta = this.typeArguments && this.typeArguments.length ? `<${this.typeArguments.map( x => `${x}` ).join( ', ' )}>` : '';
        return `${this.referenceName}${ta}`;
    }
}

/**
 * @extends Type
 */
export class TypeAlias extends Type
{
    /** */
    constructor()
    {
        super( 'alias', true );
        this.resolvesTo = null;
        this.typeParameters = null;
    }

    /**
     * @return {string}
     */
    get baseType()
    {
        return this.resolvesTo || baseTypesToString[ SyntaxKind.UnknownKeyword ];
    }

    /**
     * @param {*} v
     */
    set baseType( v )
    {
        // nop
    }

    /**
     * @return {string}
     */
    toString()
    {
        return `type ${this.boundTo.name}${stringify_type_parargs( this.typeParameters )} = ${this.resolvesTo}`;
    }
}

/**
 * @extends Type
 */
export class ConditionalType extends Type
{
    /** */
    constructor()
    {
        super( 'conditional' );
        this.checkType = null;
        this.extendsType = null;
        this.trueType = null;
        this.falseType = null;
        this.baseType = baseTypesToString[ SyntaxKind.UnknownKeyword ];
    }

    /**
     * @return {string}
     */
    toString()
    {
        return `${this.checkType} extends ${this.extendsType} ? ${this.trueType} : ${this.falseType}`;
    }
}

/**
 * @extends Type
 */
export class InferType extends Type
{
    /** */
    constructor()
    {
        super( 'infer' );
        /** @type {?Binding} */
        this.typeParameter = null;
        this.baseType = baseTypesToString[ SyntaxKind.UnknownKeyword ];
    }

    toString()
    {
        return `infer ${stringify_type_parargs( this.typeParameter )}`;
    }
}

/**
 * @extends Type
 */
export class TypePredicateType extends Type
{
    /** */
    constructor()
    {
        super( 'predicate' );
        /** @type {?BindingInfo} */
        this.parameter = null;
        this.type = null;
        this.baseType = baseTypesToString[ SyntaxKind.UnknownKeyword ];
    }

    /**
     * @return {string}
     */
    toString()
    {
        return `${this.parameter.name} is ${this.type}`;
    }
}

// /**
//  * @param {ts.DeclarationWithTypeParameterChildren|ts.TypeAliasDeclaration} node
//  */
// function new_type_alias( node )
// {
//     const aliasName = entity_name( node.name );
//
//     const alias = new TypeAlias();
//
//     alias.typeParameters = node.typeParameters && node.typeParameters.map( declaration );
//     alias.resolvesTo = handle_kind( node.type );
//
//     Scope.current.bind( { name: aliasName, type: alias, declaration: node } );
//
//     return alias;
// }

/**
 * @param {ts.TypeReferenceNode} node
 * @return {TypeReference}
 */
function new_type_reference( node )
{
    const refName = entity_name( node.typeName || node.exprName );
    // const typeArgs = node.typeArguments && node.typeArguments.length && node.typeArguments;
    const ref = new TypeReference();

    // console.error( 'ta:', node.typeArguments );
    ref.typeArguments = node.typeArguments && node.typeArguments.map( handle_kind );
    // console.error( ref.typeArguments );
    ref.resolve( refName );

    return ref;
}

/**
 * @param {ts.ConditionalTypeNode} node
 * @return {ConditionalType}
 */
function new_conditional_type( node )
{
    const type = new ConditionalType();

    type.checkType = handle_kind( node.checkType );
    type.extendsType = handle_kind( node.extendsType );
    type.trueType = handle_kind( node.trueType );
    type.falseType = handle_kind( node.falseType );

    return type;
}

/**
 * @param {ts.InferTypeNode} node
 * @return {InferType}
 */
function new_infer_type( node )
{
    const type = new InferType();

    type.typeParameter = declaration( node.typeParameter );

    return type;
}

/**
 * @param {ts.TypePredicateNode} node
 */
function new_type_predicate( node )
{
    const type = new TypePredicateType();

    type.parameter = Scope.current.resolve( identifier( node.parameterName ) );
    type.type = handle_kind( node.type );

    return type;
}

declare_handler( new_type_reference, SyntaxKind.TypeReference, SyntaxKind.TypeQuery );
// declare_handler( new_type_alias, SyntaxKind.TypeAliasDeclaration );
declare_handler( new_conditional_type, SyntaxKind.ConditionalType );
declare_handler( new_infer_type, SyntaxKind.InferType );
declare_handler( new_type_predicate, SyntaxKind.TypePredicate, SyntaxKind.FirstTypeNode );
