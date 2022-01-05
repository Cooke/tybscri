import assert from "assert";
import {
  FuncType,
  GenericObjectType,
  inferTypes,
  ObjectMember,
  TypeParameter,
} from "../src/typeSystem";
import {
  createLiteralType,
  createUnionType,
  deriveObjectType,
  getAllTypeMembers,
  inferTypeArguments,
  isTypeAssignableToType,
  reduceUnionType,
} from "../src/typeSystem/functions";
import {
  booleanType,
  neverType,
  nullType,
  numberType,
  objectType,
  stringType,
} from "../src/typeSystem/types";
import { listType } from "../src/typeSystem/listType";
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
      const typeParameter: TypeParameter = {
        kind: "TypeParameter",
        name: "T",
        variance: "out",
      };
      const myType: GenericObjectType = {
        name: "MyType",
        base: null,
        kind: "Object",
        members: [],
        typeArguments: [typeParameter],
        typeParameters: [typeParameter],
      };
      const ofString = deriveObjectType(myType, [stringType]);
      const ofObject = deriveObjectType(myType, [objectType]);
      assert.ok(isTypeAssignableToType(ofString, ofObject));
      assert.ok(!isTypeAssignableToType(ofObject, ofString));
    });

    it("invariance", function () {
      const typeParameter: TypeParameter = { kind: "TypeParameter", name: "T" };
      const myType: GenericObjectType = {
        name: "MyType",
        base: null,
        kind: "Object",
        members: [],
        typeArguments: [typeParameter],
        typeParameters: [typeParameter],
      };
      const ofString = deriveObjectType(myType, [stringType]);
      const ofObject = deriveObjectType(myType, [objectType]);
      assert.ok(!isTypeAssignableToType(ofString, ofObject));
      assert.ok(!isTypeAssignableToType(ofObject, ofString));
    });

    it("contravariance", function () {
      const typeParameter: TypeParameter = {
        kind: "TypeParameter",
        name: "T",
        variance: "in",
      };
      const myType: GenericObjectType = {
        name: "MyType",
        base: null,
        kind: "Object",
        members: [],
        typeArguments: [typeParameter],
        typeParameters: [typeParameter],
      };
      const ofString = deriveObjectType(myType, [stringType]);
      const ofObject = deriveObjectType(myType, [objectType]);
      assert.ok(!isTypeAssignableToType(ofString, ofObject));
      assert.ok(isTypeAssignableToType(ofObject, ofString));
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
          to: stringType,
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
          to: stringType,
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
          to: stringType,
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
          to: stringType,
        },
      ]);
    });

    it("infer type parameter from object type parameter", function () {
      const typeParameter: TypeParameter = {
        kind: "TypeParameter",
        name: "T",
      };
      const definition: GenericObjectType = {
        kind: "Object",
        base: null,
        name: "MyObject",
        members: [],
        typeArguments: [typeParameter],
        typeParameters: [typeParameter],
      };
      const typeParameter2: TypeParameter = {
        kind: "TypeParameter",
        name: "T",
      };
      const toType = deriveObjectType(definition, [typeParameter2]);
      const fromType = deriveObjectType(definition, [stringType]);
      const inferredTypes = inferTypes(toType, fromType);
      assert.deepEqual(inferredTypes, [
        {
          parameter: typeParameter2,
          to: stringType,
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

      const bindings = inferTypeArguments(memberFuncType.parameters, [
        stringType,
      ]);
      assert.deepEqual(bindings, [
        {
          parameter: typeParameter,
          to: stringType,
        },
      ]);
    });

    it("members of bound object should also be bound", function () {
      const stringList = deriveObjectType(listType, [stringType]);
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
