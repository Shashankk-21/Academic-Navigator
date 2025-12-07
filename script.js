/**
 * Academic Navigator - Main JavaScript File
 * Handles authentication, navigation, learning verification,
 * progress tracking, and assignment tracking using localStorage.
 */

// ============================================
// STATE
// ============================================

let currentUser = null;

let assignments = [
    { name: "Assignment 1", week: "Week 2", dueDate: "2025-02-10", status: "Pending" },
    { name: "Assignment 2", week: "Week 3", dueDate: "2025-02-17", status: "Pending" }
];

// ============================================
// UTIL: PASSWORD HASHING (demo only)
// ============================================

async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
}

// ============================================
// AUTH SCREENS
// ============================================

function showLogin() {
    document.getElementById("login-form").style.display = "block";
    document.getElementById("register-form").style.display = "none";
}

function showRegister() {
    document.getElementById("login-form").style.display = "none";
    document.getElementById("register-form").style.display = "block";
}

// Register user
async function handleRegister() {
    const name = document.getElementById("register-name").value.trim();
    const email = document.getElementById("register-email").value.trim();
    const password = document.getElementById("register-password").value;
    const role = document.getElementById("register-role").value;

    if (!name || !email || !password) {
        alert("Please fill in all fields.");
        return;
    }

    if (!isValidEmail(email)) {
        alert("Please enter a valid email address.");
        return;
    }

    if (password.length < 4) {
        alert("Password must be at least 4 characters.");
        return;
    }

    const users = JSON.parse(localStorage.getItem("users") || "[]");

    if (users.find(u => u.email === email)) {
        alert("An account with this email already exists. Please log in.");
        return;
    }

    const hashedPassword = await hashPassword(password);

    const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password: hashedPassword,
        role,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));

    initializeUserData(newUser.id);

    alert("Account created successfully! Please log in.");
    showLogin();

    document.getElementById("register-name").value = "";
    document.getElementById("register-email").value = "";
    document.getElementById("register-password").value = "";
}

// Login user
async function handleLogin() {
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }

    const hashedPassword = await hashPassword(password);

    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const user = users.find(u => u.email === email && u.password === hashedPassword);

    if (!user) {
        alert("Invalid email or password. Please try again.");
        return;
    }

    currentUser = user;
    localStorage.setItem("currentSession", JSON.stringify(user));

    loadUserData();
    showApp();

    document.getElementById("login-email").value = "";
    document.getElementById("login-password").value = "";
}

// Logout
function handleLogout() {
    currentUser = null;
    localStorage.removeItem("currentSession");

    document.getElementById("app").style.display = "none";
    document.getElementById("auth-screen").style.display = "flex";

    const sections = document.querySelectorAll(".section");
    const navLinks = document.querySelectorAll(".nav-link");

    sections.forEach(s => s.classList.remove("active"));
    navLinks.forEach(l => l.classList.remove("active"));

    document.getElementById("home").classList.add("active");
    const homeLink = document.querySelector('[data-section="home"]');
    if (homeLink) homeLink.classList.add("active");
}

// Show app UI
function showApp() {
    document.getElementById("auth-screen").style.display = "none";
    document.getElementById("app").style.display = "block";

    document.getElementById("user-name").textContent = currentUser.name;
    document.getElementById("dashboard-name").textContent = currentUser.name.split(" ")[0];

    initNavigation();
    loadSavedVerifications();
    loadAssignments();
    updateDashboard();
}

// Check existing session
function checkSession() {
    const session = localStorage.getItem("currentSession");
    if (session) {
        currentUser = JSON.parse(session);
        loadUserData();
        showApp();
    }
}

// ============================================
// USER DATA STORAGE
// ============================================

function initializeUserData(userId) {
    const userData = {
        verifications: {},
        assignments: [
            { name: "Assignment 1", week: "Week 2", dueDate: "2025-02-10", status: "Pending" },
            { name: "Assignment 2", week: "Week 3", dueDate: "2025-02-17", status: "Pending" }
        ]
    };

    localStorage.setItem(`userData_${userId}`, JSON.stringify(userData));
}

