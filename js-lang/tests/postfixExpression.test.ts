import assert from "assert";
import { parseExpression } from "../src";
import { MemberNode } from "../src/nodes/member";
import { assertType } from "./utils";

describe("Postfix expressions", function () {
  it("member access", function () {
    const parseResult = parseExpression("data.prop1");
    const node = parseResult.tree;
    assertType(node, MemberNode);
    assert.equal(node.memberName, "prop1");
  });
});
