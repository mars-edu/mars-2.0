import "pinia";

declare module "pinia" {
  export interface DefineSetupStoreOptions<Id, S, G, A> {
    persist?:
      | boolean
      | {
          key?: string;
          storage?: Storage;
          paths?: string[];
          [key: string]: any;
        };
  }
}
