'use client';

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';

type Review = {
  id: string | number;
  name: string;
  affiliation: string;
  quote: string;
  imageSrc: string;
  thumbnailSrc: string;
};

interface TestimonialSliderProps {
  reviews: Review[];
  className?: string;
}

/**
 * Animated testimonial slider, tuned to the Quiet Confidence palette
 * (warm near-black + amber). Framer-motion for slide transitions.
 */
const AUTOPLAY_INTERVAL_MS = 3000;

export const TestimonialSlider = ({ reviews, className }: TestimonialSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [isPaused, setIsPaused] = useState(false);
  const tickRef = useRef(0);

  if (reviews.length === 0) { return null; }

  const activeReview = reviews[currentIndex];

  const handleNext = () => {
    setDirection('right');
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
    tickRef.current += 1;
  };
  const handlePrev = () => {
    setDirection('left');
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
    tickRef.current += 1;
  };
  const handleThumbnailClick = (index: number) => {
    setDirection(index > currentIndex ? 'right' : 'left');
    setCurrentIndex(index);
    tickRef.current += 1;
  };

  // Autoplay — advance every 3s unless paused (hover/focus) or reduced motion is set
  useEffect(() => {
    if (isPaused || reviews.length < 2) return;
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const id = window.setInterval(() => {
      setDirection('right');
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }, AUTOPLAY_INTERVAL_MS);

    return () => window.clearInterval(id);
    // tickRef.current in deps resets the timer whenever the user navigates manually
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused, reviews.length, tickRef.current]);

  const thumbnailReviews = reviews.filter((_, i) => i !== currentIndex).slice(0, 3);

  const imageVariants = {
    enter: (d: 'left' | 'right') => ({ y: d === 'right' ? '100%' : '-100%', opacity: 0 }),
    center: { y: 0, opacity: 1 },
    exit: (d: 'left' | 'right') => ({ y: d === 'right' ? '-100%' : '100%', opacity: 0 }),
  };

  const textVariants = {
    enter: (d: 'left' | 'right') => ({ x: d === 'right' ? 50 : -50, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: 'left' | 'right') => ({ x: d === 'right' ? -50 : 50, opacity: 0 }),
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      className={cn(
        'relative w-full min-h-[600px] overflow-hidden bg-[#0E0E10] text-[#F5F2EC] p-8 md:p-12',
        className,
      )}
    >
      <div className="grid h-full grid-cols-1 gap-8 md:grid-cols-12">
        {/* Left: counter + thumbnails */}
        <div className="order-2 flex flex-col justify-between md:order-1 md:col-span-3">
          <div className="flex flex-row justify-between space-x-4 md:flex-col md:justify-start md:space-x-0 md:space-y-6">
            <span className="tabular-nums text-[12px] text-[#6B665F]">
              {String(currentIndex + 1).padStart(2, '0')} /{' '}
              {String(reviews.length).padStart(2, '0')}
            </span>
            <h2 className="hidden text-[11px] uppercase tracking-[0.18em] text-[#D4A373] [writing-mode:vertical-rl] md:block md:rotate-180">
              Testimonials
            </h2>
          </div>

          <div className="mt-8 flex space-x-2 md:mt-0">
            {thumbnailReviews.map((review) => {
              const originalIndex = reviews.findIndex((r) => r.id === review.id);
              return (
                <button
                  key={review.id}
                  onClick={() => handleThumbnailClick(originalIndex)}
                  className="h-20 w-16 overflow-hidden rounded-sm opacity-60 ring-1 ring-[#2A2A2E] transition-opacity duration-300 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#D4A373] focus:ring-offset-2 focus:ring-offset-[#0E0E10] md:h-24 md:w-20"
                  aria-label={`View testimonial from ${review.name}`}
                >
                  <img
                    src={review.thumbnailSrc}
                    alt={review.name}
                    className="h-full w-full object-cover grayscale"
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Center: main image */}
        <div className="relative order-1 h-80 min-h-[420px] md:order-2 md:col-span-4 md:min-h-[500px]">
          <AnimatePresence initial={false} custom={direction}>
            <motion.img
              key={currentIndex}
              src={activeReview.imageSrc}
              alt={activeReview.name}
              custom={direction}
              variants={imageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0 h-full w-full rounded-sm object-cover ring-1 ring-[#2A2A2E]"
            />
          </AnimatePresence>
        </div>

        {/* Right: text + nav */}
        <div className="order-3 flex flex-col justify-between md:col-span-5 md:pl-8">
          <div className="relative min-h-[240px] overflow-hidden pt-4 md:pt-20">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={textVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
              >
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#D4A373]">
                  {activeReview.affiliation}
                </p>
                <h3 className="mt-2 text-[17px] font-medium text-[#F5F2EC]">
                  {activeReview.name}
                </h3>
                <blockquote className="font-serif-display mt-6 text-[28px] leading-[1.3] tracking-[-0.01em] text-[#F5F2EC] md:text-[32px]">
                  <span className="text-[#D4A373]">&ldquo;</span>
                  {activeReview.quote}
                  <span className="text-[#D4A373]">&rdquo;</span>
                </blockquote>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-8 flex items-center space-x-2 md:mt-0">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full border-[#2A2A2E]"
              onClick={handlePrev}
              aria-label="Previous testimonial"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="default"
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={handleNext}
              aria-label="Next testimonial"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
