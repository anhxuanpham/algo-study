(() => {
  try {
    const stored = window.localStorage.getItem('algo-study:theme');
    if (stored === 'light' || stored === 'dark') {
      document.documentElement.dataset.theme = stored;
      document.documentElement.style.colorScheme = stored;
      return;
    }

    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = 'light dark';
  } catch {
    document.documentElement.style.colorScheme = 'light dark';
  }
})();
