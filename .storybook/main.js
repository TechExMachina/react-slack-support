const path = require('path')

module.exports = {
  stories: ['../stories/**/*.stories.(ts|tsx|js|jsx|mdx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-actions', '@storybook/addon-links',
    {
      name: '@storybook/preset-typescript',
      options: {
        tsLoaderOptions: {
          configFile: path.resolve(__dirname, '../tsconfig.json'),
        },
        tsDocgenLoaderOptions: {
          tsconfigPath: path.resolve(__dirname, '../tsconfig.json'),
        },
        forkTsCheckerWebpackPluginOptions: {
          colors: true, // disables built-in colors in logger messages
        },
        include: [path.resolve(__dirname, '../src'), path.resolve(__dirname, '../types')],
      },
    },
    {
    name: '@storybook/addon-docs',
    options: {
      configureJSX: true,
      babelOptions: {},
    },
  },],
};
