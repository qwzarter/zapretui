import React, { useState, useEffect, useRef, useCallback } from 'react';
import TitleBar from './components/TitleBar';
import CustomMessageBox from './components/CustomMessageBox';
import Modal from './components/Modal';

import { customAnimations } from './animations';

import useAppLogic from './hooks/useAppLogic';

const App = () => {
  const {
    appVersion,
    isSettingsOpen,
    isDarkMode,
    isLoading,
    isGameFilterEnabled,
    isAutoConnectEnabled,
    handleAutoConnectToggle,
    isRunAtStartupEnabled,
    runInTray,
    isConnected,
    shouldStartInTray,
    handleToggleStartInTray,
    modalMessage,
    modalType,
    modalAction,
    detailedErrorMessage,
    isDropdownOpen,
    dropdownRef,
    toggleDarkMode,
    openSettingsMenu,
    closeSettingsMenu,
    handleConnect,
    handleDisconnect,
    handleModalConfirm,
    handleModalCancel,
    handleGameFilterToggle,
    handleToggleRunAtStartup,
    handleToggleRunInTray,
    strategies,
    selectedStrategy,
    setSelectedStrategy,
    currentStrategyName,
    setIsDropdownOpen,
  } = useAppLogic();

  return (
    <div className={`w-screen h-screen relative flex flex-col items-center justify-between 
      ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'} 
      rounded-none overflow-hidden`}>

      <style>{customAnimations}</style>

      <div className={`absolute inset-0 z-0 
        ${isDarkMode ? 'bg-gradient-to-br from-blue-900/20 via-purple-900/10 to-transparent' : 'bg-gradient-to-br from-blue-200/60 via-purple-200/50 to-transparent'} 
        opacity-70 animate-pulse-slow`}>
      </div>
      <div className={`absolute w-72 h-72 rounded-full filter blur-xl 
        top-[10%] left-[15%] 
        ${isDarkMode ? 'animate-blob-1 bg-blue-500 opacity-60' : 'animate-pulsing-glow bg-blue-400 opacity-80 mix-blend-multiply'}`}></div>

      <div className={`absolute w-72 h-72 rounded-full filter blur-xl 
        bottom-[10%] right-[15%] 
        ${isDarkMode ? 'animate-blob-2 bg-purple-500 opacity-60' : 'animate-pulsing-glow bg-purple-400 opacity-80 mix-blend-multiply'}`}></div>

      <div className={`absolute w-72 h-72 rounded-full filter blur-xl 
        top-[30%] right-[25%] 
        ${isDarkMode ? 'animate-blob-3 bg-green-500 opacity-60' : 'animate-pulsing-glow bg-green-400 opacity-80 mix-blend-multiply'}`}></div>

      {!isDarkMode && (
        <div className="absolute inset-0 z-10" style={{
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(0,0,0,0.1) 75%, rgba(0,0,0,0.2) 100%)'
        }}></div>
      )}

      <TitleBar
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        openSettingsMenu={openSettingsMenu}
        isSettingsOpen={isSettingsOpen}
      />

      <div className={`relative z-10 w-full flex-grow flex flex-col items-center justify-center px-6 pb-6 pt-16 
        border-l-2 border-r-2 border-b-2 
        ${isDarkMode ? 'border-gray-800 border-opacity-50 bg-opacity-50' : 'border-gray-300 border-opacity-50 bg-opacity-50'}`}>
        <div className="flex flex-col items-center w-full">
          <h1 className={`text-5xl font-extrabold mb-6 text-blue-500 drop-shadow-lg`}>
            Zapret UI
          </h1>

          <div className="relative w-full max-w-md mb-4" ref={dropdownRef}>
            <div
              onClick={() => !isConnected && setIsDropdownOpen(prev => !prev)}
              className={`block w-full border px-4 py-3 pr-8 rounded-lg shadow-lg leading-tight focus:outline-none focus:ring-4 focus:ring-opacity-50 select-none 
    ${isDarkMode ? 'bg-gray-700 bg-opacity-70 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-100 bg-opacity-70 border-gray-300 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500'} 
    ${isConnected || isLoading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
            >
              {currentStrategyName}
            </div>
            <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 
              ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>

            {isDropdownOpen && !isConnected && !isLoading && (
              <div className={`absolute z-20 w-full mt-1 rounded-lg shadow-lg max-h-60 overflow-y-auto overflow-x-hidden custom-scrollbar 
                ${isDarkMode ? 'bg-gray-700 bg-opacity-70 border border-gray-600' : 'bg-gray-100 bg-opacity-70 border border-gray-300'}`}>
                {strategies.map((strategy) => (
                  <div
                    key={strategy.id}
                    onClick={() => {
                      setSelectedStrategy(strategy.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-[calc(100%+8px)] px-4 py-2 cursor-pointer transition-colors duration-200 
                      ${selectedStrategy === strategy.id
                        ? (isDarkMode ? 'bg-blue-600 bg-opacity-50 text-white' : 'bg-blue-500 bg-opacity-50 text-white')
                        : 'hover:bg-blue-500 hover:bg-opacity-50 hover:text-white'
                      }`}
                  >
                    {strategy.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-6 w-full max-w-md">
            <button
              onClick={isConnected ? handleDisconnect : () => handleConnect(selectedStrategy)}
              disabled={isLoading}
              className={`w-full px-6 py-3 rounded-lg font-bold text-lg transition-all duration-300 shadow-xl flex items-center justify-center 
                ${isConnected
                  ? (isDarkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white')
                  : (isDarkMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white')}
                ${isLoading ? 'opacity-70 cursor-not-allowed' : ''} 
                focus:outline-none focus:ring-4 focus:ring-opacity-70 ${isConnected ? 'focus:ring-red-500' : 'focus:ring-green-500'}`}
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : ''}
              {isConnected ? (isLoading ? 'Отключение...' : 'Отключить') : (isLoading ? 'Подключение...' : 'Подключить')}
            </button>
          </div>

          <div className="flex items-center justify-center mb-6 text-xl">
            <span className="mr-2">Статус:</span>
            <span className={`font-bold ${isConnected ? 'text-green-500' : (isDarkMode ? 'text-gray-400' : 'text-gray-500')}`}>
              {isConnected
                ? `Подключено (${strategies.find(s => s.id === selectedStrategy)?.name.replace(/\s*\(.*\)/, '') || selectedStrategy})`
                : 'Отключено'
              }
            </span>
          </div>

          <div className={`mb-4 w-full flex items-center justify-between px-4 py-3 rounded-lg shadow-lg 
            ${isDarkMode ? 'bg-gray-700 bg-opacity-70 border-gray-600' : 'bg-gray-100 bg-opacity-70 border-gray-300'}`}>
            <label className={`block text-xl font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Игровой режим:
            </label>
            <label htmlFor="game-filter-toggle" className={`flex items-center 
              ${(isConnected || isLoading) ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
              <div className="relative">
                <input
                  type="checkbox"
                  id="game-filter-toggle"
                  className="sr-only"
                  checked={isGameFilterEnabled}
                  onChange={handleGameFilterToggle}
                  disabled={isConnected || isLoading}
                />
                <div className={`block w-14 h-8 rounded-full transition-colors duration-200 ease-in-out 
                  ${isConnected || isLoading
                    ? (isDarkMode ? 'bg-emerald-950' : 'bg-emerald-900')
                    : (isGameFilterEnabled
                      ? (isDarkMode ? 'bg-green-600' : 'bg-green-500')
                      : (isDarkMode ? 'bg-gray-600' : 'bg-gray-400'))
                  }`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-200 ease-in-out 
                  ${isGameFilterEnabled ? 'translate-x-full' : ''} 
                  `}></div>
              </div>
            </label>
          </div>

        </div>
        <Modal
          message={modalMessage}
          type={modalType}
          onConfirm={handleModalConfirm}
          onCancel={handleModalCancel}
          detailedError={detailedErrorMessage}
        />

        {isSettingsOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`p-6 rounded-lg shadow-xl max-w-sm w-full mx-4 relative 
              ${isDarkMode ? 'bg-gray-800 bg-opacity-90 text-white' : 'bg-white bg-opacity-90 text-gray-800'}`}>

              <div className="relative flex flex-col items-center w-full">
                <button
                  onClick={closeSettingsMenu}
                  className={`absolute top-0 left-0 p-1 rounded-md transition-colors duration-200 
                    ${isDarkMode ? 'text-white hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-200'}`}
                  title="Назад"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                </button>

                <h2 className={`text-xl font-bold mb-4 text-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Настройки</h2>
                <div className="flex items-center justify-between w-full mb-4">
                  <span className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Автоподключение:</span>
                  <label htmlFor="auto-connect-toggle" className={`flex items-center 
    ${(isConnected || isLoading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                    <div className="relative">
                      <input
                        type="checkbox"
                        id="auto-connect-toggle"
                        className="sr-only"
                        checked={isAutoConnectEnabled}
                        onChange={handleAutoConnectToggle}
                        disabled={isConnected || isLoading}
                      />
                      <div className={`block w-14 h-8 rounded-full transition-colors duration-200 ease-in-out 
                        ${isAutoConnectEnabled ? 'bg-green-600' : (isDarkMode ? 'bg-gray-600' : 'bg-gray-400')}`}>
                      </div>
                      <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-200 ease-in-out 
                        ${isAutoConnectEnabled ? 'transform translate-x-full' : 'transform translate-x-0'}`}>
                      </div>
                    </div>
                  </label>
                </div>
                <div className="flex items-center justify-between mb-4 w-full">
                  <span className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Автозапуск с Windows:</span>
                  <label htmlFor="run-at-startup-toggle" className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        id="run-at-startup-toggle"
                        className="sr-only"
                        checked={isRunAtStartupEnabled}
                        onChange={handleToggleRunAtStartup}
                      />
                      <div className={`block w-14 h-8 rounded-full transition-colors duration-200 ease-in-out 
                        ${isRunAtStartupEnabled ? 'bg-green-600' : (isDarkMode ? 'bg-gray-600' : 'bg-gray-400')}`}>
                      </div>
                      <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-200 ease-in-out 
                        ${isRunAtStartupEnabled ? 'translate-x-full' : ''}`}></div>
                    </div>
                  </label>
                </div>
                {isRunAtStartupEnabled && (
                  <div className={`flex items-center w-full mb-4 pl-8 transition-opacity duration-300 ${isRunAtStartupEnabled ? 'opacity-100' : 'opacity-50'}`}>
                    <span className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Запускать в трее
                    </span>
                    <label htmlFor="start-in-tray-toggle" className="flex items-center cursor-pointer ml-auto">
                      <div className="relative">
                        <input
                          type="checkbox"
                          id="start-in-tray-toggle"
                          className="sr-only"
                          checked={shouldStartInTray}
                          onChange={handleToggleStartInTray}
                        />
                        <div className={`block w-10 h-6 rounded-full transition-colors duration-200 ease-in-out 
                          ${shouldStartInTray ? 'bg-green-600' : (isDarkMode ? 'bg-gray-600' : 'bg-gray-400')}`}>
                        </div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out 
                          ${shouldStartInTray ? 'translate-x-full' : ''}`}></div>
                      </div>
                    </label>
                  </div>
                )}
                <div className="flex items-center justify-between mb-4 w-full">
                  <span className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Сворачивать в трей:</span>
                  <label htmlFor="run-in-tray-toggle" className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        id="run-in-tray-toggle"
                        className="sr-only"
                        checked={runInTray}
                        onChange={handleToggleRunInTray}
                      />
                      <div className={`block w-14 h-8 rounded-full transition-colors duration-200 ease-in-out 
                        ${runInTray ? 'bg-green-600' : (isDarkMode ? 'bg-gray-600' : 'bg-gray-400')}`}>
                      </div>
                      <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-200 ease-in-out 
                        ${runInTray ? 'translate-x-full' : ''}`}></div>
                    </div>
                  </label>
                </div>
                <div className="flex items-center justify-between mb-4 w-full">
                  <span className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Тёмная тема:</span>
                  <label htmlFor="dark-mode-toggle" className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        id="dark-mode-toggle"
                        className="sr-only"
                        checked={isDarkMode}
                        onChange={toggleDarkMode}
                      />
                      <div className={`block w-14 h-8 rounded-full transition-colors duration-200 ease-in-out 
                        ${isDarkMode ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-200 ease-in-out 
                        ${isDarkMode ? 'translate-x-full' : ''}`}></div>
                    </div>
                  </label>
                </div>
                <div className="version-text">
                  <a 
                    href="https://github.com/qwzarter/zapretui/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-500 hover:underline"
                  >
                    ZapretUI
                  </a> v.<span className="font-bold">{appVersion}</span>
                </div>
                <div className="text-xs mt-1">
                  Powered by <a href="https://github.com/Flowseal/zapret-discord-youtube" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Zapret</a> and <a href="https://github.com/basil00/WinDivert" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">WinDivert</a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;