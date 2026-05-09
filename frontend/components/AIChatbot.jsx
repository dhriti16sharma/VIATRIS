'use client';

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: "Hi! I'm Viatris Health AI ✿  Ask me about symptoms, medications, wellness tips, or how to book an appointment. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom — unchanged
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => { scrollToBottom(); }, [messages]);

  // Quick suggestions — unchanged
  const quickSuggestions = [
    'I have fever and headache',
    'What medicine for cold?',
    'What does BID mean?',
    'I have chest pain',
    'Medicine for acidity'
  ];

  // All handlers — unchanged
  const handleSendMessage = async (messageText = inputMessage) => {
    if (!messageText.trim() || isTyping) return;
    const userMessage = { type: 'user', text: messageText, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage(''); // clear immediately before async work
    setIsTyping(true);
    try {
      const response = await axios.post('http://localhost:5000/api/chatbot/message', { message: messageText });
      const botMessage = {
        type: 'bot',
        text: response.data.data.botResponse,
        details: response.data.data.details,
        messageType: response.data.data.type,
        timestamp: new Date()
      };
      setTimeout(() => {
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
      }, 500);
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages(prev => [...prev, { type: 'bot', text: '❌ Sorry, I encountered an error. Please try again.', timestamp: new Date() }]);
      setIsTyping(false);
    }
  };

  const handleQuickSuggestion = (suggestion) => { handleSendMessage(suggestion); };
  const handleKeyPress = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } };

  // ── BLOOM UI ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes chatBounce { 0%,100%{transform:translateY(0);}50%{transform:translateY(-4px);} }
        @keyframes dotBounce { 0%,80%,100%{transform:scale(0.7);opacity:0.5;}40%{transform:scale(1);opacity:1;} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);} }
      `}</style>

      {/* ── Floating button ── */}
      {!isOpen && (
        <button onClick={() => setIsOpen(true)}
          style={{ position: 'fixed', bottom: 28, right: 28, width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg,#7D9B76,#4A6B44)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 28px rgba(74,107,68,0.4)', zIndex: 50, animation: 'chatBounce 3s ease-in-out infinite', transition: 'transform 0.2s' }}>
          <svg width="26" height="26" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span style={{ position: 'absolute', top: -4, right: -4, width: 22, height: 22, background: '#E85A5A', borderRadius: '50%', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', border: '2px solid white' }}>AI</span>
        </button>
      )}

      {/* ── Chat window ── */}
      {isOpen && (
        <div style={{ position: 'fixed', bottom: 28, right: 28, width: 380, height: 580, background: 'white', borderRadius: 24, boxShadow: '0 24px 80px rgba(44,44,44,0.2)', display: 'flex', flexDirection: 'column', zIndex: 50, border: '1px solid rgba(196,168,130,0.2)', animation: 'slideUp 0.3s ease both', overflow: 'hidden', fontFamily: "'DM Sans',sans-serif" }}>

          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg,#7D9B76,#4A6B44)', color: 'white', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" fill="none" stroke="white" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Viatris Health AI</div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>Always here to help</div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)}
              style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12, background: '#FAF7F2' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%', padding: '11px 15px', borderRadius: msg.type === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: msg.type === 'user' ? '#7D9B76' : 'white',
                  color: msg.type === 'user' ? 'white' : '#2C2C2C',
                  boxShadow: msg.type === 'bot' ? '0 2px 12px rgba(44,44,44,0.07)' : 'none',
                  border: msg.type === 'bot' ? '1px solid rgba(196,168,130,0.15)' : 'none',
                }}>
                  {msg.type === 'bot' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <div style={{ width: 20, height: 20, background: 'rgba(125,155,118,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>🤖</div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#7D9B76' }}>Viatris AI</span>
                    </div>
                  )}
                  <div style={{ fontSize: 13, lineHeight: 1.65, whiteSpace: 'pre-line' }}>{msg.text}</div>
                  <div style={{ fontSize: 10, marginTop: 5, opacity: 0.6, textAlign: msg.type === 'user' ? 'right' : 'left' }}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '12px 16px', background: 'white', borderRadius: '18px 18px 18px 4px', boxShadow: '0 2px 12px rgba(44,44,44,0.07)', border: '1px solid rgba(196,168,130,0.15)', display: 'flex', gap: 5, alignItems: 'center' }}>
                  {[0, 0.15, 0.3].map((d, i) => (
                    <div key={i} style={{ width: 8, height: 8, background: '#7D9B76', borderRadius: '50%', animation: `dotBounce 1s ease-in-out ${d}s infinite` }}></div>
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions */}
          {messages.length === 1 && (
            <div style={{ padding: '10px 16px', background: 'white', borderTop: '1px solid #F2EDE3', flexShrink: 0 }}>
              <p style={{ fontSize: 11, color: '#9C9C9C', marginBottom: 8, fontWeight: 500 }}>Quick questions:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {quickSuggestions.slice(0, 3).map((s, i) => (
                  <button key={i} onClick={() => handleQuickSuggestion(s)}
                    style={{ fontSize: 12, padding: '5px 12px', background: 'rgba(125,155,118,0.08)', color: '#4A6B44', border: '1px solid rgba(125,155,118,0.25)', borderRadius: 20, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '12px 16px', background: 'white', borderTop: '1px solid #F2EDE3', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" value={inputMessage} onChange={e => setInputMessage(e.target.value)} onKeyPress={handleKeyPress} placeholder="Type your message..." disabled={isTyping}
                style={{ flex: 1, padding: '11px 16px', border: '1.5px solid #E8E0D4', borderRadius: 22, fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: 'none', color: '#2C2C2C', background: isTyping ? '#F2EDE3' : '#FDFCFA' }} />
              <button onClick={() => handleSendMessage()} disabled={!inputMessage.trim() || isTyping}
                style={{ width: 42, height: 42, background: inputMessage.trim() ? 'linear-gradient(135deg,#7D9B76,#4A6B44)' : '#DDD5C8', border: 'none', borderRadius: '50%', cursor: inputMessage.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                <svg width="18" height="18" fill="none" stroke="white" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p style={{ fontSize: 10, color: '#C4B8AA', marginTop: 8, textAlign: 'center' }}>
              AI-powered health assistant · Not a substitute for medical advice
            </p>
          </div>
        </div>
      )}
    </>
  );
}
