import type { StrictAccessor, ID } from "./types";
import { accessObjectValue } from "./utils";

export type SelectItem<Data, Meta> = {
  id: ID;
  data: Data;
  isSelected: boolean;
  meta?: Meta;
  select: () => void;
  unselect: () => void;
  toggle: () => void;
};

export interface ItemDef<Data, Meta> {
  id_accessor: StrictAccessor<Data>;
  meta?: (item: Data) => Meta;
}

export function createCoreSelectItem<Data, Meta>(
  data: Data,
  idAccessor: StrictAccessor<Data>,
  metaFn: ((item: Data) => Meta) | undefined,
  selectedIds: Set<ID>,
  applyChange: (change: { added?: ID[]; removed?: ID[] }) => void
): SelectItem<Data, Meta> {
  const rawId = accessObjectValue(idAccessor, data);
  if (rawId === undefined) {
    throw new Error(
      `id_accessor returned undefined for item: ${JSON.stringify(data)}`
    );
  }
  const id: ID = rawId;
  const wrapper: SelectItem<Data, Meta> = {
    id,
    data,
    get isSelected() {
      return selectedIds.has(id);
    },
    meta: metaFn ? metaFn(data) : undefined,
    select: () => {
      if (!selectedIds.has(id)) {
        applyChange({ added: [id] });
      }
    },
    unselect: () => {
      if (selectedIds.has(id)) {
        applyChange({ removed: [id] });
      }
    },
    toggle: () => {
      if (selectedIds.has(id)) {
        wrapper.unselect();
      } else {
        wrapper.select();
      }
    },
  };
  return wrapper;
}
