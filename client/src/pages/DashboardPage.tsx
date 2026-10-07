import { useState } from 'react'
import { Activity, ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, Bell, ChevronDown, Download, Hexagon, Layers3, LayoutDashboard, MapPinned, Menu, Search, ShieldCheck, X } from 'lucide-react'
import { navigate } from '../App'

type Scenario = '1-in-20 flood' | '1-in-50 flood' | '1-in-100 flood'

const scenarioData: Record<Scenario, { headline: string; bars: { label: string; value: number; amount: string }[]; dots: { x: number; y: number; r: number }[]; insight: string }> = {
  '1-in-20 flood': {
    headline: 'Moderate flood scenario',
    bars: [{ label: 'Embakasi', value: 28, amount: 'KSh 280M' }, { label: 'Kasarani', value: 21, amount: 'KSh 210M' }, { label: 'Makadara', value: 15, amount: 'KSh 150M' }, { label: "Lang'ata", value: 11, amount: 'KSh 110M' }],
    dots: [{ x: 392, y: 316, r: 17 }, { x: 354, y: 170, r: 13 }, { x: 294, y: 278, r: 12 }, { x: 193, y: 360, r: 10 }],
    insight: 'The sample model shows concentrated flood loss where insured assets meet the illustrated water corridor.',
  },
  '1-in-50 flood': {
    headline: 'Severe flood scenario',
    bars: [{ label: 'Embakasi', value: 51, amount: 'KSh 510M' }, { label: 'Kasarani', value: 39, amount: 'KSh 390M' }, { label: 'Makadara', value: 30, amount: 'KSh 300M' }, { label: "Lang'ata", value: 20, amount: 'KSh 200M' }],
    dots: [{ x: 392, y: 316, r: 27 }, { x: 354, y: 170, r: 22 }, { x: 294, y: 278, r: 20 }, { x: 193, y: 360, r: 16 }],
    insight: 'At higher severity, more of the sample portfolio falls inside the illustrative flood extent.',
  },
  '1-in-100 flood': {
    headline: 'Extreme flood scenario',
    bars: [{ label: 'Embakasi', value: 80, amount: 'KSh 800M' }, { label: 'Kasarani', value: 61, amount: 'KSh 610M' }, { label: 'Makadara', value: 45, amount: 'KSh 450M' }, { label: "Lang'ata", value: 32, amount: 'KSh 320M' }],
    dots: [{ x: 392, y: 316, r: 37 }, { x: 354, y: 170, r: 31 }, { x: 294, y: 278, r: 29 }, { x: 193, y: 360, r: 23 }],
    insight: 'The 1-in-100 sample scenario produces KSh 2.18B in modelled portfolio loss, with the largest share in Embakasi.',
  },
}

const locations = [
  { zone: 'Embakasi', assets: '4,120', exposure: 'KSh 6.8B', risk: 'Elevated', color: 'bg-orange-300' },
  { zone: 'Kasarani', assets: '2,380', exposure: 'KSh 4.1B', risk: 'Elevated', color: 'bg-orange-300' },
  { zone: 'Makadara', assets: '1,740', exposure: 'KSh 2.7B', risk: 'Moderate', color: 'bg-yellow-200' },
  { zone: "Lang'ata", assets: '1,560', exposure: 'KSh 2.3B', risk: 'Moderate', color: 'bg-yellow-200' },
]

function Brand() {
  return <span className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-white"><Hexagon size={26} strokeWidth={1.5} className="text-emerald-200" /> risk atlas</span>
}

function MapGraphic({ scenario }: { scenario: Scenario }) {
  return (
    <svg viewBox="0 0 560 500" role="img" aria-label={`${scenario} illustrative flood exposure in Nairobi`} className="h-full w-full">
      <defs>
        <pattern id="mapGrid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M 24 0 L 0 0 0 24" fill="none" stroke="#63716d" strokeOpacity=".15" strokeWidth="1" /></pattern>
        <radialGradient id="riskGlow"><stop stopColor="#69d2e1" stopOpacity=".46" /><stop offset="1" stopColor="#69d2e1" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="560" height="500" fill="url(#mapGrid)" />
      <path d="M112 104 281 66 434 103 477 214 442 373 323 429 163 404 87 292Z" fill="#172e32" stroke="#9ed9dd" strokeOpacity=".55" strokeWidth="2" />
      <path d="M126 149 454 258M98 280 401 99M151 402 377 84M280 67 266 422M107 333 470 221M197 80 436 369" fill="none" stroke="#9ed9dd" strokeOpacity=".2" strokeDasharray="4 7" />
      <path d="M99 234C163 203 188 273 257 251S347 182 430 209 462 294 502 307" fill="none" stroke="#4ab2cb" strokeOpacity=".22" strokeWidth="20" strokeLinecap="round" />
      <path d="M99 234C163 203 188 273 257 251S347 182 430 209 462 294 502 307" fill="none" stroke="#91d8e5" strokeOpacity=".7" strokeWidth="2" strokeLinecap="round" />
      {scenarioData[scenario].dots.map((dot, index) => <g key={index}><circle cx={dot.x} cy={dot.y} r={dot.r * 2.1} fill="url(#riskGlow)" /><circle cx={dot.x} cy={dot.y} r={dot.r / 4} fill="#7bd4e3" stroke="#d7f7f7" strokeWidth="2" /></g>)}
      <g fill="#e6ede8" fontFamily="Inter, sans-serif" fontSize="13" fontWeight="500">
        <text x="405" y="345">Embakasi</text><text x="365" y="160">Kasarani</text><text x="260" y="313">Makadara</text><text x="135" y="389">Lang&apos;ata</text>
      </g>
      <g fill="#b7c9be" fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="2"><text x="40" y="50">NAIROBI</text><text x="40" y="470">ILLUSTRATIVE FLOOD EXTENT</text></g>
    </svg>
  )
}

