import { useEffect, useRef, useState } from 'react';
import { History, LoaderCircle, Send, MessageCircle } from 'lucide-react';
import Drawer from './Drawer';
import { readReceiptIcon, timeAgo } from '../../../utils/leadHelpers';
import leadsService from '../../../services/leadsService';

export default function ChatDrawer({ lead, open, onClose, onSend, onMessagesRead }) {
  const [draft, setDraft] = useState('');
  const [transcript, setTranscript] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadingPast, setLoadingPast] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const leadId = lead?.id;

  const hydrateMedia = (messages) => {
    const mediaMessages = messages.filter((message) => message.mediaType === 'image' && !message.mediaUrl && !message.mediaThumbnail);
    if (!mediaMessages.length) return;

    Promise.all(mediaMessages.map((message) => leadsService.loadChatMessageMedia(message)))
      .then((resolvedMessages) => {
        const resolved = new Map(resolvedMessages.map((message) => [message.id, message]));
        setTranscript((current) => current.map((message) => resolved.get(message.id) || message));
      })
      .catch((mediaError) => console.error('[ChatDrawer] Could not load message media:', mediaError.message));
  };

  useEffect(() => {
    if (!open || !leadId) return undefined;

    let mounted = true;
    setLoading(true);
    setError('');
    onMessagesRead?.(leadId);
    leadsService.fetchChatTranscript(leadId)
      .then(async (messages) => {
        if (!mounted) return;
        if (messages.length > 0 || !lead.phone) {
          setTranscript(messages);
          hydrateMedia(messages);
          return;
        }

        const pastMessages = await leadsService.loadPastChatMessages({ phone: lead.phone });
        if (!mounted) return;
        setTranscript(pastMessages);
        hydrateMedia(pastMessages);
      })
      .catch((loadError) => {
        if (mounted) setError(loadError.message || 'Could not load this chat.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    leadsService.markChatMessagesRead(leadId).catch((readError) => {
      console.error('[ChatDrawer] Could not mark messages read:', readError.message);
    });

    return () => { mounted = false; };
  }, [leadId, open, onMessagesRead]);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [open, transcript]);

  if (!lead) return null;

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setError('');
    try {
      await onSend?.(text);
      setTranscript((current) => [...current, {
        id: `local-${Date.now()}`,
        sender: 'business',
        text,
        timestamp: new Date().toISOString(),
        status: 'sent',
      }]);
      setDraft('');
    } catch (sendError) {
      setError(sendError.message || 'Could not send this message.');
    } finally {
      setSending(false);
    }
  };

  const handleLoadPast = async () => {
    if (loadingPast) return;
    setLoadingPast(true);
    setError('');
    try {
      const pastMessages = await leadsService.loadPastChatMessages({ phone: lead.phone });
      hydrateMedia(pastMessages);
      setTranscript((current) => {
        const messages = new Map(current.map((message) => [message.id, message]));
        pastMessages.forEach((message) => messages.set(message.id, message));
        return [...messages.values()].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      });
    } catch (loadError) {
      setError(loadError.message || 'Could not load past WhatsApp messages.');
    } finally {
      setLoadingPast(false);
    }
  };

  return (
    <Drawer open={open} onClose={onClose} title={`Chat \u2014 ${lead.name}`}>
      <div className="flex h-full flex-col">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-100 px-4 py-2">
          <span className="text-[11px] text-slate-400">Recent messages</span>
          <button
            type="button"
            onClick={handleLoadPast}
            disabled={loadingPast}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:border-[#28A745] hover:text-[#28A745] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingPast ? <LoaderCircle size={13} className="animate-spin" /> : <History size={13} />}
            {loadingPast ? 'Loading...' : 'Load past'}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-400">
              <LoaderCircle size={16} className="animate-spin" /> Loading chat...
            </div>
          ) : transcript.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-300">
              <MessageCircle size={32} strokeWidth={1.3} />
              <p className="text-[12.5px] font-medium text-slate-400">No transcript loaded yet</p>
              <p className="max-w-[220px] text-center text-[11px] text-slate-300">
                This will populate once the live transcript fetch is wired up.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {transcript.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'business' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-3 py-2 text-[13px] leading-snug ${
                      msg.sender === 'business'
                        ? 'rounded-br-sm bg-[#28A745] text-white'
                        : 'rounded-bl-sm bg-slate-100 text-slate-700'
                    }`}
                  >
                    {(msg.mediaUrl || msg.mediaThumbnail) && msg.mediaType === 'image' && (
                      <img
                        src={msg.mediaUrl || msg.mediaThumbnail}
                        alt={msg.text === '[Unsupported message]' ? 'WhatsApp image' : msg.text}
                        className="mb-1 max-h-64 max-w-full rounded-lg object-cover"
                      />
                    )}
                    {msg.text && msg.text !== '[Unsupported message]' && <p>{msg.text}</p>}
                    <p
                      className={`mt-0.5 text-[10px] ${
                        msg.sender === 'business' ? 'text-white/70' : 'text-slate-400'
                      }`}
                    >
                      {timeAgo(msg.timestamp)} ago
                      {msg.sender === 'business' && (() => {
                        const receipt = readReceiptIcon(msg.status);
                        return <span className={`ml-1 font-semibold ${msg.status === 'read' ? 'text-blue-200' : 'text-white/70'}`} title={receipt.title}>{receipt.glyph}</span>;
                      })()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {error && <p className="flex-shrink-0 px-4 pt-2 text-xs text-red-500">{error}</p>}
        <div className="flex-shrink-0 border-t border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={onSend ? 'Type a message...' : 'Sending not wired up yet'}
              disabled={!onSend}
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-700 placeholder:text-slate-400 focus:border-[#28A745] focus:bg-white focus:outline-none disabled:opacity-60"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!onSend || sending || !draft.trim()}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#28A745] text-white hover:bg-[#1e7a35] disabled:opacity-40"
              aria-label="Send"
            >
              {sending ? <LoaderCircle size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>
        </div>
      </div>
    </Drawer>
  );
}