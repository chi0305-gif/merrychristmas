/**
 * 叮叮噹！聖誕閱讀闖關｜學生闖關紀錄接收器（Google Apps Script）
 *
 * 用法：在 Google 試算表 → 擴充功能 → Apps Script，把這整份程式貼上並儲存，
 * 執行一次 setup（授權並整理工作表），再「部署」成網頁應用程式（執行身分：我；存取：所有人），
 * 把網址貼到遊戲的 sheetUrl。之後改程式時，請用「管理部署作業 → 編輯 → 新版本」更新，網址才不會變。
 */

// 要和遊戲 config 的 sheetToken 相同
const TOKEN = 'swsh-xmas-2026';

const HEAD = ['班級', '座號', '姓名', '開始時間', '第1關', '第2關', '第3關', '第4關', '第5關',
  '完賽時間', '總用時', '總雪花', '兌換時間', '最後更新', '紀錄ID'];
// 欄位位置（從 0 開始）
const COL = { cls: 0, seat: 1, name: 2, start: 3, stage1: 4, finish: 9, elapsed: 10, stars: 11, redeem: 12, updated: 13, id: 14 };

/** 第一次使用或更新程式後執行一次：建立／整理「總表」 */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sum = ss.getSheetByName('總表');
  if (sum) {
    // 舊版有「驗證碼」欄：刪掉
    const head = sum.getRange(1, 1, 1, sum.getLastColumn()).getValues()[0];
    const i = head.indexOf('驗證碼');
    if (i >= 0) sum.deleteColumn(i + 1);
    sum.showColumns(1, sum.getMaxColumns());
    sum.getRange(1, 1, 1, HEAD.length).setValues([HEAD]);
    styleHead_(sum);
  } else {
    sum = getSummary_(ss);
  }
  // 舊版的「事件紀錄」工作表已不需要
  const log = ss.getSheetByName('事件紀錄');
  if (log) ss.deleteSheet(log);
  const blank = ss.getSheetByName('工作表1') || ss.getSheetByName('Sheet1');
  if (blank && blank.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(blank);
}

/** 打開網址測試用 */
function doGet() {
  return json_({ ok: true, msg: 'SWSH Christmas Quest recorder is running' });
}

/** 遊戲送來的紀錄：每位學生（每一次遊戲）一列，持續更新 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.token !== TOKEN) return json_({ ok: false, msg: 'bad token' });
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sum = getSummary_(ss);
    const now = new Date();
    const n = HEAD.length;
    const last = sum.getLastRow();
    const ids = last > 1 ? sum.getRange(2, COL.id + 1, last - 1, 1).getValues().map(function (r) { return r[0]; }) : [];
    let r = ids.indexOf(d.sid);
    r = r < 0 ? last + 1 : r + 2;
    const row = r <= last ? sum.getRange(r, 1, 1, n).getValues()[0] : new Array(n).fill('');

    row[COL.cls] = d.cls; row[COL.seat] = d.seat; row[COL.name] = d.name;
    if (!row[COL.start]) row[COL.start] = d.startedAt ? new Date(d.startedAt) : now;
    if (d.type === 'stage' && d.stage >= 1 && d.stage <= 5) row[COL.stage1 + d.stage - 1] = txt_(d.dur || '完成');
    if (d.type === 'finish') { row[COL.finish] = now; row[COL.elapsed] = txt_(d.elapsed); row[COL.stars] = txt_(d.total + '/15'); }
    if (d.type === 'redeem') row[COL.redeem] = now;
    row[COL.updated] = now; row[COL.id] = d.sid;
    sum.getRange(r, 1, 1, n).setValues([row]);

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, msg: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function getSummary_(ss) {
  let sh = ss.getSheetByName('總表');
  if (!sh) {
    sh = ss.insertSheet('總表');
    sh.appendRow(HEAD);
    styleHead_(sh);
  }
  return sh;
}

function styleHead_(sh) {
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, HEAD.length).setFontWeight('bold').setBackground('#C23A2E').setFontColor('#FFFFFF');
  sh.hideColumns(HEAD.length);
}

/** 加上 ' 讓試算表把內容當文字（避免「6:40」被當成時間） */
function txt_(v) { return v ? "'" + v : ''; }

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
