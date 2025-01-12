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
      className="fixed inset-0 flex items-center justify-center z-50"
      overlayClassName="fixed inset-0 bg-black bg-opacity-75"
    >
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Select Priority</h2>
        <div className="space-y-2">
          {['Highest', 'High', 'Medium', 'Low', 'Lowest'].map((priority) => (
            <label key={priority} className="flex items-center space-x-2">
              <input
                type="radio"
                value={priority}
                checked={selectedPriority === priority}
                onChange={() => setSelectedPriority(priority as 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest')}
                className="form-radio text-blue-600"
              />
              <span>{priority}</span>
            </label>
          ))}
        </div>
        <div className="mt-6 flex justify-end space-x-2">
          <button onClick={handleSelect} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
            Select
          </button>
          <button onClick={onRequestClose} className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition">
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PriorityModal;