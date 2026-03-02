/**
 * Burnrate - Credit Card Statement Auto-Downloader
 * Google Apps Script that searches Gmail for credit card statement PDFs
 * and saves them to an organized Google Drive folder structure.
 *
 * Setup:
 * 1. Open script.google.com and create a new project
 * 2. Paste this code into Code.gs
 * 3. Run setupTrigger() once to create the 15-day trigger
 * 4. Grant Gmail and Drive permissions when prompted
 *
 * Folder structure: Statements/<BankName>/YYYY-MM/<BANK_CC_YYYY-MM.pdf>
 */

const BANK_CONFIGS = [
  { name: 'HDFC', domains: ['@hdfcbank.net'] },
  { name: 'ICICI', domains: ['@icicibank.com'] },
  { name: 'Axis', domains: ['@axisbank.com'] },
  { name: 'SBI', domains: ['@sbicard.com'] },
  { name: 'Amex', domains: ['@americanexpress.co.in', '@aexp.com'] },
  { name: 'IDFC_FIRST', domains: ['@idfcfirstbank.com'] },
  { name: 'IndusInd', domains: ['@indusind.com'] },
  { name: 'Kotak', domains: ['@kotak.com', '@kotakbank.com'] },
  { name: 'SC', domains: ['@sc.com'] },
  { name: 'YES', domains: ['@yesbank.in'] },
  { name: 'AU', domains: ['@aubank.in'] },
  { name: 'RBL', domains: ['@rblbank.com'] },
];

const ROOT_FOLDER_NAME = 'Statements';
const PROPS_KEY_TIMESTAMP = 'lastRunTimestamp';
const PROPS_KEY_PROCESSED = 'processedMessageIds';
const MAX_PROCESSED_IDS = 1000; // Limit to avoid Script Properties size limit (~9KB)

/**
 * Entry point. For each bank config, build Gmail query, search, process results.
 */
function main() {
  const props = PropertiesService.getScriptProperties();
  const afterDate = props.getProperty(PROPS_KEY_TIMESTAMP);
  const rootFolder = getRootFolder();
  let processedIds = getProcessedIds();

  Logger.log('Burnrate statement downloader started. afterDate=' + (afterDate || 'none (full history)'));

  for (let i = 0; i < BANK_CONFIGS.length; i++) {
    const bankConfig = BANK_CONFIGS[i];
    try {
      const query = buildQuery(bankConfig, afterDate);
      Logger.log('[' + bankConfig.name + '] Query: ' + query);

      const threads = GmailApp.search(query, 0, 100);

      for (let t = 0; t < threads.length; t++) {
        const messages = threads[t].getMessages();
        for (let m = 0; m < messages.length; m++) {
          const msg = messages[m];
          if (processedIds.indexOf(msg.getId()) >= 0) {
            continue;
          }
          processMessage(msg, bankConfig, rootFolder, processedIds);
        }
      }
    } catch (e) {
      Logger.log('[' + bankConfig.name + '] Error: ' + e.toString());
      console.error('Bank ' + bankConfig.name + ' failed:', e);
    }
  }

  saveProcessedIds(processedIds);
  props.setProperty(PROPS_KEY_TIMESTAMP, formatDate(new Date()));
  Logger.log('Burnrate statement downloader finished.');
}

/**
 * Build Gmail search string.
 * @param {Object} bankConfig - { name, domains }
 * @param {string|null} afterDate - YYYY/MM/DD or null for full history
 * @returns {string} Gmail search query
 */
function buildQuery(bankConfig, afterDate) {
  const fromPart = bankConfig.domains.length === 1
    ? 'from:' + bankConfig.domains[0]
    : '(' + bankConfig.domains.map(function (d) { return 'from:' + d; }).join(' OR ') + ')';
  let query = fromPart + ' has:attachment filename:pdf subject:(statement OR e-statement)';
  if (afterDate) {
    query += ' after:' + afterDate;
  }
  return query;
}

/**
 * Get or create a subfolder under parent.
 * @param {GoogleAppsScript.Drive.Folder} parent
 * @param {string} name
 * @returns {GoogleAppsScript.Drive.Folder}
 */
function getOrCreateFolder(parent, name) {
  const iter = parent.getFoldersByName(name);
  if (iter.hasNext()) {
    return iter.next();
  }
  return parent.createFolder(name);
}

/**
 * Get or create the Statements root folder in Drive.
 * @returns {GoogleAppsScript.Drive.Folder}
 */
function getRootFolder() {
  const root = DriveApp.getRootFolder();
  return getOrCreateFolder(root, ROOT_FOLDER_NAME);
}

/**
 * Extract PDF attachments from message, save to Drive.
 * @param {GoogleAppsScript.Gmail.GmailMessage} message
 * @param {Object} bankConfig
 * @param {GoogleAppsScript.Drive.Folder} rootFolder
 * @param {string[]} processedIds - mutated: new IDs appended
 */
function processMessage(message, bankConfig, rootFolder, processedIds) {
  const msgId = message.getId();
  const attachments = message.getAttachments();
  const date = message.getDate();
  const yearMonth = Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM');

  let savedCount = 0;
  const bankFolder = getOrCreateFolder(rootFolder, bankConfig.name);
  const monthFolder = getOrCreateFolder(bankFolder, yearMonth);
  const baseName = bankConfig.name + '_CC_' + yearMonth;

  for (let i = 0; i < attachments.length; i++) {
    const att = attachments[i];
    const name = att.getName() || '';
    const contentType = (att.getContentType() || '').toLowerCase();
    const isPdf = name.toLowerCase().endsWith('.pdf') || contentType.indexOf('pdf') >= 0;
    if (!isPdf) continue;

    // Find next available filename (HDFC_CC_2026-02.pdf, HDFC_CC_2026-02_2.pdf, ...)
    let finalName = baseName + '.pdf';
    let idx = 1;
    while (monthFolder.getFilesByName(finalName).hasNext()) {
      idx++;
      finalName = baseName + '_' + idx + '.pdf';
    }

    try {
      const file = monthFolder.createFile(att);
      file.setName(finalName);
      savedCount++;
      Logger.log('Saved: ' + bankConfig.name + '/' + yearMonth + '/' + finalName);
    } catch (e) {
      Logger.log('Failed to save ' + finalName + ': ' + e.toString());
    }
  }

  if (savedCount > 0) {
    processedIds.push(msgId);
  }
}

/**
 * Load processed message IDs from Script Properties.
 * @returns {string[]}
 */
function getProcessedIds() {
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty(PROPS_KEY_PROCESSED);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

/**
 * Save processed message IDs to Script Properties.
 * Keeps only last MAX_PROCESSED_IDS to avoid size limit.
 * @param {string[]} ids
 */
function saveProcessedIds(ids) {
  if (ids.length === 0) return;
  const trimmed = ids.length > MAX_PROCESSED_IDS
    ? ids.slice(-MAX_PROCESSED_IDS)
    : ids;
  const props = PropertiesService.getScriptProperties();
  props.setProperty(PROPS_KEY_PROCESSED, JSON.stringify(trimmed));
}

/**
 * Create a time-based trigger that runs every 15 days.
 * Deletes existing triggers first to avoid duplicates.
 */
function setupTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'main') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger('main')
    .timeBased()
    .everyDays(15)
    .create();
  Logger.log('Trigger created: main() runs every 15 days.');
}

/**
 * Format date as YYYY/MM/DD for Gmail query.
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy/MM/dd');
}
