/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/

import chalk              from 'chalk';
import tree               from 'text-treeview';
import { isSymbol, safe } from "./utils";

const dangerousNames = Object.getOwnPropertyNames( Object.getPrototypeOf( {} ) );

const escapeName = name => dangerousNames.includes( name ) || name.startsWith( '__' ) ? '__' + name : name;
const unescapeName = name => name.startsWith( '__' ) ? name.substr( 2 ) : name;
const INDENT_SIZE = 2;
const _spaces = indent => ' '.repeat( indent * INDENT_SIZE );

/** */
export class Scope
{
    /**
     * @param {?Scope} [outer]
     * @param {ValueType} [createdBy]
     */
    constructor( outer, createdBy )
    {
        this.outer = outer;
        this.inner = [];
        this.createdBy = createdBy;
        /** @type {Map<string, Array<Binding>>} */
        this.symbols = new Map();
        this.parameters = {};
        this._ambient = true;
    }

    setAmbient( onOff )
    {
        this._ambient = onOff;
    }

    isAmbient()
    {
        return this._ambient;
    }

    /**
     * @return {boolean}
     */
    get isEmpty()
    {
        return this.symbols.size === 0;
    }

    /**
     * @param {Scope|Type} [scope]
     * @param {Type} [creator]
     */
    add( scope, creator )
    {
        if ( !( scope instanceof Scope ) )
        {
            creator = scope;
            scope = void 0;
        }
        const s = scope || new Scope( this, creator );
        if ( creator && !s.createdBy ) s.createdBy = creator;

        this.inner.push( s );

        return s;
    }

    static all_functions( ...bindings )
    {
        return bindings.every( b => b.getBaseTypeAsString() === 'function' );
    }

    /**
     * @param {string|symbol} name
     * @param {Binding} binding
     */
    bind( name, binding )
    {
        const _name = safe( name );
        const __name = isSymbol( name ) ? name : escapeName( name );

        if ( this.symbols.has( __name ) )
        {
            const syms = this.symbols.get( __name );
            const allFuncs = Scope.all_functions( binding, ...syms );

            if ( name === 'NaN' )
            {
                console.error( `allFuncs: ${allFuncs}, syms.length: ${syms.length}, isType? ${binding.isType}, syms[0].isType: ${syms[ 0 ].isType}` );
            }

            if ( !allFuncs && ( syms.length !== 1 || binding.isType === syms[ 0 ].isType ) )
            {
                if ( syms.length === 1 && !syms[ 0 ].isIdenticalType( binding ) )
                    throw new Error( `Duplicate identifier declaration "${_name}"` );
            }

            if ( binding.getBaseTypeAsString() !== 'function' )
            {
                syms.push( binding );
                return;
            }

            if ( !binding.isOverloaded )
                throw new Error( `Duplicate identifier declaration "${_name}"` );

            const mangledName = binding.getMangled( _name );
            const found = syms.find( prior => prior.getMangled( _name ) === mangledName );

            if ( found && !this.isAmbient() )
                throw new Error( `Duplicate overloaded function found for "${_name}"` );
            else if ( !found )
                syms.push( binding );
        }
        else
            this.symbols.set( __name, [ binding ] );
    }

    /**
     * @param {string|symbol} name
     * @param {Binding} binding
     * @param {string} paramType
     * @return {number}
     */
    bind_as_parameter( name, binding, paramType )
    {
        this.bind( name, binding );

        if ( !this.parameters )
            this.parameters = {};

        const p = this.parameters[ paramType ] || ( this.parameters[ paramType ] = [] );

        p.push( { name, binding } );

        return p.length - 1;
    }

    /**
     * @param {string|symbol} name
     * @return {Array<Binding>|undefined}
     */
    local( name )
    {
        const _name = isSymbol( name ) ? name : escapeName( name );

        return this.symbols.get( _name );
    }

    resolve( name )
    {
        const _name = isSymbol( name ) ? name : escapeName( name );

        return this.symbols.get( _name ) || ( this.outer && this.outer._resolve( _name ) );
    }

    _resolve( name )
    {
        return this.symbols.get( name ) || ( this.outer && this.outer._resolve( name ) );
    }

    /**
     * @return {Map<string, Array<Binding>>}
     */
    * [ Symbol.iterator ]()
    {
        yield * this.symbols;
    }

    /**
     * @param {string} paramType
     * @return {*}
     */
    get_all_parameter_bindings( paramType )
    {
        return this.parameters[ paramType ];
    }

    stringify( indent = 0 )
    {
        const _print = name => b => Scope._print_binding( b.add_modifiers( name ), b, indent + 1 );
        const lines = [];
        const creator = this.createdBy || '<no creator>';

        if ( !this.isEmpty ) lines.push( chalk.cyanBright.italic( `${_spaces( indent )}scope created by ${creator}` ) );

        for ( const [ name, bindings ] of this )
        {
            const named = _print( name );

            if ( bindings.length === 1 )
                lines.push( named( bindings[ 0 ] ) );
            else
                lines.push( ...bindings.map( named ) );
        }

        return lines.join( '\n' );
    }

    treeify()
    {
        return tree( [
            {
                text:     `scope created by ${this.createdBy || '<no creator>'}`,
                children: this._treeify()
            }
        ] );
    }

    _treeify()
    {
        let lines = [];

        if ( this.isEmpty ) return [];

        for ( const [ name, bindings ] of this )
        {
            lines.push( ...bindings.map( binding => {
                const r = {
                    text: `${safe( binding.add_modifiers( name ) )}: ` + ( `${binding}` || binding.getBaseTypeAsString() )
                };

                if ( binding.scope && !binding.scope.isEmpty )
                    r.children = binding.scope._treeify();

                return r;
            } ) );
        }

        return lines;
    }

    static _print_binding( name, binding, indent )
    {
        const spaces = _spaces( indent );

        let bindType = `${binding}` || binding.getBaseTypeAsString();
        let line = `${spaces}${name} -> ${bindType}`;

        if ( binding.scope && !binding.scope.isEmpty )
            line += '\n' + binding.scope.stringify( indent + 1 );

        return line;
    }

    /** */
    static descend( scope )
    {
        Scope.stack.push( Scope.current );
        if ( !scope )
            throw new Error( "Descending into undefined scope" );
        return Scope.current = scope;
    }

    /** */
    static ascend()
    {
        return Scope.current = Scope.stack.pop();
    }
}

Scope.global = new Scope();
Scope.current = Scope.global;
Scope.stack = [];
