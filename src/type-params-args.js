/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/



"use strict";

import { mix }                             from "mixwith";
import { Type }                            from "./types/base-type";
import { INamedObject }                    from "./named-object";
import { declare_handler, identifier, is } from "./ts-utils";
import { SyntaxKind }                      from "./ts-helpers";
import { type_creator }                    from "./utils";

/** */
export class TypeParameter extends mix( Type ).with( INamedObject )
{
    /**
     * @param {string|ts.TypeParameterDeclaration} name
     * @param {?Type} [constraint]
     * @param {boolean} [isKeyOf]
     * @param {?Type} [defaultType]
     */
    constructor( name, { constraint, isKeyOf = false, defaultType } )
    {
        super( name );
        this.constraint = constraint;
        this.isKeyOf = isKeyOf;
        this.defaultType = defaultType;
    }

    /**
     * @param {?string|ts.TypeParameterDeclaration} _
     * @param {ts.TypeParameterDeclaration} [node]
     */
    static read( _, node = _ )
    {
        const r = {
            name: identifier( node.name ),
            constraint: null,
            isKeyOf: false,
            defaultType: null
        };

        if ( !node.constraint ) return r;

        let constraint = node.constraint;

        if ( is( constraint ).a( SyntaxKind.TypeOperator ) )
        {
            r.isKeyOf = true;
            constraint = constraint.type;
        }

        r.constraint = type_creator( constraint );

        return { name: r.name, type: new TypeParameter( r.name, r ), declaration: node };
    }

    toString()
    {
        return '<' + super.toString() + ( this.constraint ? ` extends ${this.constraint}` : '' ) + ( this.defaultType ? ` = ${this.defaultType}` : '' ) + '>';
    }
}

declare_handler( TypeParameter.read, SyntaxKind.TypeParameter );

