const Base = require("./webpack.base");

module.exports = Base.map((config) => ({
  ...config,
  mode: "development",
  devServer: {
    port: 3000,
    hot: true,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
}));
