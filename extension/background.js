chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'SOLVE_CHALLENGE' || request.action === 'FIX_ERRORS') {
    handleAIAssistance(request.action, sendResponse);
    return true; // Keep message channel open for async response
  }
});

async function handleAIAssistance(action, sendResponse) {
  try {
    const data = await chrome.storage.local.get('openai_api_key');
    const apiKey = data.openai_api_key;
    
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
    
    if (!extractedData.question && !extractedData.code) {
      sendResponse({ success: false, error: 'COULD_NOT_EXTRACT' });
      return;
    }

    const aiResponse = await callOpenAI(apiKey, action, extractedData);
    
    await chrome.tabs.sendMessage(tab.id, { action: 'INSERT_CODE', code: aiResponse });
    
    sendResponse({ success: true });
  } catch (error) {
    console.warn("DevMate Background Warning:", error.message);
    sendResponse({ success: false, error: error.message });
  }
}

async function callOpenAI(apiKey, action, data) {
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

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API Error: ${response.status}`);
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
