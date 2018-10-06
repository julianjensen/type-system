/** ******************************************************************************************************************
 * @file Describe what files does.
 * @author Julian Jensen <jjdanois@gmail.com>
 * @since 1.0.0
 * @date 17-Mar-2018
 *********************************************************************************************************************/
"use strict";

import _fs                          from "fs-extra";
import path                         from "path";
import { create_reporters }         from "./source-code";
import { Promise }                  from "bluebird";
import { CharacterCodes }           from "./char-codes";
import { createBinder } from "typescript";

/**
 * Returns the last element of an array if non-empty, `undefined` otherwise.
 */
export function lastOrUndefined( array )
{
    return array.length === 0 ? undefined : array[ array.length - 1 ];
}

import util from "util";

let tmp;

const
    isObject = o => typeof o === 'object' && !Array.isArray( o ) && o !== null,
    wrapped = ( lhs, rhs ) => ( { enumerable: true, writable: true, configurable: true, value: { toString: () => lhs, valueOf: () => rhs, [ Symbol.toPrimitive ]: hint => hint === 'string' ? lhs : rhs } } ),
    named = name => ( { enumerable: true, writable: true, configurable: true, value: name } ),
    VALUE = Symbol( 'value' ),
    asString = function( base ) {
        return function( _num = 0 ) {
            let i   = 1,
                s   = [],
                num = +_num;

            if ( typeof _num === 'string' ) return _num;

            while ( num )
            {
                if ( num & 1 )
                    s.push( `${base[ i ]}` );

                num >>>= 1;
                i <<= 1;
            }

            return s.join( ' | ' );
        };
    },
    templ = () => ( {
        create( val )
        {
            const o = Object.create( Object.getPrototypeOf( this ) );
            o[ VALUE ] = +( isObject( val ) && Reflect.has( val, VALUE ) ? val[ VALUE ] : ( +val || 0 ) );
            return o;
        },
        get value() { return this[ VALUE ]; },
        set value( v ) { this[ VALUE ] = v; },
        asString,
        toString() { return this[ VALUE ] ? this.asString( this[ VALUE ] ) : ''; },
        valueOf() { return this[ VALUE ] || 0; },
        [ Symbol.toPrimitive ]( hint ) { return hint === 'string' ? this.toString() : this.valueOf(); },
        [ util.inspect.custom ]( depth, options ) { return this.toString(); }
    } );

/** *********************************************************************************************************************
 * @enum
 * @name FileSystemEntryKind
 ************************************************************************************************************************/
let FileSystemEntryKind = {};
FileSystemEntryKind.File = wrapped( 'File', 1 );
FileSystemEntryKind[ +FileSystemEntryKind.File.value ] = typeof FileSystemEntryKind[ +FileSystemEntryKind.File.value ] !== 'number' ? named( 'File' ) : FileSystemEntryKind[ +FileSystemEntryKind.File.value ];
FileSystemEntryKind.Directory = wrapped( 'Directory', 2 );
FileSystemEntryKind[ +FileSystemEntryKind.Directory.value ] = typeof FileSystemEntryKind[ +FileSystemEntryKind.Directory.value ] !== 'number' ? named( 'Directory' ) : FileSystemEntryKind[ +FileSystemEntryKind.Directory.value ];

FileSystemEntryKind = Object.create( tmp = templ(), FileSystemEntryKind );
tmp.asString = asString( FileSystemEntryKind );

// NodeJS detects "\uFEFF" at the start of the string and *replaces* it with the actual
// byte order mark from the specified encoding. Using any other byte order mark does
// not actually work.
const
    byteOrderMarkIndicator = "\uFEFF",
    fs                     = Promise.promisifyAll( _fs );

let sync, concurrent;

import os from "os";
export const
    platform = os.platform(),
    isWindows = platform === 'win32' || platform === 'win64',
    EOL = os.EOL;

export function canonical_name( filename )
{
    if ( filename.startsWith( './' ) ) filename = filename.substr( 2 );

    return isWindows ? filename.toLowerCase() :filename;
}

/**
 * @param {Array<string>} _files
 * @param {?Array<string>} [includePaths]
 * @return {Promise<{}>}
 */
