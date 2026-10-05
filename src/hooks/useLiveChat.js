import { useState, useCallback } from 'react';
import { sendTestMessage } from '../services/chatAgentService';
import { supabase } from '../lib/supabase';

function newSimConversationId() {
  return `sim_${crypto.randomUUID()}`;
}

export function useLiveChat(businessId) {
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
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
        const json = await sendTestMessage({ text, history, businessId });
        const silent = json.status === 'replied' ? '(chose not to reply)' : null;
        const note = json.error || (json.skipReason ? `Skipped: ${json.skipReason}` : json.handoff ? `Handed to the owner: ${json.handoff.reason || json.handoff}` : silent);
        setMessages((m) => [
          ...m,
          {
            role: 'assistant',
            content: json.reply || note || '(no reply — open the thoughts and tool calls)',
            isNote: !json.reply,
            responseTimeMs: json.responseTimeMs,
            trace: json.trace,
            thoughts: json.thoughts,
            flow: json.flow,
            skillsLoaded: json.skillsLoaded,
            holdingMessage: json.holdingMessage,
            handoff: json.handoff,
          },
        ]);
      } catch (err) {
        setSendError(err);
        setMessages((m) => [...m, { role: 'assistant', content: `⚠️ ${err.message || 'Request failed — check the sasa-brain logs.'}` }]);
      } finally {
        setSending(false);
      }
    },
    [messages, businessId, sending],
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

  return { messages, send, runScript, sending, sendError, conversationId, reset, flag };
}