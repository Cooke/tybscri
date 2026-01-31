import { Environment } from "../common";
import {
  anyDefinitionType,
  booleanDefinitionType,
  neverDefinitionType,
  nullDefinitionType,
  numberDefinitionType,
  stringDefinitionType,
  voidDefinitionType,
} from "../typeSystem";
import { listDefinitionType } from "./listType";

export const defaultEnvironment: Environment = {
  symbols: [
    { name: "List", type: listDefinitionType },
    { name: "Number", type: numberDefinitionType },
    { name: "Boolean", type: booleanDefinitionType },
    { name: "String", type: stringDefinitionType },
    { name: "Null", type: nullDefinitionType },
    { name: "Void", type: voidDefinitionType },
    { name: "Never", type: neverDefinitionType },
    { name: "Any", type: anyDefinitionType },
  ],
  collectionDefinition: listDefinitionType,
  booleanDefinition: booleanDefinitionType,
};
