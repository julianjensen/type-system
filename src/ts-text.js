/* eslint-disable operator-linebreak */
/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/
"use strict";

import { SyntaxKind } from "./ts-helpers";

/**
 * @param {object} decl
 * @param {string} declName
 * @param {string} typeName
 * @return {*[]}
 */
export function get_names( decl, declName, typeName )
{
    if ( decl.kind === SyntaxKind.IndexSignature )
    {
        declName = `[ ${decl.parameters.map( pretty ).join( ', ' )} ]`;
        typeName = get_type_name( decl.type );
    }
    else
    {
        declName += check_for_template( decl );

        if ( decl.parameters )
        {
            if ( decl.parameters.length )
                declName = `${declName}( ${decl.parameters.map( pretty ).join( ', ' )} )`;
            else
                declName += '()';
        }
    }

    return [ declName, typeName ];
}

function pretty( decl )
{
    let str = '';

    if ( decl.name )
        str += ( decl.dotDotDotToken ? '...' : '' ) + decl.name.escapedText + ( decl.questionToken ? '?' : '' );
    else
        str += 'anon';

    return str + ': ' + add_types( decl.type );
}

function type_in_mapped_type( node )
{
    while ( node )
    {
        if ( node.kind === SyntaxKind.MappedType ) return true;
        node = node.parent;
    }

    return false;
}

function ident( s ) { return s; }

/**
 * @param {ts.Node} type
 * @return {string}
 */
export function add_types( type )
{
    let t;

    if ( type.kind === SyntaxKind.Identifier )
        return type.escapedText ; // + ident( type );

    else if ( type.kind === SyntaxKind.ParenthesizedType )
        return `( ${add_types( type.type )} )`;

    else if ( type.kind === SyntaxKind.TypePredicate )
        return `${type.parameterName.escapedText} ${ident( type.parameterName )}is ${add_types( type.type )}`;

    else if ( type.kind === SyntaxKind.TypeReference )
        return add_types( type.typeName ) + check_for_template( type );

    else if ( type.kind === SyntaxKind.QualifiedName )
        return qual_name( type );

    else if ( type.kind === SyntaxKind.FunctionType )
        return func_type( type );

    else if ( type.kind === SyntaxKind.UnionType )
        return type.types.map( add_types ).join( ' | ' );

    else if ( type.kind === SyntaxKind.IntersectionType )
        return type.types.map( add_types ).join( ' & ' );

    else if ( type.kind === SyntaxKind.MappedType )
        return `{ [ ${add_types( type.typeParameter )} ]${type.questionToken ? '?' : ''}: ${get_type_name( type.type )} }`;


    else if ( type.kind === SyntaxKind.LiteralType )
    {
        switch ( type.literal.kind )
        {
            case SyntaxKind.StringLiteral:
                return type.literal.text; // `'${type.literal.text}' ${ident( type )}`;

            case SyntaxKind.NumericLiteral:
                return type.literal.text; // + ident( type );

            case SyntaxKind.TrueKeyword:
                return 'true'; // + ident( type );

            case SyntaxKind.FalseKeyword:
                return 'false'; // + ident( type );

            default:
                return `Unknown literal "${SyntaxKind[ type.literal.kind ]}" ${ident( type )}`;
        }
    }
    else if ( type.kind === SyntaxKind.PropertySignature )
    {
        const psName = get_type_name( type );

        return `${psName}${type.optional ? '?' : ''}: ${type.type ? add_types( type.type ) : psName}`;
    }
    else if ( type.kind === SyntaxKind.TypeLiteral )
    {
        const tl = type.members.length;

        return !tl ? '{}' : tl === 1 ? `{ ${add_types( type.members[ 0 ] )} }` : `{ ${type.members.map( add_types ).join( ', ' )} }`;
    }
    else if ( type.kind === SyntaxKind.IndexSignature )
        return `[ ${type.parameters.map( add_types ).join( ', ' )} ]: ${add_types( type.type )} }`;

    else if ( type.kind === SyntaxKind.Parameter )
        return `${add_types( type.name )}: ${add_types( type.type )}`;
    else if ( type.kind === SyntaxKind.TupleType )
        return `[ ${type.elementTypes.map( add_types ).join( ', ' )} ]`;
    else
        t = type && !type.types ? get_type_name( type ) : type && type.types ? type.types.map( get_type_name ).join( ' | ' ) : '';

    if ( /^\s*[A-Z][a-z]+Keyword\s*$/.test( t ) )
        t = t.replace( /^\s*(.*)Keyword\s*$/, '$1' ).toLowerCase();

    if ( type.kind === SyntaxKind.TypeParameter && type.constraint )
    {
        let typeOp = type_in_mapped_type( type ) ? ' in' : ' extends',
            tn;

        if ( type.constraint.kind === SyntaxKind.TypeOperator )
        {
            typeOp += ' keyof';
            tn = get_type_name( type.constraint.type );
        }
        else
            tn = get_type_name( type.constraint );

        t += `${typeOp} ${tn}`;
    }

    t += check_for_template( type );

    return t;
}

function check_for_template( type )
{
    if ( type.typeParameters )
        return type_parameters( type.typeParameters );

    if ( type.typeArguments )
        return type_parameters( type.typeArguments );

    return '';
}

export function get_type_name( type )
{
    if ( !type ) return '<no type name>';

    let typeName = type.typeName && type.typeName.escapedText ?
                   type.typeName.escapedText :
                   type.name && type.name.escapedText ? type.name.escapedText :
                   type.exprName ? type.exprName.escapedText :
                   type.kind ?
                   SyntaxKind[ type.kind ] :
                   '';

    if ( /^\s*[A-Z][a-z]+Keyword\s*$/.test( typeName ) )
        typeName = typeName.replace( /^(.*)Keyword$/, '$1' ).toLowerCase();

    if ( typeName === 'IndexedAccessType' )
        return get_type_name( type.objectType ) + '[' + get_type_name( type.indexType ) + ']' + ident( type );

    typeName += check_for_template( type );

    if ( typeName === 'ArrayType' && type.elementType ) typeName = add_types( type.elementType ) + '[]';

    return typeName;

}

function type_parameters( tp )
{
    if ( !tp || !tp.length ) return '';

    return `<${tp.map( add_types ).join( ', ' )}>`;
}

export function disambiguate( name )
{
    return typeof name === 'string' && !( {}[ name ] ) ? name : ( '__' + name );
}

/**
 * @param {ts.QualifiedName} node
 */
function qual_name( node )
{
    if ( SyntaxKind.Identifier === node.kind )
        return node.escapedText; // + ident( node );
    else if ( SyntaxKind.QualifiedName === node.kind )
        return qual_name( node.left ) + '.' + qual_name( node.right );

    console.error( `Unexpected kind in qualified name: ${SyntaxKind[ node.kind ]}` );
    return 'unknown';
}

function func_type( type )
{
    if ( type.parameters.length )
        return `${type_parameters( type.typeParameters )}( ${type.parameters.map( pretty ).join( ', ' )} ) => ${add_types( type.type )}`;
    else if ( !type.parameters || !type.parameters.length )
        return `${type_parameters( type.typeParameters )}() => ${add_types( type.type )}`;
}

