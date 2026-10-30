import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Copy, KeyRound, LoaderCircle, Plus, Send, Trash2 } from 'lucide-react';
import { GlassCard, Toggle } from '../shared/ui';
import { useAuth } from '../../../context/useAuth';
import { useAccount } from '../../../context/useAccount';
import { accountDisplayName } from '../../../services/accountsService';
import {
  createApiKey, fetchWebsiteIntegration, resetEventTemplate, revokeApiKey, saveEventTemplate, sendTestEvent,
} from '../../../services/integrationsService';

// Preferences -> Integrations -> Website: the API key a website uses, how to send events, the message for each
// event, a test button and the latest events. Backend: src/events/routes.js (EVENTS_API.md).

const STATUS = {
  scheduled: ['Waiting', 'bg-amber-50 text-amber-700'],
  sending: ['Sending', 'bg-sky-50 text-sky-700'],
  sent: ['Sent', 'bg-[#28A745]/10 text-[#1f8d3d]'],
  failed: ['Failed', 'bg-red-50 text-red-700'],
  cancelled: ['Cancelled', 'bg-slate-100 text-slate-600'],
  skipped: ['Skipped', 'bg-slate-100 text-slate-600'],
};

const REASONS = {
  cancelled_by_order_paid: 'They paid, so the reminder was not needed',
  customer_replied: 'They wrote to you, so the chat took over',
  do_not_contact: 'This person asked not to be contacted',
  number_not_on_whatsapp: 'This number is not on WhatsApp',
  whatsapp_not_connected: 'Your WhatsApp number is not connected',
  insufficient_balance: 'Your balance is too low',
  quiet_hours: 'Waiting for quiet hours to end',
  expired: 'Not sent within 2 days',
};

function CopyButton({ text, label = 'Copy' }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); } catch { /* clipboard blocked */ }
      }}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-[#28A745]/40 hover:text-[#1f8d3d]"
    >
      {done ? <Check size={14} /> : <Copy size={14} />} {done ? 'Copied' : label}
    </button>
  );
}

function CodeBlock({ code }) {
  return (
    <div className="relative">
      <pre className="max-w-full overflow-x-auto rounded-2xl bg-slate-900 p-4 pr-24 text-[12px] leading-relaxed text-slate-100"><code>{code}</code></pre>
      <div className="absolute right-2 top-2"><CopyButton text={code} /></div>
    </div>
  );
}

