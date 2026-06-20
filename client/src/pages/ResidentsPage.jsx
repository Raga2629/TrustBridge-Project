import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, MessageCircle, User, Search, X, Send } from "lucide-react";
import { userAPI, chatAPI } from "../services/api";
import { LoadingSpinner } from "../components/ui/Cards";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const AREAS = ["","Bachupally","Miyapur","Secunderabad"];
const AV_COLORS = ["#2563eb","#7c3aed","#0891b2","#16a34a","#d97706","#dc2626","#db2777","#0f766e"];
const av = n => AV_COLORS[(n?.charCodeAt(0)||0) % AV_COLORS.length];

const CONNECTION_LABELS = {
  local_resident:"Local Resident",student:"Student",employee:"Employee",
  business_owner:"Business Owner",other:"Other",
};
const CONNECTION_COLORS = {
  local_resident:{bg:"#eff6ff",color:"#2563eb"},
  student:{bg:"#f0fdf4",color:"#16a34a"},
  employee:{bg:"#fff7ed",color:"#d97706"},
  business_owner:{bg:"#faf5ff",color:"#7c3aed"},
  other:{bg:"#f8fafc",color:"#64748b"},
};

function BadgePill({count=0}) {
  const b = count>=50?{label:"Top Contributor",bg:"#faf5ff",color:"#7c3aed"}:
             count>=20?{label:"Trusted Contributor",bg:"#eff6ff",color:"#2563eb"}:
             count>=5 ?{label:"Active Contributor",bg:"#f0fdf4",color:"#16a34a"}:
                        {label:"New Contributor",bg:"#f0fdf4",color:"#16a34a"};
  return (
    <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:999,
      background:b.bg,color:b.color,display:"inline-flex",alignItems:"center",gap:4}}>
      🌱 {b.label}
    </span>
  );
}

function GuideCard({resident,onMessage}) {
  const u = resident.user || resident;
  const [hov,setHov] = useState(false);
  const conn = resident.connectionToArea || u.connectionToArea;
  const connLabel = CONNECTION_LABELS[conn] || conn || "Community Member";
  const connStyle = CONNECTION_COLORS[conn] || {bg:"#f1f5f9",color:"#64748b"};
  const contributions = (resident.questionsAnswered||0)+(resident.helpfulVotes||0)+(resident.recommendationsShared||0);

  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:"white",border:`1.5px solid ${hov?"#bfdbfe":"#e2e8f0"}`,borderRadius:14,
        padding:"18px 20px",display:"flex",alignItems:"flex-start",gap:16,
        transition:"all 0.18s",boxShadow:hov?"0 4px 20px rgba(37,99,235,0.1)":"0 1px 3px rgba(0,0,0,0.04)"}}>

      {/* Avatar */}
      <div style={{width:52,height:52,borderRadius:"50%",background:av(u.name),
        display:"flex",alignItems:"center",justifyContent:"center",
        color:"white",fontSize:20,fontWeight:800,flexShrink:0}}>
        {u.name?.charAt(0)}
      </div>

      {/* Info */}
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
          <span style={{fontSize:14,fontWeight:700,color:"#0f172a"}}>{u.name}</span>
          <BadgePill count={contributions}/>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
          <span style={{display:"flex",alignItems:"center",gap:4,fontSize:12,color:"#64748b"}}>
            <MapPin style={{width:11,height:11}}/>{resident.area||u.location||"Hyderabad"}
          </span>
          <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:6,
            background:connStyle.bg,color:connStyle.color}}>
            {connLabel}
          </span>
        </div>
        <p style={{fontSize:12,color:"#64748b",margin:"0 0 8px",lineHeight:1.5,
          overflow:"hidden",display:"-webkit-box",WebkitLineClamp:1,WebkitBoxOrient:"vertical"}}>
          {resident.bio||"Local community member helping newcomers…"}
        </p>
        <div style={{display:"flex",gap:16,fontSize:11,color:"#94a3b8"}}>
          <span>💬 {resident.questionsAnswered||0} answered</span>
          <span>👍 {resident.helpfulVotes||0} helpful</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{display:"flex",flexDirection:"column",gap:8,flexShrink:0}}>
        <button onClick={()=>onMessage(resident)}
          style={{display:"flex",alignItems:"center",gap:6,padding:"9px 16px",borderRadius:9,
            background:"#2563eb",color:"white",border:"none",cursor:"pointer",
            fontSize:12,fontWeight:700,boxShadow:"0 2px 8px rgba(37,99,235,0.3)",whiteSpace:"nowrap"}}>
          <MessageCircle style={{width:13,height:13}}/> Message
        </button>
        <Link to={`/guides/${resident._id}`}
          style={{display:"flex",alignItems:"center",justifyContent:"center",gap:5,padding:"8px 16px",borderRadius:9,
            background:"white",color:"#374151",border:"1.5px solid #e2e8f0",
            fontSize:12,fontWeight:600,textDecoration:"none",whiteSpace:"nowrap"}}>
          <User style={{width:12,height:12}}/> View Profile
        </Link>
      </div>
    </div>
  );
}

