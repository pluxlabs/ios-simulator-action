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

function simctl(args) {
  return execFileSync('xcrun', ['simctl', ...args], { encoding: 'utf8' }).trim();
}

function json(args) {
  return JSON.parse(simctl([...args, '-j']));
}

function currentDeviceIds(deviceSet) {
  try {
    const args = deviceSet ? ['--set', deviceSet, 'list', 'devices', 'available'] : ['list', 'devices', 'available'];
    const devices = json(args).devices || {};
    return Object.values(devices).flat().map((device) => device.udid);
  } catch {
    return [];
  }
}

function deleteDevices(deviceSet, baseline) {
  for (const id of currentDeviceIds(deviceSet).filter((candidate) => !baseline.has(candidate))) {
    const prefix = deviceSet ? ['--set', deviceSet] : [];
    try {
      simctl([...prefix, 'shutdown', id]);
    } catch {}
    try {
      simctl([...prefix, 'delete', id]);
      github.info(`Deleted temporary ${deviceSet ? 'XCTest ' : ''}device ${id}`);
    } catch (error) {
      github.warning(`Could not delete temporary ${deviceSet ? 'XCTest ' : ''}device ${id}: ${error.message}`);
    }
  }
}

const deviceId = github.state('device-id');
if (deviceId && github.state('created') === 'true') {
  try {
    simctl(['shutdown', deviceId]);
  } catch {}
  try {
    simctl(['delete', deviceId]);
    github.info(`Deleted temporary simulator ${deviceId}`);
  } catch (error) {
    github.warning(`Could not delete temporary simulator ${deviceId}: ${error.message}`);
  }
}

const coreBaseline = github.state('core-simulator-baseline-ids');
if (coreBaseline) {
  deleteDevices('', new Set(JSON.parse(coreBaseline)));
  const deviceSet = github.state('xctest-device-set');
  deleteDevices(deviceSet, new Set(JSON.parse(github.state('xctest-baseline-ids') || '[]')));
}

module.exports = __webpack_exports__;
/******/ })()
;