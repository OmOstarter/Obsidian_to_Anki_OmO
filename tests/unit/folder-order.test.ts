import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { orderedFolders, FolderNode } from '../../src/folder-order'

const root: FolderNode = {name: '', path: '', children: [
    {name: '10', path: '10', children: []},
    {name: '2', path: '2', children: [
        {name: '子資料夾', path: '2/子資料夾', children: []},
        {name: 'note.md', path: '2/note.md'}
    ]},
    {name: '1', path: '1', children: []}
]}

test('uses natural order and keeps descendants directly after their parent', () => {
    assert.deepEqual(orderedFolders(root).map(f => f.path), ['1', '2', '2/子資料夾', '10'])
    assert.equal(root.children[0].name, '10')
})

test('supports reverse alphabetical order', () => {
    assert.deepEqual(orderedFolders(root, true).map(f => f.path), ['10', '2', '2/子資料夾', '1'])
})

test('uses explorer ordering when available and falls back if the API fails', () => {
    assert.deepEqual(orderedFolders(root, false, f => f.children).map(f => f.path),
        ['10', '2', '2/子資料夾', '1'])
    assert.deepEqual(orderedFolders(root, false, () => {throw new Error('unavailable')}).map(f => f.path),
        ['1', '2', '2/子資料夾', '10'])
})
