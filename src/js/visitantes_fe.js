document.addEventListener("DOMContentLoaded", async function () {
  const API_BASE_URL = 'http://localhost:3000/api';
  console.log('[visitantes] visitantes_fe.js cargado');
  const horaEl = document.getElementById("local-hora");
        const diaEl = document.getElementById("local-dia");
        const congEl = document.getElementById("local-congregacion");
        const tablaVisitasBody = document.getElementById("tabla-visitas-body");
        let bosquejosList = []; // Almacenará la lista de bosquejos para el autocompletado
        let tiposReunionEspecial = []; // Tipos cargados desde la DB

        // Mapeo constante para asignar identificadores a los dias de la semana
        const diasSemanaMap = {
          1: "Lunes",
          2: "Martes",
          3: "Miércoles",
          4: "Jueves",
          5: "Viernes",
          6: "Sábado",
          7: "Domingo",
        };

        let currentLocalData = null;
        let isEditingProgram = false;

        const selectMes = document.getElementById("select-mes");
        const selectAnio = document.getElementById("select-anio");
        const btnEditProgram = document.getElementById("btn-edit-program");
        const btnExportPdf = document.getElementById("btn-export-pdf");
        const btnSaveProgram = document.getElementById("btn-save-program");

        // Establecer mes y año actuales por defecto
        const today = new Date();
        const currentYear = today.getFullYear();

        // Intentar recuperar el mes y año guardados de la sesión
        const savedMes = sessionStorage.getItem("visitantes_mes");
        const savedAnio = sessionStorage.getItem("visitantes_anio");

        // Establecer mes inicial (el guardado o el actual por defecto)
        if (savedMes !== null) {
          selectMes.value = savedMes;
        } else {
          selectMes.value = today.getMonth().toString();
        }

        // Generar opciones de año dinámicamente (año actual y los dos siguientes)
        selectAnio.innerHTML = ""; // Limpiar opciones existentes
        for (let i = -5; i <= 3; i++) { // Mostrar 5 años atrás, el actual y 5 años adelante
          const year = currentYear + i;
          selectAnio.innerHTML += `<option value="${year}">${year}</option>`;
        }

        // Establecer año inicial (el guardado o el actual por defecto)
        if (savedAnio !== null) {
          selectAnio.value = savedAnio;
        } else {
          selectAnio.value = currentYear.toString();
        }

        // Lógica para alternar el modo edición
        btnEditProgram.addEventListener("click", () => {
          isEditingProgram = !isEditingProgram;
          if (isEditingProgram) {
            btnEditProgram.innerHTML =
              '<i class="bi bi-x-circle-fill me-1"></i> Cancelar';
            btnEditProgram.className = "btn btn-sm btn-outline-danger";
            btnSaveProgram.style.display = "block";
            btnExportPdf.style.display = "none";
          } else {
            btnEditProgram.innerHTML =
              '<i class="bi bi-pencil-fill me-1"></i> Editar';
            btnEditProgram.className = "btn btn-sm btn-outline-primary";
            btnSaveProgram.style.display = "none";
            btnExportPdf.style.display = "block";
          }
          updateProgramacionTable();
        });

        // --- Lógica para Exportación a PDF ---
        const configPdfModalEl = document.getElementById("configPdfModal");
        const configPdfModal = configPdfModalEl ? new bootstrap.Modal(configPdfModalEl) : null;
        const pdfSelectAnio = document.getElementById("pdf-select-anio");
        const btnPdfSelectAll = document.getElementById("btn-pdf-select-all");
        const btnGeneratePdfFinal = document.getElementById("btn-generate-pdf-final");

        // Poblar select de año del modal PDF con las mismas opciones que el principal (si existe)
        if (pdfSelectAnio) {
          pdfSelectAnio.innerHTML = selectAnio.innerHTML;
          pdfSelectAnio.value = selectAnio.value;
        } else {
          console.warn('[visitantes] pdf-select-anio no encontrado en el DOM');
        }

        if (btnExportPdf && configPdfModal) {
          btnExportPdf.addEventListener("click", () => configPdfModal.show());
        } else if (!btnExportPdf) {
          console.warn('[visitantes] btn-export-pdf no encontrado');
        }

        // Lógica de "Seleccionar todos / Desmarcar todos"
        if (btnPdfSelectAll) {
          btnPdfSelectAll.addEventListener("click", () => {
            const checks = document.querySelectorAll(".pdf-month-check");
            const allChecked = Array.from(checks).every((c) => c.checked);
            checks.forEach((c) => (c.checked = !allChecked));
            btnPdfSelectAll.textContent = allChecked
              ? "Seleccionar todos"
              : "Desmarcar todos";
          });
        }

        if (btnGeneratePdfFinal) {
          btnGeneratePdfFinal.addEventListener("click", async () => {
            const anio = pdfSelectAnio ? pdfSelectAnio.value : selectAnio.value;
            const mesesSeleccionados = Array.from(
              document.querySelectorAll(".pdf-month-check:checked"),
            ).map((c) => parseInt(c.value));

            if (mesesSeleccionados.length === 0) {
              showNotification("Por favor seleccione al menos un mes.", "danger");
              return;
            }

            await generateProgramacionPDF(anio, mesesSeleccionados);
            if (configPdfModal) configPdfModal.hide();
          });
        }

        async function generateProgramacionPDF(anio, meses) {
          const { jsPDF } = window.jspdf;
          const doc = new jsPDF("p", "mm", "a4");
          const mesesNombres = [
            "ENERO",
            "FEBRERO",
            "MARZO",
            "ABRIL",
            "MAYO",
            "JUNIO",
            "JULIO",
            "AGOSTO",
            "SEPTIEMBRE",
            "OCTUBRE",
            "NOVIEMBRE",
            "DICIEMBRE",
          ];
          const targetDay = currentLocalData.dia_rp % 7;
          const defaultTime = currentLocalData.hora_reunion.substring(0, 5);

          let currentY = 15;

          for (const mes of meses) {
            // Obtener datos del mes desde el servidor
            const response = await fetch(
              `${API_BASE_URL}/visitantes-programacion?mes=${mes}&anio=${anio}`,
            );
            const programData = await response.json();

            const tableRows = [];
            let date = new Date(anio, mes, 1, 12, 0, 0);
            while (date.getMonth() === mes) {
              if (date.getDay() === targetDay) {
                const dayNum = date.getDate().toString().padStart(2, "0");
                const monthNum = (date.getMonth() + 1)
                  .toString()
                  .padStart(2, "0");
                const fullDateStr = `${anio}-${monthNum}-${dayNum}`;

                const dataRow = programData.find((p) => {
                  const pDateStr = p.fecha_discurso.split("T")[0];
                  return pDateStr === fullDateStr;
                });

                tableRows.push([
                  dataRow?.nombre || "--",
                  dataRow?.num_bosquejo || "--",
                  dataRow?.tema || "Sin asignar",
                  dataRow?.cancion || "--",
                  dataRow?.congregacion || "--",
                  `${dayNum}/${monthNum}`,
                ]);
              }
              date.setDate(date.getDate() + 1);
            }

            // Estimar la altura de la sección del mes actual para evitar que se parta entre hojas
            // Encabezado (~20mm) + Tabla (cabecera + filas, aprox 10mm cada una)
            const estimatedHeight = 25 + (tableRows.length + 1) * 10;

            // Si el contenido no cabe en la hoja actual (considerando un margen inferior), añadir una página nueva
            if (currentY + estimatedHeight > 280) {
              doc.addPage();
              currentY = 15;
            }

            // Título y encabezado por mes con posición dinámica usando currentY
            doc.setFontSize(16);
            doc.setTextColor(0, 119, 182);
            doc.text(
              `PROGRAMA DE DISCURSOS PÚBLICOS - ${mesesNombres[mes]} ${anio}`,
              105,
              currentY,
              { align: "center" },
            );

            doc.setFontSize(11);
            doc.setTextColor(80);
            doc.text(
              `Congregación: ${currentLocalData.congregacion}`,
              14,
              currentY + 10,
            );
            doc.text(
              `Día y hora: ${currentLocalData.nombre_dia} - ${defaultTime}`,
              14,
              currentY + 16,
            );

            doc.autoTable({
              startY: currentY + 22,
              head: [
                [
                  "Discursante",
                  "Núm.",
                  "Título del Discurso",
                  "Cant.",
                  "Congregación",
                  "Fecha",
                ],
              ],
              body: tableRows,
              theme: "grid",
              headStyles: {
                fillColor: [0, 119, 182],
                textColor: [255, 255, 255],
                fontStyle: "bold",
                halign: "center",
              },
              styles: { fontSize: 10, cellPadding: 4, valign: "middle" },
              alternateRowStyles: { fillColor: [202, 240, 248] },
              columnStyles: {
                1: { halign: "center", cellWidth: 15 },
                3: { halign: "center", cellWidth: 15 },
                5: { halign: "center", cellWidth: 20, fontStyle: "bold" },
              },
            });

            // Actualizar la posición vertical para la siguiente tabla con un espacio de separación
            currentY = doc.lastAutoTable.finalY + 15;
          }

          doc.save(`Programa_Visitantes_${anio}.pdf`);
        }

        // Función para obtener el icono de estatus basado en la lógica de semáforo
        function getStatusIcon(num, asistio = false) {
          if (asistio) {
            return '<i class="bi bi-p-circle-fill text-success fs-5" title="Discurso presentado"></i>';
          }
          if (!num) return "";
          // Buscar el bosquejo en la lista cargada (comparación flexible de número)
          const b = bosquejosList.find((item) => item.num == num);
          if (!b) return "";

          const now = new Date();
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(now.getMonth() - 3);
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(now.getMonth() - 6);

          if (!b.fecha_ult) {
            // Verde + Palomita: Disponible
            return '<i class="bi bi-check-circle-fill text-success fs-5" title="Disponible"></i>';
          } else {
            const lastDate = new Date(b.fecha_ult);
            if (lastDate >= threeMonthsAgo) {
              // Rojo + X: Muy reciente
              return '<i class="bi bi-x-circle-fill text-danger fs-5" title="Muy reciente (menos de 3 meses)"></i>';
            } else if (lastDate >= sixMonthsAgo) {
              // Naranja + X: Reciente
              return '<i class="bi bi-x-circle-fill fs-5" style="color: #fd7e14;" title="Reciente (entre 3 y 6 meses)"></i>';
            } else {
              // Amarillo + P: Presentado hace mucho tiempo
              return '<i class="bi bi-p-circle-fill text-warning fs-5" title="Presentado hace más de 6 meses"></i>';
            }
          }
        }

        // Función para generar las filas de la tabla según el mes/año y el día de reunión
        async function updateProgramacionTable() {
          if (!currentLocalData) {
            // Si no hay datos locales, mostrar mensaje informativo
            tablaVisitasBody.innerHTML = '<tr><td colspan="9" class="text-center p-4 text-muted"><i class="bi bi-info-circle me-2"></i>Por favor, configura la reunión local primero.</td></tr>';
            return;
          }

          const mes = parseInt(selectMes.value);
          const anio = parseInt(selectAnio.value);
          const targetDay = currentLocalData.dia_rp % 7; // Convertir 7 (Dom) a 0 para JS
          const defaultTime = currentLocalData.hora_reunion.substring(0, 5);
          const mesesShort = [
            "ene",
            "feb",
            "mar",
            "abr",
            "may",
            "jun",
            "jul",
            "ago",
            "sep",
            "oct",
            "nov",
            "dic",
          ];

          try {
            // Obtener la programación guardada para este mes/año
            const response = await fetch(
              `${API_BASE_URL}/visitantes-programacion?mes=${mes}&anio=${anio}`,
            );
            const programacion = response.ok ? await response.json() : [];
            console.log("[visitantes] programacion", { mes, anio, count: programacion.length, targetDay, rows: programacion });
            const hoyStr = new Date().toISOString().split('T')[0];

            tablaVisitasBody.innerHTML = "";

            // Usamos las 12:00 PM para evitar desfases por cambios de horario (DST) en la medianoche
            let date = new Date(anio, mes, 1, 12, 0, 0);
            let renderedRows = 0;
            while (date.getMonth() === mes) {
              if (date.getDay() === targetDay) {
                renderedRows += 1;
                const dayNum = date.getDate().toString().padStart(2, "0");
                const monthNum = (date.getMonth() + 1)
                  .toString()
                  .padStart(2, "0");
                const fullDateStr = `${anio}-${monthNum}-${dayNum}`; // Formato YYYY-MM-DD para comparar
                const displayDateStr = `${dayNum}-${mesesShort[mes]}`;
                const esFuturo = fullDateStr > hoyStr;

                // Buscar si hay datos guardados para esta fecha específica
                const dataRow = Array.isArray(programacion) 
                  ? programacion.find((p) => {
                  const pDateStr = p.fecha_discurso?.split(/[T ]/)[0];
                  return pDateStr === fullDateStr;
                }) : null;

                const tr = document.createElement("tr");
                tr.dataset.fecha = fullDateStr; // Guardamos la fecha real para el guardado
                const isConfirmed =
                  dataRow?.asistio === 1 || dataRow?.asistio === true;
                tr.dataset.asistio = isConfirmed ? 1 : 0;

                if (isEditingProgram) {
                  // Generar el menú desplegable (flecha)
                  let specialMenuHtml = '';
                  if (tiposReunionEspecial.length > 0) {
                    specialMenuHtml = `
                      <div class="dropdown">
                        <button class="btn btn-xs btn-outline-secondary dropdown-toggle border-0" type="button" 
                                data-bs-toggle="dropdown" aria-expanded="false" data-bs-boundary="viewport" title="Evento especial">
                          <i class="bi bi-chevron-down text-primary"></i>
                        </button>
                        <ul class="dropdown-menu shadow">
                          ${tiposReunionEspecial.map(tipo => `<li><a class="dropdown-item btn-select-special" href="#">${tipo.tipo_reunion}</a></li>`).join('')}
                        </ul>
                      </div>
                    `;
                  }

                  tr.innerHTML = `
                    <td><input type="text" class="form-control form-control-sm" placeholder="Nombre" value="${dataRow?.nombre || ""}"></td>
                    <td><input type="text" class="form-control form-control-sm text-center num-input" value="${dataRow?.num_bosquejo || ""}"></td>
                    <td><input type="text" class="form-control form-control-sm tema-input" list="bosquejos-list" placeholder="Tema" value="${dataRow?.tema || ""}"></td>
                    <td class="text-center status-cell">
                      ${specialMenuHtml}
                    </td>
                    <td><input type="text" class="form-control form-control-sm text-center cancion-input" value="${dataRow?.cancion || ""}"></td>
                    <td><input type="text" class="form-control form-control-sm" placeholder="Congregación" value="${dataRow?.congregacion || ""}"></td>
                    <td class="text-center text-muted">${defaultTime}</td>
                    <td class="text-center fw-bold text-secondary">${displayDateStr}</td>
                    <td class="text-center">--</td>
                  `;
                  // Si al cargar ya es un evento especial, resaltamos la fila
                  if (dataRow?.nombre === "-----") tr.classList.add("table-info");
                } else {
                  if (isConfirmed) tr.classList.add("table-success"); // Fondo verde suave
                  tr.innerHTML = `
                    <td>
                      <i class="bi bi-person-circle text-primary me-2"></i>
                      <strong>${dataRow?.nombre || '<span class="text-muted">Sin asignar</span>'}</strong>
                    </td>
                    <td class="text-center"><span class="badge text-bg-light border">${dataRow?.num_bosquejo || "--"}</span></td>
                    <td>${dataRow?.tema || '<span class="text-muted italic">Sin asignar</span>'}</td>
                    <td class="text-center">${getStatusIcon(dataRow?.num_bosquejo, isConfirmed)}</td>
                    <td class="text-center">${dataRow?.cancion ? "" + dataRow.cancion : "--"}</td>
                    <td><small class="text-muted">${dataRow?.congregacion || "--"}</small></td>
                    <td class="text-center text-muted"><small>${defaultTime}</small></td>
                    <td class="text-center fw-bold text-secondary">${displayDateStr}</td>
                    <td class="text-center">
                      ${
                        dataRow?.num_bosquejo
                          ? isConfirmed // Si ya está confirmado
                            ? `<button class="btn btn-sm btn-success btn-unconfirm-attendance"
                                 data-num="${dataRow.num_bosquejo}"
                                 data-fecha="${fullDateStr}"
                                 title="Quitar confirmación de asistencia">
                                 <i class="bi bi-check-all"></i> Confirmado
                               </button>` // Botón para desconfirmar
                            : `<button class="btn btn-sm btn-outline-success btn-confirm-attendance ${esFuturo ? 'disabled' : ''}"
                                 data-num="${dataRow.num_bosquejo}"
                                 data-fecha="${fullDateStr}"
                                 ${esFuturo ? 'disabled' : ''}
                                 title="${esFuturo ? 'No se puede confirmar un discurso futuro' : 'Confirmar asistencia'}">
                                 <i class="bi bi-check-lg"></i> Confirmar
                               </button>` // Botón para confirmar
                          : "--"
                      }
                    </td>
                  `;
                }
                tablaVisitasBody.appendChild(tr);
              }
              date.setDate(date.getDate() + 1);
            }
            console.log("[visitantes] renderedRows", renderedRows);
          } catch (error) {
            console.error("Error al cargar la programación:", error);
          }
        }

        // Función para guardar todos los cambios de la tabla
        btnSaveProgram.addEventListener("click", async () => {
          const rows = document.querySelectorAll("#tabla-visitas-body tr");
          const programacion = [];
          const mes = selectMes.value;
          const anio = selectAnio.value;

          rows.forEach((row) => {
            const inputs = row.querySelectorAll("input");
            if (inputs.length > 0) {
              programacion.push({
                nombre: inputs[0].value,
                num_bosquejo: inputs[1].value,
                tema: inputs[2].value,
                cancion: inputs[3].value,
                congregacion: inputs[4].value,
                fecha_discurso: row.dataset.fecha,
                asistio: parseInt(row.dataset.asistio) || 0,
              });
            }
          });

          try {
            const response = await fetch(
              `${API_BASE_URL}/visitantes-programacion`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mes, anio, programacion }),
              },
            );

            if (response.ok) {
              showNotification(
                "Programación mensual guardada con éxito.",
                "success",
              );
              btnEditProgram.click(); // Salir del modo edición automáticamente
            } else {
              showNotification("Hubo un error al intentar guardar.", "danger");
            }
          } catch (error) {
            showNotification("Error de conexión con el servidor.", "danger");
          }
        });

        // Lógica para autocompletar el número de bosquejo al seleccionar un tema de la lista
        tablaVisitasBody.addEventListener("input", (e) => {
          if (e.target.classList.contains("tema-input")) {
            const selectedTitle = e.target.value;
            const bosquejo = bosquejosList.find(
              (b) => b.titulo === selectedTitle,
            );
            const row = e.target.closest("tr");
            const isConfirmed = parseInt(row.dataset.asistio) === 1;
            const numInput = row.querySelector(".num-input");
            const statusCell = row.querySelector(".status-cell");

            if (bosquejo) {
              if (numInput) numInput.value = bosquejo.num;
              if (statusCell)
                statusCell.innerHTML = getStatusIcon(bosquejo.num, isConfirmed);
            } else {
              // Si el título no coincide o se borra, se limpia el estatus
              if (statusCell) statusCell.innerHTML = "";
            }
          }

          // También actualizar si se cambia el número directamente
          if (e.target.classList.contains("num-input")) {
            const num = e.target.value;
            const row = e.target.closest("tr");
            const isConfirmed = parseInt(row.dataset.asistio) === 1;
            const statusCell = row.querySelector(".status-cell");
            if (statusCell) {
              statusCell.innerHTML = getStatusIcon(num, isConfirmed);
            }
          }
        });

        // Manejar selección de reunión especial desde el dropdown
        tablaVisitasBody.addEventListener("click", (e) => {
          if (e.target.classList.contains("btn-select-special")) {
            e.preventDefault();
            const row = e.target.closest("tr");
            const temaInput = row.querySelector(".tema-input");
            if (temaInput) {
              temaInput.value = e.target.textContent;
              
              // Llenar los demás campos con "-----" y resaltar la fila en azul claro
              row.querySelectorAll("input").forEach(input => {
                if (!input.classList.contains("tema-input")) {
                  input.value = "-----";
                }
              });
              row.classList.add("table-info");
            }
          }
        });

        // Lógica para confirmar asistencia
        const confirmAttendanceModal = new bootstrap.Modal(
          document.getElementById("confirmAttendanceModal"),
        );
        const btnConfirmAttendanceFinal = document.getElementById(
          "btn-confirm-attendance-final",
        );
        let pendingAttendanceData = null;

        tablaVisitasBody.addEventListener("click", (e) => {
          const confirmBtn = e.target.closest(".btn-confirm-attendance");
          if (confirmBtn) {
            // Evitar que el modal se abra si el botón está deshabilitado
            if (confirmBtn.hasAttribute('disabled') || confirmBtn.classList.contains('disabled')) return;

            pendingAttendanceData = {
              num: confirmBtn.dataset.num,
              fecha: confirmBtn.dataset.fecha,
            };
            confirmAttendanceModal.show();
          }
        });

        btnConfirmAttendanceFinal.addEventListener("click", async () => {
          if (!pendingAttendanceData) return;
          try {
            const response = await fetch(
              `${API_BASE_URL}/confirmar-asistencia`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(pendingAttendanceData),
              },
            );

            if (response.ok) {
              confirmAttendanceModal.hide();
              showNotification(
                "Asistencia confirmada y registro actualizado.",
                "success",
              );
              fetchBosquejosList(); // Refrescar iconos semáforo para ver el cambio de estatus
              updateSystemNotifications(); // Quitar notificación de "Confirmar orador" automáticamente
            } else {
              const error = await response.json();
              showNotification(
                error.error || "Error al confirmar asistencia",
                "danger",
              );
            }
          } catch (error) {
            showNotification("Error de conexión con el servidor.", "danger");
          }
        });

        // --- NUEVA LóGICA PARA QUITAR CONFIRMACIóN DE ASISTENCIA ---
        const unconfirmAttendanceModal = new bootstrap.Modal(
          document.getElementById("unconfirmAttendanceModal"),
        );
        const btnUnconfirmAttendanceFinal = document.getElementById(
          "btn-unconfirm-attendance-final",
        );
        let pendingUnconfirmData = null;

        tablaVisitasBody.addEventListener("click", (e) => {
          const unconfirmBtn = e.target.closest(".btn-unconfirm-attendance");
          if (unconfirmBtn) {
            pendingUnconfirmData = {
              num: unconfirmBtn.dataset.num,
              fecha: unconfirmBtn.dataset.fecha,
            };
            // Mostrar los datos en el modal para confirmación visual
            document.getElementById("unconfirm-bosquejo-num").textContent = pendingUnconfirmData.num;
            document.getElementById("unconfirm-fecha").textContent = new Date(pendingUnconfirmData.fecha).toLocaleDateString('es-MX');
            unconfirmAttendanceModal.show();
          }
        });

        btnUnconfirmAttendanceFinal.addEventListener("click", async () => {
          if (!pendingUnconfirmData) return;
          try {
            const response = await fetch(
              `${API_BASE_URL}/desconfirmar-asistencia`, // Nuevo endpoint para desconfirmar
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(pendingUnconfirmData),
              },
            );

            if (response.ok) {
              unconfirmAttendanceModal.hide();
              showNotification(
                "Confirmación de asistencia eliminada y registro revertido.",
                "success",
              );
              fetchBosquejosList(); // Refrescar iconos semáforo y botones
            } else {
              const error = await response.json();
              showNotification(error.error || "Error al quitar confirmación de asistencia", "danger");
            }
          } catch (error) {
            showNotification("Error de conexión con el servidor.", "danger");
          }
        });

        // Escuchar cambios en los selectores para actualizar tabla y persistir estado
        selectMes.addEventListener("change", () => {
          sessionStorage.setItem("visitantes_mes", selectMes.value);
          updateProgramacionTable();
        });

        selectAnio.addEventListener("change", () => {
          sessionStorage.setItem("visitantes_anio", selectAnio.value);
          updateProgramacionTable();
        });

        const editLocalModal = new bootstrap.Modal(
          document.getElementById("editLocalModal"),
        );

        async function fetchInfoLocal() {
          try {
            const response = await fetch(
              `${API_BASE_URL}/reunion-local`,
            );
            if (!response.ok)
              throw new Error("No se pudo obtener la información");

            currentLocalData = await response.json();
            console.log("[visitantes] reunion-local", currentLocalData);

            // Formatear hora (de HH:mm:ss a 12h AM/PM)
            const [h, m] = currentLocalData.hora_reunion.split(":");
            const h24 = parseInt(h);
            const ampm = h24 >= 12 ? "PM" : "AM";
            const h12 = h24 % 12 || 12;
            horaEl.textContent = `${h12.toString().padStart(2, "0")}:${m} ${ampm}`;
            diaEl.textContent = currentLocalData.nombre_dia;
            congEl.textContent = currentLocalData.congregacion;

            // Una vez que tenemos los datos locales, generamos la tabla inicial
            updateProgramacionTable();
          } catch (error) {
            console.error("[visitantes] Error al cargar datos locales:", error);
            tablaVisitasBody.innerHTML = '<tr><td colspan="9" class="text-center p-4 text-danger"><i class="bi bi-exclamation-triangle me-2"></i>Error al cargar la configuración. Asegúrate que el servidor está corriendo.</td></tr>';
          }
        }

        async function fetchBosquejosList() {
          try {
            const response = await fetch(`${API_BASE_URL}/bosquejos`);
            if (!response.ok)
              throw new Error("Error al obtener lista de bosquejos");

            bosquejosList = await response.json();
            const datalist = document.getElementById("bosquejos-list");
            datalist.innerHTML = bosquejosList
              .map((b) => `<option value="${b.titulo}">`)
              .join("");
            updateProgramacionTable(); // Actualizar iconos una vez cargada la lista
          } catch (error) {
            console.error("Error al cargar la lista de bosquejos:", error);
          }
        }

        async function fetchTiposReunion() {
          try {
            const response = await fetch(`${API_BASE_URL}/reuniones-especiales-tipos`);
            if (response.ok) {
              tiposReunionEspecial = await response.json();
              // Si el usuario ya está viendo la tabla, refrescamos para mostrar los menús
              if (isEditingProgram) updateProgramacionTable();
            }
          } catch (error) {
            console.error("Error al cargar tipos de reunión:", error);
          }
        }

        function fetchDays() {
          const select = document.getElementById("edit-local-dia");
          select.innerHTML = Object.entries(diasSemanaMap)
            .map(([id, nombre]) => `<option value="${id}">${nombre}</option>`)
            .join("");
        }

        document
          .getElementById("btn-edit-local")
          .addEventListener("click", async () => {
            if (!currentLocalData) return;

            fetchDays();

            document.getElementById("edit-local-id").value =
              currentLocalData.id_reunion;
            document.getElementById("edit-local-dia").value =
              currentLocalData.dia_rp;
            document.getElementById("edit-local-hora").value =
              currentLocalData.hora_reunion.substring(0, 5);
            document.getElementById("edit-local-congregacion").value =
              currentLocalData.congregacion;

            editLocalModal.show();
          });

        document
          .getElementById("btn-save-local")
          .addEventListener("click", async () => {
            const id = document.getElementById("edit-local-id").value;
            const body = {
              dia_rp: document.getElementById("edit-local-dia").value,
              hora_reunion: document.getElementById("edit-local-hora").value,
              congregacion: document.getElementById("edit-local-congregacion")
                .value,
            };

            try {
              const response = await fetch(
                `${API_BASE_URL}/reunion-local/${id}`,
                {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(body),
                },
              );

              if (response.ok) {
                editLocalModal.hide();
                showNotification(
                  "Datos de la reunión actualizados.",
                  "success",
                );
                fetchInfoLocal();
              } else {
                const errorData = await response.json();
                showNotification(
                  errorData.error || "Error al actualizar.",
                  "danger",
                );
              }
            } catch (error) {
              showNotification("Error de conexión con el servidor.", "danger");
            }
          });

        function showNotification(message, type = "success") {
          const toastContainer = document.getElementById("toastContainer");
          const toastId = "toast-" + Date.now();
          const bgClass =
            type === "success" ? "text-bg-success" : "text-bg-danger";
          const icon =
            type === "success"
              ? "bi-check-circle-fill"
              : "bi-exclamation-triangle-fill";

          const toastHTML = `
            <div id="${toastId}" class="toast align-items-center ${bgClass} border-0" role="alert" aria-live="assertive" aria-atomic="true">
              <div class="d-flex">
                <div class="toast-body">
                  <div class="d-flex align-items-center">
                    <i class="bi ${icon} fs-5 me-2"></i>
                    <div>${message}</div>
                  </div>
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
              </div>
            </div>
          `;

          toastContainer.insertAdjacentHTML("beforeend", toastHTML);
          const toastElement = document.getElementById(toastId);
          const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
          toast.show();
          toastElement.addEventListener("hidden.bs.toast", () =>
            toastElement.remove(),
          );
        }

        fetchInfoLocal();
        fetchBosquejosList();
        fetchTiposReunion();
      });
    
