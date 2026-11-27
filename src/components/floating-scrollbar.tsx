import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * A custom floating scrollbar that hovers over content with zero layout impact.
 * No track container — just a glowing pink pill. Always visible and interactive.
 * Starts below the navbar, uses native scroll-like drag behavior.
 */
export function FloatingScrollbar({
  scrollRef,
  topOffset = 56,
}: {
  scrollRef: React.RefObject<HTMLElement | null>;
  /** px from viewport top where the scrollbar track begins (navbar height) */
  topOffset?: number;
}) {
  const thumbRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartScroll = useRef(0);
  const [thumbState, setThumbState] = useState({ height: 0, top: 0, show: false });
  const [hovered, setHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const getTrackHeight = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return 0;
    return el.clientHeight - 8; // 8px bottom margin
  }, [scrollRef]);

  const update = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    const trackHeight = getTrackHeight();
    const ratio = clientHeight / scrollHeight;

    if (ratio >= 1) {
      setThumbState({ height: 0, top: 0, show: false });
      return;
    }

    const thumbHeight = Math.max(32, ratio * trackHeight);
    const maxScroll = scrollHeight - clientHeight;
    const scrollFraction = maxScroll > 0 ? scrollTop / maxScroll : 0;
    const thumbTop = topOffset + scrollFraction * (trackHeight - thumbHeight);

    setThumbState({ height: thumbHeight, top: thumbTop, show: true });
  }, [scrollRef, getTrackHeight, topOffset]);

  // Listen to scroll & resize
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [scrollRef, update]);

  // Drag handling — native scrollbar feel
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragging.current = true;
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartScroll.current = scrollRef.current?.scrollTop ?? 0;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [scrollRef]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const el = scrollRef.current;
    if (!el) return;

    const { scrollHeight, clientHeight } = el;
    const trackHeight = getTrackHeight();
    const ratio = clientHeight / scrollHeight;
    const thumbHeight = Math.max(32, ratio * trackHeight);
    const maxScroll = scrollHeight - clientHeight;
    const deltaY = e.clientY - dragStartY.current;
    const scrollDelta = (deltaY / (trackHeight - thumbHeight)) * maxScroll;

    el.scrollTop = dragStartScroll.current + scrollDelta;
  }, [scrollRef, getTrackHeight]);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
    setIsDragging(false);
  }, []);

  if (!thumbState.show) return null;

  const isActive = hovered || isDragging;

  return (
    <div
      ref={thumbRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'fixed',
        right: 3,
        top: 0,
        width: isActive ? 7 : 5,
        height: thumbState.height,
        borderRadius: 9999,
        backgroundColor: isActive ? 'rgba(245, 61, 137, 0.6)' : 'rgba(245, 61, 137, 0.35)',
        boxShadow: isActive
          ? '0 0 10px rgba(245, 61, 137, 0.4)'
          : '0 0 6px rgba(245, 61, 137, 0.15)',
        transform: `translateY(${thumbState.top}px)`,
        transition: isDragging
          ? 'width 0.15s ease, background-color 0.15s ease'
          : 'width 0.15s ease, background-color 0.3s ease, box-shadow 0.3s ease',
        cursor: 'default',
        zIndex: 9999,
        willChange: 'transform',
        touchAction: 'none',
      }}
    />
  );
}
