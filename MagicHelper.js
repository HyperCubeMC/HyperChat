const $ = (selector) => {
  // Returns the HTML elements that match the selector
  const elements = document.querySelectorAll(selector);
  return new $Functions(elements, selector);
};

export class $Functions {
  constructor (elements) {
    this._elements = elements;
  }

  addClass (className) {
    this._elements.forEach((element) => element.classList.add(className));
    return this;
  }

  removeClass (className) {
    this._elements.forEach((element) => element.classList.remove(className));
    return this;
  }

  toggleClass (className) {
    this._elements.forEach((element) => {
      const classList = element.classList;
      (classList.contains(className)) ? classList.remove(className) : classList.add(className);
    });
    return this;
  }

  hide () {
    this._elements.forEach((element) => {
      element.style.display = 'none';
    });
    return this;
  }

  show () {
    this._elements.forEach((element) => {
      element.style.display = 'block';
    });
    return this;
  }
}

// Default export
export default $;
