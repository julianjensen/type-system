/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/

import { handle_kind } from "./ts-utils";

/** */
export class ValueType {

    /**
     * @param {Type} vt
     */
    constructor( vt ) {
        this.definition = vt;
        this.value = undefined;
    }

    /**
     * @param {ts.TypeNode} node
     * @return {ValueType}
     */
    static create( node ) {

        return new ValueType( handle_kind( node ) );
    }

    /**
     * @return {?Scope}
     */
    get scope() {
        return this.definition && this.definition.scope;
    }

    /**
     * @return {string}
     */
    toString()
    {
        return `${this.definition}`;
    }
}
