export type Type =
  | UnionType
  | LiteralType
  | FuncType
  | RegularType
  | GenericType;

export type InlineType = Exclude<Type, RegularType>;

export type TypeRefOrInlineType = TypeRef | InlineType;

export type TypeRef = string;

export interface UnionType {
  readonly kind: "Union";
  readonly types: TypeRefOrInlineType[];
}

export interface GenericType {
  readonly kind: "Generic";
  readonly typeArguments: TypeRefOrInlineType[];
}

export interface LiteralType {
  readonly kind: "Literal";
  readonly value: any;
  readonly valueType: TypeRefOrInlineType;
}

export interface RegularType {
  readonly kind: "Regular";
  readonly base: TypeRef | GenericType | null;
  readonly members: Array<MemberDef>;
  readonly name: string;
}

export interface TypeParameterDef {
  readonly name: string;
}

export interface MemberDef {
  readonly isConst: boolean;
  readonly name: string;
  readonly type: Type;
}

export interface FuncType {
  readonly kind: "Func";
  readonly parameters: Array<ParameterDef>;
  readonly returnType: TypeRefOrInlineType;
}

export interface ParameterDef {
  readonly name: string;
  readonly type: TypeRefOrInlineType;
}

export interface TypeTable {
  [name: string]: Type;
}

export function isTypeRef(t: any): t is TypeRef {
  return typeof t === "string";
}

export function getTypeDisplayName(
  typeOrRef: Type | TypeRef,
  typeTable: TypeTable
): string {
  if (isTypeRef(typeOrRef)) {
    const resolvedType = resolveType(typeOrRef, typeTable);
    return resolvedType
      ? getTypeDisplayName(resolvedType, typeTable)
      : "unknown";
  }

  const type = typeOrRef;

  switch (type.kind) {
    case "Regular":
      return type.name;

    case "Literal":
      return type.valueType === "number"
        ? type.value.toString()
        : '"' + type.value.toString() + '"';

    case "Func":
      return `(${type.parameters.map((p) =>
        getTypeDisplayName(p.type, typeTable)
      )}) => ${getTypeDisplayName(type.returnType, typeTable)}`;

    default:
      return type.kind;
  }
}

export function resolveType(
  typeOrRef: Type | TypeRef,
  typeTable: TypeTable
): Type | null {
  if (isTypeRef(typeOrRef)) {
    return typeTable[typeOrRef] ?? null;
  }

  return typeOrRef;
}

export function resolveTypeOrThrow(
  typeOrRef: Type | TypeRef,
  typeTable: TypeTable
): Type {
  const resolvedType = resolveType(typeOrRef, typeTable);
  if (!resolvedType) {
    throw new Error(`Failed to resolve type '${typeOrRef}'`);
  }

  return resolvedType;
}

export function getAllTypeMembers(
  typeOrRef: Type | TypeRef,
  typeTable: TypeTable
): MemberDef[] {
  const type = resolveTypeOrThrow(typeOrRef, typeTable);

  switch (type.kind) {
    case "Regular":
      return type.members.concat(
        type.base
          ? getAllTypeMembers(
              resolveTypeOrThrow(type.base, typeTable),
              typeTable
            )
          : []
      );

    case "Union":
      if (type.types.length === 0) {
        return [];
      }

      const members = getAllTypeMembers(type.types[0], typeTable).reduce<{
        [key: string]: MemberDef;
      }>((o, member) => {
        o[member.name] = member;
        return o;
      }, {});

      for (let i = 1; i < type.types.length; i++) {
        for (const member of getAllTypeMembers(type.types[i], typeTable)) {
          if (
            members[member.name] &&
            (!isTypeAssignableToType(
              member.type,
              members[member.name].type,
              typeTable
            ) ||
              members[member.name].isConst !== member.isConst)
          ) {
            delete members[member.name];
          }
        }
      }
  }

  return [];
}

export function isTypeAssignableToType(
  fromTypeOrRef: Type | TypeRef,
  toTypeOrRef: Type | TypeRef,
  typeTable: TypeTable
): boolean {
  const to = resolveTypeOrThrow(toTypeOrRef, typeTable);
  const from = resolveTypeOrThrow(fromTypeOrRef, typeTable);

  switch (to.kind) {
    case "Regular":
      switch (from.kind) {
        case "Regular": {
          let testType: RegularType | null | undefined = from;
          while (testType != null) {
            if (testType.name === to.name) {
              return true;
            }

            if (testType.base) {
              const resolvedBase = resolveTypeOrThrow(testType.base, typeTable);
              if (resolvedBase.kind !== "Regular") {
                throw new Error(
                  `Unsupported base type kind '${resolvedBase.kind}'`
                );
              }

              testType = resolvedBase;
            } else {
              testType = null;
            }
          }

          return false;
        }

        case "Union":
          return from.types.every((t) =>
            isTypeAssignableToType(t, to, typeTable)
          );

        case "Func":
          return false;

        case "Literal":
          return isTypeAssignableToType(
            resolveTypeOrThrow(from.valueType, typeTable),
            to,
            typeTable
          );

        case "Generic":
          throw new Error("To be implemented");
      }

    case "Func": {
      return (
        from.kind === "Func" &&
        isTypeAssignableToType(from.returnType, to.returnType, typeTable) &&
        to.parameters.length >= from.parameters.length &&
        from.parameters.every((fp, i) =>
          isTypeAssignableToType(to.parameters[i].type, fp.type, typeTable)
        )
      );
    }

    case "Union": {
      return to.types.some((t) => isTypeAssignableToType(from, t, typeTable));
    }

    case "Literal": {
      return from.kind === "Literal" && from.value === to.value;
    }

    case "Generic":
      throw new Error("To be implemented");
  }
}
