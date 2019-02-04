declare function require(name: string): any;

const { parser: parserUntyped } = require('./vortex.js');

namespace Syntax {
  export type CreationOperator = ':=';

  export type AssignmentOperator = (
    '+=' |
    '++=' |
    '-=' |
    '*=' |
    '/=' |
    '%=' |
    '<<=' |
    '>>=' |
    '&=' |
    '^=' |
    '|=' |
    '=' |
    never
  );

  export function isAssignmentOperator(
    str: string
  ): str is AssignmentOperator {
    // := is excluded on purpose - creation is not assignment, assignment is
    // mutation
    const operators = [
      '+=',
      '++=',
      '-=',
      '*=',
      '/=',
      '%=',
      '<<=',
      '>>=',
      '&=',
      '^=',
      '|=',
      '=',
    ];

    return operators.indexOf(str) !== -1;
  }

  export type VanillaOperator = (
    '**' |
    '<<' |
    '>>' |
    '<=' |
    '>=' |
    '==' |
    '!=' |
    '&&' |
    '||' |
    '*' |
    '/' |
    '%' |
    '-' |
    '+' |
    '++' |
    '<' |
    '>' |
    '&' |
    '^' |
    '|' |
    'in' |
    never
  );

  export type SpecialBinaryOperator = (
    '.' |
    never
  );

  export type NonSpecialBinaryOperator = (
    CreationOperator |
    AssignmentOperator |
    VanillaOperator |
    never
  );

  export type UnaryOperator = (
    'unary --' |
    'unary ++' |
    'unary -' |
    'unary +' |
    'unary !' |
    'unary ~' |
    never
  );

  export type CPos = [number, number];
  export type Pos = [string, [CPos, CPos]];

  export type Identifier = { t: 'IDENTIFIER', v: string, p: Pos };
  export type ArrayExpression = { t: 'Array', v: Expression[], p: Pos };
  export type SetExpression = { t: 'Set', v: Expression[], p: Pos };
  export type NUMBER = { t: 'NUMBER', v: string, p: Pos };
  export type BOOL = { t: 'BOOL', v: boolean, p: Pos };
  export type NULL = { t: 'NULL', v: null, p: Pos };
  export type STRING = { t: 'STRING', v: string, p: Pos };

  export type FunctionExpression = {
    t: 'Func';
    topExp?: true;
    v: {
      name: Identifier | null,
      args: Arg[],
      body: Block | ExpressionBody
    },
    p: Pos;
  };

  export type OpValueExpression = {
    t: 'op',
    v: VanillaOperator,
    p: Pos;
  };

  export type ClassExpression = {
    t: 'class',
    v: {
      name: Identifier,
      type: (
        ['members', [Identifier, Identifier][]] |
        ['whole', Identifier] |
        never
      ),
      methods: {
        modifiers: 'static'[]
        name: Identifier,
        args: Arg[],
        body: Block | ExpressionBody,
        p: Pos,
      }[],
    },
    p: Pos,
  };

  export type FunctionCall = {
    t: 'functionCall',
    v: [Expression, Expression[]],
    p: Pos
  };

  export type DefaultKeyword = {
    t: 'DEFAULT',
    v: null,
    p: Pos,
  };

  export type SwitchExpression = {
    t: 'switch',
    v: [Expression | null, [Expression | DefaultKeyword, Expression][]],
    p: Pos,
  };

  export type Expression = { topExp?: true } & (
    Identifier |
    NUMBER |
    BOOL |
    NULL |
    STRING |
    { t: NonSpecialBinaryOperator, v: [Expression, Expression], p: Pos } |
    { t: UnaryOperator, v: Expression, p: Pos } |
    { t: '.', v: [Expression, Identifier], p: Pos } |
    FunctionCall |
    { t: 'methodLookup', v: [Expression, Identifier], p: Pos } |
    { t: 'subscript', v: [Expression, Expression], p: Pos } |
    FunctionExpression |
    OpValueExpression |
    ArrayExpression |
    SetExpression |
    { t: 'Object', v: [Identifier | STRING, Expression][], p: Pos } |
    ClassExpression |
    SwitchExpression |
    Import |
    never
  );

  type ExpressionBody = { t: 'expBody', v: Expression, p: Pos };
  export type Block = { t: 'block', v: Statement[], p: Pos };

  export type ExpressionStatement = { t: 'e', v: Expression, p: Pos };

  export type Statement = (
    ExpressionStatement |
    ReturnStatement |
    { t: 'assert', v: Expression, p: Pos, topExp?: true } |
    BreakStatement |
    ContinueStatement |
    IfStatement |
    ForStatement |
    Import |
    { t: 'breakpoint', v: null, p: Pos } |
    { t: 'log.info', v: Expression, p: Pos } |
    { t: 'log.warn', v: Expression, p: Pos } |
    { t: 'log.error', v: Expression, p: Pos } |
    never
  );

  export type ReturnStatement = { t: 'return', v: Expression, p: Pos };
  export type BreakStatement = { t: 'break', p: Pos };
  export type ContinueStatement = { t: 'continue', p: Pos };

  export type IfStatement = {
    t: 'if',
    v: {
      cond: Expression,
      block: Block,
      else_: null | Block | IfStatement,
    },
    p: Pos,
  };

  export type ForStatement = {
    t: 'for',
    v: {
      control: null | ForControlClause,
      block: Block
    },
    p: Pos
  };

  export type Import = { topExp?: true } & (
    { t: 'import', v: { t: 'simple', v: string }, p: Pos } |
    { t: 'import', v: { t: 'long', v: [string, STRING] }, p: Pos } |
    never
  );

