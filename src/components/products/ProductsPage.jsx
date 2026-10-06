import { useCallback, useMemo, useState } from 'react';
import { Check, EyeOff, Eye, FileUp, LayoutGrid, List as ListIcon, Loader2, Plus, ScanSearch, Search, Tags, Trash2, Undo2, X } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { useProducts } from '../../hooks/useProducts';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../preferences/shared/Toast';
import { uploadProductImage } from '../../services/productsService';
import { confidenceLabel, isActiveForAi, parsePrice } from '../../utils/productHelpers';
import ProductCard from './ProductCard';
import ProductRow from './ProductRow';
import ProductDrawer from './ProductDrawer';
import ImportModal from './ImportModal';
import { inputClass } from './shared';

const VIEW_KEY = 'heysasa_products_view';
const readView = () => { try { return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid'; } catch { return 'grid'; } };

const SORTS = {
  active: [['recent', 'Newest first'], ['name', 'Name A to Z'], ['price-high', 'Price high to low'], ['price-low', 'Price low to high']],
  discovered: [['mentions', 'Most mentioned'], ['confidence', 'Most likely yours'], ['name', 'Name A to Z'], ['recent', 'Newest first']],
};

function comparator(sort) {
  const price = (p) => (p.price == null ? null : Number(p.price));
  switch (sort) {
    case 'name': return (a, b) => a.title.localeCompare(b.title);
    case 'price-high': return (a, b) => (price(b) ?? -1) - (price(a) ?? -1);
    case 'price-low': return (a, b) => (price(a) ?? Infinity) - (price(b) ?? Infinity);
    case 'mentions': return (a, b) => (b.mention_count || 0) - (a.mention_count || 0) || a.title.localeCompare(b.title);
    case 'confidence': return (a, b) => (Number(b.discovery_confidence) || 0) - (Number(a.discovery_confidence) || 0);
    default: return (a, b) => new Date(b.discovered_at || b.created_at || 0) - new Date(a.discovered_at || a.created_at || 0);
  }
}

function Tab({ active, onClick, children, count, hot }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm max-md:py-2.5 font-semibold transition ${active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
    >
      {children}
      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${hot && count > 0 ? 'bg-[#FF8C00] text-white' : 'bg-slate-200/80 text-slate-600'}`}>{count}</span>
    </button>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs max-md:px-3.5 max-md:py-2 max-md:text-[13px] font-semibold transition ${active ? 'bg-[#28A745] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
    >
      {children}
    </button>
  );
}

function ScanBanner({ discovery, onScan, scanning }) {
  const run = discovery.run;
  const running = discovery.state === 'running';
  const pct = running && run?.progress_total ? Math.min(100, Math.round((run.progress_done / run.progress_total) * 100)) : null;
  let message = 'Your chats are scanned for products you sell, including the photos you sent customers. Found items wait here until you approve them.';
  if (running) message = `Scanning your chats${run?.phase ? `, ${String(run.phase).replace(/_/g, ' ')}` : ''}. This can take a few minutes; you can leave this page.`;
  else if (discovery.state === 'insufficient_data') message = 'There are no analysed customer chats yet. Run the chat analysis first, then scan again.';
  else if (discovery.state === 'failed') message = 'The last scan did not finish. Try again in a few minutes.';
  else if (discovery.state === 'ready' && run?.finished_at) message = `Last scanned ${new Date(run.finished_at).toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}. Only new messages and photos are read each time.`;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#28A745]/20 bg-[#28A745]/5 p-3.5 sm:flex-row sm:items-center">
      <p className="flex-1 text-sm leading-snug text-slate-700">{message}</p>
      {pct !== null && <div className="h-1.5 w-full overflow-hidden rounded-full bg-white sm:w-32"><div className="h-full bg-[#28A745] transition-all" style={{ width: `${Math.max(4, pct)}%` }} /></div>}
      <button type="button" onClick={onScan} disabled={running || scanning} className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#28A745] px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-[#23913d] disabled:opacity-60">
        {running || scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
        {running ? 'Scanning' : 'Scan chats for products'}
      </button>
    </div>
  );
}

export default function ProductsPage() {
  const { activeBusinessId } = useAuth();
  const store = useProducts(activeBusinessId);
  const { products, loading, error, currency, categories } = store;
  const { toast, showToast } = useToast();

  const [tab, setTab] = useState('active');
  const [showDismissed, setShowDismissed] = useState(false);
  const [view, setViewState] = useState(readView);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [aiFilter, setAiFilter] = useState('all');
  const [sort, setSort] = useState('recent');
  const [group, setGroup] = useState(true);
  const [selected, setSelected] = useState(() => new Set());
  const [drawer, setDrawer] = useState({ open: false, id: null });
  const [importOpen, setImportOpen] = useState(false);
  const [catPrompt, setCatPrompt] = useState(null);
  const [scanning, setScanning] = useState(false);

  const setView = (v) => { setViewState(v); try { localStorage.setItem(VIEW_KEY, v); } catch { /* storage unavailable */ } };

  const counts = useMemo(() => ({
    active: products.filter((p) => p.status === 'approved').length,
    discovered: products.filter((p) => p.status === 'discovered').length,
    dismissed: products.filter((p) => p.status === 'dismissed').length,
  }), [products]);

  const status = tab === 'active' ? 'approved' : showDismissed ? 'dismissed' : 'discovered';
  const completedScanStates = ['ready', 'completed', 'complete', 'succeeded'];
  const scanComplete = counts.discovered > 0
    || (store.discovery.state !== 'running'
      && store.discovery.state !== 'failed'
      && completedScanStates.includes(store.discovery.state));

  const changeTab = (next) => {
    setTab(next); setSelected(new Set()); setCategory('all'); setAiFilter('all'); setShowDismissed(false);
    setSort(next === 'discovered' ? 'mentions' : 'recent');
  };

  const inTab = useMemo(() => products.filter((p) => p.status === status), [products, status]);
  const tabCategories = useMemo(() => {
    const map = new Map();
    let none = 0;
    for (const p of inTab) { if (p.category) map.set(p.category, (map.get(p.category) || 0) + 1); else none++; }
    return { list: [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])), none };
  }, [inTab]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inTab
      .filter((p) => !q || p.title.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q) || (p.aliases || []).some((a) => a.toLowerCase().includes(q)))
      .filter((p) => category === 'all' || (category === '__none' ? !p.category : p.category === category))
      .filter((p) => tab !== 'active' || aiFilter === 'all' || (aiFilter === 'on' ? isActiveForAi(p) : !isActiveForAi(p)))
      .sort(comparator(sort));
  }, [inTab, search, category, aiFilter, sort, tab]);

  const sections = useMemo(() => {
    if (!group || search.trim() || category !== 'all') return [{ name: null, items: shown }];
    const map = new Map();
    for (const p of shown) { const key = p.category || ''; if (!map.has(key)) map.set(key, []); map.get(key).push(p); }
    if (map.size <= 1 && map.has('')) return [{ name: null, items: shown }];
    return [...map.entries()]
      .sort(([a, la], [b, lb]) => (a === '' ? 1 : b === '' ? -1 : lb.length - la.length || a.localeCompare(b)))
      .map(([name, items]) => ({ name: name || 'No category yet', items }));
  }, [shown, group, search, category]);

  const toggleSelect = useCallback((id) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; }), []);
  const selectedIds = useMemo(() => shown.filter((p) => selected.has(p.id)).map((p) => p.id), [shown, selected]);
  const allSelected = shown.length > 0 && selectedIds.length === shown.length;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(shown.map((p) => p.id)));
  const selectGroup = (items) => setSelected((s) => { const n = new Set(s); const every = items.every((p) => n.has(p.id)); items.forEach((p) => (every ? n.delete(p.id) : n.add(p.id))); return n; });
  const readyOnes = useMemo(() => shown.filter((p) => p.status === 'discovered' && p.price != null && (confidenceLabel(p.discovery_confidence)?.tone !== 'low')), [shown]);

  const notify = showToast;
  const act = useCallback(async (work, done) => {
    try { await work(); if (done) showToast(done); } catch (e) { showToast(e.message || 'That did not save. Try again.', 'error'); }
  }, [showToast]);

  const word = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  const onApprove = (p) => act(() => store.approve([p.id]), `Approved ${p.title}. The AI can use it now.`);
  const onDismiss = (p) => act(() => store.dismiss([p.id]), `Dismissed ${p.title}.`);
  const onRestore = (p) => act(() => store.restore([p.id]), `${p.title} is back in Discovered.`);
  const onToggleAi = (p) => act(() => store.setAi([p.id], !isActiveForAi(p)));
  const onAddPhoto = async (p, file) => { await act(() => store.addPhoto(p, file), 'Photo added.'); };
  const onInlineSave = async (product, field, value) => {
    try {
      let edits;
      if (field === 'name') {
        if (!value.trim()) throw new Error('A product needs a name.');
        edits = { title: value };
      } else {
        const price = parsePrice(value);
        if (value.trim() && price === null) throw new Error('The price is not a number. Use digits such as 2500.');
        edits = { price };
      }
      await store.save(product, edits);
      showToast('Changes saved.');
      return true;
    } catch (e) {
      showToast(e.message || 'That did not save. Try again.', 'error');
      return false;
    }
  };

  const bulk = {
    approve: () => act(async () => { await store.approve(selectedIds); setSelected(new Set()); }, `Approved ${word(selectedIds.length, 'product', 'products')}.`),
    dismiss: () => act(async () => { await store.dismiss(selectedIds); setSelected(new Set()); }, `Dismissed ${word(selectedIds.length, 'product', 'products')}.`),
    restore: () => act(async () => { await store.restore(selectedIds); setSelected(new Set()); }, `Brought back ${word(selectedIds.length, 'product', 'products')}.`),
    ai: (on) => act(async () => { await store.setAi(selectedIds, on); setSelected(new Set()); }, on ? 'Switched on for the AI.' : 'Hidden from the AI.'),
    remove: () => {
      if (!window.confirm(`Delete ${word(selectedIds.length, 'product', 'products')} for good? This cannot be undone.`)) return;
      act(async () => { await store.remove(selectedIds); setSelected(new Set()); }, 'Deleted.');
    },
    category: () => act(async () => { await store.setCategory(selectedIds, catPrompt.value); setCatPrompt(null); setSelected(new Set()); }, 'Category updated.'),
  };

  const drawerProduct = drawer.id ? products.find((p) => p.id === drawer.id) || null : null;
  // a product that was deleted or dismissed away while open simply closes the drawer
  const drawerOpen = drawer.open && (!drawer.id || Boolean(drawerProduct));
  const openProduct = (p) => setDrawer({ open: true, id: p.id });

  const scan = async () => {
    setScanning(true);
    try {
      const result = await store.scanChats();
      showToast(result?.alreadyRunning ? 'A scan is already running.' : 'Scan started.');
    } catch (e) { showToast(e.message, 'error'); } finally { setScanning(false); }
  };

  const cardProps = (p) => ({
    product: p, currency, selected: selected.has(p.id), selectMode: selectedIds.length > 0,
    onSelect: toggleSelect, onOpen: openProduct, onInlineSave, onToggleAi, onAddPhoto, onApprove, onDismiss, onRestore,
  });

  const renderItems = (items) => (view === 'grid' ? (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {items.map((p) => <ProductCard key={p.id} {...cardProps(p)} />)}
    </div>
  ) : (
    <div className="space-y-2">{items.map((p) => <ProductRow key={p.id} {...cardProps(p)} />)}</div>
  ));

  const emptyState = () => {
    if (tab === 'active' && counts.active === 0) {
      return (
        <div className="mx-auto max-w-md py-16 text-center">
          <h2 className="text-lg font-bold text-slate-900">No products yet</h2>
          <p className="mt-1 text-sm text-slate-500">The AI can only talk about products that are here. Add one, upload your list, or let HeySasa find them in your chats.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => setDrawer({ open: true, id: null })} className="rounded-xl bg-[#28A745] px-4 py-2 text-sm font-semibold text-white hover:bg-[#23913d]">Add a product</button>
            <button type="button" onClick={() => setImportOpen(true)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Upload a list</button>
            <button type="button" onClick={() => changeTab('discovered')} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">See what we found</button>
          </div>
        </div>
      );
    }
    if (tab === 'discovered' && inTab.length === 0) {
      return (
        <div className="mx-auto max-w-md py-12 text-center">
          <h2 className="text-lg font-bold text-slate-900">{showDismissed ? 'Nothing dismissed' : 'Nothing waiting for review'}</h2>
          <p className="mt-1 text-sm text-slate-500">{showDismissed ? 'Products you dismiss show up here so you can bring them back.' : 'New products found in your chats and photos will appear here.'}</p>
        </div>
      );
    }
    return <div className="py-12 text-center text-sm text-slate-500">No products match these filters.</div>;
  };

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
      <Toast toast={toast} />

      <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="shrink-0 space-y-3 px-4 pb-3 pt-3 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Products</h1>
            <p className="mt-0.5 text-sm text-slate-500">The AI only talks about products you approve here.</p>
          </div>
          <div className="flex items-center gap-2 max-md:w-full max-md:justify-between">
            <div className="flex rounded-xl bg-slate-100 p-1" role="group" aria-label="Choose how products are shown">
              <button type="button" onClick={() => setView('grid')} aria-pressed={view === 'grid'} aria-label="Photo grid" className={`flex h-8 w-8 max-md:h-10 max-md:w-10 items-center justify-center rounded-lg transition ${view === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid className="h-4 w-4" /></button>
              <button type="button" onClick={() => setView('list')} aria-pressed={view === 'list'} aria-label="List" className={`flex h-8 w-8 max-md:h-10 max-md:w-10 items-center justify-center rounded-lg transition ${view === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><ListIcon className="h-4 w-4" /></button>
            </div>
            {tab === 'discovered' && scanComplete && (
              <button type="button" onClick={scan} disabled={scanning} className="flex items-center gap-1.5 rounded-xl border border-[#28A745]/30 bg-white px-3 py-2 text-sm font-semibold text-[#1f8d3d] transition hover:bg-[#28A745]/5 disabled:opacity-60">
                {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
                <span className="hidden sm:inline">Scan chats</span>
              </button>
            )}
            <button type="button" onClick={() => setImportOpen(true)} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"><FileUp className="h-4 w-4" /> <span className="hidden sm:inline">Import</span></button>
            <button type="button" onClick={() => setDrawer({ open: true, id: null })} className="flex items-center gap-1.5 rounded-xl bg-[#28A745] px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#28A745]/20 transition hover:bg-[#23913d]"><Plus className="h-4 w-4" /> Add product</button>
          </div>
        </div>

        <div className="flex w-fit rounded-2xl bg-slate-100 p-1">
          <Tab active={tab === 'active'} onClick={() => changeTab('active')} count={counts.active}>Active</Tab>
          <Tab active={tab === 'discovered'} onClick={() => changeTab('discovered')} count={counts.discovered} hot>Discovered</Tab>
        </div>

        {tab === 'discovered' && !scanComplete && <ScanBanner discovery={store.discovery} onScan={scan} scanning={scanning} />}

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className={`${inputClass} pl-9`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products" aria-label="Search products" />
          </div>
          {tab === 'active' && (
            <select className={`${inputClass} w-auto!`} value={aiFilter} onChange={(e) => setAiFilter(e.target.value)} aria-label="Filter by AI status">
              <option value="all">All products</option>
              <option value="on">Active for AI</option>
              <option value="off">Hidden from AI</option>
            </select>
          )}
          <select className={`${inputClass} w-auto!`} value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort products">
            {SORTS[tab].map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-600">
            <input type="checkbox" className="h-4 w-4 accent-[#28A745]" checked={group} onChange={(e) => setGroup(e.target.checked)} /> Group by category
          </label>
          {tab === 'discovered' && counts.dismissed > 0 && (
            <button type="button" onClick={() => { setShowDismissed((v) => !v); setSelected(new Set()); }} className="ml-auto text-xs font-semibold text-slate-500 hover:text-slate-800">
              {showDismissed ? 'Back to Discovered' : `Dismissed (${counts.dismissed})`}
            </button>
          )}
        </div>

        {(tabCategories.list.length > 0) && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Chip active={category === 'all'} onClick={() => setCategory('all')}>All {inTab.length}</Chip>
            {tabCategories.list.map(([name, count]) => <Chip key={name} active={category === name} onClick={() => setCategory(name)}>{name} {count}</Chip>)}
            {tabCategories.none > 0 && <Chip active={category === '__none'} onClick={() => setCategory('__none')}>No category {tabCategories.none}</Chip>}
          </div>
        )}

        {shown.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <label className="flex cursor-pointer items-center gap-2 font-semibold text-slate-600">
              <input type="checkbox" className="h-4 w-4 accent-[#28A745]" checked={allSelected} onChange={toggleAll} /> Select all {shown.length}
            </label>
            {tab === 'discovered' && !showDismissed && readyOnes.length > 0 && (
              <button type="button" onClick={() => setSelected(new Set(readyOnes.map((p) => p.id)))} className="font-semibold text-[#1f8d3d] hover:underline">
                Select the {readyOnes.length} that have a price
              </button>
            )}
          </div>
        )}
      </div>

      <div className="px-4 pb-28 md:px-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }, (_, i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-slate-100" />)}
          </div>
        ) : error ? (
          <div className="mx-auto max-w-md py-16 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button type="button" onClick={store.reload} className="mt-3 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Try again</button>
          </div>
        ) : shown.length === 0 ? emptyState() : (
          <div className="space-y-7">
            {sections.map((s) => (
              <section key={s.name || 'all'}>
                {s.name && (
                  <div className="mb-3 flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900">{s.name}</h2>
                    <span className="text-xs text-slate-400">{s.items.length}</span>
                    <button type="button" onClick={() => selectGroup(s.items)} className="text-xs font-semibold text-slate-400 hover:text-[#1f8d3d]">Select group</button>
                  </div>
                )}
                {renderItems(s.items)}
              </section>
            ))}
          </div>
        )}
      </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="absolute inset-x-3 bottom-3 max-md:m-rise z-20 mx-auto flex max-w-3xl flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 px-3 py-2.5 shadow-2xl backdrop-blur md:bottom-4">
          <span className="px-1 text-sm font-semibold text-slate-800">{selectedIds.length} selected</span>
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            {catPrompt ? (
              <form className="flex items-center gap-1.5" onSubmit={(e) => { e.preventDefault(); bulk.category(); }}>
                <input autoFocus list="bulk-categories" className={`${inputClass} w-44 py-1.5`} value={catPrompt.value} onChange={(e) => setCatPrompt({ value: e.target.value })} placeholder="Category name" maxLength={40} aria-label="Category name" />
                <datalist id="bulk-categories">{categories.map((c) => <option key={c.name} value={c.name} />)}</datalist>
                <button type="submit" className="rounded-xl bg-[#28A745] px-3 py-1.5 text-xs max-md:py-2.5 max-md:text-[13px] font-semibold text-white">Apply</button>
                <button type="button" onClick={() => setCatPrompt(null)} aria-label="Cancel" className="flex h-8 w-8 max-md:h-11 max-md:w-11 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
              </form>
            ) : (
              <>
                {status === 'discovered' && (
                  <>
                    <button type="button" onClick={bulk.approve} className="flex items-center gap-1.5 rounded-xl bg-[#28A745] px-3 py-1.5 text-xs max-md:py-2.5 max-md:text-[13px] font-semibold text-white hover:bg-[#23913d]"><Check className="h-3.5 w-3.5" /> Approve</button>
                    <button type="button" onClick={bulk.dismiss} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs max-md:py-2.5 max-md:text-[13px] font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600"><X className="h-3.5 w-3.5" /> Dismiss</button>
                  </>
                )}
                {status === 'approved' && (
                  <>
                    <button type="button" onClick={() => bulk.ai(true)} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs max-md:py-2.5 max-md:text-[13px] font-semibold text-slate-700 hover:bg-slate-50"><Eye className="h-3.5 w-3.5 text-[#28A745]" /> AI on</button>
                    <button type="button" onClick={() => bulk.ai(false)} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs max-md:py-2.5 max-md:text-[13px] font-semibold text-slate-700 hover:bg-slate-50"><EyeOff className="h-3.5 w-3.5" /> AI off</button>
                  </>
                )}
                {status === 'dismissed' && (
                  <button type="button" onClick={bulk.restore} className="flex items-center gap-1.5 rounded-xl bg-[#28A745] px-3 py-1.5 text-xs max-md:py-2.5 max-md:text-[13px] font-semibold text-white"><Undo2 className="h-3.5 w-3.5" /> Bring back</button>
                )}
                {status !== 'dismissed' && (
                  <button type="button" onClick={() => setCatPrompt({ value: '' })} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs max-md:py-2.5 max-md:text-[13px] font-semibold text-slate-700 hover:bg-slate-50"><Tags className="h-3.5 w-3.5" /> Category</button>
                )}
                {status === 'approved' && (
                  <button type="button" onClick={bulk.remove} aria-label="Delete selected" className="flex h-8 w-8 max-md:h-11 max-md:w-11 items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                )}
                <button type="button" onClick={() => setSelected(new Set())} className="rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100">Clear</button>
              </>
            )}
          </div>
        </div>
      )}

      {drawerOpen && <ProductDrawer
        key={drawer.id || 'new'}
        product={drawerProduct}
        currency={currency}
        categories={categories}
        uploadImage={(file, id) => uploadProductImage(activeBusinessId, id, file)}
        onClose={() => setDrawer({ open: false, id: null })}
        onSave={store.save}
        onCreate={store.create}
        onApprove={(p) => store.approve([p.id])}
        onDismiss={(p) => store.dismiss([p.id])}
        onRestore={(p) => store.restore([p.id])}
        onDelete={(p) => store.remove([p.id])}
        notify={notify}
      />}

      {importOpen && <ImportModal
        existing={products}
        currency={currency}
        onClose={() => setImportOpen(false)}
        onImport={async (rows, format) => {
          const result = await store.importRows(rows, format);
          setImportOpen(false);
          showToast(`Imported: ${result.added} added, ${result.updated} updated.`);
          if (result.promoted) setTab('active');
        }}
      />}
    </div>
  );
}
