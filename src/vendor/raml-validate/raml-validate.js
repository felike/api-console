(function (root) {
  /**
   * `Object.prototype.toString` as a function.
   *
   * @type {Function}
   */
  var toString = Function.prototype.call.bind(Object.prototype.toString);

  /**
   * Check the value is a valid date.
   *
   * @param  {Date}    check
   * @return {Boolean}
   */
  var isDate = function (check) {
    return toString(check) === '[object Date]' && !isNaN(check.getTime());
  };

  /**
   * Check if the value is a boolean.
   *
   * @param  {Boolean}  check
   * @return {Boolean}
   */
  var isBoolean = function (check) {
    return typeof check === 'boolean';
  };

  /**
   * Check the value is a string.
   *
   * @param  {String}  check
   * @return {Boolean}
   */
  var isString = function (check) {
    return typeof check === 'string';
  };

  /**
   * Check if the value is an integer.
   *
   * @param  {Number}  check
   * @return {Boolean}
   */
  var isInteger = function (check) {
    return typeof check === 'number' && check % 1 === 0;
  };

  /**
   * Check if the value is a number.
   *
   * @param  {Number}  check
   * @return {Boolean}
   */
  var isNumber = function (check) {
    return typeof check === 'number' && isFinite(check);
  };

  /**
   * Check if the value is a JSON string.
   *
   * @param  {String}  check
   * @return {Boolean}
   */
  var isJSON = function (check) {
    try {
      JSON.parse(check);
      return true;
    } catch(e) {
      return false;
    }
  };

  var isUnion = function (check, key, object, configs) {
    var any = false;
    configs.forEach(function (config) {
      config.unionTypes.forEach(function (type) {
        any = any || TYPES[type](check, key, object, configs);
      });
    });

    return any;
  };

  /**
   * Check if the value is file.
   *
   * @param  {Object}  check
   * @return {Boolean}
   */
  var isFile = function (check) {
    return check.constructor === File;
  };

  /**
   * Check if the value is an Array string. If so, then check the type of the items
   *
   * @param  {Array} check
   * @param  {String} key
   * @param  {Object} object
   * @param  {Object} configs
   * @return {Boolean}
   */
  var isArray = function (check, key, object, configs) {

    if (!Array.isArray(check)) return false;

    var isArray = true;

    configs.forEach(function (config) {
      if (config.hasOwnProperty('items')) {
        check.forEach(function(elem) {
          isArray = isArray && TYPES[config.items](elem, key, object, configs);
        });
      }
    });

    return isArray;
  };

  /**
   * Check a number is not smaller than the minimum.
   *
   * @param  {Number}   min
   * @return {Function}
   */
  var isMinimum = function (min) {
    return function (check) {
      return check >= min;
    };
  };

  /**
   * Check a number doesn't exceed the maximum.
   *
   * @param  {Number}  max
   * @return {Function}
   */
  var isMaximum = function (max) {
    return function (check) {
      return check <= max;
    };
  };

  /**
   * Check a string is not smaller than a minimum length.
   *
   * @param  {Number}  min
   * @return {Function}
   */
  var isMinimumLength = function (min) {
    return function (check) {
      return check.length >= min;
    };
  };

  /**
   * Check a string does not exceed a maximum length.
   *
   * @param  {Number}  max
   * @return {Function}
   */
  var isMaximumLength = function (max) {
    return function (check) {
      return check.length <= max;
    };
  };

  /**
   * Check a value is equal to anything in an array.
   *
   * @param  {Array}    values
   * @return {Function}
   */
  var isEnum = function (values) {
    return function (check) {
      return values.indexOf(check) > -1;
    };
  };

  /**
   * Check if a pattern matches the value.
   *
   * @param  {(String|RegExp)} pattern
   * @return {Function}
   */
  var isPattern = function (pattern) {
    if (toString(pattern) !== '[object RegExp]') {
      pattern = new RegExp(pattern);
    }

    return pattern.test.bind(pattern);
  };

  /**
   * Check if a file type is included in values.
   *
   * @param  {Array<String>} values
   * @return {Function}
   */
  var isValidFileTypes = function (values) {
    return function (check) {
      check = check.toLowerCase();
      var checkInValue = values.find(function (value) {
        return value.toLowerCase() === check
      });
      return checkInValue ? true : false;
    }
  };

  /**
   * Check array is not smaller than a minimum length.
   *
   * @param  {Number}  min
   * @return {Function}
   */
  var hasMinimumItems = function (min) {
    return function (check) {
      return check.length >= min;
    };
  };

  /**
   * Check array does not exceed a maximum length.
   *
   * @param  {Number}  max
   * @return {Function}
   */
  var hasMaximumItems = function (max) {
    return function (check) {
      return check.length <= max;
    };
  };

  /**
   * Check array has unique items.
   *
   * @param  {Boolean}  checkUniqueness
   * @return {Function}
   */
  var hasUniqueItems = function (checkUniqueness) {
    return function(check) {
      if (!checkUniqueness) return true;

      var unique = {}, i;

      for (i = 0; i < check.length; i += 1) {
        if (unique[check[i]]) {
          return false;
        }
        unique[check[i]] = true;
      }

      return true;
    };
  };

  /**
   * Convert arguments into an object.
   *
   * @param  {Boolean} valid
   * @param  {String}  rule
   * @param  {*}       value
   * @param  {String}  key
   * @return {Object}
   */
  var toValidationObject = function (valid, rule, value, key) {
    return { valid: valid, rule: rule, value: value, key: key };
  };

  /**
   * Convert a single config into a function.
   *
   * @param  {Object}   config
   * @param  {Object}   rules
   * @return {Function}
   */
  var toValidationFunction = function (config, rules) {
    var fns = [];

    // Iterate over all of the keys and dynamically push validation rules.
    Object.keys(config).forEach(function (rule) {
      if (rules.hasOwnProperty(rule)) {
        fns.push([rule, rules[rule](config[rule], rule)]);
      }
    });

    /**
     * Run every validation that has been attached.
     *
     * @param  {String} value
     * @param  {String} value
     * @param  {Object} object
     * @return {Object}
     */
    return function (value, key, object) {
      // Run each of the validations returning early when something fails.
      for (var i = 0; i < fns.length; i++) {
        var valid = fns[i][1](value, key, object);

        if (!valid) {
          return toValidationObject(false, fns[i][0], value, key);
        }
      }

      return toValidationObject(true, null, value, key);
    };
  };

  /**
   * Convert a rules object into a simple validation function.
   *
   * @param  {Object}   configs
   * @param  {Object}   rules
   * @param  {Object}   types
   * @return {Function}
   */
  var toValidation = function (configs, rules, types) {
    // Initialize the configs to an array if they aren't already.
    configs = Array.isArray(configs) ? configs : [configs];

    var isOptional        = !configs.length;
    var simpleValidations = [];
    var repeatValidations = [];
    var repeatable        = false;

    // Support multiple type validations.
    configs.forEach(function (config) {
      var validation = [config.type, toValidationFunction(config, rules)];

      // Allow short-circuiting of non-required values.
      if (!config.required) {
        isOptional = true;
      }

      // Push validations into each stack depending on the "repeat".
      if (config.repeat) {
        repeatValidations.push(validation);
        repeatable = true;
      } else {
        simpleValidations.push(validation);
      }
    });

    /**
     * Validate a value based on "type" and "repeat".
     *
     * @param  {*}      value
     * @param  {String} key
     * @param  {Object} object
     * @return {Object}
     */
    return function (value, key, object) {

      // Switch validation type depending on if the value is an array or not and if raml is 0.8.
      var isArray = Array.isArray(value) && repeatable;

      // Short-circuit validation if empty value
      if (value == null || (isArray && value.length === 0)) {
        return toValidationObject(isOptional, 'required', value, key);
      }

      // Select the validation stack to use based on the (repeated) value.
      var values      = isArray ? value : [value];
      var validations = isArray ? repeatValidations : simpleValidations;

      // Set the initial response to be an error.
      var response = toValidationObject(
        false, validations.length ? 'type' : 'repeat', value, key
      );

      // Iterate over each value and test using type validation.
      validations.some(function (validation) {
        // Non-existant types should always be invalid.
        if (!types.hasOwnProperty(validation[0])) {
          return false;
        }

        // Check all the types match. If they don't, attempt another validation.
        var isType = values.every(function (value) {
          return types[validation[0]](value, key, object, configs);
        });

        // Skip to the next check if not all types match.
        if (!isType) {
          return false;
        }

        // When every value is the correct type, run the validation on each value
        // and break the loop if we get a failure.
        values.every(function (value) {
          return (response = validation[1](value, key, object)).valid;
        });

        // Always break the loop when the type was successful. If anything has
        // failed, `response` will have been set to the invalid object.
        return true;
      });

      return response;
    };
  };

  function isNativeType(typeName) {
    typeName = typeName.replace('[]', '');
    var nativeTypes = [
      'object',
      'string',
      'number',
      'integer',
      'boolean',
      'date-only',
      'time-only',
      'datetime-only',
      'datetime',
      'file',
      'array'
    ];
    return nativeTypes.indexOf(typeName) !== -1;
  }

  function convertType(config) {
    var newConfig = {};
    // Clone config object.
    Object.keys(config).forEach(function (key) {
      newConfig[key] = config[key];
    });

    if (Array.isArray(newConfig.type)) {
      newConfig.type = newConfig.type.map(function (aType) {
        var newType = aType.replace('[]', '');
        var parts = aType.split('|');
        if (parts.length > 1) {
          newType = 'union';
          newConfig.unionTypes = parts.map(function (part) {
            part = part.trim();
            return !isNativeType(part) ? 'object' : part;
          });
        } else {
          newType = !isNativeType(newType) ? 'object' : newType;
        }
        return newType;
      });
    }
    return newConfig;
  }

  var TYPES = {
    date:            isDate,
    'date-only':     isDate,
    'time-only':     isDate,
    'datetime-only': isDate,
    datetime:        isDate,
    number:          isNumber,
    integer:         isInteger,
    'boolean':       isBoolean,
    string:          isString,
    object:          isJSON,
    union:           isUnion,
    array:           isArray,
    file:            isFile
  };

  /**
   * Every time you require the module you're expected to call it as a function
   * to create a new instance. This is to ensure two modules can't make competing
   * changes with their own validation rules.
   *
   * @return {Function}
   */
  RAMLValidate = function () {
    /**
     * Return a validation function that validates a model based on the schema.
     *
     * @param  {Object}   schema
     * @return {Function}
     */
    var validate = function (schema) {
      var validations = {};

      // Convert all parameters into validation functions.
      Object.keys(schema).forEach(function (param) {
        var config = convertType(schema[param]);
        var rules  = validate.RULES;
        var types  = validate.TYPES;

        validations[param] = toValidation(config, rules, types);
      });

      /**
       * The function accepts an object to be validated. All rules are already
       * precompiled.
       *
       * @param  {Object}  model
       * @return {Boolean}
       */
      return function (model) {
        model = model || {};

        // Map all validations to their object and filter for failures.
        var errors = Object.keys(validations).map(function (param) {
          var value      = model[param];
          var validation = validations[param];

          // Return the validation result.
          return validation(value, param, model);
        }).filter(function (validation) {
          return !validation.valid;
        });

        return {
          valid:  errors.length === 0,
          errors: errors
        };
      };
    };

    /**
     * Provide validation of types.
     *
     * @type {Object}
     */
    validate.TYPES = TYPES;

    /**
     * Provide overridable validation of parameters.
     *
     * @type {Object}
     */
    validate.RULES = {
      minimum:   isMinimum,
      maximum:   isMaximum,
      minLength: isMinimumLength,
      maxLength: isMaximumLength,
      'enum':    isEnum,
      pattern:   isPattern,
      minItems:  hasMinimumItems,
      maxItems:  hasMaximumItems,
      uniqueItems: hasUniqueItems,
      fileTypes: isValidFileTypes
    };

    /**
     * Return the validate function.
     */
    return validate;
  };

  /**
   * Export the raml-validate for multiple environments.
   */
  if (typeof define === 'function' && define.amd) {
    define([], function () {
      return RAMLValidate;
    });
  } else if (typeof exports === 'object') {
    module.exports = RAMLValidate;
  } else {
    root.RAMLValidate = RAMLValidate;
  }
})(this);
