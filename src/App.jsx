import { useState } from "react";
import { SignedIn, SignedOut, SignInButton, UserButton, useAuth } from "@clerk/clerk-react";

const Icon = ({ n, c = "" }) => <span className={`material-symbols-outlined ${c}`}>{n}</span>;

const BUDGETS = ["Under K150k", "K150k - K300k", "K300k - K500k", "Over K500k"];
const CATS = [
  ["Verified in Lusaka", "verified"], ["Fuel Savers", "eco"], ["Under K250k", "payments"],
  ["Under K500k", "savings"], ["Under K1M", "account_balance_wallet"], ["Open Budget & Executive", "diamond"],
];
// SAMPLE CONTENT: replace with real data from your database as requests come in.
const DEMAND = [
  ["Toyota Axio / Honda Fit", "Daily Runner", "Lusaka Central", "K525,000"],
  ["Toyota Hilux Twin Cab", "In-Demand", "Kitwe, Copperbelt", "K650,000"],
  ["Toyota Prado TX", "Family SUV", "Kabulonga, Lusaka", "K775,000"],
  ["Nissan X-Trail", "Family Crossover", "Ndola, Copperbelt", "K732,000"],
];
const FAQ = [
  ["What is AutoAce Zed?", "A vehicle discovery and demand-matching platform in Zambia. Tell us the car you need and your budget, and we connect you with vetted automotive agents and sellers who can help."],
  ["Does AutoAce own the vehicles?", "No. We are not a car yard. We coordinate introductions between buyers, sellers and agents. Vehicle details, price, condition and documents are confirmed directly before any transaction."],
  ["Does it cost anything to submit a request?", "No, submitting a vehicle request is free."],
  ["Can I sell my car or join as an agent?", "Yes. Submit your vehicle details to reach genuine buyers, or apply as an agent to receive buyer enquiries matching what you can source."],
];

