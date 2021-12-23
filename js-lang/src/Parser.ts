import { CharStreams, CommonTokenStream, Token } from "antlr4ts";
import { TybscriLexer } from "./generated/TybscriLexer";
import { ExpressionNode, MissingExpressionNode } from "./nodes/expression";
import { LiteralNode } from "./nodes/literal";
import { ActualTokenNode, MissingTokenNode, TokenNode } from "./nodes/token";
import { SourceSpan } from "./types";
import { LiteralType } from "./types/common";
import { numberType } from "./types/number";

const emptyArray: any[] = [];

const L = TybscriLexer;

export class Parser {
  private tokenStream: CommonTokenStream;

  public constructor(source: string) {
    this.tokenStream = new CommonTokenStream(
      new TybscriLexer(CharStreams.fromString(source))
    );
  }

  public primaryExpression(): ExpressionNode {
    switch (this.peek()) {
      case L.INT: {
        const syntaxToken = this.parseKnownToken();
        const value = parseInt(syntaxToken.text);
        const literalType: LiteralType = {
          kind: "Literal",
          value,
          valueType: numberType.name,
        };
        return new LiteralNode([syntaxToken], value, literalType);
      }
    }

    return new MissingExpressionNode(this.createActualToken(this.peekToken()));
  }

  //   private parseStringLiteral() {
  //     return this.parseLineStringLiteral();
  //   }

  //   private parseLineStringLiteral() {
  //     const openQuote = this.parseSyntaxToken(L.QUOTE_OPEN);
  //     const textToken = this.parseSyntaxToken(L.LineStrText);
  //     const closeQuote = this.parseSyntaxToken(L.QUOTE_CLOSE);
  //     return new LiteralSyntax(
  //       [openQuote, textToken, closeQuote],
  //       textToken.toString,
  //       "string"
  //     );
  //   }

  //   private parseIfExpression() {
  //     const ifkeyword = this.parseSyntaxToken(L.IF);
  //     this.advanceWhileNL();
  //     const lparen = this.parseSyntaxToken(L.LPAREN);
  //     this.advanceWhileNL();
  //     const expression = this.parseExpression();
  //     this.advanceWhileNL();
  //     const rparen = this.parseSyntaxToken(L.RPAREN);
  //     this.advanceWhileNL();
  //     const thenStatement = this.parseBlock();

  //     // Search for else
  //     let i = 1;
  //     while (this.peek(i) === L.NL) {
  //       i++;
  //     }

  //     let elseStatement: BlockSyntax | null = null;
  //     if (this.peek(i) === L.ELSE) {
  //       this.advanceWhileNL();
  //       this.advance();
  //       this.advanceWhileNL();
  //       elseStatement = this.parseBlock();
  //     }

  //     return new IfSyntax(
  //       ifkeyword,
  //       lparen,
  //       expression,
  //       rparen,
  //       thenStatement,
  //       elseStatement
  //     );
  //   }

  //   private parseBlock() {
  //     const lcurl = this.parseSyntaxToken(L.LCURL);
  //     this.advanceWhileNL();
  //     const statements = this.parseStatements();
  //     this.advanceWhileNL();
  //     const rcurl = this.parseSyntaxToken(L.RCURL);

  //     return new BlockSyntax(lcurl, rcurl, statements);
  //   }

  //   private parseStatements() {
  //     const statements: StatementSyntax[] = [];

  //     let statement = this.parseStatement();
  //     while (!(statement instanceof MissingStatementSyntax)) {
  //       statements.push(statement);

  //       if (this.parseSemis() instanceof MissingTokenSyntax) {
  //         return statements;
  //       }

  //       statement = this.parseStatement();
  //     }

  //     return statements;
  //   }

  //   private parseSemis() {
  //     let token = this.peek();
  //     if (token === L.EOF) {
  //       return this.createActualToken(this.peekToken());
  //     }

  //     var firstIteration = true;
  //     while (true) {
  //       switch (token) {
  //         case L.NL:
  //         case L.SEMICOLON:
  //           this.advance();
  //           break;

  //         default:
  //           return firstIteration
  //             ? this.createMissingToken(this.peekToken(), L.NL)
  //             : this.createActualToken(this.peekToken(-1));
  //       }

  //       token = this.peek();
  //       firstIteration = false;
  //     }
  //   }

  //   private parseIdentifier() {
  //     return this.parseSyntaxToken(L.Identifier);
  //   }

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
    return new MissingTokenNode(
      missingTokenType,
      {
        start: actualTokenSyntax.span.start,
        stop: actualTokenSyntax.span.stop,
      },
      actualTokenSyntax
    );
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
      start: token.startIndex,
      stop: token.stopIndex,
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
