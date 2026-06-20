import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Camera, User, Mail, MapPin, Upload, Save, ChevronLeft, Check, Phone, Shield, Star, MessageCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { userAPI } from "../services/api";
import toast from "react-hot-toast";

function isRealAvatar(url) {
  if (!url) return false;
  if (url.startsWith('data:')) return true;
  if (url.includes('placehold.co')) return false;
  return url.startsWith('http');
}

const AREAS = ["Bachupally","Miyapur","Secunderabad"];
const CONNECTIONS = [
  {id:"local_resident",label:"Local Resident"},
  {id:"student",label:"Student"},
  {id:"employee",label:"Employee"},
  {id:"business_owner",label:"Business Owner"},
  {id:"other",label:"Other"},
];
const AV_COLORS = ["#2563eb","#7c3aed","#0891b2","#16a34a","#d97706","#dc2626","#db2777"];
const av = n => AV_COLORS[(n?.charCodeAt(0)||0) % AV_COLORS.length];

// ─── Shared sub-components ────────────────────────────────────────────────────
function SectionCard({ id, icon, title, badge, children }) {
  return (
    <div id={id} style={{background:"white",border:"1.5px solid #e2e8f0",borderRadius:16,
      padding:"22px 24px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)",marginBottom:16}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:18}}>{icon}</span>
          <h2 style={{fontSize:15,fontWeight:700,color:"#0f172a",margin:0}}>{title}</h2>
        </div>
        {badge && <span style={{fontSize:11,fontWeight:700,color:"#16a34a",display:"flex",alignItems:"center",gap:4}}>
          <Check style={{width:12,height:12}}/> {badge}
        </span>}
      </div>
      {children}
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, Icon, type="text", readOnly=false, sublabel }) {
  const [foc, setFoc] = useState(false);
  return (
    <div style={{marginBottom:16}}>
      <label style={{display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:6}}>
        {label}{sublabel&&<span style={{fontWeight:400,color:"#94a3b8",fontSize:12}}> {sublabel}</span>}
      </label>
      <div style={{position:"relative"}}>
        {Icon && <Icon style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",
          width:15,height:15,color:"#94a3b8"}}/>}
        <input type={type} value={value||""} onChange={e=>onChange?.(e.target.value)}
          placeholder={placeholder} readOnly={readOnly}
          onFocus={()=>setFoc(true)} onBlur={()=>setFoc(false)}
          style={{width:"100%",height:52,paddingLeft:Icon?42:14,paddingRight:14,
            border:`1.5px solid ${foc&&!readOnly?"#2563eb":"#e2e8f0"}`,
            boxShadow:foc&&!readOnly?"0 0 0 3px rgba(37,99,235,0.1)":"none",
            borderRadius:12,fontSize:14,color:readOnly?"#94a3b8":"#0f172a",
            background:readOnly?"#f8fafc":"white",outline:"none",
            transition:"all 0.15s",boxSizing:"border-box",cursor:readOnly?"not-allowed":"text"}}/>
      </div>
    </div>
  );
}

