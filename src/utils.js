/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/
"use strict";

import { type } from "typeofs";

const
    chalk       = require( 'chalk' ),
    sig         = require( 'signale' ),
    util        = require( 'util' ),

    CALL          = Symbol.for( '()' ),
    CONSTRUCTOR   = Symbol.for( 'new' ),
    ANONYMOUS    = Symbol.for( 'anonymous' ),

    { inspect } = util,
    $           = ( o, d = 4 ) => inspect( o, { depth: d } );

let options = { verbose: false };
let create_type;

export function set_options( opts )
{
    options = opts;
}

export function get_options() { return options; }

export function type_creator( _create_type ) {
    if ( typeof _create_type === 'function' )
        return create_type = _create_type;

    return create_type( _create_type );
}

util.inspect.defaultOptions.colors = true;
util.inspect.defaultOptions.depth = 4;

const safe = s => typeof s === 'symbol' ? Symbol.keyFor( s ) : s;

const log = ( ...args ) => options.verbose && logger.scope( 'decl' ).log( ...args );
[ 'type', 'var', 'prop', 'decl', 'signature', 'alias', 'function' ].forEach( lname => log[ lname ] = ( ...args ) => options.verbose && logger.scope( 'decl', lname ).log( ...args ) );
const warn = ( ...args ) => logger.scope( 'decl' ).warn( ...args );
const italic = ( strs, ...exprs ) => chalk.italic( exprs.reduce( ( out, x, i ) => out + strs[ i ] + x, strs[ 0 ] ) + ( strs.lengrth > 1 ? strs[ strs.length - 1 ] : '' ) );

const isObject = o => typeof o === 'object' && o !== null && !Array.isArray( o );
const isString = s => typeof s === 'string';
const isSymbol = s => typeof s === 'symbol';

const logger = sig;
const fatal = e => {
    logger.fatal( e );
    logger.fatal( e.stack );
};

let tmpCount = 0;

const tmpName = prefix => Symbol.for( `__$TMP_${prefix}_${(++tmpCount).toString().padStart( 10, '0' )}__` );

/**
 * @param {string|number} a
 * @param {string|number} b
 * @return {number}
 */
export function comparer( a, b )
{
    return a === b ? 0 : a === undefined ? -1 : b === undefined ? 1 : a < b ? -1 : 1;
}

/**
 * Performs a binary search, finding the index at which `value` occurs in `array`.
 * If no such index is found, returns the 2's-complement of first index at which
 * `array[index]` exceeds `value`.
 * @param array A sorted array whose first element must be no larger than number
 * @param value The value to be searched for in the array.
 * @param keySelector A callback used to select the search key from `value` and each element of
 * `array`.
 * @param keyComparer A callback used to compare two keys in a sorted array.
 * @param offset An offset into `array` at which to start the search.
 */
export function binarySearch( array, value, keySelector = x => x.id, keyComparer = comparer, offset = 0 )
{
    if ( !Array.isArray( array ) || array.length === 0 ) return -1;

    let low  = offset || 0,
        high = array.length - 1;

    const key = keySelector( value );

    while ( low <= high )
    {
        const
            middle = low + ( ( high - low ) >> 1 ),
            midKey = keySelector( array[ middle ] );

        switch ( keyComparer( midKey, key ) )
        {
            case -1:
                low = middle + 1;
                break;
            case 0:
                return middle;
            case 1:
                high = middle - 1;
                break;
        }
    }

    return ~low;
}

/**
 * True if has jsdoc nodes attached to it.
 *
 * @param {ts.Node} node
 * @return {boolean}
 */
export function hasJSDocNodes( node )
{
    return !!node.jsDoc && node.jsDoc.length > 0;
}

/**
 * Returns true if this node is missing from the actual source code. A 'missing' node is different
 * from 'undefined/defined'. When a node is undefined (which can happen for optional nodes
 * in the tree), it is definitely missing. However, a node may be defined, but still be
 * missing.  This happens whenever the parser knows it needs to parse something, but can't
 * get anything in the source code that it expects at that location. For example:
 *
 *          let a: ;
 *
 * Here, the Type in the Type-Annotation is not-optional (as there is a colon in the source
 * code). So the parser will attempt to parse out a type, and will create an actual node.
 * However, this node will be 'missing' in the sense that no actual source-code/tokens are
 * contained within it.
 *
 * @param {ts.Node} node
 * @return {boolean}
 */
export function nodeIsMissing( node )
{
    if ( node === undefined )
        return true;


    return node.pos === node.end && node.pos >= 0 && node.kind !== SyntaxKind.EndOfFileToken;
}

export function positionIsSynthesized( pos )
{
    // This is a fast way of testing the following conditions:
    //  pos === undefined || pos === null || isNaN(pos) || pos < 0;
    return !( pos >= 0 );
}

function collapse( t )
{
    if ( !t ) return t;

    if ( Array.isArray( t ) ) return t.map( collapse );

    _collapse( t );
    _collapse( t, 'name' );
    _collapse( t, 'typeName', 'name' );
    _collapse( t, 'name', 'typeName' );
    _collapse( t, 'type', 'typeName' );

    if ( type( t.typeName ) === 'object' )
        collapse( t.typeName );

    return t;
}

function _collapse( t, field = 'typeName', sub = field )
{
    if ( !t ) return t;

    const
        has = ( o, n ) => type( o ) === 'object' ? o.hasOwnProperty( n ) : false,
        tn  = type( t[ field ] ) === 'object' ? t[ field ] : null;

    if ( tn && has( tn, 'types' ) && !tn.types )
        delete tn.types;

    if ( tn && keyCount( tn ) === 1 )
    {
        if ( has( tn, sub ) && type( tn[ sub ] ) === 'string' )
            t[ field ] = tn[ sub ];
    }

    return t;
}


export {
    collapse,
    tmpName,
    isObject,
    isString,
    isSymbol,
    CALL,
    CONSTRUCTOR,
    ANONYMOUS,
    log,
    $,
    warn,
    italic,
    logger,
    fatal,
    safe
};
