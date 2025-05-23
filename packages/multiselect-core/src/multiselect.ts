import type { ID, Accessor } from "./types";
import type { ItemDef, SelectItem } from "./item";
import type { Scheduler } from "./scheduler";
import { rafScheduler } from "./scheduler";
import { createCoreSelectItem } from "./item";
import { GroupManager, type GroupNode } from "./group";
import type { MultiSelectFilter } from "./filter";
import { FilterManager } from "./filter";
import type { UnifiedGroupNode } from "./group-filter";
import { unifyGroupNodes } from "./group-filter";
import type { GroupTreeOptions } from "./group-utils";
import { pruneTreeByFilter, pruneUnifiedBySelection } from "./group-utils";
import { CollapseManager } from "./collapse/collapse-manager";
import type {
  CollapseOptions,
  CollapsedNode,
} from "./collapse/collapse-strategy";

export interface GroupByDescriptor<Data, GroupHeader = unknown> {
  accessor: Accessor<Data>;
  getHeader?: (groupKey: ID, items: Data[], level: number) => GroupHeader;
}

export interface MultiSelectState {
  selectedIds: Set<ID>;
}

export interface MultiSelectOptions<
  Data,
  Meta = unknown,
  GroupHeader = unknown
> {
  data: Data[];
  itemDef: ItemDef<Data, Meta>;
  initialState?: Omit<MultiSelectState, "selectedIds"> & {
    selectedIds: Array<ID>;
  };
  filter?: MultiSelectFilter<Data, Meta>;
  scheduler?: Scheduler;
  groupBy?: Array<Accessor<Data> | GroupByDescriptor<Data, GroupHeader>>;
}

type Listener = (
  state: MultiSelectState,
  diff: { added: ID[]; removed: ID[] }
) => void;

export interface MultiSelect<Data, Meta = unknown, GroupHeader = unknown> {
  subscribe(listener: Listener): () => void;
  getItems(): SelectItem<Data, Meta>[];
  getSelectedIds(options?: { filteredOnly?: boolean }): ID[];
  getSelectedItems(options?: {
    filteredOnly?: boolean;
  }): SelectItem<Data, Meta>[];
  isAllSelected(): boolean;
  selectAll(): void;
  unselectAll(): void;
  toggleAll(): void;
  getFilteredItems(): SelectItem<Data, Meta>[];
  isAllFilteredSelected(): boolean;
  selectAllFiltered(): void;
  unselectAllFiltered(): void;
  toggleAllFiltered(): void;
  setFilter(filter?: MultiSelectFilter<Data, Meta>): void;
  getGroupTree(
    options?: GroupTreeOptions
  ): UnifiedGroupNode<Data, Meta, GroupHeader>[];
  getSelectionSummary(options?: { filteredOnly?: boolean }): {
    total: number;
    selected: number;
  };
  getCollapsedSelection(options?: CollapseOptions): CollapsedNode<Data, Meta>[];
  getGroup(key: ID): UnifiedGroupNode<Data, Meta, GroupHeader> | undefined;
  getItem(key: ID): SelectItem<Data, Meta> | undefined;
  getGroupHeader(groupKey: ID): GroupHeader | undefined;
}

