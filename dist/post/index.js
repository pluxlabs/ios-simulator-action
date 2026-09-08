/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 474:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const fs = __nccwpck_require__(24);

function input(name, required = false) {
  const value = (process.env[`INPUT_${name.toUpperCase()}`] || '').trim();
  if (required && !value) throw new Error(`${name} is required`);
  return value;
}

function booleanInput(name) {
  return ['true', '1', 'yes'].includes(input(name).toLowerCase());
}

function writeCommand(file, name, value) {
  const delimiter = `ios_simulator_action_${process.pid}_${Date.now()}`;
  fs.appendFileSync(file, `${name}<<${delimiter}\n${value}\n${delimiter}\n`);
}

function setOutput(name, value) {
  writeCommand(process.env.GITHUB_OUTPUT, name, value);
}

function saveState(name, value) {
  writeCommand(process.env.GITHUB_STATE, name, value);
}

function info(message) {
  console.log(message);
}

function warning(message) {
  console.warn(`Warning: ${message}`);
}

function setFailed(error) {
  console.error(`Error: ${error}`);
  process.exitCode = 1;
}

function state(name) {
  return process.env[`STATE_${name}`] || '';
}

module.exports = { booleanInput, info, input, saveState, setFailed, setOutput, state, warning };


/***/ }),

/***/ 421:
/***/ ((module) => {

"use strict";
module.exports = require("node:child_process");

/***/ }),

/***/ 24:
/***/ ((module) => {

"use strict";
module.exports = require("node:fs");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
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
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
const { execFileSync } = __nccwpck_require__(421);
const github = __nccwpck_require__(474);

const deviceId = github.state('device-id');
if (deviceId && github.state('created') === 'true') {
  try {
    execFileSync('xcrun', ['simctl', 'shutdown', deviceId], { stdio: 'ignore' });
  } catch {}
  try {
    execFileSync('xcrun', ['simctl', 'delete', deviceId], { stdio: 'ignore' });
    github.info(`Deleted temporary simulator ${deviceId}`);
  } catch (error) {
    github.warning(`Could not delete temporary simulator ${deviceId}: ${error.message}`);
  }
}

module.exports = __webpack_exports__;
/******/ })()
;