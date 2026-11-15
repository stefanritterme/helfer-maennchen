import { expect, test } from 'claude-code/testing'

const BAND = {
  plugin: 'helfer-maennchen',
  component: 'AbovePrompt',
  requestId: 'above-prompt',
  props: { hasSurvey: false, isCollapsed: false, isWorking: true, maxRows: 20, bodyColumns: 80, scroll: { offset: 0, bodyRows: 20 }, view: {} },
} as const

test('ein Helfer im Zustand wird gezeichnet', async ($, on) => {
  on('state.get', () => ({
    value: { value: [{ id: 'a1', task: 'Recherche Wetter', activity: 'sucht im Netz', costume: 'detektiv', status: 'running', startedAt: 1 }], version: 1 },
  }))
  for (const surface of ['desktop', 'terminal'] as const) {
    const ui = await $.ui.mount({ ...BAND, surface })
    expect(await ui.find({ type: 'Text', text: /Recherche Wetter/ })).toBeDefined()
    await ui.unmount()
  }
})

test('agent.spawn und tool.call füllen den Zustand', async ($, on) => {
  on('clock.now', () => ({ value: 1000 }))
  on('clock.after', () => ({ value: { cancel() {} } }) as never)
  on('agent.spawn', () => ({ model: 'haiku', agentId: 'a1' }))
  on('tool.call', () => ({ result: {} }))
  await $.agent.spawn({ prompt: 'Recherchiere das Wetter', description: 'Recherche Wetter' } as never)
  await $.tool.call({ tool: 'WebSearch', query: 'wetter', agentId: 'a1' } as never)
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /Recherche Wetter/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /sucht im Netz/ })).toBeDefined()
  await ui.unmount()
})
