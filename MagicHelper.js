/*
Here I define the $ helper.
Select an element by type: $('element')
Select an element by id: $('#id')
Select an element by class: $('.class')
This has optional an optional context that defaults to the document.
The context allows you to select an element inside a selected parent element
(selected as the second argument with the helper).
Usage without context: $('element')
Usage with context: $('element', $('parent_element'))
*/
const $ = (selector, context = document) => context.querySelector(selector);

/*
Get, set, and list attributes of an element.
Get attribute: $('element').attr('attribute')
Set attribute: $('element').attr('attribute', 'value')
List attributes: $('element').attr()
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

/*
Get and set the html of an element.
Get element html: $('element').html()
Set element html: $('element').html('<p>This html was set with MagicHelper!</p>')
*/
HTMLElement.prototype.html = function (html) {
  if (!html) {
    return this.innerHTML;
  }
  this.innerHTML = html;
  return this;
}

/*
Get and set the inner text of an element.
Get element text: $('element').text()
Set element text: $('element').text('This text was set with MagicHelper!')
*/
HTMLElement.prototype.text = function (text) {
  if (!text) {
    return this.textContent;
  }
  this.innerText = text;
  return this;
}

/*
Append an element to the end of the inside of another element.
Usage: $('element').append('<p>This element was appended with MagicHelper!</p>')
*/
HTMLElement.prototype.append = function (element) {
  if (element instanceof HTMLElement) {
    this.appendChild(element);
    return this;
  }
  this.append(element);
  return this;
}

/*
Prepend an element to the start of the inside of another element.
Usage: $('element').prepend('<p>This element was prepended with MagicHelper!</p>')
*/
HTMLElement.prototype.prepend = function (element) {
  if (element instanceof HTMLElement) {
    this.parentNode.insertBefore(element, this);
    return this;
  }
  this.parentNode.insertBefore(element, this);
  return this;
}

/*
Remove an element.
Usage: $('element').remove()
*/
HTMLElement.prototype.remove = function() {
  this.parentNode.removeChild(this);
}

/*
Get the parent element of an element.
Usage: $('element').parent()
*/
HTMLElement.prototype.parent = function () {
  return this.parentNode;
}

/*
Add an event listener to an element.
Usage: $(document).on('click', event => ...)
*/
HTMLElement.prototype.on = function (event, callback, options) {
  this.addEventListener(event, callback, options);
  return this;
}

/*
Remove an event listener from an element.
Usage: $(document).off('click', callback)
*/
HTMLElement.prototype.off = function (event, callback, options) {
  this.removeEventListener(event, callback, options);
  return this;
}

// Set the default export to $.
export default $;
