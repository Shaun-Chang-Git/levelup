// webpack.config.js - 프로덕션 최적화
const path = require('path');
const webpack = require('webpack');

module.exports = function override(config, env) {
  if (env === 'production') {
    // 번들 분할 최적화
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        minSize: 20000,
        maxSize: 250000,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true,
          },
          mui: {
            test: /[\\/]node_modules[\\/]@mui[\\/]/,
            name: 'mui',
            priority: 20,
            reuseExistingChunk: true,
          },
          supabase: {
            test: /[\\/]node_modules[\\/]@supabase[\\/]/,
            name: 'supabase',
            priority: 20,
            reuseExistingChunk: true,
          },
          common: {
            name: 'common',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      },
      usedExports: true,
      sideEffects: false,
    };

    // 프로덕션 전용 플러그인
    config.plugins = [
      ...config.plugins,
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('production'),
        'process.env.REACT_APP_VERSION': JSON.stringify(process.env.npm_package_version || '1.0.0'),
      }),
    ];

    // 소스맵 비활성화 (성능 향상)
    if (process.env.GENERATE_SOURCEMAP === 'false') {
      config.devtool = false;
    }
  }

  return config;
};