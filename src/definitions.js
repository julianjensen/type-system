/**
 * @typedef {object} BindingInfo
 * @property {*} value
 * @property {?string} [name]    - Redundant, comes from scope binding
 * @property {?Type} type
 * @property {Node} [declaration]
 * @property {?Scope} [scope]
 * @property {string} [parameter]     - Add function parameters to symbols as variable but point to parameter in func. Values: "formal" or "type"
 * @property {number} [parameterIndex]     - Add function parameters to symbols as variable but point to parameter in func.
 * @property {?Definition} firstDefinition
 * @property {boolean} [isAbstract]
 * @property {boolean} [isAsync]
 * @property {boolean} [isConst]
 * @property {boolean} [isDeclare]
 * @property {boolean} [isDefault]
 * @property {boolean} [isExport]
 * @property {boolean} [isPublic]
 * @property {boolean} [isPrivate]
 * @property {boolean} [isProtected]
 * @property {boolean} [isReadonly]
 * @property {boolean} [isStatic]
 * @property {boolean} [isBound]
 */

/**
 * @class Binding
 * @implements NamedObject
 * @mixes BindingInfo
 */

/**
 * @typedef {object} Definition
 * @property {Node} definition
 * @property {?Binding} declaration
 * @property {?Definition} previous
 * @property {?Definition} next
 * @property {Array<Node>} usages
 */

/**
 * @typedef {IdealFunction|IdealObject|IdealArray} InstanceType
 */

/**
 * @typedef {object} Instance
 * @implements IdealObject
 * @property {?(IdealObject|IdealType)} [proto=IdealObject]
 */

/**
 * @typedef {object} ActualFunction
 * @implements IdealSignature
 * @implements IdealObject
 * @implements IdealTypeParameters
 */

/**
 * @typedef {object} ActualObject
 * @implements IdealObject
 * @implements IdealTypeParameters
 */

/**
 * @typedef {object} IdealModule
 * @implements NamedObject
 * @implements IdealObject
 */

/**
 * @typedef {object} IdealNamespace
 * @implements NamedObject
 * @implements IdealObject
 */

/**
 * @typedef {object} ActualClass
 * @implements IdealSignature
 * @implements IdealObject
 * @implements IdealTypeParameters
 */

/**
 * @typedef {object} ActualArray
 * @implements IdealSignature
 * @implements IdealObject
 * @implements IdealArray
 * @implements IdealTypeParameters
 */

/**
 * @typedef {object} ActualTuple
 * @implements IdealSignature
 * @implements IdealObject
 * @implements IdealTuple
 * @implements IdealTypeParameters
 */

/**
 * @interface NamedObject
 * @property {string} [name]
 */

/**
 * @interface IdealSignature
 * @property {function} add_return_type
 * @property {function} add_parameter       - FORMAL or TYPE
 * @property {function} add_parameters      - Same as above, except ...args
 * @property {function} stringify
 * @property {number} flags                 - CONSTRUCTOR, METHOD
 * @property {function} match               - Given an AST (or whatever), do the signatures match?
 * @property {Array<ActualParameter>} parameters
 */

/**
 * @typedef {object} ActualParameter
 * @implements NamedObject
 * @implements IdealParameter
 */

/**
 * @interface IdealParameter
 * @property {string} name
 * @property {IdealType} type
 * @property {number} flags
 */

/**
 * @typedef {object} IdealFunction
 * @property {Array<IdealFunction>} signatures
 * @property {function} add_signature
 * @property {function(type, function(IdealSignature, object)):boolean} find - `type` is one of CONSTRUCTOR, METHOD, FUNCTION, ANY
 */

/**
 * @typedef {object} IdealClass
 * @property {function} add_function    - Pass function and signature
 * @property {function} add_signature   - Pass function and signature
 * @property {function} add_constructor - Like above `add_function`
 * @property {function} add_constructor_signature - Like above `add_signature`
 * @property {function} add_property
 */

/**
 * @interface IdealProperty
 * @property {IdealType} type
 * @property {number} flags
 */

/**
 * @interface IdealType
 * @property {?ActualObject} [proto]
 */

/**
 * @interface IdealObject
 * @property {Map<string, IdealProperty>} properties
 * @property {function} add_property
 * @property {function(type, function(IdealProperty, string, object)):boolean} find - `type` is one of PROPERTY, SIGNATURE, ANY
 */

/**
 * @typedef {object} ActualTypeParameter
 * @implements NamedObject
 * @implements IdealTypeParameter
 */

/**
 * @typedef {object} ActualTypeParameters
 * @implements IdealTypeParameters
 */
/**
 * @interface IdealTypeParameter
 * @property {IdealTypeParameter|IdealType} [keyOf]
 * @property {IdealType} [constraint]
 */

/**
 * @interface IdealTypeParameters
 * @property {Array<IdealTypeParameter>} typeParameters
 * @property {function} resolve
 */

/**
 * @interface IdealTypeArgument
 * @property {IdealType} [type]
 * @property {string} unresolvedName
 * @property {boolean} isResolved
 */

/**
 * @interface IdealTypeArguments
 * @property {Array<IdealTypeArgument>} typeArguments
 * @property {function} resolve
 */

/**
 * @typedef {object} ActualReference
 * @implements NamedObject
 * @implements IdealReference
 */
/**
 * @interface IdealReference
 * @property {IdealType} [type]
 * @property {boolean} isResolved
 * @property {IdealTypeArguments} typeArguments
 */

/**
 * @interface IdealArray
 * @property {?IdealType} elementType
 */

/**
 * @interface IdealTuple
 * @property {Array<IdealType>} elementTypes
 */

/**
 * @typedef {BlockStatement|Function|SwitchStatement|CatchClause|Program} ASTScopeNode
 */

/**
 * @typedef {object} ActualScope
 * @property {?ActualScope} outer
 * @property {Array<ActualScope>} inner
 * @property {Map<name, Binding>} symbols
 * @property {?(IdealType|ASTScopeNode)} definedBy
 */

/**
 * @typedef {object} DefinitionNodes
 * @property {string} kind  - Always "SourceFile"
 * @property {Array<NodeVariable|NodeInterface>} locals
 */

/**
 * @typedef {object} NamedKind
 * @property {string} name
 * @property {string} decl
 */

/**
 * @typedef {object} NodeVariable
 * @mixes NamedKind
 * @property {Array<NodeDeclaration>} decls
 */

/**
 * @typedef {object} NodeInterface
 * @mixes NamedKind
 * @property {Array<NodeDeclaration>} members
 */

/**
 * @typedef {object} NodeDeclaration
 * @mixes NamedKind
 * @property {Array<NodeDecl>} decls
 */

/**
 * @typedef {object} NodeDecl
 * @property {string} decl
 * @property {string} kind
 * @property {string|NodeType} type
 */

/**
 * @typedef {object} NodeFunction
 * @property {string|NodeType} type
 * @property {Array<NodeParameter>} [parameters]
 */

/**
 * @typedef {object} NodeParameter
 * @property {string} name
 * @property {boolean} [isArray]
 * @property {boolean} [rest]
 * @property {boolean} [optional]
 * @property {string|NodeType} type
 * @property {string|NodeType} [typeName]
 */

/**
 * @typedef {object} NodeType
 * @property {string|NodeType} type
 * @property {string|NodeType} [typeName]
 * @property {Array<NodeType>} [parameters]             - For index
 * @property {Array<string|NodeType>} [typeArguments]
 * @property {Array<NodeDeclaration>} [members]         - For typeliteral
 * @property {boolean} [isArray]
 */

