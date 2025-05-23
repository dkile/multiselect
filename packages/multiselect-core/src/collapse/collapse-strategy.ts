import type { ID } from "../types";
import type { UnifiedGroupNode } from "../group-filter";
import type { SelectItem } from "../item";

export type PositionStrategy = (indices: number[]) => number;

export const CollapsePositionFirst: PositionStrategy = (inds) =>
  Math.min(...inds);

export const CollapsePositionLast: PositionStrategy = (inds) =>
  Math.max(...inds);

export type CollapsedNode<Data, Meta, GroupMeta = unknown> =
  | { type: "item"; node: SelectItem<Data, Meta>; order: number }
  | {
      type: "group";
      node: UnifiedGroupNode<Data, Meta, GroupMeta>;
      order: number;
    };

export interface CollapseOptions {
  filteredOnly?: boolean;
  positionStrategy?: PositionStrategy;
}

export function collapseSelection<Data, Meta, GroupMeta = unknown>(
  tree: UnifiedGroupNode<Data, Meta, GroupMeta>[],
  orderMap: Map<ID, number>,
  options: CollapseOptions = {}
): CollapsedNode<Data, Meta, GroupMeta>[] {
  const { filteredOnly = false, positionStrategy = CollapsePositionFirst } =
    options;
  const out: CollapsedNode<Data, Meta, GroupMeta>[] = [];

  function walk(nodes: UnifiedGroupNode<Data, Meta, GroupMeta>[]) {
    for (const node of nodes) {
      const items = node.getItems({ filteredOnly });
      const sel = items.filter((i) => i.isSelected);
      const children = node.getSubGroups({ filteredOnly });

      if (sel.length === items.length && sel.length > 0) {
        const idxs = sel.map(
          (i) => orderMap.get(i.id) ?? Number.MAX_SAFE_INTEGER
        );
        out.push({ type: "group", node, order: positionStrategy(idxs) });
      } else {
        if (children.length === 0) {
          for (const item of sel) {
            const ord = orderMap.get(item.id) ?? Number.MAX_SAFE_INTEGER;
            out.push({ type: "item", node: item, order: ord });
          }
        }

        walk(children);
      }
    }
  }

  walk(tree);

  return out.sort((a, b) => a.order - b.order);
}
