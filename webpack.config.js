export default {
    entry: './src/index.ts',
    output: {
        filename: 'index.js',
    },
    module: {
        rules: [
            {
                test: /\.ts$/i,
                exclude: ['/node_modules/'],
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            // transpileOnly: true
                        }
                    }
                ]
            },
        ],
    },
    resolve: {
        extensions: ['.ts'],
    },
    mode: 'production'
}
