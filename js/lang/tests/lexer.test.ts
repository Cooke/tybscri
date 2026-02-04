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

  describe("unicode support", function () {
    it("parses string with unicode characters", function () {
      const lexer = new Lexer('"Hello 世界 🌍 émojis"');
      assert.equal(lexer.tokenType, TokenType.LINE_STRING);
      assert.equal(lexer.token.text, '"Hello 世界 🌍 émojis"');
    });

    it("parses string with various unicode scripts", function () {
      const lexer = new Lexer('"日本語 한국어 العربية עברית"');
      assert.equal(lexer.tokenType, TokenType.LINE_STRING);
      assert.equal(lexer.token.text, '"日本語 한국어 العربية עברית"');
    });

    it("parses line comment with unicode", function () {
      const lexer = new Lexer("// Комментарий 中文注释 🎉");
      assert.equal(lexer.tokenType, TokenType.LINE_COMMENT);
      assert.equal(lexer.token.text, "// Комментарий 中文注释 🎉");
    });

    it("parses block comment with unicode", function () {
      const lexer = new Lexer("/* Multi 世界 line\n comment 🌟 */");
      assert.equal(lexer.tokenType, TokenType.BLOCK_COMMENT);
      assert.equal(lexer.token.text, "/* Multi 世界 line\n comment 🌟 */");
    });

    it("parses code with unicode strings and comments mixed", function () {
      const code = `// 日本語コメント
var greeting = "Hello 世界"
/* 中文注释 */`;
      const lexer = new Lexer(code);

      // Line comment
      assert.equal(lexer.tokenType, TokenType.LINE_COMMENT);
      lexer.advance();

      // Newline
      assert.equal(lexer.tokenType, TokenType.NL);
      lexer.advance();

      // var
      assert.equal(lexer.tokenType, TokenType.VAR);
      lexer.advance();

      // greeting
      assert.equal(lexer.tokenType, TokenType.IDENTIFIER);
      lexer.advance();

      // =
      assert.equal(lexer.tokenType, TokenType.ASSIGNMENT);
      lexer.advance();

      // "Hello 世界"
      assert.equal(lexer.tokenType, TokenType.LINE_STRING);
      assert.equal(lexer.token.text, '"Hello 世界"');
      lexer.advance();

      // Newline
      assert.equal(lexer.tokenType, TokenType.NL);
      lexer.advance();

      // Block comment
      assert.equal(lexer.tokenType, TokenType.BLOCK_COMMENT);
      assert.equal(lexer.token.text, "/* 中文注释 */");
    });
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
