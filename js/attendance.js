import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const ATTENDANCE_COLLECTION = "attendance";

let allAttendance = [];
let currentEditingId = null;
let attendanceCounter = 1;

// DOM elements - declare globally
let modal, attendanceForm, attendanceTableBody, markAttendanceBtn, closeModalBtns;
let searchInput, classFilter, statusFilter, submitBtn, modalTitle;

// Initialize the application
document.addEventListener("DOMContentLoaded", async () => {
  // Get DOM elements after page loads
  modal = document.getElementById("attendanceModal");
  attendanceForm = document.getElementById("attendanceForm");
  attendanceTableBody = document.getElementById("attendanceTableBody");
  markAttendanceBtn = document.querySelector('[data-action="new-attendance"]');
  closeModalBtns = document.querySelectorAll('[data-action="close-modal"]');
  searchInput = document.querySelector('input[placeholder*="Search attendance"]');
  classFilter = document.querySelectorAll("select")[0];
  statusFilter = document.querySelectorAll("select")[1];
  submitBtn = document.getElementById("attendanceSubmitBtn");
  modalTitle = document.getElementById("attendanceModalTitle");

  // Verify all elements exist
  if (!modal || !attendanceForm || !attendanceTableBody) {
    console.error("Required DOM elements not found");
    return;
  }

  setupEventListeners();
  setTodayDate();
  await loadAttendance();
  generateAttendanceID();
});

// Setup all event listeners
function setupEventListeners() {
  if (markAttendanceBtn) {
    markAttendanceBtn.addEventListener("click", openMarkModal);
  }

  closeModalBtns.forEach((btn) => {
    btn.addEventListener("click", closeModal);
  });

  if (attendanceForm) {
    attendanceForm.addEventListener("submit", handleFormSubmit);
  }

  if (searchInput) {
    searchInput.addEventListener("input", filterAttendance);
  }

  if (classFilter) {
    classFilter.addEventListener("change", filterAttendance);
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", filterAttendance);
  }

  // Close modal when clicking outside
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }
}

// Set today's date as default
function setTodayDate() {
  const dateInput = document.getElementById("attendanceDate");
  if (dateInput) {
    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;
  }
}

// Load attendance records from Firebase
async function loadAttendance() {
  try {
    const db = window.firebaseDb;
    if (!db) {
      console.error("Firebase DB not initialized");
      return;
    }

    const querySnapshot = await getDocs(collection(db, ATTENDANCE_COLLECTION));
    allAttendance = [];
    querySnapshot.forEach((docSnapshot) => {
      allAttendance.push({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      });
    });
    displayAttendance(allAttendance);
    updateAttendanceCounter();
  } catch (error) {
    console.error("Error loading attendance:", error);
    showNotification("Error loading attendance records: " + error.message, "error");
  }
}

// Update attendance counter for ID generation
function updateAttendanceCounter() {
  if (allAttendance.length > 0) {
    const lastAttendanceId = allAttendance[allAttendance.length - 1].attendanceId;
    if (lastAttendanceId) {
      const match = lastAttendanceId.match(/ATT-(\d+)/);
      if (match) {
        attendanceCounter = parseInt(match[1]) + 1;
      }
    }
  }
}

// Generate unique attendance ID
function generateAttendanceID() {
  return `ATT-${String(attendanceCounter).padStart(4, "0")}`;
}

// Open mark attendance modal
function openMarkModal() {
  currentEditingId = null;
  if (attendanceForm) attendanceForm.reset();
  setTodayDate();
  if (modalTitle) modalTitle.textContent = "Mark Attendance";
  if (submitBtn) submitBtn.textContent = "Mark Attendance";
  const classInput = document.getElementById("attendanceClass");
  if (classInput) classInput.focus();
  if (modal) modal.classList.remove("hidden");
}

// Close modal
function closeModal() {
  if (modal) modal.classList.add("hidden");
  if (attendanceForm) attendanceForm.reset();
  currentEditingId = null;
}

