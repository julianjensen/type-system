/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/
"use strict";

import { Scope } from "../scope";

function source_info( stack, offset )
{
    // const exclusions = new RegExp( String.raw`${selfName}|named-object|anonymous` );
    const exclusions = new RegExp( String.raw`named-object|anonymous` );
    let foundAtOffset;
    const [ , code, fpath, line ] = stack.slice( offset ).find( ( line, i ) => ( !exclusions.test( line ) && ( foundAtOffset = i ) ) ).match( /^\s*at\s(.*?)\s+\(([^:]+):(\d+).*/ );

    return { code, file: fpath.substr( __dirname.length + 1 ), line, traceOffset: foundAtOffset };
}

/** */
export class Type
{
    /**
     * @param {string} name
     * @param {boolean} [hasScope=false]
     */
    constructor( name, hasScope = false )
    {
        this.typeName = name;
        this.scope = hasScope ? Scope.current.add_inner() : null;

        this.isSignature = false;
        this.isFunction = false;
        this.isResolved = false;
        this.isTemplate = false;
        this.isReference = false;
        this.isConstructor = false;
        this.isCall = false;
        this.isPrimitive = false;
        this.isInterface = false;
        this.isMapped = false;
        this.boundTo = null;


        const stack = new Error().stack.split( /\r?\n/ );
        const trace = source_info( stack, 3 );
        this.__debug = {
            creator: trace,
            pred:    source_info( stack, trace.traceOffset + 4 )
        };
    }

    cloc()
    {
        const { code, file, line } = this.__debug && this.__debug.creator || {};

        return `${code} in ${file}, line ${line}`;

    }

    ploc()
    {
        const { code, file, line } = this.__debug && this.__debug.pred || {};

        return `${code} in ${file}, line ${line}`;

    }

    boundName()
    {
        return this.toString();
    }

    toString()
    {
        return this.boundTo ? this.boundTo.name : 'no binding';
    }
}
