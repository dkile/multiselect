import type { ID } from "./types";
import type { SelectItem } from "./item";
import type { GroupNode } from "./group";

export interface ScopeOptions {
  filteredOnly?: boolean;
}

export interface UnifiedGroupNode<Data, Meta> {
  key: ID;
  level: number;
  path: ID[];
  getItems(options?: ScopeOptions): SelectItem<Data, Meta>[];
  getSubGroups(_options?: ScopeOptions): UnifiedGroupNode<Data, Meta>[];
  getSubGroup(key: ID): UnifiedGroupNode<Data, Meta> | undefined;
  hasSubGroups(_options?: ScopeOptions): boolean;
  select(options?: { filteredOnly?: boolean }): void;
  unselect(options?: { filteredOnly?: boolean }): void;
  toggle(options?: { filteredOnly?: boolean }): void;
  isAllSelected(options?: { filteredOnly?: boolean }): boolean;
  totalCount: number;
  filteredCount: number;
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

export function unifyGroupNodes<Data, Meta>(
  nodes: GroupNode<Data, Meta>[],
  filteredSet: Set<ID>,
  filteredOnly: boolean
): UnifiedGroupNode<Data, Meta>[] {
  const result: UnifiedGroupNode<Data, Meta>[] = [];
  for (const node of nodes) {
    const allLeaves = collectRawLeaves(node);
    const filteredLeaves = allLeaves.filter((i) => filteredSet.has(i.id));
    if (filteredOnly && filteredLeaves.length === 0) continue;
    const childrenUnified = unifyGroupNodes(
      node.children ?? [],
      filteredSet,
      filteredOnly
    );
    const unified: UnifiedGroupNode<Data, Meta> = {
      key: node.key,
      level: node.level,
      path: node.path,
      getItems({ filteredOnly: fo } = {}): SelectItem<Data, Meta>[] {
        return fo ? filteredLeaves : allLeaves;
      },
      getSubGroups(): UnifiedGroupNode<Data, Meta>[] {
        return childrenUnified;
      },
      getSubGroup(key: ID): UnifiedGroupNode<Data, Meta> | undefined {
        return childrenUnified.find((child) => child.key === key);
      },
      hasSubGroups(): boolean {
        return childrenUnified.length > 0;
      },
      select({ filteredOnly: fo } = {}): void {
        for (const item of fo ? filteredLeaves : allLeaves) item.select();
      },
      unselect({ filteredOnly: fo } = {}): void {
        for (const item of fo ? filteredLeaves : allLeaves) item.unselect();
      },
      toggle({ filteredOnly: fo } = {}): void {
        const target = fo ? filteredLeaves : allLeaves;
        const allSel = target.length > 0 && target.every((i) => i.isSelected);
        if (allSel) {
          for (const item of target) {
            item.unselect();
          }
        } else {
          for (const item of target) {
            item.select();
          }
        }
      },
      isAllSelected({ filteredOnly: fo } = {}): boolean {
        const target = fo ? filteredLeaves : allLeaves;
        return target.length > 0 && target.every((i) => i.isSelected);
      },
      totalCount: allLeaves.length,
      filteredCount: filteredLeaves.length,
    };
    result.push(unified);
  }
  return result;
}
