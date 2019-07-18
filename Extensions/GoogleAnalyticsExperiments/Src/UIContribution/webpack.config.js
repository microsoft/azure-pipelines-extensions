var path = require("path");
var webpack = require("webpack");

module.exports = {
    devtool: 'source-map',
    target: "web",
    entry: {
        experimentoverviewTab: "./src/ExperimentOverview.ts",
    },
    output: {
        path: path.join(__dirname, '/dist'),
        filename: "[name].js",
        libraryTarget: "amd",
        devtoolModuleFilenameTemplate:    "webpack:///[absolute-resource-path]",

    },
    externals: [
        /^VSS\/.*/, /^TFS\/.*/, /^q$/,/^ReleaseManagement\/.*/,
    ],
    resolve: {
        extensions: ["*", ".webpack.js", ".web.js", ".ts", ".tsx", ".js"],
        modules: [path.resolve("./src"), "node_modules"],
    },
    module: {
        rules: [
            {test: /\.(jpg|jpeg|png|woff|woff2|eot|ttf|svg)$/,loader: 'url-loader?limit=100000'},
            {
                test: /\.jsx?$/,
                use: [
                    {
                        loader: 'eslint-loader',
                        options: {
                            emitWarning: true
                        }
                    }
                ],
                enforce: 'pre'
            },
            {
                enforce: "pre",
                loader: "tslint-loader",
                options: {
                    emitErrors: true,
                    failOnHint: true,
                },
                test: /\.tsx?$/,
            },
            {
                test: /\.css$/,
                loader: "style-loader!css-loader"
            },
            {
              test: /\.tsx?$/,
              loader: 'babel-loader',
              exclude: /node_modules/,
              query: {
                presets: ['es2015', 'react']
              }
            },
            {
                loader: "ts-loader",
                test: /\.tsx?$/,
            },
        ],
    },
};
