import monaco from "monaco-editor";
import { createLexer, TokenType } from "tybscri";

interface RawToken {
  type: TokenType;
  startIndex: number;
}

export class TybscriTokensProvider implements monaco.languages.TokensProvider {
  public getInitialState(): monaco.languages.IState {
    return new TybscriState();
  }

  public tokenize(
    line: string,
    state: monaco.languages.IState
  ): monaco.languages.ILineTokens {
    // Collect all tokens first for context-aware highlighting
    const rawTokens: RawToken[] = [];
    const lexer = createLexer(line);

    while (lexer.tokenType !== TokenType.EOF) {
      rawTokens.push({
        type: lexer.tokenType,
        startIndex: lexer.column - 1,
      });
      lexer.advance();
    }

    // Map tokens to scopes with context awareness
    const tokens: monaco.languages.IToken[] = rawTokens.map((token, i) => {
      const prev = rawTokens[i - 1];
      const next = rawTokens[i + 1];
      return {
        startIndex: token.startIndex,
        scopes: getScopeForToken(token.type, prev?.type, next?.type),
      };
    });

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

const scopeMap: { [key in TokenType]?: string } = {
  // Keywords (control flow)
  ...mapToScope(
    [L.IF, L.ELSE, L.FUN, L.VAR, L.VAL, L.RETURN, L.IS, L.FOR, L.WHILE, L.BREAK, L.CONTINUE, L.IN],
    "keyword"
  ),
  // Constants (true, false, null)
  ...mapToScope([L.TRUE, L.FALSE, L.NULL], "constant.language"),
  // Strings
  ...mapToScope([L.LINE_STRING], "string"),
  // Numbers
  ...mapToScope([L.INT, L.FLOAT], "number"),
  // Operators
  ...mapToScope(
    [
      L.ASSIGNMENT, L.EQEQ, L.EXCLAM_EQ, L.LT, L.GT, L.LT_EQ, L.GT_EQ,
      L.ADD, L.SUB, L.MULT, L.DIV, L.MOD, L.AND_AND, L.OR_OR, L.OR, L.EXCLAM,
      L.FAT_ARROW, L.INCR, L.DECR, L.QUESTION,
    ],
    "operator"
  ),
  // Punctuation
  ...mapToScope([L.DOT, L.COMMA, L.COLON, L.SEMICOLON], "delimiter"),
  // Brackets
  ...mapToScope(
    [L.LPAREN, L.RPAREN, L.LBRACKET, L.RBRACKET, L.LCURL, L.RCURL],
    "delimiter.bracket"
  ),
};

function getScopeForToken(
  type: TokenType,
  prevType: TokenType | undefined,
  nextType: TokenType | undefined
): string {
  // Context-aware identifier highlighting
  if (type === L.IDENTIFIER) {
    // Type annotation: `x: Type` or `: Type`
    if (prevType === (L.COLON as TokenType)) {
      return "type";
    }
    // Function call: `func(`
    if (nextType === (L.LPAREN as TokenType)) {
      return "entity.name.function";
    }
    // Property access: `obj.property`
    if (prevType === (L.DOT as TokenType)) {
      // Could be method call or property
      if (nextType === (L.LPAREN as TokenType)) {
        return "entity.name.function";
      }
      return "variable.property";
    }
    // Variable definition: `var x` or `val x`
    if (prevType === (L.VAR as TokenType) || prevType === (L.VAL as TokenType)) {
      return "variable.definition";
    }
    // Function name: `fun name`
    if (prevType === (L.FUN as TokenType)) {
      return "entity.name.function";
    }
    // Type check: `is Type`
    if (prevType === (L.IS as TokenType)) {
      return "type";
    }
    // Default: variable reference
    return "variable";
  }

  return scopeMap[type] || "default";
}
