document.addEventListener('DOMContentLoaded', async () => {
  const mainView = document.getElementById('main-view');
  const settingsView = document.getElementById('settings-view');
  
  const settingsBtn = document.getElementById('settings-btn');
  const backBtn = document.getElementById('back-btn');
  const saveKeyBtn = document.getElementById('save-key-btn');
  const apiKeyInput = document.getElementById('api-key');
  const apiUrlInput = document.getElementById('api-url');
  const apiModelInput = document.getElementById('api-model');
  
  const solveBtn = document.getElementById('solve-btn');
  const fixBtn = document.getElementById('fix-btn');
  const statusMessage = document.getElementById('status-message');
  const settingsStatus = document.getElementById('settings-status');

  // Check if API key exists
  const data = await chrome.storage.local.get(['openai_api_key', 'api_url', 'api_model']);
  if (!data.openai_api_key) {
    apiUrlInput.value = data.api_url || 'https://api.openai.com/v1/chat/completions';
    apiModelInput.value = data.api_model || 'gpt-4o';
    showView(settingsView);
  }

  // Navigation
  settingsBtn.addEventListener('click', async () => {
    const data = await chrome.storage.local.get(['openai_api_key', 'api_url', 'api_model']);
    if (data.openai_api_key) apiKeyInput.value = data.openai_api_key;
    apiUrlInput.value = data.api_url || 'https://api.openai.com/v1/chat/completions';
    apiModelInput.value = data.api_model || 'gpt-4o';
    showView(settingsView);
  });

  // Auto-detect Provider
  apiKeyInput.addEventListener('input', () => {
    const val = apiKeyInput.value.trim();
    if (val.startsWith('gsk_')) {
      apiUrlInput.value = 'https://api.groq.com/openai/v1/chat/completions';
      apiModelInput.value = 'llama3-70b-8192';
    } else if (val.startsWith('sk-')) {
      apiUrlInput.value = 'https://api.openai.com/v1/chat/completions';
      apiModelInput.value = 'gpt-4o';
    }
  });

  backBtn.addEventListener('click', () => {
    settingsStatus.textContent = '';
    showView(mainView);
  });

  // Save API Key
  saveKeyBtn.addEventListener('click', async () => {
    const key = apiKeyInput.value.trim();
    const url = apiUrlInput.value.trim() || 'https://api.openai.com/v1/chat/completions';
    const model = apiModelInput.value.trim() || 'gpt-4o';
    
    if (!key) {
      showSettingsStatus('Please enter a valid API key.', 'error');
      return;
    }
    
    await chrome.storage.local.set({ openai_api_key: key, api_url: url, api_model: model });
    showSettingsStatus('Settings saved successfully!', 'success');
    
    setTimeout(() => {
      settingsStatus.textContent = '';
      showView(mainView);
    }, 1500);
  });

  // Main Actions
  solveBtn.addEventListener('click', () => handleAction('SOLVE_CHALLENGE', solveBtn));
  fixBtn.addEventListener('click', () => handleAction('FIX_ERRORS', fixBtn));

  async function handleAction(action, buttonElement) {
    setStatus('', '');
    setLoading(buttonElement, true);

    try {
      const response = await chrome.runtime.sendMessage({ action });
      
      if (response && response.success) {
        setStatus('Success! Check the editor.', 'success');
      } else {
        const errorMsg = response ? response.error : 'Unknown error occurred.';
        if (errorMsg === 'API_KEY_MISSING') {
          showView(settingsView);
          showSettingsStatus('Please set your API key first.', 'error');
        } else if (errorMsg === 'NOT_FCC_PAGE') {
          setStatus('Please navigate to a FreeCodeCamp challenge.', 'error');
        } else {
          if (errorMsg.includes('Receiving end does not exist')) {
            setStatus('Please refresh the FreeCodeCamp tab to activate the extension.', 'error');
          } else {
            setStatus(`Error: ${errorMsg}`, 'error');
          }
        }
      }
    } catch (err) {
      setStatus('Could not connect to the page. Please refresh the FreeCodeCamp tab.', 'error');
    } finally {
      setLoading(buttonElement, false);
    }
  }

  // Helpers
  function showView(viewToShow) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    viewToShow.classList.add('active');
  }

  function setLoading(button, isLoading) {
    const textSpan = button.querySelector('.btn-text');
    const spinner = button.querySelector('.spinner');
    
    if (isLoading) {
      button.disabled = true;
      textSpan.classList.add('hidden');
      spinner.classList.remove('hidden');
    } else {
      button.disabled = false;
      textSpan.classList.remove('hidden');
      spinner.classList.add('hidden');
    }
  }

  function setStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status ${type}`;
  }

  function showSettingsStatus(message, type) {
    settingsStatus.textContent = message;
    settingsStatus.className = `status ${type}`;
  }
});
