import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import {
  configureAndroidLocalRouting,
  LOCAL_SECURITY_XML,
  patchAndroidManifest,
} from './configure-android-local-routing.mjs'

describe('Android 9router local HTTP policy', () => {
  it('allows loopback without globally enabling cleartext', () => {
    assert.match(LOCAL_SECURITY_XML, /127\.0\.0\.1/)
    assert.match(LOCAL_SECURITY_XML, /localhost/)
    assert.match(LOCAL_SECURITY_XML, /<base-config cleartextTrafficPermitted="false"/)
    assert.doesNotMatch(LOCAL_SECURITY_XML, /<base-config cleartextTrafficPermitted="true"/)
  })

  it('configures the native Android manifest idempotently', () => {
    const root = mkdtempSync(join(tmpdir(), 'chatbox-android-'))
    try {
      const manifest = join(root, 'android/app/src/main/AndroidManifest.xml')
      mkdirSync(dirname(manifest), { recursive: true })
      writeFileSync(manifest, '<manifest xmlns:android="http://schemas.android.com/apk/res/android"><application android:label="test"></application></manifest>')
      configureAndroidLocalRouting(root)
      const first = readFileSync(manifest, 'utf8')
      assert.match(first, /networkSecurityConfig="@xml\/chatbox_local_network_security"/)
      assert.doesNotMatch(first, /usesCleartextTraffic/)
      configureAndroidLocalRouting(root)
      assert.equal(readFileSync(manifest, 'utf8'), first)
      assert.equal(readFileSync(join(root, 'android/app/src/main/res/xml/chatbox_local_network_security.xml'), 'utf8'), LOCAL_SECURITY_XML)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('does not silently override a preexisting unrelated policy', () => {
    assert.throws(() => patchAndroidManifest('<application android:networkSecurityConfig="@xml/company_policy" />'), /incompatible/)
    assert.throws(() => patchAndroidManifest('<manifest />'), /Missing/)
  })
})
