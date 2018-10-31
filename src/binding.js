/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/

"use strict";

import { isSymbol, safe } from "./utils";
import { modifierFlags }  from "./ts-utils";

const dangerousNames = Object.getOwnPropertyNames( Object.getPrototypeOf( {} ) );

const escapeName = name => dangerousNames.includes( name ) || name.startsWith( '__' ) ? '__' + name : name;
const unescapeName = name => name.startsWith( '__' ) ? name.substr( 2 ) : name;

/**
 * A binding is
 *
 * 1. An identifier, a name, basically
 * 2. A type bound to that name
 * 3. A value (not somethinmg we're concerned with at the moment, unless...)
 *
 * name: Number
 * value: NumberConstructor
 * type: FunctionType
 *
 * name: Binding
 * value: Binding (definition below in source, better named BindingConstructor)
 * type: ConstructorType
 *
 * var myBinding = new Binding( xyz );
 *
 * name: myBinding
 * value: ObjectType (empty instance, except for constructor, as usual)
 *
 * function Binding( binding )
 * {
 *     return Object.create( Binding.prototype, { constructor: Binding } );
 * }
 *
 * @class Binding
 */
export class Binding
{
    /**
     * @param {BindingInfo} binding
     */
    constructor( binding )
    {
        this._parameterType = null;
        if ( binding.name ) this.name = binding.name;
        if ( binding.type ) this.type = binding.type;
        if ( binding.declaration ) this.declaration = binding.declaration;
        if ( binding.scope ) this.scope = binding.scope;
        if ( binding.parameter )
            this.parameter( binding.parameter, binding.parameterIndex );

        Object.values( modifierFlags ).forEach( key => binding[ key ] && ( this[ key ] = true ) );

        this.constraint = null;
        this.isKeyOf = false;

    }

    /**
     * @param {string} ptype
     * @param {number} index
     */
    parameter( ptype, index )
    {
        this._parameterType = ptype;
        this._index = index;
    }

    /**
     * @return {string}
     */
    get name()
    {
        return this._name ? unescapeName( safe( this._name ) ) : '';
    }

    /**
     * @param {string} name
     */
    set name( name )
    {
        this._name = isSymbol( name ) ? name : escapeName( name );
    }

    /**
     * @return {boolean}
     */
    get isParameter()
    {
        return !!this._parameterType;
    }

    /**
     * @return {?string}
     */
    get parameterType()
    {
        return this._parameterType;
    }

    /**
     * @return {?number}
     */
    get index()
    {
        return this._index;
    }

    /**
     * @param {boolean} opt
     * @return {Binding|boolean}
     */
    optional( opt )
    {
        if ( opt !== void 0 )
        {
            this._optional = !!opt;
            return this;
        }

        return this._optional;
    }

    /**
     * @param {boolean} isRest
     * @return {Binding|boolean}
     */
    rest( isRest )
    {
        if ( isRest !== void 0 )
        {
            this._rest = isRest;
            return this;
        }

        return this._rest;
    }

    /**
     * @return {string}
     */
    toString()
    {
        return `${this.name}: ${this.type}`;
    }
}
