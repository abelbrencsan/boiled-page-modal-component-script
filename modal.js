/**
 * Modal - v1.0.0
 * Copyright 2020 Abel Brencsan
 * Released under the MIT License
 */

var Modal = function(options) {

	'use strict';

	// Supported modal types
	var modalTypes = ['image', 'video', 'youtube', 'vimeo', 'dialog', 'ajax'];

	// Test required options
	if (typeof options.type !== 'string') throw 'Modal "type" option must be a string';
	if (typeof options.source !== 'string') throw 'Modal "source" option must be a string';
	if (modalTypes.indexOf(options.type) === -1) throw 'Given modal type is not supported';

	// Default modal instance options
	var defaults = {
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
	for (var key in defaults) {
		this[key] = (options.hasOwnProperty(key)) ? options[key] : defaults[key];
	}

	// Modal instance variables
	this.isTriggerInitialized = false;
	this.hasAnimation = false;
	this.isAccepted = false;

	if (this.openAnimationName && this.closeAnimationName) {
		this.hasAnimation = true;
	}

};

Modal.prototype = function () {

	'use strict';

	// Selector for focusable elements
	var focusSelector = 'input, select, textarea, a[href], button, [tabindex], audio[controls], video[controls], [contenteditable]:not([contenteditable="false"])';
	
	var modal = {

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
		* Initialize modal trigger. (public)
		*/
		initTrigger: function() {
			if (this.isTriggerInitialized) return;
			this.triggerEventListener = modal.triggerEventListener.bind(this);
			this.trigger.addEventListener('click', this.triggerEventListener);
			this.isTriggerInitialized = true;
			if (this.initTriggerCallback) this.initTriggerCallback.call(this);
		},

		/**
		* Remove related events from modal trigger. (public)
		*/
		removeTrigger: function() {
			if (!this.isTriggerInitialized) return;
			this.trigger.removeEventListener('click', this.triggerEventListener);
			this.isTriggerInitialized = false;
			if (this.removeTriggerCallback) this.removeTriggerCallback.call(this);
		},

		/**
		* Open modal on trigger click. (private)
		* @param event object
		*/
		triggerEventListener: function(event) {
			event.preventDefault();
			modal.open.call(this);
		},

		/**
		* Create modal to the DOM, load and append modal item based on its type. (public)
		*/
		open: function() {
			if (modal.isOpened) return;
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
		},

		/**
		* Close opened modal, call `remove()` method after closing animation is finished (or animation is not enabled). (public)
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
		* Set modal as accepted. It is useful for making confirmation dialogs. (public)
		*/
		accept: function() {
			if (this.isAccepted) return;
			this.isAccepted = true;
			if (this.acceptCallback) this.acceptCallback.call(this);
		},

		/**
		* Remove modal from the DOM, set focus back to the element which was active before modal was opened. (public)
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
		* Load image modal item. (private)
		*/
		loadImage: function() {
			var self = this;
			modal.item = new Image();
			modal.item.src = this.source;
			modal.item.onload = function(){
				modal.item.classList.add(self.modalItemClass);
				modal.item.classList.add(self.modalItemImageClass);
				modal.addCustomItemClasses.call(self);
				modal.wrapper.appendChild(modal.item);
				modal.wrapper.classList.add(self.isLoadedClass);
				modal.setFocus.call(self);
				if (self.loadCallback) self.loadCallback.call(self);
			};
			modal.item.onerror = function(){
				modal.setFocus.call(self);
			};
		},

		/**
		* Load HTML video modal item. (private)
		*/
		loadVideo: function() {
			var self = this;
			modal.item = document.createElement('video');
			modal.item.src = this.source;
			modal.item.autoplay = true;
			modal.item.controls = 1;
			modal.item.onloadedmetadata = function() {
				modal.item.classList.add(self.modalItemClass);
				modal.item.classList.add(self.modalItemVideoClass);
				modal.addCustomItemClasses.call(self);
				modal.wrapper.appendChild(modal.item);
				modal.wrapper.classList.add(self.isLoadedClass);
				modal.setFocus.call(self);
				if (self.loadCallback) self.loadCallback.call(self);
			};
			modal.item.onerror = function(){
				modal.setFocus.call(self);
			};
		},

		/**
		* Load YouTube video modal item as an iframe. (private)
		*/
		loadYouTube: function() {
			var match = this.source.match(/(youtube|youtu)\.(com|be)\/(watch\?v=([\w-]+)|([\w-]+))/);
			var videoID = (match[1] === 'youtube') ? match[4] : match[5];
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
			if (this.loadCallback) this.loadCallback.call(this);
		},

		/**
		* Load Vimeo video modal item as an iframe. (private)
		*/
		loadVimeo: function() {
			var match = this.source.match(/vimeo\.com\/([\w-]+)/);
			var videoID = match[1];
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
			if (this.loadCallback) this.loadCallback.call(this);
		},

		/**
		* Load dialog modal item. (private)
		*/
		loadDialog: function() {
			var sourceDialog = document.querySelector(this.source);
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
			if (this.loadCallback) this.loadCallback.call(this);
		},

		/**
		* Load dialog modal item for ajax fetched contents. (private)
		*/
		loadAjax: function() {
			var self = this;
			var xmlHttp = new XMLHttpRequest();
			xmlHttp.onreadystatechange = function() {
				if (xmlHttp.readyState == 4) {
					if (xmlHttp.status == 200) {
						modal.item = document.createElement('div');
						modal.item.classList.add(self.modalItemClass);
						modal.item.classList.add(self.modalItemDialogClass);
						modal.item.classList.add(self.modalItemAjaxClass);
						modal.addCustomItemClasses.call(self);
						modal.item.setAttribute('tabindex', '-1');
						modal.item.innerHTML = xmlHttp.responseText;
						modal.wrapper.appendChild(modal.item);
						modal.wrapper.classList.add(self.isLoadedClass);
						modal.setFocus.call(self);
						modal.setCustomTriggers.call(self);
						if (self.loadCallback) self.loadCallback.call(self);
					}
					else {
						modal.setFocus.call(self);
					}
				}
			}
			xmlHttp.open('GET', this.source);
			xmlHttp.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
			xmlHttp.send(null);
		},

		/**
		* Add custom classes to modal item. (private)
		*/
		addCustomItemClasses: function() {
			for (var i = 0; i < this.customItemClasses.length; i++) {
				modal.item.classList.add(this.customItemClasses[i]);
			}
		},

		/**
		* Set custom close and accept triggers. (private)
		*/
		setCustomTriggers: function() {
			var self = this;
			var customCloseTriggers = modal.item.querySelectorAll(this.customCloseTriggerSelector);
			var customAcceptTriggers = modal.item.querySelectorAll(this.customAcceptTriggerSelector);
			for (var i = 0; i < customCloseTriggers.length; i++) {
				customCloseTriggers[i].addEventListener('click', function(event) {
					event.stopPropagation();
					modal.close.call(self);
				});
			}
			for (var i = 0; i < customAcceptTriggers.length; i++) {
				customAcceptTriggers[i].addEventListener('click', function(event) {
					event.stopPropagation();
					modal.accept.call(self);
				});
			}
		},

		/**
		* Find focusable elements in loaded modal, set focus to the first one. (private)
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
		* Keep focus in loaded modal on tab key press. (private)
		* @param event object
		*/
		maintainFocus: function(event) {
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
		* Create modal wrapper, backdrop close button and spinner. (private)
		*/
		createWrapper: function() {
			var self = this;
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
			for (var i = 0; i < this.customClasses.length; i++) {
				modal.wrapper.classList.add(this.customClasses[i]);
			}
			if (this.closeButton) {
				modal.closeButton = document.createElement('button');
				modal.closeButton.type = 'button';
				modal.closeButton.classList.add(this.modalCloseClass);
				if (this.closeButtonLabel) modal.closeButton.setAttribute('aria-label', this.closeButtonLabel);
				modal.wrapper.appendChild(modal.closeButton);
				modal.closeButton.addEventListener('click', function(event) {
					event.stopPropagation();
					modal.close.call(self);
				});
			}
			if (this.closeOnBackdropClick) {
				modal.backdrop.addEventListener('click', function(event) {
					event.stopPropagation();
					modal.close.call(self);
				});
			}
			modal.wrapper.addEventListener('keydown', function(event) {
				if (event.keyCode === 27 && self.closeOnEsc) {
					event.stopPropagation();
					modal.close.call(self);
				}
				if (event.keyCode === 9) modal.maintainFocus.call(self, event);
			});
			if (this.hasAnimation) {
				modal.wrapper.addEventListener('animationend', function(event) {
					if (!modal.isOpened && event.animationName == self.closeAnimationName) {
						modal.wrapper.classList.add(self.isClosedClass);
						modal.remove.call(self);
					}
					if (event.animationName == self.openAnimationName) {
						modal.wrapper.classList.remove(self.isOpeningClass);
						modal.wrapper.classList.add(self.isOpenedClass);
					}
				});
			}
			modal.isWrapperCreated = true;
		},

		/**
		 * Get value of "isTriggerInitialized" to be able to check modal is initialized or not. (public)
		 * @return boolean
		 */
		getIsTriggerInitialized: function() {
			return this.isTriggerInitialized;
		},

		/**
		 * Get value of modal "isOpened" to be able to check modal is opened or not. (public)
		 * @return boolean
		 */
		getIsModalOpened: function() {
			return modal.isOpened;
		}
	};

	return {
		initTrigger: modal.initTrigger,
		removeTrigger: modal.removeTrigger,
		open: modal.open,
		close: modal.close,
		accept: modal.accept,
		remove: modal.remove,
		getIsTriggerInitialized: modal.getIsTriggerInitialized,
		getIsModalOpened: modal.getIsModalOpened
	};

}();
