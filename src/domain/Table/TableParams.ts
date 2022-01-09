interface TableParams {
  labels: {
    rows: string[];
    columns: string[];
  };
  groups: {
    rows: {
      range: [number, number];
      collapsed: boolean;
    }[];
  };
}

export type { TableParams };
