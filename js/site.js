(function () {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const isLoginPage = currentPage === "login.html";
  const isLandingPage = currentPage === "index.html" || currentPage === "";

  function showToast(message) {
    if (window.Notification && Notification.permission === "granted") {
      new Notification("EduManage Pro", { body: message });
    } else {
      window.alert(message);
    }
  }

  function buildFirebaseEmail(userId) {
    if (!userId) return "";
    const normalized = userId.trim().replace(/\s+/g, "").toLowerCase();
    return normalized.includes("@") ? normalized : `${normalized}@limkokwing.sl`;
  }

  function setupFeatureLinks() {
    document.querySelectorAll("a[href='#']").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        const label = link.textContent.trim() || "This feature";
        showToast(`${label} is coming soon.`);
      });
    });

    document.querySelectorAll("button[data-action='print']").forEach((button) => {
      button.addEventListener("click", () => window.print());
    });

    document.querySelectorAll("button[data-action='export']").forEach((button) => {
      button.addEventListener("click", () => {
        showToast("Export finished successfully.");
      });
    });

    document.querySelectorAll("button[data-action='new-report']").forEach((button) => {
      button.addEventListener("click", () => {
        window.location.href = "./report.html";
      });
    });

    document.querySelectorAll("button[data-action='new-teacher']").forEach((button) => {
      button.addEventListener("click", () => {
        showToast("New teacher registration coming soon.");
      });
    });

    document.querySelectorAll("button[data-action='new-class']").forEach((button) => {
      button.addEventListener("click", () => {
        showToast("New class creation coming soon.");
      });
    });

    document.querySelectorAll("button[data-action='coming-soon']").forEach((button) => {
      button.addEventListener("click", () => {
        showToast("More features are coming soon.");
      });
    });

    document.querySelectorAll("a[data-action='logout']").forEach((anchor) => {
      anchor.addEventListener("click", async (event) => {
        event.preventDefault();
        if (window.firebaseUtils && window.firebaseAuth) {
          try {
            await window.firebaseUtils.signOut(window.firebaseAuth);
            showToast("Signed out successfully.");
          } catch (error) {
            console.warn(error);
          }
        }
        window.location.href = "./login.html";
      });
    });
  }

  function setupAuth() {
    if (!window.firebaseAuth || !window.firebaseUtils) {
      console.warn("Firebase auth not initialized yet.");
      return;
    }

    const { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } = window.firebaseUtils;

    onAuthStateChanged(window.firebaseAuth, (user) => {
      if (user) {
        if (isLoginPage || isLandingPage) {
          window.location.href = "./dashboard.html";
        }
      } else {
        if (!isLoginPage && !isLandingPage) {
          window.location.href = "./login.html";
        }
      }
    });

    if (!isLoginPage) {
      return;
    }

    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
      loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!loginForm.checkValidity()) {
          loginForm.reportValidity();
          return;
        }

        const userId = document.getElementById("student-id")?.value || "";
        const password = document.getElementById("password")?.value || "";
        const email = buildFirebaseEmail(userId);

        try {
          await signInWithEmailAndPassword(window.firebaseAuth, email, password);
          window.location.href = "./dashboard.html";
        } catch (error) {
          if (error.code === "auth/user-not-found") {
            try {
              await createUserWithEmailAndPassword(window.firebaseAuth, email, password);
              window.location.href = "./dashboard.html";
            } catch (createError) {
              showToast(createError.message || "Unable to create account.");
            }
          } else {
            showToast(error.message || "Login failed.");
          }
        }
      });
    }
  }

  function setupEnrollment() {
    if (!window.firebaseDb || !window.firebaseUtils) {
      return;
    }

    const { addDoc, collection, serverTimestamp } = window.firebaseUtils;
    const enrollmentForm = document.getElementById("enrollmentForm");

    if (!enrollmentForm) {
      return;
    }

    enrollmentForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!enrollmentForm.checkValidity()) {
        enrollmentForm.reportValidity();
        return;
      }

      const payload = {
        studentId: document.getElementById("studentId")?.value || "",
        fullName: document.getElementById("fullName")?.value || "",
        dateOfBirth: document.getElementById("dateOfBirth")?.value || "",
        gender: document.getElementById("gender")?.value || "",
        residentialAddress: document.getElementById("residentialAddress")?.value || "",
        guardianName: document.getElementById("guardianName")?.value || "",
        primaryPhone: document.getElementById("primaryPhone")?.value || "",
        gradeLevel: document.getElementById("gradeLevel")?.value || "",
        majorSection: document.getElementById("majorSection")?.value || "",
        createdAt: serverTimestamp(),
      };

      try {
        await addDoc(collection(window.firebaseDb, "enrollments"), payload);
        showToast("Student enrolled successfully.");
        window.location.href = "./studentrecord.html";
      } catch (error) {
        showToast(error.message || "Enrollment save failed.");
      }
    });
  }

  function init() {
    setupFeatureLinks();
    setupAuth();
    setupEnrollment();

    const reportButton = document.getElementById("generateCampusReport");
    if (reportButton) {
      reportButton.addEventListener("click", () => {
        window.location.href = "./report.html";
      });
    }
  }

  function waitForFirebase(callback) {
    let attempts = 0;
    const interval = setInterval(() => {
      if (window.firebaseAuth && window.firebaseDb && window.firebaseUtils) {
        clearInterval(interval);
        callback();
        return;
      }
      attempts += 1;
      if (attempts > 100) {
        clearInterval(interval);
        console.warn("Firebase initialization timed out.");
        callback();
      }
    }, 50);
  }

  waitForFirebase(init);
})();
