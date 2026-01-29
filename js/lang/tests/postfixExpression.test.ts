import assert from "assert";
import { parseExpression } from "../src";
import { MemberAccessNode } from "../src/nodes/memberAccess";
import { assertType } from "./utils";

describe("Postfix expressions", function () {
  it("member access", function () {
    const parseResult = parseExpression("data.prop1");
    const node = parseResult.tree;
    assertType(node, MemberAccessNode);
    assert.equal(node.member.text, "prop1");
  });
});
