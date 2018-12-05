/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/

import { Type }                                            from "./base-type";
import { baseTypesToString, declare_handler, handle_kind } from "../ts-utils";
import { SyntaxKind }                                      from "../ts-helpers";

/**
 * @extends Type
 */
export class TypeParameter extends Type
{
    /** */
    constructor()
    {
        super( 'type-parameter' );
        this.constraint = null;
        this.isKeyOf = false;
        this.defaultType = null;
        this.baseType = baseTypesToString[ SyntaxKind.AnyKeyword ];
    }

    /**
     * @return {string}
     */
    toString()
    {
        const c = this.constraint && !this.isKeyOf ? ` extends ${this.constraint}` : ` in keyof ${this.constraint}`;
        const defType = this.defaultType ? ` = ${this.defaultType}` : '';

        return ( this.constraint ? `${this.boundTo.name}${c}` : this.boundTo.name ) + defType;
    }
}

/**
 * Another infernal type class. It's used using the "keyof" keyword in contexts
 * outside of type parameter constraints.
 *
 * @extends Type
 */
export class TypeOperator extends Type
{
    /** */
    constructor()
    {
        super( 'keyof' );
        this.operatesOn = null;
        this.baseType = baseTypesToString[ SyntaxKind.UnknownKeyword ];
    }
}

/**
 * @param {ts.TypeOperatorNode} typeNode
 * @return {TypeOperator}
 */
function create_type_operator( typeNode )
{
    const to = new TypeOperator();

    to.operatesOn = handle_kind( typeNode.type );

    return to;
}

/**
 * @param {ts.TypeParameterDeclaration} t
 * @return {TypeParameter}
 */
function create_type_parameter( t )
{
    const type = new TypeParameter();

    if ( t.constraint )
    {
        /** @type {ts.TypeOperatorNode|ts.TypeNode} */
        const c = t.constraint;

        if ( c.kind === SyntaxKind.TypeOperator )
        {
            type.constraint = handle_kind( c.type );
            type.isKeyOf = true;
        }
        else
            type.constraint = handle_kind( c );
    }

    if ( t.default )
        type.defaultType = handle_kind( t.default );

    return type;
}

declare_handler( create_type_parameter, SyntaxKind.TypeParameter );
declare_handler( create_type_operator, SyntaxKind.TypeOperator );