// Display attendance records in table
function displayAttendance(records) {
  if (!attendanceTableBody) return;

  attendanceTableBody.innerHTML = "";

  if (records.length === 0) {
    attendanceTableBody.innerHTML =
      '<tr><td colspan="7" class="px-lg py-8 text-center text-on-surface-variant">No attendance records found</td></tr>';
    return;
  }

  records.forEach((record) => {
    const row = document.createElement("tr");
    row.className = "border-b border-outline-variant hover:bg-surface-container-high transition-colors";

    row.innerHTML = `
      <td class="px-lg py-4 font-label-md text-on-surface">${record.attendanceId || "N/A"}</td>
      <td class="px-lg py-4 font-label-md text-on-surface">${record.className}</td>
      <td class="px-lg py-4 font-label-md text-on-surface">${new Date(record.date).toLocaleDateString()}</td>
      <td class="px-lg py-4 font-label-md text-on-surface">${record.totalStudents}</td>
      <td class="px-lg py-4 font-label-md text-green-600">${record.present}</td>
      <td class="px-lg py-4 font-label-md text-red-600">${record.absent}</td>
      <td class="px-lg py-4 flex gap-2">
        <button class="px-3 py-1 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-secondary transition-colors edit-btn" data-id="${record.id}">
          Edit
        </button>
        <button class="px-3 py-1 bg-error text-on-error rounded-lg text-xs font-bold hover:opacity-90 transition-colors delete-btn" data-id="${record.id}">
          Delete
        </button>
      </td>
    `;

    // Add event listeners to action buttons
    row.querySelector(".edit-btn").addEventListener("click", () =>
      editAttendance(record)
    );
    row.querySelector(".delete-btn").addEventListener("click", () =>
      deleteAttendance(record.id)
    );

    attendanceTableBody.appendChild(row);
  });
}

// Edit attendance record
function editAttendance(record) {
  currentEditingId = record.id;
  const classInput = document.getElementById("attendanceClass");
  const dateInput = document.getElementById("attendanceDate");
  const totalInput = document.getElementById("attendanceTotalStudents");
  const presentInput = document.getElementById("attendancePresent");
  const absentInput = document.getElementById("attendanceAbsent");
  const notesInput = document.getElementById("attendanceNotes");

  if (classInput) classInput.value = record.className;
  if (dateInput) dateInput.value = record.date;
  if (totalInput) totalInput.value = record.totalStudents;
  if (presentInput) presentInput.value = record.present;
  if (absentInput) absentInput.value = record.absent;
  if (notesInput) notesInput.value = record.notes || "";

  if (modalTitle) modalTitle.textContent = "Edit Attendance";
  if (submitBtn) submitBtn.textContent = "Update Attendance";
  if (modal) modal.classList.remove("hidden");
  if (classInput) classInput.focus();
}

// Handle form submission
async function handleFormSubmit(e) {
  e.preventDefault();

  const classInput = document.getElementById("attendanceClass");
  const dateInput = document.getElementById("attendanceDate");
  const totalInput = document.getElementById("attendanceTotalStudents");
  const presentInput = document.getElementById("attendancePresent");
  const absentInput = document.getElementById("attendanceAbsent");
  const notesInput = document.getElementById("attendanceNotes");

  if (!classInput || !dateInput || !totalInput || !presentInput || !absentInput) {
    showNotification("Form fields not found", "error");
    return;
  }

  const totalStudents = parseInt(totalInput.value);
  const present = parseInt(presentInput.value);
  const absent = parseInt(absentInput.value);

  // Validate attendance numbers
  if (present + absent > totalStudents) {
    showNotification(
      "Present + Absent cannot exceed Total Students",
      "error"
    );
    return;
  }

  const attendanceData = {
    className: classInput.value.trim(),
    date: dateInput.value,
    totalStudents: totalStudents,
    present: present,
    absent: absent,
    notes: notesInput ? notesInput.value.trim() : "",
  };

  // Validation
  if (!attendanceData.className || !attendanceData.date) {
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
      // Update existing attendance
      await updateDoc(doc(db, ATTENDANCE_COLLECTION, currentEditingId), {
        ...attendanceData,
        updatedAt: serverTimestamp(),
      });
      showNotification("Attendance updated successfully", "success");
    } else {
      // Add new attendance
      await addDoc(collection(db, ATTENDANCE_COLLECTION), {
        ...attendanceData,
        attendanceId: generateAttendanceID(),
        createdAt: serverTimestamp(),
      });
      attendanceCounter++;
      showNotification("Attendance marked successfully", "success");
    }

    closeModal();
    await loadAttendance();
  } catch (error) {
    console.error("Error saving attendance:", error);
    showNotification("Error saving attendance: " + error.message, "error");
  }
}

// Delete attendance record
async function deleteAttendance(attendanceId) {
  if (!confirm("Are you sure you want to delete this attendance record?")) {
    return;
  }

  try {
    const db = window.firebaseDb;
    if (!db) {
      showNotification("Firebase not initialized", "error");
      return;
    }

    await deleteDoc(doc(db, ATTENDANCE_COLLECTION, attendanceId));
    showNotification("Attendance deleted successfully", "success");
    await loadAttendance();
  } catch (error) {
    console.error("Error deleting attendance:", error);
    showNotification("Error deleting attendance: " + error.message, "error");
  }
}

