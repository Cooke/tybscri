import assert from "assert";
import {
  FuncType,
  inferTypes,
  ObjectMember,
  ObjectType,
  TypeParameter,
} from "../src/types";
import {
  createGenericType,
  createLiteralType,
  createUnionType,
  getAllTypeMembers,
  inferTypeArguments,
  isTypeAssignableToType,
  reduceUnionType,
} from "../src/types/functions";
import {
  booleanType,
  listType,
  neverType,
  nullType,
  numberType,
  objectType,
  stringType,
} from "../src/types/types";
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

    it("infer type parameter directly", function () {
      const typeParameter: TypeParameter = {
        kind: "TypeParameter",
        name: "T",
      };
      const inferredTypes = inferTypes(typeParameter, stringType);
      assert.deepEqual(inferredTypes, [
        {
          parameter: typeParameter,
          assignment: stringType,
        },
      ]);
    });

    it("infer type parameter from func return type", function () {
      const typeParameter: TypeParameter = {
        kind: "TypeParameter",
        name: "T",
      };
      const toType: FuncType = {
        kind: "Func",
        parameters: [],
        returnType: typeParameter,
      };
      const fromType: FuncType = {
        kind: "Func",
        parameters: [],
        returnType: stringType,
      };
      const inferredTypes = inferTypes(toType, fromType);
      assert.deepEqual(inferredTypes, [
        {
          parameter: typeParameter,
          assignment: stringType,
        },
      ]);
    });

    it("infer type parameter from func parameter", function () {
      const typeParameter: TypeParameter = {
        kind: "TypeParameter",
        name: "T",
      };
      const toType: FuncType = {
        kind: "Func",
        parameters: [{ name: "arg1", type: typeParameter }],
        returnType: nullType,
      };
      const fromType: FuncType = {
        kind: "Func",
        parameters: [{ name: "param", type: stringType }],
        returnType: nullType,
      };
      const inferredTypes = inferTypes(toType, fromType);
      assert.deepEqual(inferredTypes, [
        {
          parameter: typeParameter,
          assignment: stringType,
        },
      ]);
    });

    it("infer type parameter from func of func parameter", function () {
      const typeParameter: TypeParameter = {
        kind: "TypeParameter",
        name: "T",
      };
      const toType: FuncType = {
        kind: "Func",
        parameters: [
          {
            name: "arg1",
            type: {
              kind: "Func",
              parameters: [],
              returnType: typeParameter,
            },
          },
        ],
        returnType: nullType,
      };
      const fromType: FuncType = {
        kind: "Func",
        parameters: [
          {
            name: "param",
            type: {
              kind: "Func",
              parameters: [],
              returnType: stringType,
            },
          },
        ],
        returnType: nullType,
      };
      const inferredTypes = inferTypes(toType, fromType);
      assert.deepEqual(inferredTypes, [
        {
          parameter: typeParameter,
          assignment: stringType,
        },
      ]);
    });

    it("infer type parameter from object type parameter", function () {
      const typeParameter: TypeParameter = {
        kind: "TypeParameter",
        name: "T",
      };
      const toType: ObjectType = {
        kind: "Object",
        base: null,
        name: "MyObject",
        members: [],
        typeArguments: [typeParameter],
      };
      const fromType: ObjectType = {
        ...toType,
        typeArguments: [stringType],
      };
      const inferredTypes = inferTypes(toType, fromType);
      assert.deepEqual(inferredTypes, [
        {
          parameter: typeParameter,
          assignment: stringType,
        },
      ]);
    });

    it("infer member return type", function () {
      const typeParameter: TypeParameter = {
        kind: "TypeParameter",
        name: "T",
      };
      const memberFuncType: FuncType = {
        kind: "Func",
        parameters: [
          {
            name: "arg",
            type: typeParameter,
          },
        ],
        returnType: typeParameter,
      };
      const member: ObjectMember = {
        name: "member",
        isConst: false,
        typeParameters: [typeParameter],
        type: memberFuncType,
      };
      const typeAssignments = inferTypeArguments(memberFuncType.parameters, [
        stringType,
      ]);
      assert.deepEqual(typeAssignments, [
        {
          parameter: typeParameter,
          assignment: stringType,
        },
      ]);
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
