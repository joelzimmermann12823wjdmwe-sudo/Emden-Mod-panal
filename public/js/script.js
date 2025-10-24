// script.js

document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');

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

            // 4. URL anpassen (optional, für saubere Navigation)
            history.pushState(null, '', `#${targetPageId}`);
        });
    });

    // Optionale Logik: Beim Laden der Seite die korrekte Ansicht anzeigen
    const initialPageId = window.location.hash.substring(1) || 'dashboard';
    const initialNavItem = document.querySelector(`.nav-item[data-page="${initialPageId}"]`);
    
    if (initialNavItem) {
        initialNavItem.click();
    } else {
        // Fallback zum Dashboard
        document.querySelector('.nav-item[data-page="dashboard"]').click();
    }
});