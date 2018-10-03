import resolve from 'rollup-plugin-node-resolve';
import { uglify } from 'rollup-plugin-uglify';

const dependencies = Object.keys(require('./package.json').dependencies);

export default {
	input: 'index.js',
	output: {
		file: 'bundle.js',
		format: 'cjs',
	},
	plugins: [resolve({
		customResolveOptions: {
			module_directory: 'node_modules',
		},
	}), uglify()],
	interop: false,
	external: dependencies,
};
