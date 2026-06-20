import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle, BookOpen, Star, Calendar, ArrowRight,
  Clock, CheckCircle, XCircle, Activity
} from "lucide-react";
import { bookingAPI, communityAPI, chatAPI, serviceAPI, reviewAPI } from "../services/api";
import { LoadingSpinner, EmptyState } from "../components/ui/Cards";
import { useAuth } from "../context/AuthContext";
import { formatDistanceToNow } from "date-fns";

// ─── helpers ─────────────────────────────────────────────────────────────────
const STATUS_STYLE = {
  confirmed: { label: "Confirmed", color: "#16a34a", bg: "#f0fdf4" },
  pending:   { label: "Pending",   color: "#d97706", bg: "#fffbeb" },
  completed: { label: "Completed", color: "#2563eb", bg: "#eff6ff" },
  cancelled: { label: "Cancelled", color: "#dc2626", bg: "#fef2f2" },
};

function timeAgo(date) {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return "";
  }
}

// ─── filter tabs ─────────────────────────────────────────────────────────────
const FILTERS = [
  { id: "all",       label: "All",       icon: "✨" },
  { id: "messages",  label: "Messages",  icon: "💬" },
  { id: "community", label: "Community", icon: "📖" },
  { id: "services",  label: "Services",  icon: "🔍" },
  { id: "bookings",  label: "Bookings",  icon: "📅" },
];

