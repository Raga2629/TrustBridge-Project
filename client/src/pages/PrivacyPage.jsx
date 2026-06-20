export default function PrivacyPage() {
  const sections = [
    { title: "Information We Collect", body: "We collect information you provide directly, such as your name, email, phone number, and location. We also collect Aadhaar-based identity data for resident verification, processed securely and never stored in full. Usage data such as pages visited and services viewed is collected to improve the platform." },
    { title: "How We Use Your Information", body: "Your information is used to operate TrustBridge, verify identities, facilitate bookings and conversations, send service notifications, and improve the platform. We do not sell your data to third parties." },
    { title: "Data Sharing", body: "Your profile information is visible to other verified users according to your privacy settings. Service providers can see booking details relevant to their services. Residents and newcomers can see each other's public profiles. We share data with law enforcement only when legally required." },
    { title: "Data Security", body: "We use industry-standard encryption (TLS/SSL) for data in transit and AES-256 for data at rest. All passwords are hashed using bcrypt. Access to personal data is restricted to authorised personnel only." },
    { title: "Your Rights", body: "You have the right to access, correct, or delete your personal data at any time. You can request a full export of your data by contacting trustbridge.platform@gmail.com. Accounts can be deleted via the Profile page." },
    { title: "Cookies", body: "We use cookies to maintain your session and improve your experience. You can disable cookies in your browser settings, though some features may not function correctly." },
    { title: "Changes to This Policy", body: "We may update this Privacy Policy from time to time. Significant changes will be communicated via email or an in-app notice. Continued use of TrustBridge after changes constitutes acceptance." },
    { title: "Contact", body: "For privacy-related questions, contact us at trustbridge.platform@gmail.com or through our Contact page." },
  ];

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", fontFamily: "Inter,system-ui,sans-serif" }}>
      <div style={{ background: "white", borderBottom: "1px solid #e2e8f0", padding: "32px 0" }}>
        <div className="wrap">
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>Privacy Policy</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Last updated: June 2026</p>
        </div>
      </div>
      <div className="wrap" style={{ paddingTop: 36, paddingBottom: 56, maxWidth: 760 }}>
        <div style={{ background: "white", border: "1.5px solid #e2e8f0", borderRadius: 16, padding: "32px 36px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.75, marginBottom: 32 }}>
            TrustBridge ("we", "our", "us") is committed to protecting your privacy. This policy explains what data we collect, how we use it, and your rights as a user.
          </p>
          {sections.map((s, i) => (
            <div key={i} style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 10px" }}>{i + 1}. {s.title}</h2>
              <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.8, margin: 0 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
