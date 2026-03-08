const BASE_PLAN_OPTIONS = [
  {
    id: "plan-1",
    name: "方案一",
    amountLabel: "NT$5,000",
    suggestedAmount: 5000,
    summary: "貴賓票券 4 張，電子節目冊芳名錄",
    benefits: ["貴賓票券 4 張", "公司標誌 + 公司名稱放置於電子節目冊芳名錄"],
  },
  {
    id: "plan-2",
    name: "方案二",
    amountLabel: "NT$10,000",
    suggestedAmount: 10000,
    summary: "貴賓票券 8 張，1/2 版形象頁，貴賓小卡",
    benefits: [
      "貴賓票券 8 張",
      "公司標誌 + 公司名稱放置於電子節目冊 1/2 版面形象頁",
      "公司標誌 + 公司名稱放置於貴賓小卡（電子 + 紙本）",
    ],
  },
  {
    id: "plan-3",
    name: "方案三",
    amountLabel: "NT$20,000（含）以上",
    suggestedAmount: 20000,
    summary: "貴賓票券 20 張，滿版形象頁，官方社群感謝文",
    benefits: [
      "貴賓票券 20 張",
      "公司標誌 + 公司名稱放置於電子節目冊滿版形象頁",
      "公司標誌 + 公司名稱放置於貴賓小卡（電子 + 紙本）",
      "官方社群感謝文",
    ],
  },
  {
    id: "plan-4",
    name: "方案四",
    amountLabel: "依票張計算",
    suggestedAmount: 0,
    summary: "優惠票 15 張（含）以上，依票種張數自動加總",
    benefits: [
      "可單選方案四",
      "320 元（原 400 元）",
      "480 元（原 600 元）",
      "640 元（原 800 元）",
    ],
  },
];

const PLAN_FOUR = {
  id: "plan-4",
  name: "方案四",
  summary: "優惠票 15 張（含）以上，依票種張數自動加總",
};

const FLEXIBLE_AMOUNT_PLAN_ID = "plan-3";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^0\d{8,9}$/;
const TAX_ID_REGEX = /^\d{8}$/;
const TRANSFER_LAST_FIVE_REGEX = /^\d{5}$/;

const dom = {};
let selectedBasePlanId = BASE_PLAN_OPTIONS[0].id;
let includePlanFour = false;
let skipResetCleanup = false;
let wasFlexibleAmountPlan = false;

document.addEventListener("DOMContentLoaded", () => {
  cacheDom();
  renderBasePlans();
  bindEvents();
  updatePlanUI();
});

function cacheDom() {
  dom.form = document.querySelector("#sponsorForm");
  dom.planSelector = document.querySelector("#planSelector");
  dom.planHint = document.querySelector("#planHint");
  dom.addPlanFour = document.querySelector("#addPlanFour");
  dom.planFourCard = document.querySelector("#planFourCard");
  dom.ticketBuilder = document.querySelector("#ticketBuilder");
  dom.ticketSummary = document.querySelector("#ticketSummary");
  dom.planThreeAmountField = document.querySelector("#planThreeAmountField");
  dom.planThreeAmountHint = document.querySelector("#planThreeAmountHint");
  dom.comboNameValue = document.querySelector("#comboNameValue");
  dom.baseAmountValue = document.querySelector("#baseAmountValue");
  dom.planFourAmountValue = document.querySelector("#planFourAmountValue");
  dom.totalAmountValue = document.querySelector("#totalAmountValue");
  dom.formStatus = document.querySelector("#formStatus");
  dom.submitButton = dom.form.querySelector('button[type="submit"]');
  dom.resetButton = dom.form.querySelector('button[type="reset"]');
}

function bindEvents() {
  dom.planSelector.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    if (target.name === "basePlan") {
      selectedBasePlanId = target.value;
      updatePlanUI();
    }
  });

  dom.addPlanFour.addEventListener("change", () => {
    includePlanFour = dom.addPlanFour.checked;
    updatePlanUI();
  });

  for (const name of ["ticket320", "ticket480", "ticket640"]) {
    dom.form.elements[name].addEventListener("input", updatePlanUI);
  }

  dom.form.elements.basePlanCustomAmount.addEventListener("input", (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      target.value = sanitizeNumericValue(target.value);
    }
    updatePlanUI();
  });

  for (const [name, maxLength] of [["taxId", 8], ["contactPhone", 10], ["transferLast5", 5]]) {
    dom.form.elements[name].addEventListener("input", (event) => {
      const target = event.target;
      if (target instanceof HTMLInputElement) {
        target.value = sanitizeNumericValue(target.value, maxLength);
      }
    });
  }

  dom.form.addEventListener("submit", handleSubmit);
  dom.form.addEventListener("reset", handleReset);
}

