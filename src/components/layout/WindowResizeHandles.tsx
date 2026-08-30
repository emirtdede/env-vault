import React, { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

type ResizeDirection = "East" | "North" | "NorthEast" | "NorthWest" | "South" | "SouthEast" | "SouthWest" | "West";

export const WindowResizeHandles: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    const checkMaximized = async () => {
      try {
        const win = getCurrentWindow();
        setIsMaximized(await win.isMaximized());
        unlisten = await win.onResized(async () => {
          setIsMaximized(await win.isMaximized());
        });
      } catch {
        // Fallback for browser testing
      }
    };
    checkMaximized();
    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  if (isMaximized) return null;

  const handleResize = (direction: ResizeDirection) => (e: React.MouseEvent) => {
    if (e.button === 0) {
      e.preventDefault();
      try {
        const win = getCurrentWindow();
        win.startResizeDragging(direction).catch(() => {});
      } catch {
        // Fallback
      }
    }
  };

  const borderThickness = 5;
  const cornerSize = 10;
  const zIndex = 9998;

  return (
    <>
      {/* 4 Edges */}
      <div
        onMouseDown={handleResize("North")}
        style={{
          position: "fixed",
          top: 0,
          left: cornerSize,
          right: "140px",
          height: `${borderThickness}px`,
          cursor: "n-resize",
          zIndex: 9998,
          userSelect: "none",
        }}
      />
      <div
        onMouseDown={handleResize("South")}
        style={{
          position: "fixed",
          bottom: 0,
          left: cornerSize,
          right: cornerSize,
          height: `${borderThickness}px`,
          cursor: "s-resize",
          zIndex,
          userSelect: "none",
        }}
      />
      <div
        onMouseDown={handleResize("West")}
        style={{
          position: "fixed",
          top: cornerSize,
          bottom: cornerSize,
          left: 0,
          width: `${borderThickness}px`,
          cursor: "w-resize",
          zIndex,
          userSelect: "none",
        }}
      />
      <div
        onMouseDown={handleResize("East")}
        style={{
          position: "fixed",
          top: cornerSize,
          bottom: cornerSize,
          right: 0,
          width: `${borderThickness}px`,
          cursor: "e-resize",
          zIndex,
          userSelect: "none",
        }}
      />

      {/* 4 Corners */}
      <div
        onMouseDown={handleResize("NorthWest")}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: `${cornerSize}px`,
          height: `${cornerSize}px`,
          cursor: "nw-resize",
          zIndex,
          userSelect: "none",
        }}
      />
      <div
        onMouseDown={handleResize("NorthEast")}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: `${cornerSize}px`,
          height: `${cornerSize}px`,
          cursor: "ne-resize",
          zIndex,
          userSelect: "none",
        }}
      />
      <div
        onMouseDown={handleResize("SouthWest")}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          width: `${cornerSize}px`,
          height: `${cornerSize}px`,
          cursor: "sw-resize",
          zIndex,
          userSelect: "none",
        }}
      />
      <div
        onMouseDown={handleResize("SouthEast")}
        style={{
          position: "fixed",
          bottom: 0,
          right: 0,
          width: `${cornerSize}px`,
          height: `${cornerSize}px`,
          cursor: "se-resize",
          zIndex,
          userSelect: "none",
        }}
      />
    </>
  );
};
