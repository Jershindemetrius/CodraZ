(() => {
  const STORAGE_KEY = 'codraz_state_v1';
  function uid(prefix = 'id') {
    return prefix + '_' + Math.random().toString(36).slice(2, 9);
  }
  function qs(sel, root = document) { return root.querySelector(sel); }
  function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  const addTaskBtn = qs('#addTaskBtn');
  const markAllDoneBtn = qs('#markAllDoneBtn');
  const focusSubject = qs('#focusSubject');
  const focusDescription = qs('#focusDescription');
  const focusProgressPct = qs('#focusProgressPct');
  const focusProgressBar = qs('#focusProgressBar');
  const focusTasks = qs('#focusTasks');
  const focusScore = qs('#focusScore');

  const daysRow = qs('#daysRow');
  const scheduleEvents = qs('#scheduleEvents');
  const tasksList = qs('#tasksList');

  const scheduleEditor = qs('#scheduleEditor');
  const backToDash = qs('#backToDash');
  const taskForm = qs('#taskForm');
  const taskTitle = qs('#taskTitle');
  const taskTopic = qs('#taskTopic');
  const taskDay = qs('#taskDay');
  const taskTime = qs('#taskTime');
  const saveTaskBtn = qs('#saveTaskBtn');
  const clearFormBtn = qs('#clearFormBtn');

  const chatBox = qs('#chatBox');
  const chatInput = qs('#chatInput');
  const sendBtn = qs('#sendBtn');
  const exampleBtn = qs('#exampleBtn');
  const clearBtn = qs('#clearBtn');

  const recentActivityList = qs('#recentActivityList');
  const wellnessMsg = qs('#wellnessMsg');
  const emojiBtns = qsa('.emoji');

  const quizModal = qs('#quizModal');
  const closeQuizModalBtn = qs('#closeQuizModal');
  const quizContainer = qs('#quizContainer');
  const quizResults = qs('#quizResults');
  const quizQuestionEl = qs('#quizQuestion');
  const quizOptionsEl = qs('#quizOptions');
  const nextQuizQuestionBtn = qs('#nextQuizQuestion');
  const quizProgressText = qs('#quizProgressText');
  const quizScoreEl = qs('#quizScore');
  const quizTotalQuestionsEl = qs('#quizTotalQuestions');
  const restartQuizBtn = qs('#restartQuiz');
  const closeResultsModalBtn = qs('#closeResultsModal');

  const navItems = qsa('.nav-item');
  const searchInput = qs('#searchInput');
  const toggleDark = qs('#toggleDark');

  let state = {
    tasks: [], // {id,title,topic,day(0-6),time,done(boolean),scoreHistory: [{date,correct,total}]}
    chat: [], // [{from:'bot'|'user',text,ts}]
    activity: [], // strings with timestamp
    wellness: null, // {value,at}
    settings: { dark: false },
  };

  // ---------- Load & Save ----------
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      state = Object.assign(state, parsed);
    } catch (e) {
      console.error('Load state error', e);
    }
  }
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Save state error', e);
    }
  }

  // ---------- Init ----------
  function init() {
    loadState();
    populateDaySelect();
    renderAll();
    attachListeners();
    if (state.chat.length === 0) {
        pushBotMessage('Hello! I am your study buddy. Ask me anything!');
    }
    if (state.settings.dark) applyDark(true);
  }

  // ---------- UI helpers ----------
  function formatTime(t) {
    if (!t) return '';
    const [hh, mm] = t.split(':').map(n => Number(n));
    const ampm = hh >= 12 ? 'PM' : 'AM';
    const hr12 = ((hh + 11) % 12) + 1;
    return `${hr12}:${String(mm).padStart(2, '0')} ${ampm}`;
  }

  function addActivity(text) {
    const item = { id: uid('act'), text, ts: new Date().toISOString() };
    state.activity.unshift(item);
    if (state.activity.length > 50) state.activity.length = 50;
    saveState();
    renderActivity();
  }

  // ---------- Render ----------
  function renderAll() {
    renderTasks();
    renderDashboard();
    renderActivity();
    renderChat();
    renderScheduleEvents();
  }

  function renderDashboard() {
    const todayIndex = (new Date().getDay() + 6) % 7; // Mon=0..Sun=6
    const todayTasks = state.tasks.filter(t => t.day === todayIndex);
    focusTasks.innerText = todayTasks.length;
    
    if (todayTasks.length) {
      const top = todayTasks.find(t => !t.done) || todayTasks[0];
      focusSubject.innerText = top.title;
      focusDescription.innerText = top.topic || 'Practice and revise';
    } else {
      focusSubject.innerText = 'No tasks today';
      focusDescription.innerText = 'Add a task to get started';
    }

    const doneCount = todayTasks.filter(t => t.done).length;
    const pct = todayTasks.length ? Math.round(doneCount / todayTasks.length * 100) : 0;
    focusProgressPct.innerText = pct + '%';
    focusProgressBar.style.width = pct + '%';

    let totalCorrect = 0;
    let totalQuestions = 0;
    state.tasks.forEach(t => {
      t.scoreHistory?.forEach(s => {
        totalCorrect += s.correct;
        totalQuestions += s.total;
      });
    });
    const avg = totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    focusScore.innerText = avg;
  }

  function renderActivity() {
    recentActivityList.innerHTML = '';
    if (!state.activity.length) {
      recentActivityList.innerHTML = '<div class="activity-item"><span class="activity-icon">🤖</span><span class="activity-text">No recent actions</span></div>';
      return;
    }
    state.activity.slice(0, 10).forEach(a => {
      const el = document.createElement('div');
      el.className = 'activity-item';
      el.innerHTML = `<span class="activity-icon">📚</span>
                          <span class="activity-text">${escapeHtml(a.text)}</span>
                          <span class="activity-time">${new Date(a.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>`;
      recentActivityList.appendChild(el);
    });
  }

  function renderChat() {
    chatBox.innerHTML = '';
    state.chat.forEach(m => {
      const el = document.createElement('div');
      el.className = 'chat-item ' + (m.from === 'user' ? 'user' : 'bot');
      el.innerText = m.text;
      chatBox.appendChild(el);
    });
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function renderTasks() {
    tasksList.innerHTML = '';
    if (!state.tasks.length) {
      tasksList.innerHTML = '<div class="muted">No tasks. Add one using the form.</div>';
      return;
    }
    const filtered = applySearchFilter(state.tasks);
    filtered.sort((a,b) => a.day - b.day || a.time.localeCompare(b.time));
    
    filtered.forEach(t => {
      const wrapper = document.createElement('div');
      wrapper.className = `task-item ${t.done ? 'done' : ''}`;
      wrapper.dataset.id = t.id;
      
      const left = document.createElement('div');
      left.className = 'left';
      left.innerHTML = `<strong>${escapeHtml(t.title)}</strong>
                          <div class="meta">${escapeHtml(t.topic || '')} • ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][t.day]} • ${formatTime(t.time)}</div>`;
      
      const actions = document.createElement('div');
      actions.className = 'task-actions';
      
      const play = document.createElement('button');
      play.className = 'btn small';
      play.innerText = 'Start Practice';
      play.addEventListener('click', (e) => { e.stopPropagation(); startPracticeForTask(t.id); });

      const toggle = document.createElement('button');
      toggle.className = 'btn outline small';
      toggle.innerText = t.done ? 'Undo' : 'Mark Done';
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        t.done = !t.done;
        saveState();
        renderAll();
        addActivity(`${t.title} marked ${t.done ? 'done' : 'not done'}`);
      });

      const edit = document.createElement('button');
      edit.className = 'btn ghost small';
      edit.innerText = 'Edit';
      edit.addEventListener('click', (e) => { e.stopPropagation(); openEditorForTask(t.id); });

      const del = document.createElement('button');
      del.className = 'btn ghost small danger';
      del.innerText = 'Delete';
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!confirm('Delete this task?')) return;
        state.tasks = state.tasks.filter(x => x.id !== t.id);
        saveState();
        renderAll();
        addActivity(`Deleted task "${t.title}"`);
      });

      actions.appendChild(play);
      actions.appendChild(toggle);
      actions.appendChild(edit);
      actions.appendChild(del);

      wrapper.appendChild(left);
      wrapper.appendChild(actions);
      tasksList.appendChild(wrapper);
    });
  }

  function renderScheduleEvents() {
    scheduleEvents.innerHTML = '';
    const sorted = state.tasks.slice().sort((a, b) => (a.day - b.day) || (a.time.localeCompare(b.time)));
    if (!sorted.length) {
      scheduleEvents.innerHTML = '<div class="muted">No scheduled events.</div>';
      return;
    }
    sorted.slice(0, 12).forEach(t => {
      const el = document.createElement('div');
      el.className = `event study ${t.done ? 'done' : ''}`;
      el.innerText = `${t.title} • ${formatTime(t.time)}`;
      scheduleEvents.appendChild(el);
    });
  }

  // ---------- Search ----------
  function applySearchFilter(arr) {
    const q = (searchInput.value || '').trim().toLowerCase();
    if (!q) return arr;
    return arr.filter(t => (t.title + ' ' + (t.topic || '')).toLowerCase().includes(q));
  }

  // ---------- Task Editor ----------
  function populateDaySelect() {
    taskDay.innerHTML = '';
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    days.forEach((d, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.innerText = d;
      taskDay.appendChild(opt);
    });
  }

  let editingId = null;
  function openEditorForTask(id) {
    const t = state.tasks.find(x => x.id === id);
    if (!t) return;
    taskTitle.value = t.title;
    taskTopic.value = t.topic || '';
    taskDay.value = t.day;
    taskTime.value = t.time || '16:00';
    showPanelEditor();
    editingId = id;
  }

  function showPanelEditor() {
    qs('#dashboardView').classList.add('hidden');
    scheduleEditor.classList.remove('hidden');
  }
  function hidePanelEditor() {
    qs('#dashboardView').classList.remove('hidden');
    scheduleEditor.classList.add('hidden');
    clearForm();
  }

  function clearForm() {
    taskTitle.value = '';
    taskTopic.value = '';
    taskDay.value = (new Date().getDay() + 6) % 7;
    taskTime.value = '16:00';
    editingId = null;
  }

  function attachListeners() {
    backToDash?.addEventListener('click', hidePanelEditor);
    clearFormBtn?.addEventListener('click', (e) => { e.preventDefault(); clearForm(); });

    taskForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = (taskTitle.value || '').trim();
      if (!title) { alert('Please enter a title'); return; }
      const payload = {
        title,
        topic: (taskTopic.value || '').trim(),
        day: Number(taskDay.value),
        time: taskTime.value || '16:00',
      };
      if (editingId) {
        const t = state.tasks.find(x => x.id === editingId);
        if (t) { Object.assign(t, payload); addActivity(`Edited task "${t.title}"`); }
      } else {
        const newTask = { id: uid('task'), done: false, scoreHistory: [], ...payload };
        state.tasks.push(newTask);
        addActivity(`Added task "${newTask.title}"`);
      }
      saveState();
      renderAll();
      hidePanelEditor();
    });

    sendBtn?.addEventListener('click', handleSendChatMessage);
    chatInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChatMessage(); }
    });

    exampleBtn?.addEventListener('click', () => {
      chatInput.value = 'Explain photosynthesis in simple terms.';
      handleSendChatMessage();
    });
    clearBtn?.addEventListener('click', () => {
      if (!confirm('Clear chat history?')) return;
      state.chat = [];
      saveState();
      renderChat();
    });
    
    emojiBtns.forEach(b => {
      b.addEventListener('click', () => {
        const v = Number(b.dataset.value || 3);
        state.wellness = { value: v, at: new Date().toISOString() };
        saveState();
        wellnessMsg.innerText = v >= 4 ? 'Great — keep it up!' : v === 3 ? 'Remember to take breaks.' : 'Sorry to hear that. Try a 5-min walk.';
        addActivity(`Wellness check: ${v}/5`);
      });
    });

    closeQuizModalBtn?.addEventListener('click', closeQuizModal);
    closeResultsModalBtn?.addEventListener('click', closeQuizModal);
    restartQuizBtn?.addEventListener('click', () => {
      const task = state.tasks.find(t => t.id === quizState.taskId);
      if (task) { startPracticeForTask(task.id); }
    });
    nextQuizQuestionBtn?.addEventListener('click', handleNextQuestion);

    addTaskBtn?.addEventListener('click', () => showPanelEditor());
    markAllDoneBtn?.addEventListener('click', () => {
      const today = (new Date().getDay() + 6) % 7;
      state.tasks.forEach(t => { if (t.day === today) t.done = true; });
      saveState();
      renderAll();
      addActivity('Marked all of today\'s tasks as done.');
    });

    searchInput?.addEventListener('input', () => renderTasks());
    toggleDark?.addEventListener('click', () => {
      const now = !state.settings.dark;
      applyDark(now);
      state.settings.dark = now;
      saveState();
    });
  }

  // ---------- Chat (AI-powered) ----------
  function pushUserMessage(text) {
    state.chat.push({ id: uid('m'), from: 'user', text, ts: new Date().toISOString() });
    renderChat();
  }
  function pushBotMessage(text) {
    state.chat.push({ id: uid('m'), from: 'bot', text, ts: new Date().toISOString() });
    saveState();
    renderChat();
  }

  async function callAIGenerate(prompt) {
    try {
      const response = await fetch('/.netlify/functions/gemini-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error('Error calling AI proxy:', error);
      return 'I am currently unable to provide an answer. Please try again later.';
    }
  }

  async function handleSendChatMessage() {
    const text = (chatInput.value || '').trim();
    if (!text) return;
    pushUserMessage(text);
    chatInput.value = '';
    pushBotMessage('Thinking...');

    const ans = await callAIGenerate(text);
    const lastBotIndex = state.chat.map(c => c.from).lastIndexOf('bot');
    if (lastBotIndex !== -1 && state.chat[lastBotIndex].text === 'Thinking...') {
      state.chat.splice(lastBotIndex, 1);
    }
    pushBotMessage(ans);
    addActivity(`AI assistant answered a query.`);
  }

  // ---------- Quiz system ----------
  let quizState = {
    open: false,
    questions: [],
    index: 0,
    answers: {},
    taskId: null,
    topic: 'General'
  };

  async function generateQuizWithAI(title, topic) {
    const API_ENDPOINT = '/.netlify/functions/gemini-proxy';
    console.log(`Generating quiz for Topic: ${topic}, Subject: ${title}`);
    const prompt = `
      Generate exactly 50 multiple-choice quiz questions for a student on the topic of '${topic}' within the broader subject of '${title}'.
      You MUST provide the output as a valid JSON array of objects, with no other text or explanation before or after the array.
      Each object in the array must have this exact structure:
      {
        "question": "Your question text here?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "answer": "The correct option text here"
      }
    `;

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      const data = await response.json();
      let jsonText = data.text;

      // **MAJOR FIX**: Clean the AI's response to ensure it's valid JSON.
      // The model might wrap the JSON in markdown backticks (```json ... ```) or add other text.
      const startIndex = jsonText.indexOf('[');
      const endIndex = jsonText.lastIndexOf(']');

      if (startIndex !== -1 && endIndex !== -1) {
        jsonText = jsonText.substring(startIndex, endIndex + 1);
      } else {
        // If we can't find a JSON array, throw an error.
        throw new Error("Invalid JSON format received from AI.");
      }

      // Now, parse the cleaned text
      return JSON.parse(jsonText);

    } catch (error) {
      console.error("Failed to generate or parse AI quiz:", error);
      alert("Could not generate the AI quiz. Please check the console for errors.");
      return [];
    }
  }

  async function openQuizModal(forTaskId = null, title = 'General', topic = 'General') {
    quizState.taskId = forTaskId;
    quizState.topic = topic;
    quizModal.classList.add('visible');
    quizModal.setAttribute('aria-hidden', 'false');

    quizContainer.style.display = 'block';
    quizResults.style.display = 'none';
    quizQuestionEl.innerText = '🤖 Generating your quiz...';
    quizOptionsEl.innerHTML = '<p>Please wait a moment while the AI prepares your questions.</p>';
    nextQuizQuestionBtn.style.display = 'none';
    quizProgressText.innerText = '...';

    const questionsFromAI = await generateQuizWithAI(title, topic);

    if (!questionsFromAI || questionsFromAI.length === 0) {
      quizQuestionEl.innerText = 'Error';
      quizOptionsEl.innerHTML = '<p>Failed to load the quiz. Please try again later.</p>';
      return;
    }

    quizState.questions = questionsFromAI.map((q, index) => {
      const answerIndex = q.options.indexOf(q.answer);
      return {
        id: uid('q' + index),
        question: q.question,
        choices: q.options,
        answerIndex: answerIndex !== -1 ? answerIndex : 0,
      };
    });

    quizState.index = 0;
    quizState.answers = {};
    quizState.open = true;
    renderQuizQuestion();
  }

  function closeQuizModal() {
    quizModal.classList.remove('visible');
    quizModal.setAttribute('aria-hidden', 'true');
    quizState.open = false;
  }

  function renderQuizQuestion() {
    const q = quizState.questions[quizState.index];
    if (!q) return;
    quizQuestionEl.innerText = `${quizState.index + 1}. ${q.question}`;
    quizOptionsEl.innerHTML = '';
    q.choices.forEach((choice, idx) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option-btn';
      btn.innerText = choice;
      btn.addEventListener('click', () => {
        qsa('.quiz-option-btn', quizOptionsEl).forEach(b => b.disabled = true);
        quizState.answers[q.id] = idx;
        const isCorrect = idx === q.answerIndex;
        btn.classList.add('selected', isCorrect ? 'correct' : 'wrong');
        if (!isCorrect) {
          const correctBtn = Array.from(quizOptionsEl.children)[q.answerIndex];
          if (correctBtn) correctBtn.classList.add('correct');
        }
        nextQuizQuestionBtn.style.display = 'inline-block';
        nextQuizQuestionBtn.innerText = (quizState.index === quizState.questions.length - 1) ? 'Show Results' : 'Next';
      });
      quizOptionsEl.appendChild(btn);
    });
    nextQuizQuestionBtn.style.display = 'none';
    quizProgressText.innerText = `${quizState.index + 1} / ${quizState.questions.length}`;
  }
  
  function handleNextQuestion() {
    if (quizState.index < quizState.questions.length - 1) {
      quizState.index++;
      renderQuizQuestion();
    } else {
      showQuizResults();
    }
  }

  function showQuizResults() {
    let correct = 0;
    quizState.questions.forEach(q => {
      if (quizState.answers[q.id] === q.answerIndex) correct++;
    });
    quizScoreEl.innerText = correct;
    quizTotalQuestionsEl.innerText = quizState.questions.length;
    quizContainer.style.display = 'none';
    quizResults.style.display = 'block';

    if (quizState.taskId) {
      const t = state.tasks.find(x => x.id === quizState.taskId);
      if (t) {
        t.scoreHistory = t.scoreHistory || [];
        t.scoreHistory.push({ date: new Date().toISOString(), correct, total: quizState.questions.length });
        saveState();
        addActivity(`Quiz for "${t.title}" complete: ${correct}/${quizState.questions.length}`);
      }
    }
    renderAll();
  }

  function startPracticeForTask(taskId) {
    const t = state.tasks.find(x => x.id === taskId);
    if (!t) return;
    openQuizModal(taskId, t.title, t.topic || t.title);
  }

  // ---------- Dark mode ----------
  function applyDark(flag) {
    document.documentElement.classList.toggle('dark', flag);
  }

  // ---------- Safety / helpers ----------
  function escapeHtml(s = '') {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ---------- On load ----------
  init();
})();
