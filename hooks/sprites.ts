import type { Costume } from '../types'

// Pixel-Raster: 16 x 15 Einheiten. Das Männchen ist ein oranger Block mit
// zwei Augen, Stummelarmen und vier Beinchen; Hut oben, Werkzeug rechts.
const ORANGE = '#D97757'
const ORANGE_DARK = '#B85C3E'
const INK = '#2B1D17'

const r = (x: number, y: number, w: number, h: number, fill: string, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${extra}/>`

type Parts = { hat: string; tool: string }

const PARTS: Record<Costume, Parts> = {
  // Detektiv: brauner Hut mit Band, Lupe
  detektiv: {
    hat:
      r(1, 5, 13, 1, '#6E4A2C') +
      r(3, 3, 9, 2, '#8A5F3A') +
      r(4, 2, 7, 1, '#8A5F3A') +
      r(3, 4, 9, 1, '#3E2A1A'),
    tool:
      r(13.1, 6.4, 0.8, 3.6, '#5A3B22') +
      `<circle cx="13.5" cy="4.8" r="1.6" fill="#BFE3F2" fill-opacity="0.75" stroke="#7C8894" stroke-width="0.6"/>`,
  },
  // Koch: weiße Kochmütze (mit Kontur für den hellen Modus), Kochlöffel
  koch: {
    hat:
      r(4, 4, 7, 2, '#FFFFFF', ' stroke="#A8A29A" stroke-width="0.3"') +
      r(3, 1, 9, 3, '#FFFFFF', ' stroke="#A8A29A" stroke-width="0.3"') +
      r(5, 0.4, 5, 1, '#FFFFFF', ' stroke="#A8A29A" stroke-width="0.3"') +
      r(4.2, 4.6, 6.6, 0.4, '#DCD6CE'),
    tool:
      r(13.1, 5.6, 0.8, 4.4, '#A9743F') +
      `<ellipse cx="13.5" cy="4.6" rx="1.1" ry="1.4" fill="#C98C4E" stroke="#8A5A2B" stroke-width="0.3"/>`,
  },
  // Bauarbeiter: gelber Helm, Hammer
  bauarbeiter: {
    hat:
      r(2, 5, 11, 1, '#C99A12') +
      r(3, 3, 9, 2, '#F2C230') +
      r(4, 2, 7, 1, '#F2C230') +
      r(7, 2, 1, 3, '#FFE07A'),
    tool:
      r(13.1, 5, 0.8, 5, '#8A5A2B') +
      r(11.8, 3.6, 3.6, 1.6, '#7D8790') +
      r(11.8, 3.6, 3.6, 0.5, '#A3ADB5'),
  },
  // Zauberer: lila Spitzhut mit Sternchen, Zauberstab mit funkelnder Spitze
  zauberer: {
    hat:
      r(7, 0, 1, 1, '#6B4BB8') +
      r(6, 1, 3, 1, '#6B4BB8') +
      r(5, 2, 5, 1, '#6B4BB8') +
      r(4, 3, 7, 2, '#6B4BB8') +
      r(2, 5, 11, 1, '#54398F') +
      r(5.5, 3.5, 0.8, 0.8, '#FFD45C') +
      r(8.6, 2.4, 0.6, 0.6, '#FFD45C'),
    tool:
      r(13.1, 5, 0.8, 5, '#3B2C55') +
      `<g><rect x="12.6" y="3.4" width="1.8" height="1.8" fill="#FFD45C" transform="rotate(45 13.5 4.3)"/>` +
      `<animate attributeName="opacity" values="1;0.45;1" dur="2.6s" repeatCount="indefinite"/></g>`,
  },
  // Jäger: grüner Hut mit roter Feder, Kescher
  jaeger: {
    hat:
      r(2, 5, 11, 1, '#3B5E2C') +
      r(4, 3, 7, 2, '#4D7A3A') +
      r(5, 2, 5, 1, '#4D7A3A') +
      r(10, 1, 1, 3, '#C8463B') +
      r(11, 0.4, 0.8, 1.4, '#C8463B'),
    tool:
      r(13.1, 5.4, 0.8, 4.6, '#8A5A2B') +
      `<circle cx="13.5" cy="3.6" r="1.7" fill="#EDEBE3" fill-opacity="0.55" stroke="#6F6A5E" stroke-width="0.5"/>` +
      `<path d="M12.2 3.6h2.6M13.5 2.3v2.6" stroke="#8F897C" stroke-width="0.25"/>`,
  },
  // Astronaut: Glashelm mit Antenne, kleine Fahne
  astronaut: {
    hat:
      r(7.1, 1.2, 0.8, 2.6, '#9AA3AD') +
      `<circle cx="7.5" cy="1.1" r="0.8" fill="#E5534B"/>` +
      `<rect x="1.2" y="3.8" width="12.6" height="7.6" rx="2" fill="#CFE8FF" fill-opacity="0.28" stroke="#8FA9C2" stroke-width="0.5"/>` +
      r(2.6, 4.8, 1.6, 0.6, '#FFFFFF', ' opacity="0.8"'),
    tool:
      r(13.2, 3, 0.6, 7, '#9AA3AD') +
      r(13.8, 3, 2, 1.4, '#3E7BD6') +
      r(13.8, 3.7, 2, 0.35, '#FFFFFF'),
  },
}

/**
 * Ein ganzes Männchen als SVG. `seed` verschiebt die Takte ein wenig, damit
 * nebeneinanderstehende Helfer nicht im Gleichschritt atmen und blinzeln.
 */
export function sprite(costume: Costume, state: 'running' | 'done' | 'failed', seed: number): string {
  const p = PARTS[costume]
  const breathe = (3.4 + (seed % 3) * 0.35).toFixed(2)
  const blink = (5.2 + (seed % 4) * 0.9).toFixed(2)
  const swing = (3.0 + (seed % 3) * 0.4).toFixed(2)
  const isActive = state === 'running'
  const spline = 'keySplines="0.45 0 0.55 1;0.45 0 0.55 1" calcMode="spline"'

  const eye = (x: number) =>
    isActive
      ? `<rect x="${x}" y="8" width="1" height="2" fill="${INK}">` +
        `<animate attributeName="height" values="2;2;0.3;2;2" keyTimes="0;0.9;0.93;0.96;1" dur="${blink}s" repeatCount="indefinite"/>` +
        `<animate attributeName="y" values="8;8;8.85;8;8" keyTimes="0;0.9;0.93;0.96;1" dur="${blink}s" repeatCount="indefinite"/></rect>`
      : // fertig: zufriedene, geschlossene Augen
        `<rect x="${x - 0.2}" y="8.8" width="1.4" height="0.5" fill="${INK}"/>`

  const tool = isActive
    ? `<g>${p.tool}<animateTransform attributeName="transform" type="rotate" values="-7 13.5 10;7 13.5 10;-7 13.5 10" keyTimes="0;0.5;1" ${spline} dur="${swing}s" repeatCount="indefinite"/></g>`
    : `<g>${p.tool}</g>`

  const upper =
    r(2, 6, 11, 7, ORANGE) +
    r(2, 12, 11, 1, ORANGE_DARK) +
    r(0, 9, 2, 2, ORANGE) +
    r(13, 9, 1, 2, ORANGE) +
    eye(4) +
    eye(10) +
    p.hat

  const body = isActive
    ? `<g>${upper}<animateTransform attributeName="transform" type="translate" values="0 0;0 0.3;0 0" keyTimes="0;0.5;1" ${spline} dur="${breathe}s" repeatCount="indefinite"/></g>`
    : `<g>${upper}</g>`

  const legs = r(3, 13, 1, 2, ORANGE) + r(5, 13, 1, 2, ORANGE) + r(9, 13, 1, 2, ORANGE) + r(11, 13, 1, 2, ORANGE)

  const badge =
    state === 'done'
      ? `<circle cx="13.2" cy="12.2" r="2.5" fill="#2F9E55" stroke="#FFFFFF" stroke-width="0.5"/>` +
        `<path d="M11.9 12.3l0.9 0.9 1.8-2" fill="none" stroke="#FFFFFF" stroke-width="0.65" stroke-linecap="round" stroke-linejoin="round"/>`
      : state === 'failed'
        ? `<circle cx="13.2" cy="12.2" r="2.5" fill="#8C8C8C" stroke="#FFFFFF" stroke-width="0.5"/>` +
          `<path d="M12.2 12.2h2" stroke="#FFFFFF" stroke-width="0.7" stroke-linecap="round"/>`
        : ''

  // Fertig: nach gut 2 Sekunden langsam ausblenden
  const fade = isActive
    ? ''
    : `<animate attributeName="opacity" from="1" to="0" begin="2.4s" dur="1.4s" fill="freeze"/>`

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-0.5 -0.5 17 16" width="75" height="71" shape-rendering="crispEdges">` +
    `<g>${legs}${tool}${body}${badge}${fade}</g></svg>`
  )
}

export const COSTUME_LABEL: Record<Costume, string> = {
  detektiv: 'Detektiv',
  koch: 'Koch',
  bauarbeiter: 'Bauarbeiter',
  zauberer: 'Zauberer',
  jaeger: 'Jäger',
  astronaut: 'Astronaut',
}
