import {
  CompileContext,
  DiagnosticMessage,
  DiagnosticSeverity,
  SourceSpan,
} from "./common";
import { Lexer, Token, TokenType } from "./lexer";
import { BinaryOperatorNode } from "./nodes/binaryOperatorNode";
import { BlockNode } from "./nodes/block";
import { CollectionLiteralNode } from "./nodes/collectionLiteral";
import { ExpressionNode, MissingExpressionNode } from "./nodes/expression";
import { FunctionNode, ParameterNode } from "./nodes/function";
import { IdentifierNode } from "./nodes/identifier";
import { IdentifierInvocationNode } from "./nodes/identifierInvocation";
import { IfNode } from "./nodes/if";
import { InvocationNode } from "./nodes/invocation";
import { IsNode } from "./nodes/is";
import { LambdaLiteralNode } from "./nodes/lambdaLiteral";
import { LiteralNode } from "./nodes/literal";
import { MemberNode } from "./nodes/member";
import { MemberInvocationNode } from "./nodes/memberInvocation";
import { ReturnNode } from "./nodes/return";
import { ScriptNode } from "./nodes/script";
import {
  ExpressionStatementNode,
  MissingStatementNode,
  StatementNode,
} from "./nodes/statements";
import { ActualTokenNode, MissingTokenNode, TokenNode } from "./nodes/token";
import { TypeNode } from "./nodes/type";
import {
  VariableDeclarationNode,
  VariableKind,
} from "./nodes/variableDeclaration";

import L = TokenType;

export class Parser {
  private tokenStream: Lexer;
  private onDiagnosticMessage: ((event: DiagnosticMessage) => void) | undefined;

  public constructor(source: string, context: CompileContext) {
    this.tokenStream = new Lexer(source);
    this.onDiagnosticMessage = context.onDiagnosticMessage;
  }

  public parseScript() {
    const children: StatementNode[] = [];

    this.advanceWhileNL();
    while (this.tokenType() !== L.EOF) {
      children.push(this.parseStatement());
      const semiToken = this.parseStatementEnd();
      if (semiToken instanceof MissingTokenNode) {
        this.advance();
      }
    }

    return new ScriptNode(children);
  }

  private parseStatementEnd() {
    let tokenType = this.tokenType();
    if (tokenType === L.EOF) {
      return this.createActualToken(this.token());
    }

    if (tokenType !== L.NL && tokenType !== L.SEMICOLON) {
      return this.createMissingToken(this.token(), L.NL);
    }

    this.advance();
    let token = this.token();
    while (this.tokenType() === L.NL || this.tokenType() === L.SEMICOLON) {
      // This allocation can probably be optimized away
      token = this.token();
      this.advance();
    }

    const result = this.createActualToken(token);
    this.advance();
    return result;
  }

  private parseStatement(): StatementNode {
    switch (this.tokenType()) {
      case L.FUN:
        return this.parseFunctionDeclaration();

      case L.VAR:
      case L.VAL:
        return this.parseVariableDeclaration();
    }

    const expression = this.parseExpression();
    if (expression instanceof MissingExpressionNode) {
      return new MissingStatementNode(expression.actualToken);
    }

    return new ExpressionStatementNode(expression);
  }

  private parseVariableDeclaration() {
    const varOrVal =
      this.tokenType() === L.VAL
        ? this.parseToken(L.VAL)
        : this.parseToken(L.VAR);
    const def = this.parseVariableDefinition();

    const kind =
      varOrVal.text === "var" ? VariableKind.Variable : VariableKind.Const;
    const varDec = new VariableDeclarationNode(kind, def.name, def.value);
    return varDec;
  }

  private parseVariableDefinition() {
    const name = this.parseToken(L.IDENTIFIER);
    this.advanceWhileNL();
    const assign = this.parseToken(L.ASSIGNMENT);
    this.advanceWhileNL();
    const value = this.parseExpression();
    return { name, assign, value } as const;
  }

  private parseBlock() {
    const lcurl = this.parseToken(L.LCURL);
    this.advanceWhileNL();
    const statements: StatementNode[] = [];
    while (this.tokenType() !== L.RCURL && this.tokenType() !== L.EOF) {
      const statement = this.parseStatement();
      statements.push(statement);
      if (statement instanceof MissingStatementNode) {
        this.advance();
      }

      this.advanceWhileNL();
    }
    const rcurl = this.parseToken(L.RCURL);

    return new BlockNode(lcurl, statements, rcurl);
  }

