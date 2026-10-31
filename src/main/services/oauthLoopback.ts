import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import type { LoopbackLogin } from '../interfaces/loopbackLogin'
import { loginPage } from '../utils/loginPage'
import { APP_NAME } from '@shared/constants/appInfo'

export async function startLoopbackLogin(state: string, timeoutMs: number): Promise<LoopbackLogin> {
  let settle: { resolve: (code: string) => void; reject: (err: Error) => void } = { resolve: () => undefined, reject: () => undefined }
  const code = new Promise<string>((resolve, reject) => (settle = { resolve, reject }))
  code.catch(() => undefined)

  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1')
    if (url.pathname !== '/') {
      res.statusCode = 404
      res.end()
      return
    }
    res.setHeader('content-type', 'text/html; charset=utf-8')
    if (url.searchParams.get('state') !== state) {
      res.statusCode = 400
      res.end(loginPage('Sign-in failed', 'This sign-in request does not match the app. Start the sign-in again from the app.'))
      return
    }
    const received = url.searchParams.get('code')
    if (!received) {
      res.end(loginPage('Sign-in failed', 'Google did not give access. Go back to the app and try again.'))
      settle.reject(new Error(`Google sign-in failed: ${url.searchParams.get('error') ?? 'no code returned'}`))
      return
    }
    res.end(loginPage('Signed in', `You can close this tab and go back to ${APP_NAME}.`))
    settle.resolve(received)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const timer = setTimeout(() => settle.reject(new Error('Google sign-in timed out')), timeoutMs)
  const port = (server.address() as AddressInfo).port

  return {
    redirectUri: `http://127.0.0.1:${port}`,
    code,
    close: () => {
      clearTimeout(timer)
      settle.reject(new Error('Google sign-in was cancelled'))
      server.close()
      server.closeAllConnections()
    }
  }
}
