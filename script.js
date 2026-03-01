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
const isMobileViewport = window.matchMedia("(max-width: 740px)").matches;

const teamCards = Array.from(document.querySelectorAll(".team-strip .team-card"));
const teamMobileQuery = window.matchMedia("(max-width: 740px)");
let teamLoopInterval = null;

const setActiveMobileTeamCard = (activeIndex) => {
  teamCards.forEach((card, index) => {
    card.classList.toggle("is-mobile-active", index === activeIndex);
  });
};

const stopMobileTeamLoop = () => {
  if (teamLoopInterval !== null) {
    window.clearInterval(teamLoopInterval);
    teamLoopInterval = null;
  }
  teamCards.forEach((card) => card.classList.remove("is-mobile-active"));
};

const startMobileTeamLoop = () => {
  if (!teamCards.length) return;

  stopMobileTeamLoop();
  let activeIndex = 0;
  setActiveMobileTeamCard(activeIndex);

  if (prefersReducedMotion) return;

  teamLoopInterval = window.setInterval(() => {
    activeIndex = (activeIndex + 1) % teamCards.length;
    setActiveMobileTeamCard(activeIndex);
  }, 3400);
};

const syncTeamMobileMode = () => {
  if (teamMobileQuery.matches) {
    startMobileTeamLoop();
  } else {
    stopMobileTeamLoop();
  }
};

if (typeof teamMobileQuery.addEventListener === "function") {
  teamMobileQuery.addEventListener("change", syncTeamMobileMode);
} else if (typeof teamMobileQuery.addListener === "function") {
  teamMobileQuery.addListener(syncTeamMobileMode);
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopMobileTeamLoop();
    return;
  }
  syncTeamMobileMode();
});

