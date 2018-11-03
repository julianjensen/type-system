/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/
"use strict";

import { SyntaxKind }                             from "typescript";
import { unescapeName }                           from "./named-object";
import { FORMAL, node_fatal, TYPE, type_creator } from "./utils";
import { Scope }                                  from "./scope";
import { Type }                                   from "./types/base-type";

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

export function isKeyword( node )
{
    let name = typeof node !== 'string' ? SyntaxKind[ node.kind ] : node;

    return name.endsWith( 'Keyword' );
}

export function is( node, ..._kinds )
{

    if ( _kinds.length )
        return _kinds.includes( node.kind );

    const _identify = ( ...kinds ) => kinds.includes( node.kind );

    _identify.a = _identify;

    return _identify;
}

export function kind( node )
{
    if ( typeof node === 'number' )
        return SyntaxKind[ node ];
    else if ( typeof node === 'string' )
        return node;

    return !node ? 'undefined' : SyntaxKind[ node.kind ];
}

export const pkind = kind;

function _identifier( node )
{
    return unescapeName( node.escapedText );
}

export function identifier( node, noThrow = false )
{
    if ( is( node, SyntaxKind.Identifier ) )
        return _identifier( node );

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

export function module_name( node, noThrow = false )
{
    if ( is( node ).a( SyntaxKind.Identifier ) )
        return _identifier( node );
    else if ( is( node ).a( SyntaxKind.StringLiteral ) )
        return node.value;

    if ( !noThrow )
        throw new Error( `Expected module name, found ${kind( node )}` );
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

export const handle_kind = ( _kind, name, node ) => {
    if ( !name && !node )
    {
        node = _kind;
        _kind = node.kind;
    }

    if ( handlers.has( _kind ) ) {
        // console.error( `kind handler for "${kind(_kind)}", name: ${name}` );
        return handlers.get( _kind )( name, node );
    }

    node_fatal( `No handler for ${SyntaxKind[ _kind ]}`, node );
    throw new Error( `No handler for ${SyntaxKind[ _kind ]}` );
};

export const modifierFlags = {
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

export function read_parameters( params )
{
    if ( !params || !params.length ) return null;

    return params.map( ( p, i ) => {
        const name = binding_name( p.name );
        /** @type {Type|NamedObject} */
        const type = type_creator( p.type, name );

        const binding = modify( p, { name, type, declaration: p, parameter: FORMAL, parameterIndex: i } );
        return Scope.current.bind( binding );
    } );
}

export function read_type_parameters( params )
{
    if ( !params || !params.length ) return null;

    return params.map( create_type_parameter );
}

export function create_type_parameter( t, i )
{
    const name = identifier( t.name );
    let constraint;
    let keyOf = false;

    if ( t.constraint )
    {
        const c = t.constraint;

        if ( c.kind === SyntaxKind.TypeOperator )
        {
            constraint = type_creator( c.type );
            keyOf = true;
        }
        else
            constraint = type_creator( c );
    }

    /** @type {BindingInfo} */
    const binding = {
        name,
        type: constraint,
        declaration: t,
        parameter: TYPE,
        parameterIndex: i
    };

    if ( keyOf ) binding.keyOf = true;

    return Scope.current.bind( modify( t, binding ) );
}

/**
 * @param {BindingInfo|Type|Array<BindingInfo|Type>|undefined} p
 * @return {string}
 */
export function stringify_type_parargs( p )
{
    if ( !p ) return '';

    if ( !Array.isArray( p ) ) return `${p}`;

    if ( !p.length ) return '<>';

    return `<${p.map( arg => arg instanceof Type ? `${arg}` : stringify_binding( arg ) ).join( ', ' )}>`;
}

/**
 * @param {BindingInfo} b
 * @return {string}
 */
export function stringify_binding( b )
{
    if ( b.parameter === TYPE )
    {
        const c = b.constraint && !b.keyOf ? ` extends ${b.constraint}` : ` in keyof ${b.constraint}`;

        return `${b.name}${c}`;
    }

    if ( b.name && b.varDecl )
        return `${b.name}: ${b.type}`;

    return `${b.type}`;
}

export function read_type_arguments( params )
{
    if ( !params || !params.length ) return null;

    return params.map( create_type_argument );
}

export function create_type_argument( t, i )
{
    if ( isKeyword( t ) )
        return keyword_to_binding( SyntaxKind[ t.kind ] );

    if ( t.kind !== SyntaxKind.TypeReference )
        return type_creator( t );

    const name = identifier( t.typeName );

    /** @type {BindingInfo} */
    const binding = {
        name,
        type: t.constraint && type_creator( t.constraint, name ),
        declaration: t,
        parameter: TYPE,
        parameterIndex: i
    };

    return Scope.current.bind( modify( t, binding ) );
}

export function keyword_to_binding( keyword )
{
    const kw = typeof keyword === 'string' ? keyword : SyntaxKind[ keyword.kind ];

    const k = kw.replace( /^(.*)Keyword$/, '$1' ).toLowerCase();

    return Scope.current.resolve( k );
}

/*
const node = { kind: 123 };
const b1 = is( node, SyntaxKind.SignatureDeclaration );
const pre = is( node );
const b2 = pre( SyntaxKind.SignatureDeclaration, SyntaxKind.VariableDeclaration );
const b3 = is( node ).a( SyntaxKind.SignatureDeclaration, SyntaxKind.VariableDeclaration );
*/
