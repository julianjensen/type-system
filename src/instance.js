/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/

"use strict";

import { mix }          from "mixwith";
import { Type }         from "./base-type";
import { INamedObject } from "./named-object";
import { italic, safe } from "./utils";
import { Scope }        from "./scope";

/**
 *
 */
export class ObjectType extends mix( Type ).with( INamedObject )
{
    constructor( name = italic`anonymous` )
    {
        super( 'object-type' );
        this.___name = name;
        this.scope = Scope.current.add_inner( this );
        this.signatures = [];
    }

    get __name()
    {
        if ( this.isCall )
            return this.scope.outer.owner.__name;
        else if ( this.isFunction )
            return 'function' + ( this.boundTo ? ' ' + safe( this.boundTo ) : '' );
        else if ( this.isInterface )
            return 'interface' + ( this.boundTo ? ' ' + safe( this.boundTo ) : '' );
        else if ( this.boundTo && this.___name )
            return `[${this.___name}]`;

        return this.___name;
    }

    set __name( n )
    {
        this.___name = n;
    }

    get isFunction()
    {
        return !!this.signatures && !!this.signatures.length;
        // return !!this.scope.find( ( name, type ) => type.isCall, true );
    }

    set isFunction( v ) {}
}
