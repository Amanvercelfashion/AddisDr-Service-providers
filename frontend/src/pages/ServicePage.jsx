/**
 * ServicePage — public-facing storefront for a service-based business.
 * Features:
 *  - Hero section with custom background image + "Reserve Now" CTA
 *  - Work-hours awareness (closed message when outside hours)
 *  - Service categories filter
 *  - Service cards with duration, price, time windows, toggleable gallery
 *  - Staff / team section (toggleable)
 *  - Feedback / reviews
 *  - Footer with About, Contact, Map, Feedback form
 *  - Hamburger nav
 */

import { useState, useEffect, useRef } from 'react';
import {
  Phone, Clock, MapPin, Star, ChevronDown, ChevronUp,
  X, Image as ImageIcon, Users, MessageSquare,
  Calendar, AlertCircle, CheckCircle, Send, ExternalLink,
  ChevronLeft, ChevronRight, Settings
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { useTheme } from '../context/ThemeContext';
import {
  getServices, getServiceCategories, getWorkHoursStatus, getWorkHours,
  getStaff, getPublicFeedback, submitFeedback, logReservationClick
} from '../api';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const display = hour % 12 || 12;
  return `${display}:${m} ${ampm}`;
}

function parsePrice(price) {
  const n = Number(price);
  if (isNaN(n)) return '—';
  return n === 0 ? 'Free' : n.toLocaleString();
}

function parseTimeWindows(raw) {
  if (!raw || !raw.trim()) return [];
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

// ── Closed Banner ─────────────────────────────────────────────────────────────

function ClosedBanner({ status, phone }) {
  if (!status || status.is_open) return null;
  const next = status.next_open;
  let msg = "We're closed right now.";
  if (next) {
    const when = next.day === 'today' ? 'later today' : next.day;
    msg = `We're closed. We open at ${formatTime(next.open_time)} ${when === 'today' ? '' : 'on ' + when}.`;
  }
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-center">
      <p className="text-amber-800 text-sm font-medium">
        {msg}
        {phone && (
          <span className="ml-2 text-amber-700">
            Call us at <span className="font-semibold">{phone}</span>
          </span>
        )}
      </p>
    </div>
  );
}

// ── Gallery Carousel ──────────────────────────────────────────────────────────

