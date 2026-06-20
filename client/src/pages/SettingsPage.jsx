
import { useState } from "react";
import { Lock, Bell, Shield, Eye, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function ToggleRow({ label, sublabel, checked, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid #f8fafc" }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", margin: "0 0 2px" }}>{label}</p>
        {sublabel && <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{sublabel}</p>}
      </div>
      <div onClick={() => onChange(!checked)} style={{ width: 40, height: 22, borderRadius: 999, background: checked ? "#2563eb" : "#e2e8f0", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
        <div style={{ width: 18, height: 18, borderRadius: "50%", background: "white", position: "absolute", top: 2, left: checked ? 20 : 2, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <div style={{ background: "white", border: "1.5px solid #e2e8f0", borderRadius: 16, padding: "20px 22px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon style={{ width: 15, height: 15, color: "#2563eb" }} />
        </div>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: 0 }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [notifs, setNotifs] = useState({ email: true, push: true, community: false });
  const [privacy, setPrivacy] = useState({ profileVisible: true, messagingOpen: true });
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });

  if (!user) { nav("/login"); return null; }

  const handlePwdChange = (e) => {
    e.preventDefault();
    if (pwd.next !== pwd.confirm) { toast.error("Passwords do not match"); return; }
    toast.success("Password changed successfully");
    setPwd({ current: "", next: "", confirm: "" });
  };

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", fontFamily: "Inter,system-ui,sans-serif" }}>
      <div style={{ background: "white", borderBottom: "1px solid #e2e8f0", padding: "24px 0 20px" }}>
        <div className="wrap">
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>Settings</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Manage notifications, privacy preferences, and account security settings.</p>
        </div>
      </div>

      <div className="wrap" style={{ paddingTop: 28, paddingBottom: 56, maxWidth: 680 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          <Section icon={Bell} title="Notifications">
            <ToggleRow label="Email Notifications" sublabel="Receive booking updates, verification results, and important TrustBridge alerts via email." checked={notifs.email} onChange={v => setNotifs({...notifs, email: v})} />
            <ToggleRow label="Push Notifications" sublabel="Get instant alerts for bookings, reviews, recommendations, and account activity." checked={notifs.push} onChange={v => setNotifs({...notifs, push: v})} />
            <ToggleRow label="Community Notifications" sublabel="Receive updates when someone answers your questions or interacts with your community posts." checked={notifs.community} onChange={v => setNotifs({...notifs, community: v})} />
          </Section>

          <Section icon={Eye} title="Privacy">
            <ToggleRow label="Profile Visibility" sublabel="Allow other TrustBridge members to view your profile and community contributions." checked={privacy.profileVisible} onChange={v => setPrivacy({...privacy, profileVisible: v})} />
            <ToggleRow label="Open Messaging" sublabel="Allow verified community members and local guides to contact you through TrustBridge." checked={privacy.messagingOpen} onChange={v => setPrivacy({...privacy, messagingOpen: v})} />
          </Section>

          <Section icon={Lock} title="Security">
            <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 16px" }}>Keep your account secure by updating your password regularly.</p>
            <form onSubmit={handlePwdChange} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Current Password", key: "current", type: "password" },
                { label: "New Password",     key: "next",    type: "password" },
                { label: "Confirm Password", key: "confirm", type: "password" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{f.label}</label>
                  <input type={f.type} value={pwd[f.key]} onChange={e => setPwd({...pwd, [f.key]: e.target.value})}
                    style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: 9, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
                    onFocus={e => e.target.style.borderColor = "#2563eb"}
                    onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
                </div>
              ))}
              <button type="submit"
                style={{ padding: "10px 20px", borderRadius: 9, background: "#2563eb", color: "white", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", alignSelf: "flex-start" }}>
                Update Password
              </button>
            </form>
            <div style={{ marginTop: 16, padding: "12px 14px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", margin: "0 0 2px" }}>Two-Factor Authentication</p>
                <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>Coming soon — extra security for your account</p>
              </div>
              <ChevronRight style={{ width: 15, height: 15, color: "#94a3b8" }} />
            </div>
          </Section>

          <Section icon={Shield} title="Account">
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => { toast.success("Settings saved"); }} style={{ padding: "10px 20px", borderRadius: 9, background: "#2563eb", color: "white", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Save All Changes
              </button>
              <button onClick={() => nav("/profile")} style={{ padding: "10px 20px", borderRadius: 9, background: "white", color: "#475569", border: "1.5px solid #e2e8f0", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                View Profile
              </button>
            </div>
          </Section>

        </div>
      </div>
    </div>
  );
}
