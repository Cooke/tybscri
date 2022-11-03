import { Environment } from "..";
import { listDefinitionType } from "./listType";

export const defaultEnvironment: Environment = {
  symbols: [{ name: "List", type: listDefinitionType }],
  collectionDefinition: listDefinitionType,
};
