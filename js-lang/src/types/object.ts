import { ObjectType } from "./common";
import { stringType } from "./string";

export const objectType: ObjectType = {
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
};

(stringType as any).base = objectType;
