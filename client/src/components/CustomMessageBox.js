import React from 'react';

const CustomMessageBox = ({ message, onClose }) => {
    if (!message) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="p-6 rounded-lg shadow-xl max-w-xs w-full mx-4 bg-gray-800 text-white text-center">
                <p className="text-lg font-semibold mb-4">{message}</p>
                <button
                    onClick={onClose}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors font-medium"
                >
                    ОК
                </button>
            </div>
        </div>
    );
};

export default CustomMessageBox;