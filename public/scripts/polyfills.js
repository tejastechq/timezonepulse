/**
 * Browser polyfills and compatibility fixes
 * Helps ensure the application works in all browsers
 */
(function() {
  // Only run in browser
  if (typeof window === 'undefined') return;
  
  // Polyfill for Element.prototype.matches which older browsers might not support
  if (!Element.prototype.matches) {
    Element.prototype.matches = 
      Element.prototype.msMatchesSelector || 
      Element.prototype.webkitMatchesSelector;
  }
  
  // Polyfill for Element.prototype.closest
  if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
      var el = this;
      do {
        if (Element.prototype.matches.call(el, s)) return el;
        el = el.parentElement || el.parentNode;
      } while (el !== null && el.nodeType === 1);
      return null;
    };
  }
  
  // Polyfill for Object.fromEntries
  if (!Object.fromEntries) {
    Object.fromEntries = function(entries) {
      if (!entries || !entries[Symbol.iterator]) { 
        throw new Error('Object.fromEntries requires a single iterable argument');
      }
      
      var obj = {};
      for (var [key, value] of entries) {
        obj[key] = value;
      }
      
      return obj;
    };
  }
  
  // Polyfill for Array.prototype.flat
  if (!Array.prototype.flat) {
    Object.defineProperty(Array.prototype, 'flat', {
      configurable: true,
      writable: true,
      value: function() {
        var depth = isNaN(arguments[0]) ? 1 : Number(arguments[0]);
        
        return depth ? Array.prototype.reduce.call(this, function(acc, cur) {
          if (Array.isArray(cur)) {
            acc.push.apply(acc, Array.prototype.flat.call(cur, depth - 1));
          } else {
            acc.push(cur);
          }
          return acc;
        }, []) : Array.prototype.slice.call(this);
      }
    });
  }
  
  // Fix console.* methods for older IE
  if (!window.console) {
    window.console = {};
  }
  
  var consoleMethods = ['log', 'info', 'warn', 'error', 'debug', 'trace'];
  for (var i = 0; i < consoleMethods.length; i++) {
    var method = consoleMethods[i];
    if (!window.console[method]) {
      window.console[method] = function() {};
    }
  }
})(); 