import { useId, useRef, useState } from 'react';
import './learning-tabs.css';

export type LearningTab = {
  id: string;
  label: string;
  content: string;
};

type Props = {
  label: string;
  tabs: LearningTab[];
};

export function LearningTabs({ label, tabs }: Props) {
  const baseId = useId();
  const [selectedId, setSelectedId] = useState(tabs[0]?.id ?? '');
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  if (tabs.length === 0) {
    return null;
  }

  function selectAt(index: number) {
    const tab = tabs[index];
    if (!tab) return;
    setSelectedId(tab.id);
    tabRefs.current[index]?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent, index: number) {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      selectAt((index + 1) % tabs.length);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      selectAt((index - 1 + tabs.length) % tabs.length);
    } else if (event.key === 'Home') {
      event.preventDefault();
      selectAt(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      selectAt(tabs.length - 1);
    }
  }

  return (
    <section className="learning-tabs">
      <div aria-label={label} className="learning-tabs__list" role="tablist">
        {tabs.map((tab, index) => {
          const selected = tab.id === selectedId;
          const tabId = `${baseId}-${tab.id}-tab`;
          const panelId = `${baseId}-${tab.id}-panel`;

          return (
            <button
              key={tab.id}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              aria-controls={panelId}
              aria-selected={selected}
              className="learning-tabs__tab"
              id={tabId}
              role="tab"
              tabIndex={selected ? 0 : -1}
              type="button"
              onClick={() => setSelectedId(tab.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {tabs.map((tab) => {
        const selected = tab.id === selectedId;
        const tabId = `${baseId}-${tab.id}-tab`;
        const panelId = `${baseId}-${tab.id}-panel`;

        return (
          <div
            key={tab.id}
            aria-labelledby={tabId}
            className="learning-tabs__panel"
            hidden={!selected}
            id={panelId}
            role="tabpanel"
            tabIndex={0}
          >
            <p>{tab.content}</p>
          </div>
        );
      })}
    </section>
  );
}
