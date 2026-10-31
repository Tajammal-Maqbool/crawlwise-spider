import { join, resolve } from 'node:path'
import { _electron as electron, type ElectronApplication } from 'playwright-core'

export const ROOT = resolve(import.meta.dirname, '../..')

export const ELECTRON_PATH = join(ROOT, 'node_modules', 'electron', 'dist', process.platform === 'win32' ? 'electron.exe' : 'electron')

export function launchEnv(extra: Record<string, string> = {}): Record<string, string> {
  const env: Record<string, string> = {}
  for (const [k, v] of Object.entries(process.env)) if (v !== undefined && k !== 'ELECTRON_RUN_AS_NODE') env[k] = v
  return { ...env, ...extra }
}

export function launchApp(userDataDir: string, extraEnv: Record<string, string> = {}): Promise<ElectronApplication> {
  return electron.launch({
    executablePath: ELECTRON_PATH,
    args: [join(ROOT, 'out', 'main', 'index.js'), `--user-data-dir=${userDataDir}`],
    env: launchEnv(extraEnv)
  })
}
