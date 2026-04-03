import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useI18n } from '../context/I18nContext';
import { Bot, X, Mic, Send, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RaithaMithra = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const { lang, t } = useI18n();
  const recognitionRef = useRef(null);
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load history
    const history = JSON.parse(localStorage.getItem('mc_rm_chat') || '[]');
    const recent = history.filter(m => m.time > Date.now() - 3600000);
    if (recent.length === 0) {
      setMessages([{ text: t('ai_welcome') || "Hello! I am Raitha Mithra. How can I help you?", side: 'ai', time: Date.now() }]);
    } else {
      setMessages(recent);
    }
  }, [lang, t]);

  useEffect(() => {
    // Init speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        handleSend(transcript);
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, [lang]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    if (messages.length > 0) {
      localStorage.setItem('mc_rm_chat', JSON.stringify(messages.slice(-50)));
    }
  }, [messages, isOpen]);

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    if (lang === 'kn') utterance.lang = 'kn-IN';
    else if (lang === 'hi') utterance.lang = 'hi-IN';
    else utterance.lang = 'en-IN';
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (textStr) => {
    const message = textStr || input.trim();
    if (!message) return;
    
    setInput('');
    const newMsg = { text: message, side: 'user', time: Date.now() };
    setMessages(prev => [...prev, newMsg]);

    try {
      const res = await api.raithaMithraChat(message, lang);
      if (res.success) {
        setMessages(prev => [...prev, { text: res.reply, side: 'ai', time: Date.now() }]);
        speak(res.reply);
        
        if (res.action?.type === 'navigate') {
          // Clean up the URL from backend
          let path = res.action.url.replace('.html', '');
          if (!path.startsWith('/')) path = '/' + path;
          
          // Show redirection feedback
          setMessages(prev => [...prev, { text: `Redirecting to ${path}...`, side: 'ai', time: Date.now(), isSystem: true }]);
          
          setTimeout(() => {
            navigate(path);
            setIsOpen(false); // Close chat after navigation
          }, 1200);
        }
      } else {
        setMessages(prev => [...prev, { text: "Network error", side: 'ai', time: Date.now() }]);
      }
    } catch {
      setMessages(prev => [...prev, { text: "Failed to connect", side: 'ai', time: Date.now() }]);
    }
  };

  const toggleVoice = () => {
    if (!recognitionRef.current) return alert("Voice recognition not supported");
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      const langIdx = { 'en': 'en-IN', 'hi': 'hi-IN', 'kn': 'kn-IN' };
      recognitionRef.current.lang = langIdx[lang] || 'en-IN';
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  const clearChat = () => {
    if (window.confirm('Clear all chat history?')) {
      setMessages([{ text: t('ai_welcome') || "Hello! I am Raitha Mithra. How can I help you?", side: 'ai', time: Date.now() }]);
      localStorage.removeItem('mc_rm_chat');
    }
  };

  return (
    <>
      <button 
        className={`fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-hard z-50 transition-all ${isRecording ? 'animate-pulse bg-danger ring-4 ring-danger/30' : 'hover:scale-110 border-2 border-white'}`}
        onClick={() => setIsOpen(!isOpen)}
        title={t('ai_name') || "AI Assistant"}
      >
        <Bot className="w-8 h-8" />
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 max-w-[calc(100vw-3rem)] bg-white rounded-large shadow-hard z-50 flex flex-col border border-primary/10 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300 h-96">
          <div className="bg-primary-dark text-white p-3 flex justify-between items-center">
            <span className="font-bold flex items-center gap-2"><Bot className="w-5 h-5"/> {t('ai_name') || "Raitha Mithra"}</span>
            <div className="flex gap-2">
              <button onClick={clearChat} className="p-1 hover:bg-white/10 rounded"><Trash2 className="w-4 h-4"/></button>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded"><X className="w-5 h-5"/></button>
            </div>
          </div>
          
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 bg-[#f8fcf9] flex flex-col gap-3">
            {messages.map((m, i) => (
              <div 
                key={i} 
                className={`max-w-[80%] p-2 rounded-xl text-sm ${
                  m.isSystem ? 'bg-primary/5 text-primary-dark/60 italic text-center self-center w-full' :
                  m.side === 'user' ? 'bg-primary text-white self-end rounded-br-none' : 'bg-[#e2f3eb] text-text self-start rounded-bl-none'
                }`}
              >
                {m.text}
                {!m.isSystem && (
                  <div className={`text-[10px] mt-1 opacity-60 ${m.side === 'user' ? 'text-right text-white' : 'text-text'}`}>
                    {new Date(m.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-2 border-t border-gray-100 flex gap-2 items-center bg-white">
            <button 
              type="button" onClick={toggleVoice} 
              className={`p-2 rounded-full transition-colors ${isRecording ? 'bg-danger text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
            >
              <Mic className="w-5 h-5" />
            </button>
            <input 
              className="flex-1 bg-gray-100 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              placeholder={t('ai_placeholder') || "Ask anything..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" disabled={!input.trim()} className="p-2 bg-primary text-white rounded-full disabled:opacity-50 hover:bg-primary-dark transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default RaithaMithra;
