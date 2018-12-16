/** ******************************************************************************************************************
 * @file Describe what parse-pattern does.
 * @author Julian Jensen <jjdanois@gmail.com>
 * @since 1.0.0
 * @date 16-Dec-2018
 *********************************************************************************************************************/

import { SyntaxKind }           from "typescript";
import { $, asArray, safe_obj } from "./utils";
import { kind }                 from './ts-utils';

// import { identifier } from "./ts-utils";

function identifier( node )
{
    return node.text || node.escapedText;
}

function property_name( node )
{
    return identifier( node );
}

/**
 * @param {ts.BindingElement} lhs
 */
function get_name_and_type( lhs, rhs )
{
    console.log( `\nget_name_and_type(${lhs.name ? identifier( lhs.propertyName || lhs.name ) : 'no name'}, ${kind( rhs )})` );
    console.error( 'lhs:', $( safe_obj( lhs ), 1 ) );
    console.error( 'rhs:', $( safe_obj( rhs ), 1 ) );
    // Take from RHS using `propertyName`, if present, otherwise use `name`
    const rhsItem = find_prop( identifier( lhs.propertyName || lhs.name ), rhs );
    // Our name will be `name` which may be another binding
    const ourName = read_pattern( lhs.name, rhsItem );

    return { ...ourName, type: rhsItem || rhsItem.type };
}

function find_prop( name, rhs )
{
    if ( rhs.kind === SyntaxKind.TypeLiteral )
        return rhs.members.find( prop => identifier( prop.name ) === name );
    // The following won't really work but shouldn't appear in ambient files
    else if ( rhs.kind === SyntaxKind.ObjectLiteralExpression )
        return rhs.properties.find( prop => identifier( prop.name ) === name );
}

export function read_pattern( lhs, rhs, result = {} )
{
    console.log( '\nread_pattern' );
    console.error( `lhs: ${kind( lhs )}, rhs: ${kind( rhs )}` );
    switch ( lhs.kind )
    {
        case SyntaxKind.ObjectBindingPattern:
            lhs.elements.forEach( bindingElement => read_pattern( bindingElement, rhs, result ) );
            return result;

        case SyntaxKind.OmittedExpression:
            return result;

        case SyntaxKind.ArrayBindingPattern:
            const rhsTypes = rhs.type.elementType || rhs.type.elementTypes;
            const getType = index => Array.isArray( rhsTypes ) ? rhsTypes[ index ] : rhsTypes;
            console.error( 'rhsTypes:', $( safe_obj( rhsTypes ), 1 ) );
            console.error( 'elements:', lhs.elements.map( e => kind( e ) ).join( ', ' ) );
            const fromArray = lhs.elements.reduce( ( all, _lhs, i ) => {
                console.error( `inside reduce(${i}):`, $( safe_obj( _lhs ), 1 ) );
                return ( { ...all, ...read_pattern( _lhs, getType( i ) ) } );
            }, {} );
            console.error( 'reduced:', $( safe_obj( fromArray ), 1 ) );
            return { ...result, ...fromArray };

        case SyntaxKind.BindingElement:
            return { ...result, ...get_name_and_type( lhs, rhs ) };

        case SyntaxKind.Identifier:
            return lhs.text || lhs.escapedText;
    }
}

const isOmitted = node => node.kind === SyntaxKind.OmittedExpression;

export function ecma_binding( node, rhs, result = {} )
{
    if ( node.kind === SyntaxKind.ObjectBindingPattern )
        return { ...result, ...getPropertyList( node ).reduce( ( all, prop ) => ( { ...all, ...getBindingProperty( prop, rhs ) } ), {} ) };
    else if ( node.kind === SyntaxKind.ArrayBindingPattern )
    {
        const { elements, rhs: target } = getBindingElementList( node, rhs );
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

        return { [ propName ]: { initializer: node.initializer, rhs: find_prop( propName, rhs ) } };
    }

    if ( SyntaxKind[ node.name.kind ].endsWith( 'Pattern' ) )
        return { ...ecma_binding( node.name, find_prop( property_name( node.propertyName ), rhs ) || node.initializer ) };
}

function getBindingElement( lhs, rhs )
{
    if ( SyntaxKind[ lhs.name.kind ].endsWith( 'Pattern' ) )
        return { ...ecma_binding( lhs.name, rhs || lhs.initializer ) };

    return { [ property_name( lhs.name ) ]: { initializer: lhs.initializer } };
}

function getPropertyList( node )
{
    return node.elements;
}

function getBindingElementList( node, rhs )
{
    console.error( 'node:', $( safe_obj( node ), 1 ) );
    console.error( 'rhs:', $( safe_obj( rhs ), 1 ) );
    return { lhs: node.elements, rhs: rhs.elementType || rhs.elementTypes };
}

function get_target( _rhs, index )
{
    const rhs = asArray( _rhs );

    if ( index < rhs.length )
        return rhs[ index ];
    else
        return rhs[ 0 ];
}
