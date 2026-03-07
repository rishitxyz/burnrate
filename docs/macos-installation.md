# macOS Native App Installation

## Homebrew (recommended)

```bash
brew install pratik1235/burnrate/burnrate
```

This automatically downloads the correct DMG for your chip, installs the app, and clears quarantine.

## Manual Download

Download the DMG for your Mac from the [latest GitHub release](https://github.com/pratik1235/burnrate/releases/latest):

| Mac | File |
|-----|------|
| Apple Silicon (M1/M2/M3/M4) | `Burnrate_aarch64.dmg` |
| Intel | `Burnrate_x86_64.dmg` |

## Opening the DMG

Since Burnrate is not signed with an Apple Developer ID certificate, macOS Gatekeeper will block the DMG when first downloaded. You will see a message like:

- **"can't be opened because it is from an unidentified developer"**
- **"can't be opened because Apple cannot check it for malicious software"**

**Fix:** Right-click (or Control-click) the downloaded `.dmg` file, select **Open**, and click **Open** in the confirmation dialog. The DMG will mount and show the Burnrate app icon alongside an Applications folder.

**Alternative (Terminal):** If right-click doesn't work (e.g. on macOS Sequoia), open Terminal and run:

```bash
xattr -cr ~/Downloads/Burnrate_aarch64.dmg
```

Replace the filename with the actual DMG you downloaded, then double-click to open.

## Install

1. Open the downloaded `.dmg` file (see above if blocked by Gatekeeper)
2. Drag **Burnrate** into the **Applications** folder
3. Eject the DMG

## First Launch

After installing, macOS may also block the app on first launch. You will see a similar Gatekeeper message.

**Fix:** Right-click **Burnrate** in Applications, select **Open**, and click **Open** in the dialog. This only needs to be done once.

**Alternative (Terminal):**

```bash
xattr -cr /Applications/Burnrate.app
```

**macOS Sequoia (15+):** If neither method works, go to **System Settings → Privacy & Security**, scroll down, and click **Open Anyway** next to the Burnrate message.

## Usage

1. Launch **Burnrate** from Applications (or Spotlight)
2. The app starts a local server and opens a native window
3. Complete the setup wizard on first run
4. Upload your credit card statement PDFs or set up a watch folder

## Data Storage

Your data is stored in:

```
~/Library/Application Support/burnrate/
```

This includes the SQLite database and any uploaded statement files.

## Updating

1. Download the new `.dmg` from [GitHub Releases](https://github.com/pratik1235/burnrate/releases/latest)
2. Open the DMG and drag the new **Burnrate** to Applications, replacing the old version
3. Your data is preserved — it's stored separately from the app

## Uninstall

1. Drag **Burnrate** from Applications to Trash
2. Optionally remove your data:

```bash
rm -rf ~/Library/Application\ Support/burnrate
```

## Troubleshooting

### Gatekeeper blocks the DMG or app

Run in Terminal:

```bash
# For the DMG (replace filename as needed):
xattr -cr ~/Downloads/Burnrate_aarch64.dmg

# For the installed app:
xattr -cr /Applications/Burnrate.app
```

On macOS Sequoia (15+), also try: **System Settings → Privacy & Security → Open Anyway**.

### Server doesn't start

Run from Terminal to see logs:

```bash
/Applications/Burnrate.app/Contents/MacOS/Burnrate
```

### Port conflict

The app uses port 8000. If it's in use, set a different port before launching:

```bash
BURNRATE_PORT=8080 open /Applications/Burnrate.app
```
