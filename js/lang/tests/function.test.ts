import assert from "assert";
import { DiagnosticMessage, parseScript } from "../src";
import { FunctionNode } from "../src/nodes/function";
import { VariableDeclarationNode } from "../src/nodes/variableDeclaration";
import {
  createLiteralType,
  createUnionType,
  numberType,
  stringType,
} from "../src/typeSystem";
import { assertTybscriType, assertType } from "./utils";

describe("Functions", function () {
  it("node", function () {
    const parseResult = parseScript(`
    fun foo() {
        "bar"
    }
    `);
    assertType(parseResult.tree.statements[0], FunctionNode);
  });

  it("inferred return type", function () {
    const parseResult = parseScript(`
    fun foo() {
        "bar"
    }
    `);
    const funcNode = parseResult.tree.statements[0];
    assertType(funcNode, FunctionNode);
    assertTybscriType(funcNode.valueType, {
      kind: "Func",
      returnType: createLiteralType("bar"),
      parameters: [],
    });
  });

  it("explicit return", function () {
    const parseResult = parseScript(`
    fun foo() {
        return "bar"
    }
    `);
    const funcNode = parseResult.tree.statements[0];
    assertType(funcNode, FunctionNode);
    assertTybscriType(funcNode.valueType, {
      kind: "Func",
      returnType: createLiteralType("bar"),
      parameters: [],
    });
  });

  it("several returns", function () {
    const parseResult = parseScript(`
    fun foo() {
      if (1) {
        return 1
      }

      if (2) {
        return 2
      }

      return 3
    }
    `);
    const funcNode = parseResult.tree.statements[0];
    assertType(funcNode, FunctionNode);
    assertTybscriType(funcNode.valueType, {
      kind: "Func",
      returnType: createUnionType(
        createLiteralType(1),
        createLiteralType(2),
        createLiteralType(3)
      ),
      parameters: [],
    });
  });

  it("handle inner functions", function () {
    const parseResult = parseScript(`
    fun foo() {
      fun bar() {
        return "bar"
      }

      return "123"
    }
    `);
    const funcNode = parseResult.tree.statements[0];
    assertType(funcNode, FunctionNode);
    assertTybscriType(funcNode.valueType, {
      kind: "Func",
      returnType: createLiteralType("123"),
      parameters: [],
    });
  });

  it("function parameters", function () {
    const parseResult = parseScript(
      `
    fun foo(arg1: "1", arg2: 2) {
        arg1
    }
    `
    );
    const funcNode = parseResult.tree.statements[0];
    assertType(funcNode, FunctionNode);
    assertTybscriType(funcNode.valueType, {
      kind: "Func",
      returnType: createLiteralType("1"),
      parameters: [
        {
          name: "arg1",
          type: createLiteralType("1"),
        },
        {
          name: "arg2",
          type: createLiteralType(2),
        },
      ],
    });
  });

  it("invoke function result type", function () {
    const parseResult = parseScript(
      `
    fun foo() {
        "bar"
    }

    foo()
    `
    );
    const resultNode =
      parseResult.tree.statements[parseResult.tree.statements.length - 1];
    assertTybscriType(resultNode.valueType, {
      kind: "Literal",
      value: "bar",
      valueType: stringType,
    });
  });

  it("circular reference error", function () {
    const result = parseScript(
      `
    fun foo() {
        foo()
    }
    `
    );
    assert.equal(result.diagnosticMessages.length, 1);
  });

  it("indirect circular reference error", function () {
    const result = parseScript(
      `
    fun foo() {
        bar()
    }

    fun bar() {
      foo()
    }
    `
    );
    assert.equal(result.diagnosticMessages.length, 1);
  });

  it("future function depending on earlier variable", function () {
    const parseResult = parseScript(`
    val future = foo()
    val bar = 123
    fun foo() {
        bar
    }
    `);
    const varNode = parseResult.tree.statements[0];
    assertType(varNode, VariableDeclarationNode);
    assertTybscriType(varNode.valueType, {
      kind: "Literal",
      value: 123,
      valueType: numberType,
    });
  });
});

var future = foo();
const bar = 123;
function foo() {
  return bar;
}
