// script.js

document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');
    
    // Initiales Laden
    loadDashboardStats();
    // Keine Daten mehr für User Management laden, da die Tabelle leer bleiben soll:
    // loadUserManagementData(); 

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

            // Wenn User Management geladen wird, bleibt die Tabelle leer
            if (targetPageId === 'user-management') {
                // Nur die leere Tabelle beibehalten, keine Platzhalter-Daten laden
                clearUserTable();
            }
        });
    });

    // Optionale Logik: Beim Laden der Seite die korrekte Ansicht anzeigen
    const initialPageId = window.location.hash.substring(1) || 'dashboard';
    const initialNavItem = document.querySelector(`.nav-item[data-page="${initialPageId}"]`);
    
    if (initialNavItem) {
        initialNavItem.click();
    } else {
        document.querySelector('.nav-item[data-page="dashboard"]').click();
    }


    // === 2. DASHBOARD STATS (Bleiben als Platzhalter) ===
    function loadDashboardStats() {
        document.getElementById('stat-online-players').textContent = '42';
        document.getElementById('stat-active-bans').textContent = '5';
        document.getElementById('stat-reports').textContent = '12';
    }


    // === 3. USER MANAGEMENT LOGIK (Nur Aufräumen) ===
    function clearUserTable() {
        const tableBody = document.getElementById('user-table-body');
        tableBody.innerHTML = ''; // Stellt sicher, dass die Tabelle leer ist
        
        // Fügen Sie eine Zeile ein, die anzeigt, dass keine Daten geladen wurden
        const row = tableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 5; // Erstreckt sich über alle Spalten
        cell.textContent = "Keine Benutzerdaten geladen. Die API-Verbindung ist noch nicht eingerichtet.";
        cell.style.textAlign = 'center';
        cell.style.padding = '20px';
    }
});