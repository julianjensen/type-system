/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/
"use strict";

import { Scope }                                                                                        from "../scope";
import { SyntaxKind }                                                                                   from "../ts-helpers";
import { add_to_list, ANONYMOUS, CALL, CONSTRUCTOR, safe, type_creator }                                from "../utils";
import { binding_name, declare_handler, read_parameters, read_type_parameters, stringify_type_parargs } from "../ts-utils";
import { ObjectType }                                                                                   from "./object-type";

/**
 * @extends Type
 * @extends ObjectType
 */
export class CallableType extends ObjectType
{
    /**
     * @param {string} name
     */
    constructor( name )
    {
        super( name );
        /** @type {Array<SimpleFunction>} */
        this.signatures = [];
    }

    /**
     * @return {string}
     */
    toString()
    {
        return this.signatures.map( s => `${s}` ).join( ';\n' ) + ';';
    }
}


/**
 */
export class SimpleFunction
{
    /**
     */
    constructor( parent )
    {
        this.parent = parent;
        this.scope = Scope.current.add_inner();
        this.parameters = [];
        this.typeParameters = [];
        this.type = null;
    }

    /**
     * @return {string}
     */
    toString()
    {
        const pp = _p => _p && _p.length ? `( ${_p.map( p => `${p}` )} )` : '()';

        return `${safe( this.parent.name )}${stringify_type_parargs( this.typeParameters )}${pp( this.parameters )}`;
    }
}

declare_handler( construct_signature_read, SyntaxKind.ConstructSignature, SyntaxKind.Constructor );
declare_handler( call_signature_read, SyntaxKind.CallSignature );
declare_handler( method_signature_read, SyntaxKind.MethodSignature );
declare_handler( function_type_read, SyntaxKind.FunctionType );
declare_handler( constructor_type_read, SyntaxKind.ConstructorType );

/**
 * @param {ts.FunctionLikeDeclaration|ts.SignatureDeclaration} node
 * @param {object} fields
 * @param {SimpleFunction} func
 * @return {SimpleFunction}
 */
function generic_read( node, fields, func )
{
    Scope.descend( func.scope );

    if ( fields.parameters )
        func.parameters = read_parameters( node.parameters );

    if ( fields.typeParameters )
        func.typeParameters = read_type_parameters( node.typeParameters );

    if ( fields.type )
        func.type = type_creator( node.type, fields.name );

    Scope.ascend();

    return func;
}

/**
 * @param {ts.FunctionLikeDeclaration|ts.SignatureDeclaration} node
 * @param {object} fields
 * @return {CallableType}
 */
function func_reader( node, fields )
{
    let parent = Scope.current.resolve( fields.name, true );

    if ( !parent )
    {
        parent = { name: fields.name, type: new CallableType( fields.cname || safe( fields.name ) ), declaration: node };
        Scope.current.bind( parent );
    }
    else
        parent.declaration = add_to_list( parent.declaration, node );

    const func = generic_read( node, fields, new SimpleFunction( parent ) );
    // console.error( 'func reader:', $( {...parent, declaration: null}, 0 ) );
    parent.type.signatures.push( func );

    return parent;
}

/**
 * @param {string} name
 * @param {ts.FunctionTypeNode} node
 * @return {CallableType}
 */
function function_type_read( name, node )
{
    return func_reader( node, { parameters: true, typeParameters: true, type: true, name: ANONYMOUS, cname: 'functiontype' } );
}

/**
 * @param {string} name
 * @param {ts.ConstructorDeclaration} node
 * @return {CallableType}
 */
function constructor_type_read( name, node )
{
    return func_reader( node, { parameters: true, typeParameters: true, name: CONSTRUCTOR, cname: 'constructortype' } );
}

/**
 * @param {string} name
 * @param {ts.ConstructSignatureDeclaration} node
 * @return {CallableType}
 */
function construct_signature_read( name, node )
{
    return func_reader( node, { parameters: true, typeParameters: true, name: CONSTRUCTOR } );
}

/**
 * @param {string} name
 * @param {ts.CallSignatureDeclaration} node
 * @return {CallableType}
 */
function call_signature_read( name, node )
{
    return func_reader( node, { parameters: true, typeParameters: true, type: true, name: CALL } );
}

/**
 * @param {string} name
 * @param {ts.MethodSignature|ts.MethodDeclaration} node
 * @return {CallableType}
 */
function method_signature_read( name, node )
{
    return func_reader( node, { parameters: true, typeParameters: true, type: true, name: binding_name( node.name ), cname: 'method' } );
}