export default function DashboardPage() {
  const [scenario, setScenario] = useState<Scenario>('1-in-100 flood')
  const [menuOpen, setMenuOpen] = useState(false)
  const nav = [
    { label: 'Overview', href: '#overview', icon: LayoutDashboard },
    { label: 'Flood map', href: '#hazard-map', icon: MapPinned },
    { label: 'Portfolio', href: '#portfolio', icon: Layers3 },
    { label: 'Insights', href: '#insights', icon: BarChart3 },
  ]

  const downloadSnapshot = () => {
    const rows = [['Nairobi zone', 'Assets', 'Exposure', 'Flood risk'], ...locations.map((item) => [item.zone, item.assets, item.exposure, item.risk])]
    const csv = rows.map((row) => row.join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'risk-atlas-nairobi-flood-sample.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-[#0c1013] font-sans text-white lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className={`${menuOpen ? 'flex' : 'hidden'} fixed inset-0 z-40 flex-col border-r border-white/10 bg-[#10171a] px-5 pb-6 pt-7 lg:sticky lg:top-0 lg:flex lg:h-screen`}>
        <div className="flex items-center justify-between"><Brand /><button type="button" className="lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={20} /></button></div>
        <p className="mt-12 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">Workspace</p>
        <nav className="mt-3 space-y-1" aria-label="Dashboard navigation">
          {nav.map(({ label, href, icon: Icon }, index) => <a key={label} href={href} onClick={() => setMenuOpen(false)} className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors ${index === 0 ? 'bg-emerald-200/10 text-emerald-100' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}><Icon size={18} strokeWidth={1.7} />{label}</a>)}
        </nav>
        <div className="mt-auto rounded-xl border border-emerald-200/15 bg-emerald-200/[0.055] p-4">
          <div className="flex items-center gap-2 text-sm text-emerald-100"><ShieldCheck size={17} /> Sample workspace</div>
          <p className="mt-2 text-xs leading-5 text-white/40">Explore Nairobi flood risk with illustrative portfolio data.</p>
        </div>
        <button type="button" onClick={() => navigate('/')} className="mt-5 flex items-center gap-3 border-t border-white/10 px-2 pt-5 text-left text-sm text-white/50 hover:text-white"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-white">RA</span> Back to site <ArrowRight size={15} className="ml-auto" /></button>
      </aside>

      <div className="min-w-0">
        <header className="flex h-[72px] items-center justify-between gap-4 border-b border-white/10 px-5 sm:px-8 xl:px-10">
          <div className="flex items-center gap-3"><button type="button" className="lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={21} /></button><span className="hidden text-sm text-white/40 sm:inline">Workspace</span><span className="hidden text-white/20 sm:inline">/</span><span className="text-sm font-medium">Overview</span></div>
          <div className="flex items-center gap-2 sm:gap-4"><span className="hidden items-center gap-2 text-xs text-white/40 md:flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Model ready</span><button type="button" onClick={() => document.getElementById('portfolio')?.scrollIntoView({ behavior: 'smooth' })} aria-label="Find portfolio" className="rounded-lg p-2 text-white/45 hover:bg-white/5 hover:text-white"><Search size={18} /></button><button type="button" onClick={() => document.getElementById('insights')?.scrollIntoView({ behavior: 'smooth' })} aria-label="View insights" className="rounded-lg p-2 text-white/45 hover:bg-white/5 hover:text-white"><Bell size={18} /></button><span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#26332e] text-xs font-semibold text-emerald-100">RA</span></div>
        </header>

        <main id="overview" className="mx-auto max-w-[1600px] px-5 pb-12 pt-8 sm:px-8 xl:px-10">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div><p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-emerald-200/70">Nairobi flood intelligence</p><h1 className="text-3xl font-medium tracking-[-0.04em] sm:text-4xl">Flood risk overview</h1><p className="mt-2 text-sm text-white/45">Modelled flood exposure and potential loss for a sample Nairobi portfolio.</p></div>
            <div className="flex flex-wrap gap-2"><span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2.5 text-xs text-white/65">Sample portfolio <ChevronDown size={14} /></span><button type="button" onClick={downloadSnapshot} className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2.5 text-xs text-white transition-colors hover:bg-white/10"><Download size={15} /> Export snapshot</button></div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Nairobi insured exposure', value: 'KSh 18.4B', change: '+8.2%', icon: Layers3, positive: true },
              { label: 'Flood average annual loss', value: 'KSh 642M', change: '+3.1%', icon: Activity, positive: false },
              { label: '1-in-100 flood PML', value: 'KSh 2.18B', change: '−1.4%', icon: BarChart3, positive: true },
              { label: 'Insured locations', value: '12,480', change: '+6.8%', icon: ShieldCheck, positive: true },
            ].map(({ label, value, change, icon: Icon, positive }) => <div key={label} className="rounded-xl border border-white/10 bg-[#141b1d] p-5"><div className="flex items-start justify-between"><span className="text-xs text-white/45">{label}</span><Icon size={18} strokeWidth={1.6} className="text-emerald-200/65" /></div><p className="mt-6 text-2xl font-medium tracking-tight sm:text-[28px]">{value}</p><p className="mt-2 flex items-center gap-1 text-xs text-white/35"><span className={`inline-flex items-center ${positive ? 'text-emerald-200' : 'text-orange-200'}`}>{positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{change}</span> vs. prior model run</p></div>)}
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.48fr)_minmax(320px,1fr)]">
            <section id="hazard-map" className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-[#141b1d]">
              <div className="flex flex-wrap items-start justify-between gap-4 p-5 pb-0 sm:p-6 sm:pb-0"><div><p className="text-base font-medium">Nairobi flood map</p><p className="mt-1 text-xs text-white/40">{scenarioData[scenario].headline} · illustrative view</p></div><span className="flex items-center gap-2 text-[11px] text-white/45"><span className="h-2 w-2 rounded-full bg-cyan-300" /> Flood concentration</span></div>
              <div className="h-[300px] sm:h-[390px]"><MapGraphic scenario={scenario} /></div>
              <div className="flex flex-wrap gap-2 border-t border-white/10 p-4 sm:px-6">{(Object.keys(scenarioData) as Scenario[]).map((item) => <button key={item} type="button" onClick={() => setScenario(item)} className={`rounded-full px-3 py-1.5 text-xs transition-colors ${scenario === item ? 'bg-emerald-200 text-[#0b1510]' : 'border border-white/10 bg-white/[0.035] text-white/50 hover:text-white'}`}>{item}</button>)}</div>
            </section>

            <section id="insights" className="flex min-w-0 flex-col rounded-xl border border-white/10 bg-[#141b1d] p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="text-base font-medium">Scenario loss by zone</h2><p className="mt-1 text-xs text-white/40">Illustrative flood loss contribution</p></div><span className="rounded-md border border-white/10 px-2 py-1 text-[11px] text-white/50">{scenario}</span></div><div className="mt-9 flex-1 space-y-8">{scenarioData[scenario].bars.map((bar) => <div key={bar.label}><div className="mb-3 flex items-center justify-between gap-3 text-xs"><span className="text-white/70">{bar.label}</span><span className="text-white/45">{bar.amount}</span></div><div className="h-2 rounded-full bg-white/[0.07]"><div className="h-2 rounded-full bg-gradient-to-r from-cyan-300 to-emerald-100" style={{ width: `${bar.value}%` }} /></div></div>)}</div><div className="mt-8 rounded-lg border border-emerald-200/10 bg-emerald-200/[0.055] p-4"><div className="flex items-center gap-2 text-xs font-medium text-emerald-100"><Activity size={15} /> Model insight</div><p className="mt-2 text-xs leading-5 text-white/50">{scenarioData[scenario].insight}</p></div></section>
          </div>

          <section id="portfolio" className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-[#141b1d]"><div className="flex flex-wrap items-center justify-between gap-3 px-5 py-5 sm:px-6"><div><h2 className="text-base font-medium">Nairobi portfolio hotspots</h2><p className="mt-1 text-xs text-white/40">Sample insured exposure by zone</p></div><span className="text-xs text-white/40">4 sample zones shown</span></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-y border-white/10 bg-white/[0.025] text-[11px] uppercase tracking-[0.12em] text-white/35"><tr><th className="px-5 py-3 font-medium sm:px-6">Nairobi zone</th><th className="px-5 py-3 font-medium">Insured assets</th><th className="px-5 py-3 font-medium">Exposure</th><th className="px-5 py-3 font-medium">Flood risk</th></tr></thead><tbody>{locations.map((item) => <tr key={item.zone} className="border-b border-white/[0.07] last:border-b-0"><td className="px-5 py-4 font-medium text-white/85 sm:px-6">{item.zone}</td><td className="px-5 py-4 text-white/55">{item.assets}</td><td className="px-5 py-4 text-white/55">{item.exposure}</td><td className="px-5 py-4"><span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/65"><span className={`h-1.5 w-1.5 rounded-full ${item.color}`} />{item.risk}</span></td></tr>)}</tbody></table></div></section>
          <p className="mt-5 text-xs leading-5 text-white/30">Illustrative data for the hackathon prototype. Values are sample outputs and should not be used for underwriting decisions.</p>
        </main>
      </div>
    </div>
  )
}
