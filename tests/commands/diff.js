/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const sinon = require( 'sinon' );
const mockery = require( 'mockery' );
const expect = require( 'chai' ).expect;

describe( 'commands/diff', () => {
	let diffCommand, sandbox, stubs, data;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();

		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		stubs = {
			execCommand: {
				execute: sandbox.stub()
			}
		};

		data = {
			arguments: []
		};

		mockery.registerMock( './exec', stubs.execCommand );

		diffCommand = require( '../../lib/commands/diff' );
	} );

	afterEach( () => {
		sandbox.restore();
		mockery.disable();
	} );

	describe( 'execute()', () => {
		it( 'rejects promise if called command returned an error', () => {
			const error = new Error( 'Unexpected error.' );

			stubs.execCommand.execute.rejects( {
				logs: {
					error: [ error.stack ]
				}
			} );

			return diffCommand.execute( data )
				.then(
					() => {
						throw new Error( 'Supposed to be rejected.' );
					},
					response => {
						expect( response.logs.error[ 0 ].split( '\n' )[ 0 ] ).to.equal( `Error: ${ error.message }` );
					}
				);
		} );

		it( 'returns logs with the changes if any occurs', () => {
			const diffResult = 'diff --git a/gulpfile.js b/gulpfile.js\n' +
				'index 40c0e59..0699706 100644\n' +
				'--- a/gulpfile.js\n' +
				'+++ b/gulpfile.js\n' +
				'@@ -20,3 +20,4 @@ const options = {\n' +
				' gulp.task( \'lint\', () => ckeditor5Lint.lint( options ) );\n' +
				' gulp.task( \'lint-staged\', () => ckeditor5Lint.lintStaged( options ) );\n' +
				' gulp.task( \'pre-commit\', [ \'lint-staged\' ] );\n' +
				'+// Some comment.';

			stubs.execCommand.execute.resolves( {
				logs: {
					info: [ diffResult ]
				}
			} );

			return diffCommand.execute( data )
				.then( diffResponse => {
					expect( stubs.execCommand.execute.calledOnce ).to.equal( true );
					expect( stubs.execCommand.execute.firstCall.args[ 0 ] ).to.deep.equal( {
						arguments: [ 'git diff --color' ]
					} );

					expect( diffResponse.logs.info[ 0 ] ).to.equal( diffResult );
				} );
		} );

		it( 'does not return the logs when repository has not changed', () => {
			stubs.execCommand.execute.resolves( { logs: { info: [] } } );

			return diffCommand.execute( data )
				.then( diffResponse => {
					expect( stubs.execCommand.execute.calledOnce ).to.equal( true );

					expect( diffResponse ).to.deep.equal( {} );
				} );
		} );

		it( 'allows modifying the "git diff" command', () => {
			stubs.execCommand.execute.resolves( { logs: { info: [] } } );

			data.arguments = [
				'--stat',
				'--staged'
			];

			return diffCommand.execute( data )
				.then( diffResponse => {
					expect( stubs.execCommand.execute.calledOnce ).to.equal( true );
					expect( stubs.execCommand.execute.firstCall.args[ 0 ] ).to.deep.equal( {
						arguments: [ 'git diff --color --stat --staged' ]
					} );

					expect( diffResponse ).to.deep.equal( {} );
				} );
		} );
	} );

	describe( 'afterExecute()', () => {
		it( 'should describe what kind of logs are displayed', () => {
			const logStub = sandbox.stub( console, 'log' );

			diffCommand.afterExecute();

			expect( logStub.calledOnce ).to.equal( true );
			logStub.restore();
		} );
	} );
} );
