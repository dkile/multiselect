import type { ID, Accessor } from "./types";
import type { SelectItem } from "./item";
import { accessObjectValue } from "./utils";

export interface GroupNode<Data, Meta> {
  key: ID;
  level: number;
  path: ID[];
  items: SelectItem<Data, Meta>[];
  children?: GroupNode<Data, Meta>[];
  hasChildren(): this is GroupNode<Data, Meta> & {
    children: GroupNode<Data, Meta>[];
  };
  select(): void;
  unselect(): void;
  toggle(): void;
  isAllSelected(): boolean;
}

export class GroupManager<Data, Meta> {
  private items: SelectItem<Data, Meta>[];
  private groupBy: Array<Accessor<Data>>;

  constructor(items: SelectItem<Data, Meta>[], groupBy: Array<Accessor<Data>>) {
    this.items = items;
    this.groupBy = groupBy;
  }

  public getGroupTree(): GroupNode<Data, Meta>[] {
    return this.groupItemsRecursive(this.items, 0, []);
  }

  public selectGroup(node: GroupNode<Data, Meta>): void {
    for (const leaf of this.collectLeaves(node)) {
      leaf.select();
    }
  }

  public unselectGroup(node: GroupNode<Data, Meta>): void {
    for (const leaf of this.collectLeaves(node)) {
      leaf.unselect();
    }
  }

  public toggleGroup(node: GroupNode<Data, Meta>): void {
    const leaves = this.collectLeaves(node);
    const allSelected = leaves.every((i) => i.isSelected);
    if (allSelected) {
      this.unselectGroup(node);
    } else {
      this.selectGroup(node);
    }
  }

  private groupItemsRecursive(
    items: SelectItem<Data, Meta>[],
    level: number,
    path: ID[]
  ): GroupNodeImpl<Data, Meta>[] {
    if (level >= this.groupBy.length) return [];
    const accessor = this.groupBy[level];
    const map = new Map<ID, SelectItem<Data, Meta>[]>();
    for (const item of items) {
      const rawValue = accessObjectValue(accessor, item.data);
      if (rawValue === undefined) {
        if (typeof accessor === "string") {
          throw new Error(
            `Grouping by path '${accessor}' returned undefined for item`
          );
        }
        continue;
      }
      const arr = map.get(rawValue) ?? [];
      arr.push(item);
      map.set(rawValue, arr);
    }
    const nodes: GroupNodeImpl<Data, Meta>[] = [];
    for (const [key, groupItems] of map.entries()) {
      const currentPath = [...path, key];
      const children = this.groupItemsRecursive(
        groupItems,
        level + 1,
        currentPath
      );
      const node = new GroupNodeImpl(
        this,
        key,
        level,
        currentPath,
        children.length > 0 ? [] : groupItems,
        children.length > 0 ? children : undefined
      );
      nodes.push(node);
    }
    return nodes;
  }

  private collectLeaves(node: GroupNode<Data, Meta>): SelectItem<Data, Meta>[] {
    if (node.children) {
      let leaves: SelectItem<Data, Meta>[] = [];
      for (const child of node.children) {
        leaves = leaves.concat(this.collectLeaves(child));
      }
      return leaves;
    }
    return node.items;
  }
}

class GroupNodeImpl<Data, Meta> implements GroupNode<Data, Meta> {
  public key: ID;
  public level: number;
  public path: ID[];
  public items: SelectItem<Data, Meta>[];
  public children?: GroupNodeImpl<Data, Meta>[];
  private manager: GroupManager<Data, Meta>;

  constructor(
    manager: GroupManager<Data, Meta>,
    key: ID,
    level: number,
    path: ID[],
    items: SelectItem<Data, Meta>[],
    children?: GroupNodeImpl<Data, Meta>[]
  ) {
    this.manager = manager;
    this.key = key;
    this.level = level;
    this.path = path;
    this.items = items;
    this.children = children;
  }

  public select(): void {
    this.manager.selectGroup(this);
  }

  public unselect(): void {
    this.manager.unselectGroup(this);
  }

  public toggle(): void {
    this.manager.toggleGroup(this);
  }

  public hasChildren(): this is GroupNodeImpl<Data, Meta> & {
    children: GroupNodeImpl<Data, Meta>[];
  } {
    return Array.isArray(this.children) && this.children.length > 0;
  }

  public isAllSelected(): boolean {
    if (this.hasChildren()) {
      return this.children.every((child) => child.isAllSelected());
    }
    return this.items.every((item) => item.isSelected);
  }
}
