/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/
"use strict";

import { Type } from "./base-type";

/**
 * @extends Type
 */
export class ObjectType extends Type
{
    /**
     * @param {string} [override]
     */
    constructor( override )
    {
        super( override || 'object', true );
    }
}

/**
 * @extends ObjectType
 */
export class TypeLiteral extends ObjectType
{
    /** */
    constructor()
    {
        super( 'typeliteral' );
    }
}
