import { numberType, stringType } from "../src/types";
import { reduceUnionType } from "../src/types/common";
import { neverType } from "../src/types/never";
import { createLiteralType, createUnionType } from "../src/types/utils";
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
});
