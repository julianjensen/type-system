/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/

import { Type }                                            from "./base-type";
import { Scope }                                           from "../scope";
import { baseTypesToString, declare_handler, handle_kind } from "../ts-utils";
import { SyntaxKind }                                      from "typescript";

/**
 * @extends Type
 */
export class IndexedType extends Type
{
    /** */
    constructor()
    {
        super( 'indexed', true );
        this._objectType = null;
        this._indexType = null;
        this.baseType = baseTypesToString[ SyntaxKind.ObjectKeyword ];
    }

    /**
     * @param {Type} [ot]
     * @return {IndexedType|Type}
     */
    objectType( ot )
    {
        if ( ot )
        {
            this._objectType = ot;
            return this;
        }

        return this._objectType;
    }

    /**
     * @param {Type} [it]
     * @return {Type|IndexedType}
     */
    indexType( it )
    {
        if ( it )
        {
            this._indexType = it;
            return this;
        }

        return this._indexType;
    }

}

/**
 * @extends Type
 */
export class MappedType extends Type
{
    /** */
    constructor()
    {
        super( 'mapped', true );
        this._from = null;
        this._to = null;
        this.baseType = baseTypesToString[ SyntaxKind.ObjectKeyword ];
    }

    /**
     * @param {Type} [f]
     * @return {MappedType|Type}
     */
    from( f )
    {
        if ( f )
        {
            this._from = f;
            return this;
        }

        return this._from;
    }

    /**
     * @param {Type} t
     * @return {MappedType|Type}
     */
    to( t )
    {
        if ( t )
        {
            this._to = t;
            return this;
        }

        return this._to;
    }

    /**
     * @return {string}
     */
    toString()
    {
        return `${this.from} in ${this.to}`;
    }
}

/**
 * @param {ts.IndexedAccessTypeNode} typeNode
 * @return {IndexedType}
 */
function new_indexed_type( typeNode )
{
    const indexed = new IndexedType();
    const { objectType, indexType } = typeNode;

    Scope.descend( indexed.scope );
    indexed.objectType = handle_kind( objectType );
    indexed.indexType = handle_kind( indexType );
    Scope.ascend();

    return indexed;
}

/**
 * @param {ts.MappedTypeNode} typeNode
 * @return {MappedType}
 */
function new_mapped_type( typeNode )
{
    const mapped = new MappedType();
    const { type, typeParameter } = typeNode;

    Scope.descend( mapped.scope );
    mapped.from = handle_kind( typeParameter );
    mapped.to = handle_kind( type );
    Scope.ascend();

    return mapped;
}

declare_handler( new_mapped_type, SyntaxKind.MappedType );
declare_handler( new_indexed_type, SyntaxKind.IndexedAccessType );
