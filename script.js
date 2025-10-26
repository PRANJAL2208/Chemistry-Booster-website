// Initialize Lucide Icons (must be called after Lucide script is loaded in HTML)
lucide.createIcons();

// --- MOBILE MENU TOGGLE LOGIC ---
const menuBtn = document.getElementById("menu-btn");
const mobileMenu = document.getElementById("mobile-menu");
const icon = document.getElementById("menu-icon");

menuBtn.addEventListener("click", () => {
  mobileMenu.classList.toggle("hidden");
  const icon = menuBtn.querySelector('i');
  icon.classList.toggle("rotate-90");
  icon.setAttribute('data-lucide', mobileMenu.classList.contains('hidden') ? 'menu' : 'x');
  icon.classList.toggle("rotate-90");
});


// --- THEME TOGGLE LOGIC ---
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;
const themeIcon = document.getElementById('theme-icon');
const themeLabel = document.getElementById('theme-label');

// Function to set theme in local storage (for persistence)
function setTheme(mode) {
    // Add transition class
    body.classList.add("theme-transition");
    body.classList.add("glow-flash");

    // Set mode (switch classes)
    body.className = mode + " theme-transition";
   
    if (mode === 'parent-mode') {
        themeIcon.setAttribute('data-lucide', 'moon');
        themeToggle.querySelector('span').textContent = 'PARENT MODE';
    } else {
        themeIcon.setAttribute('data-lucide', 'sun');
        themeToggle.querySelector('span').textContent = 'STUDENT MODE';
    }
    lucide.createIcons(); // Re-render icon
    localStorage.setItem('theme', mode);
    // Re-calculate RGB for header transparency after class change
    updateRgbVariables();
    
    setTimeout(() => body.classList.remove("theme-transition"), 600);
    setTimeout(() => body.classList.remove("glow-flash"), 500);
}

function updateRgbVariables() {
    const primaryBgHex = getComputedStyle(body).getPropertyValue('--bg-primary').trim();
    const secondaryBgHex = getComputedStyle(body).getPropertyValue('--bg-secondary').trim();

    const hexToRgb = (hex) => {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
    };

    if (hexToRgb(primaryBgHex)) {
        document.documentElement.style.setProperty('--bg-primary-rgb', hexToRgb(primaryBgHex));
    }
    if (hexToRgb(secondaryBgHex)) {
        document.documentElement.style.setProperty('--bg-secondary-rgb', hexToRgb(secondaryBgHex));
    }
}


themeToggle.addEventListener('click', () => {
    const newMode = body.classList.contains('parent-mode') ? 'student-mode' : 'parent-mode';
    setTheme(newMode);
});

// --- GEMINI DEBUGGER LOGIC ---
const DEBUGGER_OUTPUT = document.getElementById('debugger-output');
const LOADING_INDICATOR = document.getElementById('loading-indicator');
const DEBUGGER_FORM = document.getElementById('debugger-form');
const DEBUGGER_INPUT = document.getElementById('debugger-input');

// Gemini API Configuration
const apiKey = ""; 
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

// System Instruction to guide the LLM's response format and persona
const systemPrompt = `You are CHEM.OS, a Quantum Clarity AI designed for JEE/NEET/CBSE 11th and 12th grade students.
Your goal is to provide **maximum conceptual clarity with minimum complexity**.
The response must be structured, concise, and professional, using technical terms correctly.
Format the output clearly as a "DEBUG SUCCESS" log.
1. **Definition:** A one-sentence, precise definition.
2. **Core Idea:** 1-2 key sentences explaining the fundamental principle.
3. **JEE/NEET Relevance:** 1-2 bullet points highlighting its importance for the exam (e.g., "Common numerical source" or "High-yield organic mechanism").
4. **Formula/Example (if applicable):** Provide a simple formula or a quick real-world chemical example.
Use only markdown formatting. Do not use conversational filler (e.g., "Hello," "Here is your answer").`;

// --- API Call Function with Exponential Backoff ---
async function fetchWithRetry(url, options, maxRetries = 5) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response;
        } catch (error) {
            if (i === maxRetries - 1) {
                throw error;
            }
            const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

async function processQuery(query) {
    DEBUGGER_OUTPUT.textContent = "Processing... Establishing connection to Quantum Core...";
    LOADING_INDICATOR.classList.remove('hidden');

    const userQuery = `Explain the chemistry concept: ${query}`;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        tools: [{ "google_search": {} }],
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
    };

    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    };

    try {
        const response = await fetchWithRetry(apiUrl, options);
        const result = await response.json();
        
        const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (generatedText) {
            DEBUGGER_OUTPUT.textContent = generatedText;
        } else {
            DEBUGGER_OUTPUT.textContent = "DEBUG FAILED: Core output missing. Try rephrasing the concept.";
        }

    } catch (error) {
        console.error("Gemini API Error:", error);
        DEBUGGER_OUTPUT.textContent = `DEBUG FAILED: Connection error. Check network integrity. ERROR: ${error.message}`;
    } finally {
        LOADING_INDICATOR.classList.add('hidden');
    }
}

// --- Event Listener for Form Submission ---
DEBUGGER_FORM.addEventListener('submit', function(e) {
    e.preventDefault();
    const query = DEBUGGER_INPUT.value.trim();
    if (query) {
        processQuery(query);
    } else {
        DEBUGGER_OUTPUT.textContent = "INPUT ERROR: Query field is empty. Please enter a chemistry term.";
    }
});

