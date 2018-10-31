/* eslint-disable operator-linebreak */
/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/
"use strict";

import chalk                                                                                                   from "chalk";
import { Scope }                                                                                               from "./scope";
// import {
//     create_signature_in_function,
//     create_type_parameter,
//     create_type_parameters,
//     declare_var,
//     wrap_function
// }                                                                       from "./type-utils";
import { $, CALL, CONSTRUCTOR, italic, log, warn, type_creator, fatal, no_parent, debug_name, set_error_node } from "./utils";
import { TypeLiteral }                                                                                         from "./types/object-type";
import { ModuleType }                                                                                          from "./types/module";
import { ArrayType }                                                                                           from "./types/array";
import { Union }                                                                                               from "./types/union-intersection";
import { IndexedType, MappedType }                                                             from "./types/indexed-mapped";
import { LiteralType }                                                             from "./types/literal";
import { CallableType}                                                             from "./types/functions";
import { SyntaxKind }                                                              from "./ts-helpers";
import {
    modify, entity_name, handle_kind, handle_type, identifier, kind, pkind, property_name
}                                  from "./ts-utils";

const Namespace = ModuleType;


/**
 * @param {object} def
 * @param {string} [name]
 * @return {Type|TypeReference}
 */
export function create_type( def, name = 'anonymous' )
{
    if ( typeof def === 'string' )
    {
        log.type( `primitive "${def}" for "%s"`, name );
        log( "primitive resolution for name '%s' is %s", def, Scope.global.resolve( def ).type );
        return Scope.global.resolve( def ).type;
    }

    if ( !def )
        return null;

    set_error_node( def );
    debug_name( def );

    if ( typeof def.type === 'object' && def.type !== null && !Array.isArray( def.type ) )
        def = def.type;

    log.type( `"${def.kind ? kind( def.kind ) : def.type}" on -> [ "%s" ]`, Object.keys( def ).join( '", "' ) );

    switch ( def.kind || def.type )
    {
        case SyntaxKind.SourceFile:
            Scope.current = Scope.global;
            def.statements.forEach( declaration );
            return null;

        case SyntaxKind.ModuleBlock:
            def.statements.forEach( declaration );
            return null;

        case SyntaxKind.VariableStatement:
            // const declList = Array.isArray( def.declarationList ) ? def.declarationList : [ def.declarationList ];

            // if ( !Array.isArray( def.declarationList ) )
            //     console.error( $( no_parent( def ), 1 ) );
            return def.declarationList.declarations.map( declaration );

        case SyntaxKind.VariableDeclaration:
            return handle_type( def.kind, def.type );

        case SyntaxKind.StringKeyword:
            return Scope.global.resolve( 'string' );

        case SyntaxKind.NumberKeyword:
            return Scope.global.resolve( 'number' );

        case SyntaxKind.ConstructSignature:
        case SyntaxKind.ConstructorType:
        case SyntaxKind.Constructor:
        case SyntaxKind.MethodSignature:
        case SyntaxKind.MethodDeclaration:
        case SyntaxKind.FunctionDeclaration:
        case SyntaxKind.FunctionType:
        case SyntaxKind.FunctionExpression:
        case SyntaxKind.ArrowFunction:
            return handle_kind( def );

        // case 'function':
        //     return create_signature( def, name );

        case SyntaxKind.TypeReference:
            return handle_kind( def );
        // {
        //     const name = entity_name( def.typeName );
        //     const resd = Scope.current.resolve( name );
        //
        //     if ( !def.typeArguments || !def.typeArguments.length )
        //         return resd || new TypeReference( name );
        //
        //     const type = new TypeReference( name );
        //     if ( resd ) type.resolve( resd );
        //     type.typeArguments = def.typeArguments.map( create_type );
        //
        //     return type;
        // }

        // case 'reference':
        //     const resd = typeof def.typeName === 'string' && Scope.current.resolve( def.typeName );
        //
        //     if ( resd && resd.type && resd.type.isPrimitive ) return resd;
        //
        //     const r = resd && resd.type || new TypeReference( def.typeName );
        //
        //     if ( !def.typeArguments || !def.typeArguments.length ) return r;
        //
        //     r.typeArguments = [ ...def.typeArguments.map( create_type ) ];
        //
        //     return r;

        case SyntaxKind.LiteralType:
            return new LiteralType( def.literal.text, def.literal.kind );

        case SyntaxKind.TypeLiteral:
            const tl = new TypeLiteral();

            Scope.descend( tl.scope );
            def.members.forEach( declaration );
            if ( def.typeParameters )
                tl.typeParameters = def.typeParameters.map( create_type );
            // create_type_parameters( def.typeParameters );
            Scope.ascend();

            return tl;

        case SyntaxKind.MappedType:
            const mapped = new MappedType( name );
            const { type, typeParameter } = def;

            Scope.descend( mapped.scope );
            mapped.from = create_type( typeParameter ); // create_type_parameter( typeParameter, 0 );
            mapped.to = create_type( type );
            Scope.ascend();

            return mapped;

        case SyntaxKind.IndexedType:
        {
            const indexed = new IndexedType( name );
            const { objectType, indexType } = def;

            Scope.descend( indexed.scope );
            indexed.objectType = create_type( objectType, objectType.typeName );
            indexed.indexType = create_type( indexType, indexType.typeName );
            Scope.ascend();

            return indexed;
        }

        case SyntaxKind.UnionType:
            const u = new Union( name );

            def.types.forEach( t => u.add( create_type( t ) ) );

            return u;

        case SyntaxKind.TypeParameter:
            return handle_type( def.kind, def );

        case SyntaxKind.PropertySignature:
        case SyntaxKind.PropertyDeclaration:
        {
            const name = property_name( def.name );

            console.error( `prop sig "${name}", kind: ${pkind( def )}, type: ${pkind( def.type )}` );
            const type = { type: create_type( def.type, name ), name, declaration: def };
            Scope.current.bind( type );
            return type;
        }


        case SyntaxKind.ArrayType:
            const at = new ArrayType( name );

            at.elementType = create_type( def.elementType );

            return at;

        default:
            warn( 'fail on type:', def.type );
    }
}

