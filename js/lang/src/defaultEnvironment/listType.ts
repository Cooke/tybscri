import { Member, TypeParameter } from "../typeSystem";
import { FuncParameter, FuncType } from "../typeSystem/FuncType";
import { ObjectDefinitionType } from "../typeSystem/ObjectType";
import { booleanType, numberType, objectType } from "../typeSystem/types";

const itemType = new TypeParameter("TItem");
const mapResultType = new TypeParameter("TResult");
export const listDefinitionType: ObjectDefinitionType =
  new ObjectDefinitionType("List", objectType, [itemType], () => [
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
        listDefinitionType.createType([itemType])
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
        listDefinitionType.createType([mapResultType])
      ),
      [mapResultType]
    ),
  ]);
