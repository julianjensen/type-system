/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/




"use strict";

import { Scope }                                                                                                                  from "../scope";
import { Type }                                                                                                                   from "./base-type";
import { create_type_parameter, declare_handler, entity_name, read_type_arguments, read_type_parameters, stringify_type_parargs } from "../ts-utils";
import { SyntaxKind }                                                                                                             from "typescript";
import { type_creator }                                                                                                           from "../utils";

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
    }

    /**
     * @param {string|Type} name
     */
    resolve( name )
    {
        if ( typeof name === 'string' )
            this.resolvesTo = Scope.current.resolve( name );
        else
            this.resolvesTo = name;

        return this.resolvesTo;
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
}

/**
 * @extends Type
 */
export class TypeAlias extends Type
{
    /** */
    constructor()
    {
        super( 'alias' );
        this.resolvesTo = null;
        this.typeParameters = null;
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
        /** @type {BindingInfo} */
        this.typeParameter = null;
    }

    toString()
    {
        return `infer ${this.boundTo.name}${stringify_type_parargs( this.typeParameter )}`;
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
        /** @type {BindingInfo} */
        this.parameter = null;
        this.type = null;
    }

    /**
     * @return {string}
     */
    toString()
    {
        return `${this.parameter.name} is ${this.type}`;
    }
}

/**
 * @param {string} name
 * @param {ts.DeclarationWithTypeParameterChildren|ts.TypeAliasDeclaration} node
 */
function new_type_alias( name, node )
{
    const aliasName = entity_name( node.name );

    const alias = new TypeAlias();

    alias.typeParameters = read_type_parameters( node.typeParameters );
    alias.resolvesTo = type_creator( node.type );

    Scope.current.bind( { name: aliasName, type: alias, declaration: node } );

    return alias;
}

function new_type_reference( name, node )
{
    const refName = entity_name( node.typeName || node.exprName );
    // const typeArgs = node.typeArguments && node.typeArguments.length && node.typeArguments;
    const ref = new TypeReference();

    ref.typeArguments = read_type_arguments( node.typeArguments );

    ref.resolve( refName );

    return ref;
}

function new_conditional_type( name, node )
{
    const type = new ConditionalType();

    type.checkType = type_creator( node.checkType );
    type.extendsType = type_creator( node.extendsType );
    type.trueType = type_creator( node.trueType );
    type.falseType = type_creator( node.falseType );

    return type;
}

function new_infer_type( name, node )
{
    const type = new InferType();

    type.typeParameter = create_type_parameter( node.typeParameter, 0 );

    return type;
}

/**
 * @param {string} name
 * @param {ts.TypePredicate} node
 */
function new_type_predicate( name, node )
{
    const type = new TypePredicateType();

    type.parameter = Scope.current.resolve( node.parameterName );
    type.type = type_creator( node.type );

    return type;
}

declare_handler( new_type_reference, SyntaxKind.TypeReference, SyntaxKind.TypeQuery );
declare_handler( new_type_alias, SyntaxKind.TypeAliasDeclaration );
declare_handler( new_conditional_type, SyntaxKind.ConditionalType );
declare_handler( new_infer_type, SyntaxKind.InferType );
declare_handler( new_type_predicate, SyntaxKind.TypePredicate, SyntaxKind.FirstTypeNode );
