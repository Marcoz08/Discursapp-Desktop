document.addEventListener("DOMContentLoaded", function () {
  const recordsPerPage = 10;
  let allSalidas = [];
  let allVisitas = [];
  let filteredSalidas = [];
  let filteredVisitas = [];
  let pageSalidas = 1;
  let pageVisitas = 1;

  const salidasBody = document.getElementById("historico-salidas-body");
  const visitasBody = document.getElementById("historico-visitas-body");
  const searchSalidas = document.getElementById("search-salidas");
  const searchVisitas = document.getElementById("search-visitas");

  const API_BASE = 'http://localhost:3000/api';

  const btnAddManual = document.getElementById("btn-add-manual");
  const manualModal = new bootstrap.Modal(document.getElementById("manualRecordModal"));
  const btnSaveManual = document.getElementById("btn-save-manual");

  const btnAddVisitManual = document.getElementById("btn-add-visit-manual");
  const manualVisitModal = new bootstrap.Modal(document.getElementById("manualVisitModal"));
  const btnSaveVisitManual = document.getElementById("btn-save-visit-manual");

  async function fetchData() {
    try {
      const [resS, resV] = await Promise.all([
        fetch(`${API_BASE}/salidas/historico`),
        fetch(`${API_BASE}/visitantes/historico`),
      ]);

      if (!resS.ok || !resV.ok) {
        throw new Error(`Error HTTP: Salidas(${resS.status}) / Visitas(${resV.status})`);
      }

      allSalidas = await resS.json() || [];
      allVisitas = await resV.json() || [];

      filteredSalidas = [...allSalidas];
      filteredVisitas = [...allVisitas];
      renderAll();
    } catch (error) {
      console.error("Error al cargar datos:", error);
      if (salidasBody) salidasBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error al cargar datos</td></tr>';
      if (visitasBody) visitasBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error al cargar datos</td></tr>';
    }
  }

  function renderAll() {
    renderSalidas();
    renderVisitas();
  }

  function renderSalidas() {
    if (!salidasBody) return;
    const start = (pageSalidas - 1) * recordsPerPage;
    const end = start + recordsPerPage;
    const items = filteredSalidas.slice(start, end);

    salidasBody.innerHTML = items.map((s) => `
      <tr>
        <td>${new Date(s.fecha_salida).toLocaleDateString('es-MX')}</td>
        <td>${s.nombre_orador}</td>
        <td>${s.tema}</td>
        <td>${s.destino}</td>
      </tr>
    `).join('') || '<tr><td colspan="4" class="text-center text-muted">No hay registros</td></tr>';

    updatePagination("pagination-salidas", filteredSalidas.length, pageSalidas, (p) => {
      pageSalidas = p;
      renderSalidas();
    });
  }

  function renderVisitas() {
    if (!visitasBody) return;
    const start = (pageVisitas - 1) * recordsPerPage;
    const end = start + recordsPerPage;
    const items = filteredVisitas.slice(start, end);

    visitasBody.innerHTML = items.map((v) => `
      <tr>
        <td>${new Date(v.fecha_discurso).toLocaleDateString('es-MX')}</td>
        <td>${v.nombre}</td>
        <td>${v.tema}</td>
        <td>${v.congregacion}</td>
        <td class="text-center"><i class="bi bi-check-circle-fill text-success"></i></td>
      </tr>
    `).join('') || '<tr><td colspan="5" class="text-center text-muted">No hay registros</td></tr>';

    updatePagination("pagination-visitas", filteredVisitas.length, pageVisitas, (p) => {
      pageVisitas = p;
      renderVisitas();
    });
  }

  function updatePagination(id, totalItems, currentPage, callback) {
    const totalPages = Math.ceil(totalItems / recordsPerPage);
    const container = document.getElementById(id);
    if (!container) return;

    let html = `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${currentPage - 1}">&laquo;</a></li>`;
    for (let i = 1; i <= totalPages; i++) {
      html += `<li class="page-item ${i === currentPage ? 'active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
    }
    html += `<li class="page-item ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${currentPage + 1}">&raquo;</a></li>`;

    container.innerHTML = html;
    container.querySelectorAll('a[data-page]').forEach((link) => {
      link.onclick = (e) => {
        e.preventDefault();
        const p = parseInt(link.dataset.page, 10);
        if (p > 0 && p <= totalPages) callback(p);
      };
    });
  }

  if (searchSalidas) {
    searchSalidas.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      filteredSalidas = allSalidas.filter((s) =>
        s.nombre_orador.toLowerCase().includes(term) ||
        s.tema.toLowerCase().includes(term) ||
        s.destino.toLowerCase().includes(term)
      );
      pageSalidas = 1;
      renderSalidas();
    });
  }

  if (searchVisitas) {
    searchVisitas.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      filteredVisitas = allVisitas.filter((v) =>
        v.nombre.toLowerCase().includes(term) ||
        v.tema.toLowerCase().includes(term) ||
        v.congregacion.toLowerCase().includes(term)
      );
      pageVisitas = 1;
      renderVisitas();
    });
  }

  btnAddManual.addEventListener("click", () => manualModal.show());

  btnSaveManual.addEventListener("click", async () => {
    const formData = {
      fecha: document.getElementById("m-fecha").value,
      nombre: document.getElementById("m-nombre").value,
      titulo: document.getElementById("m-titulo").value,
      congregacion: document.getElementById("m-congregacion").value,
      tipo_registro: 0,
    };

    if (!formData.fecha || !formData.nombre) {
      alert("La fecha y el nombre son obligatorios.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/historico`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        manualModal.hide();
        document.getElementById("manualForm").reset();
        if (typeof showNotification === 'function') showNotification("Registro añadido correctamente", "success");
        fetchData();
      } else {
        alert("Error al guardar el registro manual.");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  });

  btnAddVisitManual.addEventListener("click", () => manualVisitModal.show());

  btnSaveVisitManual.addEventListener("click", async () => {
    const formData = {
      fecha: document.getElementById("v-fecha").value,
      nombre: document.getElementById("v-nombre").value,
      titulo: document.getElementById("v-titulo").value,
      congregacion: document.getElementById("v-congregacion").value,
      tipo_registro: 1,
    };

    if (!formData.fecha || !formData.nombre) {
      alert("La fecha y el nombre son obligatorios.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/historico`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        manualVisitModal.hide();
        document.getElementById("manualVisitForm").reset();
        if (typeof showNotification === 'function') showNotification("Visita añadida correctamente", "success");
        fetchData();
      } else {
        alert("Error al guardar la visita manual.");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  });

  fetchData();
});
