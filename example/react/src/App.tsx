import { useState } from "react";
import { unifiedData } from "./data";
import {
  useMultiSelect,
  type UnifiedGroupNode,
  CollapsePositionFirst,
} from "@dkile/react-multiselect";

function GroupNodeView({ node }: { node: UnifiedGroupNode<any, any> }) {
  return (
    <li>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <input
          type="checkbox"
          checked={node.isAllSelected({ filteredOnly: true })}
          onChange={() => node.toggle({ filteredOnly: true })}
        />
        <span>
          {node.key} (level {node.level}) [{node.filteredCount}/
          {node.totalCount}]
        </span>
      </div>
      {node.hasSubGroups({ filteredOnly: true }) ? (
        <ul>
          {node.getSubGroups({ filteredOnly: true }).map((child) => (
            <GroupNodeView key={child.path.join("-")} node={child} />
          ))}
        </ul>
      ) : (
        <ul>
          {node.getItems({ filteredOnly: true }).map((item) => (
            <li key={item.id}>
              <input
                type="checkbox"
                checked={item.isSelected}
                onChange={() => item.toggle()}
              />
              {item.data.label}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function App() {
  const [search, setSearch] = useState("");

  const multiSelect = useMultiSelect({
    data: unifiedData,
    itemDef: {
      id_accessor: (item) => item.id,
    },
    filter: {
      query: search,
      predicate: (item, query) => item.label.includes(query),
    },
    groupBy: [(item) => item.category],
  });

  return (
    <div>
      <div>
        <ul style={{ display: "flex", gap: "10px" }}>
          {multiSelect
            .getCollapsedSelection({
              positionStrategy: CollapsePositionFirst,
            })
            .map((node) =>
              node.type === "group" ? (
                <li
                  key={node.node.key}
                  style={{ backgroundColor: "lightgray" }}
                >
                  {node.node.path.join(" > ")}
                </li>
              ) : (
                <li key={node.node.id} style={{ backgroundColor: "lightgray" }}>
                  {node.node.data.label}
                </li>
              )
            )}
        </ul>
      </div>
      <button type="button" onClick={() => multiSelect.selectAll()}>
        전체 선택
      </button>
      <button type="button" onClick={() => multiSelect.unselectAll()}>
        전체 해제
      </button>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div style={{ display: "flex", gap: "10px" }}>
        <ul>
          {multiSelect
            .getGroupTree({
              filter: { filteredOnly: true },
            })
            .map((node) => (
              <GroupNodeView key={node.path.join("-")} node={node} />
            ))}
        </ul>
        <ul>
          {multiSelect.getSelectedIds().map((id) => (
            <li key={id}>{id}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
