import type { ID } from "../types";
import type { MultiSelect } from "../multiselect";
import { collapseSelection, CollapsePositionFirst } from "./collapse-strategy";
import type {
  CollapseOptions,
  CollapsedNode,
  PositionStrategy,
} from "./collapse-strategy";

export class CollapseManager<Data, Meta> {
  private orderMap = new Map<ID, number>();
  private counter = 0;

  constructor(private ms: MultiSelect<Data, Meta>) {
    ms.subscribe((_state, diff) => {
      for (const id of diff.added) {
        this.orderMap.set(id, this.counter++);
      }
      for (const id of diff.removed) {
        this.orderMap.delete(id);
      }
    });
  }

  public getCollapsedSelection(
    options: CollapseOptions = {}
  ): CollapsedNode<Data, Meta>[] {
    const filteredOnly = options.filteredOnly;
    const positionStrategy: PositionStrategy =
      options.positionStrategy ?? CollapsePositionFirst;

    const tree = this.ms.getGroupTree({ filter: { filteredOnly } });

    return collapseSelection(tree, this.orderMap, {
      filteredOnly,
      positionStrategy,
    });
  }
}
