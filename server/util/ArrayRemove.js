/**
 * A simple function to remove an element from an array
 * @module ArrayRemove
 * @author Justsnoopy30 <justsnoopy30@hypercubemc.tk>
 * @copyright Justsnoopy30 2021
 * @license AGPL-3.0
 */

function arrayRemove(array, value) {
  return array.filter(function(element) {
   return element != value;
  });
}

export default arrayRemove;
