/** Build a link that opens the source location of an Obsidian card. */
export function getObsidianUrl(
    vaultName: string,
    filePath: string,
    fileContents: string,
    position: number
): string {
    const line = fileContents.slice(0, Math.max(0, position)).split(/\r\n|\r|\n/).length
    const target = filePath
    return "obsidian://anki-card?vault=" + encodeURIComponent(vaultName)
        + "&file=" + encodeURIComponent(target)
        + "&line=" + line.toString()
}