// ─── item card ────────────────────────────────────────────────────────────────
function ActivityItem({ item, index }) {
  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      style={{
        display: "flex", alignItems: "flex-start", gap: 14,
        padding: "14px 16px", background: "#fff",
        border: "1.5px solid #f1f5f9", borderRadius: 14,
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        transition: "border-color 0.15s, box-shadow 0.15s",
        cursor: item.to ? "pointer" : "default",
        textDecoration: "none",
      }}
      onMouseEnter={e => {
        if (item.to) {
          e.currentTarget.style.borderColor = "#bfdbfe";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(37,99,235,0.08)";
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "#f1f5f9";
        e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
      }}
    >
      {/* icon */}
      <div style={{
        width: 40, height: 40, borderRadius: 11, flexShrink: 0, marginTop: 1,
        background: item.iconBg,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {item.iconNode
          ? item.iconNode
          : <span style={{ fontSize: 18 }}>{item.icon}</span>
        }
      </div>

      {/* text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", margin: "0 0 3px",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {item.title}
        </p>
        <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 5px", lineHeight: 1.4 }}>
          {item.subtitle}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {item.badge && (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
              background: item.badge.bg, color: item.badge.color,
            }}>
              {item.badge.label}
            </span>
          )}
          {item.time && (
            <span style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}>
              <Clock style={{ width: 11, height: 11 }} /> {item.time}
            </span>
          )}
        </div>
      </div>

      {item.to && (
        <ArrowRight style={{ width: 15, height: 15, color: "#cbd5e1", flexShrink: 0, marginTop: 4 }} />
      )}
    </motion.div>
  );

  return item.to
    ? <Link to={item.to} style={{ textDecoration: "none" }}>{inner}</Link>
    : inner;
}

// ─── section header ───────────────────────────────────────────────────────────
function SectionLabel({ label }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em",
      textTransform: "uppercase", margin: "20px 0 10px", padding: "0 2px",
    }}>
      {label}
    </p>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────
export default function RecentActivityPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // raw data
  const [conversations, setConversations] = useState([]);
  const [posts, setPosts] = useState([]);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const calls = [
      chatAPI.getConversations().catch(() => ({ data: { data: [] } })),
      communityAPI.getAll({ limit: 10 }).catch(() => ({ data: { data: [] } })),
      serviceAPI.getAll({ sort: "featured", limit: 6 }).catch(() => ({ data: { data: [] } })),
      bookingAPI.getMy().catch(() => ({ data: { data: [] } })),
    ];

    // providers / admins can also pull reviews
    if (user?.role === "provider" || user?.role === "admin") {
      calls.push(reviewAPI.getPending().catch(() => ({ data: { data: [] } })));
    }

    Promise.all(calls).then(([c, p, s, b, r]) => {
      setConversations(c.data.data || []);
      setPosts(p.data.data || []);
      setServices(s.data.data || []);
      setBookings(b.data.data || []);
      if (r) setReviews(r.data.data || []);
    }).finally(() => setLoading(false));
  }, [user]);

  // ── build flat item list ──────────────────────────────────────────────────
  const messageItems = conversations.slice(0, 8).map(conv => {
    const other = conv.participants?.find(p => p._id !== user?._id);
    const last  = conv.lastMessage;
    return {
      _id:      conv._id,
      type:     "messages",
      title:    other?.name || "Conversation",
      subtitle: last?.content
        ? (last.content.length > 60 ? last.content.slice(0, 60) + "…" : last.content)
        : "No messages yet",
      iconBg:   "#eff6ff",
      iconNode: <MessageCircle style={{ width: 18, height: 18, color: "#2563eb" }} />,
      badge:    conv.unreadCount > 0
        ? { label: `${conv.unreadCount} new`, color: "#fff", bg: "#2563eb" }
        : null,
      time: last?.createdAt ? timeAgo(last.createdAt) : null,
      to: "/chat",
    };
  });

  const communityItems = posts.slice(0, 8).map(post => ({
    _id:      post._id,
    type:     "community",
    title:    post.title,
    subtitle: `${post.answers?.length || 0} answers · ${post.category || "Community"}`,
    iconBg:   "#f0fdf4",
    iconNode: <BookOpen style={{ width: 18, height: 18, color: "#16a34a" }} />,
    badge:    post.isResolved
      ? { label: "Resolved", color: "#15803d", bg: "#dcfce7" }
      : null,
    time: post.createdAt ? timeAgo(post.createdAt) : null,
    to: `/community/${post._id}`,
  }));

  const serviceItems = services.slice(0, 8).map(svc => ({
    _id:      svc._id,
    type:     "services",
    title:    svc.title,
    subtitle: `${svc.category} · ${svc.location}`,
    iconBg:   "#fffbeb",
    iconNode: <Star style={{ width: 18, height: 18, color: "#d97706" }} />,
    badge:    svc.rating
      ? { label: `★ ${svc.rating.toFixed(1)}`, color: "#b45309", bg: "#fef3c7" }
      : null,
    time: svc.createdAt ? timeAgo(svc.createdAt) : null,
    to: `/services/${svc._id}`,
  }));

  const bookingItems = bookings.slice(0, 8).map(b => {
    const s = STATUS_STYLE[b.status] || STATUS_STYLE.pending;
    return {
      _id:      b._id,
      type:     "bookings",
      title:    b.service?.title || "Booking",
      subtitle: `${new Date(b.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}${b.time ? " · " + b.time : ""}`,
      iconBg:   "#f0f9ff",
      iconNode: <Calendar style={{ width: 18, height: 18, color: "#0284c7" }} />,
      badge:    { label: s.label, color: s.color, bg: s.bg },
      time:     b.createdAt ? timeAgo(b.createdAt) : null,
      to:       "/services",
    };
  });

  const reviewItems = reviews.slice(0, 6).map(r => ({
    _id:      r._id,
    type:     "services",
    title:    `Review: ${r.service?.title || "Service"}`,
    subtitle: r.comment ? (r.comment.length > 60 ? r.comment.slice(0, 60) + "…" : r.comment) : "No comment",
    iconBg:   "#faf5ff",
    iconNode: <Star style={{ width: 18, height: 18, color: "#7c3aed" }} />,
    badge:    { label: `★ ${r.rating}`, color: "#6d28d9", bg: "#ede9fe" },
    time:     r.createdAt ? timeAgo(r.createdAt) : null,
    to:       r.service?._id ? `/services/${r.service._id}` : null,
  }));

  // merge and sort by recency (items without dates go to end)
  const allItems = [...messageItems, ...communityItems, ...serviceItems, ...bookingItems, ...reviewItems];

  // ── apply filter ──────────────────────────────────────────────────────────
  const filtered = filter === "all"
    ? allItems
    : allItems.filter(i => i.type === filter);

  const total = {
    all:       allItems.length,
    messages:  messageItems.length,
    community: communityItems.length,
    services:  serviceItems.length + reviewItems.length,
    bookings:  bookingItems.length,
  };

  // ── group by type for "All" view ──────────────────────────────────────────
  const grouped = filter === "all" ? [
    { label: "Messages",        items: messageItems  },
    { label: "Community Posts", items: communityItems },
    { label: "Services",        items: [...serviceItems, ...reviewItems] },
    { label: "Bookings",        items: bookingItems  },
  ].filter(g => g.items.length > 0) : null;

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div style={{
      background: "#f0f4f8", minHeight: "100vh",
      fontFamily: "Inter,system-ui,sans-serif", paddingBottom: 48,
    }}>
      <div className="wrap" style={{ paddingTop: 28, maxWidth: 680 }}>

        {/* ── header ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: "#eff6ff",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Activity style={{ width: 18, height: 18, color: "#2563eb" }} />
            </div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              Recent Activity
            </h1>
          </div>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
            Your history and actions across TrustBridge
          </p>
        </div>

        {/* ── filter tabs ── */}
        <div style={{
          display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap",
        }}>
          {FILTERS.map(f => {
            const active = filter === f.id;
            const count  = total[f.id] ?? 0;
            return (
              <button key={f.id} onClick={() => setFilter(f.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 14px", borderRadius: 99, fontSize: 13, fontWeight: 600,
                  cursor: "pointer", border: "1.5px solid",
                  borderColor: active ? "#2563eb" : "#e2e8f0",
                  background: active ? "#2563eb" : "#fff",
                  color: active ? "#fff" : "#374151",
                  boxShadow: active ? "0 2px 8px rgba(37,99,235,0.2)" : "none",
                  transition: "all 0.15s",
                }}>
                <span>{f.icon}</span>
                {f.label}
                {count > 0 && (
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "1px 6px", borderRadius: 99,
                    background: active ? "rgba(255,255,255,0.25)" : "#f1f5f9",
                    color: active ? "#fff" : "#64748b",
                  }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── content ── */}
        {filtered.length === 0 ? (
          <div style={{
            background: "#fff", border: "1.5px dashed #e2e8f0", borderRadius: 16,
            padding: "48px 24px", textAlign: "center",
          }}>
            <p style={{ fontSize: 36, margin: "0 0 12px" }}>✨</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>
              No activity yet
            </p>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
              {filter === "messages"  && "Start a conversation with a local guide."}
              {filter === "community" && "Join community discussions to see them here."}
              {filter === "services"  && "Browse services to see your history here."}
              {filter === "bookings"  && "Book a service to see your bookings here."}
              {filter === "all"       && "Your actions will appear here as you explore TrustBridge."}
            </p>
            {filter === "messages"  && <Link to="/chat"      style={linkStyle}>Go to Messages →</Link>}
            {filter === "community" && <Link to="/community" style={linkStyle}>Explore Community →</Link>}
            {filter === "services"  && <Link to="/services"  style={linkStyle}>Browse Services →</Link>}
            {filter === "bookings"  && <Link to="/services"  style={linkStyle}>Find Services →</Link>}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={filter}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}>

              {/* grouped view for "all" filter */}
              {grouped ? (
                grouped.map(group => (
                  <div key={group.label}>
                    <SectionLabel label={group.label} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {group.items.slice(0, 5).map((item, i) => (
                        <ActivityItem key={item._id + i} item={item} index={i} />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                // flat view for single-type filters
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {filtered.map((item, i) => (
                    <ActivityItem key={item._id + i} item={item} index={i} />
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

      </div>
    </div>
  );
}

const linkStyle = {
  display: "inline-block", marginTop: 14,
  fontSize: 13, fontWeight: 700, color: "#2563eb", textDecoration: "none",
};
