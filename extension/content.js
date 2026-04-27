// Inject script to interact with page context
const injectCode = () => {
  if (document.getElementById('devmate-injected-script')) return;
  const script = document.createElement('script');
  script.id = 'devmate-injected-script';
  script.textContent = `
    window.addEventListener('GET_FCC_CODE', () => {
      let code = '';
      try {
        if (window.monaco && window.monaco.editor.getModels().length > 0) {
          code = window.monaco.editor.getModels()[0].getValue();
        } else if (document.querySelector('.CodeMirror') && document.querySelector('.CodeMirror').CodeMirror) {
          code = document.querySelector('.CodeMirror').CodeMirror.getValue();
        } else {
          const editor = document.querySelector('.monaco-editor') || document.querySelector('.CodeMirror') || document.querySelector('.cm-content');
          if (editor) code = editor.innerText;
        }
      } catch (e) {
        console.error("DevMate: Error getting code", e);
      }
      window.dispatchEvent(new CustomEvent('FCC_CODE_RESULT', { detail: code }));
    });

    window.addEventListener('SET_FCC_CODE', (e) => {
      const newCode = e.detail;
      try {
        if (window.monaco && window.monaco.editor.getModels().length > 0) {
          window.monaco.editor.getModels()[0].setValue(newCode);
        } else if (document.querySelector('.CodeMirror') && document.querySelector('.CodeMirror').CodeMirror) {
          document.querySelector('.CodeMirror').CodeMirror.setValue(newCode);
        } else {
          // Fallback simulation
          const textarea = document.querySelector('textarea.inputarea') || document.querySelector('.cm-content') || document.querySelector('[contenteditable="true"]');
          if (textarea) {
            textarea.focus();
            if (textarea.select) textarea.select();
            else {
              const range = document.createRange();
              range.selectNodeContents(textarea);
              const sel = window.getSelection();
              sel.removeAllRanges();
              sel.addRange(range);
            }
            document.execCommand('insertText', false, newCode);
          }
        }
      } catch (e) {
        console.error("DevMate: Error setting code", e);
      }
    });
  `;
  document.documentElement.appendChild(script);
};

injectCode();

function getChallengeText() {
  const instructionElement = document.querySelector('#description') || 
                             document.querySelector('.challenge-instructions') || 
                             document.querySelector('[data-playwright-test-label="challenge-description"]') || 
                             document.querySelector('.description-container');
  return instructionElement ? instructionElement.innerText.trim() : '';
}

function getConsoleErrors() {
  const outputEl = document.querySelector('.output-text') || document.querySelector('#output') || document.querySelector('[data-playwright-test-label="test-output"]');
  return outputEl ? outputEl.innerText.trim() : '';
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'EXTRACT_DATA') {
    const question = getChallengeText();
    const error = getConsoleErrors();
    
    // Request code from injected script
    const onCodeResult = (e) => {
      window.removeEventListener('FCC_CODE_RESULT', onCodeResult);
      sendResponse({ question, code: e.detail, error });
    };
    window.addEventListener('FCC_CODE_RESULT', onCodeResult);
    window.dispatchEvent(new CustomEvent('GET_FCC_CODE'));
    
    return true; // async response
  }
  
  if (request.action === 'INSERT_CODE') {
    window.dispatchEvent(new CustomEvent('SET_FCC_CODE', { detail: request.code }));
    showToast('Code inserted successfully!', 'success');
    sendResponse({ success: true });
  }
});

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: ${type === 'success' ? '#10b981' : '#ef4444'};
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-family: system-ui, sans-serif;
    font-size: 14px;
    font-weight: 500;
    z-index: 999999;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    transition: opacity 0.3s, transform 0.3s;
    transform: translateY(100px);
    opacity: 0;
  `;
  toast.innerText = message;
  document.body.appendChild(toast);
  
  requestAnimationFrame(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  });
  
  setTimeout(() => {
    toast.style.transform = 'translateY(100px)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
