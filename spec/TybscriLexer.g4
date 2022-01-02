lexer grammar TybscriLexer;

import UnicodeClasses;

// Trivia
SectionComment:
	'/*' (SectionComment | .)*? '*/' -> channel(HIDDEN);

LineComment: '//' ~[\r\n]* -> channel(HIDDEN);

NL: '\n' | '\r' '\n'?;

WS: [\u0020\u0009\u000C] -> channel(HIDDEN);

// Symbols
DOT: '.';
COMMA: ',';
LPAREN: '(';
RPAREN: ')';
LBRACKET: '[';
RBRACKET: ']';
LCURL: '{';
RCURL: '}';
LT: '<';
GT: '>';
MULT: '*';
ADD: '+';
SUB: '-';
DIV: '/';
MOD: '%';
INCR: '++';
DECR: '--';
ANDAND: '&&';
OR: '|';
OROR: '||';
EXCLAM: '!';
COLON: ':';
SEMICOLON: ';';
ASSIGNMENT: '=';
QUESTION: '?';
LTEQ: '<=';
GTEQ: '>=';
EXCLAM_EQ: '!=';
EQEQ: '==';
FAT_ARROW: '=>';

// Keywords
FUN: 'fun';
VAL: 'val';
VAR: 'var';
IF: 'if';
ELSE: 'else';
FOR: 'for';
WHILE: 'while';
RETURN: 'return';
BREAK: 'break';
CONTINUE: 'continue';
IS: 'is';
IN: 'in';

// Values
FLOAT: Digits? '.' Digits;
INT: Digit+;
TRUE: 'true';
FALSE: 'false';
NULL: 'null';

// Identifiers
Identifier: (Letter | '_') (Letter | '_' | Digit)*;

// Characters
fragment Digit: [0-9];
fragment Digits: Digit+;

fragment Letter:
	UNICODE_CLASS_LL
	| UNICODE_CLASS_LM
	| UNICODE_CLASS_LO
	| UNICODE_CLASS_LT
	| UNICODE_CLASS_LU
	| UNICODE_CLASS_NL;

// Strings
QUOTE_OPEN: '"' -> pushMode(String);

mode String;

QUOTE_CLOSE: '"' -> popMode;

LineStrText: ~('\\' | '"')+;
