/**
 * MagicHelper module.
 * @module MagicHelper
 * @author Justsnoopy30 <justsnoopy30@hypercubemc.tk>
 * @copyright Justsnoopy30 2020
 * @license AGPL-3.0
 */

/**
 * Here I define the $ helper.
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
 * Get, set, and list attributes of an element.
 * @example
 * Get attribute: $('element').attr('attribute')
 * Set attribute: $('element').attr('attribute', 'value')
 * List attributes: $('element').attr()
 * @param {String} attribute - The attribute to get or set.
 * @param {String} value - The value to set the attribute to.
 * @returns {(string|NamedNodeMap)} Returns an attribute's value as a string (get), HTMLElement (set), or a list of attributes on an element as a NamedNodeMap (list).
 */
HTMLElement.prototype.attr = function (attribute, value) {
  if (!value) {
    if (!attribute) {
      return this.attributes;
    }
    return this.getAttribute(attribute);
  }
  this.setAttribute(attribute, value);
  return this;
}

/**
 * Get and set the html of an element.
 * @example
 * Get element html: $('element').html()
 * Set element html: $('element').html('<p>This html was set with MagicHelper!</p>')
 * @param {String} html - A string containing the html to set the element to.
 * @returns {(String|HTMLElement)} Returns a string of the html (get), or the HTMLElement (set).
 */
HTMLElement.prototype.html = function (html) {
  if (!html) {
    return this.innerHTML;
  }
  this.innerHTML = html;
  return this;
}

/**
 * Get and set the inner text of an element.
 * @example
 * Get element text: $('element').text()
 * Set element text: $('element').text('This text was set with MagicHelper!')
 * @param {String} text - A string containing the text to set the element to contain.
 * @returns {(String|HTMLElement)} Returns a string of the text (get), or the HTMLElement (set).
 */
HTMLElement.prototype.text = function (text) {
  if (!text) {
    return this.textContent;
  }
  this.innerText = text;
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
 * @returns {HTMLElement} Returns the HTMLElement.
 */
HTMLElement.prototype.data = function (data, value) {
  if (!value) {
    if (!data) {
      return this.dataset;
    }
    return this.dataset[data];
  }
  this.dataset[data] = value;
  return this;
}

// Set the default export to $.
export default $;
