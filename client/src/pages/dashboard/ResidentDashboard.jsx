import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageSquare, ThumbsUp, Star, ChevronRight, CheckCircle, Camera, Upload } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { rewardAPI, userAPI } from "../../services/api";
import { LoadingSpinner } from "../../components/ui/Cards";

// Returns true only for data: URLs or real CDN/http URLs (not placehold.co placeholders)
function isRealAvatar(url) {
  if (!url) return false;
  if (url.startsWith('data:')) return true;           // base64 data URL — always show
  if (url.includes('placehold.co')) return false;     // placeholder — never show
  return url.startsWith('http');
}

const AV_COLORS = ["#2563eb","#7c3aed","#0891b2","#16a34a","#d97706","#dc2626","#db2777"];
const av = n => AV_COLORS[(n?.charCodeAt(0)||0) % AV_COLORS.length];

const CONN_LABELS = {
  local_resident:"Local Resident",student:"Student",employee:"Employee",
  business_owner:"Business Owner",other:"Other"
};

function getBadge(total) {
  if (total >= 50) return { label:"Top Contributor",      icon:"🏆", active:true  };
  if (total >= 20) return { label:"Trusted Contributor",  icon:"⭐", active:true  };
  if (total >= 5)  return { label:"Active Contributor",   icon:"✅", active:true  };
  return                   { label:"New Contributor",     icon:"🌱", active:true  };
}

function StatCard({ icon: Icon, iconBg, value, label, sublabel }) {
  return (
    <div style={{background:"white",border:"1.5px solid #e2e8f0",borderRadius:12,padding:"20px 22px",flex:1}}>
      <div style={{width:40,height:40,borderRadius:10,background:iconBg,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14}}>
        <Icon style={{width:20,height:20}}/>
      </div>
      <p style={{fontSize:28,fontWeight:800,color:"#0f172a",margin:"0 0 4px",lineHeight:1}}>{value}</p>
      <p style={{fontSize:13,fontWeight:600,color:"#0f172a",margin:"0 0 2px"}}>{label}</p>
      <p style={{fontSize:11,color:"#94a3b8",margin:0}}>{sublabel}</p>
    </div>
  );
}

function ActionCard({ icon, label, sublabel, color, to, onClick }) {
  const colors = {
    blue:  {bg:"#eff6ff",border:"#dbeafe",ic:"#2563eb",text:"#1d4ed8"},
    amber: {bg:"#fffbeb",border:"#fde68a",ic:"#d97706",text:"#b45309"},
    green: {bg:"#f0fdf4",border:"#bbf7d0",ic:"#16a34a",text:"#15803d"},
    purple:{bg:"#faf5ff",border:"#ede9fe",ic:"#7c3aed",text:"#6d28d9"},
  };
  const c = colors[color] || colors.blue;
  const inner = (
    <div style={{background:c.bg,border:`1.5px solid ${c.border}`,borderRadius:12,padding:"18px 20px",
      display:"flex",alignItems:"center",gap:14,cursor:"pointer",transition:"all 0.15s"}}
      onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 4px 12px rgba(0,0,0,0.08)";}}
      onMouseLeave={e=>{e.currentTarget.style.boxShadow="none";}}>
      <span style={{fontSize:22}}>{icon}</span>
      <div style={{flex:1}}>
        <p style={{fontSize:14,fontWeight:700,color:c.text,margin:"0 0 2px"}}>{label}</p>
        <p style={{fontSize:12,color:"#64748b",margin:0}}>{sublabel}</p>
      </div>
      <ChevronRight style={{width:16,height:16,color:"#94a3b8"}}/>
    </div>
  );
  if (onClick) return <div onClick={onClick}>{inner}</div>;
  return <Link to={to} style={{textDecoration:"none"}}>{inner}</Link>;
}

