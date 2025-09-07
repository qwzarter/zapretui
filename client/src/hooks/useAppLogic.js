import { useState, useEffect, useRef, useCallback } from 'react';

const useAppLogic = () => {
	// 1. Константы
	const hasRunOnce = useRef(false);
	const appVersion = "1.3.5";
	const strategies = [
		{ id: 'general', name: 'Стандартный' },
		{ id: 'general_ALT', name: 'ALT' },
		{ id: 'general_ALT2', name: 'ALT2' },
		{ id: 'general_ALT3', name: 'ALT3 (Рекомендованный)' },
		{ id: 'general_ALT4', name: 'ALT4' },
		{ id: 'general_ALT5', name: 'ALT5' },
		{ id: 'general_ALT6', name: 'ALT6' },
		{ id: 'general_FAKE_TLS', name: 'FAKE TLS' },
		{ id: 'general_FAKE_TLS_ALT', name: 'FAKE TLS ALT' },
		{ id: 'general_FAKE_TLS_AUTO', name: 'FAKE TLS AUTO' },
		{ id: 'general_FAKE_TLS_AUTO_ALT', name: 'FAKE TLS AUTO ALT' },
		{ id: 'general_FAKE_TLS_AUTO_ALT2', name: 'FAKE TLS AUTO ALT2' },
		{ id: 'general_МГТС', name: 'MGTS' },
		{ id: 'general_МГТС2', name: 'MGTS2' },
	];

	// 2. Состояния
	const [shouldStartInTray, setShouldStartInTray] = useState(null);
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [isInitialLoad, setIsInitialLoad] = useState(true);
	
	const [isConnected, setIsConnected] = useState(false);
	const [isGameFilterEnabled, setIsGameFilterEnabled] = useState(null);
	const [selectedStrategy, setSelectedStrategy] = useState(() => {
		try {
			const savedStrategy = localStorage.getItem('selectedStrategy');
			if (savedStrategy) {
				return savedStrategy;
			}
		} catch (error) {
			console.error("Failed to load strategy from localStorage", error);
		}
		return 'general_ALT3';
	});

	const [modalMessage, setModalMessage] = useState('');
	const [modalType, setModalType] = useState('');
	const [modalAction, setModalAction] = useState(null);
	const [detailedErrorMessage, setDetailedErrorMessage] = useState('');
	
	const [isDarkMode, setIsDarkMode] = useState(() => {
		try {
			const savedMode = localStorage.getItem('isDarkMode');
			if (savedMode !== null) {
				return JSON.parse(savedMode);
			}
		} catch (error) {
			console.error("Failed to load dark mode from localStorage", error);
		}
		return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
	});
	
	const [isAutoConnectEnabled, setIsAutoConnectEnabled] = useState(() => {
		try {
			const savedAutoConnect = localStorage.getItem('isAutoConnectEnabled');
			if (savedAutoConnect !== null) {
				return JSON.parse(savedAutoConnect);
			}
		} catch (error) {
			console.error("Failed to load auto-connect setting from localStorage", error);
		}
		return true; 
	});
	
	const [isRunAtStartupEnabled, setIsRunAtStartupEnabled] = useState(false);

	const [runInTray, setRunInTray] = useState(() => {
		try {
			const savedRunInTray = localStorage.getItem('runInTray');
			if (savedRunInTray !== null) {
				return JSON.parse(savedRunInTray);
			}
		} catch (error) {
			console.error("Failed to load run in tray setting from localStorage", error);
		}
		return true;
	});

	// 3. Ссылки
	const dropdownRef = useRef(null);

	// 4. Производные Переменные
	const currentStrategyName = strategies.find(s => s.id === selectedStrategy)?.name || 'Выбрать стратегию';

	// 5. Функции-Обработчики
	
	const handleToggleStartInTray = useCallback(() => {
		setShouldStartInTray(prev => {
            const newValue = !prev;
            if (window.electronAPI) {
                window.electronAPI.updateShouldStartInTray(newValue);
            }
            return newValue;
        });
	}, []);
	
	const handleAutoConnectToggle = useCallback(() => {
		setIsAutoConnectEnabled(prev => !prev);
	}, []);
	
	const handleShowErrorModal = useCallback((title, detail) => {
		setModalMessage(title);
		setDetailedErrorMessage(detail);
		setModalType('error');
		setIsLoading(false);
	}, []);
	
	const fetchConnectionStatus = useCallback(async () => {
		if (!window.electronAPI) {
			handleShowErrorModal('Electron API не доступен.', 'Перезапустите приложение.');
			return;
		}

		try {
			console.log('[App]: Запрос статуса Zapret...');
			const result = await window.electronAPI.getZapretStatus();
			if (result.success && result.status) {
				setIsConnected(result.status.isRunning);
				console.log('[App]: Статус Zapret получен:', result.status.isRunning ? 'Подключен' : 'Отключен');
			} else {
				setIsConnected(false);
				console.error('[App]: Не удалось получить статус Zapret:', result.error);
			}

			console.log('[App]: Запрос статуса игрового фильтра...');
			const gameFilterStatusResult = await window.electronAPI.runPowershellScript('service', ['Get-GameFilterStatus']);
			if (gameFilterStatusResult.success && gameFilterStatusResult.output) {
				try {
					const gameFilterData = JSON.parse(gameFilterStatusResult.output.trim());
					setIsGameFilterEnabled(gameFilterData.Status === 'enabled');
					console.log('[App]: Статус игрового фильтра получен:', gameFilterData.Status);
				} catch (parseError) {
					console.error('[App]: Ошибка парсинга статуса игрового фильтра:', parseError);
					setIsGameFilterEnabled(false);
				}
			} else {
				console.error('[App]: Не удалось получить статус игрового фильтра:', gameFilterStatusResult.error);
				setIsGameFilterEnabled(false);
			}
		} catch (error) {
			setIsConnected(false);
			console.error('[App]: Общая ошибка при запросе статуса:', error);
		}
	}, [handleShowErrorModal]);
	
	const handleConnect = useCallback(async (strategyId = selectedStrategy) => {
		if (isLoading) return;
		setIsLoading(true);
		
		if (!window.electronAPI) {
			handleShowErrorModal('Произошла ошибка.', 'Electron API не доступен. Перезапустите приложение.');
			return;
		}
	
		try {
			const statusResult = await window.electronAPI.getZapretStatus();
			const isZapretRunning = statusResult.success && statusResult.status && statusResult.status.isRunning;
	
			if (isZapretRunning) {
				setModalMessage('Zapret уже запущен. Вы хотите отключить его и подключиться снова?');
				setModalType('confirm');
				setModalAction(() => async () => {
					setModalMessage('');
					setModalType('');
					console.log('[App]: Подтверждено действие модального окна "Да". Запуск последовательности завершения и переподключения.');
	
					try {
						const terminateResult = await window.electronAPI.terminateZapretProcess();
						if (terminateResult.exitCode !== 0 && !terminateResult.stdout.includes('не найден')) {
							handleShowErrorModal(
								'Ошибка при отключении Zapret.',
								`Ошибка: ${terminateResult.stderr || 'Неизвестная ошибка'}`
							);
							return;
						}
	
						await new Promise(resolve => setTimeout(2000, resolve));
	
						const scriptResult = await window.electronAPI.runPowershellScript(strategyId, []);
						if (!scriptResult.success) {
							handleShowErrorModal(
								'Не удалось подключиться.',
								`Не удалось запустить скрипт ${strategyId}: ${scriptResult.error || 'Неизвестная ошибка'}`
							);
							return;
						}
						console.log('[App]: PowerShell скрипт успешно выполнен.');
					} catch (error) {
						handleShowErrorModal('Критическая ошибка.', `Ошибка: ${error.message}`);
					} finally {
						await fetchConnectionStatus();
					}
				});
				setIsLoading(false);
				return;
			}
	
			console.log('[App]: Zapret не запущен. Приступаем к первому подключению...');
			const scriptResult = await window.electronAPI.runPowershellScript(strategyId, []);
			if (!scriptResult.success) {
				handleShowErrorModal(
					'Не удалось подключиться.',
					`Не удалось запустить скрипт ${strategyId}: ${scriptResult.error || 'Неизвестная ошибка'}`
				);
			} else {
				console.log('[App]: PowerShell скрипт успешно выполнен.');
			}
		} catch (error) {
			handleShowErrorModal('Общая ошибка в handleConnect:', `Ошибка: ${error.message}`);
		} finally {
			await fetchConnectionStatus();
		}
	}, [isLoading, selectedStrategy, fetchConnectionStatus, handleShowErrorModal]);

	const handleDisconnect = useCallback(async () => {
		if (isLoading) return;
		setIsLoading(true);

		if (!window.electronAPI) {
			handleShowErrorModal('Произошла ошибка.', 'Electron API не доступен. Перезапустите приложение.');
			return;
		}

		try {
			const statusResult = await window.electronAPI.getZapretStatus();
			const isRunning = statusResult.success && statusResult.status && statusResult.status.isRunning;

			if (!isRunning) {
				console.log('Zapret уже отключен.');
				await fetchConnectionStatus();
				return;
			}
			console.log('[App]: Zapret запущен, пытаемся его отключить.');
			
			const terminateResult = await window.electronAPI.terminateZapretProcess();
			if (terminateResult.exitCode !== 0 && !terminateResult.stdout.includes('не найден')) {
				handleShowErrorModal(
					'Ошибка при отключении Zapret.',
					`Ошибка: ${terminateResult.stderr || 'Неизвестная ошибка'}`
				);
			}
			
		} catch (error) {
			handleShowErrorModal('Ошибка отключения:', `Ошибка: ${error.message}`);
		} finally {
			await fetchConnectionStatus();
		}
	}, [isLoading, fetchConnectionStatus, handleShowErrorModal]);
	
	const handleGameFilterToggle = useCallback(async () => {
		if (isLoading) return;
		setIsLoading(true);
		
		if (!window.electronAPI || typeof window.electronAPI.runPowershellScript !== 'function') {
			handleShowErrorModal(
				'Ошибка API.',
				'Electron API (runPowershellScript) не доступен. Возможно, приложение еще не полностью загружено.'
			);
			return;
		}

		try {
			const newStatus = !isGameFilterEnabled;
			const actionString = newStatus ? 'enable' : 'disable';
			console.log(`[App]: Вызов runPowershellScript для Game Filter. Скрипт: service, Аргументы: [Set-GameFilterStatus -Action '${actionString}']`);
			const result = await window.electronAPI.runPowershellScript('service', [`Set-GameFilterStatus -Action '${actionString}'`]);

			if (result.success && result.output) {
				try {
					const psResult = JSON.parse(result.output.trim());
					if (psResult.success) {
						setIsGameFilterEnabled(newStatus);
					} else {
						handleShowErrorModal(
							'Ошибка PowerShell.',
							`Ошибка PowerShell при переключении игрового фильтра: ${psResult.message || 'Неизвестная ошибка'}`
						);
					}
				} catch (parseError) {
					handleShowErrorModal(
						'Ошибка парсинга.',
						`Ошибка парсинга JSON от PowerShell: ${parseError.message}. Raw output: ${result.output}`
					);
				}
			} else {
				handleShowErrorModal(
					'Ошибка выполнения.',
					`Не удалось выполнить скрипт PowerShell для игрового фильтра: ${result.error || 'Неизвестная ошибка'}`
				);
			}
		} catch (error) {
			handleShowErrorModal('Критическая ошибка.', `Ошибка при вызове Set-GameFilterStatus: ${error.message}`);
		} finally {
			setIsLoading(false);
		}
	}, [isLoading, isGameFilterEnabled, handleShowErrorModal]);
	
	const handleToggleRunAtStartup = useCallback(async () => {
		if (window.electronAPI && window.electronAPI.toggleRunAtStartup) {
			const newStatus = !isRunAtStartupEnabled;
			const result = await window.electronAPI.toggleRunAtStartup(newStatus);
			if (result.success) {
				setIsRunAtStartupEnabled(newStatus);
			} else {
				console.error('Не удалось изменить статус автозапуска:', result.message);
			}
		}
	}, [isRunAtStartupEnabled]);

	const handleToggleRunInTray = () => {
		setRunInTray(prev => !prev);
	};
	
	const toggleDarkMode = () => {
		setIsDarkMode(prevMode => !prevMode);
	};
	
	const openSettingsMenu = () => {
		setIsSettingsOpen(true);
	};

	const closeSettingsMenu = () => {
		setIsSettingsOpen(false);
	};

	const handleModalConfirm = () => {
		if (modalAction) {
			modalAction();
		}
		setModalMessage('');
		setModalType('');
		setModalAction(null);
		setDetailedErrorMessage('');
	};

	const handleModalCancel = () => {
		setModalMessage('');
		setModalType('');
		setModalAction(null);
		setIsLoading(false);
		setDetailedErrorMessage('');

		console.log('[App]: Пользователь отменил запрос на переподключение. Кнопка сброшена на "Подключить". Zapret НЕ был остановлен.');
	};

// Эффекты

	useEffect(() => {
        const fetchInitialSettings = async () => {
            if (window.electronAPI && window.electronAPI.getSettings) {
                try {
                    const settings = await window.electronAPI.getSettings();
                    setShouldStartInTray(settings.shouldStartInTray);
                    console.log(`[App]: Начальная настройка 'shouldStartInTray' загружена: ${settings.shouldStartInTray}`);
                } catch (error) {
                    console.error("[App]: Не удалось загрузить начальные настройки из Store", error);
                }
            }
        };

        fetchInitialSettings();
	}, []); 
	
	useEffect(() => {
		try {
			localStorage.setItem('shouldStartInTray', JSON.stringify(shouldStartInTray));
		} catch (error) {
			console.error("Failed to save 'shouldStartInTray' setting to localStorage", error);
		}
	}, [shouldStartInTray]);
	
	useEffect(() => {
		if (isConnected !== null) {
			setIsLoading(false);
		}
	}, [isConnected]);
	
	useEffect(() => {
		if (hasRunOnce.current) {
			return;
		}

		const checkInitialStatusAndConnect = async () => {
			console.log('[App]: Выполнение начальной проверки статуса...');
			fetchConnectionStatus();
			
			if (isAutoConnectEnabled && isInitialLoad) {
				console.log('[App]: Автоматическое подключение при запуске...');
				await handleConnect();
				setIsInitialLoad(false);
			}

			hasRunOnce.current = true;
		};

		checkInitialStatusAndConnect();
	}, [isAutoConnectEnabled, handleConnect, fetchConnectionStatus, isInitialLoad]);

	useEffect(() => {
		const intervalId = setInterval(fetchConnectionStatus, 15000);

		return () => clearInterval(intervalId);
	}, [fetchConnectionStatus]);

	useEffect(() => {
		if (window.electronAPI) {
			window.electronAPI.updateTrayMenu({ isConnected, selectedStrategy, strategies });
		}
	}, [isConnected, selectedStrategy, strategies]);
	
	useEffect(() => {
		if (window.electronAPI) {
			window.electronAPI.onTrayConnect((strategyId) => {
				setSelectedStrategy(strategyId);
				handleConnect(strategyId);
			});

			window.electronAPI.onTrayDisconnect(() => {
				handleDisconnect();
			});
		}
	}, [handleConnect, handleDisconnect]);

	useEffect(() => {
		const getStatus = async () => {
			if (window.electronAPI && window.electronAPI.getRunAtStartupStatus) {
				try {
					const result = await window.electronAPI.getRunAtStartupStatus();
					if (result.success) {
						setIsRunAtStartupEnabled(result.isEnabled);
					}
				} catch (error) {
					console.error("Failed to get run-at-startup status:", error);
				}
			}
		};
		getStatus();
	}, []);
	
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setIsDropdownOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);
	
	useEffect(() => {
		try {
			localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
			if (isDarkMode) {
				document.body.classList.add('dark');
			} else {
				document.body.classList.remove('dark');
			}
		} catch (error) {
			console.error("Failed to save dark mode to localStorage", error);
		}
	}, [isDarkMode]);

	useEffect(() => {
		try {
			localStorage.setItem('selectedStrategy', selectedStrategy);
		} catch (error) {
			console.error("Failed to save strategy to localStorage", error);
		}
	}, [selectedStrategy]);
	
	useEffect(() => {
		try {
			localStorage.setItem('isAutoConnectEnabled', JSON.stringify(isAutoConnectEnabled));
		} catch (error) {
			console.error("Failed to save auto-connect setting to localStorage", error);
		}
	}, [isAutoConnectEnabled]);

	useEffect(() => {
		try {
			localStorage.setItem('runInTray', JSON.stringify(runInTray));
			if (window.electronAPI) {
				window.electronAPI.updateRunInTray(runInTray);
			}
		} catch (error) {
			console.error("Failed to save run in tray setting to localStorage", error);
		}
	}, [runInTray]);

	return {
		appVersion,
		strategies,
		isSettingsOpen,
		isLoading,
		isGameFilterEnabled,
		isConnected,
		modalMessage,
		modalType,
		modalAction,
		detailedErrorMessage,
		isDropdownOpen,
		dropdownRef,
		currentStrategyName,
		isDarkMode,
		isAutoConnectEnabled,
		handleAutoConnectToggle,
		isRunAtStartupEnabled,
		shouldStartInTray,
		runInTray,
		handleConnect,
		handleDisconnect,
		handleToggleRunAtStartup,
		handleToggleRunInTray,
		handleToggleStartInTray,
		toggleDarkMode,
		openSettingsMenu,
		closeSettingsMenu,
		handleModalConfirm,
		handleModalCancel,
		handleGameFilterToggle,
		setIsDropdownOpen,
		setSelectedStrategy,
		selectedStrategy,
		setIsAutoConnectEnabled
	};
};

export default useAppLogic;