const Base = require("./webpack.base");

module.exports = Base.map((config) => ({
  ...config,
  mode: "production",
}));
