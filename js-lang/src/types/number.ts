import { RegularType } from "./common";
import { objectType } from "./object";

export const numberType: RegularType = {
  kind: "Regular",
  name: "number",
  base: objectType,
  members: [],
};
