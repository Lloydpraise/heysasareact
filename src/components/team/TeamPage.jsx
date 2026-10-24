import { useCallback, useEffect, useState } from 'react';
import { Check, Copy, Crown, Loader2, Mail, Trash2, UserPlus } from 'lucide-react';
import { useAccount } from '../../context/useAccount';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../preferences/shared/Toast';
import { inputClass } from '../products/shared';
import { accountDisplayName, fetchTeam, formatAccountPhone, inviteTeamMember, removeTeamMember, updateTeamMember } from '../../services/accountsService';

const ROLE_TEXT = {
  owner: 'Owner. Manages everything.',
  admin: 'Admin. Manages every WhatsApp account, billing and the team.',
  member: 'Member. Sees only the WhatsApp accounts ticked below.',
};

function copyText(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  return Promise.reject(new Error('Copy is not available here. Select the link and copy it by hand.'));
}

function AccountChecks({ accounts, value, onChange, disabled }) {
  if (!accounts.length) return <p className="text-xs text-slate-500">There is no WhatsApp account yet. Add one first, then give people access to it.</p>;
  const toggle = (id) => onChange(value.includes(id) ? value.filter((item) => item !== id) : [...value, id]);
  return (
    <div className="flex flex-wrap gap-2">
      {accounts.map((account) => {
        const on = value.includes(account.id);
        return (
          <label key={account.id} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${on ? 'border-[#28A745] bg-green-50 text-[#1f8d3d]' : 'border-slate-200 text-slate-600 hover:border-slate-300'} ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
            <input type="checkbox" className="h-3.5 w-3.5 accent-[#28A745]" checked={on} onChange={() => toggle(account.id)} disabled={disabled} />
            <span>{accountDisplayName(account)}</span>
            {account.phone_number && <span className="font-normal text-slate-400">{formatAccountPhone(account.phone_number)}</span>}
          </label>
        );
      })}
    </div>
  );
}