export async function file_handler( _files, includePaths )
{
    const
        files = new Map();

    await Promise.all( _files.map( read_one ) );

    function add( ...fileNames )
    {
        return Promise.all( fileNames.map( read_one ) );
    }

    function concatenate( concatName, done = () => null )
    {
        const
            oneFile = [ ...files.values() ].map( file => file.source.replace( /\r/g, '' ) ).join( '' );

        files.clear();
        const file = create_file( concatName, oneFile );

        done( file );

        if ( file.ast && concatName.endsWith( '.ts' ) )
            file.ast = createBinder()( file.ast, {} );
    }

    /**
     * @param {string} filename
     * @return {Promise<void>}
     */
    async function read_one( filename )
    {
        filename   = await fix_path( filename );
        const file = create_file( filename );
        await get_source( file );
        return file;
    }

    /**
     * @param {string} filename
     * @return {*}
     */
    async function fix_path( filename )
    {
        filename = canonical_name( filename );

        if ( await concurrent.fileExists( filename ) ) return filename;

        let i = 0;

        while ( i < includePaths.length )
        {
            const p = path.join( includePaths[ i++ ], filename );

            if ( await concurrent.fileExists( p ) )
                return p;
        }

        return null;
    }

    /**
     * @param filename
     * @return {*}
     */
    async function get_file( filename )
    {
        filename = await fix_path( filename );

        if ( !files.has( filename ) )
            return create_file( filename );

        return files.get( filename );
    }

    /**
     * @param {string} filename
     * @param {string} [source]
     * @return {*}
     */
    function create_file( filename, source )
    {
        let file = files.get( filename );

        if ( !file ) files.set( filename, file = { filename } );

        if ( source )
        {
            file.source = source;
            file.reporters = create_reporters( filename, source );
        }
        // file.binder = createBinder();

        return file;
    }

    /**
     * @param {object} file
     * @return {Promise<*>}
     */
    async function get_source( file )
    {
        if ( !file ) return null;
        if ( file.source ) return file.source;

        file.source = await concurrent.readFile( file.filename, 'utf8' );

        file.reporters = create_reporters( file.filename, file.source );

        return file;
    }

    /**
     * @return {*[]}
     */
    function names()
    {
        return [ ...files.keys() ];
    }

    /**
     * @param {string} name
     * @return {obj}
     */
    function get( name )
    {
        return files.get( name );
    }

    /**
     * @param {function} fn
     */
    function each( fn )
    {
        [ ...files.values() ].forEach( fn );
    }

    /**
     * @param {function} fn
     * @return {Array<*>}
     */
    function map( fn )
    {
        return [ ...files.values() ].map( fn );
    }

    return {
        add,
        each,
        map,
        get,
        get_file,
        create_file,
        get_source,
        names,
        concatenate,
        fix_path,
        *[ Symbol.iterator ]()
        {
            yield *files.values();
        }
    };
}

/** Convert all lowercase chars to uppercase, and vice-versa */
function swapCase( s )
{
    return s.replace( /\w/g, ( ch ) => {
        const up = ch.toUpperCase();
        return ch === up ? ch.toLowerCase() : up;
    } );
}

/**
 * Returns length of path root (i.e. length of "/", "x:/", "//server/share/, file:///user/files")
 *
 * @param {string} path
 * @return {number}
 */
function getRootLength( path )
{
    if ( path.charCodeAt( 0 ) === CharacterCodes.slash )
    {
        if ( path.charCodeAt( 1 ) !== CharacterCodes.slash ) return 1;
        const p1 = path.indexOf( "/", 2 );
        if ( p1 < 0 ) return 2;
        const p2 = path.indexOf( "/", p1 + 1 );
        if ( p2 < 0 ) return p1 + 1;
        return p2 + 1;
    }

    if ( path.charCodeAt( 1 ) === CharacterCodes.colon )
        if ( path.charCodeAt( 2 ) === CharacterCodes.slash || path.charCodeAt( 2 ) === CharacterCodes.backslash ) return 3;

    // Per RFC 1738 'file' URI schema has the shape file://<host>/<path>
    // if <host> is omitted then it is assumed that host value is 'localhost',
    // however slash after the omitted <host> is not removed.
    // file:///folder1/file1 - this is a correct URI
    // file://folder2/file2 - this is an incorrect URI
    if ( path.lastIndexOf( "file:///", 0 ) === 0 )
        return "file:///".length;

    const idx = path.indexOf( "://" );
    if ( idx !== -1 )
        return idx + "://".length;

    return 0;
}

