import { GenericObjectType } from ".";
import { deriveObjectType } from "./genericFunctions";
import {
  TypeParameter,
  LiteralType,
  NeverType,
  ObjectType,
  UnknownType,
} from "./TypescriptTypes";

export const objectType = {} as ObjectType;
export const numberType = {} as ObjectType;
export const stringType = {} as ObjectType;
export const listType = {} as GenericObjectType;

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

const itemType: TypeParameter = {
  kind: "TypeParameter",
  name: "TItem",
};

const resultType: TypeParameter = {
  kind: "TypeParameter",
  name: "TResult",
};

const listOfResultType = {} as ObjectType;
const listOfItemType = {} as ObjectType;

assign(listType, {
  kind: "Object",
  name: "List",
  base: objectType,
  typeArguments: [itemType],
  typeParameters: [itemType],
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
              parameters: [{ name: "item", type: itemType }],
              returnType: booleanType,
            },
          },
        ],
        returnType: listOfItemType,
      },
    },
    {
      name: "map",
      isConst: true,
      typeParameters: [resultType],
      type: {
        kind: "Func",
        parameters: [
          {
            name: "mapper",
            type: {
              kind: "Func",
              parameters: [{ name: "item", type: itemType }],
              returnType: resultType,
            },
          },
        ],
        returnType: listOfResultType,
      },
    },
  ],
});

assign(
  listOfItemType,
  deriveObjectType(listType, [itemType])
);
assign(
  listOfResultType,
  deriveObjectType(listType, [resultType])
);

function assign<T>(type: T, value: T) {
  Object.assign(type, value);
}
