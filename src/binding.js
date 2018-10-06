/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/
"use strict";

import { NamedObject } from "./named-object";

/**
 * @class Binding
 * @extends NamedObject
 * @mixes BindingInfo
 */
export class Binding extends NamedObject
{
    /**
     * @param {BindingInfo} binding
     */
    constructor( binding )
    {
        super();
        [ 'name', 'value', 'type', 'declaration', 'scope', 'parameter', 'firstDefinition' ]
            .forEach( key => this[ key ] = binding[ key ] );

        this.types = [];
        this.isAmbient = false;
    }

    toString()
    {
        return `${this.name}: ${this.type}`;
    }

    ambient( yesNo = true )
    {
        this.isAmbient = yesNo;
    }
}
