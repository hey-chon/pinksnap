import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * A custom floating scrollbar thumb that hovers over content with zero layout impact.
 * No track container — just a glowing pink pill that fades in on scroll and fades out when idle.
 */
export function FloatingScrollbar({ scrollRef }: { scrollRef: React.RefObject<HTMLElement | null> }) {
  const thumbRef = useRef<HTMLDivElement>(null);
  const fadeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [visible, setVisible] = useState(false);

  const update = useCallback(() => {
    const el = scrollRef.current;
    const thumb = thumbRef.current;
    if (!el || !thumb) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    const trackHeight = clientHeight - 16; // 8px margin top + bottom
    const ratio = clientHeight / scrollHeight;

    if (ratio >= 1) {
      // Content fits — no scrollbar needed
      thumb.style.opacity = '0';
      return;
    }

    const thumbHeight = Math.max(32, ratio * trackHeight);
    const maxScroll = scrollHeight - clientHeight;
    const scrollFraction = maxScroll > 0 ? scrollTop / maxScroll : 0;
    const thumbTop = 8 + scrollFraction * (trackHeight - thumbHeight);

    thumb.style.height = `${thumbHeight}px`;
    thumb.style.transform = `translateY(${thumbTop}px)`;
  }, [scrollRef]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      setVisible(true);
      update();

      // Auto-hide after 1.2s of no scrolling
      clearTimeout(fadeTimer.current);
      fadeTimer.current = setTimeout(() => setVisible(false), 1200);
    };

    // Initial position
    update();

    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update, { passive: true });

    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', update);
      clearTimeout(fadeTimer.current);
    };
  }, [scrollRef, update]);

  return (
    <div
      ref={thumbRef}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => {
        clearTimeout(fadeTimer.current);
        fadeTimer.current = setTimeout(() => setVisible(false), 800);
      }}
      style={{
        position: 'fixed',
        right: 3,
        top: 0,
        width: 5,
        borderRadius: 9999,
        backgroundColor: visible ? 'rgba(245, 61, 137, 0.45)' : 'rgba(245, 61, 137, 0)',
        boxShadow: visible ? '0 0 8px rgba(245, 61, 137, 0.25)' : 'none',
        transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
        pointerEvents: 'none',
        zIndex: 9999,
        willChange: 'transform',
      }}
    />
  );
}
