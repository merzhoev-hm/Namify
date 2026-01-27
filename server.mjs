import http from 'node:http'
import net from 'node:net'
import { URL, domainToASCII } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import OpenAI from 'openai'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** Минималистичная загрузка .env без зависимостей */
function loadEnvFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return
    const raw = fs.readFileSync(filePath, 'utf8')
    for (const line of raw.split('\n')) {
      const s = line.trim()
      if (!s || s.startsWith('#')) continue
      const eq = s.indexOf('=')
      if (eq === -1) continue
      const key = s.slice(0, eq).trim()
      let val = s.slice(eq + 1).trim()
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      if (!(key in process.env)) process.env[key] = val
    }
  } catch {
    // игнор
  }
}

loadEnvFile(path.join(__dirname, '.env'))

const PORT = Number(process.env.PORT ?? process.env.NAMIFY_PORT ?? 8787)
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? '*' // если будешь деплоить — лучше указать домен

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? 'llama-3.3-70b-versatile'
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL

const openai = OPENAI_API_KEY
  ? new OpenAI({
      apiKey: OPENAI_API_KEY,
      ...(OPENAI_BASE_URL ? { baseURL: OPENAI_BASE_URL } : {}),
    })
  : null

function sendJson(res, status, data) {
  const body = JSON.stringify(data)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': CORS_ORIGIN,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  })
  res.end(body)
}

async function readJson(req, limitBytes = 1_000_000) {
  return await new Promise((resolve, reject) => {
    let size = 0
    let data = ''
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > limitBytes) {
        reject(new Error('Payload too large'))
        req.destroy()
        return
      }
      data += chunk.toString('utf8')
    })
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {})
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

function stripCodeFences(text) {
  const t = (text ?? '').trim()
  if (t.startsWith('```')) {
    return t
      .replace(/^```[a-zA-Z]*\n?/, '')
      .replace(/```$/, '')
      .trim()
  }
  return t
}

function extractJson(text) {
  const s = stripCodeFences(text)
  const i1 = s.indexOf('[')
  const i2 = s.indexOf('{')
  const start = i1 === -1 ? i2 : i2 === -1 ? i1 : Math.min(i1, i2)
  if (start === -1) return null
  const cut = s.slice(start).trim()
  try {
    return JSON.parse(cut)
  } catch {
    return null
  }
}

function toBase(label) {
  let s = String(label ?? '').toLowerCase()
  s = s.replace(/&/g, ' and ')
  s = s.replace(/[^a-z0-9]+/g, '-') // оставляем только latin+digits
  s = s.replace(/-+/g, '-').replace(/^-|-$/g, '')
  if (!s) s = 'project'
  if (s.length > 30) s = s.slice(0, 30).replace(/-$/g, '')
  if (s.length < 2) s = (s + '-app').slice(0, 30)
  return s
}

function stripDomainsFromIdea(idea) {
  let s = String(idea ?? '')

  // убрать ссылки целиком
  s = s.replace(/https?:\/\/\S+/gi, ' ')

  // убрать домены вида hh.ru, example.com, sub.site.org и т.п.
  s = s.replace(/\b[a-z0-9-]+(\.[a-z0-9-]+)+\b/gi, ' ')

  // подчистить лишние пробелы
  s = s.replace(/\s+/g, ' ').trim()
  return s
}

function makeMockNames(idea, count) {
  const base = toBase(idea)
  const presets = [
    { label: `${base}ly`, base: `${base}ly` },
    { label: `${base}hub`, base: `${base}hub` },
    { label: `${base}nova`, base: `${base}nova` },
    { label: `${base}flow`, base: `${base}flow` },
    { label: `${base}labs`, base: `${base}labs` },
    { label: `${base}go`, base: `${base}go` },
    { label: `${base}cloud`, base: `${base}cloud` },
  ]
  return presets.slice(0, count).map((x) => ({ label: x.label, base: toBase(x.base) }))
}

/** RDAP cache */
const rdapCache = new Map() // domain -> { status, ts }
const RDAP_TTL_MS = 60 * 60 * 1000

