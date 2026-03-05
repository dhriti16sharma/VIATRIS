'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API = 'http://localhost:5000';

export default function DoctorDashboard() {
  const router = useRouter();
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [language, setLanguage] = useState('en');
  const [editingToken, setEditingToken] = useState(null);
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editMeetLink, setEditMeetLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('appointments');

  // Prescription state
  const [prescriptionFor, setPrescriptionFor] = useState(null); // token obj
  const [rxData, setRxData] = useState({ diagnosis: '', medications: '', instructions: '', followUp: '' });
  const [savedRx, setSavedRx] = useState({}); // { tokenId: rxData }

  // Patient reports state
  const [patientReports, setPatientReports] = useState({}); // { tokenId: [files] }
  const [viewingReportsFor, setViewingReportsFor] = useState(null);
  const reportInputRef = useRef();

  // ── Session timeout ──────────────────────────────────────────────
  useEffect(() => {
    let timeoutId;
    const SESSION_TIMEOUT = 30 * 60 * 1000;
    const resetTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        alert('Session expired due to inactivity');
        handleLogout();
      }, SESSION_TIMEOUT);
    };
    const events = ['click', 'keypress', 'scroll', 'mousemove'];
    events.forEach(e => document.addEventListener(e, resetTimeout));
    resetTimeout();
    return () => {
      clearTimeout(timeoutId);
      events.forEach(e => document.removeEventListener(e, resetTimeout));
    };
  }, []);

  useEffect(() => { loadProfile(); loadTokens(); }, []);

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/'); return; }
      const res = await axios.get(`${API}/api/auth/me`, getAuthHeader());
      setDoctorProfile(res.data.data);
      setLoading(false);
    } catch (err) {
      if (err.response?.status === 401) { localStorage.clear(); router.push('/'); }
    }
  };

  const loadTokens = async () => {
    try {
      const res = await axios.get(`${API}/api/tokens`, getAuthHeader());
      setTokens(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  const handleUpdateToken = async (tokenId, updates) => {
    try {
      await axios.put(`${API}/api/tokens/${tokenId}`, updates, getAuthHeader());
      setEditingToken(null);
      setEditNotes(''); setEditStatus(''); setEditMeetLink('');
      loadTokens();
      alert(language === 'en' ? '✅ Updated!' : '✅ अपडेट हो गया!');
    } catch (err) { alert('Update failed: ' + err.message); }
  };

  const handleDeleteToken = async (tokenId) => {
    if (!confirm('Delete this appointment?')) return;
    try {
      await axios.delete(`${API}/api/tokens/${tokenId}`, getAuthHeader());
      loadTokens();
    } catch (err) { alert('Delete failed: ' + err.message); }
  };

  const handleLogout = () => { localStorage.clear(); router.push('/'); };

  // ── Prescription handlers ────────────────────────────────────────
  const savePrescription = (tokenId) => {
    if (!rxData.diagnosis || !rxData.medications) {
      alert('Please fill in diagnosis and medications at minimum.');
      return;
    }
    setSavedRx(prev => ({ ...prev, [tokenId]: { ...rxData, savedAt: new Date().toLocaleString() } }));
    alert('✅ Prescription saved successfully!');
    setPrescriptionFor(null);
    setRxData({ diagnosis: '', medications: '', instructions: '', followUp: '' });
  };

  // ── Report upload handlers (client-side) ─────────────────────────
  const handleReportUpload = (tokenId, files) => {
    const newFiles = Array.from(files).map(f => ({
      name: f.name,
      size: (f.size / 1024).toFixed(1) + ' KB',
      type: f.type,
      url: URL.createObjectURL(f),
      uploadedAt: new Date().toLocaleString()
    }));
    setPatientReports(prev => ({
      ...prev,
      [tokenId]: [...(prev[tokenId] || []), ...newFiles]
    }));
    alert(`✅ ${newFiles.length} report(s) uploaded for ${tokens.find(t => t._id === tokenId)?.patient?.name}`);
  };

  const t = (key) => ({
    en: { dashboard:'Dashboard', logout:'Logout', tokens:'Patient Appointments', token:'Token', patient:'Patient', date:'Date', phone:'Phone', status:'Status', noTokens:'No appointments yet', confirm:'Confirm', complete:'Complete', edit:'Edit', delete:'Delete', save:'Save', cancel:'Cancel', notes:'Notes', total:'Total Appointments', today:'Today', address:'Address', email:'Email' },
    hi: { dashboard:'डैशबोर्ड', logout:'लॉगआउट', tokens:'मरीज़ अपॉइंटमेंट', token:'टोकन', patient:'मरीज़', date:'तारीख', phone:'फ़ोन', status:'स्थिति', noTokens:'अभी तक कोई अपॉइंटमेंट नहीं', confirm:'कन्फर्म', complete:'पूर्ण', edit:'संपादित', delete:'हटाएं', save:'सेव', cancel:'रद्द', notes:'नोट्स', total:'कुल अपॉइंटमेंट', today:'आज', address:'पता', email:'ईमेल' }
  }[language][key]);

  const statusStyle = (s) => ({
    display: 'inline-block', padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    background: s==='pending'?'#FFF3CD':s==='confirmed'?'#D1F2EB':s==='completed'?'#D1ECF1':'#F8D7DA',
    color: s==='pending'?'#856404':s==='confirmed'?'#0C5460':s==='completed'?'#004085':'#721C24'
  });

  const btn = (bg, color='white') => ({
    padding: '8px 14px', background: bg, color, border: 'none', borderRadius: 8,
    cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap'
  });

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#FDFCFA' }}>
      <div style={{ fontSize:24, color:'#7D9B76' }}>Loading...</div>
    </div>
  );

  if (!doctorProfile) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#FDFCFA' }}>
      <button onClick={() => router.push('/')} style={btn('#7D9B76')}>Go to Home</button>
    </div>
  );

  const tabs = [
    { id: 'appointments', label: '📅 Appointments', count: tokens.length },
    { id: 'prescriptions', label: '💊 Write Prescription' },
    { id: 'reports', label: '📁 Patient Reports', count: Object.values(patientReports).flat().length || null },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'#FDFCFA', fontFamily:"'DM Sans',sans-serif" }}>
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);} }
        .appt-card { transition: box-shadow 0.15s; }
        .appt-card:hover { box-shadow: 0 4px 20px rgba(44,44,44,0.09) !important; }
        textarea:focus, input:focus, select:focus { outline: none; border-color: #7D9B76 !important; box-shadow: 0 0 0 3px rgba(125,155,118,0.12); }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{ background:'white', borderBottom:'1px solid #E8E0D4', padding:'18px 0' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            {doctorProfile.profileImage ? (
              <img src={`${API}${doctorProfile.profileImage}`} alt={doctorProfile.name}
                style={{ width:58, height:58, borderRadius:'50%', objectFit:'cover', border:'3px solid #7D9B76' }} />
            ) : (
              <div style={{ width:58, height:58, borderRadius:'50%', background:'#E8E0D4', display:'flex', alignItems:'center', justifyContent:'center', border:'3px solid #7D9B76' }}>
                <span style={{ fontSize:26, fontWeight:'bold', color:'#7D9B76' }}>{doctorProfile.name?.charAt(0)}</span>
              </div>
            )}
            <div>
              <h1 style={{ fontSize:26, fontWeight:700, color:'#2C2C2C', margin:0, fontFamily:"'DM Serif Display',serif" }}>Dr. {doctorProfile.name}</h1>
              <p style={{ fontSize:13, color:'#5C5C5C', margin:'3px 0 0 0' }}>{doctorProfile.specialization} • {doctorProfile.experience} years exp.</p>
            </div>
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <button onClick={() => setLanguage(l => l==='en'?'hi':'en')}
              style={{ padding:'9px 14px', background:'#F2EDE3', color:'#5C5C5C', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:13 }}>
              {language==='en'?'🇮🇳 हिंदी':'🇬🇧 English'}
            </button>
            <button onClick={handleLogout}
              style={{ padding:'9px 18px', background:'#E74C3C', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:13 }}>
              {t('logout')}
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'28px 24px' }}>

        {/* ── STATS ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, marginBottom:28 }}>
          {[
            { label: t('total'), value: tokens.length, color: '#2C2C2C' },
            { label: t('today'), value: tokens.filter(t => new Date(t.appointmentDate).toDateString()===new Date().toDateString()).length, color: '#2C2C2C' },
            { label: 'Experience', value: `${doctorProfile.experience||0} yrs`, color: '#7D9B76' },
          ].map((s,i) => (
            <div key={i} style={{ background:'white', borderRadius:14, padding:'20px 24px', border:'1px solid #E8E0D4' }}>
              <p style={{ fontSize:12, color:'#9C9C9C', margin:0, fontWeight:600, letterSpacing:'0.04em', textTransform:'uppercase' }}>{s.label}</p>
              <p style={{ fontSize:36, fontWeight:700, color:s.color, margin:'6px 0 0 0' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── TABS ── */}
        <div style={{ display:'flex', gap:4, marginBottom:24, background:'white', padding:6, borderRadius:14, border:'1px solid #E8E0D4', width:'fit-content' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ padding:'9px 20px', borderRadius:10, border:'none', cursor:'pointer', fontSize:14, fontWeight: activeTab===tab.id?600:400,
                background: activeTab===tab.id?'#7D9B76':'transparent',
                color: activeTab===tab.id?'white':'#5C5C5C',
                display:'flex', alignItems:'center', gap:6 }}>
              {tab.label}
              {tab.count != null && tab.count > 0 && (
                <span style={{ background: activeTab===tab.id?'rgba(255,255,255,0.3)':'#7D9B76', color: activeTab===tab.id?'white':'white',
                  borderRadius:10, padding:'1px 7px', fontSize:11, fontWeight:700 }}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════
            TAB: APPOINTMENTS
        ════════════════════════════════════════════════════════ */}
        {activeTab === 'appointments' && (
          <div style={{ background:'white', borderRadius:16, padding:28, border:'1px solid #E8E0D4', animation:'fadeIn 0.3s ease' }}>
            <h2 style={{ fontSize:22, fontWeight:700, color:'#2C2C2C', marginBottom:20, fontFamily:"'DM Serif Display',serif" }}>{t('tokens')}</h2>

            {tokens.length === 0 ? (
              <div style={{ textAlign:'center', padding:'48px 0', color:'#9C9C9C' }}>
                <div style={{ fontSize:44, marginBottom:12 }}>📋</div>
                <p style={{ fontSize:16 }}>{t('noTokens')}</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {tokens.map((tkn) => (
                  <div key={tkn._id} className="appt-card"
                    style={{ background:'#FDFCFA', padding:'20px 22px', borderRadius:12, border:'1px solid #E8E0D4' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16 }}>

                      {/* Patient info */}
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                          <div style={{ width:38, height:38, borderRadius:10, background:'linear-gradient(135deg,#B5CDB0,#7D9B76)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <span style={{ color:'white', fontWeight:700, fontSize:16 }}>{tkn.tokenNumber}</span>
                          </div>
                          <div>
                            <span style={{ fontSize:16, fontWeight:700, color:'#2C2C2C' }}>Token #{tkn.tokenNumber} — {tkn.patient?.name}</span>
                            {savedRx[tkn._id] && <span style={{ marginLeft:8, fontSize:11, background:'#E6F4EA', color:'#276749', padding:'2px 8px', borderRadius:8, fontWeight:600 }}>💊 Rx Written</span>}
                            {patientReports[tkn._id]?.length > 0 && <span style={{ marginLeft:6, fontSize:11, background:'#E8F4FD', color:'#1A6BA0', padding:'2px 8px', borderRadius:8, fontWeight:600 }}>📁 {patientReports[tkn._id].length} Reports</span>}
                          </div>
                        </div>

                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 20px', fontSize:13, color:'#5C5C5C', marginBottom:8 }}>
                          <div>📞 {tkn.patient?.phone}</div>
                          <div>📅 {new Date(tkn.appointmentDate).toLocaleDateString()}</div>
                          {tkn.patient?.email && <div>✉️ {tkn.patient.email}</div>}
                          {tkn.patient?.address && <div>📍 {tkn.patient.address}</div>}
                        </div>

                        {editingToken === tkn._id ? (
                          <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:8 }}>
                            <textarea value={editNotes} onChange={e=>setEditNotes(e.target.value)}
                              placeholder="Notes about this patient..."
                              style={{ width:'100%', padding:10, border:'1.5px solid #E8E0D4', borderRadius:8, fontSize:13, fontFamily:"'DM Sans',sans-serif", minHeight:70, resize:'vertical' }} />
                            <input type="text" value={editMeetLink} onChange={e=>setEditMeetLink(e.target.value)}
                              placeholder="📹 Meet link (meet.google.com/abc-xyz)"
                              style={{ width:'100%', padding:10, border:'1.5px solid #E8E0D4', borderRadius:8, fontSize:13, fontFamily:"'DM Sans',sans-serif" }} />
                            <select value={editStatus} onChange={e=>setEditStatus(e.target.value)}
                              style={{ width:'100%', padding:10, border:'1.5px solid #E8E0D4', borderRadius:8, fontSize:13 }}>
                              <option value="">-- Change Status --</option>
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        ) : (
                          <>
                            {tkn.notes && <div style={{ fontSize:13, color:'#5C5C5C', marginTop:8, padding:'8px 12px', background:'white', borderRadius:8, border:'1px solid #EDE8E0' }}>📝 {tkn.notes}</div>}
                            {tkn.meetLink && (
                              <div style={{ fontSize:12, color:'#4A6B44', marginTop:6, padding:'7px 12px', background:'rgba(125,155,118,0.08)', borderRadius:8 }}>
                                📹 Meet: <a href={tkn.meetLink.startsWith('http')?tkn.meetLink:`https://${tkn.meetLink}`} target="_blank" rel="noreferrer" style={{ color:'#4A6B44' }}>{tkn.meetLink}</a>
                              </div>
                            )}
                          </>
                        )}

                        <div style={{ marginTop:10 }}>
                          <span style={statusStyle(tkn.status)}>{tkn.status?.toUpperCase()}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display:'flex', flexDirection:'column', gap:7, minWidth:130 }}>
                        {editingToken === tkn._id ? (
                          <>
                            <button onClick={() => handleUpdateToken(tkn._id, { notes:editNotes, meetLink:editMeetLink, ...(editStatus&&{status:editStatus}) })} style={btn('#7D9B76')}>✓ {t('save')}</button>
                            <button onClick={() => { setEditingToken(null); setEditNotes(''); setEditStatus(''); setEditMeetLink(''); }} style={btn('#E8E0D4','#5C5C5C')}>{t('cancel')}</button>
                          </>
                        ) : (
                          <>
                            {tkn.status==='pending' && <button onClick={() => handleUpdateToken(tkn._id,{status:'confirmed'})} style={btn('#28A745')}>✓ Confirm</button>}
                            {tkn.status==='confirmed' && <button onClick={() => handleUpdateToken(tkn._id,{status:'completed'})} style={btn('#007BFF')}>✓ Complete</button>}

                            <button onClick={() => { const l=prompt('Google Meet link:',tkn.meetLink||''); if(l!==null&&l.trim()) handleUpdateToken(tkn._id,{meetLink:l.trim(),notes:tkn.notes||'',status:tkn.status}); }}
                              style={btn('#4A6B44')}>🔗 {tkn.meetLink?'Update Meet':'Set Meet'}</button>
                            <button onClick={() => tkn.meetLink ? window.open(tkn.meetLink.startsWith('http')?tkn.meetLink:`https://${tkn.meetLink}`,'_blank') : window.open('https://meet.google.com/new','_blank')}
                              style={btn('#1a73e8')}>📹 {tkn.meetLink?'Join Meet':'New Meet'}</button>

                            <button onClick={() => { setPrescriptionFor(tkn); setRxData(savedRx[tkn._id]||{diagnosis:'',medications:'',instructions:'',followUp:''}); setActiveTab('prescriptions'); }}
                              style={btn('#8B6F52')}>💊 Write Rx</button>

                            <button onClick={() => { setViewingReportsFor(tkn._id); setActiveTab('reports'); }}
                              style={btn('#5C7A9B')}>📁 Reports {patientReports[tkn._id]?.length ? `(${patientReports[tkn._id].length})` : ''}</button>

                            <button onClick={() => { setEditingToken(tkn._id); setEditNotes(tkn.notes||''); setEditStatus(tkn.status||''); setEditMeetLink(tkn.meetLink||''); }}
                              style={btn('#FFC107')}>✎ Edit</button>
                            <button onClick={() => handleDeleteToken(tkn._id)} style={btn('#DC3545')}>✗ Delete</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════
            TAB: WRITE PRESCRIPTION
        ════════════════════════════════════════════════════════ */}
        {activeTab === 'prescriptions' && (
          <div style={{ animation:'fadeIn 0.3s ease' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

              {/* Prescription form */}
              <div style={{ background:'white', borderRadius:16, padding:28, border:'1px solid #E8E0D4' }}>
                <h2 style={{ fontSize:22, fontWeight:700, color:'#2C2C2C', marginBottom:6, fontFamily:"'DM Serif Display',serif" }}>💊 Write Prescription</h2>

                {/* Patient selector */}
                <div style={{ marginBottom:18 }}>
                  <label style={{ fontSize:13, fontWeight:600, color:'#5C5C5C', display:'block', marginBottom:6 }}>Select Patient</label>
                  <select value={prescriptionFor?._id||''} onChange={e => { const tkn=tokens.find(t=>t._id===e.target.value); setPrescriptionFor(tkn||null); if(tkn) setRxData(savedRx[tkn._id]||{diagnosis:'',medications:'',instructions:'',followUp:''}); }}
                    style={{ width:'100%', padding:'11px 14px', border:'1.5px solid #E8E0D4', borderRadius:10, fontSize:14, fontFamily:"'DM Sans',sans-serif" }}>
                    <option value="">-- Select appointment --</option>
                    {tokens.map(tkn => <option key={tkn._id} value={tkn._id}>Token #{tkn.tokenNumber} — {tkn.patient?.name} ({new Date(tkn.appointmentDate).toLocaleDateString()})</option>)}
                  </select>
                </div>

                {prescriptionFor && (
                  <>
                    {/* Patient summary */}
                    <div style={{ padding:'12px 16px', background:'rgba(125,155,118,0.07)', borderRadius:10, marginBottom:18, fontSize:13, color:'#5C5C5C' }}>
                      <strong style={{ color:'#2C2C2C' }}>{prescriptionFor.patient?.name}</strong> · {prescriptionFor.patient?.phone} · Token #{prescriptionFor.tokenNumber}
                    </div>

                    {[
                      { key:'diagnosis', label:'Diagnosis / Chief Complaint *', placeholder:'e.g. Hypertension, Type 2 Diabetes', type:'textarea' },
                      { key:'medications', label:'Medications & Dosage *', placeholder:'e.g.\nTab. Metformin 500mg — 1 tab twice daily after meals\nTab. Amlodipine 5mg — 1 tab once daily', type:'textarea' },
                      { key:'instructions', label:'Instructions & Advice', placeholder:'e.g. Avoid salt, drink 3L water daily, 30 min walk', type:'textarea' },
                      { key:'followUp', label:'Follow-up Date', placeholder:'', type:'date' },
                    ].map(f => (
                      <div key={f.key} style={{ marginBottom:14 }}>
                        <label style={{ fontSize:13, fontWeight:600, color:'#5C5C5C', display:'block', marginBottom:5 }}>{f.label}</label>
                        {f.type==='textarea' ? (
                          <textarea value={rxData[f.key]} onChange={e=>setRxData(r=>({...r,[f.key]:e.target.value}))}
                            placeholder={f.placeholder} rows={f.key==='medications'?4:2}
                            style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #E8E0D4', borderRadius:10, fontSize:13, fontFamily:"'DM Sans',sans-serif", resize:'vertical' }} />
                        ) : (
                          <input type="date" value={rxData[f.key]} onChange={e=>setRxData(r=>({...r,[f.key]:e.target.value}))}
                            style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #E8E0D4', borderRadius:10, fontSize:13, fontFamily:"'DM Sans',sans-serif" }} />
                        )}
                      </div>
                    ))}

                    <div style={{ display:'flex', gap:10, marginTop:6 }}>
                      <button onClick={() => savePrescription(prescriptionFor._id)} style={{ ...btn('#7D9B76'), flex:1, padding:'12px', fontSize:14 }}>
                        💾 Save Prescription
                      </button>
                      <button onClick={() => { setPrescriptionFor(null); setRxData({diagnosis:'',medications:'',instructions:'',followUp:''}); }} style={btn('#E8E0D4','#5C5C5C')}>
                        Clear
                      </button>
                    </div>
                  </>
                )}

                {!prescriptionFor && (
                  <div style={{ textAlign:'center', padding:'40px 0', color:'#9C9C9C' }}>
                    <div style={{ fontSize:40, marginBottom:10 }}>💊</div>
                    <p>Select a patient appointment above to write their prescription</p>
                  </div>
                )}
              </div>

              {/* Saved prescriptions list */}
              <div style={{ background:'white', borderRadius:16, padding:28, border:'1px solid #E8E0D4' }}>
                <h2 style={{ fontSize:22, fontWeight:700, color:'#2C2C2C', marginBottom:20, fontFamily:"'DM Serif Display',serif" }}>📋 Saved Prescriptions</h2>

                {Object.keys(savedRx).length === 0 ? (
                  <div style={{ textAlign:'center', padding:'40px 0', color:'#9C9C9C' }}>
                    <div style={{ fontSize:40, marginBottom:10 }}>📋</div>
                    <p>No prescriptions written yet</p>
                  </div>
                ) : (
                  Object.entries(savedRx).map(([tokenId, rx]) => {
                    const tkn = tokens.find(t => t._id === tokenId);
                    return (
                      <div key={tokenId} style={{ padding:'16px', background:'#FDFCFA', borderRadius:12, border:'1px solid #E8E0D4', marginBottom:12 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                          <div>
                            <div style={{ fontWeight:700, fontSize:15, color:'#2C2C2C' }}>{tkn?.patient?.name || 'Unknown Patient'}</div>
                            <div style={{ fontSize:12, color:'#9C9C9C' }}>Token #{tkn?.tokenNumber} · {rx.savedAt}</div>
                          </div>
                          <button onClick={() => { setPrescriptionFor(tkn); setRxData(rx); }}
                            style={{ ...btn('#F2EDE3','#5C5C5C'), fontSize:12, padding:'5px 10px' }}>✎ Edit</button>
                        </div>
                        <div style={{ fontSize:13, color:'#2C2C2C', marginBottom:4 }}><strong>Dx:</strong> {rx.diagnosis}</div>
                        <div style={{ fontSize:12, color:'#5C5C5C', whiteSpace:'pre-line', marginBottom:4 }}><strong>Rx:</strong> {rx.medications}</div>
                        {rx.instructions && <div style={{ fontSize:12, color:'#5C5C5C' }}><strong>Instructions:</strong> {rx.instructions}</div>}
                        {rx.followUp && <div style={{ fontSize:12, color:'#7D9B76', marginTop:4 }}>📅 Follow-up: {new Date(rx.followUp).toLocaleDateString()}</div>}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════
            TAB: PATIENT REPORTS
        ════════════════════════════════════════════════════════ */}
        {activeTab === 'reports' && (
          <div style={{ animation:'fadeIn 0.3s ease' }}>
            <div style={{ background:'white', borderRadius:16, padding:28, border:'1px solid #E8E0D4', marginBottom:20 }}>
              <h2 style={{ fontSize:22, fontWeight:700, color:'#2C2C2C', marginBottom:6, fontFamily:"'DM Serif Display',serif" }}>📁 Patient Reports & Uploads</h2>
              <p style={{ color:'#9C9C9C', fontSize:13, marginBottom:20 }}>View reports uploaded by patients, or upload scanned documents on their behalf</p>

              {/* Patient selector */}
              <div style={{ marginBottom:20 }}>
                <label style={{ fontSize:13, fontWeight:600, color:'#5C5C5C', display:'block', marginBottom:6 }}>Select Patient to View Reports</label>
                <select value={viewingReportsFor||''} onChange={e => setViewingReportsFor(e.target.value||null)}
                  style={{ width:'100%', padding:'11px 14px', border:'1.5px solid #E8E0D4', borderRadius:10, fontSize:14, fontFamily:"'DM Sans',sans-serif" }}>
                  <option value="">-- Select patient --</option>
                  {tokens.map(tkn => (
                    <option key={tkn._id} value={tkn._id}>
                      Token #{tkn.tokenNumber} — {tkn.patient?.name} {patientReports[tkn._id]?.length ? `(${patientReports[tkn._id].length} files)` : '(no files yet)'}
                    </option>
                  ))}
                </select>
              </div>

              {viewingReportsFor && (
                <>
                  {/* Upload area for doctor */}
                  <div onClick={() => reportInputRef.current?.click()}
                    style={{ border:'2px dashed #DDD5C8', borderRadius:12, padding:'24px', textAlign:'center', cursor:'pointer', marginBottom:20, background:'#FDFCFA' }}>
                    <div style={{ fontSize:32, marginBottom:6 }}>📤</div>
                    <p style={{ fontSize:14, color:'#5C5C5C', margin:0 }}>Upload additional reports for this patient</p>
                    <p style={{ fontSize:12, color:'#9C9C9C', margin:'4px 0 0 0' }}>X-rays, lab results, scans — JPG, PNG, PDF</p>
                    <input ref={reportInputRef} type="file" multiple accept="image/*,.pdf"
                      onChange={e => handleReportUpload(viewingReportsFor, e.target.files)}
                      style={{ display:'none' }} />
                  </div>

                  {/* Reports grid */}
                  {!patientReports[viewingReportsFor]?.length ? (
                    <div style={{ textAlign:'center', padding:'32px 0', color:'#9C9C9C' }}>
                      <div style={{ fontSize:36, marginBottom:8 }}>📂</div>
                      <p>No reports uploaded yet for this patient</p>
                      <p style={{ fontSize:12 }}>Patient can upload from the Patient Portal, or you can upload above</p>
                    </div>
                  ) : (
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:14 }}>
                      {patientReports[viewingReportsFor].map((file, i) => (
                        <div key={i} style={{ background:'#FDFCFA', border:'1.5px solid #E8E0D4', borderRadius:12, overflow:'hidden' }}>
                          {file.type?.startsWith('image/') ? (
                            <img src={file.url} alt={file.name} style={{ width:'100%', height:110, objectFit:'cover', display:'block', cursor:'pointer' }}
                              onClick={() => window.open(file.url,'_blank')} />
                          ) : (
                            <div style={{ width:'100%', height:110, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#F2EDE3', cursor:'pointer' }}
                              onClick={() => window.open(file.url,'_blank')}>
                              <span style={{ fontSize:36 }}>📄</span>
                              <span style={{ fontSize:10, color:'#5C5C5C', marginTop:4 }}>PDF</span>
                            </div>
                          )}
                          <div style={{ padding:'8px 10px' }}>
                            <div style={{ fontSize:11, color:'#5C5C5C', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{file.name}</div>
                            <div style={{ fontSize:10, color:'#9C9C9C', marginTop:2 }}>{file.size}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {!viewingReportsFor && (
                <div style={{ textAlign:'center', padding:'40px 0', color:'#9C9C9C' }}>
                  <div style={{ fontSize:40, marginBottom:10 }}>📁</div>
                  <p>Select a patient above to view their uploaded reports</p>
                </div>
              )}
            </div>

            {/* Summary across all patients */}
            {Object.keys(patientReports).length > 0 && (
              <div style={{ background:'white', borderRadius:16, padding:24, border:'1px solid #E8E0D4' }}>
                <h3 style={{ fontSize:16, fontWeight:700, color:'#2C2C2C', marginBottom:14 }}>All Patients with Reports</h3>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {Object.entries(patientReports).map(([tokenId, files]) => {
                    const tkn = tokens.find(t => t._id === tokenId);
                    return (
                      <div key={tokenId} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'#FDFCFA', borderRadius:10, border:'1px solid #EDE8E0' }}>
                        <div>
                          <span style={{ fontWeight:600, fontSize:14, color:'#2C2C2C' }}>{tkn?.patient?.name}</span>
                          <span style={{ fontSize:12, color:'#9C9C9C', marginLeft:8 }}>Token #{tkn?.tokenNumber}</span>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ fontSize:13, color:'#5C5C5C' }}>{files.length} file{files.length!==1?'s':''}</span>
                          <button onClick={() => setViewingReportsFor(tokenId)}
                            style={{ ...btn('#5C7A9B'), padding:'5px 12px', fontSize:12 }}>View</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Session timeout notice */}
        <div style={{ marginTop:20, padding:'12px 16px', background:'#E3F2FD', border:'1px solid #90CAF9', borderRadius:10 }}>
          <p style={{ fontSize:12, color:'#1976D2', margin:0 }}>
            🔒 {language==='en' ? 'Session auto-logs out after 30 minutes of inactivity.' : 'सुरक्षा के लिए 30 मिनट निष्क्रियता के बाद सत्र समाप्त।'}
          </p>
        </div>
      </div>
    </div>
  );
}
