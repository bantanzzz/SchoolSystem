import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const CLASSES_COLLECTION = "classes";

let allClasses = [];
let currentEditingId = null;
let classCounter = 1;

let modal, classForm, classesTableBody, newClassBtn, closeModalBtns;
let searchInput, gradeFilter, statusFilter, submitBtn, modalTitle;

function waitForFirebaseAndInit() {
  let attempts = 0;
  const interval = setInterval(() => {
    if (window.firebaseDb) {
      clearInterval(interval);
      init();
    }
    attempts++;
    if (attempts > 100) {
      clearInterval(interval);
      console.error("Firebase initialization timed out.");
    }
  }, 100);
}

function init() {
  modal = document.getElementById("classModal");
  classForm = document.getElementById("classForm");
  classesTableBody = document.getElementById("classesTableBody");
  newClassBtn = document.querySelector('[data-action="new-class"]');
  closeModalBtns = document.querySelectorAll('[data-action="close-modal"]');
  searchInput = document.querySelector('input[placeholder*="Search classes"]');
  gradeFilter = document.querySelectorAll("select")[0];
  statusFilter = document.querySelectorAll("select")[1];
  submitBtn = document.getElementById("classSubmitBtn");
  modalTitle = document.getElementById("classModalTitle");

  setupEventListeners();
  loadClasses();
}

function setupEventListeners() {
  if (newClassBtn) {
    newClassBtn.addEventListener("click", openAddModal);
  }

  closeModalBtns.forEach((btn) => {
    btn.addEventListener("click", closeModal);
  });

  if (classForm) {
    classForm.addEventListener("submit", handleFormSubmit);
  }

  if (searchInput) {
    searchInput.addEventListener("input", filterClasses);
  }

  if (gradeFilter) {
    gradeFilter.addEventListener("change", filterClasses);
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", filterClasses);
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }
}

async function loadClasses() {
  try {
    const db = window.firebaseDb;
    if (!db) {
      console.error("Firebase DB not initialized");
      return;
    }

    const querySnapshot = await getDocs(collection(db, CLASSES_COLLECTION));
    allClasses = [];
    querySnapshot.forEach((docSnapshot) => {
      allClasses.push({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      });
    });
    displayClasses(allClasses);
    updateClassCounter();
  } catch (error) {
    console.error("Error loading classes:", error);
    showNotification("Error loading classes: " + error.message, "error");
  }
}

function updateClassCounter() {
  if (allClasses.length > 0) {
    const lastClassId = allClasses[allClasses.length - 1].classCode;
    if (lastClassId) {
      const match = lastClassId.match(/CLS-(\d+)/);
      if (match) {
        classCounter = parseInt(match[1]) + 1;
      }
    }
  }
}

function generateClassID() {
  return `CLS-${String(classCounter).padStart(3, "0")}`;
}

function openAddModal() {
  currentEditingId = null;
  if (classForm) classForm.reset();
  if (modalTitle) modalTitle.textContent = "Add New Class";
  if (submitBtn) submitBtn.textContent = "Add Class";
  const nameInput = document.getElementById("className");
  if (nameInput) nameInput.focus();
  if (modal) modal.classList.remove("hidden");
}

function closeModal() {
  if (modal) modal.classList.add("hidden");
  if (classForm) classForm.reset();
  currentEditingId = null;
}

function displayClasses(classes) {
  if (!classesTableBody) return;

  classesTableBody.innerHTML = "";

  if (classes.length === 0) {
    classesTableBody.innerHTML =
      '<tr><td colspan="6" class="px-lg py-8 text-center text-on-surface-variant">No classes found</td></tr>';
    return;
  }

  classes.forEach((cls) => {
    const row = document.createElement("tr");
    row.className = "border-b border-outline-variant hover:bg-surface-container-high transition-colors";

    const statusClass = cls.status === "Open" ? "text-success" : "text-on-surface-variant";

    row.innerHTML = `
      <td class="px-lg py-4 font-label-md text-on-surface">${cls.classCode || "N/A"}</td>
      <td class="px-lg py-4 font-label-md text-on-surface">${cls.name}</td>
      <td class="px-lg py-4 font-label-md text-on-surface">${cls.teacher}</td>
      <td class="px-lg py-4 font-label-md text-on-surface">${cls.schedule}</td>
      <td class="px-lg py-4 font-label-md ${statusClass}">${cls.status}</td>
      <td class="px-lg py-4 flex gap-2">
        <button class="px-3 py-1 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-secondary transition-colors edit-btn" data-id="${cls.id}">
          Edit
        </button>
        <button class="px-3 py-1 bg-error text-on-error rounded-lg text-xs font-bold hover:opacity-90 transition-colors delete-btn" data-id="${cls.id}">
          Delete
        </button>
      </td>
    `;

    const editBtn = row.querySelector(".edit-btn");
    const deleteBtn = row.querySelector(".delete-btn");
    if (editBtn) editBtn.addEventListener("click", () => editClass(cls));
    if (deleteBtn) deleteBtn.addEventListener("click", () => deleteClass(cls.id));

    classesTableBody.appendChild(row);
  });
}

