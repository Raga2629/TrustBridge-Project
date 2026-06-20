import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Send, ArrowLeft, Eye, MessageCircle, ThumbsUp } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { communityAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { LoadingSpinner } from "../components/ui/Cards";

const AV_COLORS = ["#2563eb","#7c3aed","#0891b2","#16a34a","#d97706","#dc2626","#db2777"];
const av = n => AV_COLORS[(n?.charCodeAt(0)||0) % AV_COLORS.length];

function timeAgo(d) {
  if(!d) return "";
  const s=Math.floor((Date.now()-new Date(d))/1000);
  if(s<60)    return "just now";
  if(s<3600)  return `${Math.floor(s/60)}m ago`;
  if(s<86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

function Avatar({name,size=36}){
  return (
    <div style={{width:size,height:size,borderRadius:"50%",background:av(name||"?"),
      display:"flex",alignItems:"center",justifyContent:"center",
      color:"white",fontWeight:800,fontSize:Math.round(size*0.38),flexShrink:0}}>
      {(name||"?").charAt(0)}
    </div>
  );
}

export default function CommunityDetailPage() {
  const { id }   = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [ans,  setAns]  = useState("");
  const [loading, setLd] = useState(true);
  const [sub, setSub]    = useState(false);

  useEffect(()=>{
    communityAPI.getById(id)
      .then(({data})=>setPost(data.data))
      .catch(()=>toast.error("Post not found"))
      .finally(()=>setLd(false));
  },[id]);

  const submit = async (e) => {
    e.preventDefault(); if(!ans.trim()) return; setSub(true);
    try {
      const {data}=await communityAPI.addAnswer(id,ans);
      setPost(data.data); setAns(""); toast.success("Answer posted!");
    } catch(err){ toast.error(err.response?.data?.message||"Failed"); } finally{ setSub(false); }
  };

  const likePost = async () => {
    if (!user) { toast.error("Sign in to like"); return; }
    try {
      const { data } = await communityAPI.likePost(id);
      setPost(p => ({
        ...p,
        likes: data.data.liked
          ? [...(p.likes||[]), user._id||user.id]
          : (p.likes||[]).filter(l => (l._id||l) !== (user._id||user.id))
      }));
    } catch {}
  };

  const likeAnswer = async (answerId) => {
    if (!user) { toast.error("Sign in to like"); return; }
    try {
      const { data } = await communityAPI.likeAnswer(id, answerId);
      setPost(p => ({
        ...p,
        answers: p.answers.map(a => a._id === answerId
          ? { ...a, likes: data.data.liked
              ? [...(a.likes||[]), user._id||user.id]
              : (a.likes||[]).filter(l => (l._id||l) !== (user._id||user.id)) }
          : a
        )
      }));
    } catch {}
  };

  const uid = user?._id || user?.id;

  if(loading) return <LoadingSpinner size="lg"/>;
  if(!post)   return (
    <div style={{padding:"80px 24px",textAlign:"center"}}>
      <Link to="/community" style={{color:"#2563eb",fontWeight:600,textDecoration:"none",fontSize:14,display:"inline-flex",alignItems:"center",gap:6}}>
        <ArrowLeft style={{width:14,height:14}}/> Back to Community
      </Link>
    </div>
  );

  const authorName = post.author?.name || post.user?.name || "Anonymous";
  const answers    = post.answers || [];
  const postLiked  = !!(post.likes||[]).find(l => (l._id||l) === uid);

  return (
    <div style={{background:"#f0f4f8",minHeight:"100vh",fontFamily:"Inter,system-ui,sans-serif"}}>
      <div className="wrap" style={{paddingTop:24,paddingBottom:56,maxWidth:720}}>

        {/* Back link */}
        <Link to="/community" style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:13,
          fontWeight:600,color:"#64748b",textDecoration:"none",marginBottom:20}}>
          <ArrowLeft style={{width:14,height:14}}/> Back to Community
        </Link>

        {/* ── Question card ── */}
        <div style={{background:"white",border:"1.5px solid #e2e8f0",borderRadius:16,padding:"24px",
          marginBottom:24,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
          {post.category && (
            <span style={{display:"inline-block",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:999,
              background:"#eff6ff",color:"#2563eb",marginBottom:12,textTransform:"capitalize"}}>
              {post.category}
            </span>
          )}
          <h1 style={{fontSize:20,fontWeight:800,color:"#0f172a",margin:"0 0 12px",lineHeight:1.4}}>{post.title}</h1>
          <p style={{fontSize:14,color:"#475569",lineHeight:1.7,margin:"0 0 20px"}}>{post.content}</p>
          <div style={{display:"flex",alignItems:"center",gap:16,paddingTop:16,borderTop:"1px solid #f1f5f9",flexWrap:"wrap"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <Avatar name={authorName} size={28}/>
              <span style={{fontSize:13,fontWeight:600,color:"#374151"}}>{authorName}</span>
            </div>
            <span style={{display:"flex",alignItems:"center",gap:4,fontSize:12,color:"#94a3b8"}}>
              <Eye style={{width:13,height:13}}/>{post.views||0} views
            </span>
            <span style={{display:"flex",alignItems:"center",gap:4,fontSize:12,color:"#94a3b8"}}>
              <MessageCircle style={{width:13,height:13}}/>{answers.length} answer{answers.length!==1?"s":""}
            </span>
            <span style={{fontSize:12,color:"#94a3b8"}}>{timeAgo(post.createdAt)}</span>
            {/* Like button */}
            <button onClick={likePost}
              style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6,padding:"6px 14px",
                borderRadius:8,border:`1.5px solid ${postLiked?"#2563eb":"#e2e8f0"}`,
                background:postLiked?"#eff6ff":"white",cursor:"pointer",fontSize:12,fontWeight:600,
                color:postLiked?"#2563eb":"#64748b",transition:"all 0.15s"}}>
              <ThumbsUp style={{width:13,height:13}}/> {(post.likes||[]).length}
            </button>
          </div>
        </div>

        {/* ── Answers ── */}
        {answers.length>0 && (
          <div style={{marginBottom:24}}>
            <h2 style={{fontSize:16,fontWeight:700,color:"#0f172a",margin:"0 0 14px"}}>
              {answers.length} Answer{answers.length!==1?"s":""}
            </h2>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {answers.map((a,i)=>{
                const aName = a.author?.name||a.user?.name||"Community Member";
                return (
                  <motion.div key={a._id||i} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
                    style={{background:"white",border:"1.5px solid #e2e8f0",borderRadius:14,padding:"18px 20px",
                      boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <Avatar name={aName} size={32}/>
                        <span style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{aName}</span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontSize:12,color:"#94a3b8"}}>{timeAgo(a.createdAt)}</span>
                        <button onClick={()=>likeAnswer(a._id)}
                          style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",
                            borderRadius:7,border:`1.5px solid ${(a.likes||[]).find(l=>(l._id||l)===uid)?"#2563eb":"#e2e8f0"}`,
                            background:(a.likes||[]).find(l=>(l._id||l)===uid)?"#eff6ff":"white",
                            cursor:"pointer",fontSize:11,fontWeight:600,
                            color:(a.likes||[]).find(l=>(l._id||l)===uid)?"#2563eb":"#64748b"}}>
                          <ThumbsUp style={{width:11,height:11}}/> {(a.likes||[]).length}
                        </button>
                      </div>
                    </div>
                    <p style={{fontSize:14,color:"#374151",lineHeight:1.7,margin:0}}>{a.content||a.text||a.body||""}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Post Answer ── */}
        <div style={{background:"white",border:"1.5px solid #e2e8f0",borderRadius:16,padding:"22px 24px",
          boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
          <h3 style={{fontSize:15,fontWeight:700,color:"#0f172a",margin:"0 0 14px"}}>Your Answer</h3>
          <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:12}}>
            <textarea rows={5} value={ans} onChange={e=>setAns(e.target.value)}
              placeholder="Share your knowledge or experience..."
              style={{width:"100%",padding:"14px",border:"1.5px solid #e2e8f0",borderRadius:12,fontSize:14,
                outline:"none",resize:"vertical",boxSizing:"border-box",fontFamily:"inherit",
                lineHeight:1.65,transition:"border-color 0.15s"}}
              onFocus={e=>e.target.style.borderColor="#2563eb"}
              onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
            <div style={{display:"flex",justifyContent:"flex-end"}}>
              <button type="submit" disabled={sub||!ans.trim()}
                style={{display:"flex",alignItems:"center",gap:7,padding:"11px 22px",borderRadius:10,border:"none",
                  fontSize:14,fontWeight:700,cursor:sub||!ans.trim()?"not-allowed":"pointer",
                  background:sub||!ans.trim()?"#e2e8f0":"#2563eb",
                  color:sub||!ans.trim()?"#94a3b8":"white",
                  boxShadow:sub||!ans.trim()?"none":"0 4px 14px rgba(37,99,235,0.3)"}}>
                <Send style={{width:15,height:15}}/> Post Answer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
