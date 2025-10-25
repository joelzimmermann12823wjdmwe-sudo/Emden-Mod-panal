// Firebase Imports (MUST use the global variables __app_id, __firebase_config, __initial_auth_token)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, onSnapshot, collection, query, limit, where, getDocs, addDoc, serverTimestamp, setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- Global State and Firebase Setup ---
let app;
let db;
let auth;
let userId = 'anon_user'; // Default placeholder, updated on auth state change
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
let adminName = ''; // Stores the logged-in admin's name
let selectedAction = ''; // Stores the currently selected action (e.g., 'ban', 'warn')
let selectedAccent = ''; // Stores the accent color for the selected action
let theme = 'dark'; // Default theme

// Firebase config retrieval and initialization
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');

// Helper function to get the Firestore collection path for public data
function getPublicCollectionPath(collectionName) {
    return `/artifacts/${appId}/public/data/${collectionName}`;
}

// Helper function to initialize Firebase and sign in
async function initializeFirebase() {
    try {
        setLogLevel('Debug');
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        console.log("Firebase initialized.");

        // Authenticate using the custom token or anonymously if not available
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
            console.log("Signed in with custom token.");
        } else {
            await signInAnonymously(auth);
            console.log("Signed in anonymously.");
        }

        // Listen for Auth state changes
        onAuthStateChanged(auth, (user) => {
            if (user) {
                userId = user.uid;
                console.log("User ID set:", userId);
                // After successful sign-in, try to load data
                loadInitialData();
            } else {
                // Should not happen with the initial token unless sign-out is explicit
                userId = crypto.randomUUID(); // Fallback to random ID for truly anonymous access
                console.log("Anonymous sign-in fallback. Generated random userId:", userId);
                loadInitialData();
            }
        });

    } catch (error) {
        console.error("Firebase initialization or sign-in failed:", error);
        logAction('System', `Fehler beim Initialisieren der Datenbank: ${error.message}`, 'error');
    }
}

// --- Local Storage Functions (for non-database settings) ---

function saveSettings() {
    localStorage.setItem('modPanelTheme', theme);
    localStorage.setItem('modPanelAdminName', adminName);
}

function loadSettings() {
    theme = localStorage.getItem('modPanelTheme') || 'dark';
    adminName = localStorage.getItem('modPanelAdminName') || '';

    // Apply theme immediately
    document.body.className = theme === 'light' ? 'light-theme' : '';
    
    // Check if adminName exists. If not, show login modal.
    if (!adminName) {
        showLoginModal();
    } else {
        updateAdminInfo(adminName);
        hideLoginModal();
    }
    
    // Set theme radio button in settings modal
    const themeRadio = document.getElementById(theme + '-theme-radio');
    if (themeRadio) themeRadio.checked = true;
}

// --- UI / Theme Functions ---

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');

    document.querySelectorAll('.nav-item').forEach(nav => {
        nav.classList.remove('active');
    });
    document.querySelector(`.nav-item[data-page="${pageId}"]`).classList.add('active');
}

function showLoginModal() {
    document.getElementById('login-modal').classList.add('active');
}

function hideLoginModal() {
    document.getElementById('login-modal').classList.remove('active');
}

function showSettingsModal() {
    // Ensure current theme radio is checked when opening
    const themeRadio = document.getElementById(theme + '-theme-radio');
    if (themeRadio) themeRadio.checked = true;
    
    document.getElementById('settings-modal').classList.add('active');
}

function hideSettingsModal() {
    document.getElementById('settings-modal').classList.remove('active');
}

function applyTheme(newTheme) {
    theme = newTheme;
    document.body.className = theme === 'light' ? 'light-theme' : '';
    saveSettings();
}

function updateAdminInfo(name) {
    adminName = name;
    document.getElementById('admin-name-display').textContent = name;
    document.getElementById('admin-id-display').textContent = userId;
    saveSettings();
}

// --- Data Logging & Display ---

async function logAction(admin, action, type = 'info', targetUser = 'N/A') {
    if (!db) return;

    const logEntry = {
        timestamp: serverTimestamp(),
        adminId: userId,
        adminName: admin,
        action: action,
        targetUser: targetUser,
        type: type, // 'info', 'warn', 'error', 'system'
    };

    try {
        const logCollectionPath = getPublicCollectionPath('moderation_logs');
        await addDoc(collection(db, logCollectionPath), logEntry);
        console.log("Action logged successfully:", logEntry);
    } catch (error) {
        console.error("Error logging action to Firestore:", error);
    }
}

