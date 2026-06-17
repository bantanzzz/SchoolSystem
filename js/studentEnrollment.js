const enrollmentForm = document.getElementById("enrollmentForm");
const formStatus = document.getElementById("formStatus");
enrollmentForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!enrollmentForm.checkValidity()) {
    formStatus.textContent = "Please complete all required fields.";
    formStatus.className =
      "mt-lg rounded-lg bg-error-container px-md py-sm text-error text-label-md font-medium";
    formStatus.classList.remove("hidden");
    enrollmentForm.reportValidity();
    return;
  }
  formStatus.textContent = "Enrollment saved successfully.";
  formStatus.className =
    "mt-lg rounded-lg bg-green-100 px-md py-sm text-green-700 text-label-md font-medium";
  formStatus.classList.remove("hidden");
  enrollmentForm.reset();
});
document.getElementById("resetEnrollment").addEventListener("click", () => {
  enrollmentForm.reset();
  formStatus.textContent = "";
  formStatus.classList.add("hidden");
});
document.getElementById("uploadPhoto").addEventListener("click", () => {
  document.getElementById("studentPhoto").click();
});
