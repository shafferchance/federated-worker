/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
var federatedWorkerLib;
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/workerFederated/remoteFederated.worker.ts":
/*!*******************************************************!*\
  !*** ./src/workerFederated/remoteFederated.worker.ts ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\nfunction v4UUID() {\n    // https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid\n    // @ts-ignore: I know how strange this looks but it works\n    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) => (c ^\n        (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16));\n}\nself.scripts = [];\nself.jobs = [];\n// @ts-ignore\nself.document = Object.assign(Object.assign({}, self.document), { head: {\n        appendChild: (childNode) => {\n            console.log(\"Appending: \", childNode);\n            try {\n                const jobId = v4UUID();\n                // Might need to make a parent job thing\n                const job = {\n                    type: \"IMPORT_SCRIPT_START\",\n                    id: jobId,\n                    state: {\n                        url: childNode.src || childNode.getAttribute(\"src\"),\n                        host: self.host,\n                    },\n                };\n                self.jobs[jobId] = () => {\n                    console.log(\"Resolving fetch\");\n                    childNode.onload && childNode.onload();\n                };\n                postMessage(job);\n            }\n            catch (e) {\n                console.error(e);\n                childNode.onerror && childNode.onerror(e);\n            }\n        },\n    }, getElementsByTagName: (element) => {\n        return self.scripts;\n    }, createElement: (element) => {\n        console.log(\"creating\");\n        return {\n            src: undefined,\n            attributes: {},\n            getAttribute(attribute) {\n                var _a;\n                return (_a = this.attributes) === null || _a === void 0 ? void 0 : _a[attribute];\n            },\n            setAttribute(attribute, value) {\n                this.attributes[attribute] = value;\n            },\n            onload: undefined,\n            onerror: undefined,\n        };\n    } });\nconsole.log(self);\nconst handlers = {\n    ASYNC_METHOD_CALL: (job) => {\n        const { state, id } = job;\n        const { args, async, method, module } = state;\n        if (!self[module]) {\n            throw new Error(`Module [${module}] does not exist`);\n        }\n        if (!self[module][method]) {\n            throw new Error(`Method [${method}] does not exist in Module [${module}]`);\n        }\n        let newArgs = Array.isArray(args) ? args : [args];\n        // The method it-self might not be async...\n        if (async) {\n            return self[module][method](...newArgs)\n                .then((result) => {\n                postMessage({\n                    type: \"ASYNC_METHOD_RETURN\",\n                    state: {\n                        method,\n                        module,\n                        result,\n                    },\n                    id,\n                });\n                return Promise.resolve(true);\n            })\n                .catch((error) => {\n                console.error(error);\n                return Promise.resolve(false);\n            });\n        }\n        else {\n            try {\n                const result = self[module][method](...newArgs);\n                postMessage({\n                    type: \"ASYNC_METHOD_RETURN\",\n                    state: {\n                        method,\n                        module,\n                        result,\n                    },\n                    id,\n                });\n                if (id) {\n                    return true;\n                }\n            }\n            catch (e) {\n                console.error(e);\n                return false;\n            }\n        }\n    },\n    IMPORT_MODULE: (job) => {\n        const { state } = job;\n        const { module, scope, url } = state;\n        // Parse Module Map\n        // Order all scripts\n        // Load Federated Module\n        const parsedURL = new URL(url);\n        self.host = parsedURL.host;\n        importScripts(url);\n        self[scope].get\n            .bind(self)(module)\n            .then((remoteModule) => {\n            self[module] = remoteModule();\n            console.log(self[module]);\n            // reset scope so the code know the next can be processed\n            self.host = undefined;\n            console.log(self);\n            postMessage(Object.assign(Object.assign({}, job), { type: \"IMPORT_MODULE_END\", done: true }));\n        });\n    },\n    IMPORT_SCRIPT_START: (job) => {\n        postMessage(job);\n    },\n    IMPORT_SCRIPT_END: (job) => {\n        const { id, state } = job;\n        const { url } = state;\n        console.log(\"Fetching script: \", job);\n        if (id && self.jobs[id]) {\n            importScripts(url);\n            self.jobs[id]();\n        }\n        else {\n            importScripts(url);\n        }\n        // TODO: resolve done\n    },\n};\nonmessage = (workerEvent) => {\n    const { type } = workerEvent.data;\n    const handler = handlers[type];\n    if (!handler) {\n        throw new Error(`No handler found for Job [${type}]`);\n    }\n    try {\n        // TODO: Job State mgmt\n        // @ts-ignore: Why have all the extra code of the switch if we can do the same with an ignore 🤷‍♂️\n        handler(workerEvent.data);\n    }\n    catch (e) {\n        // Extra layer of protection\n        console.error(e);\n    }\n};\n\n\n\n//# sourceURL=webpack://federatedWorkerLib/./src/workerFederated/remoteFederated.worker.ts?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/workerFederated/remoteFederated.worker.ts"](0, __webpack_exports__, __webpack_require__);
/******/ 	federatedWorkerLib = __webpack_exports__;
/******/ 	
/******/ })()
;