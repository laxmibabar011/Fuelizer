/**
 * Responsive POS Layout Component
 * Handles landscape/portrait mode switching and fullscreen mode
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import POSInterface from "../POSInterface";
import { useFullscreen } from "../hooks/useFullscreen";

const ResponsivePOSLayout: React.FC = () => {
  const navigate = useNavigate();
  const {
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    isFullscreenSupported,
  } = useFullscreen();
  const [orientation, setOrientation] = useState<"landscape" | "portrait">(
    "landscape"
  );
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
  const [hasEnteredFullscreen, setHasEnteredFullscreen] = useState(false);

  useEffect(() => {
    const updateOrientation = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setScreenSize({ width, height });
      setOrientation(width > height ? "landscape" : "portrait");
    };

    updateOrientation();
    window.addEventListener("resize", updateOrientation);
    window.addEventListener("orientationchange", updateOrientation);

    return () => {
      window.removeEventListener("resize", updateOrientation);
      window.removeEventListener("orientationchange", updateOrientation);
    };
  }, []);

  // Auto-enter fullscreen when POS loads
  useEffect(() => {
    if (isFullscreenSupported && !hasEnteredFullscreen) {
      const timer = setTimeout(async () => {
        const success = await enterFullscreen();
        if (success) {
          setHasEnteredFullscreen(true);
        }
      }, 1000); // Small delay to ensure component is mounted

      return () => clearTimeout(timer);
    }
  }, [isFullscreenSupported, hasEnteredFullscreen, enterFullscreen]);

  // Handle POS exit - exit fullscreen and navigate back
  const handleExitPOS = async () => {
    if (isFullscreen) {
      await exitFullscreen();
    }
    navigate("/operator");
  };

  // Listen for ESC key to exit POS mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isFullscreen) {
        // ESC was pressed in fullscreen - ask if user wants to exit POS
        if (window.confirm("Exit POS mode?")) {
          handleExitPOS();
        } else {
          // Re-enter fullscreen if user chooses to stay
          setTimeout(() => {
            enterFullscreen();
          }, 100);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, enterFullscreen]);

  // Portrait mode notification
  if (orientation === "portrait" && screenSize.width < 1024) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">📱</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Rotate Device for Better Experience
          </h2>
          <p className="text-gray-600 mb-4">
            POS mode works best in landscape orientation. Please rotate your
            tablet or use a larger screen.
          </p>
          <div className="text-sm text-gray-500">
            Current: {screenSize.width} × {screenSize.height}px
          </div>

          {/* Still allow access in portrait mode */}
          <div className="mt-6">
            <button
              onClick={() => {
                // Force render POS interface
                setOrientation("landscape");
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue Anyway
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`pos-container ${orientation}`}>
              <POSInterface 
          onExitPOS={handleExitPOS} 
          isFullscreen={isFullscreen} 
          onEnterFullscreen={enterFullscreen}
        />

      {/* Fullscreen Status Indicator */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-2 left-2 text-xs bg-black bg-opacity-50 text-white px-2 py-1 rounded">
          {orientation} • {screenSize.width}×{screenSize.height} •{" "}
          {isFullscreen ? "Fullscreen" : "Windowed"}
        </div>
      )}

      {/* Fullscreen Not Supported Warning */}
      {!isFullscreenSupported && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg text-sm">
          ⚠️ Fullscreen not supported on this device
        </div>
      )}
    </div>
  );
};

export default ResponsivePOSLayout;
