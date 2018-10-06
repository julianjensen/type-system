/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/
"use strict";

const
    TypeReference                   = require( './type-reference' ),
    Binding                         = require( './binding' ),
    { globalScope, scope_from_ast } = require( './global' ),
    { InterfaceType }               = require( "./instance" );

const DECL = {
    INTERFACE:   'InterfaceDeclaration',
    CONSTRUCTOR: 'ConstructSignature',
    METHOD:      'MethodSignature',
    CALL:        'CallSignature',
    SIGNATURE:   'Signature',
    VARIABLE:    'VariableDeclaration',
    PROPERTY:    'PropertySignature',
    TYPEPARAM:   'TypeParameter',
    THIS:        'ThisType',
    INDEX:       'IndexSignature',

    TYPE: 'RAW_TYPE'
};

const primitiveToRef = {
    number:      'Number',
    string:      'String',
    boolean:     'Boolean',
    'null':      'Null',
    'undefined': 'Void',
    'void':      'Void',
    any:         'Any',
    never:       'Never'
};

const notHandling = new Set();
const notHandlingKeys = new Map();

/**
 *
 * @param {string} name
 * @param {NodeDeclaration} decl
 */
function process_definition( name, decl )
{
    let binding, type;

    switch ( decl.kind )
    {
        case DECL.VARIABLE:
            type = new TypeReference( name );
            binding = create_binding( name, type );
            globalScope.add( name, binding );
            break;

        case DECL.INTERFACE:
            type = new InterfaceType( name );
            binding = create_binding( name, type ).ambient();
            globalScope.add( name, binding );
            break;

        default:
            notHandling.add( decl.kind );
            const keys = notHandlingKeys.get( decl.kind );

            if ( !keys )
                notHandlingKeys.set( decl.kind, new Set( Object.keys( decl ) ) );
            else
                Object.keys( decl ).forEach( key => keys.add( key ) );
            break;
    }
}

/**
 * 'name', 'value', 'type', 'declaration', 'scope', 'parameter', 'firstDefinition'
 */
function create_binding( name, type, declNode )
{
    const scope = declNode ? scope_from_ast( declNode ) : globalScope;

    return new Binding( { name, type, declaration: declNode, scope } );
}

module.exports = {
    process_definition,
    notHandling,
    notHandlingKeys
};
