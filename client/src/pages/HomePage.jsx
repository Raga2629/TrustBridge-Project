import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search, MapPin, Shield, Users, Star, Building2, Heart,
  MessageCircle, Award, AlertCircle, ArrowRight, ChevronRight,
  CheckCircle, Zap, Lock, TrendingUp,
} from "lucide-react";
import { serviceAPI, userAPI, statsAPI } from "../services/api";
import { ServiceCard, ResidentCard, LoadingSpinner } from "../components/ui/Cards";
import JourneyCarousel from "../components/ui/JourneyCarousel";

const LOCS = ["Bachupally", "Miyapur", "Secunderabad"];

const CATS = [
  { label: "Medical",     icon: "🏥", q: "Medical"        },
  { label: "Grocery",     icon: "🛒", q: "Grocery Stores"  },
  { label: "Restaurants", icon: "🍽️", q: "Restaurants"    },
  { label: "Hostels",     icon: "🏠", q: "Hostels"         },
  { label: "Education",   icon: "📚", q: "Education"       },
  { label: "Transport",   icon: "🚌", q: "Transportation"  },
  { label: "Pharmacies",  icon: "💊", q: "Pharmacies"      },
  { label: "Clinics",     icon: "🩺", q: "Clinics"         },
];

const TESTIMONIALS = [
  { text: "Within 3 days of arriving in Bachupally I had found a hostel, a nearby clinic, and a local guide who helped me with everything. TrustBridge felt like having a friend already there.", name: "Priya Sharma",  role: "Student, Bihar to Hyderabad",             avatar: "P", color: "#2563EB" },
  { text: "The verified resident I connected with knew every shortcut, shop, and service in Miyapur. It saved me weeks of figuring things out on my own.",                                      name: "Arjun Reddy",   role: "IT Professional, Chennai to Hyderabad",   avatar: "A", color: "#059669" },
  { text: "I was nervous about moving with two kids. TrustBridge helped us find a school, a doctor, and a trustworthy grocery store before we even arrived.",                                   name: "Fatima Khan",   role: "Family, Mumbai to Hyderabad",             avatar: "F", color: "#7C3AED" },
];

const GUIDES = [
  { name: "Rajesh Kumar", area: "Miyapur",      score: 94, color: "#059669", i: "R", delay: 0.3 },
  { name: "Sneha Reddy",  area: "Bachupally",   score: 88, color: "#2563eb", i: "S", delay: 0.4 },
  { name: "Anil Sharma",  area: "Secunderabad", score: 82, color: "#7c3aed", i: "A", delay: 0.5 },
];

