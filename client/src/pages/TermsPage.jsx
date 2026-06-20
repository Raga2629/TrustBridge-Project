export default function TermsPage() {
  const sections = [
    { title: "Acceptance of Terms", body: "By accessing or using TrustBridge, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform." },
    { title: "Eligibility", body: "You must be at least 18 years old to use TrustBridge. By creating an account you confirm that you are 18 or older and that the information you provide is accurate." },
    { title: "User Accounts", body: "You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorised use of your account. TrustBridge reserves the right to suspend or terminate accounts that violate these terms." },
    { title: "Verified Residents", body: "Residents who complete the Aadhaar-based verification process receive a Verified badge. Verified status does not constitute an endorsement by TrustBridge. Users interact with verified residents at their own discretion." },
    { title: "Service Providers", body: "Service providers must subscribe to a plan to make their listings visible. All providers are subject to our quality standards and may be removed for policy violations, fraud, or poor reviews." },
    { title: "Prohibited Conduct", body: "You may not: post false or misleading information, harass or abuse other users, attempt to circumvent our verification processes, scrape or mine data from the platform, or use TrustBridge for any illegal purpose." },
    { title: "Reviews and Content", body: "All user-generated content, including reviews and community posts, must be truthful and respectful. TrustBridge uses AI moderation to detect fake reviews. Content that violates our community guidelines will be removed." },
    { title: "Limitation of Liability", body: "TrustBridge is a platform that connects users. We do not guarantee the quality, safety, or legality of services listed. We are not liable for any loss or damage arising from use of the platform or interactions between users." },
    { title: "Changes to Terms", body: "We may update these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms." },
    { title: "Contact", body: "For questions about these Terms of Service, contact us at trustbridge.platform@gmail.com." },
    { title: "Governing Law", body: "These terms are governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts in Hyderabad, Telangana." },
  ];

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", fontFamily: "Inter,system-ui,sans-serif" }}>
      <div style={{ background: "white", borderBottom: "1px solid #e2e8f0", padding: "32px 0" }}>
        <div className="wrap">
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>Terms of Service</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Last updated: June 2026</p>
        </div>
      </div>
      <div className="wrap" style={{ paddingTop: 36, paddingBottom: 56, maxWidth: 760 }}>
        <div style={{ background: "white", border: "1.5px solid #e2e8f0", borderRadius: 16, padding: "32px 36px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.75, marginBottom: 32 }}>
            These Terms of Service govern your use of TrustBridge. Please read them carefully before using the platform.
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
