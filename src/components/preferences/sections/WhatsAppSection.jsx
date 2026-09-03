import { useEffect, useRef, useState } from 'react';
import { ChevronRight, LoaderCircle, Plus } from 'lucide-react';
import { GlassCard, Toggle } from '../shared/ui';
import { WhatsAppConnectionFlow } from './WhatsAppConnectionFlow';
import whatsappIcon from '../../../assets/images/whatsappicon.svg';
import {
  fetchHistoryAnalysisStatus,
  markWhatsAppHistoryLoaded,
  fetchWhatsAppSessions,
  disconnectWhatsAppInstance,
  saveWhatsAppSession,
  startHistoryAnalysis,
} from '../../../services/businessService';
import { useAuth } from '../../../context/useAuth';

const HISTORY_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;

export function WhatsAppSection() {
  const { activeBusinessId, getBusinesses } = useAuth();
  const [connections, setConnections] = useState([]);
  const [businessName, setBusinessName] = useState('Business name');
  const [loading, setLoading] = useState(true);
  const [isFlowOpen, setIsFlowOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [currentTime] = useState(() => Date.now());
  const [historyError, setHistoryError] = useState('');
  const [disconnectingId, setDisconnectingId] = useState(null);
  const historyPollRef = useRef(null);

  const stopHistoryPolling = () => {
    if (historyPollRef.current) {
      clearInterval(historyPollRef.current);
      historyPollRef.current = null;
    }
  };

  const checkHistoryStatus = async (connection, startedAt) => {
    const status = await fetchHistoryAnalysisStatus();
    if (status.businessId && status.businessId !== activeBusinessId) {
      throw new Error('History status belongs to a different business. No data was loaded.');
    }
    if (!status.running) {
      stopHistoryPolling();
      setHistoryLoading(false);
      const statusValue = String(status.status || '').toLowerCase();
      const succeeded = status.success === true
        || status.completed === true
        || statusValue === 'success'
        || statusValue === 'completed'
        || (!status.error && status.failed !== true && statusValue !== 'failed' && statusValue !== 'error');
      if (succeeded) {
        const savedSession = await markWhatsAppHistoryLoaded({ businessId: activeBusinessId, sessionId: connection.id });
        setConnections((current) => current.map((item) => (
          item.id === connection.id
            ? { ...item, history_loaded_at: savedSession?.history_loaded_at || startedAt }
            : item
        )));
      }
    }
    return status;
  };

  const handleLoadHistory = async (connection) => {
    if (!activeBusinessId || historyLoading) return;

    stopHistoryPolling();
    setHistoryError('');
    setHistoryLoading(true);
    try {
      const result = await startHistoryAnalysis(activeBusinessId);
      if (result.businessId && result.businessId !== activeBusinessId) {
        throw new Error('History analysis started for a different business. No data was loaded.');
      }
      const startedAt = new Date().toISOString();
      const status = await checkHistoryStatus(connection, startedAt);
      if (status.running) {
        historyPollRef.current = setInterval(() => {
          checkHistoryStatus(connection, startedAt).catch((error) => {
            stopHistoryPolling();
            setHistoryLoading(false);
            setHistoryError(error.message || 'Could not check history loading status.');
          });
        }, 1500);
      }
    } catch (error) {
      setHistoryLoading(false);
      setHistoryError(error.message || 'Could not start history loading.');
    }
  };

  const handleDisconnect = async (connection) => {
    if (disconnectingId) return;

    setDisconnectingId(connection.id);
    try {
      await disconnectWhatsAppInstance({
        businessId: activeBusinessId,
        sessionId: connection.id,
        instanceName: connection.instance_name,
      });
      setConnections((current) => current.filter((item) => item.id !== connection.id));
    } catch (error) {
      setHistoryError(error.message || 'Could not disconnect this WhatsApp instance.');
    } finally {
      setDisconnectingId(null);
    }
  };

  useEffect(() => () => stopHistoryPolling(), []);

  useEffect(() => {
    let mounted = true;
    Promise.all([fetchWhatsAppSessions(activeBusinessId), getBusinesses()])
      .then(([sessions, businesses]) => {
        if (!mounted) return;
        const businessIndex = businesses.findIndex((business) => business.business_id === activeBusinessId);
        const activeBusiness = businessIndex >= 0 ? businesses[businessIndex] : null;
        setBusinessName(activeBusiness?.name?.trim() || activeBusiness?.business_name?.trim() || 'Business name');
        setConnections(sessions);
      })
      .catch((error) => console.error('[WhatsAppSection] load failed:', error))
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [activeBusinessId]);

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <GlassCard className="w-full">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">WhatsApp Connection</h3>
            <p className="mt-1 text-sm text-slate-600">Manage your active WhatsApp instances and sync settings.</p>
          </div>
          <div className="flex items-center gap-2 self-start rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600 sm:self-auto">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500"></span>
            {connections.length} connected
          </div>
        </div>

        <div className="space-y-3">
          {!loading && connections.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center"><p className="text-sm font-semibold text-slate-700">No WhatsApp connected</p><button type="button" onClick={() => setIsFlowOpen(true)} className="mt-3 rounded-lg bg-[#28A745] px-3 py-2 text-xs font-semibold text-white">Connect now</button></div>}
          {loading && <p className="py-5 text-center text-sm text-slate-400">Loading WhatsApp connections...</p>}
          {!loading && connections.map((connection, index) => (
            <div
              key={connection.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-sm"
                >
                  <img src={whatsappIcon} alt="WhatsApp" className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-slate-800">{connection.label || `${businessName} - ${index + 1}`}</span>
                    {connection.status === 'connected' && (
                      <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-600">Primary</span>
                    )}
                  </div>
                  <div className="text-sm text-slate-600">WhatsApp Business App</div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                {connection.status === 'connected' ? (
                  <>
                    <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-green-600">
                      Active
                    </span>
                    <button
                      type="button"
                      onClick={() => handleLoadHistory(connection)}
                      disabled={historyLoading || Boolean(connection.history_loaded_at && currentTime - new Date(connection.history_loaded_at).getTime() < HISTORY_COOLDOWN_MS) || !activeBusinessId}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {historyLoading && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
                      {historyLoading ? 'Loading...' : connection.history_loaded_at && currentTime - new Date(connection.history_loaded_at).getTime() < HISTORY_COOLDOWN_MS ? 'History Loaded' : 'Load History'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDisconnect(connection)}
                      disabled={disconnectingId === connection.id || Boolean(disconnectingId)}
                      className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {disconnectingId === connection.id ? 'Disconnecting...' : 'Disconnect'}
                    </button>
                  </>
                ) : (
                  <button type="button" className="rounded-lg bg-red-500/10 px-3 py-2 text-xs font-medium text-red-500 transition hover:text-red-400">
                    Disconnect
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        {historyError && <p className="mt-3 text-right text-xs text-red-500">{historyError}</p>}

        <button
          type="button"
          onClick={() => setIsFlowOpen(true)}
          className="mt-5 flex w-full items-center justify-between rounded-2xl border border-dashed border-[#28A745]/35 bg-[#28A745]/5 px-4 py-3.5 text-left text-sm font-medium text-slate-700 transition hover:border-[#28A745]/50 hover:bg-[#28A745]/10 sm:w-auto sm:min-w-[240px]"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#28A745] shadow-sm">
              <Plus className="h-4 w-4" />
            </span>
            Connect another number
          </span>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </button>

        <div className="space-y-6 border-t border-slate-200/80 pt-4">
          <Toggle 
            label="Auto-sync Contacts" 
            description="Automatically save new numbers interacting with the bot into your leads database." 
            checked={true}
            onChange={() => {}} 
          />
          <Toggle 
            label="Typing Indicators" 
            description="Show 'typing...' status before the bot sends a reply to simulate human behavior." 
            checked={true}
            onChange={() => {}} 
          />
        </div>
      </GlassCard>

      <WhatsAppConnectionFlow
        open={isFlowOpen}
        onClose={() => setIsFlowOpen(false)}
        onConnected={async (newConnection) => {
          try {
            const savedConnection = await saveWhatsAppSession({
              businessId: activeBusinessId,
              phoneNumber: newConnection.number,
              instanceName: newConnection.instanceName,
            });
            if (savedConnection) {
              setConnections((current) => [{ ...savedConnection, label: newConnection.label }, ...current]);
            }
          } catch (error) {
            console.error('[WhatsAppSection] save failed:', error);
            throw error;
          }
        }}
      />
    </div>
  );
}