function getDirectoryPath( path )
{
    return path.substr( 0, Math.max( getRootLength( path ), path.lastIndexOf( path.sep ) ) );
}

function getNormalizedParts( normalizedSlashedPath, rootLength )
{
    const
        parts      = normalizedSlashedPath.substr( rootLength ).split( path.sep ),
        normalized = [];

    for ( const part of parts )
    {
        if ( part !== "." )
        {
            if ( part === ".." && normalized.length > 0 && lastOrUndefined( normalized ) !== ".." )
                normalized.pop();

            else if ( part )
            // A part may be an empty string (which is 'falsy') if the path had consecutive slashes,
            // e.g. "path//file.ts".  Drop these before re-joining the parts.
                normalized.push( part );
        }
    }

    return normalized;
}

function normalizePath( path )
{
    return normalizePathAndParts( path ).path;
}

function normalizeSlashes( path )
{
    return path.replace( /\\/g, "/" );
}

/**
 *
 * @param path
 * @return {{ path: string, parts: string[] }}
 */
function normalizePathAndParts( path )
{
    path = normalizeSlashes( path );

    const
        rootLength = getRootLength( path ),
        root       = path.substr( 0, rootLength ),
        parts      = getNormalizedParts( path, rootLength );

    if ( parts.length )
    {
        const joinedParts = root + parts.join( path.sep );
        return {
            path: pathEndsWithDirectorySeparator( path ) ? joinedParts + path.sep : joinedParts,
            parts
        };
    }
    else
    {
        return {
            path: root,
            parts
        };
    }
}

/** A path ending with '/' refers to a directory only, never a file. */
function pathEndsWithDirectorySeparator( path )
{
    return path.charCodeAt( path.length - 1 ) === path.sep;
}

function getDirectories( path )
{
    return fs.readdirSync( path ).filter( dir => fileSystemEntryExists( path.join( path, dir ), FileSystemEntryKind.Directory ) );
}

/**
 * @param {string} path
 * @param {FileSystemEntryKind} entryKind
 * @return {boolean}
 */
function fileSystemEntryExists( path, entryKind )
{
    try
    {
        const stat = fs.statSync( path );

        switch ( +entryKind )
        {
            case +FileSystemEntryKind.File:
                return stat.isFile();
            case +FileSystemEntryKind.Directory:
                return stat.isDirectory();
        }
    }
    catch ( e )
    {
        return false;
    }
}

/**
 * @param {string} fileName
 * @param {*} data
 * @param {boolean} [writeByteOrderMark]
 */
function writeFile( fileName, data, writeByteOrderMark = false )
{
    // If a BOM is required, emit one
    if ( writeByteOrderMark )
        data = byteOrderMarkIndicator + data;


    let fd;

    try
    {
        fd = fs.openSync( fileName, "w" );
        fs.writeSync( fd, data, /* position */ undefined, "utf8" );
    }
    finally
    {
        if ( fd !== undefined )
            fs.closeSync( fd );

    }
}


sync = {
    fileSystemEntryExists,
    getDirectories,

    fileExists( path )
    {
        return fileSystemEntryExists( path, FileSystemEntryKind.File );
    },

    directoryExists( path )
    {
        return fileSystemEntryExists( path, FileSystemEntryKind.Directory );
    },

    ensureDirectoriesExist( path )
    {
        return fs.ensureDirSync( path );
    },

    getRootLength,
    getDirectoryPath,
    normalizePath,
    realpath( path )
    {
        return fs.realpathSync( path );
    },

    getModifiedTime( path )
    {
        try
        {
            return fs.statSync( path ).mtime;
        }
        catch ( e )
        {
            return undefined;
        }
    },

    /**
     * @param {string} fileName
     * @param {string} [_encoding='utf8']
     * @return {*}
     */
    readFile( fileName, _encoding = 'utf8' )
    {
        if ( !sync.fileExists( fileName ) )
            return undefined;

        const buffer = fs.readFileSync( fileName );

        let len = buffer.length;

        if ( len >= 2 && buffer[ 0 ] === 0xFE && buffer[ 1 ] === 0xFF )
        {
            // Big endian UTF-16 byte order mark detected. Since big endian is not supported by node.js,
            // flip all byte pairs and treat as little endian.
            len &= ~1; // Round down to a multiple of 2

            for ( let i = 0; i < len; i += 2 )
            {
                const temp      = buffer[ i ];
                buffer[ i ]     = buffer[ i + 1 ];
                buffer[ i + 1 ] = temp;
            }

            return buffer.toString( "utf16le", 2 );
        }
        if ( len >= 2 && buffer[ 0 ] === 0xFF && buffer[ 1 ] === 0xFE )
        {
            // Little endian UTF-16 byte order mark detected
            return buffer.toString( "utf16le", 2 );
        }
        if ( len >= 3 && buffer[ 0 ] === 0xEF && buffer[ 1 ] === 0xBB && buffer[ 2 ] === 0xBF )
        {
            // UTF-8 byte order mark detected
            return buffer.toString( "utf8", 3 );
        }
        // Default is UTF-8 with no byte order mark
        return buffer.toString( "utf8" );
    },

    writeFile,

    useCaseSensitiveFileNames()
    {
        // win32\win64 are case insensitive platforms
        if ( platform === "win32" || platform === "win64" )
            return false;

        // If this file exists under a different case, we must be case-insensitve.
        return !sync.fileExists( swapCase( __filename ) );
    }
};