async function rdapCheck(domain) {
  const now = Date.now()
  const cached = rdapCache.get(domain)
  if (cached && now - cached.ts < RDAP_TTL_MS) return cached.status

  const url = `https://rdap.org/domain/${encodeURIComponent(domain)}`
  try {
    const r = await fetch(url, { headers: { Accept: 'application/rdap+json' } })

    // 404 от rdap.org = "нет RDAP для зоны", это НЕ "домен свободен"
    const finalHost = new URL(r.url).hostname
    if (r.status === 404 && finalHost === 'rdap.org') {
      rdapCache.set(domain, { status: 'unknown', ts: now })
      return 'unknown'
    }

    let status = 'unknown'
    if (r.status === 404)
      status = 'available' // 404 уже от авторитетного RDAP
    else if (r.status === 200) status = 'taken'
    else status = 'unknown'

    rdapCache.set(domain, { status, ts: now })
    return status
  } catch {
    rdapCache.set(domain, { status: 'unknown', ts: now })
    return 'unknown'
  }
}

function whoisQuery({ host, query, timeoutMs = 6000 }) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port: 43 })
    let data = ''

    const timer = setTimeout(() => {
      socket.destroy(new Error('WHOIS timeout'))
    }, timeoutMs)

    socket.on('connect', () => {
      socket.write(query + '\r\n')
    })

    socket.on('data', (chunk) => {
      data += chunk.toString('utf8')
    })

    socket.on('end', () => {
      clearTimeout(timer)
      resolve(data)
    })

    socket.on('error', (err) => {
      clearTimeout(timer)
      reject(err)
    })
  })
}

