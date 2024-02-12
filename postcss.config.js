module.exports = {
    plugins: [
        require("postcss-preset-env")({
            browsers: ["defaults", ">0.3%", "chrome 48", "ie 11"]
        }),
    ]
};