function ProfileCompletionCard({ user, profile }) {
  const nav = useNavigate();
  const tasks = [
    { key:"photo",      label:"Upload Profile Photo",      sub:"Help newcomers put a face to your name",      done:!!user?.avatar,                    actionLabel:"Add Photo →",  action:()=>nav("/profile#photo")      },
    { key:"connection", label:"Select Connection to Area", sub:`Set as: ${CONN_LABELS[profile?.connectionToArea]||profile?.connectionToArea||"Not set"}`, done:!!profile?.connectionToArea, action:()=>nav("/profile#connection")  },
    { key:"bio",        label:"Add Short Bio",             sub:"Tell newcomers about yourself",               done:!!profile?.bio,                    actionLabel:"Add Bio →",    action:()=>nav("/profile#bio")        },
  ];
  const done = tasks.filter(t=>t.done).length;
  return (
    <div style={{background:"white",border:"1.5px solid #e2e8f0",borderRadius:16,padding:"22px 24px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
        <h3 style={{fontSize:15,fontWeight:700,color:"#0f172a",margin:0}}>Complete Your Profile</h3>
        <span style={{fontSize:12,color:"#64748b"}}>{done}/{tasks.length} done</span>
      </div>
      <div style={{height:3,background:"#e2e8f0",borderRadius:999,overflow:"hidden",marginBottom:20}}>
        <motion.div initial={{width:0}} animate={{width:`${(done/tasks.length)*100}%`}}
          transition={{duration:0.8}}
          style={{height:"100%",borderRadius:999,background:"linear-gradient(90deg,#2563eb,#7c3aed)"}}/>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {tasks.map(t=>(
          <div key={t.key} onClick={t.action}
            style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:12,
              border:`1.5px solid ${t.done?"#bbf7d0":"#e2e8f0"}`,
              background:t.done?"#f0fdf4":"white",cursor:"pointer",transition:"all 0.15s"}}
            onMouseEnter={e=>{ if(!t.done) e.currentTarget.style.borderColor="#bfdbfe"; }}
            onMouseLeave={e=>{ if(!t.done) e.currentTarget.style.borderColor="#e2e8f0"; }}>
            <div style={{width:36,height:36,borderRadius:10,background:t.done?"#dcfce7":"#f1f5f9",
              display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {t.done
                ? <CheckCircle style={{width:18,height:18,color:"#16a34a"}}/>
                : <Camera style={{width:17,height:17,color:"#94a3b8"}}/>}
            </div>
            <div style={{flex:1}}>
              <p style={{fontSize:13,fontWeight:600,color:"#0f172a",margin:"0 0 2px"}}>{t.label}</p>
              <p style={{fontSize:11,color:"#94a3b8",margin:0}}>{t.sub}</p>
            </div>
            {!t.done && t.actionLabel && (
              <span style={{fontSize:12,fontWeight:600,color:"#2563eb",whiteSpace:"nowrap"}}>{t.actionLabel}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ContributorBadgesCard({ total=0 }) {
  const levels = [
    {label:"New Contributor",     sub:"Current level",             icon:"🌱", threshold:0  },
    {label:"Active Contributor",  sub:"Answer 5+ questions",       icon:"⚡", threshold:5  },
    {label:"Trusted Contributor", sub:"20+ helpful votes",         icon:"⭐", threshold:20 },
    {label:"Top Contributor",     sub:"50+ contributions",         icon:"🏆", threshold:50 },
  ];
  return (
    <div style={{background:"white",border:"1.5px solid #e2e8f0",borderRadius:16,padding:"22px 24px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
      <h3 style={{fontSize:15,fontWeight:700,color:"#0f172a",margin:"0 0 20px"}}>Contributor Badges</h3>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {levels.map((l,i)=>{
          const earned = total>=l.threshold;
          const current = earned && (i===levels.length-1 || total<levels[i+1].threshold);
          return (
            <div key={l.label} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:10,
              background:current?"#f0fdf4":earned?"#f8fafc":"#fafafa",
              border:`1px solid ${current?"#bbf7d0":earned?"#e2e8f0":"#f1f5f9"}`,
              opacity:!earned&&!current?0.5:1}}>
              <span style={{fontSize:20,flexShrink:0}}>{l.icon}</span>
              <div style={{flex:1}}>
                <p style={{fontSize:13,fontWeight:700,color:current?"#15803d":earned?"#374151":"#94a3b8",margin:"0 0 1px"}}>{l.label}</p>
                <p style={{fontSize:11,color:"#94a3b8",margin:0}}>{current?"Current level":l.sub}</p>
              </div>
              {current && <CheckCircle style={{width:16,height:16,color:"#16a34a",flexShrink:0}}/>}
            </div>
          );
        })}
      </div>
      <p style={{fontSize:11,color:"#94a3b8",margin:"16px 0 0",textAlign:"center"}}>Earned through contributions.</p>
    </div>
  );
}

export default function ResidentDashboard() {
  const { user, profile, loadUser } = useAuth();
  const [ld, setLd] = useState(true);
  const [rewards, setRew] = useState(null);
  const avatarInp = useRef(null);

  useEffect(()=>{
    rewardAPI.getAll().then(({data})=>setRew(data.data)).catch(()=>{}).finally(()=>setLd(false));
  },[]);

  if (ld) return <LoadingSpinner size="lg"/>;

  const qa    = profile?.questionsAnswered    || 0;
  const hv    = profile?.helpfulVotes         || 0;
  const rs    = profile?.recommendationsShared|| 0;
  const total = qa+hv+rs;
  const badge = getBadge(total);
  const connLabel = CONN_LABELS[profile?.connectionToArea] || profile?.connectionToArea || "";
  const areaLabel = profile?.area || user?.location || "";

  const handleAvatar = async (file) => {
    if (!file) return;
    if (!["image/jpeg","image/jpg","image/png"].includes(file.type)){ toast.error("Only JPG/PNG"); return; }
    if (file.size>5*1024*1024){ toast.error("Max 5MB"); return; }
    try {
      const fd = new FormData(); fd.append("avatar",file);
      await userAPI.uploadAvatar(fd); await loadUser(); toast.success("Photo updated!");
    } catch { toast.error("Upload failed"); }
  };

  return (
    <div style={{background:"#f0f4f8",minHeight:"100vh",fontFamily:"Inter,system-ui,sans-serif",paddingBottom:48}}>
      <div className="wrap" style={{paddingTop:24}}>

        {/* ── Welcome Hero ── */}
        <div style={{background:"white",border:"1.5px solid #e2e8f0",borderRadius:20,padding:"24px 28px",marginBottom:24,boxShadow:"0 1px 6px rgba(0,0,0,0.04)"}}>
          <div style={{display:"flex",alignItems:"center",gap:18}}>
            {/* Avatar with upload button */}
            <div style={{position:"relative",flexShrink:0}}>
              <div style={{width:64,height:64,borderRadius:"50%",background:av(user?.name),
                display:"flex",alignItems:"center",justifyContent:"center",
                color:"white",fontSize:24,fontWeight:800}}>
                {isRealAvatar(user?.avatar)
                  ? <img src={user.avatar} alt="avatar" style={{width:64,height:64,borderRadius:"50%",objectFit:"cover"}}/>
                  : user?.name?.charAt(0)}
              </div>
              <button onClick={()=>avatarInp.current?.click()}
                style={{position:"absolute",bottom:0,right:0,width:22,height:22,borderRadius:"50%",
                  background:"#2563eb",border:"2px solid white",cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Camera style={{width:11,height:11,color:"white"}}/>
              </button>
              <input ref={avatarInp} type="file" accept="image/jpeg,image/jpg,image/png" style={{display:"none"}} onChange={e=>handleAvatar(e.target.files[0])}/>
            </div>
            <div style={{flex:1}}>
              <h1 style={{fontSize:"1.3rem",fontWeight:800,color:"#0f172a",margin:"0 0 4px"}}>
                Welcome, {user?.name?.split(" ")[0]} 👋
              </h1>
              <p style={{fontSize:13,color:"#64748b",margin:"0 0 10px"}}>Help newcomers by sharing local knowledge and trusted recommendations.</p>
              {/* Chips */}
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {areaLabel && (
                  <span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:12,fontWeight:600,
                    padding:"4px 10px",borderRadius:999,background:"#f1f5f9",color:"#475569"}}>
                    📍 {areaLabel}
                  </span>
                )}
                {connLabel && (
                  <span style={{fontSize:12,fontWeight:600,padding:"4px 10px",borderRadius:999,background:"#f1f5f9",color:"#475569"}}>
                    👤 {connLabel}
                  </span>
                )}
                <span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:12,fontWeight:600,
                  padding:"4px 10px",borderRadius:999,background:"#f0fdf4",color:"#16a34a"}}>
                  🌱 {badge.label}
                </span>
              </div>
              {total===0 && <p style={{fontSize:11,color:"#94a3b8",margin:"6px 0 0"}}>Answer questions to become Active</p>}
            </div>
          </div>
        </div>

        {/* ── Contributions ── */}
        <h2 style={{fontSize:15,fontWeight:700,color:"#0f172a",margin:"0 0 14px"}}>Your Contributions</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:24}} className="stats-grid">
          <StatCard icon={MessageSquare} iconBg="#eff6ff" value={qa} label="Questions Answered" sublabel="helping newcomers"/>
          <StatCard icon={ThumbsUp}      iconBg="#f0fdf4" value={hv} label="Helpful Votes Received" sublabel="community trust"/>
          <StatCard icon={Star}          iconBg="#fffbeb" value={rs} label="Recommendations Shared" sublabel="local services"/>
        </div>

        {/* ── Start Contributing ── */}
        <h2 style={{fontSize:15,fontWeight:700,color:"#0f172a",margin:"0 0 14px"}}>Start Contributing</h2>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:28}} className="actions-grid">
          <ActionCard icon="💬" label="Answer a Question"  sublabel="Help newcomers get answers"            color="blue"   to="/community"/>
          <ActionCard icon="⭐" label="Recommend a Service" sublabel="Share a trusted local service"        color="amber"  to="/community?action=recommend"/>
          <ActionCard icon="🧡" label="Browse Newcomers"    sublabel="See who needs local help"             color="green"  to="/newcomers"/>
          <ActionCard icon="🔍" label="Explore Services"    sublabel="Discover services in your area"       color="purple" to="/services"/>
        </div>

        {/* ── Profile Completion + Badges (side by side) ── */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,alignItems:"start"}} className="bottom-grid">
          <ProfileCompletionCard user={user} profile={profile}/>
          <ContributorBadgesCard total={total}/>
        </div>
      </div>

      <style>{`
        @media(max-width:768px){
          .stats-grid{grid-template-columns:1fr !important;}
          .actions-grid{grid-template-columns:1fr !important;}
          .bottom-grid{grid-template-columns:1fr !important;}
        }
      `}</style>
    </div>
  );
}
