const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.2,
      rootMargin: "0px 0px -32px 0px",
    }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const mediaSlots = document.querySelectorAll(".media-slot");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

mediaSlots.forEach((slot) => {
  const image = slot.querySelector("img");
  const video = slot.querySelector("video");

  if (image) {
    const showFallback = () => slot.classList.add("is-empty");
    const hideFallback = () => slot.classList.remove("is-empty");

    image.addEventListener("error", showFallback);
    image.addEventListener("load", hideFallback);

    if (image.complete && image.naturalWidth === 0) {
      showFallback();
    }
  }

  if (video) {
    const showFallback = () => slot.classList.add("is-empty");
    const hideFallback = () => slot.classList.remove("is-empty");

    video.addEventListener("error", showFallback);
    video.addEventListener("loadeddata", hideFallback);
  }
});

const portfolioVideos = document.querySelectorAll(".project-grid .project-media video");

if (portfolioVideos.length > 0) {
  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    const videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (!(video instanceof HTMLVideoElement)) return;

          if (entry.isIntersecting) {
            const playPromise = video.play();
            if (playPromise && typeof playPromise.catch === "function") {
              playPromise.catch(() => {});
            }
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.45 }
    );

    portfolioVideos.forEach((video) => videoObserver.observe(video));
  } else {
    portfolioVideos.forEach((video) => {
      video.controls = true;
    });
  }
}

const carousel = document.querySelector("[data-carousel]");
const track = carousel?.querySelector(".carousel-track");
const slides = track ? [...track.children] : [];
const nextButton = carousel?.querySelector("[data-next]");
const prevButton = carousel?.querySelector("[data-prev]");
const dotsNav = document.querySelector("[data-dots]");

if (carousel && track && slides.length > 0 && dotsNav) {
  let activeIndex = 0;
  let autoRotateTimer = null;

  slides.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Ir para etapa ${index + 1}`);
    dot.dataset.index = String(index);
    if (index === activeIndex) {
      dot.setAttribute("aria-current", "true");
    }
    dotsNav.appendChild(dot);
  });

  const dots = [...dotsNav.children];

  const goToSlide = (index) => {
    activeIndex = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${activeIndex * 100}%)`;
    dots.forEach((dot, dotIndex) => {
      if (dotIndex === activeIndex) {
        dot.setAttribute("aria-current", "true");
      } else {
        dot.removeAttribute("aria-current");
      }
    });
  };

  const startAutoRotate = () => {
    stopAutoRotate();
    autoRotateTimer = window.setInterval(() => {
      goToSlide(activeIndex + 1);
    }, 5500);
  };

  const stopAutoRotate = () => {
    if (autoRotateTimer) {
      window.clearInterval(autoRotateTimer);
      autoRotateTimer = null;
    }
  };

  nextButton?.addEventListener("click", () => {
    goToSlide(activeIndex + 1);
    startAutoRotate();
  });

  prevButton?.addEventListener("click", () => {
    goToSlide(activeIndex - 1);
    startAutoRotate();
  });

  dotsNav.addEventListener("click", (event) => {
    const target = event.target;
    if (target instanceof HTMLButtonElement && target.dataset.index) {
      goToSlide(Number(target.dataset.index));
      startAutoRotate();
    }
  });

  carousel.addEventListener("mouseenter", stopAutoRotate);
  carousel.addEventListener("mouseleave", startAutoRotate);
  carousel.addEventListener("focusin", stopAutoRotate);
  carousel.addEventListener("focusout", startAutoRotate);

  startAutoRotate();
}