  private parseFunctionDeclaration() {
    this.parseToken(L.FUN);
    const identifier = this.parseToken(L.IDENTIFIER);
    this.advanceWhileNL();
    const params = this.parseFunctionParameters();
    this.advanceWhileNL();

    // let type: TypeSyntax | null = null;
    // if (this.peek() === L.COLON) {
    //   this.advance();
    //   type = this.parseType();
    // }

    this.advanceWhileNL();
    const body = this.parseBlock();
    const functionNode = new FunctionNode(identifier, params, body);
    return functionNode;
  }

  private parseFunctionParameters() {
    this.parseToken(L.LPAREN);
    this.advanceWhileNL();

    const valueParams: ParameterNode[] = [];
    while (this.tokenType() !== L.RPAREN && this.tokenType() !== L.EOF) {
      valueParams.push(this.parseParameter());
      this.advanceWhileNL();
      if (this.tokenType() === L.COMMA) {
        this.advance();
        this.advanceWhileNL();
      } else {
        break;
      }
    }

    this.parseToken(L.RPAREN);

    return valueParams;
  }

  private parseFunctionValueParameter() {
    return this.parseParameter();
  }

  private parseParameter() {
    const ident = this.parseToken(L.IDENTIFIER);
    this.advanceWhileNL();
    const colon = this.parseToken(L.COLON);
    this.advanceWhileNL();
    const type = this.parseType();
    return new ParameterNode(ident, colon, type);
  }

  parseType() {
    return this.parseSimpleType();
  }

  parseSimpleType() {
    switch (this.tokenType()) {
      case L.QUOTE_OPEN:
        return new TypeNode(this.parseLineStringLiteral());

      case L.INT:
        return new TypeNode(this.parseNumberLiteral());

      case L.IDENTIFIER:
        return new TypeNode(this.parseIdentifier());

      default:
        const ident = this.parseIdentifier();
        this.reportDiagnostic({
          message: `Expected a type.`,
          severity: DiagnosticSeverity.Error,
          span: ident.span,
        });
        return new TypeNode(ident);
    }
  }

  parseExpression() {
    return this.parseEqualityExpression();
  }

  parseEqualityExpression() {
    let result = this.parseIsExpression();

    while (this.tokenType() == L.EQEQ) {
      const operatorToken = this.parseToken(L.EQEQ);
      this.advanceWhileNL();
      const right = this.parseIsExpression();
      result = new BinaryOperatorNode(result, operatorToken, right);
    }

    return result;
  }

  public parseIsExpression() {
    let leftExp = this.parsePostfixExpression();

    while (this.tokenType() === L.IS) {
      const isToken = this.parseToken(L.IS);
      this.advanceWhileNL();
      const typeNode = this.parseType();
      leftExp = new IsNode(leftExp, typeNode);
    }

    return leftExp;
  }

  public parsePrimaryExpression(): ExpressionNode {
    switch (this.tokenType()) {
      case L.INT:
        return this.parseNumberLiteral();

      case L.IF:
        return this.parseIfExpression();

      case L.IDENTIFIER: {
        const peeker = this.tokenStream.createChildLexer();
        do {
          peeker.advance();
        } while (peeker.tokenType === L.NL);

        if (peeker.tokenType === L.LPAREN || peeker.tokenType === L.LCURL) {
          return this.parseIdentifierInvocation();
        } else {
          return this.parseIdentifier();
        }
      }

      case L.FALSE:
        return this.parseBooleanLiteral(L.FALSE);

      case L.TRUE:
        return this.parseBooleanLiteral(L.TRUE);

      case L.QUOTE_OPEN:
        return this.parseStringLiteral();

      case L.RETURN:
        return this.parseReturnExpression();

      case L.LBRACKET:
        return this.parseCollectionLiteral();

      case L.LCURL:
        return this.parseLambdaLiteral();
    }

    return new MissingExpressionNode(this.createActualToken(this.token()));
  }

