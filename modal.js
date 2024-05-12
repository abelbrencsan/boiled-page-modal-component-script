/**
 * Modal
 * Copyright 2024 Abel Brencsan
 * Released under the MIT License
 */
const Modal = function(options) {

	'use strict';

	// Supported modal types
	let modalTypes = ['image', 'video', 'youtube', 'vimeo', 'dialog', 'ajax'];

	// Test required options
	if (typeof options.type !== 'string') {
		throw 'Modal "type" option must be a string';
	}
	if (typeof options.source !== 'string') {
		throw 'Modal "source" option must be a string';
	}
	if (modalTypes.indexOf(options.type) === -1) {
		throw 'Given modal type is not supported';
	}

	// Default modal instance options
	let defaults = {
		type: null,
		source: null,
		trigger: null,
		closeOnBackdropClick: true,
		closeOnEsc: true,
		closeButton: true,
		customClasses: [],
		customItemClasses: [],
		customCloseTriggerSelector: null,
		customAcceptTriggerSelector: null,
		initTriggerCallback: null,
		removeTriggerCallback: null,
		beforeOpenCallback: null,
		openCallback: null,
		closeCallback: null,
		acceptCallback: null,
		removeCallback: null,
		loadCallback: null,
		itemLabel: null,
		openAnimationName: null,
		closeAnimationName: null,
		closeButtonLabel: 'Close modal',
		isClosedClass: 'is-closed',
		isClosingClass: 'is-closing',
		isLoadedClass: 'is-loaded',
		isModalOpenedClass: 'is-modal-opened',
		isOpenedClass: 'is-opened',
		isOpeningClass: 'is-opening',
		modalClass: 'modal',
		modalBackdropClass: 'modal-backdrop',
		modalCloseClass: 'modal-close',
		modalItemClass: 'modal-item',
		modalItemAjaxClass: 'modal-item--ajax',
		modalItemDialogClass: 'modal-item--dialog',
		modalItemImageClass: 'modal-item--image',
		modalItemVideoClass: 'modal-item--video',
		modalItemVimeoClass: 'modal-item--vimeo',
		modalItemYouTubeClass: 'modal-item--youtube',
		modalSpinnerClass: 'modal-spinner'
	};

	// Extend modal instance options with defaults
	for (let key in defaults) {
		this[key] = (options.hasOwnProperty(key)) ? options[key] : defaults[key];
	}

	// Modal instance variables
	this.triggerEventListener = null;
	this.isTriggerInitialized = false;
	this.hasAnimation = false;
	this.isAccepted = false;
	this.isOpenable = true;

	// Animation is enabled
	if (this.openAnimationName && this.closeAnimationName) {
		this.hasAnimation = true;
	}
};

