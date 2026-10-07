"use client";

import * as React from "react";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { PanelLeftIcon } from "lucide-react";

/* =========================================================
   CONFIG
========================================================= */

const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "3rem";

const SIDEBAR_KEYBOARD_SHORTCUT = "b";

/*
 * Mobile drawer:
 *
 * 0%   = completely closed
 * 100% = completely open
 *
 * Release:
 * >= 40% -> open
 * < 40%  -> close
 *
 * A short fast swipe can also open/close.
 */

const OPEN_THRESHOLD = 0.4;
const CLOSE_THRESHOLD = 0.4;

const FAST_SWIPE_DISTANCE = 40;
const FAST_SWIPE_VELOCITY = 0.55;

const DIRECTION_LOCK_DISTANCE = 8;

const DRAWER_TRANSITION =
  "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)";

const OVERLAY_TRANSITION =
  "opacity 220ms cubic-bezier(0.22, 1, 0.36, 1)";

/*
 * Any element marked with this attribute owns its own
 * horizontal touch scrolling.
 *
 * The sidebar gesture must never interfere with it.
 */
const HORIZONTAL_SCROLL_SELECTOR =
  "[data-horizontal-scroll='true']";

/* =========================================================
   CONTEXT
========================================================= */

type SidebarContextProps = {
  state: "expanded" | "collapsed";

  open: boolean;

  setOpen: (
    open: boolean | ((open: boolean) => boolean),
  ) => void;

  openMobile: boolean;

  setOpenMobile: (
    open: boolean | ((open: boolean) => boolean),
  ) => void;

  isMobile: boolean;

  toggleSidebar: () => void;
};

const SidebarContext =
  React.createContext<SidebarContextProps | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);

  if (!context) {
    throw new Error(
      "useSidebar must be used within a SidebarProvider.",
    );
  }

  return context;
}

