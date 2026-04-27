chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'SOLVE_CHALLENGE' || request.action === 'FIX_ERRORS') {
    handleAIAssistance(request.action, sendResponse);
    return true; // Keep message channel open for async response
  }
});

async function handleAIAssistance(action, sendResponse) {
  try {
    const data = await chrome.storage.local.get(['openai_api_key', 'api_url', 'api_model']);
    const apiKey = data.openai_api_key;
    const apiUrl = data.api_url || 'https://api.openai.com/v1/chat/completions';
    const apiModel = data.api_model || 'gpt-4o';
    
    if (!apiKey) {
      sendResponse({ success: false, error: 'API_KEY_MISSING' });
      return;
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url.includes('freecodecamp.org')) {
      sendResponse({ success: false, error: 'NOT_FCC_PAGE' });
      return;
    }

    const extractedData = await chrome.tabs.sendMessage(tab.id, { action: 'EXTRACT_DATA' });
    
    // Extract code securely from MAIN world bypassing CSP
    let code = '';
    try {
      const codeResults = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        world: 'MAIN',
        func: () => {
          if (window.monaco && window.monaco.editor.getModels().length > 0) {
            return window.monaco.editor.getModels()[0].getValue();
          } else if (document.querySelector('.CodeMirror') && document.querySelector('.CodeMirror').CodeMirror) {
            return document.querySelector('.CodeMirror').CodeMirror.getValue();
          }
          return '';
        }
      });
      if (codeResults && codeResults[0] && codeResults[0].result) {
        code = codeResults[0].result;
      }
    } catch (e) {
      console.warn("DevMate: Could not extract from MAIN world", e);
    }

    if (!code) {
      code = extractedData.fallbackCode;
    }
    extractedData.code = code;
    
    if (!extractedData.question && !extractedData.code) {
      sendResponse({ success: false, error: 'COULD_NOT_EXTRACT' });
      return;
    }

    const aiResponse = await callOpenAI(apiKey, apiUrl, apiModel, action, extractedData);
    
    // Insert code securely from MAIN world bypassing CSP
    let inserted = false;
    try {
      const insertResults = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        world: 'MAIN',
        func: (newCode) => {
          if (window.monaco && window.monaco.editor.getModels().length > 0) {
            window.monaco.editor.getModels()[0].setValue(newCode);
            return true;
          } else if (document.querySelector('.CodeMirror') && document.querySelector('.CodeMirror').CodeMirror) {
            document.querySelector('.CodeMirror').CodeMirror.setValue(newCode);
            return true;
          }
          return false;
        },
        args: [aiResponse]
      });
      if (insertResults && insertResults[0] && insertResults[0].result) {
        inserted = true;
      }
    } catch (e) {
      console.warn("DevMate: Could not insert into MAIN world", e);
    }

    if (!inserted) {
      // Fallback injection via Content script if MAIN fails
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (newCode) => {
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
        },
        args: [aiResponse]
      });
    }
    
    await chrome.tabs.sendMessage(tab.id, { action: 'SHOW_TOAST', message: 'Code inserted successfully!' });
    
    sendResponse({ success: true });
  } catch (error) {
    console.warn("DevMate Background Warning:", error.message);
    sendResponse({ success: false, error: error.message });
  }
}

async function callOpenAI(apiKey, apiUrl, apiModel, action, data) {
  const isFix = action === 'FIX_ERRORS';
  
  let prompt = "";
  if (isFix) {
    prompt = `You are an expert debugging assistant.

Return ONLY fixed code.

ERROR:
${data.error || 'Syntax or logical error in the code causing tests to fail.'}

CODE:
${data.code}

Fix all issues and pass tests.`;
  } else {
    prompt = `You are an expert web development assistant specialized in solving FreeCodeCamp challenges.

STRICT RULES:
* Return ONLY the final working code.
* No explanations.
* Do not modify unrelated code.
* Follow instructions exactly.
* Ensure all tests pass.

CHALLENGE:
${data.question}

EXISTING CODE:
${data.code}

FINAL CODE:`;
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: apiModel,
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let errorDetail = response.status.toString();
    try {
      const parsed = JSON.parse(errorBody);
      if (parsed.error && parsed.error.message) errorDetail += ` - ${parsed.error.message}`;
    } catch(e) {
      errorDetail += ` - ${errorBody}`;
    }
    throw new Error(`API Error: ${errorDetail}`);
  }

  const result = await response.json();
  let code = result.choices[0].message.content.trim();
  
  if (code.startsWith('```')) {
    const lines = code.split('\n');
    if (lines[0].startsWith('```')) lines.shift();
    if (lines[lines.length - 1].startsWith('```')) lines.pop();
    code = lines.join('\n');
  }
  
  return code;
}
