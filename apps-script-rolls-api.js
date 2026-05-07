const SPREADSHEET_ID = '';
const SHEET_NAME = 'Rolls';
const CAMERA_SHEET_NAME = 'Cameras';
const LENS_SHEET_NAME = 'Lenses';
const CAMERA_LENS_SHEET_NAME = 'CameraLenses';
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
const LENS_HEADERS = [
  'id',
  'brand',
  'name',
  'mount',
  'focalLength',
  'maxAperture',
  'type',
  'character',
  'note',
  'createdAt',
  'updatedAt',
  'userEmail',
  'userName'
];
const CAMERA_LENS_HEADERS = [
  'id',
  'cameraId',
  'lensId',
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
  if (action === 'listLenses') {
    return jsonResponse({ lenses: listLenses(userEmail), cameraLenses: listCameraLenses(userEmail) });
  }
  if (action === 'list') {
    return jsonResponse({ rolls: listRolls(userEmail) });
  }

  return jsonResponse({
    ok: true,
    rolls: listRolls(userEmail),
    cameras: listCameras(userEmail),
    lenses: listLenses(userEmail),
    cameraLenses: listCameraLenses(userEmail)
  });
}

function doPost(event) {
  const payload = JSON.parse((event.postData && event.postData.contents) || '{}');
  const userEmail = normalizeEmail(payload.userEmail ||
    (payload.roll && payload.roll.userEmail) ||
    (payload.camera && payload.camera.userEmail) ||
    (payload.lens && payload.lens.userEmail));
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
    } else if (payload.action === 'deleteLens') {
      deleteLens(payload.id || (payload.lens && payload.lens.id), userEmail);
    } else if (payload.action === 'upsertLens') {
      upsertLens(payload.lens || {}, userEmail);
      replaceCameraLensMappings(payload.lens && payload.lens.id, payload.cameraIds || [], userEmail, payload.userName || '');
    } else {
      throw new Error('Unknown action');
    }

    return jsonResponse({
      ok: true,
      rolls: listRolls(userEmail),
      cameras: listCameras(userEmail),
      lenses: listLenses(userEmail),
      cameraLenses: listCameraLenses(userEmail)
    });
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

function listLenses(userEmail) {
  const sheet = getLensesSheet();
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const headers = values[0];
  return values.slice(1)
    .filter(row => row.some(cell => cell !== ''))
    .map(row => {
      const lens = {};
      headers.forEach((header, index) => {
        lens[header] = normalizeCell(row[index]);
      });
      return lens;
    })
    .filter(lens => !userEmail || normalizeEmail(lens.userEmail) === normalizeEmail(userEmail));
}

function listCameraLenses(userEmail) {
  const sheet = getCameraLensesSheet();
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const headers = values[0];
  return values.slice(1)
    .filter(row => row.some(cell => cell !== ''))
    .map(row => {
      const mapping = {};
      headers.forEach((header, index) => {
        mapping[header] = normalizeCell(row[index]);
      });
      return mapping;
    })
    .filter(mapping => !userEmail || normalizeEmail(mapping.userEmail) === normalizeEmail(userEmail));
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

function upsertLens(lens, userEmail) {
  if (!lens.id) lens.id = Utilities.getUuid();
  if (userEmail) lens.userEmail = normalizeEmail(userEmail);

  const sheet = getLensesSheet();
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idIndex = headers.indexOf('id');
  const ids = values.slice(1).map(row => String(row[idIndex] || ''));
  const existingIndex = ids.indexOf(String(lens.id));
  const rowValues = headers.map(header => lens[header] || '');

  if (existingIndex === -1) {
    sheet.appendRow(rowValues);
  } else {
    sheet.getRange(existingIndex + 2, 1, 1, headers.length).setValues([rowValues]);
  }
}

function replaceCameraLensMappings(lensId, cameraIds, userEmail, userName) {
  if (!lensId) return;
  const sheet = getCameraLensesSheet();
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const lensIndex = headers.indexOf('lensId');
  const emailIndex = headers.indexOf('userEmail');
  const normalizedEmail = normalizeEmail(userEmail);

  for (let rowIndex = values.length - 1; rowIndex >= 1; rowIndex--) {
    const rowLensId = String(values[rowIndex][lensIndex] || '');
    const rowEmail = emailIndex === -1 ? '' : normalizeEmail(values[rowIndex][emailIndex]);
    if (rowLensId === String(lensId) && (!normalizedEmail || rowEmail === normalizedEmail)) {
      sheet.deleteRow(rowIndex + 1);
    }
  }

  const now = new Date().toISOString();
  [...new Set(cameraIds || [])].filter(Boolean).forEach(cameraId => {
    const mapping = {
      id: `${cameraId}_${lensId}`,
      cameraId,
      lensId,
      createdAt: now,
      updatedAt: now,
      userEmail: normalizedEmail,
      userName: userName || ''
    };
    sheet.appendRow(headers.map(header => mapping[header] || ''));
  });
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

  deleteCameraLensMappingsForCamera(id, userEmail);
}

function deleteLens(id, userEmail) {
  if (!id) return;

  const sheet = getLensesSheet();
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

  replaceCameraLensMappings(id, [], userEmail, '');
}

function deleteCameraLensMappingsForCamera(cameraId, userEmail) {
  if (!cameraId) return;
  const sheet = getCameraLensesSheet();
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const cameraIndex = headers.indexOf('cameraId');
  const emailIndex = headers.indexOf('userEmail');
  const normalizedEmail = normalizeEmail(userEmail);

  for (let rowIndex = values.length - 1; rowIndex >= 1; rowIndex--) {
    const rowCameraId = String(values[rowIndex][cameraIndex] || '');
    const rowEmail = emailIndex === -1 ? '' : normalizeEmail(values[rowIndex][emailIndex]);
    if (rowCameraId === String(cameraId) && (!normalizedEmail || rowEmail === normalizedEmail)) {
      sheet.deleteRow(rowIndex + 1);
    }
  }
}

function getSpreadsheet() {
  return SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
}

function getRollsSheet() {
  const spreadsheet = getSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  ensureHeaders(sheet, HEADERS);
  return sheet;
}

function getCamerasSheet() {
  const spreadsheet = getSpreadsheet();
  let sheet = spreadsheet.getSheetByName(CAMERA_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(CAMERA_SHEET_NAME);
  }

  ensureHeaders(sheet, CAMERA_HEADERS);
  return sheet;
}

function getLensesSheet() {
  const spreadsheet = getSpreadsheet();
  let sheet = spreadsheet.getSheetByName(LENS_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(LENS_SHEET_NAME);
  }

  ensureHeaders(sheet, LENS_HEADERS);
  return sheet;
}

function getCameraLensesSheet() {
  const spreadsheet = getSpreadsheet();
  let sheet = spreadsheet.getSheetByName(CAMERA_LENS_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(CAMERA_LENS_SHEET_NAME);
  }

  ensureHeaders(sheet, CAMERA_LENS_HEADERS);
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
