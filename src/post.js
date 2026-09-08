const { execFileSync } = require('node:child_process');
const github = require('./github');

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
