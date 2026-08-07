'use strict';
'require view';
'require rpc';
'require fs';
'require poll';
'require ui';

function detectLocale() {
	var htmlLang = '';
	var luciLang = '';
	var browserLang = '';

	try {
		htmlLang = document && document.documentElement ? (document.documentElement.getAttribute('lang') || '') : '';
	} catch (e) {}

	try {
		luciLang = window.L && L.env ? (L.env.lang || L.env.i18nLanguage || '') : '';
	} catch (e2) {}

	try {
		browserLang = (navigator.language || (navigator.languages && navigator.languages[0]) || '');
	} catch (e3) {}

	return String(htmlLang || luciLang || browserLang || 'en').toLowerCase();
}

var CURRENT_LOCALE = detectLocale();
var USE_RUSSIAN = /^ru([_-]|$)/.test(CURRENT_LOCALE);

function tr(en, ru) {
	return USE_RUSSIAN ? ru : en;
}

var STORAGE_KEY_CUSTOM_PATHS = 'z2_custom_hostlist_paths';
var STORAGE_KEY_LAST_PATH = 'z2_last_hostlist_path';

if (!window.__zapret2PanelStylesInjected) {
	window.__zapret2PanelStylesInjected = true;
	document.head.append(E('style', { 'type': 'text/css' }, `
		body .modal-dialog,
		body .cbi-modal {
			width: auto !important;
			min-width: min(320px, 90vw) !important;
			max-width: 90vw !important;
			box-sizing: border-box !important;
		}
		body .modal-dialog .cbi-section,
		body .modal-dialog .cbi-value {
			word-break: break-word;
		}

		.z2-page {
			display: flex;
			flex-direction: column;
			gap: 16px;
		}
		.z2-status-strip {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 12px;
			flex-wrap: wrap;
		}
		.z2-badge {
			display: inline-flex;
			align-items: center;
			gap: 8px;
			padding: 7px 12px;
			border-radius: 999px;
			font-weight: 700;
			font-size: 13px;
			line-height: 1;
			letter-spacing: .01em;
		}
		.z2-badge::before {
			content: '';
			width: 8px;
			height: 8px;
			border-radius: 50%;
			background: currentColor;
			opacity: .9;
		}
		.z2-running {
			background: rgba(46, 162, 86, .14);
			color: #2ea256;
		}
		.z2-stopped {
			background: rgba(138, 138, 138, .15);
			color: #9aa0a6;
		}
		.z2-disabled {
			background: rgba(117, 117, 117, .16);
			color: #8d96a0;
		}
		.z2-page .cbi-section {
			margin: 0 0 16px 0;
			padding: 16px 18px;
		}
		.z2-page .cbi-section:last-child {
			margin-bottom: 0;
		}
		.z2-page .cbi-section-node {
			padding: 0;
		}
		.z2-actions {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
			gap: 10px;
			align-items: stretch;
			margin: 10px 0 12px 0;
		}
		.z2-page .cbi-section-node.z2-actions {
			padding: 4px 0;
		}
		.z2-actions .btn {
			display: inline-flex !important;
			align-items: center;
			justify-content: center;
			width: 100%;
			min-height: 42px;
			margin: 0 !important;
			padding: 10px 14px;
			border-radius: 10px;
			text-align: center;
			white-space: normal;
			line-height: 1.25;
		}
		.z2-section-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 10px;
			flex-wrap: wrap;
			margin-bottom: 14px;
		}
		.z2-section-title {
			font-size: 15px;
			font-weight: 700;
			margin-bottom: 4px;
		}
		.z2-section-tools {
			display: flex;
			gap: 8px;
			flex-wrap: wrap;
		}
		.z2-section-tools .btn {
			margin: 0 !important;
		}
		.z2-path-bar {
			display: flex;
			gap: 8px;
			margin-bottom: 12px;
			flex-wrap: wrap;
		}
		.z2-path-input {
			flex: 1;
			min-width: 200px;
		}
		.z2-textarea {
			width: 100%;
			box-sizing: border-box;
			min-height: 180px;
			max-height: 60vh;
			field-sizing: content;
			font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
			font-size: 12px;
			line-height: 1.45;
			border-radius: 12px;
			padding: 12px 13px;
			resize: vertical;
		}
		.z2-textarea.z2-compact {
			min-height: 100px;
		}
		.z2-textarea[readonly] {
			cursor: default;
			opacity: .85;
		}
		.z2-note {
			font-size: 12px;
			opacity: .72;
			margin-top: 8px;
			line-height: 1.45;
		}

		/* Toast-уведомления */
		.z2-toast-container {
			position: fixed;
			bottom: 24px;
			right: 24px;
			z-index: 99999;
			display: flex;
			flex-direction: column;
			gap: 10px;
			pointer-events: none;
			max-width: 380px;
			width: calc(100vw - 48px);
		}
		.z2-toast {
			pointer-events: auto;
			padding: 12px 16px;
			border-radius: 10px;
			background: #23272e;
			color: #e6edf3;
			box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
			border: 1px solid rgba(255, 255, 255, 0.12);
			font-size: 13px;
			line-height: 1.4;
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 12px;
			opacity: 0;
			transform: translateY(12px);
			transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
		}
		.z2-toast.z2-toast-show {
			opacity: 1;
			transform: translateY(0);
		}
		.z2-toast-error {
			border-color: rgba(255, 78, 84, 0.4);
			background: #321c1e;
			color: #ff9e9e;
		}
		.z2-toast-close {
			cursor: pointer;
			opacity: 0.6;
			font-size: 16px;
			line-height: 1;
			padding: 2px 4px;
			border: none;
			background: transparent;
			color: inherit;
		}
		.z2-toast-close:hover {
			opacity: 1;
		}
	`));
}

