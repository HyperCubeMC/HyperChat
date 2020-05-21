/**
 * MagicHelper module.
 * @module MagicHelper
 * @author Justsnoopy30 <justsnoopy30@hypercubemc.tk>
 * @copyright Justsnoopy30 2020
 * @license AGPL-3.0
 */

/**
 * Here I define the $ helper.
 * @example
 * Select an element by type: $('element')
 * Select an element by id: $('#id')
 * Select an element by class: $('.class')
 * This has optional an optional context that defaults to the document.
 * The context allows you to select an element inside a selected parent element
 * (selected as the second argument with the helper).
 * Usage without context: $('element')
 * Usage with context: $('element', $('parent_element'))
 */
const $ = (selector, context = document) => context.querySelector(selector);
/**
 * Here I define the $$ helper.
 * This is a multi-selector and selects multiple elements.
 * You need to forEach it.
 * @example
 * Select an element by type: $$('element')
 * Select an element by id: $$('#id')
 * Select an element by class: $$('.class')
 * This has optional an optional context that defaults to the document.
 * The context allows you to select an element inside a selected parent element
 * (selected as the second argument with the helper).
 * Usage without context: $$('element')
 * Usage with context: $$('element', $('parent_element'))
 */
const $$ = (selector, context = document) => context.querySelectorAll(selector);


/**
 * This represents the HTMLElement interface for the docs.
 * @namespace HTMLElement
 */

/**
 * Get, set, and list attributes of an element.
 * @example
 * Get attribute: $('element').attr('attribute')
 * Set attribute: $('element').attr('attribute', 'value')
 * List attributes: $('element').attr()
 * @param {String} attribute - The attribute to get or set.
 * @param {String} value - The value to set the attribute to.
 * @param {function} callback - A function to run when the function finishes.
 * @returns {(string|NamedNodeMap)} Returns an attribute's value as a string (get), HTMLElement (set), or a list of attributes on an element as a NamedNodeMap (list).
 */
HTMLElement.prototype.attr = function (attribute, value, callback) {
  if (typeof value === 'undefined') {
    if (typeof attribute === 'undefined') {
      return this.attributes;
    }
    return this.getAttribute(attribute);
  }
  this.setAttribute(attribute, value);
  if (typeof callback === 'function') {
    callback.call(this);
  }
  return this;
}

/**
 * Get and set the html of an element.
 * @example
 * Get element html: $('element').html()
 * Set element html: $('element').html('<p>This html was set with MagicHelper!</p>')
 * @param {String} html - A string containing the html to set the element to.
 * @param {function} callback - A function to run when the function finishes.
 * @returns {(String|HTMLElement)} Returns a string of the html (get), or the HTMLElement (set).
 */
HTMLElement.prototype.html = function (html, callback) {
  if (typeof html === 'undefined') {
    return this.innerHTML;
  }
  this.innerHTML = html;
  if (typeof callback === 'function') {
    callback.call(this);
  }
  return this;
}

/**
 * Get and set the inner text of an element. This uses textContent as it is tons faster than innerText.
 * @example
 * Get element text: $('element').text()
 * Set element text: $('element').text('This text was set with MagicHelper!')
 * @param {String} text - A string containing the text to set the element to contain.
 * @param {function} callback - A function to run when the function finishes.
 * @returns {(String|HTMLElement)} Returns a string of the text (get), or the HTMLElement (set).
 */
HTMLElement.prototype.text = function (text, callback) {
  if (typeof text === 'undefined') {
    return this.textContent;
  }
  this.textContent = text;
  if (typeof callback === 'function') {
    callback.call(this);
  }
  return this;
}

/**
 * Get the parent element of an element.
 * @example
 * $('element').parent()
 * @returns {HTMLElement} Returns the parent element's HTMLElement.
 */
HTMLElement.prototype.parent = function () {
  return this.parentNode;
}

/**
 * Add an event listener to an element.
 * @example
 * $('element').on('click', event => ...)
 * @param {String} event - The event to trigger the callback on.
 * @param {(EventListener|function)} callback - The callback, this is what is triggered when the event happens.
 * @param {Object} options - Options for the event listener (see the documentation for addEventListener()).
 * @returns {HTMLElement} Returns the HTMLELement.
 */
HTMLElement.prototype.on = function (event, callback, options) {
  this.addEventListener(event, callback, options);
  return this;
}

/**
 * Remove an event listener from an element.
 * @example
 * $('element').off('click', callback)
 * @param {String} event - The event to remove from the element.
 * @param {(EventListener|function)} callback - The function of the event handler listener to remove.
 * @param {Object} options Options for the event listener (see the documentation for addEventListener()).
 * @returns {HTMLElement} Returns the HTMLElement.
 */
HTMLElement.prototype.off = function (event, callback, options) {
  this.removeEventListener(event, callback, options);
  return this;
}

