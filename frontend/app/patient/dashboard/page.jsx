'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api';

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
  const [tab, setTab] = useState('lookup');
  const [phone, setPhone] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [lookupDone, setLookupDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadPreviews, setUploadPreviews] = useState([]);
  const [meetLink, setMeetLink] = useState('');
  const [reminder, setReminder] = useState(null);
  const [reminderSet, setReminderSet] = useState({});
  const fileInputRef = useRef();

  // ── look up appointments by phone (uses public endpoint, no auth needed) ──
  const handleLookup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.get(`${API}/public/appointments?phone=${phone.replace(/\s/g,'')}`);
      setAppointments(res.data.data || []);
      setLookupDone(true);
      if ((res.data.data || []).length === 0) {
        alert('No appointments found for this phone number.');
      }
    } catch {
      // fallback: try tokens endpoint without auth for demo
      setAppointments([]);
      setLookupDone(true);
      alert('No appointments found. Make sure you booked with this phone number.');
    } finally {
      setLoading(false);
    }
  };

  // ── file upload (client-side preview only, sends to backend if needed) ──
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setUploadedFiles(prev => [...prev, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadPreviews(prev => [...prev, { name: file.name, url: reader.result, type: file.type }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (idx) => {
    setUploadedFiles(f => f.filter((_,i) => i !== idx));
    setUploadPreviews(p => p.filter((_,i) => i !== idx));
  };

  // ── reminder ──
  const setAppointmentReminder = (appt) => {
    const dateStr = appt.appointmentDate;
    const apptDate = new Date(dateStr);
    const now = new Date();
    const diff = apptDate - now;

    if (diff <= 0) {
      alert('This appointment date has already passed.');
      return;
    }

    // Set reminder 1 hour before
    const reminderTime = diff - 60 * 60 * 1000;
    const triggerIn = reminderTime > 0 ? reminderTime : 5000; // if less than 1hr, show in 5s for demo

    setReminderSet(prev => ({ ...prev, [appt._id || appt.tokenNumber]: true }));

    setTimeout(() => {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🏥 Viatris Health Reminder', {
          body: `Your appointment is in 1 hour! Token: ${appt.tokenNumber}`,
          icon: '/favicon.ico'
        });
      } else {
        alert(`⏰ Reminder: Your appointment (Token ${appt.tokenNumber}) is coming up!\n\nDate: ${new Date(appt.appointmentDate).toLocaleDateString()}`);
      }
    }, triggerIn);

    alert(`✅ Reminder set for your appointment (Token: ${appt.tokenNumber})!\n\nYou'll be notified 1 hour before your appointment.`);

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const joinMeet = (link) => {
    if (!link) {
      alert('Your doctor has not shared a Google Meet link yet. Please check back closer to your appointment time.');
      return;
    }
    window.open(link.startsWith('http') ? link : `https://${link}`, '_blank');
  };

  const tabs = [
    { id: 'lookup', label: '🔍 My Appointments', icon: '📅' },
    { id: 'upload',  label: '📁 Upload Reports',  icon: '📁' },
    { id: 'meet',    label: '📹 Video Consult',    icon: '📹' },
    { id: 'tips',    label: '💡 Health Tips',      icon: '💡' },
  ];

  const healthTips = [
    { icon:'💧', title:'Stay Hydrated', tip:'Drink at least 8 glasses of water daily to maintain optimal body function.' },
    { icon:'🏃', title:'Daily Exercise', tip:'Even 30 minutes of moderate activity daily reduces heart disease risk significantly.' },
    { icon:'😴', title:'Quality Sleep', tip:'7-9 hours of sleep helps your body repair and strengthens your immune system.' },
    { icon:'🥦', title:'Eat Greens', tip:'Include leafy vegetables in every meal for essential vitamins and minerals.' },
    { icon:'🧘', title:'Manage Stress', tip:'Practice deep breathing or meditation for 10 minutes daily to reduce cortisol levels.' },
    { icon:'🚭', title:'Avoid Smoking', tip:'Quitting smoking improves lung capacity by up to 30% within just 3 months.' },
  ];

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
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#7D9B76,#B5CDB0)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ color:'white', fontSize:17 }}>✿</span>
            </div>
            <span style={{ fontFamily:"'DM Serif Display',serif", fontSize:21, color:'#2C2C2C' }}>VIATRIS</span>
            <span style={{ fontSize:12, color:'#7D9B76', fontWeight:500 }}>Patient Portal</span>
          </div>
          <a href="/" style={{ fontSize:13, color:'#9C9C9C', textDecoration:'none', padding:'8px 16px', border:'1.5px solid #EDE8E0', borderRadius:9 }}>← Back to Home</a>
        </div>
      </header>

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
              <div style={{ fontSize:11, color:'#5C5C5C', lineHeight:1.6 }}>Use your phone number to look up all your bookings instantly.</div>
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div style={{ animation:'fadeInUp 0.5s ease both' }}>

          {/* ════ TAB: MY APPOINTMENTS ════ */}
          {tab === 'lookup' && (
            <div>
              <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:28, color:'#2C2C2C', marginBottom:6 }}>My Appointments</h2>
              <p style={{ color:'#9C9C9C', fontSize:14, marginBottom:24 }}>Enter your phone number to view all your bookings</p>

              <div style={{ ...S.card, marginBottom:24 }}>
                <form onSubmit={handleLookup} style={{ display:'flex', gap:12 }}>
                  <input type="tel" placeholder="Enter your phone number (e.g. 9560214848)" value={phone} onChange={e => setPhone(e.target.value)} style={{ ...S.inp, flex:1 }} required />
                  <button type="submit" style={S.btn()} disabled={loading}>
                    {loading ? 'Searching...' : '🔍 Find'}
                  </button>
                </form>
              </div>

              {lookupDone && appointments.length === 0 && (
                <div style={{ ...S.card, textAlign:'center', padding:'48px 28px' }}>
                  <div style={{ fontSize:44, marginBottom:16 }}>📋</div>
                  <h3 style={{ fontFamily:"'DM Serif Display',serif", fontSize:22, color:'#2C2C2C', marginBottom:8 }}>No appointments found</h3>
                  <p style={{ color:'#9C9C9C', fontSize:14 }}>Try booking an appointment from the home page.</p>
                </div>
              )}

              {appointments.map((appt, i) => (
                <div key={appt._id || i} className="appt-card" style={{ ...S.card, marginBottom:16, animation:`fadeInUp 0.4s ease ${i*0.08}s both` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
                    <div>
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
                        <div>👤 <strong>Name:</strong> {appt.patient?.name}</div>
                        <div>📞 <strong>Phone:</strong> {appt.patient?.phone}</div>
                        <div>📅 <strong>Date:</strong> {appt.appointmentDate ? new Date(appt.appointmentDate).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' }) : 'N/A'}</div>
                        <div>🏥 <strong>Spec:</strong> {appt.specialization}</div>
                        {appt.patient?.address && <div style={{ gridColumn:'span 2' }}>📍 <strong>Address:</strong> {appt.patient.address}</div>}
                      </div>

                      {/* Meet link if set */}
                      {appt.meetLink && (
                        <div style={{ marginTop:12, padding:'10px 14px', background:'rgba(125,155,118,0.08)', borderRadius:10, fontSize:13, color:'#4A6B44' }}>
                          📹 <strong>Doctor's Meet Link:</strong> {appt.meetLink}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div style={{ display:'flex', flexDirection:'column', gap:8, minWidth:140 }}>
                      <button onClick={() => joinMeet(appt.meetLink)}
                        style={{ ...S.btn('#4A6B44'), display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                        📹 Join Meet
                      </button>
                      <button
                        onClick={() => setAppointmentReminder(appt)}
                        disabled={reminderSet[appt._id || appt.tokenNumber]}
                        style={{ ...S.btn(reminderSet[appt._id || appt.tokenNumber] ? '#B5CDB0' : '#8B6F52'), display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                        {reminderSet[appt._id || appt.tokenNumber] ? '✅ Reminder Set' : '⏰ Set Reminder'}
                      </button>
                      <button onClick={() => { setTab('upload'); }}
                        style={{ ...S.btn('#F2EDE3', '#5C5C5C'), display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                        📁 Upload Reports
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ════ TAB: UPLOAD REPORTS ════ */}
          {tab === 'upload' && (
            <div>
              <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:28, color:'#2C2C2C', marginBottom:6 }}>Upload Reports & Images</h2>
              <p style={{ color:'#9C9C9C', fontSize:14, marginBottom:24 }}>Upload your medical reports, X-rays, prescriptions or images of your problem area</p>

              {/* Drop zone */}
              <div className="upload-zone" onClick={() => fileInputRef.current?.click()}
                style={{ ...S.card, border:'2px dashed #DDD5C8', textAlign:'center', padding:'48px 28px', cursor:'pointer', marginBottom:24, transition:'all 0.18s ease' }}>
                <div style={{ fontSize:44, marginBottom:12 }}>📁</div>
                <h3 style={{ fontFamily:"'DM Serif Display',serif", fontSize:20, color:'#2C2C2C', marginBottom:8 }}>Drop files here or click to browse</h3>
                <p style={{ color:'#9C9C9C', fontSize:13, marginBottom:16 }}>Supports: JPG, PNG, PDF, HEIC — Max 10MB each</p>
                <span style={S.btn()}>Choose Files</span>
                <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf" onChange={handleFileChange} style={{ display:'none' }} />
              </div>

              {/* File type guide */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:24 }}>
                {[
                  { icon:'🩻', label:'X-Rays & Scans', desc:'DICOM, JPG, PNG' },
                  { icon:'💊', label:'Prescriptions', desc:'Photos or PDF' },
                  { icon:'🩸', label:'Lab Reports', desc:'Blood, urine, etc.' },
                ].map((item,i) => (
                  <div key={i} style={{ ...S.card, padding:'16px 18px', textAlign:'center' }}>
                    <div style={{ fontSize:28, marginBottom:8 }}>{item.icon}</div>
                    <div style={{ fontSize:13, fontWeight:600, color:'#2C2C2C', marginBottom:3 }}>{item.label}</div>
                    <div style={{ fontSize:11, color:'#9C9C9C' }}>{item.desc}</div>
                  </div>
                ))}
              </div>

              {/* Previews */}
              {uploadPreviews.length > 0 && (
                <div style={S.card}>
                  <h3 style={{ fontSize:16, fontWeight:700, color:'#2C2C2C', marginBottom:16 }}>Uploaded Files ({uploadPreviews.length})</h3>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:14 }}>
                    {uploadPreviews.map((file, i) => (
                      <div key={i} style={{ position:'relative', borderRadius:12, overflow:'hidden', border:'1.5px solid #EDE8E0', background:'#FDFCFA' }}>
                        {file.type?.startsWith('image/') ? (
                          <img src={file.url} alt={file.name} style={{ width:'100%', height:110, objectFit:'cover', display:'block' }} />
                        ) : (
                          <div style={{ width:'100%', height:110, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#F2EDE3' }}>
                            <span style={{ fontSize:32 }}>📄</span>
                            <span style={{ fontSize:10, color:'#5C5C5C', marginTop:4, textAlign:'center', padding:'0 8px' }}>PDF</span>
                          </div>
                        )}
                        <div style={{ padding:'8px 10px' }}>
                          <div style={{ fontSize:11, color:'#5C5C5C', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{file.name}</div>
                        </div>
                        <button onClick={() => removeFile(i)}
                          style={{ position:'absolute', top:6, right:6, width:22, height:22, borderRadius:'50%', background:'rgba(220,53,69,0.85)', color:'white', border:'none', cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop:18, display:'flex', gap:10 }}>
                    <button style={S.btn()} onClick={() => alert('✅ Files ready to share with your doctor during the consultation.')}>
                      ✅ Share with Doctor
                    </button>
                    <button style={S.btn('#F2EDE3','#5C5C5C')} onClick={() => { setUploadedFiles([]); setUploadPreviews([]); }}>
                      🗑 Clear All
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════ TAB: VIDEO CONSULT ════ */}
          {tab === 'meet' && (
            <div>
              <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:28, color:'#2C2C2C', marginBottom:6 }}>Video Consultation</h2>
              <p style={{ color:'#9C9C9C', fontSize:14, marginBottom:28 }}>Join your doctor's Google Meet session or enter the link they shared with you</p>

              {/* How it works */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:28 }}>
                {[
                  { step:'1', icon:'📅', title:'Book Appointment', desc:'Book through the home page — no account needed' },
                  { step:'2', icon:'🔗', title:'Get Meet Link', desc:'Your doctor will share a Google Meet link before your session' },
                  { step:'3', icon:'📹', title:'Join & Consult', desc:'Click "Join Meet" at your appointment time' },
                ].map((item,i) => (
                  <div key={i} style={{ ...S.card, textAlign:'center', padding:'24px 18px', animation:`fadeInUp 0.4s ease ${i*0.1}s both` }}>
                    <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#7D9B76,#B5CDB0)', color:'white', fontWeight:700, fontSize:15, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>{item.step}</div>
                    <div style={{ fontSize:26, marginBottom:8 }}>{item.icon}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#2C2C2C', marginBottom:5 }}>{item.title}</div>
                    <div style={{ fontSize:12, color:'#9C9C9C', lineHeight:1.6 }}>{item.desc}</div>
                  </div>
                ))}
              </div>

              {/* Manual meet link entry */}
              <div style={S.card}>
                <h3 style={{ fontSize:17, fontWeight:700, color:'#2C2C2C', marginBottom:6 }}>📹 Join via Meet Link</h3>
                <p style={{ fontSize:13, color:'#9C9C9C', marginBottom:18 }}>Paste the Google Meet link your doctor sent you</p>
                <div style={{ display:'flex', gap:12 }}>
                  <input type="text" placeholder="e.g. meet.google.com/abc-defg-hij" value={meetLink} onChange={e => setMeetLink(e.target.value)}
                    style={{ ...S.inp, flex:1 }} />
                  <button style={{ ...S.btn('#4A6B44'), whiteSpace:'nowrap' }} onClick={() => joinMeet(meetLink)}>
                    📹 Join Now
                  </button>
                </div>

                <div style={{ marginTop:24, padding:'18px', background:'rgba(125,155,118,0.07)', borderRadius:14 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#4A6B44', marginBottom:10 }}>💡 Before your video call</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {['✅ Test your camera and microphone','✅ Find a quiet, well-lit space','✅ Have your reports ready to show','✅ Write down your symptoms first','✅ Ensure stable internet connection','✅ Join 2-3 minutes early'].map((tip,i) => (
                      <div key={i} style={{ fontSize:12, color:'#5C5C5C' }}>{tip}</div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop:18 }}>
                  <button onClick={() => window.open('https://meet.google.com/new','_blank')}
                    style={{ ...S.btn('#FDFCFA','#5C5C5C'), border:'1.5px solid #EDE8E0', width:'100%', justifyContent:'center', display:'flex', alignItems:'center', gap:8 }}>
                    🔗 Create a new Google Meet (for doctors)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ════ TAB: HEALTH TIPS ════ */}
          {tab === 'tips' && (
            <div>
              <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:28, color:'#2C2C2C', marginBottom:6 }}>Health Tips</h2>
              <p style={{ color:'#9C9C9C', fontSize:14, marginBottom:24 }}>Simple habits for a healthier life</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16 }}>
                {healthTips.map((tip,i) => (
                  <div key={i} style={{ ...S.card, display:'flex', gap:16, alignItems:'flex-start', animation:`fadeInUp 0.4s ease ${i*0.07}s both` }}>
                    <div style={{ width:48, height:48, borderRadius:14, background:'rgba(125,155,118,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0 }}>{tip.icon}</div>
                    <div>
                      <div style={{ fontSize:15, fontWeight:700, color:'#2C2C2C', marginBottom:5 }}>{tip.title}</div>
                      <div style={{ fontSize:13, color:'#5C5C5C', lineHeight:1.7 }}>{tip.tip}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
