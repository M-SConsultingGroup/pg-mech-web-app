import React, { useState, useEffect } from 'react';
import BaseModal from './BaseModal';
import { ModalType, Priority } from '@/common/interfaces';
import PriorityModal from './PriorityModal';
import NotesModal from './StopNotesModal';

interface UnifiedModalProps {
  isOpen: boolean;
  modalType: ModalType;
  onRequestClose: () => void;
  onSelectPriority?: (priority: Priority) => void;
  onSaveNotes?: (notes: string) => void;
  phoneNumber?: string;
  onConfirm?: () => void;
  message?: string;
}

const UnifiedModal: React.FC<UnifiedModalProps> = ({
  isOpen,
  modalType,
  onRequestClose,
  onSelectPriority,
  onSaveNotes,
  phoneNumber,
  onConfirm,
  message,
}) => {
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setNotes('');
    }
  }, [isOpen]);

  let footerActions = null;

  if (modalType === 'priority' && onSelectPriority) {
    footerActions = (
      <button onClick={() => onSelectPriority('Medium')} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
        Select
      </button>
    );
  } else if (modalType === 'notes' && onSaveNotes) {
    footerActions = (
      <button onClick={() => onSaveNotes(notes)} className="bg-blue-500 hover:bg-blue-700 text-white p-2 rounded">
        Save
      </button>
    );
  } else if (modalType === 'popup' && phoneNumber) {
    footerActions = (
      <>
        <a
          href={`tel:${phoneNumber}`}
          className="bg-blue-500 hover:bg-blue-700 text-white p-2 rounded"
        >
          Call
        </a>
        <a
          href={`sms:${phoneNumber}`}
          className="bg-green-500 hover:bg-green-700 text-white p-2 rounded"
        >
          Text
        </a>
      </>
    );
  } else if (modalType === 'confirmation' && onConfirm) {
    footerActions = (
      <button onClick={onConfirm} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
        Confirm
      </button>
    );
  }

  return (
    <BaseModal isOpen={isOpen} onRequestClose={onRequestClose} title={message || 'Modal'} footerActions={footerActions}>
      {modalType === 'priority' && onSelectPriority && (
        <PriorityModal onSelectPriority={onSelectPriority} />
      )}
      {modalType === 'notes' && onSaveNotes && (
        <NotesModal notes={notes} setNotes={setNotes} />
      )}
    </BaseModal>
  );
};

export default UnifiedModal;