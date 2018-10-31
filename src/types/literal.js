/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/
"use strict";

import { Type }       from "./base-type";
import { SyntaxKind } from "../ts-helpers";
import { Scope }      from "../scope";

/** */
export class LiteralType extends Type
{
    /** */
    constructor()
    {
        super( 'literal' );
        this.value = null;
        this.literalType = null;
    }

    /**
     * @param {string} v
     * @return {LiteralType}
     */
    value( v )
    {
        this.value = v;
        return this;
    }

    /**
     * @param {SyntaxKind} t
     * @return {LiteralType}
     */
    valueType( t )
    {
        const keyword = SyntaxKind[ t ].replace( /^(.*)Literal$/, '$1' ).toLowerCase();
        this.literalType = Scope.global.resolve( keyword );
        return this;
    }

    /**
     * @return {string}
     */
    toString()
    {
        switch ( `${this.literalType.type}` )
        {
            case 'string':
                return `"${this.value}"`;

            case 'number':
                return String( Number( this.value ) );

            case 'boolean':
                return String( this.value === 'true' );

            default:
                return `Unknown literal type: ${this.literalType.type}`;
        }
    }
}
