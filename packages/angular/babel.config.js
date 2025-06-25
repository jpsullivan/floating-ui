module.exports = {
  presets: [['@babel/env', {loose: true}], '@babel/typescript'],
  plugins: [
    ['@babel/plugin-proposal-decorators', {legacy: true}],
    ['@babel/plugin-proposal-class-properties', {loose: true}],
  ],
};
