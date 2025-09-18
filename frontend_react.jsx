import React, { useState, useEffect } from "react";


const MOCK_ASSESSMENT = {
  id: "campus-2025-frontend",
  title: "Frontend Developer - Campus Hiring Evaluation",
  durationMinutes: 60,
  sections: [
    {
      id: "mcq",
      title: "Multiple Choice",
      durationMinutes: 20,
      type: "mcq",
      questions: [
        {
          id: "q1",
          text: "Which HTML tag is used to include JavaScript code?",
          options: ["<script>", "<js>", "<javascript>", "<code>"],
          answerIndex: 0,
          marks: 2,
        },
        {
          id: "q2",
          text: "Which CSS property controls layout in modern responsive design?",
          options: ["display", "float", "position", "visibility"],
          answerIndex: 0,
          marks: 2,
        },
      ],
    },
    {
      id: "coding",
      title: "Live Coding (Stub)",
      durationMinutes: 30,
      type: "coding",
      prompt:
        "Build a function that returns the first non-repeating character in a string. (This is a placeholder - integrate a code runner/IDE for real assessments.)",
      rubric: "Correctness (60%), Efficiency (20%), Code Style (20%)",
    },
    {
      id: "subjective",
      title: "Subjective — Explain your approach",
      durationMinutes: 10,
      type: "subjective",
      prompt: "Briefly explain how you'd optimize a React application's performance.",
      maxWords: 200,
    },
  ],
};

