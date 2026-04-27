# 🚀 DevMate AI — FreeCodeCamp Assistant

<p align="center">
  <img src="https://img.shields.io/badge/Manifest-V3-blue?style=for-the-badge&logo=googlechrome" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/OpenAI-GPT_4o-green?style=for-the-badge&logo=openai" alt="OpenAI" />
  <img src="https://img.shields.io/badge/JavaScript-Vanilla-yellow?style=for-the-badge&logo=javascript" alt="JavaScript" />
  <img src="https://img.shields.io/badge/License-MIT-lightgrey?style=for-the-badge" alt="License" />
</p>

## ✨ Overview
**DevMate AI** is a next-generation Chrome Extension designed to seamlessly assist developers in conquering FreeCodeCamp challenges. Powered by OpenAI's API, it intelligently reads the challenge instructions and your existing code directly from the editor, understands the context, and injects a working, test-passing solution right back into the workspace.

## 🎯 Features
- 🧠 **Context-Aware Assistance**: Automatically extracts challenge requirements and your current code.
- ⚡ **Instant Code Injection**: Seamlessly drops the solution back into the FreeCodeCamp CodeMirror/Monaco editor natively.
- 🐛 **Intelligent Debugging**: Captures test failures and console errors to rewrite and fix broken code instantly.
- 🔒 **Secure API Key Storage**: Uses isolated `chrome.storage.local` to safely save your OpenAI API key locally without sending it anywhere else.
- 🎨 **Premium Aesthetic**: Minimalist, distraction-free dark mode UI designed for developers.

## 🚀 Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/codest0411/DevMate-xtension.git
   ```
2. **Open Chrome Extensions**
   - Navigate to `chrome://extensions/` in your browser.
3. **Enable Developer Mode**
   - Toggle the **Developer mode** switch in the top right corner.
4. **Load the Extension**
   - Click the **Load unpacked** button.
   - Select the `extension/` folder inside the cloned repository.
5. **Configure API Key**
   - Click the extension icon in your toolbar.
   - Click the ⚙️ Gear icon to enter Settings.
   - Paste your OpenAI API Key and hit **Save & Apply**.
6. **Start Hacking!**
   - Head over to any FreeCodeCamp challenge, click the extension, and press **Solve Challenge** or **Fix Errors**.

## 🔮 Upcoming Features
- 🗣️ **Explanation Mode**: Get a step-by-step breakdown of *why* the code works, not just the solution.
- ⌨️ **Keyboard Shortcuts**: Trigger "Solve" or "Fix" instantly without clicking the extension icon.
- 🎨 **Syntax Highlighting**: Pre-render the AI-generated code in the popup before injecting it into the editor.
- 🔄 **Custom AI Models**: Support for alternative API endpoints (e.g., Anthropic Claude, Google Gemini, Local LLMs via Ollama).
- 📂 **Multi-file Support**: Expand support to projects with multiple files (HTML/CSS/JS) within the FreeCodeCamp environment.

## 🏗️ Architecture & Tech Stack
- **Manifest V3**: State-of-the-art secure and performant Chrome extension architecture.
- **Service Workers**: Non-persistent background scripts for API communication.
- **Content Scripts**: Isolated world scripts using dynamic `<script>` injection to safely interact with React-based virtual DOMs and CodeMirror/Monaco instances.
- **Vanilla DOM**: Zero external dependencies to keep the extension ultra-lightweight and fast.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/codest0411/DevMate---extension/issues).

## 📄 License
This project is [MIT](LICENSE) licensed.
