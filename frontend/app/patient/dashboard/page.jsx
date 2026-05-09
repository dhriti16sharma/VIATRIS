'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API = 'http://localhost:5000';

// ── style helpers ──────────────────────────────────────────────────────────
const S = {
  inp: { width:'100%', padding:'11px 16px', border:'1.5px solid #E8E0D4', borderRadius:12, fontSize:14, fontFamily:"'DM Sans',sans-serif", outline:'none', color:'#2C2C2C', background:'#FDFCFA' },
  card: { background:'white', borderRadius:20, padding:'28px 28px', border:'1px solid rgba(196,168,130,0.18)', boxShadow:'0 2px 16px rgba(44,44,44,0.05)' },
  btn: (bg='#7D9B76', color='white') => ({ padding:'11px 20px', background:bg, color, border:'none', borderRadius:11, fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:600, cursor:'pointer' }),
  badge: (color) => {
    const map = { pending:['#FFF8E1','#B7791F'], confirmed:['#E6F4EA','#276749'], completed:['#E8F4FD','#1A6BA0'], cancelled:['#FEE2E2','#9B2C2C'] };
    const [bg,text] = map[color] || map.pending;
    return { display:'inline-block', padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700, background:bg, color:text, letterSpacing:'0.04em' };
  }
};

