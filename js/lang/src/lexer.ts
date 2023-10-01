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
  INT = "INT",
  IS = "IS",
  TRUE = "TRUE",
  FALSE = "FALSE",
  RETURN = "RETURN",
  LBRACKET = "LBRACKET",
  RBRACKET = "RBRACKET",
  ELSE = "ELSE",
  LINE_STRING = "LINE_STRING",
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

  constructor(public readonly input: string, initialState?: LexerState) {
    if (initialState) {
      this._index = initialState.index;
      this._column = initialState.column;
      this._line = initialState.line;
    }

    this.advance();
  }

  get tokenType() {
    return this._tokenType;
  }

  get token() {
    if (this._token) {
      return this._token;
    }

    this._token = new Token(
      this._tokenType,
      this.input.substring(this._index, this._index + this._tokenLength),
      this._index,
      this._tokenLength,
      this._line,
      this._column
    );
    return this._token;
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

    this.parse();
    this._token = null;
  }

  public createChildLexer() {
    return new Lexer(this.input, {
      index: this._index,
      column: this._column,
      line: this._line,
    });
  }

  private parse(): void {
    const index = this._index;
    const input = this.input;
    if (index >= input.length) {
      this.update(TokenType.EOF, 0);
      return;
    }

    switch (input[index]) {
      case ".":
        this.update(TokenType.DOT, 1);
        return;

      case "e":
        if (isWord(input, index, "else")) {
          this.update(TokenType.ELSE, 4);
        } else {
          this.parseIdentifier();
        }
        return;

      case "f":
        if (isWord(input, index, "fun")) {
          this.update(TokenType.FUN, 3);
        } else if (isWord(input, index, "false")) {
          this.update(TokenType.FALSE, 5);
        } else {
          this.parseIdentifier();
        }
        return;

      case "i":
        if (isWord(input, index, "if")) {
          this.update(TokenType.IF, 2);
        } else if (isWord(input, index, "is")) {
          this.update(TokenType.IS, 2);
        } else {
          this.parseIdentifier();
        }
        return;

      case "r":
        if (isWord(input, index, "return")) {
          this.update(TokenType.RETURN, 6);
        } else {
          this.parseIdentifier();
        }
        return;

      case "t":
        if (isWord(input, index, "true")) {
          this.update(TokenType.TRUE, 4);
        } else {
          this.parseIdentifier();
        }
        return;

      case "v":
        if (isWord(input, index, "var")) {
          this.update(TokenType.VAR, 3);
        } else if (isWord(input, index, "val")) {
          this.update(TokenType.VAL, 3);
        } else {
          this.parseIdentifier();
        }
        return;

      case "\n":
        this.update(TokenType.NL, 1);
        return;

      case "\r":
        if (this.input[index + 1] !== "\n") {
          throw new Error(
            "Unexpected character sequence: \\r not followed by \\n is currently not allowed"
          );
        }
        this.update(TokenType.NL, 2);
        return;

      case ";":
        this.update(TokenType.SEMICOLON, 1);
        return;

      case ",":
        this.update(TokenType.COMMA, 1);
        return;

      case ":":
        this.update(TokenType.COLON, 1);
        return;

      case "=":
        if (isWord(input, index, "==")) {
          this.update(TokenType.EQEQ, 2);
        } else {
          this.update(TokenType.ASSIGNMENT, 1);
        }
        return;

      case "(":
        this.update(TokenType.LPAREN, 1);
        return;

      case ")":
        this.update(TokenType.RPAREN, 1);
        return;

      case "{":
        this.update(TokenType.LCURL, 1);
        return;

      case "}":
        this.update(TokenType.RCURL, 1);
        return;

      case "[":
        this.update(TokenType.LBRACKET, 1);
        return;

      case "]":
        this.update(TokenType.RBRACKET, 1);
        return;

      case '"':
        let end = index;
        do {
          end++;
        } while (this.input[end] !== '"' && this.input[end]);
        this.update(TokenType.LINE_STRING, end - this._index + 1);
        return;
    }

    if (isLetter(input[index])) {
      this.parseIdentifier();
      return;
    }

    if (isDigit(input[index])) {
      let end = index + 1;
      while (end < input.length && isDigit(input[end])) {
        end++;
      }
      this.update(TokenType.INT, end - index);
      return;
    }

    throw new Error(
      `Unreconizable character at "${this.input.substring(
        this._index,
        this._index + 10
      )}" at index ${this._index} (${this._line}:${this._column})`
    );
  }

  private update(tokenType: TokenType, length: number) {
    this._tokenType = tokenType;
    this._tokenLength = length;
  }

  private parseIdentifier() {
    let end = this._index + 1;
    while (
      end < this.input.length &&
      (isLetter(this.input[end]) || isDigit(this.input[end]))
    ) {
      end++;
    }
    const length = end - this._index;
    this.update(TokenType.IDENTIFIER, length);
  }
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
