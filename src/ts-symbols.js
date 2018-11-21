/* eslint-disable operator-linebreak */
/** ******************************************************************************************************************
 * @file Describe what ts-symbols does.
 * @author Julian Jensen <jjdanois@gmail.com>
 * @since 1.0.0
 * @date 17-Mar-2018
 *
 * libs needed:
 * lib.es6.d.ts
 * node.d.ts
 * dom.es6.generated.d.ts
 * esnext.promise.d.ts
 * inspector.d.ts
 * lib.es2017.intl.d.ts
 * lib.es2017.object.d.ts
 * lib.es2017.sharedmemory.d.ts
 * lib.es2017.string.d.ts
 * lib.es2017.typedarray.d.ts
 * lib.esnext.asynciterable.d.ts
 * webworker.generated.d.ts
 *********************************************************************************************************************/
"use strict";

import { SyntaxKind }                                        from "./ts-helpers";
import { type }                                              from "typeofs";
// import deep                                                  from "deep-eql";
import path                                                  from "path";
import { default as fsWithCallbacks }                        from "fs";
import * as ts                                               from "typescript";
import { create_reporters }                                  from "./source-code";
import { get_options, collapse, keyCount }                   from "./utils";
import { add_types, get_names, get_type_name } from "./ts-text";

const fs = fsWithCallbacks.promises;

const
    allKinds                   = new Set(),
    allKindsWithMembers        = new Set(),
    allMembersKindsNoAmbiguity = new Set(),
    has                        = ( o, n ) => !!o && Object.prototype.hasOwnProperty.call( o, n ),
    hide                       = ( obj, name, value ) => Object.defineProperty( obj, name, { enumerable: false, value } ),
    namespaces                 = [],
    optional                   = ( obj, check ) => {
        if ( !check ) return obj;

        obj.optional = true;
        return obj;
    },
    readonly                   = ( obj, check ) => {
        if ( !isObject( obj ) || !isObject( check ) || !isArray( check.modifiers ) ) return obj;

        if ( check.modifiers.find( mod => mod.kind === SyntaxKind.ReadonlyKeyword ) )
            obj.readOnly = true;

        return obj;
    },
    declDupes                  = new WeakSet(),
    isObject                   = o => typeof o === 'object' && !Array.isArray( o ) && o !== null,
    isString                   = s => typeof s === 'string',
    isArray                    = a => Array.isArray( a ),
    strip                      = o => Object.keys( o ).reduce( ( no, k ) =>
        k === 'parent' ? no :
        isObject( o[ k ] ) ? { ...no, [ k ]: strip( o[ k ] ) } :
        isArray( o[ k ] ) ? { ...no, [ k ]: o[ k ].map( strip ) } :
        { ...no, [ k ]: o[ k ] }, {} );

const notDealing = new Map();
const topLevelNames = [];

function elevate( obj )
{
    if ( !isObject( obj ) || keyCount( obj ) !== 1 ) return obj;

    if ( isString( obj.typeName ) )
        return obj.typeName;
    else if ( isString( obj.type ) )
        return obj.type;

    return obj;
}

function get_name( sym )
{
    try
    {
        let name = 'WHY_WHY';

        if ( sym.kind === SyntaxKind.QualifiedName )
            return get_name( sym.left ).concat( get_name( sym.right ) );

        if ( sym.kind === SyntaxKind.Identifier )
            name = sym.escapedText;
        else if ( sym.kind === SyntaxKind.ComputedPropertyName )
            return `[${get_name( sym.expression )}]`;
        else if ( sym.kind === SyntaxKind.PropertyAccessExpression )
            return `${get_name( sym.expression )}.${get_name( sym.name )}`;
        else if ( sym.name )
            return get_name( sym.name );

        name = name.startsWith( '"' ) ? name.substring( 1, name.length - 1 ) : name;

        return name;
    }
    catch ( err )
    {
        console.error( err );
        process.exit( 1 );
    }
}

/**
 * @param {object} ast
 */
export function walk_symbols( ast )
{
    try
    {
        const r = sym_walk( ast, {} );
        r.topLevelNames = [ ...new Set( topLevelNames ) ].sort();

        r.allKinds = [ ...allKinds ];
        r.allKindsWithMembers = [ ...allKindsWithMembers ];
        r.allMembersKindsNoAmbiguity = [ ...allMembersKindsNoAmbiguity ];
        console.error( 'Not dealing:', notDealing );
        return r;
    }
    catch ( err )
    {
        console.error( 'WTF:', err );
        console.error( err );
    }
}

