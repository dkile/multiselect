import { useRef, useState, useEffect } from "react";
import {
  createMultiSelect,
  rafScheduler,
  type MultiSelectOptions,
  type MultiSelect,
} from "multiselect-core";

export function useMultiSelect<Data, Meta = unknown, GroupHeader = unknown>(
  options: MultiSelectOptions<Data, Meta, GroupHeader>
): MultiSelect<Data, Meta, GroupHeader> {
  const coreRef = useRef(
    createMultiSelect<Data, Meta, GroupHeader>({
      ...options,
      scheduler: rafScheduler,
    })
  );

  coreRef.current.setFilter(options.filter);

  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = coreRef.current.subscribe(() => {
      setTick((t) => t + 1);
    });

    return unsubscribe;
  }, []);

  return coreRef.current;
}

export { CollapsePositionFirst, CollapsePositionLast } from "multiselect-core";
export type { PositionStrategy } from "multiselect-core";
