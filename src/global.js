/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/
"use strict";

const
    escope  = require( 'escope' ),
    Scope = require( './scope' ),

    globals = {
        scopeManager: null,
        topNode:      null,
        scope_from_ast,
        resolve_binding,
        resolve_definition,
        globalScope: new Scope()
    };

function create_scopes( ast )
{
    globals.topNode = ast;
    globals.scopeManager = escope.analyze( ast );
}

function scope_from_ast( node = globals.topNode )
{
    let scope = globals.scopeManager.acquire( node );

    while ( !scope && node )
    {
        node = node.parent;
        scope = globals.scopeManager.acquire( node );
    }

    if ( !scope ) scope = globals.scopeManager.acquire( globals.topNode );

    return scope;
}

/**
 * @param {Node} node
 * @param {string} name
 * @return {object}
 * @private
 */
function _find_var( node, name )
{
    const err = () => new ReferenceError( `Identifier not found: "${name}" in line ${node.loc.start.line}` );
    let scope = scope_from_ast( node );

    if ( !scope ) return err();

    let id = scope.variables.find( v => v.name === name );

    if ( id )
        return id;

    scope = scope.upper;

    while ( scope && !id )
    {
        id = scope.variables.find( v => v.name === name );
        scope = scope.upper;
    }

    return id || err();
}

/**
 * @param {Node} node
 * @param {string} name
 * @return {Error|Binding}
 */
function resolve_binding( node = globals.topNode, name )
{
    const v = _find_var( node, name );

    return v instanceof Error ? v : v.binding;
}

/**
 * @param {Node} node
 * @param {string} name
 * @return {Error|Definition}
 */
function resolve_definition( node = globals.topNode, name )
{
    const err = () => new ReferenceError( `Identifier declared but not defined: "${name}" in line ${node.loc.start.line}` );
    const v = _find_var( node, name );

    if ( v instanceof Error ) return v;

    let def = v.binding.firstDefinition;

    if ( !def ) return err();

    while ( def && !def.usages.includes( node ) )
        def = def.next;

    return def || err();
}

create_scopes( { type: 'Program', sourceType: 'module', body: [] } );

module.exports = globals;
