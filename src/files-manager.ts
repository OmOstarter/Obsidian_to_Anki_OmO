/*Class for managing a list of files, and their Anki requests.*/
import { ParsedSettings, FileData } from './interfaces/settings-interface'
import { App, TFile, TFolder, TAbstractFile, CachedMetadata, FileSystemAdapter, Notice } from 'obsidian'
import { AllFile } from './file'
import * as AnkiConnect from './anki'
import { AnkiConnectNoteInfo, AnkiNoteChange } from './interfaces/note-interface'
import { getNoteChange, getRecreatedNoteChange } from './note-change'
import { basename } from 'path'
import multimatch from "multimatch"
interface addNoteResponse {
    result: number,
    error: string | null
}

const NOTE_INFO_BATCH_SIZE = 500

interface Requests1Result {
    0: {
        error: string | null,
        result: Array<{
            result: addNoteResponse[],
            error: string | null
        }>
    },
    1: {
        error: string | null,
        result: string[]
    },
    2: any,
    3: any,
    4: any

}

function difference<T>(setA: Set<T>, setB: Set<T>): Set<T> {
    let _difference = new Set(setA)
    for (let elem of setB) {
        _difference.delete(elem)
    }
    return _difference
}


export class FileManager {
    app: App
    data: ParsedSettings
    files: TFile[]
    ownFiles: Array<AllFile>
    file_hashes: Record<string, string>
    requests_1_result: any
    added_media_set: Set<string>
    approved_note_ids: Set<number>
    unavailable_note_ids: number[]
    changed_note_ids: Set<number>
    current_notes_by_id: Map<number, AnkiConnectNoteInfo>

    constructor(app: App, data:ParsedSettings, files: TFile[], file_hashes: Record<string, string>, added_media: string[]) {
        this.app = app
        this.data = data

        this.files = this.findFilesThatAreNotIgnored(files, data);

        this.ownFiles = []
        this.file_hashes = file_hashes
        this.added_media_set = new Set(added_media)
        this.approved_note_ids = new Set()
        this.unavailable_note_ids = []
        this.changed_note_ids = new Set()
        this.current_notes_by_id = new Map()
    }
    getUrl(file: TFile): string {
        return "obsidian://open?vault=" + encodeURIComponent(this.data.vault_name) + String.raw`&file=` + encodeURIComponent(file.path)
    }

    findFilesThatAreNotIgnored(files:TFile[], data:ParsedSettings):TFile[]{
        let ignoredFiles = []
        ignoredFiles = multimatch(files.map(file => file.path), data.ignored_file_globs)

        let notIgnoredFiles = files.filter(file => !ignoredFiles.contains(file.path))
        return notIgnoredFiles;
    }

    getFolderPathList(file: TFile): TFolder[] {
        let result: TFolder[] = []
        let abstractFile: TAbstractFile = file
        while (abstractFile && abstractFile.hasOwnProperty('parent')) {
            result.push(abstractFile.parent)
            abstractFile = abstractFile.parent
        }
        result.pop() // Removes top-level vault
        return result
    }

    getDefaultDeck(file: TFile, folder_path_list: TFolder[]): string {
        let folder_decks = this.data.folder_decks
        for (let folder of folder_path_list) {
            // Loops over them from innermost folder
            if (folder_decks[folder.path]) {
                return folder_decks[folder.path]
            }
        }
        // If no decks specified
        return this.data.template.deckName
    }

    getDefaultTags(file: TFile, folder_path_list: TFolder[]): string[] {
        let folder_tags = this.data.folder_tags
        let tags_list: string[] = []
        for (let folder of folder_path_list) {
            // Loops over them from innermost folder
            if (folder_tags[folder.path]) {
                tags_list.push(...folder_tags[folder.path].split(" "))
            }
        }
        tags_list.push(...this.data.template.tags)
        return tags_list
    }

    dataToFileData(file: TFile): FileData {
        const folder_path_list: TFolder[] = this.getFolderPathList(file)
        let result: FileData = JSON.parse(JSON.stringify(this.data))
        //Lost regexp, so have to get them back
        result.FROZEN_REGEXP = this.data.FROZEN_REGEXP
        result.DECK_REGEXP = this.data.DECK_REGEXP
        result.TAG_REGEXP = this.data.TAG_REGEXP
        result.NOTE_REGEXP = this.data.NOTE_REGEXP
        result.INLINE_REGEXP = this.data.INLINE_REGEXP
        result.EMPTY_REGEXP = this.data.EMPTY_REGEXP
        result.template.deckName = this.getDefaultDeck(file, folder_path_list)
        result.template.tags = this.getDefaultTags(file, folder_path_list)
        return result
    }

    async genAllFiles() {
        for (let file of this.files) {
            const content: string = await this.app.vault.read(file)
            const cache: CachedMetadata = this.app.metadataCache.getCache(file.path)
            const file_data = this.dataToFileData(file)
            this.ownFiles.push(
                new AllFile(
                    content,
                    file.path,
                    this.data.add_file_link ? this.getUrl(file) : "",
                    file_data,
                    cache
                )
            )
        }
    }

