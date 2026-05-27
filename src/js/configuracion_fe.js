
// Configuration is loaded from config.js

function showNotification(message, type = "success") {
  const toastContainer = document.getElementById("toastContainer");

  if (!toastContainer) {
    console.warn("No se encontró el contenedor de toasts para mostrar la notificación.");
    return;
  }

  const toastId = `toast-${Date.now()}`;
  const bgClass = type === "success" ? "text-bg-success" : "text-bg-danger";
  const icon = type === "success" ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill";

  toastContainer.insertAdjacentHTML(
    "beforeend",
    `
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
    `,
  );

  const toastElement = document.getElementById(toastId);

  if (!toastElement) {
    return;
  }

  const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
  toast.show();
  toastElement.addEventListener("hidden.bs.toast", () => toastElement.remove());
}

function initializeThemeSelector() {
  const themeSelector = document.getElementById("theme-selector");
  const radioLight = document.getElementById("theme-light");
  const radioDark = document.getElementById("theme-dark");

  if (!themeSelector || !radioLight || !radioDark) {
    return;
  }

  const currentTheme = window.DiscursAppTheme?.current || "light";

  if (currentTheme === "dark") {
    radioDark.checked = true;
  } else {
    radioLight.checked = true;
  }

  const applyTheme = (selectedTheme) => {
    if (!selectedTheme || !["light", "dark"].includes(selectedTheme)) {
      return;
    }

    window.DiscursAppTheme?.set(selectedTheme);
    showNotification(
      selectedTheme === "dark"
        ? "Tema oscuro activado."
        : "Tema claro activado.",
      "success",
    );
  };

  const handleThemeChange = (event) => {
    const selectedTheme = event.target?.value;
    applyTheme(selectedTheme);
  };

  const lightLabel = themeSelector.querySelector('label[for="theme-light"]');
  const darkLabel = themeSelector.querySelector('label[for="theme-dark"]');

  lightLabel?.addEventListener("click", () => {
    radioLight.checked = true;
    radioDark.checked = false;
    radioLight.dispatchEvent(new Event("change", { bubbles: true }));
  });

  darkLabel?.addEventListener("click", () => {
    radioDark.checked = true;
    radioLight.checked = false;
    radioDark.dispatchEvent(new Event("change", { bubbles: true }));
  });

  radioLight.addEventListener("change", handleThemeChange);
  radioDark.addEventListener("change", handleThemeChange);
}

function initializeClearDataModal() {
  const openBtn = document.getElementById("btn-open-clear-modal");
  const modalEl = document.getElementById("clearDataModal");
  const confirmCheck = document.getElementById("confirm-check");
  const confirmBtn = document.getElementById("btn-confirm-clear");
  const resultDiv = document.getElementById("clear-result");

  if (!openBtn || !modalEl || !confirmCheck || !confirmBtn || !resultDiv) {
    return;
  }

  const modal = new bootstrap.Modal(modalEl, { keyboard: false });

  openBtn.addEventListener("click", () => {
    confirmCheck.checked = false;
    confirmBtn.disabled = true;
    resultDiv.textContent = "";
    modal.show();
  });

  function updateConfirmState() {
    confirmBtn.disabled = !confirmCheck.checked;
  }

  confirmCheck.addEventListener("change", updateConfirmState);

  confirmBtn.addEventListener("click", async () => {
    if (confirmBtn.disabled) {
      return;
    }

    confirmBtn.disabled = true;
    confirmBtn.innerHTML = "Borrando...";
    resultDiv.textContent = "";

    try {
      const response = await fetch(CLEAR_DATA_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        resultDiv.textContent = data.message || "Operación completada.";
        showNotification("Datos restablecidos correctamente", "success");

        if (typeof updateSystemNotifications === "function") {
          updateSystemNotifications();
        }

        modal.hide();
      } else {
        resultDiv.textContent = data.error || "Error al restablecer datos";
        showNotification("Error al restablecer datos", "danger");
      }
    } catch (error) {
      console.error(error);
      resultDiv.textContent = "Error de conexión al servidor";
      showNotification("Error de conexión al servidor", "danger");
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = "Confirmar y borrar";
    }
  });
}

function initializeConfigurationPage() {
  initializeThemeSelector();
  initializeClearDataModal();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeConfigurationPage);
} else {
  initializeConfigurationPage();
}