var callServiceList = rpc.declare({
	object: 'service',
	method: 'list',
	params: [ 'name', 'verbose' ],
	expect: { '': {} }
});

var callInitList = rpc.declare({
	object: 'luci',
	method: 'getInitList',
	params: [ 'name' ],
	expect: { '': {} }
});

var callInitAction = rpc.declare({
	object: 'luci',
	method: 'setInitAction',
	params: [ 'name', 'action' ],
	expect: { result: false }
});

function safeExec(cmd, args) {
	return fs.exec(cmd, args || []).catch(function() {
		return { code: -1, stdout: '', stderr: '' };
	});
}

function trimText(value) {
	return (value || '').trim();
}

function formatVersion(res) {
	if (!res || typeof res !== 'object' || res.code !== 0) {
		return '';
	}
	var text = trimText(res.stdout || res.stderr);
	if (!text) return '';
	
	var match = text.match(/(v?\d+\.\d+\.\d+(?:-\w+)?)/i);
	return match ? match[1] : '';
}

function prettifyCommand(command) {
	if (!command) return '';
	return command
		.replace(/\s+--new\b/g, '\n\n--new')
		.replace(/\s+(--[^\s]+)/g, '\n$1')
		.trim();
}

function getFilename(path) {
	if (!path) return '';
	var parts = path.split('/');
	return parts[parts.length - 1] || path;
}

function getServiceInfo(serviceData, serviceName) {
	var svc = serviceData && serviceData[serviceName] ? serviceData[serviceName] : null;
	var instances = svc && svc.instances ? Object.keys(svc.instances).map(function(key) { return svc.instances[key]; }) : [];
	var running = instances.filter(function(instance) { return !!instance.running; });
	var first = running[0] || instances[0] || null;
	var command = first && Array.isArray(first.command) ? first.command.join(' ') : '';

	return {
		running: running.length > 0,
		command: command,
		formattedCommand: prettifyCommand(command)
	};
}

function getStateInfo(enabled, serviceInfo) {
	if (serviceInfo.running) {
		return { label: tr('Running', 'Работает'), className: 'z2-running' };
	}
	if (!enabled) {
		return { label: tr('Disabled', 'Выключен'), className: 'z2-disabled' };
	}
	return { label: tr('Stopped', 'Остановлен'), className: 'z2-stopped' };
}

