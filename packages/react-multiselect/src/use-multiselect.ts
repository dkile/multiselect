import { useRef, useState, useEffect } from "react";
import {
  createMultiSelect,
  rafScheduler,
  type MultiSelectOptions,
  type MultiSelect,
} from "multiselect-core";

export function useMultiSelect<Data, Meta>(
  options: MultiSelectOptions<Data, Meta>
): MultiSelect<Data, Meta> {
  const coreRef = useRef(
    createMultiSelect<Data, Meta>({ ...options, scheduler: rafScheduler })
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
