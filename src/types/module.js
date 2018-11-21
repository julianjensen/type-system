/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/

import { Type }              from "./base-type";
import { baseTypesToString } from "../ts-utils";
import { SyntaxKind }        from "typescript";

/** */
export class ModuleType extends Type
{
    /** */
    constructor()
    {
        super( 'namespace', true );
        this.baseType = baseTypesToString[ SyntaxKind.ModuleKeyword ];
    }

    /**
     * @return {string}
     */
    toString()
    {
        return 'namespace ' + this.boundTo.name;
    }
}
