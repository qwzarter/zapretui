import { useState } from 'react';

const useClipboard = () => {
    const [messageBox, setMessageBox] = useState('');

    const copyToClipboard = (textToCopy) => {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                setMessageBox('Детали скопированы в буфер обмена!');
            } else {
                setMessageBox('Не удалось скопировать детали.');
            }
        } catch (err) {
            console.error('Ошибка при копировании:', err);
            setMessageBox('Ошибка при попытке скопировать детали.');
        }
        document.body.removeChild(textarea);
    };

    return {
        messageBox,
        setMessageBox,
        copyToClipboard,
    };
};

export default useClipboard;