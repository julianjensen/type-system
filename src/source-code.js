/** ****************************************************************************************************
 * File: source-code (jsdoc-tag-parser)
 * @author julian on 3/8/18
 * @version 1.0.0
 * @copyright Planet3, Inc.
 *******************************************************************************************************/
'use strict';

import assert                                                                          from "assert";
import { SyntaxKind }                                                                  from "./ts-helpers";
import { CharacterCodes }                                                              from "./char-codes";
import { binarySearch, comparer, hasJSDocNodes, nodeIsMissing, positionIsSynthesized } from "./utils";
import chalk                                                                           from 'chalk';
import { type } from 'typeofs';
import { isJSDocNode }                                                                 from "typescript";

export const fullTripleSlashReferencePathRegEx            = /^(\/\/\/\s*<reference\s+path\s*=\s*)(['"])(.+?)\2.*?\/>/;
export const fullTripleSlashAMDReferencePathRegEx         = /^(\/\/\/\s*<amd-dependency\s+path\s*=\s*)(['"])(.+?)\2.*?\/>/;
const fullTripleSlashReferenceTypeReferenceDirectiveRegEx = /^(\/\/\/\s*<reference\s+types\s*=\s*)(['"])(.+?)\2.*?\/>/;
const defaultLibReferenceRegEx                            = /^(\/\/\/\s*<reference\s+no-default-lib\s*=\s*)(['"])(.+?)\2\s*\/>/;

export const output = {};

const
    { red, green, yellow, cyan, white, gray } = chalk,
    /**
     * @param {object} o
     * @param {string} n
     * @return {boolean}
     */
    has                                       = ( o, n ) => type( o ) === 'object' ? Object.prototype.hasOwnProperty.call( o, n ) : false;


/**
 * @param {string} fileName
 * @param {string} source
 * @return {{fatal: fatal, error: error}}
 */
export function create_reporters( fileName, source )
{
    let lng         = source.length,
        lineOffsets = [ 0 ];

    const
        loc_info = create_loc_info();

    console.error( `reporter for "${fileName}" with ${lineOffsets.length} lines` );
    /**
     * @param {Node} node
     * @return {[ number, number ]}
     */
    function get_start_end( node )
    {
        if ( !node ) return [ 0, 0 ];

        if ( has( node, 'start' ) )
            return [ node.start, node.end ];
        else if ( has( node, 'range' ) )
            return node.range;
        else
            return [ node.pos + 2, node.end + 2 ];
    }

    /**
     * @param {string} msg
     * @param {Node} [node]
     * @param {object} [opts]
     */
    function fatal( msg, node, opts = {} )
    {
        error( msg, node, {
            noThrow: false,
            color:   red,
            show:    true,
            ...opts
        } );
    }

    /**
     * @param {string} msg
     * @param {Node} [node]
     * @param {object} [opts]
     */
    function warn( msg, node, opts = {} )
    {
        opts = Object.assign( opts || {}, {
            noThrow: true,
            color:   yellow,
            show:    true
        } );

        error( msg, node, {
            noThrow: true,
            color:   yellow,
            show:    true,
            ...opts
        } );
    }


    /**
     * @param {string} msg
     * @param {Node} [node]
     * @param {object} [opts]
     */
    function log( msg, node, opts = {} )
    {
        opts = Object.assign( opts || {}, {
            noThrow: false,
            color:   cyan,
            show:    true
        } );

        error( msg, node, {
            noThrow: false,
            color:   cyan,
            show:    true,
            ...opts
        } );
    }

    /**
     * @param {string} msg
     * @param {Node} [node]
     * @param {object} [opts]
     */
    function error( msg, node, opts = {} )
    {
        let {
                noThrow = true,
                show    = true,
                color   = red
            }              = opts,
            [ start, end ] = get_start_end( node ),
            loc            = node && loc_info( start, end ),
            fileLoc        = loc && `In "${fileName}", line ${loc.start.line + 1}: `,
            txt            = ( loc ? fileLoc : '' ) + msg;

        if ( show && node )
            txt += '\n\n' + show_source( node, 0 );

        if ( noThrow )
        {
            console.error( color( txt ) );
            // console.trace();
            return;
        }

        throw new Error( txt );
    }

    /**
     * @param node
     * @return {string}
     */
    function show_source( node )
    {
        let [ start, end ] = get_start_end( node ),
            loc            = loc_info( start, end ),
            sline          = loc.start.sourceLine,
            indicator      = ' '.repeat( loc.start.offset ) + '^',
            skip           = loc.start.offset;

        while ( sline.charCodeAt( skip ) <= CharacterCodes.space && skip < 1000 )
        {
            ++skip;
            indicator = ' ' + indicator;
        }

        return sline + '\n' + indicator;
    }

    /**
     * @param offset
     * @param lineOffsets
     * @return {number}
     */
    function binary_search( offset, lineOffsets )
    {
        let b      = 0,
            e      = lineOffsets.length - 1,
            middle = ( e - b ) >> 1;

        if ( offset >= lineOffsets[ lineOffsets.length - 1 ] ) return 0;

        while ( true )
        {
            if ( offset < lineOffsets[ middle ] )
                e = middle;
            else if ( offset >= lineOffsets[ middle + 1 ] )
                b = middle;
            else
                break;

            middle = b + ( ( e - b ) >> 1 );
        }

        return middle;
    }

    /**
     * @param {number} pos
     * @return {[ number, number ]}
     */
    function offset_to_line_offset( pos )
    {
        let lineNumber;

        pos = skipTrivia( source, pos );

        return [ lineNumber = binary_search( pos, lineOffsets ), pos - lineOffsets[ lineNumber ] ];
    }

    function get_source_info_for_node( node )
    {
        return loc_info( node.pos, node.end );
    }

    /**
     * @return {function(*=, *=)}
     */
    function create_loc_info()
    {
        let i    = 0,
            chop = s => s.replace( /^(.*)[\r\n]*$/, '$1' );

        while ( i < lng )
        {
            if ( source[ i ] === '\n' )
                lineOffsets.push( i + 1 );

            ++i;
        }

        lineOffsets.push( lng );

        return ( start, end ) => {
            let lineNumber    = binary_search( start, lineOffsets ),
                startOffset   = start - lineOffsets[ lineNumber ],
                lineNumberEnd = end < lineOffsets[ lineNumber + 1 ] ? lineNumber : binary_search( end, lineOffsets ),
                endOffset     = end - lineOffsets[ lineNumberEnd ];

            return {
                start:       {
                    line:       lineNumber,
                    offset:     startOffset,
                    sourceLine: chop( source.substring( lineOffsets[ lineNumber ], lineOffsets[ lineNumber + 1 ] ) ),
                    lineOffset: lineOffsets[ lineNumber ]
                },
                end:         {
                    line:       lineNumberEnd,
                    offset:     endOffset,
                    sourceLine: chop( source.substring( lineOffsets[ lineNumberEnd ], lineOffsets[ lineNumberEnd + 1 ] ) ),
                    lineOffset: lineOffsets[ lineNumberEnd ]
                },
                sourceRange: chop( source.substring( startOffset, endOffset + 1 ).replace( /^(.*)[\r\n]*$/, '$1' ) ),
                sourceLines: chop( source.substring( lineOffsets[ lineNumber ], lineOffsets[ lineNumberEnd + 1 ] ) )
            };

        };
    }

    /**
     *
     * @param {ts.Node} node
     * @return {ts.SourceFile|ts.Node}
     */
    function getSourceFileOfNode( node )
    {
        while ( node && node.kind !== SyntaxKind.SourceFile )
            node = node.parent;

        return node;
    }

    /**
     * @param {number} line
     * @return {number}
     */
    function getStartPositionOfLine( line )
    {
        assert( line >= 0 );
        return lineOffsets[ line ];
    }

    function getLineNumberOfNode( node )
    {
        let line = 0;
        const pos = +node.pos;

        while ( pos > lineOffsets[ line ] ) ++line;

        return line + 1;
    }

    /**
     * This is a useful function for debugging purposes.
     *
     * @param {ts.Node} node
     * @return {string}
     */
    function nodePosToString( node )
    {
        const [ line, character ] = offset_to_line_offset( node.pos );
        return `${fileName}(${line + 1},${character + 1})`;
    }

    /**
     * @param {number} line
     * @param {SourceFileLike} sourceFile
     * @return {number}
     */
    function getEndLinePosition( line )
    {
        assert( line >= 0 );

        let start = lineOffsets[ line ],
            pos   = lineOffsets[ line + 1 ] - 1;


        while ( start <= pos && isLineBreak( source.charCodeAt( pos ) ) )
            pos--;

        return pos;
    }

    /**
     * Determine if the given comment is a triple-slash
     *
     * @return true if the comment is a triple-slash comment else false
     */
    function isRecognizedTripleSlashComment( text, commentPos, commentEnd )
    {
        // Verify this is /// comment, but do the regexp match only when we first can find /// in the comment text
        // so that we don't end up computing comment string and doing match for all // comments
        if ( text.charCodeAt( commentPos + 1 ) === CharacterCodes.slash &&
             commentPos + 2 < commentEnd &&
             text.charCodeAt( commentPos + 2 ) === CharacterCodes.slash )
        {
            const textSubStr = text.substring( commentPos, commentEnd );
            return textSubStr.match( fullTripleSlashReferencePathRegEx ) ||
                   textSubStr.match( fullTripleSlashAMDReferencePathRegEx ) ||
                   textSubStr.match( fullTripleSlashReferenceTypeReferenceDirectiveRegEx ) ||
                   textSubStr.match( defaultLibReferenceRegEx );
        }

        return false;
    }

    /**
     *
     * @param {string} text
     * @param {CommentRange} comment
     * @return {boolean}
     */
    function isPinnedComment( text, comment )
    {
        return text.charCodeAt( comment.pos + 1 ) === CharacterCodes.asterisk && text.charCodeAt( comment.pos + 2 ) === CharacterCodes.exclamation;
    }

    /**
     *
     * @param {ts.Node} node
     * @param {SourceFileLike} [sourceFile]
     * @param {boolean} [includeJsDoc]
     * @return {number}
     */
    function getTokenPosOfNode( node, sourceFile, includeJsDoc )
    {
        // With nodes that have no width (i.e. 'Missing' nodes), we actually *don't*
        // want to skip trivia because this will launch us forward to the next token.
        if ( nodeIsMissing( node ) )
            return node.pos;


        if ( isJSDocNode( node ) )
            return skipTrivia( ( sourceFile || getSourceFileOfNode( node ) ).text, node.pos, /* stopAfterLineBreak */ false, /* stopAtComments */ true );


        if ( includeJsDoc && hasJSDocNodes( node ) )
            return getTokenPosOfNode( node.jsDoc[ 0 ] );

        // For a syntax list, it is possible that one of its children has JSDocComment nodes, while
        // the syntax list itself considers them as normal trivia. Therefore if we simply skip
        // trivia for the list, we may have skipped the JSDocComment as well. So we should process its
        // first child to determine the actual position of its first token.
        if ( node.kind === SyntaxKind.SyntaxList && node._children.length > 0 )
            return getTokenPosOfNode( node._children[ 0 ], sourceFile, includeJsDoc );

        return skipTrivia( ( sourceFile || getSourceFileOfNode( node ) ).text, node.pos );
    }

    /**
     *
     * @param {ts.Node} node
     * @param {SourceFileLike} [sourceFile]
     * @return {number}
     */
    function getNonDecoratorTokenPosOfNode( node, sourceFile )
    {
        if ( nodeIsMissing( node ) || !node.decorators )
            return getTokenPosOfNode( node, sourceFile );

        return skipTrivia( source, node.decorators.end );
    }

    /**
     * @param {ts.SourceFile} sourceFile
     * @param {ts.Node} node
     * @param {boolean} [includeTrivia=false]
     * @return {string}
     */
    function getSourceTextOfNodeFromSourceFile( sourceFile, node, includeTrivia = false )
    {
        if ( nodeIsMissing( node ) )
            return "";

        const text = sourceFile.text;
        return text.substring( includeTrivia ? node.pos : skipTrivia( text, node.pos ), node.end );
    }

    function get_actual_pos( pos )
    {
        return skipTrivia( source, pos );
    }

    /**
     * @param {string} sourceText
     * @param {ts.Node} node
     * @return {string}
     */
    function getTextOfNodeFromSourceText( node )
    {
        if ( nodeIsMissing( node ) )
            return "";

        return source.substring( skipTrivia( source, node.pos ), node.end );
    }

    /**
     * @param {ts.Node} node
     * @param {boolean} [includeTrivia=false]
     * @return {string}
     */
    function getTextOfNode( node, includeTrivia = false )
    {
        return getSourceTextOfNodeFromSourceFile( getSourceFileOfNode( node ), node, includeTrivia );
    }

    function getPos( range )
    {
        return range.pos;
    }

    /**
     * Note: it is expected that the `nodeArray` and the `node` are within the same file.
     * For example, searching for a `SourceFile` in a `SourceFile[]` wouldn't work.
     *
     * @param {ReadonlyArray<Node>} nodeArray
     * @param {ts.Node} node
     */
    function indexOfNode( nodeArray, node )
    {
        return binarySearch( nodeArray, node, getPos, comparer );
    }

    function get_line( lineNumber )
    {
        if ( lineNumber < 0 || lineNumber >= lineOffsets.length - 1 ) return '';

        return source.substring( lineOffsets[ lineNumber ], lineOffsets[ lineNumber + 1 ] );
    }

    function file_info()
    {
        return `Reporter for "${fileName}" with ${lineOffsets.length - 1} lines`;
    }

    return {
        file_info,
        getLineNumberOfNode,
        getSourceTextOfNodeFromSourceFile,
        get_source_info_for_node,
        getSourceFileOfNode,
        getTextOfNodeFromSourceText,
        isRecognizedTripleSlashComment,
        getStartPositionOfLine,
        nodePosToString,
        indexOfNode,
        getTextOfNode,
        fatal,
        error,
        warn,
        log,
        offset_to_line_offset,
        get_line,
        get_actual_pos,
        numLines: lineOffsets.length - 1
    };
}

/**
 *
 * @param {string} text
 * @param {number} pos
 * @param {boolean} [stopAfterLineBreak=false],
 * @param {boolean} [stopAtComments=false]
 * @return {number}
 */
export function skipTrivia( text, pos, stopAfterLineBreak = false, stopAtComments = false )
{
    if ( positionIsSynthesized( pos ) )
        return pos;

    // Keep in sync with couldStartTrivia
    while ( true )
    {
        const ch = text.charCodeAt( pos );

        switch ( ch )
        {
            case CharacterCodes.carriageReturn:
                if ( text.charCodeAt( pos + 1 ) === CharacterCodes.lineFeed )
                    pos++;

            // falls through
            case +CharacterCodes.lineFeed:
                pos++;
                if ( stopAfterLineBreak )
                    return pos;
                continue;

            case CharacterCodes.tab:
            case CharacterCodes.verticalTab:
            case CharacterCodes.formFeed:
            case CharacterCodes.space:
                pos++;
                continue;

            case CharacterCodes.slash:
                if ( stopAtComments )
                    break;

                if ( text.charCodeAt( pos + 1 ) === CharacterCodes.slash )
                {
                    pos += 2;
                    while ( pos < text.length )
                    {
                        if ( isLineBreak( text.charCodeAt( pos ) ) )
                        {
                            break;
                        }
                        pos++;
                    }
                    continue;
                }

                if ( text.charCodeAt( pos + 1 ) === CharacterCodes.asterisk )
                {
                    pos += 2;
                    while ( pos < text.length )
                    {
                        if ( text.charCodeAt( pos ) === CharacterCodes.asterisk && text.charCodeAt( pos + 1 ) === CharacterCodes.slash )
                        {
                            pos += 2;
                            break;
                        }
                        pos++;
                    }
                    continue;
                }
                break;

            case CharacterCodes.lessThan:
            case CharacterCodes.bar:
            case CharacterCodes.equals:
            case CharacterCodes.greaterThan:
                if ( isConflictMarkerTrivia( text, pos ) )
                {
                    pos = scanConflictMarkerTrivia( text, pos );
                    continue;
                }
                break;

            case CharacterCodes.hash:
                if ( pos === 0 && isShebangTrivia( text, pos ) )
                {
                    pos = scanShebangTrivia( text, pos );
                    continue;
                }
                break;

            default:
                if ( ch > CharacterCodes.maxAsciiCharacter && ( isWhiteSpaceLike( ch ) ) )
                {
                    pos++;
                    continue;
                }
                break;
        }

        return pos;
    }
}

// All conflict markers consist of the same character repeated seven times.  If it is
// a <<<<<<< or >>>>>>> marker then it is also followed by a space.
const mergeConflictMarkerLength = "<<<<<<<".length;

/**
 * @param {string} text
 * @param {number} pos
 */
function isConflictMarkerTrivia( text, pos )
{
    assert( pos >= 0 );

    // Conflict markers must be at the start of a line.
    if ( pos === 0 || isLineBreak( text.charCodeAt( pos - 1 ) ) )
    {
        const ch = text.charCodeAt( pos );

        if ( ( pos + mergeConflictMarkerLength ) < text.length )
        {
            for ( let i = 0; i < mergeConflictMarkerLength; i++ )
            {
                if ( text.charCodeAt( pos + i ) !== ch )
                    return false;
            }

            return ch === CharacterCodes.equals ||
                   text.charCodeAt( pos + mergeConflictMarkerLength ) === CharacterCodes.space;
        }
    }

    return false;
}

/**
 * @param {string} text
 * @param {number} pos
 */
function scanConflictMarkerTrivia( text, pos )
{
    const
        ch  = text.charCodeAt( pos ),
        len = text.length;

    if ( ch === CharacterCodes.lessThan || ch === CharacterCodes.greaterThan )
    {
        while ( pos < len && !isLineBreak( text.charCodeAt( pos ) ) )
            pos++;

    }
    else
    {
        assert( ch === CharacterCodes.bar || ch === CharacterCodes.equals );
        // Consume everything from the start of a ||||||| or ======= marker to the start
        // of the next ======= or >>>>>>> marker.
        while ( pos < len )
        {
            const currentChar = text.charCodeAt( pos );
            if ( ( currentChar === CharacterCodes.equals || currentChar === CharacterCodes.greaterThan ) && currentChar !== ch && isConflictMarkerTrivia( text, pos ) )
            {
                break;
            }

            pos++;
        }
    }

    return pos;
}

const shebangTriviaRegex = /^#!.*/;

/**
 * Shebangs check must only be done at the start of the file
 *
 * @param {string} text
 * @param {number} pos
 */
function isShebangTrivia( text, pos )
{
    assert( pos === 0 );

    return shebangTriviaRegex.test( text );
}

function scanShebangTrivia( text, pos )
{
    const shebang = shebangTriviaRegex.exec( text )[ 0 ];

    pos = pos + shebang.length;

    return pos;
}

function isWhiteSpaceLike( ch )
{
    return isWhiteSpaceSingleLine( ch ) || isLineBreak( ch );
}

/** Does not include line breaks. For that, see isWhiteSpaceLike. */
function isWhiteSpaceSingleLine( ch )
{
    // Note: nextLine is in the Zs space, and should be considered to be a whitespace.
    // It is explicitly not a line-break as it isn't in the exact set specified by EcmaScript.
    return ch === CharacterCodes.space ||
           ch === CharacterCodes.tab ||
           ch === CharacterCodes.verticalTab ||
           ch === CharacterCodes.formFeed ||
           ch === CharacterCodes.nonBreakingSpace ||
           ch === CharacterCodes.nextLine ||
           ch === CharacterCodes.ogham ||
           ch >= CharacterCodes.enQuad && ch <= CharacterCodes.zeroWidthSpace ||
           ch === CharacterCodes.narrowNoBreakSpace ||
           ch === CharacterCodes.mathematicalSpace ||
           ch === CharacterCodes.ideographicSpace ||
           ch === CharacterCodes.byteOrderMark;
}

function isLineBreak( ch )
{
    // ES5 7.3:
    // The ECMAScript line terminator characters are listed in Table 3.
    //     Table 3: Line Terminator Characters
    //     Code Unit Value     Name                    Formal Name
    //     \u000A              Line Feed               <LF>
    //     \u000D              Carriage Return         <CR>
    //     \u2028              Line separator          <LS>
    //     \u2029              Paragraph separator     <PS>
    // Only the characters in Table 3 are treated as line terminators. Other new line or line
    // breaking characters are treated as white space but not as line terminators.

    return ch === CharacterCodes.lineFeed ||
           ch === CharacterCodes.carriageReturn ||
           ch === CharacterCodes.lineSeparator ||
           ch === CharacterCodes.paragraphSeparator;
}