async function whoisTcinetCheck(domain) {
  // tcinet ожидает ASCII (IDN -> punycode)
  const ascii = domainToASCII(domain) || domain
  const text = await whoisQuery({ host: 'whois.tcinet.ru', query: ascii })
  const t = text.toLowerCase()

  // типичный "не найден" у tcinet:
  // "No entries found for the selected source(s)."
  if (t.includes('no entries found')) return 'available'

  return 'taken'
}

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length)
  let i = 0

  async function worker() {
    while (true) {
      const idx = i++
      if (idx >= items.length) return
      results[idx] = await fn(items[idx], idx)
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker())
  await Promise.all(workers)
  return results
}

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': CORS_ORIGIN,
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    })
    res.end()
    return
  }

  const url = new URL(req.url ?? '/', `http://${req.headers.host}`)

  // Serve frontend in production
  const isProd = process.env.NODE_ENV === 'production'
  const distDir = path.join(__dirname, 'dist')

  function sendFile(filePath) {
    try {
      const data = fs.readFileSync(filePath)
      const ext = path.extname(filePath).toLowerCase()
      const mime =
        ext === '.html'
          ? 'text/html; charset=utf-8'
          : ext === '.js'
            ? 'application/javascript; charset=utf-8'
            : ext === '.css'
              ? 'text/css; charset=utf-8'
              : ext === '.json'
                ? 'application/json; charset=utf-8'
                : ext === '.svg'
                  ? 'image/svg+xml'
                  : ext === '.png'
                    ? 'image/png'
                    : ext === '.jpg' || ext === '.jpeg'
                      ? 'image/jpeg'
                      : ext === '.woff2'
                        ? 'font/woff2'
                        : 'application/octet-stream'

      res.writeHead(200, { 'Content-Type': mime })
      res.end(data)
      return true
    } catch {
      return false
    }
  }

  if (isProd && !url.pathname.startsWith('/api')) {
    // assets
    const assetPath = path.join(distDir, url.pathname.replace(/^\//, ''))
    if (url.pathname !== '/' && sendFile(assetPath)) return

    // SPA fallback
    const indexPath = path.join(distDir, 'index.html')
    if (sendFile(indexPath)) return

    sendJson(res, 500, { error: 'Frontend not built (dist missing)' })
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/debug') {
    sendJson(res, 200, {
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL ?? 'not_set',
      node: process.version,
    })
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/health') {
    sendJson(res, 200, { ok: true })
    return
  }

  // 1) Генерация имён
  if (req.method === 'POST' && url.pathname === '/api/names') {
    try {
      const body = await readJson(req)
      const rawIdea = String(body.idea ?? '').trim()
      const idea = stripDomainsFromIdea(rawIdea)
      const count = Math.max(1, Math.min(Number(body.count ?? 4) || 4, 12))

      if (idea.length < 2) {
        sendJson(res, 400, { error: 'Idea is too short' })
        return
      }

      // если ключа нет — mock
      if (!openai) {
        sendJson(res, 200, { suggestions: makeMockNames(idea, count), mode: 'mock' })
        return
      }

      const schema = {
        type: 'object',
        additionalProperties: false,
        properties: {
          suggestions: {
            type: 'array',
            minItems: count,
            maxItems: count,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                label: { type: 'string', minLength: 2, maxLength: 40 },
                base: { type: 'string', minLength: 2, maxLength: 40 },
                description: { type: 'string', minLength: 5, maxLength: 140 },
              },
              required: ['label', 'base', 'description'],
            },
          },
        },
        required: ['suggestions'],
      }
      const completion = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        temperature: 1.1,
        messages: [
          {
            role: 'system',
            content:
              'Ты креативный неймер. Верни ТОЛЬКО валидный JSON без markdown.\n' +
              'Требования:\n' +
              '- label: брендовые названия латиницей, звучные, необычные.\n' +
              '- base: доменный slug (a-z0-9-), нижний регистр.\n' +
              '- description: строго на русском, 1 короткое предложение.\n' +
              'Креативные паттерны (используй разные):\n' +
              '1) неологизм (придуманное слово), 2) слитные слова (blend), 3) метафора/образ,\n' +
              '4) короткое “tech” звучание, 5) лёгкая аллитерация.\n' +
              'Запрещено:\n' +
              '- слова app, hub, pro, service, online, cloud, tech, ai, bot, tool в самом названии\n' +
              '- упоминать сайты/домены из идеи (например hh.ru) или их части.\n',
          },
          {
            role: 'user',
            content:
              `Идея: ${idea}\n` +
              `Сгенерируй ${Math.max(count, 12)} вариантов (минимум 12), а я выберу лучшие 4.\n` +
              `Формат строго:\n` +
              `{"suggestions":[{"label":"Name","base":"domain-slug","description":"описание"}]}\n` +
              `Правила:\n` +
              `- label: от 10 до 15 символов строго\n` +
              `- избегай очевидных слов типа "auto", "reply", "finance" напрямую — лучше образ/неологизм\n` +
              `- description: на русском, 6–12 слов\n`,
          },
        ],
      })

      const text = completion.choices?.[0]?.message?.content ?? ''
      const parsed = extractJson(text)

      let suggestions = []
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.suggestions)) {
        suggestions = parsed.suggestions
      }

      // нормализация + защита от мусора
      const normalized = []
      const seen = new Set()
      for (const s of suggestions) {
        const label = String(s?.label ?? '').trim()
        if (!label) continue
        const base0 = String(s?.base ?? label).trim()
        let base = toBase(base0)

        let unique = base
        let n = 2
        while (seen.has(unique)) unique = `${base}-${n++}`.slice(0, 30)
        seen.add(unique)

        const description =
          String(s?.description ?? '').trim() || generateDescription?.(label) || ''
        normalized.push({ label, base: unique, description })
        if (normalized.length >= count) break
      }

      if (normalized.length === 0) {
        sendJson(res, 200, { suggestions: makeMockNames(idea, count), mode: 'fallback' })
        return
      }

      sendJson(res, 200, { suggestions: normalized, mode: 'groq' })
      return
    } catch (e) {
      const status = e?.status ?? e?.response?.status ?? null
      const message = e?.message ? String(e.message) : String(e)
      const details = e?.error ?? e?.response?.data ?? null

      console.error('[api/names] error:', { status, message, details })

      sendJson(res, 500, {
        error: 'Failed to generate names',
        status,
        message,
        details,
      })
      return
    }
  }

  // 2) Проверка доменов
  if (req.method === 'POST' && url.pathname === '/api/domains/check') {
    try {
      const body = await readJson(req)
      const domains = Array.isArray(body.domains) ? body.domains.map(String) : []
      const cleaned = domains.map((d) => d.trim().toLowerCase()).filter((d) => d && d.length <= 253)

      // ограничим, чтобы не DDOSить RDAP
      const limited = cleaned.slice(0, 200)

      const results = await mapWithConcurrency(limited, 8, async (domain) => {
        let status = await rdapCheck(domain)

        if (status === 'unknown') {
          const parts = domain.split('.')
          const tld = parts[parts.length - 1]?.toLowerCase()

          if (tld === 'ru' || tld === 'su') {
            try {
              status = await whoisTcinetCheck(domain)
            } catch {
              status = 'unknown'
            }
          }
        }

        return { domain, status }
      })

      sendJson(res, 200, { results })
      return
    } catch {
      sendJson(res, 500, { error: 'Failed to check domains' })
      return
    }
  }

  sendJson(res, 404, { error: 'Not found' })
})

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[Namify server] http://localhost:${PORT}`)
})
