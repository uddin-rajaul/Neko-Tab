import { useEffect, useRef, type CSSProperties, Suspense, lazy } from "react";
import {
  useBookmarks,
  useSettings,
  useLocalStorage,
} from "./hooks/useLocalStorage";
import { WINDOWS_ASCII, MACOS_ASCII, LINUX_ASCII, CAT_ASCII, DETECTED_OS } from "./components/ascii";
import { Bookmarks } from "./components/Bookmarks";
import { Clock } from "./components/Clock";
import { PixelArt } from "./components/PixelArt";
import { ActivityWidget } from "./components/ActivityWidget";
import { DailyGoal } from "./components/DailyGoal";
import { CommandPalette } from "./components/CommandPalette";
import { ChromeTabButton } from './components/ChromeTabButton'

// Lazy load overlay components to improve initial mount time
const SettingsPanel = lazy(() =>
  import("./components/SettingsPanel").then((m) => ({
    default: m.SettingsPanel,
  })),
);
const FocusMode = lazy(() =>
  import("./components/FocusMode").then((m) => ({ default: m.FocusMode })),
);
const Scratchpad = lazy(() =>
  import("./components/Scratchpad").then((m) => ({ default: m.Scratchpad })),
);
const ShortcutHelp = lazy(() =>
  import("./components/ShortcutHelp").then((m) => ({
    default: m.ShortcutHelp,
  })),
);

interface CustomBackgroundProps {
  settings: any;
  bgImage: string;
}

function CustomBackground({ settings, bgImage }: CustomBackgroundProps) {
  if (!bgImage) return null;

  return (
    <>
      {/* The actual image layer */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -2,
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter:
            settings.bgBlur > 0 ? `blur(${settings.bgBlur * 2}px)` : undefined,
          transform: settings.bgBlur > 0 ? "scale(1.08)" : undefined,
        }}
      />
      {/* Dim overlay on top of image */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -1,
          background: `rgba(0,0,0,${(settings.bgDim ?? 40) / 100})`,
        }}
      />
    </>
  );
}

function App() {
  const [settings, setSettings] = useSettings();
  const [bgImage] = useLocalStorage<string>("neko-bg-image", "");
  const {
    categories,
    addCategory,
    deleteCategory,
    renameCategory,
    addBookmark,
    deleteBookmark,
    editBookmark,
  } = useBookmarks();

  const appRef = useRef<HTMLDivElement>(null);

  let displayAsciiArt = CAT_ASCII
  if (settings.asciiArtSource === 'os') {
    displayAsciiArt = DETECTED_OS === 'windows' ? WINDOWS_ASCII : DETECTED_OS === 'macos' ? MACOS_ASCII : LINUX_ASCII
  } else if (settings.asciiArtSource === 'custom') {
    displayAsciiArt = settings.customAsciiArt || settings.asciiArt || ''
  }

  useEffect(() => {
    const root = document.documentElement;
    const fontValue = (settings.font || "JetBrains Mono").includes(" ")
      ? `'${settings.font || "JetBrains Mono"}'`
      : settings.font || "JetBrains Mono";
    root.style.setProperty("--font-mono", fontValue);
  }, [settings.font]);

  useEffect(() => {
    const stealFocus = () => {
      window.focus();
      if (document.activeElement === document.body) {
        appRef.current?.focus();
      }
    };
    stealFocus();
    const timer = setTimeout(stealFocus, 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Background rendered outside .app so it's never clipped by the theme bg-color */}
      <CustomBackground settings={settings} bgImage={bgImage} />

      <div
        ref={appRef}
        className={`app ${settings.theme}${bgImage ? " has-bg" : ""}`}
        tabIndex={-1}
        style={
          {
            outline: "none",
            ...(bgImage
              ? { backgroundColor: "transparent", background: "none" }
              : {}),
          } as CSSProperties
        }
      >
        <Suspense fallback={null}>
          <SettingsPanel
            settings={settings}
            onSettingsChange={setSettings}
            onAddCategory={addCategory}
          />
          <Scratchpad />
          <ShortcutHelp />
          <ChromeTabButton visible={settings.showChromeTab} />
        </Suspense>

        {/* Center Section */}
        <div className="center-section">
          {settings.showClock && (
            <Clock
              userName={settings.userName}
              showGreeting={settings.showGreeting}
              format={settings.clockFormat}
            />
          )}
          {settings.showDailyGoal && <DailyGoal />}
          <CommandPalette />
        </div>

        {/* Content Section */}
        <div className="content-section">
          <div className="ascii-column">
            <PixelArt asciiArt={displayAsciiArt} />
          </div>
          <div className="links-column">
            <Bookmarks
              categories={categories}
              onAddCategory={addCategory}
              onDeleteCategory={deleteCategory}
              onRenameCategory={renameCategory}
              onAddBookmark={addBookmark}
              onDeleteBookmark={deleteBookmark}
              onEditBookmark={editBookmark}
            />
          </div>
        </div>

        {settings.showStatusBar && <ActivityWidget />}

        <Suspense fallback={null}>
          <FocusMode />
        </Suspense>
      </div>
    </>
  );
}

export default App;
