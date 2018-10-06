/** ******************************************************************************************************************
 * @file Describe what parser does.
 * @author Julian Jensen <jjdanois@gmail.com>
 * @since 1.0.0
 * @date 20-Mar-2018
 *********************************************************************************************************************/
"use strict";

import { create_reporters }                      from "./source-code";
import {
    file_handler,
    sync
}                                                from "./files";
import { syntaxKind }                            from "./ts-helpers";
import * as ts                                   from "typescript";
import { walk_symbols }                          from "./ts-symbols";
import { traverse, attachComments, VisitorKeys } from "estraverse";
import { parse as parser }                       from "espree";

/** */
export class Parser
{
    /**
     * @param {?Array<string>} [includePaths]
     * @param {boolean} [asScript=false]
     * @param {object} [options]
     */
    constructor( includePaths, asScript = false, options = { jsOptions: {}, tsOptions: {} } )
    {
        this.tsHandler = this.jsHandler = null;
        this.includePaths = includePaths;

        // workarounds issue described at https://github.com/Microsoft/TypeScript/issues/18062
        for ( const name of Object.keys( ts.SyntaxKind ).filter( x => isNaN( parseInt( x ) ) ) )
        {
            const value = ts.SyntaxKind[ name ];
            if ( !syntaxKind[ value ] )
                syntaxKind[ value ] = name;
        }

        syntaxKind[ syntaxKind.FirstTypeNode ] = "TypePredicate";

        this.tsOptions = Object.assign( {
            // noResolve:                  true,
            target:                     ts.ScriptTarget.Latest,
            experimentalDecorators:     true,
            experimentalAsyncFunctions: true,
            jsx:                        'preserve'
        }, options.tsOptions );

        this.jsOptions = Object.assign( {
            loc:          true,
            range:        true,
            comment:      true,
            tokens:       true,
            ecmaVersion:  9,
            sourceType:   asScript ? 'script' : 'module',
            ecmaFeatures: {
                impliedStrict:                !asScript,
                experimentalObjectRestSpread: true
            }
        }, options.jsOptions );

        this.jsOptions.range = this.jsOptions.loc = this.jsOptions.comment = this.jsOptions.tokens = true;
        this.jsOptions.ecmaVersion = 2018;
        this.jsOptions.ecmaFeatures = options.jsOptions.ecmaFeatures || {};
        this.jsOptions.ecmaFeatures.experimentalObjectRestSpread = true;
    }

    get ambientTypes()
    {
        if ( !this._ambientTypes )
            this._ambientTypes = walk_symbols( this.ambient );

        return this._ambientTypes;
    }

    async add_source_files( ...srcs )
    {
        const
            tsFiles = [],
            jsFiles = [];

        srcs.forEach( fileName => ( fileName.endsWith( '.ts' ) ? tsFiles : jsFiles ).push( fileName ) );

        if ( !this.tsHandler && tsFiles.length )
            this.tsHandler = await file_handler( tsFiles, [ 'data' ] );
        else if ( tsFiles.length )
            this.tsHandler.add( ...tsFiles );

        if ( !this.jsHandler && jsFiles.length )
            this.jsHandler = await file_handler( jsFiles, [] );
        else if ( jsFiles.length )
            this.jsHandler.add( ...jsFiles );

        return this;
    }

    /**
     * @return {Array<object>}
     */
    async parse()
    {
        await this.parse_file( {}, this.tsOptions );
        // if ( this.tsHandler ) await Promise.all( this.tsHandler.map( file => this.parse_file( file, this.tsOptions ) ) );
        if ( this.jsHandler ) await Promise.all( this.jsHandler.map( file => this.parse_file( file, this.jsOptions ) ) );
    }

    /**
     *
     * @param {object} file
     * @param {object} [options={}]
     * @abstract
     */
    async parse_file( file, options = {} )
    {
        const { filename, source } = file;

        if ( !filename || filename.endsWith( '.ts' ) )
        {
            const genName = 'generated.d.ts';

            await this.create_bundle( genName );
            this.ambient = this.tsHandler.get( genName );
        }
        else
            file.ast = this.js_ast( source, options );
    }

    parse_snippet( source, type = '.ts' )
    {
        switch ( type )
        {
            case 'ts':
            case '.ts':
            case 'd.ts':
            case '.d.ts':
                const tsSource = ts.createSourceFile( 'tmp' + ( Math.random() * 1e7 ) | 0 + '.ts', source, ts.ScriptTarget.Latest, true );
                return walk_symbols( tsSource );

            case 'js':
            case '.js':
            case 'mjs':
            case '.mjs':
                return this.js_ast( source );

            default:
                throw new Error( `Unknown file type: ${type}` );
        }
    }

    /**
     * @param {string} [newname]
     * @param {string} [filename]
     * @return {Promise<*>}
     */
    async create_bundle( newname = 'generated.d.ts', filename = 'data/concatenated.d.ts' )
    {
        this.tsHandler.concatenate( newname, c => {
            c.ast = ts.createSourceFile( c.filename, c.source, ts.ScriptTarget.Latest, true );
            sync.writeFile( filename, c.source );
        } );

        return this;
    }

