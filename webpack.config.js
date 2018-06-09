const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin')

module.exports = {
	mode: 'development',
	entry: {
		main: './app/main.js'
	},
	output: {
		path: path.resolve(__dirname, 'public/dist')
	},
	module: {
		rules: [{
			test: /\.vue$/,
			loader: 'vue-loader'
		}, {
			test: /\.css$/,
			use: ['vue-style-loader','css-loader']
		}]
	},
	plugins: [
		new VueLoaderPlugin(),
	],
	resolve: {
    alias: {
	// use minified angular instead of full version
	// angular: path.resolve(__dirname, 'node_modules/angular/angular.min.js')
	'vue$': 'vue/dist/vue.esm.js' //
    }
}

}
