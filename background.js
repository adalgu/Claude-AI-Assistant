// TODO: REMOVE THIS BEFORE PRODUCTION DEPLOYMENT
// Hardcoded API key for development purposes only
const HARDCODED_API_KEY = "api-key-here";

let CLAUDE_API_KEY = HARDCODED_API_KEY;
const DEFAULT_PROMPT = "이 텍스트를 요약해 주세요";
let PROMPT = DEFAULT_PROMPT;

// 저장된 설정 불러오기
chrome.storage.sync.get(["prompt"], function (items) {
  PROMPT = items.prompt || DEFAULT_PROMPT;
});

// 컨텍스트 메뉴 생성
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "processWithClaudeAI",
    title: "Claude AI로 처리",
    contexts: ["selection"],
  });
});

let sidepanelReady = false;
let pendingSelectedText = null;

// 컨텍스트 메뉴 클릭 이벤트 처리
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "processWithClaudeAI") {
    sidepanelReady = false;
    chrome.sidePanel.open({ windowId: tab.windowId });
    chrome.tabs.sendMessage(tab.id, { action: "getSelectedText" });
  }
});

// 설정 업데이트 메시지 리스너
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateSettings") {
    // 개발 중에는 API 키 업데이트를 무시
    PROMPT = request.prompt || DEFAULT_PROMPT;
    chrome.storage.sync.set({ prompt: PROMPT });
  } else if (request.action === "processText") {
    processText(request.text, sender.tab.id);
  } else if (request.action === "selectedText") {
    if (sidepanelReady) {
      chrome.runtime.sendMessage({
        action: "updateSidepanel",
        originalText: request.text,
      });
      processText(request.text, sender.tab.id);
    } else {
      pendingSelectedText = request.text;
    }
  } else if (request.action === "sidepanelReady") {
    sidepanelReady = true;
    if (pendingSelectedText) {
      chrome.runtime.sendMessage({
        action: "updateSidepanel",
        originalText: pendingSelectedText,
      });
      processText(pendingSelectedText, sender.tab.id);
      pendingSelectedText = null;
    }
  }
});

// 상태 업데이트 함수
function updateStatus(status) {
  chrome.runtime.sendMessage({ action: "updateStatus", status: status });
}

// 텍스트 처리 함수
async function processText(text, tabId) {
  updateStatus("처리 시작");
  try {
    if (!CLAUDE_API_KEY || CLAUDE_API_KEY === "your_api_key_here") {
      throw new Error(
        "API 키가 설정되지 않았습니다. 유효한 API 키를 입력해주세요."
      );
    }
    updateStatus("Claude AI API 호출 중");
    const result = await callClaudeAI(text);
    updateStatus("처리 완료");
    chrome.runtime.sendMessage({
      action: "updateProcessedText",
      processedText: result,
    });
  } catch (error) {
    console.error("텍스트 처리 중 오류:", error);
    updateStatus("오류 발생: " + error.toString());
    chrome.runtime.sendMessage({
      action: "showError",
      error: error.toString(),
    });
  }
}

// Claude AI API 호출 함수
async function callClaudeAI(text) {
  const fullPrompt = `${PROMPT}\n\n${text}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30초 타임아웃

  try {
    // WARNING: The following header is for development purposes only and should NEVER be used in production.
    // It bypasses important security measures and exposes your API key to potential threats.
    // TODO: REMOVE THIS HEADER BEFORE PRODUCTION DEPLOYMENT
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true", // DANGER: Remove this header before production use
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: fullPrompt,
          },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API 호출 실패: ${response.status} ${response.statusText}\n${errorText}`
      );
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("API 호출 시간 초과");
    }
    if (
      error.name === "TypeError" &&
      error.message.includes("Failed to fetch")
    ) {
      throw new Error(
        "네트워크 오류: API에 연결할 수 없습니다. 인터넷 연결을 확인하세요."
      );
    }
    throw error;
  }
}
