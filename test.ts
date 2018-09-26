import { readFileSync } from 'fs';
import { spawnSync } from 'child_process';

import chalk from 'chalk';

import compile from './compile';

const files = (spawnSync('git', ['ls-files'])
  .stdout
  .toString()
  .split('\n')
  .filter(line => line !== '')
  .sort((a, b) => (
    a.toUpperCase() < b.toUpperCase() ? -1 :
    a.toUpperCase() === b.toUpperCase() ? 0 :
    1
  ))
);

function Tags(line: string): string[] {
  // (TODO: handle false positives caused by strings)
  // TODO: get parser to emit comments somehow
  const comment = line.match(/\/\/.*$/);

  if (!comment) {
    return [];
  }

  return comment[0].match(/\#\w*/g) || [];
}

function Location(file: string, line: number) {
  return (chalk.reset(
    chalk.magenta(file) +
    chalk.cyan(':') +
    chalk.green(line.toString())
  ));
}

function grab(str: string, re: RegExp): string {
  return (str.match(re) || [''])[0];
}

function colorize(line: string) {
  if (line === '') {
    return line;
  }

  const location = grab(line, /^[^:]+:[0-9]+/);

  const rest = (
    !location ?
    line :
    line.split(location)[1]
  );

  return (
    (
      location ?
      Location(grab(line, /^[^:]+/), Number(grab(line, /[0-9]+/))) :
      ''
    ) +
    chalk.reset(rest
      .replace(/\berror\b/g, chalk.reset(chalk.red('error')))
      .replace(/\bwarning\b/g, chalk.reset(chalk.yellow('warning')))
      .replace(/\binfo\b/g, chalk.reset(chalk.blue('info')))
    )
  );
}

const log = {
  error(str: string) {
    for (const line of str.split('\n')) {
      console.error(colorize(line));
    }
  },
  info(str: string) {
    for (const line of str.split('\n')) {
      console.info(colorize(line));
    }
  }
};

let ok = true;

for (const file of files) {
  if (!/\.vlt$/.test(file)) {
    continue;
  }

  const fileText = readFileSync(file).toString();
  const notes = compile(fileText);

  const lines = fileText.split('\n');

  let lineNo = 0;
  for (const line of lines) {
    lineNo++;

    const tags = Tags(line);
    const lineNotes = notes.filter(n => n.pos.first_line === lineNo);

    for (const level of ['error', 'warning', 'info']) {
      const levelTags = tags.filter(t => t === `#${level}`);
      const levelNotes = lineNotes.filter(n => n.level === level);

      const nt = levelTags.length;
      const nn = levelNotes.length;

      if (nt > nn) {
        ok = false;

        if (nn === 0) {
          log.error(
            `${file}:${lineNo} has ${level} tag that was not ` +
            `produced by the compiler\n`
          );
        } else {
          log.error(
            `${file}:${lineNo} has ${nt} ${level} tags but only ` +
            `${nn} were produced by the compiler`
          );
        }
      } else if (nn > nt) {
        ok = false;

        const wording = (
          nt === 0 ?
          `has untagged ${level}${nn > 1 ? 's' : ''}` :
          `has ${nn} ${level}s but only ${nt} tag${nt > 1 ? 's' : ''}`
        );

        log.error(
          `${file}:${lineNo} ${wording}:\n` +
          levelNotes.map(n => `  ${n.message}`).join('\n') + '\n'
        );
      }
    }
  }
}

if (ok) {
  console.log('Success');
} else {
  console.log((new Array(80).fill('-').join('')) + '\n');
  throw new Error('Errors found');
}

const todos = spawnSync('git', ['grep', 'TODO']).stdout.toString().split('\n');

if (todos.length > 0) {
  const isVlt = (todo: string) => /^[^:]*\.vlt:/.test(todo);
  log.info(`\n... found ${todos.length} TODOs though:\n`);
  log.info(todos.filter(isVlt).join('\n'));
  log.info(todos.filter(todo => !isVlt(todo)).join('\n'));
}
