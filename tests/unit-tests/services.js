/**
 * The testing functionality realted to app knit backend services
 * @author gaurav sharma
 * @since 17th November 2018
 */
import { describe, it } from 'mocha';
import { LogServices } from '../../';

describe('Contains the service tests', () => {
	it('Should test the logger functionality', (done) => {
		LogServices.ActivateExceptionLogs();
		done();
	});
});
