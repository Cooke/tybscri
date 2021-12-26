parser grammar TybscriLexer;

import TybscriLexer;

// General

script: statements EOF;

// Declarations

functionDeclaration:
	FUN Identifier NL* functionParameters (NL* COLON NL* type)? NL* block;

functionParameters:
	LPAREN NL* (parameter (NL* COMMA NL* parameter)*)? NL* RPAREN;

variableDeclaration: (VAR | VAL) variableDefinition;

variableDefinition:
	Identifier (NL* COLON NL* type)? (
		NL* ASSIGNMENT NL* expression
	)?;

parameter: Identifier NL* COLON NL* type;

// Statements

statements: (statement statementEnd+)+;

statementEnd: SEMICOLON | NL | EOF;

statement:
	functionDeclaration
	| variableDeclaration
	| assignmentStatement
	| forStatement
	| whileStatement
	| expression;

block: LCURL NL* statements NL* RCURL;

forStatement:
	FOR NL* LPAREN NL* variableDefinition IN expression NL* RPAREN NL* body;

whileStatement:
	WHILE NL* LPAREN NL* expression NL* RPAREN NL* body;

// Assignment

assignmentStatement:
	assignableExpression ASSIGNMENT NL* expression;

assignableExpression:
	postfixExpression assignableSuffix
	| scopeIdentifier;

assignableSuffix: indexingSuffix | memberSuffix;

// Expressions

expression: orExpression;

orExpression: andExpression (NL* OROR NL* andExpression)*;

andExpression:
	equalityExpression (NL* ANDAND NL* equalityExpression)*;

equalityExpression:
	comparisonExpression (
		equalityOperator NL* comparisonExpression
	)*;

comparisonExpression:
	isExpression (comparisonOperator NL* isExpression)?;

isExpression: nullCoalescingExpression ( IS NL* type)*;

nullCoalescingExpression:
	additiveExpression (
		NL* QUESTION QUESTION NL* additiveExpression
	)*;

additiveExpression:
	multiplicativeExpression (
		additiveOperator NL* multiplicativeExpression
	)*;

multiplicativeExpression:
	prefixExpression (
		multiplicativeOperator NL* prefixExpression
	)*;

prefixExpression: prefixOperator* NL* postfixExpression;

postfixExpression: primaryExpression expressionSuffix*;

expressionSuffix:
	postfixOperator
	| callSuffix
	| indexingSuffix
	| memberSuffix;

indexingSuffix: LBRACKET NL* expression NL* RBRACKET;

memberSuffix: NL* DOT NL* Identifier;

callSuffix: arguments lambdaLiteral?;

arguments:
	LPAREN NL* RPAREN
	| LPAREN NL* expression (NL* COMMA NL* expression)* NL* RPAREN;

primaryExpression:
	parenExpression
	| ifExpression
	| jumpExpression
	| scopeIdentifier
	| literalConstant
	| stringLiteral
	| lambdaLiteral
	| collectionLiteral;

parenExpression: LPAREN NL* expression NL* RPAREN;

ifExpression:
	IF NL* LPAREN NL* expression NL* RPAREN NL* body (
		NL* ELSE NL* body
	)?;

jumpExpression: RETURN expression? | CONTINUE | BREAK;

// Literals
collectionLiteral:
	LBRACKET NL* expression (NL* COMMA NL* expression)* NL* RBRACKET
	| LBRACKET NL* RBRACKET;

literalConstant: INT | FLOAT | TRUE | FALSE;

stringLiteral: lineStringLiteral;

lineStringLiteral:
	QUOTE_OPEN (LineStrText)* (QUOTE_CLOSE | EOF);

lambdaLiteral:
	LCURL NL* statements NL* RCURL
	| LCURL NL* lambdaParameters? NL* FAT_ARROW NL* statements NL* RCURL;

lambdaParameters:
	lambdaParameter (NL* COMMA NL* lambdaParameter)*;

lambdaParameter: variableDefinition;

// Other

scopeIdentifier: Identifier;

type: Identifier;

body: block | expression;

equalityOperator: EXCLAM_EQ | EQEQ;

comparisonOperator: LT | GT | LTEQ | GTEQ;

additiveOperator: ADD | SUB;

multiplicativeOperator: MULT | DIV | MOD;

prefixOperator: INCR | DECR | SUB | ADD | EXCLAM;

postfixOperator: INCR | DECR;

