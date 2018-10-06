/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/




"use strict";

import { Type }                                                             from "./base-type";
import { ANONYMOUS, CALL, CONSTRUCTOR, italic, type_creator }               from "./utils";
import { Scope }                                                            from "./scope";
import { ObjectType }                                                       from "./instance";
import { binding_name, declare_handler, identifier, modify, property_name } from "./ts-utils";
import { SyntaxKind }                                                       from "./ts-helpers";
import { NamedObject }                                                      from "./named-object";
import { declare_types }                                                    from "./create-type";

/**
 * @extends Type
 */
export class Signature extends Type
{
    /**
     * @param {string} name
     */
    constructor( name )
    {
        super( italic`function` );
        this.__name = name;
        this.isSignature = true;
        this.isCall = name === CALL;
        this.isFunction = true;
        this.parameters = [];
        this.type = null;
        this.scope = Scope.current.add_inner( this );
        this.context = null;
    }

    /**
     * @param {ts.FunctionLikeDeclaration|ts.SignatureDeclaration} node
     * @param {object} decl
     */
    static read( node, decl )
    {
        const scope = Scope.descend( Scope.current.add_inner() );
        const type = decl.type;

        type.parameters = node.parameters.map( ( p, i ) => {
            const name = binding_name( p.name );
            /** @type {Type|NamedObject} */
            const type = type_creator( p.type, name );

            type.parameterIndex( i );
            modify( p, type );
            scope.bind( { name, type, declaration: p } );
        } );

        if ( node.typeParameters && node.typeParameters.length )
        {
            /**
             * @typedef {object} TypeParameterInfo
             * @extends DeclarationInfo
             * @property {TypeParameter|NamedObject} type
             * @property {ts.TypeParameterDeclaration} declaration
             */
            /**
             * @type {TypeParameterInfo[]}
             */
            type.typeParameters = node.typeParameters.map( declare_types );
            type.typeParameters.forEach( ( t, i ) => {
                scope.bind( t );
                t.type.parameterIndex( i );
                modify( t.declaration, t.type );
            } );
        }

        if ( decl.hasOwnProperty( 'type' ) )
            type.type = modify( node.type, type_creator( node.type ) );
    }

    /**
     * @param {?string|ts.FunctionDeclaration|ts.FunctionLikeDeclaration} _
     * @param {ts.FunctionDeclaration|ts.FunctionLikeDeclaration} [node]
     */
    static func_decl_read( _, node = _ )
    {
        const r = {
            name: identifier( node.name ),
            type: {
                parameters: null,
                type: null
            }
        };

        return Signature.read( node, r );
    }

    /**
     * @param {?string|ts.MethodDeclaration|ts.MethodSignature|ts.FunctionLikeDeclaration} _
     * @param {ts.MethodDeclaration|ts.MethodSignature|ts.FunctionLikeDeclaration} [node]
     */
    static meth_decl_read( _, node = _ )
    {
        const r = {
            name: property_name( node.name ),
            type: {
                parameters: null,
                type: null
            }
        };

        return Signature.read( node, r );
    }

    /**
     * @param {?string|ts.GetAccessorDeclaration|ts.SetAccessorDeclaration} _
     * @param {ts.GetAccessorDeclaration|ts.SetAccessorDeclaration} [node]
     */
    static access_meth_read( _, node = _ )
    {
        const r = Signature.meth_decl_read( _, node );
        r.type.isGetter = is( node ).a( SyntaxKind.GetAccessor );
        r.type.isSetter = is( node ).a( SyntaxKind.SetAccessor );

        return r;
    }

    /**
     * @param {?string|ts.ConstructorDeclaration|ts.ConstructSignatureDeclaration} _
     * @param {ts.ConstructorDeclaration|ts.ConstructSignatureDeclaration} [node]
     */
    static constr_read( _, node = _ )
    {
        const r = {
            name: CONSTRUCTOR,
            type: {
                parameters: null
            }
        };

        Signature.read( node, r );

        r.type.isConstructor = true;

        return r;
    }

    /**
     * @param {?string|ts.ArrowFunction} _
     * @param {ts.ArrowFunction} [node]
     */
    static arrow_read( _, node = _ )
    {
        const r = {
            name: ANONYMOUS,
            type: {
                parameters: null,
                type: null
            }
        };

        Signature.read( node, r );

        return r;
    }
}

declare_handler( Signature.func_decl_read, SyntaxKind.FunctionDeclaration, SyntaxKind.FunctionExpression );
declare_handler( Signature.meth_decl_read, SyntaxKind.MethodDeclaration, SyntaxKind.MethodSignature );
declare_handler( Signature.access_meth_read, SyntaxKind.GetAccessor, SyntaxKind.SetAccessor );
declare_handler( Signature.constr_read, SyntaxKind.ConstructSignature, SyntaxKind.Constructor );
declare_handler( Signature.arrow_read, SyntaxKind.ArrowFunction );

/**
 *
 */
export class Parameter extends NamedObject
{
    /**
     * @param {string} name
     * @param {object} type
     * @param {object} options
     */
    constructor( name, type, options )
    {
        super( name );
        this.name = name;
        this.type = type;
        this.isArray = options.isArray === true;
        this.rest = options.rest === true;
        this.optional = options.optional === true;
    }
}

export class FunctionType extends ObjectType
{
    constructor()
    {
        super();

        /** @type {Array<Signature>} */
        this.signatures = [];
    }
}
