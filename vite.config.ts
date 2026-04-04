import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const rawExtensionKey = env.GOOGLE_EXTENSION_KEY?.trim() ?? ''
  const normalizedExtensionKey = rawExtensionKey
    .replace(/^['"]|['"]$/g, '')
    .replace(/%+$/, '')
    .trim()
  const hasValidExtensionKey =
    normalizedExtensionKey.length > 0 &&
    normalizedExtensionKey !== 'your_extension_key_here' &&
    /^[A-Za-z0-9+/=]+$/.test(normalizedExtensionKey)

  return {
    plugins: [
      react(),
      {
        name: 'inject-manifest-client-id',
        closeBundle() {
          const manifestPath = resolve(__dirname, 'dist/manifest.json')
          try {
            let manifest = readFileSync(manifestPath, 'utf-8')
            manifest = manifest.replace(
              '__GOOGLE_CLIENT_ID__',
              env.GOOGLE_CLIENT_ID || ''
            )
            // Keep malformed copied values from making the extension unloadable.
            if (hasValidExtensionKey) {
              manifest = manifest.replace('__GOOGLE_EXTENSION_KEY__', normalizedExtensionKey)
            } else {
              manifest = manifest.replace(/\s*"key":\s*"[^"]*",?\n?/, '\n')
              if (rawExtensionKey && rawExtensionKey !== 'your_extension_key_here') {
                console.warn(
                  'Skipping manifest key injection: GOOGLE_EXTENSION_KEY is not a valid base64-encoded public key.'
                )
              }
            }
            writeFileSync(manifestPath, manifest)
            console.log('✓ manifest.json injected')
          } catch (e) {
            console.warn('Could not inject client_id into manifest.json:', e)
          }
        }
      }
    ],
  }
})