function loadUserData() {
    if (!currentUser) return;

    const saved = localStorage.getItem(`userData_${currentUser.id}`);
    if (saved) {
        const userData = JSON.parse(saved);
        if (userData.assignments) {
            assignments = userData.assignments;
        }
    } else {
        initializeUserData(currentUser.id);
    }
}

function saveUserData() {
    if (!currentUser) return;

    const verifications = {};
    for (let week = 1; week <= 3; week++) {
        const text = localStorage.getItem(`verification-${currentUser.id}-week${week}`);
        if (text) {
            verifications[`week${week}`] = text;
        }
    }

    const userData = {
        verifications,
        assignments
    };

    localStorage.setItem(`userData_${currentUser.id}`, JSON.stringify(userData));
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ============================================
// NAVIGATION
// ============================================

function initNavigation() {
    const navLinks = document.querySelectorAll(".nav-link");
    const sections = document.querySelectorAll(".section");
    const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
    const navLinksContainer = document.querySelector(".nav-links");

    navLinks.forEach(link => {
        link.addEventListener("click", e => {
            e.preventDefault();
            const targetSection = link.getAttribute("data-section");

            navLinks.forEach(l => l.classList.remove("active"));
            sections.forEach(s => s.classList.remove("active"));

            link.classList.add("active");
            const sectionEl = document.getElementById(targetSection);
            if (sectionEl) sectionEl.classList.add("active");

            if (navLinksContainer) navLinksContainer.classList.remove("active");

            if (targetSection === "dashboard") {
                updateDashboard();
            }

            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    });

    if (mobileMenuBtn && navLinksContainer) {
        mobileMenuBtn.addEventListener("click", () => {
            navLinksContainer.classList.toggle("active");
        });
    }
}

function navigateTo(sectionId) {
    const navLinks = document.querySelectorAll(".nav-link");
    const sections = document.querySelectorAll(".section");

    navLinks.forEach(l => l.classList.remove("active"));
    sections.forEach(s => s.classList.remove("active"));

    const sectionEl = document.getElementById(sectionId);
    if (sectionEl) sectionEl.classList.add("active");

    const link = document.querySelector(`[data-section="${sectionId}"]`);
    if (link) link.classList.add("active");

    window.scrollTo({ top: 0, behavior: "smooth" });
}

// ============================================
// LEARNING VERIFICATIONS
// ============================================

function submitVerification(weekNumber) {
    if (!currentUser) {
        alert("Please log in to submit verifications.");
        return;
    }

    const textarea = document.getElementById(`verification-week${weekNumber}`);
    if (!textarea) return;

    const submittedText = textarea.value.trim();
    if (submittedText === "") {
        alert("Please enter some text before submitting.");
        return;
    }

    localStorage.setItem(
        `verification-${currentUser.id}-week${weekNumber}`,
        submittedText
    );

    displaySavedVerification(weekNumber, submittedText);
    updateWeekStatus(weekNumber);
    updateDashboard();
    saveUserData();

    alert("Your reflection has been saved successfully!");
}

function displaySavedVerification(weekNumber, text) {
    const savedDiv = document.getElementById(`saved-verification-${weekNumber}`);
    if (!savedDiv) return;

    savedDiv.innerHTML = `
        <h4>Your Submitted Reflection:</h4>
        <p>${escapeHtml(text)}</p>
    `;
    savedDiv.classList.add("visible");
}

function updateWeekStatus(weekNumber) {
    const statusBadge = document.getElementById(`week${weekNumber}-status`);
    if (statusBadge) {
        statusBadge.classList.add("completed");
    }
}

function loadSavedVerifications() {
    if (!currentUser) return;

    for (let week = 1; week <= 3; week++) {
        const savedText = localStorage.getItem(
            `verification-${currentUser.id}-week${week}`
        );
        if (savedText) {
            displaySavedVerification(week, savedText);

            const textarea = document.getElementById(`verification-week${week}`);
            if (textarea) textarea.value = savedText;

            updateWeekStatus(week);
        }
    }
}

// ============================================
// DASHBOARD & PROGRESS
// ============================================

function updateDashboard() {
    if (!currentUser) return;

    let completedVerifications = 0;
    for (let week = 1; week <= 3; week++) {
        if (localStorage.getItem(`verification-${currentUser.id}-week${week}`)) {
            completedVerifications++;
        }
    }

    const completedAssignments = assignments.filter(
        a => a.status === "Completed"
    ).length;

    const totalItems = 3 + 2; // 3 verifications + 2 assignments
    const completedItems = completedVerifications + completedAssignments;
    const overallProgress = Math.round((completedItems / totalItems) * 100);

    document.getElementById("stat-modules").textContent = `${completedVerifications}/3`;
    document.getElementById("stat-assignments").textContent = `${completedAssignments}/2`;
    document.getElementById("stat-verifications").textContent = `${completedVerifications}/3`;
    document.getElementById("stat-overall").textContent = `${overallProgress}%`;

    for (let week = 1; week <= 3; week++) {
        const hasVerification = localStorage.getItem(
            `verification-${currentUser.id}-week${week}`
        )
            ? 100
            : 0;

        const bar = document.getElementById(`week${week}-progress`);
        const label = document.getElementById(`week${week}-percent`);

        if (bar) bar.style.width = `${hasVerification}%`;
        if (label) label.textContent = `${hasVerification}%`;
    }

    const progressDegrees = (overallProgress / 100) * 360;
    const circularProgress = document.getElementById("circular-progress");
    if (circularProgress) {
        circularProgress.style.background = `conic-gradient(#4361ee ${progressDegrees}deg, #e2e8f0 ${progressDegrees}deg)`;
    }

    const valueSpan = document.getElementById("progress-value");
    if (valueSpan) valueSpan.textContent = `${overallProgress}%`;

    const progressText = document.querySelector(".progress-text");
    if (!progressText) return;

    if (overallProgress === 100) {
        progressText.textContent = "Excellent! You've completed all modules and assignments!";
    } else if (overallProgress >= 60) {
        progressText.textContent = "Great progress! Keep going to complete your learning journey.";
    } else if (overallProgress >= 30) {
        progressText.textContent = "Good start! Submit more verifications to boost your progress.";
    } else {
        progressText.textContent =
            "Keep going! Complete modules and submit verifications to increase your progress.";
    }
}

// ============================================
// ASSIGNMENT TRACKER
// ============================================

function renderAssignmentsTable() {
    const tbody = document.getElementById("assignments-body");
    if (!tbody) return;

    tbody.innerHTML = "";

    assignments.forEach(assignment => {
        const row = document.createElement("tr");
        const statusClass = assignment.status.toLowerCase().replace(" ", "-");

        row.innerHTML = `
            <td>${escapeHtml(assignment.name)}</td>
            <td>${escapeHtml(assignment.week)}</td>
            <td>${escapeHtml(assignment.dueDate)}</td>
            <td><span class="status status-${statusClass}">${escapeHtml(
                assignment.status
            )}</span></td>
        `;

        tbody.appendChild(row);
    });
}

function updateAssignmentStatus() {
    if (!currentUser) {
        alert("Please log in to update assignment status.");
        return;
    }

    const assignmentSelect = document.getElementById("assignment-select");
    const statusSelect = document.getElementById("status-select");

    const assignmentIndex = parseInt(assignmentSelect.value, 10);
    const newStatus = statusSelect.value;

    const assignmentName = assignments[assignmentIndex].name;
    assignments[assignmentIndex].status = newStatus;

    saveUserData();
    renderAssignmentsTable();
    updateDashboard();

    alert(`${assignmentName} status updated to "${newStatus}"`);
}

function loadAssignments() {
    if (currentUser) {
        const saved = localStorage.getItem(`userData_${currentUser.id}`);
        if (saved) {
            const userData = JSON.parse(saved);
            if (userData.assignments) {
                assignments = userData.assignments;
            }
        }
    }
    renderAssignmentsTable();
}

// ============================================
// UTILS
// ============================================

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// INIT
// ============================================

document.addEventListener("DOMContentLoaded", () => {
    checkSession();
    console.log("Academic Navigator initialized");
});
