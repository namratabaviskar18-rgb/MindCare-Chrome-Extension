const thoughts = [
    "You don't have to figure everything out today. 🌱",
    "Small steps still count. Keep going. 💛",
    "Be as kind to yourself as you would be to a friend. 🌸",
    "It's okay to take a break. Rest is part of progress. 🌿",
    "Your feelings are valid, and you don't have to face them alone. 🤝",
    "One difficult day does not define your whole journey. ☀️",
    "Take a breath. You are allowed to slow down. 🫶"
];

const moodMessages = {
    Great: "That's wonderful! Keep enjoying the positive moments. 😄",
    Good: "Glad to hear that! Keep taking care of yourself. 🙂",
    Okay: "It's okay to have an ordinary day. Be gentle with yourself. 🌱",
    Low: "I'm sorry you're having a difficult day. Take things one small step at a time. 💛",
    Struggling: "You don't have to handle everything alone. Consider reaching out to someone you trust. 🫶"
};

const assessmentQuestions = [
    "Have you felt little interest or pleasure in doing things?",
    "Have you been feeling down, depressed, or hopeless?",
    "Have you had trouble sleeping or slept too much?",
    "Have you felt tired or had little energy?",
    "Have you experienced changes in your appetite?",
    "Have you had trouble concentrating on things?",
    "Have you felt bad about yourself or felt like a failure?",
    "Have you found it difficult to manage your usual daily activities?"
];

const answers = [
    "Not at all",
    "Several days",
    "More than half the days",
    "Nearly every day"
];

document.addEventListener("DOMContentLoaded", () => {
    loadDashboard();
    loadTheme();
    loadDailyThought();
    loadJournal();

    document.querySelectorAll(".mood").forEach(button => {
        button.addEventListener("click", () => {
            saveMood(button.dataset.mood);
        });
    });

    document.getElementById("themeToggle").addEventListener("click", toggleTheme);

    const journal = document.getElementById("journal");

    journal.addEventListener("input", () => {
        document.getElementById("charCount").textContent =
            `${journal.value.length} / 500`;
    });

    document.getElementById("saveJournal").addEventListener("click", saveJournal);

    document.getElementById("startAssessment").addEventListener(
        "click",
        startAssessment
    );
});


function loadDashboard() {
    chrome.storage.local.get(
        ["moods", "journals", "streak"],
        data => {
            const moods = data.moods || [];
            const journals = data.journals || [];

            document.getElementById("moodCount").textContent = moods.length;
            document.getElementById("journalCount").textContent = journals.length;
            document.getElementById("streak").textContent = data.streak || 0;

            if (moods.length > 0) {
                const latestMood = moods[moods.length - 1];

                document.getElementById("moodMessage").textContent =
                    `Recent mood: ${latestMood.mood}`;
            }
        }
    );
}


function saveMood(mood) {
    chrome.storage.local.get(["moods", "lastMoodDate", "streak"], data => {
        const moods = data.moods || [];
        const today = new Date().toISOString().split("T")[0];

        moods.push({
            mood: mood,
            date: today,
            timestamp: Date.now()
        });

        let streak = data.streak || 0;

        if (data.lastMoodDate !== today) {
            streak++;
        }

        chrome.storage.local.set({
            moods: moods,
            lastMoodDate: today,
            streak: streak
        }, () => {
            document.getElementById("moodMessage").textContent =
                moodMessages[mood];

            loadDashboard();
        });
    });
}


function loadDailyThought() {
    const day = new Date().getDate();
    const thought = thoughts[day % thoughts.length];

    document.getElementById("dailyThought").textContent = thought;
}


function saveJournal() {
    const journal = document.getElementById("journal");
    const text = journal.value.trim();

    if (!text) {
        alert("Please write something before saving.");
        return;
    }

    chrome.storage.local.get(["journals"], data => {
        const journals = data.journals || [];

        journals.unshift({
            text: text,
            date: new Date().toLocaleString()
        });

        chrome.storage.local.set({
            journals: journals
        }, () => {
            journal.value = "";
            document.getElementById("charCount").textContent = "0 / 500";

            loadJournal();
            loadDashboard();
        });
    });
}