// /**
//  * @param {object} def
//  * @param {string} [name]
//  * @return {Signature}
//  */
// function create_signature( def, name = 'anonymous' )
// {
//     const sig = new Signature( chalk.italic( name ) );
//
//     Scope.descend( sig.scope );
//
//     def = def.definition || def;
//
//     let pIndex = 0;
//
//     sig.parameters = def.parameters ? def.parameters.map( p => {
//         let param = create_type( p.type, p.name );
//
//         if ( !pIndex && p.name === 'this' )
//             sig.context = param;
//         else
//         {
//             if ( param instanceof Signature )
//                 param = wrap_function( p.name, param );
//             Scope.current.bind( { name: p.name, type: param, parameter: pIndex, declaration: p } );
//             param.parameterIndex( pIndex++ );
//         }
//     } ) : [];
//
//     sig.type = create_type( def.returns );
//
//     create_type_parameters( def.typeParameters );
//
//     Scope.ascend();
//
//     return sig;
// }
//
// function handle_function_like( node )
// {
//     const type = handle_type( node.kind, node );
//     let prior = Scope.current.resolve( type.name );
//
//     if ( !prior )
//         prior = new ObjectType( type.name );
//
//     prior.signatures.push( type.type );
//
//     Scope.current.bind( type );
//
//     return type;
// }

/**
 * @typedef {object} DeclarationInfo
 * @property {string} [name]
 * @property {Type|*} type
 * @property {ts.Node} [declaration]
 */

/**
 * @param {ts.Node|ts.VariableStatement} node
 * @return {DeclarationInfo|Array<DeclarationInfo>}
 */
