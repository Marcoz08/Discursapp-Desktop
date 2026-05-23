const API_BASE_URL = 'http://localhost:3000/api';
const NOTIFICATIONS_ENDPOINT = `${API_BASE_URL}/notificaciones`;
const DEFAULT_NOTIFICATION_DETAIL = 'Esta notificación requiere tu atención inmediata.';

async function updateSystemNotifications() {
    const badge = document.getElementById('notif-count');
    const container = document.getElementById('notif-content');

    if (!badge || !container) return;

    try {
        const saved = localStorage.getItem('notificaciones_enabled');
        if (saved === 'false') {
            badge.style.display = 'none';
            container.innerHTML = `
                <span class="dropdown-item dropdown-header">Notificaciones desactivadas</span>
                <div class="dropdown-divider"></div>
                <a href="./configuracion.html" class="dropdown-item dropdown-footer">Activar en configuración</a>
            `;
            return;
        }
    } catch (err) {
        console.warn('No se pudo leer preferencia de notificaciones:', err);
    }

    try {
        const response = await fetch(NOTIFICATIONS_ENDPOINT);
        if (!response.ok) {
            throw new Error('Error al conectar con el servidor');
        }

        const notifications = await response.json();

        if (notifications.length > 0) {
            badge.textContent = notifications.length;
            badge.style.display = 'block';

            container.innerHTML = `<span class="dropdown-item dropdown-header" id="notif-header">${notifications.length} Notificaciones</span>`;

            notifications.forEach((notification) => {
                const divider = document.createElement('div');
                divider.className = 'dropdown-divider';

                const item = document.createElement('a');
                item.href = notification.link;
                item.className = 'dropdown-item';
                item.innerHTML = `<i class="bi ${notification.icon} me-2 ${notification.color}"></i> ${notification.mensaje}`;

                container.appendChild(divider);
                container.appendChild(item);
            });

            container.innerHTML += `
                <div class="dropdown-divider"></div>
                <a href="./notificaciones.html" class="dropdown-item dropdown-footer">Abrir centro de notificaciones</a>
            `;
        } else {
            badge.style.display = 'none';
            container.innerHTML = `
                <span class="dropdown-item dropdown-header">No hay notificaciones pendientes</span>
                <div class="dropdown-divider"></div>
                <a href="./notificaciones.html" class="dropdown-item dropdown-footer">Abrir centro de notificaciones</a>
            `;
        }
    } catch (error) {
        console.error('Error al cargar notificaciones:', error);
        badge.style.display = 'none';
        container.innerHTML = `
            <span class="dropdown-item dropdown-header">No se pudieron cargar las notificaciones</span>
            <div class="dropdown-divider"></div>
            <a href="./notificaciones.html" class="dropdown-item dropdown-footer">Abrir centro de notificaciones</a>
        `;
    }
}

function renderNotifications(notificationsList, data) {
    if (!notificationsList) return;

    if (data.length === 0) {
        notificationsList.innerHTML = `
            <div class="p-5 text-center text-muted">
                <i class="bi bi-check2-circle fs-1 text-success mb-3"></i>
                <p>¡Todo al día! No tienes notificaciones pendientes.</p>
            </div>
        `;
        return;
    }

    notificationsList.innerHTML = '';

    data.forEach((notification, index) => {
        const item = document.createElement('div');
        item.className = 'list-group-item p-4';
        item.innerHTML = `
            <div class="d-flex align-items-start gap-3">
                <div class="flex-shrink-0">
                    <div class="rounded-circle bg-body-secondary d-flex align-items-center justify-content-center" style="width: 50px; height: 50px;">
                        <i class="bi ${notification.icon} fs-4 ${notification.color}"></i>
                    </div>
                </div>
                <div class="flex-grow-1">
                    <div class="d-flex w-100 justify-content-between align-items-center mb-2">
                        <h5 class="mb-0 fw-bold">${notification.mensaje}</h5>
                        <small class="text-muted">Sistema</small>
                    </div>
                    <p class="text-secondary mb-3">${notification.detalle || DEFAULT_NOTIFICATION_DETAIL}</p>
                    <div class="d-flex gap-2 flex-wrap">
                        <a href="${notification.link}" class="btn btn-sm btn-primary">
                            <i class="bi bi-box-arrow-up-right me-1"></i> Ir a la página
                        </a>
                        <button class="btn btn-sm btn-outline-success action-btn" data-action="complete" data-index="${index}">
                            <i class="bi bi-check2"></i> Marcar como completada
                        </button>
                        <button class="btn btn-sm btn-outline-secondary action-btn" data-action="skip" data-index="${index}">
                            Omitir
                        </button>
                        <button class="btn btn-sm btn-link text-decoration-none action-btn" data-action="later" data-index="${index}">
                            <i class="bi bi-clock-history me-1"></i> Recordármelo después
                        </button>
                    </div>
                </div>
            </div>
        `;

        notificationsList.appendChild(item);
    });
}

async function loadDetailedNotifications() {
    const notificationsList = document.getElementById('notifications-detailed-list');

    if (!notificationsList) {
        return;
    }

    try {
        const response = await fetch(NOTIFICATIONS_ENDPOINT);
        if (!response.ok) {
            throw new Error('Error al conectar con el servidor');
        }

        const data = await response.json();
        renderNotifications(notificationsList, data);
    } catch (error) {
        notificationsList.innerHTML = `
            <div class="p-5 text-center text-danger">
                <i class="bi bi-exclamation-octagon fs-1 mb-3"></i>
                <p>${error.message}</p>
            </div>
        `;
    }

    notificationsList.addEventListener('click', (event) => {
        const button = event.target.closest('.action-btn');
        if (!button) {
            return;
        }

        const row = button.closest('.list-group-item');
        const action = button.dataset.action;

        if (!row) {
            return;
        }

        if (action === 'complete' || action === 'skip' || action === 'later') {
            row.classList.add('fade-out');
            setTimeout(() => row.remove(), 300);
            console.log(`Acción ${action} ejecutada en notificación.`);
        }
    });
}

function initializeNotificationsPage() {
    updateSystemNotifications();
    loadDetailedNotifications();
}

document.addEventListener('DOMContentLoaded', initializeNotificationsPage);
document.getElementById('notif-toggle')?.addEventListener('click', updateSystemNotifications);

window.updateSystemNotifications = updateSystemNotifications;

window.addEventListener('storage', (event) => {
    if (event.key === 'notificaciones_enabled') {
        try {
            updateSystemNotifications();
        } catch (error) {
            console.warn('No fue posible actualizar el estado de notificaciones:', error);
        }
    }
});
