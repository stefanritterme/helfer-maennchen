export type Costume = 'detektiv' | 'koch' | 'bauarbeiter' | 'zauberer' | 'jaeger' | 'astronaut'

export type Helper = {
  id: string
  task: string
  activity: string
  costume: Costume
  status: 'running' | 'done' | 'failed'
  startedAt: number
  doneAt?: number
}

declare module 'claude-code' {
  interface PluginState {
    'helfer-maennchen': { helpers: Helper[] }
  }
}
