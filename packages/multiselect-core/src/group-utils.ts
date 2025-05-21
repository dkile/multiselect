import type { ID } from "./types";
import type { SelectItem } from "./item";
import type { GroupNode } from "./group";
import type { UnifiedGroupNode } from "./group-filter";

export interface GroupTreeOptions {
  filter?: { filteredOnly?: boolean };
  selection?: { selectedOnly?: boolean; includePartial?: boolean };
}

function collectRawLeaves<Data, Meta>(
  node: GroupNode<Data, Meta>
): SelectItem<Data, Meta>[] {
  if (node.children) {
    let leaves: SelectItem<Data, Meta>[] = [];
    for (const child of node.children) {
      leaves = leaves.concat(collectRawLeaves(child));
    }
    return leaves;
  }
  return node.items;
}

export function pruneTreeByFilter<Data, Meta>(
  nodes: GroupNode<Data, Meta>[],
  filteredSet: Set<ID>,
  filteredOnly: boolean
): GroupNode<Data, Meta>[] {
  if (!filteredOnly) return nodes;
  const result: GroupNode<Data, Meta>[] = [];
  for (const node of nodes) {
    const leaves = collectRawLeaves(node);
    const hasFiltered = leaves.some((item) => filteredSet.has(item.id));
    const childrenPruned = pruneTreeByFilter(
      node.children ?? [],
      filteredSet,
      filteredOnly
    );
    if (hasFiltered || childrenPruned.length > 0) {
      const clone = Object.assign(
        Object.create(Object.getPrototypeOf(node)),
        node
      );
      if (childrenPruned.length > 0) {
        clone.children = childrenPruned;
      }
      result.push(clone);
    }
  }
  return result;
}

export function pruneUnifiedBySelection<Data, Meta>(
  nodes: UnifiedGroupNode<Data, Meta>[],
  selectionSet: Set<ID>,
  selectedOnly: boolean,
  includePartial: boolean
): UnifiedGroupNode<Data, Meta>[] {
  if (!selectedOnly) return nodes;
  const result: UnifiedGroupNode<Data, Meta>[] = [];
  for (const node of nodes) {
    const allItems = node.getItems({ filteredOnly: false });
    const selLeaves = allItems.filter((item) => selectionSet.has(item.id));
    if (selectedOnly) {
      if (includePartial) {
        if (selLeaves.length === 0) continue;
      } else {
        if (selLeaves.length !== allItems.length) continue;
      }
    }
    const childrenPruned = pruneUnifiedBySelection(
      node.getSubGroups({ filteredOnly: false }),
      selectionSet,
      selectedOnly,
      includePartial
    );

    const clone: UnifiedGroupNode<Data, Meta> = Object.assign(
      Object.create(Object.getPrototypeOf(node)),
      node
    );
    clone.getSubGroups = () => childrenPruned;
    clone.hasSubGroups = () => childrenPruned.length > 0;
    result.push(clone);
  }
  return result;
}