    async initialiseFiles() {
        await this.genAllFiles()
        let files_changed: Array<AllFile> = []
        let obfiles_changed: TFile[] = []
        for (let index in this.ownFiles) {
            const i = parseInt(index)
            let file = this.ownFiles[i]
            const hashChanged = !(this.file_hashes.hasOwnProperty(file.path) && file.getHash() === this.file_hashes[file.path])
            // Files containing IDs must be revalidated against this computer's Anki
            // collection. The hash cache may have been copied from another computer.
            if (hashChanged || file.hasExistingNoteIDs()) {
                console.info("Scanning ", file.path, hashChanged ? "as it's changed or new." : "to verify existing Anki notes.")
                file.scanFile()
                files_changed.push(file)
                obfiles_changed.push(this.files[i])
            }
        }
        this.ownFiles = files_changed
        this.files = obfiles_changed
    }

    async prepareNoteChanges(): Promise<AnkiNoteChange[]> {
        let identifiers: number[] = []
        for (let file of this.ownFiles) {
            file.card_ids = []
            for (let parsed of file.notes_to_edit) {
                if (parsed.identifier != null) {
                    identifiers.push(parsed.identifier)
                }
            }
        }

        identifiers = Array.from(new Set(identifiers))
        let currentNotes: AnkiConnectNoteInfo[] = []
        for (let start = 0; start < identifiers.length; start += NOTE_INFO_BATCH_SIZE) {
            const batch = identifiers.slice(start, start + NOTE_INFO_BATCH_SIZE)
            const response = await AnkiConnect.invoke('notesInfo', {notes: batch}) as AnkiConnectNoteInfo[]
            currentNotes.push(...response.filter(note => typeof note?.noteId === 'number'))
        }

        const currentById = new Map<number, AnkiConnectNoteInfo>()
        for (let note of currentNotes) {
            currentById.set(note.noteId, note)
        }
        this.current_notes_by_id = currentById

        this.unavailable_note_ids = identifiers.filter(identifier => !currentById.has(identifier))
        for (let identifier of this.unavailable_note_ids) {
            console.warn("Note with id", identifier, "does not exist in this Anki collection. Sync Anki on this computer first.")
        }

        let changes: AnkiNoteChange[] = []
        let compared = new Set<number>()
        for (let file of this.ownFiles) {
            for (let parsed of file.notes_to_edit) {
                const identifier = parsed.identifier
                if (identifier == null) {
                    continue
                }
                if (compared.has(identifier)) {
                    console.warn("Duplicate Anki note id", identifier, "was found in", file.path)
                    continue
                }
                compared.add(identifier)
                const current = currentById.get(identifier)
                if (!current) {
                    const recreation = getRecreatedNoteChange(file.path, parsed)
                    if (recreation) {
                        changes.push(recreation)
                    }
                    continue
                }
                file.card_ids.push(...current.cards)
                if (current.modelName !== parsed.note.modelName) {
                    console.warn(
                        "Note with id", identifier, "uses model", current.modelName,
                        "in Anki but", parsed.note.modelName, "in", file.path
                    )
                    continue
                }
                const change = getNoteChange(file.path, parsed, current)
                if (change) {
                    changes.push(change)
                }
            }
        }
        this.changed_note_ids = new Set(changes.map(change => change.identifier))
        return changes
    }

    setApprovedNoteChanges(identifiers: Set<number>) {
        this.approved_note_ids = identifiers
        const approvedMissing = new Set(
            this.unavailable_note_ids.filter(identifier => identifiers.has(identifier))
        )
        const rejected = new Set(
            Array.from(this.changed_note_ids).filter(identifier => !identifiers.has(identifier))
        )
        let queuedRecreations = new Set<number>()
        for (let file of this.ownFiles) {
            const recreationsForFile = new Set<number>()
            for (let parsed of file.notes_to_edit) {
                if (
                    parsed.identifier != null &&
                    approvedMissing.has(parsed.identifier) &&
                    !queuedRecreations.has(parsed.identifier)
                ) {
                    recreationsForFile.add(parsed.identifier)
                    queuedRecreations.add(parsed.identifier)
                }
            }
            file.queueMissingNotesForRecreation(recreationsForFile)
            file.notes_to_edit = file.notes_to_edit.filter(parsed =>
                parsed.identifier != null &&
                this.current_notes_by_id.has(parsed.identifier) &&
                !rejected.has(parsed.identifier)
            )
            file.card_ids = []
            for (let parsed of file.notes_to_edit) {
                if (parsed.identifier == null) {
                    continue
                }
                const current = this.current_notes_by_id.get(parsed.identifier)
                if (current) {
                    file.card_ids.push(...current.cards)
                }
            }
        }
    }

