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

// Get DOM elements
const modal = document.getElementById("teacherModal");
const teacherForm = document.getElementById("teacherForm");
const teachersTableBody = document.getElementById("teachersTableBody");
const newTeacherBtn = document.querySelector('[data-action="new-teacher"]');
const closeModalBtns = document.querySelectorAll('[data-action="close-modal"]');
const searchInput = document.querySelector('input[placeholder*="Search teachers"]');
const departmentFilter = document.querySelector('select:nth-of-type(1)');
const statusFilter = document.querySelector('select:nth-of-type(2)');
const submitBtn = document.getElementById("submitBtn");
const modalTitle = document.getElementById("modalTitle");

let allTeachers = [];
let currentEditingId = null;
let teacherCounter = 1;

// Initialize the application
document.addEventListener("DOMContentLoaded", async () => {
  setupEventListeners();
  await loadTeachers();
  generateTeacherID();
});

// Setup all event listeners
function setupEventListeners() {
  newTeacherBtn.addEventListener("click", openAddModal);
  closeModalBtns.forEach((btn) => btn.addEventListener("click", closeModal));
  teacherForm.addEventListener("submit", handleFormSubmit);
  searchInput.addEventListener("input", filterTeachers);
  departmentFilter.addEventListener("change", filterTeachers);
  statusFilter.addEventListener("change", filterTeachers);

  // Close modal when clicking outside
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
}

// Load teachers from Firebase
async function loadTeachers() {
  try {
    const db = window.firebaseDb;
    const querySnapshot = await getDocs(collection(db, TEACHERS_COLLECTION));
    allTeachers = [];
    querySnapshot.forEach((doc) => {
      allTeachers.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    displayTeachers(allTeachers);
    updateTeacherCounter();
  } catch (error) {
    console.error("Error loading teachers:", error);
    showNotification("Error loading teachers", "error");
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
  teacherForm.reset();
  modalTitle.textContent = "Add New Teacher";
  submitBtn.textContent = "Add Teacher";
  document.getElementById("teacherName").focus();
  modal.classList.remove("hidden");
}

// Close modal
function closeModal() {
  modal.classList.add("hidden");
  teacherForm.reset();
  currentEditingId = null;
}

// Display teachers in table
function displayTeachers(teachers) {
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
  document.getElementById("teacherName").value = teacher.name;
  document.getElementById("teacherEmail").value = teacher.email;
  document.getElementById("teacherDepartment").value = teacher.department;
  document.getElementById("teacherPhone").value = teacher.phone || "";
  document.getElementById("teacherStatus").value = teacher.status;

  modalTitle.textContent = "Edit Teacher";
  submitBtn.textContent = "Update Teacher";
  modal.classList.remove("hidden");
  document.getElementById("teacherName").focus();
}

// Handle form submission
async function handleFormSubmit(e) {
  e.preventDefault();

  const teacherData = {
    name: document.getElementById("teacherName").value,
    email: document.getElementById("teacherEmail").value,
    department: document.getElementById("teacherDepartment").value,
    phone: document.getElementById("teacherPhone").value,
    status: document.getElementById("teacherStatus").value,
  };

  try {
    const db = window.firebaseDb;

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
  const searchTerm = searchInput.value.toLowerCase();
  const departmentFilter = document.querySelector('select:nth-of-type(1)').value;
  const statusFilter = document.querySelector('select:nth-of-type(2)').value;

  const filtered = allTeachers.filter((teacher) => {
    const matchesSearch =
      teacher.name.toLowerCase().includes(searchTerm) ||
      teacher.email.toLowerCase().includes(searchTerm) ||
      (teacher.teacherId && teacher.teacherId.toLowerCase().includes(searchTerm));

    const matchesDepartment =
      departmentFilter === "Filter by Department" ||
      departmentFilter === "" ||
      teacher.department === departmentFilter;

    const matchesStatus =
      statusFilter === "Filter by Status" ||
      statusFilter === "" ||
      teacher.status === statusFilter;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  displayTeachers(filtered);
}

// Show notification
function showNotification(message, type = "info") {
  // Create a simple notification (you can enhance this)
  const notification = document.createElement("div");
  notification.className = `fixed top-4 right-4 px-4 py-3 rounded-lg text-white z-[100] ${
    type === "success"
      ? "bg-success"
      : type === "error"
        ? "bg-error"
        : "bg-on-surface-variant"
  }`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}
