/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/

"use strict";

import { SyntaxKind }   from "./ts-helpers";
import { unescapeName } from "./named-object";


export const tsInfo = {
    hasType:              [
        SyntaxKind.CallSignature,
        SyntaxKind.ConstructSignature,
        SyntaxKind.MethodSignature,
        SyntaxKind.IndexSignature,
        SyntaxKind.FunctionType,
        SyntaxKind.ConstructorType,
        SyntaxKind.JSDocFunctionType,
        SyntaxKind.FunctionDeclaration,
        SyntaxKind.MethodDeclaration,
        SyntaxKind.GetAccessor,
        SyntaxKind.SetAccessor,
        SyntaxKind.FunctionExpression,
        SyntaxKind.ArrowFunction,
        SyntaxKind.Constructor,

        SyntaxKind.VariableDeclaration,
        SyntaxKind.Parameter,
        SyntaxKind.PropertySignature,
        SyntaxKind.PropertyDeclaration,
        SyntaxKind.TypePredicate,
        SyntaxKind.ParenthesizedType,
        SyntaxKind.TypeOperator,
        SyntaxKind.MappedType,
        SyntaxKind.TypeAliasDeclaration,
        SyntaxKind.JSDocTypeExpression,
        SyntaxKind.JSDocNonNullableType,
        SyntaxKind.JSDocNullableType,
        SyntaxKind.JSDocOptionalType,
        SyntaxKind.JSDocVariadicType
    ],
    modifiers:            [
        SyntaxKind.AbstractKeyword,
        SyntaxKind.AsyncKeyword,
        SyntaxKind.ConstKeyword,
        SyntaxKind.DeclareKeyword,
        SyntaxKind.DefaultKeyword,
        SyntaxKind.ExportKeyword,
        SyntaxKind.PublicKeyword,
        SyntaxKind.PrivateKeyword,
        SyntaxKind.ProtectedKeyword,
        SyntaxKind.ReadonlyKeyword,
        SyntaxKind.StaticKeyword
    ],
    signatureDeclaration: [
        SyntaxKind.CallSignature,
        SyntaxKind.ConstructSignature,
        SyntaxKind.PropertySignature,
        SyntaxKind.MethodSignature,
        SyntaxKind.IndexSignature,
        SyntaxKind.JSDocSignature,
        SyntaxKind.JSDocFunctionType,
        SyntaxKind.FunctionDeclaration,
        SyntaxKind.MethodDeclaration,
        SyntaxKind.GetAccessor,
        SyntaxKind.SetAccessor,
        SyntaxKind.FunctionExpression,
        SyntaxKind.ArrowFunction
    ],
    signatureElements:    [
        SyntaxKind.Parameter,
        SyntaxKind.Decorator,
        SyntaxKind.TypeParameter
    ],
    memberTypes:          [
        SyntaxKind.PropertySignature,
        SyntaxKind.PropertyDeclaration,
        SyntaxKind.MethodSignature,
        SyntaxKind.MethodDeclaration,
        SyntaxKind.Constructor,
        SyntaxKind.GetAccessor,
        SyntaxKind.SetAccessor,
        SyntaxKind.CallSignature,
        SyntaxKind.ConstructSignature,
        SyntaxKind.IndexSignature
    ],
    types:                [
        SyntaxKind.TypePredicate,
        SyntaxKind.TypeReference,
        SyntaxKind.FunctionType,
        SyntaxKind.ConstructorType,
        SyntaxKind.TypeQuery,
        SyntaxKind.TypeLiteral,
        SyntaxKind.ArrayType,
        SyntaxKind.TupleType,
        SyntaxKind.OptionalType,
        SyntaxKind.RestType,
        SyntaxKind.UnionType,
        SyntaxKind.IntersectionType,
        SyntaxKind.ConditionalType,
        SyntaxKind.InferType,
        SyntaxKind.ParenthesizedType,
        SyntaxKind.ThisType,
        SyntaxKind.TypeOperator,
        SyntaxKind.IndexedAccessType,
        SyntaxKind.MappedType,
        SyntaxKind.LiteralType,
        SyntaxKind.ImportType
    ],
    jsDocTypes:           [
        SyntaxKind.JSDocTypeExpression,
        SyntaxKind.JSDocAllType,        // The * type
        SyntaxKind.JSDocUnknownType,    // The ? type
        SyntaxKind.JSDocNullableType,
        SyntaxKind.JSDocNonNullableType,
        SyntaxKind.JSDocOptionalType,
        SyntaxKind.JSDocFunctionType,
        SyntaxKind.JSDocVariadicType,
        SyntaxKind.JSDocComment,
        SyntaxKind.JSDocTypeLiteral,
        SyntaxKind.JSDocSignature,
        SyntaxKind.JSDocTag,
        SyntaxKind.JSDocAugmentsTag,
        SyntaxKind.JSDocClassTag,
        SyntaxKind.JSDocCallbackTag,
        SyntaxKind.JSDocEnumTag,
        SyntaxKind.JSDocParameterTag,
        SyntaxKind.JSDocReturnTag,
        SyntaxKind.JSDocThisTag,
        SyntaxKind.JSDocTypeTag,
        SyntaxKind.JSDocTemplateTag,
        SyntaxKind.JSDocTypedefTag,
        SyntaxKind.JSDocPropertyTag
    ],
    typeParamChildren:    [
        SyntaxKind.CallSignature,
        SyntaxKind.ConstructSignature,
        SyntaxKind.MethodSignature,
        SyntaxKind.IndexSignature,
        SyntaxKind.FunctionType,
        SyntaxKind.ConstructorType,
        SyntaxKind.JSDocFunctionType,
        SyntaxKind.FunctionDeclaration,
        SyntaxKind.MethodDeclaration,
        SyntaxKind.GetAccessor,
        SyntaxKind.SetAccessor,
        SyntaxKind.FunctionExpression,
        SyntaxKind.ArrowFunction,
        SyntaxKind.Constructor,

        SyntaxKind.ClassDeclaration,
        SyntaxKind.ClassExpression,
        SyntaxKind.InterfaceDeclaration,
        SyntaxKind.TypeAliasDeclaration,
        SyntaxKind.JSDocTemplateTag
    ],
    typeParam:            [
        SyntaxKind.JSDocTypedefTag,
        SyntaxKind.JSDocCallbackTag,
        SyntaxKind.JSDocSignature
    ]
};