export class MultiSelectCore<Data, Meta = unknown, GroupHeader = unknown>
  implements MultiSelect<Data, Meta, GroupHeader>
{
  private rawGroupTree: GroupNode<Data, Meta>[];
  private filterManager: FilterManager<Data, Meta>;
  private lastCacheKey?: string;
  private lastUnifiedTree?: UnifiedGroupNode<Data, Meta, GroupHeader>[];
  private data: Data[];
  private items: SelectItem<Data, Meta>[];
  private itemMap: Map<ID, SelectItem<Data, Meta>>;
  private groupMap: Map<ID, UnifiedGroupNode<Data, Meta, GroupHeader>>;
  private selectedIds: Set<ID>;
  private listeners = new Set<Listener>();

  private pendingDiff: { added: Set<ID>; removed: Set<ID> } = {
    added: new Set<ID>(),
    removed: new Set<ID>(),
  };
  private isFlushScheduled = false;
  private scheduler: Scheduler;
  private groupManager: GroupManager<Data, Meta>;
  private collapseManager: CollapseManager<Data, Meta>;
  private headerGenerators: Array<
    ((groupKey: ID, items: Data[], level: number) => GroupHeader) | undefined
  >;
  private groupHeaders: Map<ID, GroupHeader | undefined> = new Map();

  constructor(options: MultiSelectOptions<Data, Meta, GroupHeader>) {
    this.data = options.data;
    const idAccessor = options.itemDef.id_accessor;
    this.selectedIds = new Set(options.initialState?.selectedIds);
    this.items = this.data.map((dataItem) =>
      createCoreSelectItem(
        dataItem,
        idAccessor,
        options.itemDef.meta,
        this.selectedIds,
        this.applyChange.bind(this)
      )
    );
    this.itemMap = new Map();
    for (const item of this.items) {
      this.itemMap.set(item.id, item);
    }
    this.groupMap = new Map();
    this.filterManager = new FilterManager(this.items, options.filter);
    const groupBySpecs =
      options.groupBy ??
      ([] as Array<Accessor<Data> | GroupByDescriptor<Data, GroupHeader>>);
    const accessors = groupBySpecs.map((spec) =>
      typeof spec === "object" ? spec.accessor : spec
    );
    this.groupManager = new GroupManager(this.items, accessors);
    this.headerGenerators = groupBySpecs.map((spec) =>
      typeof spec === "object" ? spec.getHeader : undefined
    );

    this.rawGroupTree = this.groupManager.getGroupTree();
    this.scheduler = options.scheduler ?? rafScheduler;
    this.collapseManager = new CollapseManager(this);
  }

  private applyChange(change: { added?: ID[]; removed?: ID[] }) {
    if (change.added) {
      for (const id of change.added) {
        this.selectedIds.add(id);
        this.pendingDiff.removed.delete(id);
        this.pendingDiff.added.add(id);
      }
    }
    if (change.removed) {
      for (const id of change.removed) {
        this.selectedIds.delete(id);
        this.pendingDiff.added.delete(id);
        this.pendingDiff.removed.add(id);
      }
    }
    this.scheduleFlush();
  }

  private emit(diff: { added?: ID[]; removed?: ID[] }) {
    const state: MultiSelectState = { selectedIds: new Set(this.selectedIds) };
    for (const listener of this.listeners) {
      listener(state, { added: diff.added ?? [], removed: diff.removed ?? [] });
    }
  }

  public getItems(): SelectItem<Data, Meta>[] {
    return this.items;
  }

  public getSelectedIds({
    filteredOnly,
  }: { filteredOnly?: boolean } = {}): ID[] {
    return this.getSelectedItems({ filteredOnly }).map((item) => item.id);
  }

  public getSelectedItems({
    filteredOnly,
  }: { filteredOnly?: boolean } = {}): SelectItem<Data, Meta>[] {
    const items = filteredOnly
      ? this.filterManager.getFilteredItems()
      : this.items;
    return items.filter((item) => item.isSelected);
  }

  public isAllSelected(): boolean {
    return this.items.length > 0 && this.items.every((item) => item.isSelected);
  }

  public selectAll(): void {
    for (const item of this.items) {
      item.select();
    }
  }

  public unselectAll(): void {
    for (const item of this.items) {
      item.unselect();
    }
  }

  public toggleAll(): void {
    if (this.isAllSelected()) {
      this.unselectAll();
    } else {
      this.selectAll();
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(
      { selectedIds: new Set(this.selectedIds) },
      { added: [], removed: [] }
    );
    return () => {
      this.listeners.delete(listener);
    };
  }

  private scheduleFlush(): void {
    if (this.isFlushScheduled) return;
    this.isFlushScheduled = true;
    this.scheduler.schedule(() => this.flush());
  }

  private flush(): void {
    const diff = {
      added: Array.from(this.pendingDiff.added),
      removed: Array.from(this.pendingDiff.removed),
    };
    this.pendingDiff.added.clear();
    this.pendingDiff.removed.clear();
    this.isFlushScheduled = false;
    this.emit(diff);
  }

  public getFilteredItems(): SelectItem<Data, Meta>[] {
    return this.filterManager.getFilteredItems();
  }

  public isAllFilteredSelected(): boolean {
    return this.filterManager.isAllFilteredSelected();
  }

  public selectAllFiltered(): void {
    this.filterManager.selectAllFiltered();
  }

  public unselectAllFiltered(): void {
    this.filterManager.unselectAllFiltered();
  }

  public toggleAllFiltered(): void {
    this.filterManager.toggleAllFiltered();
  }

  public setFilter(filter?: MultiSelectFilter<Data, Meta>): void {
    this.filterManager.setFilter(filter);
  }

  public getGroupTree(
    options?: GroupTreeOptions
  ): UnifiedGroupNode<Data, Meta, GroupHeader>[] {
    const filteredOnly = options?.filter?.filteredOnly ?? false;
    const selectedOnly = options?.selection?.selectedOnly ?? false;
    const includePartial = options?.selection?.includePartial ?? false;

    const filterQuery = this.filterManager.getFilter()?.query ?? "";
    const effectiveFilteredOnly = filteredOnly && filterQuery.length > 0;
    const cacheKey = `${filterQuery}|${effectiveFilteredOnly}|${selectedOnly}|${includePartial}`;
    if (this.lastUnifiedTree && cacheKey === this.lastCacheKey) {
      return this.lastUnifiedTree;
    }

    const filteredSet = new Set(
      this.filterManager.getFilteredItems().map((i) => i.id)
    );
    const prunedFilter = pruneTreeByFilter(
      this.rawGroupTree,
      filteredSet,
      effectiveFilteredOnly
    );
    const unifiedByFilter = unifyGroupNodes<Data, Meta, GroupHeader>(
      prunedFilter,
      filteredSet,
      effectiveFilteredOnly
    );
    const selectionSet = new Set(this.getSelectedIds({ filteredOnly }));
    const finalTree = pruneUnifiedBySelection<Data, Meta, GroupHeader>(
      unifiedByFilter,
      selectionSet,
      selectedOnly,
      includePartial
    );

    this.lastUnifiedTree = finalTree;
    this.lastCacheKey = cacheKey;
    this.groupMap.clear();
    const walk = (nodes: UnifiedGroupNode<Data, Meta, GroupHeader>[]) => {
      for (const node of nodes) {
        this.groupMap.set(node.key, node);
        walk(node.getSubGroups({ filteredOnly: false }));
      }
    };
    walk(finalTree);
    this.groupHeaders.clear();
    const computeHeaders = (
      nodes: UnifiedGroupNode<Data, Meta, GroupHeader>[]
    ) => {
      for (const node of nodes) {
        const getter = this.headerGenerators[node.level];
        const dataItems = node
          .getItems({ filteredOnly: false })
          .map((item) => item.data);
        const headerVal: GroupHeader | undefined = getter
          ? getter(node.key, dataItems, node.level)
          : undefined;
        this.groupHeaders.set(node.key, headerVal);
        const subs = node.getSubGroups({ filteredOnly: false });
        if (subs.length > 0) computeHeaders(subs);
      }
    };
    computeHeaders(finalTree);
    const attachHeader = (
      nodes: UnifiedGroupNode<Data, Meta, GroupHeader>[]
    ): void => {
      for (const node of nodes) {
        node.getHeader = () => this.groupHeaders.get(node.key);
        const subs = node.getSubGroups({ filteredOnly: false });
        if (subs.length > 0) attachHeader(subs);
      }
    };
    attachHeader(finalTree);
    return finalTree;
  }

  public getSelectionSummary(options?: { filteredOnly?: boolean }): {
    total: number;
    selected: number;
  } {
    const total = options?.filteredOnly
      ? this.filterManager.getFilteredItems().length
      : this.items.length;
    const selected = this.getSelectedItems(options).length;
    return { total, selected };
  }

  public getCollapsedSelection(
    options?: CollapseOptions
  ): CollapsedNode<Data, Meta>[] {
    return this.collapseManager.getCollapsedSelection(options);
  }

  public getGroup(
    key: ID
  ): UnifiedGroupNode<Data, Meta, GroupHeader> | undefined {
    this.getGroupTree();
    return this.groupMap.get(key);
  }

  public getItem(key: ID): SelectItem<Data, Meta> | undefined {
    return this.itemMap.get(key);
  }

  public getGroupHeader(groupKey: ID): GroupHeader | undefined {
    return this.groupHeaders.get(groupKey);
  }
}

export function createMultiSelect<Data, Meta = unknown, GroupHeader = unknown>(
  options: MultiSelectOptions<Data, Meta, GroupHeader>
): MultiSelect<Data, Meta, GroupHeader> {
  return new MultiSelectCore<Data, Meta, GroupHeader>(options);
}
