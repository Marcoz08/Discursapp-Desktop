async function updateSystemNotifications() {
    const badge = document.getElementById('notif-count');
    const header = document.getElementById('notif-header');
    const container = document.getElementById('notif-content');

    if (!badge || !container) return;

    try {
        const response = await fetch('http://localhost:3000/api/notificaciones/sistema');
        const notifications = await response.json();

        if (notifications.length > 0) {
            badge.textContent = notifications.length;
            badge.style.display = 'block';
            
            // Limpiar contenedor y añadir header
            container.innerHTML = `<span class="dropdown-item dropdown-header" id="notif-header">${notifications.length} Notificaciones</span>`;

            notifications.forEach(n => {
                const divider = document.createElement('div');
                divider.className = 'dropdown-divider';

                const item = document.createElement('a');
                item.href = n.link;
                item.className = 'dropdown-item';
                item.innerHTML = `<i class="bi ${n.icon} me-2 ${n.color}"></i> ${n.mensaje}`;

                container.appendChild(divider);
                container.appendChild(item);
            });

            // Añadir el pie de página
            container.innerHTML += `
                <div class="dropdown-divider"></div>
                <a href="#" class="dropdown-item dropdown-footer">Abrir centro de notificaciones</a>
            `;
        } else {
            badge.style.display = 'none';
            container.innerHTML = `
                <span class="dropdown-item dropdown-header">No hay notificaciones pendientes</span>
                <div class="dropdown-divider"></div>
                <a href="#" class="dropdown-item dropdown-footer">Abrir centro de notificaciones</a>
            `;
        }
    } catch (e) {
        console.error('Error al cargar notificaciones:', e);
    }
}

// Inicialización automática
document.addEventListener('DOMContentLoaded', updateSystemNotifications);
document.getElementById('notif-toggle')?.addEventListener('click', updateSystemNotifications);