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

/***/ }),

/***/ 760:
/***/ ((module) => {

"use strict";
module.exports = require("node:path");

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
const path = __nccwpck_require__(760);
const github = __nccwpck_require__(474);

function simctl(args) {
  return execFileSync('xcrun', ['simctl', ...args], { encoding: 'utf8' }).trim();
}

function json(args) {
  return JSON.parse(simctl([...args, '-j']));
}

function xctestDeviceSet() {
  return path.join(process.env.HOME || '', 'Library', 'Developer', 'XCTestDevices');
}

function listDeviceIds(deviceSet) {
  try {
    const args = deviceSet ? ['--set', deviceSet, 'list', 'devices', 'available'] : ['list', 'devices', 'available'];
    const devices = json(args).devices || {};
    return Object.values(devices).flat().map((device) => device.udid);
  } catch {
    return [];
  }
}

function resolveRuntime(input, runtimes) {
  const available = runtimes.filter((runtime) => runtime.isAvailable && runtime.platform === 'iOS');
  if (input === 'latest') {
    return available.sort((a, b) => compareVersions(b.version, a.version))[0];
  }
  return available.find((runtime) => runtime.identifier === input || runtime.version === input || runtime.name === input);
}

function compareVersions(left, right) {
  return left.localeCompare(right, undefined, { numeric: true });
}

function resolveDeviceType(input, runtime) {
  return runtime.supportedDeviceTypes.find(
    (device) => device.identifier === input || device.name === input,
  );
}

function main() {
  const deviceTypeInput = github.input('device-type', true);
  const runtimeInput = github.input('runtime', true);
  const namePrefix = github.input('name-prefix', true);
  const reuseExisting = github.booleanInput('reuse-existing');
  if (!namePrefix) throw new Error('name-prefix must not be empty');

  const deviceSet = xctestDeviceSet();
  github.saveState('core-simulator-baseline-ids', JSON.stringify(listDeviceIds('')));
  github.saveState('xctest-device-set', deviceSet);
  github.saveState('xctest-baseline-ids', JSON.stringify(listDeviceIds(deviceSet)));

  const runtimes = json(['list', 'runtimes', 'available']).runtimes;
  const runtime = resolveRuntime(runtimeInput, runtimes);
  if (!runtime) throw new Error(`No available iOS runtime matches: ${runtimeInput}`);
  const deviceType = resolveDeviceType(deviceTypeInput, runtime);
  if (!deviceType) throw new Error(`No ${deviceTypeInput} device type is supported by ${runtime.name}`);

  let device;
  let created = false;
  if (reuseExisting) {
    const devices = json(['list', 'devices', 'available']).devices[runtime.identifier] || [];
    device = devices.find(
      (candidate) => candidate.name.startsWith(`${namePrefix} `) && candidate.deviceTypeIdentifier === deviceType.identifier,
    );
  }
  if (!device) {
    const uniqueName = `${namePrefix} ${deviceType.name} ${process.env.GITHUB_RUN_ID || process.pid}`;
    const deviceId = simctl(['create', uniqueName, deviceType.identifier, runtime.identifier]);
    device = { udid: deviceId, name: uniqueName };
    created = true;
  }

  github.setOutput('device-id', device.udid);
  github.setOutput('device-name', device.name);
  github.setOutput('created', String(created));
  github.saveState('device-id', device.udid);
  github.saveState('created', String(created));
  github.info(`${created ? 'Created' : 'Reused'} ${device.name} (${device.udid})`);
}

try {
  main();
} catch (error) {
  github.setFailed(error instanceof Error ? error.message : String(error));
}

module.exports = __webpack_exports__;
/******/ })()
;