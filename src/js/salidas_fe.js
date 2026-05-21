const API_BASE_URL = "http://localhost:3000/api";

      document.addEventListener("DOMContentLoaded", function () {
        const selectMes = document.getElementById("select-mes-salidas");
        const selectAnio = document.getElementById("select-anio-salidas");
        const congEl = document.getElementById("local-congregacion");
        const diaEl = document.getElementById("local-dia");
        const horaEl = document.getElementById("local-hora");
        const tablaSalidasBody = document.getElementById("tabla-salidas-body");
        const btnEditSalidas = document.getElementById("btn-edit-salidas");
        const btnSaveSalidas = document.getElementById("btn-save-salidas");
        const btnExportPdf = document.getElementById("btn-export-pdf");
        const configPdfModal = new bootstrap.Modal(
          document.getElementById("configPdfModal"),
        );
        const pdfSelectAnio = document.getElementById("pdf-select-anio");
        const btnPdfSelectAll = document.getElementById("btn-pdf-select-all");
        const btnGeneratePdfFinal = document.getElementById(
          "btn-generate-pdf-final",
        );

        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        // Intentar recuperar el mes y año guardados de la sesión
        const savedMes = sessionStorage.getItem("salidas_mes");
        const savedAnio = sessionStorage.getItem("salidas_anio");

        let currentConfirmedAgenda = null;
        let isEditingSalidas = false;
        let oradoresLocalesTemas = [];
        let allOradoresTemasRaw = []; // Almacena la lista completa para filtrar temas

        // Configuración inicial de selectores
        if (selectMes) {
          selectMes.value = savedMes !== null ? savedMes : currentMonth.toString();
        }

        if (selectAnio) {
          for (let i = 0; i < 3; i++) {
            const year = currentYear + i;
            selectAnio.innerHTML += `<option value="${year}">${year}</option>`;
          }
          selectAnio.value = savedAnio !== null ? savedAnio : currentYear.toString();

          if (pdfSelectAnio) {
            pdfSelectAnio.innerHTML = selectAnio.innerHTML;
            pdfSelectAnio.value = selectAnio.value;
          }
        }

        // Evento para abrir el modal de configuración de PDF
        btnExportPdf.addEventListener("click", () => {
          configPdfModal.show();
        });

        // Lógica de "Seleccionar todos / Desmarcar todos" en el modal PDF
        btnPdfSelectAll.addEventListener("click", () => {
          const checks = document.querySelectorAll(".pdf-month-check");
          const allChecked = Array.from(checks).every((c) => c.checked);
          checks.forEach((c) => (c.checked = !allChecked));
          btnPdfSelectAll.textContent = allChecked
            ? "Seleccionar todos"
            : "Desmarcar todos";
        });

        // Evento para generar el PDF final
        btnGeneratePdfFinal.addEventListener("click", async () => {
          const anio = pdfSelectAnio.value;
          const mesesSeleccionados = Array.from(
            document.querySelectorAll(".pdf-month-check:checked"),
          ).map((c) => parseInt(c.value));

          if (mesesSeleccionados.length === 0) {
            showNotification("Por favor seleccione al menos un mes.", "danger");
            return;
          }

          await generateSalidasPDF(anio, mesesSeleccionados);
          configPdfModal.hide();
        });

        async function generateSalidasPDF(anio, meses) {
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

          let currentY = 15;
          let generatedContent = false;

          for (const mes of meses) {
            // Obtener datos del rol confirmado para este mes (cada mes puede tener una congregación distinta)
            const agendaResponse = await fetch(
              `${API_BASE_URL}/agenda/confirmada?mes=${mes}&anio=${anio}`,
            );
            const agendaData = await agendaResponse.json();

            // Si no hay rol confirmado para ese mes, lo saltamos del reporte
            if (!agendaData || !agendaData.congregacion) continue;

            generatedContent = true;

            // Obtener programación de salidas guardada para ese mes
            const response = await fetch(
              `${API_BASE_URL}/salidas-programacion?mes=${mes}&anio=${anio}`,
            );
            const programData = await response.json();

            const targetDay = agendaData.dia_rp % 7;
            const displayTime = agendaData.hora_reunion
              ? agendaData.hora_reunion.substring(0, 5)
              : "--:--";

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
                  const pDateStr = p.fecha_salida.split("T")[0];
                  return pDateStr === fullDateStr;
                });

                tableRows.push([
                  dataRow?.nombre_orador || "--",
                  dataRow?.num_bosquejo || "--",
                  dataRow?.tema || "Sin asignar",
                  dataRow?.cancion || "--",
                  displayTime,
                  `${dayNum}/${monthNum}`,
                ]);
              }
              date.setDate(date.getDate() + 1);
            }

            // Estimar altura para salto de página (Encabezado + Tabla)
            const estimatedHeight = 25 + (tableRows.length + 1) * 10;

            if (currentY + estimatedHeight > 280) {
              doc.addPage();
              currentY = 15;
            }

            // Encabezado del mes
            doc.setFontSize(18);
            doc.setTextColor(0, 119, 182);
            doc.text(
              `PROGRAMA DE SALIDAS A DISCURSAR - ${mesesNombres[mes]} ${anio}`,
              105,
              currentY,
              { align: "center" },
            );

            doc.setFontSize(12);
            doc.setTextColor(80);
            doc.setFont(undefined, "bold");
            doc.text(
              `Congregación a visitar: ${agendaData.congregacion}`,
              14,
              currentY + 11,
            );
            doc.text(
              `Día y hora: ${agendaData.nombre_dia} - ${displayTime}`,
              14,
              currentY + 18,
            );
            doc.setFont(undefined, "normal");

            doc.autoTable({
              startY: currentY + 26,
              head: [
                [
                  "Discursante",
                  "Núm.",
                  "Título del Discurso",
                  "Cant.",
                  "Hora",
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
              styles: { fontSize: 11, cellPadding: 4, valign: "middle" },
              alternateRowStyles: { fillColor: [202, 240, 248] },
              columnStyles: {
                0: { fontStyle: "bold" },
                1: { halign: "center", cellWidth: 15 },
                3: { halign: "center", cellWidth: 15 },
                4: { halign: "center", cellWidth: 20, fontStyle: "bold" },
                5: { halign: "center", cellWidth: 22, fontStyle: "bold" },
              },
            });

            currentY = doc.lastAutoTable.finalY + 15;
          }

          if (!generatedContent) {
            showNotification(
              "No se encontraron roles confirmados para los meses seleccionados.",
              "danger",
            );
            return;
          }

          doc.save(`Programa_Salidas_${anio}.pdf`);
        }

        // Cargar lista de oradores locales para el autocompletado
        async function fetchOradoresLocales() {
          try {
            const response = await fetch(
              "${API_BASE_URL}/oradores-temas",
            );
            allOradoresTemasRaw = await response.json();

            // Creamos una lista única de oradores aprobados
            const uniqueSpeakers = new Map();
            allOradoresTemasRaw.forEach((item) => {
              if (item.aprobado === 1 && !uniqueSpeakers.has(item.id_orador)) {
                uniqueSpeakers.set(item.id_orador, {
                  id_orador: item.id_orador,
                  nombre: item.nombre,
                });
              }
            });
            oradoresLocalesTemas = Array.from(uniqueSpeakers.values());
          } catch (e) {
            console.error("Error cargando oradores:", e);
          }
        }

        // Alternar modo edición
        btnEditSalidas.addEventListener("click", () => {
          if (!currentConfirmedAgenda) {
            showNotification(
              "No hay un rol confirmado para este periodo. Primero agende el rol en la sección 'Agenda de roles'.",
              "danger"
            );
            return;
          }
          isEditingSalidas = !isEditingSalidas;
          btnEditSalidas.innerHTML = isEditingSalidas
            ? '<i class="bi bi-x-circle-fill me-1"></i> Cancelar'
            : '<i class="bi bi-pencil-fill me-1"></i> Editar Programa';
          btnEditSalidas.className = isEditingSalidas
            ? "btn btn-sm btn-outline-danger"
            : "btn btn-sm btn-outline-primary";
          btnSaveSalidas.style.display = isEditingSalidas ? "block" : "none";
          renderSalidasTable();
        });

        // Lógica de selección de orador en la tabla
        tablaSalidasBody.addEventListener("change", (e) => {
          const row = e.target.closest("tr");

          if (e.target.classList.contains("orador-select")) {
            const selectedId = e.target.value;
            const temaSelect = row.querySelector(".tema-select");

            // Limpiar campos dependientes
            row.querySelector(".num-input").value = "";
            row.querySelector(".cancion-input").value = "";
            delete row.dataset.idTituloOrador;

            if (selectedId !== "") {
              row.dataset.idOrador = selectedId;
              temaSelect.disabled = false;

              // Poblar el select de temas solo con los del orador seleccionado
              let topicOptions =
                '<option value="">-- Seleccionar tema --</option>';
              allOradoresTemasRaw
                .filter((t) => t.id_orador == selectedId && t.id_tituloOrador)
                .forEach((topic) => {
                  topicOptions += `<option value="${topic.id_tituloOrador}" data-num="${topic.numero_tema || ""}" data-cancion="${topic.cancion_sugerida || ""}">${topic.titulo}</option>`;
                });
              temaSelect.innerHTML = topicOptions;
            } else {
              temaSelect.disabled = true;
              temaSelect.innerHTML =
                '<option value="">-- Seleccionar tema --</option>';
              delete row.dataset.idOrador;
            }
          }

          if (e.target.classList.contains("tema-select")) {
            const opt = e.target.options[e.target.selectedIndex];
            if (opt.value !== "") {
              row.querySelector(".num-input").value = opt.dataset.num;
              row.querySelector(".cancion-input").value = opt.dataset.cancion;
              row.dataset.idTituloOrador = opt.value;
            } else {
              row.querySelector(".num-input").value = "";
              row.querySelector(".cancion-input").value = "";
              delete row.dataset.idTituloOrador;
            }
          }
        });

        async function renderSalidasTable() {
          if (!currentConfirmedAgenda) {
            tablaSalidasBody.innerHTML =
              '<tr><td colspan="6" class="text-center p-4 text-muted"><i class="bi bi-calendar-x me-2"></i>Sin rol confirmado para este periodo</td></tr>';
            return;
          }

          const mes = parseInt(selectMes.value);
          const anio = parseInt(selectAnio.value);

          // Sincronizamos con el día del acuerdo (6=Sab, 7=Dom) % 7 -> (6=Sab, 0=Dom)
          const targetDay = currentConfirmedAgenda.dia_rp % 7;
          // Usamos la hora del acuerdo para todas las filas del mes
          let displayTime = "--:--";
          if (currentConfirmedAgenda.hora_reunion) {
            const [h, m] = currentConfirmedAgenda.hora_reunion.split(":");
            const h24 = parseInt(h);
            const ampm = h24 >= 12 ? "PM" : "AM";
            const h12 = h24 % 12 || 12;
            displayTime = `${h12.toString().padStart(2, "0")}:${m} ${ampm}`;
          }

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
            const response = await fetch(
              `${API_BASE_URL}/salidas-programacion?mes=${mes}&anio=${anio}`,
            );
            const programacion = response.ok ? await response.json() : [];

            tablaSalidasBody.innerHTML = "";
            // Iteramos por todos los días del mes para encontrar los días de reunión (targetDay)
            let date = new Date(anio, mes, 1, 12, 0, 0);
            while (date.getMonth() === mes) {
              if (date.getDay() === targetDay) {
                const fullDateStr = new Date(
                  date.getTime() - date.getTimezoneOffset() * 60000,
                )
                  .toISOString()
                  .split("T")[0];
                const displayDateStr = `${date.getDate().toString().padStart(2, "0")}-${mesesShort[mes]}`;

                // Buscamos si ya hay datos guardados para esta fecha
                const data = Array.isArray(programacion)
                  ? programacion.find((p) => {
                      const pDateStr = p.fecha_salida.split("T")[0];
                      return pDateStr === fullDateStr;
                    })
                  : null;

                const tr = document.createElement("tr");
                tr.dataset.fecha = fullDateStr;

                if (isEditingSalidas) {
                  let options =
                    '<option value="">-- Seleccionar discursante --</option>';
                  oradoresLocalesTemas.forEach((speaker) => {
                    const isSelected =
                      data && data.id_orador === speaker.id_orador;
                    options += `
                      <option value="${speaker.id_orador}" ${isSelected ? "selected" : ""}>
                        ${speaker.nombre}
                      </option>`;
                  });

                  // Cargar temas si ya hay un orador guardado en esa fecha
                  let topicOptions =
                    '<option value="">-- Seleccionar tema --</option>';
                  if (data && data.id_orador) {
                    allOradoresTemasRaw
                      .filter(
                        (t) => t.id_orador === data.id_orador && t.id_tituloOrador,
                      )
                      .forEach((topic) => {
                        const isSelected =
                          data.id_tituloOrador === topic.id_tituloOrador;
                        topicOptions += `<option value="${topic.id_tituloOrador}" data-num="${topic.numero_tema || ""}" data-cancion="${topic.cancion_sugerida || ""}" ${isSelected ? "selected" : ""}>${topic.titulo}</option>`;
                      });
                  }

                  tr.innerHTML = `
                    <td><select class="form-select form-select-sm orador-select">${options}</select></td>
                    <td><input type="number" class="form-control form-control-sm text-center num-input" readonly value="${data?.num_bosquejo || ""}"></td>
                    <td><select class="form-select form-select-sm tema-select" ${data?.id_orador ? "" : "disabled"}>${topicOptions}</select></td>
                    <td><input type="number" class="form-control form-control-sm text-center cancion-input" readonly value="${data?.cancion || ""}"></td>
                    <td class="text-center text-muted"><small>${displayTime}</small></td>
                    <td class="text-center fw-bold text-secondary">${displayDateStr}</td>
                  `;
                  if (data) {
                    tr.dataset.idOrador = data.id_orador;
                    tr.dataset.idTituloOrador = data.id_tituloOrador;
                    tr.dataset.idTituloOrador = data.id_tituloOrador;
                    tr.dataset.idTituloOrador = data.id_tituloOrador;
                  }
                } else {
                  tr.innerHTML = `
                    <td><i class="bi bi-person-up text-primary me-2"></i><strong>${data?.nombre_orador || '<span class="text-muted">Por asignar</span>'}</strong></td>
                    <td class="text-center"><span class="badge text-bg-light border">${data?.num_bosquejo || "--"}</span></td>
                    <td><small>${data?.tema || '<span class="text-muted italic">Sin asignar</span>'}</small></td>
                    <td class="text-center">${data?.cancion || "--"}</td>
                    <td class="text-center text-muted"><small>${displayTime}</small></td>
                    <td class="text-center fw-bold text-secondary">${displayDateStr}</td>
                  `;
                }
                tablaSalidasBody.appendChild(tr);
              }
              date.setDate(date.getDate() + 1);
            }
          } catch (e) {
            console.error("Error al renderizar tabla:", e);
          }
        }

        // Función para verificar si hay un rol en la agenda para el periodo seleccionado
        async function fetchConfirmedSalida() {
          const mes = selectMes.value;
          const anio = selectAnio.value;
          try {
            const response = await fetch(
              `${API_BASE_URL}/agenda/confirmada?mes=${mes}&anio=${anio}`,
            );
            const data = await response.json();
            if (data && data.congregacion) {
              currentConfirmedAgenda = data;
              congEl.textContent = data.congregacion;
              congEl.classList.add("fw-bold", "text-primary");

              // Mostrar el nombre del día
              diaEl.textContent = data.nombre_dia || "--";

              // Formatear y mostrar la hora
              if (data.hora_reunion) {
                const [h, m] = data.hora_reunion.split(":");
                const h24 = parseInt(h);
                const ampm = h24 >= 12 ? "PM" : "AM";
                const h12 = h24 % 12 || 12;
                horaEl.textContent = `${h12.toString().padStart(2, "0")}:${m} ${ampm}`;
              } else {
                horaEl.textContent = "--:--";
              }
            } else {
              currentConfirmedAgenda = null;
              congEl.textContent = "Sin rol confirmado";
              congEl.classList.remove("fw-bold", "text-primary");
              diaEl.textContent = "--";
              horaEl.textContent = "--:--";
            }
            renderSalidasTable();
          } catch (error) {
            console.error("Error al obtener datos de salida:", error);
          }
        }

        // Guardar cambios
        btnSaveSalidas.addEventListener("click", async () => {
          const rows = document.querySelectorAll("#tabla-salidas-body tr");
          const programacion = [];

          if (!currentConfirmedAgenda || !currentConfirmedAgenda.id_rol) {
            showNotification(
              "No hay un rol confirmado válido para este periodo.",
              "danger"
            );
            return;
          }

          rows.forEach((row) => {
            const select = row.querySelector(".orador-select");
            if (select && select.value !== "") {
              programacion.push({
                id_tituloOrador: row.dataset.idTituloOrador,
                id_rol: currentConfirmedAgenda.id_rol,
                id_orador: row.dataset.idOrador,
                fecha_salida: row.dataset.fecha,
              });
            }
          });

          try {
            const response = await fetch(
              "${API_BASE_URL}/salidas-programacion",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  mes: selectMes.value,
                  anio: selectAnio.value,
                  programacion,
                }),
              },
            );
            if (response.ok) {
              showNotification("Programación de salidas guardada con éxito.", "success");
              btnEditSalidas.click();
            } else {
              showNotification("Error al guardar la programación.", "danger");
            }
          } catch (e) {
            console.error(e);
            showNotification("Error de conexión al guardar.", "danger");
          }
        });

        // Función para mostrar notificaciones Toast
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

        fetchOradoresLocales();

        // Escuchar cambios en los selectores para actualizar tabla y persistir estado
        selectMes.addEventListener("change", () => {
          sessionStorage.setItem("salidas_mes", selectMes.value);
          fetchConfirmedSalida();
        });

        selectAnio.addEventListener("change", () => {
          sessionStorage.setItem("salidas_anio", selectAnio.value);
          fetchConfirmedSalida();
        });

        // Ejecución inicial al cargar la página
        fetchConfirmedSalida();
      });
    