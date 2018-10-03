import { describe, it } from 'mocha';
import { expect } from 'chai';
import { RandomCodeUtility } from '../..';

describe('Contains the utility tests', () => {
	it('Should test the random code utility function', (done) => {
		expect(RandomCodeUtility(6).toString().length).to.eq(6);
		done();
	});
});
