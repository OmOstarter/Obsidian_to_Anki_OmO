import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, mkdtempSync, copyFileSync, lstatSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
if (manifest.version !== pkg.version) throw new Error('Package and manifest versions must match.');
for (const value of [manifest.id, manifest.version]) {
    if (!/^[a-zA-Z0-9._-]+$/.test(value)) throw new Error('Invalid package name or version.');
}

const output = join(root, 'release');
mkdirSync(output, { recursive: true });
const staging = mkdtempSync(join(tmpdir(), 'obsidian-to-anki-release-'));
const copy = (file, destination) => {
    const source = join(root, file);
    if (!lstatSync(source).isFile()) throw new Error(`Expected a regular file: ${file}`);
    const target = join(destination, file);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(source, target);
};

const pluginDir = join(staging, manifest.id);
for (const file of ['main.js', 'manifest.json', 'styles.css', 'LICENSE']) copy(file, pluginDir);

// Export the working tree, including new source files and excluding ignored files.
const sourceName = `${manifest.id}-${manifest.version}-source`;
const sourceDir = join(staging, sourceName);
const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
    cwd: root, encoding: 'utf8'
}).split('\0').filter(Boolean);
const ignored = execFileSync('git', ['ls-files', '--cached', '--ignored', '--exclude-standard', '-z'], {
    cwd: root, encoding: 'utf8'
}).split('\0');
const excluded = new Set(ignored);
for (const file of new Set(files)) {
    if (!excluded.has(file)) copy(file, sourceDir);
}

// Create fresh archives so files from earlier packages cannot remain in a ZIP.
for (const [folder, name] of [
    [manifest.id, `${manifest.id}-${manifest.version}.zip`],
    [sourceName, `${sourceName}.zip`]
]) {
    const archive = join(staging, name);
    execFileSync('zip', ['-q', '-r', archive, folder], { cwd: staging });
    copyFileSync(archive, join(output, name));
    console.log(`Created release/${name}`);
}
for (const file of ['main.js', 'manifest.json', 'styles.css']) {
    copyFileSync(join(pluginDir, file), join(output, file));
}
