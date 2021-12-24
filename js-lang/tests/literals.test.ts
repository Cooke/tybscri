import assert from "assert";
import { parseExpression } from "../src";
import { TypeNotFound } from "../src/nodes/base";
import { LiteralType, Type } from "../src/types/common";
import { numberType } from "../src/types/number";
import { stringType } from "../src/types/string";
import { assertHasType } from "./utils";

describe("Parse literals", function () {
  it("integer literal", function () {
    const parseResult = parseExpression("123");
    assertHasType(parseResult.tree.type);
    assert.equal(parseResult.tree.type.kind, "Literal");
    const literalType = parseResult.tree.type as LiteralType;
    assert.equal(literalType.valueType, numberType);
  });

  it("string literal", function () {
    const parseResult = parseExpression('"123"');
    assertHasType(parseResult.tree.type);
    assert.equal(parseResult.tree.type.kind, "Literal");
    const literalType = parseResult.tree.type as LiteralType;
    assert.equal(literalType.valueType, stringType);
  });
});
