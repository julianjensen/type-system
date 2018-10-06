/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/

"use strict";

import { Scope }                         from "./scope";
import { isObject, isString, log, safe } from "./utils";
import { ObjectType }                    from "./instance";
import { TypeParameter }                 from "./type-params-args";

let create_type;

/**
 * @param {?object} type
 * @return {?object}
 */
function dig_for_type( type )
{
    if ( !type ) return void 0;

    if ( !isObject( type ) ) return type;

    if ( isString( type.type ) ) return type;

    if ( isObject( type.type ) ) return dig_for_type( type.type );

    return type;
}

/**
 * @param {object} node
 * @param {number} index
 * @return {TypeParameter}
 */
export function create_type_parameter( node, index )
{
    const
        {
            name,
            default: defaultType,
            constraint,
            keyOf = constraint ? constraint.keyOf : false
        }           = node,
        _constraint = dig_for_type( constraint ),
        t           = new TypeParameter( name, {
            constraint:  _constraint && create_type( _constraint, name ),
            defaultType: defaultType && create_type( defaultType, name ),
            isKeyOf:     !!keyOf
        } );

    Scope.current.bind( { name, type: t, parameter: index, declaration: node } );

    t.typeParameterIndex( index );

    return t;
}

/**
 * @param {?(object|Array<object>)}typeParameters
 * @param {number} [index]
 * @return {?(TypeParameter|Array<TypeParameter>)}
 */
export function create_type_parameters( typeParameters, index )
{
    if ( !typeParameters ) return;

    if ( !Array.isArray( typeParameters ) ) return create_type_parameter( typeParameters, index );

    return typeParameters.map( create_type_parameter );
}

/**
 * @param {string} name
 * @param {Signature} sig
 * @param {object} decl
 * @return {ObjectType|FunctionType}
 */
export function wrap_function( name, sig, decl )
{
    log.signature( "Wrapping '%s' inside function", safe( name ) );
    let func = Scope.current.resolve( name );

    if ( !func )
    {
        func = new ObjectType( name );
        func.signatures.push( sig );
        Scope.current.bind( { name, type: func, declaration: decl } );
    }
    else
    {
        func.type.signatures.push( sig );
        log.signature( "Adding extra overloasded signature tp '%s'", name );
    }

    return func;
}

/**
 * @param {string} name
 * @param {object} decl
 * @return {ObjectType|FunctionType}
 */
export function create_signature_in_function( name, decl )
{
    const sig = create_type( decl, name );

    return wrap_function( name, sig, decl );
}

/**
 *
 * @param {string} name
 * @param {object} def
 * @return {Type}
 */
export function declare_var( name, def )
{
    if ( def && def.decl ) log( def.decl );

    const type = create_type( def, name );

    if ( type.isSignature )
    {
        const f = new ObjectType( name );
        f.signatures.push( type );
        Scope.current.bind( { name, type, declaration: def } );
    }
    else
        Scope.current.bind( { name, type, declaration: def } );

    return type;
}

export function init( _create_type )
{
    create_type = _create_type;
}
