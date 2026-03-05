'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function NGODashboard() {
  const router = useRouter();
  const [ngoProfile, setNgoProfile] = useState(null);
  const [helpRequests, setHelpRequests] = useState([]);
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
    loadHelpRequests();
  }, []);

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNgoProfile(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading profile:', error);
      if (error.response?.status === 401) {
        localStorage.clear();
        router.push('/');
      }
    }
  };

  const loadHelpRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/help-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHelpRequests(response.data.data || []);
    } catch (error) {
      console.error('Error loading help requests:', error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  const t = (key) => {
    const trans = {
      en: {
        dashboard: 'NGO Dashboard',
        logout: 'Logout',
        requests: 'Help Requests',
        noRequests: 'No help requests yet',
        patient: 'Patient',
        problem: 'Problem',
        status: 'Status',
        amount: 'Amount',
        type: 'Assistance Type'
      },
      hi: {
        dashboard: 'एनजीओ डैशबोर्ड',
        logout: 'लॉगआउट',
        requests: 'सहायता अनुरोध',
        noRequests: 'अभी तक कोई अनुरोध नहीं',
        patient: 'मरीज़',
        problem: 'समस्या',
        status: 'स्थिति',
        amount: 'राशि',
        type: 'सहायता प्रकार'
      }
    };
    return trans[language][key];
  };

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
      {/* Header */}
      <header style={{ background: 'white', borderBottom: '1px solid #E8E0D4', padding: '20px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#2C2C2C', margin: 0 }}>
              {ngoProfile?.ngoName || 'NGO Dashboard'}
            </h1>
            <p style={{ fontSize: 14, color: '#5C5C5C', margin: '4px 0 0 0' }}>
              {ngoProfile?.name}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              style={{ padding: '10px 16px', background: '#F2EDE3', color: '#5C5C5C', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
            >
              {language === 'en' ? '🇮🇳 हिंदी' : '🇬🇧 English'}
            </button>

            <button
              onClick={handleLogout}
              style={{ padding: '10px 20px', background: '#E74C3C', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
            >
              {t('logout')}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
        <div style={{ background: 'white', borderRadius: 16, padding: 32, border: '1px solid #E8E0D4' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#2C2C2C', marginBottom: 24 }}>{t('requests')}</h2>

          {helpRequests.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#5C5C5C', padding: 32 }}>{t('noRequests')}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {helpRequests.map((req) => (
                <div key={req._id} style={{ background: '#FDFCFA', padding: 24, borderRadius: 12, border: '1px solid #E8E0D4' }}>
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
                  <span style={{
                    display: 'inline-block',
                    marginTop: 8,
                    padding: '6px 12px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    background: req.status === 'pending' ? '#FFF3CD' : req.status === 'approved' ? '#D1F2EB' : '#F8D7DA',
                    color: req.status === 'pending' ? '#856404' : req.status === 'approved' ? '#0C5460' : '#721C24'
                  }}>
                    {t('status')}: {req.status?.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
