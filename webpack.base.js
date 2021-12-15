const path = require("path");

module.exports = {
    entry: "./src/index.ts",
    output: {
        publicPath: "auto",
        path: path.resolve(__dirname, "dist"),
        filename: "federated-worker.js",
        library: {
            type: "umd",
            name: "federatedWorker",
        },
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
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
};
