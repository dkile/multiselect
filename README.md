# Multiselect

**Multiselect**는 순수 로직 패키지인 **multiselect-core**와 React 훅 래퍼 **react-multiselect**를 포함하는 다중 선택 라이브러리입니다. 필터링, 그룹핑, collapse 전략을 간편하게 제공합니다.

## Features

- **multiselect-core** (Pure API)
  - 필터 및 그룹 트리 생성
  - 선택 상태 관리 및 diff 구독
  - collapse 전략 적용 가능
- **react-multiselect** (React Hook)
  - `useMultiSelect` Hook 제공
  - `CollapsePositionFirst` / `CollapsePositionLast` 전략 지원

## Installation

!under 0.0.7 crashes..install at least 0.0.7 version.

```bash
# pnpm
# for core
pnpm add @dkile/multiselect-core
# for react hook
pnpm add @dkile/react-multiselect

# npm
# for core
npm install @dkile/multiselect-core
#for react hook
pnpm add @dkile/react-multiselect
```

## Usage

### A. Pure API (multiselect-core)

```ts
import {
  createMultiSelect,
  type MultiSelect,
  type MultiSelectOptions,
  CollapsePositionFirst,
  CollapsePositionLast,
} from "multiselect-core";

interface ItemData {
  id: number;
  label: string;
  category: string;
}

const data: ItemData[] = [
  { id: 1, label: "Apple", category: "fruit" },
  { id: 2, label: "Banana", category: "fruit" },
  { id: 3, label: "Cherry", category: "fruit" },
  { id: 4, label: "Carrot", category: "vegetable" },
  { id: 5, label: "Broccoli", category: "vegetable" },
];

const options: MultiSelectOptions<ItemData, void> = {
  data,
  itemDef: { id_accessor: (item) => item.id, meta: undefined },
  filter: {
    query: "",
    predicate: (item, q) => item.label.toLowerCase().includes(q.toLowerCase()),
  },
  groupBy: [(item) => item.category, (item) => item.label.charAt(0)],
};

const ms: MultiSelect<ItemData, void> = createMultiSelect(options);

// 상태 구독
ms.subscribe((state, diff) => console.log("state:", state, "diff:", diff));

// 선택/해제 예시
ms.selectAll();
ms.unselectAll();
ms.selectAllFiltered();
ms.unselectAll();

// 데이터 조회 예시
console.log("Selected IDs:", ms.getSelectedIds());
console.log("Filtered Items:", ms.getFilteredItems());

// 그룹 트리 생성 (필터 적용)
console.log(ms.getGroupTree({ filter: { filteredOnly: true } }));

// Collapse 선택 (첫 선택 우선)
console.log(
  ms.getCollapsedSelection({
    filteredOnly: false,
    positionStrategy: CollapsePositionFirst,
  })
);

// Collapse 선택 (마지막 선택 우선)
console.log(
  ms.getCollapsedSelection({
    filteredOnly: false,
    positionStrategy: CollapsePositionLast,
  })
);
```

### B. React Hook (react-multiselect)

```tsx
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
    groupBy: [
      (item) => item.category,
      (item) => (item.category === "animal" ? item.mbti : item.taste?.brix),
    ],
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
```

```tsx
export interface UnifiedItem {
  id: number;
  label: string;
  category: string;
  taste?: {
    brix: number;
  };
  mbti?: string;
}

export const unifiedData: UnifiedItem[] = [
  { id: 1, label: "Apple", category: "fruit", taste: { brix: 10 } },
  { id: 2, label: "Banana", category: "fruit", taste: { brix: 15 } },
  {
    id: 3,
    label: "Cherry",
    category: "fruit",
    taste: { brix: 10 },
  },
  { id: 4, label: "Carrot", category: "vegetable", taste: { brix: 2 } },
  { id: 5, label: "Broccoli", category: "vegetable", taste: { brix: 1 } },
  { id: 6, label: "Spinach", category: "vegetable", taste: { brix: 1 } },
  { id: 7, label: "Dog", category: "animal", mbti: "ENFP" },
  { id: 8, label: "Cat", category: "animal", mbti: "INFP" },
  { id: 9, label: "Elephant", category: "animal", mbti: "ENFP" },
  { id: 10, label: "Lion", category: "animal", mbti: "ISTJ" },
];
```
![example](https://github.com/user-attachments/assets/e0cc3ff0-a5ba-4899-bd78-1da9ca4237aa)


## 예제 앱 실행

```bash
cd example/react
pnpm install
pnpm dev
```

로컬에서 `http://localhost:5173`으로 접속하여 확인하세요.

## 빌드 & 배포

루트 디렉터리에서:

```bash
# 각 패키지 빌드
pnpm --filter multiselect-core run build
pnpm --filter react-multiselect run build

# 전체 빌드
pnpm build
```

## 기여하기

1. 저장소를 Fork합니다.
2. 새로운 브랜치를 만듭니다: `git switch -c feature/your-feature`
3. 변경사항을 커밋합니다: `git commit -m "Add some feature"`
4. 브랜치에 푸시합니다: `git push origin feature/your-feature`
5. Pull Request를 생성합니다.

프로젝트에 기여해 주셔서 감사합니다! 🙏

## 라이선스

MIT © Your Organization

## 지원

버그 리포트 및 피처 요청은 Github Issue를 이용해주세요.
