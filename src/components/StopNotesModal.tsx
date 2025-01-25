import React from 'react';

interface NotesModalProps {
  notes: string;
  setNotes: (notes: string) => void;
}

const NotesModal: React.FC<NotesModalProps> = ({ notes, setNotes }) => {
  return (
    <div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="w-full p-2 border rounded mb-4"
        rows={4}
      />
    </div>
  );
};

export default NotesModal;