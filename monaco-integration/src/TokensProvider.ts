import monaco from "monaco-editor";
import { createLexer, Lexer } from "tybscri";

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
    lexer.removeErrorListeners();
    lexer.addErrorListener({
      syntaxError: (
        _recognizer: any,
        _offendingSymbol: any,
        _line: number,
        charPositionInLine: number
      ) => tokens.push({ scopes: "invalid", startIndex: charPositionInLine }),
    });

    let token = lexer.nextToken();
    while (token.type !== Lexer.EOF) {
      const myToken = {
        scopes: scopeMap[token.type] || "default",
        startIndex: token.charPositionInLine,
      };
      tokens.push(myToken);
      token = lexer.nextToken();
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

const L = Lexer;

function mapToScope(tokenTypes: number[], scope: string) {
  return tokenTypes.reduce((agg, c) => (agg[c] = scope) && agg, {} as any);
}

const scopeMap: { [key: number]: string } = {
  ...mapToScope(
    [
      L.IF,
      L.VAR,
      L.VAL,
      L.TRUE,
      L.FALSE,
      L.FOR,
      L.WHILE,
      L.NULL,
      L.ELSE,
      L.FUN,
      L.IS,
      L.RETURN,
    ],
    "keyword"
  ),
  ...mapToScope([L.Identifier], "identifier"),
  ...mapToScope([L.WS], "white"),
  ...mapToScope([L.LineStrText, L.QUOTE_OPEN, L.QUOTE_CLOSE], "string"),
};