// ─── Shared Avatar Upload Block ───────────────────────────────────────────────
function AvatarSection({ user, description, avatarUploading, onFile }) {
  const avatarInp = useRef(null);
  const dropRef   = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  return (
    <SectionCard id="photo" icon="📷" title="Profile Photo">
      <div style={{display:"flex",gap:24,alignItems:"flex-start",flexWrap:"wrap"}}>
        <div style={{position:"relative",flexShrink:0}}>
          <div style={{width:80,height:80,borderRadius:"50%",background:av(user.name),
            display:"flex",alignItems:"center",justifyContent:"center",
            color:"white",fontSize:28,fontWeight:800,overflow:"hidden"}}>
            {isRealAvatar(user.avatar)
              ? <img src={user.avatar} alt="avatar" style={{width:80,height:80,objectFit:"cover"}}/>
              : user.name?.charAt(0)}
          </div>
          <button onClick={()=>avatarInp.current?.click()}
            style={{position:"absolute",bottom:2,right:2,width:24,height:24,borderRadius:"50%",
              background:"#2563eb",border:"2px solid white",cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Camera style={{width:12,height:12,color:"white"}}/>
          </button>
          <input ref={avatarInp} type="file" accept="image/jpeg,image/jpg,image/png"
            style={{display:"none"}} onChange={e=>onFile(e.target.files[0])}/>
        </div>
        <div style={{flex:1,minWidth:220}}>
          <p style={{fontSize:13,color:"#64748b",margin:"0 0 4px"}}>{description}</p>
          <p style={{fontSize:11,color:"#94a3b8",margin:"0 0 12px"}}>JPG, JPEG or PNG · Max 5 MB</p>
          <div ref={dropRef}
            onDragOver={e=>{e.preventDefault();setDragOver(true);}}
            onDragLeave={()=>setDragOver(false)}
            onDrop={e=>{e.preventDefault();setDragOver(false);onFile(e.dataTransfer.files[0]);}}
            onClick={()=>avatarInp.current?.click()}
            style={{border:`2px dashed ${dragOver?"#2563eb":"#cbd5e1"}`,borderRadius:12,
              padding:"20px",textAlign:"center",cursor:"pointer",
              background:dragOver?"#eff6ff":"#fafafa",transition:"all 0.15s",marginBottom:10}}>
            <Upload style={{width:20,height:20,color:"#94a3b8",margin:"0 auto 6px"}}/>
            <p style={{fontSize:12,fontWeight:600,color:"#374151",margin:"0 0 2px"}}>Click to upload or drag & drop</p>
            <p style={{fontSize:11,color:"#94a3b8",margin:0}}>JPG, JPEG, PNG · Max 5 MB</p>
          </div>
          <button onClick={()=>avatarInp.current?.click()} disabled={avatarUploading}
            style={{padding:"8px 20px",borderRadius:9,border:"1.5px solid #2563eb",
              background:"white",color:"#2563eb",fontSize:13,fontWeight:600,cursor:"pointer"}}>
            {avatarUploading?"Uploading…":"Upload Photo"}
          </button>
        </div>
      </div>
    </SectionCard>
  );
}

// ─── 1. NEWCOMER PROFILE ─────────────────────────────────────────────────────
function NewcomerProfile({ user, profile, nav, handleAvatarFile, avatarUploading, loadUser }) {
  const [name,   setName]   = useState(user.name||"");
  const [phone,  setPhone]  = useState(user.phone||"");
  const [area,   setArea]   = useState(profile?.area||user.location||"");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await userAPI.updateMe({ name, phone, location: area });
      await loadUser();
      toast.success("Profile saved!");
    } catch { toast.error("Save failed"); } finally { setSaving(false); }
  };

  return (
    <div style={{background:"#f0f4f8",minHeight:"100vh",fontFamily:"Inter,system-ui,sans-serif"}}>
      <div style={{background:"white",borderBottom:"1px solid #e2e8f0",padding:"16px 0"}}>
        <div className="wrap" style={{display:"flex",alignItems:"center",gap:12}}>
          <button onClick={()=>nav(-1)} style={{display:"flex",alignItems:"center",gap:5,fontSize:13,
            fontWeight:600,color:"#64748b",background:"none",border:"none",cursor:"pointer",padding:0}}>
            <ChevronLeft style={{width:16,height:16}}/> Back
          </button>
          <div>
            <h1 style={{fontSize:20,fontWeight:800,color:"#0f172a",margin:0}}>My Profile</h1>
            <p style={{fontSize:12,color:"#94a3b8",margin:0}}>Manage your account information and preferences.</p>
          </div>
        </div>
      </div>
      <div className="wrap" style={{paddingTop:28,paddingBottom:80,maxWidth:640}}>
        <AvatarSection user={user} description="Add a profile photo to personalise your TrustBridge account."
          avatarUploading={avatarUploading} onFile={handleAvatarFile}/>
        <SectionCard id="basic" icon="👤" title="Account Details">
          <InputField label="Full Name" Icon={User} value={name} onChange={setName} placeholder="Your full name"/>
          <InputField label="Email Address" sublabel="(cannot change)" Icon={Mail} value={user.email} readOnly/>
          <InputField label="Phone Number" sublabel="(optional)" Icon={Phone} value={phone} onChange={setPhone} placeholder="+91 XXXXX XXXXX"/>
          <div style={{marginBottom:16}}>
            <label style={{display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:6}}>Area / Location</label>
            <div style={{position:"relative"}}>
              <MapPin style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",width:15,height:15,color:"#94a3b8"}}/>
              <select value={area} onChange={e=>setArea(e.target.value)}
                style={{width:"100%",height:52,paddingLeft:42,paddingRight:14,border:"1.5px solid #e2e8f0",
                  borderRadius:12,fontSize:14,color:area?"#0f172a":"#94a3b8",background:"white",
                  outline:"none",appearance:"none",cursor:"pointer",boxSizing:"border-box"}}>
                <option value="">Select area…</option>
                {AREAS.map(a=><option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
        </SectionCard>
        <button onClick={save} disabled={saving}
          style={{width:"100%",height:52,borderRadius:14,border:"none",fontSize:15,fontWeight:700,
            background:saving?"#93c5fd":"#2563eb",color:"white",cursor:saving?"not-allowed":"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",gap:8,
            boxShadow:"0 4px 16px rgba(37,99,235,0.3)"}}>
          <Save style={{width:17,height:17}}/> {saving?"Saving…":"Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ─── 2. COMMUNITY MEMBER PROFILE ─────────────────────────────────────────────
function CommunityProfile({ user, profile, nav, handleAvatarFile, avatarUploading, loadUser }) {
  const [name,   setName]   = useState(user.name||"");
  const [area,   setArea]   = useState(profile?.area||user.location||"");
  const [conn,   setConn]   = useState(profile?.connectionToArea||"");
  const [bio,    setBio]    = useState(profile?.bio||"");
  const [saving, setSaving] = useState(false);

  const qa    = profile?.questionsAnswered||0;
  const hv    = profile?.helpfulVotes||0;
  const rs    = profile?.recommendationsShared||0;
  const score = profile?.trustScore||0;

  const save = async () => {
    setSaving(true);
    try {
      await userAPI.updateMe({ name });
      await userAPI.updateCommunityProfile({ bio, connectionToArea: conn, area });
      await loadUser();
      toast.success("Profile saved!");
    } catch { toast.error("Save failed"); } finally { setSaving(false); }
  };

  return (
    <div style={{background:"#f0f4f8",minHeight:"100vh",fontFamily:"Inter,system-ui,sans-serif"}}>
      <div style={{background:"white",borderBottom:"1px solid #e2e8f0",padding:"16px 0"}}>
        <div className="wrap" style={{display:"flex",alignItems:"center",gap:12}}>
          <button onClick={()=>nav(-1)} style={{display:"flex",alignItems:"center",gap:5,fontSize:13,
            fontWeight:600,color:"#64748b",background:"none",border:"none",cursor:"pointer",padding:0}}>
            <ChevronLeft style={{width:16,height:16}}/> Back
          </button>
          <div>
            <h1 style={{fontSize:20,fontWeight:800,color:"#0f172a",margin:0}}>Profile Information</h1>
            <p style={{fontSize:12,color:"#94a3b8",margin:0}}>Help newcomers know who you are.</p>
          </div>
        </div>
      </div>
      <div className="wrap" style={{paddingTop:28,paddingBottom:80,maxWidth:640}}>
        <AvatarSection user={user} description="Add a photo so newcomers can recognise you when you help them."
          avatarUploading={avatarUploading} onFile={handleAvatarFile}/>

        {/* Community stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
          {[
            {icon:"💬",label:"Answered",    value:qa},
            {icon:"👍",label:"Helpful Votes",value:hv},
            {icon:"⭐",label:"Recommended", value:rs},
            {icon:"🛡️",label:"Trust Score", value:`${score}/100`},
          ].map(m=>(
            <div key={m.label} style={{background:"white",border:"1.5px solid #e2e8f0",borderRadius:12,
              padding:"14px 12px",textAlign:"center",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
              <p style={{fontSize:18,margin:"0 0 4px"}}>{m.icon}</p>
              <p style={{fontSize:16,fontWeight:800,color:"#0f172a",margin:0}}>{m.value}</p>
              <p style={{fontSize:10,color:"#94a3b8",margin:"2px 0 0"}}>{m.label}</p>
            </div>
          ))}
        </div>

        <SectionCard id="basic" icon="👤" title="Basic Information">
          <InputField label="Full Name" Icon={User} value={name} onChange={setName} placeholder="Your full name"/>
          <InputField label="Email Address" sublabel="(cannot change)" Icon={Mail} value={user.email} readOnly/>
          <div style={{marginBottom:16}}>
            <label style={{display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:6}}>Area</label>
            <div style={{position:"relative"}}>
              <MapPin style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",width:15,height:15,color:"#94a3b8"}}/>
              <select value={area} onChange={e=>setArea(e.target.value)}
                style={{width:"100%",height:52,paddingLeft:42,paddingRight:14,border:"1.5px solid #e2e8f0",
                  borderRadius:12,fontSize:14,color:area?"#0f172a":"#94a3b8",background:"white",
                  outline:"none",appearance:"none",cursor:"pointer",boxSizing:"border-box"}}>
                <option value="">Select area…</option>
                {AREAS.map(a=><option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
        </SectionCard>

        <SectionCard id="connection" icon="👥" title="Connection to Area" badge={conn?"Set":null}>
          <p style={{fontSize:12,color:"#94a3b8",margin:"0 0 16px"}}>Helps newcomers understand how well you know the area.</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}} className="conn-grid">
            {CONNECTIONS.map(c=>{
              const sel=conn===c.id;
              return (
                <button key={c.id} onClick={()=>setConn(c.id)}
                  style={{padding:"12px 8px",borderRadius:10,cursor:"pointer",textAlign:"center",
                    fontSize:13,fontWeight:sel?700:500,transition:"all 0.15s",
                    background:sel?"#eff6ff":"white",color:sel?"#1d4ed8":"#374151",
                    border:`1.5px solid ${sel?"#2563eb":"#e2e8f0"}`}}>
                  {sel&&<Check style={{width:12,height:12,marginRight:4,verticalAlign:"middle"}}/>}{c.label}
                </button>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard id="bio" icon="📋" title="Short Bio">
          <p style={{fontSize:12,color:"#94a3b8",margin:"0 0 12px"}}>A few sentences about yourself and your connection to this area.</p>
          <textarea rows={4} value={bio} onChange={e=>setBio(e.target.value)}
            placeholder="E.g. I've lived in Miyapur for 5 years and know all the best spots for newcomers."
            style={{width:"100%",padding:"14px",border:"1.5px solid #e2e8f0",borderRadius:12,
              fontSize:13,color:"#0f172a",lineHeight:1.65,resize:"vertical",outline:"none",
              boxSizing:"border-box",fontFamily:"inherit"}}
            onFocus={e=>e.target.style.borderColor="#2563eb"}
            onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
        </SectionCard>

        <button onClick={save} disabled={saving}
          style={{width:"100%",height:52,borderRadius:14,border:"none",fontSize:15,fontWeight:700,
            background:saving?"#93c5fd":"#2563eb",color:"white",cursor:saving?"not-allowed":"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",gap:8,
            boxShadow:"0 4px 16px rgba(37,99,235,0.3)"}}>
          <Save style={{width:17,height:17}}/> {saving?"Saving…":"Save All Changes"}
        </button>
      </div>
      <style>{`@media(max-width:640px){.conn-grid{grid-template-columns:1fr 1fr !important;}}`}</style>
    </div>
  );
}

// ─── 3. LOCAL GUIDE (resident) PROFILE ───────────────────────────────────────
function GuideProfile({ user, profile, nav, handleAvatarFile, avatarUploading, loadUser }) {
  const [name,  setName]  = useState(user.name||"");
  const [area,  setArea]  = useState(profile?.area||user.location||"");
  const [conn,  setConn]  = useState(profile?.connectionToArea||"");
  const [bio,   setBio]   = useState(profile?.bio||"");
  const [langs, setLangs] = useState((profile?.languages||[]).join(", ")||"");
  const [specs, setSpecs] = useState((profile?.specialties||[]).join(", ")||"");
  const [years, setYears] = useState(String(profile?.yearsInArea||""));
  const [saving,setSaving]= useState(false);

  const score   = profile?.trustScore||0;
  const rating  = profile?.averageRating||0;
  const total   = profile?.totalRatings||0;
  const verified= profile?.isVerifiedBadge||false;

  const save = async () => {
    setSaving(true);
    try {
      await userAPI.updateMe({ name });
      await userAPI.updateCommunityProfile({
        bio, connectionToArea: conn, area,
        languages:   langs.split(",").map(s=>s.trim()).filter(Boolean),
        specialties: specs.split(",").map(s=>s.trim()).filter(Boolean),
        yearsInArea: Number(years)||0,
      });
      await loadUser();
      toast.success("Guide profile saved!");
    } catch { toast.error("Save failed"); } finally { setSaving(false); }
  };

  return (
    <div style={{background:"#f0f4f8",minHeight:"100vh",fontFamily:"Inter,system-ui,sans-serif"}}>
      <div style={{background:"white",borderBottom:"1px solid #e2e8f0",padding:"16px 0"}}>
        <div className="wrap" style={{display:"flex",alignItems:"center",gap:12}}>
          <button onClick={()=>nav(-1)} style={{display:"flex",alignItems:"center",gap:5,fontSize:13,
            fontWeight:600,color:"#64748b",background:"none",border:"none",cursor:"pointer",padding:0}}>
            <ChevronLeft style={{width:16,height:16}}/> Back
          </button>
          <div>
            <h1 style={{fontSize:20,fontWeight:800,color:"#0f172a",margin:0}}>Guide Profile</h1>
            <p style={{fontSize:12,color:"#94a3b8",margin:0}}>Help newcomers connect with trusted local expertise.</p>
          </div>
        </div>
      </div>
      <div className="wrap" style={{paddingTop:28,paddingBottom:80,maxWidth:640}}>
        <AvatarSection user={user}
          description="Add a professional photo so newcomers can easily identify and trust you."
          avatarUploading={avatarUploading} onFile={handleAvatarFile}/>

        {/* Guide stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
          {[
            {icon: verified?"✅":"⏳", label:"Verification",  value:verified?"Verified":"Pending"},
            {icon:"🛡️",               label:"Trust Score",   value:`${score}/100`},
            {icon:"⭐",               label:"Avg Rating",    value:rating?`${rating.toFixed(1)} (${total})`:"New"},
            {icon:"💬",               label:"Answered",      value:profile?.questionsAnswered||0},
          ].map(m=>(
            <div key={m.label} style={{background:"white",border:"1.5px solid #e2e8f0",borderRadius:12,
              padding:"14px 12px",textAlign:"center",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
              <p style={{fontSize:18,margin:"0 0 4px"}}>{m.icon}</p>
              <p style={{fontSize:13,fontWeight:800,color:"#0f172a",margin:0}}>{m.value}</p>
              <p style={{fontSize:10,color:"#94a3b8",margin:"2px 0 0"}}>{m.label}</p>
            </div>
          ))}
        </div>

        {verified && (
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",
            background:"#f0fdf4",border:"1.5px solid #bbf7d0",borderRadius:12,marginBottom:16}}>
            <Shield style={{width:18,height:18,color:"#16a34a",flexShrink:0}}/>
            <p style={{fontSize:13,fontWeight:700,color:"#15803d",margin:0}}>
              Verified Local Guide — Your profile is trusted by the TrustBridge community.
            </p>
          </div>
        )}

        <SectionCard id="basic" icon="👤" title="Basic Information">
          <InputField label="Full Name" Icon={User} value={name} onChange={setName} placeholder="Your full name"/>
          <InputField label="Email Address" sublabel="(cannot change)" Icon={Mail} value={user.email} readOnly/>
          <div style={{marginBottom:16}}>
            <label style={{display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:6}}>Area</label>
            <div style={{position:"relative"}}>
              <MapPin style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",width:15,height:15,color:"#94a3b8"}}/>
              <select value={area} onChange={e=>setArea(e.target.value)}
                style={{width:"100%",height:52,paddingLeft:42,paddingRight:14,border:"1.5px solid #e2e8f0",
                  borderRadius:12,fontSize:14,color:area?"#0f172a":"#94a3b8",background:"white",
                  outline:"none",appearance:"none",cursor:"pointer",boxSizing:"border-box"}}>
                <option value="">Select area…</option>
                {AREAS.map(a=><option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <InputField label="Years of Local Experience" sublabel="(optional)"
            Icon={Star} value={years} onChange={setYears} placeholder="e.g. 5" type="number"/>
        </SectionCard>

        <SectionCard id="connection" icon="👥" title="Connection to Area" badge={conn?"Set":null}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}} className="conn-grid">
            {CONNECTIONS.map(c=>{
              const sel=conn===c.id;
              return (
                <button key={c.id} onClick={()=>setConn(c.id)}
                  style={{padding:"12px 8px",borderRadius:10,cursor:"pointer",textAlign:"center",
                    fontSize:13,fontWeight:sel?700:500,transition:"all 0.15s",
                    background:sel?"#eff6ff":"white",color:sel?"#1d4ed8":"#374151",
                    border:`1.5px solid ${sel?"#2563eb":"#e2e8f0"}`}}>
                  {sel&&<Check style={{width:12,height:12,marginRight:4,verticalAlign:"middle"}}/>}{c.label}
                </button>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard id="bio" icon="📋" title="Guide Bio">
          <p style={{fontSize:12,color:"#94a3b8",margin:"0 0 12px"}}>Tell newcomers about yourself, your local knowledge, and how you can help them settle in.</p>
          <textarea rows={4} value={bio} onChange={e=>setBio(e.target.value)}
            placeholder="E.g. I've lived in Bachupally for 7 years. I know the best hostels, clinics, grocery stores, and transport options for newcomers."
            style={{width:"100%",padding:"14px",border:"1.5px solid #e2e8f0",borderRadius:12,
              fontSize:13,color:"#0f172a",lineHeight:1.65,resize:"vertical",outline:"none",
              boxSizing:"border-box",fontFamily:"inherit"}}
            onFocus={e=>e.target.style.borderColor="#2563eb"}
            onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
        </SectionCard>

        <SectionCard id="expertise" icon="🎯" title="Areas of Expertise & Languages">
          <InputField label="Areas of Expertise" sublabel="comma-separated"
            Icon={MessageCircle} value={specs} onChange={setSpecs}
            placeholder="e.g. Housing, Transport, Healthcare"/>
          <InputField label="Languages Spoken" sublabel="comma-separated"
            Icon={User} value={langs} onChange={setLangs}
            placeholder="e.g. English, Telugu, Hindi"/>
        </SectionCard>

        <button onClick={save} disabled={saving}
          style={{width:"100%",height:52,borderRadius:14,border:"none",fontSize:15,fontWeight:700,
            background:saving?"#93c5fd":"#2563eb",color:"white",cursor:saving?"not-allowed":"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",gap:8,
            boxShadow:"0 4px 16px rgba(37,99,235,0.3)"}}>
          <Save style={{width:17,height:17}}/> {saving?"Saving…":"Save Guide Profile"}
        </button>
      </div>
      <style>{`@media(max-width:640px){.conn-grid{grid-template-columns:1fr 1fr !important;}}`}</style>
    </div>
  );
}

// ─── Main export — routes by role ────────────────────────────────────────────
export default function ProfilePage() {
  const { user, profile, loadUser } = useAuth();
  const nav = useNavigate();
  const [avatarUploading, setAvatarUp] = useState(false);

  if (!user) { nav("/login"); return null; }

  const handleAvatarFile = async (file) => {
    if (!file) return;
    if (!["image/jpeg","image/jpg","image/png"].includes(file.type)) {
      toast.error("Only JPG or PNG"); return;
    }
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5 MB"); return; }
    setAvatarUp(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      await userAPI.uploadAvatar(fd);
      await loadUser();
      toast.success("Photo updated!");
    } catch { toast.error("Upload failed"); } finally { setAvatarUp(false); }
  };

  const shared = { user, profile, nav, handleAvatarFile, avatarUploading, loadUser };

  if (user.role === "newcomer")  return <NewcomerProfile   {...shared}/>;
  if (user.role === "resident")  return <GuideProfile       {...shared}/>;
  if (user.role === "provider")  return <CommunityProfile   {...shared}/>;
  // admin / fallback — show community profile
  return <CommunityProfile {...shared}/>;
}
