/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/




"use strict";
import { Signature }                                             from "./type-function";
import chalk                                                     from "chalk";
import { Scope }                                                 from "./scope";
import {
    create_signature_in_function,
    create_type_parameter,
    create_type_parameters,
    declare_var,
    wrap_function
}                                                                from "./type-utils";
import { $, CALL, CONSTRUCTOR, italic, log, warn, type_creator } from "./utils";
import { TypeReference }                                         from "./type-reference";
import { ObjectType }                                            from "./instance";
import { ArrayType, IndexedType, MappedType, Union }             from "./classes";
import { SyntaxKind }                                            from "./ts-helpers";
import { handle_kind, handle_type, property_name }               from "./ts-utils";

/**
 * @param {object} def
 * @param {string} [name]
 * @return {Type}
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

    if ( typeof def.type === 'object' && def.type !== null && !Array.isArray( def.type ) )
        def = def.type;

    log.type( `"${def.type || def.kind}" on -> [ "%s" ]`, Object.keys( def ).join( '", "' ) );

    switch ( def.type )
    {
        case 'function':
            return create_signature( def, name );

        case 'reference':
            const resd = typeof def.typeName === 'string' && Scope.current.resolve( def.typeName );

            if ( resd && resd.type && resd.type.isPrimitive ) return resd.type;

            const r = resd && resd.type || new TypeReference( def.typeName );

            if ( !def.typeArguments || !def.typeArguments.length ) return r;

            r.typeArguments = [ ...def.typeArguments.map( create_type ) ];

            return r;

        case 'typeliteral':
            const tl = new ObjectType( italic`literal` );
            const do_decl = d => declaration( tl.name, d );

            Scope.descend( tl.scope );
            def.members.forEach( do_decl );
            create_type_parameters( def.typeParameters );
            Scope.ascend();

            return tl;

        case 'mapped':
            const mapped = new MappedType( name );
            const { type, typeParameter } = def.definition;

            Scope.descend( mapped.scope );
            mapped.from = create_type_parameter( typeParameter, 0 );
            mapped.to = create_type( type );
            Scope.ascend();

            return mapped;

        case 'indexed':
        {
            const indexed = new IndexedType( name );
            const { objectType, indexType } = def;

            Scope.descend( indexed.scope );
            indexed.objectType = create_type( objectType, objectType.typeName );
            indexed.indexType = create_type( indexType, indexType.typeName );
            Scope.ascend();

            return indexed;
        }

        case 'union':
            const u = new Union( name );

            def.types.forEach( t => u.add( create_type( t ) ) );

            return u;

        case 'array':
            const at = new ArrayType( name );

            at.elementType = create_type( def.elementType );

            return at;

        default:
            warn( 'fail on type:', def.type );
    }
}

/**
 * @param {object} def
 * @param {string} [name]
 * @return {Signature}
 */
function create_signature( def, name = 'anonymous' )
{
    const sig = new Signature( chalk.italic( name ) );

    Scope.descend( sig.scope );

    def = def.definition || def;

    let pIndex = 0;

    sig.parameters = def.parameters ? def.parameters.map( p => {
        let param = create_type( p.type, p.name );

        if ( !pIndex && p.name === 'this' )
            sig.context = param;
        else
        {
            if ( param instanceof Signature )
                param = wrap_function( p.name, param );
            Scope.current.bind( { name: p.name, type: param, parameter: pIndex, declaration: p } );
            param.parameterIndex( pIndex++ );
        }
    } ) : [];

    sig.type = create_type( def.returns );

    create_type_parameters( def.typeParameters );

    Scope.ascend();

    return sig;
}

function handle_function_like( node, scope )
{
    const type = handle_type( node.kind, node );
    let prior = scope.resolve( type.name );

    if ( !prior )
        prior = new ObjectType( type.name );

    prior.signatures.push( type.type );

    scope.bind( type );

    return type;
}

/**
 * @typedef {object} DeclarationInfo
 * @property {string} [name]
 * @property {Type} type
 * @property {ts.Node} [declaration]
 */
/**
 * @param {ts.Node} node
 * @param {Scope} scope
 * @return {DeclarationInfo|Array<DeclarationInfo>}
 */
export function declare_types( node, scope = Scope.global )
{
    let type;

    switch ( node.kind )
    {
        case SyntaxKind.VariableStatement:
            return node.declarationList.map( declare_types );

        case SyntaxKind.VariableDeclaration:
            return handle_type( node.kind, node.type );

        case SyntaxKind.MethodDeclaration:
        case SyntaxKind.FunctionDeclaration:
        case SyntaxKind.MethodSignature:
        case SyntaxKind.FunctionType:
            return handle_function_like( node, scope );

        case SyntaxKind.TypeParameter:
            return handle_type( node.kind, node );

        case SyntaxKind.PropertySignature:
        case SyntaxKind.PropertyDeclaration:
            const name = property_name( node.name );

            type = { type: create_type( node.type, name ), name, declaration: node };
            scope.bind( type );
            return type;

    }
}

/**
 * @param {string} name
 * @param {object} decl
 * @param {object} [opts={}]
 * @return {Type}
 */
export function declaration( name, decl, opts = {} )
{
    let tpCount;

    switch ( decl.kind )
    {
        case 'VariableDeclaration':
            log.var( `"%s" of type "${decl.type.type}"`, name );
            return declare_var( name, decl.type );

        case 'FunctionDeclaration':
            log.function( name );
            return create_signature_in_function( name, decl );

        case 'MethodSignature':
            log.signature( name );
            return create_signature_in_function( name, decl );

        case 'CallSignature':
            log.signature( name );
            return create_signature_in_function( name, decl );

        case 'PropertySignature':
            log.prop( decl.propKey );
            return declare_var( decl.propKey, decl.typeName );

        case 'TypeAliasDeclaration':
            log.alias( name );
            const aref = new TypeReference( name );
            const reftype = create_type( decl.type, name );
            reftype.__name = name;
            aref.resolve( reftype );
            Scope.current.bind( { name, type: aref, declaration: decl } );

            Scope.descend( reftype.scope );
            create_type_parameters( decl.typeParameters );
            Scope.ascend();

            return aref;

        case 'ClassDeclaration':
        case 'InterfaceDeclaration':
            const actual = decl.kind === 'ClassDeclaration' ? 'class' : 'interface';

            const intr = new ObjectType( italic`${actual}` );

            tpCount = 0;

            if ( actual === 'class' )
                intr.isClass = true;
            else
                intr.isInterface = true;

            Scope.current.bind( { name, type: intr, declaration: decl } );
            intr.__name = name;

            Scope.descend( intr.scope );

            const callSym = actual === 'class' ? CONSTRUCTOR : CALL;

            decl.members.forEach( def => {
                def.decls.forEach( d => {
                    const _opts = { typeParameterCount: tpCount };
                    declaration( def.name === 'Call' && d.kind === 'CallSignature' ? callSym : def.name, d, _opts );
                    tpCount = _opts.typeParameterCount;
                } );
            } );


            Scope.ascend();
            return intr;

        case 'TypeParameter':
            return create_type_parameters( Object.assign( decl, { name } ), opts.typeParameterCount++ );

        default:
            warn( 'Cannot do:', decl.kind );
            break;
    }
}

type_creator( create_type );
