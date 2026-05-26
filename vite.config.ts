import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

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
        name: 'inject-manifest-values',
        closeBundle() {
          const manifestPath = resolve(__dirname, 'dist/manifest.json')
          try {
            const manifestObj = JSON.parse(readFileSync(manifestPath, 'utf-8'))

            // Inject or strip Google OAuth2 config based on env presence
            if (env.GOOGLE_CLIENT_ID) {
              manifestObj.oauth2.client_id = env.GOOGLE_CLIENT_ID
            } else {
              delete manifestObj.oauth2
              manifestObj.permissions = manifestObj.permissions.filter(
                (p: string) => p !== 'identity'
              )
            }

            // Inject or strip extension key
            if (hasValidExtensionKey) {
              manifestObj.key = normalizedExtensionKey
            } else {
              delete manifestObj.key
              if (rawExtensionKey && rawExtensionKey !== 'your_extension_key_here') {
                console.warn(
                  'Skipping manifest key injection: GOOGLE_EXTENSION_KEY is not a valid base64-encoded public key.'
                )
              }
            }

            writeFileSync(manifestPath, JSON.stringify(manifestObj, null, 2) + '\n')
            console.log('manifest.json injected')
          } catch (error) {
            console.error('Failed to inject manifest values:', error)
          }
        }
      }
    ],
  }
})
