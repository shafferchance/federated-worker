## ⚠️ This is Experimental! ⚠️

<br>

# Welcome to Federated-Workers

## Why?

      This package is for those who want to move their federated modules to execute off of the main theread. This was required to be flexible enough that it could load in any package. It was designed to work with federated modules, however, it will most likely work with any webpack build package (this is untested).

## Examples

```typescript
import { FederatedWorker } from "federated-worker";

async function exampleWorker () {
  // This will spin up the base worker and connect the listeners
  const worker = new FederatedWorker();

  // Load a federated module/package -> Promise<ModuleReturn>
  const someModule = await worker.addModule({
    module: ["Exposed Module"]
    scope: ["Name of Federated Module"]
    url: ["URL to Package/Module"]
  })

  // To execute method from imported module
  // -> Promise<T | ModuleReturn | void>
  const result = await worker.runMethod<string>({
    method: ["Function name"]
    module: ["Module Name"]
  }, async?: boolean)

  return result
}
```

## Theorectical Uses

- **_Composed Workers_**
  - The way this is designed is that when the module is executed after the get successfully downloads and links dependencies. If the module has `globalThis` or `self` in for the methods they will **_automatically_** be added to the worker's global scope.
- **_Import normal packages_**
  - There will likely need to be some changes to the addModule method or just a new method.
  - **NOTE**: The worker is exposed as `worker.worker` and in theory you can send the `IMPORT_SCRIPT_END` job manually and this will import a regular script into the worker.
