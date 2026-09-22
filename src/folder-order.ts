export interface FolderNode {
    name: string
    path: string
    children?: FolderNode[]
}

// Keep each subtree together, as in the file explorer, including collapsed folders.
export function orderedFolders<T extends FolderNode>(
    root: T,
    reverse = false,
    explorerOrder?: (folder: T) => T[] | undefined
): T[] {
    const collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'})
    const result: T[] = []
    const visit = (parent: T) => {
        const children = (parent.children ?? []).filter(child => Array.isArray(child.children)) as T[]
        let ordered: T[] | undefined
        try {
            const candidates = explorerOrder?.(parent)?.filter(child => Array.isArray(child.children))
            if (candidates?.length === children.length &&
                new Set(candidates.map(child => child.path)).size === children.length &&
                children.every(child => candidates.some(candidate => candidate.path === child.path))) {
                ordered = candidates
            }
        } catch (_) {
            // Internal explorer APIs are optional; fall back to natural name order.
        }
        ordered ??= children.sort((a, b) =>
            (reverse ? -1 : 1) * collator.compare(a.name, b.name))
        for (const child of ordered) {
            result.push(child)
            visit(child)
        }
    }
    visit(root)
    return result
}
