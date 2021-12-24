import { parseExpression } from "../src";
import { Scope } from "../src/common";
import { stringType } from "../src/types/string";
import { assertType, assertUnknownType } from "./utils";

describe("Identifiers", function () {
  it("undetermined identifier type", function () {
    const parseResult = parseExpression("data");
    // console.log(parseResult.tree.type);
    assertUnknownType(parseResult.tree.type);
  });

  it("identifier type", function () {
    const scope = new Scope({
      data: { valueType: stringType },
    });
    const parseResult = parseExpression("data", scope);
    assertType(parseResult.tree.type, stringType);
  });
});
