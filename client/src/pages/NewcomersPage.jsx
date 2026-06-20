import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, MessageCircle, Search, Calendar } from "lucide-react";
import { userAPI, chatAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { LoadingSpinner } from "../components/ui/Cards";
import toast from "react-hot-toast";

const AV_COLORS = ["#2563eb","#7c3aed","#0891b2","#16a34a","#d97706","#dc2626","#db2777","#0f766e"];
const av = n => AV_COLORS[(n?.charCodeAt(0)||0) % AV_COLORS.length];

const AREAS = ["All Areas", "Bachupally", "Miyapur", "Secunderabad"];

function timeAgo(d) {
  if (!d) return "";
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 3600)  return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

export default function NewcomersPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [newcomers, setNewcomers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [area,      setArea]      = useState("All Areas");
  const [messaging, setMessaging] = useState(null);

  useEffect(() => {
    userAPI.getNewcomers()
      .then(({ data }) => setNewcomers(data.data || []))
      .catch(() => setNewcomers([]))
      .finally(() => setLoading(false));
  }, []);

  const startChat = async (newcomerId) => {
    if (!user) { nav("/login"); return; }
    setMessaging(newcomerId);
    try {
      const { data } = await chatAPI.createConversation(newcomerId);
      nav(`/chat?conversation=${data.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not start conversation");
    } finally { setMessaging(null); }
  };

  const filtered = newcomers.filter(n => {
    const matchArea   = area === "All Areas" || n.location === area;
    const name        = n.name || "";
    const location    = n.location || "";
    const matchSearch = !search ||
      name.toLowerCase().includes(search.toLowerCase()) ||
      location.toLowerCase().includes(search.toLowerCase());
    return matchArea && matchSearch;
  });

  if (loading) return <LoadingSpinner size="lg"/>;

  return (
    <div style={{ background:"#f0f4f8", minHeight:"100vh", fontFamily:"Inter,system-ui,sans-serif" }}>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#0f172a,#1e3a5f)", padding:"40px 0 32px" }}>
        <div className="wrap">
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
            <span style={{ fontSize:12, fontWeight:700, color:"#93c5fd", letterSpacing:"0.08em", textTransform:"uppercase" }}>
              Community Members
            </span>
          </div>
          <h1 style={{ fontSize:"clamp(1.4rem,3vw,1.8rem)", fontWeight:900, color:"#fff",
            letterSpacing:"-0.02em", margin:"0 0 8px" }}>
            Browse Newcomers
          </h1>
          <p style={{ fontSize:14, color:"#bfdbfe", margin:"0 0 24px" }}>
            Connect with newcomers in your area and offer your local guidance and support.
          </p>

          {/* Search + filter */}
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <div style={{ position:"relative", flex:1, minWidth:200 }}>
              <Search style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)",
                width:15, height:15, color:"#94a3b8" }}/>
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Search by name or location…"
                style={{ width:"100%", padding:"11px 14px 11px 42px", borderRadius:10, border:"none",
                  fontSize:13, outline:"none", boxSizing:"border-box",
                  background:"rgba(255,255,255,0.95)" }}/>
            </div>
            <select value={area} onChange={e=>setArea(e.target.value)}
              style={{ padding:"11px 16px", borderRadius:10, border:"none", fontSize:13,
                background:"rgba(255,255,255,0.95)", cursor:"pointer", outline:"none" }}>
              {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="wrap" style={{ paddingTop:28, paddingBottom:56 }}>
        <p style={{ fontSize:13, color:"#64748b", marginBottom:20 }}>
          <span style={{ fontWeight:800, color:"#0f172a" }}>{filtered.length}</span> newcomer{filtered.length!==1?"s":""} found
        </p>

        {filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"56px 24px", background:"#fff",
            border:"1.5px dashed #e2e8f0", borderRadius:16 }}>
            <p style={{ fontSize:36, margin:"0 0 12px" }}>🧭</p>
            <p style={{ fontSize:15, fontWeight:700, color:"#0f172a", margin:"0 0 6px" }}>No newcomers found</p>
            <p style={{ fontSize:13, color:"#64748b", margin:0 }}>
              {search ? `No results for "${search}". Try a different name or location.` :
                "No newcomers in this area yet. Check back soon."}
            </p>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:16 }}>
            {filtered.map((n, i) => {
              const name     = n.name || "Newcomer";
              const location = n.location || "Bachupally";
              const id       = n._id;
              const joined   = n.createdAt;

              return (
                <motion.div key={id||i} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                  transition={{ delay:i*0.04 }}
                  style={{ background:"#fff", border:"1.5px solid #f1f5f9", borderRadius:16,
                    padding:"20px", boxShadow:"0 1px 6px rgba(0,0,0,0.05)",
                    transition:"box-shadow 0.15s" }}
                  onMouseEnter={e=>e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,0.09)"}
                  onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 6px rgba(0,0,0,0.05)"}>

                  {/* Avatar + name */}
                  <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:14 }}>
                    <div style={{ width:48, height:48, borderRadius:"50%", background:av(name),
                      display:"flex", alignItems:"center", justifyContent:"center",
                      color:"white", fontSize:20, fontWeight:800, flexShrink:0, overflow:"hidden" }}>
                      {n.avatar
                        ? <img src={n.avatar} alt={name}
                            style={{ width:48, height:48, objectFit:"cover" }}/>
                        : name.charAt(0)}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:15, fontWeight:700, color:"#0f172a", margin:"0 0 2px",
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{name}</p>
                      <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:"#64748b" }}>
                        <MapPin style={{ width:11, height:11, flexShrink:0 }}/> {location}
                      </div>
                    </div>
                    {/* Newcomer badge */}
                    <span style={{ fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:99,
                      background:"#eff6ff", color:"#2563eb", flexShrink:0 }}>
                      Newcomer
                    </span>
                  </div>

                  {/* Help needed */}
                  <div style={{ background:"#f8fafc", borderRadius:10, padding:"10px 12px", marginBottom:14 }}>
                    <p style={{ fontSize:11, fontWeight:700, color:"#94a3b8",
                      textTransform:"uppercase", letterSpacing:"0.05em", margin:"0 0 4px" }}>
                      Looking for help with
                    </p>
                    <p style={{ fontSize:12, color:"#475569", margin:0, lineHeight:1.5 }}>
                      Local services, area guidance, and community connections in {location}.
                    </p>
                  </div>

                  {/* Footer: joined + message */}
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color:"#94a3b8" }}>
                      <Calendar style={{ width:11, height:11 }}/>
                      Joined {timeAgo(joined)}
                    </div>
                    <button
                      onClick={() => startChat(id)}
                      disabled={messaging === id || !user || user.role === "newcomer"}
                      style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px",
                        borderRadius:99, border:"none", fontSize:12, fontWeight:700, cursor:"pointer",
                        background: (!user || user.role === "newcomer") ? "#f1f5f9" : "#2563eb",
                        color:      (!user || user.role === "newcomer") ? "#94a3b8" : "#fff",
                        transition:"all 0.15s" }}>
                      <MessageCircle style={{ width:13, height:13 }}/>
                      {messaging === id ? "Opening…" : "Message"}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
