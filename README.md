# iOS Simulator Action

Create a configurable iOS Simulator on a macOS GitHub Actions runner. The action resolves the requested iOS runtime and device type, creates a uniquely named device, and automatically deletes devices created by the action in its `post` step. It also removes XCTest simulator clones created by `xcodebuild` during the job while preserving clones that existed before the action started.

```yaml
- name: Create simulator
  id: simulator
  uses: pluxlabs/ios-simulator-action@v1
  with:
    device-type: iPad mini (A17 Pro)
    runtime: latest
    name-prefix: Hearth CI

- name: Test
  run: xcodebuild test -destination "id=${{ steps.simulator.outputs.device-id }}"
```

Inputs accept a device type name or identifier and an iOS runtime version, name, identifier, or `latest`. Set `reuse-existing: true` to reuse an available matching device with the requested prefix; reused devices are never deleted.

The action requires a macOS runner with Xcode and `xcrun simctl`. Pin consumers to a release tag such as `@v1`.

No Python or third-party runtime is required.
