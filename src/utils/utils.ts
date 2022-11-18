// Header
export const stickyNav = () => {
  const offset = window.scrollY;
  const sticky = document.querySelectorAll(".header");

  sticky.forEach((el) => {
    if (el) {
      if (offset > 100) {
        el.classList.add("fixed");
        document.querySelector("body")?.classList.remove("background-enabled");

        return;
      }

      el.classList.remove("fixed");
      document.querySelector("body")?.classList.add("background-enabled");
    }
  });
};
