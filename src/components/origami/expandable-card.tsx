"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { Maximize2 } from "lucide-react";

import { Modal } from "./modal";
import { cn } from "@/lib/utils";

type ExpandableCardProps = {
  title?: string;
  maxHeight?: number;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function ExpandableCard({
  title,
  maxHeight = 320,
  children,
  className,
  contentClassName,
}: ExpandableCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frameId = 0;

    const checkOverflow = () => {
      const nextValue = Boolean(
        contentRef.current && contentRef.current.scrollHeight > maxHeight,
      );

      setIsOverflowing((current) => (current === nextValue ? current : nextValue));
    };

    const scheduleCheck = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(checkOverflow);
    };

    scheduleCheck();
    const observer = new ResizeObserver(scheduleCheck);

    if (contentRef.current) {
      observer.observe(contentRef.current);
    }

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [maxHeight]);

  return (
    <>
      <div
        className={cn(
          "relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#111]",
          className
        )}
      >
        <div
          ref={contentRef}
          className={cn("overflow-hidden", contentClassName)}
          style={{ maxHeight: isOverflowing ? maxHeight : undefined }}
        >
          {children}
        </div>

        {isOverflowing && (
          <div className="absolute bottom-0 left-0 right-0 flex h-32 items-end justify-center bg-gradient-to-t from-[#111] via-[#111]/90 to-transparent pb-4">
            <button
              onClick={() => setIsExpanded(true)}
              className="flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-black/80 px-4 py-2 text-xs font-medium text-white/80 backdrop-blur-md transition hover:border-lime-300/30 hover:bg-lime-300/10 hover:text-lime-100 shadow-xl"
              type="button"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Expand View
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={isExpanded}
        onClose={() => setIsExpanded(false)}
        title={title || "Expanded View"}
      >
        {children}
      </Modal>
    </>
  );
}
