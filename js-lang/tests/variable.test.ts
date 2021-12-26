import { DiagnosticMessage, parseScript } from "../src";
import { numberType } from "../src/types/number";
import { stringType } from "../src/types/string";
import { assertTybscriType } from "./utils";

describe("Variables", function () {
  it("inferred val type", function () {
    const parseResult = parseScript(`
      val foo = "bar";
    `);
    const valNode = parseResult.tree.statements[0];
    assertTybscriType(valNode.valueType, {
      kind: "Literal",
      value: "bar",
      valueType: stringType,
    });
  });

  it("inferred var type", function () {
    const parseResult = parseScript(`
      var foo = "bar";
    `);
    const valNode = parseResult.tree.statements[0];
    assertTybscriType(valNode.valueType, stringType);
  });

  it("inferred type from not yet defined function", function () {
    const parseResult = parseScript(
      `
      val foo = bar()

      fun bar() {
        321
      }
    `
    );
    const valNode = parseResult.tree.statements[0];
    assertTybscriType(valNode.valueType, {
      kind: "Literal",
      value: 321,
      valueType: numberType,
    });
  });
});
