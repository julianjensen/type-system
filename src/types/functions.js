/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/

import { Scope }                                                                   from "../scope";
import { SyntaxKind }                                                              from "../ts-helpers";
import { CALL, CONSTRUCTOR, safe }                                                 from "../utils";
import { baseTypesToString, declare_handler, handle_kind, stringify_type_parargs } from "../ts-utils";
import { ObjectType }                                                              from "./object-type";
import { declaration }                                                             from "../create-type";
import { Type }                                                                    from "./base-type";

/**
 * @extends Type
 * @extends ObjectType
 */
export class CallableType extends ObjectType
{
    /** */
    constructor()
    {
        super( 'callable' );
        /** @type {Array<SimpleFunction>} */
        this.signatures = [];
        this.baseType = baseTypesToString[ SyntaxKind.ObjectKeyword ];
    }

    add_signature( func )
    {
        this.signatures.push( func );

        return func;
    }

    /**
     * @return {string}
     */
    toString()
    {
        if ( this.signatures.length === 1 )
            return `${this.signatures[ 0 ]}`;

        return this.signatures.map( s => `${s}` ).join( ';\n' ) + ';';
    }

    hasConstructor()
    {
        return this.signatures.some( simfunc => simfunc._funcName === CONSTRUCTOR );
    }

    hasCall()
    {
        return this.signatures.some( simfunc => simfunc._funcName === CALL );
    }

    hasMethod()
    {
        return this.signatures.some( simfunc => simfunc._funcName !== CONSTRUCTOR && simfunc._funcName !== CALL );
    }

    some( fn )
    {
        return this.signatures.some( fn );
    }

    each( fn )
    {
        this.signatures.forEach( fn );
    }

    * [ Symbol.iterator ]()
    {
        for ( const sig of this.signatures )
            yield sig;
    }
}

/**
 */
export class SimpleFunction extends Type
{
    /**
     * @param {string} name
     * @param {boolean} [needsScope=true]
     */
    constructor( name, needsScope = true )
    {
        super( name, needsScope );
        this.parent = null;
        this.scope = Scope.current.add_inner();
        this.parameters = [];
        this.typeParameters = [];
        this.type = null;
        this.functionKind = SyntaxKind.AnyKeyword;
        this._funcName = null;
        this.baseType = baseTypesToString[ SyntaxKind.FunctionKeyword ];
    }

    set funcName( fname )
    {
        this._funcName = fname;
    }

    /**
     * @return {string}
     */
    toString()
    {
        const pp = _p => _p && _p.length ? `( ${_p.map( p => `${p}` ).join( ' , ' )} )` : '()';
        const returnType = this.type ? `${this.type}` : '';
        const rtypeChar = returnType ? ( this.functionKind === SyntaxKind.FunctionType ? ' => ' : ': ' ) : '';

        return this.annotate_type( `${safe( this.parent ? this.parent.name : '' )}${stringify_type_parargs( this.typeParameters )}${pp( this.parameters )}${rtypeChar}${returnType}` );
    }
}

// declare_handler( construct_signature_read, SyntaxKind.ConstructSignature, SyntaxKind.Constructor );
// declare_handler( call_signature_read, SyntaxKind.CallSignature );
// declare_handler( method_signature_read, SyntaxKind.MethodSignature );
// declare_handler( function_type_read, SyntaxKind.FunctionType );
// declare_handler( constructor_type_read, SyntaxKind.ConstructorType );

declare_handler( generic_read, SyntaxKind.ConstructorType, SyntaxKind.FunctionType, SyntaxKind.FunctionExpression, SyntaxKind.ArrowFunction );
declare_handler( generic_read, SyntaxKind.MethodSignature, SyntaxKind.IndexSignature, SyntaxKind.ConstructSignature, SyntaxKind.CallSignature );
declare_handler( generic_read, SyntaxKind.FunctionDeclaration, SyntaxKind.Constructor );

/**
 * @param {ts.FunctionLikeDeclaration|ts.SignatureDeclaration} node
 * @return {SimpleFunction}
 */
function generic_read( node )
{
    const nodeName = SyntaxKind[ node.kind ];
    const pseudoName = nodeName.replace( /^(.*?)(?:Type|Expression|Function|Signature|Declaration)?$/, '$1' ).toLowerCase();
    const func = new SimpleFunction( pseudoName, !nodeName.endsWith( 'Type' ) && !nodeName.endsWith( 'Signature' ) );

    func.functionKind = node.kind;

    if ( func.scope ) Scope.descend( func.scope );

    func.parameters = node.parameters && node.parameters.map( declaration );

    func.typeParameters = node.typeParameters && node.typeParameters.map( declaration );

    if ( node.type )
        func.type = handle_kind( node.type );

    if ( func.scope ) Scope.ascend();

    return func;
}

//
// /**
//  * @param {ts.FunctionLikeDeclaration|ts.SignatureDeclaration} node
//  * @param {object} fields
//  * @return {CallableType}
//  */
// function func_reader( node, fields )
// {
//     let parent = Scope.current.resolve( fields.name, true );
//
//     if ( !parent )
//     {
//         parent = { name: fields.name, type: new CallableType( fields.cname || safe( fields.name ) ), declaration: node };
//         Scope.current.bind( parent );
//     }
//     else
//         parent.declaration = add_to_list( parent.declaration, node );
//
//     const func = generic_read( node, fields, new SimpleFunction( parent ) );
//     // console.error( 'func reader:', $( {...parent, declaration: null}, 0 ) );
//     parent.type.signatures.push( func );
//
//     return parent;
// }
//
// /**
//  * @param {string} name
//  * @param {ts.FunctionTypeNode} node
//  * @return {CallableType}
//  */
// function function_type_read( name, node )
// {
//     return func_reader( node, { parameters: true, typeParameters: true, type: true, name: ANONYMOUS, cname: 'functiontype' } );
// }
//
// /**
//  * @param {string} name
//  * @param {ts.ConstructorDeclaration} node
//  * @return {CallableType}
//  */
// function constructor_type_read( name, node )
// {
//     return func_reader( node, { parameters: true, typeParameters: true, name: CONSTRUCTOR, cname: 'constructortype' } );
// }
//
// /**
//  * @param {string} name
//  * @param {ts.ConstructSignatureDeclaration} node
//  * @return {CallableType}
//  */
// function construct_signature_read( name, node )
// {
//     return func_reader( node, { parameters: true, typeParameters: true, name: CONSTRUCTOR } );
// }
//
// /**
//  * @param {string} name
//  * @param {ts.CallSignatureDeclaration} node
//  * @return {CallableType}
//  */
// function call_signature_read( name, node )
// {
//     return func_reader( node, { parameters: true, typeParameters: true, type: true, name: CALL } );
// }
//
// /**
//  * @param {string} name
//  * @param {ts.MethodSignature|ts.MethodDeclaration} node
//  * @return {CallableType}
//  */
// function method_signature_read( name, node )
// {
//     return func_reader( node, { parameters: true, typeParameters: true, type: true, name: binding_name( node.name ), cname: 'method' } );
// }
