/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["federatedWorker"] = factory();
	else
		root["federatedWorker"] = factory();
})(self, function() {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"FederatedWorker\": () => (/* reexport safe */ _workerFederated__WEBPACK_IMPORTED_MODULE_0__.FederatedWorker),\n/* harmony export */   \"JobStatePerType\": () => (/* reexport safe */ _workerFederated__WEBPACK_IMPORTED_MODULE_0__.JobStatePerType)\n/* harmony export */ });\n/* harmony import */ var _workerFederated__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./workerFederated */ \"./src/workerFederated/index.ts\");\n\n\n\n//# sourceURL=webpack://federatedWorker/./src/index.ts?");

/***/ }),

/***/ "./src/workerFederated/federatedWorker.ts":
/*!************************************************!*\
  !*** ./src/workerFederated/federatedWorker.ts ***!
  \************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"FederatedWorker\": () => (/* binding */ FederatedWorker)\n/* harmony export */ });\n/* harmony import */ var _remoteFederated_worker_ts__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./remoteFederated.worker.ts */ \"./src/workerFederated/remoteFederated.worker.ts\");\n\nconst urlRegex = /blob:(.+)/;\nfunction v4UUID() {\n    // https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid\n    // @ts-ignore: I know how strange this looks but it works\n    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) => (c ^\n        (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16));\n}\nclass FederatedWorker {\n    constructor(debug = false) {\n        this.debug = debug;\n        this.worker = new _remoteFederated_worker_ts__WEBPACK_IMPORTED_MODULE_0__[\"default\"]();\n        this.initializeFederatedWorker(this.worker);\n    }\n    initializeFederatedWorker(worker, eventHandlers) {\n        worker.addEventListener(\"message\", (event) => {\n            // Primaly used to import scripts without cross origin concerns\n            // Please see: https://stackoverflow.com/questions/21913673/execute-web-worker-from-different-origin\n            if (event.data.type === \"IMPORT_SCRIPT_START\") {\n                if (this.debug) {\n                    console.debug(event);\n                }\n                if (!worker) {\n                    throw new Error(\"How did this message get here?\");\n                }\n                const { id, parentJob, state } = event.data;\n                const { url, host } = state;\n                const urlMatch = url.match(urlRegex);\n                let correctURL = url;\n                // If this was rust it would look prettier :(\n                if (urlMatch === null || urlMatch === void 0 ? void 0 : urlMatch[1]) {\n                    correctURL = urlMatch[1];\n                }\n                if (host) {\n                    const newHost = new URL(correctURL);\n                    newHost.host = host; // There is a check above\n                    worker.postMessage({\n                        type: \"IMPORT_SCRIPT_END\",\n                        done: true,\n                        state: {\n                            url: newHost.toString(),\n                            host,\n                        },\n                        id,\n                        parentJob,\n                    });\n                }\n                else {\n                    worker.postMessage({\n                        type: \"IMPORT_SCRIPT_END\",\n                        done: true,\n                        id,\n                        parentJob,\n                        state,\n                    });\n                }\n            }\n        });\n        worker.addEventListener(\"message\", (event) => {\n            if (event.data.type === \"IMPORT_MODULE_END\" &&\n                (eventHandlers === null || eventHandlers === void 0 ? void 0 : eventHandlers.onModuleLoad)) {\n                const { state } = event.data;\n                const { module, scope } = state;\n                eventHandlers.onModuleLoad(`${scope}\\\\${module}`);\n            }\n        });\n        worker.addEventListener(\"message\", (event) => {\n            if (event.data.type === \"ASYNC_METHOD_RETURN\" &&\n                (eventHandlers === null || eventHandlers === void 0 ? void 0 : eventHandlers.onMethodResult)) {\n                const { state: { result }, } = event.data;\n                eventHandlers.onMethodResult(result);\n            }\n        });\n        return worker;\n    }\n    runWorkerJob(jobType, state, cb) {\n        return new Promise((res, rej) => {\n            const id = v4UUID();\n            const job = {\n                type: jobType,\n                parentJob: id,\n                state,\n            };\n            if (this.debug) {\n                console.debug(job);\n            }\n            const moduleError = (msg) => {\n                // Cleaning up handlers\n                this.worker.removeEventListener(\"message\", moduleFinished);\n                this.worker.removeEventListener(\"error\", moduleError);\n                rej(msg.error);\n            };\n            const moduleFinished = (msg) => {\n                if (this.debug) {\n                    console.debug(msg);\n                }\n                // Only matching if the parentJob ID is equivaltent to one sent\n                if (msg.data.parentJob === id) {\n                    // Cleaning up handlers\n                    this.worker.removeEventListener(\"error\", moduleError);\n                    this.worker.removeEventListener(\"message\", moduleFinished);\n                    res(cb ? cb(msg.data.state) : msg.data.state);\n                }\n            };\n            this.worker.addEventListener(\"message\", moduleFinished);\n            this.worker.addEventListener(\"error\", moduleError);\n            this.worker.postMessage(job);\n        });\n    }\n    addModule(importModuleState) {\n        if (!importModuleState.module ||\n            !importModuleState.scope ||\n            !importModuleState.url) {\n            throw new Error(`Invalid Module Import Object passed please ensure module, scope, and url are strings`);\n        }\n        return this.runWorkerJob(\"IMPORT_MODULE\", importModuleState, (state) => `${state.scope}\\\\${state.module}`);\n    }\n    runMethod(method, wait) {\n        if (wait) {\n            return this.runWorkerJob(\"ASYNC_METHOD_CALL\", method);\n        }\n        else {\n            this.worker.postMessage({\n                type: \"ASYNC_METHOD_CALL\",\n                state: method,\n            });\n        }\n    }\n}\n\n\n//# sourceURL=webpack://federatedWorker/./src/workerFederated/federatedWorker.ts?");

