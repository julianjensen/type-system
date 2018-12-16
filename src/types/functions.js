/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/

import { Scope }                                                            from "../scope";
import { SyntaxKind }                                                       from "../ts-helpers";
import { safe, TYPE }                                                       from "../utils";
import { baseTypesToString, declare_handler, handle_kind, pseudo_typename } from "../ts-utils";
import { declaration }                                                      from "../create-type";
import { Type }                                                             from "./base-type";

/** */
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
        this.scope = Scope.current.add( this );
        /** @type {Array<Binding>} */
        this.parameters = [];
        /** @type {Array<Binding>} */
        this.typeParameters = [];
        this.type = null;
        this.functionKind = SyntaxKind.AnyKeyword;
        this._funcName = null;
        this.baseType = baseTypesToString[ SyntaxKind.FunctionKeyword ];
    }

    /**
     * @return {SimpleFunction}
     */
    mangle()
    {
        const paramsEnd = this.parameters.findIndex( p => p.isRest );
        const typeParams = this.typeParameters && this.typeParameters.length ? this.typeParameters.map( p => p.getMangled() ).join( '-' ) : '';

        // @todo This can't be base type name, it has to be the actual type name. How to get it from here?
        this.__mangled = '()~' + ( typeParams ? `${typeParams}~` : '' ) + this.parameters.slice( 0, paramsEnd === -1 ? this.parameters.length : paramsEnd ).map( p => p.valueType.definition.__mangled || p.getBaseTypeAsString() ).join( '!' );
        return this;
    }

    /**
     * @return {string}
     */
    toString()
    {
        const pp = _p => _p && _p.length ? `( ${_p.map( p => `${p}` ).join( ' , ' )} )` : '()';
        const returnType = this.type ? `${this.type}` : '';
        const rtypeChar = returnType ? ( this.functionKind === SyntaxKind.FunctionType ? ' => ' : ': ' ) : '';
        const typeParams = this.scope.get_all_parameter_bindings( TYPE ) || [];

        const strTP = typeParams.length ? `<${typeParams.map( ( { name, binding } ) => `${name}${binding}` ).join( ', ' )}>` : '';


        return this.annotate_type( `${safe( this.parent ? this.parent.name : '' )}${strTP}${pp( this.parameters )}${rtypeChar}${returnType}` );
    }
}

declare_handler( generic_read, SyntaxKind.ConstructorType, SyntaxKind.FunctionType, SyntaxKind.FunctionExpression, SyntaxKind.ArrowFunction );
declare_handler( generic_read, SyntaxKind.MethodSignature, SyntaxKind.IndexSignature, SyntaxKind.ConstructSignature, SyntaxKind.CallSignature );
declare_handler( generic_read, SyntaxKind.FunctionDeclaration, SyntaxKind.Constructor );

/**
 * @param {ts.FunctionLikeDeclaration|ts.SignatureDeclaration} node
 * @return {SimpleFunction}
 */
function generic_read( node )
{
    const pseudoName = pseudo_typename( node );
    const func = new SimpleFunction( pseudoName, !SyntaxKind[ node.kind ].endsWith( 'Type' ) && !SyntaxKind[ node.kind ].endsWith( 'Signature' ) );

    func.functionKind = node.kind;

    if ( func.scope ) Scope.descend( func.scope );

    func.parameters = node.parameters && node.parameters.map( declaration );

    func.typeParameters = node.typeParameters && node.typeParameters.map( declaration );

    if ( node.type )
        func.type = handle_kind( node.type );

    func.mangle();
    // console.error( `mangled: ${func.__mangled}` );
    if ( func.scope ) Scope.ascend();

    return func;
}
