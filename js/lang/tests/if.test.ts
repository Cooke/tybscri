import { parseScript } from "../src";
import { createLiteralType, numberType, UnionType } from "../src/typeSystem";
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
    assertTybscriType(
      valNode.valueType,
      UnionType.create([createLiteralType(123), createLiteralType(456)])
    );
  });
});
