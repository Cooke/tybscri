import { RegularType } from "./common";
import { stringType } from "./string";

export const objectType: RegularType = {
  kind: "Regular",
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
};

(stringType as any).base = objectType;
