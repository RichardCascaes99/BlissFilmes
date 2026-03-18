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

const teamStrip = document.querySelector(".team-strip");
const teamCards = Array.from(document.querySelectorAll(".team-strip .team-card"));
if (teamStrip instanceof HTMLElement && teamCards.length > 0) {
  const teamMobileQuery = window.matchMedia("(max-width: 740px)");
  const slotByModifier = {
    joao: 1,
    audrey: 2,
    richard: 3,
    ian: 4,
    aldo: 5,
    caio: 6,
    simone: 7,
    cassio: 8,
    edgard: 9,
  };
  const centerSlot = 5;
  const ringSlots = [1, 2, 3, 6, 9, 8, 7, 4];
  const mobileCards = [...teamCards];

  const getCardSlot = (card) => {
    const modifier = Object.keys(slotByModifier).find((name) => card.classList.contains(`team-card--${name}`));
    if (modifier) return slotByModifier[modifier];
    return null;
  };

  const initialCenterCard =
    mobileCards.find((card) => getCardSlot(card) === centerSlot) ??
    mobileCards.find((card) => card.classList.contains("team-card--aldo")) ??
    mobileCards[0] ??
    null;

  const initialRingCards = ringSlots
    .map((slot) => mobileCards.find((card) => getCardSlot(card) === slot))
    .filter((card) => card instanceof HTMLElement);

  let centerCard = initialCenterCard;
  let ringCards = initialRingCards;

  const clearMobileSelection = () => {
    teamStrip.classList.remove("is-detail-open");
    teamCards.forEach((card) => {
      card.classList.remove("is-selected");
      card.style.removeProperty("order");
      card.style.removeProperty("--flip-x");
      card.style.removeProperty("--flip-y");
      card.style.removeProperty("--selected-scale");
    });
  };

  const rotateRight = (items, steps = 1) => {
    if (!items.length) return items;
    const amount = ((steps % items.length) + items.length) % items.length;
    if (!amount) return [...items];
    return [...items.slice(-amount), ...items.slice(0, -amount)];
  };

  const normalizeLayoutState = () => {
    if (!(centerCard instanceof HTMLElement)) {
      centerCard = mobileCards[0] ?? null;
    }
    if (!(centerCard instanceof HTMLElement)) {
      ringCards = [];
      return;
    }

    const others = mobileCards.filter((card) => card !== centerCard);
    const normalizedRing = ringSlots
      .map((slot) => ringCards.find((card) => getCardSlot(card) === slot))
      .filter((card) => card instanceof HTMLElement && card !== centerCard);
    const remaining = others.filter((card) => !normalizedRing.includes(card));
    ringCards = [...normalizedRing, ...remaining].slice(0, ringSlots.length);
  };

  const applyLayoutStyles = () => {
    if (!(centerCard instanceof HTMLElement)) return;

    teamStrip.classList.add("is-detail-open");
    mobileCards.forEach((card) => card.classList.remove("is-selected"));
    centerCard.classList.add("is-selected");

    centerCard.style.order = String(centerSlot);
    centerCard.style.setProperty("--selected-scale", "1.48");

    ringCards.forEach((card, index) => {
      const slot = ringSlots[index];
      if (!(card instanceof HTMLElement) || typeof slot !== "number") return;
      card.style.order = String(slot);
      card.style.removeProperty("--selected-scale");
    });

    const knownCards = new Set([centerCard, ...ringCards]);
    mobileCards.forEach((card) => {
      if (knownCards.has(card)) return;
      card.style.removeProperty("order");
      card.style.removeProperty("--selected-scale");
    });
  };

  const animateLayoutChange = () => {
    const visibleCards = mobileCards.filter((card) => card.offsetParent !== null);
    const firstRects = new Map();

    visibleCards.forEach((card) => {
      firstRects.set(card, card.getBoundingClientRect());
      card.style.setProperty("--flip-x", "0px");
      card.style.setProperty("--flip-y", "0px");
    });

    applyLayoutStyles();

    visibleCards.forEach((card) => {
      const first = firstRects.get(card);
      if (!first) return;
      const last = card.getBoundingClientRect();
      const deltaX = first.left - last.left;
      const deltaY = first.top - last.top;
      if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5) return;
      card.style.setProperty("--flip-x", `${deltaX}px`);
      card.style.setProperty("--flip-y", `${deltaY}px`);
    });

    teamStrip.getBoundingClientRect();
    visibleCards.forEach((card) => {
      card.style.setProperty("--flip-x", "0px");
      card.style.setProperty("--flip-y", "0px");
    });
  };

  const applyMobileLayout = (animate = false) => {
    normalizeLayoutState();
    if (!(centerCard instanceof HTMLElement)) return;

    if (animate && teamMobileQuery.matches && !prefersReducedMotion) {
      animateLayoutChange();
      return;
    }

    applyLayoutStyles();
    mobileCards.forEach((card) => {
      card.style.setProperty("--flip-x", "0px");
      card.style.setProperty("--flip-y", "0px");
    });
  };

  const moveToCenterAndRotateRight = (clickedCard) => {
    if (!(clickedCard instanceof HTMLElement)) return;
    if (!(centerCard instanceof HTMLElement)) {
      centerCard = clickedCard;
      applyMobileLayout(true);
      return;
    }

    if (clickedCard === centerCard) {
      ringCards = rotateRight(ringCards, 1);
      applyMobileLayout(true);
      return;
    }

    const clickedRingIndex = ringCards.indexOf(clickedCard);
    if (clickedRingIndex === -1) {
      centerCard = clickedCard;
      ringCards = rotateRight(mobileCards.filter((card) => card !== clickedCard), 1).slice(0, ringSlots.length);
      applyMobileLayout(true);
      return;
    }

    const previousCenter = centerCard;
    const nextRing = [...ringCards];
    nextRing[clickedRingIndex] = previousCenter;
    centerCard = clickedCard;
    ringCards = rotateRight(nextRing, 1);
    applyMobileLayout(true);
  };

  const syncTeamMobileMode = () => {
    if (teamMobileQuery.matches) {
      applyMobileLayout(false);
      return;
    }

    clearMobileSelection();
  };

  teamCards.forEach((card) => {
    card.addEventListener("click", (event) => {
      if (!teamMobileQuery.matches) return;
      if (!(event.target instanceof Element)) return;
      if (event.target.closest(".team-insta")) return;

      event.preventDefault();
      moveToCenterAndRotateRight(card);
    });
  });

  if (typeof teamMobileQuery.addEventListener === "function") {
    teamMobileQuery.addEventListener("change", syncTeamMobileMode);
  } else if (typeof teamMobileQuery.addListener === "function") {
    teamMobileQuery.addListener(syncTeamMobileMode);
  }

  syncTeamMobileMode();
}

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
const mobileVideoQuery = window.matchMedia("(max-width: 740px)");