function editClass(cls) {
  currentEditingId = cls.id;
  const nameInput = document.getElementById("className");
  const gradeInput = document.getElementById("classGrade");
  const teacherInput = document.getElementById("classTeacher");
  const scheduleInput = document.getElementById("classSchedule");
  const roomInput = document.getElementById("classRoom");
  const statusInput = document.getElementById("classStatus");

  if (nameInput) nameInput.value = cls.name;
  if (gradeInput) gradeInput.value = cls.grade;
  if (teacherInput) teacherInput.value = cls.teacher;
  if (scheduleInput) scheduleInput.value = cls.schedule;
  if (roomInput) roomInput.value = cls.room || "";
  if (statusInput) statusInput.value = cls.status;

  if (modalTitle) modalTitle.textContent = "Edit Class";
  if (submitBtn) submitBtn.textContent = "Update Class";
  if (modal) modal.classList.remove("hidden");
  if (nameInput) nameInput.focus();
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const nameInput = document.getElementById("className");
  const gradeInput = document.getElementById("classGrade");
  const teacherInput = document.getElementById("classTeacher");
  const scheduleInput = document.getElementById("classSchedule");
  const roomInput = document.getElementById("classRoom");
  const statusInput = document.getElementById("classStatus");

  if (!nameInput || !gradeInput || !teacherInput || !scheduleInput || !statusInput) {
    showNotification("Form fields not found", "error");
    return;
  }

  const classData = {
    name: nameInput.value.trim(),
    grade: gradeInput.value,
    teacher: teacherInput.value.trim(),
    schedule: scheduleInput.value.trim(),
    room: roomInput ? roomInput.value.trim() : "",
    status: statusInput.value,
  };

  if (!classData.name || !classData.grade || !classData.teacher || !classData.schedule) {
    showNotification("Please fill in all required fields", "error");
    return;
  }

  try {
    const db = window.firebaseDb;
    if (!db) {
      showNotification("Firebase not initialized", "error");
      return;
    }

    if (currentEditingId) {
      await updateDoc(doc(db, CLASSES_COLLECTION, currentEditingId), {
        ...classData,
        updatedAt: serverTimestamp(),
      });
      showNotification("Class updated successfully", "success");
    } else {
      await addDoc(collection(db, CLASSES_COLLECTION), {
        ...classData,
        classCode: generateClassID(),
        createdAt: serverTimestamp(),
      });
      classCounter++;
      showNotification("Class added successfully", "success");
    }

    closeModal();
    await loadClasses();
  } catch (error) {
    console.error("Error saving class:", error);
    showNotification("Error saving class: " + error.message, "error");
  }
}

async function deleteClass(classId) {
  if (!confirm("Are you sure you want to delete this class?")) {
    return;
  }

  try {
    const db = window.firebaseDb;
    if (!db) {
      showNotification("Firebase not initialized", "error");
      return;
    }

    await deleteDoc(doc(db, CLASSES_COLLECTION, classId));
    showNotification("Class deleted successfully", "success");
    await loadClasses();
  } catch (error) {
    console.error("Error deleting class:", error);
    showNotification("Error deleting class: " + error.message, "error");
  }
}

function filterClasses() {
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
  const gradeValue = gradeFilter ? gradeFilter.value : "";
  const statusValue = statusFilter ? statusFilter.value : "";

  const filtered = allClasses.filter((cls) => {
    const matchesSearch =
      cls.name.toLowerCase().includes(searchTerm) ||
      cls.teacher.toLowerCase().includes(searchTerm) ||
      (cls.classCode && cls.classCode.toLowerCase().includes(searchTerm));

    const matchesGrade =
      gradeValue === "Filter by System" ||
      gradeValue === "" ||
      cls.grade === gradeValue;

    const matchesStatus =
      statusValue === "Filter by Status" ||
      statusValue === "" ||
      cls.status === statusValue;

    return matchesSearch && matchesGrade && matchesStatus;
  });

  displayClasses(filtered);
}

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

waitForFirebaseAndInit();