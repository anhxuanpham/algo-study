import { Laptop, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import './theme-control.css';

const themes = [
  { value: 'system', label: 'Theo hệ thống', Icon: Laptop },
  { value: 'light', label: 'Sáng', Icon: Sun },
  { value: 'dark', label: 'Tối', Icon: Moon },
] as const;

type Theme = (typeof themes)[number]['value'];

function readTheme(): Theme {
  try {
    const value = window.localStorage.getItem('algo-study:theme');
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

function applyTheme(theme: Theme) {
  if (theme === 'system') {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = 'light dark';
  } else {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }
}

export function ThemeControl() {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const initial = readTheme();
    setTheme(initial);
    applyTheme(initial);
  }, []);

  function selectTheme(nextTheme: Theme) {
    setTheme(nextTheme);
    applyTheme(nextTheme);

    try {
      if (nextTheme === 'system') {
        window.localStorage.removeItem('algo-study:theme');
      } else {
        window.localStorage.setItem('algo-study:theme', nextTheme);
      }
    } catch {
      // Theme still applies for the current page when storage is unavailable.
    }
  }

  return (
    <fieldset className="theme-control">
      <legend className="sr-only">Giao diện màu</legend>
      {themes.map(({ value, label, Icon }) => (
        <button
          key={value}
          aria-pressed={theme === value}
          aria-label={`Giao diện: ${label}`}
          className="theme-option"
          title={label}
          type="button"
          onClick={() => selectTheme(value)}
        >
          <Icon aria-hidden="true" size={17} strokeWidth={1.8} />
          <span>{label}</span>
        </button>
      ))}
    </fieldset>
  );
}
