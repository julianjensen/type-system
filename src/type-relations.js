/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/

export const enum TypeFlags {
    Any                     = 1 << 0,
        Unknown                 = 1 << 1,
        String                  = 1 << 2,
        Number                  = 1 << 3,
        Boolean                 = 1 << 4,
        Enum                    = 1 << 5,
        BigInt                  = 1 << 6,
        StringLiteral           = 1 << 7,
        NumberLiteral           = 1 << 8,
        BooleanLiteral          = 1 << 9,
        EnumLiteral             = 1 << 10,  // Always combined with StringLiteral, NumberLiteral, or Union
        BigIntLiteral           = 1 << 11,
        ESSymbol                = 1 << 12,  // Type of symbol primitive introduced in ES6
        UniqueESSymbol          = 1 << 13,  // unique symbol
        Void                    = 1 << 14,
        Undefined               = 1 << 15,
        Null                    = 1 << 16,
        Never                   = 1 << 17,  // Never type
        TypeParameter           = 1 << 18,  // Type parameter
        Object                  = 1 << 19,  // Object type
        Union                   = 1 << 20,  // Union (T | U)
        Intersection            = 1 << 21,  // Intersection (T & U)
        Index                   = 1 << 22,  // keyof T
        IndexedAccess           = 1 << 23,  // T[K]
        Conditional             = 1 << 24,  // T extends U ? X : Y
        Substitution            = 1 << 25,  // Type parameter substitution
        NonPrimitive            = 1 << 26,  // intrinsic object type
        /* @internal */
        ContainsWideningType    = 1 << 27,  // Type is or contains undefined or null widening type
        /* @internal */
        ContainsObjectLiteral   = 1 << 28,  // Type is or contains object literal type
        /* @internal */
        ContainsAnyFunctionType = 1 << 29,  // Type is or contains the anyFunctionType

        /* @internal */
        AnyOrUnknown = Any | Unknown,
        /* @internal */
        Nullable = Undefined | Null,
        Literal = StringLiteral | NumberLiteral | BigIntLiteral | BooleanLiteral,
        Unit = Literal | UniqueESSymbol | Nullable,
        StringOrNumberLiteral = StringLiteral | NumberLiteral,
        /* @internal */
        StringOrNumberLiteralOrUnique = StringLiteral | NumberLiteral | UniqueESSymbol,
        /* @internal */
        DefinitelyFalsy = StringLiteral | NumberLiteral | BigIntLiteral | BooleanLiteral | Void | Undefined | Null,
        PossiblyFalsy = DefinitelyFalsy | String | Number | BigInt | Boolean,
        /* @internal */
        Intrinsic = Any | Unknown | String | Number | BigInt | Boolean | BooleanLiteral | ESSymbol | Void | Undefined | Null | Never | NonPrimitive,
        /* @internal */
        Primitive = String | Number | BigInt | Boolean | Enum | EnumLiteral | ESSymbol | Void | Undefined | Null | Literal | UniqueESSymbol,
        StringLike = String | StringLiteral,
        NumberLike = Number | NumberLiteral | Enum,
        BigIntLike = BigInt | BigIntLiteral,
        BooleanLike = Boolean | BooleanLiteral,
        EnumLike = Enum | EnumLiteral,
        ESSymbolLike = ESSymbol | UniqueESSymbol,
        VoidLike = Void | Undefined,
        /* @internal */
        DisjointDomains = NonPrimitive | StringLike | NumberLike | BigIntLike | BooleanLike | ESSymbolLike | VoidLike | Null,
        UnionOrIntersection = Union | Intersection,
        StructuredType = Object | Union | Intersection,
        TypeVariable = TypeParameter | IndexedAccess,
        InstantiableNonPrimitive = TypeVariable | Conditional | Substitution,
        InstantiablePrimitive = Index,
        Instantiable = InstantiableNonPrimitive | InstantiablePrimitive,
        StructuredOrInstantiable = StructuredType | Instantiable,

        // 'Narrowable' types are types where narrowing actually narrows.
        // This *should* be every type other than null, undefined, void, and never
        Narrowable = Any | Unknown | StructuredOrInstantiable | StringLike | NumberLike | BigIntLike | BooleanLike | ESSymbol | UniqueESSymbol | NonPrimitive,
        NotUnionOrUnit = Any | Unknown | ESSymbol | Object | NonPrimitive,
        /* @internal */
        NotPrimitiveUnion = Any | Unknown | Enum | Void | Never | StructuredOrInstantiable,
        /* @internal */
        RequiresWidening = ContainsWideningType | ContainsObjectLiteral,
        /* @internal */
        PropagatingFlags = ContainsWideningType | ContainsObjectLiteral | ContainsAnyFunctionType,
        // The following flags are used for different purposes during union and intersection type construction
        /* @internal */
        NonWideningType = ContainsWideningType,
        /* @internal */
        Wildcard = ContainsObjectLiteral,
        /* @internal */
        EmptyObject = ContainsAnyFunctionType,
        /* @internal */
        ConstructionFlags = NonWideningType | Wildcard | EmptyObject,
        // The following flag is used for different purposes by maybeTypeOfKind
        /* @internal */
        GenericMappedType = ContainsWideningType
}



