'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import AIChatbot from '../components/AIChatbot';

// ─── shared inline style helpers ───────────────────────────────────────────
const S = {
  inp: {
    width: '100%', padding: '12px 16px',
    border: '1.5px solid #E8E0D4', borderRadius: 12,
    fontSize: 14, fontFamily: "'DM Sans', sans-serif",
    outline: 'none', color: '#2C2C2C', background: '#FDFCFA',
  },
  btnPrimary: {
    width: '100%', padding: '14px',
    background: '#7D9B76', color: 'white',
    border: 'none', borderRadius: 14,
    fontFamily: "'DM Sans', sans-serif", fontSize: 15,
    fontWeight: 600, cursor: 'pointer',
  },
  btnGhost: {
    padding: '13px 20px',
    background: '#F2EDE3', color: '#5C5C5C',
    border: 'none', borderRadius: 12,
    fontFamily: "'DM Sans', sans-serif", fontSize: 14,
    cursor: 'pointer',
  },
  label: {
    display: 'block', fontSize: 13,
    fontWeight: 500, color: '#5C5C5C', marginBottom: 6,
  },
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(44,44,44,0.52)',
    backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center',
    justifyContent: 'center', padding: 24, zIndex: 100,
  },
  card: {
    background: 'white', borderRadius: 24,
    padding: '44px 40px', maxWidth: 460,
    width: '100%',
    boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
  },
};

