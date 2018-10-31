/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/
"use strict";

import { Scope }                                                                       from "../scope";
import { SyntaxKind }                                                                  from "../ts-helpers";
import { $, add_to_list, ANONYMOUS, CALL, CONSTRUCTOR, FORMAL, safe, TYPE, type_creator } from "../utils";
import { binding_name, declare_handler, identifier, modify, property_name }            from "../ts-utils";
import { ObjectType }                                                                  from "./object-type";

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

    toString()
    {
        return this.signatures.map( s => `${s}` ).join( ';\n' ) + ';';
    }
}

function read_parameters( params )
{
    if ( !params || !params.length ) return null;

    return params.map( ( p, i ) => {
        const name = binding_name( p.name );
        /** @type {Type|NamedObject} */
        const type = type_creator( p.type, name );

        const binding = modify( p, { name, type, declaration: p, parameter: FORMAL, parameterIndex: i } );
        Scope.current.bind( binding );
    } );
}

function read_type_parameters( params )
{
    if ( !params || !params.length ) return null;

    return params.map( ( t, i ) => {
        const name = binding_name( t.name );

        /** @type {BindingInfo} */
        const binding = {
            name,
            type: t.constraint && type_creator( t.constraint, name ),
            declaration: t,
            parameter: TYPE,
            parameterIndex: i
        };

        Scope.current.bind( modify( t, binding ) );
    } );
}

/**
 */
export class SimpleFunction
{
    /**
     */
    constructor()
    {
        this.scope = Scope.current.add_inner();
        this.parameters = [];
        this.typeParameters = [];
        this.type = null;
        this.context = null;
    }
}

declare_handler( construct_signature_read, SyntaxKind.ConstructSignature );
declare_handler( call_signature_read, SyntaxKind.CallSignature );
declare_handler( method_signature_read, SyntaxKind.MethodSignature );
declare_handler( function_type_read, SyntaxKind.FunctionType );
declare_handler( constructor_type_read, SyntaxKind.ConstructorType );

function generic_read( node, fields, func = new SimpleFunction() )
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

    const func = generic_read( node, fields );
    // console.error( 'func reader:', $( {...parent, declaration: null}, 0 ) );
    parent.type.signatures.push( func );

    return parent;
}

function function_type_read( name, node )
{
    return func_reader( node, { parameters: true, typeParameters: true, type: true, name: ANONYMOUS, cname: 'functiontype' } );
}

function constructor_type_read( name, node )
{
    return func_reader( node, { parameters: true, typeParameters: true, name: CONSTRUCTOR, cname: 'constructortype' } );
}

function construct_signature_read( name, node )
{
    return func_reader( node, { parameters: true, typeParameters: true, name: CONSTRUCTOR } );
}

function call_signature_read( name, node )
{
    return func_reader( node, { parameters: true, typeParameters: true, type: true, name: CALL } );
}

function method_signature_read( name, node )
{
    return func_reader( node, { parameters: true, typeParameters: true, type: true, name: binding_name( node.name ), cname: 'method' } );
}