/***/ }),

/***/ "./src/workerFederated/index.ts":
/*!**************************************!*\
  !*** ./src/workerFederated/index.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"FederatedWorker\": () => (/* reexport safe */ _federatedWorker__WEBPACK_IMPORTED_MODULE_0__.FederatedWorker),\n/* harmony export */   \"JobStatePerType\": () => (/* reexport safe */ _types__WEBPACK_IMPORTED_MODULE_1__.JobStatePerType)\n/* harmony export */ });\n/* harmony import */ var _federatedWorker__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./federatedWorker */ \"./src/workerFederated/federatedWorker.ts\");\n/* harmony import */ var _types__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./types */ \"./src/workerFederated/types.ts\");\n\n\n\n\n//# sourceURL=webpack://federatedWorker/./src/workerFederated/index.ts?");

/***/ }),

/***/ "./src/workerFederated/types.ts":
/*!**************************************!*\
  !*** ./src/workerFederated/types.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"JobStatePerType\": () => (/* binding */ JobStatePerType)\n/* harmony export */ });\nclass JobStatePerType {\n}\n\n\n//# sourceURL=webpack://federatedWorker/./src/workerFederated/types.ts?");

/***/ }),

/***/ "./src/workerFederated/remoteFederated.worker.ts":
/*!*******************************************************!*\
  !*** ./src/workerFederated/remoteFederated.worker.ts ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ Worker_fn)\n/* harmony export */ });\n/* harmony import */ var _node_modules_worker_loader_dist_runtime_inline_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !!../../node_modules/worker-loader/dist/runtime/inline.js */ \"./node_modules/worker-loader/dist/runtime/inline.js\");\n/* harmony import */ var _node_modules_worker_loader_dist_runtime_inline_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_worker_loader_dist_runtime_inline_js__WEBPACK_IMPORTED_MODULE_0__);\n\n\n\nfunction Worker_fn() {\n  return _node_modules_worker_loader_dist_runtime_inline_js__WEBPACK_IMPORTED_MODULE_0___default()(\"/*\\n * ATTENTION: The \\\"eval\\\" devtool has been used (maybe by default in mode: \\\"development\\\").\\n * This devtool is neither made for production nor for readable output files.\\n * It uses \\\"eval()\\\" calls to create a separate source file in the browser devtools.\\n * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)\\n * or disable the default devtool with \\\"devtool: false\\\".\\n * If you are looking for production-ready output files, see mode: \\\"production\\\" (https://webpack.js.org/configuration/mode/).\\n */\\n/******/ (() => { // webpackBootstrap\\n/******/ \\t\\\"use strict\\\";\\n/******/ \\tvar __webpack_modules__ = ({\\n\\n/***/ \\\"./node_modules/ts-loader/index.js!./src/workerFederated/remoteFederated.worker.ts\\\":\\n/*!*****************************************************************************************!*\\\\\\n  !*** ./node_modules/ts-loader/index.js!./src/workerFederated/remoteFederated.worker.ts ***!\\n  \\\\*****************************************************************************************/\\n/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {\\n\\neval(\\\"__webpack_require__.r(__webpack_exports__);\\\\nfunction v4UUID() {\\\\n    // https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid\\\\n    // @ts-ignore: I know how strange this looks but it works\\\\n    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) => (c ^\\\\n        (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16));\\\\n}\\\\nself.scripts = [];\\\\nself.jobs = [];\\\\n// @ts-ignore\\\\nself.document = Object.assign(Object.assign({}, self.document), { head: {\\\\n        appendChild: (childNode) => {\\\\n            try {\\\\n                const jobId = v4UUID();\\\\n                // Might need to make a parent job thing\\\\n                const job = {\\\\n                    type: \\\\\\\"IMPORT_SCRIPT_START\\\\\\\",\\\\n                    id: jobId,\\\\n                    state: {\\\\n                        url: childNode.src || childNode.getAttribute(\\\\\\\"src\\\\\\\"),\\\\n                        host: self.host,\\\\n                    },\\\\n                };\\\\n                self.jobs[jobId] = () => {\\\\n                    childNode.onload && childNode.onload();\\\\n                };\\\\n                postMessage(job);\\\\n            }\\\\n            catch (e) {\\\\n                console.error(e);\\\\n                childNode.onerror && childNode.onerror(e);\\\\n            }\\\\n        },\\\\n    }, getElementsByTagName: (element) => {\\\\n        return self.scripts;\\\\n    }, createElement: (element) => {\\\\n        return {\\\\n            src: undefined,\\\\n            attributes: {},\\\\n            getAttribute(attribute) {\\\\n                var _a;\\\\n                return (_a = this.attributes) === null || _a === void 0 ? void 0 : _a[attribute];\\\\n            },\\\\n            setAttribute(attribute, value) {\\\\n                this.attributes[attribute] = value;\\\\n            },\\\\n            onload: undefined,\\\\n            onerror: undefined,\\\\n        };\\\\n    } });\\\\nconst handlers = {\\\\n    ASYNC_METHOD_CALL: (job) => {\\\\n        const { state, id, parentJob } = job;\\\\n        const { args, async, method, module } = state;\\\\n        if (!self[module]) {\\\\n            throw new Error(`Module [${module}] does not exist`);\\\\n        }\\\\n        if (!self[module][method]) {\\\\n            throw new Error(`Method [${method}] does not exist in Module [${module}]`);\\\\n        }\\\\n        let newArgs = Array.isArray(args) ? args : [args];\\\\n        // The method it-self might not be async...\\\\n        if (async) {\\\\n            return self[module][method](...newArgs)\\\\n                .then((result) => {\\\\n                postMessage({\\\\n                    type: \\\\\\\"ASYNC_METHOD_RETURN\\\\\\\",\\\\n                    state: {\\\\n                        method,\\\\n                        module,\\\\n                        result,\\\\n                    },\\\\n                    parentJob,\\\\n                    id,\\\\n                });\\\\n                return Promise.resolve(true);\\\\n            })\\\\n                .catch((error) => {\\\\n                console.error(error);\\\\n                return Promise.resolve(false);\\\\n            });\\\\n        }\\\\n        else {\\\\n            try {\\\\n                const result = self[module][method](...newArgs);\\\\n                postMessage({\\\\n                    type: \\\\\\\"ASYNC_METHOD_RETURN\\\\\\\",\\\\n                    state: {\\\\n                        method,\\\\n                        module,\\\\n                        result,\\\\n                    },\\\\n                    parentJob,\\\\n                    id,\\\\n                });\\\\n                if (id) {\\\\n                    return true;\\\\n                }\\\\n            }\\\\n            catch (e) {\\\\n                console.error(e);\\\\n                return false;\\\\n            }\\\\n        }\\\\n    },\\\\n    IMPORT_MODULE: (job) => {\\\\n        const { state } = job;\\\\n        const { module, scope, url } = state;\\\\n        // Parse Module Map\\\\n        // Order all scripts\\\\n        // Load Federated Module\\\\n        const parsedURL = new URL(url);\\\\n        self.host = parsedURL.host;\\\\n        importScripts(url);\\\\n        self[scope].get\\\\n            .bind(self)(module)\\\\n            .then((remoteModule) => {\\\\n            self[module] = remoteModule();\\\\n            // reset scope so the code know the next can be processed\\\\n            self.host = undefined;\\\\n            postMessage(Object.assign(Object.assign({}, job), { type: \\\\\\\"IMPORT_MODULE_END\\\\\\\", done: true }));\\\\n        });\\\\n    },\\\\n    IMPORT_SCRIPT_START: (job) => {\\\\n        postMessage(job);\\\\n    },\\\\n    IMPORT_SCRIPT_END: (job) => {\\\\n        const { id, state } = job;\\\\n        const { url } = state;\\\\n        if (id && self.jobs[id]) {\\\\n            importScripts(url);\\\\n            self.jobs[id]();\\\\n        }\\\\n        else {\\\\n            importScripts(url);\\\\n        }\\\\n    },\\\\n};\\\\nonmessage = (workerEvent) => {\\\\n    const { type } = workerEvent.data;\\\\n    const handler = handlers[type];\\\\n    if (!handler) {\\\\n        throw new Error(`No handler found for Job [${type}]`);\\\\n    }\\\\n    try {\\\\n        // TODO: Job State mgmt\\\\n        // @ts-ignore: Why have all the extra code of the switch if we can do the same with an ignore 🤷‍♂️\\\\n        handler(workerEvent.data);\\\\n    }\\\\n    catch (e) {\\\\n        // Extra layer of protection\\\\n        console.error(e);\\\\n    }\\\\n};\\\\n\\\\n\\\\n\\\\n//# sourceURL=webpack://federatedWorker/./src/workerFederated/remoteFederated.worker.ts?./node_modules/ts-loader/index.js\\\");\\n\\n/***/ })\\n\\n/******/ \\t});\\n/************************************************************************/\\n/******/ \\t// The require scope\\n/******/ \\tvar __webpack_require__ = {};\\n/******/ \\t\\n/************************************************************************/\\n/******/ \\t/* webpack/runtime/make namespace object */\\n/******/ \\t(() => {\\n/******/ \\t\\t// define __esModule on exports\\n/******/ \\t\\t__webpack_require__.r = (exports) => {\\n/******/ \\t\\t\\tif(typeof Symbol !== 'undefined' && Symbol.toStringTag) {\\n/******/ \\t\\t\\t\\tObject.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });\\n/******/ \\t\\t\\t}\\n/******/ \\t\\t\\tObject.defineProperty(exports, '__esModule', { value: true });\\n/******/ \\t\\t};\\n/******/ \\t})();\\n/******/ \\t\\n/************************************************************************/\\n/******/ \\t\\n/******/ \\t// startup\\n/******/ \\t// Load entry module and return exports\\n/******/ \\t// This entry module can't be inlined because the eval devtool is used.\\n/******/ \\tvar __webpack_exports__ = {};\\n/******/ \\t__webpack_modules__[\\\"./node_modules/ts-loader/index.js!./src/workerFederated/remoteFederated.worker.ts\\\"](0, __webpack_exports__, __webpack_require__);\\n/******/ \\t\\n/******/ })()\\n;\", \"Worker\", undefined, undefined);\n}\n\n\n//# sourceURL=webpack://federatedWorker/./src/workerFederated/remoteFederated.worker.ts?");

