// Settings Page Handler
document.addEventListener("DOMContentLoaded", () => {
  const logoutModal = document.getElementById("logoutModal");
  const cancelLogoutBtn = document.querySelector('[data-action="cancel-logout"]');
  const confirmLogoutBtn = document.querySelector('[data-action="confirm-logout"]');

  // Display last updated time
  const lastUpdatedEl = document.getElementById("lastUpdated");
  if (lastUpdatedEl) {
    const now = new Date();
    lastUpdatedEl.textContent = now.toLocaleString();
  }

  // Theme settings
  const themeRadios = document.querySelectorAll('input[name="theme"]');
  const savedTheme = localStorage.getItem("theme") || "light";
  
  themeRadios.forEach((radio) => {
    if (radio.value === savedTheme) {
      radio.checked = true;
    }
    radio.addEventListener("change", (e) => {
      localStorage.setItem("theme", e.target.value);
      document.documentElement.className = e.target.value;
      showNotification("Theme changed successfully", "success");
    });
  });

  // Notification settings
  const notificationCheckboxes = document.querySelectorAll('input[type="checkbox"]');
  notificationCheckboxes.forEach((checkbox, index) => {
    const savedState = localStorage.getItem(`notification-${index}`);
    if (savedState !== null) {
      checkbox.checked = JSON.parse(savedState);
    }
    checkbox.addEventListener("change", (e) => {
      localStorage.setItem(`notification-${index}`, e.target.checked);
    });
  });

  // Logout button handling
  document.querySelectorAll('button[data-action="logout"]').forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      if (logoutModal) {
        logoutModal.classList.remove("hidden");
      }
    });
  });

  // Cancel logout
  if (cancelLogoutBtn) {
    cancelLogoutBtn.addEventListener("click", () => {
      if (logoutModal) {
        logoutModal.classList.add("hidden");
      }
    });
  }

  // Confirm logout
  if (confirmLogoutBtn) {
    confirmLogoutBtn.addEventListener("click", async () => {
      try {
        if (window.firebaseUtils && window.firebaseAuth) {
          await window.firebaseUtils.signOut(window.firebaseAuth);
        }
        window.location.href = "./login.html";
      } catch (error) {
        console.error("Logout error:", error);
        showNotification("Logout failed. Please try again.", "error");
      }
    });
  }

  // Close modal on outside click
  if (logoutModal) {
    logoutModal.addEventListener("click", (e) => {
      if (e.target === logoutModal) {
        logoutModal.classList.add("hidden");
      }
    });
  }
});

// Show notification
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `fixed top-4 right-4 px-4 py-3 rounded-lg text-white z-[100] ${
    type === "success"
      ? "bg-green-600"
      : type === "error"
        ? "bg-red-600"
        : "bg-gray-600"
  }`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}