function list_heritage( nodes )
{
    if ( !nodes || !nodes.length ) return null;

    if ( nodes.length === 1 && nodes[ 0 ].kind === SyntaxKind.HeritageClause )
        return list_heritage( nodes[ 0 ].types );

    return nodes.map( h => {
        const
            out = {};

        if ( h.kind === SyntaxKind.ExpressionWithTypeArguments )
        {
            if ( h.expression.kind === SyntaxKind.Identifier )
                out.name = h.expression.escapedText;
            else
                out.name = "not identifier but " + SyntaxKind[ h.expression.kind ];

            if ( h.typeArguments && h.typeArguments.length )
                out.typeArguments = h.typeArguments.map( get_type_name );
        }
        else
            out.name = "not expression with type arguments but " + SyntaxKind[ h.kind ] + ` -> [ ${Object.keys( h )} ]`;

        return out;
    } );
}

const references = {};

export async function simple_ts_ast( fileName )
{
    try
    {
        if ( references[ fileName ] ) return references[ fileName ];

        const sourceCode = await fs.readFile( fileName, 'utf8' );
        const sourceFile = ts.createSourceFile( fileName, sourceCode, ts.ScriptTarget.Latest, true );
        const symbols = {};

        if ( sourceFile.libReferenceDirectives )
            await Promise.all( sourceFile.libReferenceDirectives.map( ref => parse_reference( sourceFile.fileName, ref ) ) );

        await Promise.all( sourceFile.statements.map( s => sym_walk( s, symbols ) ) );

        references[ fileName ] = {
            ast: sourceFile,
            reporters: sourceFile.reporters = create_reporters( fileName, sourceCode ),
            symbols
        };

        return references;
    }
    catch ( e )
    {
        console.error( e );
        process.exit( 1 );
    }
}

export function to_safe_string( refs )
{
    return Object.keys( refs ).reduce( ( safe, key ) => ( { ...safe, [ key ]: refs[ key ].symbols } ), {} );
}

async function parse_reference( src, { fileName } )
{
    const refPath = path.join( path.dirname( src ), 'lib.' + fileName ) + '.d.ts';

    return await simple_ts_ast( refPath );
}

/**
 * @param {ts.Node} node
 * @param {object} [table={}]
 */
export async function sym_walk( node, table = {} )
{

    /********************************************************************************************************************
     * Recursions
     ********************************************************************************************************************/

    if ( node.kind === SyntaxKind.VariableDeclaration )
    {
        table[ get_name( node ) ] = get_decl( node );
    }
    else if ( node.kind === SyntaxKind.VariableStatement )
    {
        if ( node.declarationList )
        {
            node.declarationList.declarations.forEach( d => sym_walk( d ) );
        }
        else
            console.error( `Deal with ${SyntaxKind[ node.kind ]}` );
    }
    else if ( node.name )
    {
        try
        {
            table[ get_name( node ) ] = get_decl( node );
        }
        catch ( e )
        {
            console.error( e );
        }
    }

    return table;
}

function set_members( members, r )
{
    const
        arr = a => Array.isArray( a ),
        mem = _m => {
            r.members = r.members ? r.members.concat( _m ) : _m;
            return _m.length;
        };

    if ( members && !arr( members ) ) members = [ members ];

    if ( members.length ) return mem( members );

    return 0;
}

/**
 * @param {object} decl
 * @return {object}
 */
