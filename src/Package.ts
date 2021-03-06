import Note from './Note';
import Syntax from './parser/Syntax';
import traverse from './traverse';

type Package = {
  modules: {
    [file: string]: (
      Package.Module |
      Package.ParserNotes |
      undefined
    );
  };
  dependencies: Package.Dependencies;
  notes: Note[];
};

function Package(): Package {
  return {
    modules: {},
    dependencies: {
      local: [],
      remote: {},
    },
    notes: [],
  };
}

namespace Package {
  export type Module = {
    t: 'Module';
    program: Syntax.Program;
    dependencies: Dependencies;
    notes: Note[];
  };

  export type Dependencies = {
    local: string[];
    remote: {
      [pack: string]: undefined | string[];
    };
  };

  export type ParserNotes = {
    t: 'ParserNotes';
    notes: Note[];
  };

  export function set(
    pack: Package,
    file: string,
    text: string | Error,
  ): Package {
    const moduleEntry = parse(file, text);

    pack = { ...pack,
      modules: { ...pack.modules,
        [file]: moduleEntry,
      },
      dependencies: { ...pack.dependencies,
        local: pack.dependencies.local.filter(dep => dep !== file),
      },
      notes: [...pack.notes, ...moduleEntry.notes],
    };

    let newDependencies = pack.dependencies;

    if (moduleEntry.t === 'Module') {
      newDependencies = { ...newDependencies,
        local: [
          ...pack.dependencies.local,
          ...moduleEntry.dependencies.local.filter(dep => (
            Object.keys(pack.modules).indexOf(dep) === -1 &&
            pack.dependencies.local.indexOf(dep) === -1
          ))
        ],
      };

      for (
        const ext of
        Object.keys(moduleEntry.dependencies.remote)
      ) {
        let extFiles = moduleEntry.dependencies.remote[ext];

        if (extFiles === undefined) {
          throw new Error('Shouldn\'t be possible');
        }

        const existing = pack.dependencies.remote[ext];

        if (existing === undefined) {
          pack = { ...pack,
            dependencies: { ...pack.dependencies,
              remote: { ...pack.dependencies.remote,
                [ext]: [...extFiles],
              },
            },
          };
        } else {
          pack = { ...pack,
            dependencies: { ...pack.dependencies,
              remote: { ...pack.dependencies.remote,
                [ext]: [...existing,
                  ...extFiles.filter(f => existing.indexOf(f) === -1),
                ],
              },
            },
          };
        }
      }
    }

    pack = { ...pack,
      dependencies: newDependencies,
    };

    return pack;
  }

  export function setLocalDependencies(
    pack: Package,
    readFile: (file: string) => string | Error,
  ): Package {
    while (pack.dependencies.local.length > 0) {
      const file = pack.dependencies.local[0];
      pack = Package.set(pack, file, readFile(file));
    }

    return pack;
  }

  export function parse(
    file: string,
    text: string | Error,
  ): Module | ParserNotes {
    if (typeof text !== 'string') {
      return {
        t: 'ParserNotes',
        notes: [{
          pos: [file, null],
          level: 'error',
          tags: ['error', 'package', 'not-found'],
          message: 'File read failed: ' + file + ': ' + text.message,
          subnotes: [],
        }],
      };
    }

    const notes: Note[] = [];
    let program: Syntax.Program | null = null;

    try {
      program = Syntax.Program(text);
    } catch (e) {
      if (e.hash) {
        notes.push({
          level: 'error',
          tags: ['error', 'syntax'],
          message: e.message.split('\n')[3],
          pos: [file, [
            [e.hash.loc.first_line, e.hash.loc.first_column + 2],
            [e.hash.loc.last_line, e.hash.loc.last_column + 1],
          ]],
          subnotes: [],
        });
      } else {
        notes.push({
          pos: [file, null],
          level: 'error',
          tags: ['error', 'syntax', 'internal'],
          message: e.message,
          subnotes: [],
        });
      }

      return {
        t: 'ParserNotes',
        notes,
      };
    }

    const elements = traverse<Syntax.Element, Syntax.Element>(
      program,
      el => [el],
      Syntax.Children,
    );

    const dependencies: Dependencies = {
      local: [],
      remote: {},
    };

    for (const element of elements) {
      // TODO: Mutating here. Is this ok?
      element.p[0] = file;

      if (element.t === 'import') {
        const resolved = resolveImport(file, element);

        if (typeof resolved !== 'string') {
          notes.push(resolved);
          continue;
        }

        const sourceEntry = resolved.split('/')[0];

        let packageDeps = (
          sourceEntry === '@' ?
          dependencies.local :
          dependencies.remote[sourceEntry]
        );

        if (packageDeps === undefined) {
          packageDeps = [];
          dependencies.remote[sourceEntry] = packageDeps;
        }

        packageDeps.push(resolved);
      }
    }

    return {
      t: 'Module',
      program,
      dependencies,
      notes,
    };
  }

  export function resolveImport(
    file: string,
    import_: Syntax.Import,
  ): string | Note {
    const source = (() => {
      switch (import_.v.t) {
        case 'simple': {
          return import_.v.v;
        }

        case 'long': {
          const [, str] = import_.v.v;
          return str.v.slice(1, str.v.length - 1);
        }
      }
    })();

    const sourceParts = source.split('/');

    if (sourceParts.indexOf('..') !== -1) {
      return Note(
        import_.p,
        'error',
        ['package', 'invalid-import-source'],
        'Import source uses ..',
      );
    }

    let [sourceEntry, ...sourceRest] = sourceParts;

    if (sourceEntry !== '.') {
      return source;
    }

    const fileParts = file.split('/');
    const dirname = fileParts.slice(0, fileParts.length - 1).join('/');

    return [dirname, ...sourceRest].join('/');
  }
}

export default Package;
