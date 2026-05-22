'use client';

import { useEffect, useRef, memo, useState } from 'react';
import './DotField.css';

const TWO_PI = Math.PI * 2;

const DotField = memo(({
  dotRadius = 1.5,
  dotSpacing = 14,
  cursorRadius = 500,
  cursorForce = 0.1,
  bulgeOnly = true,
  bulgeStrength = 67,
  glowRadius = 160,
  sparkle = false,
  waveAmplitude = 0,
  gradientFrom = 'rgba(99, 102, 241, 0.3)',
  gradientTo = 'rgba(168, 85, 247, 0.25)',
  glowColor = 'rgba(99, 102, 241, 0.15)',
  ...rest
}) => {
  const canvasRef = useRef(null);
  const svgRef = useRef(null);
  const glowRef = useRef(null);
  const dotsRef = useRef([]);
  const mouseRef = useRef({ x: -9999, y: -9999, prevX: -9999, prevY: -9999, speed: 0 });
  const rafRef = useRef(null);
  const sizeRef = useRef({ w: 0, h: 0, offsetX: 0, offsetY: 0 });
  const glowOpacity = useRef(0);
  const engagement = useRef(0);
  const isVisibleRef = useRef(true);
  const isAnimatingRef = useRef(false);

  const propsRef = useRef({});
  propsRef.current = { dotRadius, dotSpacing, cursorRadius, cursorForce, bulgeOnly, bulgeStrength, sparkle, waveAmplitude, gradientFrom, gradientTo };
  const rebuildRef = useRef(null);
  const [glowId, setGlowId] = useState('');

  useEffect(() => {
    setGlowId(`dot-field-glow-${Math.random().toString(36).slice(2, 9)}`);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const glowEl = glowRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function doResize() {
      if (!canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      if (w === 0 || h === 0) return;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      sizeRef.current = {
        w,
        h,
        offsetX: rect.left + window.scrollX,
        offsetY: rect.top + window.scrollY,
      };

      buildDots(w, h);
      startLoop();
    }

    function buildDots(w, h) {
      const p = propsRef.current;
      const step = p.dotRadius + p.dotSpacing;
      const cols = Math.floor(w / step);
      const rows = Math.floor(h / step);
      const padX = (w % step) / 2;
      const padY = (h % step) / 2;
      const dots = [];
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const ax = padX + col * step + step / 2;
          const ay = padY + row * step + step / 2;
          dots.push({ ax, ay, sx: ax, sy: ay, vx: 0, vy: 0, x: ax, y: ay });
        }
      }
      dotsRef.current = dots;
    }

    function onMouseMove(e) {
      const s = sizeRef.current;
      mouseRef.current.x = e.pageX - s.offsetX;
      mouseRef.current.y = e.pageY - s.offsetY;
      startLoop();
    }

    function updateMouseSpeed() {
      const m = mouseRef.current;
      const dx = m.prevX - m.x;
      const dy = m.prevY - m.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      m.speed += (dist - m.speed) * 0.5;
      if (m.speed < 0.001) m.speed = 0;
      m.prevX = m.x;
      m.prevY = m.y;

      if (m.speed > 0.01) {
        startLoop();
      }
    }

    const speedInterval = setInterval(updateMouseSpeed, 30);

    let frameCount = 0;

    function tick() {
      if (!isVisibleRef.current) {
        isAnimatingRef.current = false;
        return;
      }

      frameCount++;
      const dots = dotsRef.current;
      const m = mouseRef.current;
      const { w, h } = sizeRef.current;
      const p = propsRef.current;
      const len = dots.length;
      const t = frameCount * 0.02;

      const targetEngagement = Math.min(m.speed / 5, 1);
      engagement.current += (targetEngagement - engagement.current) * 0.06;
      if (engagement.current < 0.001) engagement.current = 0;
      const eng = engagement.current;

      glowOpacity.current += (eng - glowOpacity.current) * 0.08;

      if (glowEl) {
        glowEl.setAttribute('cx', m.x);
        glowEl.setAttribute('cy', m.y);
        glowEl.style.opacity = glowOpacity.current;
      }

      ctx.clearRect(0, 0, w, h);

      let needsMoreFrames = false;

      if (w > 0 && h > 0 && len > 0) {
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, p.gradientFrom);
        grad.addColorStop(1, p.gradientTo);
        ctx.fillStyle = grad;

        const cr = p.cursorRadius;
        const crSq = cr * cr;
        const rad = p.dotRadius / 2;
        const isBulge = p.bulgeOnly;

        ctx.beginPath();

        for (let i = 0; i < len; i++) {
          const d = dots[i];
          if (!d) continue;
          const dx = m.x - d.ax;
          const dy = m.y - d.ay;
          const distSq = dx * dx + dy * dy;

          if (distSq < crSq && eng > 0.01) {
            needsMoreFrames = true;
            const dist = Math.sqrt(distSq);
            if (isBulge) {
              const t = 1 - dist / cr;
              const push = t * t * p.bulgeStrength * eng;
              const angle = Math.atan2(dy, dx);
              d.sx += (d.ax - Math.cos(angle) * push - d.sx) * 0.15;
              d.sy += (d.ay - Math.sin(angle) * push - d.sy) * 0.15;
            } else {
              const angle = Math.atan2(dy, dx);
              const move = (500 / dist) * (m.speed * p.cursorForce);
              d.vx += Math.cos(angle) * -move;
              d.vy += Math.sin(angle) * -move;
            }
          } else if (isBulge) {
            const diffX = d.ax - d.sx;
            const diffY = d.ay - d.sy;
            if (Math.abs(diffX) > 0.05 || Math.abs(diffY) > 0.05) {
              needsMoreFrames = true;
            }
            d.sx += diffX * 0.1;
            d.sy += diffY * 0.1;
          }

          if (!isBulge) {
            d.vx *= 0.9;
            d.vy *= 0.9;
            d.x = d.ax + d.vx;
            d.y = d.ay + d.vy;
            const diffX = d.x - d.sx;
            const diffY = d.y - d.sy;
            if (Math.abs(diffX) > 0.05 || Math.abs(diffY) > 0.05 || Math.abs(d.vx) > 0.05 || Math.abs(d.vy) > 0.05) {
              needsMoreFrames = true;
            }
            d.sx += diffX * 0.1;
            d.sy += diffY * 0.1;
          }

          let drawX = d.sx;
          let drawY = d.sy;
          if (p.waveAmplitude > 0) {
            needsMoreFrames = true;
            drawY += Math.sin(d.ax * 0.03 + t) * p.waveAmplitude;
            drawX += Math.cos(d.ay * 0.03 + t * 0.7) * p.waveAmplitude * 0.5;
          }

          if (p.sparkle) {
            const hash = ((i * 2654435761) ^ (frameCount >> 3)) >>> 0;
            if ((hash % 100) < 3) {
              ctx.moveTo(drawX + rad * 1.8, drawY);
              ctx.arc(drawX, drawY, rad * 1.8, 0, TWO_PI);
            } else {
              ctx.moveTo(drawX + rad, drawY);
              ctx.arc(drawX, drawY, rad, 0, TWO_PI);
            }
          } else {
            ctx.moveTo(drawX + rad, drawY);
            ctx.arc(drawX, drawY, rad, 0, TWO_PI);
          }
        }

        ctx.fill();
      }

      // If nothing has moved, engagement is zero, and we don't have waves, sleep
      if (!needsMoreFrames && eng < 0.005 && glowOpacity.current < 0.005) {
        isAnimatingRef.current = false;
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    function startLoop() {
      if (!isAnimatingRef.current && isVisibleRef.current) {
        isAnimatingRef.current = true;
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    // Set up IntersectionObserver to pause loop if component is off-screen / display none
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isVisibleRef.current = entry ? entry.isIntersecting : true;
        if (isVisibleRef.current) {
          startLoop();
        } else {
          isAnimatingRef.current = false;
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
        }
      },
      { threshold: 0 }
    );

    if (canvas.parentElement) {
      intersectionObserver.observe(canvas.parentElement);
    }

    // Set up ResizeObserver to handle element layout changes reliably
    const resizeObserver = new ResizeObserver(() => {
      doResize();
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    doResize();
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    rebuildRef.current = () => {
      if (!canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        buildDots(rect.width, rect.height);
        startLoop();
      }
    };

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(speedInterval);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [glowId]);

  useEffect(() => {
    rebuildRef.current?.();
  }, [dotRadius, dotSpacing]);

  return (
    <div className="dot-field-container" {...rest}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
      />
      {glowId && (
        <svg
          ref={svgRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          <defs>
            <radialGradient id={glowId}>
              <stop offset="0%" stopColor={glowColor} />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <circle
            ref={glowRef}
            cx="-9999"
            cy="-9999"
            r={glowRadius}
            fill={`url(#${glowId})`}
            style={{ opacity: 0, willChange: 'opacity' }}
          />
        </svg>
      )}
    </div>
  );
});

DotField.displayName = 'DotField';

export default DotField;
