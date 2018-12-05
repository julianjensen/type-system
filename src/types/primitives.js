/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/

import { Type }                               from "./base-type";
import { Scope }                              from "../scope";
import { baseTypesToString, declare_handler } from "../ts-utils";
import { SyntaxKind }                         from "typescript";
import { ObjectType }                         from "./object-type";
import { Binding }                            from "../binding";

/** */
export class Primitive extends Type
{
    isPrimitive = true;
}

/**
 * @extends Type
 */
class AnyType extends Primitive
{
    /** */
    constructor()
    { super( 'any' ); this.baseType = baseTypesToString[ SyntaxKind.AnyKeyword ]; }
}

/**
 * @extends Primitive
 */
class NumberType extends Primitive
{
    /** */
    constructor()
    { super( 'number' ); this.baseType = baseTypesToString[ SyntaxKind.NumberKeyword ]; }
}

/**
 * @extends Primitive
 */
class StringType extends Primitive
{
    /** */
    constructor()
    { super( 'string' ); this.baseType = baseTypesToString[ SyntaxKind.StringKeyword ]; }
}

/**
 * @extends Primitive
 */
class BooleanType extends Primitive
{
    /** */
    constructor()
    { super( 'boolean' ); this.baseType = baseTypesToString[ SyntaxKind.BooleanKeyword ]; }
}

/**
 * @extends Primitive
 */
class SymbolType extends Primitive
{
    /** */
    constructor()
    { super( 'symbol' ); this.baseType = baseTypesToString[ SyntaxKind.SymbolKeyword ]; }
}

/**
 * @extends Primitive
 */
class NullType extends Primitive
{
    /** */
    constructor()
    { super( 'null' ); this.baseType = baseTypesToString[ SyntaxKind.NullKeyword ]; }
}

/**
 * @extends Primitive
 */
class UndefinedType extends Primitive
{
    /** */
    constructor()
    { super( 'undefined' ); this.baseType = baseTypesToString[ SyntaxKind.UndefinedKeyword ]; }
}


/**
 * @extends Primitive
 */
class VoidType extends Primitive
{
    /** */
    constructor()
    { super( 'void' ); this.baseType = baseTypesToString[ SyntaxKind.VoidKeyword ]; }
}

/**
 * @extends Primitive
 */
class ThisType extends Primitive
{
    /** */
    constructor()
    { super( 'this' ); this.baseType = baseTypesToString[ SyntaxKind.ThisKeyword ]; }
}

/**
 * @extends Type
 */
class NeverType extends Primitive
{
    /** */
    constructor()
    { super( 'never' ); this.baseType = baseTypesToString[ SyntaxKind.NeverKeyword ]; }
}

const autoAdd = [
    [ 'any', AnyType, SyntaxKind.AnyKeyword ],
    [ 'number', NumberType, SyntaxKind.NumberKeyword ],
    [ 'string', StringType, SyntaxKind.StringKeyword ],
    [ 'boolean', BooleanType, SyntaxKind.BooleanKeyword ],
    [ 'bool', BooleanType ],
    [ 'true', BooleanType, SyntaxKind.TrueKeyword ],
    [ 'false', BooleanType, SyntaxKind.FalseKeyword ],
    [ 'symbol', SymbolType, SyntaxKind.SymbolKeyword ],
    [ 'undefined', UndefinedType, SyntaxKind.UndefinedKeyword ],
    [ 'object', ObjectType, SyntaxKind.ObjectKeyword ],
    [ 'null', NullType, SyntaxKind.NullKeyword ],
    [ 'void', VoidType, SyntaxKind.VoidKeyword ],
    [ 'never', NeverType, SyntaxKind.NeverKeyword ],
    [ 'this', ThisType, SyntaxKind.ThisKeyword ],
    [ 'this', ThisType, SyntaxKind.ThisType ]
];

/**
 * @type {Map<string|SyntaxKind, Binding>}
 */
const primitiveMap = new Map();

/**
 * @param {string} strSymbol
 * @return {Binding}
 */
export function get_primitive( strSymbol )
{
    return primitiveMap.get( strSymbol );
}

/**
 *
 */
export function primitive_init()
{
    const localMap = {};
    let booleanType = null;

    autoAdd.forEach( ( [ name, Klass, kind ] ) => {
        const kls = new Klass();
        kls.baseType = name;

        kls.isPrimitive = true;
        localMap[ name ] = new Binding( { name, value: kls, type: name } );
        primitiveMap.set( name, localMap[ name ] );
        primitiveMap.set( kind, localMap[ name ] );
        if ( name === 'boolean' ) booleanType = kls;
        if ( kind ) declare_handler( () => localMap[ name ].value, kind );
    } );

    // declare_handler( () => localMap.any, SyntaxKind.AnyKeyword );
    // declare_handler( () => localMap.number, SyntaxKind.NumberKeyword );
    // declare_handler( () => localMap.string, SyntaxKind.StringKeyword );
    // declare_handler( () => localMap.boolean, SyntaxKind.BooleanKeyword );
    // declare_handler( () => localMap.symbol, SyntaxKind.SymbolKeyword );
    // declare_handler( () => localMap.undefined, SyntaxKind.UndefinedKeyword );
    // declare_handler( () => localMap.object, SyntaxKind.ObjectKeyword );
    // declare_handler( () => localMap[ 'null' ], SyntaxKind.NullKeyword );
    // declare_handler( () => localMap[ 'void' ], SyntaxKind.VoidKeyword );
    // declare_handler( () => localMap[ 'never' ], SyntaxKind.NeverKeyword );
    // declare_handler( () => localMap.this, SyntaxKind.ThisKeyword, SyntaxKind.ThisType );

    // const trueLit = Scope.global.bind( new Binding( {
    //     name: 'true',
    //     value: true,
    //     type: localMap[ 'boolean' ]
    // } ) );
    //
    // const falseLit = Scope.global.bind( new Binding( {
    //     name: 'false',
    //     value: false,
    //     type: localMap[ 'boolean' ]
    // } ) );
    //
    // declare_handler( () => trueLit.type, SyntaxKind.TrueKeyword );
    // declare_handler( () => falseLit.type, SyntaxKind.FalseKeyword );
}

