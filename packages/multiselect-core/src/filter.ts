import type { SelectItem } from "./item";

export interface MultiSelectFilter<Data, Meta> {
  query: string;
  predicate: (item: Data, query: string, meta: Meta) => boolean;
}

export class FilterManager<Data, Meta> {
  private items: SelectItem<Data, Meta>[];
  private filter?: MultiSelectFilter<Data, Meta>;

  constructor(
    items: SelectItem<Data, Meta>[],
    initialFilter?: MultiSelectFilter<Data, Meta>
  ) {
    this.items = items;
    this.filter = initialFilter;
  }

  public setFilter(filter?: MultiSelectFilter<Data, Meta>): void {
    this.filter = filter;
  }

  public getFilteredItems(): SelectItem<Data, Meta>[] {
    if (!this.filter) return this.items;
    const { query, predicate } = this.filter;
    return this.items.filter((item) =>
      predicate(item.data, query, item.meta as Meta)
    );
  }

  public isAllFilteredSelected(): boolean {
    const filtered = this.getFilteredItems();
    return filtered.length > 0 && filtered.every((item) => item.isSelected);
  }

  public selectAllFiltered(): void {
    for (const item of this.getFilteredItems()) {
      item.select();
    }
  }

  public unselectAllFiltered(): void {
    for (const item of this.getFilteredItems()) {
      item.unselect();
    }
  }

  public toggleAllFiltered(): void {
    if (this.isAllFilteredSelected()) {
      this.unselectAllFiltered();
    } else {
      this.selectAllFiltered();
    }
  }

  public getFilter(): MultiSelectFilter<Data, Meta> | undefined {
    return this.filter;
  }
}
