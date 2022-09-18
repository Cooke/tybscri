import { Member, TypeParameter } from ".";
import { FuncParameter, FuncType } from "./FuncType";
import { ObjectType } from "./ObjectType";
import { booleanType, numberType, objectType } from "./types";

const itemType = new TypeParameter("TItem");
const mapResultType = new TypeParameter("TResult");
export const listType: ObjectType = new ObjectType(
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
        listType.bindAll([mapResultType])
      ),
      [mapResultType]
    ),
  ],
  [itemType],
  [itemType]
);
