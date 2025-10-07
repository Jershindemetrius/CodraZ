document.addEventListener('DOMContentLoaded', () => {
  const chatBox = document.getElementById('chatBox');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const exampleBtn = document.getElementById('exampleBtn');
  const clearBtn = document.getElementById('clearBtn');
  const wellnessMsg = document.getElementById('wellnessMsg');
  const navItems = document.querySelectorAll('.nav-item');

  // Quiz Modal Elements
  const quizModal = document.getElementById('quizModal');
  const closeQuizModalBtn = document.getElementById('closeQuizModal');
  const quizContainer = document.getElementById('quizContainer');
  const quizResults = document.getElementById('quizResults');
  const quizQuestionEl = document.getElementById('quizQuestion');
  const quizOptionsEl = document.getElementById('quizOptions');
  const nextQuizQuestionBtn = document.getElementById('nextQuizQuestion');
  const quizScoreEl = document.getElementById('quizScore');
  const quizTotalQuestionsEl = document.getElementById('quizTotalQuestions');
  const restartQuizBtn = document.getElementById('restartQuiz');
  const closeResultsModalBtn = document.getElementById('closeResultsModal');


  // !!! IMPORTANT: The client-side script now calls your serverless function !!!
  // The serverless function will securely handle your actual GEMINI_API_KEY.
  const SERVERLESS_FUNCTION_URL = '/.netlify/functions/gemini-proxy'; // Netlify's default path for functions

  // Add a chat message element
  function pushMessage(text, who='bot') {
    const el = document.createElement('div');
    el.className = 'chat-item ' + (who === 'user' ? 'user' : 'bot');
    el.innerText = text;
    chatBox.appendChild(el);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // Modified function to call the Netlify serverless proxy
  async function askGemini(prompt) {
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

  // Sending flow (remains mostly the same)
  sendBtn.addEventListener('click', async () => {
    const text = chatInput.value.trim();
    if (!text) return;
    pushMessage(text, 'user');
    chatInput.value = '';
    chatInput.focus();

    pushMessage('Thinking...', 'bot');

    const botNodes = chatBox.querySelectorAll('.chat-item.bot');
    const thinkingNode = botNodes[botNodes.length - 1];

    const ans = await askGemini(text);
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
    pushMessage('Hello! Ask me anything about your subjects.');
  });

  // Wellness clicks (modified to trigger quiz)
  document.querySelectorAll('.emoji').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = btn.dataset.value;
      const map = {
        '5': 'Awesome! Keep the momentum ✨',
        '4': 'Good! A short walk might help.',
        '3': 'Okay — consider a quick break.',
        '2': 'Take five. Breathe and relax.',
        '1': 'Sorry to hear — let\'s try a quick brain boost!'
      };
      wellnessMsg.innerText = map[v] || 'Thanks for checking in!';
      wellnessMsg.style.color = v <= 2 ? '#ef4444' : '#10b981';

      // Trigger quiz if the last emoji (value '1') is clicked
      if (v === '1') {
        openQuizModal();
      }
    });
  });

  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendBtn.click();
    }
  });

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const navId = item.dataset.navId;
      console.log(`Navigated to: ${navId}`);
    });
  });

  pushMessage('Hello! Ask me anything about your subjects.');


  // --- Quiz Game Logic ---

  const quizQuestions = [
    {
      question: "What is the capital of France?",
      options: ["Berlin", "Madrid", "Paris", "Rome"],
      answer: "Paris"
    },
    {
      question: "Which planet is known as the Red Planet?",
      options: ["Earth", "Mars", "Jupiter", "Venus"],
      answer: "Mars"
    },
    {
      question: "What is the largest ocean on Earth?",
      options: ["Atlantic", "Indian", "Arctic", "Pacific"],
      answer: "Pacific"
    },
    {
        question: "Who wrote 'Romeo and Juliet'?",
        options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
        answer: "William Shakespeare"
    },
    {
        question: "What is the chemical symbol for water?",
        options: ["O2", "H2O", "CO2", "Nacl"],
        answer: "H2O"
    }
  ];

  let currentQuestionIndex = 0;
  let score = 0;
  let selectedOption = null;

  function openQuizModal() {
    quizModal.classList.add('visible');
    startQuiz();
  }

  function closeQuizModal() {
    quizModal.classList.remove('visible');
  }

  function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    quizContainer.style.display = 'block';
    quizResults.style.display = 'none';
    displayQuestion();
  }

  function displayQuestion() {
    selectedOption = null;
    const questionData = quizQuestions[currentQuestionIndex];
    quizQuestionEl.innerText = questionData.question;
    quizOptionsEl.innerHTML = ''; // Clear previous options

    questionData.options.forEach(option => {
      const button = document.createElement('button');
      button.classList.add('quiz-option-btn');
      button.innerText = option;
      button.addEventListener('click', () => selectOption(button, option));
      quizOptionsEl.appendChild(button);
    });

    nextQuizQuestionBtn.style.display = 'none'; // Hide Next button initially
  }

  function selectOption(button, selectedAnswer) {
    // Clear any previously selected option styles
    document.querySelectorAll('.quiz-option-btn').forEach(btn => {
      btn.classList.remove('selected', 'correct', 'wrong');
      btn.disabled = true; // Disable all buttons after selection
    });

    selectedOption = selectedAnswer;
    button.classList.add('selected');

    // Check answer and apply correct/wrong styling immediately
    const questionData = quizQuestions[currentQuestionIndex];
    if (selectedOption === questionData.answer) {
      button.classList.add('correct');
      score++;
    } else {
      button.classList.add('wrong');
      // Highlight the correct answer if a wrong one was chosen
      Array.from(quizOptionsEl.children).find(btn => btn.innerText === questionData.answer).classList.add('correct');
    }

    nextQuizQuestionBtn.style.display = 'block'; // Show Next button
    nextQuizQuestionBtn.innerText = (currentQuestionIndex === quizQuestions.length - 1) ? 'Show Results' : 'Next Question';
  }

  function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < quizQuestions.length) {
      displayQuestion();
    } else {
      showResults();
    }
  }

  function showResults() {
    quizContainer.style.display = 'none';
    quizResults.style.display = 'block';
    quizScoreEl.innerText = score;
    quizTotalQuestionsEl.innerText = quizQuestions.length;
  }

  // Event Listeners for Quiz
  closeQuizModalBtn.addEventListener('click', closeQuizModal);
  nextQuizQuestionBtn.addEventListener('click', nextQuestion);
  restartQuizBtn.addEventListener('click', startQuiz);
  closeResultsModalBtn.addEventListener('click', closeQuizModal);

});
