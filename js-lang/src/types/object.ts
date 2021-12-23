import { RegularType } from "./common";

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
        returnType: "string",
      },
    },
  ],
};
