export const enum TokenType {
  EOF,
  IF,
  IDENTIFIER,
  DOT,
}

export class Token {
  constructor(
    public readonly type: TokenType,
    public readonly index: number,
    public readonly lenth: number
  ) {}
}

export class Lexer {
  private index: number = 0;
  private tokenType: TokenType | null = null;
  private token: Token | null = null;

  constructor(public readonly input: string) {}

  public peek(offset: number = 0): TokenType {
    if (offset !== 0) {
      return this.peekInternal(this.index + offset);
    }

    if (this.tokenType !== null) {
      return this.tokenType;
    }

    this.tokenType = this.peekInternal(this.index);
    return this.tokenType;
  }

  public advance() {
    const length = this.token ? this.token.lenth : this.tokenLength();
    this.index += length;
    this.tokenType = null;
    this.token = null;
  }

  public currentToken() {
    if (this.token) {
      return this.token;
    }

    const tokenType = this.peek();
    const length = this.tokenLength();
    this.token = new Token(tokenType, this.index, length);
    return this.token;
  }

  private peekInternal(index: number): TokenType {
    if (this.isEof(index)) {
      return TokenType.EOF;
    }

    switch (this.input[this.index]) {
      case ".":
        return TokenType.DOT;
      case "i":
        return this.isMatch(this.index, "if")
          ? TokenType.IF
          : TokenType.IDENTIFIER;
    }

    if (this.isLetter(index)) {
      return TokenType.IDENTIFIER;
    }

    throw new Error("Unknown input character: " + this.input[this.index]);
  }

  private tokenLength() {
    const token = this.peek();
    switch (token) {
      case TokenType.IDENTIFIER:
        let end = this.index;
        while (
          end < this.input.length &&
          (this.isLetter(end) || this.isLetter(end))
        ) {
          end++;
        }
        return this.index - end;

      case TokenType.IF:
        return 2;
    }

    throw new Error("Unknown token");
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
    return !this.isEof(index) && this.input[index] === " ";
  }
}
