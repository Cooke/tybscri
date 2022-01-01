import assert from "assert";
import { DiagnosticMessage, parseScript } from "../src";
import { FunctionNode } from "../src/nodes/function";
import { InvocationNode } from "../src/nodes/invocation";
import { VariableDeclarationNode } from "../src/nodes/variableDeclaration";
import { numberType } from "../src/types/number";
import { stringType } from "../src/types/string";
import { assertTybscriType, assertType } from "./utils";
import { createLiteralType, createUnionType } from "../src/types/utils";
import { printTree } from "../src/utils";

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
    const msgs: any[] = [];
    const parseResult = parseScript(
      `
    fun foo(arg1: "1", arg2: 2) {
        arg1
    }
    `,
      {
        onDiagnosticMessage: (msg) => msgs.push(msg),
      }
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
    const msgs: DiagnosticMessage[] = [];
    parseScript(
      `
    fun foo() {
        foo()
    }
    `,
      { onDiagnosticMessage: (msg) => msgs.push(msg) }
    );
    assert.equal(msgs.length, 1);
  });

  it("indirect circular reference error", function () {
    const msgs: DiagnosticMessage[] = [];
    parseScript(
      `
    fun foo() {
        bar()
    }

    fun bar() {
      foo()
    }
    `,
      { onDiagnosticMessage: (msg) => msgs.push(msg) }
    );
    assert.equal(msgs.length, 1);
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