export default function PatientDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState('appointments');

  // Auth state
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [patientName, setPatientName] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Data state
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [reports, setReports] = useState({});
  const [dataLoading, setDataLoading] = useState(false);

  // Upload state
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [uploadPreviews, setUploadPreviews] = useState([]);
  const [cancellingId, setCancellingId] = useState(null);
  const fileInputRef = useRef();

  // Report edit/delete
  const [editingReport, setEditingReport] = useState(null); // { apptId, index, value }
  const [toast, setToast] = useState(null); // { type:'success'|'error', message }

  // NGO Help tab
  const [helpForm, setHelpForm] = useState({ name: '', email: '', helpType: 'general', message: '' });
  const [helpSubmitted, setHelpSubmitted] = useState(false);
  const [helpRequests, setHelpRequests] = useState([]);
  const [helpLoading, setHelpLoading] = useState(false);

  // ── Session restore on page load ─────────────────────────────────────────
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('patientPortalSession');
      if (stored) {
        const session = JSON.parse(stored);
        if (session.expiry && new Date(session.expiry) > new Date()) {
          setVerifiedPhone(session.phone);
          setPatientName(session.patientName || '');
          loadAllPatientData(session.phone);
        } else {
          sessionStorage.removeItem('patientPortalSession');
        }
      }
    } catch (e) {}
  }, []);

  // ── Sync helpForm.name from patientName ─────────────────────────────────
  useEffect(() => {
    if (patientName && !helpForm.name) {
      setHelpForm(prev => ({ ...prev, name: patientName }));
    }
  }, [patientName]);

  // ── OTP countdown timer ──────────────────────────────────────────────────
  useEffect(() => {
    if (!otpSent) return;
    setResendTimer(30);
    setCanResend(false);
    const interval = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(interval); setCanResend(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [otpSent]);

  // ── Auth functions ───────────────────────────────────────────────────────
  const handleSendOTP = async () => {
    if (!phoneInput.trim()) return;
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await axios.post(`${API}/api/public/send-portal-otp`, { phone: phoneInput.trim() });
      setOtpSent(true);
      if (res.data.otp) setDevOtp(res.data.otp);
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally { setOtpLoading(false); }
  };

  const handleVerifyOTP = async () => {
    if (!otpInput.trim()) return;
    setOtpLoading(true);
    setOtpError('');
    try {
      await axios.post(`${API}/api/public/verify-portal-otp`, { phone: phoneInput.trim(), otp: otpInput.trim() });
      const phone = phoneInput.trim();
      setVerifiedPhone(phone);
      await loadAllPatientData(phone);
      const session = { phone, patientName, expiry: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() };
      sessionStorage.setItem('patientPortalSession', JSON.stringify(session));
      setOtpInput('');
      setDevOtp('');
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally { setOtpLoading(false); }
  };

  const handleResendOTP = async () => {
    try {
      const res = await axios.post(`${API}/api/public/send-portal-otp`, { phone: phoneInput.trim() });
      if (res.data.otp) setDevOtp(res.data.otp);
      setOtpSent(true);
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Failed to resend OTP');
    }
  };

  const handleSignOut = () => {
    sessionStorage.removeItem('patientPortalSession');
    setVerifiedPhone('');
    setPatientName('');
    setPhoneInput('');
    setOtpInput('');
    setOtpSent(false);
    setOtpError('');
    setDevOtp('');
    setAppointments([]);
    setPrescriptions([]);
    setReports({});
    setTab('appointments');
    setHelpRequests([]);
    setHelpSubmitted(false);
    setHelpForm({ name: '', email: '', helpType: 'general', message: '' });
  };

  // ── Data loading functions ───────────────────────────────────────────────
  const loadAllPatientData = async (phone) => {
    setDataLoading(true);
    try {
      const res = await axios.get(`${API}/api/public/appointments?phone=${encodeURIComponent(phone)}`);
      const appts = res.data.data || [];
      setAppointments(appts);
      if (appts.length > 0) {
        setPatientName(appts[0].patient?.name || '');
        sessionStorage.setItem('patientPortalSession', JSON.stringify({
          phone, patientName: appts[0].patient?.name || '',
          expiry: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
        }));
      }
      const tokenIds = appts.map(a => a._id).join(',');
      if (tokenIds) {
        try {
          const rxRes = await axios.get(`${API}/api/prescriptions/public?tokenIds=${tokenIds}`);
          setPrescriptions(rxRes.data.data || []);
        } catch (e) { console.error('Prescriptions load failed:', e); }
      }
      try {
        const stored = JSON.parse(localStorage.getItem('patientReports') || '{}');
        setReports(stored);
      } catch (e) {}
      loadHelpRequests(phone);
    } catch (err) {
      console.error('Load patient data failed:', err);
    } finally { setDataLoading(false); }
  };

  const handleCancelAppointment = async (appt) => {
    if (!confirm(`Cancel your appointment (Token #${appt.tokenNumber}) with Dr. ${appt.doctor?.name} on ${new Date(appt.appointmentDate).toLocaleDateString()}? This cannot be undone.`)) return;
    setCancellingId(appt._id);
    try {
      await axios.put(`${API}/api/public/cancel-appointment`, { tokenId: appt._id, phone: verifiedPhone });
      setAppointments(prev => prev.map(a => a._id === appt._id ? { ...a, status: 'cancelled' } : a));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel appointment');
    } finally { setCancellingId(null); }
  };

  const handleFileUpload = (e) => {
    if (!selectedAppointmentId) { alert('Please select an appointment first'); return; }
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const preview = {
          name: file.name, url: reader.result, type: file.type,
          size: (file.size / 1024).toFixed(1) + ' KB',
          uploadedBy: 'patient', uploadedAt: new Date().toLocaleString()
        };
        setUploadPreviews(prev => [...prev, preview]);
        setReports(prev => ({
          ...prev,
          [selectedAppointmentId]: [...(prev[selectedAppointmentId] || []), preview]
        }));
        try {
          const stored = JSON.parse(localStorage.getItem('patientReports') || '{}');
          stored[selectedAppointmentId] = [...(stored[selectedAppointmentId] || []), preview];
          localStorage.setItem('patientReports', JSON.stringify(stored));
        } catch (err) { console.error(err); }
      };
      reader.readAsDataURL(file);
    });
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDeleteReport = (apptId, index) => {
    setReports(prev => {
      const updated = { ...prev, [apptId]: prev[apptId].filter((_, i) => i !== index) };
      try { localStorage.setItem('patientReports', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
    showToast('success', 'Report deleted');
  };

  const handleSaveReportName = (apptId, index) => {
    if (!editingReport || editingReport.value.trim() === '') return;
    setReports(prev => {
      const list = [...(prev[apptId] || [])];
      list[index] = { ...list[index], name: editingReport.value.trim() };
      const updated = { ...prev, [apptId]: list };
      try { localStorage.setItem('patientReports', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
    setEditingReport(null);
    showToast('success', 'Report renamed');
  };

  const loadHelpRequests = async (phone) => {
    setHelpLoading(true);
    try {
      const res = await axios.get(`${API}/api/public/help-requests?phone=${encodeURIComponent(phone)}`);
      setHelpRequests(res.data.data || []);
    } catch (e) { console.error('Help requests load failed:', e); }
    finally { setHelpLoading(false); }
  };

  const handleSubmitHelp = async (e) => {
    e.preventDefault();
    setHelpLoading(true);
    try {
      await axios.post(`${API}/api/public/help-request`, {
        name: helpForm.name || patientName,
        phone: verifiedPhone,
        email: helpForm.email,
        helpType: helpForm.helpType,
        message: helpForm.message
      });
      setHelpSubmitted(true);
      await loadHelpRequests(verifiedPhone);
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to submit request');
    } finally { setHelpLoading(false); }
  };

  const handlePrintPrescription = (rx, appt) => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Prescription</title></head>
      <body style="font-family:Arial,sans-serif;max-width:700px;margin:40px auto;padding:20px;">
        <div style="background:#7D9B76;color:white;padding:20px;border-radius:8px;margin-bottom:24px;">
          <h1 style="margin:0;font-size:24px;">Viatris Health</h1>
          <p style="margin:4px 0 0 0;opacity:0.85;">Medical Prescription</p>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <tr><td style="padding:6px;color:#666;width:140px;">Patient</td><td style="padding:6px;font-weight:bold;">${appt?.patient?.name || patientName}</td></tr>
          <tr><td style="padding:6px;color:#666;">Token #</td><td style="padding:6px;font-weight:bold;">${appt?.tokenNumber}</td></tr>
          <tr><td style="padding:6px;color:#666;">Doctor</td><td style="padding:6px;">Dr. ${rx.doctor?.name || ''} — ${rx.doctor?.specialization || ''}</td></tr>
          <tr><td style="padding:6px;color:#666;">Date</td><td style="padding:6px;">${new Date(rx.createdAt).toLocaleDateString()}</td></tr>
        </table>
        <h3 style="color:#2C2C2C;border-bottom:1px solid #eee;padding-bottom:8px;">Diagnosis</h3>
        <p>${rx.diagnosis}</p>
        <h3 style="color:#2C2C2C;border-bottom:1px solid #eee;padding-bottom:8px;">Medications</h3>
        <p style="white-space:pre-line;">${rx.medicationsText || ''}</p>
        ${rx.additionalInstructions ? `<h3 style="color:#2C2C2C;border-bottom:1px solid #eee;padding-bottom:8px;">Instructions</h3><p>${rx.additionalInstructions}</p>` : ''}
        ${rx.followUpDate ? `<p style="color:#7D9B76;"><strong>Follow-up Date:</strong> ${new Date(rx.followUpDate).toLocaleDateString()}</p>` : ''}
        <div style="margin-top:40px;padding-top:16px;border-top:1px solid #eee;color:#999;font-size:12px;">
          This prescription was generated by Viatris Health. Please bring this document to your next appointment.
        </div>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const tabs = [
    { id: 'appointments', label: '📅 My Appointments',  icon: '📅' },
    { id: 'reports',      label: '📁 My Reports',        icon: '📁' },
    { id: 'prescriptions',label: '💊 My Prescriptions',  icon: '💊' },
    { id: 'doctors',      label: '👨‍⚕️ My Doctors',        icon: '👨‍⚕️' },
    { id: 'help',         label: '🤝 Get Help',           icon: '🤝' },
  ];

  // ── Computed values ──────────────────────────────────────────────────────
  const upcoming = appointments
    .filter(a => ['pending','confirmed'].includes(a.status))
    .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));
  const past = appointments
    .filter(a => ['completed','cancelled'].includes(a.status))
    .sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));

  const uniqueDoctors = appointments.reduce((acc, appt) => {
    if (appt.doctor?._id && !acc.find(d => d._id === appt.doctor._id)) {
      acc.push({ ...appt.doctor, lastVisit: appt.appointmentDate });
    }
    return acc;
  }, []);

  const doctorsInAppts = appointments.reduce((acc, appt) => {
    if (appt.doctor?._id && !acc.find(d => d._id === appt.doctor._id)) {
      acc.push(appt.doctor);
    }
    return acc;
  }, []);

  const appointmentsForDoctor = selectedDoctorId
    ? appointments.filter(a => a.doctor?._id === selectedDoctorId)
    : [];

  // ── JSX ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', background:'#FAF7F2', fontFamily:"'DM Sans',sans-serif" }}>
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        @keyframes fadeInUp { from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:translateY(0);} }
        .tab-btn:hover { background: rgba(125,155,118,0.08) !important; }
        input:focus, select:focus, textarea:focus { border-color:#7D9B76 !important; box-shadow:0 0 0 3px rgba(125,155,118,0.12); }
        .appt-card:hover { box-shadow: 0 6px 28px rgba(44,44,44,0.1) !important; transform: translateY(-1px); }
        .appt-card { transition: all 0.18s ease; }
        .upload-zone:hover { border-color:#7D9B76 !important; background:rgba(125,155,118,0.04) !important; }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{ background:'white', borderBottom:'1px solid #EDE8E0', padding:'0 32px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', height:68 }}>
          <a href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
            <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#7D9B76,#B5CDB0)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ color:'white', fontSize:17 }}>✿</span>
            </div>
            <span style={{ fontFamily:"'DM Serif Display',serif", fontSize:21, color:'#2C2C2C' }}>VIATRIS</span>
            <span style={{ fontSize:12, color:'#7D9B76', fontWeight:500 }}>Patient Portal</span>
          </a>
          <a href="/" style={{ fontSize:13, color:'#9C9C9C', textDecoration:'none', padding:'8px 16px', border:'1.5px solid #EDE8E0', borderRadius:9 }}>← Back to Home</a>
        </div>
      </header>

      {/* ── ENTRY SCREEN (not verified) ── */}
      {!verifiedPhone && (
        <div style={{ maxWidth:480, margin:'60px auto', padding:'0 24px' }}>
          <div style={S.card}>
            <div style={{ textAlign:'center', marginBottom:28 }}>
              <div style={{ fontSize:44, marginBottom:12 }}>🏥</div>
              <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:28, color:'#2C2C2C', marginBottom:8 }}>Welcome to Your Health Portal</h2>
              <p style={{ color:'#9C9C9C', fontSize:14, lineHeight:1.6 }}>Enter your registered phone number to access your appointments, prescriptions, and health records.</p>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:500, color:'#5C5C5C', marginBottom:6 }}>Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 9560214848"
                  value={phoneInput}
                  onChange={e => setPhoneInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !otpSent && handleSendOTP()}
                  style={S.inp}
                  disabled={otpSent}
                />
              </div>

              {!otpSent ? (
                <button
                  onClick={handleSendOTP}
                  disabled={otpLoading || !phoneInput.trim()}
                  style={{ ...S.btn(otpLoading || !phoneInput.trim() ? '#B5CDB0' : '#7D9B76'), width:'100%', textAlign:'center' }}>
                  {otpLoading ? 'Sending...' : 'Send OTP →'}
                </button>
              ) : (
                <>
                  <div>
                    <label style={{ display:'block', fontSize:13, fontWeight:500, color:'#5C5C5C', marginBottom:6 }}>Enter 6-digit OTP</label>
                    <input
                      type="text"
                      maxLength="6"
                      placeholder="000000"
                      value={otpInput}
                      onChange={e => setOtpInput(e.target.value.replace(/\D/g, ''))}
                      onKeyDown={e => e.key === 'Enter' && otpInput.length === 6 && handleVerifyOTP()}
                      style={{ ...S.inp, textAlign:'center', fontSize:22, letterSpacing:10, fontFamily:'monospace' }}
                    />
                  </div>

                  {devOtp && (
                    <div style={{ background:'#FFFBEB', border:'1px solid #F59E0B', borderRadius:8, padding:12, textAlign:'center' }}>
                      <span style={{ fontSize:13, color:'#92610A', fontWeight:600 }}>Demo Mode — Your OTP is: </span>
                      <span style={{ fontSize:18, fontFamily:'monospace', fontWeight:700, color:'#92610A', letterSpacing:6 }}>{devOtp}</span>
                    </div>
                  )}

                  <button
                    onClick={handleVerifyOTP}
                    disabled={otpLoading || otpInput.length !== 6}
                    style={{ ...S.btn(otpLoading || otpInput.length !== 6 ? '#B5CDB0' : '#7D9B76'), width:'100%', textAlign:'center' }}>
                    {otpLoading ? 'Verifying...' : 'Verify OTP'}
                  </button>

                  <div style={{ textAlign:'center', fontSize:13, color:'#9C9C9C' }}>
                    {canResend ? (
                      <button onClick={handleResendOTP} style={{ background:'none', border:'none', color:'#7D9B76', fontWeight:600, cursor:'pointer', fontSize:13 }}>
                        Resend OTP
                      </button>
                    ) : (
                      <span>Resend in {resendTimer}s</span>
                    )}
                    <span style={{ marginLeft:12 }}>·</span>
                    <button onClick={() => { setOtpSent(false); setOtpInput(''); setOtpError(''); setDevOtp(''); }} style={{ background:'none', border:'none', color:'#9C9C9C', cursor:'pointer', fontSize:13, marginLeft:8 }}>
                      Change number
                    </button>
                  </div>
                </>
              )}

              {otpError && (
                <div style={{ padding:'10px 14px', background:'#FEE2E2', borderRadius:10, fontSize:13, color:'#9B2C2C' }}>
                  {otpError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── PERSONAL DASHBOARD (verified) ── */}
      {verifiedPhone && (
        <div>
          {/* Welcome bar */}
          <div style={{ background:'white', borderBottom:'1px solid #EDE8E0', padding:'12px 32px' }}>
            <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ fontSize:15, fontWeight:600, color:'#2C2C2C' }}>
                  Welcome back{patientName ? `, ${patientName}` : ''}
                </span>
                <span style={S.badge('confirmed')}>✓ {verifiedPhone}</span>
              </div>
              <button onClick={handleSignOut} style={S.btn('#F2EDE3', '#5C5C5C')}>
                Sign Out
              </button>
            </div>
          </div>

          {/* Sidebar + Content */}
          <div style={{ maxWidth:1100, margin:'0 auto', padding:'36px 24px', display:'grid', gridTemplateColumns:'220px 1fr', gap:28 }}>

            {/* ── SIDEBAR ── */}
            <div>
              <div style={{ ...S.card, padding:'20px 16px', position:'sticky', top:24 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'#9C9C9C', marginBottom:14, letterSpacing:'0.06em', paddingLeft:8 }}>PATIENT PORTAL</div>
                {tabs.map(t => (
                  <button key={t.id} className="tab-btn"
                    onClick={() => setTab(t.id)}
                    style={{ width:'100%', textAlign:'left', padding:'11px 14px', borderRadius:11, border:'none', cursor:'pointer', fontSize:14, fontWeight: tab===t.id ? 600 : 400, background: tab===t.id ? 'rgba(125,155,118,0.12)' : 'transparent', color: tab===t.id ? '#4A6B44' : '#5C5C5C', marginBottom:4, display:'flex', alignItems:'center', gap:10 }}>
                    <span>{t.icon}</span> {t.label.split(' ').slice(1).join(' ')}
                  </button>
                ))}

                <div style={{ marginTop:20, padding:'14px', background:'rgba(125,155,118,0.08)', borderRadius:12 }}>
                  <div style={{ fontSize:12, color:'#4A6B44', fontWeight:600, marginBottom:6 }}>📞 Need help?</div>
                  <div style={{ fontSize:11, color:'#5C5C5C', lineHeight:1.6 }}>Contact your clinic or book a new appointment from the home page.</div>
                </div>
              </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <div style={{ animation:'fadeInUp 0.5s ease both' }}>

              {/* Loading overlay */}
              {dataLoading && (
                <div style={{ ...S.card, textAlign:'center', padding:'32px 28px', marginBottom:20 }}>
                  <div style={{ fontSize:18, color:'#7D9B76' }}>Loading your data...</div>
                </div>
              )}

              {/* ════ TAB: MY APPOINTMENTS ════ */}
              {tab === 'appointments' && (
                <div>
                  <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:28, color:'#2C2C2C', marginBottom:6 }}>My Appointments</h2>
                  <p style={{ color:'#9C9C9C', fontSize:14, marginBottom:24 }}>Your upcoming and past appointments</p>

                  {appointments.length === 0 && !dataLoading && (
                    <div style={{ ...S.card, textAlign:'center', padding:'48px 28px' }}>
                      <div style={{ fontSize:44, marginBottom:16 }}>📋</div>
                      <h3 style={{ fontFamily:"'DM Serif Display',serif", fontSize:22, color:'#2C2C2C', marginBottom:8 }}>No appointments found</h3>
                      <p style={{ color:'#9C9C9C', fontSize:14, marginBottom:20 }}>Book an appointment from the home page.</p>
                      <button onClick={() => router.push('/')} style={S.btn()}>Book Appointment →</button>
                    </div>
                  )}

                  {upcoming.length > 0 && (
                    <>
                      <h3 style={{ fontSize:16, fontWeight:700, color:'#2C2C2C', marginBottom:14 }}>Upcoming Appointments</h3>
                      {upcoming.map((appt, i) => (
                        <div key={appt._id || i} className="appt-card" style={{ ...S.card, marginBottom:16, animation:`fadeInUp 0.4s ease ${i*0.08}s both` }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
                            <div style={{ flex:1 }}>
                              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                                <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#B5CDB0,#7D9B76)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                  <span style={{ color:'white', fontFamily:"'DM Serif Display',serif", fontSize:18, fontWeight:700 }}>{appt.tokenNumber}</span>
                                </div>
                                <div>
                                  <div style={{ fontSize:15, fontWeight:700, color:'#2C2C2C' }}>Token #{appt.tokenNumber}</div>
                                  <div style={{ fontSize:12, color:'#9C9C9C' }}>{appt.specialization}</div>
                                </div>
                                <span style={S.badge(appt.status)}>{appt.status?.toUpperCase()}</span>
                              </div>
                              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 24px', fontSize:13, color:'#5C5C5C' }}>
                                <div>👨‍⚕️ <strong>Doctor:</strong> Dr. {appt.doctor?.name || 'TBD'}</div>
                                <div>🩺 <strong>Spec:</strong> {appt.specialization}</div>
                                <div>📅 <strong>Date:</strong> {appt.appointmentDate ? new Date(appt.appointmentDate).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' }) : 'N/A'}</div>
                                <div>👤 <strong>Name:</strong> {appt.patient?.name}</div>
                              </div>
                            </div>
                            <div style={{ display:'flex', flexDirection:'column', gap:8, minWidth:140 }}>
                              {appt.meetLink && (
                                <button onClick={() => window.open(appt.meetLink.startsWith('http') ? appt.meetLink : `https://${appt.meetLink}`, '_blank')}
                                  style={{ ...S.btn('#4A6B44'), display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                                  📹 Join Meet
                                </button>
                              )}
                              {['pending','confirmed'].includes(appt.status) && (
                                <button
                                  onClick={() => handleCancelAppointment(appt)}
                                  disabled={cancellingId === appt._id}
                                  style={{ ...S.btn('#FEE2E2', '#9B2C2C'), display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                                  {cancellingId === appt._id ? 'Cancelling...' : '✕ Cancel'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {past.length > 0 && (
                    <>
                      <h3 style={{ fontSize:16, fontWeight:700, color:'#2C2C2C', marginTop:upcoming.length > 0 ? 28 : 0, marginBottom:14 }}>Past Appointments</h3>
                      {past.map((appt, i) => (
                        <div key={appt._id || i} className="appt-card" style={{ ...S.card, marginBottom:16, opacity:0.85, animation:`fadeInUp 0.4s ease ${i*0.08}s both` }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
                            <div style={{ flex:1 }}>
                              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                                <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#DDD5C8,#B5A898)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                  <span style={{ color:'white', fontFamily:"'DM Serif Display',serif", fontSize:18, fontWeight:700 }}>{appt.tokenNumber}</span>
                                </div>
                                <div>
                                  <div style={{ fontSize:15, fontWeight:700, color:'#2C2C2C' }}>Token #{appt.tokenNumber}</div>
                                  <div style={{ fontSize:12, color:'#9C9C9C' }}>{appt.specialization}</div>
                                </div>
                                <span style={S.badge(appt.status)}>{appt.status?.toUpperCase()}</span>
                              </div>
                              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 24px', fontSize:13, color:'#5C5C5C' }}>
                                <div>👨‍⚕️ <strong>Doctor:</strong> Dr. {appt.doctor?.name || 'TBD'}</div>
                                <div>📅 <strong>Date:</strong> {appt.appointmentDate ? new Date(appt.appointmentDate).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' }) : 'N/A'}</div>
                              </div>
                            </div>
                            <div style={{ display:'flex', flexDirection:'column', gap:8, minWidth:140 }}>
                              {prescriptions.some(rx => rx.token?._id === appt._id || rx.token === appt._id) && (
                                <button onClick={() => setTab('prescriptions')}
                                  style={{ ...S.btn('#F2EDE3', '#5C5C5C'), display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                                  💊 View Rx
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {/* ════ TAB: MY REPORTS ════ */}
              {tab === 'reports' && (
                <div>
                  <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:28, color:'#2C2C2C', marginBottom:6 }}>My Reports</h2>
                  <p style={{ color:'#9C9C9C', fontSize:14, marginBottom:24 }}>Upload and manage your medical reports and images</p>

                  <div style={{ ...S.card, marginBottom:20 }}>
                    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                      <div>
                        <label style={{ fontSize:13, fontWeight:600, color:'#5C5C5C', display:'block', marginBottom:6 }}>Select Doctor</label>
                        <select value={selectedDoctorId}
                          onChange={e => { setSelectedDoctorId(e.target.value); setSelectedAppointmentId(''); }}
                          style={{ ...S.inp, appearance:'none' }}>
                          <option value="">-- Select a doctor --</option>
                          {doctorsInAppts.map(d => (
                            <option key={d._id} value={d._id}>Dr. {d.name} — {d.specialization}</option>
                          ))}
                        </select>
                      </div>

                      {selectedDoctorId && (
                        <div>
                          <label style={{ fontSize:13, fontWeight:600, color:'#5C5C5C', display:'block', marginBottom:6 }}>Select Appointment</label>
                          <select value={selectedAppointmentId} onChange={e => setSelectedAppointmentId(e.target.value)}
                            style={{ ...S.inp, appearance:'none' }}>
                            <option value="">-- Select appointment --</option>
                            {appointmentsForDoctor.map(appt => (
                              <option key={appt._id} value={appt._id}>
                                Token #{appt.tokenNumber} — {appt.appointmentDate ? new Date(appt.appointmentDate).toLocaleDateString('en-IN') : 'N/A'}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {selectedDoctorId && selectedAppointmentId && (() => {
                        const selAppt = appointments.find(a => a._id === selectedAppointmentId);
                        return (
                          <div style={{ padding:'10px 14px', background:'rgba(125,155,118,0.08)', borderRadius:10, fontSize:13, color:'#4A6B44', fontWeight:500 }}>
                            📎 Uploading for: Dr. {selAppt?.doctor?.name} — Token #{selAppt?.tokenNumber}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {selectedDoctorId && selectedAppointmentId && (
                    <>
                      <div className="upload-zone" onClick={() => fileInputRef.current?.click()}
                        style={{ ...S.card, border:'2px dashed #DDD5C8', textAlign:'center', padding:'48px 28px', cursor:'pointer', marginBottom:20, transition:'all 0.18s ease' }}>
                        <div style={{ fontSize:44, marginBottom:12 }}>📁</div>
                        <h3 style={{ fontFamily:"'DM Serif Display',serif", fontSize:20, color:'#2C2C2C', marginBottom:8 }}>Drop files here or click to browse</h3>
                        <p style={{ color:'#9C9C9C', fontSize:13, marginBottom:16 }}>Supports: JPG, PNG, PDF — Max 10MB each</p>
                        <span style={S.btn()}>Choose Files</span>
                        <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf" onChange={handleFileUpload} style={{ display:'none' }} />
                      </div>

                      {(reports[selectedAppointmentId] || []).length > 0 && (
                        <div style={S.card}>
                          <h3 style={{ fontSize:16, fontWeight:700, color:'#2C2C2C', marginBottom:16 }}>
                            Uploaded Files ({(reports[selectedAppointmentId] || []).length})
                          </h3>
                          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:14 }}>
                            {(reports[selectedAppointmentId] || []).map((file, i) => (
                              <div key={i} style={{ borderRadius:12, overflow:'hidden', border:'1.5px solid #EDE8E0', background:'#FDFCFA' }}>
                                {file.type?.startsWith('image/') ? (
                                  <img src={file.url} alt={file.name} style={{ width:'100%', height:110, objectFit:'cover', display:'block' }} />
                                ) : (
                                  <div style={{ width:'100%', height:110, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#F2EDE3' }}>
                                    <span style={{ fontSize:32 }}>📄</span>
                                  </div>
                                )}
                                <div style={{ padding:'8px 10px' }}>
                                  {editingReport?.apptId === selectedAppointmentId && editingReport?.index === i ? (
                                    <>
                                      <input
                                        value={editingReport.value}
                                        onChange={e => setEditingReport(prev => ({ ...prev, value: e.target.value }))}
                                        style={{ width:'100%', fontSize:11, padding:'3px 6px', border:'1px solid #7D9B76', borderRadius:6, marginBottom:4, fontFamily:"'DM Sans',sans-serif", outline:'none' }}
                                        autoFocus
                                        onKeyDown={e => { if (e.key === 'Enter') handleSaveReportName(selectedAppointmentId, i); if (e.key === 'Escape') setEditingReport(null); }}
                                      />
                                      <div style={{ display:'flex', gap:4 }}>
                                        <button onClick={() => handleSaveReportName(selectedAppointmentId, i)} style={{ flex:1, fontSize:10, padding:'2px 4px', background:'#7D9B76', color:'white', border:'none', borderRadius:5, cursor:'pointer' }}>Save</button>
                                        <button onClick={() => setEditingReport(null)} style={{ flex:1, fontSize:10, padding:'2px 4px', background:'#EDE8E0', color:'#5C5C5C', border:'none', borderRadius:5, cursor:'pointer' }}>Cancel</button>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div style={{ fontSize:11, color:'#5C5C5C', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{file.name}</div>
                                      {file.size && <div style={{ fontSize:10, color:'#9C9C9C', marginTop:2 }}>{file.size}</div>}
                                      <div style={{ display:'flex', gap:4, marginTop:5 }}>
                                        <button onClick={() => setEditingReport({ apptId: selectedAppointmentId, index: i, value: file.name })}
                                          title="Rename"
                                          style={{ flex:1, fontSize:11, padding:'3px', background:'#F2EDE3', border:'none', borderRadius:5, cursor:'pointer' }}>✏️</button>
                                        <button onClick={() => handleDeleteReport(selectedAppointmentId, i)}
                                          title="Delete"
                                          style={{ flex:1, fontSize:11, padding:'3px', background:'#FEE2E2', border:'none', borderRadius:5, cursor:'pointer' }}>🗑️</button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {!selectedDoctorId && doctorsInAppts.length === 0 && !dataLoading && (
                    <div style={{ ...S.card, padding:'16px 20px', background:'#FFF8E1', border:'1.5px solid #F6D860' }}>
                      <p style={{ fontSize:13, color:'#92610A', margin:0 }}>
                        📋 No appointments found. Book an appointment first, then come back to upload your reports.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ════ TAB: MY PRESCRIPTIONS ════ */}
              {tab === 'prescriptions' && (
                <div>
                  <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:28, color:'#2C2C2C', marginBottom:6 }}>My Prescriptions</h2>
                  <p style={{ color:'#9C9C9C', fontSize:14, marginBottom:24 }}>View and download prescriptions written by your doctor</p>

                  {prescriptions.length === 0 && !dataLoading ? (
                    <div style={{ ...S.card, textAlign:'center', padding:'48px 28px' }}>
                      <div style={{ fontSize:44, marginBottom:16 }}>💊</div>
                      <h3 style={{ fontFamily:"'DM Serif Display',serif", fontSize:22, color:'#2C2C2C', marginBottom:8 }}>No prescriptions yet</h3>
                      <p style={{ color:'#9C9C9C', fontSize:14 }}>Your doctor hasn't added any prescriptions yet. Check back after your consultation.</p>
                    </div>
                  ) : (
                    prescriptions.map((rx, i) => {
                      const matchingAppt = appointments.find(a => a._id === (rx.token?._id || rx.token));
                      return (
                        <div key={rx._id} style={{ ...S.card, marginBottom:16, animation:`fadeInUp 0.4s ease ${i*0.08}s both` }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16, flexWrap:'wrap', gap:10 }}>
                            <div>
                              <div style={{ fontSize:16, fontWeight:700, color:'#2C2C2C' }}>Dr. {rx.doctor?.name || 'N/A'}</div>
                              <div style={{ fontSize:13, color:'#7D9B76', fontWeight:500 }}>{rx.doctor?.specialization || ''}</div>
                              <div style={{ fontSize:12, color:'#9C9C9C', marginTop:3 }}>
                                📅 {new Date(rx.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
                                {matchingAppt && <span style={{ marginLeft:8 }}>· Token #{matchingAppt.tokenNumber}</span>}
                              </div>
                            </div>
                            <button onClick={() => handlePrintPrescription(rx, matchingAppt)}
                              style={{ ...S.btn('#4A6B44'), display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap' }}>
                              ⬇ Download
                            </button>
                          </div>

                          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                            <div style={{ padding:'12px 16px', background:'rgba(125,155,118,0.07)', borderRadius:10 }}>
                              <div style={{ fontSize:11, fontWeight:700, color:'#7D9B76', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:4 }}>Diagnosis</div>
                              <div style={{ fontSize:14, color:'#2C2C2C', fontWeight:600 }}>{rx.diagnosis}</div>
                            </div>

                            {rx.medicationsText && (
                              <div style={{ padding:'12px 16px', background:'#FDFCFA', borderRadius:10, border:'1px solid #EDE8E0' }}>
                                <div style={{ fontSize:11, fontWeight:700, color:'#7D9B76', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:8 }}>Medications</div>
                                {rx.medicationsText.split('\n').filter(Boolean).map((med, j) => (
                                  <div key={j} style={{ fontSize:13, color:'#2C2C2C', padding:'4px 0', borderBottom: j < rx.medicationsText.split('\n').filter(Boolean).length - 1 ? '1px solid #F2EDE3' : 'none' }}>
                                    💊 {med}
                                  </div>
                                ))}
                              </div>
                            )}

                            {rx.additionalInstructions && (
                              <div style={{ padding:'12px 16px', background:'#FDFCFA', borderRadius:10, border:'1px solid #EDE8E0' }}>
                                <div style={{ fontSize:11, fontWeight:700, color:'#7D9B76', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:4 }}>Instructions</div>
                                <div style={{ fontSize:13, color:'#5C5C5C', lineHeight:1.65 }}>{rx.additionalInstructions}</div>
                              </div>
                            )}

                            {rx.followUpDate && (
                              <div style={{ fontSize:13, color:'#7D9B76', fontWeight:600, padding:'8px 14px', background:'rgba(125,155,118,0.08)', borderRadius:9 }}>
                                📅 Follow-up Date: {new Date(rx.followUpDate).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ════ TAB: MY DOCTORS ════ */}
              {tab === 'doctors' && (
                <div>
                  <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:28, color:'#2C2C2C', marginBottom:6 }}>My Doctors</h2>
                  <p style={{ color:'#9C9C9C', fontSize:14, marginBottom:24 }}>Doctors you have consulted with</p>

                  {uniqueDoctors.length === 0 && !dataLoading ? (
                    <div style={{ ...S.card, textAlign:'center', padding:'48px 28px' }}>
                      <div style={{ fontSize:44, marginBottom:16 }}>👨‍⚕️</div>
                      <h3 style={{ fontFamily:"'DM Serif Display',serif", fontSize:22, color:'#2C2C2C', marginBottom:8 }}>No doctors yet</h3>
                      <p style={{ color:'#9C9C9C', fontSize:14, marginBottom:20 }}>Book an appointment to get started.</p>
                      <button onClick={() => router.push('/')} style={S.btn()}>Book Appointment →</button>
                    </div>
                  ) : (
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
                      {uniqueDoctors.map((doc, i) => (
                        <div key={doc._id} style={{ ...S.card, animation:`fadeInUp 0.4s ease ${i*0.08}s both` }}>
                          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
                            <div style={{ width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,#B5CDB0,#7D9B76)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                              {doc.profileImage ? (
                                <img src={`http://localhost:5000${doc.profileImage}`} alt={doc.name} style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover' }} />
                              ) : (
                                <span style={{ color:'white', fontFamily:"'DM Serif Display',serif", fontSize:20, fontWeight:700 }}>
                                  {doc.name?.charAt(0) || 'D'}
                                </span>
                              )}
                            </div>
                            <div>
                              <div style={{ fontSize:15, fontWeight:700, color:'#2C2C2C' }}>Dr. {doc.name}</div>
                              <div style={{ fontSize:13, color:'#7D9B76', fontWeight:500 }}>{doc.specialization}</div>
                            </div>
                          </div>
                          {doc.lastVisit && (
                            <div style={{ fontSize:12, color:'#9C9C9C', marginBottom:14 }}>
                              Last visit: {new Date(doc.lastVisit).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
                            </div>
                          )}
                          <button onClick={() => router.push('/')}
                            style={{ ...S.btn('#F2EDE3', '#5C5C5C'), width:'100%', textAlign:'center' }}>
                            Book Again →
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ════ TAB: GET HELP ════ */}
              {tab === 'help' && (
                <div>
                  <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:28, color:'#2C2C2C', marginBottom:6 }}>Get Help</h2>
                  <p style={{ color:'#9C9C9C', fontSize:14, marginBottom:24 }}>Submit a request to our NGO partners for financial, medical, or other support</p>

                  {!helpSubmitted ? (
                    <div style={{ ...S.card, marginBottom:24 }}>
                      <form onSubmit={handleSubmitHelp} style={{ display:'flex', flexDirection:'column', gap:14 }}>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                          <div>
                            <label style={{ display:'block', fontSize:13, fontWeight:500, color:'#5C5C5C', marginBottom:6 }}>Your Name</label>
                            <input value={helpForm.name || patientName} onChange={e => setHelpForm(p => ({ ...p, name: e.target.value }))}
                              style={S.inp} placeholder="Full name" required />
                          </div>
                          <div>
                            <label style={{ display:'block', fontSize:13, fontWeight:500, color:'#5C5C5C', marginBottom:6 }}>Email (optional)</label>
                            <input type="email" value={helpForm.email} onChange={e => setHelpForm(p => ({ ...p, email: e.target.value }))}
                              style={S.inp} placeholder="your@email.com" />
                          </div>
                        </div>
                        <div>
                          <label style={{ display:'block', fontSize:13, fontWeight:500, color:'#5C5C5C', marginBottom:6 }}>Type of Help Needed</label>
                          <select value={helpForm.helpType} onChange={e => setHelpForm(p => ({ ...p, helpType: e.target.value }))}
                            style={{ ...S.inp, appearance:'none' }}>
                            <option value="general">🤝 General Support</option>
                            <option value="financial">💰 Financial Aid</option>
                            <option value="medicine">💊 Medicine Access</option>
                            <option value="transport">🚗 Transport Assistance</option>
                            <option value="mental_health">🧠 Mental Health Support</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display:'block', fontSize:13, fontWeight:500, color:'#5C5C5C', marginBottom:6 }}>Describe your situation</label>
                          <textarea value={helpForm.message} onChange={e => setHelpForm(p => ({ ...p, message: e.target.value }))}
                            style={{ ...S.inp, resize:'vertical' }} rows={4} placeholder="Tell us how we can help you..." required />
                        </div>
                        <button type="submit" disabled={helpLoading}
                          style={{ ...S.btn(helpLoading ? '#B5CDB0' : '#7D9B76'), textAlign:'center' }}>
                          {helpLoading ? 'Submitting...' : '🤝 Submit Help Request'}
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div style={{ ...S.card, textAlign:'center', padding:'48px 28px', marginBottom:24 }}>
                      <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
                      <h3 style={{ fontFamily:"'DM Serif Display',serif", fontSize:22, color:'#2C2C2C', marginBottom:8 }}>Request Submitted!</h3>
                      <p style={{ color:'#9C9C9C', fontSize:14, marginBottom:20, lineHeight:1.6 }}>An NGO representative will contact you within 24 hours.</p>
                      <button onClick={() => setHelpSubmitted(false)} style={{ ...S.btn('#F2EDE3', '#5C5C5C') }}>Submit Another Request</button>
                    </div>
                  )}

                  {helpRequests.length > 0 && (
                    <div>
                      <h3 style={{ fontSize:16, fontWeight:700, color:'#2C2C2C', marginBottom:14 }}>Your Previous Requests</h3>
                      {helpRequests.map((req, i) => (
                        <div key={req._id} style={{ ...S.card, marginBottom:12, animation:`fadeInUp 0.3s ease ${i*0.06}s both` }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:10 }}>
                            <div style={{ flex:1 }}>
                              <div style={{ fontSize:14, fontWeight:600, color:'#2C2C2C', marginBottom:4 }}>{req.message}</div>
                              <div style={{ fontSize:12, color:'#9C9C9C' }}>
                                {req.helpType?.replace('_', ' ')} · {new Date(req.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                              </div>
                            </div>
                            <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:12, fontSize:11, fontWeight:700,
                              background: req.status === 'resolved' ? '#E6F4EA' : req.status === 'in-progress' ? '#E8F4FD' : '#FFF8E1',
                              color: req.status === 'resolved' ? '#276749' : req.status === 'in-progress' ? '#1A6BA0' : '#B7791F' }}>
                              {req.status?.replace('-', ' ').toUpperCase()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {helpLoading && helpRequests.length === 0 && (
                    <div style={{ textAlign:'center', padding:'28px', color:'#9C9C9C', fontSize:14 }}>Loading your requests...</div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999, padding:'12px 20px', borderRadius:12, background: toast.type === 'success' ? '#276749' : '#9B2C2C', color:'white', fontSize:14, fontWeight:600, boxShadow:'0 4px 20px rgba(0,0,0,0.2)', animation:'fadeInUp 0.3s ease both' }}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.message}
        </div>
      )}
    </div>
  );
}
