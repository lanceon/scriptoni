import t from 'tcomb';
import path from 'path';
import webpack from 'webpack';
import ProgressBarPlugin from 'progress-bar-webpack-plugin';
import StyleLintPlugin from 'stylelint-webpack-plugin';
import VirtualModulePlugin from 'virtual-module-webpack-plugin';
import getSupportedLocales from './supportedLocales';

const JSLoader = t.enums.of(['babel', 'typescript'], 'JSLoader');

export default ({ config, paths, NODE_ENV, jsLoader = JSLoader('babel') }) => {

  return {
    resolve: {
      modules: [
        paths.APP, paths.COMPONENTS, paths.BASIC_COMPONENTS,
        paths.ROUTES, paths.NODE_MODULES
      ],
      extensions: JSLoader(jsLoader) === JSLoader('typescript') ?
        ['.js', '.ts', '.tsx', '.json'] : undefined
    },

    stats: {
      children: false
    },

    output: {
      library: 'webclient',
      libraryTarget: 'var',
      path: paths.BUILD,
      filename: 'bundle.[hash].js'
    },

    plugins: [
      new VirtualModulePlugin({
        moduleName: path.resolve(process.cwd(), 'src/app/config.json'),
        contents: JSON.stringify(config.bundle)
      }),
      new ProgressBarPlugin(),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
        'process.env.__supportedLocales__': JSON.stringify(getSupportedLocales(paths.LOCALES))
      }),
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
      new StyleLintPlugin({
        files: '**/*.scss',
        syntax: 'scss'
      })
    ],

    module: {
      rules: [
        // linting with eslint
        {
          enforce: 'pre',
          test: /\.jsx?$/, // test for both js and jsx
          use: [{
            loader: 'eslint-loader',
            options: {
              failOnError: NODE_ENV === 'production',
              failOnWarning: NODE_ENV === 'production'
            }
          }],
          include: paths.SRC,
          exclude: paths.ASSETS
        },
        (() => {
          if (JSLoader(jsLoader) === JSLoader('babel')) {
            // babel transpiler
            return {
              test: /\.jsx?$/, // test for both js and jsx
              use: [{ loader: 'babel-loader' }],
              exclude: [paths.ASSETS],
              include: [paths.SRC]
            };
          }

          // TypeScript transpiler
          return {
            test: /\.tsx?$|\.jsx?$/,
            use: [{
              loader: 'awesome-typescript-loader',
              options: {
                useBabel: true,
                useCache: true
              }
            }],
            exclude: [paths.ASSETS],
            include: [paths.SRC]
          };
        })(),
        // copy theme fonts
        {
          test: paths.THEME_FONTS,
          use: [{
            loader: 'file-loader',
            options: {
              name: '[path][name].[ext]',
              context: paths.THEME
            }
          }]
        },
        // copy png and jpg images
        {
          test: /\.(png|jpg)$/,
          exclude: [paths.ASSETS],
          use: [{
            loader: 'file-loader',
            options: {
              name: '[path][name].[ext]'
            }
          }]
        },
        // copy svg images
        {
          test: /\.svg$/,
          use: [{
            loader: 'babel-loader',
            options: {
              presets: ['react']
            }
          }, {
            loader: 'svg-react-loader'
          }]
        },
        // import sass variables in JS
        {
          test: paths.VARIABLES_MATCH,
          use: [{
            loader: 'sass-variables-loader'
          }]
        },
        // copy generic assets, if any
        {
          include: [paths.ASSETS],
          use: [{
            loader: 'file-loader',
            options: {
              name: '[path][name].[ext]',
              context: paths.ASSETS
            }
          }]
        }
      ]
    },

    node: {
      constants: false
    }
  };
};