// Filter attendance records
function filterAttendance() {
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
  const classValue = classFilter ? classFilter.value : "";
  const statusValue = statusFilter ? statusFilter.value : "";

  const filtered = allAttendance.filter((record) => {
    const matchesSearch =
      record.className.toLowerCase().includes(searchTerm) ||
      (record.attendanceId &&
        record.attendanceId.toLowerCase().includes(searchTerm)) ||
      (record.notes && record.notes.toLowerCase().includes(searchTerm));

    const matchesClass =
      classValue === "Filter by Class" ||
      classValue === "" ||
      record.className === classValue;

    let matchesStatus = true;
    if (
      statusValue &&
      statusValue !== "Filter by Status" &&
      statusValue !== ""
    ) {
      if (statusValue === "Present") {
        matchesStatus = record.present > 0;
      } else if (statusValue === "Absent") {
        matchesStatus = record.absent > 0;
      } else if (statusValue === "Late") {
        matchesStatus = record.notes && record.notes.toLowerCase().includes("late");
      }
    }

    return matchesSearch && matchesClass && matchesStatus;
  });

  displayAttendance(filtered);
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

// Set today's date as default
function setTodayDate() {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("attendanceDate").value = today;
}

// Load attendance records from Firebase
async function loadAttendance() {
  try {
    const db = window.firebaseDb;
    const querySnapshot = await getDocs(collection(db, ATTENDANCE_COLLECTION));
    allAttendance = [];
    querySnapshot.forEach((doc) => {
      allAttendance.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    displayAttendance(allAttendance);
    updateAttendanceCounter();
  } catch (error) {
    console.error("Error loading attendance:", error);
    showNotification("Error loading attendance records", "error");
  }
}

// Update attendance counter for ID generation
function updateAttendanceCounter() {
  if (allAttendance.length > 0) {
    const lastAttendanceId = allAttendance[allAttendance.length - 1].attendanceId;
    if (lastAttendanceId) {
      const match = lastAttendanceId.match(/ATT-(\d+)/);
      if (match) {
        attendanceCounter = parseInt(match[1]) + 1;
      }
    }
  }
}

// Generate unique attendance ID
function generateAttendanceID() {
  return `ATT-${String(attendanceCounter).padStart(4, "0")}`;
}

// Open mark attendance modal
function openMarkModal() {
  currentEditingId = null;
  attendanceForm.reset();
  setTodayDate();
  modalTitle.textContent = "Mark Attendance";
  submitBtn.textContent = "Mark Attendance";
  document.getElementById("attendanceClass").focus();
  modal.classList.remove("hidden");
}

// Close modal
function closeModal() {
  modal.classList.add("hidden");
  attendanceForm.reset();
  currentEditingId = null;
}

// Display attendance records in table
function displayAttendance(records) {
  attendanceTableBody.innerHTML = "";

  if (records.length === 0) {
    attendanceTableBody.innerHTML =
      '<tr><td colspan="7" class="px-lg py-8 text-center text-on-surface-variant">No attendance records found</td></tr>';
    return;
  }

  records.forEach((record) => {
    const row = document.createElement("tr");
    row.className = "border-b border-outline-variant hover:bg-surface-container-high transition-colors";

    const attendanceRate = Math.round(
      (record.present / record.totalStudents) * 100
    );
    const rateColor =
      attendanceRate >= 80 ? "text-success" : "text-warning";

    row.innerHTML = `
      <td class="px-lg py-4 font-label-md text-on-surface">${record.attendanceId || "N/A"}</td>
      <td class="px-lg py-4 font-label-md text-on-surface">${record.className}</td>
      <td class="px-lg py-4 font-label-md text-on-surface">${new Date(record.date).toLocaleDateString()}</td>
      <td class="px-lg py-4 font-label-md text-on-surface">${record.totalStudents}</td>
      <td class="px-lg py-4 font-label-md text-success">${record.present}</td>
      <td class="px-lg py-4 font-label-md text-error">${record.absent}</td>
      <td class="px-lg py-4 flex gap-2">
        <button class="px-3 py-1 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-secondary transition-colors edit-btn" data-id="${record.id}">
          Edit
        </button>
        <button class="px-3 py-1 bg-error text-on-error rounded-lg text-xs font-bold hover:opacity-90 transition-colors delete-btn" data-id="${record.id}">
          Delete
        </button>
      </td>
    `;

    // Add event listeners to action buttons
    row.querySelector(".edit-btn").addEventListener("click", () =>
      editAttendance(record)
    );
    row.querySelector(".delete-btn").addEventListener("click", () =>
      deleteAttendance(record.id)
    );

    attendanceTableBody.appendChild(row);
  });
}

// Edit attendance record
function editAttendance(record) {
  currentEditingId = record.id;
  document.getElementById("attendanceClass").value = record.className;
  document.getElementById("attendanceDate").value = record.date;
  document.getElementById("attendanceTotalStudents").value = record.totalStudents;
  document.getElementById("attendancePresent").value = record.present;
  document.getElementById("attendanceAbsent").value = record.absent;
  document.getElementById("attendanceNotes").value = record.notes || "";

  modalTitle.textContent = "Edit Attendance";
  submitBtn.textContent = "Update Attendance";
  modal.classList.remove("hidden");
  document.getElementById("attendanceClass").focus();
}

// Handle form submission
async function handleFormSubmit(e) {
  e.preventDefault();

  const totalStudents = parseInt(
    document.getElementById("attendanceTotalStudents").value
  );
  const present = parseInt(document.getElementById("attendancePresent").value);
  const absent = parseInt(document.getElementById("attendanceAbsent").value);

  // Validate attendance numbers
  if (present + absent > totalStudents) {
    showNotification(
      "Present + Absent cannot exceed Total Students",
      "error"
    );
    return;
  }

  const attendanceData = {
    className: document.getElementById("attendanceClass").value,
    date: document.getElementById("attendanceDate").value,
    totalStudents: totalStudents,
    present: present,
    absent: absent,
    notes: document.getElementById("attendanceNotes").value,
  };

  try {
    const db = window.firebaseDb;

    if (currentEditingId) {
      // Update existing attendance
      await updateDoc(doc(db, ATTENDANCE_COLLECTION, currentEditingId), {
        ...attendanceData,
        updatedAt: serverTimestamp(),
      });
      showNotification("Attendance updated successfully", "success");
    } else {
      // Add new attendance
      await addDoc(collection(db, ATTENDANCE_COLLECTION), {
        ...attendanceData,
        attendanceId: generateAttendanceID(),
        createdAt: serverTimestamp(),
      });
      attendanceCounter++;
      showNotification("Attendance marked successfully", "success");
    }

    closeModal();
    await loadAttendance();
  } catch (error) {
    console.error("Error saving attendance:", error);
    showNotification("Error saving attendance: " + error.message, "error");
  }
}

// Delete attendance record
async function deleteAttendance(attendanceId) {
  if (!confirm("Are you sure you want to delete this attendance record?")) {
    return;
  }

  try {
    const db = window.firebaseDb;
    await deleteDoc(doc(db, ATTENDANCE_COLLECTION, attendanceId));
    showNotification("Attendance deleted successfully", "success");
    await loadAttendance();
  } catch (error) {
    console.error("Error deleting attendance:", error);
    showNotification("Error deleting attendance: " + error.message, "error");
  }
}

// Filter attendance records
function filterAttendance() {
  const searchTerm = searchInput.value.toLowerCase();
  const classFilterValue = document.querySelector('select:nth-of-type(1)').value;
  const statusFilterValue = document.querySelector('select:nth-of-type(2)').value;

  const filtered = allAttendance.filter((record) => {
    const matchesSearch =
      record.className.toLowerCase().includes(searchTerm) ||
      (record.attendanceId &&
        record.attendanceId.toLowerCase().includes(searchTerm)) ||
      (record.notes && record.notes.toLowerCase().includes(searchTerm));

    const matchesClass =
      classFilterValue === "Filter by Class" ||
      classFilterValue === "" ||
      record.className === classFilterValue;

    let matchesStatus = true;
    if (
      statusFilterValue &&
      statusFilterValue !== "Filter by Status" &&
      statusFilterValue !== ""
    ) {
      if (statusFilterValue === "Present") {
        matchesStatus = record.present > 0;
      } else if (statusFilterValue === "Absent") {
        matchesStatus = record.absent > 0;
      } else if (statusFilterValue === "Late") {
        matchesStatus = record.notes && record.notes.toLowerCase().includes("late");
      }
    }

    return matchesSearch && matchesClass && matchesStatus;
  });

  displayAttendance(filtered);
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
