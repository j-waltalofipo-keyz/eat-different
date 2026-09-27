"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import gsap from "gsap";

type RestPose = "standing" | "sitting";
type ActivePose = "standing" | "sitting" | "airborne";

const POSE_IMAGES: Record<ActivePose, string> = {
  standing: "/images/chef-eddie.webp",
  sitting: "/images/chef-eddie-sitting.webp",
  airborne: "/images/chef-eddie-airborne.webp",
};

// 10 Sequential Click / Poke Reactions
const CLICK_PHRASES = [
  "Ow! 💥",
  "Oi Sole! 🤨",
  "Let's cook! 👨‍🍳🔥",
  "Careful Uce. 👊",
  "Shaynna beats me like this too sometimes. 😂",
  "Go Chiefs! 🏈❤️",
  "Ka'e! 🙌",
  "Alright Uce 🤙",
  "Please, I'm ticklish! 🤣",
  "After all this abuse, please order something! 🍔🌮",
];

// Drag & Drop Phrases
const DRAG_PHRASES = [
  "Wheee! 🚀",
  "Ki'o! 💨",
  "Please be gentle. 🥺",
  "Where we heading? 🚚",
  "Taking flight, Uce! ✈️",
];

const DROP_PHRASES = [
  "Landed safe! 🪑",
  "Nice spot! 👀",
  "Ready to take orders! 📋",
  "Don't forget the hot honey! 🍯",
];

