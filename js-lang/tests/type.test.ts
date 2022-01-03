import assert from "assert";
import {
  booleanType,
  listType,
  neverType,
  numberType,
  objectType,
  stringType,
} from "../src/types/types";
import {
  createGenericType,
  createLiteralType,
  createUnionType,
  getAllTypeMembers,
  isTypeAssignableToType,
  reduceUnionType,
} from "../src/types/functions";
import { assertTybscriType } from "./utils";

describe("Types", function () {
  describe("reduce union", function () {
    it("reduce never", function () {
      const union = createUnionType(stringType, neverType);
      const reduced = reduceUnionType(union);
      assertTybscriType(reduced, stringType);
    });

    it("reduce literal", function () {
      const union = createUnionType(createLiteralType("123"), stringType);
      const reduced = reduceUnionType(union);
      assertTybscriType(reduced, stringType);
    });

    it("reduce nothing", function () {
      const union = createUnionType(numberType, stringType);
      const reduced = reduceUnionType(union);
      assertTybscriType(reduced, union);
    });

    it("reduce same", function () {
      const union = createUnionType(
        numberType,
        stringType,
        numberType,
        stringType
      );
      const reduced = reduceUnionType(union);
      assertTybscriType(reduced, createUnionType(numberType, stringType));
    });

    it("reduce literal types", function () {
      const union = createUnionType(
        createLiteralType(1),
        createLiteralType(2),
        createLiteralType(3),
        numberType
      );
      const reduced = reduceUnionType(union);
      assertTybscriType(reduced, numberType);
    });

    it("reduce nested unions", function () {
      const union = createUnionType(
        createLiteralType("123"),
        createUnionType(createLiteralType(123), stringType)
      );
      const reduced = reduceUnionType(union);
      assertTybscriType(
        reduced,
        createUnionType(stringType, createLiteralType(123))
      );
    });
  });

  describe("hierarchy", function () {
    it("string assignable to object", function () {
      assert.ok(isTypeAssignableToType(stringType, objectType));
    });
  });

  describe("generics", function () {
    it("covariance", function () {
      const stringList = createGenericType(listType, [stringType]);
      const objectList = createGenericType(listType, [objectType]);
      assert.ok(isTypeAssignableToType(stringList, objectList));
    });

    it("substitute type parameters", function () {
      const stringList = createGenericType(listType, [stringType]);
      const filterMember = getAllTypeMembers(stringList).find(
        (x) => x.name === "filter"
      );
      assert.ok(filterMember);
      assertTybscriType(filterMember.type, {
        kind: "Func",
        parameters: [
          {
            name: "predicate",
            type: {
              kind: "Func",
              parameters: [
                {
                  name: "item",
                  type: stringType,
                },
              ],
              returnType: booleanType,
            },
          },
        ],
        returnType: stringList,
      });
    });
  });
});
