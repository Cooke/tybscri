import { GenericObjectType, ObjectType } from "./common";
import { deriveObjectType } from "./core";
import {
  assign,
  objectType,
  itemType,
  numberType,
  booleanType,
  resultType,
} from "./types";

export const listType = {} as GenericObjectType;
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
assign(listOfItemType, deriveObjectType(listType, [itemType]));
assign(listOfResultType, deriveObjectType(listType, [resultType]));
