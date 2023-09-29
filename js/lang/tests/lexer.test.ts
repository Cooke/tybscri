import assert from "assert";
import { Lexer, TokenType } from "../src/lexer";

describe("Lexer", function () {
  it("identifier token type", function () {
    const lexer = new Lexer("variable123");
    assert.equal(lexer.peek(), TokenType.IDENTIFIER);
  });

  it("if token type", function () {
    const lexer = new Lexer("if");
    assert.equal(lexer.peek(), TokenType.IF);
  });
});