function loadJournal() {
    chrome.storage.local.get(["journals"], data => {
        const journals = data.journals || [];
        const history = document.getElementById("journalHistory");

        history.innerHTML = "";

        journals.slice(0, 5).forEach(note => {
            const item = document.createElement("div");

            item.className = "journal-entry";

            item.innerHTML = `
                <small>${escapeHTML(note.date)}</small>
                <p>${escapeHTML(note.text)}</p>
            `;

            history.appendChild(item);
        });
    });
}


function escapeHTML(text) {
    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function loadTheme() {
    chrome.storage.local.get(["darkMode"], data => {
        if (data.darkMode) {
            document.body.classList.add("dark");
            document.getElementById("themeToggle").textContent = "☀️";
        }
    });
}


function toggleTheme() {
    const dark = document.body.classList.toggle("dark");

    document.getElementById("themeToggle").textContent =
        dark ? "☀️" : "🌙";

    chrome.storage.local.set({
        darkMode: dark
    });
}


function startAssessment() {
    const container = document.getElementById("assessment");

    container.classList.remove("hidden");

    let html = `
        <div class="assessment-box">
            <h3>Self-Reflection</h3>
            <p>
                Think about how you have been feeling during the past two weeks.
                This questionnaire is for self-reflection only and is not a diagnosis.
            </p>
    `;

    assessmentQuestions.forEach((question, index) => {
        html += `
            <div class="question">
                <p><strong>${index + 1}. ${question}</strong></p>

                ${answers.map((answer, value) => `
                    <label>
                        <input
                            type="radio"
                            name="q${index}"
                            value="${value}"
                        >
                        ${answer}
                    </label>
                `).join("")}
            </div>
        `;
    });

    html += `
            <button id="calculateScore" class="primary-btn">
                View Reflection
            </button>

            <div id="assessmentResult"></div>
        </div>
    `;

    container.innerHTML = html;

    document.getElementById("calculateScore").addEventListener(
        "click",
        calculateScore
    );
}


function calculateScore() {
    let score = 0;

    for (let i = 0; i < assessmentQuestions.length; i++) {
        const selected = document.querySelector(
            `input[name="q${i}"]:checked`
        );

        if (!selected) {
            alert(`Please answer question ${i + 1}.`);
            return;
        }

        score += Number(selected.value);
    }

    let result = "";

    if (score <= 5) {
        result = `
            <div class="result">
                <h3>🌱 Low Concern</h3>
                <p>
                    Your responses suggest relatively few difficulties.
                    Continue caring for your wellbeing.
                </p>
            </div>
        `;
    } else if (score <= 12) {
        result = `
            <div class="result">
                <h3>💛 Some Difficulties</h3>
                <p>
                    You may be experiencing some challenges.
                    Consider resting, talking with someone you trust,
                    and taking care of your daily wellbeing.
                </p>
            </div>
        `;
    } else if (score <= 19) {
        result = `
            <div class="result">
                <h3>🫶 Consider Extra Support</h3>
                <p>
                    Your responses suggest that you may be going through
                    a difficult period. Talking with a qualified professional
                    may be helpful.
                </p>
            </div>
        `;
    } else {
        result = `
            <div class="result">
                <h3>  Please Consider Reaching Out</h3>
                <p>
                    Your responses indicate significant difficulties.
                    Please consider speaking with a qualified mental health
                    professional or someone you trust.
                </p>
            </div>
        `;
    }

    result += `
        <p class="disclaimer">
            This result is for self-reflection only and is not a medical diagnosis.
        </p>

        <div class="support">
            <strong>India Tele-MANAS:</strong><br>
                 14416<br>
                1800-89-14416
        </div>
    `;

    document.getElementById("assessmentResult").innerHTML = result;
}
