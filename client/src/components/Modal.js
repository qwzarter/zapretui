import React from 'react';
import CustomMessageBox from './CustomMessageBox';
import useClipboard from '../hooks/useClipboard';

const Modal = ({ message, type, onConfirm, onCancel, detailedError }) => {
    const { messageBox, setMessageBox, copyToClipboard } = useClipboard();

    if (!message) return null;

    const isConfirm = type === 'confirm';
    const isError = type === 'error';

    const handleCopy = () => {
        copyToClipboard(detailedError || message);
    };

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className={`p-6 rounded-lg shadow-xl max-w-sm w-full mx-4
                    ${isError ? 'bg-red-700 text-white' : 'bg-gray-800 text-white'}`}>
                    <p className="text-lg font-semibold mb-4 text-center">
                        {isError ? 'Произошла ошибка.' : message}
                    </p>
                    <div className="flex justify-center space-x-4">
                        {isConfirm && (
                            <>
                                <button
                                    onClick={onConfirm}
                                    className="px-5 py-2 bg-green-600 hover:bg-green-700 rounded-md transition-colors font-medium"
                                >
                                    Да
                                </button>
                                <button
                                    onClick={onCancel}
                                    className="px-5 py-2 bg-gray-600 hover:bg-gray-700 rounded-md transition-colors font-medium"
                                >
                                    Отмена
                                </button>
                            </>
                        )}
                        {isError && (
                            <div className="flex flex-col space-y-3 w-full">
                                <button
                                    onClick={onConfirm}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors font-medium"
                                >
                                    ОК
                                </button>
                                <button
                                    onClick={handleCopy}
                                    className="px-5 py-2 bg-gray-600 hover:bg-gray-700 rounded-md transition-colors font-medium"
                                >
                                    Скопировать детали
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <CustomMessageBox message={messageBox} onClose={() => setMessageBox('')} />
        </>
    );
};

export default Modal;