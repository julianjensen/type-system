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
     * @param {ts.TypeNode} altNode
     * @return {ValueType}
     */
    static create( node, altNode ) {

        return new ValueType( handle_kind( node, altNode ) );
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

    getMangled( name )
    {
        return this.definition ? this.definition.getMangled( name ) : '';
    }
}
