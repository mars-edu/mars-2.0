import { customMutation, customCtx } from "convex-helpers/server/customFunctions";
import { 
  query as baseQuery, 
  internalQuery as baseInternalQuery, 
  mutation as baseMutation, 
  internalMutation as baseInternalMutation,
  action as baseAction,
  internalAction as baseInternalAction,
  httpAction as baseHttpAction
} from "./_generated/server";
import { DataModel, Id } from "./_generated/dataModel";
import { GenericDatabaseWriter, WithoutSystemFields, DocumentByName, TableNamesInDataModel } from "convex/server";

type OmitTimestamps<T> = Omit<T, "createdAt" | "updatedAt">;

export type TimestampedDatabaseWriter = Omit<GenericDatabaseWriter<DataModel>, "insert" | "patch"> & {
  insert<TableName extends TableNamesInDataModel<DataModel>>(
    table: TableName,
    value: OmitTimestamps<WithoutSystemFields<DocumentByName<DataModel, TableName>>>
  ): Promise<Id<TableName>>;
  
  patch<TableName extends TableNamesInDataModel<DataModel>>(
    id: Id<TableName>,
    value: Partial<OmitTimestamps<DocumentByName<DataModel, TableName>>>
  ): Promise<void>;
};

function wrapDatabaseWriter(db: GenericDatabaseWriter<DataModel>): TimestampedDatabaseWriter {
  const wrapped = {
    ...db,
    insert: async (table: any, value: any) => {
      const now = new Date().toISOString();
      return db.insert(table, { ...value, createdAt: now, updatedAt: now });
    },
    patch: async (id: any, value: any) => {
      const now = new Date().toISOString();
      return db.patch(id, { ...value, updatedAt: now });
    }
  };
  return wrapped as unknown as TimestampedDatabaseWriter;
}

export const query = baseQuery;
export const internalQuery = baseInternalQuery;
export const action = baseAction;
export const internalAction = baseInternalAction;
export const httpAction = baseHttpAction;

export const mutation = customMutation(baseMutation, customCtx(async (ctx) => {
  return { db: wrapDatabaseWriter(ctx.db as unknown as GenericDatabaseWriter<DataModel>) };
}));

export const internalMutation = customMutation(baseInternalMutation, customCtx(async (ctx) => {
  return { db: wrapDatabaseWriter(ctx.db as unknown as GenericDatabaseWriter<DataModel>) };
}));
