const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');

test('creates the requested simulator and writes outputs/state', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ios-simulator-action-'));
  const mock = path.join(directory, 'xcrun');
  fs.writeFileSync(mock, `#!/usr/bin/env node
const args = process.argv.slice(2);
if (args.join(' ') === 'simctl list runtimes available -j') {
  console.log(JSON.stringify({ runtimes: [{ platform: 'iOS', name: 'iOS 26.5', version: '26.5', identifier: 'runtime-26-5', isAvailable: true, supportedDeviceTypes: [{ name: 'iPad mini', identifier: 'device-ipad-mini' }] }] }));
} else if (args.join(' ') === 'simctl list devices available -j') {
  console.log(JSON.stringify({ devices: {} }));
} else if (args.join(' ') === 'simctl --set /tmp/ios-simulator-action-test/Library/Developer/XCTestDevices list devices available -j') {
  console.log(JSON.stringify({ devices: {} }));
} else if (args.join(' ') === 'simctl create Test CI iPad mini 123 device-ipad-mini runtime-26-5') {
  console.log('created-udid');
} else {
  process.exit(1);
}
`);
  fs.chmodSync(mock, 0o755);
  const output = path.join(directory, 'output');
  const state = path.join(directory, 'state');
  const result = spawnSync(process.execPath, ['src/main.js'], {
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      PATH: `${directory}:${process.env.PATH}`,
      'INPUT_DEVICE-TYPE': 'iPad mini',
      INPUT_RUNTIME: '26.5',
      'INPUT_NAME-PREFIX': 'Test CI',
      'INPUT_REUSE-EXISTING': 'false',
      GITHUB_OUTPUT: output,
      GITHUB_STATE: state,
      GITHUB_RUN_ID: '123',
      HOME: '/tmp/ios-simulator-action-test',
    },
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(fs.readFileSync(output, 'utf8'), /device-id[\s\S]*created-udid/);
  assert.match(fs.readFileSync(state, 'utf8'), /device-id[\s\S]*created-udid/);
  assert.match(result.stdout, /Created Test CI iPad mini/);
});
