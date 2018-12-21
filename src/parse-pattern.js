/** ******************************************************************************************************************
 * @file Describe what parse-pattern does.
 * @author Julian Jensen <jjdanois@gmail.com>
 * @since 1.0.0
 * @date 16-Dec-2018
 *********************************************************************************************************************/

import { SyntaxKind }  from "typescript";
import { asArray }     from "./utils";
import {
    handle_kind,
    identifier,
    property_name,
    kind
} from './ts-utils';
import { TypeLiteral } from "./types/object-type";
import { Scope }       from "./scope";
import { Binding }     from "./binding";
import { ValueType }   from "./value-type";

/**
 * @param {string} name
 * @param {ts.TypeLiteralNode|ts.PropertySignature|ts.TypeNode} rhs
 * @return {ts.TypeElement}
 */
function find_prop( name, rhs )
{
    if ( rhs.kind === SyntaxKind.TypeLiteral )
        return rhs.members.find( prop => identifier( prop.name ) === name );
    else if ( rhs.kind === SyntaxKind.PropertySignature )
        return find_prop( name, rhs.type );

    throw new Error( `Not handling "${kind( rhs )}" in pattern binding` );
}

/**
 * @param {ts.Node} node
 * @return {boolean}
 */
const isOmitted = node => node.kind === SyntaxKind.OmittedExpression;

/**
 * @param {ts.ObjectBindingPattern|ts.ArrayBindingPattern} lhs
 * @param {ts.TypeLiteralNode|ts.ArrayLiteralExpression} rhs
 * @return {object}
 */
export function binding_pattern( lhs, rhs )
{
    const defs = read_binding( lhs, rhs );

    // console.error( $( safe_obj( defs ), 3 ) );

    Object.entries( defs ).forEach( ( [ varName, { rhs } ] ) => {
        defs[ varName ].node = rhs;
        defs[ varName ].type = handle_kind( rhs.type || rhs );
    } );

    return defs;
}

/**
 * @param {ts.ObjectBindingPattern|ts.ArrayBindingPattern} lhs
 * @param {ts.TypeLiteralNode|ts.ArrayLiteralExpression} rhs
 * @return {TypeLiteral}
 */
export function pattern_as_type_literal( lhs, rhs )
{
    const tl = new TypeLiteral();

    Scope.descend( tl.scope );

    const members = binding_pattern( lhs, rhs );

    for ( const [ name, { type, node } ] of Object.entries( members ) )
    {
        const binding = new Binding( node, new ValueType( type ) );
        Scope.current.bind( name, binding );
    }

    Scope.ascend();

    return tl;
}

function read_binding( node, rhs, result = {} )
{
    if ( node.kind === SyntaxKind.ObjectBindingPattern )
        return { ...result, ...getPropertyList( node ).reduce( ( all, prop ) => ( { ...all, ...getBindingProperty( prop, rhs ) } ), {} ) };
    else if ( node.kind === SyntaxKind.ArrayBindingPattern )
    {
        const { lhs: elements, rhs: target } = getBindingElementList( node, rhs );
        return {
            ...result, ...elements.reduce( ( all, el, i ) => {
                if ( isOmitted( el ) ) return all;
                return { ...all, ...getBindingElement( el, get_target( target, i ) ) }; // @todo This element can be a whole new binding pattern!
            }, {} )
        };
    }
    else
        throw new Error( "Unknown binding pattern" );
}

function getBindingProperty( node, rhs )
{
    if ( !node.propertyName )
    {
        const propName = property_name( node.name );

        return { [ propName ]: { initializer: node.initializer, rhs: find_prop( propName, rhs.type || rhs ) } };
    }

    if ( SyntaxKind[ node.name.kind ].endsWith( 'Pattern' ) )
        return { ...read_binding( node.name, find_prop( property_name( node.propertyName ), rhs ) || node.initializer ) };
}

function getBindingElement( lhs, rhs )
{
    if ( SyntaxKind[ lhs.name.kind ].endsWith( 'Pattern' ) )
        return { ...read_binding( lhs.name, rhs || lhs.initializer ) };

    return { [ property_name( lhs.name ) ]: { rhs, initializer: lhs.initializer } };
}

function getPropertyList( node )
{
    return node.elements;
}

/**
 * @param {ts.ArrayBindingPattern} node
 * @param {ts.PropertySignature|ts.TupleType|ts.TupleTypeNode|ts.ArrayTypeNode|ts.BindingElement} rhs
 * @return {{lhs: ts.NodeArray<ts.BindingElement>, rhs: (*|ts.TypeNode|ts.NodeArray<ts.TypeNode>)}}
 */
function getBindingElementList( node, rhs )
{
    return { lhs: node.elements, rhs: rhs.type.elementType || rhs.type.elementTypes };
}

function get_target( _rhs, index )
{
    const rhs = asArray( _rhs );

    if ( index < rhs.length )
        return rhs[ index ];
    else
        return rhs[ 0 ];
}