function renderBasePlans() {
  dom.planSelector.innerHTML = BASE_PLAN_OPTIONS.map(
    (plan) => `
      <label class="plan-card" data-plan-card="${plan.id}">
        <input class="plan-card__input" type="radio" name="basePlan" value="${plan.id}" ${
          plan.id === selectedBasePlanId ? "checked" : ""
        } />
        <span class="plan-card__eyebrow">${plan.name}</span>
        <strong class="plan-card__amount">${plan.amountLabel}</strong>
        <p class="plan-card__summary">${plan.summary}</p>
        <ul class="plan-card__list">
          ${plan.benefits.map((benefit) => `<li>${benefit}</li>`).join("")}
        </ul>
      </label>
    `,
  ).join("");
}

function updatePlanUI() {
  const basePlan = getBasePlan(selectedBasePlanId);
  const donationAmountField = dom.form.elements.donationAmount;
  const basePlanCustomAmountField = dom.form.elements.basePlanCustomAmount;
  const isPlanFourPrimary = basePlan.id === PLAN_FOUR.id;
  const isFlexibleAmount = isFlexibleAmountPlan(basePlan);
  const cards = dom.planSelector.querySelectorAll("[data-plan-card]");

  for (const card of cards) {
    card.classList.toggle("is-selected", card.dataset.planCard === selectedBasePlanId);
  }

  if (isPlanFourPrimary) {
    includePlanFour = false;
  }

  dom.addPlanFour.checked = includePlanFour;
  dom.addPlanFour.disabled = isPlanFourPrimary;
  dom.planFourCard.classList.toggle("is-selected", includePlanFour);
  dom.planFourCard.classList.toggle("is-disabled", isPlanFourPrimary);
  dom.ticketBuilder.classList.toggle("is-hidden", !shouldUsePlanFour(basePlan));
  dom.planThreeAmountField.hidden = !isFlexibleAmount;

  if (isFlexibleAmount && !wasFlexibleAmountPlan && parseAmount(basePlanCustomAmountField.value) === 0) {
    basePlanCustomAmountField.value = String(basePlan.suggestedAmount);
  }

  const pricing = getPlanPricing(basePlan, basePlanCustomAmountField.value);

  basePlanCustomAmountField.placeholder = `請填寫 ${formatCurrency(basePlan.suggestedAmount)} 以上金額`;
  dom.planThreeAmountHint.textContent = pricing.hasPlanFour
    ? `僅方案三使用。主方案金額不得低於 ${formatCurrency(basePlan.suggestedAmount)}，本次總金額會自動再加上優惠票金額。`
    : `僅方案三使用。請填寫 ${formatCurrency(basePlan.suggestedAmount)} 以上主方案金額。`;

  if (!pricing.isFlexibleAmount) {
    basePlanCustomAmountField.value = "";
  }
  donationAmountField.readOnly = true;
  donationAmountField.placeholder = "系統會自動計算本次總金額";
  donationAmountField.value = String(pricing.displayTotalAmount);

  dom.comboNameValue.textContent = pricing.combinedPlanName;
  dom.baseAmountValue.textContent = formatCurrency(pricing.displayBaseAmount);
  dom.planFourAmountValue.textContent = formatCurrency(pricing.planFourAmount);
  dom.totalAmountValue.textContent = formatCurrency(pricing.displayTotalAmount);

  dom.planHint.textContent = pricing.isPlanFourPrimary
    ? "已單選方案四。請填寫優惠票張數，系統會自動計算該次總金額。"
    : pricing.isFlexibleAmount
    ? pricing.hasPlanFour
      ? `已選擇 ${pricing.combinedPlanName}。請先填寫方案三金額，最低 ${formatCurrency(basePlan.suggestedAmount)}，本次總金額會自動加上優惠票金額。`
      : `已選擇 ${pricing.combinedPlanName}。請填寫方案三金額，最低 ${formatCurrency(basePlan.suggestedAmount)}。`
    : pricing.hasPlanFour
    ? `已選擇 ${pricing.combinedPlanName}。優惠票金額會加總到本次總金額。`
    : `已選擇 ${basePlan.name}，系統會先帶入建議金額 ${formatCurrency(basePlan.suggestedAmount)}。`;

  dom.ticketSummary.textContent = pricing.hasPlanFour
    ? buildTicketSummaryText(pricing.ticketSummary)
    : "如需搭配方案四，請先勾選上方的方案四加購。";
  wasFlexibleAmountPlan = pricing.isFlexibleAmount;
}