export function InteractiveEddie() {
  const [activePose, setActivePose] = useState<ActivePose>("standing");
  const [restPose, setRestPose] = useState<RestPose>("standing");
  const [isDragging, setIsDragging] = useState(false);
  const [speech, setSpeech] = useState<string | null>(null);

  // Position state when dragged
  const [isFixed, setIsFixed] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

  const clickCountRef = useRef(0);
  const dragCountRef = useRef(0);
  const dropCountRef = useRef(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pokeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Drag tracking refs
  const dragInfoRef = useRef<{
    startX: number;
    startY: number;
    elemStartX: number;
    elemStartY: number;
    hasMoved: boolean;
    active: boolean;
  }>({
    startX: 0,
    startY: 0,
    elemStartX: 0,
    elemStartY: 0,
    hasMoved: false,
    active: false,
  });

  const lastXRef = useRef<number>(0);
  const tiltVelocityRef = useRef<number>(0);

  const showSpeech = useCallback((text: string, duration = 2400) => {
    if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    setSpeech(text);
    speechTimeoutRef.current = setTimeout(() => {
      setSpeech(null);
    }, duration);
  }, []);

  // Handle single Click / Poke
  const handlePoke = useCallback(() => {
    // 1. Pick next quote sequentially from the 10 options
    const quoteIndex = clickCountRef.current % CLICK_PHRASES.length;
    clickCountRef.current += 1;
    const phrase = CLICK_PHRASES[quoteIndex];
    showSpeech(phrase, 2600);

    // 2. Switch to Airborne pose for 500ms, then revert back to whatever rest pose he was in
    setActivePose("airborne");

    if (containerRef.current) {
      // Fun jiggle/bounce reaction
      gsap.fromTo(
        containerRef.current,
        { scale: 0.9, rotate: -8, y: -10 },
        {
          scale: 1,
          rotate: 0,
          y: 0,
          duration: 0.45,
          ease: "elastic.out(1.4, 0.4)",
        }
      );
    }

    if (pokeTimerRef.current) clearTimeout(pokeTimerRef.current);
    pokeTimerRef.current = setTimeout(() => {
      // Revert back to the current resting pose (standing or sitting)
      setActivePose(restPose);
    }, 500);
  }, [restPose, showSpeech]);

  // Pointer Down (Start potential click or drag)
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only left click
    e.preventDefault();

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    dragInfoRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      elemStartX: rect.left,
      elemStartY: rect.top,
      hasMoved: false,
      active: true,
    };

    lastXRef.current = e.clientX;
    tiltVelocityRef.current = 0;
  };

  // Global window pointer listeners for buttery smooth dragging across the entire page
  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (!dragInfoRef.current.active) return;

      const dx = e.clientX - dragInfoRef.current.startX;
      const dy = e.clientY - dragInfoRef.current.startY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Threshold to distinguish click vs drag
      if (dist > 5 && !dragInfoRef.current.hasMoved) {
        dragInfoRef.current.hasMoved = true;
        setIsDragging(true);
        setIsFixed(true);

        // Immediate switch to airborne pose while dragging
        setActivePose("airborne");

        // Pick drag quote
        const dragQuote = DRAG_PHRASES[dragCountRef.current % DRAG_PHRASES.length];
        dragCountRef.current += 1;
        showSpeech(dragQuote, 2000);
      }

      if (dragInfoRef.current.hasMoved) {
        // Calculate new viewport coordinates with screen clamping
        const newLeft = Math.max(10, Math.min(window.innerWidth - 180, dragInfoRef.current.elemStartX + dx));
        const newTop = Math.max(10, Math.min(window.innerHeight - 240, dragInfoRef.current.elemStartY + dy));

        setPos({ left: newLeft, top: newTop });

        // Calculate smooth banking / tilt effect while flying
        tiltVelocityRef.current = (e.clientX - lastXRef.current) * 1.8;
        lastXRef.current = e.clientX;
        const tilt = Math.max(-22, Math.min(22, tiltVelocityRef.current));

        if (containerRef.current) {
          gsap.to(containerRef.current, {
            rotate: tilt,
            scale: 1.08,
            duration: 0.12,
            ease: "power1.out",
          });
        }
      }
    };

    const onPointerUp = () => {
      if (!dragInfoRef.current.active) return;
      dragInfoRef.current.active = false;

      if (!dragInfoRef.current.hasMoved) {
        // Was a clean click / poke
        handlePoke();
      } else {
        // Was a drag release / drop
        setIsDragging(false);

        // Cycle between sitting and standing on every drop!
        const nextRestPose: RestPose = restPose === "standing" ? "sitting" : "standing";
        setRestPose(nextRestPose);
        setActivePose(nextRestPose);

        // Drop speech
        const dropQuote = DROP_PHRASES[dropCountRef.current % DROP_PHRASES.length];
        dropCountRef.current += 1;
        showSpeech(dropQuote, 2200);

        if (containerRef.current) {
          // Satisfying squash & stretch landing bounce
          gsap.fromTo(
            containerRef.current,
            { scaleY: 0.8, scaleX: 1.15, rotate: 0 },
            {
              scaleY: 1,
              scaleX: 1,
              rotate: 0,
              duration: 0.6,
              ease: "elastic.out(1.3, 0.4)",
            }
          );
        }
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [handlePoke, restPose, showSpeech]);

  // Reset back to Hero arch
  const resetHome = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFixed(false);
    setActivePose("standing");
    setRestPose("standing");
    showSpeech("Back home in the arch! 🏠", 2000);
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { scale: 0.8, rotate: -15 },
        { scale: 1, rotate: 0, duration: 0.6, ease: "back.out(1.7)" }
      );
    }
  };

  useEffect(() => {
    return () => {
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
      if (pokeTimerRef.current) clearTimeout(pokeTimerRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      style={
        isFixed
          ? {
              position: "fixed",
              left: `${pos.left}px`,
              top: `${pos.top}px`,
              zIndex: 9999,
              touchAction: "none",
            }
          : {
              touchAction: "none",
            }
      }
      className={`group select-none drop-shadow-[0_20px_35px_rgba(0,0,0,0.7)] ${
        isFixed
          ? ""
          : "absolute -bottom-6 -left-10 z-20 sm:-bottom-8 sm:-left-16 lg:-bottom-10 lg:-left-20"
      } ${isDragging ? "cursor-grabbing" : "cursor-grab"} w-44 sm:w-60 lg:w-64`}
      aria-label="Interactive Chef Eddie character"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handlePoke();
        }
      }}
    >
      {/* Speech Bubble */}
      {speech && (
        <div className="pointer-events-none absolute -top-14 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap rounded-2xl bg-ink/95 px-4 py-2 font-display text-sm uppercase tracking-wider text-gold shadow-2xl ring-2 ring-gold/60 animate-in fade-in zoom-in duration-150">
          {speech}
          <div className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-ink ring-b ring-r ring-gold/60" />
        </div>
      )}

      {/* Floating Initial Help Badge */}
      {!isFixed && (
        <div className="pointer-events-none absolute -top-9 left-2 flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 font-display text-xs uppercase tracking-wider text-ink shadow-lg transition-transform group-hover:scale-110">
          <span>👆 Poke or Drag Me!</span>
        </div>
      )}

      {/* Return Home Button (visible when moved from original arch) */}
      {isFixed && (
        <button
          onClick={resetHome}
          className="absolute -right-2 -top-2 z-50 flex h-7 w-7 items-center justify-center rounded-full bg-ink font-display text-xs font-bold text-gold shadow-xl ring-2 ring-gold hover:bg-gold hover:text-ink transition-colors"
          title="Return Eddie to Hero arch"
          aria-label="Return Eddie to Hero arch"
        >
          ✕
        </button>
      )}

      {/* Character Image */}
      <div
        className={`relative transition-transform duration-150 ${
          isDragging ? "scale-105" : "group-hover:scale-[1.02]"
        }`}
      >
        <Image
          src={POSE_IMAGES[activePose]}
          alt={`Chef Eddie - ${activePose} pose`}
          width={768}
          height={1024}
          priority
          draggable={false}
          className="h-auto w-full object-contain pointer-events-none select-none"
        />
      </div>
    </div>
  );
}
