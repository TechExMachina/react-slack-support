module.exports = {
  stories: ['../stories/**/*.stories.(ts|tsx|js|jsx|mdx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-actions', '@storybook/addon-links',  {
    name: '@storybook/addon-docs',
    options: {
      configureJSX: true,
      babelOptions: {},
    },
  },],
};
