import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const TEACHERS_COLLECTION = "teachers";

let allTeachers = [];
let currentEditingId = null;
let teacherCounter = 1;

// DOM elements - declare globally
let modal, teacherForm, teachersTableBody, newTeacherBtn, closeModalBtns;
let searchInput, departmentFilter, statusFilter, submitBtn, modalTitle;

// Initialize the application
document.addEventListener("DOMContentLoaded", async () => {
  // Get DOM elements after page loads
  modal = document.getElementById("teacherModal");
  teacherForm = document.getElementById("teacherForm");
  teachersTableBody = document.getElementById("teachersTableBody");
  newTeacherBtn = document.querySelector('[data-action="new-teacher"]');
  closeModalBtns = document.querySelectorAll('[data-action="close-modal"]');
  searchInput = document.querySelector('input[placeholder*="Search teachers"]');
  departmentFilter = document.querySelectorAll("select")[0];
  statusFilter = document.querySelectorAll("select")[1];
  submitBtn = document.getElementById("submitBtn");
  modalTitle = document.getElementById("modalTitle");

  // Verify all elements exist
  if (!modal || !teacherForm || !teachersTableBody) {
    console.error("Required DOM elements not found");
    return;
  }

  setupEventListeners();
  await loadTeachers();
  generateTeacherID();
});

// Setup all event listeners
function setupEventListeners() {
  if (newTeacherBtn) {
    newTeacherBtn.addEventListener("click", openAddModal);
  }

  closeModalBtns.forEach((btn) => {
    btn.addEventListener("click", closeModal);
  });

  if (teacherForm) {
    teacherForm.addEventListener("submit", handleFormSubmit);
  }

  if (searchInput) {
    searchInput.addEventListener("input", filterTeachers);
  }

  if (departmentFilter) {
    departmentFilter.addEventListener("change", filterTeachers);
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", filterTeachers);
  }

  // Close modal when clicking outside
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }
}

// Load teachers from Firebase
async function loadTeachers() {
  try {
    const db = window.firebaseDb;
    if (!db) {
      console.error("Firebase DB not initialized");
      return;
    }

    const querySnapshot = await getDocs(collection(db, TEACHERS_COLLECTION));
    allTeachers = [];
    querySnapshot.forEach((docSnapshot) => {
      allTeachers.push({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      });
    });
    displayTeachers(allTeachers);
    updateTeacherCounter();
  } catch (error) {
    console.error("Error loading teachers:", error);
    showNotification("Error loading teachers: " + error.message, "error");
  }
}

// Update teacher counter for ID generation
function updateTeacherCounter() {
  if (allTeachers.length > 0) {
    const lastTeacherId = allTeachers[allTeachers.length - 1].teacherId;
    if (lastTeacherId) {
      const match = lastTeacherId.match(/TCH-(\d+)/);
      if (match) {
        teacherCounter = parseInt(match[1]) + 1;
      }
    }
  }
}

// Generate unique teacher ID
function generateTeacherID() {
  return `TCH-${String(teacherCounter).padStart(3, "0")}`;
}

// Open add teacher modal
function openAddModal() {
  currentEditingId = null;
  if (teacherForm) teacherForm.reset();
  if (modalTitle) modalTitle.textContent = "Add New Teacher";
  if (submitBtn) submitBtn.textContent = "Add Teacher";
  const nameInput = document.getElementById("teacherName");
  if (nameInput) nameInput.focus();
  if (modal) modal.classList.remove("hidden");
}

// Close modal
function closeModal() {
  if (modal) modal.classList.add("hidden");
  if (teacherForm) teacherForm.reset();
  currentEditingId = null;
}

// Display teachers in table
function displayTeachers(teachers) {
  if (!teachersTableBody) return;

  teachersTableBody.innerHTML = "";

  if (teachers.length === 0) {
    teachersTableBody.innerHTML =
      '<tr><td colspan="6" class="px-lg py-8 text-center text-on-surface-variant">No teachers found</td></tr>';
    return;
  }

  teachers.forEach((teacher) => {
    const row = document.createElement("tr");
    row.className = "border-b border-outline-variant hover:bg-surface-container-high transition-colors";

    const statusClass =
      teacher.status === "Active"
        ? "text-success"
        : "text-on-surface-variant";

    row.innerHTML = `
      <td class="px-lg py-4 font-label-md text-on-surface">${teacher.teacherId || "N/A"}</td>
      <td class="px-lg py-4 font-label-md text-on-surface">${teacher.name}</td>
      <td class="px-lg py-4 font-label-md text-on-surface">${teacher.department}</td>
      <td class="px-lg py-4 font-label-md text-on-surface">${teacher.email}</td>
      <td class="px-lg py-4 font-label-md ${statusClass}">${teacher.status}</td>
      <td class="px-lg py-4 flex gap-2">
        <button class="px-3 py-1 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-secondary transition-colors edit-btn" data-id="${teacher.id}">
          Edit
        </button>
        <button class="px-3 py-1 bg-error text-on-error rounded-lg text-xs font-bold hover:opacity-90 transition-colors delete-btn" data-id="${teacher.id}">
          Delete
        </button>
      </td>
    `;

    // Add event listeners to action buttons
    row.querySelector(".edit-btn").addEventListener("click", () => editTeacher(teacher));
    row.querySelector(".delete-btn").addEventListener("click", () => deleteTeacher(teacher.id));

    teachersTableBody.appendChild(row);
  });
}

