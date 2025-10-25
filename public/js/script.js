// script.js

document.addEventListener('DOMContentLoaded', () => {
    // === GLOBALE ELEMENTE ===
    const body = document.body;
    const loginScreen = document.getElementById('login-screen');
    const mainPanel = document.getElementById('main-panel');
    const settingsModal = document.getElementById('settings-modal');

    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');
    const actionTiles = document.querySelectorAll('.action-tile');
    const selectedActionSpan = document.getElementById('selected-action');
    
    // === BUTTONS ===
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');
    const openSettingsButton = document.getElementById('open-settings-btn');
    const closeSettingsButton = document.getElementById('close-settings-btn');
    const executeActionButton = document.getElementById('execute-action-btn');

    let currentSelectedAction = "Mündliche Verwarnung";

    // --- INITIALISIERUNG ---
    initializeTheme();
    loadDashboardStats();
    initializeActionTiles();
    
    // Setzt die Standard-Aktion
    function initializeActionTiles() {
        const defaultTile = document.querySelector(`.action-tile[data-action="${currentSelectedAction}"]`);
        if (defaultTile) {
            defaultTile.classList.add('active');
        }
        selectedActionSpan.textContent = currentSelectedAction;
    }


    // === 1. LOGIN / LOGOUT LOGIK ===
    loginButton.addEventListener('click', () => {
        const adminNameInput = document.getElementById('admin-name-input');
        const adminName = adminNameInput.value.trim();

        if (adminName.length < 3) {
            alert("Bitte gib einen gültigen Admin-Namen ein!");
            return;
        }

        // Simulierter Login erfolgreich
        localStorage.setItem('adminName', adminName);
        document.getElementById('display-admin-name').textContent = adminName;
        
        loginScreen.classList.remove('active');
        mainPanel.style.display = 'block';

        // Stellt sicher, dass das Dashboard geladen wird
        document.querySelector('.nav-item[data-page="dashboard"]').click();
    });

    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('adminName');
        mainPanel.style.display = 'none';
        loginScreen.classList.add('active');
    });

    // Prüft beim Laden, ob der Admin eingeloggt ist
    const storedAdminName = localStorage.getItem('adminName');
    if (storedAdminName) {
        document.getElementById('display-admin-name').textContent = storedAdminName;
        loginScreen.classList.remove('active');
        mainPanel.style.display = 'block';
    } else {
        loginScreen.classList.add('active');
        mainPanel.style.display = 'none';
    }
    
    // --- ENDE LOGIN LOGIK ---


    // === 2. DESIGN WECHSEL (Settings) LOGIK ===
    openSettingsButton.addEventListener('click', () => {
        settingsModal.classList.add('active');
    });

    closeSettingsButton.addEventListener('click', () => {
        settingsModal.classList.remove('active');
    });

    // Theme Switch Logik
    function initializeTheme() {
        const storedTheme = localStorage.getItem('theme') || 'dark';
        setTheme(storedTheme);
        // Setzt den Radio-Button basierend auf dem gespeicherten Wert
        const themeRadio = document.querySelector(`input[name="theme"][value="${storedTheme}"]`);
        if (themeRadio) {
            themeRadio.checked = true;
        }
    }

    document.querySelectorAll('input[name="theme"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const newTheme = e.target.value;
            setTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        });
    });

    function setTheme(theme) {
        if (theme === 'light') {
            body.classList.add('light-theme');
            body.classList.remove('dark-theme');
        } else {
            body.classList.add('dark-theme');
            body.classList.remove('light-theme');
        }
    }
    // --- ENDE DESIGN WECHSEL LOGIK ---


    // === 3. NAVIGATION LOGIK (Bleibt gleich) ===
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPageId = item.getAttribute('data-page');
            
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            pages.forEach(page => page.classList.remove('active'));
            const targetPage = document.getElementById(targetPageId);
            if (targetPage) {
                targetPage.classList.add('active');
            }
        });
    });
    
    // Stellt sicher, dass das Dashboard beim erfolgreichen Login angezeigt wird (siehe Login-Logik)
    
    // ... (loadDashboardStats bleibt gleich) ...
    function loadDashboardStats() {
        document.getElementById('stat-online-players').textContent = '42';
        document.getElementById('stat-active-bans').textContent = '5';
        document.getElementById('stat-reports').textContent = '12';
        document.getElementById('stat-event').textContent = 'Heute 20:00'; // Event-Platzhalter
    }


    // === 4. ADMIN AKTIONEN LOGIK (Bleibt gleich) ===
    actionTiles.forEach(tile => {
        tile.addEventListener('click', () => {
            actionTiles.forEach(t => t.classList.remove('active'));
            tile.classList.add('active');
            
            currentSelectedAction = tile.getAttribute('data-action');
            selectedActionSpan.textContent = currentSelectedAction;
        });
    });

    executeActionButton.addEventListener('click', () => {
        const targetPlayer = document.getElementById('target-player').value.trim();
        const reason = document.getElementById('action-reason').value.trim();
        
        if (!targetPlayer) {
            alert("Bitte geben Sie einen Ziel-Spielernamen oder eine UserID ein!");
            return;
        }

        const adminName = localStorage.getItem('adminName') || "Unbekannter Admin";

        // HIER würde der API-Call zum Backend gesendet werden
        console.log("--- AKTION AUSFÜHREN ---");
        console.log("Admin:", adminName);
        console.log("Aktion:", currentSelectedAction);
        console.log("Ziel:", targetPlayer);
        console.log("Grund:", reason || "Kein Grund angegeben");
        
        alert(`Aktion '${currentSelectedAction}' von ${adminName} für Spieler ${targetPlayer} gesendet! (Simuliert)`);
    });
});