import assert from "assert";
import { createLiteralType, createUnionType, parseScript } from "../src";
import { IfNode } from "../src/nodes/if";
import { ExpressionStatementNode } from "../src/nodes/statements";
import { nullType, trueType } from "../src/types";
import { assertTybscriType } from "./utils";

describe("Narrowing", function () {
  it("narrowed type in branch", function () {
    const parseResult = parseScript(
      `
      var bar = true
      val foo = bar
      if (foo) {
        foo
      }
    `
    );
    const valNode = parseResult.tree.statements[2];
    assertTybscriType(
      valNode.valueType,
      createUnionType(createLiteralType(true), nullType)
    );
  });

  it("narrowed type in scope in branch", function () {
    const parseResult = parseScript(
      `
      var bar = true
      val foo = bar
      if (foo) {
      }
    `
    );
    const ifExpressionStatement = parseResult.tree
      .statements[2] as ExpressionStatementNode;
    const ifExpression = ifExpressionStatement.expression as IfNode;
    const foo = ifExpression.thenBlock.scope.resolveLast("foo");
    assert.ok(foo);
    assertTybscriType(foo.valueType, trueType);
  });

  it("narrow type with is", function () {
    const parseResult = parseScript(`
      var foo = "1"
      val bar = foo
      if (bar is "1") {
        bar
      } 
    `);
    const valNode =
      parseResult.tree.statements[parseResult.tree.statements.length - 1];
    assertTybscriType(
      valNode.valueType,
      createUnionType(createLiteralType("1"), nullType)
    );
  });
});