    async requests_1() {
        let requests: AnkiConnect.AnkiConnectRequest[] = []
        let temp: AnkiConnect.AnkiConnectRequest[] = []
        console.info("Requesting addition of new deck into Anki...")
        for (let file of this.ownFiles) {
            temp.push(file.getCreateDecks())
        }
        requests.push(AnkiConnect.multi(temp))
        temp = []
        console.info("Requesting addition of notes into Anki...")
        for (let file of this.ownFiles) {
            temp.push(file.getAddNotes())
        }
        requests.push(AnkiConnect.multi(temp))
        temp = []
        console.info("Requesting tag list...")
        requests.push(AnkiConnect.getTags())
        console.info("Requesting update of fields of existing notes")
        for (let file of this.ownFiles) {
            temp.push(file.getUpdateFields(this.approved_note_ids))
        }
        requests.push(AnkiConnect.multi(temp))
        temp = []
        console.info("Requesting deletion of notes..")
        for (let file of this.ownFiles) {
            temp.push(file.getDeleteNotes())
        }
        requests.push(AnkiConnect.multi(temp))
        temp = []
        console.info("Requesting addition of media...")
        for (let file of this.ownFiles) {
            const mediaLinks = difference(file.formatter.detectedMedia, this.added_media_set)
            for (let mediaLink of mediaLinks) {
                console.log("Adding media file: ", mediaLink)
                const dataFile = this.app.metadataCache.getFirstLinkpathDest(mediaLink, file.path)
                if (!(dataFile)) {
                    console.warn("Couldn't locate media file ", mediaLink)
                }
                else {
                    // Located successfully, so treat as if we've added the media
                    this.added_media_set.add(mediaLink)
                    const realPath = (this.app.vault.adapter as FileSystemAdapter).getFullPath(dataFile.path)
                    temp.push(
                        AnkiConnect.storeMediaFileByPath(
                            basename(mediaLink),
                            realPath
                        )
                    )
                }
            }
        }
        requests.push(AnkiConnect.multi(temp))
        temp = []
        this.requests_1_result = ((await AnkiConnect.invoke('multi', {actions: requests}) as Array<Object>).slice(1) as any)
        await this.parse_requests_1()
    }

    async parse_requests_1() {
        const response = this.requests_1_result as Requests1Result
        if (response[4].result.length >= 1 && response[4].result[0].error != null) {
            new Notice("Please update AnkiConnect! The way the script has added media files has changed.")
            console.warn("Please update AnkiConnect! The way the script has added media files has changed.")
        }
        let note_ids_array_by_file: Requests1Result[0]["result"]
        try {
            note_ids_array_by_file = AnkiConnect.parse(response[0])
        } catch(error) {
            console.error("Error: ", error)
            note_ids_array_by_file = response[0].result
        }
        const tag_list: string[] = AnkiConnect.parse(response[1])
        for (let index in note_ids_array_by_file) {
            let i: number = parseInt(index)
            let file = this.ownFiles[i]
            let file_response: addNoteResponse[]
            try {
                file_response = AnkiConnect.parse(note_ids_array_by_file[i])
            } catch(error) {
                console.error("Error: ", error)
                file_response = note_ids_array_by_file[i].result
            }
            file.note_ids = []
            for (let index in file_response) {
                let i = parseInt(index)
                let response = file_response[i]
                try {
                    file.note_ids.push(AnkiConnect.parse(response))
                } catch (error) {
                    console.warn("Failed to add note ", file.all_notes_to_add[i], " in file", file.path, " due to error ", error)
                    file.note_ids.push(response.result)
                }
            }
        }
        for (let index in this.ownFiles) {
            let i: number = parseInt(index)
            let ownFile = this.ownFiles[i]
            let obFile = this.files[i]
            ownFile.tags = tag_list
            ownFile.writeIDs()
            ownFile.removeEmpties()
            if (ownFile.file !== ownFile.original_file) {
                await this.app.vault.modify(obFile, ownFile.file)
            }
        }
        await this.requests_2()
    }

    getHashes(): Record<string, string> {
        let result: Record<string, string> = {}
        for (let file of this.ownFiles) {
            result[file.path] = file.getHash()
        }
        return result
    }

    async requests_2(): Promise<void> {
        let requests: AnkiConnect.AnkiConnectRequest[] = []
        let temp: AnkiConnect.AnkiConnectRequest[] = []
        console.info("Requesting cards to be moved to target deck...")
        for (let file of this.ownFiles) {
            temp.push(file.getChangeDecks())
        }
        requests.push(AnkiConnect.multi(temp))
        temp = []
        console.info("Requesting tags to be replaced...")
        for (let file of this.ownFiles) {
            let rem = file.getClearTags()
            if(rem.params.notes.length) {
                temp.push(rem)
            }
        }
        requests.push(AnkiConnect.multi(temp))
        temp = []
        for (let file of this.ownFiles) {
            temp.push(file.getAddTags())
        }
        requests.push(AnkiConnect.multi(temp))
        temp = []
        await AnkiConnect.invoke('multi', {actions: requests})
        console.info("All done!")
    }



}
