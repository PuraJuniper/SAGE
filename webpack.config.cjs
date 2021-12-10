module.exports = {
	devServer: {
		static: {
			directory: './public',
		},
		client: {
			progress: true,
		},
	},
	entry: './src/index.tsx',
	output: {
		filename: (process.env.WEBPACK_ENV === 'build' ? './public/bundle.js' : 'bundle.js')
	},
	mode: 'development',
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
