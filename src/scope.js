/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/

import { FORMAL, get_options, isObject, logger, safe, TYPE } from "./utils";
import { DEBUG }                                             from "./constants";
import { SyntaxKind }                                        from "typescript";
import { get_primitive, Primitive }                          from "./types/primitives";
import { Binding }                                           from "./binding";

const { SCOPE: { FINAL, SYMBOL, SCOPE, EXTENDED }, LINENUMBER } = DEBUG;
const TAB_SIZE = 4;
const right = indent => ' '.repeat( indent * TAB_SIZE );
const allScopes = new Set();

const getSourceFile = binding => {
    let n = Array.isArray( binding.declaration ) ? binding.declaration[ 0 ] : binding.declaration;

    while ( n && n.kind !== SyntaxKind.SourceFile )
        n = n.parent;

    return n && n.fileName;
};

/**
 * @class
 */
export class Scope
{
    constructor( outer = null )
    {
        this._logger = null;
        this.outer = outer;
        this.inner = [];
        this.symbols = new Map();
        this.owner = { name: 'no owner set', toString() { return this.name; } };
        allScopes.add( this );
        this.typeIndex = 0;
        this.formalIndex = 0;
    }

    get logger()
    {
        if ( this._logger ) return this._logger;

        this._logger = logger.scope( 'scope', ...this.path_name() );

        return this._logger;
    }

    getIndex( ptype )
    {
        return ptype === FORMAL ? this.formalIndex++ : ptype === TYPE ? this.typeIndex++ : -1;
    }

    path_name()
    {
        return this.outer ? [ ...this.outer.path_name(), this.owner_name() ] : [ 'global' ];
    }

    log( ...args )
    {
        if ( !get_options().verbose ) return;
        this.logger.log( ...args );
    }

    // /**
    //  * @param {Binding} own
    //  * @return {Scope}
    //  */
    // set_owner( own )
    // {
    //     // this.owner = own;
    //     // own.scope = this;
    //
    //     return this;
    // }

    /**
     * @param {BindingInfo|Binding} binding
     * @return {*}
     */
    bind( binding )
    {
        if ( binding.isBound ) return binding;

        binding.isBound = true;
        this.add( binding.name, binding );

        if ( isObject( binding.value ) && binding.value.scope && !this.owner )
            this.owner = binding;

        return binding;
    }

    add( name, binding )
    {
        // binding.declaration = null;     // Removed because the AST is huge when printing out debug info
        this.symbols.set( name, binding );
        if ( isObject( binding.value ) ) binding.value.boundTo = binding;
        binding.scope = this;

        if ( Scope.DEBUG & SYMBOL )
        {
            const bname = binding.toString();
            const _name = name === bname ? name : `'${safe( name )}' (${bname})`;

            this.log( "Adding symbol %s to %s", _name, this.short() );
        }

        if ( !( binding instanceof Binding ) )
            binding = new Binding( binding );

        // if ( typeof binding.toString !== 'function' )
        //     binding.toString = () => `Binding (placeholder) for "${binding.type}"`;

        return this;
    }

    info( extended = Scope.DEBUG & EXTENDED )
    {
        return extended ? {
            numSymbols: this.symbols.size,
            symbols:    [ ...this.symbols.values() ].map( v => `${v.type}` )
        } : {
            numSymbols: this.symbols.size
        };
    }

    /**
     * @return {Scope}
     */
    add_inner()
    {
        const child = new Scope( this );

        this.inner.push( child );

        // if ( own ) child.set_owner( own );

        if ( Scope.DEBUG & SCOPE )
            this.log( "Adding child scope %s inside %s", child.short(), this.short() );

        return child;
    }

    /**
     * @return {boolean|*}
     */
    remove()
    {
        return Scope.remove( this );
    }

    /**
     * @param {string} name
     * @param {boolean} [localOnly=false]
     * @return {?Binding}
     */
    resolve( name, localOnly = false )
    {
        const prim = get_primitive( name );

        if ( prim ) return prim;

        if ( this.symbols.has( name ) )
            return this.symbols.get( name );

        if ( this.outer && !localOnly )
            return this.outer.resolve( name );

        return null;
    }

    find( predicate, localOnly = false )
    {
        for ( const [ name, binding ] of this.symbols )
            if ( predicate( name, binding.type ) ) return { name, binding };

        if ( this.outer && !localOnly )
            this.outer.find( predicate );
    }

