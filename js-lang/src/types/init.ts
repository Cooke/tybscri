import { ObjectType } from "..";

export const objectType = {} as ObjectType;
export const numberType = {} as ObjectType;
export const stringType = {} as ObjectType;

Object.assign(objectType, {
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

Object.assign(numberType, {
  kind: "Object",
  name: "number",
  base: objectType,
  members: [],
});

Object.assign(stringType, {
  kind: "Object",
  name: "string",
  base: objectType,
  members: [{ isConst: true, name: "length", type: numberType }],
});
