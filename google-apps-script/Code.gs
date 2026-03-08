const SPREADSHEET_ID = "1JqztpjqRn433eEs-JmuZuyrxYq8AvYFU8XDjXNxaWrw";
const SHEET_NAME = "表單回覆";
const HEADERS = [
  "提交時間",
  "主方案編號",
  "主方案",
  "是否加選方案四",
  "方案組合",
  "主方案金額",
  "優惠票總金額",
  "本次總金額",
  "捐款人姓名（公司名稱）",
  "身份統一編號",
  "收據地址",
  "連絡電話",
  "匯款日期",
  "匯款帳號後五碼",
  "320 元優惠票張數",
  "480 元優惠票張數",
  "640 元優惠票張數",
  "方案四總張數",
  "備註",
];
const LEGACY_HEADER_SIGNATURES = [
  {
    prefix: ["提交時間", "主方案編號", "主方案", "是否加選方案四", "方案組合", "主方案金額", "方案四金額", "本次總金額"],
    suffix: ["捐款人姓名（公司名稱）", "身份統一編號", "收據地址", "連絡電話", "匯款日期", "匯款帳號後五碼", "320 元優惠票張數", "480 元優惠票張數", "640 元優惠票張數", "方案四總張數", "備註"],
  },
  {
    prefix: ["提交時間", "方案編號", "贊助方案", "方案金額"],
    suffix: ["捐款人姓名（公司名稱）", "身份統一編號", "收據地址", "連絡電話", "捐款金額", "匯款日期", "匯款帳號後五碼", "320 元優惠票張數", "480 元優惠票張數", "640 元優惠票張數", "優惠票總張數", "備註"],
  },
  {
    prefix: ["submittedAt", "planId", "planName", "planAmountLabel"],
    suffix: ["donorName", "taxId", "receiptAddress", "contactPhone", "donationAmount", "transferDate", "transferLast5", "ticket320", "ticket480", "ticket640", "totalTickets", "remarks"],
  },
];

function doGet() {
  return HtmlService.createHtmlOutput("<h1>表單接收服務正常</h1>")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) {
      throw new Error(`Sheet not found: ${SHEET_NAME}`);
    }

    ensureHeaderRow(sheet);

    const data = e.parameter;
    const row = [
      data.submittedAt || "",
      data.basePlanId || data.planId || "",
      data.basePlanName || "",
      data.includesPlanFour || "否",
      data.combinedPlanName || data.planName || "",
      data.basePlanAmount || "",
      data.planFourAmount || "",
      data.totalDonationAmount || data.donationAmount || "",
      data.donorName || "",
      data.taxId || "",
      data.receiptAddress || "",
      data.contactPhone || "",
      data.transferDate || "",
      data.transferLast5 || "",
      data.ticket320 || "",
      data.ticket480 || "",
      data.ticket640 || "",
      data.planFourTotalTickets || data.totalTickets || "",
      data.remarks || "",
    ];

    sheet.appendRow(row);

    return buildIframeResponse({ ok: true, message: "已儲存" });
  } catch (error) {
    return buildIframeResponse({ ok: false, message: String(error) });
  }
}

function ensureHeaderRow(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    return;
  }

  const headerWidth = Math.max(sheet.getLastColumn(), HEADERS.length);
  const firstRow = trimTrailingEmptyCells(
    sheet.getRange(1, 1, 1, headerWidth).getValues()[0].map(String),
  );

  if (headersMatch(firstRow, HEADERS) || LEGACY_HEADER_SIGNATURES.some((signature) => headersMatchSignature(firstRow, signature))) {
    if (!headersMatch(firstRow, HEADERS)) {
      sheet.getRange(1, 1, 1, headerWidth).clearContent();
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    }
  }
}

function headersMatch(currentRow, expectedRow) {
  return expectedRow.every((value, index) => currentRow[index] === value);
}

function headersMatchSignature(currentRow, signature) {
  return rowStartsWith(currentRow, signature.prefix) && rowEndsWith(currentRow, signature.suffix);
}

function rowStartsWith(currentRow, expectedPrefix) {
  return expectedPrefix.every((value, index) => currentRow[index] === value);
}

function rowEndsWith(currentRow, expectedSuffix) {
  const startIndex = currentRow.length - expectedSuffix.length;
  if (startIndex < 0) {
    return false;
  }

  return expectedSuffix.every((value, index) => currentRow[startIndex + index] === value);
}

function trimTrailingEmptyCells(row) {
  const trimmedRow = row.slice();
  while (trimmedRow.length > 0 && trimmedRow[trimmedRow.length - 1] === "") {
    trimmedRow.pop();
  }
  return trimmedRow;
}

function buildIframeResponse(result) {
  const payload = JSON.stringify({
    source: "form-web-app",
    ok: result.ok,
    message: result.message,
  });

  return HtmlService.createHtmlOutput(
    `<script>
      window.top.postMessage(${payload}, "*");
    </script>`,
  ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
