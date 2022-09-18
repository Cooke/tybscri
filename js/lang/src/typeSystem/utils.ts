import { Type, UnionType } from ".";

export function createUnionType(...types: Type[]) {
  return UnionType.create(types);
}
