import { parseExpression } from "../src";
import { booleanType } from "../src/typeSystem/types";
import { assertTybscriType } from "./utils";

describe("Operators", function () {
  it("equals", function () {
    const result = parseExpression(`1 == 2`);
    assertTybscriType(result.tree.valueType, booleanType);
  });
});
