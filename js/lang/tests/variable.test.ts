import { parseScript } from "../src";
import { createLiteralType, numberType, stringType } from "../src/typeSystem";
import { assertTybscriType } from "./utils";

describe("Variables", function () {
  it("inferred val type", function () {
    const parseResult = parseScript(`
      val foo = "bar";
    `);
    const valNode = parseResult.tree.statements[0];
    assertTybscriType(valNode.valueType, createLiteralType("bar"));
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
    assertTybscriType(valNode.valueType, createLiteralType(321));
  });
});
