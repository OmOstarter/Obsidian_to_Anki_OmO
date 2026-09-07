import {
	AnkiConnectNoteAndID,
	AnkiConnectNoteInfo,
	AnkiFieldChange,
	AnkiNoteChange
} from './interfaces/note-interface'

function normaliseLineEndings(value: string): string {
	return value
		.replace(/\r\n?/g, "\n")
		// Anki escapes greater-than signs in plain text (for example in the
		// generated "folder > heading" context) when fields are stored.
		.replace(/&gt;/gi, ">")
}

export function replaceNoteId(text: string, oldIdentifier: number, newIdentifier: number): string {
	const pattern = new RegExp(String.raw`((?:<!--)?ID:\s*)${oldIdentifier}(?=\D|$)`, 'g')
	return text.replace(pattern, (_match, prefix) => prefix + newIdentifier.toString())
}

export function getChangedFields(
	parsed: AnkiConnectNoteAndID,
	current: AnkiConnectNoteInfo
): AnkiFieldChange[] {
	let changes: AnkiFieldChange[] = []
	for (let [field, after] of Object.entries(parsed.note.fields)) {
		const before = current.fields[field]?.value ?? ""
		if (normaliseLineEndings(before) !== normaliseLineEndings(after)) {
			changes.push({field, before, after})
		}
	}
	return changes
}

export function getNoteChange(
	path: string,
	parsed: AnkiConnectNoteAndID,
	current: AnkiConnectNoteInfo
): AnkiNoteChange | null {
	if (parsed.identifier == null) {
		return null
	}
	const fields = getChangedFields(parsed, current)
	if (fields.length === 0) {
		return null
	}
	return {
		identifier: parsed.identifier,
		path,
		modelName: parsed.note.modelName,
		action: 'update',
		fields
	}
}

export function getRecreatedNoteChange(
	path: string,
	parsed: AnkiConnectNoteAndID
): AnkiNoteChange | null {
	if (parsed.identifier == null) {
		return null
	}
	return {
		identifier: parsed.identifier,
		path,
		modelName: parsed.note.modelName,
		action: 'recreate',
		fields: Object.entries(parsed.note.fields).map(([field, after]) => ({
			field,
			before: '',
			after
		}))
	}
}
