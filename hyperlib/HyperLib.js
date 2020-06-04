/**
 * HyperLib module.
 * Used to create and select DOM elements, perform actions on them, and manage them.
 * @module HyperSelect
 * @author Justsnoopy30 <justsnoopy30@hypercubemc.tk>
 * @copyright Justsnoopy30 2020
 * @license AGPL-3.0
 */

// Import dependencies
import debug from '/es_modules/debug/debug.js';

// Set debug logger
const logDebug = debug('HyperLib:debug');

/*
Start hacks.
Nessesary for native DOM methods like prepend, append, appendChild and insertBefore
to work on the Proxy elements.
*/
const targetNode = Symbol('targetNode');
const normalInsertBefore = Node.prototype.insertBefore;
const normalAppendChild = Node.prototype.appendChild;
const normalPrepend = Element.prototype.prepend;
const normalAppend = Element.prototype.append;
Node.prototype.insertBefore = function(...args) {
  if (args[0][targetNode]) {
    args[0] = args[0][targetNode];
    logDebug(args[0]);
  }
  normalInsertBefore.apply(this, args);
}
Node.prototype.appendChild = function(...args) {
  if (args[0][targetNode]) {
    args[0] = args[0][targetNode];
    logDebug(args[0]);
  }
  normalAppendChild.apply(this, args);
}
Element.prototype.prepend = function(...args) {
  args.forEach((arg, index) => {
    if (arg[targetNode]) {
      args[index] = args[index][targetNode];
    }
    logDebug(`Argument ${index}:`, args[index]);
  });
  normalPrepend.apply(this, args);
}
Element.prototype.append = function(...args) {
  args.forEach((arg, index) => {
    if (arg[targetNode]) {
      args[index] = args[index][targetNode];
    }
    logDebug(`Argument ${index}:`, args[index]);
  });
  normalAppend.apply(this, args);
}
/* End hacks */

const handleElement = {
  get: function(element, property) {
    switch (property) {
      case targetNode: {
        return element;
      }
      case 'getParent': {
        return () => {
          return new Proxy(element.parentElement, handleElement);
        }
      }
      case 'data': {
        return (property, value) => {
          return data(element, property, value);
        }
      }
      case 'css': {
        return (property, value) => {
          return css(element, property, value);
        }
      }
      case 'hide': {
        return () => {
          return hide(element);
        }
      }
      case 'show': {
        return () => {
          return show(element);
        }
      }
      case 'fadeIn': {
        return (fadeInMilliseconds) => {
          return fadeIn(element, fadeInMilliseconds);
        }
      }
      case 'fadeOut': {
       return (fadeOutMilliseconds) => {
         return fadeOut(element, fadeOutMilliseconds);
       }
      }
     default: {
       return typeof element[property] === 'function'
         /* If it is a function: */ ? element[property].bind(element)
         /* Otherwise it's not: */ : element[property];
     }
   }
  },
  set: function(element, property, value) {
    element[property] = value;
    return true;
  }
}

const grab = function(selector, context = document) {
 const element = context.querySelector(selector);
 return new Proxy(element, handleElement);
}

const grabAll = function(selector, context = document) {
 const element = context.querySelectorAll(selector);
 return new Proxy(element, handleElement);
}

const newElement = function(newElementString) {
 const element = document.createElement(newElementString);
 return new Proxy(element, handleElement);
}

function css(element, property, value) {
  if (typeof value === 'undefined') {
    if (typeof property === 'undefined') {
      return window.getComputedStyle(element);
    }
    return window.getComputedStyle(element).getPropertyValue(property);
  }
  element.style.setProperty(property, value);
  return new Proxy(element, handleElement);
}

function data(element, property, value) {
  if (typeof value === 'undefined') {
    if (typeof data === 'undefined') {
      return element.dataset;
    }
    return element.dataset[property];
  }
  element.dataset[property] = value;
  return new Proxy(element, handleElement);
}

function hide(element) {
  return new Promise((resolve, reject) => {
    const originalDisplay = css(element, 'display') || 'initial';
    data(element, 'originalDisplay', originalDisplay);
    css(element, 'display', 'none');
    resolve(new Proxy(element, handleElement));
  });
}

function show(element) {
  return new Promise((resolve, reject) => {
    const displayToShow = data(element, 'originalDisplay') || 'initial';
    css(element, 'display', displayToShow);
    resolve(new Proxy(element, handleElement));
  });
}

function fadeIn(element, fadeInMilliseconds = 500) {
  return new Promise((resolve, reject) => {
    const transitionTime = fadeInMilliseconds;
    css(element, 'opacity', '0');
    css(element, 'transition', `opacity ${transitionTime}ms`);
    show(new Proxy(element, handleElement));
    setTimeout(() => {
      css(element, 'opacity', '1')
      setTimeout(() => {
        resolve(new Proxy(element, handleElement));
      }, transitionTime);
    }, 1);
  });
}

function fadeOut(element, fadeOutMilliseconds = 500) {
  return new Promise((resolve, reject) => {
    const transitionTime = fadeOutMilliseconds;
    css(element, 'transition', `opacity ${transitionTime}ms`);
    css(element, 'opacity', '0');
    setTimeout(() => {
      hide(element);
      resolve(new Proxy(element, handleElement));
    }, transitionTime);
  });
}

export { grab, grabAll, newElement };
