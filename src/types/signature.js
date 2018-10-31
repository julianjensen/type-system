/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/
"use strict";

import { Type }            from "./base-type";
import {
    CONSTRUCTOR,
    CALL,
    type_creator
}            from "../utils";
import { Scope }           from "../scope";
import {
    declare_handler,
    property_name,
    identifier,
    modify
} from "../ts-utils";
import { SyntaxKind }      from "../ts-helpers";

/**
 * @extends Type
 */
export class Signature extends Type
{
    /**
     * @param {?string} [override]
     */
    constructor( override )
    {
        super( override || 'signature', true );
        this.isSignature = true;
        this.parameters = [];
        this.typeParameters = [];
        this.type = null;
        this.context = null;
        this.accessor = null;   // "get", "set", or undefined for methods only
    }
}

/**
 * @extends Signature
 */
export class ConstructorType extends Signature
{
    /** */
    constructor()
    {
        super( 'constructor' );
        this.isConstructor = true;
    }
}

/**
 * @extends Signature
 */
export class CallableType extends Signature
{
    /** */
    constructor()
    {
        super( 'callable' );
        this.isCallable = true;
    }
}

/**
 * @extends Signature
 */
export class MethodType extends Signature
{
    /** */
    constructor()
    {
        super( 'method' );
        this.isMethod = true;
    }
}

/**
 * @extends Signature
 */
export class ArrowFunctionType extends Signature
{
    /** */
    constructor()
    {
        super( 'arrow' );
    }
}

/**
 * @extends Type
 */
export class FunctionType extends Type
{
    /** */
    constructor()
    {
        super( 'function' );
        this.signatures = [];
    }

    /**
     * @param {ConstructorType|CallableType|MethodType|ArrowFunctionType} signature
     */
    add( signature )
    {
        this.signatures.push( signature );
    }

    get( ...paramTypes )
    {

    }

    has( ...paramTypes )
    {

    }
}

/**
 * @param {object} def
 * @param {string} [name]
 * @return {Signature}
 */
function new_signature( def )
{
    let sig;
    let fname;
    const params = def.parameters && def.parameters.length && def.parameters;
    const typeParams = def.typeParameters && def.typeParameters.length && def.typeParameters;

    switch ( def.kind )
    {
        case SyntaxKind.ConstructSignature:
        case SyntaxKind.ConstructorType:
        case SyntaxKind.Constructor:
            sig = new ConstructorType();
            fname = CONSTRUCTOR;
            break;

        case SyntaxKind.CallSignature:
            sig = new CallableType();
            fname = CALL;
            break;

        case SyntaxKind.MethodSignature:
        case SyntaxKind.MethodDeclaration:
            sig = new MethodType();
            fname = property_name( def.name );
            break;

        case SyntaxKind.FunctionDeclaration:
        case SyntaxKind.FunctionType:
            sig = new CallableType();
            break;

        case SyntaxKind.CallExpression:
        case SyntaxKind.FunctionExpression:
            sig = new CallableType();
            fname = 'func_expr_anon_' + def.pos;
            break;

        case SyntaxKind.ArrowFunction:
            sig = new ArrowFunctionType();
            fname = 'arrow_func_' + def.pos;
            break;
    }

    Scope.descend( sig.scope );

    if ( params )
    {
        const firstName = params && identifier( params[ 0 ].name );
        const [ context, _p ] = firstName === 'this' ? [ params[ 0 ], params.slice( 1 ) ] : [ , params ];

        if ( context ) sig.context = type_creator( context.type, firstName );

        sig.parameters = _p.map( ( p, i ) => {
            const pname = identifier( p.name );
            const ptype = modify( p, type_creator( p.type, pname ) );
            const binding = { type: ptype, name: pname, declaration: p, parameter: 'formal', parameterIndex: i };
            Scope.current.bind( binding );
        } );
    }

    if ( typeParams )
    {
        sig.typeParameters = typeParams.map( ( p, i ) => {
            const pname = identifier( p.name );
            const ptype = modify( p, type_creator( p.type, pname ) );
            const binding = { type: ptype, name: pname, declaration: p, parameter: 'type', parameterIndex: i };
            Scope.current.bind( binding );
        } );

    }

    if ( def.type )
        sig.type = type_creator( def.type );

    Scope.ascend();

    const wrapper = Scope.current.resolve( fname ) || Scope.current.bind( { name: fname, type: new FunctionType(), declaration: def } );
    wrapper.type.add( sig );
    return wrapper;
}

declare_handler( new_signature, ...[
    SyntaxKind.ConstructSignature, SyntaxKind.ConstructorType, SyntaxKind.Constructor,
    SyntaxKind.MethodDeclaration, SyntaxKind.MethodSignature,
    SyntaxKind.FunctionExpression, SyntaxKind.FunctionType, SyntaxKind.FunctionDeclaration,
    SyntaxKind.ArrowFunction,
    SyntaxKind.CallSignature, SyntaxKind.CallExpression
] );

// declare_handler( Signature.func_decl_read, SyntaxKind.FunctionDeclaration, SyntaxKind.FunctionExpression );
// declare_handler( Signature.meth_decl_read, SyntaxKind.MethodDeclaration, SyntaxKind.MethodSignature );
// declare_handler( Signature.access_meth_read, SyntaxKind.GetAccessor, SyntaxKind.SetAccessor );
// declare_handler( Signature.constr_read, SyntaxKind.ConstructSignature, SyntaxKind.Constructor );
// declare_handler( Signature.arrow_read, SyntaxKind.ArrowFunction );


