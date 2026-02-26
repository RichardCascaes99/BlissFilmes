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

const projectScreens = document.querySelectorAll(".project-screen");

if (projectScreens.length > 0) {
  const syncProjectAudioButtons = () => {
    projectScreens.forEach((screen) => {
      const video = screen.querySelector(".project-media video");
      const toggle = screen.querySelector(".project-audio-toggle");
      if (!(video instanceof HTMLVideoElement) || !(toggle instanceof HTMLButtonElement)) return;

      const isAudioOn = !video.muted;
      toggle.classList.toggle("is-on", isAudioOn);
      toggle.setAttribute("aria-pressed", String(isAudioOn));
      toggle.setAttribute(
        "aria-label",
        isAudioOn ? "Desativar audio do video" : "Ativar audio do video"
      );
    });
  };

  projectScreens.forEach((screen) => {
    const video = screen.querySelector(".project-media video");
    const toggle = screen.querySelector(".project-audio-toggle");
    if (!(video instanceof HTMLVideoElement) || !(toggle instanceof HTMLButtonElement)) return;

    toggle.addEventListener("click", () => {
      const shouldEnableAudio = video.muted;

      if (shouldEnableAudio) {
        projectVideos.forEach((otherVideo) => {
          if (!(otherVideo instanceof HTMLVideoElement)) return;
          if (otherVideo !== video) {
            otherVideo.muted = true;
          }
        });

        video.muted = false;
        video.volume = 1;
        const playPromise = video.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {});
        }
      } else {
        video.muted = true;
      }

      syncProjectAudioButtons();
    });

    video.addEventListener("volumechange", syncProjectAudioButtons);
  });

  syncProjectAudioButtons();
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

const snapSectionSelector = "#home, #colaboradores, #portfolio .project-screen";
const snapSections = Array.from(document.querySelectorAll(snapSectionSelector));

if (snapSections.length > 1) {
  let snapLocked = false;
  let touchStartY = null;
  const touchThreshold = 2;
  const lockDuration = prefersReducedMotion ? 120 : 900;

  const getVisibleSections = () =>
    snapSections.filter((section) => section.offsetHeight > 0);

  const getSectionTop = (section) => section.getBoundingClientRect().top + window.scrollY;

  const getCurrentSectionIndex = () => {
    const sections = getVisibleSections();
    if (!sections.length) return -1;

    const probe = window.scrollY + window.innerHeight * 0.3;
    let currentIndex = 0;

    sections.forEach((section, index) => {
      if (probe >= getSectionTop(section) - 8) {
        currentIndex = index;
      }
    });

    return currentIndex;
  };

  const jumpToSectionIndex = (targetIndex) => {
    if (snapLocked) return;

    const sections = getVisibleSections();
    const target = sections[targetIndex];
    if (!target) return;

    snapLocked = true;
    target.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });

    window.setTimeout(() => {
      snapLocked = false;
    }, lockDuration);
  };

  const handleDirectionalSnap = (direction, event) => {
    const sections = getVisibleSections();
    if (sections.length < 2) return false;

    const currentIndex = getCurrentSectionIndex();
    if (currentIndex < 0) return false;

    const targetIndex =
      direction === "down"
        ? Math.min(currentIndex + 1, sections.length - 1)
        : Math.max(currentIndex - 1, 0);

    if (targetIndex === currentIndex) return false;

    if (event) event.preventDefault();
    jumpToSectionIndex(targetIndex);
    return true;
  };

  window.addEventListener(
    "wheel",
    (event) => {
      if (snapLocked) {
        event.preventDefault();
        return;
      }

      const direction = event.deltaY > 0 ? "down" : event.deltaY < 0 ? "up" : null;
      if (!direction) return;

      handleDirectionalSnap(direction, event);
    },
    { passive: false }
  );

  window.addEventListener("touchstart", (event) => {
    touchStartY = event.touches[0]?.clientY ?? null;
  });

  window.addEventListener(
    "touchmove",
    (event) => {
      if (touchStartY === null) return;

      if (snapLocked) {
        event.preventDefault();
        return;
      }

      const currentY = event.touches[0]?.clientY ?? touchStartY;
      const delta = touchStartY - currentY;
      if (Math.abs(delta) < touchThreshold) return;

      const direction = delta > 0 ? "down" : "up";
      const snapped = handleDirectionalSnap(direction, event);

      if (snapped) {
        touchStartY = null;
      }
    },
    { passive: false }
  );

  window.addEventListener("touchend", () => {
    touchStartY = null;
  });

  window.addEventListener("keydown", (event) => {
    const isDownKey =
      event.key === "ArrowDown" ||
      event.key === "PageDown" ||
      event.key === " " ||
      event.code === "Space";
    const isUpKey = event.key === "ArrowUp" || event.key === "PageUp";
    const direction = isDownKey ? "down" : isUpKey ? "up" : null;

    if (!direction) return;
    if (snapLocked) {
      event.preventDefault();
      return;
    }

    handleDirectionalSnap(direction, event);
  });
}