// Edit teacher
function editTeacher(teacher) {
  currentEditingId = teacher.id;
  const nameInput = document.getElementById("teacherName");
  const emailInput = document.getElementById("teacherEmail");
  const deptInput = document.getElementById("teacherDepartment");
  const phoneInput = document.getElementById("teacherPhone");
  const statusInput = document.getElementById("teacherStatus");

  if (nameInput) nameInput.value = teacher.name;
  if (emailInput) emailInput.value = teacher.email;
  if (deptInput) deptInput.value = teacher.department;
  if (phoneInput) phoneInput.value = teacher.phone || "";
  if (statusInput) statusInput.value = teacher.status;

  if (modalTitle) modalTitle.textContent = "Edit Teacher";
  if (submitBtn) submitBtn.textContent = "Update Teacher";
  if (modal) modal.classList.remove("hidden");
  if (nameInput) nameInput.focus();
}

// Handle form submission
async function handleFormSubmit(e) {
  e.preventDefault();

  const nameInput = document.getElementById("teacherName");
  const emailInput = document.getElementById("teacherEmail");
  const deptInput = document.getElementById("teacherDepartment");
  const phoneInput = document.getElementById("teacherPhone");
  const statusInput = document.getElementById("teacherStatus");

  if (!nameInput || !emailInput || !deptInput || !statusInput) {
    showNotification("Form fields not found", "error");
    return;
  }

  const teacherData = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    department: deptInput.value,
    phone: phoneInput ? phoneInput.value.trim() : "",
    status: statusInput.value,
  };

  // Validation
  if (!teacherData.name || !teacherData.email || !teacherData.department) {
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
      // Update existing teacher
      await updateDoc(doc(db, TEACHERS_COLLECTION, currentEditingId), {
        ...teacherData,
        updatedAt: serverTimestamp(),
      });
      showNotification("Teacher updated successfully", "success");
    } else {
      // Add new teacher
      await addDoc(collection(db, TEACHERS_COLLECTION), {
        ...teacherData,
        teacherId: generateTeacherID(),
        createdAt: serverTimestamp(),
      });
      teacherCounter++;
      showNotification("Teacher added successfully", "success");
    }

    closeModal();
    await loadTeachers();
  } catch (error) {
    console.error("Error saving teacher:", error);
    showNotification("Error saving teacher: " + error.message, "error");
  }
}

// Delete teacher
async function deleteTeacher(teacherId) {
  if (!confirm("Are you sure you want to delete this teacher?")) {
    return;
  }

  try {
    const db = window.firebaseDb;
    if (!db) {
      showNotification("Firebase not initialized", "error");
      return;
    }

    await deleteDoc(doc(db, TEACHERS_COLLECTION, teacherId));
    showNotification("Teacher deleted successfully", "success");
    await loadTeachers();
  } catch (error) {
    console.error("Error deleting teacher:", error);
    showNotification("Error deleting teacher: " + error.message, "error");
  }
}

// Filter teachers
function filterTeachers() {
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
  const deptValue = departmentFilter ? departmentFilter.value : "";
  const statusValue = statusFilter ? statusFilter.value : "";

  const filtered = allTeachers.filter((teacher) => {
    const matchesSearch =
      teacher.name.toLowerCase().includes(searchTerm) ||
      teacher.email.toLowerCase().includes(searchTerm) ||
      (teacher.teacherId && teacher.teacherId.toLowerCase().includes(searchTerm));

    const matchesDepartment =
      deptValue === "Filter by Department" ||
      deptValue === "" ||
      teacher.department === deptValue;

    const matchesStatus =
      statusValue === "Filter by Status" ||
      statusValue === "" ||
      teacher.status === statusValue;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  displayTeachers(filtered);
}

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
