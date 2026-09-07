import { App, Modal, Setting } from 'obsidian'
import { AnkiNoteChange } from './interfaces/note-interface'

export class SyncConfirmationModal extends Modal {
	private changes: AnkiNoteChange[]
	private resolveSelection: (selection: Set<number> | null) => void
	private settled: boolean = false
	private checkboxes: Map<number, HTMLInputElement> = new Map()

	constructor(
		app: App,
		changes: AnkiNoteChange[],
		resolveSelection: (selection: Set<number> | null) => void
	) {
		super(app)
		this.changes = changes
		this.resolveSelection = resolveSelection
	}

	onOpen() {
		const {contentEl} = this
		const recreationCount = this.changes.filter(change => change.action === 'recreate').length
		contentEl.empty()
		contentEl.addClass('anki-sync-confirmation')
		contentEl.createEl('h2', {text: '確認 Anki 卡片變更與復原'})
		contentEl.createEl('p', {
			text: `偵測到 ${this.changes.length} 張卡片需要處理。請勾選要同步到 Anki 的卡片。`
		})
		if (recreationCount > 0) {
			contentEl.createEl('p', {
				text: `${recreationCount} 張卡片的 ID 在 Anki 中不存在。確認後會重新建立，並把 Markdown 中的舊 ID 換成新 ID。若這台電腦只是尚未完成 Anki 同步，請先取消並同步 Anki。`,
				cls: 'anki-recreation-warning'
			})
		}

		for (let change of this.changes) {
			const card = contentEl.createDiv({cls: 'anki-change-card'})
			const header = card.createDiv({cls: 'anki-change-card-header'})
			const checkbox = header.createEl('input', {type: 'checkbox'})
			checkbox.checked = true
			checkbox.setAttribute('aria-label', `同步卡片 ${change.identifier}`)
			this.checkboxes.set(change.identifier, checkbox)

			const title = header.createDiv({cls: 'anki-change-card-title'})
			const action = change.action === 'recreate' ? '復原已刪除卡片' : '更新卡片'
			title.createEl('strong', {text: `${action} · ${change.modelName} · ID ${change.identifier}`})
			title.createDiv({text: change.path, cls: 'anki-change-card-path'})

			for (let field of change.fields) {
				const fieldEl = card.createDiv({cls: 'anki-field-change'})
				fieldEl.createEl('h4', {text: field.field})
				const comparison = fieldEl.createDiv({cls: 'anki-field-comparison'})
				this.addValue(
					comparison,
					change.action === 'recreate' ? '更新前（Anki 中不存在）' : '更新前（Anki）',
					field.before,
					'anki-before',
					change.action === 'recreate' ? '（卡片不存在）' : '（空白）'
				)
				this.addValue(comparison, '更新後（Obsidian）', field.after, 'anki-after')
			}
		}

		new Setting(contentEl)
			.addButton(button => button
				.setButtonText('全部取消勾選')
				.onClick(() => {
					const shouldSelect = Array.from(this.checkboxes.values()).some(input => !input.checked)
					for (let input of this.checkboxes.values()) {
						input.checked = shouldSelect
					}
					button.setButtonText(shouldSelect ? '全部取消勾選' : '全部勾選')
				}))
			.addButton(button => button
				.setButtonText('取消同步')
				.onClick(() => this.finish(null)))
			.addButton(button => button
				.setButtonText('確認同步勾選項目')
				.setCta()
				.onClick(() => {
					let selected = new Set<number>()
					for (let [identifier, input] of this.checkboxes) {
						if (input.checked) {
							selected.add(identifier)
						}
					}
					this.finish(selected)
				}))
	}

	private addValue(
		parent: HTMLElement,
		label: string,
		value: string,
		className: string,
		emptyValue: string = '（空白）'
	) {
		const column = parent.createDiv({cls: `anki-field-value ${className}`})
		column.createEl('div', {text: label, cls: 'anki-field-value-label'})
		column.createEl('pre', {text: value || emptyValue})
	}

	private finish(selection: Set<number> | null) {
		if (this.settled) {
			return
		}
		this.settled = true
		this.resolveSelection(selection)
		this.close()
	}

	onClose() {
		this.contentEl.empty()
		if (!this.settled) {
			this.settled = true
			this.resolveSelection(null)
		}
	}
}

export function confirmAnkiChanges(app: App, changes: AnkiNoteChange[]): Promise<Set<number> | null> {
	return new Promise(resolve => {
		new SyncConfirmationModal(app, changes, resolve).open()
	})
}
