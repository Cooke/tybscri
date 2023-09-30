import assert from "assert";
import { Lexer, TokenType } from "../src/lexer";

describe("Lexer", function () {
  it("identifier token type", function () {
    const lexer = new Lexer("variable123");
    assert.equal(lexer.tokenType, TokenType.IDENTIFIER);
    lexer.advance();
    assert.equal(lexer.tokenType, TokenType.EOF);
  });

  it("token then token", function () {
    const lexer = new Lexer("var val");
    assert.equal(lexer.tokenType, TokenType.VAR);
    lexer.advance();
    assert.equal(lexer.tokenType, TokenType.VAL);
  });

  it("if token type", function () {
    const lexer = new Lexer("if");
    assert.equal(lexer.tokenType, TokenType.IF);
  });

  it("big chunk", function () {
    const lexer = new Lexer(mamaCode);
    while (lexer.tokenType != TokenType.EOF) {
      lexer.advance();
    }
  });
});

const mamaCode = `
var foo = bar
val bar = bar
if (foo == bar) {
  fun print(bar) {
    for (i in [0..10]) {
      system.println(bar)
    }
  }

  while (true) {
    print(bar)
  }
} else {
  fun print(bar) {
    for (i in [0..10]) {
      system.println(bar)
    }
  }

  while (true) {
    print(bar)
  }
}
`;
