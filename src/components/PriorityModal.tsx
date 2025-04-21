// PriorityModal.tsx
import React, { useEffect, useState } from 'react';
import { Priority } from '@/common/interfaces';

interface PriorityModalProps {
  onSelectPriority: (priority: Priority) => void;
  selectedPriority: Priority;
  setSelectedPriority: (priority: Priority) => void;
}

const PriorityModal: React.FC<PriorityModalProps> = ({ onSelectPriority, selectedPriority, setSelectedPriority}) => {
  useEffect(() => {
    setSelectedPriority('Medium');
  }, []);

  return (
    <div className="space-y-2">
      {['Highest', 'High', 'Medium', 'Low', 'Lowest'].map((priority) => (
        <label key={priority} className="flex items-center space-x-2">
          <input
            type="radio"
            value={priority}
            checked={selectedPriority === priority}
            onChange={() => setSelectedPriority(priority as Priority)}
            className="form-radio text-blue-600"
          />
          <span>{priority}</span>
        </label>
      ))}
    </div>
  );
};

export default PriorityModal;