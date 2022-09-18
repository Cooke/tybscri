import {
  bindGenericObjectType,
  FuncParameter,
  FuncType,
  Member,
  TypeParameter,
} from ".";
import { GenericObjectType } from "./common";
import { booleanType, numberType, objectType } from "./types";

const itemType = new TypeParameter("TItem");
const mapResultType = new TypeParameter("TResult");
export const listType: GenericObjectType = new GenericObjectType(
  "List",
  objectType,
  () => [
    new Member(true, "length", numberType),
    new Member(
      true,
      "filter",
      new FuncType(
        [
          new FuncParameter(
            "predicate",
            new FuncType([new FuncParameter("item", itemType)], booleanType)
          ),
        ],
        listType
      )
    ),
    new Member(
      true,
      "map",
      new FuncType(
        [
          new FuncParameter(
            "mapper",
            new FuncType([new FuncParameter("item", itemType)], mapResultType)
          ),
        ],
        bindGenericObjectType(listType, [mapResultType])
      ),
      [mapResultType]
    ),
  ],
  [itemType],
  [itemType]
);
