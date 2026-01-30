import { parseScript } from "../src";
import { VoidType } from "../src/typeSystem/VoidType";
import { NeverType } from "../src/typeSystem/NeverType";
import { assertTybscriType } from "./utils";
import { ForNode } from "../src/nodes/for";
import { WhileNode } from "../src/nodes/while";
import { BreakNode } from "../src/nodes/break";
import { ContinueNode } from "../src/nodes/continue";
import { ExpressionStatementNode } from "../src/nodes/statements";
import assert from "assert";

describe("For loop", function () {
  it("parses for loop", function () {
    const parseResult = parseScript(`
      for (x in [1, 2, 3]) {
        x
      }
    `);
    const stmt = parseResult.tree.statements[0];
    assert.ok(stmt instanceof ExpressionStatementNode);
    assert.ok(stmt.expression instanceof ForNode);
  });

  it("has void type", function () {
    const parseResult = parseScript(`
      for (x in [1, 2, 3]) {
        x
      }
    `);
    const stmt = parseResult.tree.statements[0];
    assertTybscriType(stmt.valueType, VoidType.instance);
  });

  it("infers item type from list", function () {
    const parseResult = parseScript(`
      for (x in [1, 2, 3]) {
        x
      }
    `);
    const stmt = parseResult.tree.statements[0] as ExpressionStatementNode;
    const forNode = stmt.expression as ForNode;
    assert.ok(forNode.itemSymbol);
  });
});

describe("While loop", function () {
  it("parses while loop", function () {
    const parseResult = parseScript(`
      while (true) {
        123
      }
    `);
    const stmt = parseResult.tree.statements[0];
    assert.ok(stmt instanceof ExpressionStatementNode);
    assert.ok(stmt.expression instanceof WhileNode);
  });

  it("has void type", function () {
    const parseResult = parseScript(`
      while (true) {
        123
      }
    `);
    const stmt = parseResult.tree.statements[0];
    assertTybscriType(stmt.valueType, VoidType.instance);
  });

  it("parses while with expression body", function () {
    const parseResult = parseScript(`
      while (true) 123
    `);
    const stmt = parseResult.tree.statements[0];
    assert.ok(stmt instanceof ExpressionStatementNode);
    assert.ok(stmt.expression instanceof WhileNode);
  });
});

describe("Break", function () {
  it("parses break statement", function () {
    const parseResult = parseScript(`
      while (true) {
        break
      }
    `);
    const stmt = parseResult.tree.statements[0] as ExpressionStatementNode;
    const whileNode = stmt.expression as WhileNode;
    assert.ok(whileNode.body);
  });

  it("has never type", function () {
    const parseResult = parseScript(`break`);
    const stmt = parseResult.tree.statements[0] as ExpressionStatementNode;
    assert.ok(stmt.expression instanceof BreakNode);
    assert.equal(stmt.valueType.displayName, "never");
  });
});

describe("Continue", function () {
  it("parses continue statement", function () {
    const parseResult = parseScript(`
      while (true) {
        continue
      }
    `);
    const stmt = parseResult.tree.statements[0] as ExpressionStatementNode;
    const whileNode = stmt.expression as WhileNode;
    assert.ok(whileNode.body);
  });

  it("has never type", function () {
    const parseResult = parseScript(`continue`);
    const stmt = parseResult.tree.statements[0] as ExpressionStatementNode;
    assert.ok(stmt.expression instanceof ContinueNode);
    assert.equal(stmt.valueType.displayName, "never");
  });
});

describe("Loop with break and continue", function () {
  it("parses complex loop with break", function () {
    const parseResult = parseScript(`
      var i = 0
      while (true) {
        if (i == 5) break
        i = 1
      }
    `);
    assert.equal(parseResult.tree.statements.length, 2);
  });

  it("parses complex loop with continue", function () {
    const parseResult = parseScript(`
      var evens = 0
      for (x in [1, 2, 3, 4, 5, 6]) {
        if (x == 1) continue
        evens = 1
      }
    `);
    assert.equal(parseResult.tree.statements.length, 2);
  });
});
