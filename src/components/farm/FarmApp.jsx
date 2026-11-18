/* eslint-disable */
import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useParams } from '@/lib/router-compat';
import { useAuth } from '@/components/auth/AuthContext';
import logoImg from '@/assets/batloung-logo.png';
import basketImg from '@/assets/fruit-basket.jpg';
import bannerImg from '@/assets/fruit-banner.jpg';
import appleImg from '@/assets/fruit-apple.png';
import bananaImg from '@/assets/fruit-banana.png';
import orangeImg from '@/assets/fruit-orange.png';
import mangoImg from '@/assets/fruit-mango.png';
import grapesImg from '@/assets/fruit-grapes.png';
import pearImg from '@/assets/fruit-pear.svg';

const fruitImages = [[/apple/i, appleImg], [/banana/i, bananaImg], [/orange/i, orangeImg], [/mango/i, mangoImg], [/grape/i, grapesImg], [/pear/i, pearImg]];
export function fruitImage(name) { return fruitImages.find(([re]) => re.test(name))?.[1]; }
function FruitIcon({ name }) {
  const src = fruitImage(name);
  return src ? <img className="fruit-img" src={src} alt="" width={36} height={36} loading="lazy" /> : <span className="fruit-letter">{name.slice(0, 1).toUpperCase()}</span>;
}
function BrandBanner() {
  return <div className="brand-banner" style={{ backgroundImage: `url(${bannerImg})` }}><img src={logoImg} alt="" width={64} height={64} /><div><h2>Batloung Farm Distribution System</h2><p>Fresh Produce. Better Distribution. A Healthier Lesotho.</p></div><span className="location-pill"><MapPin size={16} /> Maseru, Lesotho</span></div>;
}
import {
  Activity as ActivityIcon, AlertTriangle, ArrowDownLeft, ArrowLeft, ArrowRight,
  Boxes, ChartNoAxesCombined, ChevronDown, CircleDollarSign, FileBarChart,
  Flower2, Leaf, LoaderCircle, MapPin, Menu,
  Package, Plus, Search, ShoppingBag, ShoppingCart, Sprout, Store, Truck, Users,
  Wallet, X, Pencil, Trash2, CalendarDays, Phone, RotateCcw,
  LogOut, Settings, User, ChevronDown as ChevronDownIcon,
} from 'lucide-react';
import {
  useHealthCheck, useGetDashboardSummary, getGetDashboardSummaryQueryKey,
  useGetDashboardActivity, getGetDashboardActivityQueryKey,
  useListSuppliers, getListSuppliersQueryKey, useCreateSupplier, useGetSupplier,
  getGetSupplierQueryKey, useUpdateSupplier, useDeleteSupplier,
  useListFruits, getListFruitsQueryKey, useCreateFruit, useGetFruit, getGetFruitQueryKey,
  useUpdateFruit, useListStock, getListStockQueryKey, useListLowStock,
  getListLowStockQueryKey, useListVendors, getListVendorsQueryKey, useCreateVendor,
  useListVendorBalances, getListVendorBalancesQueryKey, useGetVendor, getGetVendorQueryKey,
  useUpdateVendor, useListPurchases, getListPurchasesQueryKey, useCreatePurchase,
  useListSales, getListSalesQueryKey, useCreateSale, useAddSalePayment,
  useGetTopFruitsReport, getGetTopFruitsReportQueryKey, useGetRevenueReport,
  getGetRevenueReportQueryKey, useGetTopVendorReport, getGetTopVendorReportQueryKey,
  useGetStockReport, getGetStockReportQueryKey,
} from '@/lib/api';
import { PackagingSize, PaymentMethod, FruitStatus } from '@/lib/api';