const requestVideoFullscreen = (video) => {
  if (!(video instanceof HTMLVideoElement)) return;

  const anyVideo = /** @type {any} */ (video);
  const anyDocument = /** @type {any} */ (document);
  const isAlreadyFullscreen =
    document.fullscreenElement === video ||
    anyDocument.webkitFullscreenElement === video ||
    anyVideo.webkitDisplayingFullscreen === true;

  if (isAlreadyFullscreen) return;

  if (typeof video.requestFullscreen === "function") {
    video.requestFullscreen().catch(() => {});
    return;
  }

  if (typeof anyVideo.webkitEnterFullscreen === "function") {
    try {
      anyVideo.webkitEnterFullscreen();
    } catch (_) {
      // no-op
    }
    return;
  }

  if (typeof anyVideo.webkitRequestFullscreen === "function") {
    anyVideo.webkitRequestFullscreen();
  }
};

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

  projectVideos.forEach((video) => {
    if (video.dataset.fullscreenBound === "true") return;

    video.addEventListener("click", () => {
      if (!mobileVideoQuery.matches) return;
      requestVideoFullscreen(video);
    });

    video.dataset.fullscreenBound = "true";
  });
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

        if (
          typeof state.applyTripleLayout === "function" &&
          state.currentTripleIndex !== selectedIndex
        ) {
          state.applyTripleLayout(selectedIndex, { animated: true, syncAudio: false, forcePlay: false });
        }

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
    const tripleMedia = screen.querySelector(".project-media--triple");
    const tripleTrack = tripleMedia?.querySelector(".triple-video-track");
    const tripleCells = Array.from(
      tripleTrack?.querySelectorAll(".triple-video-cell") ?? []
    ).filter((cell) => cell instanceof HTMLElement);
    const tripleNext = tripleMedia?.querySelector(".triple-next");

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
      currentTripleIndex: -1,
      applyTripleLayout: null,
    };

    if (
      tripleMedia instanceof HTMLElement &&
      tripleTrack instanceof HTMLElement &&
      tripleCells.length > 0 &&
      state.individualToggles.length > 0
    ) {
      const setTrackTransitionEnabled = (enabled) => {
        if (enabled) {
          tripleTrack.style.removeProperty("transition");
          return;
        }
        tripleTrack.style.setProperty("transition", "none");
      };

      const applyTripleLayout = (
        nextIndex,
        { animated = true, syncAudio = true, forcePlay = false } = {}
      ) => {
        const total = tripleCells.length;
        if (!total) return;

        const normalizedIndex = ((nextIndex % total) + total) % total;
        state.activeTripleIndex = normalizedIndex;
        state.currentTripleIndex = normalizedIndex;

        if (mobileVideoQuery.matches) {
          setTrackTransitionEnabled(animated && !prefersReducedMotion);
          const targetCell = tripleCells[normalizedIndex];
          const offsetLeft = targetCell?.offsetLeft ?? 0;
          tripleTrack.style.setProperty("transform", `translate3d(${-offsetLeft}px, 0, 0)`);

          if (!animated || prefersReducedMotion) {
            tripleTrack.getBoundingClientRect();
            tripleTrack.style.removeProperty("transition");
          }
        } else {
          tripleTrack.style.removeProperty("transition");
          tripleTrack.style.setProperty("transform", "translate3d(0, 0, 0)");
        }

        state.videos.forEach((video, index) => {
          video.loop = !mobileVideoQuery.matches;
          if (!mobileVideoQuery.matches) return;

          const shouldStayActive = index === normalizedIndex;
          if (shouldStayActive && (forcePlay || screen === activeScreen)) {
            const playPromise = video.play();
            if (playPromise && typeof playPromise.catch === "function") {
              playPromise.catch(() => {});
            }
          } else {
            video.pause();
          }
        });

        if (tripleNext instanceof HTMLButtonElement) {
          tripleNext.hidden = !mobileVideoQuery.matches;
        }

        if (syncAudio) {
          syncAudioState();
        }
      };

      state.applyTripleLayout = applyTripleLayout;
      applyTripleLayout(state.activeTripleIndex, { animated: false, syncAudio: false, forcePlay: false });

      if (tripleNext instanceof HTMLButtonElement) {
        tripleNext.hidden = !mobileVideoQuery.matches;
        tripleNext.addEventListener("click", () => {
          applyTripleLayout(state.activeTripleIndex + 1, {
            animated: true,
            syncAudio: true,
            forcePlay: true,
          });
        });
      }

      state.videos.forEach((video, index) => {
        video.addEventListener("ended", () => {
          if (!mobileVideoQuery.matches) return;
          if (index !== state.activeTripleIndex) return;

          applyTripleLayout(index + 1, {
            animated: true,
            syncAudio: true,
            forcePlay: true,
          });
        });
      });

      const syncTripleViewportMode = () => {
        applyTripleLayout(
          state.activeTripleIndex >= 0 ? state.activeTripleIndex : 0,
          { animated: false, syncAudio: true, forcePlay: false }
        );
      };

      if (typeof mobileVideoQuery.addEventListener === "function") {
        mobileVideoQuery.addEventListener("change", syncTripleViewportMode);
      } else if (typeof mobileVideoQuery.addListener === "function") {
        mobileVideoQuery.addListener(syncTripleViewportMode);
      }

      window.addEventListener("resize", () => {
        if (!mobileVideoQuery.matches) return;
        syncTripleViewportMode();
      });
    }

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
        if (typeof state.applyTripleLayout === "function") {
          state.applyTripleLayout(index, { animated: true, syncAudio: true, forcePlay: true });
        } else {
          state.activeTripleIndex = index;
          syncAudioState();
        }
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
