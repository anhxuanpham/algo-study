import { useId, useRef } from 'react';
import './foundation-dialog.css';

type Props = {
  triggerLabel: string;
  title: string;
  description: string;
};

export function FoundationDialog({ triggerLabel, title, description }: Props) {
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  function openDialog() {
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  return (
    <>
      <button ref={triggerRef} className="dialog-trigger" type="button" onClick={openDialog}>
        {triggerLabel}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="foundation-dialog"
        onClose={() => triggerRef.current?.focus()}
      >
        <div className="foundation-dialog__content">
          <p className="eyebrow">Native dialog primitive</p>
          <h2 id={titleId}>{title}</h2>
          <p>{description}</p>
          <button className="dialog-close" type="button" onClick={closeDialog}>
            Đóng
          </button>
        </div>
      </dialog>
    </>
  );
}
