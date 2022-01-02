import { parseExpression } from "../src";
import { numberType, stringType } from "../src/types";
import { booleanType } from "../src/types/boolean";
import { assertTybscriType } from "./utils";

describe("Literals", function () {
  it("integer literal", function () {
    const parseResult = parseExpression("123");
    assertTybscriType(parseResult.tree.valueType, {
      kind: "Literal",
      value: 123,
      valueType: numberType,
    });
  });

  it("string literal", function () {
    const parseResult = parseExpression('"123"');
    assertTybscriType(parseResult.tree.valueType, {
      kind: "Literal",
      value: "123",
      valueType: stringType,
    });
  });

  it("true", function () {
    const parseResult = parseExpression("true");
    assertTybscriType(parseResult.tree.valueType, {
      kind: "Literal",
      value: true,
      valueType: booleanType,
    });
  });
});
