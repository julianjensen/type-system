/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/
"use strict";

import { Type } from "./base-type";

/** */
export class ModuleType extends Type
{
    /** */
    constructor()
    {
        super( 'namespace', true );
    }

    /**
     * @return {string}
     */
    toString()
    {
        return 'namespace ' + this.boundTo.name;
    }
}
