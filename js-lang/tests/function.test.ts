import assert from "assert";
import { DiagnosticMessage, parseScript } from "../src";
import { FunctionNode } from "../src/nodes/function";
import { InvocationNode } from "../src/nodes/invocation";
import { stringType } from "../src/types/string";
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
      returnType: {
        kind: "Literal",
        value: "bar",
        valueType: stringType,
      },
      parameters: [],
    });
  });

  it("invoke function result type", function () {
    const parseResult = parseScript(`
    fun foo() {
        "bar"
    }

    foo()
    `);
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
});
