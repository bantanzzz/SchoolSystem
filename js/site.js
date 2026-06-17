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

    document.querySelectorAll("a[data-action='logout'], button[data-action='logout']").forEach((element) => {
      element.addEventListener("click", (event) => {
        event.preventDefault();
        // Check if we're on settings page - it has its own modal
        if (window.location.pathname.includes("settings.html")) {
          return; // Let settings.js handle it
        }
        // For other pages, show a simple confirmation
        if (confirm("Are you sure you want to logout?")) {
          performLogout();
        }
      });
    });

    async function performLogout() {
      if (window.firebaseUtils && window.firebaseAuth) {
        try {
          await window.firebaseUtils.signOut(window.firebaseAuth);
          showToast("Signed out successfully.");
        } catch (error) {
          console.warn(error);
        }
      }
      window.location.href = "./login.html";
    }
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
    const formStatus = document.getElementById("formStatus");

    const setFormStatus = (message, type = "info") => {
      if (!formStatus) return;
      formStatus.textContent = message;
      formStatus.classList.remove("hidden");
      formStatus.className = "mt-lg rounded-lg px-md py-sm text-label-md font-medium";
      if (type === "success") {
        formStatus.classList.add("bg-emerald-100", "text-emerald-900");
      } else if (type === "error") {
        formStatus.classList.add("bg-red-100", "text-red-900");
      } else {
        formStatus.classList.add("bg-surface-container-lowest", "text-on-surface-variant");
      }
    };

    if (!enrollmentForm) {
      return;
    }

    enrollmentForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!enrollmentForm.checkValidity()) {
        enrollmentForm.reportValidity();
        setFormStatus("Please complete all required fields.", "error");
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

      console.log("Saving enrollment to Firestore:", payload);
      setFormStatus("Saving enrollment…", "info");

      try {
        await addDoc(collection(window.firebaseDb, "enrollments"), payload);
        console.log("Enrollment saved", payload);
        setFormStatus("Student enrolled successfully.", "success");
        setTimeout(() => {
          window.location.href = "./studentrecord.html";
        }, 800);
      } catch (error) {
        console.error("Enrollment save failed:", error);
        setFormStatus(error.message || "Enrollment save failed.", "error");
      }
    });
  }

  async function setupStudentRecords() {
    if (currentPage !== "studentrecord.html") {
      return;
    }
    if (!window.firebaseDb || !window.firebaseUtils) {
      return;
    }

    const { collection, getDocs } = window.firebaseUtils;
    const tableBody = document.getElementById("studentRecordsBody");

    if (!tableBody) {
      return;
    }

    tableBody.innerHTML = '<tr><td colspan="6" class="px-lg py-8 text-center text-on-surface-variant">Loading student records…</td></tr>';

    try {
      const snapshot = await getDocs(collection(window.firebaseDb, "enrollments"));
      if (snapshot.empty) {
        tableBody.innerHTML = '<tr><td colspan="6" class="px-lg py-8 text-center text-on-surface-variant">No student records found.</td></tr>';
        return;
      }

      const rows = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          const status = data.gradeLevel ? "Active" : "Pending";
          const classLabel = [data.gradeLevel, data.majorSection].filter(Boolean).join(" ") || "N/A";
          return `
            <tr class="hover:bg-surface-container-low transition-colors">
              <td class="px-lg py-4 font-label-md text-label-md text-on-surface">${data.studentId || "-"}</td>
              <td class="px-lg py-4">
                <div class="flex items-center gap-sm">
                  <div class="w-8 h-8 rounded bg-primary-fixed text-primary font-bold text-xs flex items-center justify-center">
                    ${data.fullName ? data.fullName.charAt(0).toUpperCase() : "?"}
                  </div>
                  <span class="font-body-md text-body-md text-on-surface">${data.fullName || "Unknown"}</span>
                </div>
              </td>
              <td class="px-lg py-4 font-body-md text-body-md text-on-surface-variant">${classLabel}</td>
              <td class="px-lg py-4"><span class="font-label-md text-label-md text-on-surface">N/A</span></td>
              <td class="px-lg py-4">
                <span class="inline-block px-2 py-0.5 rounded border border-outline-variant bg-surface-container-low text-on-surface-variant text-[11px] font-bold uppercase">${status}</span>
              </td>
              <td class="px-lg py-4 text-right">
                <button class="text-outline hover:text-primary p-1">
                  <span class="material-symbols-outlined text-[20px]">edit</span>
                </button>
                <button class="text-outline hover:text-error p-1">
                  <span class="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </td>
            </tr>`;
        })
        .join("");

      tableBody.innerHTML = rows;
    } catch (error) {
      console.error("Failed to load student records:", error);
      tableBody.innerHTML = '<tr><td colspan="6" class="px-lg py-8 text-center text-error">Unable to load student records.</td></tr>';
    }
  }

  function init() {
    setupFeatureLinks();
    setupAuth();
    setupEnrollment();
    setupStudentRecords();

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
