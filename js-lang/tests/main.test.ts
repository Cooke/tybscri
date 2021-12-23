import assert from "assert";
import { parseExpression } from "../src";
import { LiteralType } from "../src/types/common";
import { numberType } from "../src/types/number";

describe("Parse literals", function () {
  it("integer literal", function () {
    const parseResult = parseExpression("123");
    assert.ok(parseResult.tree.type);
    assert.equal(parseResult.tree.type.kind, "Literal");
    const literalType = parseResult.tree.type as LiteralType;
    assert.equal(literalType.valueType, numberType.name);
  });
});
