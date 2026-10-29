import { readdir, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Plugin } from 'vite'

// Dev-server endpoint for the recording studio (docs/DECISIONS.md D10, D12): the studio POSTs a recording and it is
// written straight into src/audio/he/<phraseId>.<ext>, replacing any earlier take. Never part of a production build.

const DIR = 'src/audio/he'
const EXT: Record<string, string> = { 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'm4a', 'audio/mpeg': 'mp3', 'audio/wav': 'wav' }
const ID = /^[a-z][\w.-]*$/i

export function studioPlugin(): Plugin {
  return {
    name: 'studio-save',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__studio/save', (req, res) => {
        const id = new URL(req.url ?? '', 'http://x').searchParams.get('id') ?? ''
        const ext = EXT[(req.headers['content-type'] ?? '').split(';')[0]!.trim()]
        if (req.method !== 'POST' || !ID.test(id) || !ext) {
          res.statusCode = 400
          return res.end('Bad request')
        }
        const chunks: Buffer[] = []
        req.on('data', c => chunks.push(c))
        req.on('end', async () => {
          try {
            const dir = join(server.config.root, DIR)
            // One file per phrase: remove earlier takes in any format.
            for (const f of await readdir(dir)) if (f.startsWith(`${id}.`)) await unlink(join(dir, f))
            await writeFile(join(dir, `${id}.${ext}`), Buffer.concat(chunks))
            res.end('ok')
          } catch (e) {
            res.statusCode = 500
            res.end(String(e))
          }
        })
      })
    },
  }
}
