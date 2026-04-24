const SPREADSHEET_ID = '';
const SHEET_NAME = 'Rolls';
const HEADERS = [
  'id',
  'filmId',
  'filmName',
  'name',
  'camera',
  'loadedAt',
  'status',
  'createdAt',
  'updatedAt'
];

function doGet(event) {
  const action = event && event.parameter && event.parameter.action;
  if (action === 'list') {
    return jsonResponse({ rolls: listRolls() });
  }

  return jsonResponse({ ok: true, rolls: listRolls() });
}

function doPost(event) {
  const payload = JSON.parse((event.postData && event.postData.contents) || '{}');
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    if (payload.action === 'delete') {
      deleteRoll(payload.id || (payload.roll && payload.roll.id));
    } else if (payload.action === 'upsert') {
      upsertRoll(payload.roll || {});
    } else {
      throw new Error('Unknown action');
    }

    return jsonResponse({ ok: true, rolls: listRolls() });
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error) });
  } finally {
    lock.releaseLock();
  }
}

function listRolls() {
  const sheet = getRollsSheet();
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const headers = values[0];
  return values.slice(1)
    .filter(row => row.some(cell => cell !== ''))
    .map(row => {
      const roll = {};
      headers.forEach((header, index) => {
        roll[header] = normalizeCell(row[index]);
      });
      return roll;
    });
}

function upsertRoll(roll) {
  if (!roll.id) roll.id = Utilities.getUuid();

  const sheet = getRollsSheet();
  const values = sheet.getDataRange().getValues();
  const ids = values.slice(1).map(row => String(row[0] || ''));
  const existingIndex = ids.indexOf(String(roll.id));
  const rowValues = HEADERS.map(header => roll[header] || '');

  if (existingIndex === -1) {
    sheet.appendRow(rowValues);
  } else {
    sheet.getRange(existingIndex + 2, 1, 1, HEADERS.length).setValues([rowValues]);
  }
}

function deleteRoll(id) {
  if (!id) return;

  const sheet = getRollsSheet();
  const values = sheet.getDataRange().getValues();
  const ids = values.slice(1).map(row => String(row[0] || ''));
  const existingIndex = ids.indexOf(String(id));

  if (existingIndex !== -1) {
    sheet.deleteRow(existingIndex + 2);
  }
}

function getRollsSheet() {
  const spreadsheet = SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  ensureHeaders(sheet);
  return sheet;
}

function ensureHeaders(sheet) {
  const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  const currentHeaders = headerRange.getValues()[0];
  const needsHeaders = HEADERS.some((header, index) => currentHeaders[index] !== header);

  if (needsHeaders) {
    headerRange.setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
}

function normalizeCell(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return value === null || value === undefined ? '' : String(value);
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