const packaging = [PackagingSize.SMALL, PackagingSize.MEDIUM, PackagingSize.LARGE];
const currency = (value) => `M ${Number(value || 0).toLocaleString('en-LS', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateText = (value) => value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const today = () => new Date().toISOString().slice(0, 10);
const readable = (s) => s.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

function Mark({ small = false }) {
  return <div className={`brand-mark ${small ? 'brand-mark-small' : ''}`}><img src={logoImg} alt="Batloung Farm logo" width={small ? 30 : 40} height={small ? 30 : 40} /></div>;
}
function Pill({ children, tone = 'green' }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}
function Button({ children, onClick, variant = 'primary', disabled, type = 'button', className = '', testId }) {
  return <button type={type} onClick={onClick} disabled={disabled} data-testid={testId} className={`btn btn-${variant} ${className}`}>
    {disabled && type === 'submit' ? <LoaderCircle size={15} className="spin" /> : null}{children}
  </button>;
}
function Input({ label, value, onChange, placeholder, type = 'text', required = false, min, max, step, error }) {
  return <label className="field"><span>{label}{required && <i> *</i>}</span><input data-testid={`input-${label.toLowerCase().replaceAll(' ', '-')}`} type={type} value={value} min={min} max={max} step={step} required={required} placeholder={placeholder} onChange={e => onChange(e.target.value)} />{error && <small className="field-error">{error}</small>}</label>;
}
function SelectField({ label, value, onChange, options, required = false }) {
  return <label className="field"><span>{label}{required && <i> *</i>}</span><div className="select-wrap"><select data-testid={`select-${label.toLowerCase().replaceAll(' ', '-')}`} value={value} onChange={e => onChange(e.target.value)} required={required}>{options.map(o => <option value={o.value} key={o.value}>{o.label}</option>)}</select><ChevronDown size={15} /></div></label>;
}
function Modal({ title, subtitle, onClose, children, wide = false }) {
  return <div className="modal-shade" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <section className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
      <header className="modal-head"><div><p className="eyebrow">Batloung Farm</p><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button aria-label="Close dialog" className="icon-btn" onClick={onClose}><X size={19} /></button></header>
      {children}
    </section>
  </div>;
}
function PageTitle({ eyebrow, title, detail, action }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{detail && <p>{detail}</p>}</div>{action && <div className="heading-action">{action}</div>}</div>;
}
function ErrorState({ message = 'We could not load this information.', retry }) {
  return <div className="state-panel error-state"><AlertTriangle size={20} /><div><strong>Something needs another try</strong><p>{message}</p></div>{retry && <Button variant="secondary" onClick={retry}><RotateCcw size={15} /> Retry</Button>}</div>;
}
function LoadingRows() { return <div className="loading-stack">{[1, 2, 3, 4].map(n => <div className="skeleton-row" key={n}><i /><i /><i /></div>)}</div>; }
function EmptyState({ title, body, action }) {
  return <div className="empty-state"><div className="empty-illustration"><Package size={23} /></div><strong>{title}</strong><p>{body}</p>{action}</div>;
}
function TableFrame({ children }) { return <div className="panel table-wrap"><table>{children}</table></div>; }
function SearchBox({ value, onChange, placeholder = 'Search records...' }) {
  return <div className="search-box"><Search size={17} /><input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} data-testid="input-search" /></div>;
}

const navGroups = [
  { label: 'OVERVIEW', links: [{ href: '/', label: 'Dashboard', icon: ChartNoAxesCombined }] },
  { label: 'OPERATIONS', links: [
    { href: '/suppliers', label: 'Suppliers', icon: Truck },
    { href: '/fruits', label: 'Fruits', icon: Flower2 },
    { href: '/stock', label: 'Stock', icon: Boxes },
    { href: '/vendors', label: 'Vendors', icon: Store },
  ] },
  { label: 'MOVEMENT', links: [
    { href: '/purchases', label: 'Purchases', icon: ArrowDownLeft },
    { href: '/sales', label: 'Sales', icon: ShoppingCart },
  ] },
  { label: 'INSIGHT', links: [
    { href: '/reports', label: 'Reports', icon: FileBarChart },
  ] },
];
export function Shell({ children }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const health = useHealthCheck();
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    window.location.href = '/';
  };

  const userInitial = user?.fullName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'A';
  const userName = user?.fullName || user?.email || 'Admin';
  const userRole = user?.role || 'Farm operations';

  return <div className="app-shell grain">
    <aside className={`app-sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
      <Link href="/" className="brand-link" onClick={() => setMobileOpen(false)}><Mark /><div><strong>Batloung Farm</strong><span>Distribution System</span></div></Link>
      <div className="sidebar-context"><span className="live-dot" />Maseru · Lesotho</div>
      <nav className="side-nav">{navGroups.map(group => <div className="nav-group" key={group.label}><div className="nav-label">{group.label}</div>{group.links.map(item => {
        const Icon = item.icon; const active = location === item.href || (item.href !== '/' && location.startsWith(item.href + '/'));
        return <Link data-testid={`link-nav-${item.label.toLowerCase()}`} className={`nav-link ${active ? 'nav-active' : ''}`} key={item.href} href={item.href} onClick={() => setMobileOpen(false)}><Icon size={17} strokeWidth={1.8} /><span>{item.label}</span>{item.label === 'Stock' && <span className="nav-arrow">›</span>}</Link>;
      })}</div>)}</nav>
      <div className="sidebar-bottom"><div className="weather-note"><span className="weather-icon"><Leaf size={17} /></span><div><b>Fresh produce.</b><small>Better distribution.</small></div></div><div className="api-status"><span className={health.isError ? 'status-dot status-off' : 'status-dot'} />{health.isError ? 'Connection unavailable' : 'System connected'}</div><small className="copyright">Batloung Farm · Maseru</small></div>
    </aside>
    {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    <div className="main-column">
      <header className="topbar">
        <button className="mobile-menu icon-btn" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
        <div className="crumb"><span>Farm operations</span><span className="crumb-slash">/</span><strong>{navGroups.flatMap(g => g.links).find(x => x.href === location || (x.href !== '/' && location.startsWith(x.href + '/')))?.label ?? 'Dashboard'}</strong></div>
        <div className="topbar-right">
          <span className="today-chip"><CalendarDays size={15} />{new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
          <div className="user-menu">
            <button className="user-chip" onClick={() => setUserMenuOpen(!userMenuOpen)} aria-expanded={userMenuOpen} aria-haspopup="true">
              <span className="user-avatar">{userInitial}</span>
              <span><b>{userName}</b><small>{userRole}</small></span>
              <ChevronDownIcon size={14} className="user-chevron" />
            </button>
            {userMenuOpen && (
              <div className="user-dropdown">
                <div className="dropdown-header">
                  <span className="user-avatar large">{userInitial}</span>
                  <div>
                    <strong>{userName}</strong>
                    <small>{user?.email}</small>
                  </div>
                </div>
                <div className="dropdown-divider" />
                <button className="dropdown-item" onClick={() => { setUserMenuOpen(false); window.location.href = '/settings'; }}>
                  <Settings size={16} /> Settings
                </button>
                <button className="dropdown-item danger" onClick={handleLogout}>
                  <LogOut size={16} /> Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="main-content page-enter">{children}</main>
      <footer className="app-footer"><span>Fresh produce. Better distribution. A healthier Lesotho.</span><span>MASERU, LESOTHO <span className="footer-mark">·</span> <span className="mono">BF / 01</span></span></footer>
    </div>
  </div>;
}

export function Dashboard() {
  const summary = useGetDashboardSummary(); const activity = useGetDashboardActivity(); const stock = useListStock();
  const qc = useQueryClient();
  const totalStock = summary.data?.totalStockBoxes ?? 0;
  const fruitRows = useMemo(() => {
    const map = new Map();
    (stock.data ?? []).forEach(r => map.set(r.fruitName, (map.get(r.fruitName) ?? 0) + r.quantity));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [stock.data]);
  const max = Math.max(...fruitRows.map(x => x[1]), 1);
  const stats = [
    { label: 'Stock on hand', value: summary.data ? summary.data.totalStockBoxes.toLocaleString() : '—', unit: 'boxes', icon: Boxes, tone: 'forest', note: 'Across all package sizes' },
    { label: "Today's sales", value: summary.data ? currency(summary.data.todaysSales) : '—', unit: '', icon: CircleDollarSign, tone: 'gold', note: 'Recorded today' },
    { label: 'Outstanding', value: summary.data ? currency(summary.data.outstandingBalance) : '—', unit: '', icon: Wallet, tone: 'clay', note: 'Vendor balances' },
    { label: 'Active vendors', value: summary.data ? summary.data.activeVendors : '—', unit: 'vendors', icon: Users, tone: 'sage', note: `${summary.data?.lowStockCount ?? 0} stock alerts` },
  ];
  return <div>
    <BrandBanner />
    <PageTitle eyebrow="Operations overview · Maseru" title="Good morning, team." detail="Here's how the farm is moving today." action={<Link href="/sales" className="btn btn-primary"><Plus size={16} /> Record a sale</Link>} />
    {(summary.isError || activity.isError) && <ErrorState message="Dashboard data could not be reached. Check your connection and retry." retry={() => { qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); qc.invalidateQueries({ queryKey: getGetDashboardActivityQueryKey() }); }} />}
    <div className="stat-grid">{stats.map((stat, i) => { const Icon = stat.icon; return <article className={`stat-card stat-${stat.tone}`} key={stat.label} style={{ animationDelay: `${i * 45}ms` }}><div className="stat-top"><span>{stat.label}</span><span className="stat-icon"><Icon size={18} /></span></div><div className="stat-value">{stat.value}<small>{stat.unit}</small></div><div className="stat-note">{stat.note}</div></article>; })}</div>
    <div className="dashboard-grid">
      <section className="panel stock-chart-panel"><div className="panel-heading"><div><span className="eyebrow">Inventory snapshot</span><h2>Stock by fruit</h2></div><Link className="text-link" href="/stock">Full stock report <ArrowRight size={14} /></Link></div>
        {stock.isLoading ? <LoadingRows /> : stock.isError ? <ErrorState retry={() => stock.refetch()} /> : !fruitRows.length ? <EmptyState title="No stock records yet" body="Stock levels will appear here when purchases are recorded." action={<Link className="text-link" href="/purchases">Record a purchase <ArrowRight size={14} /></Link>} /> :
          <div className="bar-chart">{fruitRows.map(([name, quantity], i) => <div className="bar-column" key={name}><span className="bar-number">{quantity.toLocaleString()}</span><div className="bar-track"><div style={{ height: `${Math.max(8, quantity / max * 100)}%` }} className={`bar bar-${(['apple','banana','orange','mango','grape'].findIndex(k => name.toLowerCase().includes(k)) + 1) || i + 1}`} /></div><span className="bar-label">{name}</span></div>)}</div>}
        <div className="chart-footer"><span><i className="legend-mark" />Boxes currently in stock</span><span className="chart-total">{totalStock.toLocaleString()} <small>total</small></span></div>
      </section>
      <figure className="panel basket-panel"><img src={basketImg} alt="Basket of fresh apples, bananas, oranges, mangoes and grapes" width={640} height={640} loading="lazy" /></figure>
      <section className="panel quick-panel"><div className="panel-heading"><div><span className="eyebrow">Get it done</span><h2>Quick actions</h2></div><span className="quick-symbol"><ActivityIcon size={17} /></span></div><div className="quick-links">
        <Link href="/purchases" className="quick-link"><span className="quick-icon q-amber"><ArrowDownLeft size={18} /></span><span><b>Record purchase</b><small>Receive farm stock</small></span><ArrowRight size={15} /></Link>
        <Link href="/sales" className="quick-link"><span className="quick-icon q-green"><ShoppingBag size={18} /></span><span><b>Record sale</b><small>Sell to a vendor</small></span><ArrowRight size={15} /></Link>
        <Link href="/vendors" className="quick-link"><span className="quick-icon q-sage"><Users size={18} /></span><span><b>Manage vendors</b><small>View accounts &amp; balances</small></span><ArrowRight size={15} /></Link>
      </div><div className="low-stock-callout"><span className="callout-icon"><AlertTriangle size={17} /></span><div><b>{summary.data?.lowStockCount ?? '—'} low-stock alerts</b><small>Review items below threshold</small></div><Link href="/stock" aria-label="View low stock"><ArrowRight size={16} /></Link></div></section>
    </div>
    <section className="panel activity-panel"><div className="panel-heading"><div><span className="eyebrow">The latest from the farm</span><h2>Recent activity</h2></div><div className="activity-key"><span><i className="key-dot key-sale" />Sales</span><span><i className="key-dot key-purchase" />Purchases</span></div></div>
      {activity.isLoading ? <LoadingRows /> : activity.isError ? <ErrorState retry={() => activity.refetch()} /> : !activity.data?.length ? <EmptyState title="Nothing recorded yet" body="Purchases and sales will show here as your day gets underway." /> :
        <div className="activity-list">{activity.data.slice(0, 7).map((item, i) => <div className="activity-row" key={item.id} data-testid={`activity-row-${item.id}`}><span className={`activity-symbol ${item.type === 'SALE' ? 'activity-sale' : 'activity-purchase'}`}>{item.type === 'SALE' ? <ShoppingBag size={16} /> : <Package size={16} />}</span><div className="activity-main"><b>{item.title}</b><small>{item.description}</small></div><time>{dateText(item.date)}</time><strong className="activity-amount">{currency(item.amount)}</strong><Pill tone={item.type === 'SALE' ? 'green' : 'quiet'}>{readable(item.type)}</Pill></div>)}</div>}
    </section>
  </div>;
}

function SupplierEditor({ initial, onClose }) {
  const qc = useQueryClient(); const create = useCreateSupplier(); const update = useUpdateSupplier();
  const [form, setForm] = useState({ businessName: initial?.businessName ?? '', contactPerson: initial?.contactPerson ?? '', phone: initial?.phone ?? '', province: initial?.province ?? 'Gauteng', address: initial?.address ?? '' });
  const [error, setError] = useState('');
  const change = (key) => (v) => setForm(f => ({ ...f, [key]: v }));
  const submit = (e) => { e.preventDefault(); setError(''); const onSuccess = () => { qc.invalidateQueries({ queryKey: getListSuppliersQueryKey() }); if (initial?.id) qc.invalidateQueries({ queryKey: getGetSupplierQueryKey(initial.id) }); onClose(); }; const onError = () => setError('Could not save supplier. Check the details and try again.'); if (initial?.id) update.mutate({ id: initial.id, data: form }, { onSuccess, onError }); else create.mutate({ data: form }, { onSuccess, onError }); };
  const pending = create.isPending || update.isPending;
  return <Modal title={initial?.id ? 'Edit supplier' : 'Add a supplier'} subtitle="Keep your produce supply contacts up to date." onClose={onClose}><form className="form-body" onSubmit={submit}>
    <Input label="Business name" value={form.businessName} onChange={change('businessName')} required />
    <div className="form-two"><Input label="Contact person" value={form.contactPerson} onChange={change('contactPerson')} required /><Input label="Phone number" value={form.phone} onChange={change('phone')} required placeholder="+266 ..." /></div>
    <SelectField label="Province" value={form.province} onChange={v => setForm(f => ({ ...f, province: v }))} required options={[{ value: 'Gauteng', label: 'Gauteng' }, { value: 'Free State', label: 'Free State' }, { value: 'KwaZulu-Natal', label: 'KwaZulu-Natal' }, { value: 'Western Cape', label: 'Western Cape' }, { value: 'Eastern Cape', label: 'Eastern Cape' }, { value: 'Limpopo', label: 'Limpopo' }, { value: 'Mpumalanga', label: 'Mpumalanga' }, { value: 'North West', label: 'North West' }]} /><Input label="Address" value={form.address} onChange={change('address')} required />
    {error && <div className="form-error"><AlertTriangle size={15} />{error}</div>}<div className="modal-actions"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" disabled={pending}>{pending ? 'Saving…' : initial?.id ? 'Save changes' : 'Add supplier'}</Button></div>
  </form></Modal>;
}
export function Suppliers() {
  const qc = useQueryClient(); const q = useListSuppliers(); const remove = useDeleteSupplier(); const [search, setSearch] = useState(''); const [editor, setEditor] = useState(null);
  const filtered = (q.data ?? []).filter(x => `${x.businessName} ${x.contactPerson} ${x.province} ${x.phone}`.toLowerCase().includes(search.toLowerCase()));
  return <><PageTitle eyebrow="Supply network" title="Suppliers" detail="The people and businesses bringing fresh produce to the farm." action={<Button onClick={() => setEditor('new')}><Plus size={16} /> Add supplier</Button>} />
    <div className="toolbar"><SearchBox value={search} onChange={setSearch} placeholder="Search supplier or province" /><span className="record-count">{filtered.length} supplier{filtered.length === 1 ? '' : 's'}</span></div>
    {q.isLoading ? <LoadingRows /> : q.isError ? <ErrorState retry={() => q.refetch()} /> : !filtered.length ? <EmptyState title={search ? 'No matches found' : 'No suppliers added'} body={search ? 'Try a different business name or province.' : 'Add a supplier to start building your produce network.'} action={!search && <Button onClick={() => setEditor('new')}><Plus size={15} /> Add first supplier</Button>} /> :
      <TableFrame><thead><tr><th>Business</th><th>Contact person</th><th>Phone</th><th>Province</th><th>Address</th><th className="align-right">Actions</th></tr></thead><tbody>{filtered.map(s => <tr key={s.id} data-testid={`row-supplier-${s.id}`}><td><Link href={`/suppliers/${s.id}`} className="entity-link">{s.businessName}<small>Supplier record</small></Link></td><td>{s.contactPerson}</td><td className="mono">{s.phone}</td><td><Pill tone="quiet">{s.province}</Pill></td><td className="muted-cell">{s.address}</td><td className="align-right"><div className="row-actions"><Link className="icon-btn" title="View supplier" href={`/suppliers/${s.id}`}><ArrowRight size={16} /></Link><button className="icon-btn" title="Edit supplier" onClick={() => setEditor(s.id)}><Pencil size={15} /></button><button className="icon-btn danger-hover" title="Delete supplier" onClick={() => { if (window.confirm(`Remove ${s.businessName}?`)) remove.mutate({ id: s.id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getListSuppliersQueryKey() }), onError: () => window.alert('This supplier could not be removed. Suppliers with purchase history cannot be deleted.') }); }}><Trash2 size={15} /></button></div></td></tr>)}</tbody></TableFrame>}
    {editor && <SupplierEditor initial={editor === 'new' ? undefined : q.data?.find(s => s.id === editor)} onClose={() => setEditor(null)} />}
  </>;
}
export function SupplierDetail() {
  const { id: param } = useParams(); const id = Number(param); const q = useGetSupplier(id); const [editing, setEditing] = useState(false);
  return <><Link href="/suppliers" className="back-link"><ArrowLeft size={15} />All suppliers</Link>{q.isLoading ? <LoadingRows /> : q.isError || !q.data ? <ErrorState message="This supplier record could not be found." retry={() => q.refetch()} /> : <>
    <PageTitle eyebrow="Supplier record" title={q.data.businessName} detail={`Registered contact · ${q.data.province}`} action={<Button variant="secondary" onClick={() => setEditing(true)}><Pencil size={15} /> Edit supplier</Button>} />
    <div className="detail-hero"><div className="detail-avatar"><Truck size={24} /></div><div><span className="eyebrow">Supply partner</span><h2>{q.data.businessName}</h2><p>Contact person: <b>{q.data.contactPerson}</b></p></div><Pill tone="green">Active contact</Pill></div>
    <div className="detail-grid"><DetailItem icon={<Phone size={17} />} label="Phone number" value={q.data.phone} /><DetailItem icon={<MapPin size={17} />} label="Province" value={q.data.province} /><DetailItem icon={<MapPin size={17} />} label="Address" value={q.data.address} /></div>
    {editing && <SupplierEditor initial={q.data} onClose={() => setEditing(false)} />}
  </>}</>;
}
function DetailItem({ icon, label, value }) { return <div className="detail-item"><span className="detail-item-icon">{icon}</span><div><small>{label}</small><b>{value || '—'}</b></div></div>; }

function FruitEditor({ initial, onClose }) {
  const qc = useQueryClient(); const create = useCreateFruit(); const update = useUpdateFruit();
  const [form, setForm] = useState({ name: initial?.name ?? '', description: initial?.description ?? '', status: initial?.status ?? FruitStatus.ACTIVE, smallPrice: initial?.smallPrice ?? 0, mediumPrice: initial?.mediumPrice ?? 0, largePrice: initial?.largePrice ?? 0 });
  const [error, setError] = useState('');
  const submit = (e) => { e.preventDefault(); setError(''); const data = { ...form, smallPrice: Number(form.smallPrice), mediumPrice: Number(form.mediumPrice), largePrice: Number(form.largePrice) }; const onSuccess = () => { qc.invalidateQueries({ queryKey: getListFruitsQueryKey() }); if (initial?.id) qc.invalidateQueries({ queryKey: getGetFruitQueryKey(initial.id) }); qc.invalidateQueries({ queryKey: getGetStockReportQueryKey() }); onClose(); }; const onError = () => setError('Could not save fruit details. Please check the prices and try again.'); if (initial?.id) update.mutate({ id: initial.id, data }, { onSuccess, onError }); else create.mutate({ data }, { onSuccess, onError }); };
  const change = (key) => (v) => setForm(f => ({ ...f, [key]: key.endsWith('Price') ? Number(v) : v }));
  const pending = create.isPending || update.isPending;
  return <Modal title={initial?.id ? 'Edit fruit details' : 'Add fruit'} subtitle="Set the fruit identity, sales state, and package pricing." onClose={onClose}><form className="form-body" onSubmit={submit}>
    <Input label="Fruit name" value={form.name} onChange={change('name')} required /><Input label="Description" value={form.description} onChange={change('description')} />
    <SelectField label="Availability" value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))} options={[{ value: FruitStatus.ACTIVE, label: 'Active' }, { value: FruitStatus.INACTIVE, label: 'Inactive' }]} required />
    <div className="price-fields">{(['smallPrice', 'mediumPrice', 'largePrice']).map((key, i) => <Input key={key} label={`${packaging[i]} box · M`} type="number" min={0} step={0.01} value={form[key]} onChange={change(key)} required />)}</div>
    {error && <div className="form-error"><AlertTriangle size={15} />{error}</div>}<div className="modal-actions"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" disabled={pending}>{pending ? 'Saving…' : initial?.id ? 'Save changes' : 'Add fruit'}</Button></div>
  </form></Modal>;
}
export function Fruits() {
  const q = useListFruits(); const [search, setSearch] = useState(''); const [editing, setEditing] = useState(null); const [newOpen, setNewOpen] = useState(false);
  const rows = (q.data ?? []).filter(f => `${f.name} ${f.description}`.toLowerCase().includes(search.toLowerCase()));
  return <><PageTitle eyebrow="Catalogue & pricing" title="Fruit catalogue" detail="Manage the fruit range and the price for every package size." action={<Button onClick={() => setNewOpen(true)}><Plus size={16} /> Add fruit</Button>} />
    <div className="toolbar"><SearchBox value={search} onChange={setSearch} placeholder="Search fruit catalogue" /><span className="record-count">{rows.length} varieties</span></div>
    {q.isLoading ? <LoadingRows /> : q.isError ? <ErrorState retry={() => q.refetch()} /> : !rows.length ? <EmptyState title={search ? 'No fruit found' : 'Your catalogue is empty'} body="Add fruit varieties to price and track stock." action={!search && <Button onClick={() => setNewOpen(true)}><Plus size={15} /> Add fruit</Button>} /> :
      <TableFrame><thead><tr><th>Fruit</th><th>Small box</th><th>Medium box</th><th>Large box</th><th>Status</th><th className="align-right"> </th></tr></thead><tbody>{rows.map(f => <tr key={f.id} data-testid={`row-fruit-${f.id}`}><td><Link href={`/fruits/${f.id}`} className="entity-link fruit-name-cell"><FruitIcon name={f.name} /><span>{f.name}<small>{f.description || 'Fruit variety'}</small></span></Link></td><td className="price-cell">{currency(f.smallPrice)}</td><td className="price-cell">{currency(f.mediumPrice)}</td><td className="price-cell">{currency(f.largePrice)}</td><td><Pill tone={f.status === 'ACTIVE' ? 'green' : 'quiet'}>{readable(f.status)}</Pill></td><td className="align-right"><div className="row-actions"><Link className="icon-btn" href={`/fruits/${f.id}`} title="View fruit"><ArrowRight size={16} /></Link><button className="icon-btn" title="Edit fruit" onClick={() => setEditing(f)}><Pencil size={15} /></button></div></td></tr>)}</tbody></TableFrame>}
    {(editing || newOpen) && <FruitEditor initial={editing || undefined} onClose={() => { setEditing(null); setNewOpen(false); }} />}
  </>;
}
export function FruitDetail() {
  const id = Number(useParams()['id']); const q = useGetFruit(id); const [editing, setEditing] = useState(false);
  return <><Link href="/fruits" className="back-link"><ArrowLeft size={15} />Fruit catalogue</Link>{q.isLoading ? <LoadingRows /> : q.isError || !q.data ? <ErrorState message="This fruit record could not be found." retry={() => q.refetch()} /> : <>
    <PageTitle eyebrow="Catalogue item" title={q.data.name} detail={q.data.description || 'Fresh produce available for wholesale distribution.'} action={<Button variant="secondary" onClick={() => setEditing(true)}><Pencil size={15} /> Edit details</Button>} />
    <div className="detail-hero"><div className="detail-avatar fruit-avatar"><Flower2 size={25} /></div><div><span className="eyebrow">Produce variety</span><h2>{q.data.name}</h2><p>{q.data.description || 'No description added.'}</p></div><Pill tone={q.data.status === 'ACTIVE' ? 'green' : 'quiet'}>{readable(q.data.status)}</Pill></div>
    <div className="price-card-grid">{packaging.map((size, i) => <div className={`price-card price-card-${i}`} key={size}><span className="eyebrow">{size} PACKAGE</span><b>{currency([q.data.smallPrice, q.data.mediumPrice, q.data.largePrice][i])}</b><small>Wholesale price / box</small></div>)}</div>
    {editing && <FruitEditor initial={q.data} onClose={() => setEditing(false)} />}
  </>}</>;
}

