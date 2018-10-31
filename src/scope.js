/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/
"use strict";

import { get_options, logger, safe }                              from "./utils";
import { DEBUG }                                                  from "./constants";

const { SCOPE: { FINAL, SYMBOL, SCOPE, EXTENDED }, LINENUMBER } = DEBUG;
const TAB_SIZE = 4;
const right = indent => ' '.repeat( indent * TAB_SIZE );
const allScopes = new Set();

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
    }

    get logger()
    {
        if ( this._logger ) return this._logger;

        this._logger = logger.scope( 'scope', ...this.path_name() );

        return this._logger;
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

    /**
     * @param {BindingInfo} own
     * @return {Scope}
     */
    set_owner( own )
    {
        this.owner = own;
        own.scope = this;

        return this;
    }

    bind( binding )
    {
        if ( binding.isBound ) return binding;

        binding.isBound = true;
        this.add( binding.name, binding );

        return binding;
    }

    add( name, binding )
    {
        // binding.declaration = null;     // Removed because the AST is huge when printing out debug info
        this.symbols.set( name, binding );
        if ( binding.type ) binding.type.boundTo = binding;
        binding.scope = this;

        if ( Scope.DEBUG & SYMBOL )
        {
            const bname = binding.toString();
            const _name = name === bname ? name : `'${safe( name )}' (${bname})`;

            this.log( "Adding symbol %s to %s", _name, this.short() );
        }

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
     * @param {BindingInfo} own
     * @return {Scope}
     */
    add_inner( own )
    {
        const child = new Scope( this );

        this.inner.push( child );

        if ( own ) child.set_owner( own );

        if ( Scope.DEBUG & SCOPE )
            this.log( "Adding child scope %s inside %s", child.short(), this.short() );

        return child;
    }

    remove()
    {
        return Scope.remove( this );
    }

    resolve( name, localOnly = false )
    {
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
        return [ ...this.symbols.entries() ].map( ( [ name, { type } ] ) => Scope.str_symbol( indent, name, `${type}`, type ) ).join( '\n' );
    }

    getOwnSymbols()
    {
        return [ ...this.symbols.entries() ].map( ( [ name, { type } ] ) => Scope.str_symbol( 0, name, `${type}`, type ) );
    }

    stringify( indent = 0 )
    {
        let name = this.owner && `${this.owner}`;

        if ( !name ) name = 'null';

        const scopeSyms = `[symbols: ${this.numSymbols()}/${this.numSymbols( false )}, scopes: ${this.numScopes()}/${this.numScopes( false )}]`;

        const selfSymbols = this.isEmpty() ? '' : `${right( indent )}${name} ${scopeSyms} =>\n${this.toString( indent + 1 )}`;
        if ( indent === 2 )
        {
            // return selfSymbols + ', inner length = ' + this.inner.length + '\n' +
            //        this.inner.map( s => `  KEYS(${s.symbols.size}): ${[ ...s.symbols.keys() ].map( k => typeof k )}, inner length: ${s.inner.length}` ).join( '\n' );
        }
        const childSymbols = this.inner.length ? this.inner.map( s => s.stringify( indent + 1 ) ).filter( x => x ).join( '\n\n' ) : '';

        return selfSymbols || childSymbols ? `${selfSymbols}\n\n${childSymbols}` : selfSymbols ? `${selfSymbols}` : '';
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
     * @param name
     * @param typeName
     * @param type
     * @return {string}
     */
    static str_symbol( indent, name, typeName, type )
    {
        const cname = c => c && c.constructor && c.constructor.name || 'no c name';
        const source = () => typeof type.cloc === 'function' ? ` // ${type.cloc()} <-- ${type.ploc()} [${cname(type)}]` : '';

        return `${right( indent )}${safe( name )}: ${typeName} ${LINENUMBER ? source() : ''}`;
    }
}

Scope.global = new Scope();
Scope.current = Scope.global;
Scope.stack = [];
Scope.global.set_owner( { name: 'global', toString() { return 'global'; } } );
Scope.allScopes = allScopes;

Scope.DEBUG = FINAL | SYMBOL | SCOPE | EXTENDED;

