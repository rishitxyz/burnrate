# Burnrate – Gmail Statement Auto-Downloader

This Google Apps Script automatically downloads credit card statement PDFs from Gmail into an organized Google Drive folder structure. When combined with Google Drive Desktop sync and Burnrate’s folder watcher, statements are imported into the app automatically.

## Supported Banks (14)

| Bank | Email Domains |
|------|---------------|
| HDFC Bank | @hdfcbank.net |
| ICICI Bank | @icicibank.com |
| Axis Bank | @axisbank.com |
| SBI Card | @sbicard.com |
| American Express | @americanexpress.co.in, @aexp.com |
| IDFC FIRST Bank | @idfcfirstbank.com |
| IndusInd Bank | @indusind.com |
| Kotak Mahindra Bank | @kotak.com, @kotakbank.com |
| Standard Chartered | @sc.com |
| YES Bank | @yesbank.in |
| AU Small Finance Bank | @aubank.in |
| RBL Bank | @rblbank.com |
| Federal Bank | @federalbank.co.in |
| Indian Bank | @indianbank.co.in, @indianbank.net.in |

Statements are matched by subject containing “statement” or “e-statement” and must have PDF attachments.

---

## Setup

### 1. Create the Apps Script project

1. Go to [script.google.com](https://script.google.com)
2. Click **New project**
3. Rename the project (e.g. “Burnrate Statement Downloader”)

### 2. Add the code

1. Delete any default code in `Code.gs`
2. Copy the contents of `Code.gs` from this repo into the editor
3. Save (Ctrl+S / Cmd+S)

### 3. Run `setupTrigger()` once

1. In the function dropdown, select `setupTrigger`
2. Click **Run**
3. When prompted, click **Review permissions** → choose your Google account → **Advanced** → **Go to Burnrate Statement Downloader (unsafe)** → **Allow**
4. The trigger is created: `main()` will run every 15 days

### 4. Optional: run `main()` manually

1. Select `main` from the function dropdown
2. Click **Run**
3. On first run, it processes all matching emails (full history)
4. Later runs only process emails received after the last run

---

## Google Drive folder structure

Statements are saved under:

```
Statements/
├── HDFC/
│   └── 2026-02/
│       └── HDFC_CC_2026-02.pdf
├── ICICI/
│   └── 2026-02/
│       └── ICICI_CC_2026-02.pdf
└── ...
```

- Root folder: `Statements/` (in your Drive root)
- Subfolders: one per bank
- Month folders: `YYYY-MM` (e.g. `2026-02`)
- File names: `{BANK}_CC_{YYYY-MM}.pdf` (e.g. `HDFC_CC_2026-02.pdf`)
- If multiple statements exist for the same bank and month, an index is added: `HDFC_CC_2026-02_2.pdf`

---

## Google Drive Desktop sync

1. Install [Google Drive for Desktop](https://www.google.com/drive/download/) if needed
2. Enable sync for your Google Drive
3. The `Statements` folder will appear in your Drive sync folder (e.g. `~/Google Drive/Statements` or `G:\My Drive\Statements`)

---

## Configure Burnrate watch folder

1. Open the Burnrate app
2. Go to **Setup** (or initial setup wizard)
3. In **Watch folder for new statements**, choose the synced `Statements` folder
   - Example: `~/Google Drive/Statements` (macOS/Linux) or `C:\Users\You\Google Drive\Statements` (Windows)
4. Save

The app watches this folder for new PDFs and auto-imports them when they appear.

---

## How it works

- **First run:** Searches all Gmail history for matching statement emails
- **Later runs:** Only searches emails received after the last run (using `after:YYYY/MM/DD`)
- **Trigger:** Runs every 15 days
- **Deduplication:** Tracks processed message IDs in Script Properties and skips them on future runs
- **Idempotent:** Safe to run multiple times; already-processed emails are skipped

---

## Troubleshooting

### No statements found

- Confirm your bank sends statements from the domains listed above
- Check that subjects contain “statement” or “e-statement”
- Ensure the email has a PDF attachment
- Run `main()` manually and check **Execution log** (View → Execution log)

### Statements not auto-importing in Burnrate

- Ensure the watch folder points to the synced `Statements` folder
- Wait for Drive sync to finish (check Drive icon in system tray)
- Burnrate’s watcher may only watch the top-level folder; if your app supports recursive watching, enable it so subfolders like `Statements/HDFC/2026-02/` are included

### Trigger not running

- Go to **Triggers** (clock icon) in the Apps Script editor
- Confirm a trigger exists for `main` with “Day timer” and “Every 15 days”
- If missing, run `setupTrigger()` again

### Reset and re-process all emails

1. In Apps Script: **Project Settings** (gear icon) → **Script properties**
2. Delete `lastRunTimestamp` and `processedMessageIds`
3. Run `main()` to reprocess everything

---

## Script properties (internal)

The script stores:

- `lastRunTimestamp`: Date of last run (YYYY/MM/DD) for incremental search
- `processedMessageIds`: JSON array of processed Gmail message IDs (last 1000 kept to avoid size limits)