// --- General Page Initialization ---
window.onload = function() {
    lucide.createIcons();
    console.log("Chemistry Booster Initialized.");
    // This function is now called inside setTheme for dynamic updates
    updateRgbVariables(); 
    
    // Re-render icons on load
    lucide.createIcons();
    
    // Re-run theme application to ensure all dynamic styles are set
    setTheme(body.className || savedTheme);

    window.addEventListener('scroll', function(){
        const header =  this.document.querySelector('header');
        if (window.scrollY > 10) {
            header.classList.add('shadow-xl', 'border-opacity=30');
        } else {
            header.classList.remove('shadow-xl', 'border-opacity=30');
        }
    })
};

// --- MISSION MODAL & TOAST LOGIC (from new site) ---
document.addEventListener('DOMContentLoaded', () => {
    const missionModal = document.getElementById('mission-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const quitMissionBtn = document.getElementById('quit-mission-btn');
    const completeMissionBtn = document.getElementById('complete-mission-btn');
    const missionLinks = document.querySelectorAll('.mission-link');
    const toastContainer = document.getElementById('toast-container');
    
    const modalTitle = document.getElementById('modal-title');
    const modalSubtitle = document.getElementById('modal-subtitle');

    const tabs = missionModal.querySelectorAll('.tab-link');
    const panes = missionModal.querySelectorAll('.tab-pane');

    // --- Toast Function ---
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        let icon = '<i data-lucide="check-circle" class="w-5 h-5"></i>';
        let styles = 'bg-[var(--accent-action)] text-[var(--bg-primary)]'; // Success

        if (type === 'info') {
            icon = '<i data-lucide="info" class="w-5 h-5"></i>';
            styles = 'bg-[var(--accent-highlight)] text-[var(--bg-primary)]';
        } else if (type === 'error') {
            icon = '<i data-lucide="alert-circle" class="w-5 h-5"></i>';
            styles = 'bg-[var(--accent-danger)] text-[var(--text-main)]';
        }

        toast.className = `flex items-center space-x-3 ${styles} p-4 rounded-lg shadow-lg mono-text font-semibold animate-fade-in`;
        toast.innerHTML = `${icon}<span>${message}</span>`;
        toastContainer.appendChild(toast);
        lucide.createIcons(); // Render the icon

        toast.style.opacity = '0';
        setTimeout(() => { toast.style.opacity = '1'; toast.style.transform = 'translateX(0)'; }, 10);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(20px)';
            setTimeout(() => { toast.remove(); }, 300);
        }, 3000);
    }
    
    // --- Mission Modal Logic ---
    const openModal = (title, world) => {
        modalTitle.textContent = `Mission: ${title}`;
        modalSubtitle.textContent = world;
        missionModal.classList.remove('hidden');
        switchTab('study'); // Reset to first tab
        lucide.createIcons(); // Render icons in modal
    };

    const closeModal = () => {
        missionModal.classList.add('hidden');
    };

    missionLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const title = e.currentTarget.innerText.trim().replace(/^(Level \d\.\d: )/, '');
            const world = e.currentTarget.dataset.world;
            
            const isLocked = e.currentTarget.querySelector('i[data-lucide="lock"]');
            if (isLocked) {
                    showToast('Level Locked! Complete previous missions.', 'error');
                    return;
            }
            openModal(title, world);
        });
    });

    closeModalBtn.addEventListener('click', closeModal);
    quitMissionBtn.addEventListener('click', () => {
        closeModal();
        showToast('Mission aborted. No XP gained.', 'info');
    });
    
    completeMissionBtn.addEventListener('click', () => {
        closeModal();
        showToast('Mission Complete! +25 XP', 'success');
        // Here you would update XP, progress bars, etc.
    });

    missionModal.addEventListener('click', (e) => {
        if (e.target === missionModal) {
            closeModal();
        }
    });
    
    // --- Mission Modal Tab Logic ---
    const switchTab = (tabName) => {
        tabs.forEach(tab => {
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active', 'text-[var(--accent-highlight)]', 'border-[var(--accent-highlight)]');
                tab.classList.remove('text-[var(--text-secondary)]');
            } else {
                tab.classList.remove('active', 'text-[var(--accent-highlight)]', 'border-[var(--accent-highlight)]');
                tab.classList.add('text-[var(--text-secondary)]');
            }
        });

        panes.forEach(pane => {
            if (pane.id === `${tabName}-content`) {
                pane.classList.remove('hidden');
            } else {
                pane.classList.add('hidden');
            }
        });
    };

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(e.currentTarget.dataset.tab);
        });
    });

    // --- Toast Animation CSS ---
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = `
        @keyframes fade-in {
            from { opacity: 0; transform: translateX(20px); }
            to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in {
            animation: fade-in 0.3s ease-out forwards;
            transition: opacity 0.3s ease, transform 0.3s ease;
        }
    `;
    document.head.appendChild(styleSheet);
});


// --- GLOBAL INITIALIZATION ---
window.onload = function() {
    // Apply saved theme or default
    const savedTheme = localStorage.getItem('theme') || 'student-mode';
    body.className = savedTheme; // Set initial class
    setTheme(savedTheme); // Apply all theme logic
    
    // Initial render of all icons
    lucide.createIcons();
    
    console.log("ChemBooster OS v10.0 Initialized.");
};

// --- Fallback Initialization for Lucide (if DOMContentLoaded is slow) ---
try {
    lucide.createIcons();
} catch (e) {
    console.warn("Lucide deferred.");
}


