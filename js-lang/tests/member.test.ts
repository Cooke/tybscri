import assert from "assert";
import { parseExpression } from "../src";
import {
  createLiteralType,
  createUnionType,
  deriveObjectType,
  getAllTypeMembers,
} from "../src/typeSystem/functions";
import { numberType, stringType } from "../src/typeSystem/types";
import { listType } from "../src/typeSystem/listType";
import { assertTybscriType } from "./utils";

describe("Member", function () {
  describe("union members", function () {
    it("common members", function () {
      const union = createUnionType(createLiteralType(1), createLiteralType(1));
      const unionMembers = getAllTypeMembers(union);
      const numberMembers = getAllTypeMembers(numberType);
      assert.deepEqual(unionMembers, numberMembers);
    });
  });

  describe("inferred return type", function () {
    it("from map", function () {
      const result = parseExpression(`[1, 2].map { it.toString() }`);
      assertTybscriType(
        result.tree.valueType,
        deriveObjectType(listType, [stringType])
      );
    });

    it("from map of map", function () {
      const result = parseExpression(
        `[1, 2].map { it.toString() }.map { it.length }`
      );
      assertTybscriType(
        result.tree.valueType,
        deriveObjectType(listType, [numberType])
      );
    });
  });
});
