import { useState, useRef, useEffect } from 'react';
import { Send, ChevronDown, ChevronUp, Zap, Flag, ImageOff, UserRound } from 'lucide-react';

const TIER_LABELS = { intelligent: 'Intelligent', medium: 'Medium', fast: 'Fast' };
const TIER_COLORS = { intelligent: '#28A745', medium: '#FF8C00', fast: '#94A3B8' };

function TracePanel({ trace }) {
  if (!trace || trace.length === 0) return null;
  return (
    <div className="mt-2 space-y-1.5 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 text-xs">
      {trace.map((t, i) => (
        <div key={i} className="flex gap-2">
          <span className="shrink-0 font-mono text-[#1f8d3d]">{t.tool}</span>
          <span className="truncate text-[#94A3B8]">{JSON.stringify(t.args)}</span>
        </div>
      ))}
    </div>
  );
}

// The same three bouncing dots a customer sees on WhatsApp while the AI works out its reply.
function TypingBubble() {
  return (
    <div className="mb-3 flex justify-start" role="status" aria-live="polite" aria-label="HeySasa is typing">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-slate-200/80 bg-white px-4 py-3.5 shadow-sm">
        {[0, 150, 300].map((delay) => (
          <span key={delay} className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${delay}ms`, animationDuration: '1s' }} />
        ))}
      </div>
    </div>
  );
}

// A photo the AI sent (a product, or an image from the business files). Signed links expire, so a dead one says so.
function ImageBubble({ image }) {
  const [broken, setBroken] = useState(false);
  return (
    <div className="mb-1.5 flex justify-start">
      <div className="max-w-[75%] overflow-hidden rounded-2xl rounded-bl-sm border border-slate-200/80 bg-white shadow-sm max-md:max-w-[88%]">
        {broken ? (
          <div className="flex h-24 w-44 items-center justify-center gap-1.5 bg-slate-50 text-xs text-slate-400"><ImageOff size={14} /> Image link expired</div>
        ) : (
          <img src={image.url} alt={image.caption || 'Image sent by the AI'} loading="lazy" onError={() => setBroken(true)} className="max-h-72 w-full object-cover" />
        )}
        {image.caption && <p className="whitespace-pre-wrap px-3 py-2 text-[13px] text-[#0F172A]">{image.caption}</p>}
      </div>
    </div>
  );
}

function Message({ msg, onFlag }) {
  const [showTrace, setShowTrace] = useState(false);
  const isUser = msg.role === 'user';

  return (
    <>
    {!isUser && msg.outbox?.length > 0 && <div className="mb-1">{msg.outbox.map((img, i) => <ImageBubble key={`${img.url}-${i}`} image={img} />)}</div>}
    <div className={`mb-3 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] max-md:max-w-[88%] ${isUser ? 'order-2' : ''}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed max-md:text-[15.5px] ${
            isUser ? 'rounded-br-sm bg-[#28A745] text-white' : 'rounded-bl-sm border border-slate-200/80 bg-white text-[#0F172A] shadow-sm'
          }`}
        >
          {msg.content}
        </div>

        {!isUser && (
          <div className="mt-1 flex items-center gap-3 px-1">
            {msg.tierUsed && (
              <span className="flex items-center gap-1 text-[11px]" style={{ color: TIER_COLORS[msg.tierUsed] }}>
                <Zap size={10} /> {TIER_LABELS[msg.tierUsed]} · {msg.responseTimeMs}ms
              </span>
            )}
            {msg.trace?.length > 0 && (
              <button onClick={() => setShowTrace((s) => !s)} className="flex items-center gap-0.5 text-[11px] text-[#94A3B8] hover:text-[#64748B]">
                {msg.trace.length} tool call{msg.trace.length > 1 ? 's' : ''} {showTrace ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>
            )}
            <button onClick={() => onFlag(msg)} className="flex items-center gap-0.5 text-[11px] text-slate-300 hover:text-red-500">
              <Flag size={10} /> Flag
            </button>
          </div>
        )}
        {msg.handoff && msg.handoffAlert?.recipients && (
          <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
            <UserRound size={11} /> {msg.handoffAlert.recipients.length ? `Would alert ${msg.handoffAlert.recipients.map((r) => r.name).join(', ')}` : 'Handed over, no alerts number set'}
          </p>
        )}
        {showTrace && <TracePanel trace={msg.trace} />}
      </div>
    </div>
    </>
  );
}

export function LiveChatPlayground({ liveChat }) {
  const { messages, send, sending, flag } = liveChat;
  const [input, setInput] = useState('');
  const [flagTarget, setFlagTarget] = useState(null);
  const [flagText, setFlagText] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const submit = () => {
    if (!input.trim()) return;
    send(input.trim());
    setInput('');
  };

  const submitFlag = async () => {
    await flag(flagTarget, flagText);
    setFlagTarget(null);
    setFlagText('');
  };

  return (
    <div className="relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-white/60 max-md:rounded-[1.25rem] max-md:border max-md:border-white/80 max-md:shadow-lg max-md:shadow-[#28A745]/5 md:border-l md:border-slate-200/80">
      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 max-md:px-3">
        {messages.length === 0 && <p className="mx-auto mt-6 max-w-[16rem] text-center text-xs leading-5 text-[#94A3B8]">Write as a customer would. Nothing here reaches a real person.</p>}
        {messages.map((m, i) => (
          <Message key={i} msg={m} onFlag={setFlagTarget} />
        ))}
        {sending && <TypingBubble />}
      </div>

      <div className="relative flex min-w-0 items-center gap-2 border-t border-slate-200/80 px-4 py-3 max-md:px-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Type a test message…"
          className="min-w-0 flex-1 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#28A745]/30 max-md:h-12"
        />
        <button onClick={submit} disabled={sending} className="shrink-0 rounded-full bg-[#28A745] p-2.5 text-white shadow-lg shadow-[#28A745]/20 hover:bg-[#1f8d3d] disabled:opacity-40 max-md:flex max-md:h-12 max-md:w-12 max-md:items-center justify-center max-md:p-0">
          <Send size={16} />
        </button>
      </div>

      {flagTarget && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="w-80 max-w-[calc(100%-2rem)] rounded-2xl bg-white p-5 shadow-lg">
            <p className="mb-2 text-sm font-medium text-[#0F172A]">What felt off about this reply?</p>
            <textarea
              autoFocus
              rows={3}
              value={flagText}
              onChange={(e) => setFlagText(e.target.value)}
              className="mb-3 w-full rounded-xl border border-slate-200/80 px-3 py-2 text-sm"
              placeholder="e.g. too pushy, wrong tone, missed the objection"
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), submitFlag())}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setFlagTarget(null);
                  setFlagText('');
                }}
                className="px-3 py-1.5 text-sm text-[#94A3B8]"
              >
                Cancel
              </button>
              <button onClick={submitFlag} className="rounded-full bg-[#28A745] px-3 py-1.5 text-sm text-white">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}