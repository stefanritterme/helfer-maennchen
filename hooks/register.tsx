import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Costume, Helper } from '../types'
import { COSTUME_LABEL, sprite } from './sprites'

const helpers = atom({ plugin: 'helfer-maennchen', key: 'helpers' } as const, [] as Helper[])

const POLL_MS = 2000 // so oft wird mit der Agentenliste abgeglichen
const LINGER_MS = 4000 // so lange bleibt ein fertiges Männchen stehen
const ORDER: Costume[] = ['detektiv', 'koch', 'bauarbeiter', 'zauberer', 'jaeger', 'astronaut']

// Aufgabe → Kostüm, nach Stichworten in Beschreibung, Typ und Auftrag
const RULES: [Costume, RegExp][] = [
  ['astronaut', /\bplan|strateg|architekt|architect|roadmap|konzept|entwurf|gliederung|outline/i],
  ['zauberer', /kreativ|creative|idee|ideen|brainstorm|design|gedicht|poem|geschicht|story|slogan|name[nn]?\b|erfind|zeichn|male/i],
  ['koch', /schreib|write|writing|text|formulier|verfass|draft|doku|zusammenfass|summar|übersetz|translat|mail|brief/i],
  ['jaeger', /sammel|sammle|collect|gather|liste\b|list all|zusammentrag|einsammel|download|hol\b|fetch|scrape|aufliste/i],
  ['bauarbeiter', /bau|build|implement|code|programm|fix|reparier|install|erstell|create|refactor|test|deploy|setup/i],
  ['detektiv', /recherch|research|such|search|find|explor|untersuch|investig|prüf|check|analys|review|lies|read|herausfind/i],
]

function pickCostume(text: string, type: string, taken: Set<Costume>): Costume {
  const wanted: Costume[] = []
  if (type === 'Plan') wanted.push('astronaut')
  if (type === 'Explore') wanted.push('detektiv')
  for (const [c, re] of RULES) if (re.test(text)) wanted.push(c)
  for (const c of wanted) if (!taken.has(c)) return c
  // Jeder Helfer bekommt ein anderes Kostüm, solange welche frei sind
  for (const c of ORDER) if (!taken.has(c)) return c
  return wanted[0] ?? ORDER[taken.size % ORDER.length] ?? 'detektiv'
}

const base = (p: unknown) => (typeof p === 'string' ? p.split('/').filter(Boolean).pop() ?? p : '')

function activityOf(e: { tool: string } & Record<string, unknown>): string {
  const tool = String(e.tool)
  switch (tool) {
    case 'Read':
      return `liest ${base(e.file_path)}`
    case 'Write':
      return `schreibt ${base(e.file_path)}`
    case 'Edit':
    case 'MultiEdit':
    case 'NotebookEdit':
      return `bearbeitet ${base(e.file_path ?? e.notebook_path)}`
    case 'Grep':
    case 'Glob':
      return 'durchsucht Dateien'
    case 'Bash':
      return 'führt Befehl aus'
    case 'WebSearch':
      return 'sucht im Netz'
    case 'WebFetch':
      return 'liest eine Webseite'
    case 'Agent':
      return 'holt sich Hilfe'
    default:
      if (tool.startsWith('mcp__')) return 'nutzt ein Werkzeug'
      return 'denkt nach'
  }
}

const short = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s)

let timer: { cancel: () => void } | undefined

async function sync($: EngineInterface) {
  const now = await $.clock.now()
  let list: Awaited<ReturnType<EngineInterface['agent']['list']>> = []
  try {
    list = await $.agent.list()
  } catch {
    list = []
  }
  const byId = new Map(list.filter(a => !a.teammateId).map(a => [a.id, a]))

  await update($, helpers, prev => {
    const cur = prev ?? []
    let next = cur.map(h => {
      if (h.status !== 'running' || h.id.startsWith('demo-')) return h
      const a = byId.get(h.id)
      // Nicht mehr in der Liste oder dort fertig → Männchen fertig melden
      if (!a || a.status === 'completed' || a.status === 'failed' || a.status === 'killed') {
        const failed = a?.status === 'failed' || a?.status === 'killed'
        return { ...h, status: failed ? 'failed' : 'done', doneAt: now } as Helper
      }
      return h
    })
    // Läuft ein Agent, den wir noch nicht kennen? Dann nachtragen.
    const taken = new Set(next.filter(h => h.status === 'running').map(h => h.costume))
    for (const a of byId.values()) {
      const live = a.status === 'running' || a.status === 'pending' || a.status === 'waiting'
      if (!live || next.some(h => h.id === a.id)) continue
      const costume = pickCostume(a.description, a.type, taken)
      taken.add(costume)
      next.push({ id: a.id, task: a.description, activity: 'legt los', costume, status: 'running', startedAt: now })
    }
    next = next.filter(h => h.status === 'running' || now - (h.doneAt ?? now) < LINGER_MS)
    const same = next.length === cur.length && next.every((h, i) => h === cur[i])
    return same ? cur : next
  })
}

function schedule($: EngineInterface) {
  timer?.cancel()
  timer = $.clock.after(POLL_MS, () => {
    sync($)
      .catch(() => {})
      .finally(() => schedule($))
  })
}

