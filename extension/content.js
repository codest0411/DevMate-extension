// Inject script to interact with page context
const injectCode = () => {
  if (document.getElementById('devmate-injected-script')) return;
  const script = document.createElement('script');
  script.id = 'devmate-injected-script';
  script.src = chrome.runtime.getURL('inject.js');
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
      clearTimeout(fallbackTimeout);
      window.removeEventListener('FCC_CODE_RESULT', onCodeResult);
      sendResponse({ question, code: e.detail, error });
    };

    const fallbackTimeout = setTimeout(() => {
      window.removeEventListener('FCC_CODE_RESULT', onCodeResult);
      let fallbackCode = '';
      const editor = document.querySelector('.monaco-editor') || document.querySelector('.CodeMirror') || document.querySelector('.cm-content');
      if (editor) fallbackCode = editor.innerText;
      sendResponse({ question, code: fallbackCode, error });
    }, 3000);

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