syncTeamMobileMode();

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
  const isVideoElement = (video) => video instanceof HTMLVideoElement;
  const screenStates = [];
  const visibilityMap = new Map();
  let activeScreen = projectScreens[0] ?? null;
  let globalAudioEnabled = false;
  let rafId = null;

  const setToggleState = (toggle, isOn, onLabel, offLabel) => {
    if (!(toggle instanceof HTMLButtonElement)) return;

    toggle.classList.toggle("is-on", isOn);
    toggle.setAttribute("aria-pressed", String(isOn));
    toggle.setAttribute("aria-label", isOn ? onLabel : offLabel);
  };

  const findActiveScreenByViewport = () => {
    if (!projectScreens.length) return null;

    const viewportCenter = window.innerHeight * 0.5;
    let bestScreen = projectScreens[0];
    let bestDistance = Number.POSITIVE_INFINITY;

    projectScreens.forEach((screen) => {
      const rect = screen.getBoundingClientRect();
      const screenCenter = rect.top + rect.height * 0.5;
      const distance = Math.abs(screenCenter - viewportCenter);

      if (distance < bestDistance) {
        bestDistance = distance;
        bestScreen = screen;
      }
    });

    return bestScreen;
  };

  const findMostVisibleScreen = () => {
    let bestScreen = null;
    let bestRatio = -1;

    visibilityMap.forEach((ratio, screen) => {
      if (ratio > bestRatio) {
        bestRatio = ratio;
        bestScreen = screen;
      }
    });

    if (bestScreen && bestRatio > 0.15) {
      return bestScreen;
    }

    return findActiveScreenByViewport();
  };

  const syncAudioState = () => {
    screenStates.forEach((state) => {
      const { screen, videos, groupToggle, individualToggles } = state;
      const isActive = screen === activeScreen;
      const hasIndividual = individualToggles.length > 0;

      if (!globalAudioEnabled || !isActive) {
        videos.forEach((video) => {
          video.muted = true;
        });
      } else if (hasIndividual) {
        const selectedIndex = Math.max(0, Math.min(state.activeTripleIndex, videos.length - 1));
        state.activeTripleIndex = selectedIndex;

        videos.forEach((video, index) => {
          const shouldPlayAudio = index === selectedIndex;
          video.muted = !shouldPlayAudio;

          if (shouldPlayAudio) {
            video.volume = 1;
            const playPromise = video.play();
            if (playPromise && typeof playPromise.catch === "function") {
              playPromise.catch(() => {});
            }
          }
        });
      } else {
        videos.forEach((video, index) => {
          const shouldPlayAudio = index === 0;
          video.muted = !shouldPlayAudio;

          if (shouldPlayAudio) {
            video.volume = 1;
            const playPromise = video.play();
            if (playPromise && typeof playPromise.catch === "function") {
              playPromise.catch(() => {});
            }
          }
        });
      }

      if (groupToggle instanceof HTMLButtonElement) {
        setToggleState(groupToggle, globalAudioEnabled, "Desativar áudio", "Ativar áudio");
      }

      individualToggles.forEach((toggle, index) => {
        const isOn = globalAudioEnabled && isActive && index === state.activeTripleIndex;
        const videoNumber = index + 1;
        setToggleState(
          toggle,
          isOn,
          `Desativar áudio do vídeo ${videoNumber}`,
          `Ativar áudio do vídeo ${videoNumber}`
        );
      });
    });
  };

  const syncActiveScreenAndAudio = () => {
    activeScreen = findMostVisibleScreen();
    syncAudioState();
  };

  const scheduleActiveSync = () => {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      syncActiveScreenAndAudio();
    });
  };

  projectScreens.forEach((screen) => {
    const videos = Array.from(screen.querySelectorAll(".project-media video")).filter(
      (video) => isVideoElement(video)
    );
    if (!videos.length) return;

    const groupToggle = screen.querySelector(".project-audio-toggle:not(.project-audio-toggle-individual)");
    const individualToggles = Array.from(
      screen.querySelectorAll(".project-audio-toggle-individual")
    ).filter((toggle) => toggle instanceof HTMLButtonElement);

    const getVideoForIndividualToggle = (toggle, index, sourceVideos = videos) => {
      const videoInCell = toggle.closest(".triple-video-cell")?.querySelector("video");
      if (isVideoElement(videoInCell)) return videoInCell;

      const indexedVideo = sourceVideos[index];
      return isVideoElement(indexedVideo) ? indexedVideo : null;
    };

    const orderedVideos =
      individualToggles.length > 0
        ? individualToggles
            .map((toggle, index) => getVideoForIndividualToggle(toggle, index))
            .filter((video) => isVideoElement(video))
        : videos;

    const state = {
      screen,
      videos: orderedVideos.length > 0 ? orderedVideos : videos,
      groupToggle,
      individualToggles,
      activeTripleIndex: individualToggles.length > 0 ? 0 : -1,
    };

    if (groupToggle instanceof HTMLButtonElement) {
      groupToggle.addEventListener("click", () => {
        globalAudioEnabled = !globalAudioEnabled;
        activeScreen = screen;
        syncAudioState();
      });
    }

    individualToggles.forEach((toggle, index) => {
      const targetVideo = getVideoForIndividualToggle(toggle, index, state.videos);
      if (!targetVideo) return;

      toggle.addEventListener("click", () => {
        globalAudioEnabled = true;
        activeScreen = screen;
        state.activeTripleIndex = index;
        syncAudioState();
      });
    });

    screenStates.push(state);
  });

  if ("IntersectionObserver" in window) {
    const screenObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visibilityMap.set(entry.target, entry.intersectionRatio);
        });
        scheduleActiveSync();
      },
      { threshold: [0, 0.15, 0.35, 0.55, 0.75, 1] }
    );

    projectScreens.forEach((screen) => screenObserver.observe(screen));
  }

  window.addEventListener("scroll", scheduleActiveSync, { passive: true });
  window.addEventListener("resize", scheduleActiveSync);
  scheduleActiveSync();
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

if (snapSections.length > 1 && !isMobileViewport) {
  let snapLocked = false;
  let touchStartY = null;
  const touchThreshold = 8;
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
      const deltaY = touchStartY - currentY;
      if (Math.abs(deltaY) < touchThreshold) return;

      const direction = deltaY > 0 ? "down" : "up";
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