export function Stock() {
  const q = useListStock(); const low = useListLowStock(); const [filter, setFilter] = useState('all');
  const rows = filter === 'low' ? (low.data ?? []) : (q.data ?? []);
  const grouped = useMemo(() => {
    const map = new Map();
    rows.forEach(r => { if (!map.has(r.fruitId)) map.set(r.fruitId, { name: r.fruitName, sizes: {} }); map.get(r.fruitId).sizes[r.packagingSize] = r; });
    return [...map.entries()];
  }, [rows]);
  const [expanded, setExpanded] = useState(new Set());

  const toggleExpand = (fruitId) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(fruitId)) next.delete(fruitId);
      else next.add(fruitId);
      return next;
    });
  };

  return <><PageTitle eyebrow="Inventory control" title="Stock on hand" detail="Current boxes by fruit and package size, with restock thresholds. Click a fruit to expand package details." action={<Link href="/purchases" className="btn btn-primary"><Plus size={16} /> Record purchase</Link>} />
    <div className="stock-summary-row"><div className="stock-summary"><span className="summary-icon"><Boxes size={18} /></span><div><small>Total stock records</small><b>{q.data?.length ?? '—'}</b></div></div><div className="stock-summary alert-summary"><span className="summary-icon"><AlertTriangle size={18} /></span><div><small>Below threshold</small><b>{low.data?.length ?? '—'} <em>need attention</em></b></div></div></div>
    <div className="toolbar"><div className="filter-tabs"><button className={filter === 'all' ? 'filter-active' : ''} onClick={() => setFilter('all')}><Boxes size={15} /> All stock</button><button className={filter === 'low' ? 'filter-active' : ''} onClick={() => setFilter('low')}><AlertTriangle size={15} /> Low stock {low.data?.length ? <span>{low.data.length}</span> : null}</button></div><span className="record-count">{grouped.length} fruit{grouped.length === 1 ? '' : 's'}</span></div>
    {q.isLoading || (filter === 'low' && low.isLoading) ? <LoadingRows /> : q.isError || (filter === 'low' && low.isError) ? <ErrorState retry={() => { q.refetch(); low.refetch(); }} /> : !grouped.length ? <EmptyState title={filter === 'low' ? 'All stock is within range' : 'No inventory yet'} body={filter === 'low' ? 'Nothing is currently below its restock threshold.' : 'Record a purchase to add stock to your inventory.'} action={filter === 'all' && <Link href="/purchases" className="text-link">Record a purchase <ArrowRight size={14} /></Link>} /> :
      <TableFrame>
        <thead>
          <tr><th>Fruit</th><th>Small boxes</th><th>Medium boxes</th><th>Large boxes</th><th>In stock</th><th>Attention</th></tr>
        </thead>
        <tbody>
          {grouped.map(([id, row]) => {
            const values = packaging.map(size => row.sizes[size]);
            const sum = values.reduce((acc, x) => acc + (x?.quantity ?? 0), 0);
            const isLow = values.some(x => x && x.quantity <= x.threshold);
            const isExpanded = expanded.has(id);
            return (
              <>
                <tr key={id} onClick={() => toggleExpand(id)} style={{ cursor: 'pointer' }}>
                  <td><span className="fruit-name-cell"><FruitIcon name={row.name} /><Link href={`/fruits/${id}`} className="entity-link">{row.name}<small>Inventory levels · Click to expand</small></Link></span></td>
                  {values.map((v, i) => <td key={i}><span className={`stock-quantity ${v && v.quantity <= v.threshold ? 'quantity-low' : ''}`}>{v?.quantity ?? 0}</span><small className="threshold-text">Threshold {v?.threshold ?? 0}</small></td>)}
                  <td className="mono strong-cell">{sum.toLocaleString()} <small>boxes</small></td>
                  <td>{isLow ? <Pill tone="amber">Restock soon</Pill> : <Pill tone="green">Healthy</Pill>}</td>
                </tr>
                {isExpanded && (
                  <tr key={`${id}-detail`} className="stock-detail-row">
                    <td colSpan={6}>
                      <div className="stock-detail-grid">
                        {packaging.map((size, i) => {
                          const v = values[i];
                          if (!v) return null;
                          return (
                            <div key={size} className="stock-detail-card">
                              <div className="detail-header">
                                <ChevronDown size={14} className="expand-icon" />
                                <span className="detail-size">{size}</span>
                                <span className="detail-qty">{v.quantity.toLocaleString()} boxes</span>
                              </div>
                              <div className="detail-meta">
                                <span><small>Threshold:</small> {v.threshold}</span>
                                <span><small>Status:</small> {v.quantity <= v.threshold ? 'Low' : 'OK'}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </TableFrame>}
  </>;
}

function VendorEditor({ initial, onClose }) {
  const qc = useQueryClient(); const create = useCreateVendor(); const update = useUpdateVendor();
  const [form, setForm] = useState({ name: initial?.name ?? '', phone: initial?.phone ?? '', location: initial?.location ?? '', registrationDate: initial?.registrationDate?.slice(0, 10) ?? today() }); const [error, setError] = useState('');
  const change = (key) => (v) => setForm(f => ({ ...f, [key]: v }));
  const submit = (e) => { e.preventDefault(); setError(''); const onSuccess = () => { qc.invalidateQueries({ queryKey: getListVendorsQueryKey() }); qc.invalidateQueries({ queryKey: getListVendorBalancesQueryKey() }); if (initial?.id) qc.invalidateQueries({ queryKey: getGetVendorQueryKey(initial.id) }); onClose(); }; const onError = () => setError('Could not save the vendor. Check the details and try again.'); if (initial?.id) update.mutate({ id: initial.id, data: form }, { onSuccess, onError }); else create.mutate({ data: form }, { onSuccess, onError }); };
  return <Modal title={initial?.id ? 'Edit vendor' : 'Register a vendor'} subtitle="Vendor details are used on sales and account records." onClose={onClose}><form className="form-body" onSubmit={submit}><Input label="Vendor name" value={form.name} onChange={change('name')} required /><Input label="Phone number" value={form.phone} onChange={change('phone')} required placeholder="+266 ..." /><Input label="Location" value={form.location} onChange={change('location')} required /><Input label="Registration date" value={form.registrationDate} onChange={change('registrationDate')} type="date" required />{error && <div className="form-error"><AlertTriangle size={15} />{error}</div>}<div className="modal-actions"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" disabled={create.isPending || update.isPending}>{create.isPending || update.isPending ? 'Saving…' : initial?.id ? 'Save changes' : 'Register vendor'}</Button></div></form></Modal>;
}
export function Vendors() {
  const [search, setSearch] = useState(''); const q = useListVendors(search ? { search } : undefined); const balances = useListVendorBalances(); const [newOpen, setNewOpen] = useState(false);
  const rows = q.data ?? []; const balanceMap = new Map((balances.data ?? []).map(b => [b.id, b]));
  return <><PageTitle eyebrow="Customer accounts" title="Vendors" detail="Wholesale customers, purchase history, and balances due." action={<Button onClick={() => setNewOpen(true)}><Plus size={16} /> Add vendor</Button>} />
    <div className="vendor-overview"><div><span className="overview-symbol"><Users size={18} /></span><span><small>Registered vendors</small><b>{q.data?.length ?? '—'}</b></span></div><div><span className="overview-symbol due-symbol"><Wallet size={18} /></span><span><small>Total outstanding</small><b>{balances.data ? currency(balances.data.reduce((sum, b) => sum + b.outstandingBalance, 0)) : '—'}</b></span></div></div>
    <div className="toolbar"><SearchBox value={search} onChange={setSearch} placeholder="Search vendor name or phone" /><span className="record-count">{rows.length} vendors</span></div>
    {q.isLoading || balances.isLoading ? <LoadingRows /> : q.isError || balances.isError ? <ErrorState retry={() => { q.refetch(); balances.refetch(); }} /> : !rows.length ? <EmptyState title={search ? 'No vendors match' : 'No vendors registered'} body={search ? 'Try another name or phone number.' : 'Register vendors to start recording wholesale sales.'} action={!search && <Button onClick={() => setNewOpen(true)}><Plus size={15} /> Register first vendor</Button>} /> :
      <TableFrame><thead><tr><th>Vendor</th><th>Phone</th><th>Location</th><th>Registered</th><th>Outstanding balance</th><th> </th></tr></thead><tbody>{rows.map(v => { const b = balanceMap.get(v.id); return <tr key={v.id} data-testid={`row-vendor-${v.id}`}><td><Link href={`/vendors/${v.id}`} className="entity-link vendor-entity"><span className="initial-avatar">{v.name.slice(0, 2).toUpperCase()}</span><span>{v.name}<small>Vendor account</small></span></Link></td><td className="mono">{v.phone}</td><td>{v.location}</td><td>{dateText(v.registrationDate)}</td><td className="price-cell">{currency(b?.outstandingBalance)}</td><td className="align-right"><Link href={`/vendors/${v.id}`} className="icon-btn" aria-label={`View ${v.name}`}><ArrowRight size={16} /></Link></td></tr>; })}</tbody></TableFrame>}
    {newOpen && <VendorEditor onClose={() => setNewOpen(false)} />}
  </>;
}
export function VendorDetail() {
  const id = Number(useParams()['id']); const q = useGetVendor(id); const balances = useListVendorBalances(); const [editing, setEditing] = useState(false);
  const balance = balances.data?.find(x => x.id === id);
  return <><Link href="/vendors" className="back-link"><ArrowLeft size={15} />All vendors</Link>{q.isLoading ? <LoadingRows /> : q.isError || !q.data ? <ErrorState message="This vendor record could not be found." retry={() => q.refetch()} /> : <>
    <PageTitle eyebrow="Vendor account" title={q.data.name} detail={`${q.data.location} · Joined ${dateText(q.data.registrationDate)}`} action={<Button variant="secondary" onClick={() => setEditing(true)}><Pencil size={15} /> Edit vendor</Button>} />
    <div className="detail-hero"><div className="detail-avatar vendor-avatar"><Store size={24} /></div><div><span className="eyebrow">Wholesale customer</span><h2>{q.data.name}</h2><p>Registered {dateText(q.data.registrationDate)}</p></div><Pill tone={balance?.outstandingBalance ? 'amber' : 'green'}>{balance?.outstandingBalance ? 'Balance due' : 'Account clear'}</Pill></div>
    <div className="balance-grid"><div className="balance-card"><small>Total purchased</small><b>{balances.isLoading ? '—' : currency(balance?.totalPurchased)}</b></div><div className="balance-card"><small>Total paid</small><b>{balances.isLoading ? '—' : currency(balance?.totalPaid)}</b></div><div className="balance-card balance-due"><small>Outstanding balance</small><b>{balances.isLoading ? '—' : currency(balance?.outstandingBalance)}</b></div></div>
    <div className="detail-grid"><DetailItem icon={<Phone size={17} />} label="Phone number" value={q.data.phone} /><DetailItem icon={<MapPin size={17} />} label="Location" value={q.data.location} /></div>
    {editing && <VendorEditor initial={q.data} onClose={() => setEditing(false)} />}
  </>}</>;
}

const emptyPurchaseLine = () => ({ fruitId: '', packagingSize: PackagingSize.SMALL, quantity: '1', unitCost: '' });
function PurchaseRecorder({ onClose }) {
  const qc = useQueryClient(); const suppliers = useListSuppliers(); const fruits = useListFruits(); const create = useCreatePurchase(); const [supplierId, setSupplierId] = useState(''); const [purchaseDate, setPurchaseDate] = useState(today()); const [lines, setLines] = useState([emptyPurchaseLine()]); const [error, setError] = useState('');
  const update = (i, key, value) => setLines(ls => ls.map((l, ix) => ix === i ? { ...l, [key]: value } : l)); const total = lines.reduce((n, l) => n + Number(l.quantity || 0) * Number(l.unitCost || 0), 0);
  const submit = (e) => { e.preventDefault(); if (!supplierId || lines.some(l => !l.fruitId || Number(l.quantity) < 1 || Number(l.unitCost) <= 0)) { setError('Choose a supplier and complete every item with a positive quantity and unit cost.'); return; } const data = { supplierId: Number(supplierId), purchaseDate, items: lines.map(l => ({ fruitId: Number(l.fruitId), packagingSize: l.packagingSize, quantity: Number(l.quantity), unitCost: Number(l.unitCost) })) }; create.mutate({ data }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListPurchasesQueryKey() }); qc.invalidateQueries({ queryKey: getListStockQueryKey() }); qc.invalidateQueries({ queryKey: getListLowStockQueryKey() }); qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); qc.invalidateQueries({ queryKey: getGetDashboardActivityQueryKey() }); qc.invalidateQueries({ queryKey: getGetStockReportQueryKey() }); onClose(); }, onError: () => setError('Purchase could not be recorded. Please review the item details and retry.') }); };
  return <Modal wide title="Record a purchase" subtitle="Log incoming produce and update stock in one step." onClose={onClose}><form className="form-body" onSubmit={submit}>
    <div className="form-two"><SelectField label="Supplier" value={supplierId} onChange={setSupplierId} required options={[{ value: '', label: 'Choose supplier' }, ...(suppliers.data ?? []).map(s => ({ value: String(s.id), label: s.businessName }))]} /><Input label="Purchase date" type="date" value={purchaseDate} onChange={setPurchaseDate} required /></div>
    <div className="line-head"><div><span className="eyebrow">Purchase items</span><p>Enter package counts and supplier cost per box.</p></div><Button variant="secondary" onClick={() => setLines(ls => [...ls, emptyPurchaseLine()])}><Plus size={14} /> Add item</Button></div>
    <div className="line-list">{lines.map((line, i) => <div className="item-line" key={i}><SelectField label="Fruit" value={line.fruitId} onChange={v => update(i, 'fruitId', v)} required options={[{ value: '', label: 'Select fruit' }, ...(fruits.data ?? []).map(f => ({ value: String(f.id), label: f.name }))]} /><SelectField label="Package" value={line.packagingSize} onChange={v => update(i, 'packagingSize', v)} options={packaging.map(p => ({ value: p, label: readable(p) }))} /><Input label="Boxes" type="number" min={1} step={1} value={line.quantity} onChange={v => update(i, 'quantity', v)} required /><Input label="Unit cost · M" type="number" min={0.01} step={0.01} value={line.unitCost} onChange={v => update(i, 'unitCost', v)} required />{lines.length > 1 && <button type="button" className="remove-line" onClick={() => setLines(ls => ls.filter((_, ix) => ix !== i))} aria-label="Remove item"><X size={16} /></button>}</div>)}</div>
    <div className="form-total"><span>Purchase total</span><b>{currency(total)}</b></div>{error && <div className="form-error"><AlertTriangle size={15} />{error}</div>}<div className="modal-actions"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" disabled={create.isPending}>{create.isPending ? 'Recording…' : 'Save purchase'}</Button></div>
  </form></Modal>;
}
export function Purchases() {
  const q = useListPurchases(); const [record, setRecord] = useState(false); const [search, setSearch] = useState('');
  const rows = (q.data ?? []).filter(x => `${x.supplierName} ${x.id}`.toLowerCase().includes(search.toLowerCase()));
  return <><PageTitle eyebrow="Incoming produce" title="Purchases" detail="Track produce received from suppliers and monitor farm stock." action={<Button onClick={() => setRecord(true)}><Plus size={16} /> Record purchase</Button>} />
    <div className="toolbar"><SearchBox value={search} onChange={setSearch} placeholder="Search supplier or reference" /><span className="record-count">{rows.length} purchases</span></div>
    {q.isLoading ? <LoadingRows /> : q.isError ? <ErrorState retry={() => q.refetch()} /> : !rows.length ? <EmptyState title={search ? 'No purchases match' : 'No purchases recorded'} body={search ? 'Try searching by supplier name or reference.' : 'Record incoming produce to keep inventory accurate.'} action={!search && <Button onClick={() => setRecord(true)}><Plus size={15} /> Record first purchase</Button>} /> :
      <TableFrame><thead><tr><th>Reference</th><th>Supplier</th><th>Date received</th><th>Items</th><th className="align-right">Total cost</th></tr></thead><tbody>{rows.map(p => <tr key={p.id} data-testid={`row-purchase-${p.id}`}><td><span className="reference-tag">PUR-{String(p.id).padStart(4, '0')}</span></td><td className="strong-cell">{p.supplierName}</td><td>{dateText(p.purchaseDate)}</td><td>{p.itemCount} item{p.itemCount === 1 ? '' : 's'}</td><td className="align-right price-cell">{currency(p.totalAmount)}</td></tr>)}</tbody></TableFrame>}
    {record && <PurchaseRecorder onClose={() => setRecord(false)} />}
  </>;
}

const emptySaleLine = () => ({ fruitId: '', packagingSize: PackagingSize.SMALL, quantity: '1' });
function SaleRecorder({ onClose }) {
  const qc = useQueryClient(); const vendors = useListVendors(); const fruits = useListFruits(); const stock = useListStock(); const create = useCreateSale();
  const [vendorId, setVendorId] = useState(''); const [saleDate, setSaleDate] = useState(today()); const [method, setMethod] = useState(PaymentMethod.CASH); const [paid, setPaid] = useState(''); const [lines, setLines] = useState([emptySaleLine()]); const [error, setError] = useState('');
  const update = (i, key, value) => setLines(ls => ls.map((l, ix) => ix === i ? { ...l, [key]: value } : l));
  const price = (line) => { const fruit = fruits.data?.find(f => f.id === Number(line.fruitId)); if (!fruit) return 0; return line.packagingSize === 'SMALL' ? fruit.smallPrice : line.packagingSize === 'MEDIUM' ? fruit.mediumPrice : fruit.largePrice; };
  const available = (line) => stock.data?.find(s => s.fruitId === Number(line.fruitId) && s.packagingSize === line.packagingSize)?.quantity ?? 0;
  const total = lines.reduce((sum, l) => sum + price(l) * Number(l.quantity || 0), 0);
  const submit = (e) => { e.preventDefault(); if (!vendorId || lines.some(l => !l.fruitId || Number(l.quantity) < 1)) { setError('Choose a vendor and complete each sale item.'); return; } if (lines.some(l => Number(l.quantity) > available(l))) { setError('One or more item quantities exceed available stock. Adjust the boxes before recording.'); return; } const data = { vendorId: Number(vendorId), saleDate, paymentMethod: method, ...(paid ? { paidAmount: Number(paid) } : {}), items: lines.map(l => ({ fruitId: Number(l.fruitId), packagingSize: l.packagingSize, quantity: Number(l.quantity) })) }; create.mutate({ data }, { onSuccess: () => { [getListSalesQueryKey(), getListStockQueryKey(), getListLowStockQueryKey(), getListVendorBalancesQueryKey(), getGetDashboardSummaryQueryKey(), getGetDashboardActivityQueryKey(), getGetStockReportQueryKey(), getGetTopFruitsReportQueryKey(), getGetTopVendorReportQueryKey(), getGetRevenueReportQueryKey()].forEach(queryKey => qc.invalidateQueries({ queryKey })); onClose(); }, onError: () => setError('Sale could not be recorded. Confirm stock and payment details, then retry.') }); };
  return <Modal wide title="Record a sale" subtitle="Create a vendor sale and capture the payment received." onClose={onClose}><form className="form-body" onSubmit={submit}>
    <div className="form-three"><SelectField label="Vendor" value={vendorId} onChange={setVendorId} required options={[{ value: '', label: 'Choose vendor' }, ...(vendors.data ?? []).map(v => ({ value: String(v.id), label: v.name }))]} /><Input label="Sale date" type="date" value={saleDate} onChange={setSaleDate} required /><SelectField label="Payment method" value={method} onChange={setMethod} options={Object.values(PaymentMethod).map(x => ({ value: x, label: readable(x) }))} required /></div>
    <div className="line-head"><div><span className="eyebrow">Sale items</span><p>Prices use current catalogue rates; available stock is shown below.</p></div><Button variant="secondary" onClick={() => setLines(ls => [...ls, emptySaleLine()])}><Plus size={14} /> Add item</Button></div>
    <div className="line-list">{lines.map((line, i) => <div className="sale-item-line" key={i}><SelectField label="Fruit" value={line.fruitId} onChange={v => update(i, 'fruitId', v)} required options={[{ value: '', label: 'Select fruit' }, ...(fruits.data ?? []).filter(f => f.status === 'ACTIVE').map(f => ({ value: String(f.id), label: f.name }))]} /><SelectField label="Package" value={line.packagingSize} onChange={v => update(i, 'packagingSize', v)} options={packaging.map(p => ({ value: p, label: readable(p) }))} /><Input label="Boxes" type="number" min={1} step={1} value={line.quantity} onChange={v => update(i, 'quantity', v)} required /><div className="line-price"><small>Available · {available(line)}</small><b>{currency(price(line))}</b></div>{lines.length > 1 && <button type="button" className="remove-line" onClick={() => setLines(ls => ls.filter((_, ix) => ix !== i))} aria-label="Remove item"><X size={16} /></button>}</div>)}</div>
    <div className="payment-capture"><div className="form-total"><span>Total amount</span><b>{currency(total)}</b></div><Input label="Amount paid now · M" type="number" min={0} step={0.01} value={paid} onChange={setPaid} placeholder="Leave blank for unpaid" /></div>
    {error && <div className="form-error"><AlertTriangle size={15} />{error}</div>}<div className="modal-actions"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" disabled={create.isPending}>{create.isPending ? 'Recording…' : 'Record sale'}</Button></div>
  </form></Modal>;
}
function PaymentEditor({ sale, onClose }) {
  const qc = useQueryClient(); const payment = useAddSalePayment(); const remaining = Math.max(sale.totalAmount - sale.paidAmount, 0); const [amount, setAmount] = useState(String(remaining)); const [method, setMethod] = useState(PaymentMethod.CASH); const [error, setError] = useState('');
  const submit = (e) => { e.preventDefault(); const num = Number(amount); if (num <= 0 || num > remaining) { setError(`Enter an amount greater than zero and no more than ${currency(remaining)}.`); return; } const data = { paymentMethod: method, amount: num }; payment.mutate({ id: sale.id, data }, { onSuccess: () => { [getListSalesQueryKey(), getListVendorBalancesQueryKey(), getGetDashboardSummaryQueryKey(), getGetDashboardActivityQueryKey()].forEach(queryKey => qc.invalidateQueries({ queryKey })); onClose(); }, onError: () => setError('Payment could not be recorded. Please try again.') }); };
  return <Modal title="Record a payment" subtitle={`Sale SAL-${String(sale.id).padStart(4, '0')} · ${sale.vendorName}`} onClose={onClose}><form className="form-body" onSubmit={submit}><div className="payment-due"><small>Remaining balance</small><b>{currency(remaining)}</b></div><Input label="Payment amount · M" type="number" min={0.01} max={remaining} step={0.01} value={amount} onChange={setAmount} required /><SelectField label="Payment method" value={method} onChange={setMethod} options={[PaymentMethod.CASH, PaymentMethod.MOBILE_MONEY].map(x => ({ value: x, label: readable(x) }))} />{error && <div className="form-error"><AlertTriangle size={15} />{error}</div>}<div className="modal-actions"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" disabled={payment.isPending}>{payment.isPending ? 'Recording…' : 'Save payment'}</Button></div></form></Modal>;
}
export function Sales() {
  const q = useListSales(); const [record, setRecord] = useState(false); const [payment, setPayment] = useState(null); const [search, setSearch] = useState(''); const [statusFilter, setStatusFilter] = useState('ALL');
  const rows = (q.data ?? []).filter(s => (`${s.vendorName} ${s.id}`.toLowerCase().includes(search.toLowerCase())) && (statusFilter === 'ALL' || s.paymentStatus === statusFilter));
  return <><PageTitle eyebrow="Wholesale orders" title="Sales" detail="Track sales, payment status, and outstanding vendor payments." action={<Button onClick={() => setRecord(true)}><Plus size={16} /> Record sale</Button>} />
    <div className="toolbar sales-toolbar"><SearchBox value={search} onChange={setSearch} placeholder="Search vendor or reference" /><SelectField label="Payment status" value={statusFilter} onChange={setStatusFilter} options={[{ value: 'ALL', label: 'All payment statuses' }, { value: 'PAID', label: 'Paid' }, { value: 'PARTIALLY_PAID', label: 'Partially paid' }, { value: 'UNPAID', label: 'Unpaid' }]} /><span className="record-count">{rows.length} sales</span></div>
    {q.isLoading ? <LoadingRows /> : q.isError ? <ErrorState retry={() => q.refetch()} /> : !rows.length ? <EmptyState title={search || statusFilter !== 'ALL' ? 'No sales match' : 'No sales recorded'} body={search || statusFilter !== 'ALL' ? 'Change your search or payment filter.' : 'Record your first sale to start tracking vendor orders.'} action={!search && statusFilter === 'ALL' && <Button onClick={() => setRecord(true)}><Plus size={15} /> Record first sale</Button>} /> :
      <TableFrame><thead><tr><th>Reference</th><th>Vendor</th><th>Date</th><th>Items</th><th>Payment method</th><th>Payment status</th><th>Total</th><th>Paid</th><th> </th></tr></thead><tbody>{rows.map(s => <tr key={s.id} data-testid={`row-sale-${s.id}`}><td><span className="reference-tag">SAL-{String(s.id).padStart(4, '0')}</span></td><td className="strong-cell">{s.vendorName}</td><td>{dateText(s.saleDate)}</td><td>{s.itemCount}</td><td>{readable(s.paymentMethod)}</td><td><Pill tone={s.paymentStatus === 'PAID' ? 'green' : s.paymentStatus === 'UNPAID' ? 'red' : 'amber'}>{readable(s.paymentStatus)}</Pill></td><td className="price-cell">{currency(s.totalAmount)}</td><td>{currency(s.paidAmount)}</td><td>{s.paymentStatus !== 'PAID' && <button className="small-action" onClick={() => setPayment(s)}><Plus size={13} /> Payment</button>}</td></tr>)}</tbody></TableFrame>}
    {record && <SaleRecorder onClose={() => setRecord(false)} />}{payment && <PaymentEditor sale={payment} onClose={() => setPayment(null)} />}
  </>;
}

export function Reports() {
  const [startDate, setStartDate] = useState(new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10)); const [endDate, setEndDate] = useState(today());
  const params = useMemo(() => ({ startDate, endDate }), [startDate, endDate]);
  const fruits = useGetTopFruitsReport(); const revenue = useGetRevenueReport(params); const vendor = useGetTopVendorReport(); const stock = useGetStockReport(); const qc = useQueryClient();
  const error = fruits.isError || revenue.isError || vendor.isError || stock.isError;
  const [expandedStock, setExpandedStock] = useState(new Set());

  const groupedStock = useMemo(() => {
    const map = new Map();
    (stock.data ?? []).forEach(r => { if (!map.has(r.fruitId)) map.set(r.fruitId, { name: r.fruitName, sizes: {} }); map.get(r.fruitId).sizes[r.packagingSize] = r; });
    return [...map.entries()];
  }, [stock.data]);

  const toggleStockExpand = (fruitId) => {
    setExpandedStock(prev => {
      const next = new Set(prev);
      if (next.has(fruitId)) next.delete(fruitId);
      else next.add(fruitId);
      return next;
    });
  };

  return <><PageTitle eyebrow="Performance & planning" title="Reports" detail="A clear view of sales performance, trusted vendors, and stock levels." action={<Button variant="secondary" onClick={() => { fruits.refetch(); revenue.refetch(); vendor.refetch(); stock.refetch(); }}><RotateCcw size={15} /> Refresh reports</Button>} />
    <section className="report-controls"><div><span className="eyebrow">Revenue period</span><strong>Choose a date range</strong></div><div className="date-range"><Input label="From" type="date" value={startDate} onChange={setStartDate} /><span>to</span><Input label="Through" type="date" value={endDate} onChange={setEndDate} /></div></section>
    {error && <ErrorState message="One or more report summaries could not be loaded. Retry the reports." retry={() => { qc.invalidateQueries({ queryKey: getGetTopFruitsReportQueryKey() }); qc.invalidateQueries({ queryKey: getGetRevenueReportQueryKey(params) }); qc.invalidateQueries({ queryKey: getGetTopVendorReportQueryKey() }); qc.invalidateQueries({ queryKey: getGetStockReportQueryKey() }); }} />}
    <div className="report-highlights"><article className="highlight-card revenue-highlight"><span className="highlight-icon"><CircleDollarSign size={19} /></span><small>Sales revenue in range</small>{revenue.isLoading ? <div className="skeleton-text" /> : <b>{currency(revenue.data?.revenue)}</b>}<span className="highlight-foot">{dateText(startDate)} — {dateText(endDate)}</span></article>
      <article className="highlight-card vendor-highlight"><span className="highlight-icon"><Store size={19} /></span><small>Highest-volume vendor</small>{vendor.isLoading ? <div className="skeleton-text" /> : <b>{vendor.data?.vendorName || 'No sales yet'}</b>}<span className="highlight-foot">{vendor.data?.boxesPurchased ?? 0} boxes purchased</span></article>
      <article className="highlight-card stock-highlight"><span className="highlight-icon"><Boxes size={19} /></span><small>Packages tracked</small>{stock.isLoading ? <div className="skeleton-text" /> : <b>{stock.data?.length ?? 0}</b>}<span className="highlight-foot">Fruit and package-size records</span></article></div>
    <div className="report-grid"><section className="panel report-panel"><div className="panel-heading"><div><span className="eyebrow">Sales leaders</span><h2>Top five fruits</h2></div><span className="report-icon"><Flower2 size={17} /></span></div>
      {fruits.isLoading ? <LoadingRows /> : fruits.isError ? <ErrorState retry={() => fruits.refetch()} /> : !fruits.data?.length ? <EmptyState title="No fruit sales yet" body="Top-selling fruits will appear after sales are recorded." /> : <div className="rank-list">{fruits.data.slice(0, 5).map((f, i) => <div className="rank-row" key={f.fruitId}><span className={`rank-number ${i === 0 ? 'rank-first' : ''}`}>{String(i + 1).padStart(2, '0')}</span><div className="rank-track"><span className="rank-name">{f.fruitName}</span><span className="rank-bar-bg"><i style={{ width: `${Math.max(8, f.boxesSold / Math.max(...fruits.data.map(v => v.boxesSold), 1) * 100)}%` }} /></span></div><b>{f.boxesSold.toLocaleString()} <small>boxes</small></b></div>)}</div>}
    </section><section className="panel report-panel"><div className="panel-heading"><div><span className="eyebrow">Current inventory</span><h2>Stock by package</h2></div><span className="report-icon"><Boxes size={17} /></span></div>
      {stock.isLoading ? <LoadingRows /> : stock.isError ? <ErrorState retry={() => stock.refetch()} /> : !groupedStock.length ? <EmptyState title="No inventory to report" body="Record a purchase to start monitoring stock." /> :
        <div className="table-wrap report-stock-table"><table><thead><tr><th>Fruit</th><th>Small boxes</th><th>Medium boxes</th><th>Large boxes</th><th>In stock</th><th>Attention</th></tr></thead><tbody>{groupedStock.map(([id, row]) => { const values = packaging.map(size => row.sizes[size]); const sum = values.reduce((acc, x) => acc + (x?.quantity ?? 0), 0); const isLow = values.some(x => x && x.quantity <= x.threshold); const isExpanded = expandedStock.has(id); return (
              <>
                <tr key={id} onClick={() => toggleStockExpand(id)} style={{ cursor: 'pointer' }}>
                  <td><span className="fruit-name-cell"><FruitIcon name={row.name} />{row.name}<small>Click to expand</small></span></td>
                  {values.map((v, i) => <td key={i}><span className={`stock-quantity ${v && v.quantity <= v.threshold ? 'quantity-low' : ''}`}>{v?.quantity ?? 0}</span><small className="threshold-text">Threshold {v?.threshold ?? 0}</small></td>)}
                  <td className="mono strong-cell">{sum.toLocaleString()} <small>boxes</small></td>
                  <td>{isLow ? <Pill tone="amber">Restock soon</Pill> : <Pill tone="green">Healthy</Pill>}</td>
                </tr>
                {isExpanded && (
                  <tr key={`${id}-detail`} className="stock-detail-row">
                    <td colSpan={6}>
                      <div className="stock-detail-grid">
                        {packaging.map((size, i) => {
                          const v = values[i];
                          if (!v) return null;
                          return (
                            <div key={size} className="stock-detail-card">
                              <div className="detail-header">
                                <ChevronDown size={14} className="expand-icon" />
                                <span className="detail-size">{size}</span>
                                <span className="detail-qty">{v.quantity.toLocaleString()} boxes</span>
                              </div>
                              <div className="detail-meta">
                                <span><small>Threshold:</small> {v.threshold}</span>
                                <span><small>Status:</small> {v.quantity <= v.threshold ? 'Low' : 'OK'}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ); })}</tbody></table></div>}
    </section></div>
  </>;
}