  export type ForControlClause = (
    { t: 'condition', v: Expression } |
    { t: 'range', v: [Expression, Expression] } |
    { t: 'setup; condition; next', v: [Expression, Expression, Expression] } |
    never
  );

  export type Arg = {
    t: 'arg',
    v: Expression,
    p: Pos
  };

  // TODO: Need a separate .t for program (body? distinguish between body that
  // needs a return and block that doesn't.)
  export type Program = Block;

  export type Element = { topExp?: true } & (
    Block |
    Statement |
    Expression |
    Arg |
    DefaultKeyword |
    never
  );

  export function Children(el: Element): Element[] {
    // TODO: Need an extra layer with .t so there aren't an unmanageable number
    // of cases.
    switch (el.t) {
      case 'op':
      case 'breakpoint':
      case 'NUMBER':
      case 'BOOL':
      case 'NULL':
      case 'STRING':
      case 'IDENTIFIER':
      case 'DEFAULT': {
        return [];
      }

      case ':=':
      case '=':
      case '+=':
      case '++=':
      case '-=':
      case '*=':
      case '/=':
      case '%=':
      case '<<=':
      case '>>=':
      case '&=':
      case '^=':
      case '|=':
      case 'unary --':
      case 'unary ++':
      case '++':
      case '+':
      case '*':
      case '-':
      case '<<':
      case '>>':
      case '&':
      case '^':
      case '|':
      case '/':
      case '%':
      case '**':
      case '&&':
      case '||':
      case '==':
      case '!=':
      case '<':
      case '>':
      case '<=':
      case '>=':
      case 'in':
      case 'unary -':
      case 'unary +':
      case 'unary !':
      case 'unary ~':
      case 'log.info':
      case 'log.warn':
      case 'log.error':
      case 'assert': {
        const value: (
          [Expression, Expression] |
          Expression
        ) = el.v;

        if (Array.isArray(value)) {
          return value;
        }

        return [value];
      }

      case 'arg': { return [el.v]; }
      case 'block': { return el.v; }
      case 'Array': { return el.v; }
      case 'Set': { return el.v; }

      case 'Object': {
        const children: Syntax.Element[] = [];

        for (const [identifier, expression] of el.v) {
          children.push(identifier, expression);
        }

        return children;
      }

      case 'e': { return [el.v]; }
      case 'return': { return [el.v]; }
      case 'if': { return [el.v.cond, el.v.block, el.v.else_].filter(notNull); }
      case 'break': { return [] };
      case 'continue': { return [] };

      case 'for': {
        const { control, block } = el.v;

        const controlClauseChildren: Expression[] = (() => {
          if (control === null) {
            return [];
          }

          switch (control.t) {
            case 'condition': {
              return [control.v];
            }

            case 'range':
            case 'setup; condition; next': {
              // TODO: Is copying necessary here?
              return [...control.v];
            }
          }
        })();

        return [...controlClauseChildren, block];
      }

      case 'import': {
        const children: Expression[] = [];

        children.push(IdentifierFromImport(el));

        if (el.v.t === 'long') {
          const [, str] = el.v.v;
          children.push(str);
        }

        return children;
      }

      case 'switch': {
        const res: Element[] = [];

        const [valueClause, cases] = el.v;

        if (valueClause !== null) {
          res.push(valueClause);
        }

        for (const case_ of cases) {
          res.push(...case_);
        }

        return res;
      }

      case 'Func': {
        const { name, args, body } = el.v;

        return [
          ...(name ? [name] : []),
          ...args,
          body.t === 'block' ? body : body.v,
        ];
      }

      case 'class': {
        // TODO
        return [el.v.name];
      }

      case 'subscript': { return el.v; }

      case 'functionCall': {
        const [fn, args] = el.v;
        return [fn, ...args];
      }

      case 'methodLookup': { return el.v; }

      case '.': {
        const [expression] = el.v;
        return [expression];
      }
    }
  }

  export function expressionFromElement(el: Element): Expression | null {
    switch (el.t) {
      case 'arg':
      case 'e':
      case 'return':
      case 'assert':
      case 'log.info':
      case 'log.warn':
      case 'log.error':
      case 'break':
      case 'breakpoint':
      case 'continue':
      case 'if':
      case 'for':
      case 'block':
      case 'DEFAULT':
      case 'IDENTIFIER': // TODO: identifiers are not expressions?
        return null;

      default:
        return el;
    }
  }

  export function ExpressionChildren(el: Element): Expression[] {
    const expChildren = [];

    for (const child of Children(el)) {
      const expChild = expressionFromElement(child);

      if (expChild !== null) {
        expChildren.push(expChild);
      }
    }

    return expChildren;
  }

  export function IdentifierFromImport(import_: Import): Identifier {
    switch (import_.v.t) {
      case 'simple': {
        const parts = import_.v.v.split('/');
        const last = parts[parts.length - 1];
        const name = last.split('.')[0];

        const synthIdentifier: Syntax.Identifier = {
          t: 'IDENTIFIER',
          v: name,
          p: import_.p,
        };

        return synthIdentifier;
      }

      case 'long': {
        const [identifierName] = import_.v.v;

        return {
          t: 'IDENTIFIER',
          v: identifierName,
          p: import_.p,
        };
      }
    }
  }

  export function Program(programText: string): Program {
    const program: Program = parserUntyped.parse(programText);

    const lines = programText.split('\n');
    let lineCount = lines.length;

    if (lines[lines.length - 1] === '') {
      // Don't count trailing newline as a line
      lineCount--;
    }

    if (program.p[1][1][0] !== lineCount) {
      program.p[1][1] = [lineCount, 1];
    }

    return program;
  }
}

function notNull<T>(x: T | null): x is T { return x !== null; }

export default Syntax;
