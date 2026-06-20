import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, MapPin, Eye, MessageCircle, Search, ChevronRight, X, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { communityAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { LoadingSpinner } from "../components/ui/Cards";

const TOPICS = ["general","housing","transportation","food","healthcare","education"];
const AV_COLORS = ["#2563eb","#7c3aed","#0891b2","#16a34a","#d97706","#dc2626","#db2777","#0f766e"];
const av = n => AV_COLORS[(n?.charCodeAt(0)||0) % AV_COLORS.length];

function timeAgo(d) {
  if(!d) return "";
  const s = Math.floor((Date.now()-new Date(d))/1000);
  if(s<60)     return "just now";
  if(s<3600)   return `${Math.floor(s/60)}m ago`;
  if(s<86400)  return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

function AskModal({ onClose, onPosted, initialCategory="" }) {
  const [form, setForm] = useState({title:"",content:"",category:initialCategory||"general",location:""});
  const [sub, setSub] = useState(false);
  const upd = (k,v) => setForm(p=>({...p,[k]:v}));
  const submit = async (e) => {
    e.preventDefault(); setSub(true);
    try {
      const {data} = await communityAPI.create(form);
      toast.success("Question posted!"); onPosted(data.data); onClose();
    } catch(err){ toast.error(err.response?.data?.message||"Failed"); } finally{ setSub(false); }
  };
  return (
    <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <motion.div initial={{opacity:0,scale:0.97,y:16}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.97,y:16}}
        style={{background:"white",borderRadius:18,width:"100%",maxWidth:560,padding:"28px",boxShadow:"0 20px 60px rgba(0,0,0,0.15)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <h2 style={{fontSize:18,fontWeight:800,color:"#0f172a",margin:0}}>Ask a Question</h2>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",padding:4}}>
            <X style={{width:18,height:18,color:"#64748b"}}/>
          </button>
        </div>
        <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:14}}>
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:6}}>Question Title *</label>
            <input required value={form.title} onChange={e=>upd("title",e.target.value)}
              placeholder="What would you like to know?"
              style={{width:"100%",padding:"11px 14px",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:14,outline:"none",boxSizing:"border-box"}}
              onFocus={e=>e.target.style.borderColor="#2563eb"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
          </div>
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:6}}>Details</label>
            <textarea rows={4} value={form.content} onChange={e=>upd("content",e.target.value)}
              placeholder="Share more details about your question..."
              style={{width:"100%",padding:"11px 14px",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:14,outline:"none",resize:"vertical",boxSizing:"border-box",fontFamily:"inherit"}}
              onFocus={e=>e.target.style.borderColor="#2563eb"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:6}}>Category</label>
              <select value={form.category} onChange={e=>upd("category",e.target.value)}
                style={{width:"100%",padding:"11px 14px",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:14,outline:"none",background:"white",appearance:"none",boxSizing:"border-box"}}>
                {TOPICS.map(t=><option key={t} value={t} style={{textTransform:"capitalize"}}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:6}}>Location (optional)</label>
              <input value={form.location} onChange={e=>upd("location",e.target.value)} placeholder="e.g. Miyapur"
                style={{width:"100%",padding:"11px 14px",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:14,outline:"none",boxSizing:"border-box"}}/>
            </div>
          </div>
          <button type="submit" disabled={sub||!form.title}
            style={{width:"100%",padding:"13px",borderRadius:12,border:"none",fontSize:15,fontWeight:700,cursor:sub||!form.title?"not-allowed":"pointer",
              background:sub||!form.title?"#e2e8f0":"#2563eb",color:sub||!form.title?"#94a3b8":"white",
              boxShadow:"0 4px 16px rgba(37,99,235,0.3)"}}>
            {sub?"Posting…":"Post Question"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

const SERVICE_CATEGORIES = ["Restaurants","Clinics","Hostels","Grocery Stores","Pharmacies","Education","Transportation","Salons","Laundry","Banks","Other"];
const LOCATIONS = ["Bachupally","Miyapur","Secunderabad","Other"];

function RecommendModal({ onClose, onPosted }) {
  const [form, setForm] = useState({
    serviceName:"", category:"Restaurants", location:"Bachupally",
    address:"", description:"", contactInfo:"",
  });
  const [sub, setSub] = useState(false);
  const upd = (k,v) => setForm(p=>({...p,[k]:v}));

  const submit = async (e) => {
    e.preventDefault(); setSub(true);
    try {
      // Store as a community post with category "recommendation" so it's distinguishable
      const payload = {
        title: `Recommended: ${form.serviceName}`,
        content: [
          `📍 Category: ${form.category}`,
          `📍 Location: ${form.location}`,
          form.address ? `🏠 Address: ${form.address}` : null,
          `\n${form.description}`,
          form.contactInfo ? `📞 Contact: ${form.contactInfo}` : null,
        ].filter(Boolean).join("\n"),
        category: "recommendation",
        location: form.location,
        tags: ["recommendation", form.category.toLowerCase(), form.location.toLowerCase()],
      };
      const { data } = await communityAPI.create(payload);
      toast.success("Service recommendation submitted! Thank you for helping newcomers.");
      onPosted(data.data);
      onClose();
    } catch(err) {
      toast.error(err.response?.data?.message || "Failed to submit recommendation");
    } finally { setSub(false); }
  };

  const fld = {
    width:"100%", padding:"11px 14px", border:"1.5px solid #e2e8f0",
    borderRadius:10, fontSize:14, outline:"none", boxSizing:"border-box",
    fontFamily:"inherit", transition:"border-color 0.15s",
  };

  return (
    <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <motion.div initial={{opacity:0,scale:0.97,y:16}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.97,y:16}}
        style={{background:"white",borderRadius:18,width:"100%",maxWidth:560,padding:"28px",
          boxShadow:"0 20px 60px rgba(0,0,0,0.15)",maxHeight:"90vh",overflowY:"auto"}}>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
          <div>
            <h2 style={{fontSize:18,fontWeight:800,color:"#0f172a",margin:"0 0 4px"}}>Recommend a Service</h2>
            <p style={{fontSize:13,color:"#64748b",margin:0}}>
              Share a trusted local service to help newcomers in your area.
            </p>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",padding:4,flexShrink:0,marginLeft:12}}>
            <X style={{width:18,height:18,color:"#64748b"}}/>
          </button>
        </div>

        {/* Info banner */}
        <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,
          padding:"10px 14px",marginBottom:20,fontSize:12,color:"#b45309"}}>
          ⭐ Your recommendation will be visible to newcomers in the Community section and will help them find trusted services.
        </div>

        <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:14}}>
          {/* Service Name */}
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:6}}>
              Service Name *
            </label>
            <input required value={form.serviceName} onChange={e=>upd("serviceName",e.target.value)}
              placeholder="e.g. Sri Adithya Pharmacy, Lucky Restaurant…"
              style={fld}
              onFocus={e=>e.target.style.borderColor="#2563eb"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
          </div>

          {/* Category + Location */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:6}}>
                Category *
              </label>
              <select required value={form.category} onChange={e=>upd("category",e.target.value)}
                style={{...fld,background:"white",cursor:"pointer"}}
                onFocus={e=>e.target.style.borderColor="#2563eb"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}>
                {SERVICE_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:6}}>
                Location *
              </label>
              <select required value={form.location} onChange={e=>upd("location",e.target.value)}
                style={{...fld,background:"white",cursor:"pointer"}}
                onFocus={e=>e.target.style.borderColor="#2563eb"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}>
                {LOCATIONS.map(l=><option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:6}}>
              Address <span style={{color:"#94a3b8",fontWeight:400}}>(optional)</span>
            </label>
            <input value={form.address} onChange={e=>upd("address",e.target.value)}
              placeholder="e.g. Shop No. 5, Main Road, Bachupally"
              style={fld}
              onFocus={e=>e.target.style.borderColor="#2563eb"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
          </div>

          {/* Description */}
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:6}}>
              Why do you recommend this service? *
            </label>
            <textarea required rows={4} value={form.description} onChange={e=>upd("description",e.target.value)}
              placeholder="Share your experience — quality, pricing, helpfulness, what makes it great for newcomers…"
              style={{...fld,resize:"vertical"}}
              onFocus={e=>e.target.style.borderColor="#2563eb"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
          </div>

          {/* Contact Info */}
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:6}}>
              Contact Information <span style={{color:"#94a3b8",fontWeight:400}}>(optional)</span>
            </label>
            <input value={form.contactInfo} onChange={e=>upd("contactInfo",e.target.value)}
              placeholder="Phone number or website, if known"
              style={fld}
              onFocus={e=>e.target.style.borderColor="#2563eb"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
          </div>

          {/* Actions */}
          <div style={{display:"flex",gap:10,marginTop:4}}>
            <button type="button" onClick={onClose}
              style={{flex:1,padding:"12px",borderRadius:10,border:"1.5px solid #e2e8f0",
                background:"white",fontSize:14,fontWeight:600,color:"#475569",cursor:"pointer"}}>
              Cancel
            </button>
            <button type="submit" disabled={sub || !form.serviceName.trim() || !form.description.trim()}
              style={{flex:2,padding:"12px",borderRadius:12,border:"none",fontSize:15,fontWeight:700,
                cursor:(sub||!form.serviceName.trim()||!form.description.trim())?"not-allowed":"pointer",
                background:(sub||!form.serviceName.trim()||!form.description.trim())?"#e2e8f0":"#d97706",
                color:(sub||!form.serviceName.trim()||!form.description.trim())?"#94a3b8":"white",
                boxShadow:"0 4px 16px rgba(217,119,6,0.3)"}}>
              {sub ? "Submitting…" : "⭐ Submit Recommendation"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function CommunityPage() {
  const { user } = useAuth();
  const [sp] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLd]  = useState(true);
  const [showModal,     setShowM]   = useState(false);
  const [showRecommend, setShowRec] = useState(false);
  const [q, setQ]         = useState("");
  const [selTopic,setTopic] = useState("");

  useEffect(()=>{
    communityAPI.getAll().then(({data})=>setPosts(data.data)).catch(()=>setPosts([])).finally(()=>setLd(false));
    const action = sp.get("action");
    if (user) {
      if (action === "ask")       setShowM(true);
      if (action === "recommend") setShowRec(true);
    }
  },[]);

  const filtered = posts.filter(p=>{
    const ms = !q || p.title?.toLowerCase().includes(q.toLowerCase()) || p.content?.toLowerCase().includes(q.toLowerCase());
    const mc = !selTopic || p.category?.toLowerCase()===selTopic;
    return ms && mc;
  });

  // Count posts per topic
  const topicCounts = TOPICS.reduce((acc,t)=>({...acc,[t]:posts.filter(p=>p.category?.toLowerCase()===t).length}),{});

  return (
    <div style={{background:"#f0f4f8",minHeight:"100vh",fontFamily:"Inter,system-ui,sans-serif"}}>
      <div className="wrap" style={{paddingTop:28,paddingBottom:48}}>

        {/* Page header row */}
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24,gap:16,flexWrap:"wrap"}}>
          <div>
            <h1 style={{fontSize:26,fontWeight:800,color:"#0f172a",margin:"0 0 4px"}}>Community Forum</h1>
            <p style={{fontSize:13,color:"#64748b",margin:0}}>Ask questions, share tips, and get trusted advice from locals</p>
          </div>
          <button onClick={()=>user?setShowM(true):(window.location.href="/login")}
            style={{display:"flex",alignItems:"center",gap:7,padding:"11px 20px",borderRadius:10,background:"#2563eb",color:"white",border:"none",cursor:"pointer",fontSize:14,fontWeight:700,boxShadow:"0 4px 14px rgba(37,99,235,0.3)"}}>
            <Plus style={{width:16,height:16}}/> Ask Question
          </button>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:20,alignItems:"start"}} className="cf-grid">

          {/* ── Main column ── */}
          <div>
            {/* Search bar */}
            <div style={{position:"relative",marginBottom:16}}>
              <Search style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",width:15,height:15,color:"#94a3b8"}}/>
              <input value={q} onChange={e=>setQ(e.target.value)}
                placeholder="Search questions, topics, and local advice..."
                style={{width:"100%",height:48,paddingLeft:40,paddingRight:14,border:"1.5px solid #e2e8f0",borderRadius:12,
                  fontSize:14,background:"white",outline:"none",boxSizing:"border-box"}}
                onFocus={e=>e.target.style.borderColor="#2563eb"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
            </div>

            {/* Post list */}
            {loading ? <div style={{textAlign:"center",padding:60}}><div style={{width:32,height:32,borderRadius:"50%",border:"3px solid #e2e8f0",borderTopColor:"#2563eb",animation:"spin 0.8s linear infinite",margin:"0 auto"}}/></div> : (
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {filtered.length===0 ? (
                  <div style={{textAlign:"center",padding:"60px 24px",background:"white",borderRadius:16,border:"1.5px solid #e2e8f0"}}>
                    <p style={{fontSize:15,color:"#64748b"}}>No posts yet. Be the first to ask a question!</p>
                  </div>
                ) : filtered.map((p,i)=>(
                  <motion.div key={p._id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}>
                    <Link to={`/community/${p._id}`} style={{textDecoration:"none"}}>
                      <div style={{background:"white",border:"1.5px solid #e2e8f0",borderRadius:14,padding:"18px 20px",
                        transition:"all 0.15s",cursor:"pointer"}}
                        onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.08)"}
                        onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                          <span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:999,textTransform:"capitalize",
                            background: p.category==="recommendation" ? "#fffbeb" : "#eff6ff",
                            color:      p.category==="recommendation" ? "#b45309"  : "#2563eb" }}>
                            {p.category==="recommendation" ? "⭐ Recommendation" : (p.category||"General")}
                          </span>
                          {p.location && (
                            <span style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#94a3b8"}}>
                              <MapPin style={{width:11,height:11}}/>{p.location}
                            </span>
                          )}
                        </div>
                        <h3 style={{fontSize:15,fontWeight:700,color:"#0f172a",margin:"0 0 8px",lineHeight:1.4}}>{p.title}</h3>
                        <p style={{fontSize:13,color:"#64748b",margin:"0 0 14px",lineHeight:1.55,
                          overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>
                          {p.content}
                        </p>
                        <div style={{display:"flex",alignItems:"center",gap:16}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <div style={{width:22,height:22,borderRadius:"50%",background:av(p.author?.name||p.user?.name),
                              display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:9,fontWeight:800}}>
                              {(p.author?.name||p.user?.name||"?").charAt(0)}
                            </div>
                            <span style={{fontSize:12,color:"#475569",fontWeight:500}}>{p.author?.name||p.user?.name||"Anonymous"}</span>
                          </div>
                          <span style={{fontSize:11,color:"#94a3b8"}}>{timeAgo(p.createdAt)}</span>
                          <span style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#94a3b8",marginLeft:"auto"}}>
                            <MessageCircle style={{width:13,height:13}}/>{p.answers?.length||p.answerCount||0}
                          </span>
                          <span style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#94a3b8"}}>
                            <Eye style={{width:13,height:13}}/>{p.views||0}
                          </span>
                          <span style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#94a3b8"}}>
                            👍 {(p.likes||[]).length||0}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* ── Right sidebar ── */}
          <div style={{display:"flex",flexDirection:"column",gap:14,position:"sticky",top:84}}>

            {/* Popular Topics */}
            <div style={{background:"white",border:"1.5px solid #e2e8f0",borderRadius:14,padding:"18px 20px"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
                <span style={{fontSize:14}}>🏷</span>
                <h3 style={{fontSize:14,fontWeight:700,color:"#0f172a",margin:0}}>Popular Topics</h3>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:2}}>
                {[{label:"All Posts",value:"",count:posts.length},...TOPICS.map(t=>({label:t.charAt(0).toUpperCase()+t.slice(1),value:t,count:topicCounts[t]||0}))].map(t=>{
                  const active = selTopic===t.value;
                  return (
                    <button key={t.label} onClick={()=>setTopic(t.value)}
                      style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 12px",borderRadius:9,border:"none",cursor:"pointer",transition:"all 0.12s",textAlign:"left",
                        background:active?"#eff6ff":"transparent",color:active?"#2563eb":"#374151"}}>
                      <span style={{display:"flex",alignItems:"center",gap:8,fontSize:13,fontWeight:active?700:500}}>
                        <span style={{color:"#94a3b8",fontSize:14}}>#</span>{t.label}
                      </span>
                      <span style={{fontSize:12,fontWeight:700,color:active?"#2563eb":"#94a3b8",
                        background:active?"#dbeafe":"#f1f5f9",padding:"1px 8px",borderRadius:999}}>
                        {t.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Community Guidelines */}
            <div style={{background:"white",border:"1.5px solid #e2e8f0",borderRadius:14,padding:"18px 20px"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                <span style={{fontSize:14}}>🌿</span>
                <h3 style={{fontSize:14,fontWeight:700,color:"#0f172a",margin:0}}>Community Guidelines</h3>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {["Be respectful and supportive to newcomers.","Post questions with clear, specific details.","Mark your post as resolved once answered."].map(g=>(
                  <div key={g} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                    <CheckCircle style={{width:14,height:14,color:"#16a34a",flexShrink:0,marginTop:1}}/>
                    <span style={{fontSize:12,color:"#475569",lineHeight:1.5}}>{g}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ask a Question CTA */}
            <button onClick={()=>user?setShowM(true):(window.location.href="/login")}
              style={{width:"100%",padding:"12px",borderRadius:12,border:"1.5px dashed #bfdbfe",background:"#f8fbff",
                fontSize:14,fontWeight:600,color:"#2563eb",cursor:"pointer",
                display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
              <Plus style={{width:15,height:15}}/> Ask a Question
            </button>

            {/* Recommend a Service CTA */}
            <button onClick={()=>user?setShowRec(true):(window.location.href="/login")}
              style={{width:"100%",padding:"12px",borderRadius:12,border:"1.5px dashed #fde68a",background:"#fffdf5",
                fontSize:14,fontWeight:600,color:"#b45309",cursor:"pointer",marginTop:8,
                display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
              ⭐ Recommend a Service
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showModal && <AskModal onClose={()=>setShowM(false)} onPosted={p=>setPosts(prev=>[p,...prev])} initialCategory={sp.get("category")||"general"}/>}
      </AnimatePresence>

      <AnimatePresence>
        {showRecommend && <RecommendModal onClose={()=>setShowRec(false)} onPosted={p=>setPosts(prev=>[p,...prev])}/>}
      </AnimatePresence>

      <style>{`
        @media(max-width:900px){.cf-grid{grid-template-columns:1fr !important;}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
}