    /**
     * @param {string} source       - The source module
     * @param {object} [_options]    - The usual espree/esprima options
     * @return {Program}
     */
    js_ast( source, _options = this.jsOptions )
    {
        const
            ast = parser( source, _options );

        return this.prep( attachComments( ast, ast.comments, ast.tokens ) );
    }

    /**
     * @param {Program} withComments
     * @param {string} [file]
     * @return {object|Program}
     */
    prep( withComments, file )
    {
        const
            types          = new Set(),
            allNodesParsed = [],
            byIndex        = [];

        withComments.fileName = file;

        traverse( withComments, {
            enter: ( node, parent ) => {

                node.parent = parent;
                node.index = byIndex.length;
                // node.transformFlags = TransformFlags.None;
                byIndex.push( node );

                [ node.field, node.fieldIndex ] = Parser.determine_field( node, parent );

                // enter( node );
                // const comments = parse_comments( node );
                //
                // if ( comments )
                // {
                //     types.add( node.type );
                //     allNodesParsed.push( comments );
                //     build_definition( node, comments );
                // }
                // else if ( node.type === Syntax.Identifier )
                //     build_definition( node );
            }
            // exit
        } );

        return { fileName: file, types: [ ...types ], allDocNodes: allNodesParsed };
    }

    /**
     *
     * @param node
     * @param parent
     * @return {*[]}
     */
    static determine_field( node, parent )
    {
        if ( !parent ) return [ null, null ];

        for ( const key of VisitorKeys[ parent.type ] )
        {
            const pv = parent[ key ];

            if ( !pv ) continue;

            if ( !Array.isArray( pv ) )
            {
                if ( pv === node ) return [ key, null ];
            }
            else
            {
                const i = pv.indexOf( node );

                if ( i !== -1 )
                    return [ key, i ];
            }
        }

        return [ null, null ];
    }
}

/**
 * @class TypeScriptParser
 * @extends Parser
 */
export class TypeScriptParser extends Parser
{
    /**
     * @param {?Array<string>} [includePaths]
     */
    constructor( includePaths )
    {
        super( includePaths );

        // workarounds issue described at https://github.com/Microsoft/TypeScript/issues/18062
        for ( const name of Object.keys( ts.SyntaxKind ).filter( x => isNaN( parseInt( x ) ) ) )
        {
            const value = ts.SyntaxKind[ name ];
            if ( !syntaxKind[ value ] )
                syntaxKind[ value ] = name;
        }

        this.defaultOptions = {
            noResolve:                  true,
            target:                     ts.ScriptTarget.Latest,
            experimentalDecorators:     true,
            experimentalAsyncFunctions: true,
            jsx:                        'preserve'
        };
    }

    /**
     * @param {string} filename
     * @param {string} source
     * @param {object} _options
     * @return {object}
     * @override
     */
    parse_file( filename, source, _options = {} )
    {
        const
            options = { ...this.defaultOptions, ..._options };

        return {
            filename,
            source,
            reporters: create_reporters( filename, source ),
            ast:       ts.createSourceFile( filename, source, ts.ScriptTarget.Latest, true ),

            create_symbols()
            {
                this.bound = createBinder()( this.ast, options );
                return this;
            },

            create_types()
            {
                this.ast.moduleAugmentations = [];
                this.typeChecker = ts.createTypeChecker( TypeScriptParser.create_host( this.filename, this.source, this.ast ), false );
                return this;
            }
        };
    }

    /**
     * @param {string} filename
     * @param {string} source
     * @param {ts.SourceFile} ast
     * @return {{fileExists: function(*): boolean,
     * getCanonicalFileName: function(*): *,
     * getCurrentDirectory: function(): string,
     * getDefaultLibFileName: function(): null,
     * getNewLine: function(): string,
     * getSourceFile: function(*): null,
     * getSourceFiles: function(): *[], readFile: function(): *,
     * useCaseSensitiveFileNames: function(): boolean,
     * writeFile: function(): null,
     * getResolvedTypeReferenceDirectives: function(): Map<any, any>, getCompilerOptions: function(): {experimentalDecorators: boolean, experimentalAsyncFunctions: boolean, jsx: boolean}}}
     */
    static create_host( filename, source, ast )
    {
        const resolvedTypeReferenceDirectives = new Map();

        return {
            fileExists:                         name => name === filename,
            getCanonicalFileName:               filename => filename,
            getCurrentDirectory:                () => process.cwd(),
            getDefaultLibFileName:              () => null,
            getNewLine:                         () => '\n',
            getSourceFile:                      name => name === filename ? ast : null,
            getSourceFiles:                     () => [ ast ],
            readFile:                           () => source,
            useCaseSensitiveFileNames:          () => true,
            writeFile:                          () => null,
            getResolvedTypeReferenceDirectives: () => resolvedTypeReferenceDirectives,
            getCompilerOptions:                 () => ( {
                experimentalDecorators:     true,
                experimentalAsyncFunctions: true,
                jsx:                        true
            } )
        };
    }
}