  private parseLambdaLiteral() {
    const lcurl = this.parseToken(L.LCURL);
    this.advanceWhileNL();

    const statements: StatementNode[] = [];
    while (this.tokenType() !== L.RCURL && this.tokenType() !== L.EOF) {
      const statement = this.parseStatement();
      statements.push(statement);
      if (statement instanceof MissingStatementNode) {
        this.advance();
      }

      this.advanceWhileNL();
    }

    const rcurl = this.parseToken(L.RCURL);

    return new LambdaLiteralNode(lcurl, statements, rcurl);
  }

  private parseCollectionLiteral() {
    const lbracket = this.parseToken(L.LBRACKET);
    this.advanceWhileNL();

    const expressions: ExpressionNode[] = [];
    let first = true;
    while (this.tokenType() !== L.RBRACKET && this.tokenType() !== L.EOF) {
      if (!first) {
        const comma = this.parseToken(L.COMMA);
        if (comma instanceof MissingTokenNode) {
          this.reportDiagnostic({
            message: "Missing commna",
            severity: DiagnosticSeverity.Error,
            span: comma.span,
          });
        }
        this.advanceWhileNL();
      }

      first = false;
      const exp = this.parseExpression();
      expressions.push(exp);
      if (exp instanceof MissingExpressionNode) {
        this.advance();
      }

      this.advanceWhileNL();
    }

    const rbracket = this.parseToken(L.RBRACKET);
    return new CollectionLiteralNode(lbracket, expressions, rbracket);
  }

  private parseReturnExpression() {
    const returnToken = this.parseToken(L.RETURN);
    if (this.tokenType() !== L.NL) {
      const exp = this.parseExpression();

      return new ReturnNode(returnToken, exp);
    }

    return new ReturnNode(returnToken, null);
  }

  private parseIfExpression() {
    const ifkeyword = this.parseToken(L.IF);
    this.advanceWhileNL();
    const lparen = this.parseToken(L.LPAREN);
    this.advanceWhileNL();
    const expression = this.parseExpression();
    this.advanceWhileNL();
    const rparen = this.parseToken(L.RPAREN);
    if (rparen instanceof MissingTokenNode) {
      this.reportDiagnostic({
        message: "Expected ')'",
        span: rparen.actualToken.span,
        severity: DiagnosticSeverity.Error,
      });
    }

    this.advanceWhileNL();
    const thenStatement = this.parseBody();

    // Search for else
    const peeker = this.tokenStream.createChildLexer();
    while (peeker.tokenType === L.NL) {
      peeker.advance();
    }

    let elseStatement: ExpressionNode | null = null;
    if (peeker.tokenType === L.ELSE) {
      this.advanceWhileNL();
      this.advance();
      this.advanceWhileNL();
      elseStatement = this.parseBody();
    }

    return new IfNode(
      ifkeyword,
      lparen,
      expression,
      rparen,
      thenStatement,
      elseStatement
    );
  }

  private parseBody() {
    if (this.tokenType() === L.LCURL) {
      return this.parseBlock();
    }

    return this.parseExpression();
  }

  private parseBooleanLiteral(type: TokenType) {
    if (this.tokenType() !== type) {
      const missingToken = this.createMissingToken(this.token(), type);
      this.reportDiagnostic({
        message: `Invalid boolean '${this.token().text}`,
        span: missingToken.actualToken.span,
        severity: DiagnosticSeverity.Error,
      });
      return new LiteralNode([missingToken], false);
    }

    return new LiteralNode([this.parseToken(type)], type === L.TRUE);
  }

  private parseStringLiteral() {
    return this.parseLineStringLiteral();
  }

  private parseNumberLiteral() {
    const syntaxToken = this.parseToken(L.INT);
    const value = parseInt(syntaxToken.text);
    return new LiteralNode([syntaxToken], value);
  }

  private parseLineStringLiteral() {
    const openQuote = this.parseToken(L.QUOTE_OPEN);
    const textToken = this.parseToken(L.EOF); // TODO
    const closeQuote = this.parseToken(L.EOF); /// TODO

    if (closeQuote instanceof MissingTokenNode) {
      this.reportDiagnostic({
        message:
          "Unterminated string. Add a citation character '\"' to terminate the string literal.",
        span: closeQuote.span,
        severity: DiagnosticSeverity.Error,
      });
    }

    return new LiteralNode([openQuote, textToken, closeQuote], textToken.text);
  }

