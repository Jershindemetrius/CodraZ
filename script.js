--- START OF FILE script.js ---

document.addEventListener('DOMContentLoaded', () => {
  const chatBox = document.getElementById('chatBox');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const exampleBtn = document.getElementById('exampleBtn');
  const clearBtn = document.getElementById('clearBtn');
  const wellnessMsg = document.getElementById('wellnessMsg');
  const wellnessTrend = document.getElementById('wellnessTrend');
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
    el.innerText = text;
    targetChatBox.appendChild(el);
    targetChatBox.scrollTop = targetChatBox.scrollHeight;
  }

  // Modified function to call the Netlify serverless proxy
  async function askGemini(prompt, targetChatBox) {
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
        return `Error from server: ${errorData.message || 'Unknown error'}. Please check the console.`;
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

    const ans = await askGemini(text, chatBox);
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
  // Using the same askGemini function, just targeting a different chatbox
  assistantSendBtn.addEventListener('click', async () => {
    const text = assistantChatInput.value.trim();
    if (!text) return;
    pushMessage(text, 'user', assistantChatBox);
    assistantChatInput.value = '';
    assistantChatInput.focus();

    pushMessage('Thinking...', 'bot', assistantChatBox);

    const botNodes = assistantChatBox.querySelectorAll('.chat-item.bot');
    const thinkingNode = botNodes[botNodes.length - 1];

    const ans = await askGemini(text, assistantChatBox);
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

  function renderTasks() {
    taskList.innerHTML = '';
    if (tasks.length === 0) {
        taskList.innerHTML = '<div class="muted small" style="text-align: center; padding: 10px;">No tasks added yet.</div>';
    }

    tasks.forEach((task, index) => {
