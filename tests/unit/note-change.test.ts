import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { AnkiConnectNoteAndID, AnkiConnectNoteInfo } from '../../src/interfaces/note-interface'
import {
	getChangedFields,
	getNoteChange,
	getRecreatedNoteChange,
	replaceNoteId
} from '../../src/note-change'

function parsed(fields: Record<string, string>): AnkiConnectNoteAndID {
	return {
		identifier: 1788711877127,
		note: {
			deckName: 'Default',
			modelName: 'Basic',
			fields,
			options: {allowDuplicate: false, duplicateScope: 'deck'},
			tags: ['Obsidian_to_Anki']
		}
	}
}

function current(fields: Record<string, string>): AnkiConnectNoteInfo {
	let result: AnkiConnectNoteInfo['fields'] = {}
	let order = 0
	for (let [field, value] of Object.entries(fields)) {
		result[field] = {order, value}
		order += 1
	}
	return {
		noteId: 1788711877127,
		modelName: 'Basic',
		tags: ['Obsidian_to_Anki'],
		fields: result,
		cards: [1788711877127]
	}
}

test('reports the old and new value for every changed field', () => {
	const changes = getChangedFields(
		parsed({Front: 'new front', Back: 'new back'}),
		current({Front: 'old front', Back: 'old back'})
	)

	assert.deepEqual(changes, [
		{field: 'Front', before: 'old front', after: 'new front'},
		{field: 'Back', before: 'old back', after: 'new back'}
	])
})

test('does not create a false change for different line endings', () => {
	const changes = getChangedFields(
		parsed({Front: 'same\nvalue'}),
		current({Front: 'same\r\nvalue'})
	)

	assert.deepEqual(changes, [])
})

test('does not create a false change for Anki-escaped context separators', () => {
	const changes = getChangedFields(
		parsed({Context: 'file > heading'}),
		current({Context: 'file &gt; heading'})
	)

	assert.deepEqual(changes, [])
})

test('includes the portable Anki note ID and source path in a change', () => {
	const change = getNoteChange(
		'90 資工/HackerRank/HackerRank.md',
		parsed({Front: 'test', Back: 'test2'}),
		current({Front: 'test', Back: 'test'})
	)

	assert.deepEqual(change, {
		identifier: 1788711877127,
		path: '90 資工/HackerRank/HackerRank.md',
		modelName: 'Basic',
		action: 'update',
		fields: [{field: 'Back', before: 'test', after: 'test2'}]
	})
})

test('describes every field when a deleted Anki note must be recreated', () => {
	const change = getRecreatedNoteChange(
		'90 資工/HackerRank/HackerRank.md',
		parsed({Front: 'test', Back: 'test2'})
	)

	assert.deepEqual(change, {
		identifier: 1788711877127,
		path: '90 資工/HackerRank/HackerRank.md',
		modelName: 'Basic',
		action: 'recreate',
		fields: [
			{field: 'Front', before: '', after: 'test'},
			{field: 'Back', before: '', after: 'test2'}
		]
	})
})

test('replaces a deleted note ID while preserving comment syntax', () => {
	const markdown = 'Back: test2\n<!--ID: 1788711877127-->\nEND'
	assert.equal(
		replaceNoteId(markdown, 1788711877127, 1788719999999),
		'Back: test2\n<!--ID: 1788719999999-->\nEND'
	)
})
