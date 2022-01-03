import {
  GenericTypeParameter,
  GenericTypeDefinition,
  LiteralType,
  NeverType,
  ObjectType,
  UnknownType,
} from "./TypescriptTypes";

export const objectType = {} as ObjectType;
export const numberType = {} as ObjectType;
export const stringType = {} as ObjectType;
export const listType = {} as GenericTypeDefinition;

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
      kind: "StandardMember",
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
  members: [
    { kind: "StandardMember", isConst: true, name: "length", type: numberType },
  ],
});

const listTypeParameter: GenericTypeParameter = {
  kind: "GenericParameter",
  name: "T",
};
const listMapReturnTypeParameter: GenericTypeParameter = {
  kind: "GenericParameter",
  name: "T",
};
assign(listType, {
  kind: "GenericTypeDefinition",
  typeParameters: [listTypeParameter],
  base: objectType,
  members: [
    {
      kind: "StandardMember",
      name: "length",
      isConst: true,
      type: numberType,
    },
    {
      kind: "StandardMember",
      name: "filter",
      isConst: true,
      type: {
        kind: "Func",
        parameters: [
          {
            name: "predicate",
            type: {
              kind: "Func",
              parameters: [{ name: "item", type: listTypeParameter }],
              returnType: booleanType,
            },
          },
        ],
        returnType: {
          kind: "Generic",
          definition: listType,
          typeArguments: [listTypeParameter],
        },
      },
    },
    {
      kind: "GenericMemberDefinition",
      name: "map",
      isConst: true,
      definition: { FIX HERE
        kind: "GenericTypeDefinition",
        typeParameters: [listMapReturnTypeParameter],
        members: [],
        base: {
          kind: "Func",
          parameters: [
            {
              name: "mapper",
              type: {
                kind: "Func",
                parameters: [{ name: "item", type: listTypeParameter }],
                returnType: listMapReturnTypeParameter,
              },
            },
          ],
          returnType: {
            kind: "Generic",
            definition: listType,
            typeArguments: [listMapReturnTypeParameter],
          },
        },
      },
    },
  ],
  name: "List",
});

function assign<T>(type: T, value: T) {
  Object.assign(type, value);
}
