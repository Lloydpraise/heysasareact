import { useEffect, useState } from 'react';
import { Play, MessageSquare } from 'lucide-react';
import { fetchRecentConversations, fetchConversationMessages } from '../../../services/personaPackService';
import { supabase } from '../../../lib/supabase';
import { LiveChatPlayground } from '../LiveChatPlayground';

export function ReplaySection({ businessId, liveChat }) {
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [original, setOriginal] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!businessId) return;

    let mounted = true;
    const loadConversations = () => {
      fetchRecentConversations(businessId)
        .then((rows) => {
          if (mounted) setConversations(rows);
        })
        .catch(() => {
          if (mounted) setConversations([]);
        });
    };

    loadConversations();
    const channel = supabase?.channel(`replay-conversations-${businessId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `business_id=eq.${businessId}` }, loadConversations)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, loadConversations)
      .subscribe();

    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [businessId]);

  const selectConversation = async (id) => {
    setSelectedId(id);
    setLoading(true);
    liveChat.reset();
    try {
      const msgs = await fetchConversationMessages(id);
      setOriginal(msgs);
    } finally {
      setLoading(false);
    }
  };

  const replay = () => {
    const userTurns = original.filter((m) => m.role === 'user').map((m) => (typeof m.content === 'string' ? m.content : m.content?.text || ''));
    liveChat.runScript(userTurns);
  };

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 items-stretch gap-6 lg:grid-cols-[280px_minmax(0,1fr)_minmax(0,1fr)]">
      <div className="rounded-[1.25rem] border border-white/80 bg-white/70 shadow-lg shadow-[#28A745]/5 backdrop-blur-xl">
        <div className="border-b border-slate-200/80 px-4 py-3">
          <p className="text-sm font-semibold text-[#0F172A]">Real conversations</p>
          <p className="text-xs text-[#94A3B8]">Pick one to replay through the new agent</p>
        </div>
        <div className="max-h-[560px] overflow-y-auto p-2">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => selectConversation(c.id)}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                selectedId === c.id ? 'bg-[#28A745]/10 text-[#1f8d3d]' : 'text-[#64748B] hover:bg-slate-50'
              }`}
            >
              <MessageSquare size={14} className="shrink-0" />
              <span className="truncate">{c.contacts?.name || c.contact_id || 'Unknown contact'}</span>
            </button>
          ))}
          {conversations.length === 0 && <p className="px-3 py-2 text-xs text-[#94A3B8]">No conversations found yet.</p>}
        </div>
      </div>

      <div className="rounded-[1.25rem] border border-white/80 bg-white/70 p-4 shadow-lg shadow-[#28A745]/5 backdrop-blur-xl">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-[#0F172A]">What actually happened</p>
          {selectedId && (
            <button onClick={replay} disabled={loading} className="flex items-center gap-1.5 rounded-full bg-[#28A745] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1f8d3d]">
              <Play size={12} /> Replay through new agent
            </button>
          )}
        </div>
        <div className="max-h-[540px] space-y-2 overflow-y-auto">
          {!selectedId && <p className="text-sm text-[#94A3B8]">Select a conversation to see its transcript.</p>}
          {original.map((m, i) => (
            <div key={i} className={`rounded-xl px-3 py-2 text-sm ${m.role === 'user' ? 'bg-slate-50 text-[#0F172A]' : 'bg-[#28A745]/8 text-[#1f8d3d]'}`}>
              <span className="mr-1.5 text-xs font-medium uppercase text-[#94A3B8]">{m.role}</span>
              {typeof m.content === 'string' ? m.content : m.content?.text}
            </div>
          ))}
        </div>
      </div>

      <LiveChatPlayground liveChat={liveChat} />
    </div>
  );
}