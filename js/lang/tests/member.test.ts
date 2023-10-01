import assert from "assert";
import { createUnionType, parseExpression } from "../src";
import { listDefinitionType } from "../src/defaultEnvironment/listType";
import { numberType, stringType } from "../src/typeSystem/types";
import { createLiteralType } from "../src/typeSystem/utils";
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
        listDefinitionType.createType([stringType])
      );
    });

    it("from map of map", function () {
      const result = parseExpression(
        `[1, 2].map { it.toString() }.map { it.length }`
      );
      assertTybscriType(
        result.tree.valueType,
        listDefinitionType.createType([numberType])
      );
    });
  });
});
