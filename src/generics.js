/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/

"use strict";

import { default as fsWithCallbacks }                             from "fs";
import { fatal, warn }                                            from "./utils";
import { Scope }                                                  from "./scope";
import { TypeReference }                                          from "./type-reference";
import { AnyType, BooleanType, NumberType, StringType, VoidType } from "./classes";
import { DEBUG }                                                  from "./constants";
import { declaration }                                            from "./create-type";

const fs = fsWithCallbacks.promises;



// /**
//  * @param {string} name
//  * @param {object} type
//  * @param {...object} typeParameters
//  */
// function create_generic( name, type, ...typeParameters )
// {
//     type.genericType();
//     Scope.current.add( name, type );
//     const genericScope = Scope.current.add_inner().set_owner( type );
//
//     typeParameters.forEach( tp => genericScope.add( tp.name, new TypeReference( tp.name ).genericType() ) );
// }
//
// function create_type_from_generic( name, prev, ...typeArgs )
// {
//     const type = new TypeReference( name ).resolve( prev );
//     Scope.current.add( name, type );
//     const genericScope = Scope.current.add_inner().set_owner( type );
//
//     const isStillGeneric = typeArgs.some( ta => Scope.current.resolve( ta.name ).isGenericType );
//
//     type.genericType( isStillGeneric );
//
//     typeArgs.forEach( tp => genericScope.add( tp.name, new TypeReference( tp.name ) ) );
// }
//
// Scope.global.add( 'Number', { name: 'Number', toString() { return 'Number'; } } );
// Scope.global.add( 'String', { name: 'String', toString() { return 'String'; } } );
//
// const func = new TypeReference( 'funcType' );
// const derived = new TypeReference( 'derivedType' );
//
// create_generic( 'func', func, { name: 'S' }, { name: 'T' } );
// create_generic( 'derived', derived, { name: 'S' } );
//
// Scope.descend( derived.scope );
// create_type_from_generic( "func'", func, { name: 'S' }, { name: 'Number' } );
//
// Scope.ascend();
//
// create_type_from_generic( "derived'", derived, { name: 'String' } );
//
// // const output = derived.scope.resolve( "func'" );
// // console.log( `func' -> ${output.scope}` );
// // console.log( `S -> ${output.resolve( 'S' )}` );
//
// console.log( `${Scope.global.stringify()}` );
// console.log( JSON.stringify( Scope.global, null, 4 ) );
//
// /**
//  * ### Create new template type
//  * As normal type, just record type parameters
//  * Mark as template
//  *
//  * ### Using a template type
//  * Resolve using type arguments and default formal parameter values
//  * 1. Is every parameter resolved with non-template types?
//  *    Yes -> Go to create_new_type_from_template
//  * 2. Are some parameters missing?
//  *    Yes -> Go to create_new_type_from_template_with_insufficient_arguments
//  * 3. Are any arguments type parameter references?
//  *    Yes -> Go to n
//  *    1. Create a type instance name equals to TYPENAME + TYPE-ALIAS-TARGET-NAMES-JOINED
//  *    2. Check if type already exists
//  *    3. If not, create new reference to actual type
//  *    3. Create a type alias for each type parameter, aliased to argument
//  *    4. Create a scope for the type holding the type aliases
//  */
// /**
//  * Create a reference to a fully instantiated tempate type.
//  *
//  * @param templateType
//  * @param typeArguments
//  * @return {*}
//  */
// function create_new_type_from_template( templateType, typeArguments )
// {
//     const newTypeName = create_name( templateType.name, typeArguments.map( ( { name } ) => name ).join( '-' ) );
//
//     if ( Scope.current.has( newTypeName ) ) return Scope.current.get( newTypeName );
//
//     const newType = templateType.copy( newTypeName );
//     const typeScope = Scope.current.add_inner().set_owner( newType );
//
//     templateType.typeParameters.forEach( ( { name }, i ) => typeScope.add( name, typeArguments[ i ] ) );
//
//     return new TypeReference( newType );
// }
//
// function create_new_type_from_template_with_insufficient_arguments( templateType, typeArguments )
// {
//     for ( let n = typeArguments.length; n < templateType.typeParameters.length; n++ )
//     {
//         const typeParam = templateType.typeParameters[ n ];
//
//         if ( typeParam.defaultValue )
//             typeArguments.push( typeParam.defaultValue );
//         else if ( typeParam.isActualType )
//             typeArguments.push( typeParam );
//         else
//             throw new Error( `Missing type parameter for ${typeParam.name}` );
//     }
//
//     return create_new_type_from_template( templateType, typeArguments );
// }
//
// function create_new_template_from_template( templateType, typeArguments )
// {
//     const newTypeName = create_name( templateType.name, typeArguments.map( ( { name } ) => name ).join( '-' ) );
//
//     if ( Scope.current.has( newTypeName ) ) return Scope.current.get( newTypeName );
//
//     const newType = templateType.copy( newTypeName );
//     const typeScope = Scope.current.add_inner().set_owner( newType );
//
//     templateType.typeParameters.forEach( ( { name }, i ) => typeScope.add( name, typeArguments[ i ] ) );
//
//     return new TypeReference( newType );
// }

