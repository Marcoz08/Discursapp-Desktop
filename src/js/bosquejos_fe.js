document.addEventListener('DOMContentLoaded', async function () {
  const API_BASE_URL = 'http://localhost:3000/api';
  const tableBodyRegulares = document.getElementById('bosquejos-table-body');
  const tableBodyEspeciales = document.getElementById('especiales-table-body');
  const searchInput = document.querySelector('input[name="table_search"]');
  const sortSelect = document.getElementById('sort-date');
  let bosquejosOriginales = [];

  async function fetchBosquejos() {
    try {
      const response = await fetch(`${API_BASE_URL}/bosquejos`);
      if (!response.ok) throw new Error('Error al obtener datos');

      bosquejosOriginales = await response.json();
      updateDisplay();
    } catch (error) {
      console.error('Error:', error);
      tableBodyRegulares.innerHTML =
        '<tr><td colspan="5" class="text-center text-danger">Error al conectar con el servidor</td></tr>';
      tableBodyEspeciales.innerHTML =
        '<tr><td colspan="5" class="text-center text-danger">Error al conectar con el servidor</td></tr>';
    }
  }

  function updateDisplay() {
    const term = searchInput.value.toLowerCase();
    const sortVal = sortSelect.value;

    let filtered = bosquejosOriginales.filter(
      (b) =>
        b.titulo.toLowerCase().includes(term) ||
        (b.num && b.num.toString().includes(term)) ||
        (b.clave && b.clave.toLowerCase().includes(term)),
    );

    if (sortVal === 'recent') {
      filtered.sort((a, b) => {
        if (!a.fecha_ult) return 1;
        if (!b.fecha_ult) return -1;
        return new Date(b.fecha_ult) - new Date(a.fecha_ult);
      });
    } else if (sortVal === 'oldest') {
      filtered.sort((a, b) => {
        if (!a.fecha_ult) return 1;
        if (!b.fecha_ult) return -1;
        return new Date(a.fecha_ult) - new Date(b.fecha_ult);
      });
    }

    const regulares = filtered.filter((b) => b.s34 === 1);
    const especiales = filtered.filter((b) => b.s34 === 0);

    renderTable(regulares, tableBodyRegulares);
    renderTable(especiales, tableBodyEspeciales);
  }

  function renderTable(data, container) {
    container.innerHTML = '';
    if (data.length === 0) {
      container.innerHTML =
        '<tr><td colspan="5" class="text-center text-muted p-3">No se encontraron registros en esta categoría</td></tr>';
      return;
    }

    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    data.forEach((item) => {
      const tr = document.createElement('tr');

      let rawFecha = '';
      if (item.fecha_ult) {
        const d = new Date(item.fecha_ult);
        rawFecha = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .split('T')[0];
      }
      const fechaStr = rawFecha ? rawFecha.split('-').reverse().join('-') : '--';

      let badgeClass = '';
      let badgeStyle = '';
      let statusText = '';
      const displayId = item.s34 === 0 ? item.clave || '--' : item.num || '--';

      if (item.s34 === 0) {
        badgeClass = 'text-bg-secondary';
        statusText = 'No aplica';
      } else if (!item.fecha_ult) {
        badgeClass = 'text-bg-success';
        statusText = 'Disponible';
      } else {
        const lastDate = new Date(item.fecha_ult);
        if (lastDate >= threeMonthsAgo) {
          badgeClass = 'text-bg-danger';
          statusText = 'Muy reciente';
        } else if (lastDate >= sixMonthsAgo) {
          badgeClass = 'text-white';
          badgeStyle = 'style="background-color: #fd7e14;"';
          statusText = 'Reciente';
        } else {
          badgeClass = 'text-bg-warning';
          statusText = 'Presentado';
        }
      }

      tr.innerHTML = `
        <td>${displayId}</td>
        <td>${item.titulo}</td>
        <td>${fechaStr}</td>
        <td><span class="badge ${badgeClass}" ${badgeStyle}>${statusText}</span></td>
        <td>
          <button class="btn btn-sm btn-outline-primary edit-btn"
                  data-id="${item.id_bosquejo}"
                  data-num="${displayId}"
                  data-titulo="${item.titulo}"
                  data-fecha="${rawFecha}"
                  title="Modificar fecha">
            <i class="bi bi-calendar-event"></i>
          </button>
          <button class="btn btn-sm btn-outline-secondary edit-title-btn ms-1"
                  data-id="${item.id_bosquejo}"
                  data-num="${displayId}"
                  data-clave="${item.clave || ''}"
                  data-s34="${item.s34}"
                  data-titulo="${item.titulo}"
                  title="Editar tema">
            <i class="bi bi-pencil-square"></i>
          </button>
        </td>
      `;
      container.appendChild(tr);
    });
  }

  function showNotification(message, type = 'success', errorCode = null) {
    const toastContainer = document.getElementById('toastContainer');
    const toastId = 'toast-' + Date.now();
    const bgClass = type === 'success' ? 'text-bg-success' : 'text-bg-danger';
    const icon = type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill';

    let bodyContent = message;
    if (errorCode) {
      bodyContent = `<strong>Error en la operación:</strong><br>${message} <br><small>Código: ${errorCode}</small>`;
    }

    const toastHTML = `
      <div id="${toastId}" class="toast align-items-center ${bgClass} border-0" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body">
            <div class="d-flex align-items-center">
              <i class="bi ${icon} fs-5 me-2"></i>
              <div>${bodyContent}</div>
            </div>
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>
    `;

    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, {
      delay: type === 'success' ? 3000 : 7000,
    });
    toast.show();
    toastElement.addEventListener('hidden.bs.toast', () => toastElement.remove());
  }

  document.querySelector('.app-main').addEventListener('click', (e) => {
    const dateBtn = e.target.closest('.edit-btn');
    const titleBtn = e.target.closest('.edit-title-btn');

    if (dateBtn) {
      const { id, num, titulo, fecha } = dateBtn.dataset;
      document.getElementById('edit-id').value = id;
      document.getElementById('edit-speech-info').innerText = `Bosquejo #${num}: ${titulo}`;
      document.getElementById('edit-fecha').value = fecha;
      new bootstrap.Modal(document.getElementById('editModal')).show();
    } else if (titleBtn) {
      const { id, num, titulo, clave, s34 } = titleBtn.dataset;
      const isEspecial = parseInt(s34, 10) === 0;
      document.getElementById('edit-title-id').value = id;
      document.getElementById('edit-title-info').innerText =
        isEspecial ? `Actualizando Discurso Especial: ${num}` : `Actualizando Bosquejo #${num}`;
      document.getElementById('edit-titulo-input').value = titulo;

      document.getElementById('edit-clave-container').style.display = isEspecial ? 'block' : 'none';
      document.getElementById('edit-clave-input').value = isEspecial ? clave : '';

      new bootstrap.Modal(document.getElementById('editTitleModal')).show();
    }
  });

  const btnAddSpecial = document.getElementById('btn-add-special');
  const addSpecialModal = new bootstrap.Modal(document.getElementById('addSpecialModal'));
  const btnSaveNewSpecial = document.getElementById('btn-save-new-special');

  btnAddSpecial.addEventListener('click', () => {
    document.getElementById('addSpecialForm').reset();
    addSpecialModal.show();
  });

  btnSaveNewSpecial.addEventListener('click', async () => {
    const titulo = document.getElementById('add-titulo-input').value;
    const clave = document.getElementById('add-clave-input').value;

    if (!titulo.trim() || !clave.trim()) {
      showNotification('Todos los campos son obligatorios', 'danger');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/bosquejos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, clave, s34: 0 }),
      });

      if (response.ok) {
        addSpecialModal.hide();
        showNotification('Discurso especial añadido con éxito', 'success');
        fetchBosquejos();
      } else {
        const error = await response.json();
        showNotification(error.error || 'Error al añadir discurso', 'danger');
      }
    } catch (error) {
      showNotification('Error de conexión con el servidor', 'danger');
    }
  });

  document.getElementById('clear-date-btn').addEventListener('click', async () => {
    const id = document.getElementById('edit-id').value;

    if (!confirm('¿Está seguro de que desea borrar la última fecha de presentación de este bosquejo?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/bosquejos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha_ult: null }),
      });

      if (response.ok) {
        const modalInstance = bootstrap.Modal.getInstance(document.getElementById('editModal'));
        modalInstance.hide();
        showNotification('La fecha ha sido borrada. El bosquejo ahora aparece como disponible.', 'success');
        fetchBosquejos();
      } else {
        const errorData = await response.json();
        showNotification(errorData.error || 'Error al intentar borrar la fecha', 'danger', response.status);
      }
    } catch (error) {
      showNotification('Error de conexión con el servidor.', 'danger', 'FETCH_ERROR');
    }
  });

  document.getElementById('save-date-btn').addEventListener('click', async () => {
    const id = document.getElementById('edit-id').value;
    const nuevaFecha = document.getElementById('edit-fecha').value;

    try {
      const response = await fetch(`${API_BASE_URL}/bosquejos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha_ult: nuevaFecha }),
      });

      if (response.ok) {
        const modalInstance = bootstrap.Modal.getInstance(document.getElementById('editModal'));
        modalInstance.hide();
        showNotification('La fecha de presentación se actualizó correctamente.', 'success');
        fetchBosquejos();
      } else {
        const errorData = await response.json();
        showNotification(errorData.error || 'Error al guardar fecha', 'danger', response.status);
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('No se pudo conectar con el servidor.', 'danger', 'FETCH_ERROR');
    }
  });

  document.getElementById('save-title-btn').addEventListener('click', async () => {
    const id = document.getElementById('edit-title-id').value;
    const nuevoTitulo = document.getElementById('edit-titulo-input').value;
    const nuevaClave = document.getElementById('edit-clave-input').value;

    if (!nuevoTitulo.trim()) {
      showNotification('El título no puede estar vacío', 'danger');
      return;
    }

    const updateData = { titulo: nuevoTitulo };
    if (document.getElementById('edit-clave-container').style.display !== 'none') {
      updateData.clave = nuevaClave;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/bosquejos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const modalInstance = bootstrap.Modal.getInstance(document.getElementById('editTitleModal'));
        modalInstance.hide();
        showNotification('El título del discurso ha sido actualizado.', 'success');
        fetchBosquejos();
      } else {
        const errorData = await response.json();
        showNotification(errorData.error || 'Error al guardar título', 'danger', response.status);
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('Error de conexión con el servidor.', 'danger', 'FETCH_ERROR');
    }
  });

  searchInput.addEventListener('input', updateDisplay);
  sortSelect.addEventListener('change', updateDisplay);

  fetchBosquejos();
});

