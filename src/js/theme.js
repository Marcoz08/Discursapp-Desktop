/**
 * Theme Manager - DiscursApp
 * Manages light/dark theme persistence across all pages.
 * Reads the user's preference from localStorage and applies it
 * to the <html> element via Bootstrap's data-bs-theme attribute.
 */
(function () {
  const STORAGE_KEY = "discursapp-theme";

  // Apply saved theme immediately (before DOM is fully loaded to avoid flash)
  const savedTheme = localStorage.getItem(STORAGE_KEY) || "light";
  document.documentElement.setAttribute("data-bs-theme", savedTheme);

  // Expose a helper so the settings page can change the theme at runtime
  window.DiscursAppTheme = {
    get current() {
      return localStorage.getItem(STORAGE_KEY) || "light";
    },

    set(theme) {
      if (theme !== "light" && theme !== "dark") return;
      localStorage.setItem(STORAGE_KEY, theme);
      document.documentElement.setAttribute("data-bs-theme", theme);
    },

    toggle() {
      const next = this.current === "light" ? "dark" : "light";
      this.set(next);
      return next;
    },
  };
})();
