import assert from "assert";
import { parseExpression } from "../src";
import { LiteralType } from "../src/types/common";
import { numberType } from "../src/types/number";
import { booleanType } from "../src/types/boolean";
import { stringType } from "../src/types/string";
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