function Gallery({ images, visible }) {
  const [idx, setIdx] = useState(0);
  if (!visible || !images || images.length === 0) return null;

  return (
    <div className="mt-3">
      <div className="relative overflow-hidden rounded-xl bg-gray-100 aspect-video">
        <img
          src={images[idx]?.image_url}
          alt=""
          className="w-full h-full object-cover"
        />
        {images.length > 1 && (
          <>
            <button
              onClick={() => setIdx(i => (i - 1 + images.length) % images.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setIdx(i => (i + 1) % images.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 transition-colors"
              aria-label="Next image"
            >
              <ChevronRight size={16} />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`rounded-full transition-all ${i === idx ? 'bg-white w-4 h-2' : 'bg-white/50 w-2 h-2'}`}
                  aria-label={`Image ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Service Card ──────────────────────────────────────────────────────────────

function ServiceCard({ service, galleryEnabled }) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const { primary, onPrimary } = useTheme();
  const windows = parseTimeWindows(service.time_windows);
  const hasImages = service.show_gallery && galleryEnabled && service.images?.length > 0;
  const coverImage = service.images?.[0]?.image_url || null;
  // Gallery images are all images after the first (or all if only 1)
  const galleryImages = service.images?.length > 1 ? service.images.slice(1) : service.images || [];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">

      {/* Cover image */}
      {coverImage ? (
        <div className="w-full aspect-video overflow-hidden bg-gray-100">
          <img
            src={coverImage}
            alt={service.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div
          className="w-full h-2 rounded-t-none"
          style={{ backgroundColor: `rgba(var(--color-primary-rgb), 0.15)` }}
        />
      )}

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-semibold text-gray-900 text-base leading-snug">{service.name}</h3>
          <span
            className="text-base font-bold flex-shrink-0 mt-0.5"
            style={{ color: primary }}
          >
            {parsePrice(service.price)}
          </span>
        </div>

        {/* Description */}
        {service.description && (
          <p className="text-gray-500 text-sm leading-relaxed mb-3">{service.description}</p>
        )}

        {/* Meta row — duration + time windows */}
        <div className="flex flex-wrap gap-2 mt-2">
          {service.duration && (
            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">
              <Clock size={12} />
              {service.duration}
            </span>
          )}
          {windows.map(w => (
            <span
              key={w}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ backgroundColor: `rgba(var(--color-primary-rgb), 0.12)`, color: primary }}
            >
              <Calendar size={12} />
              {w}
            </span>
          ))}
        </div>

        {/* Gallery toggle — only show if there are extra images beyond the cover */}
        {hasImages && galleryImages.length > 0 && (
          <button
            onClick={() => setGalleryOpen(o => !o)}
            className="mt-3 flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ImageIcon size={14} />
            {galleryOpen ? 'Hide photos' : `More photos (${galleryImages.length})`}
            {galleryOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      {/* Extra gallery images */}
      {hasImages && galleryOpen && galleryImages.length > 0 && (
        <div className="px-5 pb-5">
          <Gallery images={galleryImages} visible={true} />
        </div>
      )}
    </div>
  );
}

// ── Staff Card ────────────────────────────────────────────────────────────────

function StaffCard({ member }) {
  return (
    <div className="flex flex-col items-center text-center bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      {member.photo_url ? (
        <img
          src={member.photo_url}
          alt={member.name}
          className="h-20 w-20 rounded-full object-cover mb-3 border-2 border-gray-100"
        />
      ) : (
        <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center mb-3">
          <Users size={28} className="text-gray-400" />
        </div>
      )}
      <p className="font-semibold text-gray-900">{member.name}</p>
      {member.role && <p className="text-sm text-gray-500 mt-0.5">{member.role}</p>}
      {member.bio && <p className="text-xs text-gray-400 mt-2 leading-relaxed">{member.bio}</p>}
    </div>
  );
}

// ── Star Rating ───────────────────────────────────────────────────────────────

function Stars({ rating, interactive, onChange }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type={interactive ? 'button' : undefined}
          onClick={interactive ? () => onChange?.(n) : undefined}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
          aria-label={interactive ? `Rate ${n} star${n > 1 ? 's' : ''}` : undefined}
        >
          <Star
            size={interactive ? 22 : 14}
            className={n <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
          />
        </button>
      ))}
    </div>
  );
}

// ── Feedback Form ─────────────────────────────────────────────────────────────

function FeedbackForm({ businessId, onSubmitted }) {
  const [form, setForm] = useState({ name: '', rating: 5, message: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const { primary } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await submitFeedback(businessId, form);
      setDone(true);
      onSubmitted?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle size={24} className="text-green-600" />
        </div>
        <p className="font-semibold text-gray-900">Thank you for your feedback!</p>
        <p className="text-sm text-gray-500">Your review is pending approval.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
        <input
          type="text"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="input-field"
          placeholder="John Doe"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Rating *</label>
        <Stars rating={form.rating} interactive onChange={r => setForm(f => ({ ...f, rating: r }))} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Your Review *</label>
        <textarea
          value={form.message}
          onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          className="input-field resize-none"
          rows={3}
          placeholder="Share your experience..."
          required
        />
      </div>
      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">
          <AlertCircle size={14} />
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full font-medium py-2.5 px-4 rounded-lg text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ backgroundColor: primary }}
      >
        <Send size={15} />
        {loading ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ServicePage() {
  const { business, businessId, loading: bizLoading, error: bizError } = useBusiness();
  const { primary, secondary, onPrimary } = useTheme();

  // Data
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [staff, setStaff] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [workStatus, setWorkStatus] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);

  // UI
  const [activeCategory, setActiveCategory] = useState('all');
  const [navOpen, setNavOpen] = useState(false);

  // Section refs for smooth scroll
  const heroRef = useRef(null);
  const servicesRef = useRef(null);
  const workHoursRef = useRef(null);
  const staffRef = useRef(null);
  const footerRef = useRef(null);

  useEffect(() => {
    if (!businessId) return;
    setDataLoading(true);
    Promise.all([
      getServices(businessId),
      getServiceCategories(businessId),
      getWorkHoursStatus(businessId),
      getStaff(businessId),
      getPublicFeedback(businessId),
    ])
      .then(([svcs, cats, status, staffList, reviews]) => {
        setServices(svcs);
        setCategories(cats);
        setWorkStatus(status);
        setStaff(staffList);
        setFeedback(reviews);
      })
      .catch(console.error)
      .finally(() => setDataLoading(false));
  }, [businessId]);

  const scrollTo = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
    setNavOpen(false);
  };

  const handleReserve = async () => {
    if (!businessId) return;
    // Log the click
    try {
      const res = await logReservationClick(businessId);
      const phone = res?.phone || business?.phone;
      if (phone) {
        window.location.href = `tel:${phone.replace(/\s+/g, '')}`;
      }
    } catch {
      // Still try to dial even if logging fails
      const phone = business?.phone;
      if (phone) window.location.href = `tel:${phone.replace(/\s+/g, '')}`;
    }
  };

  // ── Loading / Error states ─────────────────────────────────────────────────

  if (bizLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (bizError || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Business not found</h2>
          <p className="text-gray-500 text-sm">{bizError || 'This storefront is not available.'}</p>
        </div>
      </div>
    );
  }

  // ── Filtered services ──────────────────────────────────────────────────────

  const filteredServices = activeCategory === 'all'
    ? services
    : services.filter(s => s.category_id === activeCategory || s.category_name === activeCategory);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Closed Banner ──────────────────────────────────────────────────── */}
      <ClosedBanner status={workStatus} phone={business.phone} />

      {/* ── Navigation ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Logo + Name */}
          <a href="#" onClick={() => scrollTo(heroRef)} className="flex items-center gap-3 min-w-0">
            {business.logo_url ? (
              <img src={business.logo_url} alt={business.name} className="h-14 w-36 object-contain rounded-lg flex-shrink-0" />
            ) : (
              <div className="h-10 w-24 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: primary }}>
                <span className="text-sm font-bold" style={{ color: onPrimary }}>
                  {business.name?.[0]?.toUpperCase()}
                </span>
              </div>
            )}
            <span className="font-bold text-gray-900 text-base truncate">{business.name}</span>
          </a>

          {/* Desktop nav links (hidden on small screens) */}
          <nav className="hidden md:flex items-center gap-1">
            <button onClick={() => scrollTo(heroRef)} className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">Home</button>
            <button onClick={() => scrollTo(servicesRef)} className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">Services</button>
            <button onClick={() => scrollTo(workHoursRef)} className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">Hours</button>
            <button onClick={() => scrollTo(footerRef)} className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">Contact</button>
          </nav>

          <div className="flex items-center gap-2">
            {/* Reserve Now button — visible on sm+ */}
            {business.phone && (
              <button
                onClick={handleReserve}
                className="hidden sm:flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                style={{ backgroundColor: primary, color: onPrimary }}
              >
                <Phone size={15} />
                Reserve Now
              </button>
            )}

            {/* Hamburger — ALWAYS visible on all screen sizes */}
            <button
              onClick={() => setNavOpen(o => !o)}
              className="flex flex-col items-center justify-center gap-[5px] w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 flex-shrink-0"
              aria-label="Toggle menu"
            >
              {navOpen
                ? <X size={20} />
                : <>
                    <span className="block w-5 h-[2px] bg-current rounded-full" />
                    <span className="block w-5 h-[2px] bg-current rounded-full" />
                    <span className="block w-5 h-[2px] bg-current rounded-full" />
                  </>
              }
            </button>
          </div>
        </div>

        {/* Dropdown drawer — all screen sizes */}
        {navOpen && (
          <>
            <div className="fixed inset-0 bg-black/30 z-30" onClick={() => setNavOpen(false)} />
            <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-40">
              <nav className="flex flex-col p-3 gap-1 max-w-5xl mx-auto">
                {[
                  { label: 'Hero', ref: heroRef },
                  { label: 'Services', ref: servicesRef },
                  { label: 'Work Hours', ref: workHoursRef },
                  ...(business.staff_display && staff.length > 0 ? [{ label: 'Team', ref: staffRef }] : []),
                  { label: 'Footer & Contact', ref: footerRef },
                ].map(({ label, ref }) => (
                  <button
                    key={label}
                    onClick={() => scrollTo(ref)}
                    className="text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {label}
                  </button>
                ))}

                <div className="border-t border-gray-100 my-1" />

                {/* Admin Panel — always accessible */}
                <a
                  href={`/adminmanager?business=${businessId}`}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                  onClick={() => setNavOpen(false)}
                >
                  <Settings size={15} />
                  Admin Panel
                </a>

                {/* Reserve Now inside menu (handy on mobile where top button is hidden) */}
                {business.phone && (
                  <button
                    onClick={() => { setNavOpen(false); handleReserve(); }}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors mt-1 sm:hidden"
                    style={{ backgroundColor: primary, color: onPrimary }}
                  >
                    <Phone size={15} />
                    Reserve Now
                  </button>
                )}
              </nav>
            </div>
          </>
        )}
      </header>

      {/* ── Hero Section ───────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative flex flex-col items-center justify-center text-center px-4 py-24 md:py-36 overflow-hidden"
        style={{ minHeight: '60vh' }}
      >
        {/* Background */}
        {business.hero_image_url ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${business.hero_image_url})` }}
            />
            <div className="absolute inset-0 bg-black/50" />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
          />
        )}

        {/* Content */}
        <div className="relative z-10 max-w-2xl">
          {business.logo_url && (
            <img
              src={business.logo_url}
              alt={business.name}
              className="h-32 w-72 object-contain rounded-2xl mx-auto mb-5 shadow-xl"
              onError={e => { e.target.style.display = 'none' }}
            />
          )}
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-3 leading-tight drop-shadow-lg">
            {business.name}
          </h1>
          {business.tagline && (
            <p className="text-white/85 text-lg mb-6 drop-shadow">{business.tagline}</p>
          )}

          {/* Work hours quick status */}
          {workStatus && (
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-6 ${
              workStatus.is_open
                ? 'bg-green-500/90 text-white'
                : 'bg-amber-500/90 text-white'
            }`}>
              <div className={`h-2 w-2 rounded-full ${workStatus.is_open ? 'bg-white animate-pulse' : 'bg-white/70'}`} />
              {workStatus.is_open
                ? `Open now · Closes ${formatTime(workStatus.close_time)}`
                : 'Currently closed'}
            </div>
          )}

          {/* Reserve Now CTA */}
          {business.phone && (
            workStatus?.is_open !== false ? (
              <button
                onClick={handleReserve}
                className="inline-flex items-center gap-3 font-semibold px-8 py-4 rounded-2xl text-lg shadow-xl hover:scale-105 transition-transform"
                style={{ backgroundColor: primary, color: onPrimary }}
              >
                <Phone size={22} />
                Reserve Now
              </button>
            ) : (
              <div className="inline-flex flex-col items-center gap-1 bg-white/10 border border-white/30 rounded-2xl px-6 py-4 text-white">
                <div className="flex items-center gap-2">
                  <Phone size={18} className="text-white/70" />
                  <span className="font-medium text-white/80">
                    {workStatus?.next_open
                      ? `We open at ${formatTime(workStatus.next_open.open_time)}${workStatus.next_open.day !== 'today' ? ' on ' + workStatus.next_open.day : ''}`
                      : "We're closed right now"}
                  </span>
                </div>
                <span className="text-white/60 text-sm">{business.phone}</span>
              </div>
            )
          )}
        </div>
      </section>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-16">

        {/* ── Services Section ─────────────────────────────────────────────── */}
        <section ref={servicesRef}>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Our Services</h2>
            {categories.length > 0 && (
              <p className="text-gray-500 text-sm mt-1">Browse by category</p>
            )}
          </div>

          {/* Category filter */}
          {categories.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === 'all'
                    ? 'text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
                style={activeCategory === 'all' ? { backgroundColor: primary } : {}}
              >
                All Services
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === cat.name
                      ? 'text-white shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                  style={activeCategory === cat.name ? { backgroundColor: primary } : {}}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Service grid */}
          {dataLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 h-48 animate-pulse" />
              ))}
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ImageIcon size={40} className="mx-auto mb-3 opacity-40" />
              <p>No services available{activeCategory !== 'all' ? ' in this category' : ''}.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredServices.map(svc => (
                <ServiceCard
                  key={svc.id}
                  service={svc}
                  galleryEnabled={!!business.gallery_display}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Work Hours Section ────────────────────────────────────────────── */}
        <section ref={workHoursRef}>
          <WorkHoursSection businessId={businessId} />
        </section>

        {/* ── Staff Section ─────────────────────────────────────────────────── */}
        {business.staff_display === 1 && (
          <section ref={staffRef}>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Meet Our Team</h2>
            </div>
            {dataLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border h-48 animate-pulse" />
                ))}
              </div>
            ) : staff.length === 0 ? null : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
                {staff.map(m => <StaffCard key={m.id} member={m} />)}
              </div>
            )}
          </section>
        )}

        {/* ── Reviews ──────────────────────────────────────────────────────── */}
        {feedback.length > 0 && (
          <section>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Stars rating={Math.round(feedback.reduce((s, f) => s + f.rating, 0) / feedback.length)} />
                <span className="text-sm text-gray-500">
                  {(feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1)} · {feedback.length} review{feedback.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {feedback.slice(0, 8).map(r => (
                <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-900 text-sm">{r.name}</p>
                    <Stars rating={r.rating} />
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{r.message}</p>
                  <p className="text-xs text-gray-400 mt-2">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer
        ref={footerRef}
        className="bg-gray-900 text-gray-300 mt-16"
      >
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">

            {/* About */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                {business.logo_url ? (
                  <img src={business.logo_url} alt={business.name} className="h-10 w-28 object-contain rounded-lg" />
                ) : (
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: primary }}>
                    <span className="text-xs font-bold text-white">{business.name?.[0]}</span>
                  </div>
                )}
                <h3 className="font-bold text-white text-lg">{business.name}</h3>
              </div>
              {business.tagline && <p className="text-gray-400 text-sm mb-3 italic">{business.tagline}</p>}
              {business.about && <p className="text-gray-400 text-sm leading-relaxed">{business.about}</p>}
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-bold text-white mb-4">Contact Us</h3>
              <div className="space-y-3">
                {business.phone && (
                  <div className="flex items-center gap-2.5">
                    <Phone size={15} className="text-gray-500 flex-shrink-0" />
                    <a href={`tel:${business.phone}`} className="text-sm hover:text-white transition-colors">{business.phone}</a>
                  </div>
                )}
                {business.address && (
                  <div className="flex items-start gap-2.5">
                    <MapPin size={15} className="text-gray-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">{business.address}</p>
                  </div>
                )}
              </div>

              {/* Map link */}
              {business.map_url && (
                <a
                  href={business.map_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm hover:text-white transition-colors"
                  style={{ color: primary }}
                >
                  <ExternalLink size={13} />
                  Open in Maps
                </a>
              )}
            </div>

            {/* Feedback form */}
            <div>
              <h3 className="font-bold text-white mb-4">Leave a Review</h3>
              <div className="bg-gray-800 rounded-xl p-4">
                <FeedbackForm businessId={businessId} />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs text-gray-600">© {new Date().getFullYear()} {business.name}. All rights reserved.</p>
            <a
              href={`/adminmanager?business=${businessId}`}
              className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              <Settings size={12} />
              Admin Panel
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Work Hours sub-component (needs its own data) ─────────────────────────────

function WorkHoursSection({ businessId }) {
  const [hours, setHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const { primary } = useTheme();

  useEffect(() => {
    if (!businessId) return;
    getWorkHours(businessId)
      .then(setHours)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [businessId]);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date().getDay();

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Working Hours</h2>
      </div>
      {loading ? (
        <div className="max-w-sm mx-auto space-y-2">
          {[...Array(7)].map((_, i) => <div key={i} className="h-10 bg-gray-200 rounded-lg animate-pulse" />)}
        </div>
      ) : (
        <div className="max-w-sm mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {hours.map(h => (
            <div
              key={h.day_of_week}
              className={`flex items-center justify-between px-5 py-3 border-b border-gray-50 last:border-0 ${
                h.day_of_week === today ? 'bg-blue-50/60' : ''
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`text-sm font-semibold w-8 ${h.day_of_week === today ? 'text-blue-600' : 'text-gray-700'}`}
                >
                  {days[h.day_of_week]}
                </span>
                {h.day_of_week === today && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `rgba(var(--color-primary-rgb),0.15)`, color: primary }}>Today</span>
                )}
              </div>
              {h.is_open ? (
                <span className="text-sm text-gray-600 font-medium">
                  {formatTime(h.open_time)} – {formatTime(h.close_time)}
                </span>
              ) : (
                <span className="text-sm text-gray-400">Closed</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
