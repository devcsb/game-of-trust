import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from 'lz-string'
import type { AppConfig } from './store'
import { DEFAULT_CONFIG } from './store'

export function encodeConfig(c: AppConfig): string {
  return compressToEncodedURIComponent(JSON.stringify(c))
}

export function decodeConfig(s: string): AppConfig | null {
  try {
    const json = decompressFromEncodedURIComponent(s)
    if (!json) return null
    const parsed = JSON.parse(json) as Partial<AppConfig>
    return { ...DEFAULT_CONFIG, ...parsed }
  } catch {
    return null
  }
}

export function loadConfigFromUrl(): AppConfig {
  const h = window.location.hash.replace(/^#/, '')
  if (!h) return DEFAULT_CONFIG
  return decodeConfig(h) ?? DEFAULT_CONFIG
}

export function syncConfigToUrl(c: AppConfig): void {
  window.history.replaceState(null, '', `#${encodeConfig(c)}`)
}
