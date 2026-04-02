/**
 * Raitha Mithra - AI Farmer Assistant Component
 * Injects a floating AI assistant with Voice & Chat support
 */
const RaithaMithra = {
  initialized: false,
  isRecording: false,
  recognition: null,

  init() {
    if (this.initialized) return;
    this.injectStyles();
    this.injectHTML();
    this.setupEvents();
    this.setupVoice();
    this.loadHistory();
    this.restorePanelState();
    this.initialized = true;
  },

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .raitha-mithra-fab {
        position: fixed;
        bottom: 90px;
        right: 20px;
        width: 60px;
        height: 60px;
        background: var(--primary);
        border-radius: 50%;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        z-index: 1000;
        transition: transform 0.2s;
        border: 2px solid white;
      }
      .raitha-mithra-fab:hover { transform: scale(1.1); }
      .raitha-mithra-fab.recording { background: var(--danger); animation: pulse-red 1.5s infinite; }
      
      .raitha-mithra-panel {
        position: fixed;
        bottom: 160px;
        right: 20px;
        width: 320px;
        max-width: calc(100vw - 40px);
        background: white;
        border-radius: 15px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        z-index: 1000;
        display: none;
        flex-direction: column;
        overflow: hidden;
        border: 1px solid var(--border);
      }
      .chat-header {
        background: var(--primary-dark);
        color: white;
        padding: 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .chat-messages {
        height: 300px;
        overflow-y: auto;
        padding: 15px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        background: #f8fcf9;
      }
      .msg { padding: 8px 12px; border-radius: 12px; max-width: 80%; font-size: 0.9rem; }
      .msg-ai { background: #e2f3eb; align-self: flex-start; border-bottom-left-radius: 2px; }
      .msg-user { background: var(--primary); color: white; align-self: flex-end; border-bottom-right-radius: 2px; }
      
      .chat-input-area { padding: 10px; border-top: 1px solid #eee; display: flex; gap: 8px; }
      .chat-input { flex: 1; border: 1px solid #ddd; padding: 8px; border-radius: 20px; outline: none; }
      #clear-chat { font-size: 0.7rem; opacity: 0.7; cursor: pointer; text-decoration: none; padding: 2px 6px; border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; }
      #clear-chat:hover { opacity: 1; background: rgba(255,255,255,0.1); }
      .msg-meta { font-size: 0.7rem; opacity: 0.6; margin-top: 4px; display: block; }
      .msg-user .msg-meta { text-align: right; }
      
      @keyframes pulse-red {
        0% { box-shadow: 0 0 0 0 rgba(229, 62, 62, 0.7); }
        70% { box-shadow: 0 0 0 15px rgba(229, 62, 62, 0); }
        100% { box-shadow: 0 0 0 0 rgba(229, 62, 62, 0); }
      }
    `;
    document.head.appendChild(style);
  },

  injectHTML() {
    const fab = document.createElement('div');
    fab.id = 'raitha-fab';
    fab.className = 'raitha-mithra-fab';
    fab.innerHTML = '🤖';
    fab.title = 'Talk to Raitha Mithra';

    const panel = document.createElement('div');
    panel.id = 'raitha-panel';
    panel.className = 'raitha-mithra-panel';
    panel.innerHTML = `
      <div class="chat-header">
        <strong>🤖 Raitha Mithra</strong>
        <div style="display:flex; gap:10px; align-items:center;">
          <span id="clear-chat">Clear</span>
          <span id="close-chat" style="cursor:pointer; font-size:1.5rem;">&times;</span>
        </div>
      </div>
      <div id="chat-msgs" class="chat-messages">
        <!-- Messages will be loaded here -->
      </div>
      <div class="chat-input-area">
        <button id="voice-btn" class="btn btn-sm" style="background:#eee; padding:5px 10px;">🎤</button>
        <input type="text" id="chat-input" class="chat-input" placeholder="Ask anything...">
        <button id="send-btn" class="btn btn-primary btn-sm" style="padding:5px 12px;">Go</button>
      </div>
    `;

    document.body.appendChild(fab);
    document.body.appendChild(panel);
  },

  setupEvents() {
    const fab = document.getElementById('raitha-fab');
    const panel = document.getElementById('raitha-panel');
    const closeBtn = document.getElementById('close-chat');
    const sendBtn = document.getElementById('send-btn');
    const input = document.getElementById('chat-input');
    const voiceBtn = document.getElementById('voice-btn');
    const clearBtn = document.getElementById('clear-chat');

    fab.onclick = () => {
      const isVisible = panel.style.display === 'flex';
      panel.style.display = isVisible ? 'none' : 'flex';
      localStorage.setItem('raitha_mithra_panel_open', panel.style.display === 'flex');
    };

    closeBtn.onclick = () => {
      panel.style.display = 'none';
      localStorage.setItem('raitha_mithra_panel_open', 'false');
    };

    sendBtn.onclick = () => this.handleSendMessage();
    input.onkeypress = (e) => { if (e.key === 'Enter') this.handleSendMessage(); };
    
    voiceBtn.onclick = () => this.toggleVoice();
    clearBtn.onclick = () => this.clearHistory();
  },

  async handleSendMessage(text) {
    const input = document.getElementById('chat-input');
    const message = text || input.value.trim();
    if (!message) return;

    if (!text) input.value = '';
    this.addMessage(message, 'user');

    try {
      // detect basic language from message (very simplified)
      let lang = 'en';
      if (/[\u0C80-\u0CFF]/.test(message)) lang = 'kn'; // Kannada range
      if (/[\u0900-\u097F]/.test(message)) lang = 'hi'; // Hindi range

      const res = await api.raithaMithraChat(message, lang);
      if (res.success) {
        this.addMessage(res.reply, 'ai');
        if (res.action && res.action.type === 'navigate') {
          this.addMessage("Redirecting to " + res.action.url.split('/').pop().split('.')[0] + "...", 'ai');
          localStorage.setItem('raitha_mithra_panel_open', 'true');
          setTimeout(() => { window.location.href = res.action.url; }, 2000);
        }
        // Speak the reply
        this.speak(res.reply, lang);
      }
    } catch (e) {
      this.addMessage("Sorry, I'm having trouble connecting to the network.", 'ai');
    }
  },

  addMessage(text, side, save = true, time = Date.now()) {
    const container = document.getElementById('chat-msgs');
    const div = document.createElement('div');
    div.className = `msg msg-${side}`;
    
    const timeStr = new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    div.innerHTML = `
      <div class="msg-content">${text}</div>
      <small class="msg-meta">${timeStr}</small>
    `;
    
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;

    if (save) {
      let history = JSON.parse(localStorage.getItem('raitha_mithra_chat') || '[]');
      history.push({ text, side, time });
      
      // Keep only last 50 messages
      if (history.length > 50) history = history.slice(-50);
      
      localStorage.setItem('raitha_mithra_chat', JSON.stringify(history));
    }
  },

  loadHistory() {
    let history = JSON.parse(localStorage.getItem('raitha_mithra_chat') || '[]');
    const container = document.getElementById('chat-msgs');
    container.innerHTML = '';
    
    // Auto-expire messages older than 1 hour
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const recentHistory = history.filter(msg => msg.time > oneHourAgo);
    
    if (recentHistory.length === 0) {
      this.addMessage("ನಮಸ್ಕಾರ! ನಾನು ರೈತ ಮಿತ್ರ. ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ? (Hello! I am Raitha Mithra. How can I help you?)", 'ai', false);
    } else {
      recentHistory.forEach(msg => {
        this.addMessage(msg.text, msg.side, false, msg.time);
      });
      
      // Update storage if some expired
      if (recentHistory.length !== history.length) {
        localStorage.setItem('raitha_mithra_chat', JSON.stringify(recentHistory));
      }
    }
  },

  clearHistory() {
    if (confirm("Clear all chat history?")) {
      localStorage.removeItem('raitha_mithra_chat');
      this.loadHistory();
    }
  },

  restorePanelState() {
    const isOpen = localStorage.getItem('raitha_mithra_panel_open') === 'true';
    const panel = document.getElementById('raitha-panel');
    if (isOpen) {
      panel.style.display = 'flex';
    }
  },

  setupVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return console.warn("Speech recognition not supported");

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.lang = 'kn-IN'; // Default to Kannada, can be changed
    this.recognition.interimResults = false;

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      this.handleSendMessage(transcript);
    };

    this.recognition.onend = () => {
      this.isRecording = false;
      document.getElementById('raitha-fab').classList.remove('recording');
      document.getElementById('voice-btn').style.background = '#eee';
    };
  },

  toggleVoice() {
    if (!this.recognition) return alert("Voice recognition not supported in this browser");
    
    if (this.isRecording) {
      this.recognition.stop();
    } else {
      this.isRecording = true;
      document.getElementById('raitha-fab').classList.add('recording');
      document.getElementById('voice-btn').style.background = '#ffcccc';
      this.recognition.start();
    }
  },

  speak(text, lang) {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    if (lang === 'kn') utterance.lang = 'kn-IN';
    else if (lang === 'hi') utterance.lang = 'hi-IN';
    else utterance.lang = 'en-IN';
    window.speechSynthesis.speak(utterance);
  }
};

// Initialize after page load
window.addEventListener('load', () => RaithaMithra.init());