function displayLog(entry) {
    const logList = document.getElementById('log-list');
    if (!logList) return;

    const li = document.createElement('li');
    li.className = `log-entry log-${entry.type}`;

    // Format timestamp
    const time = entry.timestamp && entry.timestamp.toDate ? entry.timestamp.toDate().toLocaleTimeString('de-DE') : new Date().toLocaleTimeString('de-DE');

    li.innerHTML = `
        <span class="log-time">[${time}]</span>
        <span class="log-admin">${entry.adminName || entry.adminId}</span>
        <span class="log-action">-> ${entry.action}</span>
        ${entry.targetUser && entry.targetUser !== 'N/A' ? `<span class="log-target"> (${entry.targetUser})</span>` : ''}
    `;

    // Insert at the top
    if (logList.firstChild) {
        logList.insertBefore(li, logList.firstChild);
    } else {
        logList.appendChild(li);
    }
    
    // Keep log concise (e.g., max 50 entries)
    while (logList.children.length > 50) {
        logList.removeChild(logList.lastChild);
    }
}

// --- Real-time Data Listeners ---

function startRealTimeListeners() {
    if (!db) return;

    // 1. Listen for Live Logs
    const logCollectionPath = getPublicCollectionPath('moderation_logs');
    const logsQuery = query(
        collection(db, logCollectionPath),
        // Sort by timestamp descending
        // NOTE: Firebase queries require an index if using orderBy. We sort client-side instead.
        // orderBy('timestamp', 'desc'), 
        limit(50)
    );

    onSnapshot(logsQuery, (snapshot) => {
        const logList = document.getElementById('log-list');
        if (!logList) return;
        
        // Fetch all documents and sort them client-side by timestamp
        const logs = [];
        snapshot.docs.forEach(doc => {
            logs.push({ id: doc.id, ...doc.data() });
        });

        // Sort by timestamp descending (newest first)
        logs.sort((a, b) => {
            const timeA = a.timestamp && a.timestamp.toDate ? a.timestamp.toDate().getTime() : 0;
            const timeB = b.timestamp && b.timestamp.toDate ? b.timestamp.toDate().getTime() : 0;
            return timeB - timeA;
        });

        // Clear existing log and display sorted logs
        logList.innerHTML = '';
        logs.forEach(displayLog);

    }, (error) => {
        console.error("Error listening to logs:", error);
        logAction('System', `Fehler beim Abrufen der Logs: ${error.message}`, 'error');
    });


    // 2. Listen for User Stats
    const userStatsRef = doc(db, getPublicCollectionPath('stats'), 'user_stats');
    onSnapshot(userStatsRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
            const stats = docSnapshot.data();
            document.getElementById('total-users-value').textContent = stats.totalUsers || '0';
            document.getElementById('active-bans-value').textContent = stats.activeBans || '0';
            document.getElementById('daily-reports-value').textContent = stats.dailyReports || '0';
            document.getElementById('next-event-value').textContent = stats.nextEvent || 'N/A';
        } else {
            console.log("User stats document not found. Setting defaults.");
            // Optionally initialize the document if it doesn't exist
            setDoc(userStatsRef, { totalUsers: 1000, activeBans: 5, dailyReports: 42, nextEvent: 'Community Tag' }, { merge: true })
                .catch(e => console.error("Error setting default stats:", e));
        }
    }, (error) => {
        console.error("Error listening to stats:", error);
        logAction('System', `Fehler beim Abrufen der Statistiken: ${error.message}`, 'error');
    });
}

async function loadInitialData() {
    // This is called after successful sign-in
    startRealTimeListeners();
    // Re-check for admin name and update UI
    loadSettings();
    showPage('dashboard');
}

// --- Action Execution ---

function selectAction(action, accent) {
    selectedAction = action;
    selectedAccent = accent;

    // Update active state in UI
    document.querySelectorAll('.action-tile').forEach(tile => {
        tile.classList.remove('active');
    });
    document.getElementById(action + '-tile').classList.add('active');

    // Update execute box UI
    const executeBtn = document.getElementById('execute-action-btn');
    const actionInput = document.getElementById('action-input');
    const reasonLabel = document.getElementById('reason-label');
    const durationContainer = document.getElementById('duration-container');
    
    executeBtn.textContent = `Aktion '${action.toUpperCase()}' ausführen`;
    actionInput.placeholder = `Spielername für ${action}...`;

    // Show/hide duration based on action
    if (action === 'ban' || action === 'mute' || action === 'warn') {
        durationContainer.style.display = 'block';
    } else {
        durationContainer.style.display = 'none';
    }

    // Update reason label
    if (action === 'ban') reasonLabel.textContent = 'Grund (z.B. Cheating, Trolling):';
    else if (action === 'kick') reasonLabel.textContent = 'Grund (optional):';
    else if (action === 'warn') reasonLabel.textContent = 'Grund (obligatorisch):';
    else if (action === 'unban') reasonLabel.textContent = 'Grund für Entbannung:';
    else reasonLabel.textContent = 'Grund:';
    
    // Log the selection
    logAction(adminName, `Aktion ausgewählt: ${action}`, 'info');
}

