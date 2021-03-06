/** ******************************************************************************************************************
 * @file Description of file here.
 * @author Julian Jensen <jjdanois@gmail.com>
 * @since 1.0.0
 * @date Fri Aug 17 2018
 *********************************************************************************************************************/

"use strict";

import { default as fsWithCallbacks } from "fs";

const fs = fsWithCallbacks.promises;

import { declaration }                                                                 from "./src/create-type";
import { log, $, fatal, warn, set_options, set_meta, node_fatal, no_parent, safe_obj } from "./src/utils";
import { Scope }                                                                       from "./src/scope";
import { DEBUG }                                                                       from "./src/constants";
import { default as program }                                                          from "commander";
import * as ts                                                                         from 'typescript';
import { simple_ts_ast, to_safe_string }                                               from "./src/ts-symbols";
import globby                                                                from "globby";
import { primitive_init }                                         from "./src/types/primitives";
import { SyntaxKind }                                             from "./src/ts-helpers";

const
    _options = {},
    options  = {};

const isSource = name => name.endsWith( '.js' ) || name.endsWith( '.ts' );

let parseCount = 0;
let parser;
let externFiles = [];

program
    .version( require( './package.json' ).version )
    .name( 'type-system' )
    .option( '-a, --ambient <ambientpath>', 'override the default amient file' )
    .option( '-c, --config <confpath>', 'set config path. defaults to ./config.json' )
    .option( "-o, --output <outputfile>", "write output to this file" )
    .option( '-v, --verbose', 'output information' );

program
    .command( 'parse <file> [files...]' )
    .alias( 'p' )
    .description( 'parse files' )
    .option( "-n, --names <symbol> [symbols...]", "limit processing to these names" )
    .option( "-l, --limit <count>", "limit porcessing to this number of symbols" )
    .option( "--loc", "include location information" )
    .option( "--jsdoc", "include JSDoc information" )
    .action( ( file, files, args ) => {

        log( 'symbol:', $( args.symbol ) );
        log( 'symbols:', $( args.symbols ) );
        _options.files = [ file, ...files ];
        _options.verbose = args.verbose !== void 0 ? args.verbose : options.verbose;
        _options.symbols = [ ...( args.symbol ? [ args.symbol ] : [] ), ...( args.symbols || [] ) ];
        _options.limit = args.limit || -1;
        _options.command = 'parse';
        _options.location = !!args.loc;
        _options.jsdoc = !!args.jsdoc;
    } );

program
    .command( 'infer [names...]' )
    .alias( 'i' )
    .description( 'infer types for all variables' )
    .option( "-a, --annotate [mode]", "Which annotation mode to use, default is JSDoc" )
    .action( ( names, args ) => {
        _options.inferNames = names || null;
        _options.annotate = ( args.annotate || 'jsdoc' ).toLowerCase();
        _options.command = 'annotate';
    } );

program
    .command( '*' )
    .action( () => _options.command = null );

program.parse( process.argv );

_options.ambient = program.ambient || './generic-test.json' || './es.json';
_options.config = program.config || './config';
_options.output = program.output || null;
_options.verbose = !!program.verbose;

Object.assign( options, require( _options.config ), _options );

if ( !options.command )
    program.help();

set_options( options );
primitive_init();

// const nameList = [ 'identity', 'strIdent', 'HasLength', 'twoTyped', 'Hmmm', 'explicit', 'X', 'Y', 'abc', 'def', 'Abc' ];

async function process_all()
{
    const expanded = await globby( options.files );

    const [ files ] = await Promise.all( expanded.map( simple_ts_ast ) );
    const filesRead = Object.keys( files );

    console.error( `Read ${filesRead.length} file${filesRead.length !== 1 ? 's' : ''}` );

    try
    {
        const _out = JSON.stringify( filesRead.map( key => safe_obj( files[ key ].ast.statements ) ), null, 4 );
        await fs.writeFile( './ast.json', _out );

        filesRead.forEach( key => {
            const file = files[ key ];

            set_meta( key, file );
            console.error( `Starting declaration for ${key}` );
            console.error( file.reporters.file_info() );
            declaration( file.ast );
            console.error( `Ending declaration for ${key}` );
        } );
        // declaration( files[ Object.keys( files )[ 0 ] ].ast );
    }
    catch ( e )
    {
        node_fatal( e.message, undefined, { noThrow: true } );
        console.error( "ERROR:", e );
        log.error( e );
    }
    console.error( "STRINGIFY" );
    console.error( Scope.global.stringify() );
    // console.error( `${Scope.global}` );
    // console.error( $( Scope.global, 6 ) );

    let safe = to_safe_string( files );

    safe = Object.keys( safe ).reduce( ( output, key ) => {
        if ( Object.keys( safe[ key ] ).length )
            output[ key ] = safe[ key ];
        return output;
    }, {} );

    // console.log( JSON.stringify( safe, null, 4 ) );
    // console.log( JSON.stringify( to_safe_string( files ), null, 4 ) );
}