/**
* Get, set, and list the data values of an element.
* @example
* Get data values: $('element').data('data')
* Set data values: $('element').data('data', 'value')
* List data: $('element').data()
 * @param {String} data - The data to get or set.
 * @param {String} value - The value to set the data to.
 * @param {function} callback - A function to run when the function finishes.
 * @returns {HTMLElement} Returns the HTMLElement.
 */
HTMLElement.prototype.data = function (data, value, callback) {
  if (typeof value === 'undefined') {
    if (typeof data === 'undefined') {
      return this.dataset;
    }
    return this.dataset[data];
  }
  this.dataset[data] = value;
  if (typeof callback === 'function') {
    callback.call(this);
  }
  return this;
}

/**
 * Gets or sets a css property of an element.
 * @example
 * Get a css property value: $('element').css('property')
 * Set a css property value: $('element').css('property', 'value')
 * @param {String} property - The css property to get or set.
 * @param {String} value - The css property value to set.
 * @param {function} callback - A function to run when the function finishes.
 * @returns {(HTMLElement|String|CSSStyleDeclaration)} Returns the HTMLElement, a string containing the value of a property, or a list of css properties in the form of a CSSStyleDeclaration.
 */
HTMLElement.prototype.css = function (property, value, callback) {
  if (typeof value === 'undefined') {
    if (typeof property === 'undefined') {
      return window.getComputedStyle(this);
    }
    return window.getComputedStyle(this).getPropertyValue(property);
  }
  this.style.setProperty(property, value);
  if (typeof callback === 'function') {
    callback.call(this);
  }
  return this;
}

/**
 * Adds a class to an element.
 * @example
 * $('element').addClass('classToAdd')
 * @param {String} classToAdd - The class to add to the element.
 * @returns {Promise} Returns a promise with the HTMLElement when the function is complete.
 */
HTMLElement.prototype.addClass = function (classToAdd, callback) {
  return new Promise((resolve, reject) => {
    this.classList.add(classToAdd);
    resolve(this);
  });
}

/**
 * Removes a class from an element.
 * @example
 * $('element').removeClass('classToRemove')
 * @param {String} classToRemove - The class to remove from the element.
 * @returns {Promise} Returns a promise with the HTMLElement when the function is complete.
 */
HTMLElement.prototype.removeClass = function (classToRemove) {
  return new Promise((resolve, reject) => {
    this.classList.remove(classToRemove);
    resolve(this);
  });
}

/**
 * Toggles a class on an element.
 * @example
 * $('element').toggleClass('classToToggle')
 * If the element does not have the class, the class is added.
 * If the element has the class, the class is removed.
 * @param {String} classToToggle - The class to toggle on the element.
 * @returns {Promise} Returns a promise with the HTMLElement when the function is complete.
 */
HTMLElement.prototype.toggleClass = function (classToToggle) {
  return new Promise((resolve, reject) => {
    this.classList.toggle(classToToggle);
    resolve(this);
  });
}

/**
 * Hides an element.
 * @example
 * $('element').hide()
 * @returns {Promise} Returns a promise with the HTMLElement when the function is complete.
 */
HTMLElement.prototype.hide = function () {
  return new Promise((resolve, reject) => {
    const originalDisplay = this.css('display') || 'initial';
    this.data('originalDisplay', originalDisplay);
    this.css('display', 'none');
    resolve(this);
  });
}

/**
 * Shows an element.
 * @example
 * $('element').show()
 * @returns {Promise} Returns a promise with the HTMLElement when the function is complete.
 */
HTMLElement.prototype.show = function () {
  return new Promise((resolve, reject) => {
    const displayToShow = this.data('originalDisplay') || 'initial';
    this.css('display', displayToShow);
    resolve(this);
  });
}

/**
 * Fades in an element.
 * @example
 * $('element').fadeIn()
 * @param {String} fadeInMilliseconds - The amount of time for the fade in transition in milliseconds.
 * @returns {Promise} Returns a promise with the HTMLElement when the function is complete.
 */
HTMLElement.prototype.fadeIn = function (fadeInMilliseconds) {
  return new Promise((resolve, reject) => {
    const transitionTime = fadeInMilliseconds || 500;
    this.css('opacity', '0');
    this.css('transition', 'opacity ' + transitionTime + 'ms');
    this.show();
    setTimeout(() => {
      this.css('opacity', '1')
      setTimeout(() => {
        resolve(this);
      }, transitionTime);
    }, 1);
  });
}

/**
 * Fades out an element.
 * @example
 * $('element').fadeOut()
 * @param {String} fadeOutMilliseconds - The amount of time for the fade out transition in milliseconds.
 * @returns {Promise} Returns a promise with the HTMLElement when the function is complete.
 */
HTMLElement.prototype.fadeOut = function (fadeOutMilliseconds) {
  return new Promise((resolve, reject) => {
    const transitionTime = fadeOutMilliseconds || 500;
    this.css('transition', 'opacity ' + transitionTime + 'ms');
    this.css('opacity', '0');
    setTimeout(() => {
      this.hide();
      resolve(this);
    }, transitionTime);
  });
}

// Set the default export to $.
export default $;
// Export $ selector and $$ multi-selector
export { $, $$ };
