import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, MapPin, Phone, ArrowRight, X, CheckCircle, Clock, XCircle, Star } from "lucide-react";
import toast from "react-hot-toast";
import { bookingAPI, reviewAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { LoadingSpinner } from "../components/ui/Cards";

const STATUS_CONFIG = {
  pending:   { label:"Pending",   bg:"#fffbeb", color:"#b45309", border:"#fde68a", icon:"⏳" },
  confirmed: { label:"Confirmed", bg:"#eff6ff", color:"#2563eb", border:"#bfdbfe", icon:"✅" },
  completed: { label:"Completed", bg:"#f0fdf4", color:"#16a34a", border:"#bbf7d0", icon:"🎉" },
  cancelled: { label:"Cancelled", bg:"#fef2f2", color:"#dc2626", border:"#fecaca", icon:"❌" },
};

const FILTERS = ["All", "Pending", "Confirmed", "Completed", "Cancelled"];

function BookingCard({ booking, onStatusChange, role }) {
  const [acting, setActing] = useState(false);
  const st = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;

  const act = async (status) => {
    setActing(true);
    try {
      await bookingAPI.updateStatus(booking._id, status);
      toast.success(
        status === "confirmed"  ? "Booking confirmed!" :
        status === "completed"  ? "Booking marked as completed." :
        "Booking cancelled."
      );
      onStatusChange(booking._id, status);
    } catch (e) {
      toast.error(e.response?.data?.message || "Update failed");
    } finally { setActing(false); }
  };

  const svc  = booking.service  || {};
  const prov = booking.provider || {};
  const cust = booking.newcomer || {};
  const dateStr = booking.date
    ? new Date(booking.date).toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short", year:"numeric" })
    : "—";

  return (
    <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
      style={{ background:"#fff", border:"1.5px solid #f1f5f9", borderRadius:16,
        overflow:"hidden", boxShadow:"0 1px 6px rgba(0,0,0,0.05)" }}>

      {/* Cover strip */}
      {svc.images?.[0] && (
        <div style={{ height:90, overflow:"hidden", background:"#e2e8f0" }}>
          <img src={svc.images[0]} alt={svc.title}
            style={{ width:"100%", height:"100%", objectFit:"cover", opacity:0.85 }}/>
        </div>
      )}

      <div style={{ padding:"16px 18px" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10, marginBottom:10 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontWeight:800, fontSize:15, color:"#0f172a", margin:"0 0 3px",
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {svc.title || "Service"}
            </p>
            <p style={{ fontSize:12, color:"#64748b", margin:0, display:"flex", alignItems:"center", gap:4 }}>
              <MapPin style={{ width:11, height:11 }}/> {svc.location || "Bachupally"}
            </p>
          </div>
          <span style={{ fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:99, flexShrink:0,
            background:st.bg, color:st.color, border:`1px solid ${st.border}` }}>
            {st.icon} {st.label}
          </span>
        </div>

        {/* Details grid */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
          {[
            { label:"Date",    value:dateStr },
            { label:"Time",    value:booking.time || "—" },
            { label:role==="provider"?"Customer":"Provider",
              value:role==="provider" ? (cust.name||"Customer") : (prov.name||"Provider") },
            { label:"Amount",  value:booking.amount > 0 ? `₹${booking.amount.toLocaleString()}` : "Free" },
          ].map(({ label, value }) => (
            <div key={label} style={{ background:"#f8fafc", borderRadius:8, padding:"8px 10px" }}>
              <p style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase",
                letterSpacing:"0.05em", margin:"0 0 2px" }}>{label}</p>
              <p style={{ fontSize:12, fontWeight:700, color:"#0f172a", margin:0,
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Booking ID */}
        <p style={{ fontSize:10, color:"#94a3b8", margin:"0 0 12px", fontFamily:"monospace" }}>
          ID: {booking._id?.slice(-8).toUpperCase()}
        </p>

        {/* Notes */}
        {booking.notes && (
          <div style={{ background:"#f8fafc", borderRadius:8, padding:"8px 10px", marginBottom:12 }}>
            <p style={{ fontSize:11, fontWeight:700, color:"#94a3b8", margin:"0 0 2px" }}>Notes</p>
            <p style={{ fontSize:12, color:"#64748b", margin:0, lineHeight:1.5 }}>{booking.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {/* Provider actions */}
          {role === "provider" && booking.status === "pending" && (
            <>
              <button onClick={()=>act("confirmed")} disabled={acting}
                style={{ flex:1, padding:"9px", borderRadius:9, border:"none", background:"#2563eb",
                  color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                <CheckCircle style={{ width:13, height:13 }}/> Accept
              </button>
              <button onClick={()=>act("cancelled")} disabled={acting}
                style={{ flex:1, padding:"9px", borderRadius:9, border:"1.5px solid #fecaca",
                  background:"#fef2f2", color:"#dc2626", fontSize:12, fontWeight:700, cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                <XCircle style={{ width:13, height:13 }}/> Decline
              </button>
            </>
          )}
          {role === "provider" && booking.status === "confirmed" && (
            <button onClick={()=>act("completed")} disabled={acting}
              style={{ flex:1, padding:"9px", borderRadius:9, border:"none", background:"#16a34a",
                color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
              <CheckCircle style={{ width:13, height:13 }}/> Mark Completed
            </button>
          )}

          {/* Newcomer actions */}
          {role === "newcomer" && ["pending", "confirmed"].includes(booking.status) && (
            <button onClick={()=>act("cancelled")} disabled={acting}
              style={{ padding:"8px 16px", borderRadius:9, border:"1.5px solid #fecaca",
                background:"#fef2f2", color:"#dc2626", fontSize:12, fontWeight:700, cursor:"pointer" }}>
              Cancel Booking
            </button>
          )}

          {/* Write review — newcomer, completed */}
          {role === "newcomer" && booking.status === "completed" && svc._id && (
            <Link to={`/services/${svc._id}#reviews`}
              style={{ flex:1, padding:"9px", borderRadius:9, border:"1.5px solid #bfdbfe",
                background:"#eff6ff", color:"#2563eb", fontSize:12, fontWeight:700,
                textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
              <Star style={{ width:13, height:13 }}/> Write a Review
            </Link>
          )}

          {/* View service */}
          {svc._id && (
            <Link to={`/services/${svc._id}`}
              style={{ padding:"8px 14px", borderRadius:9, border:"1.5px solid #e2e8f0",
                background:"#f8fafc", color:"#475569", fontSize:12, fontWeight:700,
                textDecoration:"none", display:"flex", alignItems:"center", gap:5 }}>
              View Service <ArrowRight style={{ width:12, height:12 }}/>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function MyBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("All");

  useEffect(() => {
    bookingAPI.getMy()
      .then(({ data }) => setBookings(data.data || []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  const onStatusChange = (id, newStatus) => {
    setBookings(prev => prev.map(b => b._id === id ? { ...b, status: newStatus } : b));
  };

  const counts = {
    All: bookings.length,
    Pending:   bookings.filter(b => b.status === "pending").length,
    Confirmed: bookings.filter(b => b.status === "confirmed").length,
    Completed: bookings.filter(b => b.status === "completed").length,
    Cancelled: bookings.filter(b => b.status === "cancelled").length,
  };

  const filtered = filter === "All"
    ? bookings
    : bookings.filter(b => b.status === filter.toLowerCase());

  const role = user?.role;

  if (loading) return <LoadingSpinner size="lg"/>;

  return (
    <div style={{ background:"#f0f4f8", minHeight:"100vh", fontFamily:"Inter,system-ui,sans-serif" }}>
      <div className="wrap" style={{ paddingTop:28, paddingBottom:56 }}>

        {/* Header */}
        <div style={{ marginBottom:24 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"#eff6ff",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Calendar style={{ width:18, height:18, color:"#2563eb" }}/>
            </div>
            <h1 style={{ fontSize:"1.4rem", fontWeight:800, color:"#0f172a", margin:0 }}>
              {role === "provider" ? "Manage Bookings" : "My Bookings"}
            </h1>
          </div>
          <p style={{ fontSize:13, color:"#64748b", margin:0 }}>
            {role === "provider"
              ? "Accept, decline, and manage all customer bookings for your services."
              : "Track and manage all your service bookings."}
          </p>
        </div>

        {/* Status summary pills */}
        <div style={{ display:"flex", gap:10, marginBottom:24, flexWrap:"wrap" }}>
          {[
            { key:"Pending",   bg:"#fffbeb", border:"#fde68a", color:"#b45309" },
            { key:"Confirmed", bg:"#eff6ff", border:"#bfdbfe", color:"#2563eb" },
            { key:"Completed", bg:"#f0fdf4", border:"#bbf7d0", color:"#16a34a" },
            { key:"Cancelled", bg:"#fef2f2", border:"#fecaca", color:"#dc2626" },
          ].map(({ key, bg, border, color }) => (
            <div key={key} style={{ padding:"10px 20px", borderRadius:10, background:bg, border:`1.5px solid ${border}` }}>
              <p style={{ fontSize:22, fontWeight:800, color, margin:0, lineHeight:1 }}>{counts[key]}</p>
              <p style={{ fontSize:11, fontWeight:600, color, margin:"3px 0 0" }}>{key}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display:"flex", gap:4, background:"#f1f5f9", borderRadius:10,
          padding:4, marginBottom:20, width:"fit-content" }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding:"7px 16px", borderRadius:7, border:"none", cursor:"pointer",
                fontSize:12, fontWeight:filter===f?700:500,
                background:filter===f?"#fff":"transparent",
                color:filter===f?"#0f172a":"#64748b",
                boxShadow:filter===f?"0 1px 4px rgba(0,0,0,0.08)":"none",
                transition:"all 0.12s" }}>
              {f} {counts[f] > 0 && f !== "All" ? `(${counts[f]})` : ""}
            </button>
          ))}
        </div>

        {/* Booking grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"56px 24px", background:"#fff",
            border:"1.5px dashed #e2e8f0", borderRadius:16 }}>
            <p style={{ fontSize:40, margin:"0 0 14px" }}>📅</p>
            <p style={{ fontSize:16, fontWeight:700, color:"#0f172a", margin:"0 0 6px" }}>
              No {filter !== "All" ? filter.toLowerCase() : ""} bookings
            </p>
            <p style={{ fontSize:13, color:"#64748b", margin:"0 0 20px" }}>
              {role === "newcomer"
                ? "Browse services and make your first booking."
                : "Bookings from customers will appear here."}
            </p>
            {role === "newcomer" && (
              <Link to="/services" style={{ padding:"10px 24px", borderRadius:99, background:"#2563eb",
                color:"#fff", fontSize:13, fontWeight:700, textDecoration:"none" }}>
                Browse Services →
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:16 }}>
            <AnimatePresence>
              {filtered.map(b => (
                <BookingCard key={b._id} booking={b} onStatusChange={onStatusChange} role={role}/>
              ))}
            </AnimatePresence>
          </div>
        )}

      </div>
    </div>
  );
}
