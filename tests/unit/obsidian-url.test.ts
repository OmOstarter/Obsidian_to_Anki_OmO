import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { getObsidianUrl } from '../../src/obsidian-url'

test('builds an encoded Obsidian link with the source line', () => {
    const url = getObsidianUrl('My Vault', 'Folder/Card.md', 'first\r\nsecond\r\nthird', 7)
    assert.equal(url, 'obsidian://anki-card?vault=My%20Vault&file=Folder%2FCard.md&line=2')
})

test('uses the plugin protocol for exact editor positioning', () => {
    const url = getObsidianUrl('Vault', 'Card.md', '# Question\nSTART', 11)
    assert.equal(url, 'obsidian://anki-card?vault=Vault&file=Card.md&line=2')
})
