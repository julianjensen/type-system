#!/usr/bin/env node
/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/
"use strict";

const
    fs        = require( 'fs' ),
    promisify = require( 'util' ).promisify,
    writeFile = promisify( fs.writeFile ),
    readFile  = promisify( fs.readFile ),

    program   = require( 'commander' ),
    version   = require( '../package' ).version;

const
    hyphenate = str => str.replace( /([a-z])([A-Z]+)/g, ( $0, $1, $2 ) => `$1$2` ).toLowerCase() + '.json';

let compare = ( a, b ) => a === b;

program
    .version( version )
    .option( '-v, --verbose', 'Verbose output or information' )
    .option( '-i, --insensitive', 'Case insensitive symbol matching' )
    .option( '-s, --source <source>', 'specify which source file to use, default is "./sym.json"' );

program
    .command( 'extract <name> [otherNames...]' )
    .alias( 'x' )
    .description( 'extract one or more symbol definitions' )
    .option( '-d, --dir <name>', 'Optional output directory' )
    .option( '-f, --force', 'Create directory if it does not exist' )

    .action( async function( name, otherNames, options ) {
        if ( options.parent.insensitive ) compare = ( a, b ) => a.toLowerCase() === b.toLowerCase();

        if ( options.parent.verbose )
            console.log( `extracting ${[ name, ...otherNames ].join( ', ' )}` );

        await extract( options.parent.source || './test/sym.json', ...[ name, ...otherNames ] );

        // console.log( 'name:', name );
        // console.log( 'others:', otherNames );
        // console.log( 'output directory:', options.dir );
        // console.log( 'source file:', options.parent.source );
        // console.log( 'parent options:', Object.keys( options.parent ).filter( k => !k.startsWith( '_' ) ) );
        // console.log( 'options:', Object.keys( options ).filter( k => !k.startsWith( '_' ) ) );
    } );

program
    .command( 'info <name> [otherNames...]' )
    .alias( 'i' )
    .description( 'dump information regarding the given symbols' )
    .action( ( ...args ) => console.log( 'info args:', args ) );

program.parse( process.argv );

async function extract( sourceName, ...names )
{
    const src = await readFile( sourceName, 'utf8' );
    const locals = JSON.parse( src ).locals;

    return Promise.all(
        names
            .map( name => ( { name, data: locals.find( l => compare( l.name, name ) ) } ) )
            .map( info => {
                if ( !info.data )
                    console.error( `Unable to find and extract "${info.name}"` );
                return info.data ? info : null;
            } )
            .filter( x => x )
            .map( ( { name, data } ) => writeFile( hyphenate( name ), JSON.stringify( data, null, 4 ) ) )
    );
}
