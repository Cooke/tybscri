import { parseExpression } from "../src";
import { booleanType, numberType } from "../src/typeSystem/types";
import { assertNoErrors, assertTybscriType } from "./utils";

describe("Operators", function () {
  describe("comparison operators", function () {
    it("equals", function () {
      const result = parseExpression(`1 == 2`);
      assertTybscriType(result.tree.valueType, booleanType);
      assertNoErrors(result);
    });

    it("not equals", function () {
      const result = parseExpression(`1 != 2`);
      assertTybscriType(result.tree.valueType, booleanType);
      assertNoErrors(result);
    });

    it("less than", function () {
      const result = parseExpression(`1 < 2`);
      assertTybscriType(result.tree.valueType, booleanType);
      assertNoErrors(result);
    });

    it("greater than", function () {
      const result = parseExpression(`5 > 3`);
      assertTybscriType(result.tree.valueType, booleanType);
      assertNoErrors(result);
    });

    it("less than or equal", function () {
      const result = parseExpression(`1 <= 1`);
      assertTybscriType(result.tree.valueType, booleanType);
      assertNoErrors(result);
    });

    it("greater than or equal", function () {
      const result = parseExpression(`2 >= 2`);
      assertTybscriType(result.tree.valueType, booleanType);
      assertNoErrors(result);
    });
  });

  describe("logical operators", function () {
    it("logical and", function () {
      const result = parseExpression(`true && false`);
      assertTybscriType(result.tree.valueType, booleanType);
      assertNoErrors(result);
    });

    it("logical or", function () {
      const result = parseExpression(`true || false`);
      assertTybscriType(result.tree.valueType, booleanType);
      assertNoErrors(result);
    });
  });

  describe("arithmetic operators", function () {
    it("addition", function () {
      const result = parseExpression(`1 + 2`);
      assertTybscriType(result.tree.valueType, numberType);
      assertNoErrors(result);
    });

    it("subtraction", function () {
      const result = parseExpression(`10 - 5`);
      assertTybscriType(result.tree.valueType, numberType);
      assertNoErrors(result);
    });

    it("multiplication", function () {
      const result = parseExpression(`3 * 4`);
      assertTybscriType(result.tree.valueType, numberType);
      assertNoErrors(result);
    });

    it("division", function () {
      const result = parseExpression(`10 / 2`);
      assertTybscriType(result.tree.valueType, numberType);
      assertNoErrors(result);
    });

    it("modulo", function () {
      const result = parseExpression(`10 % 3`);
      assertTybscriType(result.tree.valueType, numberType);
      assertNoErrors(result);
    });
  });

  describe("operator precedence", function () {
    it("multiplication before addition", function () {
      const result = parseExpression(`1 + 2 * 3`);
      assertTybscriType(result.tree.valueType, numberType);
      assertNoErrors(result);
    });

    it("comparison returns boolean", function () {
      const result = parseExpression(`1 + 2 < 3 * 4`);
      assertTybscriType(result.tree.valueType, booleanType);
      assertNoErrors(result);
    });

    it("logical operators with comparisons", function () {
      const result = parseExpression(`1 < 2 && 3 > 2`);
      assertTybscriType(result.tree.valueType, booleanType);
      assertNoErrors(result);
    });
  });
});
