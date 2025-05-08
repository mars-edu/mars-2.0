export interface ColumnNode {
  id: string;
  name: string;
  children_of: string | null;
}

export interface ColumnHierarchy {
  topLevelColumns: ColumnNode[];
  childrenMap: Record<string, ColumnNode[]>;
}