function buildTicketSummaryText(ticketSummary) {
  if (ticketSummary.totalTickets === 0) {
    return "方案四需購買 15 張（含）以上優惠票。";
  }

  return `方案四目前共 ${ticketSummary.totalTickets} 張，金額 ${formatCurrency(ticketSummary.totalAmount)}。${
    ticketSummary.totalTickets >= 15 ? "已符合 15 張門檻。" : "尚未達到 15 張門檻。"
  }`;
}

function getTicketSummary() {
  const ticket320 = toInt(dom.form.elements.ticket320.value);
  const ticket480 = toInt(dom.form.elements.ticket480.value);
  const ticket640 = toInt(dom.form.elements.ticket640.value);
  const totalTickets = ticket320 + ticket480 + ticket640;
  const totalAmount = ticket320 * 320 + ticket480 * 480 + ticket640 * 640;

  return {
    ticket320,
    ticket480,
    ticket640,
    totalTickets,
    totalAmount,
  };
}

async function handleSubmit(event) {
  event.preventDefault();
  clearStatus();

  const scriptUrl = getScriptUrl();
  if (!scriptUrl) {
    setStatus("尚未設定資料接收網址。請先修改 config.js。", "error");
    return;
  }

  const formData = new FormData(dom.form);
  const basePlan = getBasePlan(formData.get("basePlan") || selectedBasePlanId);
  const donorName = String(formData.get("donorName") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const basePlanCustomAmount = sanitizeNumericValue(formData.get("basePlanCustomAmount"));
  const taxId = sanitizeNumericValue(formData.get("taxId"), 8);
  const contactPhone = sanitizeNumericValue(formData.get("contactPhone"), 10);
  const transferLast5 = sanitizeNumericValue(formData.get("transferLast5"), 5);
  const pricing = getPlanPricing(basePlan, basePlanCustomAmount);
  const donationAmount = pricing.displayTotalAmount;

  dom.form.elements.email.value = email;
  dom.form.elements.basePlanCustomAmount.value = basePlanCustomAmount;
  dom.form.elements.taxId.value = taxId;
  dom.form.elements.contactPhone.value = contactPhone;
  dom.form.elements.transferLast5.value = transferLast5;

  if (!donorName) {
    setStatus("請填寫捐款人姓名或公司名稱。", "error");
    dom.form.elements.donorName.focus();
    return;
  }

  if (!contactPhone) {
    setStatus("請填寫連絡電話。", "error");
    dom.form.elements.contactPhone.focus();
    return;
  }

  if (!email) {
    setStatus("請填寫電子郵件。", "error");
    dom.form.elements.email.focus();
    return;
  }

  if (!EMAIL_REGEX.test(email)) {
    setStatus("電子郵件格式不正確，請重新確認。", "error");
    dom.form.elements.email.focus();
    return;
  }

  if (pricing.isFlexibleAmount && !basePlanCustomAmount) {
    setStatus("請填寫方案三金額。", "error");
    dom.form.elements.basePlanCustomAmount.focus();
    return;
  }

  if (pricing.isFlexibleAmount && pricing.basePlanAmount < basePlan.suggestedAmount) {
    setStatus(`方案三金額不得低於 ${formatCurrency(basePlan.suggestedAmount)}。`, "error");
    dom.form.elements.basePlanCustomAmount.focus();
    return;
  }

  if (!PHONE_REGEX.test(contactPhone)) {
    setStatus("連絡電話請填寫正確格式，例如 0912345678。", "error");
    dom.form.elements.contactPhone.focus();
    return;
  }

  if (taxId && !TAX_ID_REGEX.test(taxId)) {
    setStatus("身份統一編號請填寫 8 碼數字。", "error");
    dom.form.elements.taxId.focus();
    return;
  }

  if (transferLast5 && !TRANSFER_LAST_FIVE_REGEX.test(transferLast5)) {
    setStatus("匯款帳號後五碼請填寫 5 碼數字。", "error");
    dom.form.elements.transferLast5.focus();
    return;
  }

  if (pricing.hasPlanFour && pricing.ticketSummary.totalTickets < 15) {
    setStatus(pricing.isPlanFourPrimary ? "單選方案四時，優惠票需累計至少 15 張。" : "搭配方案四時，優惠票需累計至少 15 張。", "error");
    dom.form.elements.ticket320.focus();
    return;
  }

  if (!donationAmount) {
    setStatus("請先完成方案內容，系統才能計算本次總金額。", "error");
    if (pricing.isFlexibleAmount) {
      dom.form.elements.basePlanCustomAmount.focus();
    } else {
      dom.form.elements.ticket320.focus();
    }
    return;
  }

  if (donationAmount < pricing.minimumRequiredAmount) {
    setStatus(`本次總金額不得低於 ${formatCurrency(pricing.minimumRequiredAmount)}。`, "error");
    dom.form.elements.donationAmount.focus();
    return;
  }

  const payload = buildPayload(
    formData,
    basePlan,
    donorName,
    email,
    contactPhone,
    taxId,
    transferLast5,
    donationAmount,
    pricing.minimumRequiredAmount,
    pricing.hasPlanFour,
    pricing.ticketSummary,
  );

  try {
    setSubmittingState(true);
    await submitToAppsScript(scriptUrl, payload);

    skipResetCleanup = true;
    dom.form.reset();
    includePlanFour = false;
    selectedBasePlanId = BASE_PLAN_OPTIONS[0].id;
    renderBasePlans();
    updatePlanUI();
    setStatus("提交成功，資料已寫入 Google 試算表。", "success");
  } catch (error) {
    console.error(error);
    setStatus("提交失敗。請確認 Apps Script 已部署為 Web App，並且 config.js 的網址正確。", "error");
  } finally {
    setSubmittingState(false);
  }
}

function handleReset() {
  window.requestAnimationFrame(() => {
    if (skipResetCleanup) {
      skipResetCleanup = false;
    } else {
      clearStatus();
    }
    selectedBasePlanId = BASE_PLAN_OPTIONS[0].id;
    includePlanFour = false;
    renderBasePlans();
    updatePlanUI();
  });
}

function buildPayload(
  formData,
  basePlan,
  donorName,
  email,
  contactPhone,
  taxId,
  transferLast5,
  donationAmount,
  minimumRequiredAmount,
  hasPlanFour,
  ticketSummary,
) {
  const isPlanFourPrimary = basePlan.id === PLAN_FOUR.id;
  const planFourAmount = (isPlanFourPrimary || hasPlanFour) ? ticketSummary.totalAmount : 0;
  const combinedPlanName = isPlanFourPrimary ? PLAN_FOUR.name : hasPlanFour ? `${basePlan.name} + ${PLAN_FOUR.name}` : basePlan.name;
  const totalTickets = (isPlanFourPrimary || hasPlanFour) ? ticketSummary.totalTickets : 0;
  const effectivePlanFourAmount = planFourAmount;
  const basePlanAmount = isPlanFourPrimary ? 0 : Math.max(donationAmount - effectivePlanFourAmount, 0);

  return {
    submittedAt: new Date().toISOString(),
    planId: basePlan.id,
    planName: combinedPlanName,
    planAmountLabel: formatCurrency(donationAmount),
    basePlanId: basePlan.id,
    basePlanName: basePlan.name,
    includesPlanFour: isPlanFourPrimary ? "單選" : hasPlanFour ? "是" : "否",
    combinedPlanName,
    basePlanAmount: String(basePlanAmount),
    planFourAmount: String(effectivePlanFourAmount),
    totalDonationAmount: String(donationAmount),
    minimumRequiredAmount: String(minimumRequiredAmount),
    donorName,
    email,
    taxId,
    receiptAddress: String(formData.get("receiptAddress") || "").trim(),
    contactPhone,
    donationAmount: String(donationAmount),
    transferDate: String(formData.get("transferDate") || "").trim(),
    transferLast5,
    remarks: String(formData.get("remarks") || "").trim(),
    ticket320: String(isPlanFourPrimary || hasPlanFour ? ticketSummary.ticket320 : 0),
    ticket480: String(isPlanFourPrimary || hasPlanFour ? ticketSummary.ticket480 : 0),
    ticket640: String(isPlanFourPrimary || hasPlanFour ? ticketSummary.ticket640 : 0),
    planFourTotalTickets: String(totalTickets),
    totalTickets: String(totalTickets),
  };
}

function getScriptUrl() {
  return String(window.FORM_CONFIG?.googleScriptUrl || "").trim();
}

function submitToAppsScript(scriptUrl, payload) {
  return submitWithIframe(scriptUrl, payload);
}

function submitWithIframe(scriptUrl, payload) {
  return new Promise((resolve, reject) => {
    const iframeName = `gas-submit-${Date.now()}`;
    const iframe = document.createElement("iframe");
    const form = document.createElement("form");
    let didSubmit = false;

    iframe.name = iframeName;
    iframe.hidden = true;

    form.method = "POST";
    form.action = scriptUrl;
    form.target = iframeName;
    form.hidden = true;

    const messageHandler = (event) => {
      const data = event.data;
      if (!data || data.source !== "form-web-app") {
        return;
      }

      cleanup();

      if (data.ok) {
        resolve();
      } else {
        reject(new Error(data.message || "Apps Script returned an error"));
      }
    };

    for (const [key, value] of Object.entries(payload)) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value;
      form.appendChild(input);
    }

    const cleanup = () => {
      iframe.removeEventListener("load", handleLoad);
      iframe.removeEventListener("error", handleError);
      window.removeEventListener("message", messageHandler);
      window.clearTimeout(timeoutId);
      form.remove();
      iframe.remove();
    };

    const handleLoad = () => {
      if (!didSubmit) {
        return;
      }
    };

    const handleError = () => {
      cleanup();
      reject(new Error("Apps Script iframe submission failed"));
    };

    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error("Apps Script submission timed out"));
    }, 20000);

    iframe.addEventListener("load", handleLoad);
    iframe.addEventListener("error", handleError);
    window.addEventListener("message", messageHandler);

    document.body.appendChild(iframe);
    document.body.appendChild(form);
    didSubmit = true;
    form.submit();
  });
}

