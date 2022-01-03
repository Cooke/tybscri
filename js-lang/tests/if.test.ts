import { parseScript } from "../src";
import { numberType } from "../src/types";
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
});
