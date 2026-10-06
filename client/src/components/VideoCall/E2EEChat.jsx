import React, { useState, useEffect, useRef } from 'react';
import { Send, Lock, ShieldCheck } from 'lucide-react';
import { encryptE2EEMessage, decryptE2EEMessage } from '../../utils/crypto';
import { useLanguage } from '../../context/LanguageContext';

export default function E2EEChat({ socket, roomId, currentUser, aesKey }) {
  const { t, lang } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleEncryptedMessage = async (data) => {
      try {
        let text = data.encryptedPayload;
        if (aesKey && data.ciphertext && data.iv) {
          text = await decryptE2EEMessage(aesKey, {
            ciphertext: data.ciphertext,
            iv: data.iv
          });
        }
        setMessages((prev) => [
          ...prev,
          {
            senderName: data.senderName,
            isMe: data.senderId === currentUser?.id,
            text,
            timestamp: data.timestamp
          }
        ]);
      } catch (err) {
        console.error('Decryption error:', err);
      }
    };

    socket.on('e2ee-message', handleEncryptedMessage);

    return () => {
      socket.off('e2ee-message', handleEncryptedMessage);
    };
  }, [socket, aesKey, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMsg.trim() || !socket) return;

    try {
      let payload = {
        roomId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      if (aesKey) {
        const encrypted = await encryptE2EEMessage(aesKey, inputMsg);
        payload.ciphertext = encrypted.ciphertext;
        payload.iv = encrypted.iv;
      } else {
        payload.encryptedPayload = inputMsg;
      }

      socket.emit('e2ee-message', payload);

      setMessages((prev) => [
        ...prev,
        {
          senderName: currentUser.name,
          isMe: true,
          text: inputMsg,
          timestamp: payload.timestamp
        }
      ]);
      setInputMsg('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 text-white w-80">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-orange-400" />
          <h4 className="text-xs font-bold text-slate-200">{t('chatHeader')}</h4>
        </div>
        <span className="text-[10px] text-orange-400 bg-orange-950 px-2.5 py-0.5 rounded-full border border-orange-800 font-medium">
          {t('confidentialTag')}
        </span>
      </div>

      {/* Message List */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
        <div className="text-center my-2">
          <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full">
            {t('chatPrivateHint')}
          </span>
        </div>
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.isMe ? 'items-end' : 'items-start'}`}
          >
            <span className="text-[10px] text-slate-400 mb-0.5">{m.senderName}</span>
            <div
              className={`p-2.5 rounded-2xl max-w-[85%] break-words ${
                m.isMe
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-br-none shadow-xs'
                  : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
              }`}
            >
              {m.text}
            </div>
            <span className="text-[9px] text-slate-500 mt-0.5">{m.timestamp}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-2.5 border-t border-slate-800 bg-slate-950 flex gap-2">
        <input
          type="text"
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          placeholder={t('chatPlaceholder')}
          className="flex-1 bg-slate-800 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-orange-500"
        />
        <button
          type="submit"
          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white p-2.5 rounded-xl transition-all shadow-xs"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
