let originalText = "";
let processedText = "";

document.addEventListener("DOMContentLoaded", () => {
  const insertBtn = document.getElementById("insert-btn");
  const replaceBtn = document.getElementById("replace-btn");
  const originalContent = document.getElementById("original-content");
  const processedContent = document.getElementById("processed-content");
  const statusMessage = document.getElementById("status-message");

  if (
    !insertBtn ||
    !replaceBtn ||
    !originalContent ||
    !processedContent ||
    !statusMessage
  ) {
    console.error("One or more required DOM elements not found");
    return;
  }

  insertBtn.addEventListener("click", () => sendAction("insert"));
  replaceBtn.addEventListener("click", () => sendAction("replace"));

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Received message in sidepanel:", request);

    if (request.action === "updateSidepanel") {
      originalText = request.originalText;
      console.log("Original text received:", originalText);
      originalContent.textContent = originalText;
      processedContent.textContent = "처리 중...";
      statusMessage.textContent = "Claude AI로 처리 중...";
    } else if (request.action === "updateProcessedText") {
      processedText = request.processedText;
      processedContent.textContent = processedText;
      statusMessage.textContent = "처리 완료";
    } else if (request.action === "updateStatus") {
      statusMessage.textContent = request.status;
    } else if (request.action === "showError") {
      statusMessage.textContent = "오류: " + request.error;
      processedContent.textContent = "처리 중 오류가 발생했습니다.";
    }
  });

  // Send a message to the background script indicating that the sidebar is ready
  chrome.runtime.sendMessage({ action: "sidepanelReady" });
});

function sendAction(action) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: action,
      processedText: processedText,
    });
  });
}

console.log("Sidepanel script loaded");
