/* description: Parses the vault language and generates the syntax tree. */

/* lexical grammar */
%lex
%%

"//".*                /* skip line comments */
[/][*][^*]*[*]+([^/*][^*]*[*]+)*[/]   /* skip block comments */
\s+                   /* skip whitespace */
'{'                   return '{'
'}'                   return '}'
'if'                  return 'IF'
'for'                 return 'FOR'
'of'                  return 'OF'
'func'                return 'FUNC'
'return'              return 'RETURN'
'break'               return 'BREAK'
'continue'            return 'CONTINUE'
[a-zA-Z]\w*           return 'IDENTIFIER'
";"                   return ';'
[0-9]+("."[0-9]+)?\b  return 'NUMBER'
["][^"]*["]           return 'STRING'
['][^']*[']           return 'STRING'
"**"                  return '**'
":="                  return ':='
"++"                  return '++'
"--"                  return '--'
"<<"                  return '<<'
">>"                  return '>>'
"<="                  return '<='
">="                  return '>='
"=="                  return '=='
"!="                  return '!='
"&&"                  return '&&'
"||"                  return '||'
"+="                  return '+='
"-="                  return '-='
"*="                  return '*='
"/="                  return '/='
"%="                  return '%='
"<<="                 return '<<='
">>="                 return '>>='
"&="                  return '&='
"^="                  return '^='
"|="                  return '|='
"*"                   return '*'
"/"                   return '/'
"-"                   return '-'
"+"                   return '+'
"("                   return '('
")"                   return ')'
"="                   return '='
":"                   return ':'
","                   return ','
"!"                   return '!'
"~"                   return '~'
"<"                   return '<'
">"                   return '>'
"&"                   return '&'
"^"                   return '^'
"|"                   return '|'
<<EOF>>               return 'EOF'
.                     return 'INVALID'

/lex

/* operator associations and precedence */

%right ':=' '=' '+=' '-=' '*=' '/=' '%=' '<<=' '>>=' '&=' '|=' '^='
%left ':'
%left '||'
%left '&&'
%left '|'
%left '^'
%left '&'
%left '==' '!='
%left '<' '>' '>=' '<='
%left '<<' '>>'
%left '+' '-'
%left '*' '/'
%right '**'
%left PREFIX POSTFIX '!' '~' '++' '--'
%left '(' ')'

%start program

%% /* language grammar */

program
    : statements EOF
        { console.log(require('util').inspect($1, { depth: 10, colors: true })); }
    ;

statements
    :
        {$$ = []}
    | statements statement
        {$$ = [...$1, $2]}
    ;

statement
    : e ';'
        {$$ = $1}
    | RETURN e ';'
        {$$ = ['return', $2]}
    | BREAK ';'
        {$$ = ['break']}
    | CONTINUE ';'
        {$$ = ['continue']}
    | if
        {$$ = $1}
    | for
        {$$ = $1}
    ;

if
    : IF '(' e ')' block
        {$$ = ['if', $3, $5]}
    ;

for
    : FOR block
        {$$ = ['for', ['loop'], $2]}
    | FOR '(' e ')' block
        {$$ = ['for', ['condition', $3], $5]}
    | FOR '(' IDENTIFIER OF e ')' block
        {$$ = ['for', ['of', $3, $5], $7]}
    | FOR '(' e ';' e ';' e ')' block
        {$$ = ['for', ['traditional', $3, $5, $7], $9]}
    ;

func
    : FUNC funcName '(' params ')' block
        {$$ = ['func', $2, $4, $6]}
    ;

funcName
    :
        {$$ = null}
    | IDENTIFIER
        {$$ = $1}
    ;

params
    :
        {$$ = ['params', []]}
    | nonEmptyParams
        {$$ = ['params', $1]}
    ;

nonEmptyParams
    : param
        {$$ = [$1]}
    | nonEmptyParams ',' param
        {$$ = [...$1, $3]}
    ;

param
    : IDENTIFIER
        {$$ = ['param', $1]}
    | IDENTIFIER ':' IDENTIFIER
        {$$ = ['param', $1, $3]}
    ;

block
    : '{' statements '}'
        {$$ = ['block', $2]}
    ;

e
    : e '**' e
        {$$ = ['**', $1, $3]}
    | e ':=' e
        {$$ = [':=', $1, $3]}
    | '++' e %prec PREFIX
        {$$ = ['prefix ++', $2]}
    | '--' e %prec PREFIX
        {$$ = ['prefix --', $2]}
    | e '++' %prec POSTFIX
        {$$ = ['postfix ++', $2]}
    | e '--' %prec POSTFIX
        {$$ = ['postfix --', $2]}
    | e '<<' e
        {$$ = ['<<', $1, $3]}
    | e '>>' e
        {$$ = ['>>', $1, $3]}
    | e '<=' e
        {$$ = ['<=', $1, $3]}
    | e '>=' e
        {$$ = ['>=', $1, $3]}
    | e '==' e
        {$$ = ['==', $1, $3]}
    | e '!=' e
        {$$ = ['!=', $1, $3]}
    | e '&&' e
        {$$ = ['&&', $1, $3]}
    | e '||' e
        {$$ = ['||', $1, $3]}
    | e '+=' e
        {$$ = ['+=', $1, $3]}
    | e '-=' e
        {$$ = ['-=', $1, $3]}
    | e '*=' e
        {$$ = ['*=', $1, $3]}
    | e '/=' e
        {$$ = ['/=', $1, $3]}
    | e '%=' e
        {$$ = ['%=', $1, $3]}
    | e '<<=' e
        {$$ = ['<<=', $1, $3]}
    | e '>>=' e
        {$$ = ['>>=', $1, $3]}
    | e '&=' e
        {$$ = ['&=', $1, $3]}
    | e '^=' e
        {$$ = ['^=', $1, $3]}
    | e '|=' e
        {$$ = ['|=', $1, $3]}
    | e '*' e
        {$$ = ['*', $1, $3]}
    | e '/' e
        {$$ = ['/', $1, $3]}
    | e '-' e
        {$$ = ['-', $1, $3]}
    | e '+' e
        {$$ = ['+', $1, $3]}
    | e '=' e
        {$$ = ['=', $1, $3]}
    | e '!' e
        {$$ = ['!', $1, $3]}
    | e '~' e
        {$$ = ['~', $1, $3]}
    | e '<' e
        {$$ = ['<', $1, $3]}
    | e '>' e
        {$$ = ['>', $1, $3]}
    | e '&' e
        {$$ = ['&', $1, $3]}
    | e '^' e
        {$$ = ['^', $1, $3]}
    | e '|' e
        {$$ = ['|', $1, $3]}
    | '-' e %prec UMINUS
        {$$ = ['-', $2]}
    | '(' e ')'
        {$$ = $2;}
    | e args
        {$$ = ['functionCall', $1, $2[1]]}
    | e ':' IDENTIFIER args
        {$$ = ['methodCall', $1, $3, $4]}
    | NUMBER
        {$$ = ['NUMBER', $1]}
    | IDENTIFIER
        {$$ = ['IDENTIFIER', $1]}
    | STRING
        {$$ = ['STRING', $1]}
    | func
        {$$ = $1}
    ;

args
    : '(' ')'
        {$$ = ['args', []]}
    | '(' argsContent ')'
        {$$ = ['args', $2]}
    ;

argsContent
    : e
        {$$ = [$1]}
    | argsContent ',' e
        {$$ = [...$1, $3]}
    ;
