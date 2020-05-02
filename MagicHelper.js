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
 * Get attribute: $('element').attr('attribute')
 * Set attribute: $('element').attr('attribute', 'value')
 * List attributes: $('element').attr()
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
 * Get element html: $('element').html()
 * Set element html: $('element').html('<p>This html was set with MagicHelper!</p>')
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
 * Get element text: $('element').text()
 * Set element text: $('element').text('This text was set with MagicHelper!')
 */
HTMLElement.prototype.text = function (text) {
  if (!text) {
    return this.textContent;
  }
  this.innerText = text;
  return this;
}

/**
 * Remove an element.
 * Usage: $('element').remove()
 */
HTMLElement.prototype.remove = function() {
  this.parentNode.removeChild(this);
}

/**
 * Get the parent element of an element.
 * Usage: $('element').parent()
 */
HTMLElement.prototype.parent = function () {
  return this.parentNode;
}

/**
 * Add an event listener to an element.
 * Usage: $('element').on('click', event => ...)
 */
HTMLElement.prototype.on = function (event, callback, options) {
  this.addEventListener(event, callback, options);
  return this;
}

/**
 * Remove an event listener from an element.
 * Usage: $('element').off('click', callback)
 */
HTMLElement.prototype.off = function (event, callback, options) {
  this.removeEventListener(event, callback, options);
  return this;
}

/**
 * Get, set, and list the data values of an element.
 * Usage:
 * Get data values: $('element').data('data')
 * Set data values: $('element').data('data', 'value')
 * List data: $('element').data()
 */
HTMLElement.prototype.data = function (key, value) {
  if (!value) {
    if (!key) {
      return this.dataset;
    }
    return this.dataset[key];
  }
  this.dataset[key] = value;
  return this;
}

// Set the default export to $.
export default $;
