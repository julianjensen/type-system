/** ******************************************************************************************************************
 * @file Describe what ts-helpers does.
 * @author Julian Jensen <jjdanois@gmail.com>
 * @since 1.0.0
 * @date 03-Feb-2018
 *********************************************************************************************************************/
"use strict";

import ts                             from "typescript/lib/typescript";
import { object, array, string, has } from 'convenience'; // ../../../convenience/index';
import { type, nameOf }               from 'typeofs'; // ../../../typeofs/index';

export let syntaxKind = ts.SyntaxKind;
export const SyntaxKind = ts.SyntaxKind;

export const fixEnums = {
    FirstAssignment:         'EqualsToken',
    FirstBinaryOperator:     'LessThanToken',
    FirstCompoundAssignment: 'PlusEqualsToken',
    FirstJSDocTagNode:       'JSDocTag',
    FirstLiteralToken:       'NumericLiteral',
    FirstNode:               'QualifiedName',
    FirstTypeNode:           'TypePredicate',
    LastBinaryOperator:      'CaretEqualsToken',
    LastTemplateToken:       'TemplateTail',
    LastTypeNode:            'LiteralType'
};

export const
    /**
     * @param {Node} node
     * @return {string}
     */
    indent = node => {
        let i = 0,
            p = node.parent;

        while ( p )
        {
            i++;
            p = p.parent;
        }

        return '    '.repeat( i );
    };

export const
    /**
     * @param {string} kw
     * @return {string}
     */
    from_keyword = kw => kw && kw.endsWith( 'Keyword' ) ? kw.substring( 0, kw.length - 7 ).toLowerCase() : '',

    /**
     * @param {string} tp
     * @return {string}
     */
    from_type    = tp => tp.endsWith( 'Type' ) ? tp.substring( 0, tp.length - 4 ) : '',

    excludeKeys  = [ 'pos', 'end', 'parent', 'kind', 'flags', 'transformFlags', 'modifierFlagsCache' ];

const
    _show_kind     = ( node, ...args ) => {
        let x = '';
        if ( args.length ) x = ': [ ' + args.join( ', ' ) + ' ]';

        console.log( `${indent( node )}${SyntaxKind[ node.kind ]}${x}` );
    },
    _show_prefixed = ( pre, node, ...args ) => {
        let x = '';
        if ( args.length ) x = ': [ ' + args.join( ', ' ) + ' ]';

        console.log( `${indent( node )}${pre} => ${SyntaxKind[ node.kind ]}${x}` );
    };

let cleaned,

    typeFields  = new Map(),

    object_name = obj => object( obj ) && has( obj, 'kind' ) ? syntaxKind[ obj.kind ] : nameOf( obj ),

    add_sub     = ( c, ns ) => {

        if ( ns === void 0 ) return c;

        if ( array( ns ) ) return ns.reduce( ( cur, el ) => add_sub( cur, el ), c );

        ns = object_name( ns ); // object( ns ) && has( ns, 'kind' ) ? syntaxKind[ ns.kind ] : nameOf( ns );

        if ( !c.length )
            return [ ns ];
        else if ( !c.includes( ns ) )
        {
            c.push( ns );
            return c;
        }

        return c;
    },

    pretty      = ( type, name, sub ) => {
        if ( type === 'undefined' ) return type;
        if ( type === 'object' ) return name;
        if ( type !== 'array' ) return `${type} (${name})`;

        if ( !sub.length ) sub = [ '*' ];

        return `Array<${sub.join( '|' )}>`;
    };

/**
 * @typedef {object} TypeInfo
 * @property {string} key
 * @property {string} name
 * @property {Array<string>} sub
 * @property {boolean} qual
 */

/**
 * @param {Node} node
 * @param {string} key
 * @param {?Node} parent
 * @return {?TypeInfo}
 */
function field_info( node, key, parent )
{
    if ( !object( node[ key ] ) && !array( node[ key ] ) ) return null;

    if ( object( node[ key ] ) )
    {
        if ( key === 'tagName' && !has( node[ key ], 'kind' ) )
            node[ key ].kind = syntaxKind.Identifier;

        if ( !has( node[ key ], 'kind' ) ) return null;
    }

    if ( !node[ key ].parent || node[ key ].parent !== parent ) node[ key ].parent = parent;

    const
        obj = node[ key ],
        r   = {
            key,
            type: type( obj ),
            name: object_name( obj ),
            sub:  [],
            qual: true
        };

    if ( obj === null || obj === void 0 )
        r.qual = false;

    if ( !array( obj ) || !obj.length ) return r;

    r.sub = add_sub( r.sub, obj[ 0 ] );

    return r;
}

/**
 * @param {TypeInfo} cur
 * @param {TypeInfo} repl
 * @return {boolean}
 */
function comp_node( cur, repl )
{
    if ( cur.key !== repl.key ) return false;

    add_sub( cur.sub, repl.sub );
    repl.sub = cur.sub;

    return !cur.qual && repl.qual;
}

/**
 * @param {Node} node
 * @param {?Node} parent
 */
export function collect_fields( node, parent )
{
    if ( !has( node, 'kind' ) ) return;

    let keyList = Reflect.ownKeys( node ).filter( key => !excludeKeys.includes( key ) ),

        current = typeFields.get( node.kind ),

        expand  = list => list.map( key => field_info( node, key, parent ) ).filter( x => !!x );

    if ( !current )
        typeFields.set( node.kind, expand( keyList ) );
    else
    {
        const
            newList  = expand( keyList ),
            newTypes = [];

        for ( const repl of newList )
        {
            const cur = current.find( c => c.key === repl.key );

            if ( cur && comp_node( cur, repl ) )
                Object.assign( cur, repl );
            else if ( !cur )
                newTypes.push( repl );
        }

        if ( newTypes.length )
            typeFields.set( node.kind, current.concat( newTypes ) );
    }
}

/**
 *
 */
export function show_fields()
{
    const
        mapped = {};

    [ ...typeFields ]
        .forEach( ( [ kind, fields ] ) => {
            let kn = nodeName( kind );
            mapped[ kn ] = fields;
        } );

    for ( const kindName of Object.keys( mapped ).sort() )
    {
        console.log( `${kindName}:` );

        const
            fields = mapped[ kindName ],
            f      = fields.map( ( { key, type, name, sub } ) => `${key}: ${pretty( type, name, sub )}` ).join( ', ' );

        // console.log( fields );
        console.log( `    ${f}` );
    }
}

/**
 *
 */
export function show_copy_paste()
{
    const
        mapped = {};


    [ ...typeFields ]
        .forEach( ( [ kind, fields ] ) => {
            let kn = nodeName( kind );
            mapped[ kn ] = fields;
        } );

    for ( const kindName of Object.keys( mapped ).sort() )
    {
        // console.log( `${kindName}:` );

        const
            fields = mapped[ kindName ],
            f      = ' [' + fields.map( ( { key } ) => `'${key}'` ).join( ', ' ) + '],';

        // console.log( fields );
        console.log( `    ${kindName}: ${f}` );
    }
}

/**
 * @param {Node|number|string} node
 * @return {string}
 */
export function nodeName( node )
{
    const n = string( node ) ? node : ts.SyntaxKind[ object( node ) ? node.kind : node ];

    return fixEnums[ n ] || n;
}
