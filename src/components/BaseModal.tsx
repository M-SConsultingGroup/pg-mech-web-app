import React from 'react';
import Modal from 'react-modal';

interface BaseModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  title: string;
  children: React.ReactNode;
  footerActions?: React.ReactNode;
}

const BaseModal: React.FC<BaseModalProps> = ({ isOpen, onRequestClose, title, children, footerActions }) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel={title}
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      overlayClassName="fixed inset-0 bg-black bg-opacity-75"
    >
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <div>{children}</div>
        <div className="mt-6 flex justify-end space-x-2">
          {footerActions}
          <button onClick={onRequestClose} className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition">
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default BaseModal;