import { GenericObjectDefinition } from ".";
import {
  GenericTypeParameter,
  // GenericObjectDefinition,
  LiteralType,
  NeverType,
  ObjectType,
  UnknownType,
} from "./TypescriptTypes";

export const objectType = {} as ObjectType;
export const numberType = {} as ObjectType;
export const stringType = {} as ObjectType;
export const listType = {} as GenericObjectDefinition;

export const unknownType: UnknownType = {
  kind: "Unknown",
};

export const neverType: NeverType = {
  kind: "Never",
};
export const nullType: ObjectType = {
  kind: "Object",
  base: null,
  members: [],
  name: "null",
};

export const booleanType: ObjectType = {
  kind: "Object",
  base: null,
  members: [],
  name: "boolean",
};

export const trueType: LiteralType = {
  kind: "Literal",
  value: true,
  valueType: booleanType,
};

export const falseType: LiteralType = {
  kind: "Literal",
  value: true,
  valueType: booleanType,
};

assign(objectType, {
  kind: "Object",
  name: "object",
  base: null,
  members: [
    {
      isConst: true,
      name: "toString",
      type: {
        kind: "Func",
        parameters: [],
        returnType: stringType,
      },
    },
  ],
});

assign(numberType, {
  kind: "Object",
  name: "number",
  base: objectType,
  members: [],
});

assign(stringType, {
  kind: "Object",
  name: "string",
  base: objectType,
  members: [{ isConst: true, name: "length", type: numberType }],
});

const listItemTypeParameter: GenericTypeParameter = {
  kind: "GenericParameter",
  name: "T",
};
const listMapReturnTypeParameter: GenericTypeParameter = {
  kind: "GenericParameter",
  name: "T",
};

const listMapReturnType = {} as ObjectType;
const listObjectType = {} as ObjectType;

assign(listType, {
  kind: "GenericObjectDefinition",
  typeParameters: [listItemTypeParameter],
  objectType: listObjectType,
});

assign(listObjectType, {
  kind: "Object",
  name: "List",
  base: objectType,
  typeArguments: [listItemTypeParameter],
  members: [
    {
      name: "length",
      isConst: true,
      type: numberType,
    },
    {
      name: "filter",
      isConst: true,
      type: {
        kind: "Func",
        parameters: [
          {
            name: "predicate",
            type: {
              kind: "Func",
              parameters: [{ name: "item", type: listItemTypeParameter }],
              returnType: booleanType,
            },
          },
        ],
        returnType: listObjectType,
      },
    },
    {
      name: "map",
      isConst: true,
      typeParameters: [listMapReturnTypeParameter],
      type: {
        kind: "Func",
        parameters: [
          {
            name: "mapper",
            type: {
              kind: "Func",
              parameters: [{ name: "item", type: listItemTypeParameter }],
              returnType: listMapReturnTypeParameter,
            },
          },
        ],
        returnType: listMapReturnType,
      },
    },
  ],
});

assign(listMapReturnType, {
  ...listType.objectType,
  typeArguments: [listMapReturnTypeParameter],
});

function assign<T>(type: T, value: T) {
  Object.assign(type, value);
}