Modal.prototype = function () {

	'use strict';

	// Selector for focusable elements
	let focusSelector = 'input, select, textarea, a[href], button, [tabindex], audio[controls], video[controls], [contenteditable]:not([contenteditable="false"])';
	
	let modal = {

		wrapper: null,
		backdrop: null,
		spinner: null,
		item: null,
		closeButton: null,
		activeElement: null,
		focusableElements: null,
		isOpened: false,
		isWrapperCreated: false,

		/**
		* Initialize modal trigger.
		* 
		* @public
		*/
		initTrigger: function() {
			if (this.isTriggerInitialized) return;
			this.triggerEventListener = modal.onTriggerClick.bind(this);
			this.trigger.addEventListener('click', this.triggerEventListener);
			this.isTriggerInitialized = true;
			if (this.initTriggerCallback) this.initTriggerCallback.call(this);
		},

		/**
		* Remove related events from modal trigger.
		* 
		* @public
		*/
		removeTrigger: function() {
			if (!this.isTriggerInitialized) return;
			this.trigger.removeEventListener('click', this.triggerEventListener);
			this.isTriggerInitialized = false;
			if (this.removeTriggerCallback) this.removeTriggerCallback.call(this);
		},

		/**
		* Open modal when trigger is clicked.
		* 
		* @private
		* @param {Event} event
		*/
		onTriggerClick: function(event) {
			event.preventDefault();
			modal.open.call(this);
		},

		/**
		* Open modal.
		* Modal is created and added to the DOM by initialized type.
		* 
		* @public
		*/
		open: function() {
			if (modal.isOpened) return;
			if (this.beforeOpenCallback) this.beforeOpenCallback.call(this);
			if (this.isOpenable) {
				modal.createWrapper.call(this);
				modal.isOpened = true;
				document.body.classList.add(this.isModalOpenedClass);
				if (this.hasAnimation) modal.wrapper.classList.add(this.isOpeningClass);
				switch(this.type) {
					case 'image':
						modal.loadImage.call(this);
						break;
					case 'video':
						modal.loadVideo.call(this);
						break;
					case 'youtube':
						modal.loadYouTube.call(this);
						break;
					case 'vimeo':
						modal.loadVimeo.call(this);
						break;
					case 'dialog':
						modal.loadDialog.call(this);
						break;
					case 'ajax':
						modal.loadAjax.call(this);
						break;
				}
				if (this.openCallback) this.openCallback.call(this, {
					wrapper: modal.wrapper,
					backdrop: modal.backdrop,
					spinner: modal.spinner,
					item: modal.item,
					closeButton: modal.closeButton
				});
			}
		},

		/**
		* Close opened modal.
		* Modal is removed from DOM after closing animation is finished.
		* 
		* @public
		*/
		close: function() {
			if (!modal.isOpened) return;
			modal.isOpened = false;
			if (this.hasAnimation) modal.wrapper.classList.add(this.isClosingClass);
			if (this.hasAnimation) modal.wrapper.classList.remove(this.isOpeningClass);
			modal.wrapper.classList.remove(this.isOpenedClass);
			document.body.classList.remove(this.isModalOpenedClass);
			if (this.closeCallback) this.closeCallback.call(this, {
				wrapper: modal.wrapper,
				backdrop: modal.backdrop,
				spinner: modal.spinner,
				item: modal.item,
				closeButton: modal.closeButton
			});
			if (!this.hasAnimation) {
				modal.remove.call(self);
			}
		},

		/**
		* Accept modal.
		* Setting modal as accepted is useful for making confirmation dialogs.
		* 
		* @public
		*/
		accept: function() {
			if (this.isAccepted) return;
			this.isAccepted = true;
			if (this.acceptCallback) this.acceptCallback.call(this);
		},

		/**
		* Remove modal from the DOM.
		* Set focus back to the element which was active before modal was opened.
		* 
		* @public
		*/
		remove: function() {
			if (!modal.isWrapperCreated) return;
			if (modal.isOpened) modal.close.call(this);
			modal.isWrapperCreated = false;
			modal.wrapper.parentElement.removeChild(modal.wrapper);
			if (modal.activeElement) modal.activeElement.focus();
			modal.wrapper = null;
			modal.backdrop = null;
			modal.spinner = null;
			modal.item = null;
			modal.closeButton = null;
			modal.activeElement = null;
			modal.focusableElements = null;
			if (this.removeCallback) this.removeCallback.call(this);
		},

		/**
		* Load modal item whe type is image.
		* 
		* @private
		*/
		loadImage: function() {
			modal.item = new Image();
			modal.item.src = this.source;
			modal.item.onload = () => {
				modal.item.classList.add(this.modalItemClass);
				modal.item.classList.add(this.modalItemImageClass);
				modal.addCustomItemClasses.call(this);
				modal.wrapper.appendChild(modal.item);
				modal.wrapper.classList.add(this.isLoadedClass);
				modal.setFocus.call(this);
				if (this.loadCallback) this.loadCallback.call(this, {
					wrapper: modal.wrapper,
					backdrop: modal.backdrop,
					spinner: modal.spinner,
					item: modal.item,
					closeButton: modal.closeButton
				});
			};
			modal.item.onerror = function(){
				modal.setFocus.call(this);
			};
		},

		/**
		* Load modal item when type is HTML video.
		* 
		* @private
		*/
		loadVideo: function() {
			modal.item = document.createElement('video');
			modal.item.src = this.source;
			modal.item.autoplay = true;
			modal.item.controls = 1;
			modal.item.onloadedmetadata = () => {
				modal.item.classList.add(this.modalItemClass);
				modal.item.classList.add(this.modalItemVideoClass);
				modal.addCustomItemClasses.call(this);
				modal.wrapper.appendChild(modal.item);
				modal.wrapper.classList.add(this.isLoadedClass);
				modal.setFocus.call(this);
				if (this.loadCallback) this.loadCallback.call(this, {
					wrapper: modal.wrapper,
					backdrop: modal.backdrop,
					spinner: modal.spinner,
					item: modal.item,
					closeButton: modal.closeButton
				});
			};
			modal.item.onerror = function(){
				modal.setFocus.call(this);
			};
		},

		/**
		* Load modal item as an iframe if type is YouTube video.
		* 
		* @private
		*/
		loadYouTube: function() {
			let match = this.source.match(/(youtube|youtu)\.(com|be)\/(watch\?v=([\w-]+)|([\w-]+))/);
			let videoID = (match[1] === 'youtube') ? match[4] : match[5];
			modal.item = document.createElement('iframe');
			modal.item.src = 'https://www.youtube.com/embed/' + videoID + '?rel=0&amp;autoplay=1&amp;showinfo=0';
			modal.item.setAttribute('allowfullscreen', '');
			modal.item.setAttribute('frameborder', '0');
			modal.item.setAttribute('width', '560px');
			modal.item.setAttribute('height', '315px');
			modal.item.classList.add(this.modalItemClass);
			modal.item.classList.add(this.modalItemYouTubeClass);
			modal.addCustomItemClasses.call(this);
			modal.wrapper.appendChild(modal.item);
			modal.wrapper.classList.add(this.isLoadedClass);
			modal.setFocus.call(this);
			if (this.loadCallback) this.loadCallback.call(this, {
				wrapper: modal.wrapper,
				backdrop: modal.backdrop,
				spinner: modal.spinner,
				item: modal.item,
				closeButton: modal.closeButton
			});
		},

		/**
		* Load modal item as an iframe if type is Vimeo video.
		* 
		* @private
		*/
		loadVimeo: function() {
			let match = this.source.match(/vimeo\.com\/([\w-]+)/);
			let videoID = match[1];
			modal.item = document.createElement('iframe');
			modal.item.src = 'https://player.vimeo.com/video/' + videoID + '?autoplay=1&title=0&byline=0&portrait=0';
			modal.item.setAttribute('allowfullscreen', '');
			modal.item.setAttribute('frameborder', '0');
			modal.item.setAttribute('width', '640px');
			modal.item.setAttribute('height', '272px');
			modal.item.classList.add(this.modalItemClass);
			modal.item.classList.add(this.modalItemVimeoClass);
			modal.addCustomItemClasses.call(this);
			modal.wrapper.appendChild(modal.item);
			modal.wrapper.classList.add(this.isLoadedClass);
			modal.setFocus.call(this);
			if (this.loadCallback) this.loadCallback.call(this, {
				wrapper: modal.wrapper,
				backdrop: modal.backdrop,
				spinner: modal.spinner,
				item: modal.item,
				closeButton: modal.closeButton
			});
		},

		/**
		* Load modal item when type is dialog.
		* 
		* @private
		*/
		loadDialog: function() {
			let sourceDialog = document.querySelector(this.source);
			if (!sourceDialog) {
				modal.setFocus.call(this);
				return;
			}
			modal.item = sourceDialog.cloneNode(true);
			modal.item.removeAttribute('id');
			modal.item.classList.add(this.modalItemClass);
			modal.item.classList.add(this.modalItemDialogClass);
			modal.addCustomItemClasses.call(this);
			modal.item.setAttribute('tabindex', '-1');
			modal.item.removeAttribute('hidden');
			modal.wrapper.appendChild(modal.item);
			modal.wrapper.classList.add(this.isLoadedClass);
			modal.setFocus.call(this);
			modal.setCustomTriggers.call(this);
			if (!modal.item.getAttribute('aria-labelledby') || !modal.item.getAttribute('aria-describedby')) {
				modal.item.setAttribute('role', 'document');
			}
			if (modal.item.getAttribute('aria-labelledby')) {
				modal.wrapper.setAttribute('aria-labelledby', modal.item.getAttribute('aria-labelledby'));
				modal.item.removeAttribute('aria-labelledby');
			}
			if (modal.item.getAttribute('aria-describedby')) {
				modal.wrapper.setAttribute('aria-describedby', modal.item.getAttribute('aria-describedby'));
				modal.item.removeAttribute('aria-describedby');
			}
			if (this.loadCallback) this.loadCallback.call(this, {
				wrapper: modal.wrapper,
				backdrop: modal.backdrop,
				spinner: modal.spinner,
				item: modal.item,
				closeButton: modal.closeButton
			});
		},

		/**
		* Load modal item when type is AJAX.
		* 
		* @private
		*/
		loadAjax: function() {
			let xmlHttp = new XMLHttpRequest();
			xmlHttp.onreadystatechange = () => {
				if (xmlHttp.readyState == 4) {
					if (xmlHttp.status == 200) {
						modal.item = document.createElement('div');
						modal.item.classList.add(this.modalItemClass);
						modal.item.classList.add(this.modalItemDialogClass);
						modal.item.classList.add(this.modalItemAjaxClass);
						modal.addCustomItemClasses.call(this);
						modal.item.setAttribute('tabindex', '-1');
						modal.item.innerHTML = xmlHttp.responseText;
						modal.wrapper.appendChild(modal.item);
						modal.wrapper.classList.add(this.isLoadedClass);
						modal.setFocus.call(this);
						modal.setCustomTriggers.call(this);
						if (this.loadCallback) this.loadCallback.call(this, {
							wrapper: modal.wrapper,
							backdrop: modal.backdrop,
							spinner: modal.spinner,
							item: modal.item,
							closeButton: modal.closeButton
						});
					}
					else {
						modal.setFocus.call(this);
					}
				}
			}
			xmlHttp.open('GET', this.source);
			xmlHttp.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
			xmlHttp.send(null);
		},

		/**
		* Add custom classes to modal item.
		* 
		* @private
		*/
		addCustomItemClasses: function() {
			for (let i = 0; i < this.customItemClasses.length; i++) {
				modal.item.classList.add(this.customItemClasses[i]);
			}
		},

		/**
		* Set custom close and accept triggers.
		* 
		* @private
		*/
		setCustomTriggers: function() {
			let customCloseTriggers = modal.item.querySelectorAll(this.customCloseTriggerSelector);
			let customAcceptTriggers = modal.item.querySelectorAll(this.customAcceptTriggerSelector);
			for (let i = 0; i < customCloseTriggers.length; i++) {
				customCloseTriggers[i].addEventListener('click', (event) => {
					event.stopPropagation();
					modal.close.call(this);
				});
			}
			for (let i = 0; i < customAcceptTriggers.length; i++) {
				customAcceptTriggers[i].addEventListener('click', (event) => {
					event.stopPropagation();
					modal.accept.call(this);
				});
			}
		},

		/**
		* Find focusable elements in modal and set focus to the first one.
		* 
		* @private
		*/
		setFocus: function() {
			modal.activeElement = document.activeElement;
			modal.focusableElements = modal.wrapper.querySelectorAll(focusSelector);
			if (modal.focusableElements.length) {
				modal.focusableElements[0].focus();
			}
			else {
				modal.wrapper.tabIndex = -1;
				modal.wrapper.focus();
			}
		},

		/**
		* Keep focus inside modal when tab key is pressed.
		* 
		* @private
		* @param {Event} event
		*/
		onTabKeyPress: function(event) {
			if (event.shiftKey) {
				if (document.activeElement === modal.focusableElements[0]) {
					event.preventDefault();
					modal.focusableElements[modal.focusableElements.length - 1].focus();
				}
			}
			else {
				if (document.activeElement === modal.focusableElements[modal.focusableElements.length - 1]) {
					event.preventDefault();
					modal.focusableElements[0].focus();
				}
			}
		},

		/**
		* Create modal wrapper, backdrop close button and spinner.
		* 
		* @private
		*/
		createWrapper: function() {
			modal.wrapper = document.createElement('div');
			modal.backdrop = document.createElement('div');
			modal.spinner = document.createElement('div');
			modal.wrapper.id = 'modal';
			modal.wrapper.classList.add(this.modalClass);
			modal.wrapper.setAttribute('role', 'dialog');
			modal.backdrop.classList.add(this.modalBackdropClass);
			modal.spinner.classList.add(this.modalSpinnerClass);
			document.body.appendChild(modal.wrapper);
			modal.wrapper.appendChild(modal.backdrop);
			modal.wrapper.appendChild(modal.spinner);
			if (this.itemLabel) modal.wrapper.setAttribute('aria-label', this.itemLabel);
			for (let i = 0; i < this.customClasses.length; i++) {
				modal.wrapper.classList.add(this.customClasses[i]);
			}
			if (this.closeButton) {
				modal.closeButton = document.createElement('button');
				modal.closeButton.type = 'button';
				modal.closeButton.classList.add(this.modalCloseClass);
				if (this.closeButtonLabel) modal.closeButton.setAttribute('aria-label', this.closeButtonLabel);
				modal.wrapper.appendChild(modal.closeButton);
				modal.closeButton.addEventListener('click', (event) => {
					event.stopPropagation();
					modal.close.call(this);
				});
			}
			if (this.closeOnBackdropClick) {
				modal.backdrop.addEventListener('click', (event) => {
					event.stopPropagation();
					modal.close.call(this);
				});
			}
			modal.wrapper.addEventListener('keydown', (event) => {
				if (event.key === 'Escape' && this.closeOnEsc) {
					event.stopPropagation();
					modal.close.call(this);
				}
				if (event.key === 'Tab') {
					modal.onTabKeyPress.call(this, event);
				}
			});
			if (this.hasAnimation) {
				modal.wrapper.addEventListener('animationend', (event) => {
					if (!modal.isOpened && event.animationName == this.closeAnimationName) {
						modal.wrapper.classList.add(this.isClosedClass);
						modal.remove.call(this);
					}
					if (event.animationName == this.openAnimationName) {
						modal.wrapper.classList.remove(this.isOpeningClass);
						modal.wrapper.classList.add(this.isOpenedClass);
					}
				});
			}
			modal.isWrapperCreated = true;
		}
	};

	return {
		initTrigger: modal.initTrigger,
		removeTrigger: modal.removeTrigger,
		open: modal.open,
		close: modal.close,
		accept: modal.accept,
		remove: modal.remove
	};

}();