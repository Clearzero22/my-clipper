import { useTheme } from "../../shared/hooks";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "切换到浅色" : "切换到深色"}
      title={isDark ? "浅色" : "深色"}
      className="flex h-9 w-9 items-center justify-center rounded-md border border-line bg-transparent text-ink transition-all active:scale-95 hover:bg-paper2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brick"
    >
      <span className="font-serif text-base leading-none">{isDark ? "☀" : "☾"}</span>
    </button>
  );
}
