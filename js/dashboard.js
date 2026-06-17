import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  signOut
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Initialize dashboard on page load
document.addEventListener("DOMContentLoaded", async () => {
  checkAuthentication();
  setupEventListeners();
  await loadDashboardData();
});

// Check if user is authenticated
function checkAuthentication() {
  const auth = window.firebaseAuth;
  if (!auth.currentUser) {
    window.location.href = "./login.html";
  }
}

// Setup all event listeners
function setupEventListeners() {
  // Generate Report button
  document.getElementById("generateCampusReport")?.addEventListener("click", () => {
    window.location.href = "./report.html";
  });

  // Quick action buttons
  document.querySelector('[data-action="add-faculty"]')?.addEventListener("click", () => {
    window.location.href = "./teacher.html";
  });

  document.querySelector('[data-action="add-course"]')?.addEventListener("click", () => {
    window.location.href = "./class.html";
  });

  document.querySelector('[data-action="mass-email"]')?.addEventListener("click", () => {
    alert("Mass Email feature coming soon!");
  });

  document.querySelector('[data-action="campus-event"]')?.addEventListener("click", () => {
    alert("Campus Event feature coming soon!");
  });

  // View All activity button
  document.getElementById("viewAllActivityBtn")?.addEventListener("click", () => {
    alert("Full activity log feature coming soon!");
  });

  // Enroll New Student button
  const enrollBtn = document.querySelector('a[href="./studentEnrollment.html"]');
  if (enrollBtn) {
    enrollBtn.addEventListener("click", (e) => {
      if (!window.firebaseAuth.currentUser) {
        e.preventDefault();
        alert("Please log in first");
      }
    });
  }

  // Logout button
  const logoutBtn = document.querySelector('[data-action="logout"]');
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }

  // Search functionality
  const searchInput = document.querySelector('input[placeholder*="Search"]');
  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm.includes("student")) {
          window.location.href = "./studentrecord.html";
        } else if (searchTerm.includes("faculty") || searchTerm.includes("teacher")) {
          window.location.href = "./teacher.html";
        } else if (searchTerm.includes("course") || searchTerm.includes("class")) {
          window.location.href = "./class.html";
        }
      }
    });
  }

  // Notification button
  document.querySelectorAll('button[class*="notifications"]').forEach(btn => {
    btn.addEventListener("click", () => {
      alert("You have no new notifications.");
    });
  });
}

// Load all dashboard data
async function loadDashboardData() {
  try {
    const db = window.firebaseDb;

    // Load students count
    const studentsSnapshot = await getDocs(collection(db, "students"));
    const totalStudents = studentsSnapshot.size;

    // Load teachers count
    const teachersSnapshot = await getDocs(collection(db, "teachers"));
    const totalTeachers = teachersSnapshot.size;

    // Load classes count
    const classesSnapshot = await getDocs(collection(db, "classes"));
    const totalClasses = classesSnapshot.size;

    // Load attendance for rate calculation
    const attendanceSnapshot = await getDocs(collection(db, "attendance"));
    const attendanceRecords = [];
    attendanceSnapshot.forEach(doc => {
      attendanceRecords.push(doc.data());
    });

    // Calculate attendance rate
    let attendanceRate = 94.2;
    if (attendanceRecords.length > 0) {
      const totalPresent = attendanceRecords.reduce((sum, rec) => sum + (rec.present || 0), 0);
      const totalStudentsAttendance = attendanceRecords.reduce((sum, rec) => sum + (rec.totalStudents || 0), 0);
      if (totalStudentsAttendance > 0) {
        attendanceRate = ((totalPresent / totalStudentsAttendance) * 100).toFixed(1);
      }
    }

    // Update metric cards with real data
    updateMetricCard("studentsCard", totalStudents);
    updateMetricCard("teachersCard", totalTeachers);
    updateMetricCard("classesCard", totalClasses);
    updateMetricCard("attendanceCard", attendanceRate + "%");

    // Update attendance progress bar
    updateAttendanceBar(attendanceRate);

  } catch (error) {
    console.error("Error loading dashboard data:", error);
  }
}

// Update metric card with real data
function updateMetricCard(cardId, value) {
  const card = document.getElementById(cardId);
  if (card) {
    const numberElement = card.querySelector(".text-3xl.font-bold");
    if (numberElement) {
      numberElement.textContent = value;
    }
  }
}

// Update attendance progress bar
function updateAttendanceBar(rate) {
  const attendanceCard = document.getElementById("attendanceCard");
  if (attendanceCard) {
    const progressBar = attendanceCard.querySelector(".h-full.bg-primary.rounded-full");
    if (progressBar) {
      progressBar.style.width = rate + "%";
    }
  }
}

// Handle logout
async function handleLogout() {
  if (confirm("Are you sure you want to logout?")) {
    try {
      const auth = window.firebaseAuth;
      await signOut(auth);
      window.location.href = "./login.html";
    } catch (error) {
      console.error("Error logging out:", error);
      alert("Error logging out. Please try again.");
    }
  }
}
