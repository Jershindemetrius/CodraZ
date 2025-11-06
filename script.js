// Firebase Configuration
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

(() => {
  'use strict';
  const STORAGE_KEY = 'codraz_state_v1';
  let notifiedTaskIds = [];
  let currentSort = { field: 'date', ascending: true };
  let confirmCallback = null;
  let notificationIntervalId = null;
  let breathIntervalId = null;
  let wellnessTipIntervalId = null;
  let loadingToastId = null;
  let currentUser = null;
  let userProfile = null;

  function uid(prefix = 'id') { return prefix + '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36); }
  function qs(sel, root = document) { return root.querySelector(sel); }
  function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }
  function escapeHtml(unsafe) { if (typeof unsafe !== 'string') return ''; return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }

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
  
  // Profile Page Elements
  const profileUserName = qs('#profileUserName');
  const profileUserEmail = qs('#profileUserEmail');
  const profileJoinDate = qs('#profileJoinDate');
  const profileAvatarLarge = qs('#profileAvatarLarge');
  const statTotalTasks = qs('#statTotalTasks');
  const statCompletedTasks = qs('#statCompletedTasks');
  const statCurrentStreak = qs('#statCurrentStreak');
  const statQuizzesTaken = qs('#statQuizzesTaken');
  const profileForm = qs('#profileForm');
  const profileUsername = qs('#profileUsername');
  const profileEmail = qs('#profileEmail');
  const profileStudyFocus = qs('#profileStudyFocus');
  const profileBio = qs('#profileBio');
  const currentAvatarDisplay = qs('#currentAvatarDisplay');
  const avatarStyleOptions = qsa('.avatar-style-option');

  // State
  const DEFAULT_STATE = {
    tasks: [],
    stats: { lastFocusSubject: null, streak: 0, lastPracticeDate: null },
    chat: [],
    currentQuiz: { subject: null, questions: [], currentQuestionIndex: 0, score: 0, userAnswers: [], isActive: false },
    settings: { darkMode: false, notifications: false, showCompleted: false },
    activities: [],
    currentView: 'dashboard'
  };
  let state = loadState();

  function loadState() {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) {
      try { return mergeDeep(JSON.parse(JSON.stringify(DEFAULT_STATE)), JSON.parse(s)); }
      catch (e) { console.error("Load state error:", e); showToast("Could not load saved data.", "error"); }
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
  function saveState() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); updateStorageUsageDisplay(); } catch (e) { console.error("Save state error:", e); showToast("Error saving data.", 'error'); } }
  function isObject(item) { return (item && typeof item === 'object' && !Array.isArray(item)); }
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
  function addActivity(text) { const MAX=20; state.activities.unshift({id:uid('act'), text, ts: new Date().toISOString()}); state.activities.length = Math.min(state.activities.length, MAX); renderActivityFeed(); }

  // Firebase Auth Functions
  function initFirebaseAuth() {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        currentUser = user;
        await loadUserProfile(user.uid);
        setDynamicUserUI();
        showToast(`Welcome back, ${user.displayName || 'User'}!`, 'success');
      } else {
        // Redirect to login page if not authenticated
        window.location.href = 'index.html';
      }
    });
  }

  async function loadUserProfile(uid) {
    try {
      const doc = await db.collection('users').doc(uid).get();
      if (doc.exists) {
        userProfile = doc.data();
      } else {
        // Create new user profile
        userProfile = {
          username: currentUser.displayName || 'User',
          email: currentUser.email,
          joinDate: new Date().toISOString(),
          studyFocus: '',
          bio: '',
          avatarType: 'initial',
          stats: {
            totalTasks: 0,
            completedTasks: 0,
            currentStreak: 0,
            quizzesTaken: 0
          }
        };
        await db.collection('users').doc(uid).set(userProfile);
      }
      updateProfilePage();
    } catch (error) {
      console.error('Error loading user profile:', error);
      showToast('Error loading profile data', 'error');
    }
  }

  async function updateUserProfile(updates) {
    if (!currentUser) return;
    
    try {
      await db.collection('users').doc(currentUser.uid).update(updates);
      userProfile = { ...userProfile, ...updates };
      updateProfilePage();
      showToast('Profile updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('Error updating profile', 'error');
    }
  }

  // init
  function init() {
    initFirebaseAuth();
    applyDark(state.settings.darkMode);
    if (darkModeToggle) darkModeToggle.checked = state.settings.darkMode;
    if (notificationToggle) notificationToggle.checked = state.settings.notifications;
    if (showCompletedToggle) showCompletedToggle.checked = state.settings.showCompleted;
    updateThemeButtonIcon();
    if (copyrightYearEl) copyrightYearEl.textContent = `© ${new Date().getFullYear()}`;
    switchView(state.currentView, true);
    renderTasks(); renderFocusBlock(); renderWeeklyProgress(); renderActivityFeed();
    updateSubjectDatalist(); updateQuickAddTaskSubjects(); renderChat(); renderScheduleTasks();
    if (taskDateInput) taskDateInput.valueAsDate = new Date();
    addEventListeners();
    startBreathingAnimation(); scheduleNotificationCheck(); updateStorageUsageDisplay(); checkNotificationStatus();
    startWellnessTipCycle();
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
    
    // Profile Page Event Listeners
    if (profileForm) profileForm.addEventListener('submit', handleProfileFormSubmit);
    if (avatarStyleOptions) {
      avatarStyleOptions.forEach(option => {
        option.addEventListener('click', handleAvatarStyleChange);
      });
    }
    
    // close quiz on Esc
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (quizModal && quizModal.getAttribute('aria-hidden') === 'false') closeQuizModal(); if (confirmModal && confirmModal.getAttribute('aria-hidden') === 'false') closeConfirmModal(); }});
  }

  // Profile Page Functions
  function updateProfilePage() {
    if (!userProfile) return;
    
    // Update profile header
    if (profileUserName) profileUserName.textContent = userProfile.username;
    if (profileUserEmail) profileUserEmail.textContent = userProfile.email;
    if (profileJoinDate) {
      const joinDate = new Date(userProfile.joinDate);
      profileJoinDate.textContent = joinDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    
    // Update avatar
    if (profileAvatarLarge) {
      profileAvatarLarge.innerHTML = createAvatarByType(
        userProfile.username, 
        userProfile.email, 
        userProfile.avatarType || 'initial'
      );
    }
    
    // Update statistics
    if (statTotalTasks) statTotalTasks.textContent = userProfile.stats?.totalTasks || 0;
    if (statCompletedTasks) statCompletedTasks.textContent = userProfile.stats?.completedTasks || 0;
    if (statCurrentStreak) statCurrentStreak.textContent = userProfile.stats?.currentStreak || 0;
    if (statQuizzesTaken) statQuizzesTaken.textContent = userProfile.stats?.quizzesTaken || 0;
    
    // Update form fields
    if (profileUsername) profileUsername.value = userProfile.username;
    if (profileEmail) profileEmail.value = userProfile.email;
    if (profileStudyFocus) profileStudyFocus.value = userProfile.studyFocus || '';
    if (profileBio) profileBio.value = userProfile.bio || '';
    
    // Update avatar customization
    if (currentAvatarDisplay) {
      currentAvatarDisplay.innerHTML = createAvatarByType(
        userProfile.username,
        userProfile.email,
        userProfile.avatarType || 'initial'
      );
    }
    
    // Highlight current avatar style
    if (avatarStyleOptions) {
      avatarStyleOptions.forEach(option => {
        option.classList.toggle('selected', option.dataset.style === (userProfile.avatarType || 'initial'));
      });
    }
  }

  function handleProfileFormSubmit(e) {
    e.preventDefault();
    
    const updates = {
      username: profileUsername.value,
      studyFocus: profileStudyFocus.value,
      bio: profileBio.value
    };
    
    updateUserProfile(updates);
  }

  function handleAvatarStyleChange(e) {
    const style = e.currentTarget.dataset.style;
    updateUserProfile({ avatarType: style });
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
      const btn = qs(`.nav-item[data-nav="${viewName}"] span`, mainNav); if (btn) title = btn.textContent.trim();
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
        case 'dashboard': renderFocusBlock(); renderWeeklyProgress(); renderTasks(); renderActivityFeed(); break;
        case 'assistant': renderChat(); chatInput?.focus(); break;
        case 'schedule': renderScheduleTasks(); break;
        case 'profile': updateProfilePage(); break;
        case 'settings': updateStorageUsageDisplay(); checkNotificationStatus(); break;
      }
      if (loadingOverlay) loadingOverlay.setAttribute('aria-hidden', 'true');
    }, 50); });
  }

  // === Enhanced Dynamic User Greeting and Avatar System ===
  function setDynamicUserUI() {
    if (!currentUser) return;
    
    const username = currentUser.displayName || 'User';
    const email = currentUser.email || '';
    const hour = new Date().getHours();
    
    let greeting = "Hello";
    if (hour < 12) greeting = "Good Morning";
    else if (hour < 18) greeting = "Good Afternoon";
    else greeting = "Good Evening";

    // Update greeting dynamically
    const welcomeEl = document.getElementById('welcomeMessage');
    if (welcomeEl) welcomeEl.textContent = `${greeting}, ${username}!`;

    // Generate dynamic avatar based on user credentials
    const avatarEl = document.getElementById('userAvatar');
    if (avatarEl) {
      avatarEl.innerHTML = generateDynamicAvatar(username, email);
    }

    // Dropdown toggle
    const dropdown = document.getElementById('avatarDropdown');
    avatarEl?.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      dropdown.classList.remove('show');
    });

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => {
          window.location.href = 'index.html';
        });
      });
    }

    // Profile button in dropdown
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
      profileBtn.addEventListener('click', () => {
        switchView('profile');
        dropdown.classList.remove('show');
      });
    }
  }

  // Generate dynamic avatar based on user credentials
  function generateDynamicAvatar(username, email) {
    // Use the avatar type from user profile if available
    const avatarType = userProfile?.avatarType || 'initial';
    
    return createAvatarByType(username, email, avatarType);
  }

  // Create avatar based on type
  function createAvatarByType(username, email, type) {
    const firstLetter = username.charAt(0).toUpperCase();
    
    switch(type) {
      case 'gradient':
        const gradientColors = [
          ['#FF6B6B', '#4ECDC4'], // Coral to Teal
          ['#45B7D1', '#96C93D'], // Blue to Green
          ['#FFA62E', '#EA4C89'], // Orange to Pink
          ['#654EA3', '#EAAFC8'], // Purple to Pink
          ['#2C3E50', '#3498DB']  // Dark Blue to Blue
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
        
      case 'student':
        return `<i class="fas fa-user-graduate avatar-icon student-avatar"></i>`;
        
      case 'teacher':
        return `<i class="fas fa-user-tie avatar-icon teacher-avatar"></i>`;
        
      case 'admin':
        return `<i class="fas fa-user-cog avatar-icon admin-avatar"></i>`;
        
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
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // The rest of your existing functions (task management, quiz, etc.) remain the same
  // ... (Include all the existing task management, quiz, and other functions here)

  // Settings helpers (applyDark et al.)
  function applyDark(isDark) { document.body.classList.toggle('dark', isDark); }
  function handleDarkModeToggle(e) { state.settings.darkMode = e.target.checked; applyDark(state.settings.darkMode); updateThemeButtonIcon(); saveState(); }
  function handleThemeToggleClick() { state.settings.darkMode = !state.settings.darkMode; if (darkModeToggle) darkModeToggle.checked = state.settings.darkMode; applyDark(state.settings.darkMode); updateThemeButtonIcon(); saveState(); }
  function updateThemeButtonIcon() { if (!toggleThemeBtn) return; toggleThemeBtn.textContent = state.settings.darkMode ? '☀️' : '🌙'; toggleThemeBtn.title = state.settings.darkMode ? 'Switch to light mode' : 'Switch to dark mode'; }

  // small util placeholders used earlier
  function scheduleNotificationCheck(){ /* your notification scheduling (left intact) */ }
  function updateStorageUsageDisplay(){ if (storageUsageEl) storageUsageEl.textContent = `${(localStorage.length || 0)} keys`; }
  function checkNotificationStatus(){ /* place holder */ }
  function handleNotificationToggle(e){ state.settings.notifications = e.target.checked; saveState(); showToast(e.target.checked ? "Reminders enabled" : "Reminders disabled", 'info'); }
  function handleClearData(){ showConfirmModal("Clear data?", "This will clear all local data for this app. Continue?", () => { localStorage.removeItem(STORAGE_KEY); state = JSON.parse(JSON.stringify(DEFAULT_STATE)); saveState(); renderTasks(); renderFocusBlock(); renderActivityFeed(); showToast("Local data cleared.", 'info'); }); }

  // Toasts / confirm / utils
  function showToast(message, type = 'success', duration = 3500) { if (!toastContainer) return null; const id = uid('toast'); const t = document.createElement('div'); t.className = `toast ${type}`; t.dataset.toastId = id; let i=''; switch(type){ case 'success': i='✅'; break; case 'error': i='❌'; break; case 'warning': i='⚠️'; break; case 'info': i='ℹ️'; break; } t.innerHTML = `<span class="toast-icon">${i}</span> <span>${escapeHtml(message)}</span>`; toastContainer.prepend(t); requestAnimationFrame(()=>t.classList.add('show')); if (duration > 0) setTimeout(()=>dismissToast(id), duration); return id; }
  function dismissToast(id) { if (!toastContainer) return; const t = qs(`[data-toast-id="${id}"]`, toastContainer); if (t) { t.classList.remove('show'); t.addEventListener('transitionend', ()=>t.remove(), { once: true }); } }

  function showConfirmModal(title, message, onConfirm) { if (!confirmModal || !confirmTitle || !confirmMessage) return; confirmTitle.textContent = title; confirmMessage.textContent = message; confirmCallback = onConfirm; confirmModal.setAttribute('aria-hidden', 'false'); confirmModal.style.display = 'flex'; confirmYesBtn?.focus(); }
  function closeConfirmModal() { if (confirmModal) { confirmModal.setAttribute('aria-hidden', 'true'); confirmModal.style.display = 'none'; } confirmCallback = null; }
  function handleConfirmYes() { if (typeof confirmCallback === 'function') confirmCallback(); closeConfirmModal(); }

  // run
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

})();
