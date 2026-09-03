import { useState, useCallback } from 'react';
import { sendTestMessage } from '../services/chatAgentService';
import { supabase } from '../lib/supabase';

function newSimConversationId() {
  return `sim_${crypto.randomUUID()}`;
}

export function useLiveChat(businessId) {
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [tierPreference, setTierPreference] = useState('intelligent');
  const [conversationId, setConversationId] = useState(newSimConversationId());
  const [sendError, setSendError] = useState(null);

  const reset = useCallback(() => {
    setMessages([]);
    setConversationId(newSimConversationId());
    setSendError(null);
  }, []);

  const send = useCallback(
    async (text) => {
      if (!text.trim() || sending) return;
      setSending(true);
      setSendError(null);

      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      setMessages((m) => [...m, { role: 'user', content: text }]);

      try {
        const json = await sendTestMessage({ text, history, businessId, conversationId, tierPreference });
        setMessages((m) => [
          ...m,
          { role: 'assistant', content: json.reply || '(no reply — check the trace/logs)', tierUsed: json.tier_used, responseTimeMs: json.response_time_ms, trace: json.trace },
        ]);
      } catch (err) {
        setSendError(err);
        setMessages((m) => [...m, { role: 'assistant', content: "⚠️ Request failed — check the edge function's logs." }]);
      } finally {
        setSending(false);
      }
    },
    [messages, businessId, conversationId, tierPreference, sending],
  );

  // Fires a scripted sequence of messages back-to-back — used by stress-test
  // scenarios and by conversation replay.
  const runScript = useCallback(
    async (scriptMessages) => {
      for (const text of scriptMessages) {
        await send(text);
      }
    },
    [send],
  );

  const flag = useCallback(
    async (message, note) => {
      await supabase.from('chat_test_feedback').insert({ business_id: businessId, conversation_id: conversationId, flagged_reply: message.content, note });
    },
    [businessId, conversationId],
  );

  return { messages, send, runScript, sending, sendError, tierPreference, setTierPreference, conversationId, reset, flag };
}