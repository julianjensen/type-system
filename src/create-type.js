/* eslint-disable operator-linebreak */
/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/
"use strict";

import { Scope }         from "./scope";
import {
    $,
    log,
    debug_name,
    set_error_node,
    node_error,
    no_parent,
    BIND_ALLOC,
    add_to_list,
    CONSTRUCTOR,
    CALL,
    TYPE,
    FORMAL, INDEX, CONTEXT
} from "./utils";
import "./types/all-types";
import { ObjectType }    from "./types/object-type";
import { ModuleType }    from "./types/module";
import { CallableType }  from "./types/functions";
import { SyntaxKind }    from "typescript";
import {
    handle_kind,
    identifier,
    kind,
    property_name,
    binding_name, entity_name, kindToType, baseTypesToString
}                        from "./ts-utils";
import { Binding }       from "./binding";
import { TypeParameter } from "./types/type-params-args";
import { TypeAlias }     from "./types/reference";

const Namespace = ModuleType;

/**
 * @param {string} name
 * @param {Type} value
 * @param {ts.Node} def
 * @return {Binding}
 */
function bind_as_parameter( name, value, def )
{
    return Scope.current.bind( new Binding( {
        name,
        type:        value.baseType,
        value,
        declaration: def,
        parameter:   value instanceof TypeParameter ? TYPE : name === 'this' ? CONTEXT : FORMAL
    } ) );
}

/**
 * @param {string|Symbol} name
 * @param {ts.FunctionLikeDeclaration|ts.SignatureDeclaration} node
 * @param {SimpleFunction} func
 * @return {*}
 */
function add_signature( name, node, func )
{
    let parent = Scope.current.resolve( name, true );

    if ( !parent )
    {
        parent = new Binding( { bindType: BIND_ALLOC, name, type: baseTypesToString[ SyntaxKind.FunctionKeyword ], value: new CallableType(), declaration: node } );
        Scope.current.bind( parent );
    }
    else
        parent.declaration = add_to_list( parent.declaration, node );

    func.parent = parent;
    func.funcName = name;

    parent.value.add_signature( func );

    return parent;
}


/**
 * @param {ts.Node|ts.Declaration|ts.VariableStatement|ts.VariableDeclaration|ts.SourceFile|ts.MethodSignature|ts.TypeReferenceNode|ts.LiteralTypeNode|ts.ClassDeclaration} def
 * @param {string} [_name]
 * @param {string} [_type]
 * @param {Type} [_value]
 */
export function declaration( def, _name, _type, _value )
{
    if ( !def )
        return null;

    let name  = _name,
        type  = _type,
        value = _value,
        binding,
        scope;

    set_error_node( def );
    debug_name( def );

    log.type( `"${def.kind ? kind( def.kind ) : def.type}" on -> [ "%s" ]`, Object.keys( def ).join( '", "' ) );

    switch ( def.kind )
    {
        case SyntaxKind.SourceFile:
            Scope.current = Scope.global;
            def.statements.forEach( declaration );
            return null;

        case SyntaxKind.ModuleBlock:
            def.statements.forEach( declaration );
            return null;

        case SyntaxKind.VariableStatement:
            def.declarationList.declarations.map( declaration );
            return null;

        case SyntaxKind.VariableDeclaration:
            name = identifier( def.name );
            value = handle_kind( def.type );
            type = value.baseType;
            return Scope.current.bind( new Binding( { bindType: BIND_ALLOC, type, name, value, declaration: def, varDecl: true } ) );

        case SyntaxKind.ConstructSignature:
        case SyntaxKind.Constructor:
            add_signature( CONSTRUCTOR, def, handle_kind( def ) );
            break;

        case SyntaxKind.CallSignature:
            add_signature( CALL, def, handle_kind( def ) );
            break;

        case SyntaxKind.FunctionDeclaration:
            add_signature( binding_name( def.name ), def, handle_kind( def ) );
            break;

        case SyntaxKind.MethodDeclaration:
        case SyntaxKind.MethodSignature:
            add_signature( property_name( def.name ), def, handle_kind( def ) );
            break;

        case SyntaxKind.PropertySignature:
        case SyntaxKind.PropertyDeclaration:
            if ( !def.type )
                console.error( 'no type:', def );
            name = property_name( def.name );
            value = handle_kind( def.type );
            type = value.baseType;

            Scope.current.bind( new Binding( { name, value, type, declaration: def } ) );
            break;

        case SyntaxKind.ClassDeclaration:
        case SyntaxKind.InterfaceDeclaration:
            value = new ObjectType( def.kind === SyntaxKind.InterfaceDeclaration ? 'interface' : 'class' );
            name = identifier( def.name );
            type = baseTypesToString[ def.kind ];

            binding = Scope.current.bind( new Binding( { name, value, type, declaration: def } ) );
            Scope.descend( binding.value.scope );

            def.members.forEach( declaration );

            Scope.ascend();
            break;

        case SyntaxKind.ModuleDeclaration:
            name = identifier( def.name );
            value = new ModuleType();
            type = kindToType( def );
            binding = new Binding( { name, value, type, declaration: def } );
            Scope.current.bind( binding );
            Scope.descend( value.scope );

            declaration( def.body );

            Scope.ascend();
            break;

        case SyntaxKind.Parameter:
            name = identifier( def.name );
            value = handle_kind( def.type );

            return bind_as_parameter( name, value, def );

        case SyntaxKind.TypeAliasDeclaration:
            name = entity_name( def.name );
            value = new TypeAlias();
            Scope.descend( value.scope );

            value.typeParameters = def.typeParameters && def.typeParameters.map( declaration );
            value.resolvesTo = handle_kind( def.type );

            Scope.ascend();

            return Scope.current.bind( { name, value, type: value.resolvesTo.baseType, declaration: def } );

        case SyntaxKind.IndexSignature:
            value = handle_kind( def );
            type = value.baseType;

            return Scope.current.bind( { name: INDEX, value, type, declaration: def } );

        case SyntaxKind.TypeParameter:
            name = identifier( def.name );
            value = handle_kind( def );

            return bind_as_parameter( name, value, def );
        // Scope.current.bind( new Binding( { name: tpName, type: typeParam, declaration: def, parameter: TYPE, parameterIndex: Scope.current.getIndex( TYPE ) } ) );

        default:
            console.error( `fail on declaration (${kind( def )} -> ${def.kind}):`, $( no_parent( def ), 1 ) );
            node_error( 'fail on declaration:', def.type || def );
    }
}