function get_decl( decl )
{
    let // [ lineNumber, offset ] = file.reporters.offset_to_line_offset( decl.pos ),
        _copy = ( src, dst ) => ( name, val ) => src[ name ] && ( dst[ name ] = val || src[ name ] ),
        copy,
        heritage;

    declDupes.add( decl );

    if ( decl.heritageClauses )
        heritage = list_heritage( decl.heritageClauses );

    let [ declName, typeName ] = get_names( decl, decl.name ? get_name( decl ) : `${decl.name && decl.name.escapedText || ''}`, decl.type ? add_types( decl.type ) : '' );


    if ( decl.kind === SyntaxKind.ExportSpecifier )
    {
        let propName = '<no prop name>';

        if ( decl.hasOwnProperty( 'propertyName' ) && type( decl.propertyName ) === 'object' && has( decl, 'propertyName' ) )
            propName = decl.propertyName.escapedText;
        else if ( decl.hasOwnProperty( 'name' ) && type( decl.name ) === 'object' && has( decl, 'name' ) )
            propName = decl.name.escapedText;

        typeName = propName;
    }

    if ( type( typeName ) === 'object' && keyCount( typeName ) === 1 && Object.keys( typeName )[ 0 ] === 'typeName' )
        typeName = typeName.typeName;

    const dd = {
        // loc:  `${lineNumber + 1}:${offset}`,
        decl: declName + ( type( typeName ) !== 'object' && typeName ? ': ' + typeName : '' )
    };

    copy = _copy( decl, dd );

    copy( 'name', get_name( decl ) );

    if ( get_options().jsdoc )
        copy( 'jsDoc' );

    if ( get_options().location )
    {
        copy( 'pos' );
        copy( 'end' );
    }

    let _type = decl.type ? add_raw_types( decl.type ) : '';

    if ( decl.members )
        dd.members = decl.members.map( get_decl );

    readonly( dd, decl );

    if ( _type ) _type = elevate( _type );
    if ( _type && !decl.parameters ) dd.type = _type;

    hide( dd, 'node', decl );

    if ( decl.parameters )
    {
        func_type_info( decl, dd );
        dd.type = 'function';
    }

    if ( heritage )
        dd.heritage = heritage;

    dd.kind = SyntaxKind[ decl.kind ];

    if ( decl.typeParameters )
        dd.typeParameters = decl.typeParameters.map( add_raw_types );

    if ( decl.kind === SyntaxKind.ModuleDeclaration )
    {
        if ( declName ) namespaces.push( declName );

        dd.members = decl.body.statements.map( get_decl );
        // dd.members = decl.body.statements.map( n => sym_walk( n, {} ) );
        // const tmp = decl.body.statements.map( n => sym_walk( n, {} ) );
        //
        // if ( tmp )
        // {
        //     let collect = tmp.reduce( ( mm, block ) => mm.concat( we_want_this( block ) ), [] );
        //
        //     set_members( collect, dd );
        // }

        if ( declName ) namespaces.pop();
    }

    return dd;
}

function we_want_this( obj )
{
    if ( !obj ) return [];

    const keys = Object.keys( obj ).filter( k => type( obj[ k ] ) === 'object' && has( obj[ k ], 'decls' ) );

    return keys.length ? keys.map( k => obj[ k ] ) : [];

}

function func_type_info( type, dd = {} )
{
    if ( type.typeParameters && type.typeParameters.length )
        dd.typeParameters = type.typeParameters.map( add_raw_types );

    if ( type.parameters && type.parameters.length )
        dd.parameters = type.parameters.map( add_param );

    if ( type.type ) dd.returns = add_raw_types( type.type );

    return dd;
}

function add_param( decl )
{

    const p = {
        type: add_raw_types( decl.type ),
        name: decl.name && decl.name.escapedText || 'anon'
    };

    if ( decl.dotDotDotToken )
        p.rest = true;

    return optional( p, decl.questionToken );
}

function raw_literal( type )
{
    switch ( type.literal.kind )
    {
        case SyntaxKind.StringLiteral:
            return { type: 'literal', typeName: 'string', value: type.literal.text };

        case SyntaxKind.NumericLiteral:
            return { type: 'literal', typeName: 'number', value: type.literal.text };

        case SyntaxKind.TrueKeyword:
            return { type: 'literal', typeName: 'boolean', value: true };

        case SyntaxKind.FalseKeyword:
            return { type: 'literal', typeName: 'boolean', value: false };

        default:
            return `Unknown literal "${SyntaxKind[ type.literal.kind ]}"`;
    }
}

/**
 * @param {ts.Node} type
 * @return {{}|[]|void}
 */
