import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, LoaderCircle, MessageCircleMore, Smartphone, X } from 'lucide-react';

const EVOLUTION_API_URL = (import.meta.env.VITE_EVOLUTION_API_URL || 'http://localhost:8080').replace(/\/$/, '');
const EVOLUTION_API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY || '';
const INSTANCE_PREFIX = import.meta.env.VITE_EVOLUTION_INSTANCE_NAME || 'business';
const POLL_INTERVAL = 20000;

function getQrImageSource(value) {
  if (!value) return '';
  return value.startsWith('data:image/') ? value : `data:image/png;base64,${value}`;
}

function createInstanceName() {
  const suffix = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
    : `${Date.now()}${Math.floor(Math.random() * 100000)}`;
  return `${INSTANCE_PREFIX}_${suffix}`;
}

export function WhatsAppConnectionFlow({ open, onClose, onConnected }) {
  const pollIntervalRef = useRef(null);
  const receivedChallengeRef = useRef(false);
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState('qr');
  const [countryCode, setCountryCode] = useState('+254');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [connectionName, setConnectionName] = useState('');
  const [status, setStatus] = useState('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [instanceName, setInstanceName] = useState('');

  const normalizedPhone = useMemo(() => `${countryCode}${phoneNumber.replace(/\D/g, '')}`, [countryCode, phoneNumber]);

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const createInstance = async (name) => {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: { apikey: EVOLUTION_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instanceName: name,
        integration: 'WHATSAPP-BAILEYS',
        qrcode: true,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.message || data?.error || 'Evolution API could not create this instance.');
  };

  const fetchConnection = async (phone = '', targetInstanceName) => {
    const query = phone ? `?number=${encodeURIComponent(phone.replace(/\D/g, ''))}` : '';
    const response = await fetch(`${EVOLUTION_API_URL}/instance/connect/${targetInstanceName}${query}`, {
      headers: { apikey: EVOLUTION_API_KEY, 'Content-Type': 'application/json' },
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) throw new Error(data?.message || data?.error || 'Evolution API could not start this connection.');
    if (data.base64) {
      receivedChallengeRef.current = true;
      setQrCode(getQrImageSource(data.base64));
    }
    if (data.pairingCode) {
      receivedChallengeRef.current = true;
      setPairingCode(data.pairingCode);
    }

    const apiState = String(data?.instance?.state ?? data?.state ?? '').toLowerCase();
    const isConnectionOpen = ['open', 'connected', 'ready', 'authenticated'].includes(apiState);

    if (isConnectionOpen) {
      stopPolling();
      setStatus(receivedChallengeRef.current ? 'success' : 'already-connected');
      setStep(3);
      return true;
    }

    return false;
  };

  const startPolling = async (phone = '', targetInstanceName) => {
    stopPolling();
    setIsLoading(true);
    setFormError('');

    try {
      await createInstance(targetInstanceName);
      const isAlreadyConnected = await fetchConnection(phone, targetInstanceName);
      setIsLoading(false);
      if (!isAlreadyConnected) {
        pollIntervalRef.current = setInterval(() => {
          fetchConnection(phone, targetInstanceName).catch((error) => {
            setFormError(error.message || 'Error connecting to Evolution API.');
            setStatus('failed');
            setStep(3);
            stopPolling();
          });
        }, POLL_INTERVAL);
      }
    } catch (error) {
        setFormError(error.message || 'Error connecting to Evolution API.');
        setStatus('failed');
        setStep(3);
        stopPolling();
        setIsLoading(false);
    }
  };

  const resetFlow = () => {
    stopPolling();
    setStep(1);
    setMethod('qr');
    setCountryCode('+254');
    setPhoneNumber('');
    setPairingCode('');
    setQrCode('');
    receivedChallengeRef.current = false;
    setConnectionName('');
    setStatus('idle');
    setIsLoading(false);
    setFormError('');
    setInstanceName('');
  };

  useEffect(() => {
    if (!open && pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [open]);

  const handleClose = () => {
    resetFlow();
    onClose?.();
  };

  const handleStart = () => {
    if (method === 'number' && normalizedPhone.replace(/\D/g, '').length < 8) {
      setFormError('Enter a valid phone number with country code.');
      return;
    }
    const nextInstanceName = createInstanceName();
    setInstanceName(nextInstanceName);
    setStep(2);
    startPolling(method === 'number' ? normalizedPhone : '', nextInstanceName);
  };

  const handleNameSave = async () => {
    const cleanedName = connectionName.trim() || 'Primary WhatsApp connection';
    setIsLoading(true);
    setFormError('');

    try {
      await onConnected?.({
        id: `inst_${Date.now()}`,
        number: phoneNumber ? normalizedPhone : `Evolution instance: ${instanceName}`,
        instanceName,
        label: cleanedName,
        active: true,
      });
      onClose?.();
    } catch (error) {
      setFormError(error.message || 'Could not save this WhatsApp connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setStatus('idle');
    setStep(1);
    setFormError('');
    setPairingCode('');
    setQrCode('');
    receivedChallengeRef.current = false;
    setInstanceName('');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/35 p-4 sm:p-6">
      <div className="static w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[1.5rem] border border-white/80 bg-white/95 shadow-2xl shadow-slate-900/15 backdrop-blur-xl sm:max-h-[calc(100vh-3rem)]">
        <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3 sm:px-5">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Evolution API</p><h3 className="mt-1 text-base font-semibold text-slate-800">Connect WhatsApp</h3></div>
          <button type="button" onClick={handleClose} className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:text-slate-800" aria-label="Close connection flow"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-4 sm:p-5">
          {step === 1 && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-[#28A745]/15 bg-[#28A745]/5 p-3 text-sm text-slate-600">A unique Evolution instance will be created for this WhatsApp connection.</div>
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
                {['qr', 'number'].map((option) => <button key={option} type="button" onClick={() => setMethod(option)} className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${method === option ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{option === 'qr' ? 'QR code' : 'Phone number'}</button>)}
              </div>

              {method === 'number' && <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Phone number</label><div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-[#28A745] focus-within:bg-white"><select value={countryCode} onChange={(event) => setCountryCode(event.target.value)} className="w-24 bg-transparent text-sm font-medium text-slate-700 outline-none" aria-label="Country code"><option value="+254">+254</option><option value="+1">+1</option><option value="+44">+44</option><option value="+61">+61</option><option value="+971">+971</option><option value="+27">+27</option></select><input type="tel" inputMode="numeric" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="712 345 678" className="w-full bg-transparent text-base text-slate-800 outline-none placeholder:text-slate-400" /></div></div>}
              {formError && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>}
              <button type="button" onClick={handleStart} disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#28A745] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#28A745]/20 transition hover:bg-[#1f8d3d] disabled:cursor-not-allowed disabled:opacity-60">{isLoading && <LoaderCircle className="h-4 w-4 animate-spin" />}{isLoading ? 'Starting connection...' : 'Continue'}</button>
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500"><Smartphone className="h-3.5 w-3.5" />Powered by Evolution API</div>
            </div>
          )}

          {step === 2 && <div className="space-y-5"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Step 2</p><h4 className="mt-1 text-lg font-semibold text-slate-800">{method === 'qr' ? 'Scan the QR code' : 'Enter the pairing code'}</h4></div><button type="button" onClick={() => { stopPolling(); setStep(1); }} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600"><ArrowLeft className="h-3.5 w-3.5" />Back</button></div>{method === 'qr' ? <div className="space-y-4"><div className="mx-auto flex min-h-[252px] w-full max-w-[270px] items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-inner shadow-slate-200/60">{qrCode ? <img src={qrCode} alt="WhatsApp QR code" className="h-[220px] w-[220px] rounded-xl bg-white p-2" /> : <div className="flex flex-col items-center gap-3 text-sm text-slate-500"><LoaderCircle className="h-6 w-6 animate-spin text-[#28A745]" />Generating QR code...</div>}</div><p className="rounded-2xl border border-[#28A745]/10 bg-[#28A745]/5 p-3 text-center text-sm text-slate-600">Open WhatsApp on your phone and scan this code. It refreshes automatically every 20 seconds.</p><button type="button" onClick={() => { stopPolling(); setMethod('number'); setStep(1); }} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">Connect via phone number instead</button></div> : <div className="space-y-4"><div className="flex min-h-24 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center"><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Pairing code</p><strong className="mt-2 block text-3xl tracking-[0.25em] text-[#28A745]">{pairingCode || '------'}</strong></div></div><p className="rounded-2xl border border-[#28A745]/10 bg-[#28A745]/5 p-3 text-center text-sm text-slate-600">Enter this code in WhatsApp on your phone. This screen will update when connected.</p></div>}{formError && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>}</div>}

          {step === 3 && status === 'success' && <div className="space-y-5"><div className="flex flex-col items-center text-center"><div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#28A745]/10 text-[#28A745]"><CheckCircle2 className="h-8 w-8" /></div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#28A745]">Connected</p><h4 className="mt-2 text-xl font-semibold text-slate-800">WhatsApp number ready</h4></div><div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><label className="mb-2 block text-sm font-medium text-slate-700">Name this connection</label><input type="text" value={connectionName} onChange={(event) => setConnectionName(event.target.value)} placeholder="Support WhatsApp" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#28A745]" /></div>{formError && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>}<button type="button" onClick={handleNameSave} disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#28A745] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#28A745]/20 transition hover:bg-[#1f8d3d] disabled:cursor-not-allowed disabled:opacity-60">{isLoading && <LoaderCircle className="h-4 w-4 animate-spin" />}{isLoading ? 'Saving connection...' : 'Save connection'}</button></div>}
          {step === 3 && status === 'already-connected' && <div className="space-y-5"><div className="flex flex-col items-center text-center"><div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600"><MessageCircleMore className="h-7 w-7" /></div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-600">Already connected</p><h4 className="mt-2 text-xl font-semibold text-slate-800">This WhatsApp is already linked</h4></div><p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Evolution reports the <span className="font-semibold">{instanceName}</span> instance as already open.</p><button type="button" onClick={handleRetry} className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">Try again</button></div>}
          {step === 3 && status === 'failed' && <div className="space-y-5"><div className="flex flex-col items-center text-center"><div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-500"><MessageCircleMore className="h-7 w-7" /></div><h4 className="text-xl font-semibold text-slate-800">Connection unsuccessful</h4></div><p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{formError}</p><button type="button" onClick={handleRetry} className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">Retry</button></div>}
        </div>
      </div>
    </div>
  );
}
