import React, { useState } from 'react';
import Modal from 'react-modal';

interface PriorityModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  onSelectPriority: (priority: 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest') => void;
}

const PriorityModal: React.FC<PriorityModalProps> = ({ isOpen, onRequestClose, onSelectPriority }) => {
  const [selectedPriority, setSelectedPriority] = useState<'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest'>('Medium');

  const handleSelect = () => {
    onSelectPriority(selectedPriority);
    onRequestClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Select Priority"
      style={{
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          zIndex: 1000,
        },
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1001,
        },
      }}
    >
      <h2>Select Priority</h2>
      <div>
        {['Highest', 'High', 'Medium', 'Low', 'Lowest'].map((priority) => (
          <label key={priority}>
            <input
              type="radio"
              value={priority}
              checked={selectedPriority === priority}
              onChange={() => setSelectedPriority(priority as 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest')}
            />
            {priority}
          </label>
        ))}
      </div>
      <button onClick={handleSelect}>Select</button>
      <button onClick={onRequestClose}>Cancel</button>
    </Modal>
  );
};

export default PriorityModal;