/**
 * == Type References
 *
 * * Name -  The name of the reference
 * * TargetName - The name of the type it's pointing to.
 *
 * Resolution
 * 1. Let `unresolved` equal the number of unresolved references
 * 2. Let `previous` equal `unresolved`
 * 3. For each type reference, attempt to resolve the type, decrement `unresolved` if successful
 * 4. If `unresolved` equals `previous` go to 6
 * 5. Go to 2
 * 6. If `unresolved` is not zero, throw error and list unresiolved symbols.
 *
 * == Type Alias
 * * Name - The name of the alias
 * * Type - The type class, maybe anonymous, maybe `null` for template type parameters
 *
 * So, a template argument is
 * 1. An actual type (i.e. class describing the type). The type can be directly substituted in place of the reference
 * 2. Another reference. The TargetType can substituted if the TargetType has been resolved
 *
 */


/**
 * provided = type parameters slice(0, length provided)
 * missing = type parameters slice(length provided, number of type parameters)
 * for every type parameter missing
 *
 * if type param exists as formal parameters
 * collect all types in B's place
 * discard unknowns
 * if none left
 * check_default
 * if more than one type
 * error
 * type -> single type left
 * continue
 *
 * check_default:
 * if default exists
 * type -> default
 * continue
 * else error
 *
 * if all are resolved
 * if none are type parameters
 * define new reference to template with all type parameters resolved
 * else
 * define new template with
 *
 *
 * abc<S, T> => TEMPLATE abc<S, T> SCOPE: [], name: abc-$$$-$$$
 * abc<U, number> => TEMPLATE abc<S, number> SCOPE: [T = number], name: abc-$$$-number
 * SCOPE: U = string
 * TYPE: abc<string, number>, SCOPE: [S = string, T = number], name: abc-string-number
 *
 * @param refName
 * @param typeArgs
 */
function create_or_instantiate_template( refName, typeArgs )
{
    const template = Scope.current.resolve( refName );
    const argsNeeded = template.typeParameters.length;
    const resolved = typeArgs.map( typeName => Scope.current.resolve( typeName ) );
    const allResolved = resolved.every( t => t && t.isResolved );

    if ( allResolved && resolved.length === argsNeeded )
        return template.instantiate( resolved );
    else if ( template.type.isFunction )
    {
        for ( let n = resolved.length; n < argsNeeded; ++n )
        {
            const tp = template.typeParameters[ n ];
            const tpName = tp.name;
            const paramTypes = new Set( tp.parameters.filter( ( { type } ) => type.isReference && type.name === tpName ).map( ( { type } ) => type ) );
            const deduced = paramTypes.size === 1 ? [ ...paramTypes ][ 0 ] : tp.defaultType;

            if ( !deduced )
                throw new ReferenceError( `Unable to deduce type of "${tpName}"` );

            resolved.push( deduced );
        }
    }
    else
        throw new ReferenceError( `Incorrect number of type arguments, got ${typeArgs.length}, needed ${template.typeParameters.length}` );

    return template.instantiate( resolved );
}

let TemplateType;

const ITemplateType = superclass => TemplateType = class TemplateType extends superclass
{

    constructor( ...args )
    {
        super( ...args );
        this.typeParameters = [];
        this.isTemplate = true;
    }

    instantiate( types )
    {
        const ref = new TypeReference( this.name );
        ref.resolve( this.type );
        ref.scope = Scope.current.add_inner( ref );

        types.forEach( ( t, i ) => ref.scope.add( this.typeParameters[ i ].name, t ) );

        return ref;
    }
};

// declare_var( testDef.name, testDef.decls[ 0 ].type );

