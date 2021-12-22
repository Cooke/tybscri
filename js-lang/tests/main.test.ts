import assert from "assert";
import { analyzeExpression, parseExpression } from "../src";

describe("Analyze expressions", function () {
  it("integer constant", function () {
    const parseResult = parseExpression('"123"');
    assert.equal(parseResult.syntaxTree.type, "constant");
  });
});