export function is( node, ..._kinds )
{

    if ( _kinds.length )
        return _kinds.includes( node.kind );

    const _identify = ( ...kinds ) => kinds.includes( node.kind );

    _identify.a = _identify;

    return _identify;
}

function kind( node )
{
    return !node ? 'undefined' : SyntaxKind[ node.kind ];
}

function _identifier( node )
{
    return unescapeName( node.escapedText );
}

export function identifier( node, noThrow = false )
{
    if ( is( node, SyntaxKind.Identifier ) )
        return identifier( node );

    if ( !noThrow )
        throw new Error( `Expected Identifier, found ${kind( node )}` );
}

function _entity_name( node )
{
    if ( is( node, SyntaxKind.Identifier ) )
        return _identifier( node );
    else
        return _entity_name( node.left ) + '.' + _identifier( node.right );
}

export function entity_name( node )
{
    if ( is( node, SyntaxKind.Identifier ) )
        return _identifier( node );
    else if ( is( node, SyntaxKind.QualifiedName ) )
        return _entity_name( node.left ) + '.' + _identifier( node.right );

    throw new Error( `Expected entity name, found ${kind( node )}` );
}

export function property_name( node, noThrow = false )
{
    switch ( node.kind )
    {
        case SyntaxKind.Identifier:
            return _identifier( node );
        case SyntaxKind.NumericLiteral:
        case SyntaxKind.StringLiteral:
            return node.text;
        case SyntaxKind.ComputedPropertyName:
            return 'expression';
        default:
            if ( !noThrow )
                throw new Error( `Expected property name, found ${kind( node )}` );
    }
}

function binding_pattern( node, noThrow = false )
{
}

export function binding_name( node )
{
    let name = identifier( node, true );

    if ( !name )
        name = binding_pattern( node, true );

    if ( name ) return name;

    throw new Error( `Expected identifier or binding pattern, found ${kind( node )}` );
}

function declaration_name( node )
{
    let declName = property_name( node, true );

    declName = declName || binding_pattern( node, true );

    if ( !declName )
        throw new Error( `Expected declaration name, found ${kind( node )}` );

    return declName;
}

export function get_name( node )
{

}

const handlers = new Map();

export function declare_handler( handler, ...kinds )
{
    kinds.forEach( kind => handlers.set( kind, handler ) );
}

export const handle_type = ( kind, node ) => handle_kind( kind, null, node );

export const handle_kind = ( kind, name, node ) => {
    if ( handlers.has( kind ) ) return handlers.get( kind )( name, node );

    throw new Error( `No handler for ${SyntaxKind[ kind ]}` );
};

const modifierFlags = {
    [ SyntaxKind.AbstractKeyword ]:  'isAbstract',
    [ SyntaxKind.AsyncKeyword ]:     'isAsync',
    [ SyntaxKind.ConstKeyword ]:     'isConst',
    [ SyntaxKind.DeclareKeyword ]:   'isDeclare',
    [ SyntaxKind.DefaultKeyword ]:   'isDefault',
    [ SyntaxKind.ExportKeyword ]:    'isExport',
    [ SyntaxKind.PublicKeyword ]:    'isPublic',
    [ SyntaxKind.PrivateKeyword ]:   'isPrivate',
    [ SyntaxKind.ProtectedKeyword ]: 'isProtected',
    [ SyntaxKind.ReadonlyKeyword ]:  'isReadonly',
    [ SyntaxKind.StaticKeyword ]:    'isStatic'
};

export function modify( node, type )
{
    if ( node.modifiers && node.modifiers.length )
        node.modifiers.forEach( ( { kind } ) => ( modifierFlags[ kind ] && ( type[ modifierFlags[ kind ] ] = true ) ) );

    if ( node.questionToken )
    {
        if ( node.questionToken.kind === SyntaxKind.MinusToken )
            type.removeOptional = true;
        else if ( node.questionToken.kind === SyntaxKind.PlusToken )
            type.addOptional = true;
        else
            type.isOptional = true;
    }

    if ( node.readonlyToken )
    {
        if ( node.readonlyToken.kind === SyntaxKind.MinusToken )
            type.makeReadWrite = true;
        else
            type.makeReadonly = true;
    }

    if ( node.dotDotDotToken )
        type.isRest = true;

    return type;
}

/*
const node = { kind: 123 };
const b1 = is( node, SyntaxKind.SignatureDeclaration );
const pre = is( node );
const b2 = pre( SyntaxKind.SignatureDeclaration, SyntaxKind.VariableDeclaration );
const b3 = is( node ).a( SyntaxKind.SignatureDeclaration, SyntaxKind.VariableDeclaration );
*/
