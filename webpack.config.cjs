module.exports = (env) => {
	// Default to env.development
	if (!('development' in env) && !('build' in env)) {
		env.development = true;
	}
	console.log(`Webpack config is using env:`);
	console.log(env)

	let config = {
		devServer: {
			static: {
				directory: './public',
			},
			client: {
				progress: true,
			},
			proxy: {
				'/authoring': 'http://localhost:9000',
			},
		},
		entry: {
			bundle: './src/index.tsx',
		},
		output: {
			filename: env.development ? '[name].js' : './public/[name].js',
		},
		mode: env.development ? 'development' : 'production',
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
			]
		},
		resolve: {
			extensions: [".tsx", ".ts", ".jsx", '...'], // '...' tells it to use the default extensions array
			modules: ["node_modules"]
		}
	};
	
	console.log(`Webpack mode set to: ${config.mode}`);
	return config;
}