export function declaration( node )
{
    return create_type( node );
    // let type;
    // let kind = typeof node.kind === 'number' ? SyntaxKind[ node.kind ] : node.kind;
    //
    // switch ( kind )
    // {
    //     case 'SourceFile':
    //         Scope.current = Scope.global;
    //         node.statements.forEach( declaration );
    //         return null;
    //
    //     case 'ModuleBlock':
    //         node.statements.forEach( declaration );
    //         return null;
    //
    //     case 'VariableStatement':
    //         return node.declarationList.map( declaration );
    //
    //     case 'VariableDeclaration':
    //         return handle_type( node.kind, node.type );
    //
    //     case 'MethodDeclaration':
    //     case 'FunctionDeclaration':
    //     case 'MethodSignature':
    //     case 'FunctionType':
    //         return handle_function_like( node );
    //
    //     case 'TypeParameter':
    //         return handle_type( node.kind, node );
    //
    //     case 'PropertySignature':
    //     case 'PropertyDeclaration':
    //     {
    //         const name = property_name( node.name );
    //
    //         console.error( `prop sig "${name}", kind: ${pkind( node )}, type: ${pkind( node.type )}` );
    //         type = { type: create_type( node.type, name ), name, declaration: node };
    //         Scope.current.bind( type );
    //         return type;
    //     }
    //
    //     // case 'ModuleDeclaration':
    //     //     const ns = new Namespace( node.name );
    //     //     handle_scoped_thing_with_members( ns, node, node.name );
    //     //     return { type: ns, name: node.name, declaration: node };
    //
    //     case 'ModuleDeclaration':
    //     case 'ClassDeclaration':
    //     case 'InterfaceDeclaration':
    //         return handle_kind( node.kind, node.name, node );
    //     // const o = new ObjectType();
    //     // handle_scoped_thing_with_members( o , node, node.name );
    //     // return { type: o, name: node.name, declaration: node };
    //
    //     case 'TypeAliasDeclaration':
    //     {
    //         const name = identifier( node.name );
    //         type = create_type( node.type, name );
    //         type = { type, name, declaration: node };
    //         Scope.current.bind( type );
    //         return type;
    //     }
    //
    //     default:
    //         fatal( `Not handling ${node.kind} (${SyntaxKind[ node.kind ]})` );
    //
    // }
}

/**
 * @param {string} name
 * @param {object} decl
 * @param {object} [opts={}]
 * @return {Type}
 */
// export function _declaration( name, decl, opts = {} )
// {
//     let tpCount;
//
//     switch ( decl.kind )
//     {
//         case 'VariableDeclaration':
//             log.var( `"%s" of type "${decl.type.type}"`, name );
//             return declare_var( name, decl.type );
//
//         case 'FunctionDeclaration':
//             log.function( name );
//             return create_signature_in_function( name, decl );
//
//         case 'MethodSignature':
//             log.signature( name );
//             return create_signature_in_function( name, decl );
//
//         case 'CallSignature':
//             log.signature( name );
//             return create_signature_in_function( name, decl );
//
//         case 'PropertySignature':
//             log.prop( decl.propKey );
//             return declare_var( decl.propKey, decl.typeName );
//
//         case 'TypeAliasDeclaration':
//             log.alias( name );
//             const aref = new TypeReference( name );
//             const reftype = create_type( decl.type, name );
//             reftype.__name = name;
//             aref.resolve( reftype );
//             Scope.current.bind( { name, type: aref, declaration: decl } );
//
//             Scope.descend( reftype.scope );
//             create_type_parameters( decl.typeParameters );
//             Scope.ascend();
//
//             return aref;
//
//         case 'ClassDeclaration':
//         case 'InterfaceDeclaration':
//             const actual = decl.kind === 'ClassDeclaration' ? 'class' : 'interface';
//
//             const intr = new ObjectType( italic`${actual}` );
//
//             tpCount = 0;
//
//             if ( actual === 'class' )
//                 intr.isClass = true;
//             else
//                 intr.isInterface = true;
//
//             Scope.current.bind( { name, type: intr, declaration: decl } );
//             intr.__name = name;
//
//             Scope.descend( intr.scope );
//
//             const callSym = actual === 'class' ? CONSTRUCTOR : CALL;
//
//             decl.members.forEach( def => {
//                 def.decls.forEach( d => {
//                     const _opts = { typeParameterCount: tpCount };
//                     declaration( def.name === 'Call' && d.kind === 'CallSignature' ? callSym : def.name, d, _opts );
//                     tpCount = _opts.typeParameterCount;
//                 } );
//             } );
//
//
//             Scope.ascend();
//             return intr;
//
//         case 'TypeParameter':
//             return create_type_parameters( Object.assign( decl, { name } ), opts.typeParameterCount++ );
//
//         default:
//             warn( 'Cannot do:', decl.kind );
//             break;
//     }
// }

type_creator( create_type );