export default function CampusHiringFrontend({ assessment = MOCK_ASSESSMENT }) {
  // Candidate info
  const [candidate, setCandidate] = useState({ name: "", email: "", college: "" });

  // Mode: 'candidate' or 'adminPreview'
  const [mode, setMode] = useState("candidate");

  // Assessment state
  const [started, setStarted] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { sectionId: { qId: answerIndex | text } }
  const [timeLeft, setTimeLeft] = useState(assessment.durationMinutes * 60);
  const [sectionTimeLeft, setSectionTimeLeft] = useState(
    assessment.sections[0].durationMinutes * 60
  );
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);

  // Timer effects
  useEffect(() => {
    if (!started || submitted) return;
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          handleAutoSubmit();
          return 0;
        }
        return s - 1;
      });
      setSectionTimeLeft((s) => {
        if (s <= 1) return 0;
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [started, submitted]);

  
  useEffect(() => {
    if (!started || submitted) return;
    if (sectionTimeLeft === 0) {
      if (currentSectionIndex < assessment.sections.length - 1) {
        const nextIdx = currentSectionIndex + 1;
        setCurrentSectionIndex(nextIdx);
        setSectionTimeLeft(assessment.sections[nextIdx].durationMinutes * 60);
      } else {
        
        handleAutoSubmit();
      }
    }
  }, [sectionTimeLeft]);

  function handleStart() {
    if (!candidate.name || !candidate.email) {
      alert("Please enter your name and email before starting the assessment.");
      return;
    }
    setStarted(true);
    setTimeLeft(assessment.durationMinutes * 60);
    setSectionTimeLeft(assessment.sections[0].durationMinutes * 60);
  }

  function secToMMSS(seconds) {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  }

  function handleSelectMCQ(sectionId, qId, optionIndex) {
    setAnswers((prev) => ({
      ...prev,
      [sectionId]: { ...(prev[sectionId] || {}), [qId]: optionIndex },
    }));
  }

  function handleTextAnswer(sectionId, qId, text) {
    setAnswers((prev) => ({
      ...prev,
      [sectionId]: { ...(prev[sectionId] || {}), [qId]: text },
    }));
  }

  function handleNavigateTo(index) {
    if (index < 0 || index >= assessment.sections.length) return;
    setCurrentSectionIndex(index);
    setSectionTimeLeft(assessment.sections[index].durationMinutes * 60);
  }

  function calculateScore() {
    // Simple MCQ scoring only (automated). Manual sections receive 0 here.
    const mcqSection = assessment.sections.find((s) => s.type === "mcq");
    if (!mcqSection) return 0;
    const given = answers[mcqSection.id] || {};
    let total = 0;
    let obtained = 0;
    mcqSection.questions.forEach((q) => {
      total += q.marks || 1;
      const ans = given[q.id];
      if (ans === q.answerIndex) obtained += q.marks || 1;
    });
    return { obtained, total };
  }

  function handleSubmit() {
   
    const mcqScore = calculateScore();
    setScore(mcqScore);
    setSubmitted(true);
    setStarted(false);
  }

  function handleAutoSubmit() {
    if (submitted) return;
    handleSubmit();
    alert("Time's up — test submitted automatically.");
  }

 
  function SectionRenderer({ section }) {
    if (section.type === "mcq") {
      const given = answers[section.id] || {};
      return (
        <div>
          {section.questions.map((q, idx) => (
            <div key={q.id} className="mb-6 p-4 rounded-lg border">
              <div className="font-medium mb-2">{idx + 1}. {q.text}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {q.options.map((opt, oidx) => {
                  const selected = given[q.id] === oidx;
                  return (
                    <button
                      key={oidx}
                      onClick={() => handleSelectMCQ(section.id, q.id, oidx)}
                      className={`text-left p-3 rounded-lg border ${selected ? 'ring-2 ring-offset-2' : ''}`}
                    >
                      <div className="font-semibold">{String.fromCharCode(65 + oidx)}.</div>
                      <div className="truncate">{opt}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (section.type === "coding") {
      const stubAnswer = (answers[section.id] || {}).code || "";
      return (
        <div className="space-y-4">
          <div className="rounded bg-gray-50 p-4 border">
            <div className="font-semibold">Prompt</div>
            <div className="mt-2 text-sm">{section.prompt}</div>
            <div className="mt-2 text-xs italic text-gray-500">{section.rubric}</div>
          </div>
          <textarea
            placeholder="Paste your code here (this is a placeholder editor). For real tests, integrate Monaco/CodeMirror and a backend runner."
            value={stubAnswer}
            onChange={(e) => handleTextAnswer(section.id, "code", e.target.value)}
            rows={10}
            className="w-full p-3 border rounded font-mono"
          />
        </div>
      );
    }

    if (section.type === "subjective") {
      const text = (answers[section.id] || {}).essay || "";
      return (
        <div>
          <div className="rounded bg-gray-50 p-4 border mb-3">
            <div className="font-semibold">Prompt</div>
            <div className="mt-2 text-sm">{section.prompt}</div>
            <div className="mt-2 text-xs text-gray-500">Max words: {section.maxWords}</div>
          </div>
          <textarea
            placeholder="Write your answer..."
            value={text}
            onChange={(e) => handleTextAnswer(section.id, "essay", e.target.value)}
            rows={6}
            className="w-full p-3 border rounded"
          />
        </div>
      );
    }

    return <div>Unknown section type</div>;
  }

  // Small UI components
  function Header() {
    return (
      <header className="flex items-center justify-between py-4 px-6 bg-white shadow-sm sticky top-0 z-10">
        <div>
          <div className="text-lg font-bold">{assessment.title}</div>
          <div className="text-xs text-gray-500">Duration: {assessment.durationMinutes} minutes</div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <div>Candidate: <span className="font-medium">{candidate.name || '—'}</span></div>
            <div className="text-xs text-gray-500">Mode: {mode}</div>
          </div>
          <div className="text-right">
            <div className="text-sm">Time left</div>
            <div className="font-mono text-lg">{secToMMSS(timeLeft)}</div>
          </div>
          <button
            onClick={() => setMode((m) => (m === "candidate" ? "adminPreview" : "candidate"))}
            className="px-3 py-2 rounded bg-indigo-600 text-white text-sm"
            title="Toggle preview/admin"
          >
            Toggle Preview
          </button>
        </div>
      </header>
    );
  }

  // Main render
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <main className="max-w-6xl mx-auto p-6">
        {!started && !submitted && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="p-6 rounded-lg bg-white shadow">
                <h2 className="text-xl font-bold mb-2">Instructions</h2>
                <ul className="list-disc ml-5 text-sm text-gray-700">
                  <li>Ensure a stable internet connection.</li>
                  <li>Do not refresh the page once the test starts.</li>
                  <li>Each section has its own timer — unused time will not carry over.</li>
                  <li>MCQs are auto-scored. Coding & subjective answers will be manually evaluated.</li>
                </ul>
              </div>

              <div className="p-6 rounded-lg bg-white shadow">
                <h3 className="font-semibold">Candidate details</h3>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    placeholder="Full name"
                    value={candidate.name}
                    onChange={(e) => setCandidate({ ...candidate, name: e.target.value })}
                    className="p-3 border rounded"
                  />
                  <input
                    placeholder="Email"
                    value={candidate.email}
                    onChange={(e) => setCandidate({ ...candidate, email: e.target.value })}
                    className="p-3 border rounded"
                  />
                  <input
                    placeholder="College / University"
                    value={candidate.college}
                    onChange={(e) => setCandidate({ ...candidate, college: e.target.value })}
                    className="p-3 border rounded col-span-2"
                  />
                </div>
                <div className="mt-4 flex gap-3">
                  <button onClick={handleStart} className="px-4 py-2 bg-green-600 text-white rounded">Start Test</button>
                  <button onClick={() => { setMode('adminPreview'); setStarted(true); }} className="px-4 py-2 bg-gray-200 rounded">Preview as Admin</button>
                </div>
              </div>

              <div className="p-6 rounded-lg bg-white shadow">
                <h3 className="font-semibold">Assessment details</h3>
                <div className="mt-3 text-sm text-gray-700">
                  {assessment.sections.map((s, i) => (
                    <div key={s.id} className="py-2 border-b last:border-b-0">
                      <div className="flex justify-between">
                        <div>
                          <div className="font-medium">{i + 1}. {s.title}</div>
                          <div className="text-xs text-gray-500">Type: {s.type} • {s.durationMinutes} min</div>
                        </div>
                        <div>
                          <button onClick={() => handleNavigateTo(i)} className="text-sm px-3 py-1 bg-indigo-50 rounded">Open</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="space-y-4">
              <div className="p-4 rounded-lg bg-white shadow">
                <div className="text-sm text-gray-500">Progress</div>
                <div className="mt-3">
                  <progress value={Object.keys(answers).length} max={assessment.sections.length} className="w-full" />
                  <div className="text-xs text-gray-500 mt-1">Sections attempted: {Object.keys(answers).length}/{assessment.sections.length}</div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-white shadow">
                <div className="text-sm text-gray-500">Quick Navigation</div>
                <div className="mt-3 grid gap-2">
                  {assessment.sections.map((s, idx) => (
                    <button key={s.id} onClick={() => handleNavigateTo(idx)} className={`text-left p-3 rounded border ${idx===currentSectionIndex? 'bg-indigo-50':''}`}>
                      <div className="font-medium">{idx+1}. {s.title}</div>
                      <div className="text-xs text-gray-500">{s.type} • {s.durationMinutes} min</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-white shadow">
                <div className="text-sm text-gray-500">Support</div>
                <div className="mt-2 text-xs">
                  If you face technical issues, contact support@company.com
                </div>
              </div>
            </aside>
          </section>
        )}

        {started && !submitted && (
          <section className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 bg-white p-6 rounded shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm text-gray-500">Section</div>
                  <div className="font-bold text-lg">{assessment.sections[currentSectionIndex].title}</div>
                  <div className="text-xs text-gray-500">{assessment.sections[currentSectionIndex].type}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm">Section time left</div>
                  <div className="font-mono text-lg">{secToMMSS(sectionTimeLeft)}</div>
                </div>
              </div>

              <div>
                <SectionRenderer section={assessment.sections[currentSectionIndex]} />
              </div>

              <div className="mt-6 flex justify-between">
                <div className="flex gap-2">
                  <button onClick={() => handleNavigateTo(currentSectionIndex - 1)} className="px-4 py-2 rounded border">Previous</button>
                  <button onClick={() => handleNavigateTo(currentSectionIndex + 1)} className="px-4 py-2 rounded border">Next</button>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { if (confirm('Are you sure you want to submit?')) handleSubmit(); }} className="px-4 py-2 bg-red-600 text-white rounded">Submit Test</button>
                </div>
              </div>
            </div>

            <aside className="bg-white p-4 rounded shadow">
              <div className="text-sm text-gray-500">Section list</div>
              <div className="mt-3 space-y-2">
                {assessment.sections.map((s, idx) => (
                  <div key={s.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{idx+1}. {s.title}</div>
                      <div className="text-xs text-gray-500">{s.durationMinutes} min</div>
                    </div>
                    <div>
                      <button onClick={() => handleNavigateTo(idx)} className="px-2 py-1 text-xs bg-indigo-50 rounded">Go</button>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </section>
        )}

        {submitted && (
          <section className="mt-6 bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold">Submission received</h2>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Candidate</div>
                <div className="font-medium">{candidate.name}</div>
                <div className="text-xs text-gray-500">{candidate.email} • {candidate.college}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">MCQ Score (auto)</div>
                <div className="font-medium text-lg">{score ? `${score.obtained} / ${score.total}` : 'N/A'}</div>
                <div className="text-xs text-gray-500">Coding & subjective will be manually evaluated.</div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-semibold">Your Answers (preview)</h3>
              <pre className="mt-2 p-3 bg-gray-50 rounded text-sm overflow-auto">{JSON.stringify(answers, null, 2)}</pre>
            </div>

            <div className="mt-6">
              <button onClick={() => { navigator.clipboard?.writeText(JSON.stringify({ candidate, answers, score }, null, 2)); alert('Copied results to clipboard.'); }} className="px-4 py-2 bg-indigo-600 text-white rounded">Copy Submission JSON</button>
            </div>
          </section>
        )}
      </main>

      <footer className="text-center text-xs text-gray-500 py-6">© 2025 Campus Hiring Platform</footer>
    </div>
  );
}
