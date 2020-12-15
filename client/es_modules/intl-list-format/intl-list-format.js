(function() {
  var SUPPORTS_LIST_FORMAT = "ListFormat" in Intl;
  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor)
        descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }
  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps)
      _defineProperties(Constructor.prototype, protoProps);
    if (staticProps)
      _defineProperties(Constructor, staticProps);
    return Constructor;
  }
  var TYPE = ["conjunction", "disjunction", "unit"];
  var STYLE = ["long", "short", "narrow"];
  var LOCALE_MATCHER = ["lookup", "best fit"];
  function _typeof2(obj) {
    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof2 = function _typeof22(obj2) {
        return typeof obj2;
      };
    } else {
      _typeof2 = function _typeof22(obj2) {
        return obj2 && typeof Symbol === "function" && obj2.constructor === Symbol && obj2 !== Symbol.prototype ? "symbol" : typeof obj2;
      };
    }
    return _typeof2(obj);
  }
  function _typeof(obj) {
    if (typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol") {
      _typeof = function _typeof3(obj2) {
        return _typeof2(obj2);
      };
    } else {
      _typeof = function _typeof3(obj2) {
        return obj2 && typeof Symbol === "function" && obj2.constructor === Symbol && obj2 !== Symbol.prototype ? "symbol" : _typeof2(obj2);
      };
    }
    return _typeof(obj);
  }
  function toObject(argument) {
    if (argument == null) {
      throw new TypeError("Argument ".concat(argument, " cannot be converted to an Object"));
    }
    if (typeof argument === "boolean") {
      return new Boolean(argument);
    }
    if (typeof argument === "number") {
      return new Number(argument);
    }
    if (typeof argument === "string") {
      return new String(argument);
    }
    if (_typeof(argument) === "symbol") {
      return new Object(argument);
    }
    return argument;
  }
  var _defaultLocale;
  function setDefaultLocale(locale) {
    _defaultLocale = locale;
  }
  function getDefaultLocale() {
    return _defaultLocale;
  }
  function ensureDefaultLocale() {
    if (_defaultLocale == null) {
      throw new ReferenceError("Could not determine locale: No default locale has been configured");
    }
    return _defaultLocale;
  }
  var LIST_FORMAT_INSTANCE_INTERNAL_MAP = new WeakMap();
  var LIST_FORMAT_STATIC_INTERNALS = {
    relevantExtensionKeys: [],
    localeData: {},
    availableLocales: []
  };
  function setInternalSlot(instance, property, value) {
    var record = LIST_FORMAT_INSTANCE_INTERNAL_MAP.get(instance);
    if (record == null) {
      record = Object.create(null);
      LIST_FORMAT_INSTANCE_INTERNAL_MAP.set(instance, record);
    }
    record[property] = value;
  }
  function getInternalSlot(instance, property) {
    var record = LIST_FORMAT_INSTANCE_INTERNAL_MAP.get(instance);
    if (record == null) {
      throw new ReferenceError("No internal slots has been allocated for the given instance of ListFormat");
    }
    return record[property];
  }
  function hasInternalSlot(instance, property) {
    var record = LIST_FORMAT_INSTANCE_INTERNAL_MAP.get(instance);
    return record != null && property in record;
  }
  var UNICODE_EXTENSION_SEQUENCE_REGEXP = /-u(?:-[0-9a-z]{2,8})+/gi;
  function removeUnicodeExtensionSequences(str) {
    return str.replace(UNICODE_EXTENSION_SEQUENCE_REGEXP, "");
  }
  function bestAvailableLocale(availableLocales, locale) {
    var candidate = locale;
    while (true) {
      if (availableLocales.includes(candidate)) {
        return candidate;
      }
      var pos = candidate.lastIndexOf("-");
      if (pos === -1)
        return void 0;
      if (pos >= 2 && candidate.charAt(pos - 2) === "-") {
        pos -= 2;
      }
      candidate = candidate.slice(0, pos);
    }
  }
  function lookupSupportedLocales(availableLocales, requestedLocales) {
    var subset = [];
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = void 0;
    try {
      for (var _iterator = requestedLocales[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var locale = _step.value;
        var noExtensionsLocale = removeUnicodeExtensionSequences(locale);
        var availableLocale = bestAvailableLocale(availableLocales, noExtensionsLocale);
        if (availableLocale !== void 0) {
          subset.push(locale);
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return != null) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
    return subset;
  }
  function bestFitSupportedLocales(availableLocales, requestedLocales) {
    return lookupSupportedLocales(availableLocales, requestedLocales);
  }
  function isPropertyKey(argument) {
    if (typeof argument === "string")
      return true;
    if (_typeof(argument) === "symbol")
      return true;
    return false;
  }
  function get(o, p) {
    if (_typeof(o) !== "object") {
      throw new TypeError("Given argument ".concat(o, " must be of type Object"));
    }
    if (!isPropertyKey(p)) {
      throw new TypeError("Given argument ".concat(p, " must be a PropertyKey"));
    }
    return o[p];
  }
  function toBoolean(argument) {
    return Boolean(argument);
  }
  function toString(argument) {
    return argument + "";
  }
  function getOption(options, property, type, values, fallback) {
    var value = get(options, property);
    if (value !== void 0) {
      if (type !== "boolean" && type !== "string") {
        throw new TypeError("Expected type ".concat(type, " to be 'boolean' or 'string"));
      }
      if (type === "boolean") {
        value = toBoolean(value);
      }
      if (type === "string") {
        value = toString(value);
      }
      if (values !== void 0) {
        if (!values.includes(value)) {
          throw new RangeError("Value ".concat(value, " out of range for options property ").concat(property));
        }
      }
      return value;
    } else {
      return fallback;
    }
  }
  function supportedLocales(availableLocales, requestedLocales, options) {
    var matcher;
    if (options !== void 0) {
      options = toObject(options);
      matcher = getOption(options, "localeMatcher", "string", LOCALE_MATCHER, "best fit");
    } else {
      matcher = "best fit";
    }
    return matcher === "best fit" ? bestFitSupportedLocales(availableLocales, requestedLocales) : lookupSupportedLocales(availableLocales, requestedLocales);
  }
  function lookupMatcher(_ref) {
    var availableLocales = _ref.availableLocales, requestedLocales = _ref.requestedLocales;
    var result = Object.create(null);
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = void 0;
    try {
      for (var _iterator = requestedLocales[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var locale = _step.value;
        var noExtensionsLocale = removeUnicodeExtensionSequences(locale);
        var availableLocale = bestAvailableLocale(availableLocales, noExtensionsLocale);
        if (availableLocale !== void 0) {
          result.locale = availableLocale;
          if (locale !== noExtensionsLocale) {
            var extensionMatch = locale.match(UNICODE_EXTENSION_SEQUENCE_REGEXP);
            result.extension = extensionMatch == null ? "" : extensionMatch[0];
          }
          return result;
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return != null) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
    var defLocale = ensureDefaultLocale();
    result.locale = defLocale;
    return result;
  }
  function bestFitMatcher(options) {
    return lookupMatcher(options);
  }
  function resolveLocale(availableLocales, requestedLocales, options, _relevantExtensionKeys, _localeData) {
    var matcher = options.localeMatcher;
    var r = matcher === "lookup" ? lookupMatcher({
      availableLocales,
      requestedLocales
    }) : bestFitMatcher({
      availableLocales,
      requestedLocales
    });
    var foundLocale = r.locale;
    var result = Object.create(null);
    result.dataLocale = foundLocale;
    var supportedExtension = "-u";
    if (supportedExtension.length > 2) {
      var privateIndex = String.prototype.indexOf.call(foundLocale, "-x-");
      if (privateIndex === -1) {
        foundLocale = "".concat(foundLocale).concat(supportedExtension);
      } else {
        var preExtension = foundLocale.slice(0, privateIndex);
        var postExtension = foundLocale.slice(privateIndex);
        foundLocale = "".concat(preExtension).concat(supportedExtension).concat(postExtension);
      }
      foundLocale = Intl.getCanonicalLocales(foundLocale)[0];
    }
    result.locale = foundLocale;
    return result;
  }
  function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) {
        arr2[i] = arr[i];
      }
      return arr2;
    }
  }
  function _iterableToArray(iter) {
    if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]")
      return Array.from(iter);
  }
  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance");
  }
  function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
  }
  function stringListFromIterable(iterable) {
    if (iterable === void 0) {
      return [];
    }
    var arr = _toConsumableArray(iterable);
    if (arr.some(function(element) {
      return typeof element !== "string";
    })) {
      throw new TypeError("All List items must be strings");
    }
    return arr;
  }
  function isRecord(item) {
    return Object.prototype.toString.call(item) === "[object Object]";
  }
  function isList(item) {
    return Array.isArray(item) || isRecord(item);
  }
  function deconstructPattern(pattern, placeables) {
    var result = [];
    var beginIndex = String.prototype.indexOf.call(pattern, "{", 0);
    var nextIndex = 0;
    var length = pattern.length;
    while (pattern[beginIndex] !== void 0) {
      var endIndex = String.prototype.indexOf.call(pattern, "}", beginIndex);
      if (endIndex <= beginIndex) {
        throw new TypeError("Expected endIndex: ".concat(endIndex, " to be greater than beginIndex: ").concat(beginIndex));
      }
      if (beginIndex > nextIndex) {
        var literal = pattern.slice(nextIndex, beginIndex);
        result.push({
          type: "literal",
          value: literal
        });
      }
      var part = pattern.slice(beginIndex + 1, endIndex);
      if (placeables[Number(part)] == null) {
        throw new TypeError("Expected placeables to have a part for PropertyKey: ".concat(part));
      }
      var subst = placeables[Number(part)];
      if (isList(subst.value)) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = void 0;
        try {
          for (var _iterator = subst.value[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var s = _step.value;
            result.push(s);
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return != null) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      } else {
        result.push(subst);
      }
      nextIndex = endIndex + 1;
      beginIndex = String.prototype.indexOf.call(pattern, "{", nextIndex);
    }
    if (nextIndex < length) {
      var _literal = pattern.slice(nextIndex, length);
      result.push({
        type: "literal",
        value: _literal
      });
    }
    return result;
  }
  function createPartsFromList(listFormat, list) {
    var pattern;
    var size = list.length;
    if (size === 0) {
      return [];
    }
    if (size === 2) {
      pattern = getInternalSlot(listFormat, "templatePair");
      var first = {
        type: "element",
        value: list[0]
      };
      var second = {
        type: "element",
        value: list[1]
      };
      var placeables = {
        0: first,
        1: second
      };
      return deconstructPattern(pattern, placeables);
    }
    var last = {
      type: "element",
      value: list[size - 1]
    };
    var parts = [last];
    var i = size - 2;
    while (i >= 0) {
      if (i === 0) {
        pattern = getInternalSlot(listFormat, "templateStart");
      } else if (i < size - 2) {
        pattern = getInternalSlot(listFormat, "templateMiddle");
      } else {
        pattern = getInternalSlot(listFormat, "templateEnd");
      }
      var head = {
        type: "element",
        value: list[i]
      };
      var tail = {
        type: "element",
        value: parts
      };
      var _placeables = {
        0: head,
        1: tail
      };
      parts = deconstructPattern(pattern, _placeables);
      i--;
    }
    return parts;
  }
  function formatList(listFormat, list) {
    var parts = createPartsFromList(listFormat, list);
    var result = "";
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = void 0;
    try {
      for (var _iterator = parts[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var part = _step.value;
        result += part.value;
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return != null) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
    return result;
  }
  function formatListToParts(listFormat, list) {
    return createPartsFromList(listFormat, list);
  }
  var ListFormat = /* @__PURE__ */ function() {
    function ListFormat2() {
      _classCallCheck(this, ListFormat2);
      var locales = arguments[0];
      var options = arguments[1];
      if ((this instanceof ListFormat2 ? this.constructor : void 0) === void 0) {
        throw new TypeError("Constructor Intl.ListFormat requires 'new'");
      }
      var requestedLocales = Intl.getCanonicalLocales(locales);
      options = options === void 0 ? Object.create(null) : toObject(options);
      var opt = Object.create(null);
      var matcher = getOption(options, "localeMatcher", "string", LOCALE_MATCHER, "best fit");
      opt.localeMatcher = matcher;
      var type = getOption(options, "type", "string", TYPE, "conjunction");
      setInternalSlot(this, "type", type);
      var style = getOption(options, "style", "string", STYLE, "long");
      setInternalSlot(this, "style", style);
      var localeData = LIST_FORMAT_STATIC_INTERNALS.localeData;
      var r = resolveLocale(LIST_FORMAT_STATIC_INTERNALS.availableLocales, requestedLocales, opt);
      var dataLocale = r.dataLocale;
      var dataLocaleData = localeData[dataLocale];
      var dataLocaleTypes = dataLocaleData.formats[type];
      var templates = dataLocaleTypes[style];
      setInternalSlot(this, "templatePair", templates.Pair);
      setInternalSlot(this, "templateStart", templates.Start);
      setInternalSlot(this, "templateMiddle", templates.Middle);
      setInternalSlot(this, "templateEnd", templates.End);
      setInternalSlot(this, "locale", r.locale);
      setInternalSlot(this, "initializedListFormat", this);
    }
    _createClass(ListFormat2, [{
      key: "format",
      value: function format(list) {
        var lf = this;
        if (!(lf instanceof Object)) {
          throw new TypeError("Method Intl.ListFormat.prototype.format called on incompatible receiver ".concat(this.toString()));
        }
        if (!hasInternalSlot(lf, "initializedListFormat")) {
          throw new TypeError("Method Intl.ListFormat.prototype.format called on incompatible receiver ".concat(this.toString()));
        }
        var stringList = stringListFromIterable(list);
        return formatList(lf, stringList);
      }
    }, {
      key: "formatToParts",
      value: function formatToParts(list) {
        var lf = this;
        if (!(lf instanceof Object)) {
          throw new TypeError("Method Intl.ListFormat.prototype.formatToParts called on incompatible receiver ".concat(this.toString()));
        }
        if (!hasInternalSlot(lf, "initializedListFormat")) {
          throw new TypeError("Method Intl.ListFormat.prototype.formatToParts called on incompatible receiver ".concat(this.toString()));
        }
        var stringList = stringListFromIterable(list);
        return formatListToParts(lf, stringList);
      }
    }, {
      key: "resolvedOptions",
      value: function resolvedOptions() {
        var lf = this;
        if (!(lf instanceof Object)) {
          throw new TypeError("Method Intl.ListFormat.prototype.resolvedOptions called on incompatible receiver ".concat(this.toString()));
        }
        if (!hasInternalSlot(lf, "initializedListFormat")) {
          throw new TypeError("Method Intl.ListFormat.prototype.resolvedOptions called on incompatible receiver ".concat(this.toString()));
        }
        var locale = getInternalSlot(this, "locale");
        var type = getInternalSlot(this, "type");
        var style = getInternalSlot(this, "style");
        return {
          locale,
          type,
          style
        };
      }
    }], [{
      key: "supportedLocalesOf",
      value: function supportedLocalesOf(locales) {
        var options = arguments[1];
        var availableLocales = LIST_FORMAT_STATIC_INTERNALS.availableLocales;
        var requestedLocales = Intl.getCanonicalLocales(locales);
        return supportedLocales(availableLocales, requestedLocales, options);
      }
    }, {
      key: "__addLocaleData",
      value: function __addLocaleData(_ref) {
        var data = _ref.data, locale = _ref.locale;
        var defaultLocale = getDefaultLocale();
        if (defaultLocale == null) {
          setDefaultLocale(locale);
        }
        LIST_FORMAT_STATIC_INTERNALS.localeData[locale] = data;
        if (!LIST_FORMAT_STATIC_INTERNALS.availableLocales.includes(locale)) {
          LIST_FORMAT_STATIC_INTERNALS.availableLocales.push(locale);
        }
      }
    }]);
    return ListFormat2;
  }();
  Object.defineProperty(ListFormat.prototype, Symbol.toStringTag, {
    writable: false,
    enumerable: false,
    value: "Intl.ListFormat",
    configurable: true
  });
  function patch() {
    if (typeof Intl === "undefined") {
      throw new TypeError("Could not define Intl.ListFormat: Expected 'Intl' to exist. Remember to include polyfill for Intl.getCanonicalLocales before applying this polyfill");
    }
    Intl.ListFormat = ListFormat;
  }
  if (!SUPPORTS_LIST_FORMAT) {
    patch();
  }
})();
export default null;
