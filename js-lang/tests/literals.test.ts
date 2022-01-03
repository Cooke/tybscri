import {
  createGenericType,
  createLiteralType,
  createUnionType,
  parseExpression,
} from "../src";
import { ExternalSymbol, Scope } from "../src/common";
import {
  booleanType,
  FuncType,
  listType,
  nullType,
  numberType,
  stringType,
  trueType,
} from "../src/types";
import { assertTybscriType } from "./utils";

describe("Literals", function () {
  it("integer literal", function () {
    const parseResult = parseExpression("123");
    assertTybscriType(parseResult.tree.valueType, {
      kind: "Literal",
      value: 123,
      valueType: numberType,
    });
  });

  it("string literal", function () {
    const parseResult = parseExpression('"123"');
    assertTybscriType(parseResult.tree.valueType, {
      kind: "Literal",
      value: "123",
      valueType: stringType,
    });
  });

  it("true", function () {
    const parseResult = parseExpression("true");
    assertTybscriType(parseResult.tree.valueType, {
      kind: "Literal",
      value: true,
      valueType: booleanType,
    });
  });

  it("collection", function () {
    const parseResult = parseExpression('[true, 123, "321"]');
    assertTybscriType(
      parseResult.tree.valueType,
      createGenericType(listType, [
        createUnionType(
          trueType,
          createLiteralType(123),
          createLiteralType("321")
        ),
      ])
    );
  });

  it("lambda", function () {
    const expectedType: FuncType = {
      kind: "Func",
      parameters: [
        {
          name: "str",
          type: stringType,
        },
      ],
      returnType: numberType,
    };
    const parseResult = parseExpression("{ it.length }", {}, expectedType);
    assertTybscriType(parseResult.tree.valueType, expectedType);
  });

  it("trailing lambda with parathesis", function () {
    const stringListType = createGenericType(listType, [stringType]);
    const numberListType = createGenericType(listType, [numberType]);
    const scope = new Scope(null, [new ExternalSymbol("list", stringListType)]);
    const parseResult = parseExpression("list.map() { it.length }", {
      scope,
    });
    assertTybscriType(parseResult.tree.valueType, numberListType);
  });

  it("trailing lambda without parathesis", function () {
    const stringListType = createGenericType(listType, [stringType]);
    const numberListType = createGenericType(listType, [numberType]);
    const scope = new Scope(null, [new ExternalSymbol("list", stringListType)]);
    const parseResult = parseExpression("list.map { it.length }", { scope });
    assertTybscriType(parseResult.tree.valueType, numberListType);
  });
});
