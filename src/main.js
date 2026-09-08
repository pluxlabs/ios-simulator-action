const { execFileSync } = require('node:child_process');
const github = require('./github');

function simctl(args) {
  return execFileSync('xcrun', ['simctl', ...args], { encoding: 'utf8' }).trim();
}

function json(args) {
  return JSON.parse(simctl([...args, '-j']));
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
