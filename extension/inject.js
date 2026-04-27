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
