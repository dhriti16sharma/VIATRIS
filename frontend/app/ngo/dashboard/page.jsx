'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API = 'http://localhost:5000';

export default function NGODashboard() {
  const router = useRouter();

  // ── existing state ──────────────────────────────────────────────
  const [ngoProfile, setNgoProfile] = useState(null);
  const [helpRequests, setHelpRequests] = useState([]);
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // ── new state ───────────────────────────────────────────────────
  const [filterUrgency, setFilterUrgency] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedNotes, setExpandedNotes] = useState({});
  const [noteInputs, setNoteInputs] = useState({});
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [publicRequests, setPublicRequests] = useState([]);
  const [publicNoteInputs, setPublicNoteInputs] = useState({});
  const [expandedPublicNotes, setExpandedPublicNotes] = useState({});

  // ── auth guard (unchanged) ──────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.replace('/'); return; }
    const role = localStorage.getItem('userRole');
    if (role !== 'ngo') { router.replace('/'); return; }
    setAuthChecked(true);
    loadProfile();
    loadHelpRequests();
    loadPublicRequests();
  }, []);

  // ── auto-refresh every 30 s ─────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => { loadHelpRequests(); }, 30000);
    return () => clearInterval(interval);
  }, []);

  // ── seconds-ago counter ─────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsAgo(Math.round((new Date() - lastUpdated) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  // ── data loaders ────────────────────────────────────────────────
  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { router.replace('/'); return; }
      const response = await axios.get(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNgoProfile(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading profile:', error);
      if (error.response?.status === 401) {
        localStorage.clear();
        router.replace('/');
      }
    }
  };

  const loadPublicRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/help-requests/public-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPublicRequests(response.data.data || []);
    } catch (error) {
      console.error('Error loading public help requests:', error);
    }
  };

  const savePublicNotes = async (reqId) => {
    try {
      const token = localStorage.getItem('token');
      const { ngoNotes, actionTaken, status } = publicNoteInputs[reqId] || {};
      await axios.put(`${API}/api/help-requests/public-requests/${reqId}`,
        { ngoNotes, actionTaken, ...(status ? { status } : {}) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await loadPublicRequests();
      alert('✅ Notes saved!');
    } catch (err) {
      alert('Failed to save: ' + (err.response?.data?.message || err.message));
    }
  };

  const loadHelpRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/help-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHelpRequests(response.data.data || []);
      setLastUpdated(new Date());
      setSecondsAgo(0);
    } catch (error) {
      console.error('Error loading help requests:', error);
    }
  };

  // ── handlers ────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.clear();
    router.replace('/');
  };

  const toggleNotes = (reqId, req) => {
    const isExpanding = !expandedNotes[reqId];
    setExpandedNotes(prev => ({ ...prev, [reqId]: !prev[reqId] }));
    if (isExpanding && !noteInputs[reqId]) {
      setNoteInputs(prev => ({
        ...prev,
        [reqId]: {
          ngoNotes: req.ngoNotes || '',
          actionTaken: req.actionTaken || '',
          status: req.status || 'pending'
        }
      }));
    }
  };

  const saveNotes = async (reqId) => {
    try {
      const token = localStorage.getItem('token');
      const { ngoNotes, actionTaken, status } = noteInputs[reqId] || {};
      await axios.put(`${API}/api/help-requests/${reqId}`,
        { ngoNotes, actionTaken, ...(status ? { status } : {}) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await loadHelpRequests();
      alert('✅ Notes saved!');
    } catch (err) {
      alert('Failed to save: ' + (err.response?.data?.message || err.message));
    }
  };

  // ── style helpers ────────────────────────────────────────────────
  const urgencyStyle = (u) => ({
    display: 'inline-block', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
    background: u === 'low' ? '#D1F2EB' : u === 'medium' ? '#FFF3CD' : u === 'high' ? '#FDEBD0' : '#F8D7DA',
    color:      u === 'low' ? '#0C5460' : u === 'medium' ? '#856404' : u === 'high' ? '#784212' : '#721C24'
  });

  // ── translations ─────────────────────────────────────────────────
  const t = (key) => {
    const trans = {
      en: {
        // existing
        dashboard: 'NGO Dashboard',
        logout: 'Logout',
        requests: 'Help Requests',
        noRequests: 'No help requests yet',
        patient: 'Patient',
        problem: 'Problem',
        status: 'Status',
        amount: 'Amount',
        type: 'Assistance Type',
        // new
        totalRequests: 'Total Requests',
        pending: 'Pending',
        resolved: 'Resolved',
        highUrgency: 'High / Critical',
        urgency: 'Urgency',
        allUrgencies: 'All Urgencies',
        allStatuses: 'All Statuses',
        clearFilters: 'Clear Filters',
        showing: 'Showing',
        of: 'of',
        ngoNotes: 'NGO Notes',
        actionTaken: 'Action Taken',
        saveNotes: 'Save Notes',
        toggleNotes: 'Notes',
        contactedAt: 'First contacted',
        resolvedOn: 'Resolved on',
        autoRefresh: 'Auto-refreshing · Updated',
        secsAgo: 's ago',
        updateStatus: 'Update Status',
        noFiltersMatch: 'No requests match the current filters',
      },
      hi: {
        // existing
        dashboard: 'एनजीओ डैशबोर्ड',
        logout: 'लॉगआउट',
        requests: 'सहायता अनुरोध',
        noRequests: 'अभी तक कोई अनुरोध नहीं',
        patient: 'मरीज़',
        problem: 'समस्या',
        status: 'स्थिति',
        amount: 'राशि',
        type: 'सहायता प्रकार',
        // new
        totalRequests: 'कुल अनुरोध',
        pending: 'लंबित',
        resolved: 'हल किए गए',
        highUrgency: 'उच्च / गंभीर',
        urgency: 'तात्कालिकता',
        allUrgencies: 'सभी तात्कालिकताएं',
        allStatuses: 'सभी स्थितियां',
        clearFilters: 'फ़िल्टर साफ़ करें',
        showing: 'दिखा रहा है',
        of: 'में से',
        ngoNotes: 'एनजीओ नोट्स',
        actionTaken: 'की गई कार्रवाई',
        saveNotes: 'नोट्स सेव करें',
        toggleNotes: 'नोट्स',
        contactedAt: 'पहली बार संपर्क',
        resolvedOn: 'हल किया गया',
        autoRefresh: 'स्वतः-ताज़गी · अपडेट हुआ',
        secsAgo: 'सेकंड पहले',
        updateStatus: 'स्थिति अपडेट करें',
        noFiltersMatch: 'वर्तमान फ़िल्टर से कोई अनुरोध मेल नहीं खाता',
      }
    };
    return trans[language][key];
  };

  // ── computed ─────────────────────────────────────────────────────
  const filteredRequests = helpRequests
    .filter(r => filterUrgency === 'all' || r.urgency === filterUrgency)
    .filter(r => filterStatus  === 'all' || r.status   === filterStatus);

  // ── early returns ────────────────────────────────────────────────
  if (!authChecked) return null;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FDFCFA' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, color: '#7D9B76', marginBottom: 16 }}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FDFCFA', fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── HEADER ── */}
      <header style={{ background: 'white', borderBottom: '1px solid #E8E0D4', padding: '18px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

          {/* Logo / profile area — clickable → home */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }} onClick={() => router.push('/')}>
            {ngoProfile?.profileImage ? (
              <img src={`${API}${ngoProfile.profileImage}`} alt={ngoProfile.ngoName}
                style={{ width: 58, height: 58, borderRadius: '50%', objectFit: 'cover', border: '3px solid #7D9B76' }} />
            ) : (
              <div style={{ width: 58, height: 58, borderRadius: '50%', background: '#E8E0D4', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #7D9B76' }}>
                <span style={{ fontSize: 26, fontWeight: 'bold', color: '#7D9B76' }}>
                  {ngoProfile?.ngoName?.charAt(0) || '🤝'}
                </span>
              </div>
            )}
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: '#2C2C2C', margin: 0 }}>
                {ngoProfile?.ngoName || 'NGO Dashboard'}
              </h1>
              <p style={{ fontSize: 14, color: '#5C5C5C', margin: '4px 0 0 0' }}>
                {ngoProfile?.name}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              style={{ padding: '10px 16px', background: '#F2EDE3', color: '#5C5C5C', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
              {language === 'en' ? '🇮🇳 हिंदी' : '🇬🇧 English'}
            </button>
            <button
              onClick={handleLogout}
              style={{ padding: '10px 20px', background: '#E74C3C', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
              {t('logout')}
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>

        {/* ── STATS CARDS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginBottom: 28 }}>
          {[
            { label: t('totalRequests'), value: helpRequests.length + publicRequests.length },
            { label: t('pending'),       value: helpRequests.filter(r => r.status === 'pending').length + publicRequests.filter(r => r.status === 'pending').length },
            { label: t('resolved'),      value: helpRequests.filter(r => r.status === 'resolved').length + publicRequests.filter(r => r.status === 'resolved').length },
            { label: '🌐 Community',     value: publicRequests.length },
          ].map((s, i) => (
            <div key={i} style={{ background: 'white', borderRadius: 14, padding: '20px 24px', border: '1px solid #E8E0D4' }}>
              <p style={{ fontSize: 12, color: '#9C9C9C', margin: 0, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{s.label}</p>
              <p style={{ fontSize: 36, fontWeight: 700, color: '#2C2C2C', margin: '6px 0 0 0' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── COMMUNITY REQUESTS (from public patient portal) ── */}
        <div style={{ background: 'white', borderRadius: 16, padding: 32, border: '1px solid #E8E0D4', marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: '#2C2C2C', margin: 0 }}>🤝 Community Help Requests</h2>
              <p style={{ fontSize: 13, color: '#9C9C9C', margin: '4px 0 0 0' }}>Submitted via the public patient portal (no login required)</p>
            </div>
            <span style={{ fontSize: 12, color: '#9C9C9C' }}>{publicRequests.length} request{publicRequests.length !== 1 ? 's' : ''}</span>
          </div>

          {publicRequests.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9C9C9C', padding: '28px 0', fontSize: 14 }}>No community requests yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {publicRequests.map((req) => (
                <div key={req._id} style={{ background: '#FDFCFA', padding: 24, borderRadius: 12, border: '1px solid #E8E0D4' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 24px', fontSize: 14, color: '#5C5C5C', marginBottom: 10 }}>
                    <div><strong>Name:</strong> {req.name}</div>
                    <div><strong>Phone:</strong> {req.phone}</div>
                    {req.email && <div><strong>Email:</strong> {req.email}</div>}
                    <div><strong>Help Type:</strong> {req.helpType?.replace('_', ' ')}</div>
                    <div style={{ gridColumn: '1/-1' }}><strong>Message:</strong> {req.message}</div>
                    <div><strong>Submitted:</strong> {new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  </div>

                  <span style={{
                    display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: req.status === 'resolved' ? '#D1F2EB' : req.status === 'in-progress' ? '#D6EAF8' : '#FFF3CD',
                    color:      req.status === 'resolved' ? '#0C5460' : req.status === 'in-progress' ? '#1A5276' : '#856404'
                  }}>
                    {req.status?.replace('-', ' ').toUpperCase()}
                  </span>

                  <div style={{ marginTop: 14 }}>
                    <button onClick={() => {
                      const isExpanding = !expandedPublicNotes[req._id];
                      setExpandedPublicNotes(prev => ({ ...prev, [req._id]: !prev[req._id] }));
                      if (isExpanding && !publicNoteInputs[req._id]) {
                        setPublicNoteInputs(prev => ({ ...prev, [req._id]: { ngoNotes: req.ngoNotes || '', actionTaken: req.actionTaken || '', status: req.status || 'pending' } }));
                      }
                    }}
                      style={{ padding: '7px 14px', background: expandedPublicNotes[req._id] ? '#E8E0D4' : '#F2EDE3', color: '#5C5C5C', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                      📝 {t('toggleNotes')} {expandedPublicNotes[req._id] ? '▲' : '▼'}
                    </button>
                  </div>

                  {expandedPublicNotes[req._id] && (
                    <div style={{ marginTop: 14, padding: 18, background: 'white', borderRadius: 10, border: '1px solid #E8E0D4' }}>
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#5C5C5C', display: 'block', marginBottom: 5 }}>{t('ngoNotes')}</label>
                        <textarea
                          value={publicNoteInputs[req._id]?.ngoNotes || ''}
                          onChange={e => setPublicNoteInputs(prev => ({ ...prev, [req._id]: { ...prev[req._id], ngoNotes: e.target.value } }))}
                          placeholder="Add your notes..."
                          rows={3}
                          style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E8E0D4', borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans',sans-serif", resize: 'vertical', outline: 'none' }}
                        />
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#5C5C5C', display: 'block', marginBottom: 5 }}>{t('actionTaken')}</label>
                        <textarea
                          value={publicNoteInputs[req._id]?.actionTaken || ''}
                          onChange={e => setPublicNoteInputs(prev => ({ ...prev, [req._id]: { ...prev[req._id], actionTaken: e.target.value } }))}
                          placeholder="Describe the action taken..."
                          rows={3}
                          style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E8E0D4', borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans',sans-serif", resize: 'vertical', outline: 'none' }}
                        />
                      </div>
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#5C5C5C', display: 'block', marginBottom: 5 }}>{t('updateStatus')}</label>
                        <select
                          value={publicNoteInputs[req._id]?.status || req.status}
                          onChange={e => setPublicNoteInputs(prev => ({ ...prev, [req._id]: { ...prev[req._id], status: e.target.value } }))}
                          style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E8E0D4', borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: 'none' }}>
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </div>
                      <button onClick={() => savePublicNotes(req._id)}
                        style={{ padding: '9px 20px', background: '#7D9B76', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                        💾 {t('saveNotes')}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── REQUESTS PANEL ── */}
        <div style={{ background: 'white', borderRadius: 16, padding: 32, border: '1px solid #E8E0D4' }}>

          {/* Heading + auto-refresh indicator */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#2C2C2C', margin: 0 }}>{t('requests')}</h2>
            <span style={{ fontSize: 12, color: '#9C9C9C' }}>
              ⟳ {t('autoRefresh')} {secondsAgo}{t('secsAgo')}
            </span>
          </div>

          {/* Filter bar */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12, padding: '14px 16px', background: '#FDFCFA', borderRadius: 12, border: '1px solid #E8E0D4' }}>
            <select value={filterUrgency} onChange={e => setFilterUrgency(e.target.value)}
              style={{ padding: '8px 12px', border: '1.5px solid #E8E0D4', borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans',sans-serif", color: '#2C2C2C', background: 'white' }}>
              <option value="all">{t('allUrgencies')}</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              style={{ padding: '8px 12px', border: '1.5px solid #E8E0D4', borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans',sans-serif", color: '#2C2C2C', background: 'white' }}>
              <option value="all">{t('allStatuses')}</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button onClick={() => { setFilterUrgency('all'); setFilterStatus('all'); }}
              style={{ padding: '8px 14px', background: '#F2EDE3', color: '#5C5C5C', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {t('clearFilters')}
            </button>
            <span style={{ fontSize: 13, color: '#9C9C9C', marginLeft: 4 }}>
              {t('showing')} {filteredRequests.length} {t('of')} {helpRequests.length}
            </span>
          </div>

          {/* Request list */}
          {helpRequests.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#5C5C5C', padding: 32 }}>{t('noRequests')}</p>
          ) : filteredRequests.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#5C5C5C', padding: 32 }}>{t('noFiltersMatch')}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {filteredRequests.map((req) => (
                <div key={req._id} style={{ background: '#FDFCFA', padding: 24, borderRadius: 12, border: '1px solid #E8E0D4' }}>

                  {/* ── EXISTING CARD CONTENT (unchanged) ── */}
                  <div style={{ fontSize: 14, color: '#5C5C5C', marginBottom: 8 }}>
                    <strong>{t('patient')}:</strong> {req.patient?.name || 'N/A'}
                  </div>
                  <div style={{ fontSize: 14, color: '#5C5C5C', marginBottom: 8 }}>
                    <strong>{t('problem')}:</strong> {req.patient?.problemDescription || 'N/A'}
                  </div>
                  <div style={{ fontSize: 14, color: '#5C5C5C', marginBottom: 8 }}>
                    <strong>{t('type')}:</strong> {req.assistanceType || 'N/A'}
                  </div>
                  {req.amount && (
                    <div style={{ fontSize: 14, color: '#5C5C5C', marginBottom: 8 }}>
                      <strong>{t('amount')}:</strong> ₹{req.amount}
                    </div>
                  )}

                  {/* Status badge (existing) + urgency badge (new) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      display: 'inline-block', padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      background: req.status === 'pending' ? '#FFF3CD' : req.status === 'approved' ? '#D1F2EB' : '#F8D7DA',
                      color:      req.status === 'pending' ? '#856404' : req.status === 'approved' ? '#0C5460' : '#721C24'
                    }}>
                      {t('status')}: {req.status?.toUpperCase()}
                    </span>
                    {req.urgency && (
                      <span style={urgencyStyle(req.urgency)}>
                        {req.urgency.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Timestamps */}
                  {req.contactedAt && (
                    <div style={{ fontSize: 12, color: '#9C9C9C', marginTop: 8 }}>
                      📞 {t('contactedAt')}: {new Date(req.contactedAt).toLocaleDateString('en-IN')}
                    </div>
                  )}
                  {req.resolvedAt && (
                    <div style={{ fontSize: 12, color: '#9C9C9C', marginTop: 4 }}>
                      ✅ {t('resolvedOn')}: {new Date(req.resolvedAt).toLocaleDateString('en-IN')}
                    </div>
                  )}

                  {/* Notes toggle button */}
                  <div style={{ marginTop: 14 }}>
                    <button onClick={() => toggleNotes(req._id, req)}
                      style={{ padding: '7px 14px', background: expandedNotes[req._id] ? '#E8E0D4' : '#F2EDE3', color: '#5C5C5C', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                      📝 {t('toggleNotes')} {expandedNotes[req._id] ? '▲' : '▼'}
                    </button>
                  </div>

                  {/* Notes panel */}
                  {expandedNotes[req._id] && (
                    <div style={{ marginTop: 14, padding: 18, background: 'white', borderRadius: 10, border: '1px solid #E8E0D4' }}>
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#5C5C5C', display: 'block', marginBottom: 5 }}>{t('ngoNotes')}</label>
                        <textarea
                          value={noteInputs[req._id]?.ngoNotes || ''}
                          onChange={e => setNoteInputs(prev => ({ ...prev, [req._id]: { ...prev[req._id], ngoNotes: e.target.value } }))}
                          placeholder="Add your notes about this request..."
                          rows={3}
                          style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E8E0D4', borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans',sans-serif", resize: 'vertical', outline: 'none' }}
                        />
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#5C5C5C', display: 'block', marginBottom: 5 }}>{t('actionTaken')}</label>
                        <textarea
                          value={noteInputs[req._id]?.actionTaken || ''}
                          onChange={e => setNoteInputs(prev => ({ ...prev, [req._id]: { ...prev[req._id], actionTaken: e.target.value } }))}
                          placeholder="Describe the action taken..."
                          rows={3}
                          style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E8E0D4', borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans',sans-serif", resize: 'vertical', outline: 'none' }}
                        />
                      </div>
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#5C5C5C', display: 'block', marginBottom: 5 }}>{t('updateStatus')}</label>
                        <select
                          value={noteInputs[req._id]?.status || req.status || 'pending'}
                          onChange={e => setNoteInputs(prev => ({ ...prev, [req._id]: { ...prev[req._id], status: e.target.value } }))}
                          style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E8E0D4', borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: 'none' }}>
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                      <button onClick={() => saveNotes(req._id)}
                        style={{ padding: '9px 20px', background: '#7D9B76', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                        💾 {t('saveNotes')}
                      </button>
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
