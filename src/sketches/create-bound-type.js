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
