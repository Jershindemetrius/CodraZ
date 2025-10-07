--- START OF FILE script.js ---

document.addEventListener('DOMContentLoaded', () => {
  const chatBox = document.getElementById('chatBox');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const exampleBtn = document.getElementById('exampleBtn');
  const clearBtn = document.getElementById('clearBtn');
  const wellnessMsg = document.getElementById('wellnessMsg');
  const wellnessTrend = document.getElementById('wellnessTrend'); // Added this
  const navItems = document.querySelectorAll('.nav-item');
  const contentSections = document.querySelectorAll('.content-section');
  const mainSearchInput = document.getElementById('mainSearchInput');

  // Task List elements
  const taskList = document.getElementById('taskList');
  const newTaskInput = document.getElementById('newTaskInput');
  const addTaskBtn = document.getElementById('addTaskBtn');
  const focusProgressPercentage = document.getElementById('focusProgressPercentage');
  const focusProgressBar = document.getElementById('focusProgressBar');
  const totalTasksNum = document.getElementById('totalTasksNum');

  // Learning Chatflash - Upcoming Break Timer
  const upcomingBreakTimer = document.getElementById('upcomingBreakTimer');

  // Wellness Check-in Emojis
  const emojiBtns = document.querySelectorAll('.emoji'); // Added this

  // AI Assistant specific elements (for the dedicated page)
  const assistantChatBox = document.getElementById('assistantChatBox');
  const assistantChatInput = document.getElementById('assistantChatInput');
  const assistantSendBtn = document.getElementById('assistantSendBtn');
  const assistantExampleBtn = document.getElementById('assistantExampleBtn');
  const assistantClearBtn = document.getElementById('assistantClearBtn');

  // !!! IMPORTANT: The client-side script now calls your serverless function !!!
  // The serverless function will securely handle your actual GEMINI_API_KEY.
  const SERVERLESS_FUNCTION_URL = '/.netlify/functions/gemini-proxy'; // Netlify's default path for functions

  // --- Helper Functions ---

  // Add a chat message element
  function pushMessage(text, who = 'bot', targetChatBox = chatBox) {
    const el = document.createElement('div');
    el.className = 'chat-item ' + (who === 'user' ? 'user' : 'bot');
    el.innerHTML = text; // Use innerHTML to allow for basic formatting if needed
    targetChatBox.appendChild(el);
    targetChatBox.scrollTop = targetChatBox.scrollHeight;
  }

  // Modified function to call the Netlify serverless proxy
  async function askGemini(prompt) { // Removed targetChatBox from params here as it's handled in pushMessage
    try {
      const response = await fetch(SERVERLESS_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt }), // Send the prompt to your serverless function
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Serverless Function Error:', errorData);
        // Better error handling message
        return `Error from server: ${errorData.message || 'Unknown error'}. Please check the browser console for details.`;
      }

      const data = await response.json();
      // The serverless function should return the AI's response directly
      return data.text;

    } catch (error) {
      console.error('Network or serverless function call error:', error);
      return `A network error occurred: ${error.message}. Please check your internet connection or console for more details.`;
    }
  }

  // --- Chat Functionality (Dashboard Card) ---
  sendBtn.addEventListener('click', async () => {
    const text = chatInput.value.trim();
    if (!text) return;
    pushMessage(text, 'user', chatBox);
    chatInput.value = '';
    chatInput.focus();

    pushMessage('Thinking...', 'bot', chatBox);

    const botNodes = chatBox.querySelectorAll('.chat-item.bot');
    const thinkingNode = botNodes[botNodes.length - 1];

    const ans = await askGemini(text); // No targetChatBox param needed here
    if (ans) {
      thinkingNode.innerText = ans;
    } else {
      thinkingNode.remove();
    }
  });

  exampleBtn.addEventListener('click', () => {
    const sample = "Explain phototropism in simple words with one example.";
    chatInput.value = sample;
    sendBtn.click();
  });

  clearBtn.addEventListener('click', () => {
    chatBox.innerHTML = '';
    pushMessage('Hello! Ask me anything about your subjects.', 'bot', chatBox);
  });

  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendBtn.click();
    }
  });

  // --- AI Assistant Page Chat Functionality ---
  assistantSendBtn.addEventListener('click', async () => {
    const text = assistantChatInput.value.trim();
    if (!text) return;
    pushMessage(text, 'user', assistantChatBox);
    assistantChatInput.value = '';
    assistantChatInput.focus();

    pushMessage('Thinking...', 'bot', assistantChatBox);

    const botNodes = assistantChatBox.querySelectorAll('.chat-item.bot');
    const thinkingNode = botNodes[botNodes.length - 1];

    const ans = await askGemini(text); // No targetChatBox param needed here
    if (ans) {
      thinkingNode.innerText = ans;
    } else {
      thinkingNode.remove();
    }
  });

  assistantExampleBtn.addEventListener('click', () => {
    const samples = [
        "What are the main principles of quantum mechanics?",
        "How does photosynthesis work?",
        "Suggest a topic for my next biology project."
    ];
    const randomSample = samples[Math.floor(Math.random() * samples.length)];
    assistantChatInput.value = randomSample;
    assistantSendBtn.click();
  });

  assistantClearBtn.addEventListener('click', () => {
    assistantChatBox.innerHTML = '';
    pushMessage('Hello! How can I help you today?', 'bot', assistantChatBox);
  });

  assistantChatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      assistantSendBtn.click();
    }
  });


  // --- Dynamic Navigation ---
  function showSection(navId) {
    contentSections.forEach(section => {
      section.style.display = 'none';
      if (section.id === `${navId}-section`) {
        section.style.display = 'flex'; // Use flex for sections containing grids
      }
    });

    navItems.forEach(item => item.classList.remove('active'));
    document.querySelector(`.nav-item[data-nav-id="${navId}"]`).classList.add('active');
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const navId = item.dataset.navId;
      showSection(navId);
      // Optional: Update URL hash for direct linking/refresh
      // history.pushState(null, '', `#${navId}`);
    });
  });

  // Initialize with dashboard section active
  showSection('dashboard');
  // Optional: Check URL hash on load
  // if (window.location.hash) {
  //     showSection(window.location.hash.substring(1));
  // }


  // --- Task List (Focus Today) ---
  let tasks = JSON.parse(localStorage.getItem('codrazTasks')) || [];

  function saveTasks() {
    localStorage.setItem('codrazTasks', JSON.stringify(tasks));
  }

  function calculateProgress() {
    if (tasks.length === 0) return { completed: 0, total: 0, percentage: 0 };
    const completedTasks = tasks.filter(task => task.completed).length;
    const percentage = Math.round((completedTasks / tasks.length) * 100);
    return { completed: completedTasks, total: tasks.length, percentage: percentage };
  }

  function updateProgressDisplay() {
    const { total, percentage } = calculateProgress();
    totalTasksNum.innerText = total;
    focusProgressPercentage.innerText = `${percentage}%`;
    focusProgressBar.style.width = `${percentage}%`;
  }

  function renderTasks() {
    taskList.innerHTML = '';
    if (tasks.length === 0) {
        taskList.innerHTML = '<div class="muted small" style="text-align: center; padding: 10px;">No tasks added yet.</div>';
    }

    tasks.forEach((task, index) => {
      const taskEl = document.createElement('div');
      taskEl.className = `task-item ${task.completed ? 'completed' : ''}`;
      taskEl.dataset.index = index;
      taskEl.innerHTML = `
        <span class="task-name">${task.name}</span>
        <div class="task-actions">
          <button class="btn outline small mark-done-btn">${task.completed ? 'Unmark' : 'Mark Done'}</button>
          <button class="btn outline small delete-task-btn">Delete</button>
        </div>
      `;
      taskList.appendChild(taskEl);
    });
    updateProgressDisplay();
  }

  addTaskBtn.addEventListener('click', () => {
    const taskName = newTaskInput.value.trim();
    if (taskName) {
      tasks.push({ name: taskName, completed: false });
      newTaskInput.value = '';
      saveTasks();
      renderTasks();
    }
  });

  newTaskInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
          addTaskBtn.click();
      }
  });

  taskList.addEventListener('click', (e) => {
    const taskItem = e.target.closest('.task-item');
    if (!taskItem) return;

    const index = parseInt(taskItem.dataset.index);

    if (e.target.classList.contains('mark-done-btn')) {
      tasks[index].completed = !tasks[index].completed;
      saveTasks();
      renderTasks();
    } else if (e.target.classList.contains('delete-task-btn')) {
      tasks.splice(index, 1);
      saveTasks();
      renderTasks();
    }
  });

  // Initial render of tasks
  renderTasks();


  // --- Upcoming Break Timer (Learning Chatflash) ---
  function updateBreakTimer() {
    // Set a fixed next break time for demonstration (e.g., 10:00 AM)
    const now = new Date();
    let nextBreak = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0); // Today at 10:00 AM

    // If 10 AM has passed, set the break for tomorrow
    if (now > nextBreak) {
      nextBreak.setDate(nextBreak.getDate() + 1);
    }

    const diff = nextBreak - now; // Difference in milliseconds

    if (diff <= 0) {
      upcomingBreakTimer.innerText = "Now!";
      // Optionally, set the next break for tomorrow or a later time
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const formatTime = (time) => String(time).padStart(2, '0');

    upcomingBreakTimer.innerText = `${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}`;
  }

  // Update every second
  setInterval(updateBreakTimer, 1000);
  updateBreakTimer(); // Initial call


  // --- Wellness Check-in ---
  let wellnessHistory = JSON.parse(localStorage.getItem('codrazWellness')) || []; // Store recent check-ins

  function updateWellnessDisplay() {
      if (wellnessHistory.length === 0) {
          wellnessMsg.innerText = 'No entry yet';
          wellnessTrend.innerText = '';
          return;
      }

      const lastValue = wellnessHistory[wellnessHistory.length - 1].value;
      const map = {
        '5': 'Awesome! Keep the momentum ✨',
        '4': 'Good! A short walk might help.',
        '3': 'Okay — consider a quick break.',
        '2': 'Take five. Breathe and relax.',
        '1': 'Sorry to hear — reach out to a friend or counselor.'
      };
      wellnessMsg.innerText = map[lastValue] || 'Thanks for checking in!';
      wellnessMsg.style.color = lastValue <= 2 ? '#ef4444' : '#10b981';

      // Simple trend calculation (e.g., compare last 3 values)
      if (wellnessHistory.length >= 3) {
          const recentValues = wellnessHistory.slice(-3).map(entry => entry.value);
          const avgRecent = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
          const avgAll = wellnessHistory.reduce((a, b) => a + b.value, 0) / wellnessHistory.length;

          if (lastValue > avgRecent + 0.5) { // Arbitrary threshold
              wellnessTrend.innerText = 'Feeling better recently!';
              wellnessTrend.style.color = '#10b981';
          } else if (lastValue < avgRecent - 0.5) {
              wellnessTrend.innerText = 'Might need a pick-me-up.';
              wellnessTrend.style.color = '#ef4444';
          } else {
              wellnessTrend.innerText = 'Stable mood.';
              wellnessTrend.style.color = '#6b7280';
          }
      } else {
          wellnessTrend.innerText = ''; // Not enough data for trend
      }
  }

  emojiBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const v = parseInt(btn.dataset.value);
      wellnessHistory.push({ value: v, timestamp: new Date().toISOString() });
      // Keep only last 10 entries to prevent localStorage from growing too large
      if (wellnessHistory.length > 10) {
          wellnessHistory = wellnessHistory.slice(-10);
      }
      localStorage.setItem('codrazWellness', JSON.stringify(wellnessHistory));
      updateWellnessDisplay();
    });
  });

  // Initial wellness display
  updateWellnessDisplay();


  // --- Main Search Input (for future functionality) ---
  mainSearchInput.addEventListener('input', (e) => {
      console.log('Main Search:', e.target.value);
      // In a real app, this would trigger a search function
      // and display results dynamically.
  });

  // Initial bot message for the dashboard chat (if it's the default view)
  // This is already handled by pushMessage at the end of DOMContentLoaded listener
  // in the original script. For the dashboard chat, let's keep it.
  // The assistantChatBox has its own initial message handled by its clear function.
  // So, no change needed here.
});
