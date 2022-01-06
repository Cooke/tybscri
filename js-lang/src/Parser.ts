import { CharStreams, CommonTokenStream, Token } from "antlr4ts";
import {
  CompileContext,
  DiagnosticMessage,
  DiagnosticSeverity,
  SourceSpan,
} from "./common";
import { TybscriLexer } from "./generated/TybscriLexer";
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
import { booleanType, numberType, stringType } from "./typeSystem";
import { LiteralType } from "./typeSystem/common";

const L = TybscriLexer;

export class Parser {
  private tokenStream: CommonTokenStream;
  private onDiagnosticMessage: ((event: DiagnosticMessage) => void) | undefined;

  public constructor(source: string, context: CompileContext) {
    this.tokenStream = new CommonTokenStream(
      new TybscriLexer(CharStreams.fromString(source))
    );
    this.onDiagnosticMessage = context.onDiagnosticMessage;
  }

  public parseScript() {
    const children: StatementNode[] = [];

    this.advanceWhileNL();
    while (this.peek() !== L.EOF) {
      children.push(this.parseStatement());
      const semiToken = this.parseStatementEnd();
      if (semiToken instanceof MissingTokenNode) {
        this.advance();
      }
    }

    return new ScriptNode(children);
  }

  private parseStatementEnd() {
    let token = this.peek();
    if (token === L.EOF) {
      return this.createActualToken(this.peekToken());
    }

    var firstIteration = true;
    while (true) {
      switch (token) {
        case L.NL:
        case L.SEMICOLON:
          this.advance();
          break;

        default:
          return firstIteration
            ? this.createMissingToken(this.peekToken(), L.NL)
            : this.createActualToken(this.peekToken(-1));
      }

      token = this.peek();
      firstIteration = false;
    }
  }

