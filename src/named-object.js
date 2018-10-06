/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/
"use strict";

import { isSymbol, safe } from "./utils";

const dangerousNames = Object.getOwnPropertyNames( Object.getPrototypeOf( {} ) );

const escapeName = name => dangerousNames.includes( name ) || name.startsWith( '__' ) ? '__' + name : name;
const unescapeName = name => name.startsWith( '__' ) ? name.substr( 2 ) : name;

const INamedObject = superclass => class NamedObject extends superclass
{

    /**
     * @namespace NamedObject
     */

    /**
     * @param args
     */
    constructor( ...args )
    {
        super( ...args );

        this._parameter = this._typeParameter = void 0;
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
        return typeof this._parameter === 'number';
    }

    /**
     * @return {boolean}
     */
    get isTypeParameter()
    {
        return typeof this._typeParameter === 'number';
    }

    /**
     * @param {number} [index]
     * @return {?number|NamedObject}
     */
    parameterIndex( index )
    {
        if ( index === void 0 )
            return this._parameter;

        this._parameter = index;
        return this;
    }

    /**
     * @param {number} [index]
     * @return {?number|NamedObject}
     */
    typeParameterIndex( index )
    {
        if ( index === void 0 )
            return this._typeParameter;

        this._typeParameter = index;
        return this;
    }
};

const NamedObject = INamedObject( class {} );

export { NamedObject, INamedObject, escapeName, unescapeName };