function add_raw_types( type )
{
    let r;

    const getProp = p => {
        const propKey = p.name.escapedText;
        const propType = p.type && add_raw_types( p.type );
        const typeName = propType ? ( propType.typeName || propType.name || propType ) : propKey;

        return {
            type: 'property',
            propKey,
            typeName
        };
    };

    switch ( type.kind )
    {
        case SyntaxKind.Identifier:
            return { name: type.escapedText };

        case SyntaxKind.ParenthesizedType:
            return { type: 'parens', types: add_raw_types( type.type ) };

        case SyntaxKind.TypePredicate:
            return { type: 'predicate', param: type.parameterName.escapedText, returns: add_raw_types( type.type ) };

        case SyntaxKind.TypeReference:
            const { typeName, typeParameters: tp, typeArguments: ta } = type;
            r = {
                type:     'reference',
                typeName: add_raw_types( typeName ).name,
                ...( tp && tp.length ? { typeParameters: tp.map( add_raw_types ) } : {} ),
                ...( ta && ta.length ? { typeArguments: ta.map( add_raw_types ) } : {} )
            };

            return r;

        case SyntaxKind.QualifiedName:
            return { type: 'qualified', names: get_name( type ) };

        case SyntaxKind.TypeOperator:
            return { keyOf: true, type: add_raw_types( type.type ), kind: SyntaxKind[ SyntaxKind.TypeOperator ] };

        case SyntaxKind.CallSignature:
        case SyntaxKind.FunctionType:
            return {
                type:       'function',
                definition: func_type_info( type )
            };

        case SyntaxKind.PropertySignature:
            return getProp( type );

        case SyntaxKind.UnionType:
            return { type: 'union', types: type.types.map( add_raw_types ) };

        case SyntaxKind.IntersectionType:
            return { type: 'intersection', types: type.types.map( add_raw_types ) };

        case SyntaxKind.MappedType:
            const mapped = {
                type: 'mapped'
            };

            mapped.definition = {
                type:          add_raw_types( type.type ),
                typeParameter: add_raw_types( type.typeParameter )
            };

            return optional( mapped, type.questionToken );

        case SyntaxKind.LiteralType:
            return raw_literal( type );

        case SyntaxKind.TypeLiteral:
            return {
                type:    'typeliteral',
                members: type.members.map( t => ( { ...add_raw_types( t ), kind: SyntaxKind[ t.kind ] } ) )
            };

        case SyntaxKind.TypeAliasDeclaration:
            return {
                type:           add_raw_types( type.type ),
                typeParameters: add_raw_types( type.typeParameters )
            };

        case SyntaxKind.IndexSignature:
            const is = {
                type:       'index',
                typeName:   add_raw_types( type.type ),
                parameters: type.parameters.map( add_raw_types ).map( collapse )
            };
            return is;

        case SyntaxKind.Parameter:
            const typeList = add_raw_types( type.type );

            return optional( {
                name: add_raw_types( type.name ),
                type: typeList
            }, type.questionToken );

        case SyntaxKind.TupleType:
            return {
                type:  'tuple',
                types: type.elementTypes.map( add_raw_types )
            };

        case SyntaxKind.NumberKeyword:
            return 'number';

        case SyntaxKind.AnyKeyword:
            return 'any';

        case SyntaxKind.StringKeyword:
            return 'string';

        case SyntaxKind.BooleanKeyword:
            return 'boolean';

        case SyntaxKind.VoidKeyword:
            return 'void';

        case SyntaxKind.UndefinedKeyword:
            return 'undefined';

        case SyntaxKind.NullKeyword:
            return 'null';

        case SyntaxKind.NeverKeyword:
            return 'never';

        case SyntaxKind.SymbolKeyword:
            return 'symbol';

        case SyntaxKind.ThisType:
            return 'this';

        case SyntaxKind.ArrayType:
            return {
                type:        'array',
                elementType: add_raw_types( type.elementType )
            };

        case SyntaxKind.IndexedAccessType:
            return {
                type:       'indexed',
                objectType: add_raw_types( type.objectType ),
                indexType:  add_raw_types( type.indexType )
            };

        case SyntaxKind.TypeParameter:
            return {
                name: get_type_name( type ),
                ...( type.constraint ? { constraint: { type: add_raw_types( type.constraint ) } } : {} ),
                ...( type.default ? { default: add_raw_types( type.default ) } : {} )
            };

        case SyntaxKind.TypeQuery:
            return {
                type:     'query',
                typeName: add_raw_types( type.exprName )
            };

        default:
            const deal = SyntaxKind[ type.kind ];

            if ( !notDealing.has( deal ) )
                notDealing.set( deal, new Set() );

            const dealKeys = Object.keys( type ).sort();
            const curKeys = notDealing.get( deal );


            dealKeys.forEach( dk => curKeys.add( dk ) );
    }
}
