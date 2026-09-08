const fs = require('node:fs');

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
