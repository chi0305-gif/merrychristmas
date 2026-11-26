/**
 * 叮叮噹！聖誕閱讀闖關｜學生闖關紀錄接收器（Google Apps Script）
 *
 * 用法：在 Google 試算表 → 擴充功能 → Apps Script，把這整份程式貼上並儲存，
 * 先執行一次 setup（授權並建立工作表），再「部署 → 新增部署作業 → 網頁應用程式」，
 * 執行身分選「我」，誰可以存取選「所有人」，把產生的網址貼到遊戲的 sheetUrl。
 */

// 要和遊戲 config 的 sheetToken 相同
const TOKEN = 'swsh-xmas-2026';

const SUMMARY_HEAD = ['班級', '座號', '姓名', '開始時間', '第1關', '第2關', '第3關', '第4關', '第5關',
  '完賽時間', '總用時', '總雪花', '驗證碼', '兌換時間', '最後更新', '紀錄ID'];
const LOG_HEAD = ['時間', '事件', '班級', '座號', '姓名', '關卡', '雪花', '用時', '驗證碼', '紀錄ID'];
const EVENT_NAME = { start: '登入', stage: '過關', finish: '完賽', redeem: '兌換' };

/** 第一次使用：建立「總表」與「事件紀錄」兩張工作表 */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  getSheet_(ss, '總表', SUMMARY_HEAD);
  getSheet_(ss, '事件紀錄', LOG_HEAD);
  const first = ss.getSheetByName('工作表1') || ss.getSheetByName('Sheet1');
  if (first && first.getLastRow() === 0 && ss.getSheets().length > 2) ss.deleteSheet(first);
}

/** 打開網址測試用 */
function doGet() {
  return json_({ ok: true, msg: 'SWSH Christmas Quest recorder is running' });
}

/** 遊戲送來的紀錄 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.token !== TOKEN) return json_({ ok: false, msg: 'bad token' });
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const now = new Date();

    // 1. 事件紀錄：每個動作一列
    getSheet_(ss, '事件紀錄', LOG_HEAD).appendRow([
      now, EVENT_NAME[d.type] || d.type, d.cls, d.seat, d.name,
      d.stage || '', d.stars || '', txt_(d.elapsed), txt_(d.code), d.sid
    ]);

    // 2. 總表：每位學生（每一次遊戲）一列，持續更新
    const sum = getSheet_(ss, '總表', SUMMARY_HEAD);
    const n = SUMMARY_HEAD.length;
    const last = sum.getLastRow();
    const ids = last > 1 ? sum.getRange(2, n, last - 1, 1).getValues().map(function (r) { return r[0]; }) : [];
    let r = ids.indexOf(d.sid);
    r = r < 0 ? last + 1 : r + 2;
    const row = r <= last ? sum.getRange(r, 1, 1, n).getValues()[0] : new Array(n).fill('');

    row[0] = d.cls; row[1] = d.seat; row[2] = d.name;
    if (!row[3]) row[3] = d.startedAt ? new Date(d.startedAt) : now;
    if (d.type === 'stage' && d.stage >= 1 && d.stage <= 5) row[3 + d.stage] = '✔ ' + '★'.repeat(d.stars || 0);
    if (d.type === 'finish') { row[9] = now; row[10] = txt_(d.elapsed); row[11] = txt_(d.total + '/15'); row[12] = txt_(d.code); }
    if (d.type === 'redeem') row[13] = now;
    row[14] = now; row[15] = d.sid;
    sum.getRange(r, 1, 1, n).setValues([row]);

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, msg: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function getSheet_(ss, name, head) {
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(head);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, head.length).setFontWeight('bold').setBackground('#C23A2E').setFontColor('#FFFFFF');
    if (name === '總表') sh.hideColumns(head.length);
  }
  return sh;
}

/** 加上 ' 讓試算表把內容當文字（避免 6:40 變成時間、3E479 變成數字） */
function txt_(v) { return v ? "'" + v : ''; }

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
