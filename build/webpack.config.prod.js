const webpack = require("webpack");

const defaults = require("./defaults");

const filename = "react-slack-support.js";

module.exports = {
  entry: "./src/index.js",
  module: {
    rules: defaults.rules
  },
  mode: "production",
  externals: [
    "react",
    "react-dom",
    "prop-types",
    /@material-ui\/core\/.*/,
    /@material-ui\/icons\/.*/
  ],
  resolve: {
    extensions: ["*", ".js", ".jsx"]
  },
  optimization: {
    minimize: true
  },
  plugins: [
    new webpack.DefinePlugin({
      process: {
        env: {
          NODE_ENV: "production" // use 'development' unless process.env.NODE_ENV is defined
        }
      }
    })
  ],
  output: {
    path: __dirname + "/../dist",
    publicPath: "/",
    libraryTarget: "umd",
    filename
  }
};
