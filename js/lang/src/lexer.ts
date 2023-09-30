export const enum TokenType {
  EOF = "EOF",
  IF = "IF",
  IDENTIFIER = "IDENTIFIER",
  DOT = "DOT",
  NL = "NL",
  SEMICOLON = "SEMICOLON",
  FUN = "FUN",
  VAR = "VAR",
  VAL = "VAL",
  ASSIGNMENT = "ASSIGNMENT",
  EQEQ = "EQEQ",
  LPAREN = "LPAREN",
  RPAREN = "RPARSEN",
  LCURL = "LCURL",
  RCURL = "RCURL",
  COMMA = "COMMA",
  COLON = "COLON",
  QUOTE_OPEN = "QUOTE_OPEN",
  INT = "INT",
  IS = "IS",
  TRUE = "TRUE",
  FALSE = "FALSE",
  RETURN = "RETURN",
  LBRACKET = "LBRACKET",
  RBRACKET = "RBRACKET",
  ELSE = "ELSE",
}

export class Token {
  constructor(
    public readonly type: TokenType,
    public readonly text: string,
    public readonly index: number,
    public readonly length: number,
    public readonly line: number,
    public readonly column: number
  ) {}
}

export interface LexerState {
  index: number;
  line: number;
  column: number;
}

export class Lexer {
  private _index: number = 0;
  private _line: number = 1;
  private _column: number = 1;
  private _tokenType: TokenType = TokenType.EOF;
  private _tokenLength: number = 0;
  private _token: Token | null = null;

  get tokenType() {
    return this._tokenType;
  }

  get token() {
    if (this._token) {
      return this._token;
    }

    this._token = new Token(
      this._tokenType,
      this.input.substring(this._index, this._tokenLength),
      this._index,
      this._tokenLength,
      this._line,
      this._column
    );
    return this._token;
  }

  constructor(public readonly input: string, initialState?: LexerState) {
    if (initialState) {
      this._index = initialState.index;
      this._column = initialState.column;
      this._line = initialState.line;
    }

    this.advance();
  }

  public advance() {
    this._index += this._tokenLength;
    this._column += this._tokenLength;
    if (this._tokenType === TokenType.NL) {
      this._line++;
      this._column = 0;
    }

    while (
      this._index < this.input.length &&
      isWhitespace(this.input[this._index])
    ) {
      this._index++;
      this._column++;
    }

    const type = tokenType(this.input, this._index);
    if (type === null) {
      throw new Error(
        `Unreconizable character at "${this.input.substring(
          this._index,
          this._index + 10
        )}" at index ${this._index} (${this._line}:${this._column})`
      );
    }
    this._tokenType = type;

    const length = tokenLength(this.input, this._tokenType, this._index);
    if (length === null) {
      throw new Error(
        `Unable to determine token length for token "${this.input.substring(
          this._index,
          this._index + 10
        )}" of type ${this._tokenType} at index ${this._index} (${this._line}:${
          this._column
        })`
      );
    }

    this._tokenLength = length;

    this._token = null;
  }

  public createChildLexer() {
    return new Lexer(this.input, {
      index: this._index,
      column: this._column,
      line: this._line,
    });
  }
}

function tokenType(input: string, index: number) {
  if (index >= input.length) {
    return TokenType.EOF;
  }

  switch (input[index]) {
    case ".":
      return TokenType.DOT;
    case "e":
      return isWord(input, index, "else")
        ? TokenType.ELSE
        : TokenType.IDENTIFIER;
    case "f":
      return isWord(input, index, "fun")
        ? TokenType.FUN
        : isWord(input, index, "false")
        ? TokenType.FALSE
        : TokenType.IDENTIFIER;

    case "i":
      return isWord(input, index, "if")
        ? TokenType.IF
        : isWord(input, index, "is")
        ? TokenType.IS
        : TokenType.IDENTIFIER;
    case "r":
      return isWord(input, index, "return")
        ? TokenType.RETURN
        : TokenType.IDENTIFIER;
    case "t":
      return isWord(input, index, "true")
        ? TokenType.TRUE
        : TokenType.IDENTIFIER;
    case "v":
      return isWord(input, index, "var")
        ? TokenType.VAR
        : isWord(input, index, "val")
        ? TokenType.VAL
        : TokenType.IDENTIFIER;
    case "\n":
    case "\r":
      return TokenType.NL;
    case ";":
      return TokenType.SEMICOLON;
    case ",":
      return TokenType.COMMA;
    case ":":
      return TokenType.COLON;
    case '"':
      return TokenType.QUOTE_OPEN;
    case "=":
      return isWord(input, index, "==") ? TokenType.EQEQ : TokenType.ASSIGNMENT;
    case "(":
      return TokenType.LPAREN;
    case ")":
      return TokenType.RPAREN;
    case "{":
      return TokenType.LCURL;
    case "}":
      return TokenType.RCURL;
    case "[":
      return TokenType.LBRACKET;
    case "]":
      return TokenType.RBRACKET;
  }

  if (isLetter(input[index])) {
    return TokenType.IDENTIFIER;
  }

  if (isDigit(input[index])) {
    return TokenType.INT;
  }

  return null;
}

function tokenLength(input: string, tokenType: TokenType, index: number) {
  switch (tokenType) {
    case TokenType.VAL:
    case TokenType.VAR:
    case TokenType.FUN:
      return 3;

    case TokenType.IF:
      return 2;

    case TokenType.ELSE:
    case TokenType.TRUE:
      return 4;

    case TokenType.RETURN:
      return 6;

    case TokenType.COLON:
    case TokenType.DOT:
    case TokenType.COMMA:
    case TokenType.LBRACKET:
    case TokenType.LCURL:
    case TokenType.LPAREN:
    case TokenType.RBRACKET:
    case TokenType.RCURL:
    case TokenType.RPAREN:
    case TokenType.ASSIGNMENT:
      return 1;

    case TokenType.EOF:
      return 0;

    case TokenType.EQEQ:
      return 2;

    case TokenType.IDENTIFIER: {
      let end = index + 1;
      while (
        end < input.length &&
        (isLetter(input[end]) || isDigit(input[end]))
      ) {
        end++;
      }
      return end - index;
    }

    case TokenType.INT: {
      let end = index + 1;
      while (end < input.length && isDigit(input[end])) {
        end++;
      }
      return end - index;
    }

    case TokenType.NL: {
      if (index + 1 < input.length && input[index + 1] === "\r") {
        return 2;
      }

      return 1;
    }
  }

  return null;
}

function isWord(input: string, index: number, word: string) {
  return (
    input.startsWith(word, index) && isSeparator(input[index + word.length])
  );
}

function isSeparator(ch: string | undefined) {
  if (ch === undefined) {
    return true;
  }

  return !isDigit(ch) && !isLetter(ch);
}

function isDigit(ch: string) {
  return ch >= "0" && ch <= "9";
}

function isLetter(ch: string) {
  const n = ch.charCodeAt(0);
  return (n >= 65 && n < 91) || (n >= 97 && n < 123);
}

function isWhitespace(ch: string) {
  return ch === " " || ch === "\t";
}
