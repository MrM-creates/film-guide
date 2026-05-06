const SPREADSHEET_ID = '';
const SHEET_NAME = 'Rolls';
const CAMERA_SHEET_NAME = 'Cameras';
const HEADERS = [
  'id',
  'filmId',
  'filmName',
  'name',
  'camera',
  'loadedAt',
  'status',
  'createdAt',
  'updatedAt',
  'format',
  'ratedIso',
  'note',
  'process',
  'userEmail',
  'userName',
  'rollCode',
  'cameraId'
];
const CAMERA_HEADERS = [
  'id',
  'name',
  'format',
  'note',
  'createdAt',
  'updatedAt',
  'userEmail',
  'userName'
];

function doGet(event) {
  const action = event && event.parameter && event.parameter.action;
  const userEmail = event && event.parameter && event.parameter.userEmail;
  if (action === 'listCameras') {
    return jsonResponse({ cameras: listCameras(userEmail) });
  }
  if (action === 'list') {
    return jsonResponse({ rolls: listRolls(userEmail) });
  }

  return jsonResponse({ ok: true, rolls: listRolls(userEmail), cameras: listCameras(userEmail) });
}

function doPost(event) {
  const payload = JSON.parse((event.postData && event.postData.contents) || '{}');
  const userEmail = normalizeEmail(payload.userEmail ||
    (payload.roll && payload.roll.userEmail) ||
    (payload.camera && payload.camera.userEmail));
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    if (payload.action === 'delete') {
      deleteRoll(payload.id || (payload.roll && payload.roll.id), userEmail);
    } else if (payload.action === 'upsert') {
      upsertRoll(payload.roll || {}, userEmail);
    } else if (payload.action === 'deleteCamera') {
      deleteCamera(payload.id || (payload.camera && payload.camera.id), userEmail);
    } else if (payload.action === 'upsertCamera') {
      upsertCamera(payload.camera || {}, userEmail);
    } else {
      throw new Error('Unknown action');
    }

    return jsonResponse({ ok: true, rolls: listRolls(userEmail), cameras: listCameras(userEmail) });
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error) });
  } finally {
    lock.releaseLock();
  }
}

function listCameras(userEmail) {
  const sheet = getCamerasSheet();
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const headers = values[0];
  return values.slice(1)
    .filter(row => row.some(cell => cell !== ''))
    .map(row => {
      const camera = {};
      headers.forEach((header, index) => {
        camera[header] = normalizeCell(row[index]);
      });
      return camera;
    })
    .filter(camera => !userEmail || normalizeEmail(camera.userEmail) === normalizeEmail(userEmail));
}

function listRolls(userEmail) {
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
    })
    .filter(roll => !userEmail || normalizeEmail(roll.userEmail) === normalizeEmail(userEmail));
}

function upsertRoll(roll, userEmail) {
  if (!roll.id) roll.id = Utilities.getUuid();
  if (userEmail) roll.userEmail = normalizeEmail(userEmail);

  const sheet = getRollsSheet();
  if (!roll.rollCode) {
    roll.rollCode = generateNextRollCode(sheet, roll.userEmail, roll.id);
  }
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

function upsertCamera(camera, userEmail) {
  if (!camera.id) camera.id = Utilities.getUuid();
  if (userEmail) camera.userEmail = normalizeEmail(userEmail);

  const sheet = getCamerasSheet();
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idIndex = headers.indexOf('id');
  const ids = values.slice(1).map(row => String(row[idIndex] || ''));
  const existingIndex = ids.indexOf(String(camera.id));
  const rowValues = headers.map(header => camera[header] || '');

  if (existingIndex === -1) {
    sheet.appendRow(rowValues);
  } else {
    sheet.getRange(existingIndex + 2, 1, 1, headers.length).setValues([rowValues]);
  }
}

function generateNextRollCode(sheet, userEmail, currentRollId) {
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return 'R001';

  const headers = values[0];
  const idIndex = headers.indexOf('id');
  const codeIndex = headers.indexOf('rollCode');
  const emailIndex = headers.indexOf('userEmail');
  const normalizedEmail = normalizeEmail(userEmail);
  let highestNumber = 0;

  values.slice(1).forEach(row => {
    if (idIndex !== -1 && String(row[idIndex] || '') === String(currentRollId || '')) return;
    if (emailIndex !== -1 && normalizedEmail && normalizeEmail(row[emailIndex]) !== normalizedEmail) return;

    const match = String(codeIndex !== -1 ? row[codeIndex] : '').match(/^R(\d+)$/i);
    if (match) highestNumber = Math.max(highestNumber, Number(match[1]));
  });

  return `R${String(highestNumber + 1).padStart(3, '0')}`;
}

function deleteRoll(id, userEmail) {
  if (!id) return;

  const sheet = getRollsSheet();
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const emailIndex = headers.indexOf('userEmail');
  const ids = values.slice(1).map(row => String(row[0] || ''));
  const existingIndex = ids.indexOf(String(id));

  if (existingIndex !== -1) {
    if (userEmail && emailIndex !== -1) {
      const rowEmail = normalizeEmail(values[existingIndex + 1][emailIndex]);
      if (rowEmail !== normalizeEmail(userEmail)) return;
    }
    sheet.deleteRow(existingIndex + 2);
  }
}

function deleteCamera(id, userEmail) {
  if (!id) return;

  const sheet = getCamerasSheet();
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idIndex = headers.indexOf('id');
  const emailIndex = headers.indexOf('userEmail');
  const ids = values.slice(1).map(row => String(row[idIndex] || ''));
  const existingIndex = ids.indexOf(String(id));

  if (existingIndex !== -1) {
    if (userEmail && emailIndex !== -1) {
      const rowEmail = normalizeEmail(values[existingIndex + 1][emailIndex]);
      if (rowEmail !== normalizeEmail(userEmail)) return;
    }
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

  ensureHeaders(sheet, HEADERS);
  return sheet;
}

function getCamerasSheet() {
  const spreadsheet = SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(CAMERA_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(CAMERA_SHEET_NAME);
  }

  ensureHeaders(sheet, CAMERA_HEADERS);
  return sheet;
}

function ensureHeaders(sheet, expectedHeaders) {
  const headerRange = sheet.getRange(1, 1, 1, Math.max(expectedHeaders.length, sheet.getLastColumn() || expectedHeaders.length));
  const currentHeaders = headerRange.getValues()[0].filter(header => String(header || '').trim());
  const nextHeaders = currentHeaders.length ? [...currentHeaders] : [...expectedHeaders];
  expectedHeaders.forEach(header => {
    if (!nextHeaders.includes(header)) nextHeaders.push(header);
  });

  const needsHeaders = nextHeaders.length !== currentHeaders.length ||
    nextHeaders.some((header, index) => currentHeaders[index] !== header);

  if (needsHeaders) {
    sheet.getRange(1, 1, 1, nextHeaders.length).setValues([nextHeaders]);
    sheet.setFrozenRows(1);
  }
}

function normalizeCell(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  if (typeof value === 'number' && value >= 20000 && value <= 80000) {
    const date = new Date(Date.UTC(1899, 11, 30) + Math.floor(value) * 86400000);
    return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return value === null || value === undefined ? '' : String(value);
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