process_all().then( () => process.exit() );

// Promise.all( options.files.map( read_file ) )
//     .then( () => finish_reading() )
//     .then( ( { locals } ) => {
//         let syms = options.symbols && options.symbols.length ? options.symbols : locals.map( d => d.name );
//
//         if ( options.limit > 0 ) syms = syms.slice( 0, options.limit );
//
//         syms.forEach( name => {
//             const d = locals.find( d => d.name === name );
//
//             d.decls.forEach( decl => {
//                 declaration( name, decl );
//             } );
//         } );
//
//         const unresd = TypeReference.late_resolution();
//
//         if ( unresd.size )
//         {
//             for ( const [ path, syms ] of unresd )
//             {
//                 warn( path + ' ->' );
//                 for ( const sym of syms )
//                     warn( '    ' + sym + ' [unresolved]' );
//             }
//         }
//
//         if ( Scope.DEBUG & DEBUG.SCOPE.FINAL )
//         {
//             console.log( `${Scope.global.stringify()}` );
//             // console.log( $( Scope.global ) );
//         }
//     } )
//     .catch( fatal );

// const sourceFiles = options.files.filter(  );
//
// sourceFiles.length ? parse_files( ...sourceFiles ) :
//
// Promise.all( [ process_file( options.ambient ), ...options.files.map( process_file ) ] ).then( () => process.exit() ).catch( fatal );
//
// function process_file( fileName )
// {
//     return fs.readFile( fileName, 'utf8' )
//         .then( text => JSON.parse( text ) )
//         .then( ( { locals } ) => {
//
//             let syms = options.symbols && options.symbols.length ? options.symbols : locals.map( d => d.name );
//
//             if ( options.limit > 0 ) syms = syms.slice( 0, options.limit );
//
//             syms.forEach( name => {
//                 const d = locals.find( d => d.name === name );
//
//                 d.decls.forEach( decl => {
//                     declaration( name, decl );
//                 } );
//             } );
//
//             const unresd = TypeReference.late_resolution();
//
//             if ( unresd.size )
//             {
//                 for ( const [ path, syms ] of unresd )
//                 {
//                     warn( path + ' ->' );
//                     for ( const sym of syms )
//                         warn( '    ' + sym + ' [unresolved]' );
//                 }
//             }
//
//             if ( Scope.DEBUG & DEBUG.SCOPE.FINAL )
//             {
//                 console.log( `${Scope.global.stringify()}` );
//                 // console.log( $( Scope.global ) );
//             }
//         } )
//         .catch( fatal );
// }

async function read_file( fileName )
{
    if ( isSource( fileName ) )
    {
        ++parseCount;
        if ( !parser ) parser = new Parser( [ 'data' ] );
        await parser.add_source_files( fileName );
    }
    else
    {
        externFiles = externFiles.concat( await fs.readFile( fileName, 'utf8' ).then( text => JSON.parse( text ).locals ) );
    }

}

async function finish_reading()
{
    if ( !parseCount )
        return { locals: externFiles };

    await parser.parse();

    const r = parser.ambientTypes;

    r.locals = r.locals.concat( externFiles );

    return r;
}

// async function parse_files( list )
// {
//     const
//         parser = new Parser( [ 'data' ] );
//
//     await parser.add_source_files( ...list );
//     await parser.parse();
//
//     return parser.ambientTypes;
// }


// const
//     syms = require( './test/sym' ),
//     global = require( './src/global' ),
//     { process_definition, notHandling, notHandlingKeys } = require( "./src/pre-reader" );
//
// syms.locals.forEach( ( { name, decls } ) => {
//     decls.forEach( decl => process_definition( name, decl ) );
// } );
//
// console.log( `total syms:`, global.globalScope.info( true ) );
// console.log( 'not handling:', [ ...notHandling ] );
// [ ...notHandlingKeys ].forEach( ( [ name, keySet ] ) => {
//     console.log( `Not handling: "${name}" -> ${[ ...keySet ].join( ', ' )}` );
// } );