function setSubmittingState(isSubmitting) {
  dom.submitButton.disabled = isSubmitting;
  dom.resetButton.disabled = isSubmitting;
  dom.submitButton.textContent = isSubmitting ? "提交中..." : "提交";
}

function getBasePlan(planId) {
  return BASE_PLAN_OPTIONS.find((plan) => plan.id === planId) || BASE_PLAN_OPTIONS[0];
}

function isFlexibleAmountPlan(basePlan) {
  return basePlan.id === FLEXIBLE_AMOUNT_PLAN_ID;
}

function shouldUsePlanFour(basePlan) {
  return basePlan.id === PLAN_FOUR.id || includePlanFour;
}

function getPlanPricing(basePlan, rawDonationAmount = dom.form.elements.donationAmount.value) {
  const isPlanFourPrimary = basePlan.id === PLAN_FOUR.id;
  const hasPlanFour = shouldUsePlanFour(basePlan);
  const isFlexibleAmount = isFlexibleAmountPlan(basePlan);
  const ticketSummary = getTicketSummary();
  const planFourAmount = hasPlanFour ? ticketSummary.totalAmount : 0;
  const minimumBaseAmount = isPlanFourPrimary ? 0 : basePlan.suggestedAmount;
  const basePlanAmount = isPlanFourPrimary
    ? 0
    : isFlexibleAmount
      ? parseAmount(rawDonationAmount)
      : minimumBaseAmount;
  const minimumRequiredAmount = minimumBaseAmount + planFourAmount;
  const displayBaseAmount = isPlanFourPrimary ? 0 : basePlanAmount;
  const displayTotalAmount = displayBaseAmount + planFourAmount;
  const combinedPlanName = isPlanFourPrimary ? PLAN_FOUR.name : hasPlanFour ? `${basePlan.name} + ${PLAN_FOUR.name}` : basePlan.name;

  return {
    basePlanAmount,
    basePlan,
    combinedPlanName,
    displayBaseAmount,
    displayTotalAmount,
    hasPlanFour,
    isFlexibleAmount,
    isPlanFourPrimary,
    minimumRequiredAmount,
    planFourAmount,
    ticketSummary,
  };
}

function parseAmount(value) {
  return toInt(String(value || "").replace(/[^\d]/g, ""));
}

function sanitizeNumericValue(value, maxLength = Number.POSITIVE_INFINITY) {
  return String(value || "").replace(/\D/g, "").slice(0, maxLength);
}

function toInt(value) {
  const number = Number.parseInt(String(value || "0"), 10);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function formatCurrency(value) {
  return `NT$${new Intl.NumberFormat("zh-TW").format(value || 0)}`;
}

function setStatus(message, tone) {
  dom.formStatus.textContent = message;
  dom.formStatus.classList.remove("is-success", "is-error");
  if (tone) {
    dom.formStatus.classList.add(`is-${tone}`);
  }
}

function clearStatus() {
  dom.formStatus.textContent = "";
  dom.formStatus.classList.remove("is-success", "is-error");
}
