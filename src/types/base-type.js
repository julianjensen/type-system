/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/

import { Scope }                from "../scope";
import { isFunction, isString } from "../utils";

/**
 * @param {Array<string>} stack
 * @param {number} offset
 * @return {{code, file: string, line, traceOffset: *, source, dirname: String}}
 */
function source_info( stack, offset )
{
    const exclusions = new RegExp( String.raw`anonymous` );
    let foundAtOffset = 0;
    const prepped = stack.slice( offset ).find( ( line, i ) => ( !exclusions.test( line ) && ( foundAtOffset = i ) ) );
    const [ source, code, fpath, line ] = prepped.match( /^\s*at\s+(.*?)\s+\((?:[A-Z]:)?([^:]+):(\d+).*/ );

    let dirname = __dirname;
    while ( dirname.length && !fpath.startsWith( dirname ) )
        dirname = dirname.replace( /^(.*)\/.*$/, '$1' );

    return { code, file: fpath.substr( dirname.length + 1 ), line, traceOffset: foundAtOffset, source, dirname: __dirname };
}

/**
 * @param {string|function(string):boolean|Type} baseType
 * @param {string} checkType
 * @return {boolean}
 */
function basicCheckType( baseType, checkType )
{
    if ( isString( baseType ) )
        return baseType === checkType;
    else if ( isFunction( baseType ) )
        return baseType( checkType );
    else if ( baseType instanceof Type )
        return baseType.isBaseType( checkType );
    else
        return false;
}

/**
 * @param {string|function(string):boolean|Type} baseType
 * @return {string}
 */
function basicGetType( baseType )
{
    if ( isString( baseType ) )
        return baseType;
    else if ( isFunction( baseType ) )
        return '<func-check>';
    else if ( baseType instanceof Type )
        return baseType.getBaseTypeAsString();
    else
        return '<unknown>';
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
        this.scope = hasScope ? Scope.current.add( this ) : null;

        this.boundTo = null;

        const stack = new Error().stack.split( /\r?\n/ );
        const trace = source_info( stack, 2 );
        this.__debug = {
            creator: trace,
            pred:    source_info( stack, trace.traceOffset + 4 )
        };
        this.isParenthesized = false;
        /** @type {string|Set<string>|function(string):boolean|Type} */
        this.baseType = 'object';
        this.isType = true;
        this.mangled = null;
        this.__mangled = this.typeName;
    }

    /**
     * @return {boolean}
     */
    hasMangled()
    {
        return !!this.mangled;
    }

    /**
     * @param {string} name
     * @return {string}
     */
    getMangled( name )
    {
        const _m = this.__mangled || this.mangled || this.getBaseTypeAsString();

        return _m ? `${name}$${_m}$` : name;
    }

    /**
     * @param {string} checkType
     * @return {boolean}
     */
    isBaseType( checkType )
    {
        if ( this.baseType instanceof Set )
        {
            for ( const bt of this.baseType )
            {
                if ( bt instanceof Type )
                {
                    if ( bt.isBaseType( checkType ) )
                        return true;
                }
                else if ( basicCheckType( bt, checkType ) )
                    return true;
            }
        }
        else
            return basicCheckType( this.baseType, checkType );
    }

    /**
     * @return {string}
     */
    getBaseTypeAsString()
    {
        if ( this.baseType instanceof Set )
        {
            for ( const bt of this.baseType )
            {
                if ( bt instanceof Type )
                    return bt.getBaseTypeAsString();
                else
                    return basicGetType( bt );
            }
        }
        else
            return basicGetType( this.baseType );
    }

    /**
     * Current line of code, i.e. where this type was defined.
     *
     * @return {string}
     */
    cloc()
    {
        const { code, file, line } = this.__debug && this.__debug.creator || {};

        return `${code} in ${file}, line ${line}`;

    }

    /**
     * Previous line of code, i.e. the function call that called whatever created this type.
     *
     * @return {string}
     */
    ploc()
    {
        const { code, file, line } = this.__debug && this.__debug.pred || {};

        return `${code} in ${file}, line ${line}`;

    }

    /**
     * @param {string} bnd
     * @return {string}
     */
    annotate_type( bnd )
    {
        if ( this.isParenthesized )
            bnd = `( ${bnd} )`;

        return bnd;
    }

    /**
     * @return {string}
     */
    toString()
    {
        let typeStr;

        if ( this.isPrimitive )
            typeStr = this.typeName;
        else if ( this.boundTo )
            typeStr = this.boundTo.name;
        else
            typeStr = 'no toString() defined on ' + this.constructor.name;

        return this.annotate_type( typeStr );
    }

    /**
     * @param constructorClass
     * @return {boolean}
     */
    isA( constructorClass )
    {
        return this instanceof constructorClass;
    }
}