// Format a raw count into a display string.
// Shows exact number when small; adds + suffix once it clears a threshold.
function fmtStat(n) {
  if (n === null || n === undefined) return "—";
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k+`;
  if (n >= 100)  return `${n}+`;
  return String(n);
}

export default function HomePage() {
  const [q,   setQ]   = useState("");
  const [loc, setLoc] = useState("");
  const [svcs, setSvcs] = useState([]);
  const [res,  setRes]  = useState([]);
  const [loading, setLd] = useState(true);
  const [err, setErr]   = useState(false);
  const [stats, setStats] = useState(null); // null = loading, object = loaded

  useEffect(() => {
    Promise.all([serviceAPI.getAll({ sort: "featured" }), userAPI.getResidents({ minTrustScore: 70 })])
      .then(([s, r]) => { setSvcs(s.data.data.slice(0, 6)); setRes(r.data.data.slice(0, 3)); })
      .catch(() => setErr(true))
      .finally(() => setLd(false));

    statsAPI.get()
      .then(({ data }) => setStats(data.data))
      .catch(() => setStats({})); // silently fall back — UI shows fallbacks
  }, []);

  const go = (e) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (q)   p.set("search",   q);
    if (loc) p.set("location", loc);
    window.location.href = `/services?${p}`;
  };

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#fff", color: "#0f172a" }}>

      {/* offline notice */}
      {err && (
        <div style={{ background: "#fffbeb", borderBottom: "1px solid #fde68a", padding: "8px 0" }}>
          <div className="wrap" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#92400e" }}>
            <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
            Backend offline — run <code style={{ background: "#fef3c7", padding: "1px 6px", borderRadius: 4, fontFamily: "monospace" }}>npm run dev:server</code>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ HERO */}
      <section style={{
        background: "linear-gradient(150deg,#060c1d 0%,#0d1d42 45%,#071224 100%)",
        position: "relative", overflow: "hidden",
        minHeight: "88vh", display: "flex", alignItems: "center",
      }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 55% 65% at 8% 50%, rgba(37,99,235,0.18) 0%, transparent 60%), radial-gradient(ellipse 35% 45% at 92% 25%, rgba(16,185,129,0.08) 0%, transparent 55%)" }} />
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.025,
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        <div className="wrap" style={{ position: "relative", paddingTop: 72, paddingBottom: 72, width: "100%" }}>
          <div style={{ display: "grid", gridTemplateColumns: "55fr 45fr", gap: 56, alignItems: "center" }} className="hero-grid">

            {/* LEFT — copy */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#60a5fa", marginBottom: 20 }}>
                Trusted Local Assistance · Hyderabad
              </p>

              <h1 style={{ fontSize: "clamp(2.25rem, 4vw, 3.25rem)", fontWeight: 800, color: "#fff", lineHeight: 1.1, letterSpacing: "-0.025em", margin: "0 0 22px" }}>
                Settle into your<br />
                <span style={{ background: "linear-gradient(90deg,#60a5fa,#34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  new city safely
                </span>
              </h1>

              <p style={{ fontSize: 16, color: "#94a3b8", lineHeight: 1.75, maxWidth: 420, margin: "0 0 36px" }}>
                Connect with <strong style={{ color: "#e2e8f0", fontWeight: 600 }}>local residents</strong>,
                book trusted services, and get real community support.
              </p>

              {/* search */}
              <form onSubmit={go} style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", flexWrap: "wrap", background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 20px 50px rgba(0,0,0,0.5)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", flex: 1, minWidth: 0 }}>
                    <Search style={{ width: 15, height: 15, color: "#94a3b8", flexShrink: 0 }} />
                    <input value={q} onChange={e => setQ(e.target.value)} placeholder="Clinic, hostel, grocery store…"
                      style={{ flex: 1, border: "none", outline: "none", fontSize: 14, color: "#0f172a", background: "transparent" }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderLeft: "1px solid #f1f5f9" }}>
                    <MapPin style={{ width: 13, height: 13, color: "#94a3b8", flexShrink: 0 }} />
                    <select value={loc} onChange={e => setLoc(e.target.value)} style={{ border: "none", outline: "none", fontSize: 13, color: "#475569", background: "transparent", cursor: "pointer" }}>
                      <option value="">All Areas</option>
                      {LOCS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div style={{ padding: 6 }}>
                    <button type="submit" style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "9px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 12px rgba(37,99,235,0.4)" }}>
                      Search
                    </button>
                  </div>
                </div>
              </form>

              {/* CTAs */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 44 }}>
                <Link to="/register" style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#2563eb", color: "#fff", textDecoration: "none", borderRadius: 10, padding: "11px 22px", fontSize: 14, fontWeight: 700, boxShadow: "0 4px 18px rgba(37,99,235,0.45)" }}>
                  Get Started Free <ArrowRight style={{ width: 15, height: 15 }} />
                </Link>
                <Link to="/residents" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#94a3b8", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>
                  Meet local guides <ChevronRight style={{ width: 15, height: 15 }} />
                </Link>
              </div>

              {/* metrics strip */}
              <div style={{ display: "flex", gap: 32, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                {[
                  { v: stats ? fmtStat(stats.totalNewcomers)    : "—", l: "Newcomers helped"  },
                  { v: stats ? fmtStat(stats.verifiedResidents) : "—", l: "Verified residents" },
                  { v: "4.9 ★", l: "Average rating" },
                ].map(s => (
                  <div key={s.l}>
                    <div style={{ fontSize: "1.125rem", fontWeight: 800, color: "#fff", lineHeight: 1 }}>{s.v}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* RIGHT — local network panel (30% smaller, no floating chips) */}
            <motion.div initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }} style={{ position: "relative" }} className="hero-right">
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 18, padding: 18, backdropFilter: "blur(20px)", boxShadow: "0 20px 56px rgba(0,0,0,0.4)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em" }}>Your local network</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#34d399", fontWeight: 700 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#34d399", display: "inline-block" }} className="pulse-dot" />
                    3 online
                  </span>
                </div>

                {GUIDES.map(g => (
                  <motion.div key={g.name} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: g.delay }}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", borderRadius: 11, marginBottom: 7, background: "rgba(255,255,255,0.05)" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: g.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                      {g.i}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>{g.name}</span>
                        <Shield style={{ width: 9, height: 9, color: "#34d399", flexShrink: 0 }} />
                      </div>
                      <span style={{ fontSize: 10, color: "#64748b" }}>{g.area}</span>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#34d399" }}>{g.score}</div>
                      <div style={{ fontSize: 8, color: "#475569", textTransform: "uppercase" }}>trust</div>
                    </div>
                  </motion.div>
                ))}

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
                  style={{ marginTop: 4, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 13px", borderRadius: 11, background: "rgba(37,99,235,0.18)", border: "1px solid rgba(59,130,246,0.28)" }}>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0" }}>Ready to connect?</p>
                    <p style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>Free — no credit card</p>
                  </div>
                  <Link to="/register" style={{ background: "#2563eb", color: "#fff", textDecoration: "none", borderRadius: 7, padding: "5px 13px", fontSize: 11, fontWeight: 700 }}>
                    Join now
                  </Link>
                </motion.div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════ JOURNEY CAROUSEL */}
      <JourneyCarousel />

      {/* ════════════════════════════════════════════ SOCIAL PROOF */}
      <section style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
        <div className="wrap">
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "stretch" }}>
            {[
              { v: stats ? fmtStat(stats.totalNewcomers)    : "—", l: "Newcomers helped",         sub: "across Hyderabad" },
              { v: stats ? fmtStat(stats.verifiedResidents) : "—", l: "Verified community members", sub: "with Aadhaar ID" },
              { v: stats ? fmtStat(stats.activeServices)    : "—", l: "Trusted services",           sub: "across 3 areas"  },
              { v: stats ? fmtStat(stats.totalReviews)      : "—", l: "Verified reviews",           sub: "AI-moderated"    },
            ].map((s, i) => (
              <motion.div key={s.l} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                style={{ flex: "1 1 200px", padding: "32px 24px", textAlign: "center", borderRight: i < 3 ? "1px solid #e2e8f0" : "none" }}>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: "#1e40af", lineHeight: 1 }}>{s.v}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginTop: 6 }}>{s.l}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>{s.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════ HOW IT WORKS */}
      <section style={{ padding: "100px 0", background: "#fff" }}>
        <div className="wrap">
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>How it works</p>
            <h2 style={{ fontSize: "clamp(1.75rem,3vw,2.5rem)", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.025em", lineHeight: 1.15, margin: 0 }}>
              From arrival to settled —<br />in four simple steps
            </h2>
          </div>

          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", top: 32, left: "12.5%", right: "12.5%", height: 2, background: "linear-gradient(90deg, transparent, #dbeafe 15%, #dbeafe 85%, transparent)" }} className="journey-line" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 0 }} className="journey-grid">
              {[
                { icon: "🏙️", step: "01", title: "You arrive",       desc: "New city. Unknown streets. It can feel overwhelming."         },
                { icon: "🤝", step: "02", title: "Create an account", desc: "Sign up in 2 minutes as newcomer, resident or provider."      },
                { icon: "🔍", step: "03", title: "Connect & explore", desc: "Match with a verified guide. Browse trusted services."        },
                { icon: "🏡", step: "04", title: "Feel at home",      desc: "Book services. Chat with guides. Join your community."        },
              ].map((s, i) => (
                <motion.div key={s.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0 20px" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fff", border: "2px solid #dbeafe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem", marginBottom: 16, position: "relative", zIndex: 1, boxShadow: "0 4px 16px rgba(37,99,235,0.1)" }}>
                    {s.icon}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#93c5fd", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>{s.step}</span>
                  <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#0f172a", marginBottom: 8, lineHeight: 1.3 }}>{s.title}</h3>
                  <p style={{ fontSize: "0.8125rem", color: "#64748b", lineHeight: 1.6, maxWidth: 180 }}>{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 56 }}>
            <Link to="/register" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#2563eb", color: "#fff", textDecoration: "none", borderRadius: 10, padding: "13px 28px", fontSize: 14, fontWeight: 700, boxShadow: "0 4px 20px rgba(37,99,235,0.35)" }}>
              Start your journey <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════ CATEGORIES */}
      <section style={{ padding: "80px 0", background: "#f8fafc" }}>
        <div className="wrap">
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 40 }}>
            <div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>Everything you need, nearby</h2>
              <p style={{ fontSize: 14, color: "#64748b", marginTop: 6 }}>Verified services across all essential categories</p>
            </div>
            <Link to="/services" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700, color: "#2563eb", textDecoration: "none" }}>
              Browse all <ArrowRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 16 }} className="cats-grid">
            {CATS.map((cat, i) => (
              <motion.div key={cat.label} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
                <Link to={`/services?category=${encodeURIComponent(cat.q)}`} style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "4px 0" }} className="cat-link">
                  <div style={{ width: 60, height: 60, borderRadius: 18, background: "#fff", border: "1.5px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.625rem", transition: "all 0.2s" }} className="cat-icon">
                    {cat.icon}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#475569", textAlign: "center", lineHeight: 1.3 }}>{cat.label}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════ FEATURED SERVICES */}
      {loading && <section style={{ padding: "80px 0", background: "#fff" }}><div className="wrap"><LoadingSpinner /></div></section>}
      {!loading && svcs.length > 0 && (
        <section style={{ padding: "80px 0", background: "#fff" }}>
          <div className="wrap">
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 40 }}>
              <div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>Featured Services</h2>
                <p style={{ fontSize: 14, color: "#64748b", marginTop: 6 }}>Top-rated, verified providers near you</p>
              </div>
              <Link to="/services" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700, color: "#2563eb", textDecoration: "none" }}>
                View all <ArrowRight style={{ width: 14, height: 14 }} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {svcs.map((s, i) => <ServiceCard key={s._id} service={s} index={i} />)}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════ WHY TRUSTBRIDGE */}
      <section style={{ padding: "100px 0", background: "#fff" }}>
        <div className="wrap">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }} className="trust-grid">

            {/* left — feature rows */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Why TrustBridge</p>
              <h2 style={{ fontSize: "clamp(1.75rem,2.5vw,2.25rem)", fontWeight: 800, color: "#0f172a", lineHeight: 1.2, letterSpacing: "-0.025em", marginBottom: 20 }}>
                Built on real trust,<br />not just good intentions
              </h2>
              <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.75, marginBottom: 48, maxWidth: 420 }}>
                Every person on TrustBridge is verified. Every review is moderated.
                Every trust score is public. Because settling into a new city is stressful enough.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                {[
                  { Icon: Shield,     title: "Aadhaar-Verified Identities",  desc: "Every resident passes a government ID check before they can help newcomers."      },
                  { Icon: Zap,        title: "AI-Powered Review Guard",      desc: "Machine learning removes fake reviews before they reach you — ratings are real."  },
                  { Icon: TrendingUp, title: "Live Trust Scores",            desc: "Transparent ratings show exactly how reliable each guide or provider is."         },
                  { Icon: Lock,       title: "Private, Secure Messaging",    desc: "All chats stay inside TrustBridge. Your contact details are never shared."        },
                ].map((f, i) => (
                  <motion.div key={f.title} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                    style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "#eff6ff", flexShrink: 0, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <f.Icon style={{ width: 18, height: 18, color: "#2563eb" }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 5 }}>{f.title}</h3>
                      <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.65 }}>{f.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* right — trust stat */}
            <div>
              <div style={{ background: "linear-gradient(145deg,#1e3a8a,#2563eb)", borderRadius: 24, padding: "44px 36px", textAlign: "center", marginBottom: 24, boxShadow: "0 20px 60px rgba(37,99,235,0.3)" }}>
                <div style={{ fontSize: "4rem", fontWeight: 900, color: "#fff", lineHeight: 1 }}>98%</div>
                <p style={{ color: "#bfdbfe", fontSize: 14, marginTop: 10, lineHeight: 1.5 }}>of newcomers say they felt safe<br />within their first week</p>
                <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 16 }}>
                  {[1,2,3,4,5].map(i => <Star key={i} style={{ width: 16, height: 16, color: "#fbbf24", fill: "#fbbf24" }} />)}
                </div>
                <p style={{ color: "#93c5fd", fontSize: 12, marginTop: 6 }}>Based on {stats ? fmtStat(stats.totalReviews) : "—"} verified reviews</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {["Every resident is Aadhaar-verified", "AI removes fake reviews automatically", "Your data stays private and secure", "Free to join — no credit card needed", "Available in Bachupally, Miyapur and Secunderabad"].map(pt => (
                  <div key={pt} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <CheckCircle style={{ width: 16, height: 16, color: "#16a34a", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "#374151" }}>{pt}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 32 }}>
                <Link to="/register" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#2563eb", color: "#fff", textDecoration: "none", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 700, boxShadow: "0 4px 16px rgba(37,99,235,0.35)" }}>
                  Get Started Free <ArrowRight style={{ width: 15, height: 15 }} />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ TESTIMONIALS */}
      <section style={{ padding: "100px 0", background: "linear-gradient(150deg,#060c1d 0%,#0d1d42 50%,#071224 100%)" }}>
        <div className="wrap">
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#60a5fa", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>Real stories</p>
            <h2 style={{ fontSize: "clamp(1.75rem,2.5vw,2.25rem)", fontWeight: 800, color: "#fff", letterSpacing: "-0.025em" }}>
              Newcomers who found their footing
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }} className="testi-grid">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "32px 28px" }}>
                <div style={{ display: "flex", gap: 3, marginBottom: 20 }}>
                  {[1,2,3,4,5].map(s => <Star key={s} style={{ width: 13, height: 13, color: "#fbbf24", fill: "#fbbf24" }} />)}
                </div>
                <p style={{ fontSize: "0.9375rem", color: "#cbd5e1", lineHeight: 1.75, marginBottom: 28 }}>&ldquo;{t.text}&rdquo;</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: t.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{t.avatar}</div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{t.name}</p>
                    <p style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ FINAL CTA */}
      <section style={{ padding: "120px 0", background: "#fff" }}>
        <div className="wrap" style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px", boxShadow: "0 8px 32px rgba(37,99,235,0.45)" }}>
              <Shield style={{ width: 36, height: 36, color: "#fff" }} />
            </div>
            <h2 style={{ fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 900, color: "#0f172a", lineHeight: 1.1, letterSpacing: "-0.03em", margin: "0 0 20px" }}>
              Your new city is waiting.<br />
              <span style={{ color: "#2563eb" }}>Start with people you can trust.</span>
            </h2>
            <p style={{ fontSize: 16, color: "#64748b", lineHeight: 1.7, maxWidth: 480, margin: "0 auto 40px" }}>
              Thousands of newcomers arrived alone and found a community here. Join them — free, verified, and starting right now.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
              <Link to="/register" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#2563eb", color: "#fff", textDecoration: "none", borderRadius: 12, padding: "15px 32px", fontSize: 15, fontWeight: 800, boxShadow: "0 6px 24px rgba(37,99,235,0.45)" }}>
                Get Started Free <ArrowRight style={{ width: 17, height: 17 }} />
              </Link>
              <Link to="/services" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#f8fafc", color: "#374151", textDecoration: "none", borderRadius: 12, padding: "15px 32px", fontSize: 15, fontWeight: 700, border: "1.5px solid #e2e8f0" }}>
                Browse Services
              </Link>
            </div>
            <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 24 }}>No credit card required · Bachupally · Miyapur · Secunderabad</p>
          </motion.div>
        </div>
      </section>

    </div>
  );
}