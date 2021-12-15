import { AsyncCallState, ImportModuleState, ModuleReturn } from "./types";
export declare class FederatedWorker {
  debug: boolean;
  worker: Worker;
  constructor(debug?: boolean);
  private initializeFederatedWorker;
  private runWorkerJob;
  addModule(importModuleState: ImportModuleState): Promise<ModuleReturn>;
  runMethod<T>(
    method: AsyncCallState,
    wait?: boolean
  ): Promise<T | ModuleReturn> | void;
}