  private parseIdentifier() {
    const token = this.parseToken(L.IDENTIFIER);
    return new IdentifierNode(token);
  }

  private parseIdentifierInvocation() {
    const token = this.parseToken(L.IDENTIFIER);
    const callArgs = this.parseValueArguments();
    return new IdentifierInvocationNode(token, ...callArgs);
  }

  private parsePostfixExpression(): ExpressionNode {
    const primExp = this.parsePrimaryExpression();

    let exp = primExp;
    while (true) {
      if (this.tokenType() === L.LPAREN || this.tokenType() === L.LCURL) {
        exp = this.parseCallSuffix(exp);
        continue;
      }

      // Predict memberSuffix
      const peeker = this.tokenStream.createChildLexer();
      while (peeker.tokenType === L.NL) {
        peeker.advance();
      }

      if (peeker.tokenType === L.DOT) {
        exp = this.parseMemberSuffix(exp);
        continue;
      }

      break;
    }

    return exp;
  }

  private parseCallSuffix(expression: ExpressionNode): InvocationNode {
    const args = this.parseValueArguments();
    return new InvocationNode(expression, ...args);
  }

  private parseValueArguments(): [
    TokenNode | null,
    ExpressionNode[],
    TokenNode | null,
    LambdaLiteralNode | null
  ] {
    if (this.tokenType() === L.LCURL) {
      const lambdaLiteral = this.parseLambdaLiteral();
      return [null, [], null, lambdaLiteral];
    }

    const lparen = this.parseToken(L.LPAREN);
    this.advanceWhileNL();

    const args: ExpressionNode[] = [];

    while (this.tokenType() !== L.RPAREN && this.tokenType() !== L.EOF) {
      const expression = this.parseExpression();
      args.push(expression);
      if (expression instanceof MissingExpressionNode) {
        this.advance();
      }

      this.advanceWhileNL();

      if (this.tokenType() === L.COMMA) {
        this.advance();
        this.advanceWhileNL();
      }
    }

    const rparen = this.parseToken(L.RPAREN);

    if (this.tokenType() === L.LCURL) {
      const lambdaLiteral = this.parseLambdaLiteral();
      return [lparen, args, rparen, lambdaLiteral];
    }

    return [lparen, args, rparen, null];
  }

  private parseMemberSuffix(expression: ExpressionNode): MemberNode {
    this.advanceWhileNL();
    this.parseToken(L.DOT);
    this.advanceWhileNL();
    const token = this.parseToken(L.IDENTIFIER);

    if (this.tokenType() === L.LPAREN || this.tokenType() === L.LCURL) {
      const callArgs = this.parseValueArguments();
      return new MemberInvocationNode(expression, token, ...callArgs);
    }

    return new MemberNode(expression, token);
  }

  private parseToken(tokenType: TokenType): TokenNode {
    if (this.tokenType() === tokenType) {
      const token = this.createActualToken(this.token());
      this.advance();
      return token;
    }

    const token = this.token();
    return this.createMissingToken(token, tokenType);
  }

  private createMissingToken(actualToken: Token, missingTokenType: TokenType) {
    const actualTokenSyntax = this.createActualToken(actualToken);
    const missingToken = new MissingTokenNode(
      missingTokenType,
      {
        start: actualTokenSyntax.span.start,
        stop: actualTokenSyntax.span.start,
      },
      actualTokenSyntax
    );

    return missingToken;
  }

  private reportDiagnostic(msg: DiagnosticMessage) {
    this.onDiagnosticMessage?.(msg);
  }

  private createActualToken(token: Token) {
    return new ActualTokenNode(
      token.type,
      this.createSpan(token),
      token.text ?? ""
    );
  }

  private createSpan(token: Token): SourceSpan {
    token.index;
    return {
      start: {
        index: token.index,
        column: token.column,
        line: token.line,
      },
      stop: {
        index: token.index + token.length,
        column: token.column + token.length,
        line: token.line,
      },
    };
  }

  private tokenType(): TokenType {
    return this.tokenStream.tokenType;
  }

  private token() {
    return this.tokenStream.token;
  }

  private advance() {
    this.tokenStream.advance();
  }

  private advanceWhileNL() {
    while (this.tokenStream.tokenType === L.NL) {
      this.tokenStream.advance();
    }
  }
}
