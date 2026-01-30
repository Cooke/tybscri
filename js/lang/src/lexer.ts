export const enum TokenType {
  EOF = "EOF",

  // Keywords
  IF = "IF",
  ELSE = "ELSE",
  FUN = "FUN",
  VAR = "VAR",
  VAL = "VAL",
  RETURN = "RETURN",
  IS = "IS",
  FOR = "FOR",
  WHILE = "WHILE",
  BREAK = "BREAK",
  CONTINUE = "CONTINUE",
  IN = "IN",
  NULL = "NULL",
  TRUE = "TRUE",
  FALSE = "FALSE",

  // Identifiers and literals
  IDENTIFIER = "IDENTIFIER",
  INT = "INT",
  FLOAT = "FLOAT",
  LINE_STRING = "LINE_STRING",

  // Symbols
  DOT = "DOT",
  COMMA = "COMMA",
  COLON = "COLON",
  SEMICOLON = "SEMICOLON",
  LPAREN = "LPAREN",
  RPAREN = "RPAREN",
  LBRACKET = "LBRACKET",
  RBRACKET = "RBRACKET",
  LCURL = "LCURL",
  RCURL = "RCURL",

  // Operators
  ASSIGNMENT = "ASSIGNMENT",
  EQEQ = "EQEQ",
  EXCLAM_EQ = "EXCLAM_EQ",
  LT = "LT",
  GT = "GT",
  LT_EQ = "LT_EQ",
  GT_EQ = "GT_EQ",
  ADD = "ADD",
  SUB = "SUB",
  MULT = "MULT",
  DIV = "DIV",
  MOD = "MOD",
  AND_AND = "AND_AND",
  OR = "OR",
  OR_OR = "OR_OR",
  EXCLAM = "EXCLAM",
  FAT_ARROW = "FAT_ARROW",
  INCR = "INCR",
  DECR = "DECR",
  QUESTION = "QUESTION",

  // Whitespace
  NL = "NL",
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

  get line() {
    return this._line;
  }

  get column() {
    return this._column;
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
      this._column = 1;
    }

    // Skip whitespace
    while (
      this._index < this.input.length &&
      isWhitespace(this.input[this._index])
    ) {
      this._index++;
      this._column++;
    }

    // Skip comments
    while (this._index < this.input.length) {
      if (
        this._index + 1 < this.input.length &&
        this.input[this._index] === "/" &&
        this.input[this._index + 1] === "/"
      ) {
        // Line comment - skip to end of line
        while (
          this._index < this.input.length &&
          this.input[this._index] !== "\n" &&
          this.input[this._index] !== "\r"
        ) {
          this._index++;
          this._column++;
        }
      } else if (
        this._index + 1 < this.input.length &&
        this.input[this._index] === "/" &&
        this.input[this._index + 1] === "*"
      ) {
        // Block comment - skip to */
        this._index += 2;
        this._column += 2;
        while (
          this._index + 1 < this.input.length &&
          !(
            this.input[this._index] === "*" &&
            this.input[this._index + 1] === "/"
          )
        ) {
          if (this.input[this._index] === "\n") {
            this._line++;
            this._column = 1;
          } else if (this.input[this._index] !== "\r") {
            this._column++;
          }
          this._index++;
        }
        if (this._index + 1 < this.input.length) {
          this._index += 2;
          this._column += 2;
        }
      } else {
        break;
      }

      // Skip whitespace after comment
      while (
        this._index < this.input.length &&
        isWhitespace(this.input[this._index])
      ) {
        this._index++;
        this._column++;
      }
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

    const ch = input[index];
    switch (ch) {
      case ".":
        this.update(TokenType.DOT, 1);
        return;

      case ",":
        this.update(TokenType.COMMA, 1);
        return;

      case ":":
        this.update(TokenType.COLON, 1);
        return;

      case ";":
        this.update(TokenType.SEMICOLON, 1);
        return;

      case "(":
        this.update(TokenType.LPAREN, 1);
        return;

      case ")":
        this.update(TokenType.RPAREN, 1);
        return;

      case "[":
        this.update(TokenType.LBRACKET, 1);
        return;

      case "]":
        this.update(TokenType.RBRACKET, 1);
        return;

      case "{":
        this.update(TokenType.LCURL, 1);
        return;

      case "}":
        this.update(TokenType.RCURL, 1);
        return;

      case "?":
        this.update(TokenType.QUESTION, 1);
        return;

      case "!":
        if (index + 1 < input.length && input[index + 1] === "=") {
          this.update(TokenType.EXCLAM_EQ, 2);
        } else {
          this.update(TokenType.EXCLAM, 1);
        }
        return;

      case "=":
        if (index + 1 < input.length && input[index + 1] === "=") {
          this.update(TokenType.EQEQ, 2);
        } else if (index + 1 < input.length && input[index + 1] === ">") {
          this.update(TokenType.FAT_ARROW, 2);
        } else {
          this.update(TokenType.ASSIGNMENT, 1);
        }
        return;

      case "<":
        if (index + 1 < input.length && input[index + 1] === "=") {
          this.update(TokenType.LT_EQ, 2);
        } else {
          this.update(TokenType.LT, 1);
        }
        return;

      case ">":
        if (index + 1 < input.length && input[index + 1] === "=") {
          this.update(TokenType.GT_EQ, 2);
        } else {
          this.update(TokenType.GT, 1);
        }
        return;

      case "+":
        if (index + 1 < input.length && input[index + 1] === "+") {
          this.update(TokenType.INCR, 2);
        } else {
          this.update(TokenType.ADD, 1);
        }
        return;

      case "-":
        if (index + 1 < input.length && input[index + 1] === "-") {
          this.update(TokenType.DECR, 2);
        } else {
          this.update(TokenType.SUB, 1);
        }
        return;

      case "*":
        this.update(TokenType.MULT, 1);
        return;

      case "/":
        this.update(TokenType.DIV, 1);
        return;

      case "%":
        this.update(TokenType.MOD, 1);
        return;

      case "&":
        if (index + 1 < input.length && input[index + 1] === "&") {
          this.update(TokenType.AND_AND, 2);
        } else {
          throw new Error(
            `Unexpected character '&' at index ${index} (${this._line}:${this._column})`
          );
        }
        return;

      case "|":
        if (index + 1 < input.length && input[index + 1] === "|") {
          this.update(TokenType.OR_OR, 2);
        } else {
          this.update(TokenType.OR, 1);
        }
        return;

      case "\n":
        this.update(TokenType.NL, 1);
        return;

      case "\r":
        if (index + 1 < input.length && input[index + 1] === "\n") {
          this.update(TokenType.NL, 2);
        } else {
          this.update(TokenType.NL, 1);
        }
        return;

      case '"':
        this.parseString();
        return;

      // Keywords starting with specific letters
      case "b":
        if (isWord(input, index, "break")) {
          this.update(TokenType.BREAK, 5);
        } else {
          this.parseIdentifier();
        }
        return;

      case "c":
        if (isWord(input, index, "continue")) {
          this.update(TokenType.CONTINUE, 8);
        } else {
          this.parseIdentifier();
        }
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
        } else if (isWord(input, index, "for")) {
          this.update(TokenType.FOR, 3);
        } else {
          this.parseIdentifier();
        }
        return;

      case "i":
        if (isWord(input, index, "if")) {
          this.update(TokenType.IF, 2);
        } else if (isWord(input, index, "is")) {
          this.update(TokenType.IS, 2);
        } else if (isWord(input, index, "in")) {
          this.update(TokenType.IN, 2);
        } else {
          this.parseIdentifier();
        }
        return;

      case "n":
        if (isWord(input, index, "null")) {
          this.update(TokenType.NULL, 4);
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

      case "w":
        if (isWord(input, index, "while")) {
          this.update(TokenType.WHILE, 5);
        } else {
          this.parseIdentifier();
        }
        return;
    }

    if (isLetter(ch) || ch === "_") {
      this.parseIdentifier();
      return;
    }

    if (isDigit(ch)) {
      this.parseNumber();
      return;
    }

    throw new Error(
      `Unrecognizable character '${ch}' at index ${this._index} (${this._line}:${this._column})`
    );
  }

  private parseString(): void {
    let end = this._index + 1;
    while (end < this.input.length && this.input[end] !== '"') {
      // Handle escape sequences
      if (this.input[end] === '\\' && end + 1 < this.input.length) {
        end += 2;
      } else {
        end++;
      }
    }

    if (end < this.input.length) {
      end++; // Include closing quote
    }

    this.update(TokenType.LINE_STRING, end - this._index);
  }

  private parseNumber(): void {
    let end = this._index + 1;
    while (end < this.input.length && isDigit(this.input[end])) {
      end++;
    }

    // Check for float
    if (end < this.input.length && this.input[end] === '.' &&
        end + 1 < this.input.length && isDigit(this.input[end + 1])) {
      end++;
      while (end < this.input.length && isDigit(this.input[end])) {
        end++;
      }
      this.update(TokenType.FLOAT, end - this._index);
    } else {
      this.update(TokenType.INT, end - this._index);
    }
  }

  private update(tokenType: TokenType, length: number) {
    this._tokenType = tokenType;
    this._tokenLength = length;
  }

  private parseIdentifier() {
    let end = this._index + 1;
    while (
      end < this.input.length &&
      (isLetter(this.input[end]) || isDigit(this.input[end]) || this.input[end] === "_")
    ) {
      end++;
    }
    this.update(TokenType.IDENTIFIER, end - this._index);
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

  return !isDigit(ch) && !isLetter(ch) && ch !== "_";
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