export default function ResidentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [residents, setResidents] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [loc, setLoc]             = useState("");
  const [search, setSearch]       = useState("");
  const [msgTarget, setMsgTarget] = useState(null); // guide to message
  const [msgText,   setMsgText]   = useState("");
  const [sending,   setSending]   = useState(false);

  useEffect(()=>{
    setLoading(true);
    userAPI.getResidents(loc?{location:loc}:{})
      .then(({data})=>setResidents(data.data))
      .catch(()=>setResidents([]))
      .finally(()=>setLoading(false));
  },[loc]);

  const handleMessage = (r) => {
    if (!user) { navigate("/login"); return; }
    setMsgTarget(r);
    setMsgText("");
  };

  const sendMessage = async () => {
    if (!msgText.trim() || !msgTarget) return;
    setSending(true);
    // msgTarget is a ResidentProfile — user._id is the actual User ID needed for chat
    const rid = msgTarget.user?._id || msgTarget.user || msgTarget._id;
    try {
      const { data } = await chatAPI.createConversation(rid);
      const convId   = data.data._id;
      await chatAPI.sendMessage(convId, { content: msgText.trim() });
      toast.success("Message sent!");
      setMsgTarget(null);
      navigate(`/chat?resident=${rid}`);
    } catch(e) {
      console.error('[Message] Failed:', e.response?.status, e.response?.data);
      toast.error(e.response?.data?.message || "Failed to send message");
    } finally { setSending(false); }
  };

  const filtered = residents.filter(r=>{
    if(!search) return true;
    const u=r.user||r;
    return u.name?.toLowerCase().includes(search.toLowerCase()) ||
      (r.area||u.location||"").toLowerCase().includes(search.toLowerCase());
  });

  return (
    <>
    <div style={{background:"#f0f4f8",minHeight:"100vh",fontFamily:"Inter,system-ui,sans-serif"}}>
      <div className="wrap" style={{paddingTop:32,paddingBottom:48}}>
        <p style={{fontSize:13,color:"#64748b",margin:"0 0 24px"}}>Connect with locals who can help you settle into Hyderabad</p>

        {/* Search */}
        <div style={{position:"relative",maxWidth:400,marginBottom:24}}>
          <Search style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",width:14,height:14,color:"#94a3b8"}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search by name, area, or connection..."
            style={{width:"100%",height:44,paddingLeft:38,paddingRight:14,border:"1.5px solid #e2e8f0",borderRadius:10,
              fontSize:13,background:"white",outline:"none",boxSizing:"border-box"}}/>
        </div>

        {/* Area filters */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20,flexWrap:"wrap"}}>
          <span style={{fontSize:12,fontWeight:700,color:"#94a3b8"}}>Area:</span>
          {AREAS.map(a=>(
            <button key={a||"all"} onClick={()=>setLoc(a)}
              style={{padding:"6px 16px",borderRadius:999,fontSize:12,fontWeight:600,border:"1.5px solid",cursor:"pointer",transition:"all 0.15s",
                background:loc===a?"#2563eb":"white",color:loc===a?"white":"#374151",borderColor:loc===a?"#2563eb":"#e2e8f0"}}>
              {a||"All Areas"}
            </button>
          ))}
        </div>

        {loading ? <div style={{textAlign:"center",padding:60}}><LoadingSpinner/></div> : (
          <>
            <p style={{fontSize:13,color:"#64748b",margin:"0 0 16px"}}>
              <strong style={{color:"#0f172a"}}>{filtered.length}</strong> guides found
            </p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}} className="guides-grid">
              {filtered.map(r=>(
                <GuideCard key={r._id} resident={r} onMessage={handleMessage}/>
              ))}
            </div>
          </>
        )}
      </div>
      <style>{`@media(max-width:900px){.guides-grid{grid-template-columns:1fr !important;}}`}</style>
    </div>

    {/* ── Message Compose Modal ── */}
    <AnimatePresence>
      {msgTarget && (
        <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.5)",display:"flex",
          alignItems:"center",justifyContent:"center",zIndex:300,padding:16}}
          onClick={e=>{if(e.target===e.currentTarget)setMsgTarget(null);}}>
          <motion.div initial={{opacity:0,scale:0.96,y:12}} animate={{opacity:1,scale:1,y:0}}
            exit={{opacity:0,scale:0.96,y:12}} transition={{duration:0.18}}
            style={{background:"white",borderRadius:18,padding:"24px",width:"100%",maxWidth:440,
              boxShadow:"0 20px 60px rgba(0,0,0,0.18)",fontFamily:"Inter,system-ui,sans-serif"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
              <div>
                <h3 style={{fontSize:16,fontWeight:800,color:"#0f172a",margin:"0 0 2px"}}>
                  Message {(msgTarget.user||msgTarget).name}
                </h3>
                <p style={{fontSize:12,color:"#94a3b8",margin:0}}>
                  Local Guide · {msgTarget.area||(msgTarget.user||msgTarget).location||"Hyderabad"}
                </p>
              </div>
              <button onClick={()=>setMsgTarget(null)}
                style={{background:"none",border:"none",cursor:"pointer",padding:4}}>
                <X style={{width:18,height:18,color:"#64748b"}}/>
              </button>
            </div>
            <textarea
              value={msgText}
              onChange={e=>setMsgText(e.target.value)}
              placeholder={`Hi, I'm new to Hyderabad and need help…`}
              rows={4}
              style={{width:"100%",padding:"12px 14px",border:"1.5px solid #e2e8f0",borderRadius:12,
                fontSize:13,lineHeight:1.65,resize:"vertical",outline:"none",boxSizing:"border-box",
                fontFamily:"inherit",transition:"border-color 0.15s"}}
              onFocus={e=>e.target.style.borderColor="#2563eb"}
              onBlur={e=>e.target.style.borderColor="#e2e8f0"}
              autoFocus
            />
            <div style={{display:"flex",gap:10,marginTop:14}}>
              <button onClick={()=>setMsgTarget(null)}
                style={{flex:1,padding:"11px",borderRadius:10,border:"1.5px solid #e2e8f0",
                  background:"white",color:"#374151",fontSize:13,fontWeight:600,cursor:"pointer"}}>
                Cancel
              </button>
              <button onClick={sendMessage} disabled={!msgText.trim()||sending}
                style={{flex:2,padding:"11px",borderRadius:10,border:"none",
                  background:!msgText.trim()||sending?"#e2e8f0":"#2563eb",
                  color:!msgText.trim()||sending?"#94a3b8":"white",
                  fontSize:13,fontWeight:700,cursor:!msgText.trim()||sending?"not-allowed":"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
                <Send style={{width:14,height:14}}/> {sending?"Sending…":"Send Message"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}
