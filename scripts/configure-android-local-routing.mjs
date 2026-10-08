import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SECURITY_NAME = '@xml/chatbox_local_network_security'
const ATTRIBUTE = 'android:networkSecurityConfig="' + SECURITY_NAME + '"'

/**
 * Explicitly allow unencrypted HTTP only to Android device loopback.
 * The build must NOT set android:usesCleartextTraffic=true globally:
 * that would weaken every unrelated remote provider connection.
 */
export const LOCAL_SECURITY_XML = [
  '<?xml version="1.0" encoding="utf-8"?>',
  '<network-security-config>',
  '  <base-config cleartextTrafficPermitted="false" />',
  '  <domain-config cleartextTrafficPermitted="true">',
  '    <domain includeSubdomains="false">127.0.0.1</domain>',
  '    <domain includeSubdomains="false">localhost</domain>',
  '  </domain-config>',
  '</network-security-config>',
  '',
].join('\n')

export function patchAndroidManifest(contents) {
  if (contents.includes('android:networkSecurityConfig=')) {
    if (!contents.includes(ATTRIBUTE)) {
      throw new Error('AndroidManifest.xml already has an incompatible networkSecurityConfig')
    }
    return contents
  }
  if (!contents.includes('<application')) throw new Error('Missing <application> tag')
  return contents.replace('<application', '<application ' + ATTRIBUTE)
}

export function configureAndroidLocalRouting(root = process.cwd()) {
  const manifest = join(root, 'android/app/src/main/AndroidManifest.xml')
  if (!existsSync(manifest)) {
    throw new Error('Generate Android using cap add android and cap sync android first')
  }
  const data = readFileSync(manifest, 'utf8')
  const patched = patchAndroidManifest(data)
  writeFileSync(manifest, patched)
  const file = join(root, 'android/app/src/main/res/xml/chatbox_local_network_security.xml')
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, LOCAL_SECURITY_XML)
  return { manifest, file }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = configureAndroidLocalRouting()
  process.stdout.write('Loopback HTTP restricted network policy configured: ' + result.file + '\n')
}
