import { useState, useEffect } from "react";
import { Users, Building2, Calendar, AlertTriangle, Shield, Flag, Check, X, Clock, Star, TrendingUp, Zap } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { adminAPI, reviewAPI } from "../../services/api";
import { LoadingSpinner, EmptyState } from "../../components/ui/Cards";

function KpiCard({ emoji, label, value, sub }) {
  return (
    <div style={{background:"white",border:"1.5px solid #e2e8f0",borderRadius:14,padding:"16px 18px",boxShadow:"0 1px 3px rgba(0,0,0,0.04),0 4px 16px rgba(0,0,0,0.06)"}}>
      <div style={{fontSize:22,marginBottom:6}}>{emoji}</div>
      <div style={{fontSize:24,fontWeight:800,color:"#0f172a",lineHeight:1}}>{value ?? 0}</div>
      <div style={{fontSize:12,fontWeight:600,color:"#64748b",marginTop:4}}>{label}</div>
      {sub && <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{sub}</div>}
    </div>
  );
}

function RoleBadge({ role }) {
  const map = { newcomer: ["#dbeafe","#1d4ed8"], resident: ["#dcfce7","#15803d"], provider: ["#ede9fe","#7c3aed"], admin: ["#fee2e2","#b91c1c"] };
  const [bg, fg] = map[role] || ["#f1f5f9","#475569"];
  return (
    <span style={{background:bg,color:fg,fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:999,textTransform:"capitalize"}}>{role}</span>
  );
}