function finishDemo($: EngineInterface, id: string, ms: number) {
  $.clock.after(ms, () => {
    $.clock
      .now()
      .then(t =>
        update($, helpers, prev =>
          (prev ?? []).map(x => (x.id === id && x.status === 'running' ? { ...x, status: 'done' as const, doneAt: t } : x)),
        ),
      )
      .catch(() => {})
  })
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    await $.command.register({
      name: 'helfer-demo',
      description: 'Zeigt die Helfer-Männchen etwa 20 Sekunden lang zur Probe',
    }).catch(() => {})
    await sync($).catch(() => {})
    schedule($)
    return result
  })

  // Probe ohne echte Agenten: drei Männchen für ~20 Sekunden
  on('command.run', { command: 'helfer-demo' }, async $ => {
    const now = await $.clock.now()
    const demo: Helper[] = [
      { id: 'demo-1', task: 'Recherche Wetter', activity: 'sucht im Netz', costume: 'detektiv', status: 'running', startedAt: now },
      { id: 'demo-2', task: 'Gedicht schreiben', activity: 'schreibt gedicht.md', costume: 'koch', status: 'running', startedAt: now },
      { id: 'demo-3', task: 'Ausflug planen', activity: 'denkt nach', costume: 'astronaut', status: 'running', startedAt: now },
    ]
    await update($, helpers, prev => [...(prev ?? []).filter(x => !x.id.startsWith('demo-')), ...demo])
    finishDemo($, 'demo-1', 14000)
    finishDemo($, 'demo-2', 17000)
    finishDemo($, 'demo-3', 20000)
    return { text: 'Drei Probe-Männchen stehen jetzt etwa 20 Sekunden über dem Eingabefeld.' }
  })

  // Start-Signal: ein Sub-Agent wird gestartet
  on('agent.spawn', async ($, e, next) => {
    const result = await next(e)
    const id = result.agentId
    if (id && !e.isTeammate && !e.workflow) {
      const now = await $.clock.now()
      await update($, helpers, prev => {
        const cur = prev ?? []
        if (cur.some(h => h.id === id)) return cur
        const taken = new Set(cur.filter(h => h.status === 'running').map(h => h.costume))
        const costume = pickCostume(`${e.description} ${e.prompt.slice(0, 600)}`, e.subagentType, taken)
        const fresh: Helper = { id, task: e.description, activity: 'legt los', costume, status: 'running', startedAt: now }
        return [...cur, fresh]
      })
      schedule($)
    }
    return result
  }).catch(($, e, next) => next(e))

  // Was der Helfer gerade tut: jeder Werkzeugaufruf in seiner Schleife
  on('tool.call', async ($, e, next) => {
    const agentId = (e as { agentId?: string }).agentId
    if (agentId) {
      const activity = activityOf(e as unknown as { tool: string } & Record<string, unknown>)
      await update($, helpers, prev => {
        const cur = prev ?? []
        const i = cur.findIndex(h => h.id === agentId && h.status === 'running')
        const h = cur[i]
        if (!h || h.activity === activity) return cur
        const copy = cur.slice()
        copy[i] = { ...h, activity }
        return copy
      }).catch(() => {})
    }
    return next(e)
  }).catch(($, e, next) => next(e))

  // Ende-Signal: die Runde eines Sub-Agenten ist vorbei
  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    const agentId = (e as { agentId?: string }).agentId
    if (agentId) {
      const now = await $.clock.now()
      const failed = e.reason === 'error' || e.reason === 'aborted'
      await update($, helpers, prev =>
        (prev ?? []).map(h =>
          h.id === agentId && h.status === 'running'
            ? ({ ...h, status: failed ? 'failed' : 'done', doneAt: now } as Helper)
            : h,
        ),
      ).catch(() => {})
    }
    return result
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const list = (await read($, helpers)) ?? []
    if (list.length === 0 || e.props.hasSurvey) return next(e)

    if (e.surface === 'terminal') {
      const { Box, Text } = $.ui.resolve(e)
      return (
        <Box flexDirection="column">
          {list.map(hp => (
            <Text key={hp.id} color={hp.status === 'done' ? 'success' : undefined}>
              {hp.status === 'done' ? '✓ ' : hp.status === 'failed' ? '– ' : '● '}
              {COSTUME_LABEL[hp.costume]}: {short(hp.task, 40)} · {hp.status === 'running' ? hp.activity : hp.status === 'done' ? 'fertig' : 'abgebrochen'}
            </Text>
          ))}
        </Box>
      )
    }

    if (e.surface === 'mobile' || e.surface === 'vscode') {
      const { Box, Text } = $.ui.resolve(e)
      return (
        <Box flexDirection="row" flexWrap="wrap" gap="sm">
          {list.map(hp => (
            <Text key={hp.id} size="footnote" color={hp.status === 'done' ? 'success' : undefined}>
              {hp.status === 'done' ? '✓' : '●'} {short(hp.task, 28)}: {hp.status === 'running' ? hp.activity : 'fertig'}
            </Text>
          ))}
        </Box>
      )
    }

    const { Box, Text, Svg } = $.ui.resolve(e)
    return (
      <Box flexDirection="row" flexWrap="wrap" gap="lg" paddingX="sm" paddingY="xs" alignItems="flex-start">
        {list.map((hp, i) => {
          const seed = [...hp.id].reduce((s, c) => s + c.charCodeAt(0), i)
          const line =
            hp.status === 'running' ? hp.activity : hp.status === 'done' ? 'Fertig!' : 'Abgebrochen'
          return (
            <Box key={hp.id} flexDirection="column" alignItems="center" width={112} gap={2}>
              <Svg
                source={sprite(hp.costume, hp.status, seed)}
                alt={`${COSTUME_LABEL[hp.costume]}-Männchen: ${hp.task}, ${line}`}
                width={75}
                height={71}
                isInteractive
              />
              <Text size="footnote" weight="semibold" wrap="truncate-end">
                {short(hp.task, 30)}
              </Text>
              <Text
                size="footnote"
                color={hp.status === 'done' ? 'success' : hp.status === 'failed' ? 'subtle' : undefined}
                weight={hp.status === 'done' ? 'semibold' : 'regular'}
                wrap="wrap"
              >
                {short(line, 36)}
              </Text>
            </Box>
          )
        })}
      </Box>
    )
  })
}
