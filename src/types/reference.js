/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/
"use strict";

import { Scope }                        from "../scope";
import { Type }                         from "./base-type";
import { declare_handler, entity_name } from "../ts-utils";
import { type_creator }                 from "../utils";
import { SyntaxKind }                   from "../ts-helpers";

/**
 * @extends Type
 */
export class TypeReference extends Type
{
    /** */
    constructor()
    {
        super( 'reference' );
        this.resolvesTo = null;
        this.typeArguments = null;
    }

    /**
     * @param {string|Type} name
     */
    resolve( name )
    {
        if ( typeof name === 'string' )
            this.resolvesTo = Scope.current.resolve( name );
        else
            this.resolvesTo = name;

        return this.resolvesTo;
    }

    /**
     * @return {Type}
     */
    follow()
    {
        if ( !this.resolvesTo )
            throw new Error( `Unable to follow unresolved reference` );

        let p = this.resolvesTo;

        if ( p && p instanceof TypeReference )
            return p.follow();

        return p;
    }
}

function new_type_reference( node )
{
    const refName = entity_name( node.typeName );
    const typeArgs = node.typeArguments && node.typeArguments.length && node.typeArguments;
    const ref = new TypeReference();

    if ( typeArgs )
        ref.typeArguments = typeArgs.map( type_creator );

    ref.resolve( refName );
}

declare_handler( SyntaxKind.TypeReference, new_type_reference );