function timeAgo(d) {
  if (!d) return "";
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

export default function AdminDashboard() {
  const [an, setAn]     = useState(null);
  const [revs, setRevs] = useState([]);
  const [prvs, setPrvs] = useState([]);
  const [dups, setDups] = useState([]);
  const [users, setUsers] = useState([]);
  const [ld, setLd]     = useState(true);
  const [tab, setTab]   = useState("reviews");

  useEffect(() => {
    Promise.all([
      adminAPI.getAnalytics(),
      reviewAPI.getPending(),
      adminAPI.getPendingProviders(),
      adminAPI.getDuplicates(),
      adminAPI.getUsers({ limit: 8, sort: "-createdAt" }),
    ])
      .then(([a, r, p, d, u]) => {
        setAn(a.data.data);
        setRevs(r.data.data);
        setPrvs(p.data.data);
        setDups(d.data.data);
        setUsers(u.data.data || []);
      })
      .finally(() => setLd(false));
  }, []);

  const modRev = async (id, action) => {
    await reviewAPI.moderate(id, action);
    setRevs((p) => p.filter((r) => r._id !== id));
    toast.success(`Review ${action}d`);
  };
  const modPrv = async (id, action) => {
    await adminAPI.verifyProvider(id, action);
    setPrvs((p) => p.filter((r) => r._id !== id));
    toast.success(`Provider ${action}d`);
  };

  if (ld) return <LoadingSpinner size="lg" />;

  const TABS = [
    { id: "reviews",    l: "Reviews",    n: revs.length, Icon: Flag },
    { id: "providers",  l: "Providers",  n: prvs.length, Icon: Shield },
    { id: "duplicates", l: "Reports",    n: dups.length, Icon: AlertTriangle },
  ];

  const recentServices = an?.recentServices || [];

  return (
    <div className="wrap py-8" style={{fontFamily:"Inter,system-ui,sans-serif"}}>
      {/* Page title */}
      <div style={{marginBottom:28}}>
        <h1 style={{fontSize:22,fontWeight:800,color:"#0f172a",display:"flex",alignItems:"center",gap:8}}>
          <Zap style={{width:20,height:20,color:"#2563eb"}} /> Operations Center
        </h1>
        <p style={{fontSize:13,color:"#64748b",marginTop:3}}>Platform health, moderation queue, and activity at a glance.</p>
      </div>

      {/* KPI strip */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:28}} className="kpi-strip">
        <KpiCard emoji="👤" label="Total Users"       value={an?.users?.total}                    sub="all roles" />
        <KpiCard emoji="🏡" label="Active Residents"  value={an?.users?.residents}                sub="verified" />
        <KpiCard emoji="🏢" label="Active Providers"  value={an?.users?.providers}                sub="on platform" />
        <KpiCard emoji="📅" label="Bookings Today"    value={an?.bookings?.total}                 sub="all time" />
        <KpiCard emoji="🔎" label="Pending Reviews"   value={an?.moderation?.flaggedReviews ?? revs.length} sub="need action" />
      </div>

      {/* Two-column activity */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:28}} className="activity-grid">
        {/* Recent Registrations */}
        <div style={{background:"white",border:"1.5px solid #e2e8f0",borderRadius:14,padding:"20px 22px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
            <Users style={{width:15,height:15,color:"#2563eb"}} />
            <span style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>Recent Registrations</span>
          </div>
          {users.length === 0 ? (
            <p style={{fontSize:12,color:"#94a3b8",textAlign:"center",padding:"20px 0"}}>No users found</p>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {users.slice(0,7).map((u) => (
                <div key={u._id} style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:30,height:30,borderRadius:"50%",background:"#eff6ff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#2563eb",flexShrink:0}}>
                    {u.name?.charAt(0)}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:12,fontWeight:600,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.name}</p>
                    <p style={{fontSize:11,color:"#94a3b8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.email}</p>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3,flexShrink:0}}>
                    <RoleBadge role={u.role} />
                    <span style={{fontSize:10,color:"#94a3b8"}}>{timeAgo(u.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Services */}
        <div style={{background:"white",border:"1.5px solid #e2e8f0",borderRadius:14,padding:"20px 22px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
            <Building2 style={{width:15,height:15,color:"#2563eb"}} />
            <span style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>Recent Services</span>
          </div>
          {recentServices.length === 0 ? (
            <p style={{fontSize:12,color:"#94a3b8",textAlign:"center",padding:"20px 0"}}>No published services yet.</p>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {recentServices.slice(0,6).map((s) => (
                <div key={s._id} style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:30,height:30,borderRadius:8,background:"#f0fdf4",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#16a34a",flexShrink:0}}>
                    {s.title?.charAt(0)}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:12,fontWeight:600,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.title}</p>
                    <p style={{fontSize:11,color:"#94a3b8"}}>{s.provider?.user?.name || s.provider?.businessName || "—"}</p>
                  </div>
                  <span style={{background:"#dbeafe",color:"#1d4ed8",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:999,flexShrink:0}}>{s.category}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Moderation tabs */}
      <div>
        <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display:"inline-flex",alignItems:"center",gap:6,
                padding:"6px 14px",borderRadius:8,fontSize:13,fontWeight:600,
                border:"1.5px solid",cursor:"pointer",transition:"all 0.15s",
                background: tab === t.id ? "#2563eb" : "white",
                color: tab === t.id ? "white" : "#475569",
                borderColor: tab === t.id ? "#2563eb" : "#e2e8f0",
              }}
            >
              <t.Icon style={{width:14,height:14}} />
              {t.l}
              {t.n > 0 && (
                <span style={{
                  padding:"1px 7px",borderRadius:999,fontSize:10,fontWeight:800,
                  background: tab === t.id ? "rgba(255,255,255,0.25)" : "#fee2e2",
                  color: tab === t.id ? "white" : "#b91c1c",
                }}>{t.n}</span>
              )}
            </button>
          ))}
        </div>

        {tab === "reviews" && (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {!revs.length ? (
              <EmptyState icon={Flag} title="No pending reviews" description="All reviews have been moderated — great work!" />
            ) : revs.map((r, i) => (
              <motion.div key={r._id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                style={{background:"white",border:"1.5px solid #e2e8f0",borderRadius:12,padding:"16px 18px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:13,fontWeight:700,color:"#0f172a",marginBottom:4}}>{r.service?.title || "Service"}</p>
                    <p style={{fontSize:12,color:"#64748b",lineHeight:1.5,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{r.content}</p>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginTop:8}}>
                      <span style={{fontSize:11,color:"#94a3b8"}}>By {r.user?.name}</span>
                      <span style={{
                        background: (r.fakeDetection?.riskScore||0) > 0.7 ? "#fee2e2" : (r.fakeDetection?.riskScore||0) > 0.4 ? "#fef3c7" : "#dcfce7",
                        color: (r.fakeDetection?.riskScore||0) > 0.7 ? "#b91c1c" : (r.fakeDetection?.riskScore||0) > 0.4 ? "#b45309" : "#15803d",
                        fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:999,
                      }}>
                        Risk: {(((r.fakeDetection?.riskScore)||0)*100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8,flexShrink:0}}>
                    <button onClick={() => modRev(r._id,"approve")} className="btn btn-success btn-sm" style={{fontSize:12,padding:"6px 12px"}}>
                      <Check style={{width:13,height:13}} /> Approve
                    </button>
                    <button onClick={() => modRev(r._id,"reject")} className="btn btn-danger btn-sm" style={{fontSize:12,padding:"6px 12px"}}>
                      <X style={{width:13,height:13}} /> Reject
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {tab === "providers" && (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {!prvs.length ? (
              <EmptyState icon={Shield} title="No pending verifications" description="All provider applications have been reviewed." />
            ) : prvs.map((p, i) => (
              <motion.div key={p._id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                style={{background:"white",border:"1.5px solid #e2e8f0",borderRadius:12,padding:"16px 18px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:38,height:38,borderRadius:10,background:"#eff6ff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:"#2563eb",flexShrink:0}}>
                    {p.businessName?.charAt(0)}
                  </div>
                  <div>
                    <p style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{p.businessName}</p>
                    <p style={{fontSize:11,color:"#64748b",marginTop:2}}>{p.user?.name} · Score: {p.verificationScore ?? "—"}</p>
                  </div>
                </div>
                <div style={{display:"flex",gap:8,flexShrink:0}}>
                  <button onClick={() => modPrv(p._id,"approve")} className="btn btn-success btn-sm" style={{fontSize:12,padding:"6px 12px"}}>
                    <Check style={{width:13,height:13}} /> Approve
                  </button>
                  <button onClick={() => modPrv(p._id,"reject")} className="btn btn-danger btn-sm" style={{fontSize:12,padding:"6px 12px"}}>
                    <X style={{width:13,height:13}} /> Reject
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {tab === "duplicates" && (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {!dups.length ? (
              <EmptyState icon={AlertTriangle} title="No duplicate accounts" description="No suspicious patterns detected. Platform looks healthy!" />
            ) : dups.map((d, i) => (
              <div key={i} style={{background:"#fef2f2",border:"1.5px solid #fecaca",borderRadius:12,padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
                <AlertTriangle style={{width:18,height:18,color:"#ef4444",flexShrink:0}} />
                <div>
                  <p style={{fontSize:13,fontWeight:700,color:"#b91c1c"}}>Phone: {d._id}</p>
                  <p style={{fontSize:11,color:"#ef4444",marginTop:2}}>{d.count} accounts using this number — review required</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width:900px) { .kpi-strip { grid-template-columns: repeat(3,1fr) !important; } }
        @media (max-width:640px) { .kpi-strip { grid-template-columns: repeat(2,1fr) !important; } .activity-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
