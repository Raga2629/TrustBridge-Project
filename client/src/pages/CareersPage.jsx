import { Briefcase } from "lucide-react";
import { Link } from "react-router-dom";

export default function CareersPage() {
  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", fontFamily: "Inter,system-ui,sans-serif" }}>
      <div style={{ background: "white", borderBottom: "1px solid #e2e8f0", padding: "32px 0" }}>
        <div className="wrap">
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>Careers</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Join the team building trust for India's newcomers</p>
        </div>
      </div>
      <div className="wrap" style={{ paddingTop: 64, paddingBottom: 64, textAlign: "center", maxWidth: 560 }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <Briefcase style={{ width: 32, height: 32, color: "#2563eb" }} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: "0 0 12px" }}>No open positions right now</h2>
        <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7, margin: "0 0 28px" }}>
          We're a small, passionate team building something meaningful. We'll post openings here as we grow. In the meantime, feel free to send us your resume and a note about how you'd like to contribute.
        </p>
        <a href="mailto:trustbridge.platform@gmail.com?subject=Careers%20Enquiry"
          style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"11px 24px", borderRadius:10,
            background:"#2563eb", color:"white", fontSize:14, fontWeight:700, textDecoration:"none" }}>
          Send Us a Note
        </a>
      </div>
    </div>
  );
}
