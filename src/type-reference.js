/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/
"use strict";

import { NamedObject }                               from "./named-object";
import { Scope }                                     from "./scope";
import { $, safe, type_creator }                     from "./utils";
import { declare_handler, entity_name, handle_type } from "./ts-utils";
import { SyntaxKind }                                from "./ts-helpers";

const
    unresolved = new Set();

/**
 * @class
 * @extends NamedObject
 */
export class TypeReference extends NamedObject
{
    constructor( name, typeArguments )
    {
        super();
        this.name = name;
        this.typeArguments = typeArguments;
        this.resolvesTo = Scope.current.resolve( name );
        this.isResolved = !!this.resolvesTo;
        this.isGenericType = false;
        this.scope = Scope.current;
        if ( !this.isResolved )
            unresolved.add( this );
    }

    defer_resolve()
    {
        if ( this.isResolved ) return true;

        this.resolvesTo = this.scope.resolve( this.name );

        this.isResolved = !!this.resolvesTo;

        return this.isResolved;
    }

    genericType( yesNo = true )
    {
        this.isGenericType = yesNo;
        return this;
    }

    resolve( type )
    {
        this.resolvesTo = type;
        this.isResolved = true;

        return this;
    }

    toString()
    {
        const ta = this.typeArguments.length ? `<${this.typeArguments.map( _ => `${_}` )}>` : '';

        if ( !this.isResolved ) return safe( this.name ) + ta + "*";

        return $( this.name );

        if ( this.resolvesTo instanceof TypeReference )
            return this.resolvesTo.toString() + ta + '^';

        // const name = this.resolvesTo.name || this.resolvesTo.__name;
        // const debugName = this.resolvesTo.__name || this.resolvesTo.name;
        //
        // return name === debugName ? `${name}${ta}~` : `${name} (${debugName})${ta}~`;
    }

    /**
     * @param {?string|ts.TypeReferenceNode} _
     * @param {ts.TypeReferenceNode} [node]
     */
    static read( _, node = _ )
    {
        const name = entity_name( node.typeName );
        const typeArguments = node.typeArguments && node.typeArguments.length && node.typeArguments.map( arg => type_creator( arg ) );

        return { name, type: new TypeReference( name, typeArguments ), declaration: node };
    }
}

declare_handler( TypeReference.read, SyntaxKind.TypeReference );

TypeReference.late_resolution = () => {
    const unres = new Map();

    for ( const un of unresolved )
    {
        if ( un.defer_resolve() ) continue;

        const loc = un.scope.path_name().join( ' > ' );
        let lun;

        if ( loc && unres.has( loc ) )
            lun = unres.get( loc );
        else
            unres.set( loc, lun = new Set() );

        lun.add( un.boundTo || un.__name || un.name );
    }

    return unres;
};
