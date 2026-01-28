export type NameVariant = { label: string; base: string }

const SUFFIXES = [
  'Lab',
  'Cloud',
  'Hub',
  'Box',
  'Flow',
  'Nest',
  'Forge',
  'Base',
  'Works',
  'Plus',
  'Kit',
  'ify',
  'ly',
  'ster',
  'verse',
  'able',
]
const PREFIXES = [
  'Nova',
  'Ultra',
  'Hyper',
  'Meta',
  'Eco',
  'Neo',
  'Smart',
  'Zen',
  'Pro',
  'Next',
  'Prime',
  'Clear',
  'Core',
  'True',
]

export const REGISTER_URL_TEMPLATE =
  'https://www.reg.ru/buy/domains/?rlink=reflink-31171513&query={domain}'

export function buildRegisterUrl(domain: string) {
  return REGISTER_URL_TEMPLATE.replace('{domain}', encodeURIComponent(domain))
}

export function generateDescription(name: string) {
  const hints = [
    'Легко запоминается',
    'Подходит для стартапа',
    'Звучит современно',
    'Вызывает доверие',
    'Отражает креативность',
  ]
  return hints[Math.floor(Math.random() * hints.length)]
}

function translitRuToLat(input: string) {
  const map: Record<string, string> = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    д: 'd',
    е: 'e',
    ё: 'e',
    ж: 'zh',
    з: 'z',
    и: 'i',
    й: 'y',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'h',
    ц: 'ts',
    ч: 'ch',
    ш: 'sh',
    щ: 'sch',
    ъ: '',
    ы: 'y',
    ь: '',
    э: 'e',
    ю: 'yu',
    я: 'ya',
    Ӏ: '',
    ӏ: '',
  }
  return input
    .toLowerCase()
    .replace(/[а-яёӀӏ]/g, (ch) => map[ch] ?? '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function toPascal(str: string) {
  return str
    .split(/[\s-]+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
    .join('')
}

function seededRandom(seed: string) {
  let h = 2166136261 >>> 0
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return () => {
    h += 0x6d2b79f5
    let t = Math.imul(h ^ (h >>> 15), 1 | h)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function makeNameVariants(raw: string): NameVariant[] {
  const base = translitRuToLat(raw || '')
  const words = base.split(' ').filter(Boolean)
  const r = seededRandom(base || 'seed')
  const candidates: NameVariant[] = []

  const joined = toPascal(base) || 'Project'
  const pref = PREFIXES[Math.floor(r() * PREFIXES.length)]
  const suf = SUFFIXES[Math.floor(r() * SUFFIXES.length)]

  candidates.push(
    { label: joined, base: joined.toLowerCase() },
    { label: `${joined}${suf}`, base: (joined + suf).toLowerCase() },
    { label: `${pref}${joined}`, base: (pref + joined).toLowerCase() },
    {
      label: `${toPascal(words[0] || 'Nova')}${toPascal(words[1] || 'Tech')}`,
      base: (toPascal(words[0] || 'Nova') + toPascal(words[1] || 'Tech')).toLowerCase(),
    },
  )

  const seen = new Set<string>()
  return candidates
    .filter((c) => {
      if (seen.has(c.base)) return false
      seen.add(c.base)
      return true
    })
    .slice(0, 4)
}
