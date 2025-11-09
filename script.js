(() => {
  'use strict';
  const STORAGE_KEY = 'EduFlow Pro_state_v1';
  // IMPORTANT: The Gemini API key should now be handled securely by your serverless proxy.
  // Remove GEMINI_API_KEY and GEMINI_API_URL from client-side script.
  // const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY'; // This is now handled by the proxy
  // const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`; // This is now handled by the proxy

  // Define the URL for your serverless proxy function.
  // IMPORTANT: You MUST update this path to match your deployment.
  // Example for Netlify Functions:
  const PROXY_API_URL = '/.netlify/functions/gemini-proxy';
  // Example for other deployments (you'll get this URL after deployment):
  // const PROXY_API_URL = 'https://your-domain.com/.netlify/functions/gemini-proxy'; // Or similar

  let notifiedTaskIds = [];
  let currentSort = { field: 'date', ascending: true };
  let confirmCallback = null;
  let notificationIntervalId = null;
  let breathIntervalId = null;
  let wellnessTipIntervalId = null;
  let loadingToastId = null;
  let realTimeIntervals = [];
  let currentUser = null; // This would typically be populated from authentication

  function uid(prefix = 'id') { return prefix + '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36); }
  function qs(sel, root = document) { return root.querySelector(sel); }
  function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }
  function escapeHtml(unsafe) { if (typeof unsafe !== 'string') return ''; return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }

  // DOM cache
  const mainTitleEl = qs('#mainTitle');
  const addTaskBtn = qs('#addTaskBtn');
  const markAllDoneBtn = qs('#markAllDoneBtn');
  const focusSubject = qs('#focusSubject');
  const focusDescription = qs('#focusDescription');
  const focusProgressPct = qs('#focusProgressPct');
  const focusProgressBar = qs('#focusProgressBar');
  const focusTasks = qs('#focusTasks');
  const focusScore = qs('#focusScore');
  const startFocusSessionBtn = qs('#startFocusSessionBtn');
  const generateQuizBtn = qs('#generateQuizBtn');
  const quizQuestionCountInput = qs('#quizQuestionCount');
  const quizDifficultyInput = qs('#quizDifficulty');
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
  const autoSaveToggle = qs('#autoSaveToggle');
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
  const currentTimeEl = qs('#currentTime');
  const liveTaskCountEl = qs('#liveTaskCount');
  const liveFocusTimeEl = qs('#liveFocusTime');
  const liveCompletionRateEl = qs('#liveCompletionRate');

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
    },
    realTime: {
      lastUpdate: Date.now(),
      focusSessionActive: false, // Not used in provided code, but good to keep for future expansion
      focusStartTime: null       // Not used in provided code, but good to keep for future expansion
    }
  };
  
  let state = loadState();

  function loadState() {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) {
      try { 
        const savedState = JSON.parse(s);
        // Merge with default state to handle new properties gracefully
        const mergedState = mergeDeep(JSON.parse(JSON.stringify(DEFAULT_STATE)), savedState);
        
        // Ensure necessary nested objects exist
        if (!mergedState.profile) mergedState.profile = DEFAULT_STATE.profile;
        if (!mergedState.stats.joinDate) mergedState.stats.joinDate = DEFAULT_STATE.stats.joinDate;
        if (!mergedState.realTime) mergedState.realTime = DEFAULT_STATE.realTime;
        
        return mergedState; 
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
      state.realTime.lastUpdate = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); 
      updateStorageUsageDisplay(); 
      // Only update UI components relevant to the current view or always visible
      updateAllUIComponents();
    } catch (e) { 
      console.error("Save state error:", e); 
      showToast("Error saving data.", 'error'); 
    } 
  }

  // Refined `updateAllUIComponents` to only update visible/relevant elements
  function updateAllUIComponents() {
    // Always visible components or components on the current view
    renderFocusBlock();
    renderWeeklyProgress();
    renderTasks(); // Only re-renders if tasksList is in the DOM and visible
    renderActivityFeed();
    renderScheduleTasks();
    updateLiveStats();
    updateSubjectDatalist();
    updateQuickAddTaskSubjects();
    updateMainAvatar();

    if (state.currentView === 'profile') {
      updateProfileStatistics();
      updateStudyAnalytics();
    }
    
    if (state.currentView === 'settings') {
      updateStorageUsageDisplay();
    }

    if (state.currentView === 'assistant') {
      renderChat();
    }
  }

  function updateLiveStats() {
    if (liveTaskCountEl) {
      const activeTasks = state.tasks.filter(t => !t.done).length;
      animateCounter(liveTaskCountEl, activeTasks);
    }
    
    if (liveFocusTimeEl) {
      // Assuming totalFocusHours is in hours, convert to minutes for display
      const focusMinutes = Math.floor((state.stats.totalFocusHours || 0) * 60);
      animateCounter(liveFocusTimeEl, focusMinutes, 'm');
    }
    
    if (liveCompletionRateEl) {
      const rate = calculateCompletionRate();
      animateCounter(liveCompletionRateEl, Math.round(rate), '%');
    }
  }

  function animateCounter(element, value, suffix = '') {
    if (!element) return;
    const current = parseInt(element.textContent) || 0;
    if (current !== value) {
      // Simplified animation for demonstration
      element.textContent = value + suffix;
      element.classList.add('live-counter');
      setTimeout(() => element.classList.remove('live-counter'), 500);
    }
  }

  function isObject(item) { return (item && typeof item === 'object' && !Array.isArray(item)); }
  
  function mergeDeep(target, source) {
    let output = { ...target };
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach(key => {
        if (isObject(source[key])) {
          if (!(key in target) || !isObject(target[key])) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = mergeDeep(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }

  function addActivity(text) { 
    const MAX = 20; 
    state.activities.unshift({id: uid('act'), text, ts: new Date().toISOString()}); 
    state.activities.length = Math.min(state.activities.length, MAX); 
    renderActivityFeed(); 
    saveState();
  }

  // Enhanced initialization with real-time features
  function init() {
    console.log("Initializing EduFlow Pro with Gemini AI...");
    
    // Apply settings first
    applyDark(state.settings.darkMode);
    if (darkModeToggle) darkModeToggle.checked = state.settings.darkMode;
    if (notificationToggle) notificationToggle.checked = state.settings.notifications;
    if (showCompletedToggle) showCompletedToggle.checked = state.settings.showCompleted;
    if (autoSaveToggle) autoSaveToggle.checked = state.settings.autoSave;
    updateThemeButtonIcon();
    
    // Initialize basic UI
    if (copyrightYearEl) {
      copyrightYearEl.textContent = `© ${new Date().getFullYear()}`;
    }
    
    // Set up task form date to today
    if (taskDateInput) {
      taskDateInput.valueAsDate = new Date();
    }
    
    // Initialize real-time features
    initRealTimeFeatures();
    
    // Add event listeners
    addEventListeners();
    
    // Initialize views
    switchView(state.currentView, true); // Pass true for initial load to prevent unnecessary saveState
    
    // Initial render of all components
    updateAllUIComponents(); // Call one comprehensive update after initial load
    
    // Start wellness features
    startBreathingAnimation();
    startWellnessTipCycle();
    
    // Update welcome message
    if (welcomeMessageEl) {
      const hour = new Date().getHours();
      let greeting = "Hello";
      if (hour < 12) greeting = "Good morning";
      else if (hour < 18) greeting = "Good afternoon";
      else greeting = "Good evening";
      
      welcomeMessageEl.textContent = `${greeting}, ${state.profile.username}!`;
    }
    
    // Test AI integration - crucial for a dynamic AI app
    // Removed direct API key check, assuming proxy is configured.
    // The proxy itself will handle the environment variable check.
    setTimeout(() => {
      testAIIntegration().then(success => {
        if (success) {
          console.log("🎉 AI integration is working properly via proxy!");
          showToast("AI integration via proxy confirmed!", "success", 3000);
        } else {
          console.warn("⚠️ AI integration test failed - using fallback mode");
          showToast("AI integration test failed. Using fallback questions for quizzes and simplified chat responses. Check proxy deployment.", "warning", 8000);
        }
      });
    }, 2000);
    
    console.log("EduFlow Pro with Gemini AI initialized successfully");
  }

  function initRealTimeFeatures() {
    console.log("Initializing real-time features...");
    
    // Clear any existing intervals
    realTimeIntervals.forEach(clearInterval);
    realTimeIntervals = [];
    
    // Real-time clock
    realTimeIntervals.push(setInterval(updateRealTimeClock, 1000));
    updateRealTimeClock();
    
    // Live stats updates
    realTimeIntervals.push(setInterval(updateLiveStats, 5000));
    updateLiveStats();
    
    // Auto-save
    realTimeIntervals.push(setInterval(() => {
      if (state.settings.autoSave) {
        saveState();
      }
    }, 30000)); // Auto-save every 30 seconds
    
    // Real-time task synchronization (e.g., updating priority for overdue tasks)
    realTimeIntervals.push(setInterval(syncTasksInRealTime, 60000)); // Check every minute
    
    // Analytics updates (less frequent, only when profile view is active)
    realTimeIntervals.push(setInterval(() => {
      if (state.currentView === 'profile') {
        updateProfileStatistics();
        updateStudyAnalytics();
      }
    }, 10000));
    
    // Wellness updates for active animation (more frequent)
    realTimeIntervals.push(setInterval(updateWellnessInRealTime, 100));
    
    console.log("Real-time features initialized");
  }

  function updateRealTimeClock() {
    if (currentTimeEl) {
      const now = new Date();
      currentTimeEl.textContent = now.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
    }
  }

  function updateWellnessInRealTime() {
    if (state.currentView === 'wellness' && breathingCircle) {
      // The breathing animation is CSS-driven, so this function is less critical
      // unless there are specific JS-driven wellness elements.
      // For now, it keeps the `realTimeIntervals` array clean.
      // If `startBreathingAnimation` is pure CSS, this interval could be removed.
    }
  }

  function syncTasksInRealTime() {
    const today = getTodayString();
    let needsUpdate = false;
    
    state.tasks.forEach(task => {
      if (!task.done) {
        const daysUntilDue = Math.ceil((new Date(task.date) - new Date()) / (1000 * 60 * 60 * 24));
        
        // Auto-update priority based on urgency
        // This is a dynamic real-time adjustment
        if (daysUntilDue <= 0 && task.priority !== 'high') {
          task.priority = 'high';
          needsUpdate = true;
        } else if (daysUntilDue <= 1 && task.priority === 'low') {
          task.priority = 'medium';
          needsUpdate = true;
        }
      }
    });
    
    if (needsUpdate) {
      saveState();
      renderTasks(); // Re-render tasks to reflect priority changes
    }
  }

  function addEventListeners() {
    console.log("Adding event listeners...");
    
    // Navigation
    if (mainNav) mainNav.addEventListener('click', handleNavClick);
    
    // Tasks
    if (tasksList) tasksList.addEventListener('click', handleTaskListClick);
    if (taskForm) taskForm.addEventListener('submit', handleTaskFormSubmit);
    if (clearFormBtn) clearFormBtn.addEventListener('click', clearTaskForm);
    if (markAllDoneBtn) markAllDoneBtn.addEventListener('click', markTodaysPracticedTasksDone);
    if (quickTaskForm) quickTaskForm.addEventListener('submit', handleQuickTaskSubmit);
    if (sortTasksByDateBtn) sortTasksByDateBtn.addEventListener('click', () => sortAndRenderTasks('date'));
    if (sortTasksByPriorityBtn) sortTasksByPriorityBtn.addEventListener('click', () => sortAndRenderTasks('priority'));
    if (showCompletedToggle) showCompletedToggle.addEventListener('change', handleShowCompletedToggle);
    
    // Quiz
    if (quizOptionsEl) quizOptionsEl.addEventListener('click', handleQuizOptionSelect);
    // Modified: `startFocusSessionBtn` now calls `generateAIQuiz` directly
    if (startFocusSessionBtn) startFocusSessionBtn.addEventListener('click', () => generateAIQuiz(true)); // Pass true to indicate a focus session
    if (generateQuizBtn) generateQuizBtn.addEventListener('click', () => generateAIQuiz(false)); // Pass false for general quiz generation
    if (closeQuizModalBtn) closeQuizModalBtn.addEventListener('click', closeQuizModal);
    if (nextQuizQuestionBtn) nextQuizQuestionBtn.addEventListener('click', handleNextQuizQuestion);
    if (restartQuizBtn) restartQuizBtn.addEventListener('click', () => generateAIQuiz(false, state.currentQuiz.subject)); // Restart quiz with same subject
    if (closeResultsBtn) closeResultsBtn.addEventListener('click', closeQuizModal);
    
    // Chat
    if (chatForm) chatForm.addEventListener('submit', handleChatSubmit);
    if (clearChatBtn) clearChatBtn.addEventListener('click', handleClearChat);
    
    // Settings
    if (darkModeToggle) darkModeToggle.addEventListener('change', handleDarkModeToggle);
    if (notificationToggle) notificationToggle.addEventListener('change', handleNotificationToggle);
    if (autoSaveToggle) autoSaveToggle.addEventListener('change', handleAutoSaveToggle);
    if (toggleThemeBtn) toggleThemeBtn.addEventListener('click', handleThemeToggleClick);
    if (clearDataBtn) clearDataBtn.addEventListener('click', handleClearData);
    if (exportDataBtn) exportDataBtn.addEventListener('click', handleExportData);
    
    // Wellness
    if (changeWellnessGameBtn) changeWellnessGameBtn.addEventListener('click', () => showToast("More wellness exercises coming soon!", 'info'));
    
    // Confirm modal
    if (confirmModal) confirmModal.addEventListener('click', (e) => { 
      if (e.target === confirmModal) closeConfirmModal(); 
    });
    if (confirmNoBtn) confirmNoBtn.addEventListener('click', closeConfirmModal);
    if (confirmYesBtn) confirmYesBtn.addEventListener('click', handleConfirmYes);
    
    // Profile
    if (profileForm) profileForm.addEventListener('submit', handleProfileSubmit);
    if (randomizeAvatarBtn) randomizeAvatarBtn.addEventListener('click', handleRandomizeAvatar);
    
    // Avatar style options
    const avatarStyleOptions = qsa('.avatar-style-option');
    avatarStyleOptions.forEach(option => {
      option.addEventListener('click', handleAvatarStyleChange);
    });

    // Close modals on Esc
    document.addEventListener('keydown', (e) => { 
      if (e.key === 'Escape') { 
        if (quizModal && quizModal.style.display !== 'none') closeQuizModal(); 
        if (confirmModal && confirmModal.style.display !== 'none') closeConfirmModal(); 
      }
    });

    // User avatar dropdown
    const userAvatar = qs('#userAvatar');
    const avatarDropdown = qs('#avatarDropdown');
    const profileBtn = qs('#profileBtn');
    const signoutBtn = qs('#signoutBtn');
    
    if (userAvatar && avatarDropdown) {
      userAvatar.addEventListener('click', (e) => {
        e.stopPropagation();
        avatarDropdown.classList.toggle('show');
      });
    }
    
    if (profileBtn) {
      profileBtn.addEventListener('click', () => {
        avatarDropdown.classList.remove('show');
        switchView('profile');
      });
    }
    
    if (signoutBtn) {
      signoutBtn.addEventListener('click', handleSignOut);
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      if (avatarDropdown) avatarDropdown.classList.remove('show');
    });
    
    console.log("Event listeners added successfully");
  }

  // Views
  function handleNavClick(e) { 
    const btn = e.target.closest('.nav-item'); 
    if (btn?.dataset.nav && btn.dataset.nav !== state.currentView) {
      switchView(btn.dataset.nav); 
    }
  }

  function switchView(viewName, isInitialLoad = false) {
    console.log(`Switching to view: ${viewName}`);
    
    state.currentView = viewName;
    
    // Update navigation
    qsa('.nav-item', mainNav).forEach(el => {
      el.classList.toggle('active', el.dataset.nav === viewName);
    });
    
    // Update title
    let title = viewName.charAt(0).toUpperCase() + viewName.slice(1);
    const btn = qs(`.nav-item[data-nav="${viewName}"] span`, mainNav); 
    if (btn) title = btn.textContent.trim();
    if (mainTitleEl) mainTitleEl.textContent = title;
    
    // Hide all sections, show target
    qsa('main.content > section[data-view]').forEach(s => {
      s.hidden = s.dataset.view !== viewName;
    });
    
    // Handle view-specific initialization (after sections are hidden/shown)
    if (!isInitialLoad) saveState(); // Only save state if not initial load
    
    switch (viewName) {
      case 'dashboard': 
        renderFocusBlock(); 
        renderWeeklyProgress(); 
        renderTasks(); 
        renderActivityFeed();
        updateLiveStats();
        break;
      case 'assistant': 
        renderChat(); 
        if (chatInput) chatInput.focus(); 
        break;
      case 'schedule': 
        renderScheduleTasks(); 
        break;
      case 'profile':
        renderProfilePage();
        break;
      case 'settings': 
        updateStorageUsageDisplay(); 
        break;
      case 'wellness':
        // Breathing animation is already started, ensure it's visible
        startBreathingAnimation(); 
        break;
    }
  }

  // Tasks with real-time updates
  async function handleTaskFormSubmit(e) {
    e.preventDefault();
    
    const id = editTaskIdInput.value;
    const isEdit = !!id;
    
    const taskData = {
      id: id || uid('t'),
      title: taskTitleInput.value.trim(),
      subject: taskSubjectInput.value.trim() || 'General',
      date: taskDateInput.value,
      priority: taskPriorityInput.value,
      notes: taskNotesInput.value.trim(),
      done: false,
      practicedOn: []
    };
    
    if (!taskData.title || !taskData.date) { 
      showToast("Title & date required.", 'error'); 
      return; 
    }
    
    // Show loading state
    const originalText = addTaskBtn?.innerHTML;
    if (addTaskBtn) {
      addTaskBtn.innerHTML = '<div class="loading-indicator"></div> Saving...';
      addTaskBtn.disabled = true;
    }
    
    // Simulate network delay for a smoother UX even for local ops
    setTimeout(() => {
      if (isEdit) {
        updateTask(taskData);
      } else {
        addTask(taskData);
      }
      
      // Restore button state
      if (addTaskBtn) {
        addTaskBtn.innerHTML = originalText;
        addTaskBtn.disabled = false;
      }
    }, 300);
  }

  function addTask(task) { 
    state.tasks.unshift(task); 
    addActivity(`Added: "${task.title}"`); 
    saveState(); 
    renderTasks(task.id); 
    clearTaskForm(); // Clear form after adding
    showToast(`Task "${escapeHtml(task.title)}" added`, 'success'); 
  }

  function updateTask(updatedTask) { 
    const index = state.tasks.findIndex(t => t.id === updatedTask.id); 
    if (index > -1) { 
      // Preserve existing properties like 'done' and 'practicedOn'
      updatedTask.done = state.tasks[index].done;
      updatedTask.practicedOn = state.tasks[index].practicedOn || [];
      
      state.tasks[index] = updatedTask; 
      addActivity(`Updated: "${updatedTask.title}"`); 
      saveState(); 
      renderTasks(); 
      clearTaskForm(); // Clear form after updating
      showToast(`Task "${escapeHtml(updatedTask.title)}" updated`, 'info'); 
    } 
    editTaskIdInput.value = ''; 
  }

  function deleteTask(taskId) { 
    const task = state.tasks.find(t => t.id === taskId); 
    if (task) { 
      showConfirmModal("Delete Task?", `Are you sure you want to delete "${escapeHtml(task.title)}"? This cannot be undone.`, () => { 
        performDeleteTask(taskId, task.title); 
      }); 
    } 
  }

  function performDeleteTask(taskId, taskTitle) { 
    const index = state.tasks.findIndex(t => t.id === taskId); 
    if (index > -1) { 
      state.tasks.splice(index, 1); 
      addActivity(`Deleted: "${taskTitle}"`); 
      saveState(); 
      renderTasks(); 
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
      renderTasks(); 
      showToast(`${escapeHtml(task.title)} marked as ${task.done ? 'completed' : 'pending'}`, 'info');
    } 
  }

  function markTaskPracticed(taskId) {
    const task = state.tasks.find(t => t.id === taskId); 
    const today = getTodayString();
    if (task) {
      task.practicedOn = task.practicedOn || [];
      if (!task.practicedOn.includes(today)) {
        task.practicedOn.push(today);
        // Ensure today's stats exist
        state.stats[today] = state.stats[today] || { practiced: false, score: 0, date: today };
        state.stats[today].practiced = true;
        state.stats.lastPracticeDate = today; // Update last practice date for streak calculation
        addActivity(`Practice started for: "${task.title}"`);
        saveState(); 
        renderTasks(); 
        return true; // Indicates task was marked as practiced
      } else {
        showToast(`"${escapeHtml(task.title)}" already practiced today.`, 'info');
      }
    }
    return false; // Indicates no change was made
  }

  function editTask(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
      // Switch to dashboard view if not already there
      if (state.currentView !== 'dashboard') switchView('dashboard');
      
      // Populate form
      taskTitleInput.value = task.title;
      taskSubjectInput.value = task.subject;
      taskDateInput.value = task.date;
      taskPriorityInput.value = task.priority;
      taskNotesInput.value = task.notes || '';
      editTaskIdInput.value = task.id; // Store ID for update
      
      // Change button text
      if (addTaskBtn) {
        addTaskBtn.innerHTML = 'Update Task';
      }
      
      // Focus and scroll to form
      if (taskTitleInput) taskTitleInput.focus();
      if (taskForm) taskForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function clearTaskForm() { 
    if (taskForm) taskForm.reset(); 
    editTaskIdInput.value = ''; 
    if (taskDateInput) taskDateInput.valueAsDate = new Date(); 
    if (addTaskBtn) addTaskBtn.innerHTML = 'Add New Task'; // Reset button text
  }

  function handleTaskListClick(e) {
    const target = e.target;
    const item = target.closest('.task-item');
    if (!item) return;
    
    const taskId = item.dataset.id;
    const task = state.tasks.find(t => t.id === taskId);
    
    if (target.type === 'checkbox' || target.classList.contains('task-checkbox')) {
      toggleTaskDone(taskId);
    } else if (target.dataset.action === 'edit') {
      editTask(taskId);
    } else if (target.dataset.action === 'delete') {
      deleteTask(taskId);
    } else if (target.dataset.action === 'practice' && task) {
      if (markTaskPracticed(taskId)) {
        // Automatically start AI quiz when practice is initiated
        generateAIQuiz(false, task.subject); // Generate a general AI quiz for the subject
      }
    }
  }

  function handleQuickTaskSubmit(e) {
    e.preventDefault();
    const title = quickTaskTitleInput.value.trim();
    if (!title) {
      showToast("Please enter a task title.", "warning");
      return;
    }
    
    const subject = quickTaskSubjectSelect.value || 'General';
    const newTask = { 
      id: uid('t'), 
      title, 
      subject, 
      date: getTodayString(), // Default to today
      priority: 'medium', 
      notes: '', 
      done: false, 
      practicedOn: [] 
    };
    
    addTask(newTask);
    quickTaskTitleInput.value = '';
    quickTaskSubjectSelect.value = 'General';
    showToast(`Quick task "${escapeHtml(title)}" added!`, 'success');
  }

  function markTodaysPracticedTasksDone() {
    const today = getTodayString(); 
    let count = 0;
    
    state.tasks.forEach(t => { 
      // Mark task done if practiced today and not already done
      if (t.practicedOn?.includes(today) && !t.done) { 
        t.done = true; 
        count++; 
      }
    });
    
    if (count > 0) { 
      addActivity(`Marked ${count} practiced tasks done.`); 
      saveState(); 
      renderTasks(); 
      showToast(`Marked ${count} practiced tasks done.`, 'success'); 
    } else {
      showToast("No uncompleted practiced tasks for today.", 'info');
    }
  }

  function sortAndRenderTasks(field) {
    if (currentSort.field === field) {
      currentSort.ascending = !currentSort.ascending; // Toggle ascending/descending
    } else {
      currentSort.field = field;
      currentSort.ascending = true; // Default to ascending for new sort field
    }
    
    showToast(`Sorted by ${field} ${currentSort.ascending ? 'ascending' : 'descending'}`, 'info');
    renderTasks();
  }

  function handleShowCompletedToggle(e) { 
    state.settings.showCompleted = e.target.checked; 
    saveState(); 
    renderTasks(); // Re-render tasks with new filter
  }

  // Task rendering
  function renderTasks(highlightTaskId = null) {
    if (!tasksList) return; // Ensure element exists before trying to render
    
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    // Filter based on `showCompleted` setting
    const filteredTasks = state.settings.showCompleted ? 
      state.tasks : 
      state.tasks.filter(t => !t.done);
    
    // Sort tasks
    const sortedTasks = [...filteredTasks].sort((a, b) => {
      let comparison = 0;
      
      if (currentSort.field === 'date') {
        comparison = new Date(a.date) - new Date(b.date);
      } else if (currentSort.field === 'priority') {
        comparison = (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
      }
      
      // Secondary sort by title if primary sort is equal
      if (comparison === 0) {
        comparison = a.title.localeCompare(b.title);
      }
      
      return currentSort.ascending ? comparison : -comparison;
    });
    
    if (sortedTasks.length === 0) {
      tasksList.innerHTML = `<p class="muted-text">${
        state.settings.showCompleted && state.tasks.length > 0 ? 
        'All tasks currently completed or hidden by filter.' : 
        'No tasks yet. Add your first task above!'
      }</p>`;
      return;
    }
    
    const today = getTodayString();
    let html = '';
    
    sortedTasks.forEach(task => {
      const isDone = task.done;
      const practicedToday = task.practicedOn?.includes(today);
      const priorityClass = `task-priority-${task.priority}`;
      const dueDate = new Date(task.date).toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      
      // No explicit progress bar for tasks in list view, but could be added
      // const progress = calculateTaskProgress(task); 
      
      html += `
        <div class="task-item ${isDone ? 'done' : ''} ${task.id === highlightTaskId ? 'fade-in' : ''} ${task.priority}" data-id="${task.id}">
          <div class="task-info">
            <input type="checkbox" class="task-checkbox" ${isDone ? 'checked' : ''} aria-label="Mark task as done">
            <span class="task-title">${escapeHtml(task.title)}</span>
          </div>
          <div class="task-details">
            <span>Subject: ${escapeHtml(task.subject)} | Due: ${dueDate} | Priority: <span class="${priorityClass}">${task.priority}</span></span>
            ${task.notes ? `<p class="task-notes">${escapeHtml(task.notes)}</p>` : ''}
          </div>
          <div class="task-actions">
            <button class="btn small outline ${practicedToday ? 'success' : ''}" data-action="practice" title="${practicedToday ? 'Practiced today!' : 'Start practice session'}">
              ${practicedToday ? '✅ Practiced' : '🧠 Practice'}
            </button>
            <button class="btn small outline" data-action="edit" title="Edit Task">✏️</button>
            <button class="btn small danger outline" data-action="delete" title="Delete Task">🗑️</button>
          </div>
        </div>
      `;
    });
    
    tasksList.innerHTML = html;
    
    // Remove fade-in class after animation
    if (highlightTaskId) {
      setTimeout(() => {
        const highlighted = qs(`.task-item[data-id="${highlightTaskId}"]`);
        if (highlighted) highlighted.classList.remove('fade-in');
      }, 500);
    }
  }

  // Not currently used but kept for potential future use or detailed task views
  function calculateTaskProgress(task) {
    if (task.done) return 100;
    const today = getTodayString();
    return task.practicedOn?.includes(today) ? 50 : 0;
  }

  function updateSubjectDatalist() {
    if (!subjectSuggestionsDatalist) return;
    const subjects = [...new Set(state.tasks.map(t => t.subject).filter(Boolean))].sort();
    subjectSuggestionsDatalist.innerHTML = subjects.map(s => 
      `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`
    ).join('');
  }

  function updateQuickAddTaskSubjects() {
    if (!quickTaskSubjectSelect) return;
    const subjects = [...new Set(state.tasks.map(t => t.subject).filter(Boolean))].sort();
    const currentValue = quickTaskSubjectSelect.value;
    
    // Clear existing options except "General" (assuming "General" is the first option)
    while (quickTaskSubjectSelect.options.length > 1) {
      quickTaskSubjectSelect.remove(1);
    }
    
    // Add subject options dynamically
    subjects.forEach(subject => {
      const option = new Option(subject, subject);
      quickTaskSubjectSelect.add(option);
    });
    
    // Restore previous selection if it still exists
    if (subjects.includes(currentValue)) {
      quickTaskSubjectSelect.value = currentValue;
    } else {
      quickTaskSubjectSelect.value = 'General'; // Default to General if previous subject is gone
    }
  }

  function renderActivityFeed() {
    if (!activityList) return;
    
    if (state.activities.length === 0) {
      activityList.innerHTML = '<li>No recent activity.</li>';
      return;
    }
    
    activityList.innerHTML = state.activities.map(activity => `
      <li>
        <span>${escapeHtml(activity.text)}</span>
        <span class="activity-time">${formatTimeAgo(activity.ts)}</span>
      </li>
    `).join('');
  }

  function renderFocusBlock() {
    if (!focusSubject || !focusDescription || !focusProgressBar || !focusProgressPct || !focusTasks) return;
    
    const today = getTodayString();
    const upcomingTasks = state.tasks
      .filter(t => !t.done && new Date(t.date) >= new Date(today)) // Tasks due today or in future
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let focusSubjectName = state.stats.lastFocusSubject;
    let focusTasksList = focusSubjectName ? 
      upcomingTasks.filter(t => t.subject === focusSubjectName) : [];
    
    // If no focus subject or no tasks for it, pick the subject of the earliest upcoming task
    if (!focusSubjectName || focusTasksList.length === 0) {
      focusSubjectName = upcomingTasks.length > 0 ? upcomingTasks[0].subject : "No upcoming tasks";
      focusTasksList = upcomingTasks.filter(t => t.subject === focusSubjectName);
    }
    
    // Update last focus subject in state
    if (focusSubjectName !== "No upcoming tasks") {
      state.stats.lastFocusSubject = focusSubjectName;
    }
    
    // Calculate progress for the current focus subject
    const allSubjectTasks = state.tasks.filter(t => t.subject === focusSubjectName);
    const completedSubjectTasks = allSubjectTasks.filter(t => t.done);
    const progress = allSubjectTasks.length > 0 ? 
      Math.round((completedSubjectTasks.length / allSubjectTasks.length) * 100) : 
      (focusSubjectName === "No upcoming tasks" ? 0 : 100); // 100% if no tasks for a valid subject
    
    // Update DOM elements
    focusSubject.textContent = focusSubjectName;
    focusDescription.textContent = focusSubjectName === "No upcoming tasks" ? 
      "Add tasks to get started with focus sessions" : 
      `${completedSubjectTasks.length} of ${allSubjectTasks.length} tasks completed for this subject`;
    
    focusProgressPct.textContent = `${progress}%`;
    focusProgressBar.style.width = `${progress}%`;
    
    // Display top 3 upcoming tasks for the focus subject
    focusTasks.innerHTML = focusTasksList.slice(0, 3).map(task => 
      `<p>📝 ${escapeHtml(task.title)} (Due: ${new Date(task.date).toLocaleDateString()})</p>`
    ).join('') || '<p class="muted-text">No upcoming tasks for this subject.</p>';
    
    // Update focus score (average quiz score for the subject)
    const subjectStats = state.stats[focusSubjectName];
    const scores = subjectStats?.scores || [];
    const avgScore = scores.length > 0 ? 
      Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 
      0;
    
    if (focusScore) focusScore.textContent = `${avgScore}%`;
    
    // Enable/disable buttons based on task availability
    const hasFocusTasks = focusTasksList.length > 0 && focusSubjectName !== "No upcoming tasks";
    if (startFocusSessionBtn) {
      startFocusSessionBtn.disabled = !hasFocusTasks;
    }
    
    if (generateQuizBtn) {
      generateQuizBtn.disabled = !hasFocusTasks;
    }
  }

  function renderWeeklyProgress() {
    if (!daysRow || !consistencyStreakEl) return;
    
    updateConsistencyStreak();
    consistencyStreakEl.textContent = `${state.stats.streak} day${state.stats.streak !== 1 ? 's' : ''}`;
    
    const today = new Date();
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    let daysHtml = '';
    
    // Create 7 days (Sunday to Saturday) relative to today's week
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - today.getDay() + i); // Set to Sunday (i=0) then Monday...
      const dateString = getTodayString(date);
      
      let className = 'day-indicator';
      if (dateString === getTodayString(today)) className += ' today';
      if (state.stats[dateString]?.practiced) className += ' practiced'; // Check if practiced on this day
      
      daysHtml += `<div class="${className}" title="${dateString}">${dayNames[i]}</div>`;
    }
    
    daysRow.innerHTML = daysHtml;
  }

  function updateConsistencyStreak() {
    const today = getTodayString();
    const yesterday = getTodayString(new Date(Date.now() - 86400000)); // 24 hours in milliseconds
    
    const practicedToday = !!state.stats[today]?.practiced;
    const lastPracticeDate = state.stats.lastPracticeDate;
    
    if (practicedToday) {
      if (lastPracticeDate === yesterday) {
        state.stats.streak = (state.stats.streak || 0) + 1;
      } else if (lastPracticeDate !== today) { // Started practicing today, or already practiced today
        state.stats.streak = 1;
      }
      state.stats.lastPracticeDate = today; // Always update last practice date if practiced
    } else {
      // If not practiced today, and last practice was before yesterday, reset streak
      if (lastPracticeDate && lastPracticeDate < yesterday) {
        state.stats.streak = 0;
      }
      // If lastPracticeDate is yesterday, streak continues for today (but won't be incremented yet)
    }
  }

  function renderScheduleTasks() {
    if (!scheduleTaskList) return;
    
    const today = getTodayString();
    const scheduledTasks = state.tasks
      .filter(t => !t.done && t.date) // Only show pending tasks with a date
      .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by due date
    
    if (scheduledTasks.length === 0) {
      scheduleTaskList.innerHTML = '<p class="muted-text">No pending scheduled tasks. Add tasks with due dates to see them here.</p>';
      return;
    }
    
    scheduleTaskList.innerHTML = scheduledTasks.map(task => {
      const isPastDue = new Date(task.date) < new Date(today);
      const displayDate = new Date(task.date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      });
      
      return `
        <div class="schedule-task-item ${isPastDue ? 'past-due' : ''}">
          <span class="schedule-task-date">${displayDate}</span>
          <span class="schedule-task-title">${escapeHtml(task.title)}</span>
          <span class="schedule-task-subject">(${escapeHtml(task.subject)})</span>
          ${isPastDue ? '<span class="past-due-indicator">Past Due</span>' : ''}
        </div>
      `;
    }).join('');
  }

  function getTodayString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Chat / AI functionality
  async function handleChatSubmit(e) { 
    e.preventDefault(); 
    const message = chatInput?.value.trim(); 
    if (message && chatInput) { 
      pushUserMessage(message); 
      chatInput.value = ''; 
      await getAIResponse(message); // Call the AI for a response
    } 
  }

  async function getAIResponse(userMessage) {
    // Show typing indicator
    if (typingIndicator) typingIndicator.style.display = 'block';
    if (chatMessagesContainer) chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    
    let botResponseText = "I'm experiencing some difficulties connecting to my knowledge base. Please try again later, or ask me about tasks, study tips, or quiz generation, and I'll do my best to help!";
    
    try {
      const prompt = `You are a helpful and encouraging study assistant named EduFlow AI.
      User: "${userMessage}"
      
      Based on the user's message, provide helpful advice, suggestions, or information related to studying, task management, time management, quiz preparation, or general academic wellness. Keep your response concise, encouraging, and actionable. If the user asks about a specific subject or task, try to provide a relevant general tip.
      
      Example responses:
      - "That's a great question! For improving focus, try the Pomodoro Technique: 25 minutes of focused work followed by a 5-minute break."
      - "Dealing with procrastination can be tough. A good tip is the 2-minute rule: if a task takes less than 2 minutes, do it immediately."
      - "Managing multiple tasks? Try prioritizing them using an Eisenhower Matrix – urgent/important, important/not urgent, etc."
      - "Quiz coming up? Active recall is key! Try turning your notes into questions and testing yourself."
      - "If you're feeling overwhelmed, remember to take short breaks and practice mindfulness. Even a few deep breaths can make a difference."
      
      Provide your response here:`;

      const aiResponse = await callGeminiAPI(prompt);
      if (aiResponse) {
        botResponseText = aiResponse;
      }
    } catch (error) {
      console.error("Error getting AI chat response:", error);
      botResponseText = "I'm having trouble connecting to the AI via the proxy at the moment. Please try again later!";
      // Fallback to local simulation if proxy is not available
      botResponseText = simulateLocalChatResponse(userMessage);
      showToast("AI proxy connection failed. Using fallback chat responses.", "warning", 8000);
    } finally {
      // Hide typing indicator
      if (typingIndicator) typingIndicator.style.display = 'none';
      pushBotMessage(botResponseText);
      addActivity("Asked AI for study advice");
    }
  }

  // Simplified local chat response simulation (if API is not available)
  function simulateLocalChatResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('task') || lowerMessage.includes('homework')) {
      return "I see you're asking about tasks. Remember to break large tasks into smaller, manageable steps and prioritize by due date.";
    } 
    else if (lowerMessage.includes('study') || lowerMessage.includes('learn')) {
      return "For effective studying, try the Pomodoro technique: 25 minutes of focused work followed by a 5-minute break.";
    } 
    else if (lowerMessage.includes('schedule') || lowerMessage.includes('plan')) {
      return "Creating a consistent study schedule can greatly improve your learning efficiency. Try to study at the same time each day.";
    }
    else if (lowerMessage.includes('quiz') || lowerMessage.includes('test')) {
      return "For effective quiz preparation, focus on active recall rather than passive review. Create practice questions and use flashcards.";
    }
    else if (lowerMessage.includes('stress') || lowerMessage.includes('anxiety')) {
      return "If you're feeling stressed, remember to take breaks, practice mindfulness, and maintain a healthy balance.";
    }
    else {
      return "You can ask me about study techniques, task management, scheduling, quiz preparation, or any other academic topics. I'm here to support your learning journey!";
    }
  }


  function pushUserMessage(text) { 
    state.chat.push({ id: uid('msg'), from: 'user', text, ts: new Date().toISOString() }); 
    renderChat(); 
  }

  function pushBotMessage(text) { 
    state.chat.push({ id: uid('msg'), from: 'bot', text, ts: new Date().toISOString() }); 
    saveState(); // Save state after bot responds
    renderChat(); 
  }

  function renderChat() {
    if (!chatMessagesContainer) return;
    
    if (state.chat.length === 0) {
      chatMessagesContainer.innerHTML = `
        <div class="chat-message from-bot initial-message">
          <p>Hello! I'm your AI study assistant. I can help you with study techniques, task management, academic advice, and even generate quizzes for your subjects. What would you like to know?</p>
        </div>
      `;
      // Scroll to bottom after initial message
      chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
      return;
    }
    
    // Check if the last message in DOM matches last in state to prevent re-rendering entire chat
    const lastDomMessage = qs('.chat-message:last-child', chatMessagesContainer);
    const lastStateMessage = state.chat[state.chat.length - 1];

    if (lastStateMessage && lastDomMessage && lastDomMessage.dataset.id === lastStateMessage.id) {
      // If the last message is already rendered, just scroll
      chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
      return;
    }

    // Otherwise, re-render all messages (or append new ones for better performance if needed)
    chatMessagesContainer.innerHTML = state.chat.map(message => `
      <div class="chat-message from-${message.from}" data-id="${message.id}">
        <p>${escapeHtml(message.text)}</p>
        <span class="timestamp">${new Date(message.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    `).join('');
    
    // Scroll to bottom
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
  }

  function handleClearChat() { 
    showConfirmModal("Clear Chat History", "Are you sure you want to clear all chat messages? This cannot be undone.", () => { 
      state.chat = []; 
      addActivity("Cleared chat history"); 
      saveState(); 
      renderChat(); 
      showToast("Chat history cleared", 'info'); 
    }); 
  }

  // Enhanced Gemini AI Integration to use the proxy
  async function callGeminiAPI(prompt) {
    try {
      console.log("Calling Gemini API via proxy with prompt:", prompt.substring(0, 100) + "...");
      
      const response = await fetch(PROXY_API_URL, { // Use the PROXY_API_URL
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt // Send the prompt as an object in the body
        })
      });

      if (!response.ok) {
        const errorDetails = await response.json().catch(() => ({ message: 'No JSON error details.' }));
        console.error('Proxy API HTTP error:', response.status, response.statusText, errorDetails);
        throw new Error(`Proxy API error: ${response.status} - ${errorDetails.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      // The proxy returns { text: "AI response" }
      if (!data || !data.text) {
        console.error('Invalid response format from Proxy API:', data);
        throw new Error('Invalid response format from Proxy API');
      }
      
      return data.text;
    } catch (error) {
      console.error('Error calling Proxy API:', error);
      throw error;
    }
  }

  // Enhanced AI Quiz Generation with better error handling
  // `isFocusSession` boolean indicates if it's initiated from the focus block
  async function generateAIQuiz(isFocusSession = false, subjectOverride = null) {
    const subject = subjectOverride || state.stats.lastFocusSubject;
    
    if (!subject || subject === "No upcoming tasks") {
      showToast("Please select a focus subject first.", 'warning');
      return;
    }

    const questionCount = parseInt(quizQuestionCountInput?.value) || 5;
    const difficulty = quizDifficultyInput?.value || 'intermediate';
    
    if (questionCount < 1 || questionCount > 20) {
      showToast("Please enter between 1-20 questions for the quiz.", 'warning');
      return;
    }

    // Show loading state
    const originalBtnText = generateQuizBtn?.innerHTML;
    const originalStartBtnText = startFocusSessionBtn?.innerHTML;

    if (generateQuizBtn) {
      generateQuizBtn.disabled = true;
      generateQuizBtn.classList.add('loading');
      generateQuizBtn.innerHTML = '<div class="loading-indicator"></div> AI Generating...';
    }
    if (isFocusSession && startFocusSessionBtn) {
      startFocusSessionBtn.disabled = true;
      startFocusSessionBtn.classList.add('loading');
      startFocusSessionBtn.innerHTML = '<div class="loading-indicator"></div> Generating Quiz...';
    }
    
    showToast(`🤖 Generating ${questionCount} AI quiz questions for "${escapeHtml(subject)}" (${difficulty})...`, 'info', 0); // Indefinite toast
    loadingToastId = qs('.toast.info')?.dataset.toastId;

    try {
      let questions = [];
      // Attempt to generate questions with AI if proxy is configured.
      // Removed direct GEMINI_API_KEY check, as proxy handles environment variable.
      questions = await generateDynamicAIQuestions(subject, questionCount, difficulty);
      
      if (questions.length === 0) {
        // Fallback to local questions if AI generation failed or returned empty
        console.warn("AI quiz generation failed or returned empty. Using enhanced fallback questions.");
        throw new Error("AI generation failed or returned empty, using fallback.");
      }

      state.currentQuiz = {
        subject: subject,
        questions: questions.map((q, i) => ({ ...q, id: `q${i}`, aiGenerated: true })),
        currentQuestionIndex: 0,
        score: 0,
        userAnswers: [],
        isActive: true
      };

      dismissToast(loadingToastId); // Dismiss loading toast
      showToast(`✅ AI generated ${questions.length} questions for "${escapeHtml(subject)}"!`, 'success');
      renderCurrentQuizQuestion();
      openQuizModal();
      addActivity(`Generated AI quiz for ${subject} with ${questions.length} questions`);
      
    } catch (error) {
      console.error("AI Quiz generation error:", error);
      dismissToast(loadingToastId); // Dismiss loading toast

      // Show specific error message related to proxy connection
      if (error.message.includes('Proxy API error') || error.message.includes('Failed to fetch')) {
        showToast("🌐 Network error or AI proxy unavailable. Using fallback questions.", 'error', 8000);
      } else {
        showToast("🤖 AI quiz generation failed. Using fallback questions.", 'error', 8000);
      }
      
      // Fallback to basic questions after a short delay
      setTimeout(() => {
        startQuizForFocusSubject(subject); // This uses the enhanced fallback questions
      }, 1000);
    } finally {
      // Restore button states
      if (generateQuizBtn) {
        generateQuizBtn.disabled = false;
        generateQuizBtn.classList.remove('loading');
        generateQuizBtn.innerHTML = originalBtnText; // Restore original HTML (e.g., "Generate AI Quiz")
      }
      if (isFocusSession && startFocusSessionBtn) {
        startFocusSessionBtn.disabled = false;
        startFocusSessionBtn.classList.remove('loading');
        startFocusSessionBtn.innerHTML = originalStartBtnText; // Restore original HTML (e.g., "Start Focus Session")
      }
    }
  }

  // Enhanced AI Question Generation with better parsing
  async function generateDynamicAIQuestions(subject, count, difficulty = 'intermediate') {
    try {
      const prompt = `
Create exactly ${count} multiple choice quiz questions about "${subject}" at ${difficulty} difficulty level.

IMPORTANT: Return ONLY a JSON array in this exact format:
[
  {
    "q": "Question text here?",
    "o": ["Option A", "Option B", "Option C", "Option D"],
    "a": "Correct Option Text"
  }
]

Requirements:
- Create ${count} questions about ${subject}
- Make them ${difficulty} level difficulty
- Each question must have exactly 4 options
- The correct answer must exactly match one of the options (case-sensitive and exact string match)
- Questions should test understanding, not just memorization
- Include a mix of factual and conceptual questions
- Return valid JSON only, no other text or markdown outside the JSON array.
- Ensure the JSON is properly formatted with double quotes for all keys and string values.
`;

      const responseText = await callGeminiAPI(prompt);
      console.log("Raw AI Quiz Response:", responseText);
      
      // Clean the response: remove markdown code blocks and any leading/trailing non-JSON text
      let cleanedResponse = responseText.replace(/```json|```/g, '').trim();
      
      // Attempt to robustly extract a JSON array, even if there's surrounding text
      const jsonMatch = cleanedResponse.match(/\[\s*\{[\s\S]*?\}\s*(,\s*\{\s*[\s\S]*?\}\s*)*\]/);
      if (jsonMatch) {
        cleanedResponse = jsonMatch[0];
      } else {
        // If no array found, try to fix malformed common issues or assume full response is JSON
        if (!cleanedResponse.startsWith('[') && !cleanedResponse.endsWith(']')) {
          cleanedResponse = `[${cleanedResponse}]`; // Wrap if single object response
        }
      }
      
      console.log("Cleaned Quiz Response for JSON.parse:", cleanedResponse);
      
      const questions = JSON.parse(cleanedResponse);
      
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error("Invalid response format - not a JSON array or empty.");
      }

      // Validate each question has required fields and structure
      const validQuestions = questions.filter(q => 
        typeof q.q === 'string' && q.q.length > 0 &&
        Array.isArray(q.o) && q.o.length === 4 && 
        typeof q.a === 'string' && q.a.length > 0 && q.o.includes(q.a) // Correct answer must be one of the options
      );
      
      if (validQuestions.length === 0) {
        console.warn("AI generated questions were malformed or invalid after parsing. Using fallback.");
        throw new Error("No valid questions found in AI response after parsing.");
      }

      // Return up to the requested count of valid questions
      return validQuestions.slice(0, count);
    } catch (error) {
      console.error("AI question generation failed (parsing or proxy API):", error);
      // Fallback to local questions
      return generateEnhancedFallbackQuestions(subject, count, difficulty);
    }
  }

  // Enhanced fallback question database
  const ENHANCED_QUIZ_QUESTIONS = {
    "Mathematics": [
      {
        q: "What is the value of π (pi) approximately?",
        o: ["3.14", "2.71", "1.62", "4.13"],
        a: "3.14"
      },
      {
        q: "What is 15 × 7?",
        o: ["95", "105", "115", "125"],
        a: "105"
      },
      {
        q: "What is the square root of 144?",
        o: ["11", "12", "13", "14"],
        a: "12"
      },
      {
        q: "Solve for x: 2x + 5 = 15",
        o: ["x = 5", "x = 10", "x = 7.5", "x = 8"],
        a: "x = 5"
      },
      {
        q: "What is the area of a circle with radius 5?",
        o: ["25π", "10π", "5π", "15π"],
        a: "25π"
      },
      {
        q: "What is the derivative of x²?",
        o: ["2x", "x", "2", "x³/3"],
        a: "2x"
      }
    ],
    "Science": [
      {
        q: "What planet is known as the Red Planet?",
        o: ["Venus", "Mars", "Jupiter", "Saturn"],
        a: "Mars"
      },
      {
        q: "What is H₂O commonly known as?",
        o: ["Oxygen", "Hydrogen", "Water", "Carbon dioxide"],
        a: "Water"
      },
      {
        q: "What gas do plants absorb from the atmosphere?",
        o: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"],
        a: "Carbon dioxide"
      },
      {
        q: "What is the chemical symbol for gold?",
        o: ["Go", "Gd", "Au", "Ag"],
        a: "Au"
      },
      {
        q: "Which of these is a noble gas?",
        o: ["Oxygen", "Nitrogen", "Helium", "Chlorine"],
        a: "Helium"
      }
    ],
    "Computer Science": [
      {
        q: "What does CPU stand for?",
        o: ["Computer Processing Unit", "Central Processing Unit", "Central Program Utility", "Computer Program Unit"],
        a: "Central Processing Unit"
      },
      {
        q: "Which language is known for web development?",
        o: ["Python", "JavaScript", "C++", "Java"],
        a: "JavaScript"
      },
      {
        q: "What is the time complexity of binary search?",
        o: ["O(1)", "O(n)", "O(log n)", "O(n²)"],
        a: "O(log n)"
      },
      {
        q: "Which data structure uses LIFO (Last In First Out)?",
        o: ["Queue", "Stack", "Array", "Linked List"],
        a: "Stack"
      }
    ],
    "History": [
      {
        q: "In what year did World War II end?",
        o: ["1943", "1944", "1945", "1946"],
        a: "1945"
      },
      {
        q: "Who was the first president of the United States?",
        o: ["Thomas Jefferson", "John Adams", "George Washington", "Abraham Lincoln"],
        a: "George Washington"
      },
      {
        q: "The Renaissance began in which country?",
        o: ["France", "England", "Italy", "Germany"],
        a: "Italy"
      }
    ],
    "English": [
      {
        q: "Who wrote 'Romeo and Juliet'?",
        o: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
        a: "William Shakespeare"
      },
      {
        q: "What is the past tense of 'go'?",
        o: ["goed", "went", "gone", "going"],
        a: "went"
      }
    ],
    "Physics": [
      {
        q: "What is the unit of force?",
        o: ["Joule", "Watt", "Newton", "Pascal"],
        a: "Newton"
      },
      {
        q: "What is the speed of light in vacuum?",
        o: ["300,000 km/s", "150,000 km/s", "500,000 km/s", "1,000,000 km/s"],
        a: "300,000 km/s"
      }
    ],
    "Chemistry": [
      {
        q: "What is the atomic number of carbon?",
        o: ["6", "12", "14", "8"],
        a: "6"
      },
      {
        q: "What is the pH of pure water?",
        o: ["5", "7", "8", "0"],
        a: "7"
      }
    ],
    "Biology": [
      {
        q: "What is the powerhouse of the cell?",
        o: ["Nucleus", "Mitochondria", "Ribosome", "Golgi Apparatus"],
        a: "Mitochondria"
      },
      {
        q: "How many chromosomes do humans have?",
        o: ["23", "46", "48", "24"],
        a: "46"
      }
    ],
    "General": [
      {
        q: "What is the capital of France?",
        o: ["London", "Berlin", "Paris", "Madrid"],
        a: "Paris"
      },
      {
        q: "How many continents are there?",
        o: ["5", "6", "7", "8"],
        a: "7"
      },
      {
        q: "What is the largest ocean on Earth?",
        o: ["Atlantic", "Indian", "Arctic", "Pacific"],
        a: "Pacific"
      }
    ]
  };

  function generateEnhancedFallbackQuestions(subject, count, difficulty) {
    console.log(`Using fallback questions for ${subject}, difficulty: ${difficulty}`);
    
    // Normalize subject to match keys in ENHANCED_QUIZ_QUESTIONS
    const normalizedSubject = Object.keys(ENHANCED_QUIZ_QUESTIONS).find(key => 
      key.toLowerCase() === subject.toLowerCase()
    ) || subject; // Keep original if no direct match
    
    let baseQuestions = ENHANCED_QUIZ_QUESTIONS[normalizedSubject];
    
    // If no exact match, try to find similar subjects
    if (!baseQuestions || baseQuestions.length === 0) {
      const subjectLower = subject.toLowerCase();
      for (const [key, questions] of Object.entries(ENHANCED_QUIZ_QUESTIONS)) {
        if (subjectLower.includes(key.toLowerCase()) || key.toLowerCase().includes(subjectLower)) {
          baseQuestions = questions;
          break;
        }
      }
    }
    
    // Fall back to General questions if still no match
    if (!baseQuestions || baseQuestions.length === 0) {
      baseQuestions = ENHANCED_QUIZ_QUESTIONS["General"];
    }
    
    const questions = [];
    
    if (baseQuestions && baseQuestions.length > 0) {
      // Shuffle and take the requested number, ensuring uniqueness if possible
      const shuffled = [...baseQuestions].sort(() => 0.5 - Math.random());
      questions.push(...shuffled.slice(0, Math.min(count, shuffled.length)));
    }
    
    // Generate additional placeholder questions if the count isn't met
    const remainingCount = count - questions.length;
    if (remainingCount > 0) {
      const difficultyTerms = {
        'beginner': ['basic', 'fundamental', 'simple', 'introductory'],
        'intermediate': ['key concept', 'important', 'main', 'significant'],
        'advanced': ['complex', 'advanced', 'detailed', 'sophisticated']
      };
      
      const terms = difficultyTerms[difficulty] || difficultyTerms['intermediate'];
      const term = terms[Math.floor(Math.random() * terms.length)];
      
      for (let i = 0; i < remainingCount; i++) {
        const fallbackOptions = [
          `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Concept A`,
          `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Concept B`, 
          `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Concept C`,
          `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Concept D`
        ];
        questions.push({
          q: `Fallback Question ${questions.length + 1}: What is a ${term} aspect of ${escapeHtml(subject)}?`,
          o: fallbackOptions,
          a: fallbackOptions[0], // Default the first option as correct for fallbacks
          fallback: true
        });
      }
    }
    
    console.log(`Generated ${questions.length} fallback questions for ${subject}`);
    return questions;
  }

  // Test function to verify AI integration
  async function testAIIntegration() {
    console.log("Testing AI Integration via proxy...");
    
    try {
      const testPrompt = "Return ONLY '{\"message\": \"AI is working\"}' as a JSON object, no other text or markdown.";
      const response = await callGeminiAPI(testPrompt);
      console.log("AI Test Response:", response);
      
      const cleaned = response.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (parsed.message === "AI is working") {
        console.log("✅ AI Integration Test via proxy: PASSED");
        return true;
      }
    } catch (error) {
      console.error("❌ AI Integration Test via proxy: FAILED", error);
    }
    return false;
  }
  
  // The `simulateAIGeneration` and `QUIZ_QUESTIONS` (old fallback) are effectively replaced 
  // by `generateDynamicAIQuestions` and `generateEnhancedFallbackQuestions`.
  // They can be removed to reduce code duplication if not strictly needed for other fallbacks.

  // The `startQuizForFocusSubject` function is now primarily a fallback/local quiz starter.
  // The `generateAIQuiz` handles the main flow.
  function startQuizForFocusSubject(subject = null) {
    const quizSubject = subject || state.stats.lastFocusSubject || "General";
    
    if (!quizSubject || quizSubject === "No upcoming tasks") {
      showToast("Please select a subject first for a quick quiz.", 'warning');
      return;
    }

    const questionCount = parseInt(quizQuestionCountInput?.value) || 5;
    const difficulty = quizDifficultyInput?.value || 'intermediate';
    
    // Use enhanced fallback questions directly
    const questions = generateEnhancedFallbackQuestions(quizSubject, questionCount, difficulty);
    
    if (questions.length === 0) {
      showToast(`No quiz questions available for "${escapeHtml(quizSubject)}".`, 'error');
      return;
    }
    
    state.currentQuiz = {
      subject: quizSubject,
      questions: questions.map((q, i) => ({ ...q, id: `q${i}`, aiGenerated: q.fallback || false })), // Mark as AI-generated if it was a fallback that filled the template
      currentQuestionIndex: 0,
      score: 0,
      userAnswers: [],
      isActive: true
    };
    
    showToast(`Starting quick quiz for "${escapeHtml(quizSubject)}" with ${questions.length} questions.`, 'info');
    renderCurrentQuizQuestion();
    openQuizModal();
    addActivity(`Started quick quiz for ${quizSubject}`);
  }

  function renderCurrentQuizQuestion() {
    if (!state.currentQuiz.isActive || state.currentQuiz.questions.length === 0) return;
    
    const currentIndex = state.currentQuiz.currentQuestionIndex;
    const question = state.currentQuiz.questions[currentIndex];
    const totalQuestions = state.currentQuiz.questions.length;
    
    if (!question || !quizQuestionEl || !quizOptionsEl || !quizProgressText) return;
    
    // Add AI indicator if the question was AI-generated
    const aiIndicator = question.aiGenerated ? ' <span class="ai-indicator" title="AI Generated">🤖</span>' : '';
    
    quizQuestionEl.innerHTML = escapeHtml(question.q) + aiIndicator; // Escape HTML for question text
    quizProgressText.textContent = `${currentIndex + 1} / ${totalQuestions}`;
    
    // Render options with enhanced styling
    quizOptionsEl.innerHTML = question.o.map((option, index) => `
      <button class="quiz-option-btn btn outline" 
              data-option="${escapeHtml(option)}"
              aria-label="Option ${String.fromCharCode(65 + index)}: ${escapeHtml(option)}">
        ${String.fromCharCode(65 + index)}) ${escapeHtml(option)}
      </button>
    `).join('');
    
    // Update next button text and state
    if (nextQuizQuestionBtn) {
      nextQuizQuestionBtn.textContent = currentIndex === totalQuestions - 1 ? 'Finish Quiz' : 'Next Question';
      nextQuizQuestionBtn.disabled = true; // Disable until an option is selected
    }
  }

  function handleQuizOptionSelect(e) {
    const optionBtn = e.target.closest('.quiz-option-btn');
    if (!optionBtn || !state.currentQuiz.isActive) return;
    
    // Clear previous selection visually
    qsa('.quiz-option-btn', quizOptionsEl).forEach(btn => {
      btn.classList.remove('selected');
    });
    
    // Select current option visually
    optionBtn.classList.add('selected');
    
    // Enable next button
    if (nextQuizQuestionBtn) nextQuizQuestionBtn.disabled = false;
  }

  function handleNextQuizQuestion() {
    if (!state.currentQuiz.isActive || !nextQuizQuestionBtn || nextQuizQuestionBtn.disabled) return;
    
    const currentIndex = state.currentQuiz.currentQuestionIndex;
    const question = state.currentQuiz.questions[currentIndex];
    const selectedOption = qs('.quiz-option-btn.selected', quizOptionsEl);
    
    if (!selectedOption || !question) {
      showToast("Please select an answer before proceeding.", 'warning');
      return;
    }
    
    const selectedAnswer = selectedOption.dataset.option;
    const isCorrect = selectedAnswer === question.a;
    
    // Provide immediate visual feedback for correct/wrong
    qsa('.quiz-option-btn', quizOptionsEl).forEach(btn => {
      btn.disabled = true; // Disable all options after selection
      if (btn.dataset.option === question.a) {
        btn.classList.add('correct');
      } else if (btn === selectedOption && !isCorrect) {
        btn.classList.add('wrong');
      }
    });
    
    // Update score
    if (isCorrect) state.currentQuiz.score++;
    
    state.currentQuiz.userAnswers.push({
      questionId: question.id,
      selected: selectedAnswer,
      correct: isCorrect
    });
    
    // Move to next question or show results after a short delay
    setTimeout(() => {
      if (currentIndex < state.currentQuiz.questions.length - 1) {
        state.currentQuiz.currentQuestionIndex++;
        renderCurrentQuizQuestion();
      } else {
        showQuizResults();
      }
    }, 1500); // 1.5 seconds delay for feedback
  }

  function showQuizResults() {
    if (!quizContainer || !quizResultsEl || !quizScoreEl || !quizTotalQuestionsEl) return;
    
    const totalQuestions = state.currentQuiz.questions.length;
    const score = state.currentQuiz.score;
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    
    // Hide question container, show results container
    quizContainer.style.display = 'none';
    quizResultsEl.style.display = 'block';
    
    quizScoreEl.textContent = score;
    quizTotalQuestionsEl.textContent = totalQuestions;
    
    // Update general statistics
    const subject = state.currentQuiz.subject;
    const today = getTodayString();
    
    if (subject && subject !== "No upcoming tasks") {
      // Initialize subject stats if they don't exist
      if (!state.stats[subject]) state.stats[subject] = { scores: [], totalFocusMinutes: 0 };
      state.stats[subject].scores = state.stats[subject].scores || [];
      state.stats[subject].scores.push(percentage);
    }
    
    // Update daily practice status and score
    state.stats[today] = state.stats[today] || { practiced: false, score: 0, date: today };
    state.stats[today].practiced = true;
    state.stats[today].score = Math.max(state.stats[today].score || 0, percentage); // Keep highest score for the day
    state.stats.lastPracticeDate = today; // Update last practice date for streak
    
    // Update quiz stats
    state.stats.totalQuizzes = (state.stats.totalQuizzes || 0) + 1;
    // Each quiz session counts for approx. 15 minutes of focus
    state.stats.totalFocusHours = (state.stats.totalFocusHours || 0) + (15 / 60); 
    
    addActivity(`Completed ${subject} quiz: ${score}/${totalQuestions} (${percentage}%)`);
    
    // Mark associated tasks as practiced for today
    state.tasks.forEach(task => {
      if (task.subject === subject && !task.done) {
        task.practicedOn = task.practicedOn || [];
        if (!task.practicedOn.includes(today)) {
          task.practicedOn.push(today);
        }
      }
    });
    
    state.currentQuiz.isActive = false; // Deactivate current quiz
    saveState(); // Save all state changes
  }

  function openQuizModal() {
    if (!quizModal) return;
    quizModal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }

  function closeQuizModal() {
    if (!quizModal) return;
    quizModal.style.display = 'none';
    document.body.style.overflow = ''; // Restore background scrolling
    
    // Reset quiz state to default
    state.currentQuiz = JSON.parse(JSON.stringify(DEFAULT_STATE.currentQuiz));
    
    // Reset UI visibility
    if (quizContainer) quizContainer.style.display = 'block';
    if (quizResultsEl) quizResultsEl.style.display = 'none';
    
    // Ensure all options are reset for next quiz
    qsa('.quiz-option-btn', quizOptionsEl).forEach(btn => {
      btn.classList.remove('selected', 'correct', 'wrong');
      btn.disabled = false;
    });
  }

  // Profile functionality
  function renderProfilePage() {
    if (!profileUserName) return;
    
    // Update profile display
    profileUserName.textContent = state.profile.username;
    profileUserEmail.textContent = state.profile.email || 'Not set';
    
    if (profileJoinDate) {
      const joinDate = new Date(state.stats.joinDate);
      profileJoinDate.textContent = joinDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric' // Added day for more precision
      });
    }
    
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
    
    // Update selected style visually in the profile settings
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
    if (!statTotalTasks) return; // Ensure element exists
    
    const totalTasks = state.tasks.length;
    const completedTasks = state.tasks.filter(task => task.done).length;
    const uniqueSubjects = [...new Set(state.tasks.map(task => task.subject).filter(s => s))].length; // Filter out empty subjects
    
    statTotalTasks.textContent = totalTasks;
    statCompletedTasks.textContent = completedTasks;
    statCurrentStreak.textContent = state.stats.streak || 0;
    statQuizzesTaken.textContent = state.stats.totalQuizzes || 0;
    statFocusHours.textContent = Math.round(state.stats.totalFocusHours || 0);
    statSubjects.textContent = uniqueSubjects;
  }

  function updateStudyAnalytics() {
    if (!avgStudyTime || !completionRate || !topSubject) return;
    
    // Calculate average study time per day since joining
    const daysSinceJoin = Math.max(1, Math.floor((new Date() - new Date(state.stats.joinDate)) / (1000 * 60 * 60 * 24)));
    const avgHours = (state.stats.totalFocusHours || 0) / daysSinceJoin;
    avgStudyTime.textContent = `${avgHours.toFixed(1)}h/day`; // Display with one decimal place
    
    // Calculate overall completion rate
    const rate = calculateCompletionRate();
    completionRate.textContent = `${rate}%`;
    
    // Find top subject by task count
    const subjectCounts = {};
    state.tasks.forEach(task => {
      subjectCounts[task.subject] = (subjectCounts[task.subject] || 0) + 1;
    });
    
    let topSubjectName = '-';
    let maxCount = 0;
    
    Object.entries(subjectCounts).forEach(([subject, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topSubjectName = subject;
      }
    });
    
    topSubject.textContent = topSubjectName;
  }

  function calculateCompletionRate() {
    const totalTasks = state.tasks.length;
    const completedTasks = state.tasks.filter(task => task.done).length;
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  }

  function handleProfileSubmit(e) {
    e.preventDefault();
    
    state.profile.username = profileUsername.value.trim() || 'User';
    state.profile.email = profileEmail.value.trim();
    state.profile.studyFocus = profileStudyFocus.value.trim();
    state.profile.bio = profileBio.value.trim();
    
    saveState();
    renderProfilePage(); // Re-render profile page with updated data
    updateMainAvatar(); // Update avatar in header
    
    // Update welcome message
    if (welcomeMessageEl) {
      const hour = new Date().getHours();
      let greeting = "Hello";
      if (hour < 12) greeting = "Good morning";
      else if (hour < 18) greeting = "Good afternoon";
      else greeting = "Good evening";
      
      welcomeMessageEl.textContent = `${greeting}, ${state.profile.username}!`;
    }
    
    showToast('Profile updated successfully!', 'success');
  }

  function handleAvatarStyleChange(e) {
    const style = e.currentTarget.dataset.style;
    if (state.profile.avatarStyle !== style) { // Only update if style actually changes
      state.profile.avatarStyle = style;
      saveState();
      updateProfileAvatar();
      showToast(`Avatar style changed to ${style}`, 'info');
    }
  }

  function handleRandomizeAvatar() {
    const styles = ['initial', 'gradient', 'icon', 'pattern'];
    let randomStyle = styles[Math.floor(Math.random() * styles.length)];
    
    // Ensure new style is different from current, try up to 3 times
    let attempts = 0;
    while (randomStyle === state.profile.avatarStyle && attempts < 3) {
      randomStyle = styles[Math.floor(Math.random() * styles.length)];
      attempts++;
    }

    state.profile.avatarStyle = randomStyle;
    saveState();
    updateProfileAvatar();
    showToast('Avatar randomized!', 'info');
  }

  function generateDynamicAvatar(username, email, avatarStyle) {
    const firstLetter = (username || 'U').charAt(0).toUpperCase();
    
    switch(avatarStyle) {
      case 'gradient':
        const gradients = [
          'linear-gradient(135deg, #FF6B6B, #4ECDC4)',
          'linear-gradient(135deg, #45B7D1, #96C93D)',
          'linear-gradient(135deg, #FFA62E, #EA4C89)',
          'linear-gradient(135deg, #654EA3, #EAAFC8)',
          'linear-gradient(135deg, #2C3E50, #3498DB)'
        ];
        const gradientIndex = simpleHash(username + email) % gradients.length;
        return `<div class="avatar-gradient" style="background: ${gradients[gradientIndex]}">${firstLetter}</div>`;
        
      case 'icon':
        // Using Font Awesome classes. Make sure Font Awesome is linked in HTML.
        const icons = ['user-graduate', 'user-tie', 'user-ninja', 'user-astronaut', 'user-secret', 'book-reader', 'brain', 'lightbulb'];
        const iconIndex = simpleHash(username + email + avatarStyle) % icons.length; // Add avatarStyle to hash for more randomness
        return `<i class="fas fa-${icons[iconIndex]} avatar-icon" aria-hidden="true"></i>`; // Add aria-hidden for accessibility
        
      case 'pattern':
        const patterns = ['avatar-pattern-1', 'avatar-pattern-2', 'avatar-pattern-3', 'avatar-pattern-4', 'avatar-pattern-5'];
        const patternIndex = simpleHash(username + email + avatarStyle) % patterns.length;
        return `<div class="avatar-pattern ${patterns[patternIndex]}">${firstLetter}</div>`;
        
      default: // 'initial'
        return `<div class="avatar-initial">${firstLetter}</div>`;
    }
  }

  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < (str || '').length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  // Wellness functionality
  const wellnessTips = [
    "Take 5 deep breaths to reset your focus.",
    "Stretch your neck and shoulders to release tension.",
    "Look away from the screen for 20 seconds to rest your eyes.",
    "Drink a glass of water to stay hydrated.",
    "Think of one thing you're grateful for today.",
    "Stand up and walk around for a minute.",
    "Listen to a calming song or nature sounds.",
    "Close your eyes and visualize a peaceful place.",
    "Practice a 1-minute mindfulness exercise.",
    "Do a quick body scan to notice any tension.",
    "Smile! It can improve your mood.",
    "Reach out to a friend or family member for a quick chat."
  ];
  
  let currentTipIndex = 0;

  function startBreathingAnimation() {
    if (!breathingCircle || !breathingInstruction) return;
    
    // Clear any existing interval to prevent multiple animations
    clearInterval(breathIntervalId);
    
    let isInhaling = true;
    const duration = 4000; // 4 seconds per phase (inhale/exhale)
    
    function updateBreathingDisplay() {
      if (isInhaling) {
        breathingCircle.textContent = 'Inhale';
        breathingInstruction.textContent = 'Breathe in slowly...';
      } else {
        breathingCircle.textContent = 'Exhale';
        breathingInstruction.textContent = 'Breathe out slowly...';
      }
      isInhaling = !isInhaling;
    }
    
    // Apply CSS animation for the actual scaling effect
    breathingCircle.style.animation = `breathe ${duration * 2}ms ease-in-out infinite`;
    
    // Update text instructions periodically
    updateBreathingDisplay(); // Initial display
    breathIntervalId = setInterval(updateBreathingDisplay, duration);
  }

  function startWellnessTipCycle() {
    clearInterval(wellnessTipIntervalId);
    
    // Show initial tip
    if (wellnessTipText) {
      wellnessTipText.textContent = wellnessTips[currentTipIndex];
    }
    
    // Cycle through tips every 30 seconds with a fade effect
    wellnessTipIntervalId = setInterval(() => {
      currentTipIndex = (currentTipIndex + 1) % wellnessTips.length;
      if (wellnessTipText) {
        wellnessTipText.style.opacity = '0'; // Start fade out
        setTimeout(() => {
          wellnessTipText.textContent = wellnessTips[currentTipIndex];
          wellnessTipText.style.opacity = '1'; // Fade in new tip
        }, 500); // Wait for half a second for fade out
      }
    }, 30000); // 30 seconds interval
  }

  // Settings functionality
  function handleDarkModeToggle(e) {
    state.settings.darkMode = e.target.checked;
    applyDark(state.settings.darkMode);
    updateThemeButtonIcon();
    saveState();
  }

  function handleThemeToggleClick() {
    state.settings.darkMode = !state.settings.darkMode;
    if (darkModeToggle) darkModeToggle.checked = state.settings.darkMode; // Sync checkbox
    applyDark(state.settings.darkMode);
    updateThemeButtonIcon();
    saveState();
  }

  function applyDark(isDark) {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light'); // Apply to root element
    document.body.classList.toggle('dark', isDark);
    document.body.classList.toggle('light', !isDark);
  }

  function updateThemeButtonIcon() {
    if (!toggleThemeBtn) return;
    toggleThemeBtn.textContent = state.settings.darkMode ? '☀️' : '🌙';
    toggleThemeBtn.title = state.settings.darkMode ? 'Switch to light mode' : 'Switch to dark mode';
  }

  function handleNotificationToggle(e) {
    state.settings.notifications = e.target.checked;
    saveState();
    showToast(
      state.settings.notifications ? 
      "Notifications enabled (feature not fully implemented)" : 
      "Notifications disabled", 
      'info'
    );
    // In a real application, you'd request notification permissions here
    // and set up actual browser notifications.
  }

  function handleAutoSaveToggle(e) {
    state.settings.autoSave = e.target.checked;
    saveState();
    showToast(
      state.settings.autoSave ? 
      "Auto-save enabled" : 
      "Auto-save disabled", 
      'info'
    );
  }

  function handleExportData() {
    // Check for jspdf library
    if (!window.jspdf || !window.jspdf.jsPDF) {
      showToast("PDF export library not loaded. Please ensure jspdf is correctly linked.", 'error');
      console.error("jspdf library not found. Make sure it's included in your HTML.");
      return;
    }

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      
      // Set document properties
      doc.setProperties({
        title: 'EduFlow Pro Data Export',
        subject: 'Study Tasks and Progress',
        author: state.profile.username || 'EduFlow User',
        keywords: 'education, tasks, study, progress',
        creator: 'EduFlow Pro'
      });
      
      // Add title
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0); // Black color
      doc.text('EduFlow Pro Data Export', 20, 30);
      
      // Add export date
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100); // Grey color
      doc.text(`Exported on: ${new Date().toLocaleDateString()}`, 20, 45);
      
      // Add user information
      let yPosition = 65;
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('User Profile', 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(12);
      doc.text(`Username: ${state.profile.username}`, 20, yPosition);
      doc.text(`Email: ${state.profile.email || 'N/A'}`, 20, yPosition + 10);
      doc.text(`Study Focus: ${state.profile.studyFocus || 'Not specified'}`, 20, yPosition + 20);
      doc.text(`Member since: ${new Date(state.stats.joinDate).toLocaleDateString()}`, 20, yPosition + 30);
      yPosition += 50; // Move down for next section
      
      // Add statistics
      doc.setFontSize(16);
      doc.text('Study Statistics', 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(12);
      doc.text(`Total Tasks: ${state.tasks.length}`, 20, yPosition);
      doc.text(`Completed Tasks: ${state.tasks.filter(t => t.done).length}`, 20, yPosition + 10);
      doc.text(`Current Streak: ${state.stats.streak} days`, 20, yPosition + 20);
      doc.text(`Quizzes Taken: ${state.stats.totalQuizzes || 0}`, 20, yPosition + 30);
      doc.text(`Focus Hours: ${Math.round(state.stats.totalFocusHours || 0)}`, 20, yPosition + 40);
      doc.text(`Top Subject: ${topSubject.textContent || 'N/A'}`, 20, yPosition + 50);
      yPosition += 70; // Move down for tasks
      
      // Add tasks
      doc.setFontSize(16);
      doc.text('Tasks', 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(10);
      state.tasks.forEach((task, index) => {
        // Add new page if content exceeds current page height
        if (yPosition > 270) { // Approx. A4 height minus margins
          doc.addPage();
          yPosition = 20;
        }
        
        const status = task.done ? '✓ Completed' : '○ Pending';
        const practiced = task.practicedOn && task.practicedOn.length > 0 ? ` (Practiced ${task.practicedOn.length}x)` : '';
        
        doc.text(`${index + 1}. ${task.title} - ${status}${practiced}`, 20, yPosition);
        doc.text(`   Subject: ${task.subject} | Due: ${task.date} | Priority: ${task.priority}`, 25, yPosition + 5);
        
        yPosition += 12; // Line height for next task entry
      });
      
      // Save the PDF
      doc.save(`eduflow-data-${new Date().toISOString().split('T')[0]}.pdf`);
      
      showToast('Data exported as PDF successfully!', 'success');
    } catch (error) {
      console.error('PDF export error:', error);
      showToast('Error exporting PDF. Please check console for details.', 'error');
    }
  }

  function handleClearData() {
    showConfirmModal(
      "Clear All Data", 
      "This will permanently delete ALL your tasks, progress, chat history, and settings. This action cannot be undone and will reset EduFlow Pro to its default state. Are you absolutely sure?", 
      () => {
        localStorage.removeItem(STORAGE_KEY);
        // Reset the state to a fresh default
        state = JSON.parse(JSON.stringify(DEFAULT_STATE));
        saveState(); // Save the cleared state
        
        // Re-initialize the app to reflect the cleared state across all UI
        init(); 
        
        showToast("All data cleared successfully", 'info');
      }
    );
  }

  function updateStorageUsageDisplay() {
    if (storageUsageEl) {
      // localStorage.length gives number of key-value pairs
      // For more accurate byte usage, iterate over keys and sum string lengths
      let totalBytes = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        if (key && value) {
          totalBytes += key.length + value.length;
        }
      }
      const kb = (totalBytes / 1024).toFixed(2);
      storageUsageEl.textContent = `${kb} KB (${localStorage.length} items)`;
    }
  }

  // Utility functions
  function showToast(message, type = 'info', duration = 4000) {
    if (!toastContainer) return null;
    
    const id = uid('toast');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.dataset.toastId = id;
    toast.setAttribute('role', 'status'); // Accessibility
    toast.setAttribute('aria-live', 'polite'); // Accessibility
    
    let icon = 'ℹ️';
    switch(type) {
      case 'success': icon = '✅'; break;
      case 'error': icon = '❌'; break;
      case 'warning': icon = '⚠️'; break;
    }
    
    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-message">${escapeHtml(message)}</span>
      <button class="toast-close" onclick="dismissToast('${id}')" aria-label="Dismiss notification">&times;</button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto remove if duration is specified
    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }
    
    return id;
  }

  // Global function for toast dismissal (needed for inline onclick in `showToast`)
  // Defined outside the IIFE to be globally accessible, or attached to window object.
  // For better encapsulation, could use event delegation.
  window.dismissToast = function(id) {
    const toast = document.querySelector(`.toast[data-toast-id="${id}"]`);
    if (toast) {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300); // Match CSS transition duration
    }
  };

  function showConfirmModal(title, message, onConfirm) {
    if (!confirmModal || !confirmTitle || !confirmMessage) return;
    
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    confirmCallback = onConfirm; // Store the callback
    
    confirmModal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    confirmModal.setAttribute('aria-modal', 'true'); // Accessibility
    confirmModal.setAttribute('role', 'dialog'); // Accessibility
  }

  function closeConfirmModal() {
    if (confirmModal) {
      confirmModal.style.display = 'none';
      document.body.style.overflow = ''; // Restore background scrolling
      confirmModal.removeAttribute('aria-modal');
      confirmModal.removeAttribute('role');
    }
    confirmCallback = null; // Clear the callback
  }

  function handleConfirmYes() {
    if (typeof confirmCallback === 'function') {
      confirmCallback(); // Execute the stored callback
    }
    closeConfirmModal();
  }

  function formatTimeAgo(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString(); // For older entries, show full date
  }

  function handleSignOut() {
    showConfirmModal("Sign Out", "Are you sure you want to sign out? This will clear all active sessions and you'll need to log in again.", () => {
      // Clear all intervals
      realTimeIntervals.forEach(clearInterval);
      realTimeIntervals = [];
      
      clearInterval(breathIntervalId);
      clearInterval(wellnessTipIntervalId);
      
      // In a real application, you would:
      // 1. Clear authentication tokens (e.g., from localStorage, sessionStorage, or cookies)
      // 2. Perform a server-side logout (if applicable)
      // 3. Redirect to a login page or reset the app state
      
      // For this local-storage based app, we'll reset the state to default
      // and re-initialize the UI, effectively 'logging out' to a fresh start.
      localStorage.removeItem(STORAGE_KEY);
      state = JSON.parse(JSON.stringify(DEFAULT_STATE)); // Reset state
      init(); // Re-initialize the app

      showToast("Signed out successfully", 'info');
      // Potentially redirect: window.location.href = 'login.html';
    });
  }

  // Initialize the application once the DOM is fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
