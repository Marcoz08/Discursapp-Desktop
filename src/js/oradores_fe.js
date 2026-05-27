document.addEventListener("DOMContentLoaded", async function () {
        const tableBody = document.getElementById("oradores-table-body");
        const searchInput = document.getElementById("search-orador");
        let oradoresData = [];
        let bosquejosList = [];
        let isEditMode = false;
        let originalTopicValuesInModal = new Map(); // Map<id_registro (string), {numero_tema: number|null, titulo: string|null, cancion_sugerida: number|null}>
        let temasPendientesEliminar = [];

        async function fetchOradores() {
          try {
            const response = await fetch(
              `${API_BASE_URL}/oradores-temas`,
            );
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || "Error en el servidor");
            }

            oradoresData = await response.json();
            renderTable(oradoresData);
          } catch (error) {
            console.error("Error:", error);
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error: ${error.message}</td></tr>`;
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
          } catch (error) {
            console.error("Error al cargar la lista de bosquejos:", error);
          }
        }

        // Lógica para autocompletar el número de bosquejo en el nuevo tema
        document.getElementById("new-topic-title").addEventListener("input", (e) => {
          const selectedTitle = e.target.value;
          const bosquejo = bosquejosList.find((b) => b.titulo === selectedTitle);
          if (bosquejo) {
            document.getElementById("new-topic-num").value = bosquejo.num;
          }
        });

        function renderTable(data) {
          tableBody.innerHTML = "";

          // Usamos Map para agrupar temas manteniendo el orden original de la consulta (alfabético)
          const groupedMap = new Map();

          data.forEach((item) => {
            const speakerKey = item.id_orador || item.nombre;

            if (!groupedMap.has(speakerKey)) {
              groupedMap.set(speakerKey, {
                id_orador: item.id_orador,
                nombre: item.nombre,
                congregacion: item.congregacion,
                telefono: item.telefono,
                privilegio: item.privilegio,
                aprobado: item.aprobado,
                temas: [],
              });
            }
            if (item.numero_tema || item.titulo) {
              groupedMap.get(speakerKey).temas.push({
                numero_tema: item.numero_tema,
                titulo: item.titulo,
                cancion_sugerida: item.cancion_sugerida,
              });
            }
          });

          let oratorIndex = 0;
          groupedMap.forEach((orador) => {
            const numTemas = orador.temas.length > 0 ? orador.temas.length : 1; // Al menos 1 fila para el orador

            const privilegioText = orador.privilegio
              ? "Anciano"
              : "Siervo Ministerial";
            const privilegioBadge = orador.privilegio
              ? "text-bg-primary"
              : "text-bg-info";

            // Definimos el icono: palomita verde si es TRUE, preventivo naranja si es FALSE o NULL
            const aprobadoIcon = orador.aprobado
              ? '<i class="bi bi-check-circle-fill text-success ms-1" title="Aprobado para salir"></i>'
              : '<i class="bi bi-exclamation-triangle-fill text-warning ms-1" title="Pendiente de aprobación para salir"></i>';

            const speakerId = orador.id_orador || orador.nombre;

            const speakerRows = []; // Arreglo para agrupar las filas de este orador y aplicar hover grupal

            // Renderizar la primera fila del orador con rowspan
            let firstRow = document.createElement("tr");
            firstRow.innerHTML = `
              <td rowspan="${numTemas}" class="align-middle"><strong>${orador.nombre}</strong></td>
              <td rowspan="${numTemas}" class="align-middle"><span class="badge ${privilegioBadge}">${privilegioText}</span>${aprobadoIcon}</td>
              <td rowspan="${numTemas}" class="align-middle">${orador.congregacion || "El Castillo"}</td>
              <td class="text-center">${orador.temas[0]?.numero_tema || "--"}</td>
              <td>${orador.temas[0]?.titulo || '<i class="text-muted">Sin tema registrado</i>'}</td>
              <td>${orador.temas[0]?.cancion_sugerida ? "Cant. " + orador.temas[0].cancion_sugerida : "--"}</td>
              <td rowspan="${numTemas}" class="text-center align-middle">
                <button class="btn btn-sm btn-outline-primary edit-speaker-btn" data-id="${speakerId}" title="Editar orador">
                  <i class="bi bi-pencil-square"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-speaker-btn ms-1" data-id="${speakerId}" data-nombre="${orador.nombre}" title="Eliminar orador">
                  <i class="bi bi-trash"></i>
                </button>
              </td>
            `;
            speakerRows.push(firstRow);

            // Renderizar filas adicionales para temas (si hay más de uno)
            for (let i = 1; i < orador.temas.length; i++) {
              let subsequentRow = document.createElement("tr");
              subsequentRow.innerHTML = `
                <td class="text-left">${orador.temas[i].numero_tema || "--"}</td>
                <td>${orador.temas[i].titulo || '<i class="text-muted">Sin tema registrado</i>'}</td>
                <td>${orador.temas[i].cancion_sugerida ? "Cant. " + orador.temas[i].cancion_sugerida : "--"}</td>
              `;
              speakerRows.push(subsequentRow);
            }

            // Aplicar efecto de hover grupal y añadir las filas al cuerpo de la tabla
            speakerRows.forEach((row) => {
              row.addEventListener("mouseenter", () => {
                speakerRows.forEach((r) => r.classList.add("table-active"));
              });
              row.addEventListener("mouseleave", () => {
                speakerRows.forEach((r) => r.classList.remove("table-active"));
              });
              tableBody.appendChild(row);
            });
            oratorIndex++;
          });
        }

        // Buscador básico
        searchInput.addEventListener("input", (e) => {
          const term = e.target.value.toLowerCase();
          // Para el buscador, necesitamos filtrar la data original y luego reagruparla
          const filteredRawData = oradoresData.filter(
            (o) =>
              o.nombre.toLowerCase().includes(term) ||
              (o.titulo && o.titulo.toLowerCase().includes(term)) ||
              (o.congregacion && o.congregacion.toLowerCase().includes(term)) ||
              (o.numero_tema && o.numero_tema.toString().includes(term)),
          );
          renderTable(filteredRawData); // La función renderTable ya agrupa
        });

        // Lógica para el botón de refrescar manual
        document.getElementById("btn-refresh").addEventListener("click", () => {
          fetchOradores();
          showNotification("Listado de oradores actualizado.", "success");
        });

        // Lógica para exportar a PDF el listado de oradores y temas
        const configPdfModal = new bootstrap.Modal(
          document.getElementById("configPdfModal"),
        );
        const speakersSelectList = document.getElementById(
          "speakers-select-list",
        );
        const selectAllCheckbox = document.getElementById(
          "select-all-speakers",
        );

        document
          .getElementById("btn-export-pdf")
          .addEventListener("click", () => {
            if (oradoresData.length === 0) {
              showNotification("No hay datos para exportar.", "danger");
              return;
            }

            // Obtener lista única de oradores
            const uniqueSpeakers = [];
            const seen = new Set();
            oradoresData.forEach((item) => {
              const id = (item.id_orador || item.nombre).toString();
              if (!seen.has(id)) {
                seen.add(id);
                uniqueSpeakers.push({ id, nombre: item.nombre });
              }
            });

            // Poblar el modal
            speakersSelectList.innerHTML = uniqueSpeakers
              .map(
                (s) => `
            <label class="list-group-item">
              <input class="form-check-input me-1 speaker-pdf-checkbox" type="checkbox" value="${s.id}" checked>
              ${s.nombre}
            </label>
          `,
              )
              .join("");

            selectAllCheckbox.checked = true;
            configPdfModal.show();
          });

        // Lógica de "Seleccionar todo"
        selectAllCheckbox.addEventListener("change", () => {
          const checkboxes = document.querySelectorAll(".speaker-pdf-checkbox");
          checkboxes.forEach((cb) => (cb.checked = selectAllCheckbox.checked));
        });

        // Función principal de generación de PDF refacturada
        function generatePDF(selectedIds) {
          const { jsPDF } = window.jspdf;
          const doc = new jsPDF("p", "mm", "a4"); // Orientación vertical, milímetros, tamaño A4

          // Configuración de encabezado
          doc.setFontSize(16);
          doc.setTextColor(0, 119, 182); // Color corporativo #0077B6
          doc.text("REGISTRO DE ORADORES LOCALES Y TEMAS", 105, 15, {
            align: "center",
          });

          doc.setFontSize(10);
          doc.setTextColor(100);
          doc.text(`Congregación: El Castillo`, 14, 25);
          doc.text(
            `Fecha de reporte: ${new Date().toLocaleDateString()}`,
            14,
            30,
          );

          // Agrupamos los temas por orador siguiendo la misma lógica de la tabla web
          const groupedMap = new Map();
          oradoresData.forEach((item) => {
            const speakerKey = item.id_orador || item.nombre;

            // FILTRO: Solo procesar si el ID está en la lista de seleccionados
            if (!selectedIds.includes(speakerKey.toString())) return;

            if (!groupedMap.has(speakerKey)) {
              groupedMap.set(speakerKey, {
                nombre: item.nombre,
                privilegio: item.privilegio ? "Anciano" : "Siervo Ministerial",
                temas: [],
              });
            }
            if (item.numero_tema || item.titulo) {
              groupedMap.get(speakerKey).temas.push({
                num: item.numero_tema || "--",
                titulo: item.titulo || "Sin título registrado",
                cancion: item.cancion_sugerida
                  ? "Cant. " + item.cancion_sugerida
                  : "--",
              });
            }
          });

          const tableRows = [];
          const oratorGroupTracking = []; // Rastreador para saber qué filas pertenecen a qué orador
          let oratorIndex = 0;

          groupedMap.forEach((orador) => {
            if (orador.temas.length === 0) {
              tableRows.push([
                orador.nombre,
                orador.privilegio,
                "--",
                "Sin temas registrados",
                "--",
              ]);
              oratorGroupTracking.push(oratorIndex);
            } else {
              orador.temas.forEach((tema, index) => {
                // Para simular el rowspan, solo incluimos los datos del orador en la primera fila de su bloque
                if (index === 0) {
                  tableRows.push([
                    orador.nombre,
                    orador.privilegio,
                    tema.num,
                    tema.titulo,
                    tema.cancion,
                  ]);
                } else {
                  tableRows.push(["", "", tema.num, tema.titulo, tema.cancion]);
                }
                oratorGroupTracking.push(oratorIndex);
              });
            }
            oratorIndex++;
          });

          // Generación de la tabla en el PDF
          doc.autoTable({
            startY: 35,
            head: [
              [
                "Orador",
                "Privilegio",
                "Núm.",
                "Título del Discurso",
                "Canción",
              ],
            ],
            body: tableRows,
            theme: "grid",
            headStyles: {
              fillColor: [0, 119, 182],
              textColor: [255, 255, 255],
              fontStyle: "bold",
            },
            styles: {
              fontSize: 10,
              cellPadding: 3,
              valign: "middle",
              lineColor: [0, 0, 0],
              lineWidth: 0,
            },
            columnStyles: {
              0: { cellWidth: 40, fontStyle: "bold" },
              1: { cellWidth: 35 },
              2: { halign: "center", cellWidth: 15 },
              4: { halign: "center", cellWidth: 20 },
            },
            didParseCell: function (data) {
              if (data.section === "body") {
                const groupIdx = oratorGroupTracking[data.row.index];
                // Aplicar fondo gris muy tenue a oradores impares para generar contraste de grupos
                if (groupIdx % 2 !== 0) {
                  data.cell.styles.fillColor = [202, 240, 248];
                }
              }
            },
            didDrawCell: function (data) {
              if (data.section === "body") {
                const groupIdx = oratorGroupTracking[data.row.index];
                const prevGroupIdx =
                  data.row.index > 0
                    ? oratorGroupTracking[data.row.index - 1]
                    : -1;
                const nextGroupIdx = oratorGroupTracking[data.row.index + 1];

                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(0.6); // Grosor para bordes de grupo

                // Dibujar borde superior si es el inicio de un bloque de orador
                if (prevGroupIdx !== groupIdx) {
                  doc.line(
                    data.cell.x,
                    data.cell.y,
                    data.cell.x + data.cell.width,
                    data.cell.y,
                  );
                }
                // Dibujar borde inferior si es el fin de un bloque o la última fila
                if (
                  nextGroupIdx !== groupIdx ||
                  data.row.index === tableRows.length - 1
                ) {
                  doc.line(
                    data.cell.x,
                    data.cell.y + data.cell.height,
                    data.cell.x + data.cell.width,
                    data.cell.y + data.cell.height,
                  );
                }
                // Bordes laterales gruesos para encerrar el bloque
                if (data.column.index === 0) {
                  doc.line(
                    data.cell.x,
                    data.cell.y,
                    data.cell.x,
                    data.cell.y + data.cell.height,
                  );
                }
                if (data.column.index === data.table.columns.length - 1) {
                  doc.line(
                    data.cell.x + data.cell.width,
                    data.cell.y,
                    data.cell.x + data.cell.width,
                    data.cell.y + data.cell.height,
                  );
                }
              }
            },
          });

          doc.save(
            `Oradores_y_Temas_${new Date().toISOString().split("T")[0]}.pdf`,
          );
        }

        // Evento del botón "Generar PDF" dentro del modal
        document
          .getElementById("btn-generate-filtered-pdf")
          .addEventListener("click", () => {
            const selectedCheckboxes = document.querySelectorAll(
              ".speaker-pdf-checkbox:checked",
            );
            const selectedIds = Array.from(selectedCheckboxes).map(
              (cb) => cb.value,
            );

            if (selectedIds.length === 0) {
              alert("Por favor, seleccione al menos un orador para exportar.");
              return;
            }

            generatePDF(selectedIds);
            configPdfModal.hide();
          });

        // Lógica para el botón "Añadir orador"
        const editSpeakerModal = new bootstrap.Modal(
          document.getElementById("editSpeakerModal"),
        );
        const btnAddSpeaker = document.getElementById("btn-add-speaker");
        const btnUpdateSpeaker = document.getElementById("btn-update-speaker");

        btnAddSpeaker.addEventListener("click", () => {
          isEditMode = false;
          document.getElementById("editSpeakerModalLabel").innerHTML =
            '<i class="bi bi-person-plus-fill me-2"></i>Añadir Nuevo Orador';
          document.getElementById("edit-speaker-id").value = "";
          document.getElementById("editSpeakerForm").reset();
          document.getElementById("edit-speaker-congregation").value =
            "El Castillo";
          document.getElementById("editPrivilegeAnciano").checked = true;
          document.getElementById("edit-speaker-approved").checked = true;

          document.getElementById("edit-speaker-temas-body").innerHTML =
            '<tr><td colspan="4" class="text-center text-muted">Sin temas registrados</td></tr>';
          temasPendientesEliminar = [];
          originalTopicValuesInModal.clear();

          newTopicForm.style.display = "none";
          btnShowAddTopic.style.display = "block";
          editSpeakerModal.show();
        });

        // Evento para abrir modal de edición y cargar datos
        tableBody.addEventListener("click", (e) => {
          const editBtn = e.target.closest(".edit-speaker-btn");
          if (editBtn) {
            isEditMode = true;
            document.getElementById("editSpeakerModalLabel").innerHTML =
              '<i class="bi bi-pencil-square me-2"></i>Editar Orador';
            const id = editBtn.dataset.id;
            temasPendientesEliminar = []; // Resetear lista de eliminaciones al abrir
            // Buscamos todas las filas relacionadas a este orador en la data plana
            const oratorRows = oradoresData.filter(
              (item) =>
                (item.id_orador || item.nombre).toString() === id.toString(),
            );

            if (oratorRows.length === 0) return;

            originalTopicValuesInModal.clear(); // Limpiar el estado anterior al abrir el modal
            const speaker = oratorRows[0];
            document.getElementById("edit-speaker-id").value = id;
            document.getElementById("edit-speaker-name").value = speaker.nombre;
            document.getElementById("edit-speaker-phone").value =
              speaker.telefono || "";
            document.getElementById("edit-speaker-congregation").value =
              speaker.congregacion || "";

            if (speaker.privilegio) {
              document.getElementById("editPrivilegeAnciano").checked = true;
            } else {
              document.getElementById("editPrivilegeSiervo").checked = true;
            }

            document.getElementById("edit-speaker-approved").checked =
              speaker.aprobado === 1;

            // Resetear el formulario de añadir tema al abrir el modal
            newTopicForm.style.display = "none";
            btnShowAddTopic.style.display = "block";

            // Cargar la lista de temas en el modal
            const temasBody = document.getElementById(
              "edit-speaker-temas-body",
            );
            temasBody.innerHTML = "";
            oratorRows.forEach((row) => {
              if (row.id_tituloOrador && (row.numero_tema || row.titulo)) {
                const tr = document.createElement("tr");
                // Almacenar los valores originales para detectar cambios
                originalTopicValuesInModal.set(row.id_tituloOrador.toString(), {
                  numero_tema: row.numero_tema,
                  titulo: row.titulo,
                  cancion_sugerida: row.cancion_sugerida,
                });
                // Escapar comillas dobles para que no rompan el atributo value en el HTML
                const safeTitulo = (row.titulo || "").toString().replace(/"/g, '&quot;');
                tr.innerHTML = `
                  <td><input type="number" class="form-control form-control-sm topic-edit-input" data-id-titulo-orador="${row.id_tituloOrador}" data-field="numero_tema" value="${row.numero_tema || ""}"></td>
                  <td><input type="text" class="form-control form-control-sm topic-edit-input" data-id-titulo-orador="${row.id_tituloOrador}" data-field="titulo" list="bosquejos-list" value="${safeTitulo}"></td>
                  <td><input type="number" class="form-control form-control-sm topic-edit-input" data-id-titulo-orador="${row.id_tituloOrador}" data-field="cancion_sugerida" value="${row.cancion_sugerida || ""}"></td>
                  <td class="text-end">
                    <button type="button" class="btn btn-sm btn-link text-danger remove-topic-btn" data-id-titulo-orador="${row.id_tituloOrador}" title="Eliminar tema">
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                `;
                temasBody.appendChild(tr);
              }
            });
            if (temasBody.innerHTML === "")
              temasBody.innerHTML =
                '<tr><td colspan="4" class="text-center text-muted">Sin temas registrados</td></tr>';

            editSpeakerModal.show();
          }
        });

        btnUpdateSpeaker.addEventListener("click", async () => {
          const id = document.getElementById("edit-speaker-id").value;
          const nombre = document
            .getElementById("edit-speaker-name")
            .value.trim();
          const telefono = document
            .getElementById("edit-speaker-phone")
            .value.trim();
          const congregacion = document
            .getElementById("edit-speaker-congregation")
            .value.trim();
          const privilegioRadio = document.querySelector(
            'input[name="editSpeakerPrivilege"]:checked',
          );
          const privilegio = privilegioRadio
            ? privilegioRadio.value === "1"
            : true;
          const aprobado = document.getElementById(
            "edit-speaker-approved",
          ).checked;

          if (!nombre || !congregacion) {
            showNotification(
              "El nombre y la congregación son campos obligatorios.",
              "danger",
            );
            return;
          }

          // Array para almacenar todas las promesas de actualización de temas
          const topicUpdatePromises = [];

          try {
            let finalOradorId = id;
            const speakerData = {
              nombre,
              telefono,
              privilegio,
              congregacion,
              aprobado,
            };

            // Procesar eliminaciones pendientes antes de actualizar orador
            if (temasPendientesEliminar.length > 0) {
              for (const idTema of temasPendientesEliminar) {
                topicUpdatePromises.push(
                  fetch(`${API_BASE_URL}/temas-orador/${idTema}`, {
                    method: "DELETE",
                  }),
                );
              }
              temasPendientesEliminar = [];
            }

            // 1. Guardar o Actualizar Orador primero para tener el ID
            if (!isEditMode) {
              const response = await fetch(
                `${API_BASE_URL}/oradores`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(speakerData),
                },
              );
              if (!response.ok) throw new Error("Error al crear orador");
              const result = await response.json();
              finalOradorId = result.id_orador;
            } else {
              const response = await fetch(
                `${API_BASE_URL}/oradores/${id}`,
                {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(speakerData),
                },
              );
              if (!response.ok) throw new Error("Error al actualizar orador");
            }

            // 2. Ahora procesar los temas usando finalOradorId
            // Procesar actualizaciones de temas existentes
            const topicInputs = document.querySelectorAll(
              "#edit-speaker-temas-body .topic-edit-input",
            );
            const changedTopics = new Map(); // Map<id_registro, {field: value, ...}>

            topicInputs.forEach((input) => {
              const idTituloOrador = input.dataset.idTituloOrador;
              const field = input.dataset.field;
              let currentInputValue = input.value; // Valor como string del input

              const originalTopic = originalTopicValuesInModal.get(idTituloOrador);
              if (!originalTopic) return; // No debería ocurrir para temas existentes

              let originalValue = originalTopic[field];

              let processedCurrentValue;
              if (input.type === "number") {
                processedCurrentValue =
                  currentInputValue === ""
                    ? null
                    : parseInt(currentInputValue, 10);
              } else {
                // Tipo texto
                processedCurrentValue =
                  currentInputValue === "" ? null : currentInputValue;
              }

              // Comparar el valor procesado actual con el valor original
              if (processedCurrentValue !== originalValue) {
                if (!changedTopics.has(idTituloOrador))
                  changedTopics.set(idTituloOrador, {});
                changedTopics.get(idTituloOrador)[field] = processedCurrentValue;
              }
            });

            for (const [idTituloOrador, updates] of changedTopics.entries()) {
              topicUpdatePromises.push(
                fetch(`${API_BASE_URL}/temas-orador/${idTituloOrador}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(updates),
                }),
              );
            }

            // Procesar temas totalmente nuevos
            const newTopicRows = document.querySelectorAll(".new-topic-row");
            newTopicRows.forEach((row) => {
              const inputs = row.querySelectorAll(".topic-new-input");
              const newTopicData = { id_orador: finalOradorId };
              inputs.forEach((input) => {
                const field = input.dataset.field;
                newTopicData[field] =
                  input.value === ""
                    ? null
                    : input.type === "number"
                      ? parseInt(input.value, 10)
                      : input.value;
              });
              topicUpdatePromises.push(
                fetch(`${API_BASE_URL}/temas-orador`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(newTopicData),
                }),
              );
            });

            // Esperar a que todas las operaciones de temas se completen
            await Promise.all(topicUpdatePromises);

            editSpeakerModal.hide();
            showNotification(
              isEditMode ? "Orador actualizado." : "Orador añadido con éxito.",
              "success",
            );
            fetchOradores();
          } catch (error) {
            showNotification(
              "Error de conexión con el servidor.",
              "danger",
              "FETCH_ERROR",
            );
          }
        });

        // --- Lógica para añadir nuevos temas a un orador ---
        const btnShowAddTopic = document.getElementById("btn-show-add-topic");
        const newTopicForm = document.getElementById("new-topic-form");
        const btnSaveNewTopic = document.getElementById("btn-save-new-topic");

        btnShowAddTopic.addEventListener("click", () => {
          newTopicForm.style.display = "block";
          btnShowAddTopic.style.display = "none";
        });

        // Lógica para quitar temas visualmente y encolar su eliminación
        document
          .getElementById("edit-speaker-temas-body")
          .addEventListener("click", (e) => {
            const btn = e.target.closest(".remove-topic-btn");
            if (btn) {
              const row = btn.closest("tr");
              const idTituloOrador = btn.dataset.idTituloOrador;
              if (
                idTituloOrador &&
                idTituloOrador !== "null" &&
                !row.classList.contains("new-topic-row")
              ) {
                temasPendientesEliminar.push(idTituloOrador.toString());
              }
              row.remove();
              const body = document.getElementById("edit-speaker-temas-body");
              if (body.children.length === 0) {
                body.innerHTML =
                  '<tr><td colspan="4" class="text-center text-muted">Sin temas registrados</td></tr>';
              }
            }
          });

        // Lógica para autocompletar el número de tema en la tabla del modal (filas existentes o recién agregadas)
        document.getElementById("edit-speaker-temas-body").addEventListener("input", (e) => {
          if (e.target.dataset.field === "titulo") {
            const selectedTitle = e.target.value;
            const bosquejo = bosquejosList.find((b) => b.titulo === selectedTitle);
            if (bosquejo) {
              const row = e.target.closest("tr");
              const numInput = row.querySelector('input[data-field="numero_tema"]');
              if (numInput) numInput.value = bosquejo.num;
            }
          }
        });

        btnSaveNewTopic.addEventListener("click", () => {
          const numero_tema = document.getElementById("new-topic-num").value;
          const titulo = document
            .getElementById("new-topic-title")
            .value.trim();
          const cancion_sugerida =
            document.getElementById("new-topic-song").value;

          if (!numero_tema && !titulo) {
            showNotification(
              "Ingrese al menos el número o título del discurso.",
              "danger",
            );
            return;
          }

          const temasBody = document.getElementById("edit-speaker-temas-body");
          if (temasBody.innerHTML.includes("Sin temas registrados"))
            temasBody.innerHTML = "";

          const safeTitulo = titulo.replace(/"/g, '&quot;');
          const tr = document.createElement("tr");
          tr.classList.add("new-topic-row");
          tr.innerHTML = `
            <td><input type="number" class="form-control form-control-sm topic-new-input" data-field="numero_tema" value="${numero_tema}"></td>
            <td><input type="text" class="form-control form-control-sm topic-new-input" data-field="titulo" list="bosquejos-list" value="${safeTitulo}"></td>
            <td><input type="number" class="form-control form-control-sm topic-new-input" data-field="cancion_sugerida" value="${cancion_sugerida}"></td>
            <td class="text-end">
              <button type="button" class="btn btn-sm btn-link text-danger remove-topic-btn" title="Eliminar tema">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          `;
          temasBody.appendChild(tr);

          document.getElementById("new-topic-num").value = "";
          document.getElementById("new-topic-title").value = "";
          document.getElementById("new-topic-song").value = "";
          newTopicForm.style.display = "none";
          btnShowAddTopic.style.display = "block";
        });

        // Resetear el estado del formulario de temas al cerrar el modal
        document
          .getElementById("editSpeakerModal")
          .addEventListener("hidden.bs.modal", () => {
            newTopicForm.style.display = "none";
            btnShowAddTopic.style.display = "block";
          });

        // Lógica del Modal de Eliminación
        const deleteModal = new bootstrap.Modal(
          document.getElementById("deleteSpeakerModal"),
        );
        const btnConfirmDelete = document.getElementById("btn-confirm-delete");
        const checkConfirmDelete = document.getElementById(
          "confirm-delete-check",
        );
        let speakerToDeleteId = null;

        tableBody.addEventListener("click", (e) => {
          const deleteBtn = e.target.closest(".delete-speaker-btn");
          if (deleteBtn) {
            speakerToDeleteId = deleteBtn.dataset.id;
            document.getElementById("delete-speaker-name").innerText =
              deleteBtn.dataset.nombre;
            checkConfirmDelete.checked = false;
            btnConfirmDelete.disabled = true;
            deleteModal.show();
          }
        });

        checkConfirmDelete.addEventListener("change", () => {
          btnConfirmDelete.disabled = !checkConfirmDelete.checked;
        });

        /**
         * Función para mostrar avisos emergentes (Toasts) de éxito o error
         * @param {string} message - El mensaje a mostrar
         * @param {string} type - 'success' para verde, 'danger' para rojo
         * @param {number|string} errorCode - (Opcional) Código de error para mostrar en fallos
         */
        function showNotification(message, type = "success", errorCode = null) {
          const toastContainer = document.getElementById("toastContainer");
          const toastId = "toast-" + Date.now(); // ID único para evitar conflictos
          const bgClass =
            type === "success" ? "text-bg-success" : "text-bg-danger";
          const icon =
            type === "success"
              ? "bi-check-circle-fill"
              : "bi-exclamation-triangle-fill";

          // Si hay un código de error, formateamos el mensaje para que sea más informativo
          let bodyContent = message;
          if (errorCode) {
            bodyContent = `<strong>No se pudo completar la acción solicitada.</strong><br>${message} <br><small class="opacity-75">Código de error: ${errorCode}</small>`;
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

          toastContainer.insertAdjacentHTML("beforeend", toastHTML);
          // Inicializar y mostrar el Toast de Bootstrap
          const toastElement = document.getElementById(toastId);
          const toast = new bootstrap.Toast(toastElement, {
            delay: type === "success" ? 3000 : 6000,
          });
          toast.show();

          // Eliminar el elemento del DOM después de que se oculte para no saturar la página
          toastElement.addEventListener("hidden.bs.toast", () =>
            toastElement.remove(),
          );
        }

        btnConfirmDelete.addEventListener("click", async () => {
          if (!speakerToDeleteId) return;

          try {
            // Llamada real al backend para eliminar
            const response = await fetch(
              `${API_BASE_URL}/oradores/${speakerToDeleteId}`,
              {
                method: "DELETE",
              },
            );

            if (response.ok) {
              deleteModal.hide();
              showNotification(
                "El orador y sus temas han sido eliminados correctamente.",
                "success",
              );
              fetchOradores(); // Recargamos la tabla para ver los cambios
            } else {
              const errorData = await response.json();
              showNotification(
                errorData.error || "Error en el servidor",
                "danger",
                response.status,
              );
            }
          } catch (error) {
            console.error("Error en la petición DELETE:", error);
            showNotification(
              "Error de conexión. Asegúrese de que el servidor esté activo.",
              "danger",
              "CONN_ERROR",
            );
          }
        });

        fetchOradores();
        fetchBosquejosList();
      });
    