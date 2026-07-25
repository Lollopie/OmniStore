import type { ReactNode, RefObject } from 'react';
import Button from './Button.tsx';

interface ModalProps {
  dialogRef: RefObject<HTMLDialogElement>;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export const Modal = ({ dialogRef, title, onClose, children }: ModalProps) => {
  return (
    <div className="flex flex-col">
      <dialog ref={dialogRef} onClose={onClose} className="modal">
        <div className="modal-box">
          <header className="flex items-center justify-between sm:px-4">
            <h2 className="text-lg font-semibold text-base-400">{title}</h2>
            <Button
              size="md"
              className="bg-base-100 text-base-300 border-none"
              variant="primary"
              onClick={onClose}
            >
              X
            </Button>
          </header>
          {children}
        </div>
      </dialog>
    </div>
  );
};