import { PluginSettings } from './interfaces/settings-interface'

export const SHARED_SETTINGS_PATH = '.obsidian-to-anki-settings.json'
export const SHARED_SETTINGS_VERSION = 1

export interface SharedSettingsFile {
	version: number,
	updatedAt: number,
	settings: PluginSettings
}

export function makeSharedSettings(settings: PluginSettings): SharedSettingsFile {
	return {
		version: SHARED_SETTINGS_VERSION,
		updatedAt: Date.now(),
		settings: JSON.parse(JSON.stringify(settings))
	}
}

export function parseSharedSettings(raw: string): PluginSettings | null {
	try {
		const parsed = JSON.parse(raw) as Partial<SharedSettingsFile>
		if (!parsed || parsed.version !== SHARED_SETTINGS_VERSION || !parsed.settings) {
			return null
		}
		const settings = parsed.settings as PluginSettings
		const isRecord = (value: unknown): boolean =>
			value !== null && typeof value === 'object' && !Array.isArray(value)
		if (
			!isRecord(settings.CUSTOM_REGEXPS) ||
			!isRecord(settings.FILE_LINK_FIELDS) ||
			!isRecord(settings.CONTEXT_FIELDS) ||
			!isRecord(settings.FOLDER_DECKS) ||
			!isRecord(settings.FOLDER_TAGS) ||
			!isRecord(settings.Syntax) ||
			!isRecord(settings.Defaults) ||
			!Array.isArray(settings.IGNORED_FILE_GLOBS)
		) {
			return null
		}
		return JSON.parse(JSON.stringify(settings))
	} catch (_error) {
		return null
	}
}

export function mergeSharedSettings(
	local: PluginSettings,
	shared: PluginSettings
): PluginSettings {
	return {
		...local,
		...shared,
		Syntax: {...local.Syntax, ...shared.Syntax},
		Defaults: {...local.Defaults, ...shared.Defaults}
	}
}
