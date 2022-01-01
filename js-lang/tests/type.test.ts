import { reduceUnionType, UnionType } from "../src/types/common";
import { neverType } from "../src/types/never";
import { stringType } from "../src/types/string";
import { assertTybscriType } from "./utils";
import { createLiteralType, createUnionType } from "../src/types/utils";
import { numberType } from "../src/types/number";

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
  });
});
