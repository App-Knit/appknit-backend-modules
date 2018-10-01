/**
 * This will export all the required packages.
 * Acts as an indexer
 *
 * @author gaurav sharma
 * @since 28th september 2018
 * @license AppKnit
 */

const utility = require('./utility');
const services = require('./services');

module.exports = {
	Utilities: utility,
	Services: services,
};
