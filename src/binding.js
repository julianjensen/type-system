/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/

import { BIND_ALLOC, isFunction, isObject, isString, isSymbol, safe } from "./utils";
import { modifierFlags, modify }                                                          from "./ts-utils";
import { Scope }                                                                          from "./scope";
import { SyntaxKind }                                                                     from "typescript";
import { Type }                                                                           from "./types/base-type";

const dangerousNames = Object.getOwnPropertyNames( Object.getPrototypeOf( {} ) );

const escapeName = name => dangerousNames.includes( name ) || name.startsWith( '__' ) ? '__' + name : name;
const unescapeName = name => name.startsWith( '__' ) ? name.substr( 2 ) : name;

/** */
class Overload
{
    /**
     * @param {...Binding} bindings
     */
    constructor( ...bindings )
    {
        this.overloaded = false;
        /** @type {Array<Binding>} */
        this.overloads = bindings;
    }

    add( binding )
    {
        this.overloads.push( binding );
    }

    get()
    {
        return this.overloads;
    }
}


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
 * @implements {BindingInfo}
 */
export class Binding extends Overload
{
    /**
     * @param {BindingInfo|object} binding
     */
    constructor( binding )
    {
        // if ( isString( binding.type ) && binding.type === 'unknown' )
        // {
        //     console.error( 'UNKNOWN: ' + binding.name );
        //     console.error( new Error().stack );
        // }
        super();

        if ( isObject( binding.value ) )
        {
            const v = binding.value;

            if ( v.scope )
                v.scope.set_owner( this );

            v.boundTo = this;

            if ( v.hasMangled() )
                this.mangled = v.getMangled( isSymbol( binding.name ) ? '' : binding.name );
        }

        // if ( isObject( binding.value ) ) binding.value.boundTo = binding;

        this._parameterType = null;
        this.bindType = binding.bindType || BIND_ALLOC;

        if ( binding.name ) this.name = binding.name;
        if ( binding.type ) this.type = binding.type;
        if ( binding.value ) this.value = binding.value;

        if ( !binding.type && this.value && this.value.constructor.name.endsWith( 'Type' ) ) this.type = 'abstract';

        if ( binding.declaration ) this.declaration = binding.declaration;
        if ( binding.scope ) this.scope = binding.scope;
        if ( binding.parameter && binding.name !== 'this' )
            this.parameter( binding.parameter, binding.parameterIndex );

        if ( binding.declaration )
            modify( binding.declaration, this );

        Object.values( modifierFlags ).forEach( key => binding[ key ] && ( this[ key ] = true ) );

        this.constraint = null;
        this.isKeyOf = false;

        if ( this.declaration )
            modify( this.declaration, this );
    }

    /**
     * @return {string|symbol}
     */
    get realName()
    {
        return this._name;
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

    get properTypeName()
    {
        return this.isTypeDefinition() ? this.name : this.type;
    }

    /**
     * @param {string} ptype
     * @param {number} [index]
     */
    parameter( ptype, index = Scope.current.getIndex( ptype ) )
    {
        this._parameterType = ptype;
        this._index = index;
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
     * @param {string} str
     * @return {string}
     */
    annotate_name( str )
    {
        if ( this.isOptional )
            str += '?';

        return str;
    }

    has_decl()
    {
        if ( !Array.isArray( this.declaration ) )
            return Binding.is_decl( this.declaration );

        if ( this.declaration ) return false;

        return this.declaration.some( Binding.is_decl );
    }

    /**
     * @return {string}
     */
    toString()
    {
        const strValue = this.value ? `${this.value}` : '<no value>';
        const base = isObject( this.type ) ? this.type : isObject( this.value ) ? this.value : this.type || this.value;
        if ( !base ) {
            console.error( 'wtf:', this );
        }
        const baseTypeStr = isString( base ) ? base : ( isFunction( base.getBaseTypeAsString ) ? base.getBaseTypeAsString() : ( base || "<missing type>" ) );

        // if ( !isFunction( this.type.getBaseTypeAsString ) )
        // {
        //     console.error( 'getBaseTypeAsString is a ', typeof this.type.getBaseTypeAsString );
        //     console.error( `and the class construtor is a ${this.type.constructor.name}` );
        //     console.error( `and the type is ${this.type}` );
        // }

        return `[Binding -> name: "${this.annotate_name( this.name )}", type: ${baseTypeStr}, value: ${strValue}]`;
    }

    /**
     * @return {boolean}
     */
    isTypeDefinition()
    {
        return this.value instanceof Type;
    }

    /**
     * @return {boolean}
     */
    isValueDeclaration()
    {
        return !this.isTypeDefinition();
    }

    static is_decl( node )
    {
        return SyntaxKind[ node.kind ].endsWith( 'Declaration' );
    }
}
