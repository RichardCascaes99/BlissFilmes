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
      threshold: 0.16,
      rootMargin: "0px 0px -24px 0px",
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

const projectVideos = document.querySelectorAll(".project-media video");

if (projectVideos.length > 0) {
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

    projectVideos.forEach((video) => videoObserver.observe(video));
  } else {
    projectVideos.forEach((video) => {
      video.controls = true;
    });
  }
}

const marqueeEmpty = document.querySelector(".marquee-empty");

if (marqueeEmpty) {
  marqueeEmpty.hidden = true;
}

const marquee = document.querySelector(".client-marquee");
const marqueeTrack = marquee?.querySelector(".marquee-track");
const marqueeSeedGroup = marqueeTrack?.querySelector(".marquee-group");

if (marquee && marqueeTrack && marqueeSeedGroup) {
  const sourceMarkup = marqueeSeedGroup.innerHTML;
  let resizeFrame = 0;

  const makeGroup = (hidden = false) => {
    const group = document.createElement("div");
    group.className = "marquee-group";
    if (hidden) {
      group.setAttribute("aria-hidden", "true");
      group.dataset.clone = "true";
    }
    group.innerHTML = sourceMarkup;
    return group;
  };

  const rebuildMarquee = () => {
    marqueeTrack.innerHTML = "";

    const firstGroup = makeGroup(false);
    marqueeTrack.appendChild(firstGroup);

    const baseWidth = Math.max(firstGroup.getBoundingClientRect().width, 1);
    const targetWidth = marquee.clientWidth * 3;
    let totalWidth = baseWidth;

    while (totalWidth < targetWidth) {
      const clone = makeGroup(true);
      marqueeTrack.appendChild(clone);
      totalWidth += clone.getBoundingClientRect().width;
    }

    const speedPxPerSecond = 55;
    const duration = Math.max(baseWidth / speedPxPerSecond, 14);
    marqueeTrack.style.setProperty("--marquee-distance", `${baseWidth}px`);
    marqueeTrack.style.setProperty("--marquee-duration", `${duration}s`);
  };

  const scheduleRebuild = () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(rebuildMarquee);
  };

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(scheduleRebuild);
    resizeObserver.observe(marquee);
  } else {
    window.addEventListener("resize", scheduleRebuild);
  }

  window.addEventListener("load", scheduleRebuild);
  scheduleRebuild();
}
