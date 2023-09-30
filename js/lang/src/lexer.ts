export const enum TokenType {
  EOF,
  IF,
  IDENTIFIER,
  DOT,
  NL,
  SEMICOLON,
  FUN,
  VAR,
  VAL,
  ASSIGNMENT,
  EQEQ,
  LPAREN,
  RPAREN,
  LCURL,
  RCURL,
  COMMA,
  COLON,
  QUOTE_OPEN,
  INT,
  IS,
  TRUE,
  FALSE,
  RETURN,
  LBRACKET,
  RBRACKET,
  ELSE,
}

export const tokenTypeNames: any /*{ [P in TokenType]: string }*/ = {
  [TokenType.IF]: "if",
  [TokenType.ASSIGNMENT]: "=",
  [TokenType.COLON]: ":",
  [TokenType.COMMA]: ",",
  [TokenType.DOT]: ".",
  [TokenType.ELSE]: "else",
  [TokenType.IDENTIFIER]: "<identifier>",
  [TokenType.EOF]: "<EOF>",
};

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

export class Lexer {
  private _index: number = 0;
  private _line: number = 1;
  private _column: number = 1;
  private _tokenType: TokenType | null = null;
  private _token: Token | null = null;

  get index() {
    return this._index;
  }

  constructor(public readonly input: string) {
    while (this.isWhitespace(this._index)) {
      this._index++;
    }
  }

  public tokenType(offset: number = 0): TokenType {
    if (offset !== 0) {
      let index = this._index;
      for (let i = 0; i < offset; i++) {
        index += this.tokenLength(this.tokenTypeAtIndex(index), index);
      }

      return this.tokenTypeAtIndex(index);
    }

    if (this._tokenType !== null) {
      return this._tokenType;
    }

    this._tokenType = this.tokenTypeAtIndex(this._index);
    return this._tokenType;
  }

  public advance() {
    const tokenType = this._token?.type ?? this.tokenType();
    const length =
      this._token?.length ?? this.tokenLength(tokenType, this._index);

    this._index += length;
    if (tokenType === TokenType.NL) {
      this._line++;
      this._column = 0;
    } else {
      this._column += length;
    }

    while (this.isWhitespace(this._index)) {
      this._index++;
    }

    this._tokenType = null;
    this._token = null;
  }

  public createToken() {
    if (this._token) {
      return this._token;
    }

    const tokenType = this.tokenType();
    const length = this.tokenLength(tokenType, this._index);
    this._token = new Token(
      tokenType,
      this.input.substring(this._index, length),
      this._index,
      length,
      this._line,
      this._column
    );
    return this._token;
  }

  private tokenTypeAtIndex(index: number): TokenType {
    if (this.isEof(index)) {
      return TokenType.EOF;
    }

    switch (this.input[index]) {
      case ".":
        return TokenType.DOT;
      case "e":
        return this.isMatch(index, "else")
          ? TokenType.ELSE
          : TokenType.IDENTIFIER;
      case "f":
        return this.isMatch(index, "fun")
          ? TokenType.FUN
          : this.isMatch(index, "false")
          ? TokenType.FALSE
          : TokenType.IDENTIFIER;

      case "i":
        return this.isMatch(index, "if")
          ? TokenType.IF
          : this.isMatch(index, "is")
          ? TokenType.IS
          : TokenType.IDENTIFIER;
      case "r":
        return this.isMatch(index, "return")
          ? TokenType.RETURN
          : TokenType.IDENTIFIER;
      case "t":
        return this.isMatch(index, "true")
          ? TokenType.TRUE
          : TokenType.IDENTIFIER;
      case "v":
        return this.isMatch(index, "var")
          ? TokenType.VAR
          : this.isMatch(index, "val")
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
        return this.isMatch(index, "==")
          ? TokenType.EQEQ
          : TokenType.ASSIGNMENT;
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

    if (this.isLetter(index)) {
      return TokenType.IDENTIFIER;
    }

    if (this.isDigit(index)) {
      return TokenType.INT;
    }

    throw new Error("Unknown input character: " + this.input[index]);
  }

  private tokenLength(tokenType: TokenType, index: number) {
    switch (tokenType) {
      case TokenType.IDENTIFIER:
        let end = index;
        while (
          end < this.input.length &&
          (this.isLetter(end) || this.isDigit(end))
        ) {
          end++;
        }
        return end - index;

      case TokenType.VAL:
      case TokenType.VAR:
        return 3;

      case TokenType.IF:
        return 2;

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
    }

    throw new Error(
      "Unknown token: " + tokenType + " name:" + tokenTypeNames[tokenType]
    );
  }

  private isMatch(index: number, token: string) {
    return (
      this.input.startsWith(token, index) &&
      this.isSeparator(index + token.length)
    );
  }

  private isSeparator(index: number) {
    if (this.isEof(index)) {
      return true;
    }

    return !this.isDigit(index) && !this.isLetter(index);
  }

  private isEof(index: number) {
    return index >= this.input.length;
  }

  private isDigit(index: number) {
    return (
      !this.isEof(index) && this.input[index] >= "0" && this.input[index] <= "9"
    );
  }

  private isLetter(index: number) {
    return (
      !this.isEof(index) && this.input[index].match(/[\p{Letter}\p{Mark}]+/gu)
    );
  }

  private isWhitespace(index: number) {
    if (this.isEof(index)) {
      return false;
    }

    return this.input[index] === " " || this.input[index] === "\t";
  }
}
