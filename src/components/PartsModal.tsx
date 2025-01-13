import React, { useState } from 'react';
import { Parts } from '@/common/interfaces';

interface PartsModalProps {
  parts: Parts[];
  isOpen: boolean;
  onClose: () => void;
  onDone: (selectedParts: string[]) => void;
}

const PartsModal: React.FC<PartsModalProps> = ({ parts, isOpen, onClose, onDone }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedParts, setSelectedParts] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    setSelectedParts([]);
  };

  const handlePartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const part = e.target.value;
    setSelectedParts((prev) =>
      e.target.checked ? [...prev, part] : prev.filter((p) => p !== part)
    );
  };

  const handleDone = () => {
    onDone(selectedParts);
    onClose();
  };

  const handleBack = () => {
    setSelectedCategory('');
    setSelectedParts([]);
  };

  const selectedCategoryParts = parts.find((category) => category.category === selectedCategory);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg shadow-lg max-w-3xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Parts List</h2>
          <button onClick={onClose} className="text-red-600 font-bold">&times;</button>
        </div>
        {selectedCategory ? (
          <div>
            <h3 className="font-semibold mb-2">{selectedCategory}</h3>
            <ul className="list-none">
              {selectedCategoryParts?.parts.map((part) => (
                <li key={part}>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      value={part}
                      checked={selectedParts.includes(part)}
                      onChange={handlePartChange}
                      className="mr-2"
                    />
                    {part}
                  </label>
                </li>
              ))}
            </ul>
            <div className="flex justify-between mt-4">
              <button onClick={handleBack} className="bg-gray-500 hover:bg-gray-700 text-white p-2 rounded">
                Back
              </button>
              <button onClick={onClose} className="bg-red-500 hover:bg-red-700 text-white p-2 rounded">
                Cancel
              </button>
              <button onClick={handleDone} className="bg-green-500 hover:bg-green-700 text-white p-2 rounded">
                Done
              </button>
            </div>
          </div>
        ) : (
          <div>
            <select
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="border p-2 rounded w-full mb-4"
            >
              <option value="">Select a Category</option>
              {parts.map((category) => (
                <option key={category.category} value={category.category}>
                  {category.category}
                </option>
              ))}
            </select>
            <div className="flex justify-end">
              <button onClick={onClose} className="bg-red-500 hover:bg-red-700 text-white p-2 rounded">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartsModal;