// Import path for resolving file paths
var path = require("path");
module.exports = {
  // Specify the entry point for our app
  entry: [path.join(__dirname, "src/index.ts")],
  // Specify the output file containing our bundled code
  output: {
    path: __dirname + "/dist",
    filename: "index.js",
  },
  // Let webpack know to generate a Node.js bundle
  target: "node",
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      { test: /\.ts$/, loader: "ts-loader" },
      { test: /\.node$/, loader: "node-loader" },
    ],
  },
  mode: "production",
};