export default function Home() {
  const router = useRouter();
  const [language, setLanguage] = useState('en');
  const [booking, setBooking] = useState({ name: '', phone: '', address: '', email: '', specialization: '', doctorId: '', date: '' });
  const [doctors, setDoctors] = useState([]);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState('');
  const [tokenNumber, setTokenNumber] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [loginData, setLoginData] = useState({ email: '', password: '', role: 'doctor' });
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '', phone: '', role: 'doctor', specialization: '', experience: '', ngoName: '', image: null });
  const [imagePreview, setImagePreview] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [ngoForm, setNgoForm] = useState({ name: '', phone: '', email: '', helpType: 'general', message: '' });
  const [ngoSubmitted, setNgoSubmitted] = useState(false);
  const [ngoLoading, setNgoLoading] = useState(false);
  const [ngoError, setNgoError] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const specializations = [
    { value: 'Cardiologist',      en: 'Cardiologist',       hi: 'हृदय रोग विशेषज्ञ', descEn: 'Heart checkup',   descHi: 'हृदय जांच',    icon: '🫀' },
    { value: 'Dermatologist',     en: 'Dermatologist',      hi: 'त्वचा विशेषज्ञ',     descEn: 'Skin treatment',  descHi: 'त्वचा उपचार', icon: '✨' },
    { value: 'Orthopedist',       en: 'Orthopedist',        hi: 'हड्डी रोग विशेषज्ञ', descEn: 'Bone specialist', descHi: 'हड्डी विशेषज्ञ', icon: '🦴' },
    { value: 'General Physician', en: 'General Physician',  hi: 'सामान्य चिकित्सक',   descEn: 'General checkup', descHi: 'सामान्य जांच', icon: '🩺' },
  ];

  useEffect(() => {
    if (booking.specialization) {
      axios.get(`http://localhost:5000/api/public/doctors?specialization=${booking.specialization}`)
        .then(res => setDoctors(res.data.data || []))
        .catch(err => console.error(err));
    }
  }, [booking.specialization]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key !== 'Escape') return;
      setShowLogin(false);
      setShowSignup(false);
      setShowOTP(false);
      setImagePreview('');
      setDevOtp('');
      setOtp('');
      setShowLoginPassword(false);
      setShowSignupPassword(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // ── OTP resend countdown ───────────────────────────────────────────────
  useEffect(() => {
    if (!showOTP || confirmedBooking) return;
    setResendTimer(30);
    setCanResend(false);
    const interval = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(interval); setCanResend(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showOTP]);

  const handleResendOTP = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/public/resend-otp', {
        tokenNumber, phone: booking.phone
      });
      if (res.data.otp) setDevOtp(res.data.otp);
      setResendTimer(30);
      setCanResend(false);
    } catch (err) {
      console.error('Resend failed:', err.response?.data?.message || err.message);
    }
  };

  // ── ALL HANDLERS UNCHANGED ─────────────────────────────────────────────
  const handleBooking = async (e) => {
    e.preventDefault();
    try {
      if (!booking.specialization) { alert("Please select specialization"); return; }
      if (!booking.date) { alert("Please select appointment date"); return; }
      const doctorId = booking.doctorId && booking.doctorId !== "" ? booking.doctorId : "000000000000000000000000";
      const response = await axios.post("http://localhost:5000/api/public/book-appointment", {
        patientName: booking.name, phone: booking.phone, address: booking.address,
        email: booking.email, specialization: booking.specialization,
        doctorId: doctorId, appointmentDate: booking.date
      });
      setTokenNumber(response.data.data.tokenNumber);
      setDevOtp(response.data.data.otp || '');
      setShowOTP(true);
      alert(language === "en"
        ? `Booking successful! Token: ${response.data.data.tokenNumber}. Check console for OTP.`
        : `बुकिंग सफल! टोकन: ${response.data.data.tokenNumber}`);
    } catch (error) {
      alert("Booking failed: " + (error.response?.data?.message || error.message));
    }
  };

  const handleVerifyOTP = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/public/verify-otp", {
        tokenNumber: tokenNumber, otp: otp, phone: booking.phone
      });
      sessionStorage.setItem('patientPortalSession', JSON.stringify({
        phone: booking.phone,
        patientName: booking.name,
        expiry: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
      }));
      setConfirmedBooking({ tokenNumber: res.data.data.tokenNumber, name: booking.name });
      setDevOtp('');
    } catch (error) {
      alert("❌ Invalid OTP");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email: loginData.email, password: loginData.password
      });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userName', res.data.user.name);
      localStorage.setItem('userRole', res.data.user.role);
      if (res.data.user.role === 'doctor') router.push('/doctor/dashboard');
      else if (res.data.user.role === 'ngo') router.push('/ngo/dashboard');
    } catch (error) {
      alert('Login failed: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', signupData.name);
    formData.append('email', signupData.email);
    formData.append('password', signupData.password);
    formData.append('phone', signupData.phone);
    formData.append('role', signupData.role);
    if (signupData.role === 'doctor') {
      formData.append('specialization', signupData.specialization);
      formData.append('experience', signupData.experience || 0);
      if (signupData.image) formData.append('image', signupData.image);
    } else if (signupData.role === 'ngo') {
      formData.append('ngoName', signupData.ngoName);
      if (signupData.image) formData.append('image', signupData.image);
    }
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userName', res.data.user.name);
      localStorage.setItem('userRole', res.data.user.role);
      alert('Account created successfully!');
      if (res.data.user.role === 'doctor') router.push('/doctor/dashboard');
      else if (res.data.user.role === 'ngo') router.push('/ngo/dashboard');
    } catch (error) {
      console.error('Signup error:', error.response?.data);
      alert('Signup failed: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleNgoSubmit = async (e) => {
    e.preventDefault();
    setNgoLoading(true);
    setNgoError('');
    try {
      await axios.post('http://localhost:5000/api/public/help-request', ngoForm);
      setNgoSubmitted(true);
    } catch (err) {
      setNgoError(err.response?.data?.message || 'Failed to submit request. Please try again.');
    } finally { setNgoLoading(false); }
  };

  const t = (key) => {
    const trans = {
      en: {
        title: 'Healthcare', book: 'Book Appointment - No Signup!', name: 'Name',
        phone: 'Phone', address: 'Address', email: 'Email', spec: 'Specialization',
        doctor: 'Doctor', date: 'Date', bookBtn: 'Book Now',
        loginTitle: 'Login', signupTitle: 'Sign Up',
        doctorNgo: 'Doctor / NGO', selectRole: 'Select Role',
        ngoName: 'NGO Name', verify: 'Verify OTP', enterOTP: 'Enter OTP',
        experience: 'Years of Experience'
      },
      hi: {
        title: 'स्वास्थ्य सेवा', book: 'अपॉइंटमेंट बुक करें - साइनअप नहीं!',
        name: 'नाम', phone: 'फ़ोन', address: 'पता', email: 'ईमेल',
        spec: 'विशेषज्ञता', doctor: 'डॉक्टर', date: 'तारीख',
        bookBtn: 'बुक करें', loginTitle: 'लॉगिन', signupTitle: 'साइन अप',
        doctorNgo: 'डॉक्टर / एनजीओ', selectRole: 'भूमिका चुनें',
        ngoName: 'एनजीओ का नाम', verify: 'OTP सत्यापित करें',
        enterOTP: 'OTP दर्ज करें', experience: 'अनुभव के वर्ष'
      }
    };
    return trans[language][key];
  };

  const hi = language === 'hi';

  // ── BLOOM UI ──────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', fontFamily: "'DM Sans', sans-serif" }}>
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        @keyframes fadeInUp { from{opacity:0;transform:translateY(22px);}to{opacity:1;transform:translateY(0);} }
        @keyframes blob { 0%,100%{border-radius:60% 40% 55% 45%/50% 60% 40% 50%;}50%{border-radius:40% 60% 45% 55%/60% 40% 60% 40%;} }
        input:focus, select:focus, textarea:focus { border-color: #7D9B76 !important; box-shadow: 0 0 0 3px rgba(125,155,118,0.13); }
        .spec-card:hover { border-color: #7D9B76 !important; background: rgba(125,155,118,0.05) !important; transform: translateY(-2px); }
        .spec-card { transition: all 0.18s ease; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(250,247,242,0.93)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(196,168,130,0.2)', padding: '0 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 70 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#7D9B76,#B5CDB0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: 18 }}>✿</span>
            </div>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#2C2C2C', letterSpacing: '-0.02em' }}>Viatris</span>
            <span style={{ fontSize: 13, color: '#7D9B76', fontWeight: 500 }}>Health</span>
          </div>
          {/* Nav actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setLanguage(hi ? 'en' : 'hi')}
              style={{ padding: '8px 16px', background: 'white', border: '1.5px solid #DDD5C8', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#5C5C5C' }}>
              {hi ? '🇬🇧 EN' : '🇮🇳 हिं'}
            </button>
            <a href="/patient/dashboard"
              style={{ padding: '9px 20px', background: 'rgba(125,155,118,0.1)', border: '1.5px solid #B5CDB0', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer', color: '#4A6B44', textDecoration: 'none' }}>
              🏥 {hi ? 'मरीज़ पोर्टल' : 'Patient Portal'}
            </a>
            <button onClick={() => setShowLogin(true)}
              style={{ padding: '9px 20px', background: 'transparent', border: '1.5px solid #7D9B76', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer', color: '#4A6B44' }}>
              {t('doctorNgo')} {t('loginTitle')}
            </button>
            <button onClick={() => setShowSignup(true)}
              style={{ padding: '9px 20px', background: '#7D9B76', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer', color: 'white' }}>
              {t('doctorNgo')} {t('signupTitle')}
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '72px 32px 52px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'center' }}>
        <div style={{ animation: 'fadeInUp 0.6s ease both' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 14px', background: 'rgba(125,155,118,0.12)', borderRadius: 20, marginBottom: 22 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#7D9B76', display: 'inline-block' }}></span>
            <span style={{ fontSize: 13, color: '#4A6B44', fontWeight: 500 }}>{hi ? 'कोई साइनअप नहीं · तुरंत बुकिंग' : 'No signup · Instant booking'}</span>
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(38px,4.5vw,58px)', lineHeight: 1.1, color: '#2C2C2C', marginBottom: 18, letterSpacing: '-0.02em' }}>
            {hi ? 'देखभाल जो आपके साथ' : 'Healthcare that'}<br />
            <em style={{ fontStyle: 'italic', color: '#7D9B76' }}>{hi ? 'बढ़ती है' : 'grows with you'}</em>
          </h1>
          <p style={{ fontSize: 16, color: '#5C5C5C', lineHeight: 1.75, marginBottom: 36, maxWidth: 460 }}>
            {hi
              ? 'बिना किसी खाते के अपॉइंटमेंट बुक करें। विशेषज्ञ डॉक्टरों से जुड़ें और अपनी स्वास्थ्य यात्रा शुरू करें।'
              : 'Book appointments without creating an account. Connect with specialist doctors and start your wellness journey today.'}
          </p>
          <a href="#book" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', background: '#7D9B76', color: 'white', borderRadius: 14, fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>
            {hi ? 'अभी बुक करें' : 'Book Appointment'} →
          </a>
        </div>

        {/* Decorative feature cards */}
        <div style={{ position: 'relative', height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', width: 320, height: 320, background: 'linear-gradient(135deg,rgba(181,205,176,0.3),rgba(232,196,176,0.25))', animation: 'blob 10s ease-in-out infinite' }}></div>
          <div style={{ position: 'relative', zIndex: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { icon: '🏥', label: hi ? 'तुरंत बुकिंग' : 'Instant Booking', sub: hi ? 'OTP से पुष्टि' : 'OTP confirmed' },
              { icon: '👨‍⚕️', label: hi ? 'विशेषज्ञ' : 'Expert Doctors', sub: hi ? '4+ विशेषज्ञता' : '4+ specialties' },
              { icon: '🤖', label: hi ? 'AI स्वास्थ्य' : 'AI Health Bot', sub: hi ? 'हर समय उपलब्ध' : 'Always available' },
              { icon: '🤝', label: hi ? 'NGO सहायता' : 'NGO Support', sub: hi ? 'वित्तीय सहायता' : 'Financial aid' },
            ].map((item, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 18, padding: '20px 18px', boxShadow: '0 4px 20px rgba(44,44,44,0.07)', border: '1px solid rgba(196,168,130,0.15)', animation: `fadeInUp 0.5s ease ${0.15 * i + 0.25}s both` }}>
                <div style={{ fontSize: 30, marginBottom: 10 }}>{item.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#2C2C2C', marginBottom: 3 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: '#9C9C9C' }}>{item.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SPECIALTIES ── */}
      <section style={{ background: 'white', padding: '64px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 34, color: '#2C2C2C', marginBottom: 10 }}>{hi ? 'हमारी विशेषज्ञताएं' : 'Our Specialties'}</h2>
            <p style={{ color: '#9C9C9C', fontSize: 15 }}>{hi ? 'हर जरूरत के लिए सही विशेषज्ञ' : 'The right specialist for every need'}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
            {specializations.map((s, i) => (
              <div key={s.value} className="spec-card"
                onClick={() => { setBooking({ ...booking, specialization: s.value }); document.getElementById('book')?.scrollIntoView({ behavior: 'smooth' }); }}
                style={{ padding: '26px 22px', borderRadius: 20, border: booking.specialization === s.value ? '2px solid #7D9B76' : '1.5px solid #EDE8E0', background: booking.specialization === s.value ? 'rgba(125,155,118,0.06)' : '#FDFCFA', cursor: 'pointer', animation: `fadeInUp 0.5s ease ${i * 0.08}s both` }}>
                <div style={{ fontSize: 34, marginBottom: 12 }}>{s.icon}</div>
                <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 17, color: '#2C2C2C', marginBottom: 5 }}>{hi ? s.hi : s.en}</h3>
                <p style={{ fontSize: 12, color: '#9C9C9C' }}>{hi ? s.descHi : s.descEn}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOOKING FORM ── */}
      <section id="book" style={{ padding: '72px 32px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ background: 'white', borderRadius: 24, padding: '48px 44px', boxShadow: '0 8px 40px rgba(44,44,44,0.07)', border: '1px solid rgba(196,168,130,0.15)' }}>
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(125,155,118,0.1)', borderRadius: 16, marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: '#4A6B44', fontWeight: 600, letterSpacing: '0.04em' }}>📅 {hi ? 'त्वरित बुकिंग' : 'QUICK BOOKING'}</span>
              </div>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: '#2C2C2C', marginBottom: 5 }}>{t('book')}</h2>
              <p style={{ color: '#9C9C9C', fontSize: 13 }}>{hi ? 'कोई खाता नहीं चाहिए' : 'No account required'}</p>
            </div>

            <form onSubmit={handleBooking} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={S.label}>{t('name')}</label>
                  <input type="text" placeholder={hi ? 'आपका नाम' : 'Full name'} value={booking.name} onChange={e => setBooking({ ...booking, name: e.target.value })} style={S.inp} required />
                </div>
                <div>
                  <label style={S.label}>{t('phone')}</label>
                  <input type="tel" placeholder="+91 00000 00000" value={booking.phone} onChange={e => setBooking({ ...booking, phone: e.target.value })} style={S.inp} required />
                </div>
              </div>

              <div>
                <label style={S.label}>{t('email')}</label>
                <input type="email" placeholder="you@email.com" value={booking.email} onChange={e => setBooking({ ...booking, email: e.target.value })} style={S.inp} />
              </div>

              <div>
                <label style={S.label}>{t('address')}</label>
                <textarea placeholder={hi ? 'आपका पूरा पता' : 'Your full address'} value={booking.address} onChange={e => setBooking({ ...booking, address: e.target.value })} rows={3} style={{ ...S.inp, resize: 'vertical' }} required />
              </div>

              <div>
                <label style={S.label}>{t('spec')}</label>
                <select value={booking.specialization} onChange={e => setBooking({ ...booking, specialization: e.target.value, doctorId: '' })} style={{ ...S.inp, appearance: 'none', color: booking.specialization ? '#2C2C2C' : '#9C9C9C' }} required>
                  <option value="">{t('spec')}</option>
                  {specializations.map(s => (
                    <option key={s.value} value={s.value} title={hi ? s.descHi : s.descEn}>
                      {s.icon} {hi ? s.hi : s.en} — {hi ? s.descHi : s.descEn}
                    </option>
                  ))}
                </select>
              </div>

              {booking.specialization && doctors.length > 0 && (
                <div>
                  <label style={S.label}>{t('doctor')}</label>
                  <select value={booking.doctorId} onChange={e => setBooking({ ...booking, doctorId: e.target.value })} style={{ ...S.inp, appearance: 'none', color: booking.doctorId ? '#2C2C2C' : '#9C9C9C' }} required>
                    <option value="">{t('doctor')}</option>
                    {doctors.map(d => <option key={d._id} value={d._id}>Dr. {d.name} — {d.experience}yrs</option>)}
                  </select>
                </div>
              )}

              <div>
                <label style={S.label}>{t('date')}</label>
                <input type="date" value={booking.date} min={new Date().toISOString().split('T')[0]} onChange={e => setBooking({ ...booking, date: e.target.value })} style={S.inp} required />
              </div>

              <button type="submit" style={{ ...S.btnPrimary, marginTop: 6 }}>
                📅 {t('bookBtn')}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ── NGO HELP SECTION ── */}
      <section style={{ padding: '72px 32px', background: 'white' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'5px 14px', background:'rgba(125,155,118,0.12)', borderRadius:20, marginBottom:16 }}>
              <span style={{ fontSize:13, color:'#4A6B44', fontWeight:500 }}>🤝 {hi ? 'एनजीओ सहायता' : 'NGO Support'}</span>
            </div>
            <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:34, color:'#2C2C2C', marginBottom:10 }}>
              {hi ? 'सहायता की ज़रूरत है?' : 'Need Support?'}
            </h2>
            <p style={{ color:'#9C9C9C', fontSize:15, lineHeight:1.7, maxWidth:440, margin:'0 auto' }}>
              {hi
                ? 'हमारे NGO भागीदार वित्तीय सहायता, दवा, परिवहन और मानसिक स्वास्थ्य सेवाओं के लिए उपलब्ध हैं।'
                : 'Our NGO partners are available to help with financial aid, medicine access, transport, and mental health support.'}
            </p>
          </div>

          {!ngoSubmitted ? (
            <div style={{ background:'white', borderRadius:24, padding:'44px 40px', boxShadow:'0 8px 40px rgba(44,44,44,0.07)', border:'1px solid rgba(196,168,130,0.15)' }}>
              <form onSubmit={handleNgoSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <label style={S.label}>{t('name')}</label>
                    <input type="text" value={ngoForm.name} onChange={e => setNgoForm(p => ({ ...p, name: e.target.value }))}
                      placeholder={hi ? 'आपका नाम' : 'Full name'} style={S.inp} required />
                  </div>
                  <div>
                    <label style={S.label}>{t('phone')}</label>
                    <input type="tel" value={ngoForm.phone} onChange={e => setNgoForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+91 00000 00000" style={S.inp} required />
                  </div>
                </div>
                <div>
                  <label style={S.label}>{t('email')}</label>
                  <input type="email" value={ngoForm.email} onChange={e => setNgoForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="you@email.com (optional)" style={S.inp} />
                </div>
                <div>
                  <label style={S.label}>{hi ? 'सहायता का प्रकार' : 'Type of Help'}</label>
                  <select value={ngoForm.helpType} onChange={e => setNgoForm(p => ({ ...p, helpType: e.target.value }))}
                    style={{ ...S.inp, appearance:'none' }}>
                    <option value="general">🤝 {hi ? 'सामान्य सहायता' : 'General Support'}</option>
                    <option value="financial">💰 {hi ? 'वित्तीय सहायता' : 'Financial Aid'}</option>
                    <option value="medicine">💊 {hi ? 'दवा सहायता' : 'Medicine Access'}</option>
                    <option value="transport">🚗 {hi ? 'परिवहन सहायता' : 'Transport Assistance'}</option>
                    <option value="mental_health">🧠 {hi ? 'मानसिक स्वास्थ्य' : 'Mental Health Support'}</option>
                  </select>
                </div>
                <div>
                  <label style={S.label}>{hi ? 'अपनी स्थिति बताएं' : 'Describe your situation'}</label>
                  <textarea value={ngoForm.message} onChange={e => setNgoForm(p => ({ ...p, message: e.target.value }))}
                    rows={4} style={{ ...S.inp, resize:'vertical' }}
                    placeholder={hi ? 'हम कैसे मदद कर सकते हैं...' : 'Tell us how we can help you...'} required />
                </div>
                {ngoError && (
                  <div style={{ padding:'10px 14px', background:'#FEE2E2', borderRadius:10, fontSize:13, color:'#9B2C2C' }}>{ngoError}</div>
                )}
                <button type="submit" disabled={ngoLoading} style={{ ...S.btnPrimary, opacity: ngoLoading ? 0.65 : 1 }}>
                  {ngoLoading ? (hi ? 'भेजा जा रहा है...' : 'Submitting...') : (hi ? '🤝 सहायता अनुरोध भेजें' : '🤝 Submit Help Request')}
                </button>
              </form>
            </div>
          ) : (
            <div style={{ background:'white', borderRadius:24, padding:'52px 40px', boxShadow:'0 8px 40px rgba(44,44,44,0.07)', border:'1px solid rgba(196,168,130,0.15)', textAlign:'center' }}>
              <div style={{ fontSize:56, marginBottom:16 }}>✅</div>
              <h3 style={{ fontFamily:"'DM Serif Display',serif", fontSize:26, color:'#2C2C2C', marginBottom:10 }}>
                {hi ? 'अनुरोध सबमिट हो गया!' : 'Request Submitted!'}
              </h3>
              <p style={{ color:'#9C9C9C', fontSize:14, lineHeight:1.7, maxWidth:360, margin:'0 auto 24px' }}>
                {hi
                  ? 'एक NGO प्रतिनिधि 24 घंटों के भीतर आपसे संपर्क करेगा।'
                  : 'An NGO representative will contact you within 24 hours.'}
              </p>
              <button onClick={() => { setNgoSubmitted(false); setNgoForm({ name:'', phone:'', email:'', helpType:'general', message:'' }); }}
                style={{ padding:'12px 28px', background:'#F2EDE3', color:'#5C5C5C', border:'none', borderRadius:12, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                {hi ? 'और अनुरोध भेजें' : 'Submit Another Request'}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#2C2C2C', color: 'white', padding: '44px 32px', textAlign: 'center' }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, marginBottom: 8 }}>Viatris<span style={{ color: '#7D9B76' }}>Health</span></div>
        <p style={{ color: '#9C9C9C', fontSize: 13 }}>Care that grows with you · {new Date().getFullYear()}</p>
      </footer>

      {/* ── OTP MODAL ── */}
      {showOTP && (
        <div style={S.overlay} onClick={() => { if (!confirmedBooking) { setShowOTP(false); setDevOtp(''); setOtp(''); } }}>
          <div style={S.card} onClick={e => e.stopPropagation()}>
            {confirmedBooking ? (
              /* Confirmation state */
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 52, marginBottom: 14 }}>✅</div>
                <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: '#2C2C2C', marginBottom: 8 }}>Appointment Confirmed!</h3>
                <p style={{ color: '#9C9C9C', fontSize: 14, marginBottom: 6 }}>
                  Token: <strong style={{ color: '#7D9B76', fontSize: 18 }}>#{confirmedBooking.tokenNumber}</strong>
                </p>
                {confirmedBooking.name && <p style={{ color: '#5C5C5C', fontSize: 14, marginBottom: 24 }}>Booked for: {confirmedBooking.name}</p>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                  <button onClick={() => {
                    setShowOTP(false);
                    setConfirmedBooking(null);
                    setOtp('');
                    setBooking({ name: "", phone: "", address: "", email: "", specialization: "", doctorId: "", date: "" });
                  }} style={{ ...S.btnPrimary }}>
                    Done
                  </button>
                  <button onClick={() => router.push('/patient/dashboard')}
                    style={{ ...S.btnGhost, width: '100%', textAlign: 'center' }}>
                    View My Portal →
                  </button>
                </div>
              </div>
            ) : (
              /* OTP entry state */
              <>
                <div style={{ textAlign: 'center', marginBottom: 30 }}>
                  <div style={{ fontSize: 46, marginBottom: 14 }}>📱</div>
                  <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: '#2C2C2C', marginBottom: 8 }}>{t('enterOTP')}</h3>
                  <p style={{ color: '#9C9C9C', fontSize: 14 }}>Token: <strong style={{ color: '#7D9B76' }}>{tokenNumber}</strong></p>
                </div>
                {devOtp && (
                  <div style={{ background: '#FFFBEB', border: '1.5px solid #F6D860', borderRadius: 10, padding: '10px 16px', marginBottom: 16, textAlign: 'center' }}>
                    <span style={{ fontSize: 13, color: '#92610A', fontWeight: 600 }}>Demo Mode — Your OTP is: </span>
                    <span style={{ fontSize: 18, fontFamily: 'monospace', fontWeight: 700, color: '#92610A', letterSpacing: 6 }}>{devOtp}</span>
                  </div>
                )}
                <input type="text" maxLength="6" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="000000"
                  style={{ ...S.inp, textAlign: 'center', fontSize: 28, letterSpacing: 14, fontFamily: 'monospace', marginBottom: 18, padding: '16px' }} />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={handleVerifyOTP} disabled={otp.length !== 6}
                    style={{ flex: 1, padding: '13px', background: otp.length === 6 ? '#7D9B76' : '#DDD5C8', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: otp.length === 6 ? 'pointer' : 'not-allowed', fontFamily: "'DM Sans', sans-serif" }}>
                    {t('verify')}
                  </button>
                  <button onClick={() => { setShowOTP(false); setDevOtp(''); setOtp(''); }} style={S.btnGhost}>Cancel</button>
                </div>
                <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13 }}>
                  {canResend ? (
                    <button onClick={handleResendOTP}
                      style={{ background: 'none', border: 'none', color: '#7D9B76', fontWeight: 600, cursor: 'pointer', fontSize: 13, textDecoration: 'underline', fontFamily: "'DM Sans', sans-serif" }}>
                      Resend OTP
                    </button>
                  ) : (
                    <span style={{ color: '#9C9C9C' }}>Resend OTP in {resendTimer}s</span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── LOGIN MODAL ── */}
      {showLogin && (
        <div style={S.overlay} onClick={() => { setShowLogin(false); setShowLoginPassword(false); }}>
          <div style={S.card} onClick={e => e.stopPropagation()}>
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: '#2C2C2C', marginBottom: 5 }}>{t('loginTitle')}</h3>
              <p style={{ color: '#9C9C9C', fontSize: 13 }}>{hi ? 'अपने खाते में साइन इन करें' : 'Sign in to your account'}</p>
            </div>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div>
                <label style={S.label}>{t('selectRole')}</label>
                <select value={loginData.role} onChange={e => setLoginData({ ...loginData, role: e.target.value })} style={{ ...S.inp, appearance: 'none' }}>
                  <option value="doctor">👨‍⚕️ Doctor</option>
                  <option value="ngo">🤝 NGO</option>
                </select>
              </div>
              <div>
                <label style={S.label}>Email</label>
                <input type="email" placeholder="your@email.com" value={loginData.email} onChange={e => setLoginData({ ...loginData, email: e.target.value })} style={S.inp} required />
              </div>
              <div>
                <label style={S.label}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showLoginPassword ? 'text' : 'password'} placeholder="••••••••" value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })} style={{ ...S.inp, paddingRight: 44 }} required />
                  <button type="button" onClick={() => setShowLoginPassword(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9C9C9C', fontSize: 18, padding: 4, lineHeight: 1 }}>
                    {showLoginPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="submit" style={{ flex: 1, padding: '13px', background: '#7D9B76', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  {t('loginTitle')}
                </button>
                <button type="button" onClick={() => { setShowLogin(false); setShowLoginPassword(false); }} style={S.btnGhost}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── SIGNUP MODAL ── */}
      {showSignup && (
        <div style={{ ...S.overlay, overflowY: 'auto', alignItems: 'flex-start' }} onClick={() => { setShowSignup(false); setImagePreview(''); setShowSignupPassword(false); }}>
          <div style={{ ...S.card, maxWidth: 480, margin: '24px auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: '#2C2C2C', marginBottom: 5 }}>{t('signupTitle')}</h3>
              <p style={{ color: '#9C9C9C', fontSize: 13 }}>{hi ? 'नया खाता बनाएं' : 'Create your account'}</p>
            </div>
            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div>
                <label style={S.label}>{t('selectRole')}</label>
                <select value={signupData.role} onChange={e => setSignupData({ ...signupData, role: e.target.value })} style={{ ...S.inp, appearance: 'none' }}>
                  <option value="doctor">👨‍⚕️ Doctor</option>
                  <option value="ngo">🤝 NGO</option>
                </select>
              </div>

              <div>
                <label style={S.label}>{t('name')}</label>
                <input type="text" placeholder={hi ? 'पूरा नाम' : 'Full name'} value={signupData.name} onChange={e => setSignupData({ ...signupData, name: e.target.value })} style={S.inp} required />
              </div>
              <div>
                <label style={S.label}>Email</label>
                <input type="email" placeholder="your@email.com" value={signupData.email} onChange={e => setSignupData({ ...signupData, email: e.target.value })} style={S.inp} required />
              </div>
              <div>
                <label style={S.label}>{t('phone')}</label>
                <input type="tel" placeholder="+91 00000 00000" value={signupData.phone} onChange={e => setSignupData({ ...signupData, phone: e.target.value })} style={S.inp} required />
              </div>

              {signupData.role === 'doctor' && (
                <>
                  <div>
                    <label style={S.label}>{t('spec')}</label>
                    <select value={signupData.specialization} onChange={e => setSignupData({ ...signupData, specialization: e.target.value })} style={{ ...S.inp, appearance: 'none', color: signupData.specialization ? '#2C2C2C' : '#9C9C9C' }} required>
                      <option value="">{t('spec')}</option>
                      {specializations.map(s => <option key={s.value} value={s.value}>{s.icon} {s.en}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={S.label}>{t('experience')}</label>
                    <input type="number" placeholder={hi ? 'जैसे 5' : 'e.g. 5'} min="0" max="60" value={signupData.experience} onChange={e => setSignupData({ ...signupData, experience: e.target.value })} style={S.inp} required />
                  </div>
                  <div>
                    <label style={S.label}>Profile Photo</label>
                    {imagePreview && <img src={imagePreview} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid #B5CDB0', marginBottom: 10, display: 'block' }} alt="Preview" />}
                    <input type="file" accept="image/*" onChange={e => {
                      const file = e.target.files[0];
                      if (file) {
                        setSignupData({ ...signupData, image: file });
                        const reader = new FileReader();
                        reader.onloadend = () => setImagePreview(reader.result);
                        reader.readAsDataURL(file);
                      }
                    }} style={{ fontSize: 13, color: '#5C5C5C' }} />
                  </div>
                </>
              )}

              {signupData.role === 'ngo' && (
                <>
                  <div>
                    <label style={S.label}>{t('ngoName')}</label>
                    <input type="text" placeholder={hi ? 'एनजीओ का नाम' : 'NGO organisation name'} value={signupData.ngoName} onChange={e => setSignupData({ ...signupData, ngoName: e.target.value })} style={S.inp} required />
                  </div>
                  <div>
                    <label style={S.label}>NGO Logo / Profile Photo</label>
                    {imagePreview && <img src={imagePreview} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid #B5CDB0', marginBottom: 10, display: 'block' }} alt="Preview" />}
                    <input type="file" accept="image/*" onChange={e => {
                      const file = e.target.files[0];
                      if (file) {
                        setSignupData({ ...signupData, image: file });
                        const reader = new FileReader();
                        reader.onloadend = () => setImagePreview(reader.result);
                        reader.readAsDataURL(file);
                      }
                    }} style={{ fontSize: 13, color: '#5C5C5C' }} />
                  </div>
                </>
              )}

              <div>
                <label style={S.label}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showSignupPassword ? 'text' : 'password'} placeholder="Min 6 characters" value={signupData.password} onChange={e => setSignupData({ ...signupData, password: e.target.value })} style={{ ...S.inp, paddingRight: 44 }} required minLength="6" />
                  <button type="button" onClick={() => setShowSignupPassword(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9C9C9C', fontSize: 18, padding: 4, lineHeight: 1 }}>
                    {showSignupPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="submit" style={{ flex: 1, padding: '13px', background: '#7D9B76', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  {t('signupTitle')}
                </button>
                <button type="button" onClick={() => { setShowSignup(false); setImagePreview(''); setShowSignupPassword(false); }} style={S.btnGhost}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Chatbot — architecture unchanged */}
      <AIChatbot />
    </div>
  );
}
