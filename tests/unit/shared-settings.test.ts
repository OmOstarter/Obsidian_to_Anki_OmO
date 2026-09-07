import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { PluginSettings } from '../../src/interfaces/settings-interface'
import {
	makeSharedSettings,
	mergeSharedSettings,
	parseSharedSettings,
	SHARED_SETTINGS_VERSION
} from '../../src/shared-settings'

function settings(): PluginSettings {
	return {
		CUSTOM_REGEXPS: {Basic: ''},
		FILE_LINK_FIELDS: {Basic: 'Front'},
		CONTEXT_FIELDS: {Basic: 'Back'},
		FOLDER_DECKS: {'90 資工': 'Programming'},
		FOLDER_TAGS: {'90 資工': 'coding'},
		Syntax: {
			'Begin Note': 'START', 'End Note': 'END',
			'Begin Inline Note': 'STARTI', 'End Inline Note': 'ENDI',
			'Target Deck Line': 'TARGET DECK', 'File Tags Line': 'FILE TAGS',
			'Delete Note Line': 'DELETE', 'Frozen Fields Line': 'FROZEN'
		},
		Defaults: {
			'Scan Directory': '', Tag: 'Obsidian_to_Anki', Deck: 'Default',
			'Scheduling Interval': 0, 'Add File Link': false, 'Add Context': false,
			CurlyCloze: false, 'CurlyCloze - Highlights to Clozes': false,
			'ID Comments': true, 'Add Obsidian Tags': false
		},
		IGNORED_FILE_GLOBS: ['**/*.excalidraw.md']
	}
}

test('shared settings round-trip without local-only data', () => {
	const original = settings()
	const shared = makeSharedSettings(original)
	const parsed = parseSharedSettings(JSON.stringify(shared))
	assert.deepEqual(parsed, original)
	assert.equal(shared.version, SHARED_SETTINGS_VERSION)
})

test('shared settings merge preserves local sections not in the shared file', () => {
	const local = settings()
	local.Defaults.Deck = 'Local'
	const shared = settings()
	shared.Defaults.Deck = 'Shared'
	shared.FOLDER_DECKS = {'90 資工/HackerRank': 'HackerRank'}

	const merged = mergeSharedSettings(local, shared)
	assert.equal(merged.Defaults.Deck, 'Shared')
	assert.deepEqual(merged.FOLDER_DECKS, {'90 資工/HackerRank': 'HackerRank'})
})

test('invalid shared settings are rejected', () => {
	assert.equal(parseSharedSettings('{"version": 99, "settings": {}}'), null)
	assert.equal(parseSharedSettings('not json'), null)
})
