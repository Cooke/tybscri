import assert from "assert";
import { listDefinitionType } from "../src/defaultEnvironment/listType";
import {
  createLiteralType,
  FuncParameter,
  FuncType,
  inferTypeArguments,
  inferTypes,
  ObjectDefinitionType,
  ObjectType,
  Type,
  TypeParameter,
  UnionType,
} from "../src/typeSystem";
import { AnyType } from "../src/typeSystem/AnyType";
import {
  anyType,
  booleanType,
  neverType,
  nullType,
  numberType,
  stringType,
} from "../src/typeSystem/types";
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

    it("reduce any", function () {
      const union = createUnionType(stringType, anyType, nullType);
      assertTybscriType(union, anyType);
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

  const baseDefType = new ObjectDefinitionType("Base", null, [], () => []);
  const baseType = baseDefType.createType();

  const derivedDefType = new ObjectDefinitionType(
    "Derived",
    baseType,
    [],
    () => []
  );
  const derivedType = derivedDefType.createType();

  describe("hierarchy", function () {
    it("string assignable to object", function () {
      assert.ok(baseType.isAssignableFrom(derivedType));
    });
  });

  describe("generics", function () {
    it("covariance", function () {
      const typeParameter: TypeParameter = new TypeParameter("T", "out");
      const myType = new ObjectDefinitionType(
        "MyType",
        null,
        [typeParameter],
        () => []
      );
      const ofDerived = myType.createType([derivedType]);
      const ofBase = myType.createType([baseType]);
      assert.ok(ofBase.isAssignableFrom(ofDerived));
      assert.ok(!ofDerived.isAssignableFrom(ofBase));
    });

    it("invariance", function () {
      const typeParameter: TypeParameter = new TypeParameter("T");
      const myType = new ObjectDefinitionType(
        "MyType",
        null,
        [typeParameter],
        () => []
      );
      const ofDerived = myType.createType([derivedType]);
      const ofBase = myType.createType([baseType]);
      assert.ok(!isTypeAssignableToType(ofDerived, ofBase));
      assert.ok(!isTypeAssignableToType(ofBase, ofDerived));
    });

    it("contravariance", function () {
      const typeParameter: TypeParameter = new TypeParameter("T", "in");
      const myType = new ObjectDefinitionType(
        "MyType",
        null,
        [typeParameter],
        () => []
      );
      const ofDerived = myType.createType([derivedType]);
      const ofBase = myType.createType([baseType]);
      assert.ok(!isTypeAssignableToType(ofDerived, ofBase));
      assert.ok(isTypeAssignableToType(ofBase, ofDerived));
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
      const definition = new ObjectDefinitionType(
        "MyObject",
        null,
        [typeParameter],
        () => []
      );
      const typeParameter2: TypeParameter = new TypeParameter("T");
      const toType = definition.createType([typeParameter2]);
      const fromType = definition.createType([stringType]);
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
      const stringList = listDefinitionType.createType([stringType]);
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

function isTypeAssignableToType(from: ObjectType, to: ObjectType) {
  return to.isAssignableFrom(from);
}