/***/ }),

/***/ "./node_modules/worker-loader/dist/runtime/inline.js":
/*!***********************************************************!*\
  !*** ./node_modules/worker-loader/dist/runtime/inline.js ***!
  \***********************************************************/
/***/ ((module) => {

eval("\n\n/* eslint-env browser */\n\n/* eslint-disable no-undef, no-use-before-define, new-cap */\nmodule.exports = function (content, workerConstructor, workerOptions, url) {\n  var globalScope = self || window;\n\n  try {\n    try {\n      var blob;\n\n      try {\n        // New API\n        blob = new globalScope.Blob([content]);\n      } catch (e) {\n        // BlobBuilder = Deprecated, but widely implemented\n        var BlobBuilder = globalScope.BlobBuilder || globalScope.WebKitBlobBuilder || globalScope.MozBlobBuilder || globalScope.MSBlobBuilder;\n        blob = new BlobBuilder();\n        blob.append(content);\n        blob = blob.getBlob();\n      }\n\n      var URL = globalScope.URL || globalScope.webkitURL;\n      var objectURL = URL.createObjectURL(blob);\n      var worker = new globalScope[workerConstructor](objectURL, workerOptions);\n      URL.revokeObjectURL(objectURL);\n      return worker;\n    } catch (e) {\n      return new globalScope[workerConstructor](\"data:application/javascript,\".concat(encodeURIComponent(content)), workerOptions);\n    }\n  } catch (e) {\n    if (!url) {\n      throw Error(\"Inline worker is not supported\");\n    }\n\n    return new globalScope[workerConstructor](url, workerOptions);\n  }\n};\n\n//# sourceURL=webpack://federatedWorker/./node_modules/worker-loader/dist/runtime/inline.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
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
/******/ 	var __webpack_exports__ = __webpack_require__("./src/index.ts");
/******/ 	
/******/ 	return __webpack_exports__;
/******/ })()
;
});