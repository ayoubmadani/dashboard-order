// يولّد نص Google Apps Script الذي يلصقه التاجر في ملف Google Sheets.
// السكربت: يجلب الطلبات الجديدة كل 5 دقائق، يرسل تغيير الحالة من الجدول
// إلى المتجر فوراً، ويلوّن كل سطر حسب حالته (تنسيق شرطي).

export const SHEET_STATUS_COLORS = {
  pending: '#fef3c7',
  appl1: '#ede9fe',
  appl2: '#e0e7ff',
  appl3: '#dbeafe',
  confirmed: '#d1fae5',
  shipping: '#cffafe',
  delivered: '#bbf7d0',
  cancelled: '#fee2e2',
  returned: '#ffedd5',
  postponed: '#f3e8ff',
};

export function buildSheetScript({ apiUrl, storeId, apiKey, sheetName, statuses, headers, texts }) {
  const json = (v) => JSON.stringify(v, null, 2);
  return `/**
 * MD Store — Google Sheets sync
 * 1) Run "setup" once and allow access.
 * 2) New orders are added every 5 minutes (or from the menu "MD Store" → Sync now).
 * 3) Change the status from the dropdown → it is sent to the store and the row is recolored.
 */

const CONFIG = {
  apiUrl: ${json(apiUrl.replace(/\/$/, ''))},
  storeId: ${json(storeId)},
  apiKey: ${json(apiKey)},
  sheetName: ${json(sheetName)},
};

// value = the store's status, label = what appears in the sheet, color = row background
const STATUSES = ${json(statuses)};

const HEADERS = ${json(headers)};

const TEXTS = ${json(texts)};

// Column order (must match HEADERS). Column A (order id) is hidden.
const COLUMNS = ['id', 'createdAt', 'customerName', 'customerPhone', 'contact', 'wilaya', 'commune',
  'typeShip', 'products', 'itemsTotal', 'priceShip', 'total', 'source', 'status'];
const ID_COL = 1;
const STATUS_COL = COLUMNS.indexOf('status') + 1;

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('MD Store')
    .addItem(TEXTS.syncNow, 'syncOrders')
    .addItem(TEXTS.reinstall, 'setup')
    .addToUi();
}

function setup() {
  const sheet = getSheet_();
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS])
    .setFontWeight('bold').setBackground('#111827').setFontColor('#ffffff');
  sheet.setFrozenRows(1);
  sheet.hideColumns(ID_COL);
  applyStatusRules_(sheet);

  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('syncOrders').timeBased().everyMinutes(5).create();
  ScriptApp.newTrigger('onStatusEdit').forSpreadsheet(SpreadsheetApp.getActive()).onEdit().create();

  syncOrders();
}

// Row color + status dropdown for the whole sheet (also applies to rows added later)
function applyStatusRules_(sheet) {
  const lastCol = columnLetter_(HEADERS.length);
  const statusCol = columnLetter_(STATUS_COL);
  const rowsRange = sheet.getRange('A2:' + lastCol);
  const rules = STATUSES.map(function (s) {
    return SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$' + statusCol + '2="' + String(s.label).replace(/"/g, '""') + '"')
      .setBackground(s.color)
      .setRanges([rowsRange])
      .build();
  });
  sheet.setConditionalFormatRules(rules);

  const validation = SpreadsheetApp.newDataValidation()
    .requireValueInList(STATUSES.map(function (s) { return s.label; }), true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(statusCol + '2:' + statusCol).setDataValidation(validation);
}

function syncOrders() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return;
  try {
    const sheet = getSheet_();
    const props = PropertiesService.getScriptProperties();
    const known = existingIds_(sheet);
    let since = props.getProperty('since') || '';
    let added = 0;

    for (let page = 0; page < 20; page++) {
      const res = api_('get', '/orders?limit=500' + (since ? '&since=' + encodeURIComponent(since) : ''));
      const orders = res.orders || [];
      const fresh = orders.filter(function (o) { return !known[o.id]; });
      if (fresh.length) {
        const values = fresh.map(toRow_);
        const start = sheet.getLastRow() + 1;
        const missingRows = start + values.length - 1 - sheet.getMaxRows();
        if (missingRows > 0) sheet.insertRowsAfter(sheet.getMaxRows(), missingRows);
        sheet.getRange(start, 1, values.length, HEADERS.length).setValues(values);
        sheet.getRange(start, COLUMNS.indexOf('createdAt') + 1, values.length, 1).setNumberFormat('yyyy-mm-dd hh:mm');
        fresh.forEach(function (o) { known[o.id] = true; });
        added += fresh.length;
      }
      if (!orders.length) break;
      const last = orders[orders.length - 1].createdAt;
      // the API overlaps by 1h, so only move the cursor forward
      if (since && new Date(last) <= new Date(since)) break;
      since = last;
      props.setProperty('since', since);
      if (orders.length < res.limit) break;
    }

    if (added) SpreadsheetApp.getActive().toast(TEXTS.added.replace('{count}', added), 'MD Store');
  } finally {
    lock.releaseLock();
  }
}

// Installed trigger (not a simple onEdit) so it is allowed to call the store API
function onStatusEdit(e) {
  const range = e.range;
  const sheet = range.getSheet();
  if (sheet.getName() !== CONFIG.sheetName) return;
  if (range.getLastRow() < 2 || range.getColumn() > STATUS_COL || range.getLastColumn() < STATUS_COL) return;

  const firstRow = Math.max(range.getRow(), 2);
  const count = range.getLastRow() - firstRow + 1;
  const ids = sheet.getRange(firstRow, ID_COL, count, 1).getValues();
  const labels = sheet.getRange(firstRow, STATUS_COL, count, 1).getValues();
  const single = count === 1 && range.getNumColumns() === 1;
  let ok = 0;
  let failed = 0;

  for (let i = 0; i < count; i++) {
    const id = ids[i][0];
    const status = STATUSES.filter(function (s) { return s.label === labels[i][0]; })[0];
    if (!id || !status) continue;
    try {
      api_('patch', '/orders/' + id + '/status', { status: status.value });
      ok++;
    } catch (err) {
      failed++;
      console.error(err);
      // تعديل خانة واحدة فشل → نرجعها لقيمتها السابقة حتى لا يكذب الجدول
      if (single && e.oldValue !== undefined) range.setValue(e.oldValue);
    }
  }

  const ss = SpreadsheetApp.getActive();
  if (failed) ss.toast(TEXTS.failed, 'MD Store', 8);
  else if (ok) ss.toast(TEXTS.saved, 'MD Store', 3);
}

function toRow_(o) {
  const status = STATUSES.filter(function (s) { return s.value === o.status; })[0];
  const row = {
    id: o.id,
    createdAt: new Date(o.createdAt),
    customerName: o.customerName || '',
    customerPhone: o.customerPhone ? "'" + o.customerPhone : '',
    contact: o.customerWhatsapp ? "'" + o.customerWhatsapp : (o.customerEmail || ''),
    wilaya: o.wilaya || '',
    commune: o.commune || '',
    typeShip: o.isDigital ? TEXTS.digital : (o.typeShip === 'office' ? TEXTS.office : TEXTS.home),
    products: o.products || '',
    itemsTotal: o.itemsTotal,
    priceShip: o.priceShip,
    total: o.total,
    source: o.source || '',
    status: status ? status.label : o.status,
  };
  return COLUMNS.map(function (c) { return row[c]; });
}

function existingIds_(sheet) {
  const ids = {};
  const last = sheet.getLastRow();
  if (last < 2) return ids;
  sheet.getRange(2, ID_COL, last - 1, 1).getValues().forEach(function (r) { if (r[0]) ids[r[0]] = true; });
  return ids;
}

function getSheet_() {
  const ss = SpreadsheetApp.getActive();
  return ss.getSheetByName(CONFIG.sheetName) || ss.insertSheet(CONFIG.sheetName);
}

function api_(method, path, body) {
  const options = {
    method: method,
    // bypass-tunnel-reminder: يتخطى صفحة تحذير localtunnel أثناء التجربة، بلا أثر على الـ API الحقيقي
    headers: { Authorization: 'Bearer ' + CONFIG.apiKey, 'bypass-tunnel-reminder': '1' },
    muteHttpExceptions: true,
  };
  if (body) {
    options.contentType = 'application/json';
    options.payload = JSON.stringify(body);
  }
  const res = UrlFetchApp.fetch(CONFIG.apiUrl + '/stores/' + CONFIG.storeId + '/sheet-sync' + path, options);
  const code = res.getResponseCode();
  const text = res.getContentText();
  if (code >= 300) throw new Error('MD Store API ' + code + ': ' + text.slice(0, 300));
  return text ? JSON.parse(text) : null;
}

function columnLetter_(n) {
  let s = '';
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}
`;
}
