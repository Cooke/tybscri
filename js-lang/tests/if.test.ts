import { parseScript } from "../src";
import { booleanType } from "../src/types/boolean";
import { nullType } from "../src/types/null";
import { numberType } from "../src/types/number";
import { stringType } from "../src/types/string";
import { assertTybscriType } from "./utils";

describe("If", function () {
  it("inferred type", function () {
    const parseResult = parseScript(`
      if (true) {
        123
      } else {
        456
      }
    `);
    const valNode = parseResult.tree.statements[0];
    assertTybscriType(valNode.valueType, {
      kind: "Union",
      types: [
        {
          kind: "Literal",
          value: 123,
          valueType: numberType,
        },
        {
          kind: "Literal",
          value: 456,
          valueType: numberType,
        },
      ],
    });
  });

  it("narrow type in branch", function () {
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
    assertTybscriType(valNode.valueType, {
      kind: "Union",
      types: [
        {
          kind: "Literal",
          value: true,
          valueType: booleanType,
        },
        nullType,
      ],
    });
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
    assertTybscriType(valNode.valueType, {
      kind: "Union",
      types: [
        {
          kind: "Literal",
          value: "1",
          valueType: stringType,
        },
        nullType,
      ],
    });
  });
});
