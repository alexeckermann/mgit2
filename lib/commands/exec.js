/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const exec = require( '../utils/exec' );

module.exports = {
	/**
	 * @param {Array.<String>} args Arguments that user provided calling the mgit.
	 */
	beforeExecute( args ) {
		if ( args.length === 1 ) {
			throw new Error( 'Missing command to execute. Use: mgit exec [command-to-execute].' );
		}
	},

	/**
	 * @param {Object} data
	 * @param {Object} data.arguments Arguments that user provided calling the mgit.
	 * @param {String} data.packageName Name of current package to process.
	 * @param {Options} data.options The options object.
	 * @param {Repository} data.repository
	 * @returns {Promise}
	 */
	execute( data ) {
		const log = require( '../utils/log' )();

		return new Promise( ( resolve, reject ) => {
			const newCwd = path.join( data.options.packages, data.repository.directory );

			// Package does not exist.
			if ( !fs.existsSync( newCwd ) ) {
				log.error( `Package "${ data.packageName }" is not available. Run "mgit bootstrap" in order to download the package.` );

				return reject( { logs: log.all() } );
			}

			process.chdir( newCwd );

			exec( data.arguments[ 0 ] )
				.then( stdout => {
					process.chdir( data.options.cwd );

					log.info( stdout );

					resolve( { logs: log.all() } );
				} )
				.catch( error => {
					process.chdir( data.options.cwd );

					log.error( error );

					reject( { logs: log.all() } );
				} );
		} );
	}
};
