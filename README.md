# type-system

> Type system for inference

Identifiers come in two forms:

1. Keywords
2. Symbols

## Keywords
Keywords are recognized by the compiler as such and are not stored in any symbol table except such as might be required internally. Some keywords represent types and the correct type will be substitutesd in its place, either as a value type or a boxed variant, depending on grammar production.

## Symbol
Symbols are identifers defined arbitrarily by the programmer and, as such, are associated with a potential value and a type (here we acknowledge `void` as a type).

### Structured Types
A structured type, a type that consists of more than one addressable symbol, are invariably defined by the user. They are built up of the keyword types discussed earlier. A class, for example, is a structured type that comprises a number of functions (methods) and variables (properties), each of which are addressable (or accessed using) through some scoped symbol or indexing method. Ultimately, the various components that make up a structured type boil down to the basic atomic keyword types. Don't be mislead by the fact that many languages provide methods on supposedly basic types. For example, in JavaScript we see the following:

```
"Hello, World!".toLowerCase()
```

being a complete valid expression. What gives? In this case, the grammar production that results from the pattern `PRIMITIVE_LITERAL DOT identifier CALL_EXPRESSION` tells the compiler that it needs to "box" the primitive. In other words, there are frequently a class associated with the primitive (keyword) types. This is a class that wraps (or boxes) the primitive value and performs operations on it. The class is brought into existence when the `DOT` appears in the syntax and promptly disappears immediately afterwards. The `toLowerCase()` is _not_ performed on the primitive string value, which has no parts, it's not structured, but is performed on a class that receives the primitive string value and, subsequently, performs the invoked operation on the orimitive and returns the result. Such boxed operations almost always return a new version of the primitive value it was performed on. Most primitives are treated as immutable by most languages with some pesky exceptions. Strings are almost always immutable, meaning every boxed operation that is performed on a string yields an entirely new string and the previous string is discarded. Arrays and objects (`struct`) are _not_ primitive types.

## Types
Types can appear in two forms. Either as a type associated with an identifier and, possibly, a value that conforms to the comstraints of that type, or they appear transiently in an anonymous form as intermediates during multi-stage compiler calculations or static analysis.

For example, the expression `a * ( b + c )` would be built up in the following manner.

Note: The AST nodes would be a binary expression (MULT) with LEFT being the defined type of `a` and RIGHT the ephemeral node of another binary expression PLUS with a LEFT of the defined type of `b` and a RIGHT with a defined type of  `b`. The PLUS node would have a type but no name as it was not defined by the programmer but came into existence temporarily when the compiler needed to store the imtermediate result coming out of the calculation `b + c`. Likewise, the node MULT would have an unnamed type, the result of multiplying the LEFT type with the temporary type of PLUS. So expressions have types at the leaves that travel up, all the way to the top node of the expression. Statements, however, do not which is the fundamental difference between a  statement and an expression. An expression has a value at all points in its execution graph while a statement does not. A statement yields no resulting value. So a function declaration has no value (it does have a type, namely a function declaration associated with a symbol, its name) but a function expression does, since such an expression yields a value: a function.


## Defining Internally
Every non-transient definition has three fields associated with it.
1. An identifier (could be computed or binding pattern)
2. A value
3. A type

For a variable declaration, such as
```typescript
declare var onafterprint: ((this: Window, ev: Event) => any) | null;
```
it would be
```js
const def = {
    name: 'onafterprint',
    value: instOfCallableType,
    type: 'object'
};
```

## Notes

```typescript
/**
 * 1. Defined as generic.
 * 2. Two type parameters in local scope under global scope
 * 3. Each is a reference with name and unresolved
 * 4. Type (return type) is Number
 * 
 * Local scope holds
 * S ref void
 * T ref void
 * 
 * @param thing
 * @param other
 */
function func<S, T>(thing: S, other: T): number;

    interface FuncObject {
    };

/**
 * 1. Defined as generic
 * 2. One type parameter in local scope under global scope
 * 3. Return type is Number
 * 
 * `derived` scope holds
 * S ref void
 * func' ref func
 * 
 * func' scope holds
 * S ref derived.S
 * T ref Number
 * 
 * @param thingy
 */
function derived<S>(thingy: S): FuncObject {

    interface FuncObject<S> {
        f: func<S, Number>  
    };
    

    /**
     * 1. Defined as generic func' (new type) 
     * 1. Copy of func type
     * 2. Two type parameters
     * 3. S is unresolved
     * 4. T is a reference resolved to Number
     * 5. Return type is Number, corresponding to function return type
     */
    
    return {
        f : func<S, number> = (thingy, 10) {
            return s.length * number;
        };
    };
};

/**
 * Derived (in situ) is a new, actual, type:
 * 1. Define as a type
 * 2. Copy of `derived` type
 * 3. One type parameter
 * 4. S is a reference to String
 * 
 * `derived<string>` node scope holds
 * S ref String
 * derived' ref derived
 * 
 * `derived<Array<string>>` node scope holds
 * S ref Array<string>
 * derived' ref derived
 */
const strlng : number = derived<string>( "Hello" );
const arrlng : number = derived<Array<string>>( ["a", "b"] );

console.log( `s: ${strlng}, a: ${arrlng}` );

```

When defining a generic

* create a generic type with a scope
* add type parameters to scope as unresolved references

When instantiating a generic as a new generic (partially resolved)

* create a generic with a scope (copy of generic)
* for each type parameter, create scope entry
* unresolved parameters are added as unresolved references
* resolved parameters are added as resolved references

When instantiating a generic as a type (fully resolved)

* create a type with a scope (copy of generic)
* for each type parameter, add type reference in scope with resolution

When resolving a type based on a generic type

* use scopes as normal (literal context)
* also use instantiation scope chain

## Install

```sh
npm i type-system
```

## Usage

```js
const 
    typeSystem = require( 'type-system' );

typeSystem() // true
```

## License

MIT © [Julian Jensen](https://github.com/julianjensen/type-system)

