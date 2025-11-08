module.exports = {
  presets: [
    ['@babel/preset-react', { runtime: 'automatic' }]
  ],
  plugins: [
    process.env.USE_REACT_COMPILER === 'true'
      ? 'babel-plugin-react-compiler'
      : null
  ].filter(Boolean)
};
