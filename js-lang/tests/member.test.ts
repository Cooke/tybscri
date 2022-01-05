import assert from "assert";
import {
  deriveObjectType,
  createLiteralType,
  createUnionType,
  getAllTypeMembers,
  getTypeDisplayName,
  objectTypeToString,
} from "../src/types/functions";
import { listType, numberType, stringType } from "../src/types/types";
import { parseExpression, printTree } from "../src";
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
