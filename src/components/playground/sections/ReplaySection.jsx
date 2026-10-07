import { useEffect, useState } from 'react';
import { Play, MessageSquare } from 'lucide-react';
import { fetchRecentConversations, fetchConversationMessages } from '../../../services/personaPackService';
import { supabase } from '../../../lib/supabase';
import { LiveChatPlayground } from '../LiveChatPlayground';
import { useIsMobile } from '../../../hooks/useIsMobile';
import BottomSheet from '../../mobile/BottomSheet';

export function ReplaySection({ businessId, liveChat }) {
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [original, setOriginal] = useState([]);
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mobileView, setMobileView] = useState('list');

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
    if (isMobile) setSheetOpen(true);
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
    if (isMobile) {
      setSheetOpen(false);
      setMobileView('chat');
    }
  };

  const transcript = (
    <div className="space-y-2">
      {loading && <p className="text-sm text-[#94A3B8]">Loading conversation…</p>}
      {!selectedId && <p className="text-sm text-[#94A3B8]">Select a conversation to see its transcript.</p>}
      {original.map((m, i) => (
        <div key={i} className={`rounded-xl px-3 py-2 text-sm ${m.role === 'user' ? 'bg-slate-50 text-[#0F172A]' : 'bg-[#28A745]/8 text-[#1f8d3d]'}`}>
          <span className="mr-1.5 text-xs font-medium uppercase text-[#94A3B8]">{m.role}</span>
          {typeof m.content === 'string' ? m.content : m.content?.text}
        </div>
      ))}
    </div>
  );

  const conversationList = (
    <>
      {conversations.map((c) => (
        <button
          key={c.id}
          onClick={() => selectConversation(c.id)}
          className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition max-md:min-h-[52px] max-md:text-[15px] ${
            selectedId === c.id ? 'bg-[#28A745]/10 text-[#1f8d3d]' : 'text-[#64748B] hover:bg-slate-50'
          }`}
        >
          <MessageSquare size={14} className="shrink-0" />
          <span className="truncate">{c.contacts?.name || c.contact_id || 'Unknown contact'}</span>
        </button>
      ))}
      {conversations.length === 0 && <p className="px-3 py-2 text-xs text-[#94A3B8]">No conversations found yet.</p>}
    </>
  );

  if (isMobile) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="grid shrink-0 grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1" role="tablist">
          {[['list', 'Conversations'], ['chat', 'Replay result']].map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={mobileView === id} onClick={() => setMobileView(id)}
              className={`flex h-11 items-center justify-center rounded-xl text-[14px] font-semibold transition-all duration-200 ${mobileView === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
              {label}
            </button>
          ))}
        </div>
        <div key={mobileView} className="m-page-in min-h-0 flex-1">
          {mobileView === 'list' ? (
            <div className="h-full overflow-y-auto rounded-[1.25rem] border border-white/80 bg-white/70 p-2">
              <p className="px-3 pb-1 pt-2 text-xs text-[#94A3B8]">Pick a real conversation to replay through the new agent</p>
              {conversationList}
            </div>
          ) : (
            <LiveChatPlayground liveChat={liveChat} />
          )}
        </div>
        <BottomSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title="What actually happened"
          tall
          footer={(
            <button onClick={replay} disabled={loading || !original.length} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#28A745] text-[15px] font-semibold text-white disabled:opacity-50">
              <Play size={15} /> Replay through new agent
            </button>
          )}
        >
          {transcript}
        </BottomSheet>
      </div>
    );
  }

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 items-stretch gap-6 overflow-y-auto overscroll-contain lg:grid-cols-[280px_minmax(0,1fr)_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)] lg:overflow-hidden">
      <div className="flex min-h-0 flex-col overflow-hidden rounded-[1.25rem] border border-white/80 bg-white/70 shadow-lg shadow-[#28A745]/5 backdrop-blur-xl">
        <div className="border-b border-slate-200/80 px-4 py-3">
          <p className="text-sm font-semibold text-[#0F172A]">Real conversations</p>
          <p className="text-xs text-[#94A3B8]">Pick one to replay through the new agent</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">{conversationList}</div>
      </div>

      <div className="flex min-h-0 flex-col overflow-hidden rounded-[1.25rem] border border-white/80 bg-white/70 p-4 shadow-lg shadow-[#28A745]/5 backdrop-blur-xl">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-[#0F172A]">What actually happened</p>
          {selectedId && (
            <button onClick={replay} disabled={loading} className="flex items-center gap-1.5 rounded-full bg-[#28A745] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1f8d3d]">
              <Play size={12} /> Replay through new agent
            </button>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{transcript}</div>
      </div>

      <LiveChatPlayground liveChat={liveChat} />
    </div>
  );
}
