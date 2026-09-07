export interface AnkiConnectNote {
	deckName: string,
	modelName: string,
	fields: Record<string, string>,
	options: {
		allowDuplicate: boolean,
		duplicateScope: string
	}
	tags: Array<string>,
}

export interface AnkiConnectNoteAndID {
	note: AnkiConnectNote,
	identifier: number | null
}

export interface AnkiConnectNoteInfo {
	noteId: number,
	modelName: string,
	tags: string[],
	fields: Record<string, {
		order: number,
		value: string
	}>,
	cards: number[],
	profile?: string,
	mod?: number
}

export interface AnkiFieldChange {
	field: string,
	before: string,
	after: string
}

export interface AnkiNoteChange {
	identifier: number,
	path: string,
	modelName: string,
	action: 'update' | 'recreate',
	fields: AnkiFieldChange[]
}