return view.extend({
	isEditingConfig: false,
	originalConfigContent: '',

	isEditingHostlist: false,
	originalHostlistContent: '',

	toastContainer: null,
	activeProfile: null,

	profiles: {
		zapret2: {
			title: 'Zapret2',
			serviceName: 'zapret2',
			configPath: '/opt/zapret2/config',
			binPath: '/opt/zapret2/nfq2/nfqws2',
			binName: 'nfqws2',
			defaultPaths: [
				'/opt/zapret2/ipset/zapret-hosts-user.txt',
				'/opt/zapret2/ipset/zapret-hosts-user-exclude.txt'
			]
		},
		zapret: {
			title: 'Zapret',
			serviceName: 'zapret',
			configPath: '/opt/zapret/config',
			binPath: '/opt/zapret/nfq/nfqws',
			binName: 'nfqws',
			defaultPaths: [
				'/opt/zapret/ipset/zapret-hosts-user.txt',
				'/opt/zapret/ipset/zapret-hosts-user-exclude.txt'
			]
		}
	},

	load: function() {
		var self = this;
		return fs.stat(this.profiles.zapret2.configPath).then(function() {
			self.activeProfile = self.profiles.zapret2;
		}).catch(function() {
			self.activeProfile = self.profiles.zapret;
		}).then(function() {
			return self.fetchData();
		});
	},

	fetchData: function() {
		var p = this.activeProfile;
		return Promise.all([
			callInitList(p.serviceName),
			callServiceList(p.serviceName, 1),
			fs.read(p.configPath).catch(function() { return ''; }),
			safeExec(p.binPath, [ '--version' ])
		]);
	},

	showToast: function(message, isError, duration) {
		if (!this.toastContainer) {
			this.toastContainer = E('div', { 'class': 'z2-toast-container' });
			document.body.appendChild(this.toastContainer);
		}

		var timeout = duration || 3000;
		var closeBtn = E('button', { 'class': 'z2-toast-close' }, '✕');
		var toast = E('div', { 'class': 'z2-toast' + (isError ? ' z2-toast-error' : '') }, [
			E('span', {}, message),
			closeBtn
		]);

		function removeToast() {
			toast.classList.remove('z2-toast-show');
			setTimeout(function() {
				if (toast.parentNode) {
					toast.parentNode.removeChild(toast);
				}
			}, 250);
		}

		closeBtn.addEventListener('click', removeToast);
		this.toastContainer.appendChild(toast);
		
		setTimeout(function() {
			toast.classList.add('z2-toast-show');
		}, 10);

		setTimeout(removeToast, timeout);
	},

	copyText: function(text, label) {
		var self = this;
		var value = trimText(text);
		if (!value) {
			this.showToast(tr('Nothing to copy.', 'Нечего копировать.'), true);
			return Promise.resolve();
		}

		if (navigator.clipboard && navigator.clipboard.writeText) {
			return navigator.clipboard.writeText(value).then(function() {
				self.showToast(tr('Copied: %s', 'Скопировано: %s').format(label));
			}).catch(function(err) {
				self.showToast(tr('Failed to copy %s: %s', 'Не удалось скопировать %s: %s').format(label, err.message || err), true);
			});
		}

		try {
			var temp = E('textarea', { 'style': 'position:absolute;left:-9999px;top:-9999px;' }, value);
			document.body.appendChild(temp);
			temp.focus();
			temp.select();
			document.execCommand('copy');
			document.body.removeChild(temp);
			this.showToast(tr('Copied: %s', 'Скопировано: %s').format(label));
		} catch (err2) {
			this.showToast(tr('Failed to copy %s: %s', 'Не удалось скопировать %s: %s').format(label, err2.message || err2), true);
		}

		return Promise.resolve();
	},

	handleServiceAction: function(action, ev) {
		var self = this;
		if (ev && ev.currentTarget)
			ev.currentTarget.blur();

		return callInitAction(this.activeProfile.serviceName, action).then(function(success) {
			if (!success)
				throw new Error('Command failed');

			self.showToast(tr('Action executed: %s', 'Команда выполнена: %s').format(action));
			return self.updateStatus();
		}).catch(function(err) {
			self.showToast(tr('Unable to execute action "%s": %s', 'Не удалось выполнить действие "%s": %s').format(action, err.message || err), true);
		});
	},

	/* --- Менеджер основного конфига --- */
	toggleConfigEdit: function(enable) {
		this.isEditingConfig = (typeof enable === 'boolean') ? enable : !this.isEditingConfig;

		if (this.isEditingConfig) {
			this.originalConfigContent = this.configArea.value;
			this.configArea.removeAttribute('readonly');
			this.configArea.focus();
			this.btnEditConfig.textContent = tr('Cancel', 'Отмена');
			this.btnEditConfig.className = 'btn cbi-button-neutral';
			this.btnSaveConfig.style.display = 'inline-block';
		} else {
			this.configArea.value = this.originalConfigContent;
			this.configArea.setAttribute('readonly', 'readonly');
			this.btnEditConfig.textContent = tr('Edit', 'Редактировать');
			this.btnEditConfig.className = 'btn cbi-button-action';
			this.btnSaveConfig.style.display = 'none';
		}
	},

	handleSaveConfig: function() {
		var self = this;
		var content = this.configArea.value;
		var p = this.activeProfile;

		ui.showModal(tr('Saving configuration...', 'Сохранение конфигурации...'), [
			E('p', { 'class': 'spinning' }, tr('Writing config to %s...', 'Запись конфигурации в %s...').format(p.configPath))
		]);

		return fs.write(p.configPath, content).then(function() {
			ui.hideModal();
			self.originalConfigContent = content;
			self.toggleConfigEdit(false);
			self.showToast(tr('Configuration saved successfully.', 'Конфигурация успешно сохранена.'));

			return ui.showModal(tr('Restart Service?', 'Перезапустить сервис?'), [
				E('p', tr('Configuration updated. Do you want to restart %s to apply changes?', 'Конфигурация обновлена. Перезапустить %s для применения изменений?').format(p.title)),
				E('div', { 'class': 'right' }, [
					E('button', {
						'class': 'btn',
						'click': function() {
							ui.hideModal();
							self.updateStatus();
						}
					}, tr('No', 'Нет')),
					' ',
					E('button', {
						'class': 'btn cbi-button-action',
						'click': function() {
							ui.hideModal();
							self.handleServiceAction('restart');
						}
					}, tr('Restart %s', 'Перезапустить %s').format(p.title))
				])
			]);
		}).catch(function(err) {
			ui.hideModal();
			self.showToast(tr('Failed to save config: %s', 'Не удалось сохранить конфиг: %s').format(err.message || err), true);
		});
	},

	/* --- Хранилище пользовательских путей --- */
	getSavedPaths: function() {
		var paths = [];
		try {
			var raw = localStorage.getItem(STORAGE_KEY_CUSTOM_PATHS);
			paths = raw ? JSON.parse(raw) : [];
		} catch (e) {
			paths = [];
		}

		this.activeProfile.defaultPaths.forEach(function(defPath) {
			if (paths.indexOf(defPath) === -1) {
				paths.unshift(defPath);
			}
		});

		return paths;
	},

	getLastPath: function() {
		try {
			return localStorage.getItem(STORAGE_KEY_LAST_PATH) || '';
		} catch (e) {
			return '';
		}
	},

	saveCustomPath: function(path) {
		if (!path) return;

		var paths = this.getSavedPaths();

		if (paths.indexOf(path) === -1) {
			paths.push(path);
		}

		try {
			localStorage.setItem(STORAGE_KEY_CUSTOM_PATHS, JSON.stringify(paths));
			localStorage.setItem(STORAGE_KEY_LAST_PATH, path);
			this.renderPathOptions();
		} catch (e) {}
	},

	renderPathOptions: function() {
		if (!this.hostlistSelect) return;

		var currentVal = this.hostlistPathInput ? this.hostlistPathInput.value : '';
		
		this.hostlistSelect.textContent = '';

		var savedPaths = this.getSavedPaths();

		savedPaths.forEach(function(path) {
			var fileName = getFilename(path);
			this.hostlistSelect.appendChild(E('option', { 'value': path }, fileName));
		}, this);

		this.hostlistSelect.appendChild(E('option', { 'value': '' }, tr('-- Custom path --', '-- Другой путь --')));

		if (currentVal) {
			this.hostlistSelect.value = currentVal;
		}
	},

	/* --- Менеджер работы с хостлистами --- */
	loadHostlist: function() {
		var self = this;
		var path = trimText(this.hostlistPathInput.value);

		if (!path) {
			this.showToast(tr('Please enter file path', 'Укажите путь к файлу'), true);
			return Promise.resolve();
		}

		return fs.read(path).then(function(content) {
			self.saveCustomPath(path);
			self.hostlistArea.value = content || '';
			self.originalHostlistContent = content || '';
			self.toggleHostlistEdit(false);
			self.showToast(tr('File loaded: %s', 'Файл загружен: %s').format(getFilename(path)));
		}).catch(function(err) {
			self.hostlistArea.value = '';
			self.originalHostlistContent = '';
			self.toggleHostlistEdit(false);
			self.showToast(tr('Failed to read file %s: %s', 'Не удалось прочитать файл %s: %s').format(getFilename(path), err.message || err), true);
		});
	},

	toggleHostlistEdit: function(enable) {
		this.isEditingHostlist = (typeof enable === 'boolean') ? enable : !this.isEditingHostlist;

		if (this.isEditingHostlist) {
			this.originalHostlistContent = this.hostlistArea.value;
			this.hostlistArea.removeAttribute('readonly');
			this.hostlistArea.focus();
			this.btnEditHostlist.textContent = tr('Cancel', 'Отмена');
			this.btnEditHostlist.className = 'btn cbi-button-neutral';
			this.btnSaveHostlist.style.display = 'inline-block';
		} else {
			this.hostlistArea.value = this.originalHostlistContent;
			this.hostlistArea.setAttribute('readonly', 'readonly');
			this.btnEditHostlist.textContent = tr('Edit', 'Редактировать');
			this.btnEditHostlist.className = 'btn cbi-button-action';
			this.btnSaveHostlist.style.display = 'none';
		}
	},

	handleSaveHostlist: function() {
		var self = this;
		var path = trimText(this.hostlistPathInput.value);
		var content = this.hostlistArea.value;

		if (!path) {
			this.showToast(tr('Please enter file path', 'Укажите путь к файлу'), true);
			return Promise.resolve();
		}

		ui.showModal(tr('Saving file...', 'Сохранение файла...'), [
			E('p', { 'class': 'spinning' }, tr('Writing content to %s...', 'Запись файла %s...').format(path))
		]);

		return fs.write(path, content).then(function() {
			ui.hideModal();
			self.saveCustomPath(path);
			self.originalHostlistContent = content;
			self.toggleHostlistEdit(false);
			self.showToast(tr('Hostlist saved successfully.', 'Хостлист успешно сохранён.'));
		}).catch(function(err) {
			ui.hideModal();
			self.showToast(tr('Failed to save hostlist: %s', 'Не удалось сохранить хостлист: %s').format(err.message || err), true);
		});
	},

	updateStatus: function() {
		var self = this;
		return this.fetchData().then(function(data) {
			self.applyData(data);
		});
	},

	applyData: function(data) {
		var initList = data[0] || {};
		var serviceList = data[1] || {};
		var configText = data[2] || '';
		var versionRes = data[3] || null;

		var p = this.activeProfile;
		var enabled = !!(initList[p.serviceName] && initList[p.serviceName].enabled);
		var info = getServiceInfo(serviceList, p.serviceName);
		var state = getStateInfo(enabled, info);
		var versionText = formatVersion(versionRes);

		this.versionTitle.textContent = versionText ? p.title + ' ' + versionText : p.title;
		this.statusBadge.textContent = state.label;
		this.statusBadge.className = 'z2-badge ' + state.className;

		this.configSectionTitle.textContent = tr('Current %s', 'Текущий %s').format(p.configPath);
		this.commandSectionTitle.textContent = tr('Current %s command line arguments', 'Параметры запуска %s').format(p.binName);

		if (!this.isEditingConfig) {
			this.configArea.value = configText;
			this.originalConfigContent = configText;
		}

		this.commandArea.value = info.formattedCommand || '';

		this.btnEnable.disabled = enabled;
		this.btnDisable.disabled = !enabled;
		this.btnStart.disabled = info.running;
		this.btnRestart.disabled = !info.running;
		this.btnStop.disabled = !info.running;
	},

	render: function(data) {
		var self = this;

		this.versionTitle = E('h2', { 'style': 'margin:0 0 6px 0;' }, this.activeProfile.title);
		this.statusBadge = E('span', { 'class': 'z2-badge z2-stopped' }, tr('Loading...', 'Загрузка...'));

		this.configSectionTitle = E('div', { 'class': 'z2-section-title' }, tr('Current config', 'Текущий конфиг'));
		this.commandSectionTitle = E('div', { 'class': 'z2-section-title' }, tr('Active command', 'Активная команда'));

		/* Элементы основного конфига */
		this.configArea = E('textarea', {
			'class': 'cbi-input-textarea z2-textarea',
			'readonly': 'readonly',
			'wrap': 'off'
		});

		this.btnEditConfig = E('button', {
			'class': 'btn cbi-button-action',
			'click': ui.createHandlerFn(this, function() { self.toggleConfigEdit(); })
		}, tr('Edit', 'Редактировать'));

		this.btnSaveConfig = E('button', {
			'class': 'btn cbi-button-save',
			'style': 'display:none;',
			'click': ui.createHandlerFn(this, function() { return self.handleSaveConfig(); })
		}, tr('Save config', 'Сохранить конфиг'));

		/* Элементы секции Хостлистов */
		var lastSavedPath = this.getLastPath();

		this.hostlistPathInput = E('input', {
			'type': 'text',
			'class': 'cbi-input-text z2-path-input',
			'value': lastSavedPath || '',
			'placeholder': tr('/path/to/hostlist.txt', '/путь/к/файлу.txt')
		});

		this.hostlistSelect = E('select', {
			'class': 'cbi-input-select',
			'change': function(ev) {
				if (ev.target.value) {
					self.hostlistPathInput.value = ev.target.value;
					self.loadHostlist();
				}
			}
		});

		this.renderPathOptions();

		this.btnLoadHostlist = E('button', {
			'class': 'btn cbi-button-action',
			'click': ui.createHandlerFn(this, function() { return self.loadHostlist(); })
		}, tr('Open', 'Открыть'));

		this.hostlistArea = E('textarea', {
			'class': 'cbi-input-textarea z2-textarea',
			'readonly': 'readonly',
			'wrap': 'off',
			'placeholder': tr('Select or enter file path and click "Open"...', 'Выберите или введите путь к файлу и нажмите "Открыть"...')
		});

		this.btnEditHostlist = E('button', {
			'class': 'btn cbi-button-action',
			'click': ui.createHandlerFn(this, function() { self.toggleHostlistEdit(); })
		}, tr('Edit', 'Редактировать'));

		this.btnSaveHostlist = E('button', {
			'class': 'btn cbi-button-save',
			'style': 'display:none;',
			'click': ui.createHandlerFn(this, function() { return self.handleSaveHostlist(); })
		}, tr('Save hostlist', 'Сохранить список'));

		/* Активная команда */
		this.commandArea = E('textarea', {
			'class': 'cbi-input-textarea z2-textarea z2-compact',
			'readonly': 'readonly',
			'wrap': 'off'
		});

		/* Кнопки управления сервисом */
		this.btnEnable = E('button', {
			'class': 'btn cbi-button-save important',
			'click': ui.createHandlerFn(this, function(ev) { return self.handleServiceAction('enable', ev); })
		}, tr('Enable autorun', 'Включить автозапуск'));
		this.btnDisable = E('button', {
			'class': 'btn cbi-button-negative important',
			'click': ui.createHandlerFn(this, function(ev) { return self.handleServiceAction('disable', ev); })
		}, tr('Disable autorun', 'Выключить автозапуск'));
		this.btnStart = E('button', {
			'class': 'btn cbi-button-action',
			'click': ui.createHandlerFn(this, function(ev) { return self.handleServiceAction('start', ev); })
		}, tr('Start', 'Запустить'));
		this.btnRestart = E('button', {
			'class': 'btn cbi-button-action',
			'click': ui.createHandlerFn(this, function(ev) { return self.handleServiceAction('restart', ev); })
		}, tr('Restart', 'Перезапустить'));
		this.btnStop = E('button', {
			'class': 'btn cbi-button-negative',
			'click': ui.createHandlerFn(this, function(ev) { return self.handleServiceAction('stop', ev); })
		}, tr('Stop', 'Остановить'));

		poll.add(function() {
			if (!self.isEditingConfig && !self.isEditingHostlist) {
				return self.updateStatus();
			}
			return Promise.resolve();
		}, 5);

		if (lastSavedPath) {
			this.loadHostlist();
		}

		var page = E('div', { 'class': 'z2-page' }, [
			/* Секция статуса */
			E('div', { 'class': 'cbi-section' }, [
				E('div', { 'class': 'cbi-section-node' }, [
					E('div', { 'class': 'z2-status-strip' }, [
						this.versionTitle,
						this.statusBadge
					])
				])
			]),

			/* Секция управления */
			E('div', { 'class': 'cbi-section' }, [
				E('div', { 'class': 'z2-section-header' }, [
					E('div', { 'class': 'z2-section-title' }, tr('Service control', 'Управление сервисом'))
				]),
				E('div', { 'class': 'cbi-section-node z2-actions' }, [
					this.btnEnable,
					this.btnDisable,
					this.btnStart,
					this.btnRestart,
					this.btnStop
				]),
				E('div', { 'class': 'z2-note' }, tr(
					'The page refreshes automatically every 5 seconds.',
					'Страница обновляется автоматически раз в 5 секунд.'
				))
			]),

			/* Секция Основного Конфига */
			E('div', { 'class': 'cbi-section' }, [
				E('div', { 'class': 'z2-section-header' }, [
					this.configSectionTitle,
					E('div', { 'class': 'z2-section-tools' }, [
						this.btnEditConfig,
						this.btnSaveConfig,
						E('button', {
							'class': 'btn',
							'click': ui.createHandlerFn(this, function() {
								return self.copyText(self.configArea.value, tr('config', 'конфиг'));
							})
						}, tr('Copy', 'Копировать'))
					])
				]),
				E('div', { 'class': 'cbi-section-node' }, [ this.configArea ])
			]),

			/* Секция: Редактирование Хостлистов */
			E('div', { 'class': 'cbi-section' }, [
				E('div', { 'class': 'z2-section-header' }, [
					E('div', { 'class': 'z2-section-title' }, tr('Hostlists manager', 'Управление хостлистами')),
					E('div', { 'class': 'z2-section-tools' }, [
						this.btnEditHostlist,
						this.btnSaveHostlist,
						E('button', {
							'class': 'btn',
							'click': ui.createHandlerFn(this, function() {
								return self.copyText(self.hostlistArea.value, tr('Hostlist', 'хостлист'));
							})
						}, tr('Copy', 'Копировать'))
					])
				]),
				E('div', { 'class': 'cbi-section-node' }, [
					E('div', { 'class': 'z2-path-bar' }, [
						this.hostlistSelect,
						this.hostlistPathInput,
						this.btnLoadHostlist
					]),
					this.hostlistArea
				])
			]),

			/* Секция Активной команды */
			E('div', { 'class': 'cbi-section' }, [
				E('div', { 'class': 'z2-section-header' }, [
					this.commandSectionTitle,
					E('div', { 'class': 'z2-section-tools' }, [
						E('button', {
							'class': 'btn',
							'click': ui.createHandlerFn(this, function() {
								return self.copyText(self.commandArea.value, tr('command line', 'командная строка'));
							})
						}, tr('Copy', 'Копировать'))
					])
				]),
				E('div', { 'class': 'cbi-section-node' }, [ this.commandArea ])
			])
		]);

		this.applyData(data);
		return page;
	},

	handleSave: null,
	handleSaveApply: null,
	handleReset: null
});
