import assert from "assert";
import {
  FuncType,
  GenericObjectType,
  inferTypes,
  ObjectMember,
  ObjectType,
  TypeParameter,
} from "../src/types";
import {
  bindObjectTypeParameters,
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
      const ofString = bindObjectTypeParameters(myType, [stringType]);
      const ofObject = bindObjectTypeParameters(myType, [objectType]);
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
      const ofString = bindObjectTypeParameters(myType, [stringType]);
      const ofObject = bindObjectTypeParameters(myType, [objectType]);
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
      const ofString = bindObjectTypeParameters(myType, [stringType]);
      const ofObject = bindObjectTypeParameters(myType, [objectType]);
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
      const toType = bindObjectTypeParameters(definition, [typeParameter2]);
      const fromType = bindObjectTypeParameters(definition, [stringType]);
      const inferredTypes = inferTypes(toType, fromType);
      assert.deepEqual(inferredTypes, [
        {
          parameter: typeParameter2,
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

    it("members of bound object should also be bound", function () {
      const stringList = bindObjectTypeParameters(listType, [stringType]);
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
