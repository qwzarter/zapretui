// src/ErrorBoundary.js
import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Обновить состояние, чтобы следующий рендер показал запасной UI.
    return { hasError: true, error }; // Сохраняем error здесь тоже
  }

  componentDidCatch(error, errorInfo) {
    // Вы также можете логировать ошибку в службу отчетов об ошибках
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ error, errorInfo });

    // Отправляем ошибку в главный процесс Electron для логирования
    if (window.electronAPI && typeof window.electronAPI.logError === 'function') {
      window.electronAPI.logError(error, errorInfo);
    }
  }

  handleCopyError = () => {
    if (this.state.error) {
      const errorDetails = `Ошибка: ${this.state.error.toString()}\nИнформация о компоненте: ${this.state.errorInfo ? this.state.errorInfo.componentStack : 'Нет информации о стеке компонента'}`;
      
      // Используем navigator.clipboard.writeText для копирования
      navigator.clipboard.writeText(errorDetails).then(() => {
        alert('Информация об ошибке скопирована в буфер обмена!');
      }).catch(err => {
        console.error('Не удалось скопировать ошибку:', err);
        alert('Не удалось скопировать ошибку: ' + err.message);
      });
    }
  };

  handleOpenLogs = async () => {
    if (window.electronAPI && typeof window.electronAPI.openLogsFile === 'function') {
      try {
        const result = await window.electronAPI.openLogsFile();
        if (!result.success) {
          alert(`Не удалось открыть файл логов: ${result.error}`);
        }
      } catch (err) {
        console.error('Ошибка при вызове openLogsFile:', err);
        alert('Ошибка при попытке открыть файл логов.');
      }
    } else {
      alert('Функция открытия логов недоступна. Возможно, приложение запущено не в Electron.');
    }
  };

  render() {
    if (this.state.hasError) {
      // Ваш кастомный красный экран
      return (
        <div style={{
          backgroundColor: 'red',
          color: 'white',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          padding: '20px',
          fontFamily: 'Arial, sans-serif'
        }}>
          <h1>Произошла ошибка!</h1>
          <p style={{ marginTop: '10px', marginBottom: '20px' }}>Пожалуйста, извините за неудобства. Если проблема повторяется, свяжитесь с поддержкой.</p>
          <div style={{ marginTop: '20px' }}>
            <button
              onClick={this.handleCopyError}
              style={{
                backgroundColor: 'white',
                color: 'red',
                border: 'none',
                padding: '10px 20px',
                margin: '0 10px',
                cursor: 'pointer',
                borderRadius: '5px',
                fontSize: '1em'
              }}
            >
              Скопировать ошибку
            </button>
            <button
              onClick={this.handleOpenLogs}
              style={{
                backgroundColor: 'white',
                color: 'red',
                border: 'none',
                padding: '10px 20px',
                margin: '0 10px',
                cursor: 'pointer',
                borderRadius: '5px',
                fontSize: '1em'
              }}
            >
              Открыть файл логов
            </button>
          </div>
          {/* Для отладки, если хотите видеть детали ошибки прямо на экране (в продакшене лучше скрывать) */}
          {/* <details style={{ marginTop: '30px', fontSize: '0.9em', maxWidth: '80%', overflow: 'auto', border: '1px solid white', padding: '10px', borderRadius: '5px' }}>
            <summary style={{ cursor: 'pointer' }}>Показать детали ошибки</summary>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', textAlign: 'left' }}>
              {this.state.error && `Error: ${this.state.error.toString()}\n`}
              {this.state.errorInfo && `Component Stack: ${this.state.errorInfo.componentStack}`}
            </pre>
          </details> */}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;