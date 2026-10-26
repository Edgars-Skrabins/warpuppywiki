import { SegmentedControl, useTheme, type ThemePreference } from "@/ui";

const options: { id: ThemePreference; label: string }[] = [
  { id: "dark", label: "Dark" },
  { id: "light", label: "Light" },
  { id: "system", label: "System" },
];

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useTheme();
  return (
    <SegmentedControl
      aria-label="Theme"
      size="sm"
      options={options}
      value={theme}
      onChange={setTheme}
      className={className}
    />
  );
}