// An object type S is considered to be derived from an object type T if
// S is a union type and every constituent of S is derived from T,
// T is a union type and S is derived from at least one constituent of T, or
// S is a type variable with a base constraint that is derived from T,
// T is one of the global types Object and Function and S is a subtype of T, or
// T occurs directly or indirectly in an 'extends' clause of S.
// Note that this check ignores type parameters and only considers the
// inheritance hierarchy.




function isSimpleTypeRelatedTo(source, target, relation)
{
    const s = source.flags;
    const t = target.flags;

    if (t & TypeFlags.AnyOrUnknown || s & TypeFlags.Never || source === wildcardType) return true;

    if (t & TypeFlags.Never) return false;

    if (s & TypeFlags.StringLike && t & TypeFlags.String) return true;

    if (s & TypeFlags.StringLiteral && s & TypeFlags.EnumLiteral &&
        t & TypeFlags.StringLiteral && !(t & TypeFlags.EnumLiteral) &&
        (<LiteralType>source).value === (<LiteralType>target).value) return true;

    if (s & TypeFlags.NumberLike && t & TypeFlags.Number) return true;

    if (s & TypeFlags.NumberLiteral && s & TypeFlags.EnumLiteral &&
        t & TypeFlags.NumberLiteral && !(t & TypeFlags.EnumLiteral) &&
        (<LiteralType>source).value === (<LiteralType>target).value) return true;

    if (s & TypeFlags.BigIntLike && t & TypeFlags.BigInt) return true;
    if (s & TypeFlags.BooleanLike && t & TypeFlags.Boolean) return true;
    if (s & TypeFlags.ESSymbolLike && t & TypeFlags.ESSymbol) return true;
    if (s & TypeFlags.Enum && t & TypeFlags.Enum && isEnumTypeRelatedTo(source.symbol, target.symbol, errorReporter)) return true;
    if (s & TypeFlags.EnumLiteral && t & TypeFlags.EnumLiteral) {
        if (s & TypeFlags.Union && t & TypeFlags.Union && isEnumTypeRelatedTo(source.symbol, target.symbol, errorReporter)) return true;
        if (s & TypeFlags.Literal && t & TypeFlags.Literal &&
            (<LiteralType>source).value === (<LiteralType>target).value &&
                                                                  isEnumTypeRelatedTo(getParentOfSymbol(source.symbol)!, getParentOfSymbol(target.symbol)!, errorReporter)) return true;
    }
    if (s & TypeFlags.Undefined && (!strictNullChecks || t & (TypeFlags.Undefined | TypeFlags.Void))) return true;
    if (s & TypeFlags.Null && (!strictNullChecks || t & TypeFlags.Null)) return true;
    if (s & TypeFlags.Object && t & TypeFlags.NonPrimitive) return true;
    if (s & TypeFlags.UniqueESSymbol || t & TypeFlags.UniqueESSymbol) return false;
    if (relation === assignableRelation || relation === definitelyAssignableRelation || relation === comparableRelation) {
        if (s & TypeFlags.Any) return true;
        // Type number or any numeric literal type is assignable to any numeric enum type or any
        // numeric enum literal type. This rule exists for backwards compatibility reasons because
        // bit-flag enum types sometimes look like literal enum types with numeric literal values.
        if (s & (TypeFlags.Number | TypeFlags.NumberLiteral) && !(s & TypeFlags.EnumLiteral) && (
            t & TypeFlags.Enum || t & TypeFlags.NumberLiteral && t & TypeFlags.EnumLiteral)) return true;
    }
    return false;
}

/**
 * Compare two types and return
 * * Ternary.True if they are related with no assumptions,
 * * Ternary.Maybe if they are related with assumptions of other relationships, or
 * * Ternary.False if they are not related.
 */
