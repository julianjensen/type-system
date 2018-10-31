/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/
"use strict";

import { Type } from "./base-type";
import { Scope } from "../scope";

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
 *
 */
export function primitive_init()
{
    const autoAdd = [
        [ 'any', AnyType ],
        [ 'number', NumberType ],
        [ 'string', StringType ],
        [ 'boolean', BooleanType ],
        [ 'bool', BooleanType ],
        [ 'void', VoidType ]
    ];

    autoAdd.forEach( ( [ name, Klass ] ) => {
        const kls = new Klass();

        kls.isPrimitive = true;
        Scope.global.bind( { name, type: kls } );
    } );
}
