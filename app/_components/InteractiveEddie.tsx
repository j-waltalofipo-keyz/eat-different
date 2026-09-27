"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import gsap from "gsap";

type Pose = "standing" | "sitting" | "airborne";

const POSE_IMAGES: Record<Pose, string> = {
  standing: "/images/chef-eddie.webp",
  sitting: "/images/chef-eddie-sitting.webp",
  airborne: "/images/chef-eddie-airborne.webp",
};

const PHRASES = [
  "Talofa! 👋",
  "Comfort food, different rules! 🔥",
  "Where we heading? 🚚",
  "Hot honey on waffles! 🍯",
  "Samoa to KC! 685 ➔ 816",
  "Let's cook! 👨‍🍳",
  "Wheee! 🚀",
  "Saving for that truck! 🚚✨",
];

export function InteractiveEddie() {
  const [pose, setPose] = useState<Pose>("standing");
  const [isDragging, setIsDragging] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [speech, setSpeech] = useState<string | null>(null);
  const [isCustomPos, setIsCustomPos] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ clientX: number; clientY: number; startX: number; startY: number; isDrag: boolean }>({
    clientX: 0,
    clientY: 0,
    startX: 0,
    startY: 0,
    isDrag: false,
  });
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const velocityRef = useRef<number>(0);
  const lastClientXRef = useRef<number>(0);

  const showSpeech = useCallback((customText?: string) => {
    if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    const text = customText || PHRASES[Math.floor(Math.random() * PHRASES.length)];
    setSpeech(text);
    speechTimeoutRef.current = setTimeout(() => {
      setSpeech(null);
    }, 2400);
  }, []);

  // Poke reaction (click without drag)
  const handlePoke = useCallback(() => {
    setHasInteracted(true);
    // Cycle pose: standing -> sitting -> airborne -> standing
    setPose((prev) => {
      if (prev === "standing") return "sitting";
      if (prev === "sitting") return "airborne";
      return "standing";
    });

    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { scale: 0.9, rotate: -6 },
        { scale: 1, rotate: 0, duration: 0.5, ease: "elastic.out(1.2, 0.4)" }
      );
    }
    showSpeech();
  }, [showSpeech]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only primary button
    if (e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    setHasInteracted(true);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startX: pos.x,
      startY: pos.y,
      isDrag: false,
    };
    lastClientXRef.current = e.clientX;
    velocityRef.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;

    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 6 && !dragStartRef.current.isDrag) {
      dragStartRef.current.isDrag = true;
      setIsDragging(true);
      setIsCustomPos(true);
      setPose("airborne");
      showSpeech("Wheee! 🚀");
    }

    if (dragStartRef.current.isDrag) {
      velocityRef.current = e.clientX - lastClientXRef.current;
      lastClientXRef.current = e.clientX;

      // Calculate new position
      const newX = dragStartRef.current.startX + dx;
      const newY = dragStartRef.current.startY + dy;

      setPos({ x: newX, y: newY });

      if (containerRef.current) {
        const tilt = Math.max(-20, Math.min(20, velocityRef.current * 1.5));
        gsap.to(containerRef.current, {
          rotate: tilt,
          scale: 1.08,
          duration: 0.15,
          ease: "power1.out",
        });
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    if (!dragStartRef.current.isDrag) {
      // It was a click / poke
      handlePoke();
    } else {
      // Drag ended -> Drop Eddie!
      setIsDragging(false);
      // Change to sitting on stool when dropped
      setPose("sitting");
      showSpeech("Landed! Grab me anytime. 🛋️");

      if (containerRef.current) {
        gsap.to(containerRef.current, {
          rotate: 0,
          scale: 1,
          duration: 0.6,
          ease: "bounce.out",
        });
      }
    }
  };

  const resetPosition = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCustomPos(false);
    setPos({ x: 0, y: 0 });
    setPose("standing");
    showSpeech("Back home! 🏠");
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { scale: 0.8, rotate: -15 },
        { scale: 1, rotate: 0, duration: 0.6, ease: "back.out(1.7)" }
      );
    }
  };

  // Clean up timer
  useEffect(() => {
    return () => {
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      data-chef-eddie
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        transform: isCustomPos ? `translate3d(${pos.x}px, ${pos.y}px, 0)` : undefined,
        touchAction: "none",
      }}
      className={`group select-none drop-shadow-[0_20px_35px_rgba(0,0,0,0.65)] ${
        isCustomPos ? "fixed z-50 transition-none" : "absolute -bottom-6 -left-10 z-20 sm:-bottom-8 sm:-left-16 lg:-bottom-10 lg:-left-20"
      } ${isDragging ? "cursor-grabbing" : "cursor-grab"} w-44 sm:w-60 lg:w-64`}
      aria-label="Interactive Chef Eddie character - click to poke or drag to move around the page"
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
        <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-2xl bg-ink/95 px-4 py-1.5 font-display text-sm uppercase tracking-wider text-gold shadow-2xl ring-2 ring-gold/40 animate-in fade-in zoom-in duration-200">
          {speech}
          <div className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-ink ring-b ring-r ring-gold/40" />
        </div>
      )}

      {/* Initial Interaction Helper Badge */}
      {!hasInteracted && !isCustomPos && (
        <div className="pointer-events-none absolute -top-9 left-2 flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 font-display text-xs uppercase tracking-wider text-ink shadow-lg transition-transform group-hover:scale-110">
          <span>👆 Poke or Drag Me!</span>
        </div>
      )}

      {/* Reset Position Button if moved */}
      {isCustomPos && (
        <button
          onClick={resetPosition}
          className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink/90 font-display text-xs text-gold shadow-md ring-1 ring-gold hover:bg-gold hover:text-ink transition-colors"
          title="Return Eddie home"
          aria-label="Return Eddie home"
        >
          ✕
        </button>
      )}

      {/* Eddie Character Image */}
      <div className={`relative transition-transform duration-200 ${isDragging ? "scale-105" : "group-hover:scale-[1.02]"}`}>
        <Image
          src={POSE_IMAGES[pose]}
          alt={`Chef Eddie - ${pose} pose`}
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