function isRelatedTo(source: Type, target: Type, reportErrors = false, headMessage?: DiagnosticMessage, isApparentIntersectionConstituent?: boolean): Ternary {
    if (isFreshLiteralType(source)) {
        source = (<FreshableType>source).regularType;
    }
    if (isFreshLiteralType(target)) {
        target = (<FreshableType>target).regularType;
    }
    if (source.flags & TypeFlags.Substitution) {
        source = relation === definitelyAssignableRelation ? (<SubstitutionType>source).typeVariable : (<SubstitutionType>source).substitute;
    }
    if (target.flags & TypeFlags.Substitution) {
        target = (<SubstitutionType>target).typeVariable;
    }
    if (source.flags & TypeFlags.IndexedAccess) {
        source = getSimplifiedType(source);
    }
    if (target.flags & TypeFlags.IndexedAccess) {
        target = getSimplifiedType(target);
    }

    // Try to see if we're relating something like `Foo` -> `Bar | null | undefined`.
    // If so, reporting the `null` and `undefined` in the type is hardly useful.
    // First, see if we're even relating an object type to a union.
    // Then see if the target is stripped down to a single non-union type.
    // Note
    //  * We actually want to remove null and undefined naively here (rather than using getNonNullableType),
    //    since we don't want to end up with a worse error like "`Foo` is not assignable to `NonNullable<T>`"
    //    when dealing with generics.
    //  * We also don't deal with primitive source types, since we already halt elaboration below.
    if (target.flags & TypeFlags.Union && source.flags & TypeFlags.Object &&
        (target as UnionType).types.length <= 3 && maybeTypeOfKind(target, TypeFlags.Nullable)) {
        const nullStrippedTarget = extractTypesOfKind(target, ~TypeFlags.Nullable);
        if (!(nullStrippedTarget.flags & (TypeFlags.Union | TypeFlags.Never))) {
            target = nullStrippedTarget;
        }
    }

    // both types are the same - covers 'they are the same primitive type or both are Any' or the same type parameter cases
    if (source === target) return Ternary.True;

    if (relation === identityRelation) {
        return isIdenticalTo(source, target);
    }

    if (relation === comparableRelation && !(target.flags & TypeFlags.Never) && isSimpleTypeRelatedTo(target, source, relation) ||
        isSimpleTypeRelatedTo(source, target, relation, reportErrors ? reportError : undefined)) return Ternary.True;

    const isComparingJsxAttributes = !!(getObjectFlags(source) & ObjectFlags.JsxAttributes);
    if (isObjectLiteralType(source) && getObjectFlags(source) & ObjectFlags.FreshLiteral) {
        const discriminantType = target.flags & TypeFlags.Union ? findMatchingDiscriminantType(source, target as UnionType) : undefined;
        if (hasExcessProperties(<FreshObjectLiteralType>source, target, discriminantType, reportErrors)) {
            if (reportErrors) {
                reportRelationError(headMessage, source, target);
            }
            return Ternary.False;
        }
        // Above we check for excess properties with respect to the entire target type. When union
        // and intersection types are further deconstructed on the target side, we don't want to
        // make the check again (as it might fail for a partial target type). Therefore we obtain
        // the regular source type and proceed with that.
        if (isUnionOrIntersectionTypeWithoutNullableConstituents(target) && !discriminantType) {
            source = getRegularTypeOfObjectLiteral(source);
        }
    }

    if (relation !== comparableRelation && !isApparentIntersectionConstituent &&
        source.flags & (TypeFlags.Primitive | TypeFlags.Object | TypeFlags.Intersection) && source !== globalObjectType &&
        target.flags & (TypeFlags.Object | TypeFlags.Intersection) && isWeakType(target) &&
        (getPropertiesOfType(source).length > 0 || typeHasCallOrConstructSignatures(source)) &&
        !hasCommonProperties(source, target, isComparingJsxAttributes)) {
        if (reportErrors) {
            const calls = getSignaturesOfType(source, SignatureKind.Call);
            const constructs = getSignaturesOfType(source, SignatureKind.Construct);
            if (calls.length > 0 && isRelatedTo(getReturnTypeOfSignature(calls[0]), target, /*reportErrors*/ false) ||
                constructs.length > 0 && isRelatedTo(getReturnTypeOfSignature(constructs[0]), target, /*reportErrors*/ false)) {
                reportError(Diagnostics.Value_of_type_0_has_no_properties_in_common_with_type_1_Did_you_mean_to_call_it, typeToString(source), typeToString(target));
            }
            else {
                reportError(Diagnostics.Type_0_has_no_properties_in_common_with_type_1, typeToString(source), typeToString(target));
            }
        }
        return Ternary.False;
    }

    let result = Ternary.False;
    const saveErrorInfo = errorInfo;
    let isIntersectionConstituent = !!isApparentIntersectionConstituent;

    // Note that these checks are specifically ordered to produce correct results. In particular,
    // we need to deconstruct unions before intersections (because unions are always at the top),
    // and we need to handle "each" relations before "some" relations for the same kind of type.
    if (source.flags & TypeFlags.Union) {
        result = relation === comparableRelation ?
                 someTypeRelatedToType(source as UnionType, target, reportErrors && !(source.flags & TypeFlags.Primitive)) :
                 eachTypeRelatedToType(source as UnionType, target, reportErrors && !(source.flags & TypeFlags.Primitive));
    }
    else {
        if (target.flags & TypeFlags.Union) {
            result = typeRelatedToSomeType(source, <UnionType>target, reportErrors && !(source.flags & TypeFlags.Primitive) && !(target.flags & TypeFlags.Primitive));
        }
        else if (target.flags & TypeFlags.Intersection) {
            isIntersectionConstituent = true; // set here to affect the following trio of checks
            result = typeRelatedToEachType(source, target as IntersectionType, reportErrors);
        }
        else if (source.flags & TypeFlags.Intersection) {
            // Check to see if any constituents of the intersection are immediately related to the target.
            //
            // Don't report errors though. Checking whether a constituent is related to the source is not actually
            // useful and leads to some confusing error messages. Instead it is better to let the below checks
            // take care of this, or to not elaborate at all. For instance,
            //
            //    - For an object type (such as 'C = A & B'), users are usually more interested in structural errors.
            //
            //    - For a union type (such as '(A | B) = (C & D)'), it's better to hold onto the whole intersection
            //          than to report that 'D' is not assignable to 'A' or 'B'.
            //
            //    - For a primitive type or type parameter (such as 'number = A & B') there is no point in
            //          breaking the intersection apart.
            result = someTypeRelatedToType(<IntersectionType>source, target, /*reportErrors*/ false);
        }
        if (!result && (source.flags & TypeFlags.StructuredOrInstantiable || target.flags & TypeFlags.StructuredOrInstantiable)) {
            if (result = recursiveTypeRelatedTo(source, target, reportErrors, isIntersectionConstituent)) {
                errorInfo = saveErrorInfo;
            }
        }
    }
    if (!result && source.flags & TypeFlags.Intersection) {
        // The combined constraint of an intersection type is the intersection of the constraints of
        // the constituents. When an intersection type contains instantiable types with union type
        // constraints, there are situations where we need to examine the combined constraint. One is
        // when the target is a union type. Another is when the intersection contains types belonging
        // to one of the disjoint domains. For example, given type variables T and U, each with the
        // constraint 'string | number', the combined constraint of 'T & U' is 'string | number' and
        // we need to check this constraint against a union on the target side. Also, given a type
        // variable V constrained to 'string | number', 'V & number' has a combined constraint of
        // 'string & number | number & number' which reduces to just 'number'.
        const constraint = getUnionConstraintOfIntersection(<IntersectionType>source, !!(target.flags & TypeFlags.Union));
        if (constraint) {
            if (result = isRelatedTo(constraint, target, reportErrors, /*headMessage*/ undefined, isIntersectionConstituent)) {
                errorInfo = saveErrorInfo;
            }
        }
    }

    if (!result && reportErrors) {
        const maybeSuppress = suppressNextError;
        suppressNextError = false;
        if (source.flags & TypeFlags.Object && target.flags & TypeFlags.Primitive) {
            tryElaborateErrorsForPrimitivesAndObjects(source, target);
        }
        else if (source.symbol && source.flags & TypeFlags.Object && globalObjectType === source) {
            reportError(Diagnostics.The_Object_type_is_assignable_to_very_few_other_types_Did_you_mean_to_use_the_any_type_instead);
        }
        else if (isComparingJsxAttributes && target.flags & TypeFlags.Intersection) {
            const targetTypes = (target as IntersectionType).types;
            const intrinsicAttributes = getJsxType(JsxNames.IntrinsicAttributes, errorNode);
            const intrinsicClassAttributes = getJsxType(JsxNames.IntrinsicClassAttributes, errorNode);
            if (intrinsicAttributes !== errorType && intrinsicClassAttributes !== errorType &&
                (contains(targetTypes, intrinsicAttributes) || contains(targetTypes, intrinsicClassAttributes))) {
                // do not report top error
                return result;
            }
        }
        if (!headMessage && maybeSuppress) {
            // Used by, eg, missing property checking to replace the top-level message with a more informative one
            return result;
        }
        reportRelationError(headMessage, source, target);
    }
    return result;
}

function isIdenticalTo(source: Type, target: Type): Ternary {
    let result: Ternary;
    const flags = source.flags & target.flags;
    if (flags & TypeFlags.Object || flags & TypeFlags.IndexedAccess || flags & TypeFlags.Conditional || flags & TypeFlags.Index || flags & TypeFlags.Substitution) {
        return recursiveTypeRelatedTo(source, target, /*reportErrors*/ false, /*isIntersectionConstituent*/ false);
    }
    if (flags & (TypeFlags.Union | TypeFlags.Intersection)) {
        if (result = eachTypeRelatedToSomeType(<UnionOrIntersectionType>source, <UnionOrIntersectionType>target)) {
            if (result &= eachTypeRelatedToSomeType(<UnionOrIntersectionType>target, <UnionOrIntersectionType>source)) {
                return result;
            }
        }
    }
    return Ternary.False;
}

