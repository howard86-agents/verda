(() => {
  try {
    const d = localStorage.getItem("verda.dark");
    document.documentElement.dataset.theme = d === "1" ? "dark" : "light";
  } catch {
    document.documentElement.dataset.theme = "light";
  }
})();
