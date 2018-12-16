/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/

/**
 * @typedef {object} ValueType
 * @property {Type} basicType
 * @property {Type} definition
 * @property {Scope} [scope]
 */

/**
 * @typedef {object} Parameter
 * @property {number} index
 * @property {string} type
 */

/**
 * @typedef {object} Binding
 * @property {number} modifiers
 * @property {ValueType|Array<ValueType>} valueType
 * @property {Parameter} [parameter]
 */

/**
 * @typedef {object} Scope
 * @property {?Scope} outer
 * @property {Scope[]} inner
 * @property {ValueType} [createdBy]
 * @property {Map<string, Binding>} symbols
 * @property {object<string, Array<Binding>>} parameters
 */

import { safe }                from "../utils";
import { Type }                from "../types/base-type";
import { handle_kind, modify } from "../ts-utils";

/** */
class Scope {
    /**
     * @param {?Scope} [outer]
     * @param {ValueType} [createBy]
     */
    constructor( outer, createdBy ) {
        this.outer = outer;
        this.inner = [];
        this.createdBy = createdBy;
        /** @type {Map<string, Array<BindingVT>>} */
        this.symbols = new Map();
        this.parameters = {};
    }

    /**
     * @param {Scope} [scope]
     */
    add( scope ) {
        const s = scope || new Scope( this );

        this.inner.push( s );
    }

    /**
     * @param {string|symbol} name
     * @param {BindingVT} binding
     */
    bind( name, binding ) {
        const _name = safe( name );

        if ( this.symbols.has( name ) ) {
            if ( !binding.isOverloaded )
                throw new Error( `Duplicate identifier declaration "${_name}"` );

            const mangledName = binding.valueType.definition.getMangled( _name );
            const syms = this.symbols.get( name );
            const found = syms.find( prior => prior.valueType.definition.getMangled( _name ) === mangledName );

            if ( found )
                throw new Error( `Duplicate overloaded function found for "${_name}"` );

            syms.push( binding );
        }
        else
            this.symbols.set( name, [ binding ] );
    }

    bind_as_parameter( name, binding, paramType ) {
        this.bind( name, binding );

        if ( !this.parameters )
            this.parameters = {};

        const p = this.parameters[ paramType ] || ( this.parameters[ paramType ] = [] );

        p.push( binding );

        return p.length - 1;
    }
}

/** */
class BindingVT {
    /**
     * @param {?ts.Node} node
     * @param {ValueType|BindingVT} vt
     */
    constructor( node, vt ) {
        this.valueType = vt;
        this.value = void 0;
        modify( node, this );
        this.isOverloaded = vt.getBaseTypeAsString() === 'function';
        this.parameterIndex = 0;
    }
}

/**
 * @param {Scope} scope
 * @param {ts.Node} node
 * @param {string} [paramType]
 */
function create_bound_type( scope, node, paramType ) {
    // create value type
    const vt = create_value_type( node.type );

    // get the binding name, bind it to current scope
    const bindName = get_name( node );

    // bind the name and value type
    const binding = new BindingVT( node, vt );

    if ( paramType )
        this.parameterIndex = scope.bind_as_parameter( bindName, binding, paramType );
    else
        scope.bind( bindName, binding );

    return binding;
}

/** */
class ValueType extends Type {

    /**
     * @param {Type} vt
     */
    constructor( vt ) {
        super( vt.getBaseTypeAsString() );

        this.definition = vt;
        this.value = undefined;
    }
}

/**
 * @param {ts.Node} node
 */
function create_value_type( node ) {
    return new ValueType( handle_kind( node ) );
}

/**
 * @param {Scope} scope
 * @param {ts.Node} node
 * @param {string} type
 */
function create_parameter( scope, node, type ) {
    // create bound type as parameter
    return create_bound_type( scope, node, type );
}

function stringify( scope ) {
    // if parameters, display parameters in order
    // if type parameters, display type parameters in order
    // if type arguments, display type arguments in order
    //
    // for each symbol
    //      display symbol
    //      if has scope, stringify scope
}

/**
 * @param {Scope} scope
 * @param {string} query
 * @return {Binding|undefined}
 */
function find_symbol( scope, query ) {
    const syms = scope.symbols.get( query );

    if ( syms ) return syms;

    if ( scope.outer )
        return find_symbol( scope.outer, query );
}

function find_one( scope, query ) {
    const syms = find_symbol( scope, query );

    if ( !syms || syms.length !== 1 ) return;

    return syms[ 0 ];
}

function find_one_local( scope, query ) {
    const syms = find_local( scope, query );

    if ( !syms || syms.length !== 1 ) return;

    return syms[ 0 ];
}

function find_local( scope, name ) {
    return scope.symbols.get( name );
}
