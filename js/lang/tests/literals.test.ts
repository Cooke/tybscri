import { createLiteralType, parseExpression } from "../src";
import { Environment } from "../src/common";
import { Scope } from "../src/scope";
import { ExternalSymbol } from "../src/symbols";
import {
  FuncType,
  listDefinitionType,
  numberType,
  stringType,
  trueType,
  UnionType,
} from "../src/typeSystem";
import { assertTybscriType } from "./utils";

describe("Literals", function () {
  it("integer literal", function () {
    const parseResult = parseExpression("123");
    assertTybscriType(parseResult.tree.valueType, createLiteralType(123));
  });

  it("string literal", function () {
    const parseResult = parseExpression('"123"');
    assertTybscriType(parseResult.tree.valueType, createLiteralType("123"));
  });

  it("true", function () {
    const parseResult = parseExpression("true");
    assertTybscriType(parseResult.tree.valueType, createLiteralType(true));
  });

  it("collection", function () {
    const parseResult = parseExpression('[true, 123, "321"]');
    const expected = listDefinitionType.createType([
      UnionType.create([
        trueType,
        createLiteralType(123),
        createLiteralType("321"),
      ]),
    ]);
    assertTybscriType(parseResult.tree.valueType, expected);
  });

  it("lambda", function () {
    const expectedType = new FuncType(
      [
        {
          name: "str",
          type: stringType,
        },
      ],
      numberType
    );
    const parseResult = parseExpression("{ it.length }", { expectedType });
    assertTybscriType(parseResult.tree.valueType, expectedType);
  });

  it("trailing lambda with parathesis", function () {
    const stringListType = listDefinitionType.createType([stringType]);
    const numberListType = listDefinitionType.createType([numberType]);
    const env: Environment = {
      symbols: [{ name: "list", type: stringListType }],
    };
    const parseResult = parseExpression("list.map() { it.length }", {
      envrionment: env,
    });
    assertTybscriType(parseResult.tree.valueType, numberListType);
  });

  it("trailing lambda without parathesis", function () {
    const stringListType = listDefinitionType.createType([stringType]);
    const numberListType = listDefinitionType.createType([numberType]);
    const env: Environment = {
      symbols: [{ name: "list", type: stringListType }],
    };
    const parseResult = parseExpression("list.map { it.length }", {
      envrionment: env,
    });
    assertTybscriType(parseResult.tree.valueType, numberListType);
  });
});
