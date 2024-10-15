const DEFAULT_PROMPT = "이 텍스트를 요약해 주세요";

document.addEventListener("DOMContentLoaded", function () {
  // 저장된 설정 불러오기
  chrome.storage.sync.get(["apiKey", "prompt"], function (items) {
    document.getElementById("apiKey").value = items.apiKey || "";
    document.getElementById("prompt").value = items.prompt || DEFAULT_PROMPT;
  });

  // 설정 저장 버튼 클릭 이벤트
  document.getElementById("save").addEventListener("click", function () {
    const apiKey = document.getElementById("apiKey").value;
    const prompt = document.getElementById("prompt").value || DEFAULT_PROMPT;

    chrome.storage.sync.set({ apiKey, prompt }, function () {
      console.log("설정이 저장되었습니다.");
      // 설정이 변경되었음을 백그라운드 스크립트에 알림
      chrome.runtime.sendMessage({
        action: "updateSettings",
        apiKey,
        prompt,
      });
      // 저장 완료 메시지 표시
      alert("설정이 저장되었습니다.");
    });
  });

  // 상태 업데이트 함수
  function updateStatus(status) {
    document.getElementById("status").textContent = `상태: ${status}`;
  }

  // 상태 업데이트 메시지 리스너
  chrome.runtime.onMessage.addListener(function (
    request,
    sender,
    sendResponse
  ) {
    if (request.action === "updateStatus") {
      updateStatus(request.status);
    }
  });

  // 초기 상태 설정
  updateStatus("대기 중");
});