function InviteForm({ accounts, isOwner, businessId, onInvited, notify }) {
  const [form, setForm] = useState({ email: '', name: '', role: 'member', accountIds: [] });
  const [saving, setSaving] = useState(false);
  const [link, setLink] = useState('');
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (form.role === 'member' && accounts.length && !form.accountIds.length) {
      setError('Tick at least one WhatsApp account this person will manage.');
      return;
    }
    setSaving(true);
    try {
      const result = await inviteTeamMember(businessId, form);
      setLink(result.invite_link || '');
      setForm({ email: '', name: '', role: 'member', accountIds: [] });
      onInvited();
    } catch (inviteError) {
      setError(inviteError.message || 'Could not send the invite.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white/80 p-4">
      <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900"><UserPlus className="h-4 w-4 text-[#28A745]" />Invite someone</h2>
      <p className="mt-0.5 text-xs text-slate-500">You get a link to send them. They open it, sign in with this email, and they are in.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <input required type="email" className={inputClass} placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} aria-label="Email" />
        <input className={inputClass} placeholder="Name (optional)" value={form.name} maxLength={80} onChange={(event) => setForm({ ...form, name: event.target.value })} aria-label="Name" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Role">
        {['member', 'admin'].map((role) => (
          <label key={role} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold ${form.role === role ? 'border-[#28A745] bg-green-50 text-[#1f8d3d]' : 'border-slate-200 text-slate-600'} ${role === 'admin' && !isOwner ? 'pointer-events-none opacity-50' : ''}`}>
            <input type="radio" name="invite-role" className="accent-[#28A745]" checked={form.role === role} onChange={() => setForm({ ...form, role })} disabled={role === 'admin' && !isOwner} />
            {role === 'admin' ? 'Admin' : 'Member'}
          </label>
        ))}
      </div>
      <p className="mt-1.5 text-xs text-slate-500">{ROLE_TEXT[form.role]}</p>
      {!isOwner && <p className="mt-1 text-xs text-slate-400">Only the business owner can add admins.</p>}
      {form.role === 'member' && (
        <div className="mt-3">
          <p className="mb-2 text-xs font-semibold text-slate-700">WhatsApp accounts they manage</p>
          <AccountChecks accounts={accounts} value={form.accountIds} onChange={(accountIds) => setForm({ ...form, accountIds })} />
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
      <button disabled={saving} className="mt-4 flex items-center gap-2 rounded-xl bg-[#28A745] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#28A745]/20 hover:bg-[#23913d] disabled:opacity-60">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
        {saving ? 'Creating invite...' : 'Create invite link'}
      </button>
      {link && (
        <div className="mt-3 rounded-xl border border-[#28A745]/20 bg-[#28A745]/5 p-3">
          <p className="text-xs font-semibold text-slate-700">Invite ready. Send this link to them (WhatsApp, email or SMS):</p>
          <div className="mt-2 flex items-center gap-2">
            <input readOnly value={link} onFocus={(event) => event.target.select()} className={`${inputClass} text-xs`} aria-label="Invite link" />
            <button type="button" onClick={() => copyText(link).then(() => notify('Link copied.')).catch((copyError) => notify(copyError.message, 'error'))} className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Copy className="h-3.5 w-3.5" />Copy</button>
          </div>
        </div>
      )}
    </form>
  );
}

function PersonRow({ person, accounts, isOwner, businessId, onChanged, notify }) {
  const [editing, setEditing] = useState(false);
  const [role, setRole] = useState(person.role);
  const [accountIds, setAccountIds] = useState(person.account_ids || []);
  const [busy, setBusy] = useState(false);
  const canManage = isOwner || person.role !== 'admin';

  const save = async () => {
    if (role === 'member' && accounts.length && !accountIds.length) { notify('Tick at least one WhatsApp account.', 'error'); return; }
    setBusy(true);
    try {
      await updateTeamMember(businessId, person.id, { role, accountIds: role === 'member' ? accountIds : [] });
      notify('Saved.');
      setEditing(false);
      onChanged();
    } catch (error) {
      notify(error.message || 'Could not save.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Remove ${person.display_name || person.email} from this business? They lose access straight away.`)) return;
    setBusy(true);
    try {
      await removeTeamMember(businessId, person.id);
      notify('Removed.');
      onChanged();
    } catch (error) {
      notify(error.message || 'Could not remove.', 'error');
      setBusy(false);
    }
  };

  const names = (person.account_ids || []).map((id) => accounts.find((account) => account.id === id)).filter(Boolean).map(accountDisplayName);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{person.display_name || person.email}</p>
          {person.display_name && <p className="truncate text-xs text-slate-500">{person.email}</p>}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className={`rounded-full px-2 py-0.5 font-semibold ${person.role === 'admin' ? 'bg-[#FF8C00]/10 text-[#c26a00]' : 'bg-slate-100 text-slate-600'}`}>{person.role === 'admin' ? 'Admin' : 'Member'}</span>
            {person.status === 'invited' && <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">Invite not accepted yet</span>}
            {person.role === 'admin' ? <span className="text-slate-500">All WhatsApp accounts</span> : <span className="text-slate-500">{names.length ? names.join(', ') : 'No WhatsApp account yet'}</span>}
          </div>
        </div>
        {canManage && !editing && (
          <div className="flex items-center gap-1.5">
            {person.invite_link && (
              <button type="button" onClick={() => copyText(person.invite_link).then(() => notify('Invite link copied.')).catch((error) => notify(error.message, 'error'))} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Copy className="h-3.5 w-3.5" />Copy invite</button>
            )}
            <button type="button" onClick={() => setEditing(true)} className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Change access</button>
            <button type="button" onClick={remove} disabled={busy} aria-label="Remove from team" className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>
          </div>
        )}
      </div>
      {editing && (
        <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
          <div className="flex flex-wrap gap-2">
            {['member', 'admin'].map((value) => (
              <label key={value} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold ${role === value ? 'border-[#28A745] bg-green-50 text-[#1f8d3d]' : 'border-slate-200 text-slate-600'} ${!isOwner ? 'pointer-events-none opacity-50' : ''}`}>
                <input type="radio" name={`role-${person.id}`} className="accent-[#28A745]" checked={role === value} onChange={() => setRole(value)} disabled={!isOwner} />
                {value === 'admin' ? 'Admin' : 'Member'}
              </label>
            ))}
          </div>
          <p className="text-xs text-slate-500">{ROLE_TEXT[role]}</p>
          {role === 'member' && <AccountChecks accounts={accounts} value={accountIds} onChange={setAccountIds} disabled={busy} />}
          <div className="flex gap-2">
            <button type="button" onClick={save} disabled={busy} className="flex items-center gap-1.5 rounded-xl bg-[#28A745] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}Save</button>
            <button type="button" onClick={() => { setEditing(false); setRole(person.role); setAccountIds(person.account_ids || []); }} className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// The people who can open this business and which WhatsApp accounts each one manages. Owners and admins only.
export default function TeamPage() {
  const { accounts, isAdmin, role, businessId } = useAccount();
  const { toast, showToast } = useToast();
  const [team, setTeam] = useState({ owner: null, members: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isOwner = role === 'owner';

  const load = useCallback(async () => {
    try {
      const result = await fetchTeam(businessId);
      setTeam({ owner: result.owner || null, members: result.members || [] });
      setError('');
    } catch (loadError) {
      setError(loadError.message || 'Could not load the team.');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    if (!isAdmin) return undefined;
    let active = true;
    Promise.resolve().then(() => { if (active) load(); });
    return () => { active = false; };
  }, [isAdmin, load]);

  if (!isAdmin) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center">
        <div className="max-w-sm">
          <h1 className="text-lg font-bold text-slate-900">Team</h1>
          <p className="mt-1 text-sm text-slate-500">Only the business owner or an admin can manage the team.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
      <Toast toast={toast} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-10 pt-3 md:px-6">
        <h1 className="text-xl font-bold text-slate-900">Team</h1>
        <p className="mt-0.5 text-sm text-slate-500">Owners and admins manage every WhatsApp account. Members only see the accounts you give them, for example one shop's number.</p>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <InviteForm accounts={accounts} isOwner={isOwner} businessId={businessId} onInvited={load} notify={showToast} />

          <div className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900">People with access</h2>
            {team.owner?.email && (
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#28A745]/10 text-[#28A745]"><Crown className="h-4 w-4" /></span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{team.owner.email}</p>
                  <p className="text-xs text-slate-500">Owner. All WhatsApp accounts.</p>
                </div>
              </div>
            )}
            {loading && <p className="flex items-center gap-2 py-4 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Loading the team...</p>}
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
                <button type="button" onClick={load} className="ml-2 font-semibold underline">Try again</button>
              </div>
            )}
            {!loading && !error && team.members.length === 0 && <p className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">Nobody else yet. Invite someone to help with your chats.</p>}
            {team.members.map((person) => (
              <PersonRow key={`${person.id}-${person.role}-${(person.account_ids || []).join(',')}`} person={person} accounts={accounts} isOwner={isOwner} businessId={businessId} onChanged={load} notify={showToast} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
