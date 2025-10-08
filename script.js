/* script.js
   Offline-capable student scheduler + quiz + AI-powered assistant
   Saves data in localStorage under key 'codraz_state_v1'
*/

(() => {
  // ---------- Utilities ----------
  const STORAGE_KEY = 'codraz_state_v1';
  let notifiedTaskIds = []; // For notification tracking

  function uid(prefix = 'id') {
    return prefix + '_' + Math.random().toString(36).slice(2, 9);
  }
  function qs(sel, root = document) { return root.querySelector(sel); }
  function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  // ---------- DOM elements ----------
  const mainTitleEl = qs('.title-block h1');
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
  const dashboardView = qs('#dashboardView');
  const assistantView = qs('#assistantView');

  // ---------- State ----------
  let state = {
    tasks: [],
    chat: [],
    activity: [],
    wellness: null,
    settings: { dark: false },
    user: { name: null }
  };

  // ---------- Load & Save ----------
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      state = Object.assign({ user: { name: null } }, state, parsed);
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
    
    if (!state.user || !state.user.name) {
      promptForUsername();
    }

    populateDaySelect();
    renderAll();
    attachListeners();
    initializeReminders(); 

    if (state.chat.length === 0) {
        pushBotMessage('Hello! I am your study buddy. Ask me anything!');
    }
    if (state.settings.dark) document.body.classList.add('dark');
  }

  // ---------- User & Greeting Functions ----------
  function extractNameFromEmail(email) {
    if (!email || !email.includes('@')) return 'Student';
    let namePart = email.substring(0, email.indexOf('@'));
    namePart = namePart.replace(/[._-]/g, ' ').replace(/[0-9]/g, '');
    const formattedName = namePart
      .split(' ')
      .filter(part => part.length > 0)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
    return formattedName || 'Student';
  }

  function promptForUsername() {
    const email = prompt("Welcome to CodraZ! Please enter your email address:", "student@example.com");
    const name = extractNameFromEmail(email);
    state.user = { name };
    saveState();
    addActivity(`Welcome, ${state.user.name}!`);
  }
  
  function renderGreeting() {
    if (!mainTitleEl || !state.user || !state.user.name) return;
    const hour = new Date().getHours();
    let greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    mainTitleEl.innerHTML = `${greeting}, <strong>${escapeHtml(state.user.name)}</strong>!`;
  }
  
  // ---------- Notification Reminder Functions ----------
  function checkReminders() {
      const now = new Date();
      const currentDay = (now.getDay() + 6) % 7;
      const currentTime = now.getHours() * 60 + now.getMinutes();

      state.tasks.forEach(task => {
          if (task.day === currentDay && !task.done && !notifiedTaskIds.includes(task.id)) {
              const [taskHour, taskMinute] = task.time.split(':').map(Number);
              const taskTime = taskHour * 60 + taskMinute;
              const timeDifference = taskTime - currentTime;
              if (timeDifference > 0 && timeDifference <= 15) {
                  new Notification('Upcoming Task Reminder', {
                      body: `Your task "${task.title}" is starting in about ${timeDifference} minutes.`,
                  });
                  notifiedTaskIds.push(task.id);
              }
          }
      });
  }

  function initializeReminders() {
      if (!("Notification" in window)) {
          console.log("This browser does not support desktop notifications.");
          return;
      }
      Notification.requestPermission(status => {
          if (status === 'granted') {
              console.log("Notification permission granted. Reminders are active.");
              setInterval(checkReminders, 60000); // Check every minute
          } else {
              console.log("Notification permission denied.");
          }
      });
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
    renderGreeting();
    renderDashboard();
    renderScheduleEvents();
    renderTasks();
    renderActivity();
    renderChat();
  }

  function renderDashboard() {
    const todayIndex = (new Date().getDay() + 6) % 7;
    const todayTasks = state.tasks.filter(t => t.day === todayIndex);
    focusTasks.innerText = todayTasks.length;
    
    if (todayTasks.length) {
      const top = todayTasks.find(t => !t.done) || todayTasks[0];
      focusSubject.innerText = top.title;
      focusDescription.innerText = top.topic || 'Practice and revise';
    } else {
      focusSubject.innerText = 'No tasks yet';
      focusDescription.innerText = 'Add a topic or a task to get started';
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
    if (chatBox.children.length > 0) chatBox.scrollTop = chatBox.scrollHeight;
  }

  function renderTasks() {
    if (!tasksList) return;
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
      play.addEventListener('click', () => startPracticeForTask(t.id));

      const toggle = document.createElement('button');
      toggle.className = 'btn outline small';
      toggle.innerText = t.done ? 'Undo' : 'Mark Done';

      const hasPracticed = t.scoreHistory && t.scoreHistory.length > 0;
      if (!t.done && !hasPracticed) {
        toggle.disabled = true;
        toggle.title = 'You must complete a practice session first.';
      }

      toggle.addEventListener('click', () => {
        if (!t.done && !hasPracticed) {
          alert('Please complete a practice quiz before marking this task as done.');
          return;
        }
        t.done = !t.done;
        saveState();
        renderAll();
        addActivity(`${t.title} marked ${t.done ? 'done' : 'not done'}`);
      });

      const edit = document.createElement('button');
      edit.className = 'btn ghost small';
      edit.innerText = 'Edit';
      edit.addEventListener('click', () => openEditorForTask(t.id));

      const del = document.createElement('button');
      del.className = 'btn outline small';
      del.innerText = 'Delete';
      del.addEventListener('click', () => {
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
    if (!scheduleEvents) return;
    scheduleEvents.innerHTML = '';
    const sorted = state.tasks.slice().sort((a, b) => (a.day - b.day) || (a.time.localeCompare(b.time)));
    if (!sorted.length) {
      scheduleEvents.innerHTML = '<div class="muted">No scheduled events. Add some tasks!</div>';
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

  // ---------- Task Editor & Navigation ----------
  function populateDaySelect() {
    if (!taskDay) return;
    taskDay.innerHTML = '';
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
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
    showPanel('schedule');
    editingId = id;
  }
  
  function clearForm() {
    taskTitle.value = '';
    taskTopic.value = '';
    taskDay.value = (new Date().getDay() + 6) % 7;
    taskTime.value = '16:00';
    editingId = null;
  }

  function showPanel(panelName) {
      dashboardView.classList.add('hidden');
      assistantView.classList.add('hidden');
      scheduleEditor.classList.add('hidden');

      if (panelName === 'dashboard') dashboardView.classList.remove('hidden');
      if (panelName === 'assistant') assistantView.classList.remove('hidden');
      if (panelName === 'schedule') scheduleEditor.classList.remove('hidden');

      navItems.forEach(n => n.classList.remove('active'));
      qs(`.nav-item[data-nav="${panelName}"]`)?.classList.add('active');
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
      Each object must have this exact structure:
      { "question": "Your question?", "options": ["A", "B", "C", "D"], "answer": "The correct option text" }
    `;
    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
      const data = await response.json();
      let jsonText = data.text;
      const startIndex = jsonText.indexOf('[');
      const endIndex = jsonText.lastIndexOf(']');
      if (startIndex !== -1 && endIndex !== -1) {
        jsonText = jsonText.substring(startIndex, endIndex + 1);
      } else {
        throw new Error("Invalid JSON format from AI.");
      }
      return JSON.parse(jsonText);
    } catch (error) {
      console.error("Failed to generate/parse AI quiz:", error);
      alert("Could not generate AI quiz. See console for errors.");
      return [];
    }
  }

  async function openQuizModal(forTaskId = null, title = 'General', topic = 'General') {
    quizState.taskId = forTaskId;
    quizState.topic = topic;
    quizModal.classList.add('visible');
    quizContainer.style.display = 'block';
    quizResults.style.display = 'none';
    quizQuestionEl.innerText = '🤖 Generating your AI quiz...';
    quizOptionsEl.innerHTML = '<p>Please wait a moment.</p>';
    nextQuizQuestionBtn.style.display = 'none';
    
    const questionsFromAI = await generateQuizWithAI(title, topic);

    if (!questionsFromAI || questionsFromAI.length === 0) {
      quizQuestionEl.innerText = 'Error';
      quizOptionsEl.innerHTML = '<p>Failed to load quiz. Please try again.</p>';
      return;
    }
    
    quizState.questions = questionsFromAI.map((q, index) => {
      const answerIndex = q.options.indexOf(q.answer);
      return { id: uid('q' + index), question: q.question, choices: q.options, answerIndex: answerIndex !== -1 ? answerIndex : 0 };
    });
    
    quizState.index = 0;
    quizState.answers = {};
    quizState.open = true;
    renderQuizQuestion();
  }

  function closeQuizModal() {
    quizModal.classList.remove('visible');
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
  
  // ---------- Event Listeners ----------
  function attachListeners() {
    navItems.forEach(n => n.addEventListener('click', () => showPanel(n.dataset.nav)));
    addTaskBtn?.addEventListener('click', () => showPanel('schedule'));
    backToDash?.addEventListener('click', () => showPanel('dashboard'));
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
      showPanel('dashboard');
    });

    sendBtn?.addEventListener('click', handleSendChatMessage);
    chatInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChatMessage(); }
    });
    exampleBtn?.addEventListener('click', () => {
      chatInput.value = 'Explain Newton\'s laws of motion.';
      handleSendChatMessage();
    });
    clearBtn?.addEventListener('click', () => {
      if (confirm('Clear chat history?')) { state.chat = []; saveState(); renderChat(); }
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
      if (task) startPracticeForTask(task.id);
    });
    nextQuizQuestionBtn?.addEventListener('click', handleNextQuestion);

    markAllDoneBtn?.addEventListener('click', () => {
      const today = (new Date().getDay() + 6) % 7;
      let tasksMarked = 0;
      state.tasks.forEach(t => { 
        if (t.day === today && t.scoreHistory && t.scoreHistory.length > 0) {
          t.done = true; 
          tasksMarked++;
        }
      });
      if (tasksMarked > 0) {
        saveState(); renderAll(); addActivity(`Marked all practiced tasks for today as done.`);
      } else {
        alert("You can only mark tasks done after completing a practice quiz for them.");
      }
    });

    searchInput?.addEventListener('input', () => renderTasks());
    toggleDark?.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('dark');
      state.settings.dark = isDark;
      saveState();
    });
  }

  async function handleSendChatMessage() {
    const text = (chatInput.value || '').trim();
    if (!text) return;
    pushUserMessage(text);
    chatInput.value = '';
    pushBotMessage('Thinking...');

    try {
        const response = await fetch('/.netlify/functions/gemini-proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: text }),
        });
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        const data = await response.json();
        const ans = data.text;

        const lastBotIndex = state.chat.map(c => c.from).lastIndexOf('bot');
        if (lastBotIndex !== -1 && state.chat[lastBotIndex].text === 'Thinking...') {
            state.chat.splice(lastBotIndex, 1);
        }
        pushBotMessage(ans);
        addActivity(`AI assistant answered a query.`);
    } catch (error) {
        console.error('Error calling AI proxy:', error);
        const lastBotIndex = state.chat.map(c => c.from).lastIndexOf('bot');
        if (lastBotIndex !== -1 && state.chat[lastBotIndex].text === 'Thinking...') {
            state.chat.splice(lastBotIndex, 1);
        }
        pushBotMessage('I am currently unable to provide an answer. Please try again later.');
    }
  }

  function pushUserMessage(text) {
    state.chat.push({ id: uid('m'), from: 'user', text, ts: new Date().toISOString() });
    renderChat();
  }
  function pushBotMessage(text) {
    state.chat.push({ id: uid('m'), from: 'bot', text, ts: new Date().toISOString() });
    saveState();
    renderChat();
  }

  // ---------- Safety / helpers ----------
  function escapeHtml(s = '') {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ---------- On load ----------
  init();
})();
