/* eslint-disable operator-linebreak */
/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/
"use strict";

import { mix }                                                             from "mixwith";
import { Type }                                                            from "./types/base-type";
import { INamedObject }                                                    from "./named-object";
import { italic, safe, type_creator }                                      from "./utils";
import { Scope }                                                           from "./scope";
import { binding_name, declare_handler, handle_kind, modify, module_name } from "./ts-utils";
import { SyntaxKind }                                                      from "./ts-helpers";
import { Signature }                                                       from "./type-function";
import { declaration }                                                     from "./create-type";

/**
 *
 */
export class ObjectType extends mix( Type ).with( INamedObject )
{
    constructor( name = italic`anonymous` )
    {
        super( 'object-type' );
        this.___name = name;
        this.scope = Scope.current.add_inner( this );
        this.signatures = [];
    }

    get __name()
    {
        if ( this.isCall )
            return this.scope.outer.owner.__name;
        else if ( this.isFunction )
            return 'function' + ( this.boundTo ? ' ' + safe( this.boundTo ) : '' );
        else if ( this.isInterface )
            return 'interface' + ( this.boundTo ? ' ' + safe( this.boundTo ) : '' );
        else if ( this.boundTo && this.___name )
            return `[${this.___name}]`;

        return this.___name;
    }

    set __name( n )
    {
        this.___name = n;
    }

    get isFunction()
    {
        return !!this.signatures && !!this.signatures.length;
        // return !!this.scope.find( ( name, type ) => type.isCall, true );
    }

    set isFunction( v ) {}

    /**
     * @param {?string|ts.InterfaceDeclaration|ts.ClassDeclaration} _
     * @param {ts.InterfaceDeclaration|ts.ClassDeclaration} [node]
     */
    static read( _, node = _ )
    {
        const actual = node.kind === SyntaxKind.ClassDeclaration ? 'class' :
                       node.kind === SyntaxKind.InterfaceDeclaration ? 'interface' :
                       'unknown';

        const o = new ObjectType( italic`${actual}` );
        const name = binding_name( node.name );
        o.___name = name;

        if ( actual === 'class' )
            o.isClass = true;
        else if ( actual === 'interface' )
            o.isInterface = true;

        Scope.descend( o.scope );

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
            node.typeParameters.map( declaration ).forEach( ( t, i ) => {
                t.type.parameterIndex( i );
                modify( t.declaration, t.type );
            } );
        }

        node.members.forEach( declaration );

        Scope.ascend();

        return { type: o, name, declaration: node };
    }
}

/** */
export class Namespace extends ObjectType
{
    constructor( name = italic`namespace` )
    {
        super( 'namespace' );
        this.___name = name;
        this.isNamespace = true;
        this.isModule = true;
    }

    /**
     * @param {?string|ts.ModuleDeclaration} _
     * @param {ts.ModuleDeclaration} [node]
     */
    static read( _, node = _ )
    {
        const name = module_name( node.name );
        const o = new ObjectType( name );

        Scope.descend( o.scope );

        declaration( node.body );

        Scope.ascend();

        const bindType = { type: o, name, declaration: node };

        Scope.current.bind( bindType );

        return bindType;
    }

    get isFunction()
    {
        return false;
    }

    set isFunction( v )
    {
        throw new Error( "Cannot make a namespace into a function" );
    }
}

declare_handler( ObjectType.read, SyntaxKind.InterfaceDeclaration, SyntaxKind.ClassDeclaration );
declare_handler( Namespace.read, SyntaxKind.ModuleDeclaration );
