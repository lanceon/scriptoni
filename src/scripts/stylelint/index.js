import fs from 'fs';
import path from 'path';
import { lint } from 'stylelint';
import { red } from 'chalk';
import { resolveInSrc } from '../../util';

const cwd = process.cwd();

function readConfigInDir(dir) {
  const stylelintrc = path.resolve(dir, '.stylelintrc');
  return fs.existsSync(stylelintrc) && JSON.parse(fs.readFileSync(stylelintrc));
}

function getConfig() {
  const defaultStylelintrc = readConfigInDir(resolveInSrc('stylelint'));
  const userStylelintrc = readConfigInDir(cwd);

  return {
    config: {
      ...defaultStylelintrc,
      ...(userStylelintrc || {})
    },
    configBasedir: userStylelintrc ? cwd : '../../../'
  };
}

const options = {
  ...getConfig(),
  files: path.resolve(cwd, 'src/**/*.scss'),
  syntax: 'scss',
  formatter: 'string'
};

lint(options)
  .then(({ output }) => console.log(output)) // eslint-disable-line no-console
  .catch((err) => console.log(red(err.stack))); // eslint-disable-line no-console