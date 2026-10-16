import { useState, useEffect, useRef } from 'react';

export default function App() {
  const [activeTab, setActiveTab] = useState('citizen');
  const [language, setLanguage] = useState('mr-IN');
  const [transcript, setTranscript] = useState('');
  const [citizenName, setCitizenName] = useState('संजय गायकवाड');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [adminInquiries, setAdminInquiries] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const recognitionRef = useRef(null);

  const demoPrompts = [
    {
      label: '🌾 Farmer (2 Acres)',
      text: 'माझ्याकडे २ एकर कोरडवाहू शेती आहे आणि मला वार्षिक खत-बियाणे मदतीची योजना हवी आहे.',
    },
    {
      label: '👧 Girl Child Support',
      text: 'माझ्या मुलीचे वय ५ वर्षे आहे, तिच्या शिक्षणासाठी आणि भविष्यासाठी कोणती योजना आहे?',
    },
    {
      label: '🏠 Rural Housing Aid',
      text: 'माझे घर कच्चे आहे, नवीन पक्के घर बांधण्यासाठी सरकारी अनुदान कसे मिळेल?',
    },
    {
      label: '👵 Destitute / Widow Pension',
      text: 'मी निराधार विधवा महिला आहे, मला जगण्यासाठी दरमहा सरकारी पेन्शनची मदत हवी आहे.',
    },
  ];

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = language;

      recog.onresult = (event) => {
        if (event.results && event.results[0] && event.results[0][0]) {
          const text = event.results[0][0].transcript;
          setTranscript(text);
          setErrorMessage('');
        }
        setIsRecording(false);
      };

      recog.onerror = () => setIsRecording(false);
      recog.onend = () => setIsRecording(false);
      recognitionRef.current = recog;
    }
  }, [language]);

  const handleRefreshInquiries = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/admin/inquiries');
      if (res.ok) {
        const data = await res.json();
        setAdminInquiries(Array.isArray(data.inquiries) ? data.inquiries : []);
      }
    } catch {
      // Backend silent catch
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (activeTab === 'admin') {
      fetch('http://localhost:8000/api/admin/inquiries')
        .then((res) => (res.ok ? res.json() : Promise.reject(res)))
        .then((data) => {
          if (isMounted) {
            setAdminInquiries(Array.isArray(data.inquiries) ? data.inquiries : []);
          }
        })
        .catch(() => {
          if (isMounted) {
            setAdminInquiries([]);
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  const toggleRecording = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage('Speech recognition is not supported in this browser. Please use Google Chrome.');
      return;
    }

    if (!recognitionRef.current) {
      setErrorMessage('Speech recognition initialization failed. Please reload the page.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setTranscript('');
      setErrorMessage('');
      recognitionRef.current.lang = language;
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch {
        setIsRecording(false);
      }
    }
  };

  const handleConsult = async () => {
    if (!transcript.trim()) return;
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('http://localhost:8000/api/match-schemes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query_text: transcript,
          language,
          citizen_name: citizenName.trim() || 'Anonymous Citizen',
          village: 'Talegaon Dabhade GP',
        }),
      });

      if (!res.ok) {
        throw new Error('Server response error');
      }

      const data = await res.json();
      setResult(data);
    } catch {
      setErrorMessage('Backend server is not reachable. Ensure FastAPI is running on http://localhost:8000');
    } finally {
      setLoading(false);
    }
  };

  const handleResetQuery = () => {
    setTranscript('');
    setResult(null);
    setErrorMessage('');
    if (isSpeaking && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const updateStatus = async (inquiryId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:8000/api/admin/inquiries/${inquiryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        handleRefreshInquiries();
      }
    } catch {
      setErrorMessage('Failed to update inquiry status');
    }
  };

  const speakResponse = (text) => {
    if (!window.speechSynthesis) {
      setErrorMessage('Audio playback is not supported on this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handlePrintSlip = () => {
    window.print();
  };

  const matchedSchemes = Array.isArray(result?.matched_schemes)
    ? result.matched_schemes
    : [];

  const filteredInquiries = adminInquiries.filter((inq) => {
    const term = searchFilter.toLowerCase();
    return (
      (inq.citizen_name || '').toLowerCase().includes(term) ||
      (inq.village || '').toLowerCase().includes(term) ||
      (inq.matched_scheme || '').toLowerCase().includes(term) ||
      (inq.id || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans p-4 md:p-10">
      {/* Top Header */}
      <header className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 print:hidden">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🇮🇳</span>
            <div>
              <h1 className="text-2xl font-extrabold text-emerald-800 tracking-tight">GramSeva AI</h1>
              <p className="text-slate-500 text-xs">Public Welfare &amp; Gram Panchayat Digital Desk</p>
            </div>
          </div>
        </div>

        {/* Tab Switcher & Language Dropdown */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-xl flex border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('citizen')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
                activeTab === 'citizen'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Citizen Voice Desk
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Panchayat Officer View
            </button>
          </div>

          {activeTab === 'citizen' && (
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="border border-slate-300 rounded-xl p-2 text-sm font-medium bg-white shadow-sm focus:outline-emerald-600 cursor-pointer"
            >
              <option value="mr-IN">मराठी (Marathi)</option>
              <option value="hi-IN">हिन्दी (Hindi)</option>
              <option value="en-IN">English (India)</option>
            </select>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto mt-6">
        {activeTab === 'citizen' ? (
          <div className="grid gap-6">
            {/* Input Card */}
            <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 print:hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Voice Assistance &amp; Scheme Discovery</h2>
                  <p className="text-sm text-slate-500">Speak or select a demo scenario to discover eligible welfare programs.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Citizen Name:</span>
                  <input
                    type="text"
                    value={citizenName}
                    onChange={(e) => setCitizenName(e.target.value)}
                    className="border border-slate-300 rounded-lg px-2.5 py-1 text-sm font-medium w-44 outline-emerald-600"
                  />
                </div>
              </div>

              {/* Demo Pills */}
              <div className="mb-6">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Quick Demo Scenarios (One-Click):
                </span>
                <div className="flex flex-wrap gap-2">
                  {demoPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setTranscript(p.text);
                        setErrorMessage('');
                      }}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200 rounded-lg text-xs font-medium transition cursor-pointer text-slate-700"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mic Area */}
              <div className="text-center py-2">
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto text-white text-3xl transition-transform active:scale-95 shadow-md cursor-pointer ${
                    isRecording ? 'bg-red-500 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isRecording ? '⏹' : '🎤'}
                </button>
                <p className="text-sm font-semibold mt-3 text-slate-600">
                  {isRecording ? 'Listening... Speak in Marathi/Hindi' : 'Click Mic to Speak'}
                </p>
              </div>

              <textarea
                value={transcript}
                onChange={(e) => {
                  setTranscript(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="Spoken words will transcribe here automatically, or you can type directly..."
                className="w-full mt-5 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-700 h-24"
              />

              {errorMessage && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium flex items-center justify-between">
                  <span>⚠️ {errorMessage}</span>
                  <button
                    type="button"
                    onClick={() => setErrorMessage('')}
                    className="text-red-500 hover:text-red-700 font-bold ml-2 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={handleConsult}
                  disabled={loading || !transcript.trim()}
                  className="flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl disabled:opacity-50 transition shadow cursor-pointer text-sm"
                >
                  {loading ? 'Evaluating Scheme Eligibility Engine...' : 'Submit & Find Eligible Schemes'}
                </button>
                {(transcript || result) && (
                  <button
                    type="button"
                    onClick={handleResetQuery}
                    className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition cursor-pointer text-sm"
                  >
                    Reset
                  </button>
                )}
              </div>
            </section>

            {/* Advisory & Results */}
            {result && (
              <section className="space-y-6">
                <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl shadow-sm">
                  <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
                    <h2 className="text-emerald-950 font-bold text-lg flex items-center gap-2">
                      📢 Official Advisory
                    </h2>
                    <div className="flex items-center gap-2 print:hidden">
                      <button
                        type="button"
                        onClick={handlePrintSlip}
                        className="px-3.5 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                      >
                        🖨️ Print Slip
                      </button>
                      <button
                        type="button"
                        onClick={() => speakResponse(result.voice_response || '')}
                        className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow cursor-pointer transition"
                      >
                        {isSpeaking ? '⏹ Stop Audio' : '🔊 Listen to Advisory'}
                      </button>
                    </div>
                  </div>
                  <p className="text-emerald-950 font-medium text-base leading-relaxed">
                    {result.voice_response || 'No advisory text available.'}
                  </p>
                </div>

                {/* Slip Header (Only visible when printing) */}
                <div className="hidden print:block p-4 border-b-2 border-slate-800 mb-4">
                  <h2 className="text-xl font-bold">GramSeva AI - Citizen Scheme Verification Slip</h2>
                  <p className="text-sm">
                    Citizen: {citizenName} | Talegaon Dabhade Gram Panchayat | Date: {new Date().toLocaleDateString()}
                  </p>
                </div>

                {/* Scheme Cards */}
                <div className="grid md:grid-cols-2 gap-4">
                  {matchedSchemes.map((scheme, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-lg text-slate-900">{scheme.name || 'Scheme Details'}</h4>
                          <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold">
                            {scheme.match_status || 'Eligible'}
                          </span>
                        </div>
                        <p className="text-slate-600 text-sm mb-4 leading-relaxed">{scheme.reason || ''}</p>

                        <div className="mb-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <h5 className="font-semibold text-xs text-slate-500 uppercase tracking-wider mb-2">
                            Physical Document Checklist:
                          </h5>
                          <ul className="space-y-1.5 text-sm text-slate-700">
                            {Array.isArray(scheme.required_docs) && scheme.required_docs.length > 0 ? (
                              scheme.required_docs.map((doc, dIdx) => (
                                <li key={dIdx} className="flex items-center gap-2">
                                  <span className="text-emerald-600 font-bold">✓</span>
                                  <span>{doc}</span>
                                </li>
                              ))
                            ) : (
                              <li className="text-xs text-slate-400">Aadhaar Card and standard identification.</li>
                            )}
                          </ul>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 mt-2">
                        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                          Designated Office / Center:
                        </span>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">
                          {scheme.next_step || 'Gram Panchayat Office / CSC Kendra'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          /* Gram Panchayat Officer Dashboard */
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Inquiries</span>
                <p className="text-3xl font-extrabold text-slate-900 mt-1">{adminInquiries.length}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Pending Action</span>
                <p className="text-3xl font-extrabold text-amber-600 mt-1">
                  {adminInquiries.filter((i) => (i.status || '').includes('Pending')).length}
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Verified / Assisted</span>
                <p className="text-3xl font-extrabold text-emerald-700 mt-1">
                  {adminInquiries.filter((i) => (i.status || '').includes('Verified')).length}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">Gram Panchayat Citizen Inquiries &amp; Verification Queue</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Real-time requests logged through AI voice terminals</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search citizen, village, scheme..."
                    className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 w-full sm:w-56 outline-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={handleRefreshInquiries}
                    className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-semibold transition cursor-pointer whitespace-nowrap"
                  >
                    ↻ Refresh
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-400 uppercase text-xs border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3.5">ID / Time</th>
                      <th className="px-6 py-3.5">Citizen &amp; Village</th>
                      <th className="px-6 py-3.5">Transcript Query</th>
                      <th className="px-6 py-3.5">Matched Welfare Scheme</th>
                      <th className="px-6 py-3.5">Priority</th>
                      <th className="px-6 py-3.5">Status &amp; Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInquiries.length > 0 ? (
                      filteredInquiries.map((inq) => (
                        <tr key={inq.id} className="hover:bg-slate-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-bold text-slate-800 block">{inq.id}</span>
                            <span className="text-xs text-slate-400">{inq.timestamp}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-semibold text-slate-800 block">{inq.citizen_name}</span>
                            <span className="text-xs text-slate-400">{inq.village}</span>
                          </td>
                          <td className="px-6 py-4 max-w-xs truncate text-slate-700 font-medium">
                            {inq.query_text}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-semibold text-emerald-800">
                            {inq.matched_scheme}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                inq.priority === 'High'
                                  ? 'bg-red-100 text-red-700'
                                  : inq.priority === 'Medium'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {inq.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={inq.status}
                              onChange={(e) => updateStatus(inq.id, e.target.value)}
                              className="text-xs border border-slate-300 rounded-lg p-1.5 font-medium bg-white focus:outline-emerald-600 cursor-pointer"
                            >
                              <option value="Pending Verification">Pending Verification</option>
                              <option value="Documents Verified">Documents Verified</option>
                              <option value="Scheme Disbursed">Scheme Disbursed</option>
                            </select>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-slate-400 text-sm">
                          {searchFilter ? 'No matching inquiries found.' : 'No citizen inquiries logged yet.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
