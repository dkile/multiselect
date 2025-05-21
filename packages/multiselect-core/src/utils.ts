import type { Accessor, ID } from "./types";

export const isID = (value: unknown): value is ID =>
  typeof value === "string" ||
  typeof value === "number" ||
  typeof value === "bigint";

export const accessObjectValue = <Data>(
  accessor: Accessor<Data>,
  item: Data
): ID | undefined => {
  if (typeof accessor === "string") {
    const pathKeys = accessor.split(".");
    const value = pathKeys.reduce<unknown>((acc, key) => {
      if (acc && typeof acc === "object" && key in acc) {
        return (acc as Record<string, unknown>)[key];
      }
      return undefined;
    }, item as unknown);
    return isID(value) ? value : undefined;
  }

  const value = accessor(item);
  return value;
};
