var FileChanger = require("webpack-file-changer");
var fs = require("fs");
var path = require("path");

getPlugins = function() {
	var optionsDev = {
		change: [{
			file: path.join(__dirname, './public/index.html'),
			parameters: {'bundle\.(.+)\.js': 'bundle.js'}
		}]
	}
	var optionsBuild = {
		change: [{
			file: './public/index.html',
			parameters: {
				'bundle(\..+)?\.js': 'bundle.js'
			},
			// delete all but most recent bundle
			before: function(stats, change) {
				var dir = './public/';
				var files = fs.readdirSync(dir)
					.filter(function (name) { return /bundle\.(.+)\.js/.test(name) } )
					.sort(function(a, b) {
						return fs.statSync(path.join(dir, b)).mtime.getTime() -
							fs.statSync(path.join(dir, a)).mtime.getTime();
					})
					.forEach(function(name, i) {
						if (i > 0) fs.unlinkSync(path.join(dir, name))
					})
				return true;
			}
		}]
	};
	var options = process.env.WEBPACK_ENV === 'build' ? optionsBuild : optionsDev;
	return [ new FileChanger(options) ]
};

module.exports = {
	entry: './src/index.js',
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
					  transpileOnly: true
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