  private parseStatement(): StatementNode {
    switch (this.peek()) {
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
    const varOrVal = this.parseKnownToken();
    const def = this.parseVariableDefinition();

    const kind =
      varOrVal.text === "var" ? VariableKind.Variable : VariableKind.Const;
    const varDec = new VariableDeclarationNode(kind, def.name, def.value);
    return varDec;
  }

  private parseVariableDefinition() {
    const name = this.parseExpectedToken(L.Identifier);
    this.advanceWhileNL();
    const assign = this.parseExpectedToken(L.ASSIGNMENT);
    this.advanceWhileNL();
    const value = this.parseExpression();
    return { name, assign, value } as const;
  }

  private parseBlock() {
    const lcurl = this.parseExpectedToken(L.LCURL);
    this.advanceWhileNL();
    const statements: StatementNode[] = [];
    while (this.peek() !== L.RCURL && this.peek() !== L.EOF) {
      const statement = this.parseStatement();
      statements.push(statement);
      if (statement instanceof MissingStatementNode) {
        this.advance();
      }

      this.advanceWhileNL();
    }
    const rcurl = this.parseExpectedToken(L.RCURL);

    return new BlockNode(lcurl, statements, rcurl);
  }

  private parseFunctionDeclaration() {
    this.parseExpectedToken(L.FUN);
    const identifier = this.parseExpectedToken(L.Identifier);
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
    this.parseExpectedToken(L.LPAREN);
    this.advanceWhileNL();

    const valueParams: ParameterNode[] = [];
    while (this.peek() !== L.RPAREN && this.peek() !== L.EOF) {
      valueParams.push(this.parseParameter());
      this.advanceWhileNL();
      if (this.peek() === L.COMMA) {
        this.advance();
        this.advanceWhileNL();
      } else {
        break;
      }
    }

    this.parseExpectedToken(L.RPAREN);

    return valueParams;
  }

  private parseFunctionValueParameter() {
    return this.parseParameter();
  }

  private parseParameter() {
    const ident = this.parseExpectedToken(L.Identifier);
    this.advanceWhileNL();
    const colon = this.parseExpectedToken(L.COLON);
    this.advanceWhileNL();
    const type = this.parseType();
    return new ParameterNode(ident, colon, type);
  }

  parseType() {
    return this.parseSimpleType();
  }

  parseSimpleType() {
    switch (this.peek()) {
      case L.QUOTE_OPEN:
        return new TypeNode(this.parseLineStringLiteral());

      case L.INT:
        return new TypeNode(this.parseNumberLiteral());

      case L.Identifier:
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
    return this.parseIsExpression();
  }

  public parseIsExpression() {
    let leftExp = this.parsePostfixExpression();

    while (this.peek() === L.IS) {
      const isToken = this.parseKnownToken();
      this.advanceWhileNL();
      const typeNode = this.parseType();
      leftExp = new IsNode(leftExp, typeNode);
    }

    return leftExp;
  }

  public parsePrimaryExpression(): ExpressionNode {
    switch (this.peek()) {
      case L.INT:
        return this.parseNumberLiteral();

      case L.IF:
        return this.parseIfExpression();

      case L.Identifier: {
        let peekIndex = 1;
        while (this.peek(++peekIndex) === L.NL) {}
        if (
          this.peek(peekIndex) === L.LPAREN ||
          this.peek(peekIndex) === L.LCURL
        ) {
          return this.parseIdentifierInvocation();
        } else {
          return this.parseIdentifier();
        }
      }

      case L.FALSE:
      case L.TRUE:
        return this.parseBooleanLiteral();

      case L.QUOTE_OPEN:
        return this.parseStringLiteral();

      case L.RETURN:
        return this.parseReturnExpression();

      case L.LBRACKET:
        return this.parseCollectionLiteral();

      case L.LCURL:
        return this.parseLambdaLiteral();
    }

    return new MissingExpressionNode(this.createActualToken(this.peekToken()));
  }

  private parseLambdaLiteral() {
    const lcurl = this.parseExpectedToken(L.LCURL);
    this.advanceWhileNL();

    const statements: StatementNode[] = [];
    while (this.peek() !== L.RCURL && this.peek() !== L.EOF) {
      const statement = this.parseStatement();
      statements.push(statement);
      if (statement instanceof MissingStatementNode) {
        this.advance();
      }

      this.advanceWhileNL();
    }

    const rcurl = this.parseExpectedToken(L.RCURL);

    return new LambdaLiteralNode(lcurl, statements, rcurl);
  }

  private parseCollectionLiteral() {
    const lbracket = this.parseExpectedToken(L.LBRACKET);
    this.advanceWhileNL();

    const expressions: ExpressionNode[] = [];
    let first = true;
    while (this.peek() !== L.RBRACKET && this.peek() !== L.EOF) {
      if (!first) {
        const comma = this.parseExpectedToken(L.COMMA);
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

    const rbracket = this.parseExpectedToken(L.RBRACKET);
    return new CollectionLiteralNode(lbracket, expressions, rbracket);
  }

  private parseReturnExpression() {
    const returnToken = this.parseExpectedToken(L.RETURN);
    if (this.peek() !== L.NL) {
      const exp = this.parseExpression();

      return new ReturnNode(returnToken, exp);
    }

    return new ReturnNode(returnToken, null);
  }

  private parseIfExpression() {
    const ifkeyword = this.parseExpectedToken(L.IF);
    this.advanceWhileNL();
    const lparen = this.parseExpectedToken(L.LPAREN);
    this.advanceWhileNL();
    const expression = this.parseExpression();
    this.advanceWhileNL();
    const rparen = this.parseExpectedToken(L.RPAREN);
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
    let i = 1;
    while (this.peek(i) === L.NL) {
      i++;
    }

    let elseStatement: ExpressionNode | null = null;
    if (this.peek(i) === L.ELSE) {
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
    if (this.peek() === L.LCURL) {
      return this.parseBlock();
    }

    return this.parseExpression();
  }

  private parseBooleanLiteral() {
    if (this.peek() !== L.TRUE && this.peek() !== L.FALSE) {
      throw new Error("Only parse boolean literals after look-ahead");
    }

    const value = this.peek() === L.TRUE;
    return new LiteralNode([this.parseKnownToken()], value, {
      kind: "Literal",
      value,
      valueType: booleanType,
    });
  }

  private parseStringLiteral() {
    return this.parseLineStringLiteral();
  }

  private parseNumberLiteral() {
    const syntaxToken = this.parseKnownToken();
    const value = parseInt(syntaxToken.text);
    const literalType: LiteralType = {
      kind: "Literal",
      value,
      valueType: numberType,
    };
    return new LiteralNode([syntaxToken], value, literalType);
  }

  private parseLineStringLiteral() {
    const openQuote = this.parseExpectedToken(L.QUOTE_OPEN);
    const textToken = this.parseExpectedToken(L.LineStrText);
    const closeQuote = this.parseExpectedToken(L.QUOTE_CLOSE);

    if (closeQuote instanceof MissingTokenNode) {
      this.reportDiagnostic({
        message:
          "Unterminated string. Add a citation character '\"' to terminate the string literal.",
        span: closeQuote.span,
        severity: DiagnosticSeverity.Error,
      });
    }

    const literalType: LiteralType = {
      kind: "Literal",
      value: textToken.text,
      valueType: stringType,
    };
    return new LiteralNode(
      [openQuote, textToken, closeQuote],
      textToken.text,
      literalType
    );
  }

  private parseIdentifier() {
    const token = this.parseExpectedToken(L.Identifier);
    return new IdentifierNode(token);
  }

  private parseIdentifierInvocation() {
    const token = this.parseExpectedToken(L.Identifier);
    const callArgs = this.parseValueArguments();
    return new IdentifierInvocationNode(token, ...callArgs);
  }

  private parsePostfixExpression(): ExpressionNode {
    const primExp = this.parsePrimaryExpression();

    let exp = primExp;
    while (true) {
      if (this.peek() === L.LPAREN || this.peek() === L.LCURL) {
        exp = this.parseCallSuffix(exp);
        continue;
      }

      // Predict memberSuffix
      let i = 1;
      while (this.peek(i) === L.NL) {
        i++;
      }

      if (this.peek(i) === L.DOT) {
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
    if (this.peek() === L.LCURL) {
      const lambdaLiteral = this.parseLambdaLiteral();
      return [null, [], null, lambdaLiteral];
    }

    const lparen = this.parseExpectedToken(L.LPAREN);
    this.advanceWhileNL();

    const args: ExpressionNode[] = [];

    while (this.peek() !== L.RPAREN && this.peek() !== L.EOF) {
      const expression = this.parseExpression();
      args.push(expression);
      if (expression instanceof MissingExpressionNode) {
        this.advance();
      }

      this.advanceWhileNL();

      if (this.peek() === L.COMMA) {
        this.advance();
        this.advanceWhileNL();
      }
    }

    const rparen = this.parseExpectedToken(L.RPAREN);

    if (this.peek() === L.LCURL) {
      const lambdaLiteral = this.parseLambdaLiteral();
      return [lparen, args, rparen, lambdaLiteral];
    }

    return [lparen, args, rparen, null];
  }

  private parseMemberSuffix(expression: ExpressionNode): MemberNode {
    this.advanceWhileNL();
    this.parseExpectedToken(L.DOT);
    this.advanceWhileNL();
    const token = this.parseExpectedToken(L.Identifier);

    if (this.peek() === L.LPAREN || this.peek() === L.LCURL) {
      const callArgs = this.parseValueArguments();
      return new MemberInvocationNode(expression, token, ...callArgs);
    }

    return new MemberNode(expression, token);
  }

  //   private parseSemi(): TokenSyntax {
  //     switch (this.peek()) {
  //       case L.EOF:
  //         return this.createActualToken(this.peekToken());

  //       case L.NL:
  //       case L.SEMICOLON: {
  //         const token = this.advanceToken();
  //         this.advanceWhileNL();
  //         return this.createActualToken(token);
  //       }
  //     }

  //     const actualToken = this.peekToken();
  //     return this.createMissingToken(actualToken, L.NL);
  //   }

  private parseExpectedToken(tokenType: number): TokenNode {
    if (this.peek() === tokenType) {
      return this.parseKnownToken();
    }

    const token = this.peekToken();
    return this.createMissingToken(token, tokenType);
  }

  private parseKnownToken() {
    const token = this.createActualToken(this.peekToken());
    this.advance();
    return token;
  }

  private createMissingToken(actualToken: Token, missingTokenType: number) {
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
    token.startIndex;
    return {
      start: {
        index: token.startIndex,
        column: token.charPositionInLine + 1,
        line: token.line,
      },
      stop: {
        index: token.stopIndex,
        column: token.charPositionInLine + 1,
        line: token.line,
      },
    };
  }

  private peek(offset: number = 1) {
    return this.tokenStream.LA(offset);
  }

  private peekToken(offset: number = 1) {
    return this.tokenStream.LT(offset);
  }

  private advance(num: number = 1) {
    for (let i = 0; i < num; i++) {
      this.tokenStream.consume();
    }
  }

  private advanceWhileNL() {
    while (this.tokenStream.LA(1) === L.NL) {
      this.tokenStream.consume();
    }
  }
}