    /**
     * @param {number} [indent]
     * @return {string}
     */
    toString( indent = 0 )
    {
        return [ ...this.symbols.entries() ]
        // .filter( ( [ , binding ] ) => binding && binding.type && !( binding.type instanceof Primitive ) && !binding.isParameter )
            .map( ( [ , binding ] ) => Scope.str_symbol( indent, binding ) ).join( '\n' ); // name, `${type}`, type ) ).join( '\n' );
    }

    getOwnSymbols()
    {
        return [ ...this.symbols.entries() ].map( ( [ , binding ] ) => Scope.str_symbol( 0, binding ) ); // name, `${type}`, type ) );
    }

    stringify( indent = 0 )
    {
        try
        {
            let name = this.owner && `${this.owner}`;

            if ( !name ) name = 'null';

            const scopeSyms = `[symbols: ${this.numSymbols()}/${this.numSymbols( false )}, scopes: ${this.numScopes()}/${this.numScopes( false )}]`;
            const selfSymbols = this.isEmpty() ? '' : `${right( indent )}${name} ${scopeSyms} =>\n${this.toString( indent + 1 )}`;
            const childSymbols = this.inner.length ? this.inner.map( s => s.stringify( indent + 1 ) ).filter( x => x ).join( '\n\n' ) : '';

            return selfSymbols || childSymbols ? `${selfSymbols}\n\n${childSymbols}` : selfSymbols ? `${selfSymbols}` : '';
        }
        catch ( err )
        {
            console.error( 'stringify bomb' );
            console.error( err );
            process.exit( 1 );
        }
    }

    short()
    {
        const oname = this.owner_name();

        return `Scope: ${safe( oname )}`;
    }

    owner_name()
    {
        return this.owner ? this.owner.boundTo || this.owner.__name || this.owner.name || this.owner.constructor.name : typeof this.owner;
    }

    toJSON()
    {
        return {
            symbols: this.getOwnSymbols(),
            owner:   this.owner_name(),
            inner:   this.inner.map( s => s.toJSON() )
        };
    }

    isEmpty()
    {
        return !this.symbols.size && !this.inner.length;
    }

    numSymbols( deep = true )
    {
        if ( deep )
            return this.inner.reduce( ( cnt, inner ) => cnt + inner.numSymbols( deep ), 0 ) + this.symbols.size;

        return this.symbols.size;
    }

    numScopes( deep = true )
    {
        if ( deep )
            return this.inner.reduce( ( cnt, inner ) => cnt + inner.numScopes( deep ), 0 ) + this.inner.length;

        return this.inner.length;
    }

    static remove( scope )
    {
        if ( !scope || !scope.outer ) return false;

        const prev = scope.outer.inner.length;

        scope.outer.inner = scope.outer.inner.filter( s => s !== scope );

        return scope.outer.inner.length !== prev;
    }

    static descend( scope )
    {
        Scope.stack.push( Scope.current );
        return Scope.current = scope;
    }

    static ascend()
    {
        return Scope.current = Scope.stack.pop();
    }

    /**
     * @param indent
     * @param {BindingInfo} binding
     * @return {string}
     */
    static str_symbol( indent, binding ) // name, typeName, type )
    {
        return `${right( indent )}${binding}`;
        const { name, type, value } = binding;
        let typeName = `${type}`;
        const cname = c => c && c.constructor && c.constructor.name || 'no c name';
        const source = () => type && typeof type.cloc === 'function' ? ` // ${type.cloc()} <-- ${type.ploc()} [${cname( type )}]` : '';

        if ( typeName.startsWith( '[object Object]' ) )
            typeName = '----------------> ERROR, no toString() for ' + cname( type ) + ', source file: ' + getSourceFile( binding );
        else if ( typeName === 'undefined' )
            typeName = '----------------> ERROR, type is undefined for ' + safe( name ) + ', source file: ' + getSourceFile( binding );

        if ( !isObject( value ) || !value.isType )
            return `${right( indent )}${typeName} ${LINENUMBER ? source() : ''}`;

        return `${right( indent )}${safe( name )}: ${typeName} ${LINENUMBER ? source() : ''}`;
    }
}

Scope.global = new Scope();
Scope.current = Scope.global;
Scope.stack = [];
Scope.current.owner = new Binding( { name: 'global', type: 'namespace' } );
Scope.allScopes = allScopes;

Scope.DEBUG = FINAL | SYMBOL | SCOPE | EXTENDED;

