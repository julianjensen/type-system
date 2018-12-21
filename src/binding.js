/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/

import { baseTypesToString, modify } from "./ts-utils";
import { ValueType }                 from "./value-type";
import { Scope }                     from "./scope";
import { get_primitive }             from "./types/primitives";
import { TypeReference }             from "./types/reference";
import { ObjectType }                from "./types/object-type";
import { Type }                      from "./types/base-type";
import { safe }                      from "./utils";

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
        this.isOverloaded = vt.definition.getBaseTypeAsString() === 'function';
        this.parameterIndex = 0;
        this.entered = null;
        this.isType = true;

        this.isRest = false;
        this.isOptional = false;
        this.makeReadWrite = false;
        this.makeReadonly = false;
        this.isReadonly = false;

        if ( node ) modify( node, this );
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

    /**
     * @return {?ValueType}
     */
    get valueType()
    {
        if ( this._valueType instanceof Binding )
            return this._valueType.valueType;

        return this._valueType;
    }

    /**
     * @param {?ValueType} vt
     */
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
        return this.valueType && this.valueType.getBaseTypeAsString();
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

    add_modifiers( str )
    {
        str = safe( str );

        if ( this.makeReadonly )
            str = `+readonly ${str}`;
        else if ( this.makeReadWrite )
            str = `-readonly ${str}`;

        if ( this.isReadonly )
            str = `readonly ${str}`;

        if ( this.isOptional )
            str = `${str}?`;

        if ( this.isRest )
            str = `...${str}`;

        return str;
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

    /**
     * @param {?string} [name]
     * @return {string}
     */
    getMangled( name )
    {
        return this.valueType.getMangled( name );
    }

    getType()
    {
        return this.valueType && this.valueType.definition;
    }

    isIdenticalType( check )
    {
        const type = this.getType();

        if ( !type ) return false;

        if ( check instanceof Binding )
            check = check.getType();
        else if ( !( check instanceof Type ) )
            throw new Error( `Checking for identical type against a ${check.constructor.name}` );

        return type instanceof check.constructor;
    }
}

/**
 * @param {Scope} scope
 * @param {string|symbol} bindName
 * @param {ts.Node|Type} node
 * @param {string} [paramType]
 * @return {Binding}
 */
export function create_bound_type( scope, bindName, node, paramType )
{
    let specialType, vt, binding;
    const typeNode = node.parameters ? ( node || node.type ) : ( node.type || node );

    if ( node instanceof Type )
        binding = new Binding( null, new ValueType( node ) );
    else
    {
        if ( baseTypesToString[ typeNode.kind ] )
            specialType = get_primitive( baseTypesToString[ typeNode.kind ] );

        // create value type
        vt = specialType || ValueType.create( typeNode );

        // bind the name and value type
        binding = new Binding( node, vt );
    }

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

    // console.error( `bindName: ${bindName}, kind: ${typeNode.kind}, "kind": ${syntaxKind[ typeNode.kind ]}, toString: ${baseTypesToString[ typeNode.kind ]}` );
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

