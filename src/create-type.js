/* eslint-disable operator-linebreak */
/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/

import { Scope }                                             from "./scope";
import {
    $,
    debug_name,
    set_error_node,
    node_error,
    no_parent,
    CONSTRUCTOR,
    CALL,
    TYPE,
    FORMAL, INDEX, CONTEXT
}                                                                                   from "./utils";
import "./types/all-types";
import { SyntaxKind }                                                               from "typescript";
import {
    handle_kind,
    identifier,
    kind,
    property_name,
    binding_name,
    entity_name,
    module_name
}                                                                                   from "./ts-utils";
import { Binding, create_bound_type, create_bound_variable, definition_resolution } from "./binding";
import { ValueType }                                                                from "./value-type";
import { Namespace }                                                                from "./types/abstract";
import { member_decls, ObjectType }                                                 from "./types/object-type";
import { TypeReference }                                                            from "./types/reference";

/**
 * @param {string|Symbol} name
 * @param {ts.Node|ts.FunctionLikeDeclaration|ts.SignatureDeclaration} node
 * @param {ValueType} func
 * @return {*}
 */
function add_signature( name, node, func )
{
    const binding = new Binding( node, new ValueType( func ) );

    Scope.current.bind( name, binding );
    return binding;
}

/**
 * @param {ts.Node} def
 */
export function declaration( def )
{
    if ( !def )
        return null;

    set_error_node( def );
    debug_name( def );

    switch ( def.kind )
    {
        case SyntaxKind.SourceFile:
            /** @type {ts.SourceFile} */
            const sourceFile = def;
            Scope.current = Scope.global;
            sourceFile.statements.forEach( declaration );
            return null;

        case SyntaxKind.ModuleBlock:
            /** @type {ts.ModuleBlock} */
            const moduleBlock = def;
            moduleBlock.statements.forEach( declaration );
            return null;

        case SyntaxKind.VariableStatement:
            /** @type {ts.VariableStatement} */
            const varStatement = def;
            varStatement.declarationList.declarations.map( declaration );
            return null;

        case SyntaxKind.VariableDeclaration:
            /* @type {ts.VariableDeclaration} */
            const varDecl = def;
            return create_bound_variable( Scope.current, identifier( varDecl.name ), varDecl );

        case SyntaxKind.ConstructSignature:
        case SyntaxKind.Constructor:
            add_signature( CONSTRUCTOR, def, handle_kind( def ) );
            break;

        case SyntaxKind.CallSignature:
            add_signature( CALL, def, handle_kind( def ) );
            break;

        case SyntaxKind.FunctionDeclaration:
            /** @type {ts.FunctionDeclaration} */
            const funcDecl = def;
            add_signature( binding_name( funcDecl.name ), def, handle_kind( def ) );
            break;

        case SyntaxKind.MethodDeclaration:
        case SyntaxKind.MethodSignature:
            add_signature( property_name( def.name ), def, handle_kind( def ) );
            break;

        case SyntaxKind.PropertySignature:
        case SyntaxKind.PropertyDeclaration:
            /** @type {ts.PropertyDeclaration|ts.PropertySignature} */
            const prop = def;
            const pname = property_name( prop.name );
            const propRes = Scope.current.resolve( pname );

            if ( propRes && !Binding.isExactlyA( propRes, TypeReference ) )
                throw new Error( `Duplicate identifier declaration "${pname}"` );

            return create_bound_type( Scope.current, pname, prop );

        case SyntaxKind.ClassDeclaration:
        case SyntaxKind.InterfaceDeclaration:
            /** @type {ts.ClassDeclaration|ts.InterfaceDeclaration} */
            const iclass = def;
            const iname = identifier( iclass.name );
            const bound = definition_resolution( iname );

            if ( bound )
                return member_decls( bound.valueType.definition, iclass, true );


            // if ( resolved && Binding.hasExactlyOne( resolved, ObjectType ) )
            //     return member_decls( Binding.getExactlyOne( resolved, ObjectType ).valueType.definition, iclass );
            // else if ( resolved && !Binding.isExactlyA( resolved, TypeReference ) )
            //     throw new Error( `Duplicate identifier declaration "${iname}"` );

            return create_bound_type( Scope.current, iname, iclass );

        case SyntaxKind.ModuleDeclaration:
            /** @type {ts.ModuleDeclaration} */
            const mod = def;
            const ns = new Namespace();
            const namespaceVT = new ValueType( ns );
            const nsBinding = new Binding( mod, namespaceVT );
            Scope.current.add( module_name( mod.name ), nsBinding );
            nsBinding.enter();

            declaration( mod.body );

            nsBinding.exit();
            return nsBinding;

        case SyntaxKind.Parameter:
            /** @type {ts.ParameterDeclaration} */
            const param = def;
            return create_bound_type( Scope.current, identifier( param.name ), param, FORMAL );

        case SyntaxKind.TypeAliasDeclaration:
            /** @type {ts.TypeAliasDeclaration} */
            const alias = def;
            return create_bound_type( Scope.current, entity_name( alias.name ), alias );

        case SyntaxKind.IndexSignature:
            /** @type {ts.IndexSignatureDeclaration} */
            const index = def;
            return create_bound_type( Scope.current, INDEX, index );

        case SyntaxKind.TypeParameter:
            /** @type {ts.TypeParameterDeclaration} */
            const tParam = def;
            return create_bound_type( Scope.current, identifier( tParam.name ), tParam, TYPE );

        default:
            console.error( `fail on declaration (${kind( def )} -> ${def.kind}):`, $( no_parent( def ), 1 ) );
            node_error( 'fail on declaration:', def.type || def );
    }
}

