/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/
/* eslint-env jasmine, jest */

import { Binding }       from "../src/binding";
import * as tsUtils      from "../src/ts-utils";
import { Type }          from "../src/types/base-type";
import { TypeReference } from "../src/types/reference";
import { ObjectType }    from "../src/types/object-type";
import { ValueType }     from "../src/value-type";

describe( 'Given Binding', () => {
    const mangler = jasmine.createSpy( 'mangler' );
    const baseType = jasmine.createSpy( 'baseTypeAsString' );
    const type = new class extends Type
    {
        scope = 'test-scope';
        getBaseTypeAsString = baseType;

        toString = () => 'test-type';
    };
    const node = {
        kind: 100
    };

    let handleKindSpy,
        bind;

    beforeEach( () => {
        handleKindSpy = spyOn( tsUtils, 'handle_kind' ).and.returnValue( type );
    } );

    describe( 'Given a static Binding', () => {

        describe( 'When calling without() with multiple bindings', () => {
            let bindings = [],
                result;

            beforeEach( () => {
                bindings.push(
                    new Binding( node, { definition: new TypeReference() } ),
                    new Binding( node, { definition: new ObjectType() } )
                );

                result = Binding.without( bindings, TypeReference );
            } );

            it( 'then returns correct bindings', () => {
                expect( result.length ).toEqual( 1 );
                expect( result[ 0 ].getType().constructor ).toEqual( ObjectType );
            } );
        } );

        describe( 'When queried about its type', () => {
            let bind;

            beforeEach( () => {
                bind = new Binding( null, new ValueType( new ObjectType() ) );
            } );

            it( 'then reports correctly to type checks', () => {
                expect( bind.isA( TypeReference ) ).toBeFalsy();
                expect( bind.isA( ObjectType ) ).toBeTruthy();
            } );
        } );

        describe( 'When queried about exactly one type', () => {
            let dupes;

            beforeEach( () => {
                dupes = [
                    new Binding( null, new ValueType( new TypeReference() ) ),
                    new Binding( null, new ValueType( new ObjectType() ) ),
                    new Binding( null, new ValueType( new ObjectType() ) )
                ];
            } );

            describe( 'And it has duplicates', () => {
                it( 'then reports false', () => {
                    expect( Binding.hasExactlyOne( dupes, ObjectType ) ).toBeFalsy();
                } );
            } );

            describe( 'When it has no duplicates', () => {
                it( 'then reports true', () => {
                    expect( Binding.hasExactlyOne( dupes, TypeReference ) ).toBeTruthy();
                } );
            } );
        } );

        describe( 'When getting exactly one type', () => {
            let dupes;

            beforeEach( () => {
                dupes = [
                    new Binding( null, new ValueType( new TypeReference() ) ),
                    new Binding( null, new ValueType( new ObjectType() ) ),
                    new Binding( null, new ValueType( new ObjectType() ) )
                ];
            } );

            describe( 'And it has duplicates', () => {
                it( 'then returns null', () => {
                    expect( Binding.getExactlyOne( dupes, ObjectType ) ).toEqual( null );
                } );
            } );

            describe( 'When it has no duplicates', () => {
                it( 'then returns the binding', () => {
                    expect( Binding.getExactlyOne( dupes, TypeReference ).getType().constructor ).toEqual( TypeReference );
                } );
            } );

            describe( 'When checking all types at once in a mixed set of bindings', () => {
                it( 'then reports false', () => {
                    expect( Binding.areAll( dupes, ObjectType ) ).toBeFalsy();
                } );

                describe( 'when they are the same type', () => {
                    beforeEach( () => {
                        dupes = [
                            new Binding( null, new ValueType( new ObjectType() ) ),
                            new Binding( null, new ValueType( new ObjectType() ) )
                        ];
                    } );

                    it( 'then reports true', () => {
                        expect( Binding.areAll( dupes, ObjectType ) ).toBeTruthy();
                    } );
                } );
            } );
        } );

        describe( 'When checking for a single specific type without overloading', () => {
            describe( 'When there is more than one binding', () => {
                let dupes;
                beforeEach( () => {
                    dupes = [
                        new Binding( null, new ValueType( new TypeReference() ) ),
                        new Binding( null, new ValueType( new ObjectType() ) ),
                        new Binding( null, new ValueType( new ObjectType() ) )
                    ];
                } );

                it( 'Then reports false', () => {
                    expect( Binding.isExactlyA( dupes, TypeReference ) ).toBeFalsy();
                } );
            } );

            describe( 'When there is more than one binding', () => {
                let unique;
                beforeEach( () => {
                    unique = [
                        new Binding( null, new ValueType( new ObjectType() ) )
                    ];
                } );

                describe( 'when it is the wrong type', () => {
                    it( 'Then reports false', () => {
                        expect( Binding.isExactlyA( unique, TypeReference ) ).toBeFalsy();
                    } );
                } );

                describe( 'when it is the correct type', () => {
                    it( 'Then reports true', () => {
                        expect( Binding.isExactlyA( unique, ObjectType ) ).toBeTruthy();
                    } );
                } );
            } );

        } );
    } );

    describe( 'Given a Binding instance', () => {

        beforeEach( () => {
            bind = new Binding( node, { definition: type, getMangled: mangler } );
        } );

        describe( 'When mangling', () => {
            describe( 'When called with a name', () => {
                beforeEach( () => {
                    bind.getMangled( 'bif' );
                } );

                it( 'calls through to the type', () => {
                    expect( mangler ).toHaveBeenCalledWith( 'bif' );
                } );
            } );

            describe( 'When called without a name', () => {
                beforeEach( () => {
                    bind.getMangled();
                } );

                it( 'calls through to the type', () => {
                    expect( mangler ).toHaveBeenCalledWith( undefined );
                } );
            } );
        } );

        describe( 'When getting the underlying type', () => {
            it( 'Then gets the type', () => {
                expect( bind.getType() ).toEqual( type );
            } );
        } );

        describe( 'When checking for identical type', () => {
            describe( 'When there is no value type', () => {
                beforeEach( () => {
                    bind.valueType = null;
                } );

                it( 'Then reports as false', () => {
                    expect( bind.isIdenticalType( type ) ).toBeFalsy();
                } );
            } );

            describe( 'When passed a binding', () => {
                it( 'Then reports as true', () => {
                    expect( bind.isIdenticalType( bind ) ).toBeTruthy();
                } );
            } );

            describe( 'When passed a type', () => {
                it( 'Then reports as true', () => {
                    expect( bind.isIdenticalType( type ) ).toBeTruthy();
                } );
            } );
        } );
    } );


} );

