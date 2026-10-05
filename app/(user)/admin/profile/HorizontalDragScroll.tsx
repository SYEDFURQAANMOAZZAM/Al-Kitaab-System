"use client";

import {
  type MouseEvent,
  type ReactNode,
  useRef,
  useState,
} from "react";

type HorizontalDragScrollProps = {
  children: ReactNode;
  className?: string;
};

export function HorizontalDragScroll({
  children,
  className = "",
}: HorizontalDragScrollProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);

  const dragStartX = useRef(0);
  const scrollStartX = useRef(0);

  function handleMouseDown(
    event: MouseEvent<HTMLDivElement>,
  ) {
    const element = ref.current;

    if (!element || element.scrollWidth <= element.clientWidth) {
      return;
    }

    setIsDragging(true);

    dragStartX.current = event.clientX;
    scrollStartX.current = element.scrollLeft;
  }

  function handleMouseMove(
    event: MouseEvent<HTMLDivElement>,
  ) {
    if (!isDragging || !ref.current) {
      return;
    }

    event.preventDefault();

    const distance =
      event.clientX - dragStartX.current;

    ref.current.scrollLeft =
      scrollStartX.current - distance;
  }

  function stopDragging() {
    setIsDragging(false);
  }

  return (
    <div
      ref={ref}
      className={[
        "overflow-x-auto scrollbar-none",
        isDragging
          ? "cursor-grabbing select-none"
          : "cursor-grab",
        className,
      ].join(" ")}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={stopDragging}
      onMouseLeave={stopDragging}
    >
      {children}
    </div>
  );
}