concurrent = {
    async getDirectories( path )
    {
        return await fs.readdirAsync( path ).filter( dir => concurrent.fileSystemEntryExists( path.join( path, dir ), FileSystemEntryKind.Directory ) );
    },

    directoryExists( path )
    {
        return concurrent.fileSystemEntryExists( path, FileSystemEntryKind.Directory );
    },

    ensureDirectoriesExist( path )
    {
        return fs.ensureDirAsync( path );
    },

    getRootLength,
    getDirectoryPath,
    normalizePath,

    async realpath( path )
    {
        return fs.realpathAsync( path );
    },

    async getModifiedTime( path )
    {
        try
        {
            return ( await fs.statAsync( path ) ).mtime;
        }
        catch ( e )
        {
            return undefined;
        }
    },

    /**
     * @param {string} path
     * @param {FileSystemEntryKind} entryKind
     * @return {boolean}
     */
    async fileSystemEntryExists( path, entryKind )
    {
        try
        {
            const stat = await fs.statAsync( path );

            switch ( +entryKind )
            {
                case +FileSystemEntryKind.File:
                    return stat.isFile();
                case +FileSystemEntryKind.Directory:
                    return stat.isDirectory();
            }
        }
        catch ( e )
        {
            return false;
        }
    },

    fileExists( path )
    {
        return concurrent.fileSystemEntryExists( path, FileSystemEntryKind.File );
    },


    /**
     * @param {string} fileName
     * @param {string} [_encoding='utf8']
     * @return {*}
     */
    async readFile( fileName, _encoding = 'utf8' )
    {
        if ( !await concurrent.fileExists( fileName ) )
            return undefined;

        const buffer = await fs.readFileAsync( fileName );

        let len = buffer.length;

        if ( len >= 2 && buffer[ 0 ] === 0xFE && buffer[ 1 ] === 0xFF )
        {
            // Big endian UTF-16 byte order mark detected. Since big endian is not supported by node.js,
            // flip all byte pairs and treat as little endian.
            len &= ~1; // Round down to a multiple of 2
            for ( let i = 0; i < len; i += 2 )
            {
                const temp      = buffer[ i ];
                buffer[ i ]     = buffer[ i + 1 ];
                buffer[ i + 1 ] = temp;
            }
            return buffer.toString( "utf16le", 2 );
        }
        if ( len >= 2 && buffer[ 0 ] === 0xFF && buffer[ 1 ] === 0xFE )
        {
            // Little endian UTF-16 byte order mark detected
            return buffer.toString( "utf16le", 2 );
        }
        if ( len >= 3 && buffer[ 0 ] === 0xEF && buffer[ 1 ] === 0xBB && buffer[ 2 ] === 0xBF )
        {
            // UTF-8 byte order mark detected
            return buffer.toString( "utf8", 3 );
        }
        // Default is UTF-8 with no byte order mark
        return buffer.toString( "utf8" );
    },

    /**
     * @param {string} fileName
     * @param {*} data
     * @param {boolean} [writeByteOrderMark]
     */
    async writeFile( fileName, data, writeByteOrderMark = false )
    {
        // If a BOM is required, emit one
        if ( writeByteOrderMark )
            data = byteOrderMarkIndicator + data;

        return await fs.writeFileAsync( fileName, data );
    }

};

export { sync, concurrent };
