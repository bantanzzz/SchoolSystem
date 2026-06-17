const inputs = document.querySelectorAll("input");
inputs.forEach((input) => {
  input.addEventListener("focus", () => {
    input.parentElement.parentElement.classList.add("scale-[1.01]");
    input.parentElement.parentElement.classList.add("transition-transform");
  });
  input.addEventListener("blur", () => {
    input.parentElement.parentElement.classList.remove("scale-[1.01]");
  });
});
