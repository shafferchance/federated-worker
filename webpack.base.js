const path = require("path");
const { ModuleFederationPlugin } = require("webpack").container;

module.exports = [
  {
    entry: "./src/index.ts",
    output: {
      publicPath: "auto",
      path: path.resolve(__dirname, "dist"),
      filename: "umd/federated-worker.js",
      library: {
        type: "umd",
        name: "federatedWorker",
      },
      globalObject: "this",
    },
    module: {
      rules: [
        {
          test: /\.worker\.ts$/,
          loader: "worker-loader",
          options: {
            inline: "no-fallback",
          },
        },
        {
          test: /\.tsx?$/,
          loader: "ts-loader",
          exclude: /node_modules/,
        },
      ],
    },
    plugins: [
      // new ModuleFederationPlugin({
      //   name: 'remoteFederatedWorker',
      //   filename: 'remoteFederated.worker.js',
      //   exposes: {
      //     './remoteFederatedWorker': './src/workerFederated/remoteFederated.worker.ts',
      //   },
      // }),
    ],
    // optimization: {
    //   splitChunks: {
    //     cacheGroups: {
    //       vendor: {
    //         test: path.resolve(
    //           __dirname,
    //           "src/workerFederated/remoteFederated.worker.ts"
    //         ),
    //         name: "remoteFederated.worker",
    //         filename: "remoteFederated.worker.js",
    //         chunks: "all",
    //         enforce: true,
    //       },
    //     },
    //   },
    // },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
  },
  {
    entry: path.resolve(__dirname, "src/workerFederated/remoteFederated.worker.ts"),
    target: "webworker",
    output: {
      // publicPath: "auto",
      path: path.resolve(__dirname, "dist"),
      filename: "remoteFederated.worker.js",
      // library: {
      //   name: "MwaAnalytics",
      //   type: "var",
      // },
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: "ts-loader",
          exclude: /node_modules/,
        },
      ],
    },
  },
];
