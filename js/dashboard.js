document.addEventListener("DOMContentLoaded", () => {
  const reportButton = document.getElementById("generateCampusReport");

  if (reportButton) {
    reportButton.addEventListener("click", () => {
      window.location.href = "report.html";
    });
  }
});
