// script.js

document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');
    
    // Initiales Laden der Benutzerdaten (Platzhalter)
    loadUserManagementData();
    loadDashboardStats();

    // === 1. NAVIGATION LOGIK ===
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPageId = item.getAttribute('data-page');

            // 1. Aktive Klasse aus Navigation entfernen und zuweisen
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // 2. Alle Inhalts-Seiten verstecken
            pages.forEach(page => page.classList.remove('active'));

            // 3. Ziel-Seite anzeigen
            const targetPage = document.getElementById(targetPageId);
            if (targetPage) {
                targetPage.classList.add('active');
            }

            // Optional: Logik für die geladene Seite ausführen
            if (targetPageId === 'user-management') {
                loadUserManagementData();
            }
        });
    });

    // Optionale Logik: Beim Laden der Seite die korrekte Ansicht anzeigen
    const initialPageId = window.location.hash.substring(1) || 'dashboard';
    const initialNavItem = document.querySelector(`.nav-item[data-page="${initialPageId}"]`);
    
    if (initialNavItem) {
        // Simuliert einen Klick, um die Seite zu laden und als aktiv zu markieren
        initialNavItem.click();
    } else {
        // Fallback zum Dashboard
        document.querySelector('.nav-item[data-page="dashboard"]').click();
    }


    // === 2. DASHBOARD STATS (Platzhalter) ===
    function loadDashboardStats() {
        // Simulation von Daten, die später von einem Backend kommen
        document.getElementById('stat-online-players').textContent = '42';
        document.getElementById('stat-active-bans').textContent = '5';
        document.getElementById('stat-reports').textContent = '12';
    }


    // === 3. USER MANAGEMENT LOGIK (Platzhalter) ===
    function loadUserManagementData() {
        // Diese Daten würden später von einer API/Datenbank geladen werden
        const userData = [
            { id: 1001, name: "AdminHans", rank: "Admin", status: "Online" },
            { id: 1002, name: "MaxMustermann", rank: "User", status: "Offline" },
            { id: 1003, name: "TestPlayer01", rank: "Supporter", status: "Online" },
            { id: 1004, name: "BannedUser99", rank: "Banned", status: "Offline" }
        ];

        const tableBody = document.getElementById('user-table-body');
        tableBody.innerHTML = ''; // Tabelle vor dem Neubefüllen leeren

        userData.forEach(user => {
            const row = tableBody.insertRow();
            row.insertCell().textContent = user.id;
            row.insertCell().textContent = user.name;
            row.insertCell().textContent = user.rank;
            row.insertCell().textContent = user.status;
            
            const actionCell = row.insertCell();
            
            // Fügt die "Bannen" und "Kicken" Buttons hinzu
            actionCell.innerHTML = `
                <button class="action-btn ban-btn" data-user-id="${user.id}">Bannen</button>
                <button class="action-btn" data-user-id="${user.id}">Kicken</button>
            `;
            
            // Beispiel für einen Event Listener, der später die API aufruft
            const banButton = actionCell.querySelector('.ban-btn');
            banButton.addEventListener('click', () => {
                alert(`Aktion: Spieler ${user.name} (ID: ${user.id}) bannen.`);
                // HIER wäre später der API-Call zum Backend
            });
        });
    }

});