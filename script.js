// Main application script for EduFlow Pro
(() => {
  'use strict';
  
  const STORAGE_KEY = 'EduFlow_Pro_state_v1';
  let notifiedTaskIds = [];
  let currentSort = { field: 'date', ascending: true };
  let confirmCallback = null;
  let notificationIntervalId = null;
  let breathIntervalId = null;
  let wellnessTipIntervalId = null;
  let loadingToastId = null;

  // Utility functions
  function uid(prefix = 'id') { 
    return prefix + '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36); 
  }
  
  function qs(sel, root = document) { 
    return root.querySelector(sel); 
  }
  
  function qsa(sel, root = document) { 
    return Array.from(root.querySelectorAll(sel)); 
  }
  
  function escapeHtml(unsafe) { 
    if (typeof unsafe !== 'string') return ''; 
    return unsafe.replace(/&/g, "&amp;")
                 .replace(/</g, "&lt;")
                 .replace(/>/g, "&gt;")
                 .replace(/"/g, "&quot;")
                 .replace(/'/g, "&#039;"); 
  }

  // DOM cache
  const mainTitleEl = qs('#mainTitle');
  const addTaskBtn = qs('#addTaskBtn');
  const addTaskBtnText = qs('#addTaskBtn > span:first-child');
  const addTaskBtnSpinner = qs('#addTaskBtn > .loading-indicator');
  const markAllDoneBtn = qs('#markAllDoneBtn');
  const focusSubject = qs('#focusSubject');
  const focusDescription = qs('#focusDescription');
  const focusProgressPct = qs('#focusProgressPct');
  const focusProgressBar = qs('#focusProgressBar');
  const focusTasks = qs('#focusTasks');
  const focusScore = qs('#focusScore');
  const startFocusSessionBtn = qs('#startFocusSessionBtn');
  const daysRow = qs('#daysRow');
  const tasksList = qs('#tasksList');
  const taskForm = qs('#taskForm');
  const taskTitleInput = qs('#taskTitle');
  const taskSubjectInput = qs('#taskSubject');
  const taskDateInput = qs('#taskDate');
  const taskPriorityInput = qs('#taskPriority');
  const taskNotesInput = qs('#taskNotes');
  const editTaskIdInput = qs('#editTaskId');
  const clearFormBtn = qs('#clearFormBtn');
  const subjectSuggestionsDatalist = qs('#subjectSuggestions');
  const activityList = qs('#activityList');
  const quickTaskForm = qs('#quickTaskForm');
  const quickTaskTitleInput = qs('#quickTaskTitle');
  const quickTaskSubjectSelect = qs('#quickTaskSubject');
  const consistencyStreakEl = qs('#consistencyStreak');
  const scheduleTaskList = qs('#scheduleTaskList');
  const mainNav = qs('#mainNav');
  const chatInput = qs('#chatInput');
  const chatForm = qs('#chatForm');
  const chatSendBtn = qs('#chatSendBtn');
  const chatSendBtnText = qs('#chatSendBtn > span:first-child');
  const chatSendBtnSpinner = qs('#chatSendBtn > .loading-indicator');
  const chatMessagesContainer = qs('#chatMessages');
  const typingIndicator = qs('#typingIndicator');
  const clearChatBtn = qs('#clearChatBtn');
  const quizModal = qs('#quizModal');
  const closeQuizModalBtn = qs('#closeQuizModal');
  const quizContainer = qs('#quizContainer');
  const quizQuestionEl = qs('#quizQuestion');
  const quizOptionsEl = qs('#quizOptions');
  const nextQuizQuestionBtn = qs('#nextQuizQuestion');
  const quizProgressText = qs('#quizProgressText');
  const quizResultsEl = qs('#quizResults');
  const quizScoreEl = qs('#quizScore');
  const quizTotalQuestionsEl = qs('#quizTotalQuestions');
  const restartQuizBtn = qs('#restartQuiz');
  const closeResultsBtn = qs('#closeResultsBtn');
  const breathingCircle = qs('#breathingCircle');
  const breathingInstruction = qs('#breathingInstruction');
  const changeWellnessGameBtn = qs('#changeWellnessGameBtn');
  const wellnessTipText = qs('#wellnessTipText');
  const darkModeToggle = qs('#darkModeToggle');
  const notificationToggle = qs('#notificationToggle');
  const clearDataBtn = qs('#clearDataBtn');
  const exportDataBtn = qs('#exportDataBtn');
  const storageUsageEl = qs('#storageUsage');
  const toggleThemeBtn = qs('#toggleThemeBtn');
  const loadingOverlay = qs('#loadingOverlay');
  const toastContainer = qs('#toastContainer');
  const sortTasksByDateBtn = qs('#sortTasksByDateBtn');
  const sortTasksByPriorityBtn = qs('#sortTasksByPriorityBtn');
  const confirmModal = qs('#confirmModal');
  const confirmTitle = qs('#confirmTitle');
  const confirmMessage = qs('#confirmMessage');
  const confirmYesBtn = qs('#confirmYesBtn');
  const confirmNoBtn = qs('#confirmNoBtn');
  const copyrightYearEl = qs('#copyrightYear');
  const welcomeMessageEl = qs('#welcomeMessage');
  const showCompletedToggle = qs('#showCompletedToggle');

  // Profile elements
  const profileUserName = qs('#profileUserName');
  const profileUserEmail = qs('#profileUserEmail');
  const profileJoinDate = qs('#profileJoinDate');
  const profileAvatarLarge = qs('#profileAvatarLarge');
  const statTotalTasks = qs('#statTotalTasks');
  const statCompletedTasks = qs('#statCompletedTasks');
  const statCurrentStreak = qs('#statCurrentStreak');
  const statQuizzesTaken = qs('#statQuizzesTaken');
  const statFocusHours = qs('#statFocusHours');
  const statSubjects = qs('#statSubjects');
  const profileForm = qs('#profileForm');
  const profileUsername = qs('#profileUsername');
  const profileEmail = qs('#profileEmail');
  const profileStudyFocus = qs('#profileStudyFocus');
  const profileBio = qs('#profileBio');
  const saveProfileBtn = qs('#saveProfileBtn');
  const randomizeAvatarBtn = qs('#randomizeAvatarBtn');
  const currentAvatarDisplay = qs('#currentAvatarDisplay');
  const avgStudyTime = qs('#avgStudyTime');
  const completionRate = qs('#completionRate');
  const topSubject = qs('#topSubject');

  // State
  const DEFAULT_STATE = {
    tasks: [],
    stats: { 
      lastFocusSubject: null, 
      streak: 0, 
      lastPracticeDate: null,
      totalQuizzes: 0,
      totalFocusHours: 0,
      joinDate: new Date().toISOString()
    },
    chat: [],
    currentQuiz: { subject: null, questions: [], currentQuestionIndex: 0, score: 0, userAnswers: [], isActive: false },
    settings: { darkMode: false, notifications: false, showCompleted: false, autoSave: true },
    activities: [],
    currentView: 'dashboard',
    profile: {
      username: 'User',
      email: '',
      studyFocus: '',
      bio: '',
      avatarStyle: 'initial'
    }
  };
  
  let state = loadState();

  function loadState() {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) {
      try { 
        const savedState = JSON.parse(s);
        // Migrate old data if needed
        if (!savedState.profile) {
          savedState.profile = DEFAULT_STATE.profile;
          // Try to get from localStorage if exists
          const oldUsername = localStorage.getItem('username');
          if (oldUsername) {
            savedState.profile.username = oldUsername;
            savedState.profile.email = localStorage.getItem('email') || '';
          }
        }
        if (!savedState.stats.joinDate) {
          savedState.stats.joinDate = DEFAULT_STATE.stats.joinDate;
        }
        return mergeDeep(JSON.parse(JSON.stringify(DEFAULT_STATE)), savedState); 
      }
      catch (e) { 
        console.error("Load state error:", e); 
        showToast("Could not load saved data.", "error"); 
      }
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  function saveState() { 
    try { 
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); 
      updateStorageUsageDisplay(); 
    } catch (e) { 
      console.error("Save state error:", e); 
      showToast("Error saving data.", 'error'); 
    } 
  }

  function isObject(item) { 
    return (item && typeof item === 'object' && !Array.isArray(item)); 
  }
  
  function mergeDeep(target, source) {
    let o = { ...target };
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach(k => {
        if (isObject(source[k])) {
          if (!(k in target) || !isObject(target[k])) o[k] = source[k];
          else o[k] = mergeDeep(target[k], source[k]);
        } else { o[k] = source[k]; }
      });
    }
    return o;
  }

  function addActivity(text) { 
    const MAX = 20; 
    state.activities.unshift({id: uid('act'), text, ts: new Date().toISOString()}); 
    state.activities.length = Math.min(state.activities.length, MAX); 
    renderActivityFeed(); 
  }

  // Enhanced initialization
  function init() {
    initAuth();
    setupSignOut();
    preventBackNavigation();
    
    // Apply settings
    applyDark(state.settings.darkMode);
    if (darkModeToggle) darkModeToggle.checked = state.settings.darkMode;
    if (notificationToggle) notificationToggle.checked = state.settings.notifications;
    if (showCompletedToggle) showCompletedToggle.checked = state.settings.showCompleted;
    updateThemeButtonIcon();
    
    // Wait for auth state
    auth.onAuthStateChanged((user) => {
      if (user) {
        // Continue with app initialization
        if (copyrightYearEl) {
          copyrightYearEl.textContent = `© ${new Date().getFullYear()}`;
        }
        switchView(state.currentView, true);
        renderTasks(); 
        renderFocusBlock(); 
        renderWeeklyProgress(); 
        renderActivityFeed();
        updateSubjectDatalist(); 
        updateQuickAddTaskSubjects(); 
        renderChat(); 
        renderScheduleTasks();
        if (taskDateInput) taskDateInput.valueAsDate = new Date();
        addEventListeners(); 
        
        // Add PDF export functionality
        if (exportDataBtn) {
          exportDataBtn.addEventListener('click', exportProgressToPDF);
        }
        
        startBreathingAnimation(); 
        updateStorageUsageDisplay(); 
        startWellnessTipCycle();
        
        if (loadingOverlay) {
          loadingOverlay.setAttribute('aria-hidden', 'true');
        }
      }
    });
  }

  function addEventListeners() {
    if (mainNav) mainNav.addEventListener('click', handleNavClick);
    if (tasksList) tasksList.addEventListener('click', handleTaskListClick);
    if (quizOptionsEl) quizOptionsEl.addEventListener('click', handleQuizOptionSelect);
    if (confirmModal) confirmModal.addEventListener('click', (e) => { if (e.target === confirmModal) closeConfirmModal(); });
    if (taskForm) taskForm.addEventListener('submit', handleTaskFormSubmit);
    if (clearFormBtn) clearFormBtn.addEventListener('click', clearTaskForm);
    if (markAllDoneBtn) markAllDoneBtn.addEventListener('click', markTodaysPracticedTasksDone);
    if (quickTaskForm) quickTaskForm.addEventListener('submit', handleQuickTaskSubmit);
    if (startFocusSessionBtn) startFocusSessionBtn.addEventListener('click', () => startQuizForFocusSubject());
    if (closeQuizModalBtn) closeQuizModalBtn.addEventListener('click', closeQuizModal);
    if (nextQuizQuestionBtn) nextQuizQuestionBtn.addEventListener('click', handleNextQuizQuestion);
    if (restartQuizBtn) restartQuizBtn.addEventListener('click', () => startQuizForFocusSubject(state.currentQuiz.subject));
    if (closeResultsBtn) closeResultsBtn.addEventListener('click', closeQuizModal);
    if (chatForm) chatForm.addEventListener('submit', handleChatSubmit);
    if (clearChatBtn) clearChatBtn.addEventListener('click', handleClearChat);
    if (darkModeToggle) darkModeToggle.addEventListener('change', handleDarkModeToggle);
    if (notificationToggle) notificationToggle.addEventListener('change', handleNotificationToggle);
    if (toggleThemeBtn) toggleThemeBtn.addEventListener('click', handleThemeToggleClick);
    if (clearDataBtn) clearDataBtn.addEventListener('click', handleClearData);
    if (changeWellnessGameBtn) changeWellnessGameBtn.addEventListener('click', () => showToast("More wellness exercises coming soon!", 'info'));
    if (sortTasksByDateBtn) sortTasksByDateBtn.addEventListener('click', () => sortAndRenderTasks('date'));
    if (sortTasksByPriorityBtn) sortTasksByPriorityBtn.addEventListener('click', () => sortAndRenderTasks('priority'));
    if (confirmNoBtn) confirmNoBtn.addEventListener('click', closeConfirmModal);
    if (confirmYesBtn) confirmYesBtn.addEventListener('click', handleConfirmYes);
    if (showCompletedToggle) showCompletedToggle.addEventListener('change', handleShowCompletedToggle);
    
    // Profile event listeners
    if (profileForm) profileForm.addEventListener('submit', handleProfileSubmit);
    if (randomizeAvatarBtn) randomizeAvatarBtn.addEventListener('click', handleRandomizeAvatar);
    
    // Avatar style options
    const avatarStyleOptions = qsa('.avatar-style-option');
    avatarStyleOptions.forEach(option => {
      option.addEventListener('click', handleAvatarStyleChange);
    });

    // Close quiz on Esc
    document.addEventListener('keydown', (e) => { 
      if (e.key === 'Escape') { 
        if (quizModal && quizModal.getAttribute('aria-hidden') === 'false') closeQuizModal(); 
        if (confirmModal && confirmModal.getAttribute('aria-hidden') === 'false') closeConfirmModal(); 
      }
    });
  }

  // Views
  function handleNavClick(e) { 
    const btn = e.target.closest('.nav-item'); 
    if (btn?.dataset.nav && btn.dataset.nav !== state.currentView) switchView(btn.dataset.nav); 
  }

  function switchView(viewName, isInitialLoad = false) {
    if (loadingOverlay) loadingOverlay.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => { setTimeout(() => {
      state.currentView = viewName;
      qsa('.nav-item', mainNav).forEach(el => el.classList.toggle('active', el.dataset.nav === viewName));
      let title = viewName[0].toUpperCase() + viewName.slice(1);
      const btn = qs(`.nav-item[data-nav="${viewName}"] span`, mainNav); 
      if (btn) title = btn.textContent.trim();
      if (mainTitleEl) mainTitleEl.textContent = title;
      qsa('main.content > section[data-view]').forEach(s => s.hidden = true);
      const target = qs(`main.content > section[data-view="${viewName}"]`);
      if (target) target.hidden = false;
      else {
        console.warn(`View ${viewName} missing.`);
        qs('main.content > section[data-view="dashboard"]').hidden = false;
        state.currentView = 'dashboard';
        qs('.nav-item.active', mainNav)?.classList.remove('active');
        qs('.nav-item[data-nav="dashboard"]', mainNav)?.classList.add('active');
      }
      if (!isInitialLoad) saveState();
      switch (viewName) {
        case 'dashboard': 
          renderFocusBlock(); 
          renderWeeklyProgress(); 
          renderTasks(); 
          renderActivityFeed(); 
          break;
        case 'assistant': 
          renderChat(); 
          chatInput?.focus(); 
          break;
        case 'schedule': 
          renderScheduleTasks(); 
          break;
        case 'profile':
          renderProfilePage();
          break;
        case 'settings': 
          updateStorageUsageDisplay(); 
          checkNotificationStatus(); 
          break;
      }
      if (loadingOverlay) loadingOverlay.setAttribute('aria-hidden', 'true');
    }, 50); });
  }

  // Tasks
  async function handleTaskFormSubmit(e) {
    e.preventDefault();
    const id = editTaskIdInput.value;
    const txt = id ? "Update Task" : "Add Task";
    setButtonLoading(addTaskBtn, addTaskBtnSpinner, addTaskBtnText, true, "Saving...", txt);
    await new Promise(r => setTimeout(r, 120));
    const d = {
      id: id || uid('t'),
      title: taskTitleInput.value.trim(),
      subject: taskSubjectInput.value.trim() || 'General',
      date: taskDateInput.value,
      priority: taskPriorityInput.value,
      notes: taskNotesInput.value.trim(),
      done: id ? (state.tasks.find(t => t.id === id)?.done || false) : false,
      practicedOn: id ? (state.tasks.find(t => t.id === id)?.practicedOn || []) : []
    };
    if (!d.title || !d.date) { 
      showToast("Title & date required.", 'error'); 
      setButtonLoading(addTaskBtn, addTaskBtnSpinner, addTaskBtnText, false, null, txt); 
      return; 
    }
    if (id) updateTask(d); else addTask(d);
    clearTaskForm();
    updateSubjectDatalist(); updateQuickAddTaskSubjects(); renderFocusBlock(); renderScheduleTasks();
    setButtonLoading(addTaskBtn, addTaskBtnSpinner, addTaskBtnText, false, null, "Add Task");
  }

  function addTask(task) { 
    state.tasks.unshift(task); 
    addActivity(`Added: "${task.title}"`); 
    saveState(); 
    renderTasks(task.id); 
    showToast(`Task "${escapeHtml(task.title)}" added`, 'success'); 
  }

  function updateTask(updatedTask) { 
    const i = state.tasks.findIndex(t => t.id === updatedTask.id); 
    if (i > -1) { 
      state.tasks[i] = updatedTask; 
      addActivity(`Updated: "${updatedTask.title}"`); 
      saveState(); 
      renderTasks(); 
      showToast(`Task "${escapeHtml(updatedTask.title)}" updated`, 'info'); 
    } 
    editTaskIdInput.value = ''; 
  }

  function deleteTask(taskId) { 
    const task = state.tasks.find(t => t.id === taskId); 
    if (task) { 
      showConfirmModal("Delete Task?", `Delete "${escapeHtml(task.title)}"?`, () => { 
        performDeleteTask(taskId, task.title); 
      }); 
    } 
  }

  function performDeleteTask(taskId, taskTitle) { 
    const i = state.tasks.findIndex(t => t.id === taskId); 
    if (i > -1) { 
      state.tasks.splice(i, 1); 
      addActivity(`Deleted: "${taskTitle}"`); 
      saveState(); 
      qs(`.task-item[data-id="${taskId}"]`)?.remove(); 
      renderFocusBlock(); 
      renderScheduleTasks(); 
      showToast(`Task "${escapeHtml(taskTitle)}" deleted`, 'info'); 
      if (editTaskIdInput.value === taskId) clearTaskForm(); 
    } 
  }

  function toggleTaskDone(taskId) { 
    const task = state.tasks.find(t => t.id === taskId); 
    if (task) { 
      task.done = !task.done; 
      addActivity(`${task.done ? 'Completed' : 'Un-completed'}: "${task.title}"`); 
      saveState(); 
      qs(`.task-item[data-id="${taskId}"]`)?.classList.toggle('done', task.done); 
      renderFocusBlock(); 
      if (!state.settings.showCompleted) renderTasks(); 
    } 
  }

  function markTaskPracticed(taskId) {
    const task = state.tasks.find(t => t.id === taskId); 
    const today = getTodayString();
    if (task) {
      task.practicedOn = task.practicedOn || [];
      if (!task.practicedOn.includes(today)) {
        task.practicedOn.push(today);
        state.stats[today] = state.stats[today] || { practiced: false, score: 0, date: today };
        state.stats[today].practiced = true;
        state.stats.lastPracticeDate = today;
        addActivity(`Practice started for: "${task.title}"`);
        saveState(); 
        renderTasks(); 
        renderFocusBlock(); 
        renderWeeklyProgress();
        return true;
      }
    }
    return false;
  }

  function editTask(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
      if (state.currentView !== 'dashboard') switchView('dashboard');
      taskTitleInput.value = task.title;
      taskSubjectInput.value = task.subject;
      taskDateInput.value = task.date;
      taskPriorityInput.value = task.priority;
      taskNotesInput.value = task.notes;
      editTaskIdInput.value = task.id;
      addTaskBtnText.textContent = 'Update Task';
      taskTitleInput.focus();
      taskForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function clearTaskForm() { 
    taskForm.reset(); 
    editTaskIdInput.value = ''; 
    taskDateInput.valueAsDate = new Date(); 
    addTaskBtnText.textContent = 'Add Task'; 
  }

  function handleTaskListClick(e) {
    const target = e.target, item = target.closest('.task-item');
    if (!item) return;
    const id = item.dataset.id, task = state.tasks.find(t => t.id === id);
    if (target.type === 'checkbox' || target.classList.contains('task-checkbox')) toggleTaskDone(id);
    else if (target.dataset.action === 'edit') editTask(id);
    else if (target.dataset.action === 'delete') deleteTask(id);
    else if (target.dataset.action === 'practice' && task) { markTaskPracticed(id); startQuizForFocusSubject(task.subject); }
  }

  function handleQuickTaskSubmit(e) {
    e.preventDefault();
    const title = quickTaskTitleInput.value.trim();
    if (!title) return;
    const subject = quickTaskSubjectSelect.value || 'General';
    const newTask = { id: uid('t'), title, subject, date: getTodayString(), priority: 'medium', notes: '', done: false, practicedOn: [] };
    addTask(newTask);
    quickTaskTitleInput.value = '';
    quickTaskSubjectSelect.value = 'General';
  }

  function markTodaysPracticedTasksDone() {
    const today = getTodayString(); 
    let count = 0;
    state.tasks.forEach(t => { 
      if (t.practicedOn?.includes(today) && !t.done) { 
        t.done = true; 
        count++; 
      }
    });
    if (count > 0) { 
      addActivity(`Marked ${count} practiced tasks done.`); 
      saveState(); 
      renderTasks(); 
      renderFocusBlock(); 
      showToast(`Marked ${count} practiced tasks done.`, 'success'); 
    }
    else showToast("No uncompleted practiced tasks for today.", 'info');
  }

  function sortAndRenderTasks(field) {
    if (currentSort.field === field) currentSort.ascending = !currentSort.ascending;
    else { currentSort.field = field; currentSort.ascending = true; }
    showToast(`Sorted by ${field} ${currentSort.ascending ? 'asc' : 'desc'}`, 'info');
    renderTasks();
  }

  function handleShowCompletedToggle(e) { 
    state.settings.showCompleted = e.target.checked; 
    saveState(); 
    renderTasks(); 
  }

  // rendering
  function renderTasks(newTaskID = null) {
    if (!tasksList) return;
    const prioOrder = { high: 1, medium: 2, low: 3 };
    const filteredTasks = state.settings.showCompleted ? state.tasks : state.tasks.filter(t => !t.done);
    const sortedTasks = [...filteredTasks].sort((a,b) => {
      let comp = 0;
      if (currentSort.field === 'date') comp = new Date(a.date + 'T00:00') - new Date(b.date + 'T00:00');
      else if (currentSort.field === 'priority') comp = (prioOrder[a.priority]||3) - (prioOrder[b.priority]||3);
      if (comp === 0) {
        if (currentSort.field !== 'date') comp = new Date(a.date + 'T00:00') - new Date(b.date + 'T00:00');
        else comp = (prioOrder[a.priority]||3) - (prioOrder[b.priority]||3);
      }
      return currentSort.ascending ? comp : -comp;
    });
    if (sortedTasks.length === 0) {
      tasksList.innerHTML = `<p class="muted-text">${state.settings.showCompleted && state.tasks.length > 0 ? 'All tasks hidden by filter.' : 'No tasks here!'}</p>`;
      return;
    }
    const frag = document.createDocumentFragment();
    sortedTasks.forEach(t => {
      const done = t.done, today = getTodayString(), practiced = t.practicedOn?.includes(today), prioClass = `task-priority-${t.priority}`;
      const dDate = new Date(t.date + 'T00:00:00').toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' });
      const item = document.createElement('div');
      item.className = `task-item ${done ? 'done' : ''}`;
      item.dataset.id = t.id;
      if (t.id === newTaskID) item.classList.add('fade-in');
      item.innerHTML = `
        <div class="task-info"><input type="checkbox" class="task-checkbox" ${done ? 'checked' : ''} title="Mark ${done ? 'Incomplete' : 'Complete'}"><span class="task-title">${escapeHtml(t.title)}</span></div>
        <div class="task-details"><span>${escapeHtml(t.subject)} | Due: ${dDate} | <span class="${prioClass}">${t.priority}</span></span>${t.notes ? `<p>${escapeHtml(t.notes)}</p>` : ''}</div>
        <div class="task-actions">
          <button class="btn small outline ${practiced ? 'success' : ''}" data-action="practice" title="Practice (Quiz)">${practiced ? '✅ Practiced' : '🧠 Practice (Quiz)'}</button>
          <button class="btn small outline" data-action="edit" title="Edit">✏️</button>
          <button class="btn small danger outline" data-action="delete" title="Delete">🗑️</button>
        </div>`;
      frag.appendChild(item);
    });
    tasksList.innerHTML = '';
    tasksList.appendChild(frag);
    if (newTaskID) { const el = qs(`.task-item[data-id="${newTaskID}"]`); if (el) requestAnimationFrame(() => el.classList.remove('fade-in')); }
  }

  function updateSubjectDatalist() {
    if (!subjectSuggestionsDatalist) return;
    const subjects = [...new Set(state.tasks.map(t => t.subject))].filter(Boolean).sort();
    subjectSuggestionsDatalist.innerHTML = subjects.map(s => `<option value="${escapeHtml(s)}"></option>`).join('');
  }

  function updateQuickAddTaskSubjects() {
    if (!quickTaskSubjectSelect) return;
    const subjects = [...new Set(state.tasks.map(t => t.subject))].filter(Boolean).sort();
    const current = quickTaskSubjectSelect.value;
    while (quickTaskSubjectSelect.options.length > 1) quickTaskSubjectSelect.remove(1);
    subjects.forEach(s => { const esc = escapeHtml(s); quickTaskSubjectSelect.add(new Option(esc, esc)); });
    quickTaskSubjectSelect.value = subjects.includes(current) ? current : 'General';
  }

  function renderActivityFeed() {
    if (!activityList) return;
    if (state.activities.length === 0) { activityList.innerHTML = '<li>No recent activity.</li>'; return; }
    activityList.innerHTML = state.activities.map(act => `<li><span>${escapeHtml(act.text)}</span> <span class="activity-time">${formatTimeAgo(act.ts)}</span></li>`).join('');
  }

  function renderFocusBlock() {
    if (!focusSubject || !focusDescription || !focusProgressBar || !focusProgressPct || !focusTasks || !startFocusSessionBtn) return;
    const today = getTodayString();
    const upcoming = state.tasks.filter(t => !t.done && t.date >= today).sort((a,b) => new Date(a.date) - new Date(b.date));
    let focusSub = state.stats.lastFocusSubject || null;
    let tasksForFocus = focusSub ? upcoming.filter(t => t.subject === focusSub) : [];
    if (!focusSub || tasksForFocus.length === 0) {
      focusSub = upcoming.length > 0 ? upcoming[0].subject : "No upcoming tasks";
      tasksForFocus = upcoming.filter(t => t.subject === focusSub);
    }
    if (state.stats.lastFocusSubject !== focusSub && focusSub !== "No upcoming tasks") state.stats.lastFocusSubject = focusSub;
    const allFocus = state.tasks.filter(t => t.subject === focusSub);
    const doneFocus = allFocus.filter(t => t.done);
    const progress = allFocus.length > 0 ? Math.round((doneFocus.length / allFocus.length) * 100) : (focusSub === "No upcoming tasks" ? 0 : 100);
    focusSubject.textContent = escapeHtml(focusSub);
    focusDescription.textContent = (focusSub === "No upcoming tasks") ? "Add tasks" : `${doneFocus.length}/${allFocus.length} done.`;
    focusProgressPct.textContent = `${progress}%`;
    if (focusProgressBar) focusProgressBar.style.width = `${progress}%`;
    focusTasks.innerHTML = tasksForFocus.slice(0, 2).map(t => `<p>➡️ ${escapeHtml(t.title)} (Due: ${t.date})</p>`).join('') || (focusSub !== "No upcoming tasks" ? '<p class="muted-text">All tasks done!</p>' : '');
    const subjectStats = state.stats[focusSub], scores = subjectStats?.scores || [];
    const avgScore = scores.length > 0 ? (scores.reduce((s,c) => s + c, 0) / scores.length).toFixed(0) + '%' : 'N/A';
    focusScore.textContent = avgScore;
    startFocusSessionBtn.disabled = tasksForFocus.length === 0 || focusSub === "No upcoming tasks";
  }

  function renderWeeklyProgress() {
    if (!daysRow || !consistencyStreakEl) return;
    const today = new Date(), todayStr = getTodayString(today), dayOfWeek = today.getDay();
    updateConsistencyStreak();
    consistencyStreakEl.textContent = `${state.stats.streak} day${state.stats.streak !== 1 ? 's' : ''}`;
    let daysHtml = '';
    const dayNames = ['S','M','T','W','T','F','S'];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today); d.setDate(today.getDate() - dayOfWeek + i);
      const dStr = getTodayString(d);
      let cls = 'day-indicator'; if (dStr === todayStr) cls += ' today'; if (state.stats[dStr]?.practiced) cls += ' practiced';
      daysHtml += `<div class="${cls}" title="${dStr}">${dayNames[i]}</div>`;
    }
    daysRow.innerHTML = daysHtml;
  }

  function renderScheduleTasks() {
    if (!scheduleTaskList) return;
    const today = getTodayString();
    const scheduled = state.tasks.filter(t => t.date).sort((a,b) => new Date(a.date) - new Date(b.date));
    if (scheduled.length === 0) { scheduleTaskList.innerHTML = '<p class="muted-text">No tasks with dates.</p>'; return; }
    scheduleTaskList.innerHTML = scheduled.map(t => {
      const isDone = t.done, isPast = t.date < today && !isDone;
      const dDate = new Date(t.date + 'T00:00:00').toLocaleDateString(undefined, { month:'short', day:'numeric' });
      return `<div class="schedule-task-item ${isDone ? 'done' : ''} ${isPast ? 'past-due' : ''}">
        <span class="schedule-task-date">${dDate}</span>
        <span class="schedule-task-title">${escapeHtml(t.title)}</span>
        <span class="schedule-task-subject">(${escapeHtml(t.subject)})</span>
        ${isPast ? '<span class="past-due-indicator">Past Due</span>' : ''}
      </div>`;
    }).join('');
  }

  function updateConsistencyStreak() {
    const todayD = new Date(), today = getTodayString(todayD);
    const yesterdayD = new Date(todayD); yesterdayD.setDate(todayD.getDate()-1);
    const yesterday = getTodayString(yesterdayD);
    const practicedToday = !!state.stats[today]?.practiced;
    const last = state.stats.lastPracticeDate;
    if (practicedToday) {
      if (last === yesterday) state.stats.streak += 1;
      else if (last !== today) state.stats.streak = 1;
      else if (state.stats.streak === 0) state.stats.streak = 1;
      state.stats.lastPracticeDate = today;
    } else {
      if (last && last < yesterday) state.stats.streak = 0;
    }
    if (state.stats.streak < 0) state.stats.streak = 0;
  }

  function getTodayString(d = new Date()) {
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // Chat / AI
  function handleChatSubmit(e) { 
    e.preventDefault(); 
    const text = chatInput?.value.trim(); 
    if (text && chatInput && !chatInput.disabled) { 
      pushUserMessage(text); 
      chatInput.value = ''; 
      callAIProxy(text); 
    } 
  }

  async function callAIProxy(prompt, functionName = 'gemini-proxy') {
    setButtonLoading(chatSendBtn, chatSendBtnSpinner, chatSendBtnText, true, "Sending...");
    if (chatInput) chatInput.disabled = true;
    if (typingIndicator) typingIndicator.style.display = 'block';
    if (chatMessagesContainer) chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    const functionUrl = `/.netlify/functions/${functionName}`;
    try {
      const response = await fetch(functionUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
      if (typingIndicator) typingIndicator.style.display = 'none';
      if (!response.ok) {
        let e = `Request failed (${response.status} ${response.statusText})`;
        try { const d = await response.json(); e = d.error || d.message || JSON.stringify(d); } catch (_) {}
        throw new Error(`AI error: ${e}`);
      }
      const data = await response.json(); const ans = data?.text || "Received no response text.";
      pushBotMessage(ans); addActivity(`AI query answered.`);
    } catch (error) {
      console.error('Error calling AI proxy:', error); if (typingIndicator) typingIndicator.style.display = 'none';
      pushBotMessage(`Connection issue: ${error.message}.`, true, 'error');
    } finally {
      setButtonLoading(chatSendBtn, chatSendBtnSpinner, chatSendBtnText, false, null, "Send");
      if (chatInput) { chatInput.disabled = false; chatInput.focus(); }
    }
  }

  function pushUserMessage(text) { 
    state.chat.push({ id: uid('m'), from: 'user', text, ts: new Date().toISOString() }); 
    renderChat(); 
  }

  function pushBotMessage(text, shouldSave = true, type = 'normal') { 
    const id = uid('m'); 
    state.chat.push({ id, from: 'bot', text, ts: new Date().toISOString(), type }); 
    if (shouldSave) saveState(); 
    renderChat(); 
    return id; 
  }

  function renderChat() {
    if (!chatMessagesContainer) return;
    const html = state.chat.map(m => `<div class="chat-message from-${m.from} ${m.type === 'error' ? 'error-message' : ''}" data-message-id="${m.id}"><p>${escapeHtml(m.text)}</p><span class="timestamp">${new Date(m.ts).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</span></div>`).join('');
    const scroll = chatMessagesContainer.scrollHeight - chatMessagesContainer.clientHeight <= chatMessagesContainer.scrollTop + 60;
    if (chatMessagesContainer.innerHTML !== html) chatMessagesContainer.innerHTML = html;
    if (scroll || typingIndicator?.style.display === 'block') chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
  }

  function handleClearChat() { 
    showConfirmModal("Clear Chat?", "Delete all messages?", () => { 
      state.chat = []; 
      addActivity("Cleared AI chat."); 
      saveState(); 
      renderChat(); 
      showToast("Chat history cleared.", 'info'); 
    }); 
  }

  // Quiz functionality
  const MAX_QUESTIONS = 50;
  function startQuizForFocusSubject(subject = null) {
    const quizSubject = subject || state.stats.lastFocusSubject;
    if (!quizSubject || quizSubject === "No upcoming tasks") { showToast("Select subject/task for quiz.", 'warning'); return; }
    loadingToastId = showToast(`🧠 Generating up to ${MAX_QUESTIONS} quiz questions for "${escapeHtml(quizSubject)}"...`, 'info', 0);
    generateQuizQuestions(quizSubject).then(() => {
      dismissToast(loadingToastId); loadingToastId = null;
      if (state.currentQuiz.questions.length === 0) { showToast(`Could not generate quiz for ${escapeHtml(quizSubject)}.`, 'error'); return; }
      state.currentQuiz = {
        subject: quizSubject,
        questions: state.currentQuiz.questions,
        currentQuestionIndex: 0,
        score: 0,
        userAnswers: [],
        isActive: true
      };
      if (quizProgressText) quizProgressText.textContent = `1 / ${state.currentQuiz.questions.length}`;
      if (quizTotalQuestionsEl) quizTotalQuestionsEl.textContent = state.currentQuiz.questions.length;
      renderCurrentQuizQuestion();
      openQuizModal();
      addActivity(`Started quiz: ${quizSubject}.`);
      saveState();
    }).catch(error => {
      dismissToast(loadingToastId); loadingToastId = null;
      console.error("Quiz start failed:", error);
      showToast(`Quiz start failed: ${error.message}`, 'error');
    });
  }

  async function generateQuizQuestions(subject) {
    state.currentQuiz.questions = [];
    try {
      const aiPrompt = `Generate up to ${MAX_QUESTIONS} multiple-choice quiz questions about the subject "${subject}". Questions should suit a student. Each question must have 4 options. Format output STRICTLY as a valid JSON array of objects. Each object needs keys "q" (string: question), "o" (array of 4 strings: options), and "a" (string: correct option text, matching one in "o"). NO extra text, markdown, or explanations outside the JSON array. Example: [{"q": "Capital of France?", "o": ["Berlin", "Madrid", "Paris", "Rome"], "a": "Paris"}]`;
      const functionUrl = '/.netlify/functions/gemini-proxy';
      const response = await fetch(functionUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: aiPrompt }) });
      if (!response.ok) {
        let e = `AI Request failed (${response.status})`;
        try { const d = await response.json(); e = d.error || d.message || JSON.stringify(d); } catch (_) {}
        throw new Error(e);
      }
      const data = await response.json();
      const rawText = data?.text;
      if (!rawText) throw new Error("AI response empty.");
      const start = rawText.indexOf('['); const end = rawText.lastIndexOf(']');
      if (start === -1 || end === -1 || end < start) throw new Error("Invalid format (no array).");
      const jsonStr = rawText.substring(start, end + 1);
      let parsedQs;
      try { parsedQs = JSON.parse(jsonStr); } catch (e) { console.error("JSON parse failed:", e, "Raw:", jsonStr); throw new Error("Failed parsing AI questions."); }
      if (!Array.isArray(parsedQs) || parsedQs.length === 0) throw new Error("AI response not a valid array.");
      const validQs = parsedQs.filter(q => q && typeof q.q === 'string' && Array.isArray(q.o) && q.o.length === 4 && typeof q.a === 'string' && q.o.includes(q.a));
      if (validQs.length !== parsedQs.length) showToast(`Warning: ${parsedQs.length - validQs.length} invalid Qs ignored.`, 'warning');
      if (validQs.length === 0) throw new Error("No valid Qs from AI.");
      state.currentQuiz.questions = validQs.slice(0, MAX_QUESTIONS).map(q => ({ ...q, id: uid('q') }));
    } catch (error) {
      console.error("Error generating AI quiz:", error);
      if (state.currentQuiz.questions.length === 0) { showToast(`AI Error: ${error.message}. Cannot start quiz.`, 'error', 5000); }
      else { showToast(`AI Warning: ${error.message}. Proceeding with ${state.currentQuiz.questions.length} questions.`, 'warning', 4000); }
      if (state.currentQuiz.questions.length === 0) throw error;
    }
  }

  function renderCurrentQuizQuestion() {
    if (!state.currentQuiz.isActive || !quizModal || state.currentQuiz.questions.length === 0) return;
    const i = state.currentQuiz.currentQuestionIndex, total = state.currentQuiz.questions.length;
    const q = state.currentQuiz.questions[i];
    if (!q || !quizQuestionEl || !quizOptionsEl || !quizProgressText || !nextQuizQuestionBtn) { console.error("Quiz elements invalid."); closeQuizModal(); return; }
    quizQuestionEl.textContent = q.q;
    quizOptionsEl.innerHTML = (q.o || []).map(opt => `<button class="quiz-option-btn btn outline" data-option="${escapeHtml(opt)}">${escapeHtml(opt)}</button>`).join('');
    quizProgressText.textContent = `${i + 1} / ${total}`;
    nextQuizQuestionBtn.disabled = true;
    nextQuizQuestionBtn.textContent = (i === total - 1) ? 'Finish Quiz' : 'Next';
  }

  function handleQuizOptionSelect(e) {
    const btn = e.target.closest('.quiz-option-btn');
    if (!btn || !state.currentQuiz.isActive || btn.disabled) return;
    qsa('.quiz-option-btn', quizOptionsEl).forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    if (nextQuizQuestionBtn) nextQuizQuestionBtn.disabled = false;
  }

  function handleNextQuizQuestion() {
    if (!state.currentQuiz.isActive || !nextQuizQuestionBtn || nextQuizQuestionBtn.disabled) return;
    const i = state.currentQuiz.currentQuestionIndex, q = state.currentQuiz.questions[i];
    const selBtn = qs('.quiz-option-btn.selected', quizOptionsEl);
    if (!selBtn || !q) { showToast("Select an answer.", 'warning'); return; }
    const selOpt = selBtn.dataset.option, correct = q.a, isCorrect = selOpt === correct;
    qsa('.quiz-option-btn', quizOptionsEl).forEach(b => {
      b.disabled = true;
      b.classList.remove('selected');
      if (b.dataset.option === correct) b.classList.add('correct');
      else if (b === selBtn) b.classList.add('wrong');
    });
    nextQuizQuestionBtn.disabled = true;
    state.currentQuiz.userAnswers.push({ qId: q.id, sel: selOpt, correct: isCorrect });
    if (isCorrect) state.currentQuiz.score++;
    setTimeout(() => {
      if (i < state.currentQuiz.questions.length - 1) {
        state.currentQuiz.currentQuestionIndex++;
        renderCurrentQuizQuestion();
      } else {
        showQuizResults();
      }
      saveState();
    }, 900);
  }

  function showQuizResults() {
    if (!quizModal || !quizContainer || !quizResultsEl || !quizScoreEl || !quizTotalQuestionsEl) return;
    const total = state.currentQuiz.questions.length || MAX_QUESTIONS;
    const score = state.currentQuiz.score;
    const perc = total > 0 ? Math.round((score / total) * 100) : 0;
    quizContainer.style.display = 'none';
    quizResultsEl.style.display = 'block';
    quizScoreEl.textContent = score;
    quizTotalQuestionsEl.textContent = total;
    const subject = state.currentQuiz.subject, today = getTodayString();
    if (subject && subject !== "No upcoming tasks") {
      if (!state.stats[subject]) state.stats[subject] = { scores: [], practicedDates: [] };
      state.stats[subject].scores = state.stats[subject].scores || [];
      state.stats[subject].scores.push(perc);
    }
    if (!state.stats[today]) state.stats[today] = { practiced: false, score: 0, date: today };
    state.stats[today].practiced = true;
    state.stats[today].score = Math.max(state.stats[today].score || 0, score);
    state.stats.lastPracticeDate = today;
    
    // Update quiz statistics
    state.stats.totalQuizzes = (state.stats.totalQuizzes || 0) + 1;
    state.stats.totalFocusHours = (state.stats.totalFocusHours || 0) + 0.5; // Approximate 30 min per quiz
    
    addActivity(`Quiz done: ${subject}. Score: ${score}/${total} (${perc}%)`);
    state.tasks.forEach(t => {
      if (t.subject === subject && t.date >= today) {
        t.practicedOn = t.practicedOn || [];
        if (!t.practicedOn.includes(today)) t.practicedOn.push(today);
      }
    });
    state.currentQuiz.isActive = false;
    saveState();
    renderFocusBlock(); renderWeeklyProgress(); renderTasks();
  }

  function openQuizModal() {
    if (!quizModal) return;
    quizModal.setAttribute('aria-hidden', 'false');
    quizModal.style.display = 'flex';
  }

  function closeQuizModal() {
    if (!quizModal) return;
    quizModal.setAttribute('aria-hidden', 'true');
    quizModal.style.display = 'none';
    state.currentQuiz = JSON.parse(JSON.stringify(DEFAULT_STATE.currentQuiz));
    if (quizResultsEl) quizResultsEl.style.display = 'none';
    if (quizContainer) quizContainer.style.display = 'block';
  }

  // Enhanced Profile Functionality
  function renderProfilePage() {
    if (!profileUserName) return;
    
    // Update profile information
    profileUserName.textContent = state.profile.username;
    profileUserEmail.textContent = state.profile.email || 'Not set';
    profileJoinDate.textContent = new Date(state.stats.joinDate).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
    
    // Update form fields
    if (profileUsername) profileUsername.value = state.profile.username;
    if (profileEmail) profileEmail.value = state.profile.email || '';
    if (profileStudyFocus) profileStudyFocus.value = state.profile.studyFocus || '';
    if (profileBio) profileBio.value = state.profile.bio || '';
    
    // Update avatar
    updateProfileAvatar();
    
    // Update statistics
    updateProfileStatistics();
    
    // Update analytics
    updateStudyAnalytics();
  }

  function updateProfileAvatar() {
    const avatarHTML = generateDynamicAvatar(state.profile.username, state.profile.email, state.profile.avatarStyle);
    
    if (profileAvatarLarge) {
      profileAvatarLarge.innerHTML = avatarHTML;
    }
    
    if (currentAvatarDisplay) {
      currentAvatarDisplay.innerHTML = avatarHTML;
    }
    
    // Update main avatar in header
    updateMainAvatar();
    
    // Update selected avatar style
    const avatarStyleOptions = qsa('.avatar-style-option');
    avatarStyleOptions.forEach(option => {
      option.classList.toggle('selected', option.dataset.style === state.profile.avatarStyle);
    });
  }

  function updateMainAvatar() {
    const userAvatar = qs('#userAvatar');
    if (userAvatar) {
      userAvatar.innerHTML = generateDynamicAvatar(state.profile.username, state.profile.email, state.profile.avatarStyle);
    }
  }

  function updateProfileStatistics() {
    if (!statTotalTasks) return;
    
    const totalTasks = state.tasks.length;
    const completedTasks = state.tasks.filter(task => task.done).length;
    const uniqueSubjects = [...new Set(state.tasks.map(task => task.subject))].length;
    
    statTotalTasks.textContent = totalTasks;
    statCompletedTasks.textContent = completedTasks;
    statCurrentStreak.textContent = state.stats.streak || 0;
    statQuizzesTaken.textContent = state.stats.totalQuizzes || 0;
    statFocusHours.textContent = Math.round((state.stats.totalFocusHours || 0) / 60) || 0;
    statSubjects.textContent = uniqueSubjects;
  }

  function updateStudyAnalytics() {
    if (!avgStudyTime || !completionRate || !topSubject) return;
    
    // Calculate average study time
    const daysSinceJoin = Math.max(1, Math.floor((new Date() - new Date(state.stats.joinDate)) / (1000 * 60 * 60 * 24)));
    const avgTime = Math.round((state.stats.totalFocusHours || 0) / daysSinceJoin) || 0;
    avgStudyTime.textContent = `${avgTime}h`;
    
    // Calculate completion rate
    const totalTasks = state.tasks.length;
    const completedTasks = state.tasks.filter(task => task.done).length;
    const rate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    completionRate.textContent = `${rate}%`;
    
    // Find top subject
    const subjectCounts = {};
    state.tasks.forEach(task => {
      subjectCounts[task.subject] = (subjectCounts[task.subject] || 0) + 1;
    });
    
    let topSub = '-';
    let maxCount = 0;
    Object.entries(subjectCounts).forEach(([subject, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topSub = subject;
      }
    });
    
    topSubject.textContent = topSub;
  }

  function handleProfileSubmit(e) {
    e.preventDefault();
    
    state.profile.username = profileUsername.value.trim() || 'User';
    state.profile.email = profileEmail.value.trim();
    state.profile.studyFocus = profileStudyFocus.value.trim();
    state.profile.bio = profileBio.value.trim();
    
    saveState();
    renderProfilePage();
    setDynamicUserUI();
    showToast('Profile updated successfully!', 'success');
  }

  function handleAvatarStyleChange(e) {
    const style = e.currentTarget.dataset.style;
    state.profile.avatarStyle = style;
    saveState();
    updateProfileAvatar();
    showToast(`Avatar style changed to ${style}`, 'info');
  }

  function handleRandomizeAvatar() {
    const styles = ['initial', 'gradient', 'icon', 'pattern'];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    state.profile.avatarStyle = randomStyle;
    saveState();
    updateProfileAvatar();
    showToast('Avatar randomized!', 'info');
  }

  function handleExportData() {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `studysync-data-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showToast('Data exported successfully!', 'success');
  }

  // Enhanced dynamic user UI
  function setDynamicUserUI() {
    const username = state.profile.username;
    const hour = new Date().getHours();
    
    let greeting = "Hello";
    if (hour < 12) greeting = "Good Morning";
    else if (hour < 18) greeting = "Good Afternoon";
    else greeting = "Good Evening";

    // Update greeting dynamically
    if (welcomeMessageEl) welcomeMessageEl.textContent = `${greeting}, ${username}!`;

    // Generate dynamic avatar based on user profile
    const avatarEl = document.getElementById('userAvatar');
    if (avatarEl) {
      avatarEl.innerHTML = generateDynamicAvatar(username, state.profile.email, state.profile.avatarStyle);
    }

    // Dropdown toggle
    const dropdown = document.getElementById('avatarDropdown');
    if (avatarEl && dropdown) {
      avatarEl.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', () => {
        dropdown.classList.remove('show');
      });
    }

    // Profile button in avatar dropdown
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
      profileBtn.addEventListener('click', () => {
        const avatarDropdown = document.getElementById('avatarDropdown');
        if (avatarDropdown) avatarDropdown.classList.remove('show');
        switchView('profile');
      });
    }
  }

  // Enhanced avatar generation
  function generateDynamicAvatar(username, email, avatarStyle) {
    const firstLetter = username.charAt(0).toUpperCase();
    
    switch(avatarStyle) {
      case 'gradient':
        const gradientColors = [
          ['#FF6B6B', '#4ECDC4'],
          ['#45B7D1', '#96C93D'],
          ['#FFA62E', '#EA4C89'],
          ['#654EA3', '#EAAFC8'],
          ['#2C3E50', '#3498DB']
        ];
        const gradientIndex = simpleHash(username + email) % gradientColors.length;
        const [color1, color2] = gradientColors[gradientIndex];
        
        return `
          <div class="avatar-gradient" style="background: linear-gradient(135deg, ${color1}, ${color2})">
            ${firstLetter}
          </div>
        `;
        
      case 'icon':
        const icons = ['user-graduate', 'user-tie', 'user-ninja', 'user-astronaut', 'user-secret'];
        const iconIndex = simpleHash(username + email) % icons.length;
        const iconClass = icons[iconIndex];
        
        return `<i class="fas fa-${iconClass} avatar-icon"></i>`;
        
      case 'pattern':
        const patterns = [
          'avatar-pattern-1', 'avatar-pattern-2', 'avatar-pattern-3', 
          'avatar-pattern-4', 'avatar-pattern-5'
        ];
        const patternIndex = simpleHash(username + email) % patterns.length;
        
        return `
          <div class="avatar-pattern ${patterns[patternIndex]}">
            ${firstLetter}
          </div>
        `;
        
      default: // 'initial'
        return `
          <div class="avatar-initial">
            ${firstLetter}
          </div>
        `;
    }
  }

  // Simple hash function for consistent results
  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  // Wellness + other helpers
  const wellnessTips = [ "Take 5 deep breaths.", "Stretch your neck and shoulders.", "Look away from the screen for 20 seconds.", "Drink a glass of water.", "Think of one thing you're grateful for.", "Stand up and walk around for a minute.", "Listen to a calming song.", "Close your eyes and visualize a peaceful place." ];
  let currentTipIndex = 0;
  function startWellnessTipCycle() { clearInterval(wellnessTipIntervalId); wellnessTipIntervalId = setInterval(cycleWellnessTip, 30000); }
  function cycleWellnessTip() { if (wellnessTipText) { currentTipIndex = (currentTipIndex + 1) % wellnessTips.length; wellnessTipText.style.opacity = '0'; setTimeout(() => { wellnessTipText.textContent = wellnessTips[currentTipIndex]; wellnessTipText.style.opacity = '1'; }, 300); } }
  function startBreathingAnimation() {
    if (!breathingCircle || !breathingInstruction) return;
    clearInterval(breathIntervalId);
    const c = 8000, p = c/2;
    function u(ph){ if (ph === 'in') { breathingCircle.textContent='Inhale'; breathingInstruction.textContent='Slowly breathe in.'; } else { breathingCircle.textContent='Exhale'; breathingInstruction.textContent='Slowly breathe out.'; } }
    u('in');
    breathingCircle.style.animation = `breathe ${c}ms ease-in-out infinite`;
    setTimeout(()=>{ u('out'); breathIntervalId = setInterval(()=>{ u(breathingCircle.textContent === 'Inhale' ? 'out' : 'in'); }, p); }, p * 0.9);
  }
  function stopBreathingAnimation() { clearInterval(breathIntervalId); if (breathingCircle) breathingCircle.style.animation = 'none'; }

  // Toasts / confirm / utils
  function showToast(message, type = 'success', duration = 5000) { 
    if (!toastContainer) return null; 
    const id = uid('toast'); 
    const t = document.createElement('div'); 
    t.className = `toast ${type}`; 
    t.dataset.toastId = id; 
    let i=''; 
    switch(type){ 
      case 'success': i='✅'; break; 
      case 'error': i='❌'; break; 
      case 'warning': i='⚠️'; break; 
      case 'info': i='ℹ️'; break; 
    } 
    
    // Add close button
    t.innerHTML = `
        <span class="toast-icon">${i}</span> 
        <span class="toast-message">${escapeHtml(message)}</span>
        <button class="toast-close" onclick="dismissToast('${id}')">&times;</button>
    `; 
    
    toastContainer.prepend(t); 
    requestAnimationFrame(()=>t.classList.add('show')); 
    
    // Auto-dismiss after specified duration
    if (duration > 0) {
        setTimeout(()=>dismissToast(id), duration); 
    }
    
    return id; 
  }

  function dismissToast(id) { 
    if (!toastContainer) return; 
    const t = qs(`[data-toast-id="${id}"]`, toastContainer); 
    if (t) { 
        t.classList.remove('show'); 
        t.addEventListener('transitionend', ()=>t.remove(), { once: true }); 
    } 
  }

  function showConfirmModal(title, message, onConfirm) { 
    if (!confirmModal || !confirmTitle || !confirmMessage) return; 
    confirmTitle.textContent = title; 
    confirmMessage.textContent = message; 
    confirmCallback = onConfirm; 
    confirmModal.setAttribute('aria-hidden', 'false'); 
    confirmModal.style.display = 'flex'; 
    confirmYesBtn?.focus(); 
  }

  function closeConfirmModal() { 
    if (confirmModal) { 
      confirmModal.setAttribute('aria-hidden', 'true'); 
      confirmModal.style.display = 'none'; 
    } 
    confirmCallback = null; 
  }

  function handleConfirmYes() { 
    if (typeof confirmCallback === 'function') confirmCallback(); 
    closeConfirmModal(); 
  }

  function setButtonLoading(btn, spin, textEl, isLoading, loadTxt = "Processing...", defaultTxt = "Submit") {
    if (!btn || !spin || !textEl) return;
    btn.disabled = !!isLoading;
    spin.style.display = isLoading ? 'inline-block' : 'none';
    textEl.textContent = isLoading ? loadTxt : (defaultTxt || textEl.dataset.default || textEl.textContent);
    btn.classList.toggle('loading', !!isLoading);
  }

  function formatTimeAgo(iso) {
    const d = new Date(iso), n = new Date(); const s = Math.round((n - d) / 1000), m = Math.round(s/60), h = Math.round(m/60), days = Math.round(h/24);
    if (s < 5) return `just now`; if (s < 60) return `${s}s ago`; if (m < 60) return `${m}m ago`; if (h < 24) return `${h}h ago`; if (days === 1) return `Yesterday`; if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString(undefined, { month:'short', day:'numeric' });
  }

  // Settings helpers
  function applyDark(isDark) { document.body.classList.toggle('dark', isDark); }
  function handleDarkModeToggle(e) { state.settings.darkMode = e.target.checked; applyDark(state.settings.darkMode); updateThemeButtonIcon(); saveState(); }
  function handleThemeToggleClick() { state.settings.darkMode = !state.settings.darkMode; if (darkModeToggle) darkModeToggle.checked = state.settings.darkMode; applyDark(state.settings.darkMode); updateThemeButtonIcon(); saveState(); }
  function updateThemeButtonIcon() { if (!toggleThemeBtn) return; toggleThemeBtn.textContent = state.settings.darkMode ? '☀️' : '🌙'; toggleThemeBtn.title = state.settings.darkMode ? 'Switch to light mode' : 'Switch to dark mode'; }

  // Utility functions
  function scheduleNotificationCheck(){ /* notification scheduling */ }
  function updateStorageUsageDisplay(){ if (storageUsageEl) storageUsageEl.textContent = `${(localStorage.length || 0)} keys`; }
  function checkNotificationStatus(){ /* placeholder */ }
  function handleNotificationToggle(e){ state.settings.notifications = e.target.checked; saveState(); showToast(e.target.checked ? "Reminders enabled" : "Reminders disabled", 'info'); }
  function handleClearData(){ showConfirmModal("Clear data?", "This will clear all local data for this app. Continue?", () => { localStorage.removeItem(STORAGE_KEY); state = JSON.parse(JSON.stringify(DEFAULT_STATE)); saveState(); renderTasks(); renderFocusBlock(); renderActivityFeed(); showToast("Local data cleared.", 'info'); }); }

  // PDF Export Function
  function exportProgressToPDF() {
    try {
      showToast('Generating progress report...', 'info');
      
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPosition = 20;

      // Header
      doc.setFillColor(0, 212, 255);
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('EduFlow Pro Progress Report', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 30, { align: 'center' });

      yPosition = 50;
      doc.setTextColor(0, 0, 0);

      // User Info
      doc.setFontSize(16);
      doc.text('User Profile', 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(10);
      doc.text(`Username: ${state.profile.username}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Email: ${state.profile.email || 'Not set'}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Study Focus: ${state.profile.studyFocus || 'Not set'}`, 20, yPosition);
      yPosition += 15;

      // Statistics
      doc.setFontSize(16);
      doc.text('Study Statistics', 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(10);
      const stats = [
        `Total Tasks: ${state.tasks.length}`,
        `Completed Tasks: ${state.tasks.filter(task => task.done).length}`,
        `Current Streak: ${state.stats.streak} days`,
        `Quizzes Taken: ${state.stats.totalQuizzes}`,
        `Focus Hours: ${state.stats.totalFocusHours}`,
        `Subjects: ${new Set(state.tasks.map(task => task.subject)).size}`
      ];

      stats.forEach(stat => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(stat, 20, yPosition);
        yPosition += 7;
      });

      yPosition += 10;

      // Recent Tasks
      doc.setFontSize(16);
      doc.text('Recent Tasks', 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(8);
      const recentTasks = state.tasks.slice(-10).reverse();
      recentTasks.forEach(task => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        const status = task.done ? '✓' : '○';
        const taskText = `${status} ${task.title} (${task.subject}) - Due: ${new Date(task.date).toLocaleDateString()}`;
        doc.text(taskText, 20, yPosition, { maxWidth: 170 });
        yPosition += 10;
      });

      // Save the PDF
      const fileName = `EduFlow_Progress_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      showToast('Progress report exported successfully!', 'success');
      
    } catch (error) {
      console.error('PDF export error:', error);
      showToast('Failed to export progress report', 'error');
    }
  }

  // Firebase Auth State Management
  function initAuth() {
    auth.onAuthStateChanged((user) => {
      if (user) {
        // User is signed in
        console.log("User is signed in:", user.email);
        setDynamicUserUI(user);
        loadUserProfile(user);
      } else {
        // User is signed out, redirect to index.html
        console.log("User is signed out, redirecting...");
        window.location.replace('index.html');
      }
    });
  }

  // Enhanced user UI with Firebase data
  function setDynamicUserUI(user) {
    const username = user.displayName || user.email.split('@')[0] || 'User';
    const hour = new Date().getHours();
    
    let greeting = "Hello";
    if (hour < 12) greeting = "Good Morning";
    else if (hour < 18) greeting = "Good Afternoon";
    else greeting = "Good Evening";

    // Update greeting dynamically
    if (welcomeMessageEl) welcomeMessageEl.textContent = `${greeting}, ${username}!`;

    // Generate dynamic avatar based on user data
    const avatarEl = document.getElementById('userAvatar');
    if (avatarEl) {
      avatarEl.innerHTML = generateDynamicAvatar(username, user.email, state.profile.avatarStyle);
    }

    // Update profile data in state
    state.profile.username = username;
    state.profile.email = user.email;
    saveState();
  }

  // Load user profile from Firestore
  async function loadUserProfile(user) {
    try {
      const userDoc = await db.collection('users').doc(user.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        
        // Update state with Firestore data
        state.profile.username = userData.name || user.displayName || user.email.split('@')[0];
        state.profile.email = user.email;
        state.profile.studyFocus = userData.studyFocus || '';
        state.profile.bio = userData.bio || '';
        
        // Update join date from Firestore
        if (userData.createdAt) {
          state.stats.joinDate = userData.createdAt.toDate().toISOString();
        }
        
        saveState();
        
        // Update UI if we're on the profile page
        if (state.currentView === 'profile') {
          renderProfilePage();
        }
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  }

  // Enhanced sign out function
  function setupSignOut() {
    const signoutBtn = document.getElementById('signoutBtn');
    const avatarDropdown = document.getElementById('avatarDropdown');
    const userAvatar = document.getElementById('userAvatar');

    if (signoutBtn) {
      signoutBtn.addEventListener('click', async () => {
        try {
          // Show loading state
          showToast('Signing out...', 'info');
          
          // Sign out from Firebase
          await auth.signOut();
          
          // Clear local storage
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem('username');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userId');
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('savedEmail');
          
          // Redirect to index.html and replace history
          window.location.replace('index.html');
          
        } catch (error) {
          console.error('Error signing out:', error);
          showToast('Error signing out. Please try again.', 'error');
        }
      });
    }

    // Toggle dropdown
    if (userAvatar && avatarDropdown) {
      userAvatar.addEventListener('click', (e) => {
        e.stopPropagation();
        avatarDropdown.classList.toggle('show');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', () => {
        avatarDropdown.classList.remove('show');
      });
    }
  }

  // Enhanced profile page rendering with Firebase data
  function renderProfilePage() {
    const user = auth.currentUser;
    if (!user) return;
    
    if (profileUserName) {
      profileUserName.textContent = state.profile.username;
    }
    
    if (profileUserEmail) {
      profileUserEmail.textContent = user.email;
    }
    
    if (profileJoinDate) {
      profileJoinDate.textContent = new Date(state.stats.joinDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
    }
    
    // Update form fields
    if (profileUsername) profileUsername.value = state.profile.username;
    if (profileEmail) profileEmail.value = user.email;
    if (profileStudyFocus) profileStudyFocus.value = state.profile.studyFocus || '';
    if (profileBio) profileBio.value = state.profile.bio || '';
    
    // Update avatar
    updateProfileAvatar();
    
    // Update statistics
    updateProfileStatistics();
    
    // Update analytics
    updateStudyAnalytics();
  }

  // Enhanced profile save function
  async function handleProfileSubmit(e) {
    e.preventDefault();
    
    const user = auth.currentUser;
    if (!user) {
      showToast('You must be logged in to update your profile.', 'error');
      return;
    }
    
    try {
      // Update state
      state.profile.username = profileUsername.value.trim() || 'User';
      state.profile.studyFocus = profileStudyFocus.value.trim();
      state.profile.bio = profileBio.value.trim();
      
      // Update in Firestore
      await db.collection('users').doc(user.uid).set({
        name: state.profile.username,
        email: user.email,
        studyFocus: state.profile.studyFocus,
        bio: state.profile.bio,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      // Update Firebase Auth display name if changed
      if (user.displayName !== state.profile.username) {
        await user.updateProfile({
          displayName: state.profile.username
        });
      }
      
      saveState();
      renderProfilePage();
      setDynamicUserUI(user);
      showToast('Profile updated successfully!', 'success');
      
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('Error updating profile. Please try again.', 'error');
    }
  }

  // Prevent back navigation after sign out
  function preventBackNavigation() {
    window.history.pushState(null, null, window.location.href);
    window.onpopstate = function() {
      const user = auth.currentUser;
      if (!user) {
        window.location.replace('index.html');
      }
    };
  }

  // run
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

})();
