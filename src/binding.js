/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/

import { baseTypesToString, handle_kind, modify } from "./ts-utils";
import { ValueType }                              from "./value-type";
import { Scope }                                  from "./scope";
import { get_primitive }                          from "./types/primitives";
import { syntaxKind }                             from "./ts-helpers";
import { SyntaxKind }                             from "typescript";
import { TypeReference }                          from "./types/reference";
import { ObjectType }                             from "./types/object-type";

/** */
export class Binding
{
    /**
     * @param {?ts.Node} node
     * @param {ValueType|Binding} vt
     */
    constructor( node, vt )
    {
        this.valueType = vt;
        this.value = void 0;
        if ( node ) modify( node, this );
        this.isOverloaded = vt.definition.getBaseTypeAsString() === 'function';
        this.parameterIndex = 0;
        this.entered = null;
        this.isType = true;
    }

    isA( constructorClass )
    {
        return !!this.valueType && !!this.valueType.definition && this.valueType.definition.isA( constructorClass );
    }

    asVariable()
    {
        this.isType = false;
        return this;
    }

    get valueType()
    {
        if ( this._valueType instanceof Binding )
            return this._valueType.valueType;

        return this._valueType;
    }

    set valueType( vt )
    {
        this._valueType = vt;
    }

    get scope()
    {
        return this.valueType && this.valueType.scope;
    }

    /**
     * @return {?string}
     */
    getBaseTypeAsString()
    {
        if ( !this.valueType || !this.valueType.definition )
            return null;

        return this.valueType.definition.getBaseTypeAsString();
    }

    enter()
    {
        if ( !this.entered && this.valueType && this.valueType.scope )
            this.entered = Scope.descend( this.valueType.scope );
    }

    exit()
    {
        if ( this.entered )
        {
            Scope.ascend();
            this.entered = null;
        }
    }

    toString()
    {
        return `${this.valueType}`;
    }

    /**
     * @param {Array<Binding>} bindings
     * @param {Function} constructorClass
     * @return {boolean}
     */
    static isExactlyA( bindings, constructorClass )
    {
        return bindings.length === 1 && bindings[ 0 ].isA( constructorClass );
    }

    static areAll( bindings, ...constructorClasses )
    {
        return bindings.every( binding => constructorClasses.some( constr => binding.isA( constr ) ) );
    }

    static hasExactlyOne( bindings, constructorClass )
    {
        const first = bindings.findIndex( binding => binding.isA( constructorClass ) );
        const next = first !== -1 ? bindings.slice( first + 1 ).findIndex( binding => binding.isA( constructorClass ) ) : first;

        return first !== -1 && next === -1;
    }

    static getExactlyOne( bindings, constructorClass )
    {
        const first = bindings.findIndex( binding => binding.isA( constructorClass ) );
        const next = first !== -1 ? bindings.slice( first + 1 ).findIndex( binding => binding.isA( constructorClass ) ) : first;

        return first !== -1 && next === -1 ? bindings[ first ] : null;
    }

    static without( bindings, constructorClass )
    {
        return bindings.filter( binding => !binding.isA( constructorClass ) );
    }
}

/**
 * @param {Scope} scope
 * @param {string|symbol} bindName
 * @param {ts.Node} node
 * @param {string} [paramType]
 * @return {Binding}
 */
export function create_bound_type( scope, bindName, node, paramType )
{
    let specialType;
    const typeNode = node.type || node;

    // console.error( `bindName: ${bindName}, kind: ${typeNode.kind}, "kind": ${syntaxKind[ typeNode.kind ]}, toString: ${baseTypesToString[ typeNode.kind ]}` );
    if ( baseTypesToString[ typeNode.kind ] )
        specialType = get_primitive( baseTypesToString[ typeNode.kind ] );
    // else if ( typeNode.kind === SyntaxKind.LiteralType )
    //     specialType = new ValueType( handle_kind( typeNode ) );

    // create value type
    const vt = specialType || ValueType.create( typeNode );

    // bind the name and value type
    const binding = new Binding( node, vt );

    if ( paramType )
        binding.parameterIndex = scope.bind_as_parameter( bindName, binding, paramType );
    else
        scope.bind( bindName, binding );

    return binding;
}

/**
 * @param {Scope} scope
 * @param {string|symbol} bindName
 * @param {ts.Node} node
 * @return {Binding}
 */
export function create_bound_variable( scope, bindName, node )
{
    let specialType;
    const typeNode = node.type || node;

    console.error( `bindName: ${bindName}, kind: ${typeNode.kind}, "kind": ${syntaxKind[ typeNode.kind ]}, toString: ${baseTypesToString[ typeNode.kind ]}` );
    if ( baseTypesToString[ typeNode.kind ] )
        specialType = get_primitive( baseTypesToString[ typeNode.kind ] );

    // create value type
    const vt = specialType || ValueType.create( typeNode );

    // bind the name and value type
    const binding = new Binding( node, vt ).asVariable();

    scope.bind( bindName, binding );

    return binding;
}

/**
 * ## Thoughts on symbol resolution with duplicates
 *
 * 1. Resolve symbol
 * 2. Not found, goto end
 * 3. Remove type references
 * 4. Anything left? No, goto end
 * 5. Is there more than 1 thing left? Yes, goto duplicate error or something (how would this happen?)
 * 6. Is it an interface? No, duplicate type conflict thingy
 * 7. Add onto interface
 *
 *
 * @return {?Binding|undefined}
 */
export function definition_resolution( name )
{
    let resolutions = Scope.current.resolve( name );

    if ( !resolutions || resolutions.length === 0 ) return;

    resolutions = Binding.without( resolutions, TypeReference );

    if ( resolutions.length === 0 ) return;

    if ( resolutions.length !== 1 )
        throw new Error( `WTF?!?!? More than 1 resolutions left for "${name}"` );

    if ( !Binding.isExactlyA( resolutions, ObjectType ) )
        throw new Error( `Duplicate definition of "${name}"` );

    return resolutions[ 0 ];
}

