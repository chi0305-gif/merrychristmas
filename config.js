/*
 * SWSH Christmas Reading Quest — 活動設定檔
 * 想換地點、密碼、題目或推薦書，只要改這個檔案即可。
 * index.html（學生遊戲）與 staff.html（工作人員後台）共用這份設定。
 */
window.QUEST_CONFIG = {
  eventName: "四維高中圖書館聖誕週",
  questName: "聖誕故事失竊事件：DeDe 的最後任務",
  englishName: "SWSH Christmas Reading Quest",
  slogan: "今年聖誕節，故事不會自己找到你，你必須親自把它找回來！",
  targetMinutes: 10,

  // 工作人員核銷用 PIN（請在活動前更改）
  staffPin: "2512",
  // 完賽驗證碼用的鹽值（請在活動前改成只有工作人員知道的字串）
  salt: "dede-xmas-2026",

  // 每一關的建議地點與通關字（關卡依序開放，不需要掃 QR Code）
  stages: [
    { id: 1, title: "聖誕老人的遺失信件", short: "聖誕信件", place: "圖書館入口", type: "閱讀理解", char: "暖" },
    { id: 2, title: "雪人的記憶拼圖",   short: "雪人拼圖", place: "校園穿堂／閱讀區", type: "文字重組", char: "愛" },
    { id: 3, title: "麋鹿的神祕書單",   short: "神祕書單", place: "圖書館書架區", type: "書籍偵探", char: "讀" },
    { id: 4, title: "聖誕密碼研究所",   short: "密碼研究所", place: "教學大樓公共空間", type: "邏輯推理", char: "閱" },
    { id: 5, title: "DeDe 的最後禮物",  short: "DeDe 終極任務", place: "圖書館聖誕樹旁", type: "終極任務", char: "心" }
  ]
};

/* 完賽驗證碼：學生端與工作人員端用同一個函式計算（FNV-1a 雜湊 → 5 碼） */
window.questCode = function (str) {
  var h = 0x811c9dc5;
  for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  var A = "ACDEFHJKLMNPRTUVWXY34679", out = "";
  for (var j = 0; j < 5; j++) { out += A[h % A.length]; h = Math.floor(h / A.length) + (j * 7919); }
  return out;
};
