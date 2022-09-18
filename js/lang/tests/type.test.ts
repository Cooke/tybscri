import assert from "assert";
import {
  bindGenericObjectType,
  FuncParameter,
  FuncType,
  GenericObjectType,
  inferTypes,
  Member,
  Type,
  TypeParameter,
  UnionType,
} from "../src/typeSystem";
import { createLiteralType, inferTypeArguments } from "../src/typeSystem/core";
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

function createUnionType(...types: Type[]) {
  return UnionType.create(types);
}

describe("Types", function () {
  describe("reduce union", function () {
    it("reduce never", function () {
      const union = createUnionType(stringType, neverType);
      assertTybscriType(union, stringType);
    });

    it("reduce literal", function () {
      const union = createUnionType(createLiteralType("123"), stringType);
      assertTybscriType(union, stringType);
    });

    it("reduce nothing", function () {
      const union = createUnionType(numberType, stringType);
      assertTybscriType(union, union);
    });

    it("reduce same", function () {
      const union = createUnionType(
        numberType,
        stringType,
        numberType,
        stringType
      );
      assertTybscriType(union, createUnionType(numberType, stringType));
    });

    it("reduce literal types", function () {
      const union = createUnionType(
        createLiteralType(1),
        createLiteralType(2),
        createLiteralType(3),
        numberType
      );
      assertTybscriType(union, numberType);
    });

    it("reduce nested unions", function () {
      const union = createUnionType(
        createLiteralType("123"),
        createUnionType(createLiteralType(123), stringType)
      );
      assertTybscriType(
        union,
        createUnionType(stringType, createLiteralType(123))
      );
    });
  });

  describe("hierarchy", function () {
    it("string assignable to object", function () {
      assert.ok(objectType.isAssignableFrom(stringType));
    });
  });

  describe("generics", function () {
    it("covariance", function () {
      const typeParameter: TypeParameter = new TypeParameter("T", "out");
      const myType: GenericObjectType = new GenericObjectType(
        "MyType",
        null,
        () => [],
        [typeParameter],
        [typeParameter]
      );
      const ofString = bindGenericObjectType(myType, [stringType]);
      const ofObject = bindGenericObjectType(myType, [objectType]);
      assert.ok(ofObject.isAssignableFrom(ofString));
      assert.ok(!ofString.isAssignableFrom(ofObject));
    });

    it("invariance", function () {
      const typeParameter: TypeParameter = new TypeParameter("T");
      const myType: GenericObjectType = new GenericObjectType(
        "MyType",
        null,
        () => [],
        [typeParameter],
        [typeParameter]
      );
      const ofString = bindGenericObjectType(myType, [stringType]);
      const ofObject = bindGenericObjectType(myType, [objectType]);
      assert.ok(!isTypeAssignableToType(ofString, ofObject));
      assert.ok(!isTypeAssignableToType(ofObject, ofString));
    });

    it("contravariance", function () {
      const typeParameter: TypeParameter = new TypeParameter("T", "in");
      const myType: GenericObjectType = new GenericObjectType(
        "MyType",
        null,
        () => [],
        [typeParameter],
        [typeParameter]
      );
      const ofString = bindGenericObjectType(myType, [stringType]);
      const ofObject = bindGenericObjectType(myType, [objectType]);
      assert.ok(!isTypeAssignableToType(ofString, ofObject));
      assert.ok(isTypeAssignableToType(ofObject, ofString));
    });

    it("infer type parameter directly", function () {
      const typeParameter: TypeParameter = new TypeParameter("T");
      const inferredTypes = inferTypes(typeParameter, stringType);
      assert.deepEqual(inferredTypes, [
        {
          parameter: typeParameter,
          to: stringType,
        },
      ]);
    });

    it("infer type parameter from func return type", function () {
      const typeParameter: TypeParameter = new TypeParameter("T");
      const toType: FuncType = new FuncType([], typeParameter);
      const fromType: FuncType = new FuncType([], stringType);
      const inferredTypes = inferTypes(toType, fromType);
      assert.deepEqual(inferredTypes, [
        {
          parameter: typeParameter,
          to: stringType,
        },
      ]);
    });

    it("infer type parameter from func parameter", function () {
      const typeParameter: TypeParameter = new TypeParameter("T");
      const toType: FuncType = new FuncType(
        [new FuncParameter("arg1", typeParameter)],
        nullType
      );
      const fromType: FuncType = new FuncType(
        [new FuncParameter("param", stringType)],
        nullType
      );
      const inferredTypes = inferTypes(toType, fromType);
      assert.deepEqual(inferredTypes, [
        {
          parameter: typeParameter,
          to: stringType,
        },
      ]);
    });

    it("infer type parameter from func of func parameter", function () {
      const typeParameter: TypeParameter = new TypeParameter("T");
      const toType: FuncType = new FuncType(
        [new FuncParameter("arg1", new FuncType([], typeParameter))],
        nullType
      );
      const fromType: FuncType = new FuncType(
        [new FuncParameter("param", new FuncType([], stringType))],
        nullType
      );
      const inferredTypes = inferTypes(toType, fromType);
      assert.deepEqual(inferredTypes, [
        {
          parameter: typeParameter,
          to: stringType,
        },
      ]);
    });

    it("infer type parameter from object type parameter", function () {
      const typeParameter: TypeParameter = new TypeParameter("T");
      const definition: GenericObjectType = new GenericObjectType(
        "MyObject",
        null,
        () => [],
        [typeParameter],
        [typeParameter]
      );
      const typeParameter2: TypeParameter = new TypeParameter("T");
      const toType = bindGenericObjectType(definition, [typeParameter2]);
      const fromType = bindGenericObjectType(definition, [stringType]);
      const inferredTypes = inferTypes(toType, fromType);
      assert.deepEqual(inferredTypes, [
        {
          parameter: typeParameter2,
          to: stringType,
        },
      ]);
    });

    it("infer member return type", function () {
      const typeParameter: TypeParameter = new TypeParameter("T");
      const memberFuncType: FuncType = new FuncType(
        [new FuncParameter("arg", typeParameter)],
        typeParameter
      );

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
      const stringList = bindGenericObjectType(listType, [stringType]);
      const filterMember = stringList.members.find((x) => x.name === "filter");
      assert.ok(filterMember);
      assertTybscriType(
        filterMember.type,
        new FuncType(
          [
            new FuncParameter(
              "predicate",
              new FuncType([new FuncParameter("item", stringType)], booleanType)
            ),
          ],
          stringList
        )
      );
    });
  });
});

function isTypeAssignableToType(
  from: GenericObjectType,
  to: GenericObjectType
) {
  return to.isAssignableFrom(from);
}
