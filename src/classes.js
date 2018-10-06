/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/
"use strict";


import { Type }                      from "./base-type";
import { mix }                       from "mixwith";
import { INamedObject }              from "./named-object";
import { italic }                    from "./utils";
import { ObjectType }                from "./instance";
import { Scope }                     from "./scope";
import { IIndexedType, IMappedType } from "./interfaces";

/**
 * @extends Type
 */
class AnyType extends Type
{
    /** */
    constructor()
    { super( 'any' ); }
}

/**
 * @extends Type
 */
class NumberType extends Type
{
    /** */
    constructor()
    { super( 'number' ); }
}

/**
 * @extends Type
 */
class StringType extends Type
{
    /** */
    constructor()
    { super( 'string' ); }
}

/**
 * @extends Type
 */
class BooleanType extends Type
{
    /** */
    constructor()
    { super( 'boolean' ); }
}

/**
 * @extends Type
 */
class VoidType extends Type
{
    /** */
    constructor()
    { super( 'void' ); }
}

/**
 * @extends Type
 * @implements NamedObject
 */
class Union extends mix( Type ).with( INamedObject )
{
    constructor( name = italic`anonymous` )
    {
        super( italic`union` );
        this.__name = name;
        this.types = [];
    }

    add( type )
    {
        this.types.push( type );
    }

    has( typeClass )
    {
        return this.types.some( t => t instanceof typeClass );
    }

    same( typeInst )
    {
        return this.types.some( t => t.constructor === typeInst.constructor );
    }

    toString()
    {
        return this.types.map( t => `${t}` ).join( ' | ' );
    }
}

/**
 * @extends ObjectType
 */
class ArrayType extends ObjectType
{
    constructor( name = italic`anonymous` )
    {
        super( 'array-type' );
        this.__name = name;
        this.scope = Scope.current.add_inner( this );
        this.elementType = null;
    }

    toString()
    {
        return `${this.elementType}[]`;
    }
}


/** */
class MappedType extends mix( Type ).with( IMappedType, INamedObject ) {}

/** */
class IndexedType extends mix( Type ).with( IIndexedType, INamedObject ) {}

export {
    AnyType,
    NumberType,
    StringType,
    BooleanType,
    VoidType,
    ArrayType,
    Union,
    MappedType,
    IndexedType
};
