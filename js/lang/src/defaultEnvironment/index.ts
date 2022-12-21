import { Environment } from "../common";
import { booleanDefinitionType } from "../typeSystem";
import { listDefinitionType } from "./listType";

export const defaultEnvironment: Environment = {
  symbols: [{ name: "List", type: listDefinitionType }],
  collectionDefinition: listDefinitionType,
  booleanDefinition: booleanDefinitionType,
};
