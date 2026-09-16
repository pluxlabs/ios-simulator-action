const { execFileSync } = require('node:child_process');
const github = require('./github');

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
