import monaco from "monaco-editor";
import { createLexer, TokenType } from "tybscri";

export class TybscriTokensProvider implements monaco.languages.TokensProvider {
  public getInitialState(): monaco.languages.IState {
    return new TybscriState();
  }

  public tokenize(
    line: string,
    state: monaco.languages.IState
  ): monaco.languages.ILineTokens {
    // So far we ignore the state, which is not great for performance reasons
    const tokens: monaco.languages.IToken[] = [];

    const lexer = createLexer(line);
    // lexer.removeErrorListeners();
    // lexer.addErrorListener({
    //   syntaxError: (
    //     _recognizer: any,
    //     _offendingSymbol: any,
    //     _line: number,
    //     charPositionInLine: number
    //   ) => tokens.push({ scopes: "invalid", startIndex: charPositionInLine }),
    // });

    while (lexer.tokenType !== TokenType.EOF) {
      const myToken = {
        scopes: scopeMap[lexer.tokenType] || "default",
        startIndex: lexer.column - 1,
      };
      tokens.push(myToken);
      lexer.advance();
    }

    return { tokens: tokens, endState: new TybscriState() };
  }
}

class TybscriState implements monaco.languages.IState {
  public clone(): monaco.languages.IState {
    return new TybscriState();
  }

  public equals(other: monaco.languages.IState): boolean {
    return true;
  }
}

import L = TokenType;

function mapToScope(tokenTypes: TokenType[], scope: string) {
  return tokenTypes.reduce((agg, c) => (agg[c] = scope) && agg, {} as any);
}

const scopeMap: { [key in TokenType]: string } = {
  ...mapToScope(
    [L.IF, L.VAR, L.VAL, L.TRUE, L.FALSE, L.ELSE, L.FUN, L.IS, L.RETURN],
    "keyword"
  ),
  ...mapToScope([L.IDENTIFIER], "identifier"),
  ...mapToScope([L.LINE_STRING], "string"),
};
