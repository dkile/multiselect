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
import React, { useState } from "react";
import {
  useMultiSelect,
  CollapsePositionFirst,
  CollapsePositionLast,
} from "react-multiselect";

interface ItemData {
  id: number;
  label: string;
  category: string;
}

export function App() {
  const [search, setSearch] = useState("");
  const ms = useMultiSelect<ItemData>({
    data,
    itemDef: { id_accessor: (item) => item.id },
    filter: {
      query: search,
      predicate: (item, q) =>
        item.label.toLowerCase().includes(q.toLowerCase()),
    },
    groupBy: [(item) => item.category],
  });

  return (
    <div>
      {/* 검색 */}
      <input
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* 액션 */}
      <button onClick={() => ms.selectAll()}>Select All</button>
      <button onClick={() => ms.unselectAll()}>Clear All</button>

      {/* 결과 */}
      <h3>Filtered Items</h3>
      <pre>{JSON.stringify(ms.getItems({ filteredOnly: true }), null, 2)}</pre>

      <h3>Group Tree</h3>
      <pre>
        {JSON.stringify(
          ms.getGroupTree({ filter: { filteredOnly: true } }),
          null,
          2
        )}
      </pre>

      <h3>Collapsed Selection</h3>
      <ul>
        {ms
          .getCollapsedSelection({
            filteredOnly: true,
            positionStrategy: CollapsePositionFirst,
          })
          .map((node) =>
            node.type === "group" ? (
              <li key={node.node.key}>Group: {node.node.path.join(" > ")}</li>
            ) : (
              <li key={node.node.id}>{node.node.data.label}</li>
            )
          )}
      </ul>
    </div>
  );
}
```

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

## 문서

- API 레퍼런스: [multiselect-core Docs](https://github.com/your-org/select-example/tree/main/packages/multiselect-core#readme)
- React Hook: [react-multiselect Docs](https://github.com/your-org/select-example/tree/main/packages/react-multiselect#readme)

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
