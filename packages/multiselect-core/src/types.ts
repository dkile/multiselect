export type ID = string | number | bigint;

export type StrictAccessor<Data> = string | ((item: Data) => ID);

export type Accessor<Data> = string | ((item: Data) => ID | undefined);
