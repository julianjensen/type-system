# type-system

> Type system for inference


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

