/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/

import { Type }                                                from "./base-type";
import { baseTypesToString, declare_handler, pseudo_typename } from "../ts-utils";
import { SyntaxKind }                                          from "typescript";
import { Scope }                                               from "../scope";
import { declaration }                                         from "../create-type";
import { TYPE }                                                from "../utils";

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

    toString()
    {
        const typeParams = this.scope.get_all_parameter_bindings( TYPE ) || [];

        return `${this.typeName}${typeParams.length ? `<${typeParams.map( ( { name, binding } ) => `${name}${binding}` ).join( ', ' )}>` : ''}`;
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
 * @param {ObjectType|TypeLiteral} tn
 * @param {ts.TypeLiteralNode|ts.ClassDeclaration|ts.InterfaceDeclaration} node
 * @param {boolean} [skipTP]
 * @return {ObjectType|TypeLiteral}
 */
export function member_decls( tn, node, skipTP = false )
{
    Scope.descend( tn.scope );
    if ( !skipTP && node.typeParameters && node.typeParameters.length )
        node.typeParameters.forEach( declaration );
    node.members.forEach( declaration );
    Scope.ascend();

    return tn;
}

/**
 * @param {ts.TypeLiteralNode} typeNode
 */
function create_type_literal( typeNode )
{
    return member_decls( new TypeLiteral(), typeNode );
}

/**
 * @param {ts.InterfaceDeclaration|ts.ClassDeclaration} typeNode
 */
function create_object( typeNode )
{
    return member_decls( new ObjectType( pseudo_typename( typeNode ) ), typeNode );
}

declare_handler( create_type_literal, SyntaxKind.TypeLiteral );
declare_handler( create_object, SyntaxKind.InterfaceDeclaration, SyntaxKind.ClassDeclaration );
