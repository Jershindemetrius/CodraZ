/* script.js
   Offline-capable student scheduler + quiz + simulated chat
   Saves data in localStorage under key 'codraz_state_v1'
*/

(() => {
  // ---------- Utilities ----------
  const STORAGE_KEY = 'codraz_state_v1';
  function uid(prefix = 'id') {
    return prefix + '_' + Math.random().toString(36).slice(2,9);
  }
  function qs(sel, root=document) { return root.querySelector(sel); }
  function qsa(sel, root=document) { return Array.from(root.querySelectorAll(sel)); }

  // ---------- DOM elements ----------
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

  // ---------- State ----------
  let state = {
    tasks: [], // {id,title,topic,day(0-6),time,done(boolean),scoreHistory: [{date,correct,total}]}
    chat: [], // [{from:'bot'|'user',text,ts}]
    activity: [], // strings with timestamp
    wellness: null, // {value,at}
    settings: { dark:false },
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
    pushBotMessage('Hello! I am your study buddy. Ask me anything (simulated replies).');
    if (state.settings.dark) applyDark(true);
  }

  // ---------- UI helpers ----------
  function formatTime(t) {
    if (!t) return '';
    // t: "HH:MM"
    const [hh, mm] = t.split(':').map(n => Number(n));
    const ampm = hh >= 12 ? 'PM' : 'AM';
    const hr12 = ((hh + 11) % 12) + 1;
    return ${hr12}:${String(mm).padStart(2,'0')} ${ampm};
  }
  function nowText() {
    return new Date().toLocaleString();
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
    // subject
    if (todayTasks.length) {
      const top = todayTasks[0];
      focusSubject.innerText = top.title;
      focusDescription.innerText = top.topic || 'Practice and revise';
    } else {
      focusSubject.innerText = 'No tasks yet';
      focusDescription.innerText = 'Add a topic or a task to get started';
    }

    // progress: percent of today's tasks done
    const doneCount = todayTasks.filter(t => t.done).length;
    const pct = todayTasks.length ? Math.round(doneCount / todayTasks.length * 100) : 0;
    focusProgressPct.innerText = pct + '%';
    focusProgressBar.style.width = pct + '%';

    // avg score across all tasks
    let totalQuizzes = 0, totalCorrect = 0;
    state.tasks.forEach(t => {
      t.scoreHistory?.forEach(s => {
        totalQuizzes++;
        totalCorrect += s.correct;
      });
    });
    const avg = totalQuizzes ? Math.round((totalCorrect / (totalQuizzes * (safelyGetQuizLength()))) * 100) : 0;
    focusScore.innerText = avg;
  }

  function renderActivity() {
    recentActivityList.innerHTML = '';
    if (!state.activity.length) {
      recentActivityList.innerHTML = '<div class="activity-item"><span class="activity-icon">🤖</span><span class="activity-text">No recent actions</span></div>';
      return;
    }
    state.activity.slice(0,10).forEach(a => {
      const el = document.createElement('div');
      el.className = 'activity-item';
      el.innerHTML = `<span class="activity-icon">📚</span>
                      <span class="activity-text">${escapeHtml(a.text)}</span>
                      <span class="activity-time">${new Date(a.ts).toLocaleTimeString()}</span>`;
      recentActivityList.appendChild(el);
    });
  }

  function renderChat() {
    chatBox.innerHTML = '';
    if (!state.chat.length) {
      chatBox.innerHTML = '<div class="chat-item bot">Hello! Ask me anything.</div>';
      return;
    }
    state.chat.forEach(m => {
      const el = document.createElement('div');
      el.className = 'chat-item ' + (m.from === 'user' ? 'user' : 'bot');
      el.innerText = m.text;
      chatBox.appendChild(el);
    });
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function renderTasks() {
    // schedule day row
    daysRow.innerHTML = '';
    const dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    dayNames.forEach((d, i) => {
      const el = document.createElement('div');
      el.className = 'cal-day';
      el.innerText = d;
      daysRow.appendChild(el);
    });

    // schedule events
    renderScheduleEvents();

    // tasks list in editor
    tasksList.innerHTML = '';
    if (!state.tasks.length) {
      tasksList.innerHTML = '<div class="muted">No tasks. Add one using the form.</div>';
      return;
    }
    const filtered = applySearchFilter(state.tasks);
    filtered.forEach(t => {
      const wrapper = document.createElement('div');
      wrapper.className = 'task-item';
      wrapper.dataset.id = t.id;
      const left = document.createElement('div');
      left.className = 'left';
      left.innerHTML = `<strong>${escapeHtml(t.title)}</strong>
                        <div class="meta">${escapeHtml(t.topic || '')} • ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][t.day]} • ${formatTime(t.time)}</div>`;
      const actions = document.createElement('div');
      actions.className = 'task-actions';
      const play = document.createElement('button');
      play.className = 'btn small';
      play.innerText = 'Start Practice';
      play.addEventListener('click', () => startPracticeForTask(t.id));

      const toggle = document.createElement('button');
      toggle.className = 'btn outline small';
      toggle.innerText = t.done ? 'Undo' : 'Mark Done';
      toggle.addEventListener('click', () => {
        t.done = !t.done;
        saveState();
        renderAll();
        addActivity(${t.title} marked ${t.done ? 'done' : 'not done'});
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
        addActivity(Deleted task "${t.title}");
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
    // show next 8 events sorted by day/time
    const sorted = state.tasks.slice().sort((a,b) => (a.day - b.day) || (a.time.localeCompare(b.time)));
    if (!sorted.length) {
      scheduleEvents.innerHTML = '<div class="muted">No scheduled events. Add some tasks!</div>';
      return;
    }
    sorted.slice(0,12).forEach(t => {
      const el = document.createElement('div');
      el.className = 'event study';
      el.innerText = ${t.title} • ${formatTime(t.time)};
      scheduleEvents.appendChild(el);
    });
  }

  // ---------- Search ----------
  function applySearchFilter(arr) {
    const q = (searchInput.value || '').trim().toLowerCase();
    if (!q) return arr;
    return arr.filter(t => (t.title + ' '+ (t.topic||'') + ' '+ (t.time||'')).toLowerCase().includes(q));
  }

  // ---------- Task Editor ----------
  function populateDaySelect() {
    taskDay.innerHTML = '';
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    days.forEach((d,i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.innerText = d;
      taskDay.appendChild(opt);
    });
  }

  function openEditorForTask(id) {
    const t = state.tasks.find(x => x.id === id);
    if (!t) return;
    taskTitle.value = t.title;
    taskTopic.value = t.topic || '';
    taskDay.value = t.day;
    taskTime.value = t.time || '16:00';
    showPanelEditor();
    // on save, it will update existing if 'editingId' set
    editingId = id;
  }

  let editingId = null;
  function showPanelEditor() {
    // hide main dashboard grid, show schedule editor
    qs('#dashboardView').classList.add('hidden');
    scheduleEditor.classList.remove('hidden');
  }
  function hidePanelEditor() {
    qs('#dashboardView').classList.remove('hidden');
    scheduleEditor.classList.add('hidden');
    clearForm();
    editingId = null;
  }
  backToDash?.addEventListener('click', hidePanelEditor);

  clearFormBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    clearForm();
  });

  function clearForm() {
    taskTitle.value = '';
    taskTopic.value = '';
    taskDay.value = (new Date().getDay() + 6) % 7;
    taskTime.value = '16:00';
    editingId = null;
  }

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
      if (t) {
        Object.assign(t, payload);
        addActivity(Edited task "${t.title}");
      }
    } else {
      const newTask = Object.assign({ id: uid('task'), done:false, scoreHistory:[] }, payload);
      state.tasks.push(newTask);
      addActivity(Added task "${newTask.title}");
    }
    saveState();
    renderAll();
    hidePanelEditor();
  });

  // ---------- Chat (simulated) ----------
  function pushUserMessage(text) {
    const msg = { id: uid('m'), from:'user', text, ts: new Date().toISOString() };
    state.chat.push(msg);
    if (state.chat.length > 200) state.chat.shift();
    saveState();
    renderChat();
  }
  function pushBotMessage(text) {
    const msg = { id: uid('m'), from:'bot', text, ts: new Date().toISOString() };
    state.chat.push(msg);
    if (state.chat.length > 200) state.chat.shift();
    saveState();
    renderChat();
    addActivity(AI answered: ${text.substring(0,80)});
  }

  // Simple simulated AI: pattern-matching & helpful templates
  function simulatedAI(prompt) {
    const p = prompt.toLowerCase();
    // exact matches or keywords
    if (p.includes('phototropism')) return 'Phototropism is how plants bend toward light. Cells on the darker side grow faster so the plant curves to the light source.';
    if (p.includes('photosynthesis')) return 'Photosynthesis is how plants make food: they use sunlight, water, and CO₂ to produce sugar and oxygen.';
    if (p.includes('newton') && p.includes('2')) return 'Newton\'s 2nd law: Force = mass × acceleration. Push harder (more force) and acceleration increases.';
    if (p.includes('explain') && p.split(' ').length < 5) return 'Please give a little more detail or a topic (e.g., "Explain inertia in one paragraph").';
    if (p.includes('quiz') || p.includes('practice')) return 'To practice, open the schedule and press "Start Practice" on any task — a 50-question quiz will begin.';
    // fallback: give short, friendly answer
    const short = Here is a short explanation of "${prompt.split('\n')[0].slice(0,70)}":\n\n +
      '• Key idea: summarize main concept.\n' +
      '• Example: a simple illustrative example.\n' +
      '\nIf you want, ask for a short quiz or examples.';
    return short;
  }

  sendBtn?.addEventListener('click', async () => {
    const text = (chatInput.value || '').trim();
    if (!text) return;
    pushUserMessage(text);
    chatInput.value = '';
    // Show thinking...
    pushBotMessage('Thinking...');
    // replace last bot 'Thinking...' after simulated response
    setTimeout(() => {
      // remove the last bot 'Thinking...' and replace
      const lastBotIndex = state.chat.map(c=>c.from).lastIndexOf('bot');
      if (lastBotIndex >= 0 && state.chat[lastBotIndex].text === 'Thinking...') {
        state.chat.splice(lastBotIndex,1);
      }
      const ans = simulatedAI(text);
      pushBotMessage(ans);
      saveState();
    }, 600 + Math.random()*800);
  });

  exampleBtn?.addEventListener('click', () => {
    chatInput.value = 'Explain phototropism in simple words with one example.';
    sendBtn.click();
  });
  clearBtn?.addEventListener('click', () => {
    if (!confirm('Clear chat history?')) return;
    state.chat = [];
    saveState();
    renderChat();
  });

  // ---------- Wellness ----------
  emojiBtns.forEach(b => {
    b.addEventListener('click', () => {
      const v = Number(b.dataset.value || 3);
      state.wellness = { value: v, at: new Date().toISOString() };
      saveState();
      wellnessMsg.innerText = v >= 4 ? 'Great — keep it up!' : v === 3 ? 'Take short breaks.' : 'Sorry to hear that. Try a 5-min walk.';
      wellnessMsg.style.color = v <= 2 ? 'var(--danger)' : 'var(--success)';
      addActivity(Wellness check: ${v});
      if (v === 1) {
        // gently suggest a short practice quiz
        openQuizModal();
      }
    });
  });

  // ---------- Quiz system ----------
  // We'll generate 50 mock questions for a given topic (or mixed) client-side.
  const QUIZ_LENGTH = 50;
  let quizState = {
    open: false,
    questions: [], // {id,question,choices,answerIndex}
    index: 0,
    answers: {}, // qid -> chosenIndex
    taskId: null,
    topic: 'General'
  };

  function safelyGetQuizLength() { return QUIZ_LENGTH; }

  function generateMockQuestions(topic, count=QUIZ_LENGTH) {
    const qs = [];
    const base = [
      {q:Basic: What is 2+2?, choices:[ '3','4','5','2' ], a:1},
      {q:Which planet is nearest to the Sun?, choices:['Venus','Earth','Mercury','Mars'], a:2},
      {q:Which gas do plants produce?, choices:['CO₂','O₂','N₂','H₂'], a:1},
      {q:Who wrote Hamlet?, choices:['Shakespeare','Dickens','Austen','Orwell'], a:0},
      {q:What is H₂O commonly called?, choices:['Salt','Water','Oxygen','Hydrogen'], a:1},
      {q:Which angle is 90°?, choices:['Acute','Right','Obtuse','Straight'], a:1},
      {q:What is the chemical symbol for sodium?, choices:['Na','S','K','N'], a:0},
      {q:What is 5×6?, choices:['30','11','56','25'], a:0},
      {q:Which organ pumps blood?, choices:['Lungs','Liver','Heart','Kidney'], a:2},
      {q:What do bees collect?, choices:['Milk','Pollen','Water','Sand'], a:1},
    ];
    for (let i=0;i<count;i++){
      const sample = base[i % base.length];
      qs.push({
        id: uid('q'),
        question: ${sample.q} (${topic}),
        choices: sample.choices.slice(),
        answerIndex: sample.a
      });
    }
    return qs;
  }

  function openQuizModal(forTaskId = null, topic = 'General') {
    quizState.questions = generateMockQuestions(topic, QUIZ_LENGTH);
    quizState.index = 0;
    quizState.answers = {};
    quizState.open = true;
    quizState.taskId = forTaskId;
    quizState.topic = topic;
    quizResults.style.display = 'none';
    quizContainer.style.display = 'block';
    quizModal.classList.add('visible');
    quizModal.setAttribute('aria-hidden','false');
    renderQuizQuestion();
  }

  function closeQuizModal() {
    quizModal.classList.remove('visible');
    quizModal.setAttribute('aria-hidden','true');
    quizState.open = false;
  }
  closeQuizModalBtn?.addEventListener('click', closeQuizModal);
  closeResultsModalBtn?.addEventListener('click', closeQuizModal);

  function renderQuizQuestion() {
    const q = quizState.questions[quizState.index];
    if (!q) return;
    quizQuestionEl.innerText = ${quizState.index + 1}. ${q.question};
    quizOptionsEl.innerHTML = '';
    q.choices.forEach((choice, idx) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option-btn';
      btn.innerText = choice;
      btn.addEventListener('click', () => {
        // disable buttons
        qsa('.quiz-option-btn', quizOptionsEl).forEach(b => b.disabled = true);
        quizState.answers[q.id] = idx;
        if (idx === q.answerIndex) {
          btn.classList.add('selected','correct');
        } else {
          btn.classList.add('selected','wrong');
          // highlight correct
          const correctBtn = Array.from(quizOptionsEl.children).find(b => b.innerText === q.choices[q.answerIndex]);
          if (correctBtn) correctBtn.classList.add('correct');
        }
        nextQuizQuestionBtn.style.display = 'inline-block';
        nextQuizQuestionBtn.innerText = (quizState.index === quizState.questions.length - 1) ? 'Show Results' : 'Next';
      });
      quizOptionsEl.appendChild(btn);
    });
    nextQuizQuestionBtn.style.display = 'none';
    quizProgressText.innerText = ${quizState.index + 1} / ${quizState.questions.length};
  }

  nextQuizQuestionBtn?.addEventListener('click', () => {
    // advance
    if (quizState.index < quizState.questions.length - 1) {
      quizState.index++;
      renderQuizQuestion();
    } else {
      // finish
      showQuizResults();
    }
  });

  restartQuizBtn?.addEventListener('click', () => {
    openQuizModal(quizState.taskId, quizState.topic);
  });

  function showQuizResults() {
    // calculate score
    let correct = 0;
    quizState.questions.forEach(q => {
      if (quizState.answers[q.id] === q.answerIndex) correct++;
    });
    quizScoreEl.innerText = correct;
    quizTotalQuestionsEl.innerText = quizState.questions.length;
    quizContainer.style.display = 'none';
    quizResults.style.display = 'block';
    // persist to task if taskId present
    if (quizState.taskId) {
      const t = state.tasks.find(x => x.id === quizState.taskId);
      if (t) {
        t.scoreHistory = t.scoreHistory || [];
        t.scoreHistory.push({ date: new Date().toISOString(), correct, total: quizState.questions.length, topic: quizState.topic });
        saveState();
        addActivity(Completed quiz for "${t.title}" — ${correct}/${quizState.questions.length});
      }
    } else {
      addActivity(Completed a quiz — ${correct}/${quizState.questions.length});
    }
    renderAll();
  }

  // Start practice for a given task id
  function startPracticeForTask(taskId) {
    const t = state.tasks.find(x => x.id === taskId);
    openQuizModal(taskId, t ? (t.topic || t.title || 'General') : 'General');
  }

  // ---------- Buttons / Actions ----------
  addTaskBtn?.addEventListener('click', () => {
    showPanelEditor();
  });
  markAllDoneBtn?.addEventListener('click', () => {
    const today = (new Date().getDay() + 6) % 7;
    state.tasks.forEach(t => { if (t.day === today) t.done = true; });
    saveState();
    renderAll();
    addActivity('Marked today tasks done');
  });

  // Side nav
  navItems.forEach(n => n.addEventListener('click', () => {
    navItems.forEach(x => x.classList.remove('active'));
    n.classList.add('active');
    const target = n.dataset.nav;
    if (target === 'schedule') {
      showPanelEditor();
    } else if (target === 'assistant') {
      // scroll to chat
      window.scrollTo({ top: qs('#assistantView').offsetTop - 50, behavior:'smooth' });
    } else {
      hidePanelEditor();
      window.scrollTo({ top: 0, behavior:'smooth' });
    }
  }));

  searchInput?.addEventListener('input', () => {
    renderTasks();
  });

  // keyboard submit for chat
  chatInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendBtn.click();
    }
  });

  // ---------- Dark mode ----------
  toggleDark?.addEventListener('click', () => {
    const now = !state.settings.dark;
    applyDark(now);
    state.settings.dark = now;
    saveState();
  });
  function applyDark(flag) {
    if (flag) {
      document.documentElement.style.setProperty('--bg','#0b1220');
      document.documentElement.style.setProperty('--card','#071127');
      document.documentElement.style.setProperty('--text','#e6eef8');
    } else {
      document.documentElement.style.removeProperty('--bg');
      document.documentElement.style.removeProperty('--card');
      document.documentElement.style.removeProperty('--text');
    }
    state.settings.dark = !!flag;
  }

  // ---------- Safety / helpers ----------
  function escapeHtml(s='') {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // ---------- On load ----------
  init();

  // expose some functions for debugging in console (optional)
  window.CodraZ = {
    state, saveState, loadState, openQuizModal, startPracticeForTask
  };

})();