/* =========================================================
   SIDEBAR PROVIDER
========================================================= */

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();

  const [openMobile, setOpenMobile] =
    React.useState(false);

  const [_open, _setOpen] =
    React.useState(defaultOpen);

  const open = openProp ?? _open;

  const setOpen = React.useCallback(
    (
      value:
        | boolean
        | ((value: boolean) => boolean),
    ) => {
      const openState =
        typeof value === "function"
          ? value(open)
          : value;

      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        _setOpen(openState);
      }

      document.cookie =
        `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    },
    [setOpenProp, open],
  );

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile((value) => !value);
    } else {
      setOpen((value) => !value);
    }
  }, [isMobile, setOpen]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
  }, [toggleSidebar]);

  const state = open
    ? "expanded"
    : "collapsed";

  const contextValue =
    React.useMemo<SidebarContextProps>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        toggleSidebar,
      ],
    );

  return (
    <SidebarContext.Provider
      value={contextValue}
    >
      <div
        data-slot="sidebar-wrapper"
        style={
          {
            "--sidebar-width": SIDEBAR_WIDTH,
            "--sidebar-width-icon":
              SIDEBAR_WIDTH_ICON,
            ...style,
          } as React.CSSProperties
        }
        className={cn(
          "group/sidebar-wrapper flex min-h-svh w-full min-w-0 has-data-[variant=inset]:bg-sidebar",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

/* =========================================================
   MOBILE GESTURE
========================================================= */

type MobileGesture = {
  mode: "open" | "close";
  startX: number;
  startY: number;
  lastX: number;
  startTime: number;
  cancelled: boolean;
};

/* =========================================================
   SIDEBAR
========================================================= */

function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  dir,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
}) {
  const {
    isMobile,
    state,
    openMobile,
    setOpenMobile,
  } = useSidebar();

  const mobileDrawerRef =
    React.useRef<HTMLDivElement | null>(null);

  const mobileOverlayRef =
    React.useRef<HTMLDivElement | null>(null);

  const gesture =
    React.useRef<MobileGesture | null>(null);

  const dragProgress =
    React.useRef(openMobile ? 1 : 0);

  const isDragging =
    React.useRef(false);

  const directionLocked =
    React.useRef(false);

  const clamp = React.useCallback(
    (
      value: number,
      min = 0,
      max = 1,
    ) =>
      Math.min(
        max,
        Math.max(min, value),
      ),
    [],
  );

  /*
   * Check whether the touch started inside a component
   * that owns horizontal scrolling.
   *
   * This is the critical protection that prevents the
   * sidebar gesture from blocking table scrolling.
   */
  const isHorizontalScrollTarget =
    React.useCallback(
      (target: EventTarget | null) => {
        if (!(target instanceof Element)) {
          return false;
        }

        return Boolean(
          target.closest(
            HORIZONTAL_SCROLL_SELECTOR,
          ),
        );
      },
      [],
    );

  /*
   * Apply exact drawer position.
   *
   * progress:
   * 0 = closed
   * 1 = open
   */

  const applyDrawerPosition =
    React.useCallback(
      (
        progress: number,
        immediate = true,
      ) => {
        const drawer =
          mobileDrawerRef.current;

        const overlay =
          mobileOverlayRef.current;

        if (!drawer) return;

        const safeProgress =
          clamp(progress);

        dragProgress.current =
          safeProgress;

        if (immediate) {
          drawer.style.transition = "none";
        }

        if (side === "left") {
          drawer.style.transform =
            `translate3d(calc(-100% + ${safeProgress * 100}%), 0, 0)`;
        } else {
          drawer.style.transform =
            `translate3d(calc(100% - ${safeProgress * 100}%), 0, 0)`;
        }

        if (overlay) {
          if (immediate) {
            overlay.style.transition =
              "none";
          }

          overlay.style.opacity =
            String(safeProgress * 0.45);

          overlay.style.pointerEvents =
            safeProgress > 0
              ? "auto"
              : "none";
        }
      },
      [clamp, side],
    );

  /*
   * Animate to open / closed.
   */

  const settleDrawer =
    React.useCallback(
      (target: 0 | 1) => {
        const drawer =
          mobileDrawerRef.current;

        const overlay =
          mobileOverlayRef.current;

        if (!drawer) return;

        drawer.style.transition =
          DRAWER_TRANSITION;

        drawer.style.transform =
          side === "left"
            ? target === 1
              ? "translate3d(0, 0, 0)"
              : "translate3d(-100%, 0, 0)"
            : target === 1
              ? "translate3d(0, 0, 0)"
              : "translate3d(100%, 0, 0)";

        if (overlay) {
          overlay.style.transition =
            OVERLAY_TRANSITION;

          overlay.style.opacity =
            target === 1
              ? "0.45"
              : "0";

          overlay.style.pointerEvents =
            target === 1
              ? "auto"
              : "none";
        }

        dragProgress.current =
          target;

        setOpenMobile(
          target === 1,
        );
      },
      [setOpenMobile, side],
    );

  /*
   * Sync external open / close actions.
   */

  React.useEffect(() => {
    if (
      !isMobile ||
      isDragging.current
    ) {
      return;
    }

    const drawer =
      mobileDrawerRef.current;

    const overlay =
      mobileOverlayRef.current;

    if (!drawer) return;

    drawer.style.transition =
      DRAWER_TRANSITION;

    drawer.style.transform =
      side === "left"
        ? openMobile
          ? "translate3d(0, 0, 0)"
          : "translate3d(-100%, 0, 0)"
        : openMobile
          ? "translate3d(0, 0, 0)"
          : "translate3d(100%, 0, 0)";

    if (overlay) {
      overlay.style.transition =
        OVERLAY_TRANSITION;

      overlay.style.opacity =
        openMobile ? "0.45" : "0";

      overlay.style.pointerEvents =
        openMobile
          ? "auto"
          : "none";
    }

    dragProgress.current =
      openMobile ? 1 : 0;
  }, [
    isMobile,
    openMobile,
    side,
  ]);

  /*
   * Mobile drawer gesture.
   *
   * IMPORTANT:
   *
   * The listeners are still document-level because the
   * drawer must support swiping from the page.
   *
   * However, touches beginning inside an element marked
   * data-horizontal-scroll="true" are completely ignored.
   */

  React.useEffect(() => {
    if (!isMobile) {
      gesture.current = null;
      isDragging.current = false;
      directionLocked.current = false;
      return;
    }

    const handleTouchStart = (
      event: TouchEvent,
    ) => {
      if (
        event.touches.length !== 1
      ) {
        gesture.current = null;
        isDragging.current = false;
        directionLocked.current = false;
        return;
      }

      /*
       * CRITICAL:
       *
       * Never start the sidebar gesture from a component
       * that owns horizontal scrolling.
       */
      if (
        isHorizontalScrollTarget(
          event.target,
        )
      ) {
        gesture.current = null;
        isDragging.current = false;
        directionLocked.current = false;
        return;
      }

      const touch =
        event.touches[0];

      const drawer =
        mobileDrawerRef.current;

      if (!drawer) return;

      /*
       * CLOSED -> OPEN
       *
       * Can start anywhere except inside an explicitly
       * horizontally scrollable component.
       */

      if (!openMobile) {
        gesture.current = {
          mode: "open",
          startX: touch.clientX,
          startY: touch.clientY,
          lastX: touch.clientX,
          startTime:
            performance.now(),
          cancelled: false,
        };

        isDragging.current = false;
        directionLocked.current = false;

        applyDrawerPosition(0);

        return;
      }

      /*
       * OPEN -> CLOSE
       *
       * Must start inside drawer.
       */

      const rect =
        drawer.getBoundingClientRect();

      if (
        touch.clientX < rect.left ||
        touch.clientX > rect.right ||
        touch.clientY < rect.top ||
        touch.clientY > rect.bottom
      ) {
        gesture.current = null;
        return;
      }

      gesture.current = {
        mode: "close",
        startX: touch.clientX,
        startY: touch.clientY,
        lastX: touch.clientX,
        startTime:
          performance.now(),
        cancelled: false,
      };

      isDragging.current = false;
      directionLocked.current = false;

      applyDrawerPosition(1);
    };

    const handleTouchMove = (
      event: TouchEvent,
    ) => {
      const current =
        gesture.current;

      if (!current) return;

      if (
        event.touches.length !== 1
      ) {
        gesture.current = null;
        isDragging.current = false;
        directionLocked.current = false;
        return;
      }

      const touch =
        event.touches[0];

      const drawer =
        mobileDrawerRef.current;

      if (!drawer) {
        gesture.current = null;
        isDragging.current = false;
        directionLocked.current = false;
        return;
      }

      const deltaX =
        touch.clientX -
        current.startX;

      const deltaY =
        touch.clientY -
        current.startY;

      const absX =
        Math.abs(deltaX);

      const absY =
        Math.abs(deltaY);

      /*
       * Vertical gesture:
       *
       * Cancel sidebar gesture and let the browser
       * handle normal vertical scrolling.
       */

      if (
        !directionLocked.current &&
        absY >
          DIRECTION_LOCK_DISTANCE &&
        absY > absX
      ) {
        current.cancelled = true;

        gesture.current = null;
        isDragging.current = false;
        directionLocked.current = false;

        applyDrawerPosition(
          openMobile ? 1 : 0,
        );

        return;
      }

      /*
       * Horizontal gesture detected.
       */

      if (
        !directionLocked.current &&
        absX >
          DIRECTION_LOCK_DISTANCE &&
        absX >= absY
      ) {
        directionLocked.current = true;
        isDragging.current = true;
      }

      if (
        !directionLocked.current ||
        current.cancelled
      ) {
        return;
      }

      /*
       * At this point this gesture belongs to the
       * sidebar, so preventing browser scrolling is safe.
       *
       * This can NEVER happen for a table marked with
       * data-horizontal-scroll="true", because such
       * gestures are rejected in touchstart.
       */

      event.preventDefault();

      current.lastX =
        touch.clientX;

      /*
       * OPEN
       */

      if (
        current.mode === "open"
      ) {
        const signedDistance =
          side === "left"
            ? deltaX
            : -deltaX;

        if (
          signedDistance <= 0
        ) {
          applyDrawerPosition(0);
          return;
        }

        const drawerWidth =
          drawer.getBoundingClientRect()
            .width;

        if (drawerWidth <= 0) {
          return;
        }

        const progress =
          clamp(
            signedDistance /
              drawerWidth,
          );

        applyDrawerPosition(
          progress,
        );

        return;
      }

      /*
       * CLOSE
       */

      const signedDistance =
        side === "left"
          ? -deltaX
          : deltaX;

      if (signedDistance <= 0) {
        applyDrawerPosition(1);
        return;
      }

      const drawerWidth =
        drawer.getBoundingClientRect()
          .width;

      if (drawerWidth <= 0) {
        return;
      }

      const progress =
        clamp(
          1 -
            signedDistance /
              drawerWidth,
        );

      applyDrawerPosition(
        progress,
      );
    };

    const handleTouchEnd = () => {
      const current =
        gesture.current;

      if (!current) return;

      gesture.current = null;

      if (
        !isDragging.current ||
        !directionLocked.current
      ) {
        isDragging.current = false;
        directionLocked.current = false;

        applyDrawerPosition(
          openMobile ? 1 : 0,
        );

        return;
      }

      const now =
        performance.now();

      const totalTime =
        Math.max(
          now -
            current.startTime,
          1,
        );

      const totalDeltaX =
        current.lastX -
        current.startX;

      /*
       * Positive velocity means the swipe is in
       * the intended drawer direction.
       */

      const directionalVelocity =
        side === "left"
          ? current.mode === "open"
            ? totalDeltaX /
              totalTime
            : -totalDeltaX /
              totalTime
          : current.mode === "open"
            ? -totalDeltaX /
              totalTime
            : totalDeltaX /
              totalTime;

      /*
       * OPEN RELEASE
       */

      if (
        current.mode === "open"
      ) {
        const progress =
          dragProgress.current;

        const fastSwipe =
          Math.abs(totalDeltaX) >=
            FAST_SWIPE_DISTANCE &&
          directionalVelocity >=
            FAST_SWIPE_VELOCITY;

        const shouldOpen =
          progress >=
            OPEN_THRESHOLD ||
          fastSwipe;

        isDragging.current = false;
        directionLocked.current = false;

        settleDrawer(
          shouldOpen ? 1 : 0,
        );

        return;
      }

      /*
       * CLOSE RELEASE
       */

      const progress =
        dragProgress.current;

      const closedAmount =
        1 - progress;

      const fastSwipe =
        Math.abs(totalDeltaX) >=
          FAST_SWIPE_DISTANCE &&
        directionalVelocity >=
          FAST_SWIPE_VELOCITY;

      const shouldClose =
        closedAmount >=
          CLOSE_THRESHOLD ||
        fastSwipe;

      isDragging.current = false;
      directionLocked.current = false;

      settleDrawer(
        shouldClose ? 0 : 1,
      );
    };

    const handleTouchCancel =
      () => {
        gesture.current = null;
        isDragging.current = false;
        directionLocked.current = false;

        applyDrawerPosition(
          openMobile ? 1 : 0,
        );
      };

    document.addEventListener(
      "touchstart",
      handleTouchStart,
      {
        passive: true,
      },
    );

    document.addEventListener(
      "touchmove",
      handleTouchMove,
      {
        passive: false,
      },
    );

    document.addEventListener(
      "touchend",
      handleTouchEnd,
      {
        passive: true,
      },
    );

    document.addEventListener(
      "touchcancel",
      handleTouchCancel,
      {
        passive: true,
      },
    );

    return () => {
      document.removeEventListener(
        "touchstart",
        handleTouchStart,
      );

      document.removeEventListener(
        "touchmove",
        handleTouchMove,
      );

      document.removeEventListener(
        "touchend",
        handleTouchEnd,
      );

      document.removeEventListener(
        "touchcancel",
        handleTouchCancel,
      );

      gesture.current = null;
      isDragging.current = false;
      directionLocked.current = false;
    };
  }, [
    isMobile,
    openMobile,
    side,
    clamp,
    applyDrawerPosition,
    settleDrawer,
    isHorizontalScrollTarget,
  ]);

  /*
   * Escape closes mobile drawer.
   */

  React.useEffect(() => {
    if (!isMobile || !openMobile) {
      return;
    }

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === "Escape") {
        setOpenMobile(false);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
  }, [
    isMobile,
    openMobile,
    setOpenMobile,
  ]);

  /*
   * Prevent page scrolling while drawer is
   * completely open.
   */

  React.useEffect(() => {
    if (!isMobile || !openMobile) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [
    isMobile,
    openMobile,
  ]);

  /* =========================================================
     NON-COLLAPSIBLE
  ========================================================= */

  if (collapsible === "none") {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          "flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  /* =========================================================
     MOBILE
  ========================================================= */

  if (isMobile) {
    return (
      <>
        <div
          ref={mobileOverlayRef}
          aria-hidden={!openMobile}
          onClick={() =>
            setOpenMobile(false)
          }
          className="fixed inset-0 z-[59] bg-black"
          style={{
            opacity: 0,
            pointerEvents: "none",
            transition:
              OVERLAY_TRANSITION,
          }}
        />

        <div
          ref={mobileDrawerRef}
          dir={dir}
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className={cn(
            "fixed inset-y-0 z-[60] w-(--sidebar-width) bg-sidebar p-0 text-sidebar-foreground shadow-xl",
            "will-change-transform",
            side === "left"
              ? "left-0"
              : "right-0",
            className,
          )}
          style={
            {
              "--sidebar-width":
                SIDEBAR_WIDTH_MOBILE,

              transform:
                side === "left"
                  ? openMobile
                    ? "translate3d(0, 0, 0)"
                    : "translate3d(-100%, 0, 0)"
                  : openMobile
                    ? "translate3d(0, 0, 0)"
                    : "translate3d(100%, 0, 0)",

              transition:
                DRAWER_TRANSITION,

              /*
               * The drawer itself supports vertical
               * scrolling. Horizontal drawer gestures
               * are handled by our document listener.
               */
              touchAction: "pan-y",
            } as React.CSSProperties
          }
        >
          <div className="flex h-full w-full flex-col">
            {children}
          </div>
        </div>
      </>
    );
  }

  /* =========================================================
     DESKTOP
  ========================================================= */

  return (
    <div
      className="group peer hidden text-sidebar-foreground md:block"
      data-state={state}
      data-collapsible={
        state === "collapsed"
          ? collapsible
          : ""
      }
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      <div
        data-slot="sidebar-gap"
        className={cn(
          "relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear",
          "group-data-[collapsible=offcanvas]:w-0",
          "group-data-[side=right]:rotate-180",
          variant === "floating" ||
          variant === "inset"
            ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
        )}
      />

      <div
        data-slot="sidebar-container"
        data-side={side}
        className={cn(
          "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear data-[side=left]:left-0 data-[side=left]:group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)] data-[side=right]:right-0 data-[side=right]:group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)] md:flex",
          variant === "floating" ||
          variant === "inset"
            ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l",
          className,
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="flex size-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:shadow-sm group-data-[variant=floating]:ring-1 group-data-[variant=floating]:ring-sidebar-border"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SIDEBAR TRIGGER
========================================================= */

function SidebarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<
  typeof Button
>) {
  const {
    toggleSidebar,
  } = useSidebar();

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon-sm"
      className={cn(className)}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeftIcon />

      <span className="sr-only">
        Toggle Sidebar
      </span>
    </Button>
  );
}

/* =========================================================
   SIDEBAR RAIL
========================================================= */

function SidebarRail({
  className,
  ...props
}: React.ComponentProps<
  "button"
>) {
  const {
    toggleSidebar,
  } = useSidebar();

  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle sidebar"
      className={cn(
        "absolute inset-y-0 z-20 hidden w-4 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:start-1/2 after:w-[2px] after:translate-x-[-50%] hover:after:bg-sidebar-border sm:flex ltr:-translate-x-1/2 rtl:-translate-x-1/2",
        "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full hover:group-data-[collapsible=offcanvas]:bg-sidebar",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className,
      )}
      {...props}
    />
  );
}

/* =========================================================
   SIDEBAR INSET
========================================================= */

function SidebarInset({
  className,
  ...props
}: React.ComponentProps<
  "main"
>) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        "relative flex min-h-svh min-w-0 w-full flex-1 flex-col bg-background",
        "md:peer-data-[variant=inset]:m-2",
        "md:peer-data-[variant=inset]:ml-0",
        "md:peer-data-[variant=inset]:rounded-xl",
        "md:peer-data-[variant=inset]:shadow-sm",
        "md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2",
        className,
      )}
      {...props}
    />
  );
}

/* =========================================================
   SIDEBAR INPUT
========================================================= */

function SidebarInput({
  className,
  ...props
}: React.ComponentProps<
  typeof Input
>) {
  return (
    <Input
      data-slot="sidebar-input"
      data-sidebar="input"
      className={cn(
        "h-8 w-full bg-background shadow-none",
        className,
      )}
      {...props}
    />
  );
}

/* =========================================================
   SIDEBAR HEADER
========================================================= */

function SidebarHeader({
  className,
  ...props
}: React.ComponentProps<
  "div"
>) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn(
        "flex flex-col gap-2 p-2",
        className,
      )}
      {...props}
    />
  );
}

/* =========================================================
   SIDEBAR FOOTER
========================================================= */

function SidebarFooter({
  className,
  ...props
}: React.ComponentProps<
  "div"
>) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn(
        "flex flex-col gap-2 p-2",
        className,
      )}
      {...props}
    />
  );
}

/* =========================================================
   SIDEBAR SEPARATOR
========================================================= */

function SidebarSeparator({
  className,
  ...props
}: React.ComponentProps<
  typeof Separator
>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn(
        "mx-2 w-auto bg-sidebar-border",
        className,
      )}
      {...props}
    />
  );
}

/* =========================================================
   SIDEBAR CONTENT
========================================================= */

function SidebarContent({
  className,
  ...props
}: React.ComponentProps<
  "div"
>) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(
        "no-scrollbar flex min-h-0 min-w-0 flex-1 flex-col gap-0 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className,
      )}
      {...props}
    />
  );
}

/* =========================================================
   SIDEBAR GROUP
========================================================= */

function SidebarGroup({
  className,
  ...props
}: React.ComponentProps<
  "div"
>) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn(
        "relative flex w-full min-w-0 flex-col p-2",
        className,
      )}
      {...props}
    />
  );
}

/* =========================================================
   SIDEBAR GROUP LABEL
========================================================= */

function SidebarGroupLabel({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div"> &
  React.ComponentProps<"div">) {
  return useRender({
    defaultTagName: "div",

    props:
      mergeProps<"div">(
        {
          className: cn(
            "flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 ring-sidebar-ring outline-hidden transition-[margin,opacity] duration-200 ease-linear group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
            className,
          ),
        },
        props,
      ),

    render,

    state: {
      slot:
        "sidebar-group-label",
      sidebar:
        "group-label",
    },
  });
}

/* =========================================================
   SIDEBAR GROUP ACTION
========================================================= */

function SidebarGroupAction({
  className,
  render,
  ...props
}: useRender.ComponentProps<
  "button"
> &
  React.ComponentProps<
    "button"
  >) {
  return useRender({
    defaultTagName: "button",

    props:
      mergeProps<"button">(
        {
          className: cn(
            "absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform group-data-[collapsible=icon]:hidden after:absolute after:-inset-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
            className,
          ),
        },
        props,
      ),

    render,

    state: {
      slot:
        "sidebar-group-action",
      sidebar:
        "group-action",
    },
  });
}

/* =========================================================
   SIDEBAR GROUP CONTENT
========================================================= */

function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<
  "div"
>) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn(
        "w-full text-sm",
        className,
      )}
      {...props}
    />
  );
}

/* =========================================================
   SIDEBAR MENU
========================================================= */

function SidebarMenu({
  className,
  ...props
}: React.ComponentProps<
  "ul"
>) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn(
        "flex w-full min-w-0 flex-col gap-0",
        className,
      )}
      {...props}
    />
  );
}

/* =========================================================
   SIDEBAR MENU ITEM
========================================================= */

function SidebarMenuItem({
  className,
  ...props
}: React.ComponentProps<
  "li"
>) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn(
        "group/menu-item relative",
        className,
      )}
      {...props}
    />
  );
}

/* =========================================================
   SIDEBAR MENU BUTTON
========================================================= */

const sidebarMenuButtonVariants =
  cva(
    "peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-open:hover:bg-sidebar-accent data-open:hover:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:font-medium data-active:text-sidebar-accent-foreground [&_svg]:size-4 [&_svg]:shrink-0 [&>span:last-child]:truncate",
    {
      variants: {
        variant: {
          default:
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",

          outline:
            "bg-background shadow-[0_0_0_1px_var(--sidebar-border)] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_var(--sidebar-accent)]",
        },

        size: {
          default:
            "h-8 text-sm",

          sm:
            "h-7 text-xs",

          lg:
            "h-12 text-sm group-data-[collapsible=icon]:p-0!",
        },
      },

      defaultVariants: {
        variant: "default",
        size: "default",
      },
    },
  );

function SidebarMenuButton({
  render,
  isActive = false,
  variant = "default",
  size = "default",
  tooltip,
  className,
  ...props
}: useRender.ComponentProps<
  "button"
> &
  React.ComponentProps<
    "button"
  > & {
    isActive?: boolean;

    tooltip?:
      | string
      | React.ComponentProps<
          typeof TooltipContent
        >;
  } &
  VariantProps<
    typeof sidebarMenuButtonVariants
  >) {
  const {
    isMobile,
    state,
  } = useSidebar();

  const comp =
    useRender({
      defaultTagName:
        "button",

      props:
        mergeProps<"button">(
          {
            className: cn(
              sidebarMenuButtonVariants(
                {
                  variant,
                  size,
                },
              ),
              className,
            ),
          },
          props,
        ),

      render:
        !tooltip
          ? render
          : (
              <TooltipTrigger
                render={render}
              />
            ),

      state: {
        slot:
          "sidebar-menu-button",
        sidebar:
          "menu-button",
        size,
        active:
          isActive,
      },
    });

  if (!tooltip) {
    return comp;
  }

  if (
    typeof tooltip ===
    "string"
  ) {
    tooltip = {
      children: tooltip,
    };
  }

  return (
    <Tooltip>
      {comp}

      <TooltipContent
        side="right"
        align="center"
        hidden={
          state === "collapsed" ||
          isMobile
        }
        {...tooltip}
      />
    </Tooltip>
  );
}

/* =========================================================
   SIDEBAR MENU ACTION
========================================================= */

function SidebarMenuAction({
  className,
  render,
  showOnHover = false,
  ...props
}: useRender.ComponentProps<
  "button"
> &
  React.ComponentProps<
    "button"
  > & {
    showOnHover?: boolean;
  }) {
  return useRender({
    defaultTagName: "button",

    props:
      mergeProps<"button">(
        {
          className: cn(
            "absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform group-data-[collapsible=icon]:hidden peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 peer-data-[size=sm]/menu-button:top-1 after:absolute after:-inset-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
            showOnHover &&
              "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 peer-data-active/menu-button:text-sidebar-accent-foreground aria-expanded:opacity-100 md:opacity-0",
            className,
          ),
        },
        props,
      ),

    render,

    state: {
      slot:
        "sidebar-menu-action",
      sidebar:
        "menu-action",
    },
  });
}

/* =========================================================
   SIDEBAR MENU BADGE
========================================================= */

function SidebarMenuBadge({
  className,
  ...props
}: React.ComponentProps<
  "div"
>) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(
        "pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium text-sidebar-foreground tabular-nums select-none group-data-[collapsible=icon]:hidden peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 peer-data-[size=sm]/menu-button:top-1 peer-data-active/menu-button:text-sidebar-accent-foreground",
        className,
      )}
      {...props}
    />
  );
}

/* =========================================================
   SIDEBAR MENU SKELETON
========================================================= */

function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<
  "div"
> & {
  showIcon?: boolean;
}) {
  const [width] =
    React.useState(
      () =>
        `${Math.floor(
          Math.random() * 40,
        ) + 50}%`,
    );

  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={cn(
        "flex h-8 items-center gap-2 rounded-md px-2",
        className,
      )}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-4 rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      )}

      <Skeleton
        className="h-4 max-w-(--skeleton-width) flex-1"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width":
              width,
          } as React.CSSProperties
        }
      />
    </div>
  );
}

/* =========================================================
   SIDEBAR MENU SUB
========================================================= */

function SidebarMenuSub({
  className,
  ...props
}: React.ComponentProps<
  "ul"
>) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(
        "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5 group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
}

/* =========================================================
   SIDEBAR MENU SUB ITEM
========================================================= */

function SidebarMenuSubItem({
  className,
  ...props
}: React.ComponentProps<
  "li"
>) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn(
        "group/menu-sub-item relative",
        className,
      )}
      {...props}
    />
  );
}

/* =========================================================
   SIDEBAR MENU SUB BUTTON
========================================================= */

function SidebarMenuSubButton({
  render,
  size = "md",
  isActive = false,
  className,
  ...props
}: useRender.ComponentProps<
  "a"
> &
  React.ComponentProps<
    "a"
  > & {
    size?: "sm" | "md";
    isActive?: boolean;
  }) {
  return useRender({
    defaultTagName: "a",

    props:
      mergeProps<"a">(
        {
          className: cn(
            "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground ring-sidebar-ring outline-hidden group-data-[collapsible=icon]:hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none data-[size=md]:text-sm data-[size=sm]:text-xs data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",
            className,
          ),
        },
        props,
      ),

    render,

    state: {
      slot:
        "sidebar-menu-sub-button",
      sidebar:
        "menu-sub-button",
      size,
      active:
        isActive,
    },
  });
}

/* =========================================================
   EXPORTS
========================================================= */

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
};