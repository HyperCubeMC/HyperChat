/**
 * An extension of a map that allows easily using a map for correlating a key to an array with less code and more simplicity
 * @module ArrayMap
 * @author Justsnoopy30 <justsnoopy30@hypercubemc.tk>
 * @copyright Justsnoopy30 2021
 * @license AGPL-3.0
 */

import arrayRemove from './ArrayRemove.js';

class ArrayMap extends Map {
  get(key) {
    return super.get(key);
  }

  set(key, value) {
    if (typeof value != Array) {
      throw new Error('You may only set the value of a key in an ArrayMap to an Array!');
    }
    return super.set(key, value);
  }

  insert(key, element) {
    if (!this.has(key)) {
      super.set(key, []);
    }
    super.get(key).push(element);
    return this;
  }

  remove(key, element) {
    if (!this.has(key)) {
      throw new Error('You must first initialize this key as an Array to remove an element from it!')
    }

    super.set(key, arrayRemove(super.get(key), element));
    if (!super.get(key).length) {
      super.delete(key);
    }
    return this;
  }
}

export default ArrayMap;
