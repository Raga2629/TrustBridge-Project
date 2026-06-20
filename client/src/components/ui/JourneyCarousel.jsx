import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const SLIDES = [
  {
    headline:    "New to the City?",
    description: "Starting over somewhere unfamiliar can feel overwhelming. TrustBridge helps you take the first step confidently.",
    cta:         "Get started free",
    href:        "/register",
    image:       "/journey/journey-arrive.png",
    accent:      "#2563eb",
    bg:          "#f0f4ff",
  },
  {
    headline:    "Meet People You Can Trust",
    description: "Connect with identity-verified residents who understand the area and can guide you safely through your new city.",
    cta:         "Meet local guides",
    href:        "/residents",
    image:       "/journey/journey-connect.png",
    accent:      "#16a34a",
    bg:          "#f0fdf4",
  },
  {
    headline:    "Find Everything Nearby",
    description: "Explore trusted hostels, clinics, groceries, transport, and essential services recommended by the community.",
    cta:         "Browse services",
    href:        "/services",
    image:       "/journey/journey-discover.png",
    accent:      "#0369a1",
    bg:          "#f0f9ff",
  },
  {
    headline:    "Build Your Local Network",
    description: "Join a supportive community of newcomers and local residents who help each other succeed and settle in.",
    cta:         "Join the community",
    href:        "/community",
    image:       "/journey/journey-community.png",
    accent:      "#7c3aed",
    bg:          "#faf5ff",
  },
  {
    headline:    "Feel at Home Faster",
    description: "Build a comfortable life, make meaningful connections, and settle confidently in your new city.",
    cta:         "Start your journey",
    href:        "/register",
    image:       "/journey/journey-settle.png",
    accent:      "#b45309",
    bg:          "#fffbeb",
  },
];

export default function JourneyCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused,  setPaused]  = useState(false);
  const [dir,     setDir]     = useState(1);
  const timer = useRef(null);

  const go = useCallback((idx, d = 1) => {
    setDir(d);
    setCurrent(idx);
  }, []);

  const prev = () => go((current - 1 + SLIDES.length) % SLIDES.length, -1);
  const next = () => go((current + 1) % SLIDES.length, 1);

  // keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [current]);

  // auto-play
  useEffect(() => {
    if (paused) return;
    timer.current = setTimeout(() => go((current + 1) % SLIDES.length, 1), 4000);
    return () => clearTimeout(timer.current);
  }, [current, paused, go]);

  // touch / swipe
  const touchStartX = useRef(null);
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e) => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 40) delta > 0 ? next() : prev();
    touchStartX.current = null;
  };

  const slide = SLIDES[current];

  const variants = {
    enter:  (d) => ({ opacity: 0, x: d > 0 ? 48 : -48 }),
    center: { opacity: 1, x: 0 },
    exit:   (d) => ({ opacity: 0, x: d > 0 ? -48 : 48 }),
  };

  return (
    <section
      style={{ background: "#fff", padding: "72px 0 80px" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Section heading — no step tab pills */}
      <div className="wrap" style={{ marginBottom: 36 }}>
        <div>
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "#2563eb", marginBottom: 8,
          }}>
            The Newcomer Journey
          </p>
          <h2 style={{
            fontSize: "clamp(1.375rem, 2.5vw, 1.75rem)", fontWeight: 800,
            color: "#0f172a", letterSpacing: "-0.02em", margin: 0, lineHeight: 1.2,
          }}>
            How TrustBridge helps you settle in
          </h2>
        </div>
      </div>

      {/* Slide container */}
      <div className="wrap">
        <div
          style={{
            borderRadius: 20,
            overflow: "hidden",
            background: slide.bg,
            position: "relative",
            minHeight: 420,
            transition: "background 0.5s ease",
          }}
        >
          <AnimatePresence custom={dir} mode="wait">
            <motion.div
              key={current}
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.36, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 3fr",
                minHeight: 420,
                alignItems: "stretch",
              }}
              className="carousel-inner"
            >
              {/* LEFT: copy — no step tag pill */}
              <div style={{
                display: "flex", flexDirection: "column", justifyContent: "center",
                padding: "52px 40px 52px 52px",
              }}>
                {/* headline */}
                <h3 style={{
                  fontSize: "clamp(1.5rem, 2.5vw, 2.125rem)",
                  fontWeight: 800, color: "#0f172a",
                  lineHeight: 1.15, letterSpacing: "-0.025em",
                  margin: "0 0 18px",
                }}>
                  {slide.headline}
                </h3>

                {/* description */}
                <p style={{
                  fontSize: 15, color: "#475569",
                  lineHeight: 1.75, margin: "0 0 36px",
                  maxWidth: 320,
                }}>
                  {slide.description}
                </p>

                {/* CTA link */}
                <Link to={slide.href} style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  color: "#fff", background: slide.accent,
                  textDecoration: "none", borderRadius: 10,
                  padding: "11px 22px", fontSize: 13, fontWeight: 700,
                  width: "fit-content",
                  boxShadow: `0 4px 16px ${slide.accent}44`,
                  transition: "opacity 0.15s",
                }}>
                  {slide.cta} <ArrowRight style={{ width: 14, height: 14 }} />
                </Link>

                {/* Dot indicators */}
                <div style={{ display: "flex", gap: 8, marginTop: 40 }}>
                  {SLIDES.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => go(i, i > current ? 1 : -1)}
                      aria-label={`Go to slide ${i + 1}`}
                      style={{
                        width: i === current ? 28 : 8, height: 8,
                        borderRadius: 999, border: "none", cursor: "pointer",
                        background: i === current ? slide.accent : "#cbd5e1",
                        transition: "all 0.3s", padding: 0,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* RIGHT: illustration image */}
              <div style={{
                position: "relative", overflow: "hidden",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "24px 24px 24px 16px",
              }}>
                <img
                  src={slide.image}
                  alt={slide.headline}
                  style={{
                    width: "100%", height: "100%",
                    objectFit: "cover", objectPosition: "center",
                    borderRadius: 16,
                    boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
                    display: "block",
                    maxHeight: 380,
                  }}
                  loading="lazy"
                />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Prev arrow */}
          <button
            onClick={prev}
            aria-label="Previous slide"
            style={{
              position: "absolute", left: 14, top: "50%",
              transform: "translateY(-50%)",
              width: 40, height: 40, borderRadius: "50%",
              background: "rgba(255,255,255,0.92)",
              border: "1.5px solid #e2e8f0",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              zIndex: 10, transition: "all 0.15s",
            }}
          >
            <ChevronLeft style={{ width: 18, height: 18, color: "#475569" }} />
          </button>

          {/* Next arrow */}
          <button
            onClick={next}
            aria-label="Next slide"
            style={{
              position: "absolute", right: 14, top: "50%",
              transform: "translateY(-50%)",
              width: 40, height: 40, borderRadius: "50%",
              background: "rgba(255,255,255,0.92)",
              border: "1.5px solid #e2e8f0",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              zIndex: 10, transition: "all 0.15s",
            }}
          >
            <ChevronRight style={{ width: 18, height: 18, color: "#475569" }} />
          </button>
        </div>
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 767px) {
          .carousel-inner {
            grid-template-columns: 1fr !important;
          }
          .carousel-inner > div:first-child {
            padding: 32px 24px 20px !important;
          }
          .carousel-inner > div:last-child {
            padding: 0 16px 24px !important;
          }
          .carousel-inner > div:last-child img {
            max-height: 240px !important;
          }
        }
      `}</style>
    </section>
  );
}
