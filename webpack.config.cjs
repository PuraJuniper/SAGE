const Dotenv = require('dotenv-webpack');

module.exports = (env) => {
	// Default to env.development
	if (!('build' in env)) {
		env.development = true;
	}

	let config = {
		devServer: {
			static: {
				directory: './public',
			},
			client: {
				progress: true,
			},
			proxy: {
				// '/authoring': 'http://localhost:9000',
				'/structor': 'http://localhost:9001',
				'/iframe': 'http://localhost:9001', // also for structor
			},
			port: 8083,
			allowedHosts: [
				'localhost:8083',
				'dev.sage.junipercds.com'
			]
		},
		entry: {
			bundle: './src/index.tsx',
		},
		output: {
			filename: '[name].js',
		},
		mode: env.development ? 'development' : 'production',
		plugins: [
			new Dotenv({
				systemvars: true, // load all the predefined 'process.env' variables which will trump anything local per dotenv specs. (from dotenv-webpack docs)
			}), // Loads variables from file ".env" into `process.env` accessible in application code
		],
		target: 'web',
		module: {
			rules: [
				{
					test: /\.jsx?$/,
					loader: 'babel-loader',
					exclude: /node_modules/,
					options: {
						presets: ['@babel/react', '@babel/env']
					},
					resolve: {
						fullySpecified: false, // true-to-spec ES Modules should compile without error with default 'true'
					},
				},
				{
					test: /\.tsx?$/,
					use: [
						{
							loader: 'ts-loader',
							options: {
								transpileOnly: false
							}
						}
					],
					exclude: /node_modules/,
				},
				{
					test:[ /react-datepicker.css/,  /_datepicker.css/],
					use: ["style-loader", "css-loader"],
				}
			]
		},
		resolve: {
			extensions: [".tsx", ".ts", ".jsx", '...'], // '...' tells it to use the default extensions array
			modules: ["node_modules"]
		}
	};

	return config;
}
