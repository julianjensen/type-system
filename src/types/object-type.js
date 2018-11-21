/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/

import { Type }                               from "./base-type";
import { baseTypesToString, declare_handler } from "../ts-utils";
import { SyntaxKind }                         from "typescript";
import { Scope }                              from "../scope";
import { declaration }                        from "../create-type";

/**
 * @extends Type
 */
export class ObjectType extends Type
{
    /**
     * @param {string} [override]
     */
    constructor( override )
    {
        super( override || 'object', true );
        this.baseType = baseTypesToString[ SyntaxKind.ObjectKeyword ];
    }
}

/**
 * @extends ObjectType
 */
export class TypeLiteral extends ObjectType
{
    /** */
    constructor()
    {
        super( 'typeliteral' );
    }
}

/**
 * @param {ts.TypeLiteralNode} typeNode
 */
function create_type_literal( typeNode )
{
    const tl = new TypeLiteral();

    Scope.descend( tl.scope );
    typeNode.members.forEach( declaration );
    Scope.ascend();

    return tl;
}

declare_handler( create_type_literal, SyntaxKind.TypeLiteral );
