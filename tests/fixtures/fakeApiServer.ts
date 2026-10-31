import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'

export interface FakeApi {
  base: string
  requests: Array<{ path: string; headers: Record<string, string | string[] | undefined>; body: string }>
  close: () => Promise<void>
}

const PSI_BODY = {
  lighthouseResult: {
    categories: { performance: { score: 0.42 } },
    audits: {
      'largest-contentful-paint': { numericValue: 3100 },
      'first-contentful-paint': { numericValue: 1200 },
      'total-blocking-time': { numericValue: 350 },
      'speed-index': { numericValue: 2800 },
      'cumulative-layout-shift': { numericValue: 0.02 }
    }
  },
  loadingExperience: { overall_category: 'AVERAGE' }
}

export async function startFakeApi(): Promise<FakeApi> {
  const requests: FakeApi['requests'] = []
  const server = createServer((req, res) => {
    let body = ''
    req.on('data', (c) => (body += String(c)))
    req.on('end', () => {
      const path = (req.url ?? '').split('?')[0]
      requests.push({ path, headers: req.headers, body })
      res.setHeader('content-type', 'application/json')
      if (path === '/psi') return res.end(JSON.stringify(PSI_BODY))
      if (path === '/v1/messages') {
        return res.end(
          JSON.stringify({
            id: 'msg_test',
            type: 'message',
            role: 'assistant',
            model: JSON.parse(body).model,
            content: [{ type: 'text', text: 'Claude answer' }],
            stop_reason: 'end_turn',
            stop_sequence: null,
            usage: { input_tokens: 10, output_tokens: 3 }
          })
        )
      }
      if (path === '/api/generate') return res.end(JSON.stringify({ response: 'Ollama answer' }))
      res.statusCode = 404
      res.end('{}')
    })
  })
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r))
  const port = (server.address() as AddressInfo).port
  return { base: `http://127.0.0.1:${port}`, requests, close: () => new Promise((r) => server.close(() => r())) }
}
