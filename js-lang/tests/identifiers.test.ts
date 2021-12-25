import { parseExpression } from "../src";
import { Scope } from "../src/common";
import { stringType } from "../src/types/string";
import { assertType, assertUnknownType } from "./utils";

describe("Identifiers", function () {
  it("undetermined identifier type", function () {
    const parseResult = parseExpression("data");
    assertUnknownType(parseResult.tree.type);
  });

  it("identifier type", function () {
    const scope = new Scope({
      data: { valueType: stringType },
    });
    const parseResult = parseExpression("data", { symbols: scope });
    assertType(parseResult.tree.type, stringType);
  });
});
