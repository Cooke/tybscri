import assert from "assert";
import {
  bindGenericObjectType,
  createUnionType,
  parseExpression,
} from "../src";
import { createLiteralType } from "../src/typeSystem/core";
import { numberType, stringType } from "../src/typeSystem/types";
import { listType } from "../src/typeSystem/listType";
import { assertTybscriType } from "./utils";

describe("Member", function () {
  describe("union members", function () {
    it("common members", function () {
      const union = createUnionType(createLiteralType(1), createLiteralType(1));
      const unionMembers = union.members;
      const numberMembers = numberType.members;
      assert.deepEqual(unionMembers, numberMembers);
    });
  });

  describe("inferred return type", function () {
    it("from map", function () {
      const result = parseExpression(`[1, 2].map { it.toString() }`);
      assertTybscriType(
        result.tree.valueType,
        bindGenericObjectType(listType, [stringType])
      );
    });

    it("from map of map", function () {
      const result = parseExpression(
        `[1, 2].map { it.toString() }.map { it.length }`
      );
      assertTybscriType(
        result.tree.valueType,
        bindGenericObjectType(listType, [numberType])
      );
    });
  });
});
