# Obsidian_to_Anki OmO

[繁體中文](#繁體中文) | [English](#english)

## 繁體中文

將 Obsidian 的 Markdown 筆記匯出為 Anki 卡片，支援自訂卡片語法、筆記類型、牌組、標籤、圖片、音訊與數學公式。

本專案是 [Pseudonium/Obsidian_to_Anki](https://github.com/Pseudonium/Obsidian_to_Anki) 的衍生版本，保留原專案功能，並加入以下改進：

- **直接匯入與更新**：點選匯入後直接同步卡片，不需逐張確認變更。
- **遺失卡片復原**：當筆記中的卡片 ID 已不存在於 Anki 時，會自動重新建立卡片，並更新 Markdown 中的 ID。使用多台電腦時，請先完成 Anki 同步再匯入，避免將尚未同步的卡片重新建立。
- **共用設定**：支援透過共用設定檔保存與載入插件設定。
- **筆記連結改進**：改善 Anki 卡片返回 Obsidian 筆記的連結處理。
- **緊湊的 Folder Table**：表格配合設定頁寬度，長路徑自動換行；資料夾依階層排列，優先沿用檔案總管排序，無法取得時使用自然名稱排序。

### 安裝此版本

1. 在 Anki 安裝 AnkiConnect，並依[原專案設定說明](https://github.com/Pseudonium/Obsidian_to_Anki/wiki)完成連線設定。
2. 從[本專案的 Releases](https://github.com/OmOstarter/Obsidian_to_Anki_OmO/releases) 下載 `main.js`、`manifest.json`、`styles.css`。
3. 將這三個檔案放入 Obsidian 筆記庫的 `.obsidian/plugins/obsidian-to-anki-plugin/` 資料夾；若資料夾不存在，請先建立。
4. 重新啟動 Obsidian，在「設定 → 社群外掛」中啟用插件。
5. 同步卡片時保持 Anki 開啟，使用側邊欄的 Anki 圖示執行同步。

也可以下載插件 ZIP，解壓縮至 `.obsidian/plugins/`，確認 `main.js` 位於上述插件資料夾內。

此版本沿用原插件 ID，安裝後會取代同一筆記庫中的原版插件。請先備份原有插件資料夾。從 Obsidian 社群外掛清單安裝的是原版；請使用本專案 Releases 安裝此版本。

### 使用方式

在插件設定中選擇掃描範圍、預設牌組與卡片語法，再依指定語法撰寫筆記。執行同步後，插件會將卡片匯出至 Anki；之後可繼續在 Markdown 中修改內容並同步更新。

支援自訂筆記類型、整份檔案的標籤、依檔案指定牌組、忽略資料夾與檔案，以及使用正規表示式定義卡片語法。自訂語法預設不啟用，需先在設定中配置。詳細語法與範例可參考下方英文文件及[原專案 Wiki](https://github.com/Pseudonium/Obsidian_to_Anki/wiki)。

### 建置與封裝

開發環境需要 Node.js、npm、Git 與 `zip`。在專案根目錄執行：

```sh
npm ci
npm run package-release
```

封裝指令會執行單元測試、建置插件，並將以下檔案輸出至 `release/`：

- `main.js`、`manifest.json`、`styles.css`：手動安裝所需的三個檔案。
- `obsidian-to-anki-plugin-<版本>.zip`：可解壓縮至插件目錄的安裝包，內含授權檔案。
- `obsidian-to-anki-plugin-<版本>-source.zip`：目前工作目錄的原始碼，不包含 Git 歷史與已排除的本機檔案。

### 發布至 GitHub

建立 GitHub Release 時，使用與 `manifest.json` 相同的版本標籤，並附上 `release/` 內的 `main.js`、`manifest.json`、`styles.css`，也可一併提供插件 ZIP。README 下方保留原專案的英文說明與使用範例。

### 原專案與授權

本專案衍生自 Pseudonium 的 Obsidian_to_Anki，保留原作者資訊與 [LICENSE](LICENSE) 授權檔案。

## English

This repository is a fork of [Pseudonium/Obsidian_to_Anki](https://github.com/Pseudonium/Obsidian_to_Anki). It imports and updates cards directly without a confirmation dialog, automatically recreates missing cards, and adds shared settings and improvements to Obsidian file links. When using multiple computers, sync Anki before importing to avoid recreating cards that have not synced yet.

## Install this fork

Download `main.js`, `manifest.json`, and `styles.css` from this repository's GitHub Releases and place them in your vault under `.obsidian/plugins/obsidian-to-anki-plugin/`. Restart Obsidian and enable the plugin. Anki must be running with AnkiConnect installed when syncing.

This fork uses the original plugin ID, so installing it replaces the original plugin in that vault. Back up your existing plugin folder first.

## Build and package

```sh
npm ci
npm run package-release
```

The packaging command runs the unit tests, builds the plugin, and writes the installation files and two ZIP archives to `release/`. The plugin ZIP contains the plugin folder ready to extract into `.obsidian/plugins/`. The source ZIP contains the current source files without repository history or ignored local files. Packaging requires Node.js, npm, Git, and `zip`.

To publish a GitHub Release, attach `release/main.js`, `release/manifest.json`, and `release/styles.css`; optionally attach the plugin ZIP. Use a tag matching the version in `manifest.json`. The documentation below describes the upstream plugin; community-plugin installation installs the upstream version.

## Upstream documentation

Plugin to add flashcards from a text or markdown file to Anki. Run in Obsidian as a plugin, or from the command-line as a python script. Built with [Obsidian](https://obsidian.md/) markdown syntax in mind. Supports **user-defined custom syntax for flashcards.**  
See the [Trello](https://trello.com/b/6MXEizGg/obsidiantoanki) for planned features.

## Getting started

Check out the [Wiki](https://github.com/Pseudonium/Obsidian_to_Anki/wiki)! It has a ton of information, including setup instructions for new users. I will include a copy of the instructions here:

## Setup

### All users
1. Start up [Anki](https://apps.ankiweb.net/), and navigate to your desired profile.
2. Ensure that you've installed [AnkiConnect](https://git.foosoft.net/alex/anki-connect).

### Obsidian plugin users
3. Have [Obsidian](https://obsidian.md/) downloaded
4. Search the 'Community plugins' list for this plugin
5. Install the plugin.
6. In Anki, navigate to Tools->Addons->AnkiConnect->Config, and change it to look like this:
<pre>
{
    "apiKey": null,
    "apiLogPath": null,
    "webBindAddress": "127.0.0.1",
    "webBindPort": 8765,
    "webCorsOrigin": "http://localhost",
    "webCorsOriginList": [
        "http://localhost",
        "app://obsidian.md"
    ]
}
</pre>

7. Restart Anki to apply the above changes
8. With Anki running in the background, load the plugin. This will generate the plugin settings.


You shouldn't need Anki running to load Obsidian in the future, though of course you will need it for using the plugin!

To run the plugin, look for an Anki icon on your ribbon (the place where buttons such as 'open Graph view' and 'open Quick Switcher' are).
For more information on use, please check out the [Wiki](https://github.com/Pseudonium/Obsidian_to_Anki/wiki)!

### Python script users
3. Install the latest version of [Python](https://www.python.org/downloads/).
4. If you are a new user, download `obstoanki_setup.py` from the [releases page](https://github.com/Pseudonium/Obsidian_to_Anki/releases), and place it in the folder you want the script installed (for example your notes folder).  
5. Run `obstoanki_setup.py`, for example by double-clicking it in a file explorer. This will download the latest version of the script and required dependencies automatically. Existing users should be able to run their existing `obstoanki_setup.py` to get the latest version of the script.  
6. Check the Permissions tab below to ensure the script is able to run.
7. Run `obsidian_to_anki.py`, for example by double-clicking it in a file explorer. This will generate a config file, `obsidian_to_anki_config.ini`.

#### Permissions
The script needs to be able to:
* Make a config file in the directory the script is installed.
* Read the file in the directory the script is used.
* Make a backup file in the directory the script is used.
* Rename files in the directory the script is used.
* Remove a backup file in the directory the script is used.
* Change the current working directory temporarily (so that local image paths are resolved correctly).

## Features

Current features (check out the wiki for more details):
* **Custom note types** - You're not limited to the 6 built-in note types of Anki.
* **Custom scan directory** 
  * The plugin will scan the entire vault by default
  * You can also set which directory (includes all sub-directories as well) to scan via plugin settings
* **Ignore Folders and Files**
  * You can specify which files and folders to ignore 
  * This can be done in the settings of this plugin with [Glob syntax](https://en.wikipedia.org/wiki/Glob_(programming)#Syntax).
  * If you're working on your own globs, you can test them out [here](https://globster.xyz/)
  * Examples:
    * `**/*.excalidraw.md` - Ignore all files that end in `.excalidraw.md`
      * => avoids excalidraw files from being scanned which can be extremely slow
    * `Template/**` - Ignore all files in the `Template` folder (including subfolders)
    * `**/private/**` - Ignore all files in folders that are called `private` no matter where they are in the vault
    * `[Pp]rivate*/**` - Ignore all files and folders in the root of the vault that start with `private` or with `Private`
* **Updating notes from file** - Your text files are the canonical source of the notes.
* **Tags**, including **tags for an entire file**.
* **Adding to user-specified deck** on a *per-file* basis.
* **Markdown formatting**.
* **Math formatting**.
* **Embedded images**. GIFs should work too.
* **Audio**.
* **Auto-deleting notes from the file**.
* **Reading from all files in a directory automatically** - recursively too!
* **Inline Notes** - Shorter syntax for typing out notes on a single line.
* **Easy cloze formatting** - A more compact syntax to do Cloze text
* **Frozen Fields**
* **Obsidian integration** - A link to the file that made the flashcard, full link and image embed support.
* **Custom syntax** - Using **regular expressions**, add custom syntax to generate **notes that make sense for you.** Some examples:
  * RemNote single-line style. `This is how to use::Remnote single-line style`  
  ![Remnote 1](Images/Remnote_1.png)
  * Header paragraph style.
  <pre>
  # Style
  This style is suitable for having the header as the front, and the answer as the back
  </pre>  
  ![Header 1](Images/Header_1.png)
  * Question answer style.
  <pre>
  Q: How do you use this style?
  A: Just like this.
  </pre>  
  ![Question 1](Images/Question_1.png)
  * Neuracache #flashcard style.  
  <pre>
  In Neuracache style, to make a flashcard you do #flashcard
  The next lines then become the back of the flashcard
  </pre>  
  ![Neuracache 1](Images/Neuracache_1.png)
  * Ruled style  
  <pre>
  How do you use ruled style?
  ---
  You need at least three '-' between the front and back of the card.
  </pre>  
  ![Ruled 1](Images/Ruled_1.png)
  * Markdown table style  
  <pre>
  | Why might this style be useful? |
  | ------ |
  | It looks nice when rendered as HTML in a markdown editor. |
  </pre>
  ![Table 2](Images/Table_2.png)
  * Cloze paragraph style  
  <pre>
  The idea of {cloze paragraph style} is to be able to recognise any paragraphs that contain {cloze deletions}.
  </pre>
  ![Cloze 1](Images/Cloze_1.png)

Note that **all custom syntax is off by default**, and must be programmed into the script via the config file - see the Wiki for more details.

<a href='https://ko-fi.com/K3K52X4L6' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://cdn.ko-fi.com/cdn/kofi1.png?v=2' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>
