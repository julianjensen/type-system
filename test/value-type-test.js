/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/
/* eslint-env jasmine, jest */

import { ValueType } from "../src/value-type";
import * as tsUtils  from "../src/ts-utils";

describe( 'Given ValueType', () => {
    const mangler = jasmine.createSpy( 'mangler' );
    const type = {
        scope:      'test-scope',
        toString:   () => 'test-type',
        getMangled: mangler
    };

    let handleKindSpy,
        vt;

    beforeEach( () => {
        handleKindSpy = spyOn( tsUtils, 'handle_kind' ).and.returnValue( type );
    } );

    describe( 'calling static create', () => {
        beforeEach( () => {
            vt = ValueType.create( 'node' );
        } );

        it( 'should create an instance', () => {
            expect( handleKindSpy ).toHaveBeenCalledWith( 'node', undefined );
            expect( vt.constructor ).toEqual( ValueType );
        } );
    } );

    describe( 'Given a ValueType instance', () => {
        beforeEach( () => {
            vt = new ValueType( type );
        } );

        it( 'should instantiate the class', () => {
            expect( vt.constructor ).toEqual( ValueType );
        } );

        it( 'should return the type scope', () => {
            expect( vt.scope ).toEqual( 'test-scope' );
        } );

        it( 'should stringify correctly', () => {
            expect( `${vt}` ).toEqual( 'test-type' );
        } );

        describe( 'when mangling', () => {
            beforeEach( () => {
                vt.getMangled( 'blah' );
            } );

            it( 'should call through to the type', () => {
                expect( mangler ).toHaveBeenCalledWith( 'blah' );
            } );
        } );
    } );



} );
