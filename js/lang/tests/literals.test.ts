import { createLiteralType, parseExpression } from "../src";
import { Environment } from "../src/common";
import { defaultEnvironment } from "../src/defaultEnvironment";
import {
  FuncType,
  UnionType,
  VoidType,
  listDefinitionType,
  numberType,
  stringType,
  trueType,
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

  it("void lambda ignore implicit return", function () {
    const expectedType = new FuncType(
      [
        {
          name: "str",
          type: stringType,
        },
      ],
      VoidType.instance
    );
    const parseResult = parseExpression("{ it.length }", { expectedType });
    assertTybscriType(parseResult.tree.valueType, expectedType);
  });

  it("trailing lambda with parathesis", function () {
    const stringListType = listDefinitionType.createType([stringType]);
    const numberListType = listDefinitionType.createType([numberType]);
    const env: Environment = {
      ...defaultEnvironment,
      symbols: [{ name: "list", type: stringListType }],
    };
    const parseResult = parseExpression("list.map() { it.length }", {
      environment: env,
    });
    assertTybscriType(parseResult.tree.valueType, numberListType);
  });

  it("trailing lambda without parathesis", function () {
    const stringListType = listDefinitionType.createType([stringType]);
    const numberListType = listDefinitionType.createType([numberType]);
    const env: Environment = {
      ...defaultEnvironment,
      symbols: [{ name: "list", type: stringListType }],
    };
    const parseResult = parseExpression("list.map { it.length }", {
      environment: env,
    });
    assertTybscriType(parseResult.tree.valueType, numberListType);
  });
});
