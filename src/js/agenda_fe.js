const API_BASE_URL = "http://localhost:3000/api";

      document.addEventListener('DOMContentLoaded', function() {
        const tableBody = document.getElementById('agenda-table-body');
        const selectAnio = document.getElementById('select-anio-agenda');
        const btnNew = document.getElementById('btn-new-agreement');
        const btnSave = document.getElementById('btn-save-agreement');
        const btnDelete = document.getElementById('btn-delete-agreement');
        const form = document.getElementById('agreementForm');
        const modalTitle = document.getElementById('addAgreementModalLabel');
        const agreementModal = new bootstrap.Modal(document.getElementById('addAgreementModal'));

        let agendaDataRaw = []; // Almacenamos los datos para acceder a ellos al editar

        // Limpiar checkboxes al cerrar modal
        document.getElementById('addAgreementModal').addEventListener('hidden.bs.modal', () => {
          document.querySelectorAll('.month-check').forEach(chk => chk.checked = false);
          document.getElementById('edit-rol-id').value = '';
          document.getElementById('dia_rp').value = '6';
          document.getElementById('hora_h').value = '09';
          document.getElementById('hora_m').value = '00';
          document.getElementById('hora_p').value = 'AM';
          btnDelete.style.display = 'none';
          form.reset();
        });

        // Establecer el año actual por defecto
        const anioActual = new Date().getFullYear();
        selectAnio.value = anioActual;

        // Función para formatear fechas de YYYY-MM-DD a DD-mes-YYYY
        function formatDate(dateStr) {
          if (!dateStr) return '--';
          const date = new Date(dateStr);
          const day = String(date.getDate()).padStart(2, '0');
          const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
          return `${day}-${months[date.getMonth()]}-${date.getFullYear()}`;
        }

        // Abrir modal para nuevo registro
        btnNew.addEventListener('click', () => {
          modalTitle.innerHTML = '<i class="bi bi-journal-plus me-2"></i>Nuevo Apunte de Acuerdo';
          agreementModal.show();
        });

        // Función para abrir modal en modo edición
        window.openEditModal = function(id) {
          const item = agendaDataRaw.find(i => i.id_rol.toString() === id.toString());
          if (!item) return;

          modalTitle.innerHTML = '<i class="bi bi-pencil-square me-2"></i>Editar Acuerdo';
          document.getElementById('edit-rol-id').value = item.id_rol;
          document.getElementById('fecha_ini').value = item.fecha_ini.split('T')[0];
          document.getElementById('fecha_fin').value = item.fecha_fin.split('T')[0];
          document.getElementById('congregacion').value = item.congregacion;
          document.getElementById('estatus').value = item.estatus;
          document.getElementById('dia_rp').value = item.dia_rp || '6';
          
          if (item.hora_reunion) {
            let [h, m] = item.hora_reunion.split(':');
            let hour = parseInt(h);
            let period = hour >= 12 ? 'PM' : 'AM';
            hour = hour % 12 || 12; // Convertir 0 a 12 para formato 12h
            document.getElementById('hora_h').value = hour.toString().padStart(2, '0');
            document.getElementById('hora_m').value = m;
            document.getElementById('hora_p').value = period;
          }

          document.getElementById('notas').value = item.notas;

          // Marcar checkboxes de meses
          if (item.meses_ids) {
            const ids = item.meses_ids.split(',');
            ids.forEach(idMes => {
              const chk = document.getElementById(`m${idMes}`);
              if (chk) chk.checked = true;
            });
          }

          btnDelete.style.display = 'block';
          agreementModal.show();
        };

        // Cargar datos de la agenda
        async function fetchAgenda() {
          const anio = selectAnio.value;
          try {
            const response = await fetch(`${API_BASE_URL}/agenda?anio=${anio}`);
            agendaDataRaw = await response.json();
            
            tableBody.innerHTML = '';
            agendaDataRaw.forEach(item => {
              const tr = document.createElement('tr');
              const badgeClass = item.estatus ? 'text-bg-success' : 'text-bg-secondary';
              const statusLabel = item.estatus ? 'Confirmado' : 'Pendiente';
              
              tr.innerHTML = `
                <td class="small">${formatDate(item.fecha_ini)}</td>
                <td class="small">${formatDate(item.fecha_fin)}</td>
                <td><span class="badge text-bg-info w-100">${item.meses_texto || 'S/M'}</span></td>
                <td>${item.congregacion}</td>
                <td><span class="badge ${badgeClass}">${statusLabel}</span></td>
                <td class="text-muted small">${item.notas || ''}</td>
                <td class="text-center">
                  <button class="btn btn-sm btn-outline-secondary" onclick="openEditModal(${item.id_rol})" title="Editar"><i class="bi bi-pencil"></i></button>
                </td>
              `;
              tableBody.appendChild(tr);
            });
          } catch (error) {
            console.error('Error al cargar agenda:', error);
          }
        }

        // Guardar nuevo acuerdo
        btnSave.addEventListener('click', async () => {
          const id = document.getElementById('edit-rol-id').value;
          // Obtener meses seleccionados
          const mesesSeleccionados = Array.from(document.querySelectorAll('.month-check:checked'))
          .map(chk => parseInt(chk.value));

          // Construir hora en formato HH:mm:ss para la base de datos
          const h = parseInt(document.getElementById('hora_h').value);
          const m = document.getElementById('hora_m').value;
          const p = document.getElementById('hora_p').value;
          
          let hour24 = h;
          if (p === 'PM' && h < 12) hour24 += 12;
          if (p === 'AM' && h === 12) hour24 = 0;
          const timeStr = `${hour24.toString().padStart(2, '0')}:${m}:00`;

          const formData = {
            fecha_ini: document.getElementById('fecha_ini').value,
            fecha_fin: document.getElementById('fecha_fin').value,
            congregacion: document.getElementById('congregacion').value,
            dia_rp: parseInt(document.getElementById('dia_rp').value),
            hora_reunion: timeStr,
            estatus: parseInt(document.getElementById('estatus').value),
            notas: document.getElementById('notas').value,
            meses: mesesSeleccionados
          };

          if (!formData.fecha_ini || !formData.fecha_fin || !formData.congregacion) {
            alert('Por favor complete los campos obligatorios.');
            return;
          }

          if (mesesSeleccionados.length === 0) {
            alert('Debe seleccionar al menos un mes agendado.');
            return;
          }

          try {
            const url = id ? `${API_BASE_URL}/agenda/${id}` : `${API_BASE_URL}/agenda`;
            const method = id ? 'PUT' : 'POST';

            const response = await fetch(url, {
              method: method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(formData)
            });

            if (response.ok) {
              agreementModal.hide();
              fetchAgenda();
            }
          } catch (error) {
            console.error('Error al guardar:', error);
          }
        });

        // Eliminar acuerdo
        btnDelete.addEventListener('click', async () => {
          const id = document.getElementById('edit-rol-id').value;
          if (!id || !confirm('¿Está seguro de que desea eliminar este acuerdo?')) return;

          try {
            const response = await fetch(`${API_BASE_URL}/agenda/${id}`, {
              method: 'DELETE'
            });

            if (response.ok) {
              agreementModal.hide();
              fetchAgenda();
            }
          } catch (error) {
            console.error('Error al guardar:', error);
          }
        });

        // Escuchar cambios en el selector de año
        selectAnio.addEventListener('change', fetchAgenda);

        // Carga inicial
        fetchAgenda();
      });
    