function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur shadow-sm">
      <div className="bg-night text-white text-center text-xs sm:text-sm py-2 px-4">
        Looking for a car in Zambia? Connect with vetted agents &amp; sellers
      </div>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#top" className="text-2xl font-extrabold tracking-tight text-ink">autoace<span className="text-primary">zed</span></a>
        <nav className="hidden md:flex gap-6 text-sm font-bold text-muted">
          <a href="#request" className="hover:text-ink">Find a Car</a>
          <a href="#demand" className="hover:text-ink">Popular Requests</a>
          <a href="#how" className="hover:text-ink">How it works</a>
          <a href="#faq" className="hover:text-ink">FAQ</a>
        </nav>
        <div>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-4 py-2 rounded-full bg-primary hover:bg-pdark text-white text-sm font-bold">Sign in</button>
            </SignInButton>
          </SignedOut>
          <SignedIn><UserButton /></SignedIn>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const { getToken } = useAuth();
  const [tab, setTab] = useState("find");
  const [car, setCar] = useState("");
  const [phone, setPhone] = useState("");
  const [budget, setBudget] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const T = {
    find: { label: "Find a car", icon: "search", ph: "Which car are you looking for? (e.g. Toyota Axio, Prado TX, Hilux)", cta: "Find my car" },
    sell: { label: "Sell my car", icon: "sell", ph: "Registration / model (e.g. BAF 1234 Honda Fit)", cta: "Submit vehicle" },
    agent: { label: "Become an agent", icon: "badge", ph: "", cta: "Become an agent" },
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      const token = await getToken();
      const r = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ kind: tab, car, phone, budget: tab === "find" ? budget : "" }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok) { setMsg({ ok: true, t: "Thank you! We have received your details and will be in touch soon." }); setCar(""); setPhone(""); }
      else setMsg({ ok: false, t: d.error || "Something went wrong. Please try again." });
    } catch { setMsg({ ok: false, t: "Network problem. Please try again." }); }
    setBusy(false);
  };

  return (
    <section id="request" className="bg-night text-white pt-12 pb-14 px-6">
      <div className="max-w-3xl mx-auto text-center mb-8">
        <h1 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-tight">Find the right car through the right connection in Zambia</h1>
        <p className="text-gray-300 mt-3">Tell us what you are looking for, your budget in Zambian Kwacha, and where you are. We connect you directly with vetted agents and sellers across Lusaka and nationwide.</p>
      </div>
      <form onSubmit={submit} className="max-w-3xl mx-auto bg-white text-ink rounded-2xl shadow-xl p-5 sm:p-7">
        <div className="flex flex-wrap justify-center gap-2 mb-5">
          {Object.entries(T).map(([k, v]) => (
            <button type="button" key={k} onClick={() => { setTab(k); setMsg(null); }}
              className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1.5 ${tab === k ? "bg-night text-white" : "text-muted hover:bg-soft"}`}>
              <Icon n={v.icon} />{v.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {tab !== "agent" && (
            <input value={car} onChange={(e) => setCar(e.target.value)} placeholder={T[tab].ph} maxLength={120}
              className="w-full px-4 py-3.5 bg-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-primary" />
          )}
          {tab === "find" && (
            <select value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full px-4 py-3.5 bg-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">Budget (optional)</option>
              {BUDGETS.map((b) => <option key={b}>{b}</option>)}
            </select>
          )}
          <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" required placeholder="Your phone / WhatsApp number (e.g. 097... or +260...)"
            className="w-full px-4 py-3.5 bg-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-primary" />
          <button disabled={busy} className="py-3.5 rounded-xl bg-primary hover:bg-pdark disabled:opacity-60 text-white font-bold">
            {busy ? "Sending..." : T[tab].cta}
          </button>
          {msg && <p className={`text-sm font-semibold text-center ${msg.ok ? "text-green-600" : "text-red-600"}`}>{msg.t}</p>}
        </div>
      </form>
      <div className="max-w-3xl mx-auto mt-6 flex flex-wrap justify-center gap-2">
        {BUDGETS.map((b) => (
          <button key={b} type="button" onClick={() => { setTab("find"); setBudget(b); }}
            className="px-3.5 py-1.5 rounded-full bg-white/90 text-ink text-sm font-bold hover:bg-blue-50 hover:text-primary">{b}</button>
        ))}
      </div>
    </section>
  );
}

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="max-w-3xl mx-auto px-6 py-14">
      <h2 className="text-3xl font-extrabold text-center mb-8">Frequently Asked Questions</h2>
      <div className="space-y-3">
        {FAQ.map(([q, a], i) => (
          <div key={q} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full px-6 py-4 text-left font-bold flex justify-between items-center hover:text-primary">
              {q}<Icon n={open === i ? "expand_less" : "expand_more"} />
            </button>
            {open === i && <p className="px-6 pb-5 text-muted">{a}</p>}
          </div>
        ))}
      </div>
      <p className="mt-8 text-center text-xs text-muted">AutoAce Zed coordinates buyer-to-agent matching. Always verify inspection, documents (including RTSA whitebook and ZRA duty clearance) and payment terms before completing any transaction.</p>
    </section>
  );
}

export default function App() {
  return (
    <div id="top" className="bg-gray-50 text-ink">
      <Header />
      <Hero />

      <section className="max-w-7xl mx-auto px-6 pt-12 pb-10">
        <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight">Explore vehicles by need</h2>
        <p className="text-muted mb-6">Find options that match your budget and lifestyle in Zambia</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATS.map(([t, i]) => (
            <a href="#request" key={t} className="bg-white rounded-xl p-5 flex flex-col items-center gap-2 text-center shadow-sm hover:shadow-lg hover:-translate-y-1 transition">
              <Icon n={i} c="text-primary !text-4xl" /><span className="font-bold">{t}</span>
            </a>
          ))}
        </div>
      </section>

      <section id="demand" className="bg-soft py-14">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-primary font-extrabold uppercase tracking-wider text-sm flex items-center gap-1"><Icon n="bolt" />Demand matching</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-1">Popular vehicles people ask for in Zambia</h2>
          <p className="text-muted text-sm mb-6">Examples of the kinds of requests we coordinate.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {DEMAND.map(([n, tag, loc, b]) => (
              <div key={n} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl transition flex flex-col justify-between">
                <div>
                  <span className="bg-blue-50 text-primary text-xs font-bold px-2 py-0.5 rounded-full">{tag}</span>
                  <h3 className="text-xl font-bold mt-3">{n}</h3>
                  <p className="text-muted text-sm flex items-center gap-1 mt-1"><Icon n="location_on" c="text-primary" />{loc}</p>
                </div>
                <div className="mt-6">
                  <p className="text-primary font-extrabold text-lg">Guide budget: {b}</p>
                  <a href="#request" className="mt-3 block text-center py-2.5 rounded-xl bg-night hover:bg-black text-white text-sm font-bold">Request similar vehicle</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="max-w-7xl mx-auto px-6 py-14">
        <h2 className="text-2xl sm:text-3xl font-extrabold mb-8">How AutoAce Zed works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[["edit_note", "1. Tell us what you need", "Share the car, your Kwacha budget and your location."],
            ["handshake", "2. We match you", "We connect your request with vetted agents and genuine sellers."],
            ["verified_user", "3. Verify, then buy", "Inspect the car and confirm RTSA and ZRA documents before paying."]].map(([i, t, d]) => (
            <div key={t} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center mb-4"><Icon n={i} c="!text-3xl" /></div>
              <h3 className="font-bold text-lg">{t}</h3><p className="text-muted mt-1">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <Faq />

      <footer className="bg-night text-gray-300">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row justify-between gap-6 text-sm">
          <div>
            <p className="text-white text-xl font-extrabold">autoace<span className="text-primary">zed</span></p>
            <p className="mt-2 max-w-sm">Connecting Zambia's vehicle buyers with verified agents and genuine sellers. Hubs: Lusaka and Kitwe.</p>
          </div>
          <div>
            <p className="text-white font-bold mb-2">Contact</p>
            <a className="hover:text-white" href="mailto:info@autoacezed.com">info@autoacezed.com</a>
          </div>
        </div>
        <p className="border-t border-white/10 text-center text-xs py-4">© 2026 AutoAce Zed Ltd. All rights reserved.</p>
      </footer>
    </div>
  );
}