function SectionTitle({ step, title, sub }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      {step && <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#28A745] text-sm font-bold text-white">{step}</span>}
      <div className="min-w-0">
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        {sub && <p className="mt-0.5 text-sm text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}

const when = (iso) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '');

function examples(base) {
  const url = `${base}/v1/events`;
  const body = {
    event: 'order.paid',
    event_id: 'order_1042',
    phone: '+254712345678',
    name: 'Wanjiku',
    data: { order_id: '1042', total: 2500, currency: 'KES', items: [{ name: 'Lash kit', qty: 1 }] },
  };
  return {
    curl: `curl -X POST ${url} \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(body, null, 2).replace(/\n/g, '\n  ')}'`,
    node: `// On your server (never in the browser: the key must stay secret)
await fetch('${url}', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer ' + process.env.HEYSASA_API_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(${JSON.stringify(body, null, 2).replace(/\n/g, '\n  ')}),
});`,
    php: `<?php
// On your server, for example right after payment is confirmed
$ch = curl_init('${url}');
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    'Authorization: Bearer ' . getenv('HEYSASA_API_KEY'),
    'Content-Type: application/json',
  ],
  CURLOPT_POSTFIELDS => json_encode([
    'event' => 'order.paid',
    'event_id' => 'order_' . $order_id,
    'phone' => $customer_phone,
    'name' => $customer_name,
    'data' => ['order_id' => $order_id, 'total' => $total, 'currency' => 'KES', 'items' => $items],
  ]),
]);
curl_exec($ch);`,
  };
}

function TemplateEditor({ template, canManage, onSave, onReset }) {
  const [draft, setDraft] = useState(template);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const dirty = draft.enabled !== template.enabled || draft.body !== template.body
    || Number(draft.delayMinutes) !== template.delayMinutes || draft.respectQuietHours !== template.respectQuietHours;

  const save = async () => {
    setSaving(true); setError('');
    try { await onSave({ ...draft, delayMinutes: Number(draft.delayMinutes) || 0 }); } catch (e) { setError(e.message); }
    setSaving(false);
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-900">{template.label}</span>
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">{template.event}</code>
          </div>
          <p className="mt-0.5 text-[13px] text-slate-500">{template.description}</p>
        </div>
        <Toggle checked={draft.enabled} onChange={(v) => canManage && setDraft({ ...draft, enabled: v })} />
      </div>
      <textarea
        value={draft.body}
        disabled={!canManage}
        onChange={(e) => setDraft({ ...draft, body: e.target.value })}
        rows={3}
        maxLength={1000}
        className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#28A745] focus:outline-none disabled:bg-slate-50"
      />
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-slate-600">
        <label className="flex items-center gap-2">
          Send after
          <input
            type="number" min={0} max={10080} disabled={!canManage}
            value={draft.delayMinutes}
            onChange={(e) => setDraft({ ...draft, delayMinutes: e.target.value })}
            className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-sm disabled:bg-slate-50"
          />
          minutes
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" disabled={!canManage} checked={draft.respectQuietHours} onChange={(e) => setDraft({ ...draft, respectQuietHours: e.target.checked })} />
          Wait for quiet hours to end
        </label>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {canManage && (
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          {template.customized && (
            <button type="button" onClick={onReset} className="rounded-full px-3 py-1.5 text-sm font-semibold text-slate-500 hover:bg-slate-100">
              {template.builtIn ? 'Back to default' : 'Remove event'}
            </button>
          )}
          <button
            type="button" onClick={save} disabled={!dirty || saving}
            className="rounded-full bg-[#28A745] px-4 py-1.5 text-sm font-semibold text-white disabled:bg-slate-300"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}
    </div>
  );
}

export function WebsiteIntegration() {
  const { activeBusinessId: businessId } = useAuth();
  const { accounts, selectedAccountId } = useAccount();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newKey, setNewKey] = useState(null);
  const [keyLabel, setKeyLabel] = useState('My website');
  const [keyAccountId, setKeyAccountId] = useState(selectedAccountId || '');
  const [keyBusy, setKeyBusy] = useState(false);
  const [lang, setLang] = useState('curl');
  const [testPhone, setTestPhone] = useState('');
  const [testState, setTestState] = useState({ busy: false, message: '', error: '' });
  const [customEvent, setCustomEvent] = useState('');

  const load = useCallback(async () => {
    if (!businessId) return;
    try { setData(await fetchWebsiteIntegration(businessId)); setError(''); } catch (e) { setError(e.message); }
    setLoading(false);
  }, [businessId]);
  useEffect(() => {
    const first = async () => { await load(); };
    first();
  }, [load]);

  const code = useMemo(() => examples(data?.apiBaseUrl || 'https://api.heysasa.co.ke'), [data?.apiBaseUrl]);
  const canManage = !!data?.canManage;
  const accountName = (id) => accounts.find((a) => a.id === id) ? accountDisplayName(accounts.find((a) => a.id === id)) : 'Main number';

  if (loading) return <div className="flex items-center gap-2 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={16} /> Loading...</div>;
  if (error && !data) return <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>;

  const makeKey = async () => {
    setKeyBusy(true); setError('');
    try {
      const result = await createApiKey(businessId, { label: keyLabel, accountId: keyAccountId || null });
      setNewKey(result.key);
      await load();
    } catch (e) { setError(e.message); }
    setKeyBusy(false);
  };
  const revoke = async (key) => {
    if (!window.confirm(`Revoke "${key.label}"? Any website using it stops working straight away.`)) return;
    try { await revokeApiKey(businessId, key.id); await load(); } catch (e) { setError(e.message); }
  };
  const runTest = async () => {
    setTestState({ busy: true, message: '', error: '' });
    try {
      const event = await sendTestEvent(businessId, { phone: testPhone });
      setTestState({ busy: false, message: `Test receipt queued for ${event.phone}. It goes out within a minute or two. Watch "Latest events" below.`, error: '' });
      await load();
    } catch (e) { setTestState({ busy: false, message: '', error: e.message }); }
  };

  return (
    <div className="space-y-4">
      <GlassCard>
        <h3 className="text-lg font-bold text-slate-900">Connect your website to HeySasa</h3>
        <p className="mt-1 text-sm text-slate-600">
          When something happens on your website, your website tells HeySasa, and HeySasa sends the customer a WhatsApp message from your number.
          For example: a reminder an hour after someone leaves their cart, or a receipt the moment they pay. If the customer replies, the chat continues in HeySasa like any other.
        </p>
        <ol className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
          <li className="rounded-xl bg-[#28A745]/5 p-3"><b>1. Create an API key</b> below and keep it secret.</li>
          <li className="rounded-xl bg-[#28A745]/5 p-3"><b>2. Give it to your web developer</b> with the code examples on this page.</li>
          <li className="rounded-xl bg-[#28A745]/5 p-3"><b>3. Your website sends an event</b> when a cart is left or an order is paid.</li>
          <li className="rounded-xl bg-[#28A745]/5 p-3"><b>4. Check the wording</b> of each message below and send yourself a test.</li>
        </ol>
        <p className="mt-3 text-[13px] text-slate-500">
          Messages go out through the same safe sending limits as your follow-ups, so your number is protected. Each message is paid from your HeySasa balance at the normal message rate.
        </p>
      </GlassCard>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <GlassCard>
        <SectionTitle step="1" title="API key" sub="Your website uses this key to prove it is yours. Anyone with the key can send messages from your number, so only share it with your developer." />
        {!canManage && <p className="text-sm text-slate-500">Only the business owner or an admin can create keys.</p>}
        {newKey && (
          <div className="mb-4 rounded-2xl border border-[#28A745]/30 bg-[#28A745]/5 p-4">
            <p className="text-sm font-semibold text-[#1f8d3d]">Your new key. Copy it now: it will not be shown again.</p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="min-w-0 flex-1 break-all rounded-xl bg-white px-3 py-2 text-[13px] text-slate-800">{newKey}</code>
              <CopyButton text={newKey} label="Copy key" />
            </div>
          </div>
        )}
        {canManage && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              value={keyLabel} onChange={(e) => setKeyLabel(e.target.value)} maxLength={60} placeholder="Name, e.g. My website"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
            {accounts.length > 1 && (
              <select value={keyAccountId} onChange={(e) => setKeyAccountId(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                <option value="">Main number</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{accountDisplayName(a)}</option>)}
              </select>
            )}
            <button
              type="button" onClick={makeKey} disabled={keyBusy}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#28A745] px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
            >
              <KeyRound size={16} /> {keyBusy ? 'Creating...' : 'Create key'}
            </button>
          </div>
        )}
        {data.keys.length > 0 && (
          <ul className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white/80">
            {data.keys.map((key) => (
              <li key={key.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-800">{key.label}</div>
                  <div className="text-[12px] text-slate-500">
                    <code>{key.key_prefix}...</code> · {accounts.length > 1 ? `${accountName(key.account_id)} · ` : ''}
                    {key.last_used_at ? `last used ${when(key.last_used_at)}` : 'not used yet'}
                  </div>
                </div>
                {canManage && (
                  <button type="button" onClick={() => revoke(key)} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                    <Trash2 size={14} /> Revoke
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </GlassCard>

      <GlassCard>
        <SectionTitle step="2" title="Send events from your website" sub="Your website's server sends one request each time something happens. Send it from the server, never from the shopper's browser, so the key stays secret." />
        <div className="mb-3 flex gap-2">
          {[['curl', 'cURL'], ['node', 'JavaScript'], ['php', 'PHP']].map(([id, label]) => (
            <button key={id} type="button" onClick={() => setLang(id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${lang === id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>{label}</button>
          ))}
        </div>
        <CodeBlock code={code[lang]} />
        <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="font-semibold text-slate-800">What to send</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li><code>event</code>: <code>cart.abandoned</code>, <code>order.paid</code>, <code>order.shipped</code> or one of your own below</li>
              <li><code>phone</code>: the customer's WhatsApp number, e.g. <code>+254712345678</code> or <code>0712345678</code></li>
              <li><code>name</code>: the customer's name (optional)</li>
              <li><code>event_id</code>: your cart or order number. Sending the same one twice never sends two messages</li>
              <li><code>data</code>: order details used in the message: <code>order_id</code>, <code>total</code>, <code>currency</code>, <code>items</code>, <code>cart_url</code>, <code>tracking_url</code></li>
            </ul>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="font-semibold text-slate-800">When to send it</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li><b>Abandoned cart:</b> as soon as a shopper enters their phone at checkout. HeySasa waits (an hour by default) and cancels the reminder if they pay.</li>
              <li><b>Order paid:</b> when payment is confirmed (for example in your M-Pesa or card callback).</li>
              <li><b>Order shipped:</b> when the order leaves.</li>
              <li>HeySasa answers <code>202</code> with an <code>id</code>. <code>GET /v1/events/&lt;id&gt;</code> tells you if it was sent.</li>
            </ul>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <SectionTitle step="3" title="Messages" sub="What the customer receives for each event. Words in {{double braces}} are filled in from what your website sends." />
        <div className="mb-4 flex flex-wrap gap-1.5">
          {data.mergeFields.map((f) => (
            <span key={f.field} title={f.meaning} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{`{{${f.field}}}`}</span>
          ))}
        </div>
        <div className="space-y-3">
          {data.templates.map((template) => (
            <TemplateEditor
              // A saved change remounts the editor with the fresh values.
              key={`${template.event}:${template.enabled}:${template.delayMinutes}:${template.respectQuietHours}:${template.body}`}
              template={template}
              canManage={canManage}
              onSave={async (draft) => { await saveEventTemplate(businessId, template.event, draft); await load(); }}
              onReset={async () => { try { await resetEventTemplate(businessId, template.event); await load(); } catch (e) { setError(e.message); } }}
            />
          ))}
        </div>
        {canManage && (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              value={customEvent} onChange={(e) => setCustomEvent(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
              placeholder="Your own event, e.g. booking.confirmed" maxLength={60}
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
            <button
              type="button" disabled={!customEvent}
              onClick={async () => {
                try {
                  await saveEventTemplate(businessId, customEvent, { enabled: true, body: 'Hi {{first_name}}, ', delayMinutes: 0, respectQuietHours: false });
                  setCustomEvent(''); await load();
                } catch (e) { setError(e.message); }
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              <Plus size={16} /> Add event
            </button>
          </div>
        )}
      </GlassCard>

      <GlassCard>
        <SectionTitle step="4" title="Send yourself a test" sub="Sends a sample order receipt to the number you enter, through your connected WhatsApp, exactly like a real event." />
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="Your phone, e.g. 0712345678" inputMode="tel"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          />
          <button
            type="button" onClick={runTest} disabled={!canManage || !testPhone || testState.busy}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#28A745] px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
          >
            <Send size={16} /> {testState.busy ? 'Sending...' : 'Send test'}
          </button>
        </div>
        {testState.message && <p className="mt-2 text-sm text-[#1f8d3d]">{testState.message}</p>}
        {testState.error && <p className="mt-2 text-sm text-red-600">{testState.error}</p>}
      </GlassCard>

      <GlassCard>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-base font-bold text-slate-900">Latest events</h3>
          <button type="button" onClick={load} className="rounded-full px-3 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100">Refresh</button>
        </div>
        {data.events.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing yet. Events your website sends show up here.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.events.map((ev) => {
              const [label, tone] = STATUS[ev.status] ?? [ev.status, 'bg-slate-100 text-slate-600'];
              const reason = ev.status !== 'sent' && ev.last_error ? (REASONS[ev.last_error] ?? ev.last_error) : '';
              return (
                <li key={ev.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">{ev.event_type}</code>
                      <span className="font-medium text-slate-800">{ev.name || `+${ev.phone}`}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}>{label}</span>
                    </div>
                    <p className="mt-0.5 truncate text-[12px] text-slate-500">{reason || ev.message}</p>
                  </div>
                  <span className="shrink-0 text-[12px] text-slate-400">
                    {ev.status === 'sent' ? when(ev.sent_at) : ev.status === 'scheduled' ? `due ${when(ev.send_at)}` : when(ev.created_at)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}
