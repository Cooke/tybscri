import {
  TypeParameter,
  LiteralType,
  NeverType,
  ObjectType,
  UnknownType,
} from "./common";

export const objectType = {} as ObjectType;
export const numberType = {} as ObjectType;
export const stringType = {} as ObjectType;

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

export const itemType: TypeParameter = {
  kind: "TypeParameter",
  name: "TItem",
};

export const resultType: TypeParameter = {
  kind: "TypeParameter",
  name: "TResult",
};

export function assign<T>(type: T, value: T) {
  Object.assign(type, value);
}
