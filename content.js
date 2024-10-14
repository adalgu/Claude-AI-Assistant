// 선택된 텍스트와 그 위치를 저장할 변수
let selectedText = "";
let selectedElement = null;

// 상태 표시 요소 생성
const statusElement = document.createElement("div");
statusElement.style.cssText = `
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px;
  border-radius: 5px;
  font-family: Arial, sans-serif;
  font-size: 14px;
  z-index: 9999;
  display: none;
`;
document.body.appendChild(statusElement);

// 상태 업데이트 함수
function updateStatus(status) {
  statusElement.textContent = status;
  statusElement.style.display = "block";
  setTimeout(() => {
    statusElement.style.display = "none";
  }, 3000);
}

// 텍스트 선택 이벤트 리스너
document.addEventListener("mouseup", function () {
  const selection = window.getSelection();
  selectedText = selection.toString().trim();
  if (selectedText) {
    selectedElement = selection.anchorNode.parentElement;
  }
});

// 백그라운드 스크립트로부터의 메시지 리스너
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getSelectedText") {
    chrome.runtime.sendMessage({
      action: "selectedText",
      text: selectedText,
    });
  } else if (request.action === "insert") {
    insertText(request.processedText);
  } else if (request.action === "replace") {
    replaceText(request.processedText);
  } else if (request.action === "showError") {
    updateStatus("오류 발생: " + request.error);
  } else if (request.action === "updateStatus") {
    updateStatus(request.status);
  }
});

// 편집 가능한 요소 찾기
function findEditableElement(element) {
  while (element && element !== document.body) {
    if (
      element.isContentEditable ||
      element.tagName === "TEXTAREA" ||
      (element.tagName === "INPUT" && element.type === "text")
    ) {
      return element;
    }
    element = element.parentElement;
  }
  return null;
}

// 텍스트 삽입 함수
function insertText(newText) {
  const editableElement = findEditableElement(selectedElement);
  if (!editableElement) {
    updateStatus("편집 가능한 요소를 찾을 수 없습니다.");
    return;
  }

  if (editableElement.isContentEditable) {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const textNode = document.createTextNode("\n" + newText);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);
  } else if (
    editableElement.tagName === "TEXTAREA" ||
    editableElement.tagName === "INPUT"
  ) {
    const startPos = editableElement.selectionStart;
    const endPos = editableElement.selectionEnd;
    const textBefore = editableElement.value.substring(0, startPos);
    const textAfter = editableElement.value.substring(
      endPos,
      editableElement.value.length
    );
    editableElement.value = textBefore + "\n" + newText + textAfter;
    editableElement.selectionStart = editableElement.selectionEnd =
      startPos + newText.length + 1;
  }

  updateStatus("텍스트 삽입 완료");
}

// 텍스트 대체 함수
function replaceText(newText) {
  const editableElement = findEditableElement(selectedElement);
  if (!editableElement) {
    updateStatus("편집 가능한 요소를 찾을 수 없습니다.");
    return;
  }

  if (editableElement.isContentEditable) {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const textNode = document.createTextNode(newText);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);
  } else if (
    editableElement.tagName === "TEXTAREA" ||
    editableElement.tagName === "INPUT"
  ) {
    const startPos = editableElement.selectionStart;
    const endPos = editableElement.selectionEnd;
    const textBefore = editableElement.value.substring(0, startPos);
    const textAfter = editableElement.value.substring(
      endPos,
      editableElement.value.length
    );
    editableElement.value = textBefore + newText + textAfter;
    editableElement.selectionStart = startPos;
    editableElement.selectionEnd = startPos + newText.length;
  }

  updateStatus("텍스트 대체 완료");
}

// 자동 처리 기능 (옵션)
chrome.storage.sync.get(["autoProcess"], function (items) {
  if (items.autoProcess) {
    document.addEventListener("mouseup", function () {
      if (selectedText) {
        updateStatus("자동 처리 시작");
        chrome.runtime.sendMessage({
          action: "processText",
          text: selectedText,
        });
      }
    });
  }
});

// 초기 상태 설정
updateStatus("준비 완료");
