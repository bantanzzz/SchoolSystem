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

// Get DOM elements
const modal = document.getElementById("classModal");
const classForm = document.getElementById("classForm");
const classesTableBody = document.getElementById("classesTableBody");
const newClassBtn = document.querySelector('[data-action="new-class"]');
const closeModalBtns = document.querySelectorAll('[data-action="close-modal"]');
const searchInput = document.querySelector('input[placeholder*="Search classes"]');
const gradeFilter = document.querySelector('select:nth-of-type(1)');
const statusFilter = document.querySelector('select:nth-of-type(2)');
const submitBtn = document.getElementById("classSubmitBtn");
const modalTitle = document.getElementById("classModalTitle");

let allClasses = [];
let currentEditingId = null;
let classCounter = 1;

// Initialize the application
document.addEventListener("DOMContentLoaded", async () => {
  setupEventListeners();
  await loadClasses();
  generateClassID();
});

// Setup all event listeners
function setupEventListeners() {
  newClassBtn.addEventListener("click", openAddModal);
  closeModalBtns.forEach((btn) => btn.addEventListener("click", closeModal));
  classForm.addEventListener("submit", handleFormSubmit);
  searchInput.addEventListener("input", filterClasses);
  gradeFilter.addEventListener("change", filterClasses);
  statusFilter.addEventListener("change", filterClasses);

  // Close modal when clicking outside
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
}

// Load classes from Firebase
async function loadClasses() {
  try {
    const db = window.firebaseDb;
    const querySnapshot = await getDocs(collection(db, CLASSES_COLLECTION));
    allClasses = [];
    querySnapshot.forEach((doc) => {
      allClasses.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    displayClasses(allClasses);
    updateClassCounter();
  } catch (error) {
    console.error("Error loading classes:", error);
    showNotification("Error loading classes", "error");
  }
}

// Update class counter for ID generation
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

// Generate unique class ID
function generateClassID() {
  return `CLS-${String(classCounter).padStart(3, "0")}`;
}

// Open add class modal
function openAddModal() {
  currentEditingId = null;
  classForm.reset();
  modalTitle.textContent = "Add New Class";
  submitBtn.textContent = "Add Class";
  document.getElementById("className").focus();
  modal.classList.remove("hidden");
}

// Close modal
function closeModal() {
  modal.classList.add("hidden");
  classForm.reset();
  currentEditingId = null;
}

// Display classes in table
function displayClasses(classes) {
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

    // Add event listeners to action buttons
    row.querySelector(".edit-btn").addEventListener("click", () => editClass(cls));
    row.querySelector(".delete-btn").addEventListener("click", () => deleteClass(cls.id));

    classesTableBody.appendChild(row);
  });
}

// Edit class
function editClass(cls) {
  currentEditingId = cls.id;
  document.getElementById("className").value = cls.name;
  document.getElementById("classGrade").value = cls.grade;
  document.getElementById("classTeacher").value = cls.teacher;
  document.getElementById("classSchedule").value = cls.schedule;
  document.getElementById("classRoom").value = cls.room || "";
  document.getElementById("classStatus").value = cls.status;

  modalTitle.textContent = "Edit Class";
  submitBtn.textContent = "Update Class";
  modal.classList.remove("hidden");
  document.getElementById("className").focus();
}

// Handle form submission
async function handleFormSubmit(e) {
  e.preventDefault();

  const classData = {
    name: document.getElementById("className").value,
    grade: document.getElementById("classGrade").value,
    teacher: document.getElementById("classTeacher").value,
    schedule: document.getElementById("classSchedule").value,
    room: document.getElementById("classRoom").value,
    status: document.getElementById("classStatus").value,
  };

  try {
    const db = window.firebaseDb;

    if (currentEditingId) {
      // Update existing class
      await updateDoc(doc(db, CLASSES_COLLECTION, currentEditingId), {
        ...classData,
        updatedAt: serverTimestamp(),
      });
      showNotification("Class updated successfully", "success");
    } else {
      // Add new class
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

// Delete class
async function deleteClass(classId) {
  if (!confirm("Are you sure you want to delete this class?")) {
    return;
  }

  try {
    const db = window.firebaseDb;
    await deleteDoc(doc(db, CLASSES_COLLECTION, classId));
    showNotification("Class deleted successfully", "success");
    await loadClasses();
  } catch (error) {
    console.error("Error deleting class:", error);
    showNotification("Error deleting class: " + error.message, "error");
  }
}

// Filter classes
function filterClasses() {
  const searchTerm = searchInput.value.toLowerCase();
  const gradeFilterValue = document.querySelector('select:nth-of-type(1)').value;
  const statusFilterValue = document.querySelector('select:nth-of-type(2)').value;

  const filtered = allClasses.filter((cls) => {
    const matchesSearch =
      cls.name.toLowerCase().includes(searchTerm) ||
      cls.teacher.toLowerCase().includes(searchTerm) ||
      (cls.classCode && cls.classCode.toLowerCase().includes(searchTerm));

    const matchesGrade =
      gradeFilterValue === "Filter by Year" ||
      gradeFilterValue === "" ||
      cls.grade === gradeFilterValue;

    const matchesStatus =
      statusFilterValue === "Filter by Status" ||
      statusFilterValue === "" ||
      cls.status === statusFilterValue;

    return matchesSearch && matchesGrade && matchesStatus;
  });

  displayClasses(filtered);
}

// Show notification
function showNotification(message, type = "info") {
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