async function executeAction() {
    if (!selectedAction) {
        logAction(adminName, 'Keine Aktion ausgewählt.', 'warn');
        return;
    }

    const targetUser = document.getElementById('action-input').value.trim();
    const reason = document.getElementById('reason-reason').value.trim();
    const duration = document.getElementById('reason-duration').value.trim();

    if (!targetUser) {
        logAction(adminName, `Aktion ${selectedAction.toUpperCase()} fehlgeschlagen: Zielspieler fehlt.`, 'error');
        return;
    }

    // Simple validation for required fields
    if ((selectedAction === 'warn' && !reason) || (selectedAction === 'ban' && !reason)) {
        logAction(adminName, `Aktion ${selectedAction.toUpperCase()} fehlgeschlagen: Grund ist obligatorisch.`, 'error');
        return;
    }

    let actionText = selectedAction.toUpperCase();
    let logMessage = `${actionText} gegen ${targetUser}`;

    if (reason) logMessage += ` | Grund: ${reason}`;
    if (duration && (selectedAction === 'ban' || selectedAction === 'mute' || selectedAction === 'warn')) {
        logMessage += ` | Dauer: ${duration}`;
    }

    logAction(adminName, logMessage, selectedAccent === 'red' ? 'warn' : 'info', targetUser);
    
    // Clear inputs after execution
    document.getElementById('action-input').value = '';
    document.getElementById('reason-reason').value = '';
    document.getElementById('reason-duration').value = '';
    
    // Display confirmation in the log
    logAction('System', `Befehl erfolgreich gesendet: ${logMessage}`, 'info');
}

// --- Event Listeners Setup ---

window.onload = function() {
    loadSettings();
    initializeFirebase();

    // 1. Navigation Event Listeners
    document.querySelectorAll('.nav-item').forEach(nav => {
        nav.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = e.target.getAttribute('data-page');
            if (pageId) {
                showPage(pageId);
                // Log navigation, but only on page change
                logAction(adminName || 'Anon', `Navigiert zu: ${pageId}`, 'info');
            }
        });
    });

    // 2. Login Modal Submission
    document.getElementById('login-btn').addEventListener('click', () => {
        const inputName = document.getElementById('admin-name-input').value.trim();
        if (inputName) {
            updateAdminInfo(inputName);
            hideLoginModal();
            logAction(inputName, 'Erfolgreich als Admin eingeloggt.', 'system');
        } else {
            // Use custom modal for error instead of alert
            logAction('System', 'Bitte geben Sie Ihren Administratornamen ein.', 'error');
        }
    });

    // 3. Settings Modal Handlers
    document.getElementById('settings-btn').addEventListener('click', showSettingsModal);
    document.getElementById('close-settings-modal').addEventListener('click', hideSettingsModal);

    // 3a. Theme change listeners
    document.querySelectorAll('input[name="theme-radio"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            applyTheme(e.target.value);
            logAction(adminName, `Design geändert zu: ${e.target.value === 'dark' ? 'Dunkel' : 'Hell'}`, 'info');
        });
    });

    // 4. Action Tile Selection
    document.querySelectorAll('.action-tile').forEach(tile => {
        tile.addEventListener('click', (e) => {
            // Find the closest tile element to ensure we get the correct data attributes
            const targetTile = e.currentTarget;
            const action = targetTile.getAttribute('data-action');
            const accent = targetTile.getAttribute('data-accent');
            selectAction(action, accent);
        });
    });

    // 5. Action Execution Button
    document.getElementById('execute-action-btn').addEventListener('click', executeAction);

    // 6. Logout Button
    document.getElementById('logout-btn').addEventListener('click', () => {
        updateAdminInfo(''); // Clear admin name
        showLoginModal();
        logAction(adminName, 'Erfolgreich abgemeldet.', 'system');
    });

    // Initial action selection (select 'ban' by default)
    selectAction('ban', 'red');
};