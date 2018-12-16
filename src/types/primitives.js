/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/

import { Type }            from "./base-type";
import { declare_handler } from "../ts-utils";
import { SyntaxKind }      from "typescript";
import { ObjectType }      from "./object-type";
import { Binding }         from "../binding";
import { ValueType }       from "../value-type";
import { Scope }           from "../scope";
import { asArray }         from "../utils";

/** */
export class Primitive extends Type
{
    /**
     * @param {string} baseTypeName
     */
    constructor( baseTypeName )
    {
        super( baseTypeName );
        this.baseType = baseTypeName;
        this.isPrimitive = true;
    }
}

/**
 * @extends Type
 */
class AnyType extends Primitive
{
    /** */
    constructor()
    { super( 'any' ); }
}

/**
 * @extends Primitive
 */
class NumberType extends Primitive
{
    /** */
    constructor()
    { super( 'number' ); }
}

/**
 * @extends Primitive
 */
class StringType extends Primitive
{
    /** */
    constructor()
    { super( 'string' ); }
}

/**
 * @extends Primitive
 */
class BooleanType extends Primitive
{
    /** */
    constructor()
    { super( 'boolean' ); }
}

/**
 * @extends Primitive
 */
class SymbolType extends Primitive
{
    /** */
    constructor()
    { super( 'symbol' ); }
}

/**
 * @extends Primitive
 */
class NullType extends Primitive
{
    /** */
    constructor()
    { super( 'null' ); }
}

/**
 * @extends Primitive
 */
class UndefinedType extends Primitive
{
    /** */
    constructor()
    { super( 'undefined' ); }
}


/**
 * @extends Primitive
 */
class VoidType extends Primitive
{
    /** */
    constructor()
    { super( 'void' ); }
}

/**
 * @extends Primitive
 */
class ThisType extends Primitive
{
    /** */
    constructor()
    { super( 'this' ); }
}

/**
 * @extends Type
 */
class NeverType extends Primitive
{
    /** */
    constructor()
    { super( 'never' ); }
}

const autoAdd = [
    [ 'any', AnyType, SyntaxKind.AnyKeyword ],
    [ 'number', NumberType, SyntaxKind.NumberKeyword ],
    [ 'string', StringType, SyntaxKind.StringKeyword ],
    [ 'boolean', BooleanType, SyntaxKind.BooleanKeyword ],
    [ 'true', BooleanType, SyntaxKind.TrueKeyword ],
    [ 'false', BooleanType, SyntaxKind.FalseKeyword ],
    [ 'symbol', SymbolType, SyntaxKind.SymbolKeyword ],
    [ 'undefined', UndefinedType, SyntaxKind.UndefinedKeyword ],
    [ 'object', ObjectType, SyntaxKind.ObjectKeyword ],
    [ 'null', NullType, SyntaxKind.NullKeyword ],
    [ 'void', VoidType, SyntaxKind.VoidKeyword ],
    [ 'never', NeverType, SyntaxKind.NeverKeyword ],
    [ 'this', ThisType, [ SyntaxKind.ThisKeyword, SyntaxKind.ThisType ] ]
    // [ 'this', ThisType, SyntaxKind.ThisType ]
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

    autoAdd.forEach( ( [ name, Klass, kind ] ) => {
        localMap[ name ] =  new ValueType( new Klass() );

        Scope.current.bind( name, new Binding( void 0, localMap[ name ] ) );
        primitiveMap.set( name, localMap[ name ] );
        primitiveMap.set( kind, localMap[ name ] );
        asArray( kind  ).forEach( k => declare_handler( () => localMap[ name ], k ) );
    } );
}

