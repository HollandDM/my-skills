#!/usr/bin/env node
var __defProp = Object.defineProperty;
var __export = (target, all3) => {
  for (var name in all3)
    __defProp(target, name, { get: all3[name], enumerable: true });
};

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Pipeable.js
var pipeArguments = (self, args2) => {
  switch (args2.length) {
    case 0:
      return self;
    case 1:
      return args2[0](self);
    case 2:
      return args2[1](args2[0](self));
    case 3:
      return args2[2](args2[1](args2[0](self)));
    case 4:
      return args2[3](args2[2](args2[1](args2[0](self))));
    case 5:
      return args2[4](args2[3](args2[2](args2[1](args2[0](self)))));
    case 6:
      return args2[5](args2[4](args2[3](args2[2](args2[1](args2[0](self))))));
    case 7:
      return args2[6](args2[5](args2[4](args2[3](args2[2](args2[1](args2[0](self)))))));
    case 8:
      return args2[7](args2[6](args2[5](args2[4](args2[3](args2[2](args2[1](args2[0](self))))))));
    case 9:
      return args2[8](args2[7](args2[6](args2[5](args2[4](args2[3](args2[2](args2[1](args2[0](self)))))))));
    default: {
      let ret = self;
      for (let i = 0, len = args2.length; i < len; i++) {
        ret = args2[i](ret);
      }
      return ret;
    }
  }
};
var Prototype = {
  pipe() {
    return pipeArguments(this, arguments);
  }
};
var Class = /* @__PURE__ */ (function() {
  function PipeableBase() {
  }
  PipeableBase.prototype = Prototype;
  return PipeableBase;
})();

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Function.js
var dual = function(arity, body) {
  if (typeof arity === "function") {
    return function() {
      return arity(arguments) ? body.apply(this, arguments) : (self) => body(self, ...arguments);
    };
  }
  switch (arity) {
    case 0:
    case 1:
      throw new RangeError(`Invalid arity ${arity}`);
    case 2:
      return function(a, b) {
        if (arguments.length >= 2) {
          return body(a, b);
        }
        return function(self) {
          return body(self, a);
        };
      };
    case 3:
      return function(a, b, c) {
        if (arguments.length >= 3) {
          return body(a, b, c);
        }
        return function(self) {
          return body(self, a, b);
        };
      };
    default:
      return function() {
        if (arguments.length >= arity) {
          return body.apply(this, arguments);
        }
        const args2 = arguments;
        return function(self) {
          return body(self, ...args2);
        };
      };
  }
};
var identity = (a) => a;
var constant = (value) => () => value;
var constTrue = /* @__PURE__ */ constant(true);
var constFalse = /* @__PURE__ */ constant(false);
var constUndefined = /* @__PURE__ */ constant(void 0);
var constVoid = constUndefined;
function pipe(a, ...args2) {
  return pipeArguments(a, args2);
}
function flow(ab, bc, cd, de, ef, fg, gh, hi, ij) {
  switch (arguments.length) {
    case 1:
      return ab;
    case 2:
      return function() {
        return bc(ab.apply(this, arguments));
      };
    case 3:
      return function() {
        return cd(bc(ab.apply(this, arguments)));
      };
    case 4:
      return function() {
        return de(cd(bc(ab.apply(this, arguments))));
      };
    case 5:
      return function() {
        return ef(de(cd(bc(ab.apply(this, arguments)))));
      };
    case 6:
      return function() {
        return fg(ef(de(cd(bc(ab.apply(this, arguments))))));
      };
    case 7:
      return function() {
        return gh(fg(ef(de(cd(bc(ab.apply(this, arguments)))))));
      };
    case 8:
      return function() {
        return hi(gh(fg(ef(de(cd(bc(ab.apply(this, arguments))))))));
      };
    case 9:
      return function() {
        return ij(hi(gh(fg(ef(de(cd(bc(ab.apply(this, arguments)))))))));
      };
  }
  return;
}
function memoize(f) {
  const cache = /* @__PURE__ */ new WeakMap();
  return (a) => {
    const cached4 = cache.get(a);
    if (cached4 !== void 0) return cached4;
    const result4 = f(a);
    cache.set(a, result4);
    return result4;
  };
}
function memoizeIdempotent(f) {
  const cache = /* @__PURE__ */ new WeakMap();
  return (a) => {
    const cached4 = cache.get(a);
    if (cached4 !== void 0) return cached4;
    const result4 = f(a);
    cache.set(a, result4);
    cache.set(result4, result4);
    return result4;
  };
}

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/internal/equal.js
var getAllObjectKeys = (obj) => {
  const keys2 = new Set(Reflect.ownKeys(obj));
  if (obj.constructor === Object) return keys2;
  if (obj instanceof Error) {
    keys2.delete("stack");
  }
  const proto = Object.getPrototypeOf(obj);
  let current = proto;
  while (current !== null && current !== Object.prototype) {
    const ownKeys = Reflect.ownKeys(current);
    for (let i = 0; i < ownKeys.length; i++) {
      keys2.add(ownKeys[i]);
    }
    current = Object.getPrototypeOf(current);
  }
  if (keys2.has("constructor") && typeof obj.constructor === "function" && proto === obj.constructor.prototype) {
    keys2.delete("constructor");
  }
  return keys2;
};
var byReferenceInstances = /* @__PURE__ */ new WeakSet();

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Predicate.js
function isString(input) {
  return typeof input === "string";
}
function isNumber(input) {
  return typeof input === "number";
}
function isFunction(input) {
  return typeof input === "function";
}
function isUndefined(input) {
  return input === void 0;
}
function isNotUndefined(input) {
  return input !== void 0;
}
function isNotNull(input) {
  return input !== null;
}
function isNullish(input) {
  return input === null || input === void 0;
}
function isNotNullish(input) {
  return input != null;
}
function isUnknown(_) {
  return true;
}
function isObjectKeyword(input) {
  return typeof input === "object" && input !== null || isFunction(input);
}
var hasProperty = /* @__PURE__ */ dual(2, (self, property) => isObjectKeyword(self) && property in self);
var isTagged = /* @__PURE__ */ dual(2, (self, tag2) => hasProperty(self, "_tag") && self["_tag"] === tag2);
function isIterable(input) {
  return hasProperty(input, Symbol.iterator) || isString(input);
}

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Hash.js
var symbol = "~effect/interfaces/Hash";
var hash = (self) => {
  switch (typeof self) {
    case "number":
      return number(self);
    case "bigint":
      return string(self.toString(10));
    case "boolean":
      return string(String(self));
    case "symbol":
      return string(String(self));
    case "string":
      return string(self);
    case "undefined":
      return string("undefined");
    case "function":
    case "object": {
      if (self === null) {
        return string("null");
      } else if (self instanceof Date) {
        if (Number.isNaN(self.getTime())) {
          return string("Invalid Date");
        }
        return string(self.toISOString());
      } else if (self instanceof RegExp) {
        return string(self.toString());
      } else {
        if (byReferenceInstances.has(self)) {
          return random(self);
        }
        if (hashCache.has(self)) {
          return hashCache.get(self);
        }
        const h = withVisitedTracking(self, () => {
          if (isHash(self)) {
            return self[symbol]();
          } else if (typeof self === "function") {
            return random(self);
          } else if (self instanceof DataView) {
            return array(new Uint8Array(self.buffer, self.byteOffset, self.byteLength));
          } else if (Array.isArray(self) || ArrayBuffer.isView(self)) {
            return array(self);
          } else if (self instanceof Map) {
            return hashMap(self);
          } else if (self instanceof Set) {
            return hashSet(self);
          }
          return structure(self);
        });
        hashCache.set(self, h);
        return h;
      }
    }
    default:
      throw new Error(`BUG: unhandled typeof ${typeof self} - please report an issue at https://github.com/Effect-TS/effect/issues`);
  }
};
var random = (self) => {
  if (!randomHashCache.has(self)) {
    randomHashCache.set(self, number(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)));
  }
  return randomHashCache.get(self);
};
var combine = /* @__PURE__ */ dual(2, (self, b) => self * 53 ^ b);
var optimize = (n) => n & 3221225471 | n >>> 1 & 1073741824;
var isHash = (u) => hasProperty(u, symbol);
var number = (n) => {
  if (n !== n) {
    return string("NaN");
  }
  if (n === Infinity) {
    return string("Infinity");
  }
  if (n === -Infinity) {
    return string("-Infinity");
  }
  let h = n | 0;
  if (h !== n) {
    h ^= n * 4294967295;
  }
  while (n > 4294967295) {
    h ^= n /= 4294967295;
  }
  return optimize(h);
};
var string = (str) => {
  let h = 5381, i = str.length;
  while (i) {
    h = h * 33 ^ str.charCodeAt(--i);
  }
  return optimize(h);
};
var structureKeys = (o, keys2) => {
  let h = 12289;
  for (const key of keys2) {
    h ^= combine(hash(key), hash(o[key]));
  }
  return optimize(h);
};
var structure = (o) => structureKeys(o, getAllObjectKeys(o));
var iterableWith = (seed, f) => (iter) => {
  let h = seed;
  for (const element of iter) {
    h ^= f(element);
  }
  return optimize(h);
};
var array = /* @__PURE__ */ iterableWith(6151, hash);
var hashMap = /* @__PURE__ */ iterableWith(/* @__PURE__ */ string("Map"), ([k, v]) => combine(hash(k), hash(v)));
var hashSet = /* @__PURE__ */ iterableWith(/* @__PURE__ */ string("Set"), hash);
var randomHashCache = /* @__PURE__ */ new WeakMap();
var hashCache = /* @__PURE__ */ new WeakMap();
var visitedObjects = /* @__PURE__ */ new WeakSet();
function withVisitedTracking(obj, fn3) {
  if (visitedObjects.has(obj)) {
    return string("[Circular]");
  }
  visitedObjects.add(obj);
  const result4 = fn3();
  visitedObjects.delete(obj);
  return result4;
}

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Equal.js
var symbol2 = "~effect/interfaces/Equal";
function equals() {
  if (arguments.length === 1) {
    return (self) => compareBoth(self, arguments[0]);
  }
  return compareBoth(arguments[0], arguments[1]);
}
function compareBoth(self, that) {
  if (self === that) return true;
  if (self == null || that == null) return false;
  const selfType = typeof self;
  if (selfType !== typeof that) {
    return false;
  }
  if (selfType === "number" && self !== self && that !== that) {
    return true;
  }
  if (selfType !== "object" && selfType !== "function") {
    return false;
  }
  if (byReferenceInstances.has(self) || byReferenceInstances.has(that)) {
    return false;
  }
  return withCache(self, that, compareObjects);
}
function withVisitedTracking2(self, that, fn3) {
  const hasLeft = visitedLeft.has(self);
  const hasRight = visitedRight.has(that);
  if (hasLeft && hasRight) {
    return true;
  }
  if (hasLeft || hasRight) {
    return false;
  }
  visitedLeft.add(self);
  visitedRight.add(that);
  const result4 = fn3();
  visitedLeft.delete(self);
  visitedRight.delete(that);
  return result4;
}
var visitedLeft = /* @__PURE__ */ new WeakSet();
var visitedRight = /* @__PURE__ */ new WeakSet();
function compareObjects(self, that) {
  if (hash(self) !== hash(that)) {
    return false;
  } else if (self instanceof Date) {
    if (!(that instanceof Date)) return false;
    const selfTime = self.getTime();
    const thatTime = that.getTime();
    return selfTime === thatTime || Number.isNaN(selfTime) && Number.isNaN(thatTime);
  } else if (self instanceof RegExp) {
    if (!(that instanceof RegExp)) return false;
    return self.toString() === that.toString();
  }
  const selfIsEqual = isEqual(self);
  const thatIsEqual = isEqual(that);
  if (selfIsEqual !== thatIsEqual) return false;
  const bothEquals = selfIsEqual && thatIsEqual;
  if (typeof self === "function" && !bothEquals) {
    return false;
  }
  return withVisitedTracking2(self, that, () => {
    if (bothEquals) {
      return self[symbol2](that);
    } else if (Array.isArray(self)) {
      if (!Array.isArray(that) || self.length !== that.length) {
        return false;
      }
      return compareArrays(self, that);
    } else if (ArrayBuffer.isView(self)) {
      const selfIsDataView = self instanceof DataView;
      if (!ArrayBuffer.isView(that) || self.byteLength !== that.byteLength || selfIsDataView !== that instanceof DataView) {
        return false;
      }
      if (selfIsDataView) {
        const thatDataView = that;
        return compareTypedArrays(new Uint8Array(self.buffer, self.byteOffset, self.byteLength), new Uint8Array(thatDataView.buffer, thatDataView.byteOffset, thatDataView.byteLength));
      }
      return compareTypedArrays(self, that);
    } else if (self instanceof Map) {
      if (!(that instanceof Map) || self.size !== that.size) {
        return false;
      }
      return compareMaps(self, that);
    } else if (self instanceof Set) {
      if (!(that instanceof Set) || self.size !== that.size) {
        return false;
      }
      return compareSets(self, that);
    }
    return compareRecords(self, that);
  });
}
function withCache(self, that, f) {
  let selfMap = equalityCache.get(self);
  if (!selfMap) {
    selfMap = /* @__PURE__ */ new WeakMap();
    equalityCache.set(self, selfMap);
  } else if (selfMap.has(that)) {
    return selfMap.get(that);
  }
  const result4 = f(self, that);
  selfMap.set(that, result4);
  let thatMap = equalityCache.get(that);
  if (!thatMap) {
    thatMap = /* @__PURE__ */ new WeakMap();
    equalityCache.set(that, thatMap);
  }
  thatMap.set(self, result4);
  return result4;
}
var equalityCache = /* @__PURE__ */ new WeakMap();
function compareArrays(self, that) {
  for (let i = 0; i < self.length; i++) {
    if (!compareBoth(self[i], that[i])) {
      return false;
    }
  }
  return true;
}
function compareTypedArrays(self, that) {
  if (self.length !== that.length) {
    return false;
  }
  for (let i = 0; i < self.length; i++) {
    if (self[i] !== that[i]) {
      return false;
    }
  }
  return true;
}
function compareRecords(self, that) {
  const selfKeys = getAllObjectKeys(self);
  const thatKeys = getAllObjectKeys(that);
  if (selfKeys.size !== thatKeys.size) {
    return false;
  }
  for (const key of selfKeys) {
    if (!thatKeys.has(key) || !compareBoth(self[key], that[key])) {
      return false;
    }
  }
  return true;
}
function makeCompareMap(keyEquivalence, valueEquivalence) {
  return function compareMaps2(self, that) {
    const thatEntries = Array.from(that);
    for (const [selfKey, selfValue] of self) {
      let found = false;
      for (let i = 0; i < thatEntries.length; i++) {
        const [thatKey, thatValue] = thatEntries[i];
        if (keyEquivalence(selfKey, thatKey) && valueEquivalence(selfValue, thatValue)) {
          thatEntries[i] = thatEntries[thatEntries.length - 1];
          thatEntries.pop();
          found = true;
          break;
        }
      }
      if (!found) {
        return false;
      }
    }
    return true;
  };
}
var compareMaps = /* @__PURE__ */ makeCompareMap(compareBoth, compareBoth);
function makeCompareSet(equivalence) {
  return function compareSets2(self, that) {
    const thatValues = Array.from(that);
    for (const selfValue of self) {
      let found = false;
      for (let i = 0; i < thatValues.length; i++) {
        const thatValue = thatValues[i];
        if (equivalence(selfValue, thatValue)) {
          thatValues[i] = thatValues[thatValues.length - 1];
          thatValues.pop();
          found = true;
          break;
        }
      }
      if (!found) {
        return false;
      }
    }
    return true;
  };
}
var compareSets = /* @__PURE__ */ makeCompareSet(compareBoth);
var isEqual = (u) => hasProperty(u, symbol2);
var byReferenceUnsafe = (obj) => {
  byReferenceInstances.add(obj);
  return obj;
};

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/internal/array.js
var isArrayNonEmpty = (self) => self.length > 0;

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/internal/doNotation.js
var let_ = (map9) => dual(3, (self, name, f) => map9(self, (a) => ({
  ...a,
  [name]: f(a)
})));
var bindTo = (map9) => dual(2, (self, name) => map9(self, (a) => ({
  [name]: a
})));
var bind = (map9, flatMap7) => dual(3, (self, name, f) => flatMap7(self, (a) => map9(f(a), (b) => ({
  ...a,
  [name]: b
}))));

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/internal/record.js
function assignProperty(self, key, value) {
  if (key === "__proto__") {
    Object.defineProperty(self, key, {
      value,
      writable: true,
      enumerable: true,
      configurable: true
    });
  } else {
    ;
    self[key] = value;
  }
}
function assignProperties(self, source) {
  for (const key of Reflect.ownKeys(source)) {
    if (Object.prototype.propertyIsEnumerable.call(source, key)) {
      assignProperty(self, key, source[key]);
    }
  }
}

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Redactable.js
var symbolRedactable = /* @__PURE__ */ Symbol.for("~effect/Redactable");
var isRedactable = (u) => hasProperty(u, symbolRedactable);
function redact(u) {
  if (isRedactable(u)) return getRedacted(u);
  return u;
}
function getRedacted(redactable) {
  return redactable[symbolRedactable](globalThis[currentFiberTypeId]?.context ?? emptyContext);
}
var currentFiberTypeId = "~effect/Fiber/currentFiber";
var emptyMap = /* @__PURE__ */ new Map();
var emptyContext = {
  "~effect/Context": {},
  base: emptyMap,
  depth: 0,
  mapUnsafe: emptyMap,
  pipe() {
    return pipeArguments(this, arguments);
  }
};

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Formatter.js
function format(input, options) {
  const space = options?.space ?? 0;
  const ancestors = /* @__PURE__ */ new WeakSet();
  const gap = !space ? "" : typeof space === "number" ? " ".repeat(space) : space;
  const ind = (d) => gap.repeat(d);
  const wrap = (v, body) => {
    const ctor = v?.constructor;
    return ctor && ctor !== Object.prototype.constructor && ctor.name ? `${ctor.name}(${body})` : body;
  };
  const ownKeys = (o) => {
    try {
      return Reflect.ownKeys(o);
    } catch {
      return ["[ownKeys threw]"];
    }
  };
  function recur(v, d = 0) {
    if (typeof v === "string") return JSON.stringify(v);
    if (typeof v === "number" || v == null || typeof v === "boolean" || typeof v === "symbol") return String(v);
    if (typeof v === "bigint") return String(v) + "n";
    if (typeof v === "object" || typeof v === "function") {
      if (ancestors.has(v)) return CIRCULAR;
      ancestors.add(v);
      let output;
      if (symbolRedactable in v) {
        output = recur(getRedacted(v), d);
      } else if (Array.isArray(v)) {
        output = !gap || v.length <= 1 ? `[${v.map((x) => recur(x, d)).join(",")}]` : `[
${ind(d + 1)}${v.map((x) => recur(x, d + 1)).join(",\n" + ind(d + 1))}
${ind(d)}]`;
      } else if (v instanceof Date) {
        output = formatDate(v);
      } else if (!options?.ignoreToString && hasProperty(v, "toString") && typeof v["toString"] === "function" && v["toString"] !== Object.prototype.toString && v["toString"] !== Array.prototype.toString) {
        const s2 = safeToString(v);
        output = v instanceof Error && v.cause ? `${s2} (cause: ${recur(v.cause, d)})` : s2;
      } else if (Symbol.iterator in v) {
        output = `${v.constructor.name}(${recur(Array.from(v), d)})`;
      } else {
        const keys2 = ownKeys(v);
        if (!gap || keys2.length <= 1) {
          const body = `{${keys2.map((k) => `${formatPropertyKey(k)}:${recur(v[k], d)}`).join(",")}}`;
          output = wrap(v, body);
        } else {
          const body = `{
${keys2.map((k) => `${ind(d + 1)}${formatPropertyKey(k)}: ${recur(v[k], d + 1)}`).join(",\n")}
${ind(d)}}`;
          output = wrap(v, body);
        }
      }
      ancestors.delete(v);
      return output;
    }
    return String(v);
  }
  return recur(input, 0);
}
var CIRCULAR = "[Circular]";
function formatPropertyKey(name) {
  return typeof name === "string" ? JSON.stringify(name) : String(name);
}
function formatPath(path) {
  return path.map((key) => `[${formatPropertyKey(key)}]`).join("");
}
function formatDate(date) {
  try {
    return date.toISOString();
  } catch {
    return "Invalid Date";
  }
}
function safeToString(input) {
  try {
    const s2 = input.toString();
    return typeof s2 === "string" ? s2 : String(s2);
  } catch {
    return "[toString threw]";
  }
}
function formatJson(input, options) {
  const ancestors = [];
  return JSON.stringify(input, function(key, value) {
    const original = Object.getOwnPropertyDescriptor(this, key)?.value;
    const redacted = hasProperty(original, symbolRedactable) ? redact(original) : redact(value);
    if (typeof redacted === "bigint") {
      return format(redacted);
    }
    if (typeof redacted !== "object" || redacted === null) {
      return redacted;
    }
    while (ancestors.length > 0 && ancestors[ancestors.length - 1] !== this) {
      ancestors.pop();
    }
    if (ancestors.includes(redacted)) {
      return void 0;
    }
    ancestors.push(redacted);
    return redacted;
  }, options?.space) ?? "null";
}

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Inspectable.js
var NodeInspectSymbol = /* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom");
var toJson = (input) => {
  try {
    input = redact(input);
    if (hasProperty(input, "toJSON") && isFunction(input["toJSON"]) && input["toJSON"].length === 0) {
      return input.toJSON();
    } else if (Array.isArray(input)) {
      return input.map(toJson);
    }
    return input;
  } catch {
    return "[toJSON threw]";
  }
};
var toStringUnknown = (u, whitespace = 2) => {
  if (typeof u === "string") {
    return u;
  }
  try {
    return typeof u === "object" ? formatJson(u, {
      space: whitespace
    }) : format(u, {
      space: whitespace
    });
  } catch {
    return String(u);
  }
};
var BaseProto = {
  toJSON() {
    return toJson(this);
  },
  [NodeInspectSymbol]() {
    return this.toJSON();
  },
  toString() {
    return format(this.toJSON());
  }
};
var Class2 = class {
  /**
   * Node.js custom inspection method.
   *
   * **When to use**
   *
   * Use to expose the class JSON representation to Node.js inspection.
   *
   * @since 2.0.0
   */
  [NodeInspectSymbol]() {
    return this.toJSON();
  }
  /**
   * Returns a formatted string representation of this object.
   *
   * **When to use**
   *
   * Use to format the class JSON representation as a string.
   *
   * @since 2.0.0
   */
  toString() {
    return format(this.toJSON());
  }
};

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Utils.js
var SingleShotGen = class _SingleShotGen {
  called = false;
  self;
  constructor(self) {
    this.self = self;
  }
  /**
   * Yields the stored value once, then completes with the value sent back in.
   *
   * **When to use**
   *
   * Use to advance a `SingleShotGen` through its single yield and completion
   * step.
   *
   * @since 2.0.0
   */
  next(a) {
    return this.called ? {
      value: a,
      done: true
    } : (this.called = true, {
      value: this.self,
      done: false
    });
  }
  /**
   * Creates a fresh single-shot iterator over the stored value.
   *
   * **When to use**
   *
   * Use to iterate the wrapped value again without reusing the consumed
   * iterator state.
   *
   * @since 2.0.0
   */
  [Symbol.iterator]() {
    return new _SingleShotGen(this.self);
  }
};
var pickInternalCall = () => {
  const InternalTypeId = "~effect/Utils/internal";
  const standard = {
    [InternalTypeId]: (body) => {
      return body();
    }
  };
  const forced = {
    [InternalTypeId]: (body) => {
      try {
        return body();
      } finally {
      }
    }
  };
  const isNotOptimizedAway = standard[InternalTypeId](() => new Error().stack)?.includes(InternalTypeId) === true;
  return isNotOptimizedAway ? standard[InternalTypeId] : forced[InternalTypeId];
};
var internalCall = /* @__PURE__ */ pickInternalCall();

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/internal/core.js
var EffectTypeId = `~effect/Effect`;
var ExitTypeId = `~effect/Exit`;
var effectVariance = {
  _A: identity,
  _E: identity,
  _R: identity
};
var identifier = `${EffectTypeId}/identifier`;
var args = `${EffectTypeId}/args`;
var evaluate = `${EffectTypeId}/evaluate`;
var contA = `${EffectTypeId}/successCont`;
var contE = `${EffectTypeId}/failureCont`;
var contAll = `${EffectTypeId}/ensureCont`;
var Yield = /* @__PURE__ */ Symbol.for("effect/Effect/Yield");
var PipeInspectableProto = {
  pipe() {
    return pipeArguments(this, arguments);
  },
  toJSON() {
    return {
      ...this
    };
  },
  toString() {
    return format(this.toJSON(), {
      ignoreToString: true,
      space: 2
    });
  },
  [NodeInspectSymbol]() {
    return this.toJSON();
  }
};
var StructuralProto = {
  [symbol]() {
    return structureKeys(this, Object.keys(this));
  },
  [symbol2](that) {
    const selfKeys = Object.keys(this);
    const thatKeys = Object.keys(that);
    if (selfKeys.length !== thatKeys.length) return false;
    for (let i = 0; i < selfKeys.length; i++) {
      if (selfKeys[i] !== thatKeys[i] || !equals(this[selfKeys[i]], that[selfKeys[i]])) {
        return false;
      }
    }
    return true;
  }
};
var EffectProto = {
  [EffectTypeId]: effectVariance,
  ...PipeInspectableProto,
  [Symbol.iterator]() {
    return new SingleShotGen(this);
  },
  toJSON() {
    return {
      _id: "Effect",
      op: this[identifier],
      ...args in this ? {
        args: this[args]
      } : void 0
    };
  }
};
var isEffect = (u) => hasProperty(u, EffectTypeId);
var isExit = (u) => hasProperty(u, ExitTypeId);
var CauseTypeId = "~effect/Cause";
var CauseReasonTypeId = "~effect/Cause/Reason";
var isCause = (self) => hasProperty(self, CauseTypeId);
var CauseImpl = class {
  [CauseTypeId];
  reasons;
  constructor(failures) {
    this[CauseTypeId] = CauseTypeId;
    this.reasons = failures;
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
  toJSON() {
    return {
      _id: "Cause",
      failures: this.reasons.map((f) => f.toJSON())
    };
  }
  toString() {
    return `Cause(${format(this.reasons)})`;
  }
  [NodeInspectSymbol]() {
    return this.toJSON();
  }
  [symbol2](that) {
    return isCause(that) && this.reasons.length === that.reasons.length && this.reasons.every((e, i) => equals(e, that.reasons[i]));
  }
  [symbol]() {
    return array(this.reasons);
  }
};
var annotationsMap = /* @__PURE__ */ new WeakMap();
var ReasonBase = class {
  [CauseReasonTypeId];
  annotations;
  _tag;
  constructor(_tag, annotations, originalError) {
    this[CauseReasonTypeId] = CauseReasonTypeId;
    this._tag = _tag;
    if (annotations !== constEmptyAnnotations && typeof originalError === "object" && originalError !== null && annotations.size > 0) {
      const prevAnnotations = annotationsMap.get(originalError);
      if (prevAnnotations) {
        annotations = new Map([...prevAnnotations, ...annotations]);
      }
      annotationsMap.set(originalError, annotations);
    }
    this.annotations = annotations;
  }
  annotate(annotations, options) {
    if (annotations.mapUnsafe.size === 0) return this;
    const newAnnotations = new Map(this.annotations);
    annotations.mapUnsafe.forEach((value, key) => {
      if (options?.overwrite !== true && newAnnotations.has(key)) return;
      newAnnotations.set(key, value);
    });
    const self = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
    self.annotations = newAnnotations;
    return self;
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
  toString() {
    return format(this);
  }
  [NodeInspectSymbol]() {
    return this.toString();
  }
};
var constEmptyAnnotations = /* @__PURE__ */ new Map();
var Fail = class extends ReasonBase {
  error;
  constructor(error, annotations = constEmptyAnnotations) {
    super("Fail", annotations, error);
    this.error = error;
  }
  toString() {
    return `Fail(${format(this.error)})`;
  }
  toJSON() {
    return {
      _tag: "Fail",
      error: this.error
    };
  }
  [symbol2](that) {
    return isFailReason(that) && equals(this.error, that.error) && equals(this.annotations, that.annotations);
  }
  [symbol]() {
    return combine(string(this._tag))(combine(hash(this.error))(hash(this.annotations)));
  }
};
var causeFromReasons = (reasons) => new CauseImpl(reasons);
var causeEmpty = /* @__PURE__ */ new CauseImpl([]);
var causeFail = (error) => new CauseImpl([new Fail(error)]);
var Die = class extends ReasonBase {
  defect;
  constructor(defect, annotations = constEmptyAnnotations) {
    super("Die", annotations, defect);
    this.defect = defect;
  }
  toString() {
    return `Die(${format(this.defect)})`;
  }
  toJSON() {
    return {
      _tag: "Die",
      defect: this.defect
    };
  }
  [symbol2](that) {
    return isDieReason(that) && equals(this.defect, that.defect) && equals(this.annotations, that.annotations);
  }
  [symbol]() {
    return combine(string(this._tag))(combine(hash(this.defect))(hash(this.annotations)));
  }
};
var causeDie = (defect) => new CauseImpl([new Die(defect)]);
var causeAnnotate = /* @__PURE__ */ dual((args2) => isCause(args2[0]), (self, annotations, options) => {
  if (annotations.mapUnsafe.size === 0) return self;
  return new CauseImpl(self.reasons.map((f) => f.annotate(annotations, options)));
});
var isFailReason = (self) => self._tag === "Fail";
var isDieReason = (self) => self._tag === "Die";
var isInterruptReason = (self) => self._tag === "Interrupt";
function defaultEvaluate(_fiber) {
  return exitDie(`Effect.evaluate: Not implemented`);
}
var makePrimitiveProto = (options) => ({
  ...EffectProto,
  [identifier]: options.op,
  [evaluate]: options[evaluate] ?? defaultEvaluate,
  [contA]: options[contA],
  [contE]: options[contE],
  [contAll]: options[contAll]
});
var makePrimitive = (options) => {
  const Proto4 = makePrimitiveProto(options);
  return function() {
    const self = Object.create(Proto4);
    self[args] = options.single === false ? arguments : arguments[0];
    return self;
  };
};
var makeExit = (options) => {
  const Proto4 = {
    [ExitTypeId]: ExitTypeId,
    _tag: options.op,
    get [options.prop]() {
      return this[args];
    },
    ...makePrimitiveProto(options),
    toString() {
      return `${options.op}(${format(this[args])})`;
    },
    toJSON() {
      return {
        _id: "Exit",
        _tag: options.op,
        [options.prop]: this[args]
      };
    },
    [symbol2](that) {
      return isExit(that) && that._tag === this._tag && equals(this[args], that[args]);
    },
    [symbol]() {
      return combine(string(options.op), hash(this[args]));
    }
  };
  return function(value) {
    const self = Object.create(Proto4);
    self[args] = value;
    return self;
  };
};
var exitSucceed = /* @__PURE__ */ makeExit({
  op: "Success",
  prop: "value",
  [evaluate](fiber3) {
    const cont = fiber3.getCont(contA);
    return cont ? cont[contA](this[args], fiber3, this) : fiber3.yieldWith(this);
  }
});
var StackTraceKey = {
  key: "effect/Cause/StackTrace"
};
var InterruptorStackTrace = {
  key: "effect/Cause/InterruptorStackTrace"
};
var exitFailCause = /* @__PURE__ */ makeExit({
  op: "Failure",
  prop: "cause",
  [evaluate](fiber3) {
    let cause = this[args];
    let annotated = false;
    if (fiber3.currentStackFrame) {
      cause = causeAnnotate(cause, {
        mapUnsafe: /* @__PURE__ */ new Map([[StackTraceKey.key, fiber3.currentStackFrame]])
      });
      annotated = true;
    }
    let cont = fiber3.getCont(contE);
    while (fiber3.interruptible && fiber3._interruptedCause && cont) {
      cont = fiber3.getCont(contE);
    }
    return cont ? cont[contE](cause, fiber3, annotated ? void 0 : this) : fiber3.yieldWith(annotated ? exitFailCause(cause) : this);
  }
});
var exitFail = (e) => exitFailCause(causeFail(e));
var exitDie = (defect) => exitFailCause(causeDie(defect));
var withFiber = /* @__PURE__ */ makePrimitive({
  op: "WithFiber",
  [evaluate](fiber3) {
    return this[args](fiber3);
  }
});
var YieldableError = /* @__PURE__ */ (function() {
  class YieldableError2 extends globalThis.Error {
  }
  const proto = /* @__PURE__ */ makePrimitiveProto({
    op: "YieldableError",
    [evaluate]() {
      return exitFail(this);
    }
  });
  delete proto.toString;
  Object.assign(YieldableError2.prototype, proto);
  return YieldableError2;
})();
var Error2 = /* @__PURE__ */ (function() {
  const plainArgsSymbol = /* @__PURE__ */ Symbol.for("effect/Data/Error/plainArgs");
  return class Base extends YieldableError {
    constructor(args2) {
      super(args2?.message, args2?.cause ? {
        cause: args2.cause
      } : void 0);
      if (args2) {
        assignProperties(this, args2);
        Object.defineProperty(this, plainArgsSymbol, {
          value: args2,
          enumerable: false
        });
      }
    }
    toJSON() {
      return {
        ...this[plainArgsSymbol],
        ...this
      };
    }
  };
})();
var TaggedError = (tag2) => {
  class Base3 extends Error2 {
    _tag = tag2;
  }
  ;
  Base3.prototype.name = tag2;
  return Base3;
};
var NoSuchElementErrorTypeId = "~effect/Cause/NoSuchElementError";
var isNoSuchElementError = (u) => hasProperty(u, NoSuchElementErrorTypeId);
var NoSuchElementError = class extends (/* @__PURE__ */ TaggedError("NoSuchElementError")) {
  [NoSuchElementErrorTypeId] = NoSuchElementErrorTypeId;
  constructor(message) {
    super({
      message
    });
  }
};
var DoneTypeId = "~effect/Cause/Done";
var isDone = (u) => hasProperty(u, DoneTypeId);
var DoneVoid = {
  [DoneTypeId]: DoneTypeId,
  _tag: "Done",
  value: void 0
};
var Done = (value) => {
  if (value === void 0) return DoneVoid;
  return {
    [DoneTypeId]: DoneTypeId,
    _tag: "Done",
    value
  };
};
var doneVoid = /* @__PURE__ */ exitFail(DoneVoid);
var done = (value) => {
  if (value === void 0) return doneVoid;
  return exitFail(Done(value));
};

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/internal/option.js
var TypeId = "~effect/data/Option";
var CommonProto = {
  [TypeId]: {
    _A: (_) => _
  },
  ...PipeInspectableProto,
  [Symbol.iterator]() {
    return new SingleShotGen(this);
  }
};
var SomeProto = /* @__PURE__ */ Object.defineProperty(/* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(CommonProto), {
  _tag: "Some",
  _op: "Some",
  [symbol2](that) {
    return isOption(that) && isSome(that) && equals(this.value, that.value);
  },
  [symbol]() {
    return combine(hash(this._tag))(hash(this.value));
  },
  toString() {
    return `some(${format(this.value)})`;
  },
  toJSON() {
    return {
      _id: "Option",
      _tag: this._tag,
      value: toJson(this.value)
    };
  }
}), "valueOrUndefined", {
  get() {
    return this.value;
  }
});
var NoneHash = /* @__PURE__ */ hash("None");
var NoneProto = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(CommonProto), {
  _tag: "None",
  _op: "None",
  valueOrUndefined: void 0,
  [symbol2](that) {
    return isOption(that) && isNone(that);
  },
  [symbol]() {
    return NoneHash;
  },
  toString() {
    return `none()`;
  },
  toJSON() {
    return {
      _id: "Option",
      _tag: this._tag
    };
  }
});
var isOption = (input) => hasProperty(input, TypeId);
var isNone = (fa) => fa._tag === "None";
var isSome = (fa) => fa._tag === "Some";
var none = /* @__PURE__ */ Object.create(NoneProto);
var some = (value) => {
  const a = Object.create(SomeProto);
  a.value = value;
  return a;
};

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/internal/result.js
var TypeId2 = "~effect/data/Result";
var CommonProto2 = {
  [TypeId2]: {
    /* v8 ignore next 2 */
    _A: (_) => _,
    _E: (_) => _
  },
  ...PipeInspectableProto,
  [Symbol.iterator]() {
    return new SingleShotGen(this);
  }
};
var SuccessProto = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(CommonProto2), {
  _tag: "Success",
  _op: "Success",
  [symbol2](that) {
    return isResult(that) && isSuccess(that) && equals(this.success, that.success);
  },
  [symbol]() {
    return combine(hash(this._tag))(hash(this.success));
  },
  toString() {
    return `success(${format(this.success)})`;
  },
  toJSON() {
    return {
      _id: "Result",
      _tag: this._tag,
      value: toJson(this.success)
    };
  }
});
var FailureProto = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(CommonProto2), {
  _tag: "Failure",
  _op: "Failure",
  [symbol2](that) {
    return isResult(that) && isFailure(that) && equals(this.failure, that.failure);
  },
  [symbol]() {
    return combine(hash(this._tag))(hash(this.failure));
  },
  toString() {
    return `failure(${format(this.failure)})`;
  },
  toJSON() {
    return {
      _id: "Result",
      _tag: this._tag,
      failure: toJson(this.failure)
    };
  }
});
var isResult = (input) => hasProperty(input, TypeId2);
var isFailure = (result4) => result4._tag === "Failure";
var isSuccess = (result4) => result4._tag === "Success";
var fail = (failure) => {
  const a = Object.create(FailureProto);
  a.failure = failure;
  return a;
};
var succeed = (success) => {
  const a = Object.create(SuccessProto);
  a.success = success;
  return a;
};

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Order.js
function make(compare) {
  return (self, that) => self === that ? 0 : compare(self, that);
}
var Number2 = /* @__PURE__ */ make((self, that) => {
  if (globalThis.Number.isNaN(self) && globalThis.Number.isNaN(that)) return 0;
  if (globalThis.Number.isNaN(self)) return -1;
  if (globalThis.Number.isNaN(that)) return 1;
  return self < that ? -1 : 1;
});
var mapInput = /* @__PURE__ */ dual(2, (self, f) => make((b1, b2) => self(f(b1), f(b2))));
var isGreaterThan = (O) => dual(2, (self, that) => O(self, that) === 1);

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Option.js
var none2 = () => none;
var some2 = some;
var isOption2 = isOption;
var isNone2 = isNone;
var isSome2 = isSome;
var match = /* @__PURE__ */ dual(2, (self, {
  onNone,
  onSome: onSome2
}) => isNone2(self) ? onNone() : onSome2(self.value));
var getOrElse = /* @__PURE__ */ dual(2, (self, onNone) => isNone2(self) ? onNone() : self.value);
var fromNullishOr = (a) => a == null ? none2() : some2(a);
var fromUndefinedOr = (a) => a === void 0 ? none2() : some2(a);
var getOrUndefined = /* @__PURE__ */ getOrElse(constUndefined);
var getOrThrowWith = /* @__PURE__ */ dual(2, (self, onNone) => {
  if (isSome2(self)) {
    return self.value;
  }
  throw onNone();
});
var getOrThrow = /* @__PURE__ */ getOrThrowWith(() => new Error("getOrThrow called on a None"));
var map = /* @__PURE__ */ dual(2, (self, f) => isNone2(self) ? none2() : some2(f(self.value)));
var flatMap = /* @__PURE__ */ dual(2, (self, f) => isNone2(self) ? none2() : f(self.value));
var filter = /* @__PURE__ */ dual(2, (self, predicate) => isNone2(self) ? none2() : predicate(self.value) ? some2(self.value) : none2());

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Result.js
var succeed2 = succeed;
var fail2 = fail;
var isFailure2 = isFailure;
var isSuccess2 = isSuccess;
var match2 = /* @__PURE__ */ dual(2, (self, {
  onFailure,
  onSuccess
}) => isFailure2(self) ? onFailure(self.failure) : onSuccess(self.success));

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Iterable.js
var makeBy = (f, options) => {
  const max2 = options?.length !== void 0 ? Math.max(1, Math.floor(options.length)) : Infinity;
  return {
    [Symbol.iterator]() {
      let i = 0;
      return {
        next() {
          if (i < max2) {
            return {
              value: f(i++),
              done: false
            };
          }
          return {
            done: true,
            value: void 0
          };
        }
      };
    }
  };
};
var repeat = /* @__PURE__ */ dual(2, (self, n) => flatten(makeBy(() => self, {
  length: n
})));
var forever = (self) => repeat(self, Infinity);
var headUnsafe = (self) => {
  const iterator = self[Symbol.iterator]();
  const result4 = iterator.next();
  if (result4.done) throw new Error("headUnsafe: empty iterable");
  return result4.value;
};
var flatten = (self) => ({
  [Symbol.iterator]() {
    const outerIterator = self[Symbol.iterator]();
    let innerIterator;
    function next() {
      while (true) {
        if (innerIterator === void 0) {
          const next2 = outerIterator.next();
          if (next2.done) {
            return next2;
          }
          innerIterator = next2.value[Symbol.iterator]();
        }
        const result4 = innerIterator.next();
        if (!result4.done) {
          return result4;
        }
        innerIterator = void 0;
      }
    }
    return {
      next
    };
  }
});
var filter2 = /* @__PURE__ */ dual(2, (self, predicate) => ({
  [Symbol.iterator]() {
    const iterator = self[Symbol.iterator]();
    let i = 0;
    return {
      next() {
        let result4 = iterator.next();
        while (!result4.done) {
          if (predicate(result4.value, i++)) {
            return {
              done: false,
              value: result4.value
            };
          }
          result4 = iterator.next();
        }
        return {
          done: true,
          value: void 0
        };
      }
    };
  }
}));

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Array.js
var Array2 = globalThis.Array;
var makeBy2 = /* @__PURE__ */ dual(2, (n, f) => {
  const max2 = Math.max(1, Math.floor(n));
  const out2 = new Array2(max2);
  for (let i = 0; i < max2; i++) {
    out2[i] = f(i);
  }
  return out2;
});
var range = (start, end3) => start <= end3 ? makeBy2(end3 - start + 1, (i) => start + i) : [start];
var fromIterable = (collection) => Array2.isArray(collection) ? collection : Array2.from(collection);
var append = /* @__PURE__ */ dual(2, (self, last) => [...self, last]);
var appendAll = /* @__PURE__ */ dual(2, (self, that) => fromIterable(self).concat(fromIterable(that)));
var isArray = Array2.isArray;
var isArrayNonEmpty2 = isArrayNonEmpty;
var isReadonlyArrayNonEmpty = isArrayNonEmpty;
function isOutOfBounds(i, as3) {
  return !Number.isFinite(i) || i < 0 || i >= as3.length;
}
var getUnsafe = /* @__PURE__ */ dual(2, (self, index) => {
  const i = Math.floor(index);
  if (isOutOfBounds(i, self)) {
    throw new Error(`Index out of bounds: ${i}`);
  }
  return self[i];
});
var lastNonEmpty = (self) => self[self.length - 1];
var hashBucketsAdd = (buckets, value) => {
  const hash2 = hash(value);
  const bucket = buckets.get(hash2);
  if (bucket === void 0) {
    buckets.set(hash2, [value]);
    return true;
  }
  for (const previous of bucket) {
    if (equals(previous, value)) {
      return false;
    }
  }
  bucket.push(value);
  return true;
};
var union = /* @__PURE__ */ dual(2, (self, that) => {
  const a = fromIterable(self);
  const b = fromIterable(that);
  if (isReadonlyArrayNonEmpty(a)) {
    return isReadonlyArrayNonEmpty(b) ? dedupe(appendAll(a, b)) : a;
  }
  return b;
});
var empty = () => [];
var of = (a) => [a];
var map2 = /* @__PURE__ */ dual(2, (self, f) => self.map(f));
var filter3 = /* @__PURE__ */ dual(2, (self, predicate) => {
  const as3 = fromIterable(self);
  const out2 = [];
  for (let i = 0; i < as3.length; i++) {
    if (predicate(as3[i], i)) {
      out2.push(as3[i]);
    }
  }
  return out2;
});
var partition = /* @__PURE__ */ dual(2, (self, f) => {
  const excluded = [];
  const satisfying = [];
  let i = 0;
  for (const a of self) {
    const result4 = f(a, i++);
    if (isSuccess2(result4)) {
      satisfying.push(result4.success);
    } else {
      excluded.push(result4.failure);
    }
  }
  return [excluded, satisfying];
});
var dedupe = (self) => {
  const input = fromIterable(self);
  if (input.length < 2) {
    return [...input];
  }
  const buckets = /* @__PURE__ */ new Map();
  const out2 = [];
  for (const value of input) {
    if (hashBucketsAdd(buckets, value)) {
      out2.push(value);
    }
  }
  return out2;
};

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Context.js
var Context_exports = {};
__export(Context_exports, {
  Reference: () => Reference,
  Service: () => Service,
  ServiceTypeId: () => ServiceTypeId,
  add: () => add,
  addOrOmit: () => addOrOmit,
  addUnsafe: () => addUnsafe,
  empty: () => empty2,
  get: () => get,
  getOption: () => getOption,
  getOrElse: () => getOrElse2,
  getOrUndefined: () => getOrUndefined2,
  getOrUndefinedUnsafe: () => getOrUndefinedUnsafe,
  getUnsafe: () => getUnsafe2,
  hasSameCache: () => hasSameCache,
  isContext: () => isContext,
  isKey: () => isKey,
  isReference: () => isReference,
  make: () => make2,
  makeUnsafe: () => makeUnsafe,
  merge: () => merge,
  mergeAll: () => mergeAll,
  omit: () => omit,
  pick: () => pick
});

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Effectable.js
var Prototype2 = (options) => makePrimitiveProto({
  op: options.label,
  [evaluate]: options.evaluate
});

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Context.js
var ServiceTypeId = "~effect/Context/Service";
var Service = function() {
  function KeyClass() {
  }
  const self = KeyClass;
  Object.setPrototypeOf(self, ServiceProto);
  const init = (key, options) => {
    self.key = key;
    if (options?.defaultValue) {
      self[ReferenceTypeId] = ReferenceTypeId;
      self.defaultValue = options.defaultValue;
    }
    if (options?.make) {
      ;
      self.make = options.make;
    }
    if (options?.fiberCached) {
      cacheKeys.add(key);
    }
    return self;
  };
  return arguments.length > 0 ? init(arguments[0], arguments[1]) : init;
};
var ServiceProto = {
  [ServiceTypeId]: ServiceTypeId,
  .../* @__PURE__ */ Prototype2({
    label: "Service",
    evaluate(fiber3) {
      return exitSucceed(get(fiber3.context, this));
    }
  }),
  toJSON() {
    return {
      _id: "Service",
      key: this.key
    };
  },
  of(self) {
    return self;
  },
  context(self) {
    return make2(this, self);
  },
  use(f) {
    return withFiber((fiber3) => f(get(fiber3.context, this)));
  },
  useSync(f) {
    return withFiber((fiber3) => exitSucceed(f(get(fiber3.context, this))));
  }
};
var cacheKeys = /* @__PURE__ */ new Set();
var ReferenceTypeId = "~effect/Context/Reference";
var TypeId3 = "~effect/Context";
var MaxDepth = 8;
var FlattenAfterBaseHits = 8;
var makeImpl = (cacheRoot, base, overlay, depth) => {
  const self = Object.create(Proto);
  self.cacheRoot = cacheRoot ?? self;
  self.base = base;
  self.overlay = overlay;
  self.depth = depth;
  self._flat = void 0;
  self.baseHits = 0;
  return self;
};
var applyOverlays = (map9, overlay) => {
  if (!overlay) return;
  applyOverlays(map9, overlay.parent);
  map9.set(overlay.key, overlay.value);
};
var flatten2 = (self) => {
  if (self._flat) return self._flat;
  if (!self.overlay) return self._flat = self.base;
  const map9 = new Map(self.base);
  applyOverlays(map9, self.overlay);
  return self._flat = map9;
};
var withFlat = (self, f) => {
  const map9 = new Map(self.mapUnsafe);
  f(map9);
  return makeUnsafe(map9);
};
var notFound = /* @__PURE__ */ Symbol();
var lookup = (self, key) => {
  const impl = self;
  for (let overlay = impl.overlay; overlay; overlay = overlay.parent) {
    if (overlay.key === key) return overlay.value;
  }
  const value = impl.base.get(key);
  if (value === void 0 && !impl.base.has(key)) return notFound;
  if (impl.overlay && ++impl.baseHits >= FlattenAfterBaseHits) {
    impl.base = flatten2(impl);
    impl.overlay = void 0;
    impl.depth = 0;
  }
  return value;
};
var makeUnsafe = (mapUnsafe) => makeImpl(void 0, mapUnsafe, void 0, 0);
var Proto = {
  get mapUnsafe() {
    return flatten2(this);
  },
  ...PipeInspectableProto,
  [TypeId3]: {
    _Services: (_) => _
  },
  toJSON() {
    return {
      _id: "Context",
      services: Array.from(this.mapUnsafe).map(([key, value]) => ({
        key,
        value
      }))
    };
  },
  [symbol2](that) {
    if (!isContext(that)) return false;
    const self = this.mapUnsafe;
    const other = that.mapUnsafe;
    if (self.size !== other.size) return false;
    for (const [key, value] of self) {
      if (!other.has(key) || !equals(value, other.get(key))) return false;
    }
    return true;
  },
  [symbol]() {
    return number(this.mapUnsafe.size);
  }
};
var hasSameCache = (self, that) => self.cacheRoot === that.cacheRoot;
var isContext = (u) => hasProperty(u, TypeId3);
var isKey = (u) => hasProperty(u, ServiceTypeId);
var isReference = (u) => !!u[ReferenceTypeId];
var empty2 = () => emptyContext2;
var emptyContext2 = /* @__PURE__ */ makeUnsafe(/* @__PURE__ */ new Map());
var make2 = (key, service4) => makeUnsafe(/* @__PURE__ */ new Map([[key.key, service4]]));
var add = /* @__PURE__ */ dual(3, (self, key, service4) => addUnsafe(self, key.key, service4));
var addUnsafe = (self, key, service4) => {
  const impl = self;
  const cacheRoot = cacheKeys.has(key) ? void 0 : impl.cacheRoot;
  if (impl.depth >= MaxDepth) {
    const map9 = new Map(impl.mapUnsafe);
    map9.set(key, service4);
    return makeImpl(cacheRoot, map9, void 0, 0);
  }
  return makeImpl(cacheRoot, impl.base, {
    key,
    value: service4,
    parent: impl.overlay
  }, impl.depth + 1);
};
var addOrOmit = /* @__PURE__ */ dual(3, (self, key, service4) => service4._tag === "None" ? omit(key)(self) : add(self, key, service4.value));
var getOrElse2 = /* @__PURE__ */ dual(3, (self, key, orElse) => {
  const value = lookup(self, key.key);
  if (value !== notFound) return value;
  return isReference(key) ? getDefaultValue(key) : orElse();
});
var getOrUndefined2 = /* @__PURE__ */ dual(2, (self, key) => getOrUndefinedUnsafe(self, key.key));
var getOrUndefinedUnsafe = (self, key) => {
  const value = lookup(self, key);
  return value === notFound ? void 0 : value;
};
var getUnsafe2 = /* @__PURE__ */ dual(2, (self, service4) => {
  const value = lookup(self, service4.key);
  if (value === notFound) {
    if (isReference(service4)) return getDefaultValue(service4);
    throw serviceNotFoundError(service4);
  }
  return value;
});
var get = getUnsafe2;
var defaultValueCacheKey = "~effect/Context/defaultValue";
var getDefaultValue = (ref) => {
  if (defaultValueCacheKey in ref) {
    return ref[defaultValueCacheKey];
  }
  return ref[defaultValueCacheKey] = ref.defaultValue();
};
var serviceNotFoundError = (service4) => {
  const error = new Error(`Service not found${service4.key ? `: ${String(service4.key)}` : ""}`);
  if (error.stack) {
    const lines = error.stack.split("\n");
    lines.splice(1, 3);
    error.stack = lines.join("\n");
  }
  return error;
};
var getOption = /* @__PURE__ */ dual(2, (self, service4) => {
  const value = lookup(self, service4.key);
  if (value !== notFound) return some2(value);
  return isReference(service4) ? some2(getDefaultValue(service4)) : none2();
});
var merge = /* @__PURE__ */ dual(2, (self, that) => {
  if (self.mapUnsafe.size === 0) return that;
  if (that.mapUnsafe.size === 0) return self;
  return withFlat(self, (map9) => that.mapUnsafe.forEach((value, key) => map9.set(key, value)));
});
var mergeAll = (...ctxs) => {
  const map9 = /* @__PURE__ */ new Map();
  for (let i = 0; i < ctxs.length; i++) {
    ctxs[i].mapUnsafe.forEach((value, key) => {
      map9.set(key, value);
    });
  }
  return makeUnsafe(map9);
};
var pick = (...services) => (self) => {
  const keep = new Set(services.map((key) => key.key));
  return withFlat(self, (map9) => map9.forEach((_, key) => {
    if (!keep.has(key)) map9.delete(key);
  }));
};
var omit = (...keys2) => (self) => withFlat(self, (map9) => {
  for (let i = 0; i < keys2.length; i++) {
    map9.delete(keys2[i].key);
  }
});
var Reference = Service;

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Duration.js
var TypeId4 = "~effect/time/Duration";
var bigint0 = /* @__PURE__ */ BigInt(0);
var bigint1 = /* @__PURE__ */ BigInt(1);
var bigint2 = /* @__PURE__ */ BigInt(2);
var bigint10 = /* @__PURE__ */ BigInt(10);
var bigint1e3 = /* @__PURE__ */ BigInt(1e3);
var roundTiesAwayFromZero = (input) => BigInt(input < 0 ? Math.ceil(input - 0.5) : Math.floor(input + 0.5));
var roundMillisToNanos = (millis2) => roundTiesAwayFromZero(millis2 * 1e6);
var parseNanos = (input, scale) => {
  const decimalIndex = input.indexOf(".");
  if (decimalIndex === -1) return BigInt(input) * scale;
  const isNegative = input[0] === "-";
  const fractional = input.slice(decimalIndex + 1);
  const fractionalScale = bigint10 ** BigInt(fractional.length);
  const scaled = (BigInt(input.slice(isNegative ? 1 : 0, decimalIndex)) * fractionalScale + BigInt(fractional)) * scale;
  const rounded = scaled / fractionalScale + (scaled % fractionalScale * bigint2 >= fractionalScale ? bigint1 : bigint0);
  return isNegative ? -rounded : rounded;
};
var DURATION_REGEXP = /^(-?\d+(?:\.\d+)?)\s+(nanos?|micros?|millis?|seconds?|minutes?|hours?|days?|weeks?)$/;
var fromInputUnsafe = (input) => {
  switch (typeof input) {
    case "number":
      return millis(input);
    case "bigint":
      return nanos(input);
    case "string": {
      if (input === "Infinity") {
        return infinity;
      }
      if (input === "-Infinity") {
        return negativeInfinity;
      }
      const match7 = DURATION_REGEXP.exec(input);
      if (!match7) break;
      const [_, valueStr, unit] = match7;
      if (unit === "nano" || unit === "nanos") {
        return nanos(parseNanos(valueStr, bigint1));
      }
      if (unit === "micro" || unit === "micros") {
        return nanos(parseNanos(valueStr, bigint1e3));
      }
      const value = Number(valueStr);
      switch (unit) {
        case "milli":
        case "millis":
          return millis(value);
        case "second":
        case "seconds":
          return seconds(value);
        case "minute":
        case "minutes":
          return minutes(value);
        case "hour":
        case "hours":
          return hours(value);
        case "day":
        case "days":
          return days(value);
        case "week":
        case "weeks":
          return weeks(value);
      }
      break;
    }
    case "object": {
      if (input === null) break;
      if (TypeId4 in input) return input;
      if (Array.isArray(input)) {
        if (input.length !== 2 || !input.every(isNumber)) {
          return invalid(input);
        }
        if (Number.isNaN(input[0]) || Number.isNaN(input[1])) {
          return zero;
        }
        if (input[0] === -Infinity || input[1] === -Infinity) {
          return negativeInfinity;
        }
        if (input[0] === Infinity || input[1] === Infinity) {
          return infinity;
        }
        return make3(roundTiesAwayFromZero(input[0] * 1e9 + input[1]));
      }
      const obj = input;
      let millis2 = 0;
      if (obj.weeks) millis2 += obj.weeks * 6048e5;
      if (obj.days) millis2 += obj.days * 864e5;
      if (obj.hours) millis2 += obj.hours * 36e5;
      if (obj.minutes) millis2 += obj.minutes * 6e4;
      if (obj.seconds) millis2 += obj.seconds * 1e3;
      if (obj.milliseconds) millis2 += obj.milliseconds;
      if (!obj.microseconds && !obj.nanoseconds) return make3(millis2);
      return make3(roundTiesAwayFromZero(millis2 * 1e6 + (obj.microseconds ?? 0) * 1e3 + (obj.nanoseconds ?? 0)));
    }
  }
  return invalid(input);
};
var invalid = (input) => {
  throw new Error(`Invalid Input: ${input}`);
};
var zeroDurationValue = {
  _tag: "Millis",
  millis: 0
};
var infinityDurationValue = {
  _tag: "Infinity"
};
var negativeInfinityDurationValue = {
  _tag: "NegativeInfinity"
};
var DurationProto = {
  [TypeId4]: TypeId4,
  [symbol]() {
    switch (this.value._tag) {
      case "Millis": {
        const nanos2 = this.value.millis * 1e6;
        return Number.isFinite(nanos2) ? hash(roundTiesAwayFromZero(nanos2)) : number(this.value.millis);
      }
      case "Nanos":
        return hash(this.value.nanos);
      default:
        return structure(this.value);
    }
  },
  [symbol2](that) {
    return isDuration(that) && equals2(this, that);
  },
  toString() {
    switch (this.value._tag) {
      case "Infinity":
        return "Infinity";
      case "NegativeInfinity":
        return "-Infinity";
      case "Nanos":
        return `${this.value.nanos} nanos`;
      case "Millis":
        return `${this.value.millis} millis`;
    }
  },
  toJSON() {
    switch (this.value._tag) {
      case "Millis":
        return {
          _id: "Duration",
          _tag: "Millis",
          millis: this.value.millis
        };
      case "Nanos":
        return {
          _id: "Duration",
          _tag: "Nanos",
          nanos: String(this.value.nanos)
        };
      case "Infinity":
        return {
          _id: "Duration",
          _tag: "Infinity"
        };
      case "NegativeInfinity":
        return {
          _id: "Duration",
          _tag: "NegativeInfinity"
        };
    }
  },
  [NodeInspectSymbol]() {
    return this.toJSON();
  },
  pipe() {
    return pipeArguments(this, arguments);
  }
};
var make3 = (input) => {
  const duration = Object.create(DurationProto);
  if (typeof input === "number") {
    if (isNaN(input) || input === 0 || Object.is(input, -0)) {
      duration.value = zeroDurationValue;
    } else if (!Number.isFinite(input)) {
      duration.value = input > 0 ? infinityDurationValue : negativeInfinityDurationValue;
    } else if (!Number.isInteger(input)) {
      duration.value = {
        _tag: "Nanos",
        nanos: roundMillisToNanos(input)
      };
    } else {
      duration.value = {
        _tag: "Millis",
        millis: input
      };
    }
  } else if (input === bigint0) {
    duration.value = zeroDurationValue;
  } else {
    duration.value = {
      _tag: "Nanos",
      nanos: input
    };
  }
  return duration;
};
var isDuration = (u) => hasProperty(u, TypeId4);
var isFinite = (self) => self.value._tag !== "Infinity" && self.value._tag !== "NegativeInfinity";
var isZero = (self) => {
  switch (self.value._tag) {
    case "Millis":
      return self.value.millis === 0;
    case "Nanos":
      return self.value.nanos === bigint0;
    case "Infinity":
    case "NegativeInfinity":
      return false;
  }
};
var zero = /* @__PURE__ */ make3(0);
var infinity = /* @__PURE__ */ make3(Infinity);
var negativeInfinity = /* @__PURE__ */ make3(-Infinity);
var nanos = (nanos2) => make3(nanos2);
var millis = (millis2) => make3(millis2);
var seconds = (seconds2) => make3(seconds2 * 1e3);
var minutes = (minutes2) => make3(minutes2 * 6e4);
var hours = (hours2) => make3(hours2 * 36e5);
var days = (days2) => make3(days2 * 864e5);
var weeks = (weeks2) => make3(weeks2 * 6048e5);
var toMillis = (self) => match3(fromInputUnsafe(self), {
  onMillis: identity,
  onNanos: (nanos2) => Number(nanos2) / 1e6,
  onInfinity: () => Infinity,
  onNegativeInfinity: () => -Infinity
});
var toNanosUnsafe = (input) => {
  const self = fromInputUnsafe(input);
  switch (self.value._tag) {
    case "Infinity":
    case "NegativeInfinity":
      throw new Error("Cannot convert infinite duration to nanos");
    case "Nanos":
      return self.value.nanos;
    case "Millis":
      return roundMillisToNanos(self.value.millis);
  }
};
var match3 = /* @__PURE__ */ dual(2, (self, options) => {
  switch (self.value._tag) {
    case "Millis":
      return options.onMillis(self.value.millis);
    case "Nanos":
      return options.onNanos(self.value.nanos);
    case "Infinity":
      return options.onInfinity();
    case "NegativeInfinity":
      return (options.onNegativeInfinity ?? options.onInfinity)();
  }
});
var matchPair = /* @__PURE__ */ dual(3, (self, that, options) => {
  if (self.value._tag === "Infinity" || self.value._tag === "NegativeInfinity" || that.value._tag === "Infinity" || that.value._tag === "NegativeInfinity") return options.onInfinity(self, that);
  if (self.value._tag === "Millis") {
    return that.value._tag === "Millis" ? options.onMillis(self.value.millis, that.value.millis) : options.onNanos(toNanosUnsafe(self), that.value.nanos);
  } else {
    return options.onNanos(self.value.nanos, toNanosUnsafe(that));
  }
});
var Equivalence = (self, that) => matchPair(self, that, {
  onMillis: (self2, that2) => self2 === that2,
  onNanos: (self2, that2) => self2 === that2,
  onInfinity: (self2, that2) => self2.value._tag === that2.value._tag
});
var subtract = /* @__PURE__ */ dual(2, (self, that) => matchPair(self, that, {
  onMillis: (self2, that2) => make3(self2 - that2),
  onNanos: (self2, that2) => make3(self2 - that2),
  onInfinity: (self2, that2) => {
    const s2 = self2.value._tag;
    const t = that2.value._tag;
    if (s2 === "Infinity") return t === "Infinity" ? zero : infinity;
    if (s2 === "NegativeInfinity") return t === "NegativeInfinity" ? zero : negativeInfinity;
    return t === "Infinity" ? negativeInfinity : infinity;
  }
}));
var equals2 = /* @__PURE__ */ dual(2, (self, that) => Equivalence(self, that));

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Scheduler.js
var Scheduler = /* @__PURE__ */ Reference("effect/Scheduler", {
  fiberCached: true,
  defaultValue: () => new MixedScheduler()
});
var setImmediate = "setImmediate" in globalThis ? (f) => {
  const timer = globalThis.setImmediate(f);
  return () => globalThis.clearImmediate(timer);
} : (f) => {
  const timer = setTimeout(f, 0);
  return () => clearTimeout(timer);
};
var setMicrotask = (f) => {
  let cancelled = false;
  Promise.resolve().then(() => {
    if (!cancelled) f();
  });
  return () => {
    cancelled = true;
  };
};
var PriorityBuckets = class {
  buckets = [];
  scheduleTask(task, priority) {
    const buckets = this.buckets;
    const len = buckets.length;
    let bucket;
    let index = 0;
    for (; index < len; index++) {
      if (buckets[index][0] > priority) break;
      bucket = buckets[index];
    }
    if (bucket && bucket[0] === priority) {
      bucket[1].push(task);
    } else if (index === len) {
      buckets.push([priority, [task]]);
    } else {
      buckets.splice(index, 0, [priority, [task]]);
    }
  }
  drain() {
    const buckets = this.buckets;
    this.buckets = [];
    return buckets;
  }
};
var MixedScheduler = class {
  executionMode;
  setImmediate;
  constructor(executionMode = "async", setImmediateFn) {
    this.executionMode = executionMode;
    this.setImmediate = setImmediateFn ?? (executionMode === "sync" ? setMicrotask : setImmediate);
  }
  /**
   * Returns whether the fiber has reached its operation budget and should yield.
   *
   * **When to use**
   *
   * Use to decide whether a fiber should yield after consuming its current
   * operation budget.
   *
   * @since 2.0.0
   */
  shouldYield(fiber3) {
    return fiber3.currentOpCount >= fiber3.maxOpsBeforeYield;
  }
  /**
   * Creates a dispatcher that schedules work through this scheduler.
   *
   * **When to use**
   *
   * Use when you need a standalone dispatcher from a scheduler instance, for
   * example in tests that enqueue tasks and then flush them deterministically.
   *
   * @since 4.0.0
   */
  makeDispatcher() {
    return new MixedSchedulerDispatcher(this.setImmediate);
  }
};
var MixedSchedulerDispatcher = class {
  tasks = /* @__PURE__ */ new PriorityBuckets();
  running = void 0;
  setImmediate;
  constructor(setImmediateFn = setImmediate) {
    this.setImmediate = setImmediateFn;
  }
  /**
   * @since 2.0.0
   */
  scheduleTask(task, priority) {
    this.tasks.scheduleTask(task, priority);
    if (this.running === void 0) {
      this.running = this.setImmediate(this.afterScheduled);
    }
  }
  /**
   * @since 2.0.0
   */
  afterScheduled = () => {
    this.running = void 0;
    this.runTasks();
  };
  /**
   * @since 2.0.0
   */
  runTasks() {
    const buckets = this.tasks.drain();
    for (let i = 0; i < buckets.length; i++) {
      const toRun = buckets[i][1];
      for (let j = 0; j < toRun.length; j++) {
        toRun[j]();
      }
    }
  }
  /**
   * @since 2.0.0
   */
  flush() {
    while (this.tasks.buckets.length > 0) {
      if (this.running !== void 0) {
        this.running();
        this.running = void 0;
      }
      this.runTasks();
    }
  }
};
var MaxOpsBeforeYield = /* @__PURE__ */ Reference("effect/Scheduler/MaxOpsBeforeYield", {
  fiberCached: true,
  defaultValue: () => 2048
});
var PreventSchedulerYield = /* @__PURE__ */ Reference("effect/Scheduler/PreventSchedulerYield", {
  fiberCached: true,
  defaultValue: () => false
});

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Data.js
var Data_exports = {};
__export(Data_exports, {
  Class: () => Class3,
  Error: () => Error3,
  TaggedClass: () => TaggedClass,
  TaggedError: () => TaggedError2,
  taggedEnum: () => taggedEnum
});
var Class3 = class extends Class {
  constructor(props) {
    super();
    if (props) {
      assignProperties(this, props);
    }
  }
};
var TaggedClass = (tag2) => class extends Class3 {
  _tag = tag2;
};
var taggedEnum = () => new Proxy({}, {
  get(_target, tag2, _receiver) {
    if (tag2 === "$is") {
      return isTagged;
    } else if (tag2 === "$match") {
      return taggedMatch;
    }
    return (props) => ({
      ...props,
      _tag: tag2
    });
  }
});
function taggedMatch() {
  if (arguments.length === 1) {
    const cases2 = arguments[0];
    return function(value2) {
      return cases2[value2._tag](value2);
    };
  }
  const value = arguments[0];
  const cases = arguments[1];
  return cases[value._tag](value);
}
var Error3 = Error2;
var TaggedError2 = TaggedError;

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Encoding.js
var EncodingErrorTypeId = "~effect/encoding/EncodingError";
var EncodingError = class extends (/* @__PURE__ */ TaggedError2("EncodingError")) {
  /**
   * Marks this value as an encoding or decoding error for runtime guards.
   *
   * **When to use**
   *
   * Use to identify `EncodingError` instances through `isEncodingError`.
   *
   * @since 4.0.0
   */
  [EncodingErrorTypeId] = EncodingErrorTypeId;
};
var encodeBase64 = (input) => typeof input === "string" ? base64EncodeUint8Array(encoder.encode(input)) : base64EncodeUint8Array(input);
var decodeBase64 = (str) => {
  const stripped = stripCrlf(str);
  const length = stripped.length;
  if (length % 4 !== 0) {
    return fail2(new EncodingError({
      kind: "Decode",
      module: "Base64",
      input: stripped,
      message: `Length must be a multiple of 4, but is ${length}`
    }));
  }
  const index = stripped.indexOf("=");
  if (index !== -1 && (index < length - 2 || index === length - 2 && stripped[length - 1] !== "=")) {
    return fail2(new EncodingError({
      kind: "Decode",
      module: "Base64",
      input: stripped,
      message: `Found a '=' character, but it is not at the end`
    }));
  }
  try {
    const missingOctets = stripped.endsWith("==") ? 2 : stripped.endsWith("=") ? 1 : 0;
    const result4 = new Uint8Array(3 * (length / 4) - missingOctets);
    for (let i = 0, j = 0; i < length; i += 4, j += 3) {
      const buffer3 = getBase64Code(stripped.charCodeAt(i)) << 18 | getBase64Code(stripped.charCodeAt(i + 1)) << 12 | getBase64Code(stripped.charCodeAt(i + 2)) << 6 | getBase64Code(stripped.charCodeAt(i + 3));
      result4[j] = buffer3 >> 16;
      result4[j + 1] = buffer3 >> 8 & 255;
      result4[j + 2] = buffer3 & 255;
    }
    return succeed2(result4);
  } catch (e) {
    return fail2(new EncodingError({
      kind: "Decode",
      module: "Base64",
      input: stripped,
      message: e instanceof Error ? e.message : "Invalid input"
    }));
  }
};
var randomHex = (length) => {
  let result4 = "";
  for (let i = length >>> 3; i > 0; i--) {
    const word = Math.random() * 4294967296 >>> 0;
    result4 += byteToHex[word >>> 24] + byteToHex[word >>> 16 & 255] + byteToHex[word >>> 8 & 255] + byteToHex[word & 255];
  }
  return result4;
};
var encoder = /* @__PURE__ */ new TextEncoder();
var stripCrlf = (str) => str.replace(/[\n\r]/g, "");
var base64EncodeUint8Array = (bytes) => {
  const length = bytes.length;
  let result4 = "";
  let i;
  for (i = 2; i < length; i += 3) {
    result4 += base64abc[bytes[i - 2] >> 2];
    result4 += base64abc[(bytes[i - 2] & 3) << 4 | bytes[i - 1] >> 4];
    result4 += base64abc[(bytes[i - 1] & 15) << 2 | bytes[i] >> 6];
    result4 += base64abc[bytes[i] & 63];
  }
  if (i === length + 1) {
    result4 += base64abc[bytes[i - 2] >> 2];
    result4 += base64abc[(bytes[i - 2] & 3) << 4];
    result4 += "==";
  }
  if (i === length) {
    result4 += base64abc[bytes[i - 2] >> 2];
    result4 += base64abc[(bytes[i - 2] & 3) << 4 | bytes[i - 1] >> 4];
    result4 += base64abc[(bytes[i - 1] & 15) << 2];
    result4 += "=";
  }
  return result4;
};
function getBase64Code(charCode) {
  if (charCode >= base64codes.length) {
    throw new TypeError(`Invalid character ${String.fromCharCode(charCode)}`);
  }
  const code = base64codes[charCode];
  if (code === 255) {
    throw new TypeError(`Invalid character ${String.fromCharCode(charCode)}`);
  }
  return code;
}
var base64abc = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "+", "/"];
var base64codes = [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 62, 255, 255, 255, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 255, 255, 255, 0, 255, 255, 255, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 255, 255, 255, 255, 255, 255, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51];
var byteToHex = [];
for (let i = 0; i < 256; i++) {
  byteToHex.push(i.toString(16).padStart(2, "0"));
}

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Tracer.js
var ParentSpanKey = "effect/Tracer/ParentSpan";
var ParentSpan = class extends (/* @__PURE__ */ Service()(ParentSpanKey, {
  fiberCached: true
})) {
};
var make4 = (options) => options;
var DisablePropagation = /* @__PURE__ */ Reference("effect/Tracer/DisablePropagation", {
  defaultValue: constFalse
});
var CurrentTraceLevel = /* @__PURE__ */ Reference("effect/Tracer/CurrentTraceLevel", {
  defaultValue: () => "Info"
});
var MinimumTraceLevel = /* @__PURE__ */ Reference("effect/Tracer/MinimumTraceLevel", {
  defaultValue: () => "All"
});
var TracerKey = "effect/Tracer";
var Tracer = /* @__PURE__ */ Reference(TracerKey, {
  fiberCached: true,
  defaultValue: () => make4({
    span: (options) => new NativeSpan(options)
  })
});
var NativeSpan = class {
  _tag = "Span";
  spanId;
  traceId = "native";
  sampled;
  name;
  parent;
  annotations;
  links;
  startTime;
  kind;
  status;
  attributes;
  events = [];
  constructor(options) {
    this.name = options.name;
    this.parent = options.parent;
    this.annotations = options.annotations;
    this.links = options.links;
    this.startTime = options.startTime;
    this.kind = options.kind;
    this.sampled = options.sampled;
    this.status = {
      _tag: "Started",
      startTime: options.startTime
    };
    this.attributes = /* @__PURE__ */ new Map();
    this.traceId = getOrUndefined(options.parent)?.traceId ?? randomHex(32);
    this.spanId = randomHex(16);
  }
  end(endTime, exit3) {
    this.status = {
      _tag: "Ended",
      endTime,
      exit: exit3,
      startTime: this.status.startTime
    };
  }
  attribute(key, value) {
    this.attributes.set(key, value);
  }
  event(name, startTime, attributes) {
    this.events.push([name, startTime, attributes ?? {}]);
  }
  addLinks(links) {
    this.links.push(...links);
  }
};

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/internal/metric.js
var FiberRuntimeMetricsKey = "effect/observability/Metric/FiberRuntimeMetricsKey";

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/internal/references.js
var CurrentErrorReporters = /* @__PURE__ */ Reference("effect/ErrorReporter/CurrentErrorReporters", {
  defaultValue: () => /* @__PURE__ */ new Set()
});
var CurrentStackFrame = /* @__PURE__ */ Reference("effect/References/CurrentStackFrame", {
  fiberCached: true,
  defaultValue: constUndefined
});
var TracerEnabled = /* @__PURE__ */ Reference("effect/References/TracerEnabled", {
  defaultValue: constTrue
});
var TracerTimingEnabled = /* @__PURE__ */ Reference("effect/References/TracerTimingEnabled", {
  defaultValue: constTrue
});
var TracerSpanAnnotations = /* @__PURE__ */ Reference("effect/References/TracerSpanAnnotations", {
  defaultValue: () => ({})
});
var TracerSpanLinks = /* @__PURE__ */ Reference("effect/References/TracerSpanLinks", {
  defaultValue: () => []
});
var CurrentLogAnnotations = /* @__PURE__ */ Reference("effect/References/CurrentLogAnnotations", {
  defaultValue: () => ({})
});
var CurrentLogLevel = /* @__PURE__ */ Reference("effect/References/CurrentLogLevel", {
  fiberCached: true,
  defaultValue: () => "Info"
});
var MinimumLogLevel = /* @__PURE__ */ Reference("effect/References/MinimumLogLevel", {
  fiberCached: true,
  defaultValue: () => "Info"
});
var CurrentLogSpans = /* @__PURE__ */ Reference("effect/References/CurrentLogSpans", {
  defaultValue: () => []
});

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/internal/stackTraceLimit.js
var isStackTraceLimitWritable = () => {
  const desc = Object.getOwnPropertyDescriptor(Error, "stackTraceLimit");
  if (desc === void 0) {
    return Object.isExtensible(Error);
  }
  return Object.hasOwn(desc, "writable") ? desc.writable === true : desc.set !== void 0;
};
var canWriteStackTraceLimit = /* @__PURE__ */ isStackTraceLimitWritable();
var getStackTraceLimit = () => Error.stackTraceLimit;
var setStackTraceLimit = (value) => {
  if (canWriteStackTraceLimit) {
    ;
    Error.stackTraceLimit = value;
  }
};

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/internal/tracer.js
var addSpanStackTrace = (options) => {
  if (options?.captureStackTrace === false) {
    return options;
  } else if (options?.captureStackTrace !== void 0 && typeof options.captureStackTrace !== "boolean") {
    return options;
  }
  const limit = getStackTraceLimit();
  setStackTraceLimit(3);
  const traceError = new Error();
  setStackTraceLimit(limit);
  return {
    ...options,
    captureStackTrace: spanCleaner(() => traceError.stack)
  };
};
var makeStackCleaner = (line) => (stack) => {
  let cache;
  return () => {
    if (cache !== void 0) return cache;
    const trace = stack();
    if (!trace) return void 0;
    const lines = trace.split("\n");
    if (lines[line] !== void 0) {
      cache = lines[line].trim();
      return cache;
    }
  };
};
var spanCleaner = /* @__PURE__ */ makeStackCleaner(3);

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/internal/effect.js
var Interrupt = class extends ReasonBase {
  fiberId;
  constructor(fiberId3, annotations = constEmptyAnnotations) {
    super("Interrupt", annotations, "Interrupted");
    this.fiberId = fiberId3;
  }
  toString() {
    return `Interrupt(${this.fiberId})`;
  }
  toJSON() {
    return {
      _tag: "Interrupt",
      fiberId: this.fiberId
    };
  }
  [symbol2](that) {
    return isInterruptReason(that) && this.fiberId === that.fiberId && this.annotations === that.annotations;
  }
  [symbol]() {
    return combine(string(`${this._tag}:${this.fiberId}`))(random(this.annotations));
  }
};
var causeInterrupt = (fiberId3) => new CauseImpl([new Interrupt(fiberId3)]);
var hasFails = (self) => self.reasons.some(isFailReason);
var findFail = (self) => {
  const reason = self.reasons.find(isFailReason);
  return reason ? succeed2(reason) : fail2(self);
};
var findError = (self) => {
  for (let i = 0; i < self.reasons.length; i++) {
    const reason = self.reasons[i];
    if (reason._tag === "Fail") {
      return succeed2(reason.error);
    }
  }
  return fail2(self);
};
var hasDies = (self) => self.reasons.some(isDieReason);
var findDefect = (self) => {
  const reason = self.reasons.find(isDieReason);
  return reason ? succeed2(reason.defect) : fail2(self);
};
var hasInterrupts = (self) => self.reasons.some(isInterruptReason);
var causeFilterInterruptors = (self) => {
  let interruptors;
  for (let i = 0; i < self.reasons.length; i++) {
    const f = self.reasons[i];
    if (f._tag !== "Interrupt") continue;
    interruptors ??= /* @__PURE__ */ new Set();
    if (f.fiberId !== void 0) {
      interruptors.add(f.fiberId);
    }
  }
  return interruptors ? succeed2(interruptors) : fail2(self);
};
var hasInterruptsOnly = (self) => self.reasons.length > 0 && self.reasons.every(isInterruptReason);
var causeCombine = /* @__PURE__ */ dual(2, (self, that) => {
  if (self.reasons.length === 0) {
    return that;
  } else if (that.reasons.length === 0) {
    return self;
  }
  const newCause = new CauseImpl(union(self.reasons, that.reasons));
  return equals(self, newCause) ? self : newCause;
});
var causeMap = /* @__PURE__ */ dual(2, (self, f) => {
  let hasFail = false;
  const failures = self.reasons.map((failure) => {
    if (isFailReason(failure)) {
      hasFail = true;
      return new Fail(f(failure.error), failure.annotations);
    }
    return failure;
  });
  return hasFail ? causeFromReasons(failures) : self;
});
var causePartition = (self) => {
  const obj = {
    Fail: [],
    Die: [],
    Interrupt: []
  };
  for (let i = 0; i < self.reasons.length; i++) {
    obj[self.reasons[i]._tag].push(self.reasons[i]);
  }
  return obj;
};
var causeSquash = (self) => {
  const partitioned = causePartition(self);
  if (partitioned.Fail.length > 0) {
    return partitioned.Fail[0].error;
  } else if (partitioned.Die.length > 0) {
    return partitioned.Die[0].defect;
  } else if (partitioned.Interrupt.length > 0) {
    return new globalThis.Error("All fibers interrupted without error");
  }
  return new globalThis.Error("Empty cause");
};
var causePrettyErrors = (self, options) => {
  const errors = [];
  const interrupts = [];
  if (self.reasons.length === 0) return errors;
  const prevStackLimit = getStackTraceLimit();
  setStackTraceLimit(1);
  for (const failure of self.reasons) {
    if (failure._tag === "Interrupt") {
      interrupts.push(failure);
      continue;
    }
    errors.push(causePrettyError(failure._tag === "Die" ? failure.defect : failure.error, failure.annotations, options));
  }
  if (errors.length === 0) {
    const cause = new Error("The fiber was interrupted by:");
    cause.name = "InterruptCause";
    cause.stack = interruptCauseStack(cause, interrupts);
    const error = new globalThis.Error("All fibers interrupted without error", {
      cause
    });
    error.name = "InterruptError";
    error.stack = `${error.name}: ${error.message}`;
    errors.push(causePrettyError(error, interrupts[0].annotations, options));
  }
  setStackTraceLimit(prevStackLimit);
  return errors;
};
var causePrettyError = (original, annotations, options) => {
  const kind = typeof original;
  let error;
  if (original && kind === "object") {
    error = new globalThis.Error(causePrettyMessage(original), {
      cause: original.cause ? causePrettyError(original.cause) : void 0
    });
    if (typeof original.name === "string") {
      error.name = original.name;
    }
    if (typeof original.stack === "string") {
      error.stack = cleanErrorStack(original.stack, error, annotations);
    } else {
      const stack = `${error.name}: ${error.message}`;
      error.stack = annotations ? addStackAnnotations(stack, annotations) : stack;
    }
    if (options?.includeCauseInStack) {
      error.stack = renderPrettyError(error);
    }
    for (const key of Object.keys(original)) {
      if (!(key in error)) {
        ;
        error[key] = original[key];
      }
    }
  } else {
    error = new globalThis.Error(!original ? `Unknown error: ${original}` : kind === "string" ? original : formatJson(original));
  }
  return error;
};
var causePrettyMessage = (u) => {
  if (typeof u.message === "string") {
    return u.message;
  } else if (typeof u.toString === "function" && u.toString !== Object.prototype.toString && u.toString !== Array.prototype.toString) {
    try {
      return u.toString();
    } catch {
    }
  }
  return formatJson(u);
};
var locationRegExp = /\((.*)\)/g;
var cleanErrorStack = (stack, error, annotations) => {
  const message = `${error.name}: ${error.message}`;
  const lines = (stack.startsWith(message) ? stack.slice(message.length) : stack).split("\n");
  const out2 = [message];
  for (let i = 1; i < lines.length; i++) {
    if (/(?:Generator\.next|~effect\/Effect)/.test(lines[i])) {
      break;
    }
    out2.push(lines[i]);
  }
  return annotations ? addStackAnnotations(out2.join("\n"), annotations) : out2.join("\n");
};
var addStackAnnotations = (stack, annotations) => {
  const frame = annotations?.get(StackTraceKey.key);
  if (frame) {
    stack = `${stack}
${currentStackTrace(frame)}`;
  }
  return stack;
};
var interruptCauseStack = (error, interrupts) => {
  const out2 = [`${error.name}: ${error.message}`];
  for (const current of interrupts) {
    const fiberId3 = current.fiberId !== void 0 ? `#${current.fiberId}` : "unknown";
    const frame = current.annotations.get(InterruptorStackTrace.key);
    out2.push(`    at fiber (${fiberId3})`);
    if (frame) out2.push(currentStackTrace(frame));
  }
  return out2.join("\n");
};
var currentStackTrace = (frame) => {
  const out2 = [];
  let current = frame;
  let i = 0;
  while (current && i < 10) {
    const stack = current.stack();
    if (stack) {
      const locationMatchAll = stack.matchAll(locationRegExp);
      let match7 = false;
      for (const [, location] of locationMatchAll) {
        match7 = true;
        out2.push(`    at ${current.name} (${location})`);
      }
      if (!match7) {
        out2.push(`    at ${current.name} (${stack.replace(/^at /, "")})`);
      }
    } else {
      out2.push(`    at ${current.name}`);
    }
    current = current.parent;
    i++;
  }
  return out2.join("\n");
};
var causePretty = (cause) => causePrettyErrors(cause).map(renderPrettyError).join("\n");
var renderPrettyError = (e) => e.cause ? `${e.stack} {
${renderErrorCause(e.cause, "  ")}
}` : e.stack;
var renderErrorCause = (cause, prefix3) => {
  const lines = cause.stack.split("\n");
  let stack = `${prefix3}[cause]: ${lines[0]}`;
  for (let i = 1, len = lines.length; i < len; i++) {
    stack += `
${prefix3}${lines[i]}`;
  }
  if (cause.cause) {
    stack += ` {
${renderErrorCause(cause.cause, `${prefix3}  `)}
${prefix3}}`;
  }
  return stack;
};
var FiberTypeId = "~effect/Fiber";
var fiberVariance = {
  _A: identity,
  _E: identity
};
var fiberIdStore = {
  id: 0
};
var getCurrentFiber = () => globalThis[currentFiberTypeId];
var FiberImpl = class {
  constructor(context3, interruptible3 = true) {
    this[FiberTypeId] = fiberVariance;
    this.setContext(context3);
    this.id = ++fiberIdStore.id;
    this.currentOpCount = 0;
    this.interruptible = interruptible3;
    this._stack = [];
    this._observers = [];
    this._exit = void 0;
    this._children = void 0;
    this._interruptedCause = void 0;
    this._yielded = void 0;
    this._running = false;
    this._deferredInterrupt = false;
    this.runtimeMetrics?.recordFiberStart(this.context);
  }
  [FiberTypeId];
  id;
  interruptible;
  currentOpCount;
  _stack;
  _observers;
  _exit;
  _children;
  _interruptedCause;
  _yielded;
  _running;
  _deferredInterrupt;
  // set in setContext
  context;
  currentScheduler;
  currentTracerContext;
  currentSpan;
  currentLogLevel;
  minimumLogLevel;
  currentStackFrame;
  runtimeMetrics;
  maxOpsBeforeYield;
  currentPreventYield;
  _dispatcher = void 0;
  get currentDispatcher() {
    return this._dispatcher ??= this.currentScheduler.makeDispatcher();
  }
  getRef(ref) {
    return get(this.context, ref);
  }
  addObserver(cb) {
    if (this._exit) {
      cb(this._exit);
      return constVoid;
    }
    this._observers.push(cb);
    return () => {
      if (this._exit) return;
      const index = this._observers.indexOf(cb);
      if (index >= 0) {
        this._observers.splice(index, 1);
      }
    };
  }
  interruptUnsafe(fiberId3, annotations) {
    if (this._exit) {
      return;
    }
    let cause = causeInterrupt(fiberId3);
    if (this.currentStackFrame) {
      cause = causeAnnotate(cause, make2(StackTraceKey, this.currentStackFrame));
    }
    if (annotations) {
      cause = causeAnnotate(cause, annotations);
    }
    this._interruptedCause = this._interruptedCause ? causeCombine(this._interruptedCause, cause) : cause;
    if (this.interruptible) {
      if (this._running) {
        this._deferredInterrupt = true;
      } else {
        this.evaluate(failCause(this._interruptedCause));
      }
    }
  }
  pollUnsafe() {
    return this._exit;
  }
  evaluate(effect2) {
    if (this._exit) {
      return;
    } else if (this._yielded !== void 0) {
      const yielded = this._yielded;
      this._yielded = void 0;
      yielded();
    }
    const exit3 = this.runLoop(effect2);
    if (exit3 === Yield) {
      return;
    }
    const interruptChildren = fiberMiddleware.interruptChildren && fiberMiddleware.interruptChildren(this);
    if (interruptChildren !== void 0) {
      return this.evaluate(flatMap2(interruptChildren, () => exit3));
    }
    this._exit = exit3;
    this.runtimeMetrics?.recordFiberEnd(this.context, this._exit);
    for (let i = 0; i < this._observers.length; i++) {
      this._observers[i](exit3);
    }
    this._observers.length = 0;
    this._stack.length = 0;
    this._children = void 0;
    this.context = empty2();
  }
  runLoop(effect2) {
    const prevFiber = globalThis[currentFiberTypeId];
    globalThis[currentFiberTypeId] = this;
    const prevRunning = this._running;
    this._running = true;
    let yielding = false;
    let current = effect2;
    this.currentOpCount = 0;
    try {
      while (true) {
        if (this._deferredInterrupt) {
          this._deferredInterrupt = false;
          current = failCause(this._interruptedCause);
        }
        this.currentOpCount++;
        if (!yielding && !this.currentPreventYield && this.currentScheduler.shouldYield(this)) {
          yielding = true;
          const prev = current;
          current = flatMap2(yieldNow, () => prev);
        }
        current = this.currentTracerContext ? this.currentTracerContext(current, this) : current[evaluate](this);
        if (current === Yield) {
          const yielded = this._yielded;
          if (ExitTypeId in yielded) {
            this._deferredInterrupt = false;
            this._yielded = void 0;
            return yielded;
          } else if (this._deferredInterrupt) {
            this._yielded = void 0;
            yielded();
            continue;
          }
          return Yield;
        }
      }
    } catch (error) {
      if (!hasProperty(current, evaluate)) {
        return exitDie(`Fiber.runLoop: Not a valid effect: ${String(current)}`);
      }
      return this.runLoop(exitDie(error));
    } finally {
      this._running = prevRunning;
      globalThis[currentFiberTypeId] = prevFiber;
    }
  }
  getCont(symbol4) {
    if (this._deferredInterrupt) {
      this._deferredInterrupt = false;
      return deferredInterruptCont;
    }
    while (true) {
      const op = this._stack.pop();
      if (!op) return void 0;
      const cont = op[contAll] && op[contAll](this);
      if (cont) {
        ;
        cont[symbol4] = cont;
        return cont;
      }
      if (op[symbol4]) return op;
    }
  }
  yieldWith(value) {
    this._yielded = value;
    return Yield;
  }
  children() {
    return this._children ??= /* @__PURE__ */ new Set();
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
  setContext(context3) {
    const previous = this.context;
    this.context = context3;
    if (previous !== void 0 && hasSameCache(previous, context3)) return;
    const scheduler = this.getRef(Scheduler);
    if (scheduler !== this.currentScheduler) {
      this.currentScheduler = scheduler;
      this._dispatcher = void 0;
    }
    this.currentSpan = getOrUndefinedUnsafe(context3, ParentSpanKey);
    this.currentLogLevel = this.getRef(CurrentLogLevel);
    this.minimumLogLevel = this.getRef(MinimumLogLevel);
    this.currentStackFrame = this.getRef(CurrentStackFrame);
    this.maxOpsBeforeYield = this.getRef(MaxOpsBeforeYield);
    this.currentPreventYield = this.getRef(PreventSchedulerYield);
    this.runtimeMetrics = getOrUndefinedUnsafe(context3, FiberRuntimeMetricsKey);
    const currentTracer = getOrUndefinedUnsafe(context3, TracerKey);
    this.currentTracerContext = currentTracer ? currentTracer["context"] : void 0;
  }
  get currentSpanLocal() {
    return this.currentSpan?._tag === "Span" ? this.currentSpan : void 0;
  }
};
var deferredInterruptCont = {
  [contA](_value, fiber3) {
    return failCause(fiber3._interruptedCause);
  },
  [contE](_cause, fiber3) {
    return failCause(fiber3._interruptedCause);
  }
};
var fiberMiddleware = {
  interruptChildren: void 0
};
var fiberStackAnnotations = (fiber3) => {
  if (!fiber3.currentStackFrame) return void 0;
  const annotations = /* @__PURE__ */ new Map();
  annotations.set(InterruptorStackTrace.key, fiber3.currentStackFrame);
  return makeUnsafe(annotations);
};
var fiberInterruptChildren = (fiber3) => {
  if (fiber3._children === void 0 || fiber3._children.size === 0) {
    return void 0;
  }
  return fiberInterruptAll(fiber3._children);
};
var fiberAwait = (self) => {
  const impl = self;
  if (impl._exit) return succeed3(impl._exit);
  return callback((resume) => {
    if (impl._exit) return resume(succeed3(impl._exit));
    return sync(self.addObserver((exit3) => resume(succeed3(exit3))));
  });
};
var fiberAwaitAll = (self) => callback((resume) => {
  const iter = self[Symbol.iterator]();
  const exits = [];
  let cancel = void 0;
  function loop() {
    let result4 = iter.next();
    while (!result4.done) {
      if (result4.value._exit) {
        exits.push(result4.value._exit);
        result4 = iter.next();
        continue;
      }
      cancel = result4.value.addObserver((exit3) => {
        exits.push(exit3);
        loop();
      });
      return;
    }
    resume(succeed3(exits));
  }
  loop();
  return sync(() => cancel?.());
});
var fiberJoin = (self) => {
  const impl = self;
  if (impl._exit) return impl._exit;
  return callback((resume) => {
    if (impl._exit) return resume(impl._exit);
    return sync(self.addObserver(resume));
  });
};
var fiberJoinAll = (self) => callback((resume) => {
  const fibers = Array.from(self);
  if (fibers.length === 0) return resume(succeed3(empty()));
  const out2 = new Array(fibers.length);
  const cancels = empty();
  let done4 = 0;
  let failed = false;
  for (let i = 0; i < fibers.length; i++) {
    if (failed) break;
    cancels.push(fibers[i].addObserver((exit3) => {
      done4++;
      if (exit3._tag === "Failure") {
        failed = true;
        cancels.forEach((cancel) => cancel());
        return resume(exit3);
      }
      out2[i] = exit3.value;
      if (done4 === fibers.length) {
        resume(succeed3(out2));
      }
    }));
  }
  return sync(() => {
    failed = true;
    cancels.forEach((cancel) => cancel());
  });
});
var fiberInterrupt = (self) => withFiber((fiber3) => fiberInterruptAs(self, fiber3.id));
var fiberInterruptAs = /* @__PURE__ */ dual((args2) => hasProperty(args2[0], FiberTypeId), (self, fiberId3, annotations) => withFiber((parent) => {
  let ann = fiberStackAnnotations(parent);
  ann = ann && annotations ? merge(ann, annotations) : ann ?? annotations;
  self.interruptUnsafe(fiberId3, ann);
  return asVoid(fiberAwait(self));
}));
var fiberInterruptAll = (fibers) => withFiber((parent) => {
  const annotations = fiberStackAnnotations(parent);
  let fiberArr = empty();
  for (const fiber3 of fibers) {
    fiber3.interruptUnsafe(parent.id, annotations);
    fiberArr.push(fiber3);
  }
  return asVoid(fiberAwaitAll(fiberArr));
});
var succeed3 = exitSucceed;
var failCause = exitFailCause;
var fail3 = exitFail;
var sync = /* @__PURE__ */ makePrimitive({
  op: "Sync",
  [evaluate](fiber3) {
    const value = this[args]();
    const cont = fiber3.getCont(contA);
    return cont ? cont[contA](value, fiber3) : fiber3.yieldWith(exitSucceed(value));
  }
});
var suspend = /* @__PURE__ */ makePrimitive({
  op: "Suspend",
  [evaluate](_fiber) {
    return this[args]();
  }
});
var fromOption2 = /* @__PURE__ */ dual((args2) => args2.length >= 2 || isOption2(args2[0]), (option3, onNone) => isNone2(option3) ? fail3(onNone ? onNone() : new NoSuchElementError("Effect.fromOption: Option.none")) : succeed3(option3.value));
var fromResult = /* @__PURE__ */ match2({
  onFailure: fail3,
  onSuccess: succeed3
});
var fromNullishOr2 = (value) => value == null ? fail3(new NoSuchElementError()) : succeed3(value);
var yieldNowWith = /* @__PURE__ */ makePrimitive({
  op: "Yield",
  [evaluate](fiber3) {
    let resumed = false;
    fiber3.currentDispatcher.scheduleTask(() => {
      if (resumed) return;
      fiber3.evaluate(exitVoid);
    }, this[args] ?? 0);
    return fiber3.yieldWith(() => {
      resumed = true;
    });
  }
});
var yieldNow = /* @__PURE__ */ yieldNowWith(0);
var succeedSome = (a) => succeed3(some2(a));
var succeedNone = /* @__PURE__ */ succeed3(/* @__PURE__ */ none2());
var transposeOption = (self) => isNone2(self) ? succeedNone : map4(self.value, some2);
var failCauseSync = (evaluate2) => suspend(() => failCause(internalCall(evaluate2)));
var die = (defect) => exitDie(defect);
var failSync = (error) => suspend(() => fail3(internalCall(error)));
var void_ = /* @__PURE__ */ succeed3(void 0);
var try_ = (options) => {
  const evaluate2 = typeof options === "function" ? options : options.try;
  const catcher = typeof options === "function" ? (cause) => new UnknownError(cause, "An error occurred in Effect.try") : options.catch;
  return suspend(() => {
    try {
      return succeed3(internalCall(evaluate2));
    } catch (err) {
      return fail3(internalCall(() => catcher(err)));
    }
  });
};
var promise = (evaluate2) => callbackOptions(function(resume, signal) {
  internalCall(() => evaluate2(signal)).then((a) => resume(succeed3(a)), (e) => resume(die(e)));
}, evaluate2.length !== 0);
var tryPromise = (options) => {
  const f = typeof options === "function" ? options : options.try;
  const catcher = typeof options === "function" ? (cause) => new UnknownError(cause, "An error occurred in Effect.tryPromise") : options.catch;
  return callbackOptions(function(resume, signal) {
    const failWithCatch = (cause) => {
      try {
        resume(fail3(internalCall(() => catcher(cause))));
      } catch (err) {
        resume(die(err));
      }
    };
    try {
      internalCall(() => f(signal)).then((a) => resume(succeed3(a)), failWithCatch);
    } catch (err) {
      failWithCatch(err);
    }
  }, f.length !== 0);
};
var withFiberId = (f) => withFiber((fiber3) => f(fiber3.id));
var fiber = /* @__PURE__ */ withFiber(succeed3);
var fiberId = /* @__PURE__ */ withFiberId(succeed3);
var callbackOptions = /* @__PURE__ */ makePrimitive({
  op: "Async",
  single: false,
  [evaluate](fiber3) {
    const register = internalCall(() => this[args][0].bind(fiber3.currentScheduler));
    let resumed = false;
    let yielded = false;
    const controller = this[args][1] ? new AbortController() : void 0;
    const onCancel = register((effect2) => {
      if (resumed) return;
      resumed = true;
      if (yielded) {
        fiber3.evaluate(effect2);
      } else {
        yielded = effect2;
      }
    }, controller?.signal);
    if (yielded !== false) return yielded;
    yielded = true;
    fiber3._yielded = () => {
      resumed = true;
    };
    if (controller === void 0 && onCancel === void 0) {
      return Yield;
    }
    fiber3._stack.push(asyncFinalizer(() => {
      resumed = true;
      controller?.abort();
      return onCancel ?? exitVoid;
    }));
    return Yield;
  }
});
var asyncFinalizer = /* @__PURE__ */ makePrimitive({
  op: "AsyncFinalizer",
  [contAll](fiber3) {
    if (fiber3.interruptible) {
      fiber3.interruptible = false;
      fiber3._stack.push(setInterruptibleTrue);
    }
  },
  [contE](cause, _fiber) {
    return hasInterrupts(cause) ? flatMap2(this[args](), () => failCause(cause)) : failCause(cause);
  }
});
var callback = (register) => callbackOptions(register, register.length >= 2);
var never = /* @__PURE__ */ callback(constVoid);
var gen = (...args2) => suspend(() => fromIteratorUnsafe(args2.length === 1 ? args2[0]() : args2[1].call(args2[0].self)));
var fnUntraced = (body, ...pipeables) => {
  const fn3 = pipeables.length === 0 ? function() {
    return suspend(() => fromIteratorUnsafe(body.apply(this, arguments)));
  } : function() {
    let effect2 = suspend(() => fromIteratorUnsafe(body.apply(this, arguments)));
    for (let i = 0; i < pipeables.length; i++) {
      effect2 = pipeables[i](effect2, ...arguments);
    }
    return effect2;
  };
  return defineFunctionLength(body.length, fn3);
};
var defineFunctionLength = (length, fn3) => Object.defineProperty(fn3, "length", {
  value: length,
  configurable: true
});
var fnStackCleaner = /* @__PURE__ */ makeStackCleaner(2);
var fn = function() {
  const nameFirst = typeof arguments[0] === "string";
  const name = nameFirst ? arguments[0] : "Effect.fn";
  const spanOptions = nameFirst ? arguments[1] : void 0;
  const prevLimit = getStackTraceLimit();
  setStackTraceLimit(2);
  const defError = new globalThis.Error();
  setStackTraceLimit(prevLimit);
  if (nameFirst) {
    return (body, ...pipeables) => makeFn(name, body, defError, pipeables, nameFirst, spanOptions);
  }
  return makeFn(name, arguments[0], defError, Array.prototype.slice.call(arguments, 1), nameFirst, spanOptions);
};
var makeFn = (name, bodyOrOptions, defError, pipeables, addSpan, spanOptions) => {
  const body = typeof bodyOrOptions === "function" ? bodyOrOptions : pipeables.shift().bind(bodyOrOptions.self);
  return defineFunctionLength(body.length, function(...args2) {
    let result4 = suspend(() => {
      const iter = body.apply(this, arguments);
      return isEffect(iter) ? iter : fromIteratorUnsafe(iter);
    });
    for (let i = 0; i < pipeables.length; i++) {
      result4 = pipeables[i](result4, ...args2);
    }
    if (!isEffect(result4)) {
      return result4;
    }
    const prevLimit = getStackTraceLimit();
    setStackTraceLimit(2);
    const callError = new globalThis.Error();
    setStackTraceLimit(prevLimit);
    return updateService(addSpan ? useSpan(name, spanOptions, (span2) => provideParentSpan(result4, span2)) : result4, CurrentStackFrame, (prev) => ({
      name,
      stack: fnStackCleaner(() => callError.stack),
      parent: {
        name: `${name} (definition)`,
        stack: fnStackCleaner(() => defError.stack),
        parent: prev
      }
    }));
  });
};
var fnUntracedEager = (body, ...pipeables) => defineFunctionLength(body.length, pipeables.length === 0 ? function() {
  return fromIteratorEagerUnsafe(() => body.apply(this, arguments));
} : function() {
  let effect2 = fromIteratorEagerUnsafe(() => body.apply(this, arguments));
  for (const pipeable of pipeables) {
    effect2 = pipeable(effect2);
  }
  return effect2;
});
var fromIteratorEagerUnsafe = (evaluate2) => {
  try {
    const iterator = evaluate2();
    let value = void 0;
    while (true) {
      const state = iterator.next(value);
      if (state.done) {
        return succeed3(state.value);
      }
      const primitive = state.value;
      if (primitive && primitive._tag === "Success") {
        value = primitive.value;
        continue;
      } else if (primitive && primitive._tag === "Failure") {
        return state.value;
      } else {
        let isFirstExecution = true;
        return suspend(() => {
          if (isFirstExecution) {
            isFirstExecution = false;
            return flatMap2(state.value, (value2) => fromIteratorUnsafe(iterator, value2));
          } else {
            return suspend(() => fromIteratorUnsafe(evaluate2()));
          }
        });
      }
    }
  } catch (error) {
    return die(error);
  }
};
var fromIteratorUnsafe = /* @__PURE__ */ makePrimitive({
  op: "Iterator",
  single: false,
  [contA](value, fiber3) {
    const iter = this[args][0];
    while (true) {
      const state = iter.next(value);
      if (state.done) return succeed3(state.value);
      if (!effectIsExit(state.value)) {
        fiber3._stack.push(this);
        return state.value;
      } else if (state.value._tag === "Failure") {
        return state.value;
      }
      value = state.value.value;
    }
  },
  [evaluate](fiber3) {
    return this[contA](this[args][1], fiber3);
  }
});
var as = /* @__PURE__ */ dual(2, (self, value) => {
  const b = succeed3(value);
  return flatMap2(self, (_) => b);
});
var asSome = (self) => map4(self, some2);
var flip = (self) => matchEffect(self, {
  onFailure: succeed3,
  onSuccess: fail3
});
var andThen = /* @__PURE__ */ dual(2, (self, f) => flatMap2(self, (a) => isEffect(f) ? f : internalCall(() => f(a))));
var tap = /* @__PURE__ */ dual(2, (self, f) => flatMap2(self, (a) => as(isEffect(f) ? f : internalCall(() => f(a)), a)));
var asVoid = (self) => flatMap2(self, (_) => exitVoid);
var sandbox = (self) => catchCause(self, fail3);
var raceAll = (all3, options) => withFiber((parent) => callback((resume) => {
  const effects = fromIterable(all3);
  const len = effects.length;
  let doneCount = 0;
  let done4 = false;
  const fibers = /* @__PURE__ */ new Set();
  const failures = [];
  const onExit5 = (exit3, fiber3, i) => {
    doneCount++;
    if (exit3._tag === "Failure") {
      failures.push(...exit3.cause.reasons);
      if (doneCount >= len) {
        resume(failCause(causeFromReasons(failures)));
      }
      return;
    }
    const isWinner = !done4;
    done4 = true;
    resume(fibers.size === 0 ? exit3 : flatMap2(uninterruptible(fiberInterruptAll(fibers)), () => exit3));
    if (isWinner && options?.onWinner) {
      options.onWinner({
        fiber: fiber3,
        index: i,
        parentFiber: parent
      });
    }
  };
  for (let i = 0; i < len; i++) {
    const fiber3 = forkUnsafe(parent, effects[i], true, true, false);
    fibers.add(fiber3);
    fiber3.addObserver((exit3) => {
      fibers.delete(fiber3);
      onExit5(exit3, fiber3, i);
    });
    if (done4) break;
  }
  return fiberInterruptAll(fibers);
}));
var raceAllFirst = (all3, options) => withFiber((parent) => callback((resume) => {
  let done4 = false;
  const fibers = /* @__PURE__ */ new Set();
  const onExit5 = (exit3) => {
    done4 = true;
    resume(fibers.size === 0 ? exit3 : flatMap2(uninterruptible(fiberInterruptAll(fibers)), () => exit3));
  };
  let i = 0;
  for (const effect2 of all3) {
    if (done4) break;
    const index = i++;
    const fiber3 = forkUnsafe(parent, effect2, true, true, false);
    fibers.add(fiber3);
    fiber3.addObserver((exit3) => {
      fibers.delete(fiber3);
      const isWinner = !done4;
      onExit5(exit3);
      if (isWinner && options?.onWinner) {
        options.onWinner({
          fiber: fiber3,
          index,
          parentFiber: parent
        });
      }
    });
  }
  return fiberInterruptAll(fibers);
}));
var race = /* @__PURE__ */ dual((args2) => isEffect(args2[1]), (self, that, options) => raceAll([self, that], options));
var raceFirst = /* @__PURE__ */ dual((args2) => isEffect(args2[1]), (self, that, options) => raceAllFirst([self, that], options));
var flatMap2 = /* @__PURE__ */ dual(2, (self, f) => {
  const onSuccess = Object.create(OnSuccessProto);
  onSuccess[args] = self;
  onSuccess[contA] = f.length !== 1 ? (a) => f(a) : f;
  return onSuccess;
});
var OnSuccessProto = /* @__PURE__ */ makePrimitiveProto({
  op: "OnSuccess",
  [evaluate](fiber3) {
    fiber3._stack.push(this);
    return this[args];
  }
});
var matchCauseEffectEager = /* @__PURE__ */ dual(2, (self, options) => {
  if (effectIsExit(self)) {
    return self._tag === "Success" ? options.onSuccess(self.value) : options.onFailure(self.cause);
  }
  return matchCauseEffect(self, options);
});
var effectIsExit = (effect2) => ExitTypeId in effect2;
var flatMapEager = /* @__PURE__ */ dual(2, (self, f) => {
  if (effectIsExit(self)) {
    return self._tag === "Success" ? f(self.value) : self;
  }
  return flatMap2(self, f);
});
var flatten3 = (self) => flatMap2(self, identity);
var map4 = /* @__PURE__ */ dual(2, (self, f) => flatMap2(self, (a) => succeed3(internalCall(() => f(a)))));
var mapEager = /* @__PURE__ */ dual(2, (self, f) => effectIsExit(self) ? exitMap(self, f) : map4(self, f));
var mapErrorEager = /* @__PURE__ */ dual(2, (self, f) => effectIsExit(self) ? exitMapError(self, f) : mapError(self, f));
var mapBothEager = /* @__PURE__ */ dual(2, (self, options) => effectIsExit(self) ? exitMapBoth(self, options) : mapBoth(self, options));
var catchEager = /* @__PURE__ */ dual(2, (self, f) => {
  if (effectIsExit(self)) {
    if (self._tag === "Success") return self;
    const error = findError(self.cause);
    if (isFailure2(error)) return self;
    return f(error.success);
  }
  return catch_(self, f);
});
var exitInterrupt = (fiberId3) => exitFailCause(causeInterrupt(fiberId3));
var exitIsSuccess = (self) => self._tag === "Success";
var exitIsFailure = (self) => self._tag === "Failure";
var exitFilterCause = (self) => self._tag === "Failure" ? succeed2(self.cause) : fail2(self);
var exitVoid = /* @__PURE__ */ exitSucceed(void 0);
var exitMap = /* @__PURE__ */ dual(2, (self, f) => self._tag === "Success" ? exitSucceed(f(self.value)) : self);
var exitMapError = /* @__PURE__ */ dual(2, (self, f) => {
  if (self._tag === "Success") return self;
  const error = findError(self.cause);
  if (isFailure2(error)) return self;
  return exitFail(f(error.success));
});
var exitMapBoth = /* @__PURE__ */ dual(2, (self, options) => {
  if (self._tag === "Success") return exitSucceed(options.onSuccess(self.value));
  const error = findError(self.cause);
  if (isFailure2(error)) return self;
  return exitFail(options.onFailure(error.success));
});
var exitZipRight = /* @__PURE__ */ dual(2, (self, that) => exitIsSuccess(self) ? that : self);
var exitMatch = /* @__PURE__ */ dual(2, (self, options) => exitIsSuccess(self) ? options.onSuccess(self.value) : options.onFailure(self.cause));
var exitAsVoidAll = (exits) => {
  const failures = [];
  for (const exit3 of exits) {
    if (exit3._tag === "Failure") {
      failures.push(...exit3.cause.reasons);
    }
  }
  return failures.length === 0 ? exitVoid : exitFailCause(causeFromReasons(failures));
};
var service = (service4) => service4;
var serviceOption = (service4) => withFiber((fiber3) => succeed3(getOption(fiber3.context, service4)));
var serviceOptional = (service4) => withFiber((fiber3) => fromOption2(getOption(fiber3.context, service4)));
var updateContext = /* @__PURE__ */ dual(2, (self, f) => withFiber((fiber3) => {
  const prevContext = fiber3.context;
  const nextContext = f(prevContext);
  if (prevContext === nextContext) return self;
  fiber3.setContext(nextContext);
  return onExitPrimitive(self, () => {
    fiber3.setContext(prevContext);
    return void 0;
  });
}));
var updateService = /* @__PURE__ */ dual(3, (self, service4, f) => updateContext(self, (s2) => {
  const prev = getUnsafe2(s2, service4);
  const next = f(prev);
  if (prev === next) return s2;
  return add(s2, service4, next);
}));
var updateServiceScoped = (service4, update2, options) => uninterruptible(withFiber((fiber3) => {
  const original = getUnsafe2(fiber3.context, service4);
  const updated = update2(original);
  fiber3.setContext(add(fiber3.context, service4, updated));
  return scopeAddFinalizerExit(getUnsafe2(fiber3.context, scopeTag), (_) => {
    const current = getUnsafe2(fiber3.context, service4);
    let next;
    if (options?.reset === void 0) {
      if (current !== updated) return void_;
      next = original;
    } else {
      next = options.reset(original, updated, current);
    }
    fiber3.setContext(add(fiber3.context, service4, next));
    return void_;
  });
}));
var context = () => getContext;
var getContext = /* @__PURE__ */ withFiber((fiber3) => succeed3(fiber3.context));
var contextWith = (f) => withFiber((fiber3) => f(fiber3.context));
var setContext = /* @__PURE__ */ dual(2, (self, context3) => updateContext(self, constant(context3)));
var provideContext = /* @__PURE__ */ dual(2, (self, context3) => {
  if (effectIsExit(self)) return self;
  return updateContext(self, merge(context3));
});
var provideService = function() {
  if (arguments.length === 1) {
    return dual(2, (self, impl) => provideServiceImpl(self, arguments[0], impl));
  }
  return dual(3, (self, service4, impl) => provideServiceImpl(self, service4, impl)).apply(this, arguments);
};
var provideServiceImpl = (self, service4, implementation) => updateContext(self, add(service4, implementation));
var provideServiceEffect = /* @__PURE__ */ dual(3, (self, service4, acquire2) => flatMap2(acquire2, (implementation) => provideService(self, service4, implementation)));
var zip = /* @__PURE__ */ dual((args2) => isEffect(args2[1]), (self, that, options) => zipWith(self, that, (a, a2) => [a, a2], options));
var zipWith = /* @__PURE__ */ dual((args2) => isEffect(args2[1]), (self, that, f, options) => options?.concurrent ? map4(all([self, that], {
  concurrency: 2
}), ([a, a2]) => internalCall(() => f(a, a2))) : flatMap2(self, (a) => map4(that, (a2) => internalCall(() => f(a, a2)))));
var filterOrFail = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, predicate, orFailWith) => filterOrElse(self, predicate, orFailWith ? (a) => fail3(orFailWith(a)) : () => fail3(new NoSuchElementError())));
var when = /* @__PURE__ */ dual(2, (self, condition) => flatMap2(condition, (pass) => pass ? asSome(self) : succeedNone));
var replicate = /* @__PURE__ */ dual(2, (self, n) => Array.from({
  length: n
}, () => self));
var replicateEffect = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, n, options) => all(replicate(self, n), options));
var forever2 = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, options) => whileLoop({
  while: constTrue,
  body: constant(options?.disableYield ? self : flatMap2(self, (_) => yieldNow)),
  step: constVoid
}));
var catchCause = /* @__PURE__ */ dual(2, (self, f) => {
  const onFailure = Object.create(OnFailureProto);
  onFailure[args] = self;
  onFailure[contE] = f.length !== 1 ? (cause) => f(cause) : f;
  return onFailure;
});
var OnFailureProto = /* @__PURE__ */ makePrimitiveProto({
  op: "OnFailure",
  [evaluate](fiber3) {
    fiber3._stack.push(this);
    return this[args];
  }
});
var catchCauseIf = /* @__PURE__ */ dual(3, (self, predicate, f) => catchCause(self, (cause) => {
  if (!predicate(cause)) {
    return failCause(cause);
  }
  return internalCall(() => f(cause));
}));
var catchCauseFilter = /* @__PURE__ */ dual(3, (self, filter9, f) => catchCause(self, (cause) => {
  const eb = filter9(cause);
  return isFailure2(eb) ? failCause(eb.failure) : internalCall(() => f(eb.success, cause));
}));
var catch_ = /* @__PURE__ */ dual(2, (self, f) => catchCauseFilter(self, findError, (e) => f(e)));
var catchNoSuchElement = (self) => matchEffect(self, {
  onFailure: (error) => isNoSuchElementError(error) ? succeedNone : fail3(error),
  onSuccess: succeedSome
});
var catchDefect = /* @__PURE__ */ dual(2, (self, f) => catchCauseFilter(self, findDefect, f));
var tapCause = /* @__PURE__ */ dual(2, (self, f) => catchCause(self, (cause) => andThen(internalCall(() => f(cause)), failCause(cause))));
var tapCauseIf = /* @__PURE__ */ dual(3, (self, predicate, f) => catchCauseIf(self, predicate, (cause) => andThen(internalCall(() => f(cause)), failCause(cause))));
var tapCauseFilter = /* @__PURE__ */ dual(3, (self, filter9, f) => catchCause(self, (cause) => {
  const result4 = filter9(cause);
  if (isFailure2(result4)) {
    return failCause(cause);
  }
  return andThen(internalCall(() => f(result4.success, cause)), failCause(cause));
}));
var tapError = /* @__PURE__ */ dual(2, (self, f) => tapCauseFilter(self, findError, (e) => f(e)));
var tapErrorTag = /* @__PURE__ */ dual(3, (self, k, f) => {
  const predicate = Array.isArray(k) ? (e) => hasProperty(e, "_tag") && k.includes(e._tag) : isTagged(k);
  return tapError(self, (error) => predicate(error) ? f(error) : void_);
});
var tapDefect = /* @__PURE__ */ dual(2, (self, f) => tapCauseFilter(self, findDefect, (_) => f(_)));
var catchIf = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, predicate, f, orElse) => catchCause(self, (cause) => {
  const error = findError(cause);
  if (isFailure2(error)) return failCause(error.failure);
  if (!predicate(error.success)) {
    return orElse ? internalCall(() => orElse(error.success)) : failCause(cause);
  }
  return internalCall(() => f(error.success));
}));
var catchFilter = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, filter9, f, orElse) => catchCause(self, (cause) => {
  const error = findError(cause);
  if (isFailure2(error)) return failCause(error.failure);
  const result4 = filter9(error.success);
  if (isFailure2(result4)) {
    return orElse ? internalCall(() => orElse(result4.failure)) : failCause(cause);
  }
  return internalCall(() => f(result4.success));
}));
var catchTag = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, k, f, orElse) => {
  const pred = Array.isArray(k) ? (e) => hasProperty(e, "_tag") && k.includes(e._tag) : isTagged(k);
  return catchIf(self, pred, f, orElse);
});
var catchTags = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, cases, orElse) => {
  let keys2;
  return catchFilter(self, (e) => {
    keys2 ??= Object.keys(cases);
    return hasProperty(e, "_tag") && isString(e["_tag"]) && keys2.includes(e["_tag"]) ? succeed2(e) : fail2(e);
  }, (e) => internalCall(() => cases[e["_tag"]](e)), orElse);
});
var catchReason = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, errorTag, reasonTag, f, orElse) => catchIf(self, (e) => isTagged(e, errorTag) && hasProperty(e, "reason"), (e) => {
  const reason = e.reason;
  if (isTagged(reason, reasonTag)) return f(reason, e);
  return orElse ? internalCall(() => orElse(reason, e)) : fail3(e);
}));
var catchReasons = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, errorTag, cases, orElse) => {
  let keys2;
  return catchIf(self, (e) => isTagged(e, errorTag) && hasProperty(e, "reason") && hasProperty(e.reason, "_tag") && isString(e.reason._tag), (e) => {
    const reason = e.reason;
    keys2 ??= Object.keys(cases);
    if (keys2.includes(reason._tag)) {
      return internalCall(() => cases[reason._tag](reason, e));
    }
    return orElse ? internalCall(() => orElse(reason, e)) : fail3(e);
  });
});
var unwrapReason = /* @__PURE__ */ dual(2, (self, errorTag) => catchFilter(self, (e) => {
  if (isTagged(e, errorTag) && hasProperty(e, "reason")) {
    return succeed2(e.reason);
  }
  return fail2(e);
}, fail3));
var mapError = /* @__PURE__ */ dual(2, (self, f) => catch_(self, (error) => failSync(() => f(error))));
var mapBoth = /* @__PURE__ */ dual(2, (self, options) => matchEffect(self, {
  onFailure: (e) => failSync(() => options.onFailure(e)),
  onSuccess: (a) => sync(() => options.onSuccess(a))
}));
var orDie = (self) => catch_(self, die);
var orElseSucceed = /* @__PURE__ */ dual(2, (self, f) => catch_(self, (_) => sync(f)));
var firstSuccessOf = (effects) => suspend(() => {
  const iterator = effects[Symbol.iterator]();
  let state = iterator.next();
  if (state.done) {
    return die(new Error("Received an empty collection of effects"));
  }
  function loop(current) {
    const next = iterator.next();
    if (next.done) return current.value;
    return catch_(current.value, (_) => loop(next));
  }
  return loop(state);
});
var eventually = (self) => catch_(self, (_) => flatMap2(yieldNow, () => eventually(self)));
var ignore = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, options) => {
  if (!options?.log) {
    return matchEffect(self, {
      onFailure: (_) => void_,
      onSuccess: (_) => void_
    });
  }
  const logEffect = logWithLevel(options.log === true ? void 0 : options.log);
  return matchCauseEffect(self, {
    onFailure(cause) {
      const failure = findFail(cause);
      return isFailure2(failure) ? failCause(failure.failure) : options.message === void 0 ? logEffect(cause) : logEffect(options.message, cause);
    },
    onSuccess: (_) => void_
  });
});
var ignoreCause = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, options) => {
  if (!options?.log) {
    return matchCauseEffect(self, {
      onFailure: (_) => void_,
      onSuccess: (_) => void_
    });
  }
  const logEffect = logWithLevel(options.log === true ? void 0 : options.log);
  return matchCauseEffect(self, {
    onFailure: (cause) => options.message === void 0 ? logEffect(cause) : logEffect(options.message, cause),
    onSuccess: (_) => void_
  });
});
var option = (self) => match4(self, {
  onFailure: none2,
  onSuccess: some2
});
var result = (self) => matchEager(self, {
  onFailure: fail2,
  onSuccess: succeed2
});
var matchCauseEffect = /* @__PURE__ */ dual(2, (self, options) => {
  const primitive = Object.create(OnSuccessAndFailureProto);
  primitive[args] = self;
  primitive[contA] = options.onSuccess.length !== 1 ? (a) => options.onSuccess(a) : options.onSuccess;
  primitive[contE] = options.onFailure.length !== 1 ? (cause) => options.onFailure(cause) : options.onFailure;
  return primitive;
});
var OnSuccessAndFailureProto = /* @__PURE__ */ makePrimitiveProto({
  op: "OnSuccessAndFailure",
  [evaluate](fiber3) {
    fiber3._stack.push(this);
    return this[args];
  }
});
var matchCause = /* @__PURE__ */ dual(2, (self, options) => matchCauseEffect(self, {
  onFailure: (cause) => sync(() => options.onFailure(cause)),
  onSuccess: (value) => sync(() => options.onSuccess(value))
}));
var matchEffect = /* @__PURE__ */ dual(2, (self, options) => matchCauseEffect(self, {
  onFailure: (cause) => {
    const fail11 = cause.reasons.find(isFailReason);
    return fail11 ? internalCall(() => options.onFailure(fail11.error)) : failCause(cause);
  },
  onSuccess: options.onSuccess
}));
var match4 = /* @__PURE__ */ dual(2, (self, options) => matchEffect(self, {
  onFailure: (error) => sync(() => options.onFailure(error)),
  onSuccess: (value) => sync(() => options.onSuccess(value))
}));
var matchEager = /* @__PURE__ */ dual(2, (self, options) => {
  if (effectIsExit(self)) {
    if (self._tag === "Success") return exitSucceed(options.onSuccess(self.value));
    const error = findError(self.cause);
    if (isFailure2(error)) return self;
    return exitSucceed(options.onFailure(error.success));
  }
  return match4(self, options);
});
var matchCauseEager = /* @__PURE__ */ dual(2, (self, options) => {
  if (effectIsExit(self)) {
    if (self._tag === "Success") return exitSucceed(options.onSuccess(self.value));
    return exitSucceed(options.onFailure(self.cause));
  }
  return matchCause(self, options);
});
var exit = (self) => effectIsExit(self) ? exitSucceed(self) : exitPrimitive(self);
var exitPrimitive = /* @__PURE__ */ makePrimitive({
  op: "Exit",
  [evaluate](fiber3) {
    fiber3._stack.push(this);
    return this[args];
  },
  [contA](value, _, exit3) {
    return succeed3(exit3 ?? exitSucceed(value));
  },
  [contE](cause, _, exit3) {
    return succeed3(exit3 ?? exitFailCause(cause));
  }
});
var isFailure3 = /* @__PURE__ */ matchEager({
  onFailure: () => true,
  onSuccess: () => false
});
var isSuccess3 = /* @__PURE__ */ matchEager({
  onFailure: () => false,
  onSuccess: () => true
});
var delay = /* @__PURE__ */ dual(2, (self, duration) => andThen(sleep(duration), self));
var timeoutOrElse = /* @__PURE__ */ dual(2, (self, options) => raceFirst(self, flatMap2(sleep(options.duration), options.orElse)));
var timeout = /* @__PURE__ */ dual(2, (self, duration) => timeoutOrElse(self, {
  duration,
  orElse: () => fail3(new TimeoutError())
}));
var timeoutOption = /* @__PURE__ */ dual(2, (self, duration) => raceFirst(asSome(self), as(sleep(duration), none2())));
var timed = (self) => clockWith((clock) => {
  const start = clock.monotonicTimeNanosUnsafe();
  return map4(self, (a) => [nanos(clock.monotonicTimeNanosUnsafe() - start), a]);
});
var ScopeTypeId = "~effect/Scope";
var ScopeCloseableTypeId = "~effect/Scope/Closeable";
var scopeTag = /* @__PURE__ */ Service("effect/Scope");
var scopeClose = (self, exit_) => suspend(() => scopeCloseUnsafe(self, exit_) ?? void_);
var scopeCloseUnsafe = (self, exit_) => {
  if (self.state._tag === "Closed") return;
  const closed = {
    _tag: "Closed",
    exit: exit_
  };
  if (self.state._tag === "Empty") {
    self.state = closed;
    return;
  }
  const state = self.state;
  self.state = closed;
  if (state.finalizer !== void 0) {
    return state.finalizer(exit_);
  }
  const finalizers = state.finalizers;
  if (finalizers === void 0 || finalizers.size === 0) {
    return;
  } else if (finalizers.size === 1) {
    return finalizers.values().next().value(exit_);
  }
  return scopeCloseFinalizers(self, finalizers, exit_);
};
var combineFinalizerCause = (exit_, finalizer) => exitIsSuccess(exit_) ? finalizer : catchCause(finalizer, (cause) => failCause(causeCombine(exit_.cause, cause)));
var scopeCloseFinalizers = /* @__PURE__ */ fnUntraced(function* (self, finalizers, exit_) {
  let exits = [];
  const fibers = [];
  const arr = Array.from(finalizers.values());
  const parent = getCurrentFiber();
  for (let i = arr.length - 1; i >= 0; i--) {
    const finalizer = arr[i];
    if (self.strategy === "sequential") {
      exits.push(yield* exit(finalizer(exit_)));
    } else {
      fibers.push(forkUnsafe(parent, finalizer(exit_), true, true, "inherit"));
    }
  }
  if (fibers.length > 0) {
    exits = yield* fiberAwaitAll(fibers);
  }
  return yield* exitAsVoidAll(exits);
});
var scopeForkUnsafe = (scope3, finalizerStrategy) => {
  const newScope = scopeMakeUnsafe(finalizerStrategy);
  if (scope3.state._tag === "Closed") {
    newScope.state = scope3.state;
    return newScope;
  }
  const key = {};
  scopeAddFinalizerUnsafe(scope3, key, (exit3) => scopeClose(newScope, exit3));
  scopeAddFinalizerUnsafe(newScope, key, (_) => sync(() => scopeRemoveFinalizerUnsafe(scope3, key)));
  return newScope;
};
var scopeAddFinalizerExit = (scope3, finalizer) => {
  return suspend(() => {
    if (scope3.state._tag === "Closed") {
      return finalizer(scope3.state.exit);
    }
    scopeAddFinalizerUnsafe(scope3, {}, finalizer);
    return void_;
  });
};
var scopeAddFinalizer = (scope3, finalizer) => scopeAddFinalizerExit(scope3, constant(finalizer));
var scopeAddFinalizerUnsafe = (scope3, key, finalizer) => {
  if (scope3.state._tag === "Empty") {
    scope3.state = {
      _tag: "Open",
      finalizerKey: key,
      finalizer,
      finalizers: void 0
    };
  } else if (scope3.state._tag === "Open") {
    const state = scope3.state;
    if (state.finalizer !== void 0) {
      state.finalizers = /* @__PURE__ */ new Map([[state.finalizerKey, state.finalizer]]);
      state.finalizerKey = void 0;
      state.finalizer = void 0;
      state.finalizers.set(key, finalizer);
    } else if (state.finalizers === void 0) {
      state.finalizerKey = key;
      state.finalizer = finalizer;
    } else {
      state.finalizers.set(key, finalizer);
    }
  }
};
var scopeRemoveFinalizerUnsafe = (scope3, key) => {
  if (scope3.state._tag === "Open") {
    const state = scope3.state;
    if (state.finalizerKey === key) {
      state.finalizerKey = void 0;
      state.finalizer = void 0;
    } else if (state.finalizers !== void 0) {
      state.finalizers.delete(key);
    }
  }
};
var scopeFinalizerCountUnsafe = (scope3) => scope3.state._tag !== "Open" ? 0 : scope3.state.finalizer !== void 0 ? 1 : scope3.state.finalizers?.size ?? 0;
var scopeMakeUnsafe = (finalizerStrategy = "sequential") => ({
  [ScopeCloseableTypeId]: ScopeCloseableTypeId,
  [ScopeTypeId]: ScopeTypeId,
  strategy: finalizerStrategy,
  state: constScopeEmpty
});
var constScopeEmpty = {
  _tag: "Empty"
};
var scope = scopeTag;
var provideScope = /* @__PURE__ */ provideService(scopeTag);
var scoped = (self) => withFiber((fiber3) => {
  const prev = fiber3.context;
  const scope3 = scopeMakeUnsafe();
  fiber3.setContext(add(fiber3.context, scopeTag, scope3));
  return onExitPrimitive(self, (exit3) => {
    fiber3.setContext(prev);
    return scopeCloseUnsafe(scope3, exit3);
  });
});
var scopedWith = (f) => suspend(() => {
  const scope3 = scopeMakeUnsafe();
  return onExit(f(scope3), (exit3) => suspend(() => scopeCloseUnsafe(scope3, exit3) ?? void_));
});
var acquireRelease = (acquire2, release2, options) => contextWith((context3) => uninterruptibleMask((restore) => flatMap2(scope, (scope3) => tap(options?.interruptible ? restore(acquire2) : acquire2, (a) => scopeAddFinalizerExit(scope3, (exit3) => provideContext(release2(a, exit3), context3))))));
var addFinalizer = (finalizer) => flatMap2(scope, (scope3) => contextWith((context3) => scopeAddFinalizerExit(scope3, (exit3) => provideContext(finalizer(exit3), context3))));
var onExitPrimitive = /* @__PURE__ */ makePrimitive({
  op: "OnExit",
  single: false,
  [evaluate](fiber3) {
    fiber3._stack.push(this);
    return this[args][0];
  },
  [contAll](fiber3) {
    if (fiber3.interruptible && this[args][2] !== true) {
      fiber3._stack.push(setInterruptibleTrue);
      fiber3.interruptible = false;
    }
  },
  [contA](value, _, exit3) {
    exit3 ??= exitSucceed(value);
    const eff = this[args][1](exit3);
    return eff ? flatMap2(eff, (_2) => exit3) : exit3;
  },
  [contE](cause, _, exit3) {
    exit3 ??= exitFailCause(cause);
    const eff = this[args][1](exit3);
    return eff ? flatMap2(combineFinalizerCause(exit3, eff), (_2) => exit3) : exit3;
  }
});
var onExit = /* @__PURE__ */ dual(2, onExitPrimitive);
var ensuring = /* @__PURE__ */ dual(2, (self, finalizer) => onExit(self, (_) => finalizer));
var onExitIf = /* @__PURE__ */ dual(3, (self, predicate, f) => onExit(self, (exit3) => {
  if (!predicate(exit3)) {
    return void_;
  }
  return f(exit3);
}));
var onExitFilter = /* @__PURE__ */ dual(3, (self, filter9, f) => onExit(self, (exit3) => {
  const b = filter9(exit3);
  return isFailure2(b) ? void_ : f(b.success, exit3);
}));
var onError = /* @__PURE__ */ dual(2, (self, f) => onExitFilter(self, exitFilterCause, f));
var onErrorIf = /* @__PURE__ */ dual(3, (self, predicate, f) => onExitIf(self, (exit3) => {
  if (exit3._tag !== "Failure") {
    return false;
  }
  return predicate(exit3.cause);
}, (exit3) => f(exit3.cause)));
var onErrorFilter = /* @__PURE__ */ dual(3, (self, filter9, f) => onExit(self, (exit3) => {
  if (exit3._tag !== "Failure") {
    return void_;
  }
  const result4 = filter9(exit3.cause);
  return isFailure2(result4) ? void_ : f(result4.success, exit3.cause);
}));
var onInterrupt = /* @__PURE__ */ dual(2, (self, finalizer) => onErrorFilter(causeFilterInterruptors, finalizer)(self));
var acquireUseRelease = (acquire2, use, release2) => uninterruptibleMask((restore) => flatMap2(acquire2, (a) => onExitPrimitive(restore(use(a)), (exit3) => release2(a, exit3), true)));
var acquireDisposable = (acquire2) => acquireRelease(acquire2, (resource) => hasProperty(resource, Symbol.asyncDispose) ? promise(() => resource[Symbol.asyncDispose]()) : sync(() => resource[Symbol.dispose]()));
var cachedInvalidateWithTTL = /* @__PURE__ */ dual(2, (self, ttl) => sync(() => {
  const ttlMillis = toMillis(fromInputUnsafe(ttl));
  const isFinite3 = Number.isFinite(ttlMillis);
  const latch = makeLatchUnsafe(false);
  let expiresAt = 0;
  let running = false;
  let exit3;
  const wait = flatMap2(latch.await, () => exit3);
  return [withFiber((fiber3) => {
    const clock = fiber3.getRef(ClockRef);
    const now2 = isFinite3 ? clock.currentTimeMillisUnsafe() : 0;
    if (running || now2 < expiresAt) return exit3 ?? wait;
    running = true;
    latch.closeUnsafe();
    exit3 = void 0;
    return onExit(self, (exit_) => sync(() => {
      running = false;
      expiresAt = clock.currentTimeMillisUnsafe() + ttlMillis;
      exit3 = exit_;
      latch.openUnsafe();
    }));
  }), sync(() => {
    expiresAt = 0;
    latch.closeUnsafe();
    exit3 = void 0;
  })];
}));
var cachedWithTTL = /* @__PURE__ */ dual(2, (self, timeToLive) => map4(cachedInvalidateWithTTL(self, timeToLive), (tuple2) => tuple2[0]));
var cached = (self) => cachedWithTTL(self, infinity);
var interrupt = /* @__PURE__ */ withFiber((fiber3) => failCause(causeInterrupt(fiber3.id)));
var uninterruptible = (self) => withFiber((fiber3) => {
  if (!fiber3.interruptible) return self;
  fiber3.interruptible = false;
  fiber3._stack.push(setInterruptibleTrue);
  return self;
});
var setInterruptible = /* @__PURE__ */ makePrimitive({
  op: "SetInterruptible",
  [contAll](fiber3) {
    fiber3.interruptible = this[args];
    if (fiber3._interruptedCause && fiber3.interruptible) {
      return () => failCause(fiber3._interruptedCause);
    }
  }
});
var setInterruptibleTrue = /* @__PURE__ */ setInterruptible(true);
var setInterruptibleFalse = /* @__PURE__ */ setInterruptible(false);
var setFiberInterruptible = (fiber3) => {
  fiber3.interruptible = true;
  fiber3._stack.push(setInterruptibleFalse);
  if (fiber3._interruptedCause) return failCause(fiber3._interruptedCause);
};
var interruptible = (self) => withFiber((fiber3) => {
  if (fiber3.interruptible) return self;
  return setFiberInterruptible(fiber3) ?? self;
});
var uninterruptibleMask = (f) => withFiber((fiber3) => {
  if (!fiber3.interruptible) return f(identity);
  fiber3.interruptible = false;
  fiber3._stack.push(setInterruptibleTrue);
  return f(interruptible);
});
var interruptibleMask = (f) => withFiber((fiber3) => {
  if (fiber3.interruptible) return f(identity);
  const interrupted = setFiberInterruptible(fiber3);
  const effect2 = f(uninterruptible);
  return interrupted ?? effect2;
});
var abortSignal = /* @__PURE__ */ map4(/* @__PURE__ */ acquireRelease(/* @__PURE__ */ sync(() => new AbortController()), (controller) => sync(() => controller.abort())), (_) => _.signal);
var all = (arg, options) => {
  if (isIterable(arg)) {
    return options?.mode === "result" ? forEach(arg, result, options) : forEach(arg, identity, options);
  } else if (options?.discard) {
    return options.mode === "result" ? forEach(Object.values(arg), result, options) : forEach(Object.values(arg), identity, options);
  }
  return suspend(() => {
    const out2 = {};
    return as(forEach(Object.entries(arg), ([key, effect2]) => map4(options?.mode === "result" ? result(effect2) : effect2, (value) => {
      assignProperty(out2, key, value);
    }), {
      discard: true,
      concurrency: options?.concurrency
    }), out2);
  });
};
var partition2 = /* @__PURE__ */ dual((args2) => isIterable(args2[0]) && !isEffect(args2[0]), (elements, f, options) => map4(forEach(elements, (a, i) => result(f(a, i)), options), (results) => partition(results, identity)));
var reduce = /* @__PURE__ */ dual(3, (elements, zero2, f) => {
  const arr = fromIterable(elements);
  if (arr.length === 0) return sync(zero2);
  return suspend(() => {
    let index = 0;
    let state = zero2();
    return map4(whileLoop({
      while: () => index < arr.length,
      body: () => f(state, arr[index], index),
      step(next) {
        state = next;
        index++;
      }
    }), () => state);
  });
});
var validate = /* @__PURE__ */ dual((args2) => isIterable(args2[0]) && !isEffect(args2[0]), (elements, f, options) => flatMap2(partition2(elements, f, {
  concurrency: options?.concurrency
}), ([excluded, satisfying]) => {
  if (isArrayNonEmpty2(excluded)) {
    return fail3(excluded);
  }
  return options?.discard ? void_ : succeed3(satisfying);
}));
var findFirst = /* @__PURE__ */ dual((args2) => isIterable(args2[0]) && !isEffect(args2[0]), (elements, predicate) => suspend(() => {
  const iterator = elements[Symbol.iterator]();
  const next = iterator.next();
  if (!next.done) {
    return findFirstLoop(iterator, 0, predicate, next.value);
  }
  return succeed3(none2());
}));
var findFirstLoop = (iterator, index, predicate, value) => flatMap2(predicate(value, index), (keep) => {
  if (keep) {
    return succeed3(some2(value));
  }
  const next = iterator.next();
  if (!next.done) {
    return findFirstLoop(iterator, index + 1, predicate, next.value);
  }
  return succeed3(none2());
});
var findFirstFilter = /* @__PURE__ */ dual((args2) => isIterable(args2[0]) && !isEffect(args2[0]), (elements, filter9) => suspend(() => {
  const iterator = elements[Symbol.iterator]();
  const next = iterator.next();
  if (!next.done) {
    return findFirstFilterLoop(iterator, 0, filter9, next.value);
  }
  return succeed3(none2());
}));
var findFirstFilterLoop = (iterator, index, filter9, value) => flatMap2(filter9(value, index), (result4) => {
  if (isSuccess2(result4)) {
    return succeed3(some2(result4.success));
  }
  const next = iterator.next();
  if (!next.done) {
    return findFirstFilterLoop(iterator, index + 1, filter9, next.value);
  }
  return succeed3(none2());
});
var whileLoop = /* @__PURE__ */ makePrimitive({
  op: "While",
  [contA](value, fiber3) {
    this[args].step(value);
    if (this[args].while()) {
      fiber3._stack.push(this);
      return this[args].body();
    }
    return exitVoid;
  },
  [evaluate](fiber3) {
    if (this[args].while()) {
      fiber3._stack.push(this);
      return this[args].body();
    }
    return exitVoid;
  }
});
var forEach = /* @__PURE__ */ dual((args2) => typeof args2[1] === "function", (iterable, f, options) => suspend(() => {
  const concurrencyOption = options?.concurrency ?? 1;
  const concurrency = concurrencyOption === "unbounded" ? Number.POSITIVE_INFINITY : Math.max(1, concurrencyOption);
  if (concurrency === 1) {
    return forEachSequential(iterable, f, options);
  }
  const items = fromIterable(iterable);
  let length = items.length;
  if (length === 0) {
    return options?.discard ? void_ : succeed3([]);
  }
  const out2 = options?.discard ? void 0 : new Array(length);
  const eff = forEachConcurrent({
    f,
    out: out2
  }, items, {
    concurrency
  });
  return eff ? as(eff, out2) : succeed3(out2);
}));
var head = (self) => flatMap2(self, (elements) => {
  const result4 = elements[Symbol.iterator]().next();
  return result4.done ? fail3(new NoSuchElementError()) : succeed3(result4.value);
});
var forEachSequential = (iterable, f, options) => suspend(() => {
  const out2 = options?.discard ? void 0 : [];
  const iterator = iterable[Symbol.iterator]();
  let state = iterator.next();
  let index = 0;
  return as(whileLoop({
    while: () => !state.done,
    body: () => f(state.value, index++),
    step: (b) => {
      if (out2) out2.push(b);
      state = iterator.next();
    }
  }), out2);
});
var iterateEagerImpl = (options) => {
  const onItem = options.onItem;
  const step = options.step;
  const runSequential = (state, items, index, end3) => {
    for (; index < end3; index++) {
      const item = items[index];
      const effect2 = onItem(state, item, index);
      if (!effectIsExit(effect2)) {
        return flatMap2(exit(effect2), (itemExit) => step(state, item, itemExit, index) ?? runSequential(state, items, index + 1, end3) ?? void_);
      }
      const terminal = step(state, item, effect2, index);
      if (terminal) return terminal._tag === "Failure" ? terminal : void 0;
    }
  };
  return (state, items, opts) => {
    let index = 0;
    const end3 = opts?.end ?? items.length;
    const concurrency = opts?.concurrency ?? 1;
    if (concurrency === 1) {
      return runSequential(state, items, 0, end3);
    }
    const orderedStep = opts?.orderedStep === true;
    let done4 = false;
    let parentFiber;
    let fibers;
    let resume;
    let interrupted = false;
    let terminal;
    let effect2;
    let nextIndex = index;
    const exits = orderedStep ? new Array(end3) : void 0;
    const failDefect = (error) => {
      const defect = exitDie(error);
      terminal = defect;
      done4 = true;
      interrupted = true;
      return fibers && fibers.size > 0 ? flatMap2(uninterruptible(fiberInterruptAll(Array.from(fibers))), () => defect) : defect;
    };
    const runStep = (item, exit3, currentIndex) => {
      if (!orderedStep) return step(state, item, exit3, currentIndex);
      if (terminal) return terminal;
      exits[currentIndex] = exit3;
      while (nextIndex < end3) {
        const nextExit = exits[nextIndex];
        if (nextExit === void 0) return;
        exits[nextIndex] = void 0;
        const index2 = nextIndex++;
        const result4 = step(state, items[index2], nextExit, index2);
        if (result4) return result4;
      }
    };
    const go = () => {
      let paused = false;
      for (; !terminal && index < end3; index++) {
        const item = items[index];
        const eff = effect2 ?? onItem(state, item, index);
        if (effectIsExit(eff)) {
          terminal = runStep(item, eff, index);
          if (terminal) break;
        } else if (!parentFiber) {
          return callback((cb) => {
            parentFiber = getCurrentFiber();
            fibers = /* @__PURE__ */ new Set();
            effect2 = eff;
            resume = cb;
            let result4;
            try {
              result4 = go();
            } catch (error) {
              return cb(failDefect(error));
            }
            if (result4) return cb(result4);
            return suspend(() => {
              terminal = exitVoid;
              interrupted = true;
              return fibers ? fiberInterruptAll(fibers) : void_;
            });
          });
        } else {
          effect2 = void 0;
          const fiber3 = forkUnsafe(parentFiber, eff, true, true, "inherit");
          if (fiber3._exit) {
            terminal = runStep(item, fiber3._exit, index);
            if (terminal) break;
            continue;
          }
          fibers.add(fiber3);
          const currentIndex = index;
          fiber3.addObserver((exit3) => {
            fibers.delete(fiber3);
            try {
              if (terminal) {
                if (!interrupted && exit3._tag === "Failure") {
                  for (const reason of exit3.cause.reasons) {
                    if (reason._tag === "Interrupt") continue;
                    else if (terminal._tag === "Failure") {
                      ;
                      terminal.cause.reasons.push(reason);
                    } else {
                      terminal = exitFailCause(causeFromReasons([reason]));
                    }
                  }
                }
              } else {
                const result4 = runStep(item, exit3, currentIndex);
                if (result4) {
                  terminal = result4._tag === "Failure" ? exitFailCause(causeFromReasons(result4.cause.reasons.slice())) : result4;
                  go();
                }
              }
              if (paused) {
                const eff2 = go();
                if (eff2) resume(eff2);
              } else if (done4 && fibers.size === 0) {
                resume(terminal ?? void_);
              }
            } catch (error) {
              resume(failDefect(error));
            }
          });
          if (fibers.size < concurrency) continue;
          paused = true;
          index++;
          return;
        }
      }
      done4 = true;
      if (terminal) {
        if (fibers && fibers.size > 0) {
          const annotations = fiberStackAnnotations(parentFiber);
          fibers.forEach((f) => f.interruptUnsafe(parentFiber.id, annotations));
          return;
        }
        if (resume || terminal._tag === "Failure") {
          return terminal;
        }
      } else if (resume) {
        if (!fibers) {
          return exitVoid;
        } else if (fibers.size === 0) {
          resume(void_);
        }
      }
    };
    return go();
  };
};
var iterateEager = () => iterateEagerImpl;
var forEachConcurrent = /* @__PURE__ */ iterateEagerImpl({
  onItem(state, item, index) {
    return state.f(item, index);
  },
  step(state, _, exit3, index) {
    if (exit3._tag === "Failure") return exit3;
    else if (state.out) {
      state.out[index] = exit3.value;
    }
  }
});
var filterOrElse = /* @__PURE__ */ dual(3, (self, predicate, orElse) => flatMap2(self, (a) => predicate(a) ? succeed3(a) : orElse(a)));
var filterMapOrElse = /* @__PURE__ */ dual(3, (self, filter9, orElse) => flatMap2(self, (a) => {
  const result4 = filter9(a);
  return isFailure2(result4) ? orElse(result4.failure) : succeed3(result4.success);
}));
var filterMapOrFail = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, filter9, orFailWith) => filterMapOrElse(self, filter9, orFailWith ? (x) => fail3(orFailWith(x)) : () => fail3(new NoSuchElementError())));
var filter4 = /* @__PURE__ */ dual((args2) => isIterable(args2[0]) && !isEffect(args2[0]), (elements, predicate, options) => suspend(() => {
  const out2 = [];
  return as(forEach(elements, (a, i) => {
    const result4 = predicate(a, i);
    if (typeof result4 === "boolean") {
      if (result4) out2.push(a);
      return void_;
    }
    return map4(result4, (keep) => {
      if (keep) {
        out2.push(a);
      }
    });
  }, {
    discard: true,
    concurrency: options?.concurrency
  }), out2);
}));
var filterMap = /* @__PURE__ */ dual((args2) => isIterable(args2[0]) && !isEffect(args2[0]), (elements, filter9) => suspend(() => {
  const out2 = [];
  for (const a of elements) {
    const result4 = filter9(a);
    if (isSuccess2(result4)) {
      out2.push(result4.success);
    }
  }
  return succeed3(out2);
}));
var filterMapEffect = /* @__PURE__ */ dual((args2) => isIterable(args2[0]) && !isEffect(args2[0]), (elements, filter9, options) => suspend(() => {
  const out2 = [];
  return as(forEach(elements, (a) => map4(filter9(a), (result4) => {
    if (isSuccess2(result4)) {
      out2.push(result4.success);
    }
  }), {
    discard: true,
    concurrency: options?.concurrency
  }), out2);
}));
var Do = /* @__PURE__ */ succeed3({});
var bindTo2 = /* @__PURE__ */ bindTo(map4);
var bind2 = /* @__PURE__ */ bind(map4, flatMap2);
var let_2 = /* @__PURE__ */ let_(map4);
var forkChild = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, options) => withFiber((fiber3) => {
  interruptChildrenPatch();
  return succeed3(forkUnsafe(fiber3, self, options?.startImmediately, false, options?.uninterruptible ?? false));
}));
var forkUnsafe = (parent, effect2, immediate = false, daemon = false, uninterruptible3 = false) => {
  const parentRuntime = parent;
  const interruptible3 = uninterruptible3 === "inherit" ? parentRuntime.interruptible : !uninterruptible3;
  const child = new FiberImpl(parentRuntime.context, interruptible3);
  if (immediate) {
    child.evaluate(effect2);
  } else {
    parentRuntime.currentDispatcher.scheduleTask(() => child.evaluate(effect2), 0);
  }
  if (!daemon && !child._exit) {
    parentRuntime.children().add(child);
    child.addObserver(() => parentRuntime._children.delete(child));
  }
  return child;
};
var forkDetach = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, options) => withFiber((fiber3) => succeed3(forkUnsafe(fiber3, self, options?.startImmediately, true, options?.uninterruptible))));
var awaitAllChildren = (self) => withFiber((fiber3) => {
  const initialChildren = fiber3._children && new Set(fiber3._children);
  return onExit(self, (_) => {
    let children = fiber3._children;
    if (children === void 0 || children.size === 0) {
      return void_;
    } else if (initialChildren) {
      children = filter2(children, (child) => !initialChildren.has(child));
    }
    return asVoid(fiberAwaitAll(children));
  });
});
var forkIn = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, scope3, options) => withFiber((parent) => {
  const fiber3 = forkUnsafe(parent, self, options?.startImmediately, true, options?.uninterruptible);
  if (!fiber3._exit) {
    if (scope3.state._tag !== "Closed") {
      const key = {};
      const finalizer = () => withFiberId((interruptor) => interruptor === fiber3.id ? void_ : fiberInterrupt(fiber3));
      scopeAddFinalizerUnsafe(scope3, key, finalizer);
      fiber3.addObserver(() => scopeRemoveFinalizerUnsafe(scope3, key));
    } else {
      fiber3.interruptUnsafe(parent.id, fiberStackAnnotations(parent));
    }
  }
  return succeed3(fiber3);
}));
var forkScoped = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, options) => flatMap2(scope, (scope3) => forkIn(self, scope3, options)));
var runForkWith = (context3) => (effect2, options) => {
  const fiber3 = new FiberImpl(options?.scheduler ? add(context3, Scheduler, options.scheduler) : context3, options?.uninterruptible !== true);
  fiber3.evaluate(effect2);
  if (fiber3._exit) return fiber3;
  if (options?.signal) {
    if (options.signal.aborted) {
      fiber3.interruptUnsafe();
    } else {
      const abort = () => fiber3.interruptUnsafe();
      options.signal.addEventListener("abort", abort, {
        once: true
      });
      fiber3.addObserver(() => options.signal.removeEventListener("abort", abort));
    }
  }
  if (options?.onFiberStart) {
    options.onFiberStart(fiber3);
  }
  return fiber3;
};
var fiberRunIn = /* @__PURE__ */ dual(2, (self, scope3) => {
  if (self._exit) {
    return self;
  } else if (scope3.state._tag === "Closed") {
    self.interruptUnsafe(self.id);
    return self;
  }
  const key = {};
  scopeAddFinalizerUnsafe(scope3, key, () => fiberInterrupt(self));
  self.addObserver(() => scopeRemoveFinalizerUnsafe(scope3, key));
  return self;
});
var runFork = /* @__PURE__ */ runForkWith(/* @__PURE__ */ empty2());
var runCallbackWith = (context3) => {
  const runFork3 = runForkWith(context3);
  return (effect2, options) => {
    const fiber3 = runFork3(effect2, options);
    if (options?.onExit) {
      fiber3.addObserver(options.onExit);
    }
    return (interruptor) => {
      return fiber3.interruptUnsafe(interruptor);
    };
  };
};
var runCallback = /* @__PURE__ */ runCallbackWith(/* @__PURE__ */ empty2());
var runPromiseExitWith = (context3) => {
  const runFork3 = runForkWith(context3);
  return (effect2, options) => {
    const fiber3 = runFork3(effect2, options);
    return new Promise((resolve6) => {
      fiber3.addObserver((exit3) => resolve6(exit3));
    });
  };
};
var runPromiseExit = /* @__PURE__ */ runPromiseExitWith(/* @__PURE__ */ empty2());
var runPromiseWith = (context3) => {
  const runPromiseExit3 = runPromiseExitWith(context3);
  return (effect2, options) => runPromiseExit3(effect2, options).then((exit3) => {
    if (exit3._tag === "Failure") {
      throw causeSquash(exit3.cause);
    }
    return exit3.value;
  });
};
var runPromise = /* @__PURE__ */ runPromiseWith(/* @__PURE__ */ empty2());
var runSyncExitWith = (context3) => {
  const runFork3 = runForkWith(context3);
  return (effect2) => {
    if (effectIsExit(effect2)) return effect2;
    const scheduler = new MixedScheduler("sync");
    const fiber3 = runFork3(effect2, {
      scheduler
    });
    fiber3._dispatcher?.flush();
    return fiber3._exit ?? exitDie(new AsyncFiberError(fiber3));
  };
};
var runSyncExit = /* @__PURE__ */ runSyncExitWith(/* @__PURE__ */ empty2());
var runSyncWith = (context3) => {
  const runSyncExit3 = runSyncExitWith(context3);
  return (effect2) => {
    const exit3 = runSyncExit3(effect2);
    if (exit3._tag === "Failure") throw causeSquash(exit3.cause);
    return exit3.value;
  };
};
var runSync = /* @__PURE__ */ runSyncWith(/* @__PURE__ */ empty2());
var succeedTrue = /* @__PURE__ */ succeed3(true);
var succeedFalse = /* @__PURE__ */ succeed3(false);
var Latch = class {
  waiters = [];
  scheduled = void 0;
  _isOpen;
  constructor(isOpen) {
    this._isOpen = isOpen;
  }
  scheduleUnsafe(fiber3) {
    if (this.waiters.length === 0) {
      return succeedTrue;
    }
    if (this.scheduled === void 0) {
      this.scheduled = this.waiters;
      fiber3.currentDispatcher.scheduleTask(this.flushScheduled, 0);
    } else {
      for (let i = 0; i < this.waiters.length; i++) {
        this.scheduled.push(this.waiters[i]);
      }
    }
    this.waiters = [];
    return succeedTrue;
  }
  flushScheduled = () => {
    if (this.scheduled === void 0) return;
    const waiters = this.scheduled;
    this.scheduled = void 0;
    for (let i = 0; i < waiters.length; i++) {
      waiters[i](exitVoid);
    }
  };
  flushWaiters() {
    const waiters = this.waiters;
    this.waiters = [];
    this.flushScheduled();
    for (let i = 0; i < waiters.length; i++) {
      waiters[i](exitVoid);
    }
  }
  open = /* @__PURE__ */ withFiber((fiber3) => {
    if (this._isOpen) return succeedFalse;
    this._isOpen = true;
    return this.scheduleUnsafe(fiber3);
  });
  release = /* @__PURE__ */ withFiber((fiber3) => this._isOpen ? succeedFalse : this.scheduleUnsafe(fiber3));
  openUnsafe() {
    if (this._isOpen) return false;
    this._isOpen = true;
    this.flushWaiters();
    return true;
  }
  await = /* @__PURE__ */ callback((resume) => {
    if (this._isOpen) {
      return resume(void_);
    }
    this.waiters.push(resume);
    return sync(() => {
      let index = this.waiters.indexOf(resume);
      if (index !== -1) {
        this.waiters.splice(index, 1);
      } else if (this.scheduled !== void 0) {
        index = this.scheduled.indexOf(resume);
        if (index !== -1) {
          this.scheduled.splice(index, 1);
        }
      }
    });
  });
  closeUnsafe() {
    if (!this._isOpen) return false;
    this._isOpen = false;
    return true;
  }
  close = /* @__PURE__ */ sync(() => this.closeUnsafe());
  whenOpen = (self) => flatMap2(this.await, () => self);
  isOpen() {
    return this._isOpen;
  }
};
var makeLatchUnsafe = (open3) => new Latch(open3 ?? false);
var makeLatch = (open3) => sync(() => makeLatchUnsafe(open3));
var tracer = /* @__PURE__ */ withFiber((fiber3) => succeed3(fiber3.getRef(Tracer)));
var withTracer = /* @__PURE__ */ dual(2, (effect2, tracer3) => provideService(effect2, Tracer, tracer3));
var withTracerEnabled = /* @__PURE__ */ provideService(TracerEnabled);
var withTracerTiming = /* @__PURE__ */ provideService(TracerTimingEnabled);
var bigint02 = /* @__PURE__ */ BigInt(0);
var NoopSpanProto = {
  _tag: "Span",
  spanId: "noop",
  traceId: "noop",
  sampled: false,
  status: {
    _tag: "Ended",
    startTime: bigint02,
    endTime: bigint02,
    exit: exitVoid
  },
  attributes: /* @__PURE__ */ new Map(),
  links: [],
  kind: "internal",
  attribute() {
  },
  event() {
  },
  end() {
  },
  addLinks() {
  }
};
var noopSpan = (options) => Object.assign(Object.create(NoopSpanProto), options);
var filterDisablePropagation = (span2) => {
  if (!span2) return none2();
  return get(span2.annotations, DisablePropagation) ? span2._tag === "Span" ? filterDisablePropagation(getOrUndefined(span2.parent)) : none2() : some2(span2);
};
var makeSpanUnsafe = (fiber3, name, options) => {
  const disablePropagation = !fiber3.getRef(TracerEnabled) || options?.annotations && get(options.annotations, DisablePropagation);
  const parent = options?.parent !== void 0 ? some2(options.parent) : options?.root ? none2() : filterDisablePropagation(fiber3.currentSpan);
  let span2;
  if (disablePropagation) {
    span2 = noopSpan({
      name,
      parent,
      annotations: add(options?.annotations ?? empty2(), DisablePropagation, true)
    });
  } else {
    const tracer3 = fiber3.getRef(Tracer);
    const clock = fiber3.getRef(ClockRef);
    const timingEnabled = fiber3.getRef(TracerTimingEnabled);
    const annotationsFromEnv = fiber3.getRef(TracerSpanAnnotations);
    const linksFromEnv = fiber3.getRef(TracerSpanLinks);
    const level = options?.level ?? fiber3.getRef(CurrentTraceLevel);
    const links = options?.links !== void 0 ? [...linksFromEnv, ...options.links] : linksFromEnv.length === 0 ? [] : linksFromEnv.slice();
    span2 = tracer3.span({
      name,
      parent,
      annotations: options?.annotations ?? empty2(),
      links,
      startTime: timingEnabled ? clock.currentTimeNanosUnsafe() : BigInt(0),
      kind: options?.kind ?? "internal",
      root: options?.root ?? isNone2(parent),
      sampled: options?.sampled ?? (isSome2(parent) && parent.value.sampled === false ? false : !isLogLevelGreaterThan(fiber3.getRef(MinimumTraceLevel), level))
    });
    for (const key in annotationsFromEnv) {
      span2.attribute(key, annotationsFromEnv[key]);
    }
    if (options?.attributes !== void 0) {
      for (const key in options.attributes) {
        span2.attribute(key, options.attributes[key]);
      }
    }
  }
  return span2;
};
var makeSpan = (name, options) => withFiber((fiber3) => succeed3(makeSpanUnsafe(fiber3, name, options)));
var makeSpanScoped = (name, options) => uninterruptible(withFiber((fiber3) => {
  const scope3 = getUnsafe2(fiber3.context, scopeTag);
  const span2 = makeSpanUnsafe(fiber3, name, options ?? {});
  const clock = fiber3.getRef(ClockRef);
  const timingEnabled = fiber3.getRef(TracerTimingEnabled);
  return as(scopeAddFinalizerExit(scope3, (exit3) => endSpan(span2, exit3, clock, timingEnabled)), span2);
}));
var withSpanScoped = function() {
  const dataFirst = typeof arguments[0] !== "string";
  const name = dataFirst ? arguments[1] : arguments[0];
  const options = addSpanStackTrace(dataFirst ? arguments[2] : arguments[1]);
  if (dataFirst) {
    const self = arguments[0];
    return flatMap2(makeSpanScoped(name, options), (span2) => withParentSpan(self, span2, options));
  }
  return (self) => flatMap2(makeSpanScoped(name, options), (span2) => withParentSpan(self, span2, options));
};
var provideSpanStackFrame = (name, stack) => {
  stack = typeof stack === "function" ? stack : constUndefined;
  return updateService(CurrentStackFrame, (parent) => ({
    name,
    stack,
    parent
  }));
};
var spanAnnotations = TracerSpanAnnotations;
var spanLinks = TracerSpanLinks;
var linkSpans = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, span2, attributes = {}) => {
  const spans = Array.isArray(span2) ? span2 : [span2];
  const links = spans.map((span3) => ({
    span: span3,
    attributes
  }));
  return updateService(self, TracerSpanLinks, (current) => [...current, ...links]);
});
var endSpan = (span2, exit3, clock, timingEnabled) => sync(() => {
  if (span2.status._tag === "Ended") return;
  span2.end(timingEnabled ? clock.currentTimeNanosUnsafe() : bigint02, exit3);
});
var useSpan = (name, ...args2) => {
  const options = args2.length === 1 ? void 0 : args2[0];
  const evaluate2 = args2[args2.length - 1];
  return withFiber((fiber3) => {
    const span2 = makeSpanUnsafe(fiber3, name, options);
    const clock = fiber3.getRef(ClockRef);
    const timingEnabled = fiber3.getRef(TracerTimingEnabled);
    return onExit(internalCall(() => evaluate2(span2)), (exit3) => endSpan(span2, exit3, clock, timingEnabled));
  });
};
var provideParentSpan = /* @__PURE__ */ provideService(ParentSpan);
var withParentSpan = function() {
  const dataFirst = isEffect(arguments[0]);
  const span2 = dataFirst ? arguments[1] : arguments[0];
  let options = dataFirst ? arguments[2] : arguments[1];
  let provideStackFrame = identity;
  if (span2._tag === "Span") {
    options = addSpanStackTrace(options);
    provideStackFrame = provideSpanStackFrame(span2.name, options?.captureStackTrace);
  }
  if (dataFirst) {
    return provideParentSpan(provideStackFrame(arguments[0]), span2);
  }
  return (self) => provideParentSpan(provideStackFrame(self), span2);
};
var withSpan = function() {
  const dataFirst = typeof arguments[0] !== "string";
  const name = dataFirst ? arguments[1] : arguments[0];
  const traceOptions = addSpanStackTrace(arguments[2]);
  if (dataFirst) {
    const self = arguments[0];
    return useSpan(name, arguments[2], (span2) => withParentSpan(self, span2, traceOptions));
  }
  const fnArg = typeof arguments[1] === "function" ? arguments[1] : void 0;
  const options = fnArg ? void 0 : arguments[1];
  return (self, ...args2) => useSpan(name, fnArg ? fnArg(...args2) : options, (span2) => withParentSpan(self, span2, traceOptions));
};
var annotateSpans = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (effect2, ...args2) => updateService(effect2, TracerSpanAnnotations, (annotations) => {
  const newAnnotations = args2.length === 1 ? {
    ...annotations,
    ...args2[0]
  } : {
    ...annotations
  };
  if (args2.length === 1) {
    return newAnnotations;
  } else {
    assignProperty(newAnnotations, args2[0], args2[1]);
  }
  return newAnnotations;
}));
var annotateCurrentSpan = (...args2) => withFiber((fiber3) => {
  const span2 = fiber3.currentSpanLocal;
  if (span2) {
    if (args2.length === 1) {
      for (const [key, value] of Object.entries(args2[0])) {
        span2.attribute(key, value);
      }
    } else {
      span2.attribute(args2[0], args2[1]);
    }
  }
  return void_;
});
var currentSpan = /* @__PURE__ */ withFiber((fiber3) => {
  const span2 = fiber3.currentSpanLocal;
  return span2 ? succeed3(span2) : fail3(new NoSuchElementError());
});
var currentParentSpan = /* @__PURE__ */ serviceOptional(ParentSpan);
var ClockRef = /* @__PURE__ */ Reference("effect/Clock", {
  defaultValue: () => new ClockImpl()
});
var MAX_TIMER_MILLIS = 2 ** 31 - 1;
var ClockImpl = class {
  currentTimeMillisUnsafe() {
    return Date.now();
  }
  currentTimeMillis = /* @__PURE__ */ sync(() => this.currentTimeMillisUnsafe());
  currentTimeNanosUnsafe() {
    return wallTimeNanos();
  }
  currentTimeNanos = /* @__PURE__ */ sync(() => this.currentTimeNanosUnsafe());
  monotonicTimeNanosUnsafe() {
    return monotonicNowNanos();
  }
  monotonicTimeNanos = /* @__PURE__ */ sync(() => this.monotonicTimeNanosUnsafe());
  sleep(duration) {
    return this.sleepMillis(toMillis(duration));
  }
  sleepMillis(millis2) {
    if (millis2 <= 0) return yieldNow;
    else if (!Number.isFinite(millis2)) return never;
    return callback((resume) => {
      const continuation = millis2 > MAX_TIMER_MILLIS ? this.sleepMillis(millis2 - MAX_TIMER_MILLIS) : void_;
      const handle = setTimeout(() => resume(continuation), Math.min(millis2, MAX_TIMER_MILLIS));
      return sync(() => clearTimeout(handle));
    });
  }
};
var nanosPerMilli = /* @__PURE__ */ BigInt(1e6);
var monotonicNowNanos = /* @__PURE__ */ (function() {
  const processHrtime = globalThis.process?.hrtime;
  if (typeof processHrtime?.bigint === "function") {
    return () => processHrtime.bigint();
  }
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return () => BigInt(Math.round(performance.now() * 1e6));
  }
  let previous = /* @__PURE__ */ BigInt(0);
  return () => {
    const current = BigInt(Date.now()) * nanosPerMilli;
    if (current > previous) {
      previous = current;
    }
    return previous;
  };
})();
var wallTimeNanos = /* @__PURE__ */ (function() {
  const reanchorThresholdNanos = /* @__PURE__ */ BigInt(1e9);
  let origin;
  return () => {
    const monotonic = monotonicNowNanos();
    const wall = BigInt(Date.now()) * nanosPerMilli;
    if (origin === void 0) {
      origin = wall - monotonic;
    } else {
      const projected = origin + monotonic;
      const skew = wall > projected ? wall - projected : projected - wall;
      if (skew > reanchorThresholdNanos) {
        origin = wall - monotonic;
      }
    }
    return origin + monotonic;
  };
})();
var clockWith = (f) => withFiber((fiber3) => f(fiber3.getRef(ClockRef)));
var sleep = (duration) => clockWith((clock) => clock.sleep(fromInputUnsafe(duration)));
var currentTimeMillis = /* @__PURE__ */ clockWith((clock) => clock.currentTimeMillis);
var TimeoutErrorTypeId = "~effect/Cause/TimeoutError";
var TimeoutError = class extends (/* @__PURE__ */ TaggedError("TimeoutError")) {
  [TimeoutErrorTypeId] = TimeoutErrorTypeId;
  constructor(message) {
    super({
      message
    });
  }
};
var IllegalArgumentErrorTypeId = "~effect/Cause/IllegalArgumentError";
var IllegalArgumentError = class extends (/* @__PURE__ */ TaggedError("IllegalArgumentError")) {
  [IllegalArgumentErrorTypeId] = IllegalArgumentErrorTypeId;
  constructor(message) {
    super({
      message
    });
  }
};
var ExceededCapacityErrorTypeId = "~effect/Cause/ExceededCapacityError";
var ExceededCapacityError = class extends (/* @__PURE__ */ TaggedError("ExceededCapacityError")) {
  [ExceededCapacityErrorTypeId] = ExceededCapacityErrorTypeId;
  constructor(message) {
    super({
      message
    });
  }
};
var AsyncFiberErrorTypeId = "~effect/Cause/AsyncFiberError";
var AsyncFiberError = class extends (/* @__PURE__ */ TaggedError("AsyncFiberError")) {
  [AsyncFiberErrorTypeId] = AsyncFiberErrorTypeId;
  constructor(fiber3) {
    super({
      message: "An asynchronous Effect was executed with Effect.runSync",
      fiber: fiber3
    });
  }
};
var UnknownErrorTypeId = "~effect/Cause/UnknownError";
var UnknownError = class extends (/* @__PURE__ */ TaggedError("UnknownError")) {
  [UnknownErrorTypeId] = UnknownErrorTypeId;
  constructor(cause, message) {
    super({
      message,
      cause
    });
  }
};
var ConsoleRef = /* @__PURE__ */ Reference("effect/Console/CurrentConsole", {
  defaultValue: () => globalThis.console
});
var logLevelToOrder = (level) => {
  switch (level) {
    case "All":
      return Number.MIN_SAFE_INTEGER;
    case "Fatal":
      return 5e4;
    case "Error":
      return 4e4;
    case "Warn":
      return 3e4;
    case "Info":
      return 2e4;
    case "Debug":
      return 1e4;
    case "Trace":
      return 0;
    case "None":
      return Number.MAX_SAFE_INTEGER;
  }
};
var LogLevelOrder = /* @__PURE__ */ mapInput(Number2, logLevelToOrder);
var isLogLevelGreaterThan = /* @__PURE__ */ isGreaterThan(LogLevelOrder);
var CurrentLoggers = /* @__PURE__ */ Reference("effect/Loggers/CurrentLoggers", {
  defaultValue: () => /* @__PURE__ */ new Set([defaultLogger, tracerLogger])
});
var LogToStderr = /* @__PURE__ */ Reference("effect/Logger/LogToStderr", {
  defaultValue: constFalse
});
var annotateLogsScoped = function() {
  const entries = typeof arguments[0] === "string" ? [[arguments[0], arguments[1]]] : Object.entries(arguments[0]);
  return uninterruptible(withFiber((fiber3) => {
    const prev = fiber3.getRef(CurrentLogAnnotations);
    const next = {
      ...prev
    };
    for (let i = 0; i < entries.length; i++) {
      const [key, value] = entries[i];
      assignProperty(next, key, value);
    }
    fiber3.setContext(add(fiber3.context, CurrentLogAnnotations, next));
    return scopeAddFinalizerExit(getUnsafe2(fiber3.context, scopeTag), (_) => {
      const current = fiber3.getRef(CurrentLogAnnotations);
      const next2 = {
        ...current
      };
      for (let i = 0; i < entries.length; i++) {
        const [key, value] = entries[i];
        if (current[key] !== value) continue;
        if (Object.hasOwn(prev, key)) {
          assignProperty(next2, key, prev[key]);
        } else {
          delete next2[key];
        }
      }
      fiber3.setContext(add(fiber3.context, CurrentLogAnnotations, next2));
      return void_;
    });
  }));
};
var LoggerTypeId = "~effect/Logger";
var LoggerProto = {
  [LoggerTypeId]: {
    _Message: identity,
    _Output: identity
  },
  pipe() {
    return pipeArguments(this, arguments);
  }
};
var loggerMake = (log2) => {
  const self = Object.create(LoggerProto);
  self.log = log2;
  return self;
};
var formatLabel = (key) => key.replace(/[\s="]/g, "_");
var formatLogSpan = (self, now2) => {
  const label = formatLabel(self[0]);
  return `${label}=${now2 - self[1]}ms`;
};
var logWithLevel = (level) => (...message) => {
  let cause = void 0;
  for (let i = 0, len = message.length; i < len; i++) {
    const msg = message[i];
    if (isCause(msg)) {
      if (cause) {
        ;
        message.splice(i, 1);
      } else {
        message = message.slice(0, i).concat(message.slice(i + 1));
      }
      cause = cause ? causeFromReasons(cause.reasons.concat(msg.reasons)) : msg;
      i--;
    }
  }
  if (cause === void 0) {
    cause = causeEmpty;
  }
  return withFiber((fiber3) => {
    const logLevel = level ?? fiber3.currentLogLevel;
    if (isLogLevelGreaterThan(fiber3.minimumLogLevel, logLevel)) {
      return void_;
    }
    const clock = fiber3.getRef(ClockRef);
    const loggers = fiber3.getRef(CurrentLoggers);
    if (loggers.size > 0) {
      const date = new Date(clock.currentTimeMillisUnsafe());
      for (const logger of loggers) {
        logger.log({
          cause,
          fiber: fiber3,
          date,
          logLevel,
          message
        });
      }
    }
    return void_;
  });
};
var colors = {
  bold: "1",
  red: "31",
  green: "32",
  yellow: "33",
  blue: "34",
  cyan: "36",
  white: "37",
  gray: "90",
  black: "30",
  bgBrightRed: "101"
};
var logLevelColors = {
  None: [],
  All: [],
  Trace: [colors.gray],
  Debug: [colors.blue],
  Info: [colors.green],
  Warn: [colors.yellow],
  Error: [colors.red],
  Fatal: [colors.bgBrightRed, colors.black]
};
var defaultDateFormat = (date) => `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}.${date.getMilliseconds().toString().padStart(3, "0")}`;
var defaultLogger = /* @__PURE__ */ loggerMake(({
  cause,
  date,
  fiber: fiber3,
  logLevel,
  message
}) => {
  const message_ = Array.isArray(message) ? message.slice() : [message];
  if (cause.reasons.length > 0) {
    message_.push(causePretty(cause));
  }
  const now2 = date.getTime();
  const spans = fiber3.getRef(CurrentLogSpans);
  let spanString = "";
  for (const span2 of spans) {
    spanString += ` ${formatLogSpan(span2, now2)}`;
  }
  const annotations = fiber3.getRef(CurrentLogAnnotations);
  if (Object.keys(annotations).length > 0) {
    message_.push(annotations);
  }
  const console = fiber3.getRef(ConsoleRef);
  const log2 = fiber3.getRef(LogToStderr) ? console.error : console.log;
  log2(`[${defaultDateFormat(date)}] ${logLevel.toUpperCase()} (#${fiber3.id})${spanString}:`, ...message_);
});
var tracerLogger = /* @__PURE__ */ loggerMake(({
  cause,
  fiber: fiber3,
  logLevel,
  message
}) => {
  const clock = fiber3.getRef(ClockRef);
  const annotations = fiber3.getRef(CurrentLogAnnotations);
  const span2 = fiber3.currentSpan;
  if (span2 === void 0 || span2._tag === "ExternalSpan") return;
  const attributes = {};
  for (const [key, value] of Object.entries(annotations)) {
    assignProperty(attributes, key, value);
  }
  attributes["effect.fiberId"] = fiber3.id;
  attributes["effect.logLevel"] = logLevel.toUpperCase();
  if (cause.reasons.length > 0) {
    attributes["effect.cause"] = causePretty(cause);
  }
  span2.event(toStringUnknown(Array.isArray(message) && message.length === 1 ? message[0] : message), clock.currentTimeNanosUnsafe(), attributes);
});
function interruptChildrenPatch() {
  fiberMiddleware.interruptChildren ??= fiberInterruptChildren;
}
var undefined_ = /* @__PURE__ */ succeed3(void 0);
var withErrorReporting = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, options) => onError(self, (cause) => withFiber((fiber3) => {
  reportCauseUnsafe(fiber3, cause, options?.defectsOnly);
  return void_;
})));
var reportCauseUnsafe = (fiber3, cause, defectsOnly) => {
  const reporters = fiber3.getRef(CurrentErrorReporters);
  if (reporters.size === 0) return;
  if (defectsOnly && !hasDies(cause)) return;
  const opts = {
    cause,
    fiber: fiber3,
    timestamp: fiber3.getRef(ClockRef).currentTimeNanosUnsafe()
  };
  reporters.forEach((reporter) => reporter.report(opts));
};

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Cause.js
var isFailReason2 = isFailReason;
var fromReasons = causeFromReasons;
var fail4 = causeFail;
var die2 = causeDie;
var hasInterruptsOnly2 = hasInterruptsOnly;
var map5 = causeMap;
var squash = causeSquash;
var hasFails2 = hasFails;
var findError2 = findError;
var isDone2 = isDone;
var Done2 = Done;
var done2 = done;
var ExceededCapacityError2 = ExceededCapacityError;
var UnknownError2 = UnknownError;

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Effect.js
var Effect_exports = {};
__export(Effect_exports, {
  Do: () => Do2,
  Transaction: () => Transaction,
  TypeId: () => TypeId11,
  abortSignal: () => abortSignal2,
  acquireDisposable: () => acquireDisposable2,
  acquireRelease: () => acquireRelease2,
  acquireUseRelease: () => acquireUseRelease2,
  addFinalizer: () => addFinalizer3,
  all: () => all2,
  andThen: () => andThen2,
  annotateCurrentSpan: () => annotateCurrentSpan2,
  annotateLogs: () => annotateLogs,
  annotateLogsScoped: () => annotateLogsScoped2,
  annotateSpans: () => annotateSpans2,
  as: () => as2,
  asSome: () => asSome2,
  asVoid: () => asVoid2,
  awaitAllChildren: () => awaitAllChildren2,
  bind: () => bind3,
  bindTo: () => bindTo3,
  cached: () => cached2,
  cachedInvalidateWithTTL: () => cachedInvalidateWithTTL2,
  cachedWithTTL: () => cachedWithTTL2,
  callback: () => callback2,
  catch: () => catch_3,
  catchCause: () => catchCause3,
  catchCauseFilter: () => catchCauseFilter2,
  catchCauseIf: () => catchCauseIf2,
  catchDefect: () => catchDefect2,
  catchEager: () => catchEager2,
  catchFilter: () => catchFilter2,
  catchIf: () => catchIf2,
  catchNoSuchElement: () => catchNoSuchElement2,
  catchReason: () => catchReason2,
  catchReasons: () => catchReasons2,
  catchTag: () => catchTag3,
  catchTags: () => catchTags2,
  clockWith: () => clockWith2,
  context: () => context2,
  contextWith: () => contextWith2,
  currentParentSpan: () => currentParentSpan2,
  currentSpan: () => currentSpan2,
  delay: () => delay2,
  die: () => die4,
  effectify: () => effectify,
  ensuring: () => ensuring2,
  eventually: () => eventually2,
  exit: () => exit2,
  fail: () => fail6,
  failCause: () => failCause4,
  failCauseSync: () => failCauseSync2,
  failSync: () => failSync2,
  fiber: () => fiber2,
  fiberId: () => fiberId2,
  filter: () => filter5,
  filterMap: () => filterMap2,
  filterMapEffect: () => filterMapEffect2,
  filterMapOrElse: () => filterMapOrElse2,
  filterMapOrFail: () => filterMapOrFail2,
  filterOrElse: () => filterOrElse2,
  filterOrFail: () => filterOrFail2,
  findFirst: () => findFirst2,
  findFirstFilter: () => findFirstFilter2,
  firstSuccessOf: () => firstSuccessOf2,
  flatMap: () => flatMap4,
  flatMapEager: () => flatMapEager2,
  flatten: () => flatten4,
  flip: () => flip2,
  fn: () => fn2,
  fnUntraced: () => fnUntraced2,
  fnUntracedEager: () => fnUntracedEager2,
  forEach: () => forEach2,
  forever: () => forever4,
  forkChild: () => forkChild2,
  forkDetach: () => forkDetach2,
  forkIn: () => forkIn2,
  forkScoped: () => forkScoped2,
  fromNullishOr: () => fromNullishOr3,
  fromOption: () => fromOption3,
  fromResult: () => fromResult2,
  gen: () => gen2,
  head: () => head2,
  ignore: () => ignore2,
  ignoreCause: () => ignoreCause2,
  interrupt: () => interrupt3,
  interruptible: () => interruptible2,
  interruptibleMask: () => interruptibleMask2,
  isEffect: () => isEffect2,
  isFailure: () => isFailure5,
  isSuccess: () => isSuccess5,
  let: () => let_3,
  linkSpans: () => linkSpans2,
  log: () => log,
  logDebug: () => logDebug,
  logError: () => logError,
  logFatal: () => logFatal,
  logInfo: () => logInfo,
  logTrace: () => logTrace,
  logWarning: () => logWarning,
  logWithLevel: () => logWithLevel2,
  makeSpan: () => makeSpan2,
  makeSpanScoped: () => makeSpanScoped2,
  map: () => map6,
  mapBoth: () => mapBoth2,
  mapBothEager: () => mapBothEager2,
  mapEager: () => mapEager2,
  mapError: () => mapError2,
  mapErrorEager: () => mapErrorEager2,
  match: () => match6,
  matchCause: () => matchCause2,
  matchCauseEager: () => matchCauseEager2,
  matchCauseEffect: () => matchCauseEffect2,
  matchCauseEffectEager: () => matchCauseEffectEager2,
  matchEager: () => matchEager2,
  matchEffect: () => matchEffect3,
  never: () => never2,
  onError: () => onError2,
  onErrorFilter: () => onErrorFilter2,
  onErrorIf: () => onErrorIf2,
  onExit: () => onExit2,
  onExitFilter: () => onExitFilter2,
  onExitIf: () => onExitIf2,
  onExitPrimitive: () => onExitPrimitive2,
  onInterrupt: () => onInterrupt2,
  option: () => option2,
  orDie: () => orDie3,
  orElseSucceed: () => orElseSucceed2,
  partition: () => partition3,
  promise: () => promise2,
  provide: () => provide4,
  provideContext: () => provideContext2,
  provideService: () => provideService2,
  provideServiceEffect: () => provideServiceEffect2,
  race: () => race2,
  raceAll: () => raceAll2,
  raceAllFirst: () => raceAllFirst2,
  raceFirst: () => raceFirst2,
  reduce: () => reduce2,
  repeat: () => repeat3,
  repeatOrElse: () => repeatOrElse2,
  replicate: () => replicate2,
  replicateEffect: () => replicateEffect2,
  request: () => request2,
  requestUnsafe: () => requestUnsafe2,
  result: () => result2,
  retry: () => retry2,
  retryOrElse: () => retryOrElse2,
  runCallback: () => runCallback2,
  runCallbackWith: () => runCallbackWith2,
  runFork: () => runFork2,
  runForkWith: () => runForkWith2,
  runPromise: () => runPromise2,
  runPromiseExit: () => runPromiseExit2,
  runPromiseExitWith: () => runPromiseExitWith2,
  runPromiseWith: () => runPromiseWith2,
  runSync: () => runSync2,
  runSyncExit: () => runSyncExit2,
  runSyncExitWith: () => runSyncExitWith2,
  runSyncWith: () => runSyncWith2,
  sandbox: () => sandbox2,
  satisfiesErrorType: () => satisfiesErrorType2,
  satisfiesServicesType: () => satisfiesServicesType2,
  satisfiesSuccessType: () => satisfiesSuccessType2,
  schedule: () => schedule,
  scheduleFrom: () => scheduleFrom2,
  scope: () => scope2,
  scoped: () => scoped2,
  scopedWith: () => scopedWith2,
  service: () => service2,
  serviceOption: () => serviceOption2,
  setContext: () => setContext2,
  sleep: () => sleep2,
  spanAnnotations: () => spanAnnotations2,
  spanLinks: () => spanLinks2,
  succeed: () => succeed6,
  succeedNone: () => succeedNone2,
  succeedSome: () => succeedSome2,
  suspend: () => suspend3,
  sync: () => sync3,
  tap: () => tap3,
  tapCause: () => tapCause3,
  tapCauseFilter: () => tapCauseFilter2,
  tapCauseIf: () => tapCauseIf2,
  tapDefect: () => tapDefect2,
  tapError: () => tapError3,
  tapErrorTag: () => tapErrorTag2,
  timed: () => timed2,
  timeout: () => timeout2,
  timeoutOption: () => timeoutOption2,
  timeoutOrElse: () => timeoutOrElse2,
  tracer: () => tracer2,
  track: () => track,
  trackDefects: () => trackDefects,
  trackDuration: () => trackDuration,
  trackErrors: () => trackErrors,
  trackSuccesses: () => trackSuccesses,
  transposeOption: () => transposeOption2,
  try: () => try_2,
  tryPromise: () => tryPromise2,
  tx: () => tx,
  txRetry: () => txRetry,
  undefined: () => undefined_2,
  uninterruptible: () => uninterruptible2,
  uninterruptibleMask: () => uninterruptibleMask2,
  unwrapReason: () => unwrapReason2,
  updateContext: () => updateContext2,
  updateService: () => updateService3,
  updateServiceScoped: () => updateServiceScoped2,
  useSpan: () => useSpan2,
  validate: () => validate2,
  void: () => void_3,
  when: () => when2,
  whileLoop: () => whileLoop2,
  withErrorReporting: () => withErrorReporting2,
  withExecutionPlan: () => withExecutionPlan2,
  withFiber: () => withFiber2,
  withLogSpan: () => withLogSpan,
  withLogger: () => withLogger,
  withParentSpan: () => withParentSpan3,
  withSpan: () => withSpan3,
  withSpanScoped: () => withSpanScoped2,
  withTracer: () => withTracer2,
  withTracerEnabled: () => withTracerEnabled2,
  withTracerTiming: () => withTracerTiming2,
  yieldNow: () => yieldNow2,
  yieldNowWith: () => yieldNowWith2,
  zip: () => zip2,
  zipWith: () => zipWith2
});

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Exit.js
var isExit2 = isExit;
var succeed4 = exitSucceed;
var failCause2 = exitFailCause;
var fail5 = exitFail;
var die3 = exitDie;
var interrupt2 = exitInterrupt;
var void_2 = exitVoid;
var isSuccess4 = exitIsSuccess;
var isFailure4 = exitIsFailure;
var match5 = exitMatch;

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Layer.js
var Layer_exports = {};
__export(Layer_exports, {
  CurrentMemoMap: () => CurrentMemoMap,
  build: () => build,
  buildWithMemoMap: () => buildWithMemoMap,
  buildWithScope: () => buildWithScope,
  catch: () => catch_2,
  catchCause: () => catchCause2,
  catchTag: () => catchTag2,
  effect: () => effect,
  effectContext: () => effectContext,
  effectDiscard: () => effectDiscard,
  empty: () => empty3,
  flatMap: () => flatMap3,
  forkMemoMap: () => forkMemoMap,
  forkMemoMapUnsafe: () => forkMemoMapUnsafe,
  fresh: () => fresh,
  fromBuild: () => fromBuild,
  fromBuildMemo: () => fromBuildMemo,
  isLayer: () => isLayer,
  launch: () => launch,
  makeMemoMap: () => makeMemoMap,
  makeMemoMapUnsafe: () => makeMemoMapUnsafe,
  merge: () => merge2,
  mergeAll: () => mergeAll2,
  mock: () => mock,
  orDie: () => orDie2,
  parentSpan: () => parentSpan,
  provide: () => provide2,
  provideMerge: () => provideMerge,
  satisfiesErrorType: () => satisfiesErrorType,
  satisfiesServicesType: () => satisfiesServicesType,
  satisfiesSuccessType: () => satisfiesSuccessType,
  span: () => span,
  succeed: () => succeed5,
  succeedContext: () => succeedContext,
  suspend: () => suspend2,
  sync: () => sync2,
  syncContext: () => syncContext,
  tap: () => tap2,
  tapCause: () => tapCause2,
  tapError: () => tapError2,
  unwrap: () => unwrap,
  updateService: () => updateService2,
  withParentSpan: () => withParentSpan2,
  withSpan: () => withSpan2
});

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Deferred.js
var TypeId5 = "~effect/Deferred";
var DeferredProto = {
  [TypeId5]: {
    _A: identity,
    _E: identity
  },
  pipe() {
    return pipeArguments(this, arguments);
  }
};
var makeUnsafe2 = () => {
  const self = Object.create(DeferredProto);
  self.resumes = void 0;
  self.effect = void 0;
  return self;
};
var _await = (self) => callback((resume) => {
  if (self.effect) return resume(self.effect);
  self.resumes ??= [];
  self.resumes.push(resume);
  return sync(() => {
    const resumes = self.resumes;
    if (resumes === void 0) return;
    const index = resumes.indexOf(resume);
    if (index >= 0) resumes.splice(index, 1);
  });
});
var completeWith = /* @__PURE__ */ dual(2, (self, effect2) => sync(() => doneUnsafe(self, effect2)));
var done3 = completeWith;
var failCause3 = /* @__PURE__ */ dual(2, (self, cause) => done3(self, exitFailCause(cause)));
var interruptWith = /* @__PURE__ */ dual(2, (self, fiberId3) => failCause3(self, causeInterrupt(fiberId3)));
var isDone3 = (self) => sync(() => isDoneUnsafe(self));
var isDoneUnsafe = (self) => self.effect !== void 0;
var doneUnsafe = (self, effect2) => {
  if (self.effect) return false;
  self.effect = effect2;
  if (self.resumes) {
    const resumes = self.resumes;
    self.resumes = void 0;
    for (let i = 0; i < resumes.length; i++) {
      resumes[i](effect2);
    }
  }
  return true;
};

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/References.js
var CurrentLogAnnotations2 = CurrentLogAnnotations;
var CurrentLogSpans2 = CurrentLogSpans;
var CurrentStackFrame2 = CurrentStackFrame;
var TracerTimingEnabled2 = TracerTimingEnabled;

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Scope.js
var Scope = scopeTag;
var makeUnsafe3 = scopeMakeUnsafe;
var provide = provideScope;
var addFinalizerExit = scopeAddFinalizerExit;
var addFinalizer2 = scopeAddFinalizer;
var forkUnsafe2 = scopeForkUnsafe;
var close = scopeClose;

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Layer.js
var TypeId6 = "~effect/Layer";
var MemoMapTypeId = "~effect/Layer/MemoMap";
var memoMapReuse = (entry, scope3) => {
  entry.observers++;
  return andThen(scopeAddFinalizerExit(scope3, (exit3) => entry.finalizer(exit3)), entry.effect);
};
var isLayer = (u) => hasProperty(u, TypeId6);
var LayerProto = {
  [TypeId6]: {
    _ROut: identity,
    _E: identity,
    _RIn: identity
  },
  pipe() {
    return pipeArguments(this, arguments);
  }
};
var fromBuildUnsafe = (build2) => {
  const self = Object.create(LayerProto);
  self.build = build2;
  return self;
};
var fromBuild = (build2) => fromBuildUnsafe((memoMap, scope3) => {
  const layerScope = forkUnsafe2(scope3);
  return onExit(build2(memoMap, layerScope), (exit3) => exit3._tag === "Failure" ? close(layerScope, exit3) : void_);
});
var fromBuildMemo = (build2) => {
  const self = fromBuild((memoMap, scope3) => memoMap.getOrElseMemoize(self, scope3, build2));
  return self;
};
var memoMapBuild = (memoMap, layer14, scope3, build2) => {
  const layerScope = makeUnsafe3();
  const deferred = makeUnsafe2();
  const entry = {
    observers: 1,
    effect: _await(deferred),
    finalizer: (exit3) => suspend(() => {
      entry.observers--;
      if (entry.observers === 0) {
        memoMap.map.delete(layer14);
        return close(layerScope, exit3);
      }
      return void_;
    })
  };
  memoMap.map.set(layer14, entry);
  return scopeAddFinalizerExit(scope3, entry.finalizer).pipe(flatMap2(() => build2(memoMap, layerScope)), onExit((exit3) => {
    entry.effect = exit3;
    return done3(deferred, exit3);
  }));
};
var MemoMapImpl = class {
  get [MemoMapTypeId]() {
    return MemoMapTypeId;
  }
  parent;
  constructor(parent) {
    this.parent = parent;
  }
  map = /* @__PURE__ */ new Map();
  get(layer14, scope3) {
    const local = this.map.get(layer14);
    if (local) {
      return memoMapReuse(local, scope3);
    }
    return this.parent?.get(layer14, scope3);
  }
  getOrElseMemoize(layer14, scope3, build2) {
    return suspend(() => {
      const existing = this.get(layer14, scope3);
      if (existing) {
        return existing;
      }
      return memoMapBuild(this, layer14, scope3, build2);
    });
  }
};
var makeMemoMapUnsafe = () => new MemoMapImpl();
var forkMemoMapUnsafe = (parent) => new MemoMapImpl(parent);
var makeMemoMap = /* @__PURE__ */ sync(makeMemoMapUnsafe);
var forkMemoMap = (parent) => sync(() => forkMemoMapUnsafe(parent));
var CurrentMemoMap = class _CurrentMemoMap extends (/* @__PURE__ */ Service()("effect/Layer/CurrentMemoMap")) {
  static forkOrCreate(self) {
    const current = getOrUndefined2(self, _CurrentMemoMap);
    return current ? forkMemoMapUnsafe(current) : makeMemoMapUnsafe();
  }
};
var buildWithMemoMap = /* @__PURE__ */ dual(3, (self, memoMap, scope3) => provideService(map4(self.build(memoMap, scope3), add(CurrentMemoMap, memoMap)), CurrentMemoMap, memoMap));
var build = (self) => withFiber((fiber3) => buildWithMemoMap(self, CurrentMemoMap.forkOrCreate(fiber3.context), getUnsafe2(fiber3.context, Scope)));
var buildWithScope = /* @__PURE__ */ dual(2, (self, scope3) => withFiber((fiber3) => buildWithMemoMap(self, CurrentMemoMap.forkOrCreate(fiber3.context), scope3)));
var succeed5 = function() {
  if (arguments.length === 1) {
    return (resource) => succeedContext(make2(arguments[0], resource));
  }
  return succeedContext(make2(arguments[0], arguments[1]));
};
var succeedContext = (context3) => fromBuildUnsafe(constant(succeed3(context3)));
var empty3 = /* @__PURE__ */ succeedContext(/* @__PURE__ */ empty2());
var sync2 = function() {
  if (arguments.length === 1) {
    return (evaluate2) => syncContext(() => make2(arguments[0], evaluate2()));
  }
  return syncContext(() => make2(arguments[0], arguments[1]()));
};
var syncContext = (evaluate2) => fromBuildMemo(constant(sync(evaluate2)));
var effect = function() {
  if (arguments.length === 1) {
    return (effect2) => effectImpl(arguments[0], effect2);
  }
  return effectImpl(arguments[0], arguments[1]);
};
var effectImpl = (service4, effect2) => effectContext(map4(effect2, (value) => make2(service4, value)));
var effectContext = (effect2) => fromBuildMemo((_, scope3) => provide(effect2, scope3));
var effectDiscard = (effect2) => effectContext(as(effect2, empty2()));
var suspend2 = (evaluate2) => fromBuildMemo((memoMap, scope3) => suspend(() => evaluate2().build(memoMap, scope3)));
var unwrap = (self) => {
  const service4 = Service("effect/Layer/unwrap");
  return flatMap3(effect(service4)(self), get(service4));
};
var mergeAllEffect = (layers, memoMap, scope3) => {
  const parentScope = forkUnsafe2(scope3, "parallel");
  return forEach(layers, (layer14) => layer14.build(memoMap, forkUnsafe2(parentScope, "sequential")), {
    concurrency: layers.length
  }).pipe(map4((context3) => mergeAll(...context3)));
};
var mergeAll2 = (...layers) => fromBuild((memoMap, scope3) => mergeAllEffect(layers, memoMap, scope3));
var merge2 = /* @__PURE__ */ dual(2, (self, that) => mergeAll2(self, ...Array.isArray(that) ? that : [that]));
var provideWith = (self, that, f) => fromBuild((memoMap, scope3) => flatMap2(Array.isArray(that) ? mergeAllEffect(that, memoMap, scope3) : that.build(memoMap, scope3), (context3) => self.build(memoMap, scope3).pipe(provideContext(context3), map4((merged) => f(merged, context3)))));
var provide2 = /* @__PURE__ */ dual(2, (self, that) => provideWith(self, that, identity));
var provideMerge = /* @__PURE__ */ dual(2, (self, that) => provideWith(self, that, (self2, that2) => merge(that2, self2)));
var flatMap3 = /* @__PURE__ */ dual(2, (self, f) => fromBuild((memoMap, scope3) => flatMap2(self.build(memoMap, scope3), (context3) => f(context3).build(memoMap, scope3))));
var tap2 = /* @__PURE__ */ dual(2, (self, f) => fromBuild((memoMap, scope3) => flatMap2(self.build(memoMap, scope3), (context3) => provide(as(f(context3), context3), scope3))));
var tapError2 = /* @__PURE__ */ dual(2, (self, f) => fromBuild((memoMap, scope3) => catch_(self.build(memoMap, scope3), (error) => provide(andThen(f(error), fail3(error)), scope3))));
var tapCause2 = /* @__PURE__ */ dual(2, (self, f) => fromBuild((memoMap, scope3) => catchCause(self.build(memoMap, scope3), (cause) => provide(andThen(f(cause), failCause(cause)), scope3))));
var orDie2 = (self) => fromBuildUnsafe((memoMap, scope3) => orDie(self.build(memoMap, scope3)));
var catch_2 = /* @__PURE__ */ dual(2, (self, onError5) => fromBuildUnsafe((memoMap, scope3) => catch_(self.build(memoMap, scope3), (e) => onError5(e).build(memoMap, scope3))));
var catchTag2 = /* @__PURE__ */ dual(3, (self, k, f) => fromBuildUnsafe((memoMap, scope3) => catchTag(self.build(memoMap, scope3), k, (error) => f(error).build(memoMap, scope3))));
var catchCause2 = /* @__PURE__ */ dual(2, (self, onError5) => fromBuildUnsafe((memoMap, scope3) => catchCause(self.build(memoMap, scope3), (cause) => onError5(cause).build(memoMap, scope3))));
var updateService2 = /* @__PURE__ */ dual(3, (layer14, service4, f) => provide2(layer14, effect(service4, map4(service4, f))));
var fresh = (self) => fromBuildUnsafe((_, scope3) => self.build(makeMemoMapUnsafe(), scope3));
var launch = (self) => scoped(andThen(build(self), never));
var mock = function() {
  if (arguments.length === 1) {
    return (implementation) => mockImpl(arguments[0], implementation);
  }
  return mockImpl(arguments[0], arguments[1]);
};
var mockImpl = (service4, implementation) => succeed5(service4)(new Proxy({
  ...implementation
}, {
  get(target, prop, _receiver) {
    if (prop in target) {
      return target[prop];
    }
    const prevLimit = getStackTraceLimit();
    setStackTraceLimit(2);
    const error = new Error(`${service4.key}: Unimplemented method "${prop.toString()}"`);
    setStackTraceLimit(prevLimit);
    error.name = "UnimplementedError";
    return makeUnimplemented(error);
  },
  has: constTrue
}));
var makeUnimplemented = (error) => {
  const dead = Object.assign(die(error), {
    [StreamTypeId]: StreamTypeId,
    channel: {
      [ChannelTypeId]: ChannelTypeId,
      transform: () => succeed3(dead),
      pipe() {
        return pipeArguments(this, arguments);
      }
    },
    [ChannelTypeId]: ChannelTypeId,
    transform: () => succeed3(dead)
  });
  function unimplemented() {
    return dead;
  }
  Object.assign(unimplemented, dead);
  Object.setPrototypeOf(unimplemented, Object.getPrototypeOf(dead));
  return unimplemented;
};
var StreamTypeId = "~effect/Stream";
var ChannelTypeId = "~effect/Channel";
var satisfiesSuccessType = () => (layer14) => layer14;
var satisfiesErrorType = () => (layer14) => layer14;
var satisfiesServicesType = () => (layer14) => layer14;
var span = (name, options) => {
  options = addSpanStackTrace(options);
  return effect(ParentSpan, options?.onEnd ? tap(makeSpanScoped(name, options), (span2) => addFinalizer((exit3) => options.onEnd(span2, exit3))) : makeSpanScoped(name, options));
};
var parentSpan = (span2) => succeedContext(ParentSpan.context(span2));
var withSpan2 = function() {
  const dataFirst = typeof arguments[0] !== "string";
  const name = dataFirst ? arguments[1] : arguments[0];
  const options = addSpanStackTrace(dataFirst ? arguments[2] : arguments[1]);
  if (dataFirst) {
    const self = arguments[0];
    return unwrap(map4(options?.onEnd !== void 0 ? tap(makeSpanScoped(name, options), (span2) => addFinalizer((exit3) => options.onEnd(span2, exit3))) : makeSpanScoped(name, options), (span2) => withParentSpan2(self, span2)));
  }
  return (self) => unwrap(map4(options?.onEnd !== void 0 ? tap(makeSpanScoped(name, options), (span2) => addFinalizer((exit3) => options.onEnd(span2, exit3))) : makeSpanScoped(name, options), (span2) => withParentSpan2(self, span2)));
};
var withParentSpan2 = function() {
  const dataFirst = isLayer(arguments[0]);
  const span2 = dataFirst ? arguments[1] : arguments[0];
  let options = dataFirst ? arguments[2] : arguments[1];
  let provideStackFrame = identity;
  if (span2._tag === "Span") {
    options = addSpanStackTrace(options);
    provideStackFrame = provideSpanStackFrame2(span2.name, options?.captureStackTrace);
  }
  const parentSpanLayer = parentSpan(span2);
  if (dataFirst) {
    return provide2(provideStackFrame(arguments[0]), parentSpanLayer);
  }
  return (self) => provide2(provideStackFrame(self), parentSpanLayer);
};
var provideSpanStackFrame2 = (name, stack) => {
  stack = typeof stack === "function" ? stack : constUndefined;
  return updateService2(CurrentStackFrame2, (parent) => ({
    name,
    stack,
    parent
  }));
};

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/ExecutionPlan.js
var TypeId7 = "~effect/ExecutionPlan";
var Proto2 = {
  [TypeId7]: TypeId7,
  get captureRequirements() {
    const self = this;
    return contextWith((context3) => succeed3(makeProto(self.steps.map((step) => ({
      ...step,
      provide: isLayer(step.provide) ? provide2(step.provide, succeedContext(context3)) : step.provide
    })))));
  },
  pipe() {
    return pipeArguments(this, arguments);
  }
};
var makeProto = (steps) => {
  const self = Object.create(Proto2);
  self.steps = steps;
  return self;
};
var CurrentMetadata = /* @__PURE__ */ Reference("effect/ExecutionPlan/CurrentMetadata", {
  defaultValue: /* @__PURE__ */ constant({
    attempt: 0,
    stepIndex: 0
  })
});

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Clock.js
var Clock = ClockRef;

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Number.js
var Number3 = globalThis.Number;
var nextPow2 = (n) => {
  const nextPow = Math.ceil(Math.log(n) / Math.log(2));
  return Math.max(Math.pow(2, nextPow), 2);
};

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/String.js
var String2 = globalThis.String;
var isString2 = isString;

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Pull.js
var catchDone = /* @__PURE__ */ dual(2, (effect2, f) => catchCauseFilter(effect2, filterDoneLeftover, (l) => f(l)));
var isDoneCause = (cause) => cause.reasons.some(isDoneFailure);
var isDoneFailure = (failure) => failure._tag === "Fail" && isDone2(failure.error);
var filterDone = (cause) => {
  let done4;
  let hasFailure = false;
  for (const reason of cause.reasons) {
    if (isDoneFailure(reason)) {
      done4 ??= reason.error;
    } else if (reason._tag !== "Interrupt") {
      hasFailure = true;
    }
  }
  if (done4 === void 0) return fail2(cause);
  return hasFailure ? fail2(fromReasons(cause.reasons.filter((reason) => !isDoneFailure(reason)))) : succeed2(done4);
};
var filterDoneLeftover = (cause) => {
  const done4 = filterDone(cause);
  return isFailure2(done4) ? done4 : succeed2(done4.success.value);
};
var doneExitFromCause = (cause) => {
  const halt = filterDone(cause);
  return !isFailure2(halt) ? succeed4(halt.success.value) : failCause2(halt.failure);
};
var matchEffect2 = /* @__PURE__ */ dual(2, (self, options) => matchCauseEffect(self, {
  onSuccess: options.onSuccess,
  onFailure: (cause) => {
    const halt = filterDone(cause);
    return !isFailure2(halt) ? options.onDone(halt.success.value) : options.onFailure(halt.failure);
  }
}));

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Schedule.js
var TypeId8 = "~effect/Schedule";
var CurrentMetadata2 = /* @__PURE__ */ Reference("effect/Schedule/CurrentMetadata", {
  defaultValue: /* @__PURE__ */ constant({
    input: void 0,
    output: void 0,
    duration: zero,
    attempt: 0,
    start: 0,
    now: 0,
    elapsed: 0,
    elapsedSincePrevious: 0
  })
});
var ScheduleProto = {
  [TypeId8]: {
    _Out: identity,
    _In: identity,
    _Env: identity
  },
  pipe() {
    return pipeArguments(this, arguments);
  }
};
var isSchedule = (u) => hasProperty(u, TypeId8);
var fromStep = (step) => {
  const self = Object.create(ScheduleProto);
  self.step = step;
  return self;
};
var metadataFn = () => {
  let n = 0;
  let previous;
  let start;
  return (now2, input) => {
    if (start === void 0) start = now2;
    const elapsed = now2 - start;
    const elapsedSincePrevious = previous === void 0 ? 0 : now2 - previous;
    previous = now2;
    return {
      input,
      attempt: ++n,
      start,
      now: now2,
      elapsed,
      elapsedSincePrevious
    };
  };
};
var fromStepWithMetadata = (step) => fromStep(map4(step, (f) => {
  const meta = metadataFn();
  return (now2, input) => f(meta(now2, input));
}));
var toStep = (schedule4) => catchCause(schedule4.step, (cause) => succeed3(() => failCause(cause)));
var toStepWithMetadata = (schedule4) => clockWith((clock) => map4(toStep(schedule4), (step) => {
  const metaFn = metadataFn();
  return (input) => suspend(() => {
    const now2 = clock.currentTimeMillisUnsafe();
    return flatMap2(step(now2, input), ([output, duration]) => {
      const meta = metaFn(now2, input);
      meta.output = output;
      meta.duration = duration;
      return as(sleep(duration), meta);
    });
  });
}));
var toStepWithSleep = (schedule4) => map4(toStepWithMetadata(schedule4), (step) => (input) => map4(step(input), (meta) => meta.output));
var passthrough = (self) => fromStep(map4(toStep(self), (step) => (now2, input) => matchEffect2(step(now2, input), {
  onSuccess: (result4) => succeed3([input, result4[1]]),
  onFailure: failCause,
  onDone: () => done2(input)
})));
var recurs = (times) => while_(forever3, ({
  attempt: attempt2
}) => succeed3(attempt2 <= times));
var spaced = (duration) => {
  const decoded = fromInputUnsafe(duration);
  return fromStepWithMetadata(succeed3((meta) => succeed3([meta.attempt - 1, decoded])));
};
var while_ = /* @__PURE__ */ dual(2, (self, predicate) => fromStep(map4(toStep(self), (step) => {
  const meta = metadataFn();
  return (now2, input) => flatMap2(step(now2, input), (result4) => {
    const [output, duration] = result4;
    const eff = predicate({
      ...meta(now2, input),
      output,
      duration
    });
    return flatMap2(isEffect(eff) ? eff : succeed3(eff), (check2) => check2 ? succeed3(result4) : done2(output));
  });
})));
var forever3 = /* @__PURE__ */ spaced(zero);

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/internal/layer.js
var provideLayer = (self, layer14, options) => scopedWith((scope3) => flatMap2(options?.local ? buildWithMemoMap(layer14, makeMemoMapUnsafe(), scope3) : buildWithScope(layer14, scope3), (context3) => provideContext(self, context3)));
var provide3 = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, source, options) => isContext(source) ? provideContext(self, source) : provideLayer(self, Array.isArray(source) ? mergeAll2(...source) : source, options));

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/internal/schedule.js
var repeatOrElse = /* @__PURE__ */ dual(3, (self, schedule4, orElse) => flatMap2(toStepWithMetadata(schedule4), (step) => {
  let meta = CurrentMetadata2.defaultValue();
  return catch_(forever2(tap(flatMap2(suspend(() => provideService(self, CurrentMetadata2, meta)), step), (meta_) => sync(() => {
    meta = meta_;
  })), {
    disableYield: true
  }), (error) => isDone(error) ? succeed3(error.value) : orElse(error, meta.attempt === 0 ? none2() : some2(meta)));
}));
var retryOrElse = /* @__PURE__ */ dual(3, (self, policy, orElse) => flatMap2(toStepWithMetadata(policy), (step) => {
  let meta = CurrentMetadata2.defaultValue();
  let lastError;
  const loop = catch_(suspend(() => provideService(self, CurrentMetadata2, meta)), (error) => {
    lastError = error;
    return flatMap2(step(error), (meta_) => {
      meta = meta_;
      return loop;
    });
  });
  return catchDone(loop, (out2) => internalCall(() => orElse(lastError, out2)));
}));
var repeat2 = /* @__PURE__ */ dual(2, (self, options) => {
  const schedule4 = typeof options === "function" ? options(identity) : isSchedule(options) ? options : buildFromOptions(options);
  return repeatOrElse(self, schedule4, fail3);
});
var retry = /* @__PURE__ */ dual(2, (self, options) => {
  const schedule4 = typeof options === "function" ? options(identity) : isSchedule(options) ? options : buildFromOptions(options);
  return retryOrElse(self, schedule4, fail3);
});
var scheduleFrom = /* @__PURE__ */ dual(3, (self, initial, schedule4) => flatMap2(toStepWithMetadata(schedule4), (step) => {
  let meta = CurrentMetadata2.defaultValue();
  const selfWithMeta = suspend(() => provideService(self, CurrentMetadata2, meta));
  return catch_(flatMap2(step(initial), (meta_) => {
    meta = meta_;
    const body = constant(flatMap2(selfWithMeta, step));
    return whileLoop({
      while: constTrue,
      body,
      step(meta_2) {
        meta = meta_2;
      }
    });
  }), (error) => isDone(error) ? succeed3(error.value) : fail3(error));
}));
var passthroughForever = /* @__PURE__ */ passthrough(forever3);
var buildFromOptions = (options) => {
  let schedule4 = options.schedule ? passthrough(options.schedule) : passthroughForever;
  if (options.while) {
    schedule4 = while_(schedule4, ({
      input
    }) => {
      const applied = options.while(input);
      return isEffect(applied) ? applied : succeed3(applied);
    });
  }
  if (options.until) {
    schedule4 = while_(schedule4, ({
      input
    }) => {
      const applied = options.until(input);
      return isEffect(applied) ? map4(applied, (b) => !b) : succeed3(!applied);
    });
  }
  if (options.times !== void 0) {
    schedule4 = while_(schedule4, ({
      attempt: attempt2
    }) => succeed3(attempt2 <= options.times));
  }
  return schedule4;
};

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/internal/executionPlan.js
var makeEventEmitter = (onEvent, currentMetadata) => {
  let lastStepIndex = -1;
  let stepAttempt = 0;
  const emit = (event) => ignoreCause(onEvent(event));
  return {
    begin: clockWith((clock) => suspend(() => {
      const meta = currentMetadata();
      if (meta.stepIndex !== lastStepIndex) {
        lastStepIndex = meta.stepIndex;
        stepAttempt = 0;
      }
      stepAttempt++;
      const state = {
        attempt: meta.attempt,
        stepAttempt,
        stepIndex: meta.stepIndex,
        startNanos: clock.monotonicTimeNanosUnsafe()
      };
      return as(emit({
        _tag: "AttemptStart",
        attempt: state.attempt,
        stepAttempt: state.stepAttempt,
        stepIndex: state.stepIndex
      }), state);
    })),
    end: (state, exit3) => clockWith((clock) => {
      const duration = nanos(clock.monotonicTimeNanosUnsafe() - state.startNanos);
      return emit(exit3._tag === "Success" ? {
        _tag: "AttemptSuccess",
        attempt: state.attempt,
        stepAttempt: state.stepAttempt,
        stepIndex: state.stepIndex,
        duration
      } : {
        _tag: "AttemptFailure",
        attempt: state.attempt,
        stepAttempt: state.stepAttempt,
        stepIndex: state.stepIndex,
        duration,
        cause: exit3.cause
      });
    })
  };
};
var withExecutionPlan = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, plan, options) => suspend(() => {
  let i = 0;
  let meta = {
    attempt: 0,
    stepIndex: 0
  };
  const provideMeta = provideServiceEffect(CurrentMetadata, sync(() => {
    meta = {
      attempt: meta.attempt + 1,
      stepIndex: i
    };
    return meta;
  }));
  const emitter = options?.onEvent === void 0 ? void 0 : makeEventEmitter(options.onEvent, () => meta);
  const instrument = emitter === void 0 ? identity : (attempt2) => uninterruptibleMask((restore) => flatMap2(emitter.begin, (state) => onExit(restore(attempt2), (exit3) => emitter.end(state, exit3))));
  let result4;
  return flatMap2(whileLoop({
    while: () => i < plan.steps.length && (result4 === void 0 || isFailure2(result4)),
    body() {
      const step = plan.steps[i];
      let nextEffect = provideMeta(instrument(provide3(self, step.provide)));
      if (result4) {
        let attempted = false;
        const wrapped = nextEffect;
        nextEffect = suspend(() => {
          if (attempted) return wrapped;
          attempted = true;
          return fromResult(result4);
        });
        nextEffect = retry(nextEffect, scheduleFromStep(step, false));
      } else {
        const schedule4 = scheduleFromStep(step, true);
        nextEffect = schedule4 ? retry(nextEffect, schedule4) : nextEffect;
      }
      return result(nextEffect);
    },
    step(result_) {
      result4 = result_;
      i++;
    }
  }), () => fromResult(result4));
}));
var scheduleFromStep = (step, first) => {
  if (!first) {
    return buildFromOptions({
      schedule: step.schedule ? step.schedule : step.attempts ? void 0 : scheduleOnce,
      times: step.attempts,
      while: step.while
    });
  } else if (step.attempts === 1 || !(step.schedule || step.attempts)) {
    return void 0;
  }
  return buildFromOptions({
    schedule: step.schedule,
    while: step.while,
    times: step.attempts ? step.attempts - 1 : void 0
  });
};
var scheduleOnce = /* @__PURE__ */ recurs(1);

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Request.js
var TypeId9 = "~effect/Request";
var requestVariance = /* @__PURE__ */ byReferenceUnsafe({
  /* c8 ignore next */
  _E: (_) => _,
  /* c8 ignore next */
  _A: (_) => _,
  /* c8 ignore next */
  _R: (_) => _
});
var RequestPrototype = {
  ...StructuralProto,
  [TypeId9]: requestVariance
};
var makeEntry = (options) => options;

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/internal/request.js
var request = /* @__PURE__ */ dual(2, (self, resolver) => {
  const withResolver = (resolver2) => callback((resume) => {
    const entry = addEntry(resolver2, self, resume, getCurrentFiber());
    return maybeRemoveEntry(resolver2, entry);
  });
  return isEffect(resolver) ? flatMap2(resolver, withResolver) : withResolver(resolver);
});
var requestUnsafe = (self, options) => {
  const entry = addEntry(options.resolver, self, options.onExit, {
    context: options.context,
    currentScheduler: get(options.context, Scheduler)
  });
  return () => removeEntryUnsafe(options.resolver, entry);
};
var batchPool = [];
var pendingBatches = /* @__PURE__ */ new WeakMap();
var addEntry = (resolver, request3, resume, fiber3) => {
  let batchMap = pendingBatches.get(resolver);
  if (!batchMap) {
    batchMap = /* @__PURE__ */ new Map();
    pendingBatches.set(resolver, batchMap);
  }
  let batch;
  let completed = false;
  const entry = makeEntry({
    request: request3,
    context: fiber3.context,
    uninterruptible: false,
    completeUnsafe(effect2) {
      if (completed) return;
      completed = true;
      resume(effect2);
      batch?.entrySet.delete(entry);
    }
  });
  if (resolver.preCheck !== void 0 && !resolver.preCheck(entry)) {
    return entry;
  }
  const key = resolver.batchKey(entry);
  batch = batchMap.get(key);
  if (!batch) {
    if (batchPool.length > 0) {
      batch = batchPool.pop();
      batch.key = key;
      batch.resolver = resolver;
      batch.map = batchMap;
    } else {
      const newBatch = {
        key,
        resolver,
        map: batchMap,
        entrySet: /* @__PURE__ */ new Set(),
        entries: /* @__PURE__ */ new Set(),
        delayEffect: flatMap2(suspend(() => newBatch.resolver.delay), (_) => runBatch(newBatch)),
        run: onExit(suspend(() => newBatch.resolver.runAll(Array.from(newBatch.entries), newBatch.key)), (exit3) => {
          for (const entry2 of newBatch.entrySet) {
            entry2.completeUnsafe(exit3._tag === "Success" ? exitDie(new Error("Effect.request: RequestResolver did not complete request", {
              cause: entry2.request
            })) : exit3);
          }
          newBatch.entries.clear();
          if (batchPool.length < 128) {
            newBatch.entrySet.clear();
            newBatch.key = void 0;
            newBatch.fiber = void 0;
            newBatch.resolver = void 0;
            newBatch.map = void 0;
            batchPool.push(newBatch);
          }
          return void_;
        })
      };
      batch = newBatch;
    }
    batchMap.set(key, batch);
    batch.fiber = runForkWith(fiber3.context)(batch.delayEffect, {
      scheduler: fiber3.currentScheduler
    });
  }
  batch.entrySet.add(entry);
  batch.entries.add(entry);
  if (batch.resolver.collectWhile(batch.entries)) return entry;
  batch.fiber.interruptUnsafe(fiber3.id);
  batch.fiber = runForkWith(fiber3.context)(runBatch(batch), {
    scheduler: fiber3.currentScheduler
  });
  return entry;
};
var removeEntryUnsafe = (resolver, entry) => {
  if (entry.uninterruptible) return;
  const batchMap = pendingBatches.get(resolver);
  if (!batchMap) return;
  const key = resolver.batchKey(entry);
  const batch = batchMap.get(key);
  if (!batch) return;
  batch.entries.delete(entry);
  batch.entrySet.delete(entry);
  if (batch.entries.size === 0) {
    batchMap.delete(key);
    batch.fiber?.interruptUnsafe();
  }
};
var maybeRemoveEntry = (resolver, entry) => sync(() => removeEntryUnsafe(resolver, entry));
function runBatch(batch) {
  if (!batch.map.has(batch.key)) return void_;
  batch.map.delete(batch.key);
  return batch.run;
}

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Metric.js
var CurrentMetricAttributesKey = "effect/Metric/CurrentMetricAttributes";
var CurrentMetricAttributes = /* @__PURE__ */ Reference(CurrentMetricAttributesKey, {
  defaultValue: () => ({})
});
var MetricRegistryKey = "~effect/observability/Metric/MetricRegistryKey";
var MetricRegistry = /* @__PURE__ */ Reference(MetricRegistryKey, {
  defaultValue: () => /* @__PURE__ */ new Map()
});
var TypeId10 = "~effect/observability/Metric";
var Metric$ = class {
  [TypeId10] = TypeId10;
  #metadataCache = /* @__PURE__ */ new WeakMap();
  #metadata;
  id;
  description;
  attributes;
  constructor(id, description, attributes) {
    this.id = id;
    this.description = description;
    this.attributes = attributes;
  }
  valueUnsafe(context3) {
    return this.hook(context3).get(context3);
  }
  modifyUnsafe(input, context3) {
    return this.hook(context3).modify(input, context3);
  }
  updateUnsafe(input, context3) {
    return this.hook(context3).update(input, context3);
  }
  hook(context3) {
    const extraAttributes = get(context3, CurrentMetricAttributes);
    if (Object.keys(extraAttributes).length === 0) {
      if (isNotUndefined(this.#metadata)) {
        return this.#metadata.hooks;
      }
      this.#metadata = this.getOrCreate(context3, this.attributes);
      return this.#metadata.hooks;
    }
    const mergedAttributes = mergeAttributes(this.attributes, extraAttributes);
    let metadata = this.#metadataCache.get(mergedAttributes);
    if (isNotUndefined(metadata)) {
      return metadata.hooks;
    }
    metadata = this.getOrCreate(context3, mergedAttributes);
    this.#metadataCache.set(mergedAttributes, metadata);
    return metadata.hooks;
  }
  getOrCreate(context3, attributes) {
    const key = makeKey(this, attributes);
    const registry = get(context3, MetricRegistry);
    if (registry.has(key)) {
      return registry.get(key);
    }
    const hooks = this.createHooks();
    const meta = {
      id: this.id,
      type: this.type,
      description: this.description,
      attributes: attributesToRecord(attributes),
      hooks
    };
    registry.set(key, meta);
    return meta;
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
};
var update = /* @__PURE__ */ dual(2, (self, input) => contextWith((services) => sync(() => self.updateUnsafe(input, services))));
function makeKey(metric, attributes) {
  let key = `${metric.type}:${metric.id}`;
  if (isNotUndefined(metric.description)) {
    key += `:${metric.description}`;
  }
  if (isNotUndefined(attributes)) {
    key += `:${serializeAttributes(attributes)}`;
  }
  return key;
}
function serializeAttributes(attributes) {
  return JSON.stringify(Array.isArray(attributes) ? attributes : Object.entries(attributes));
}
function mergeAttributes(self, other) {
  return {
    ...attributesToRecord(self),
    ...attributesToRecord(other)
  };
}
function attributesToRecord(attributes) {
  if (isNotUndefined(attributes) && Array.isArray(attributes)) {
    return attributes.reduce((acc, [key, value]) => {
      assignProperty(acc, key, value);
      return acc;
    }, {});
  }
  return attributes;
}

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Effect.js
var TypeId11 = EffectTypeId;
var isEffect2 = isEffect;
var all2 = all;
var partition3 = partition2;
var reduce2 = reduce;
var validate2 = validate;
var findFirst2 = findFirst;
var findFirstFilter2 = findFirstFilter;
var forEach2 = forEach;
var head2 = head;
var whileLoop2 = whileLoop;
var promise2 = promise;
var tryPromise2 = tryPromise;
var succeed6 = succeed3;
var succeedNone2 = succeedNone;
var succeedSome2 = succeedSome;
var suspend3 = suspend;
var sync3 = sync;
var void_3 = void_;
var undefined_2 = undefined_;
var callback2 = callback;
var never2 = never;
var Do2 = Do;
var bindTo3 = bindTo2;
var let_3 = let_2;
var bind3 = bind2;
var gen2 = gen;
var fail6 = fail3;
var failSync2 = failSync;
var failCause4 = failCause;
var failCauseSync2 = failCauseSync;
var die4 = die;
var try_2 = try_;
var yieldNow2 = yieldNow;
var yieldNowWith2 = yieldNowWith;
var withFiber2 = withFiber;
var fromResult2 = fromResult;
var fromOption3 = fromOption2;
var transposeOption2 = transposeOption;
var fromNullishOr3 = fromNullishOr2;
var flatMap4 = flatMap2;
var flatten4 = flatten3;
var andThen2 = andThen;
var tap3 = tap;
var result2 = result;
var option2 = option;
var exit2 = exit;
var map6 = map4;
var as2 = as;
var asSome2 = asSome;
var asVoid2 = asVoid;
var flip2 = flip;
var zip2 = zip;
var zipWith2 = zipWith;
var catch_3 = catch_;
var catchTag3 = catchTag;
var catchTags2 = catchTags;
var catchReason2 = catchReason;
var catchReasons2 = catchReasons;
var unwrapReason2 = unwrapReason;
var catchCause3 = catchCause;
var catchDefect2 = catchDefect;
var catchIf2 = catchIf;
var catchFilter2 = catchFilter;
var catchNoSuchElement2 = catchNoSuchElement;
var catchCauseIf2 = catchCauseIf;
var catchCauseFilter2 = catchCauseFilter;
var mapError2 = mapError;
var mapBoth2 = mapBoth;
var orDie3 = orDie;
var tapError3 = tapError;
var tapErrorTag2 = tapErrorTag;
var tapCause3 = tapCause;
var tapCauseIf2 = tapCauseIf;
var tapCauseFilter2 = tapCauseFilter;
var tapDefect2 = tapDefect;
var eventually2 = eventually;
var retry2 = retry;
var retryOrElse2 = retryOrElse;
var sandbox2 = sandbox;
var ignore2 = ignore;
var ignoreCause2 = ignoreCause;
var withExecutionPlan2 = withExecutionPlan;
var withErrorReporting2 = withErrorReporting;
var orElseSucceed2 = orElseSucceed;
var firstSuccessOf2 = firstSuccessOf;
var timeout2 = timeout;
var timeoutOption2 = timeoutOption;
var timeoutOrElse2 = timeoutOrElse;
var delay2 = delay;
var sleep2 = sleep;
var timed2 = timed;
var raceAll2 = raceAll;
var raceAllFirst2 = raceAllFirst;
var race2 = race;
var raceFirst2 = raceFirst;
var filter5 = filter4;
var filterMap2 = filterMap;
var filterMapEffect2 = filterMapEffect;
var filterOrElse2 = filterOrElse;
var filterMapOrElse2 = filterMapOrElse;
var filterOrFail2 = filterOrFail;
var filterMapOrFail2 = filterMapOrFail;
var when2 = when;
var match6 = match4;
var matchEager2 = matchEager;
var matchCause2 = matchCause;
var matchCauseEager2 = matchCauseEager;
var matchCauseEffectEager2 = matchCauseEffectEager;
var matchCauseEffect2 = matchCauseEffect;
var matchEffect3 = matchEffect;
var isFailure5 = isFailure3;
var isSuccess5 = isSuccess3;
var context2 = context;
var contextWith2 = contextWith;
var provide4 = provide3;
var provideContext2 = provideContext;
var setContext2 = setContext;
var service2 = service;
var serviceOption2 = serviceOption;
var updateContext2 = updateContext;
var updateService3 = updateService;
var updateServiceScoped2 = updateServiceScoped;
var provideService2 = provideService;
var provideServiceEffect2 = provideServiceEffect;
var scope2 = scope;
var scoped2 = scoped;
var scopedWith2 = scopedWith;
var acquireRelease2 = acquireRelease;
var acquireDisposable2 = acquireDisposable;
var acquireUseRelease2 = acquireUseRelease;
var addFinalizer3 = addFinalizer;
var ensuring2 = ensuring;
var onError2 = onError;
var onErrorIf2 = onErrorIf;
var onErrorFilter2 = onErrorFilter;
var onExitPrimitive2 = onExitPrimitive;
var onExit2 = onExit;
var onExitIf2 = onExitIf;
var onExitFilter2 = onExitFilter;
var cached2 = cached;
var cachedWithTTL2 = cachedWithTTL;
var cachedInvalidateWithTTL2 = cachedInvalidateWithTTL;
var interrupt3 = interrupt;
var interruptible2 = interruptible;
var onInterrupt2 = onInterrupt;
var uninterruptible2 = uninterruptible;
var uninterruptibleMask2 = uninterruptibleMask;
var interruptibleMask2 = interruptibleMask;
var abortSignal2 = abortSignal;
var forever4 = forever2;
var repeat3 = repeat2;
var repeatOrElse2 = repeatOrElse;
var replicate2 = replicate;
var replicateEffect2 = replicateEffect;
var schedule = /* @__PURE__ */ dual(2, (self, schedule4) => scheduleFrom2(self, void 0, schedule4));
var scheduleFrom2 = scheduleFrom;
var tracer2 = tracer;
var withTracer2 = withTracer;
var withTracerEnabled2 = withTracerEnabled;
var withTracerTiming2 = withTracerTiming;
var annotateSpans2 = annotateSpans;
var annotateCurrentSpan2 = annotateCurrentSpan;
var currentSpan2 = currentSpan;
var currentParentSpan2 = currentParentSpan;
var spanAnnotations2 = spanAnnotations;
var spanLinks2 = spanLinks;
var linkSpans2 = linkSpans;
var makeSpan2 = makeSpan;
var makeSpanScoped2 = makeSpanScoped;
var useSpan2 = useSpan;
var withSpan3 = withSpan;
var withSpanScoped2 = withSpanScoped;
var withParentSpan3 = withParentSpan;
var request2 = request;
var requestUnsafe2 = requestUnsafe;
var forkChild2 = forkChild;
var forkIn2 = forkIn;
var forkScoped2 = forkScoped;
var forkDetach2 = forkDetach;
var awaitAllChildren2 = awaitAllChildren;
var fiber2 = fiber;
var fiberId2 = fiberId;
var runFork2 = runFork;
var runForkWith2 = runForkWith;
var runCallbackWith2 = runCallbackWith;
var runCallback2 = runCallback;
var runPromise2 = runPromise;
var runPromiseWith2 = runPromiseWith;
var runPromiseExit2 = runPromiseExit;
var runPromiseExitWith2 = runPromiseExitWith;
var runSync2 = runSync;
var runSyncWith2 = runSyncWith;
var runSyncExit2 = runSyncExit;
var runSyncExitWith2 = runSyncExitWith;
var fnUntraced2 = fnUntraced;
var fn2 = fn;
var clockWith2 = clockWith;
var logWithLevel2 = logWithLevel;
var log = /* @__PURE__ */ logWithLevel();
var logFatal = /* @__PURE__ */ logWithLevel("Fatal");
var logWarning = /* @__PURE__ */ logWithLevel("Warn");
var logError = /* @__PURE__ */ logWithLevel("Error");
var logInfo = /* @__PURE__ */ logWithLevel("Info");
var logDebug = /* @__PURE__ */ logWithLevel("Debug");
var logTrace = /* @__PURE__ */ logWithLevel("Trace");
var withLogger = /* @__PURE__ */ dual(2, (effect2, logger) => updateService(effect2, CurrentLoggers, (loggers) => /* @__PURE__ */ new Set([...loggers, logger])));
var annotateLogs = /* @__PURE__ */ dual((args2) => isEffect2(args2[0]), (effect2, ...args2) => updateService(effect2, CurrentLogAnnotations2, (annotations) => {
  const newAnnotations = args2.length === 1 ? {
    ...annotations,
    ...args2[0]
  } : {
    ...annotations
  };
  if (args2.length === 1) {
    return newAnnotations;
  } else {
    assignProperty(newAnnotations, args2[0], args2[1]);
  }
  return newAnnotations;
}));
var annotateLogsScoped2 = annotateLogsScoped;
var withLogSpan = /* @__PURE__ */ dual(2, (effect2, label) => flatMap2(currentTimeMillis, (now2) => updateService(effect2, CurrentLogSpans2, (spans) => {
  const span2 = [label, now2];
  return [span2, ...spans];
})));
var track = /* @__PURE__ */ dual((args2) => isEffect2(args2[0]), (self, metric, f) => onExit2(self, (exit3) => {
  const input = f === void 0 ? exit3 : internalCall(() => f(exit3));
  return update(metric, input);
}));
var trackSuccesses = /* @__PURE__ */ dual((args2) => isEffect2(args2[0]), (self, metric, f) => tap3(self, (value) => {
  const input = f === void 0 ? value : f(value);
  return update(metric, input);
}));
var trackErrors = /* @__PURE__ */ dual((args2) => isEffect2(args2[0]), (self, metric, f) => tapError3(self, (error) => {
  const input = f === void 0 ? error : internalCall(() => f(error));
  return update(metric, input);
}));
var trackDefects = /* @__PURE__ */ dual((args2) => isEffect2(args2[0]), (self, metric, f) => tapDefect2(self, (defect) => {
  const input = f === void 0 ? defect : internalCall(() => f(defect));
  return update(metric, input);
}));
var trackDuration = /* @__PURE__ */ dual((args2) => isEffect2(args2[0]), (self, metric, f) => clockWith2((clock) => {
  const startTime = clock.monotonicTimeNanosUnsafe();
  return onExit2(self, () => {
    const endTime = clock.monotonicTimeNanosUnsafe();
    const duration = subtract(fromInputUnsafe(endTime), fromInputUnsafe(startTime));
    const input = f === void 0 ? duration : internalCall(() => f(duration));
    return update(metric, input);
  });
}));
var Transaction = class extends (/* @__PURE__ */ Service()("effect/Effect/Transaction")) {
};
var tx = (effect2) => withFiber2((fiber3) => {
  let state = getOrUndefined2(fiber3.context, Transaction);
  if (state) {
    return effect2;
  }
  state = {
    journal: /* @__PURE__ */ new Map(),
    retry: false
  };
  let result4;
  return uninterruptibleMask2((restore) => flatMap4(whileLoop2({
    while: () => !result4,
    body: constant(restore(effect2).pipe(provideService2(Transaction, state), tapCause3(() => {
      if (!state.retry) return void_3;
      return restore(awaitPendingTransaction(state));
    }), exit2)),
    step(exit3) {
      if (state.retry || !isTransactionConsistent(state)) {
        return clearTransaction(state);
      }
      if (isSuccess4(exit3)) {
        commitTransaction(fiber3, state);
      } else {
        clearTransaction(state);
      }
      result4 = exit3;
    }
  }), () => result4));
});
var isTransactionConsistent = (state) => {
  for (const [ref, {
    version
  }] of state.journal) {
    if (ref.version !== version) {
      return false;
    }
  }
  return true;
};
var awaitPendingTransaction = (state) => suspend3(() => {
  const key = {};
  const refs = Array.from(state.journal.keys());
  const clearPending = () => {
    for (const clear3 of refs) {
      clear3.pending.delete(key);
    }
  };
  return callback2((resume) => {
    const onCall = () => {
      clearPending();
      resume(void_3);
    };
    for (const ref of refs) {
      ref.pending.set(key, onCall);
    }
    return sync3(clearPending);
  });
});
function commitTransaction(fiber3, state) {
  for (const [ref, {
    value
  }] of state.journal) {
    if (value !== ref.value) {
      ref.version = ref.version + 1;
      ref.value = value;
    }
    for (const pending of ref.pending.values()) {
      fiber3.currentDispatcher.scheduleTask(pending, 0);
    }
    ref.pending.clear();
  }
}
function clearTransaction(state) {
  state.retry = false;
  state.journal.clear();
}
var txRetry = /* @__PURE__ */ flatMap4(Transaction, (state) => {
  state.retry = true;
  return interrupt3;
});
var effectify = (fn3, onError5, onSyncError) => (...args2) => callback2((resume) => {
  try {
    fn3(...args2, (err, result4) => {
      if (err) {
        resume(fail6(onError5 ? onError5(err, args2) : err));
      } else {
        resume(succeed6(result4));
      }
    });
  } catch (err) {
    resume(onSyncError ? fail6(onSyncError(err, args2)) : die4(err));
  }
});
var satisfiesSuccessType2 = () => (effect2) => effect2;
var satisfiesErrorType2 = () => (effect2) => effect2;
var satisfiesServicesType2 = () => (effect2) => effect2;
var mapEager2 = mapEager;
var mapErrorEager2 = mapErrorEager;
var mapBothEager2 = mapBothEager;
var flatMapEager2 = flatMapEager;
var catchEager2 = catchEager;
var fnUntracedEager2 = fnUntracedEager;

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/internal/schema/annotations.js
function resolve(ast) {
  return ast.checks ? ast.checks[ast.checks.length - 1].annotations : ast.annotations;
}
var STRUCTURAL_ANNOTATION_KEY = "~structural";
var SENTINELS_ANNOTATION_KEY = "~sentinels";
var CONSTRUCTOR_ANNOTATION_KEY = "~constructor";
var getExpected = /* @__PURE__ */ memoize((ast) => {
  const identifier2 = resolve(ast)?.identifier;
  if (typeof identifier2 === "string") return identifier2;
  return ast.getExpected(getExpected);
});

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/internal/schema/parser.js
var missing = /* @__PURE__ */ Symbol();
var succeed7 = succeed4;
var missingExit = /* @__PURE__ */ succeed7(missing);
var sameExit = /* @__PURE__ */ succeed7(missing);
var toOption = (value) => value === missing ? none2() : some2(value);
var fromOptionExit = (option3) => option3._tag === "None" ? missingExit : succeed7(option3.value);

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/SchemaIssue.js
var TypeId12 = "~effect/SchemaIssue/Issue";
function isIssue(u) {
  return hasProperty(u, TypeId12) && u[TypeId12] === TypeId12;
}
function hasInput(issue) {
  return Object.hasOwn(issue, "input");
}
var Base = class {
  [TypeId12] = TypeId12;
  constructor(input, options) {
    if (options?.reportInput === true && input !== missing) {
      this.input = input;
    }
  }
};
var Filter = class extends Base {
  _tag = "Filter";
  /**
   * The filter that failed.
   */
  filter;
  /**
   * The issue that occurred.
   */
  issue;
  constructor(filter9, issue, input, options) {
    super(input, options);
    this.filter = filter9;
    this.issue = issue;
  }
};
var Encoding = class extends Base {
  _tag = "Encoding";
  /**
   * The schema that caused the issue.
   */
  ast;
  /**
   * The issue that occurred.
   */
  issue;
  constructor(ast, issue, input, options) {
    super(input, options);
    this.ast = ast;
    this.issue = issue;
  }
};
var Pointer = class extends Base {
  _tag = "Pointer";
  /**
   * The path to the location in the input that caused the issue.
   */
  path;
  /**
   * The issue that occurred.
   */
  issue;
  constructor(path, issue) {
    super();
    this.path = path;
    this.issue = issue;
  }
};
var MissingKey = class extends Base {
  _tag = "MissingKey";
  /**
   * The metadata for the issue.
   */
  annotations;
  constructor(annotations) {
    super();
    this.annotations = annotations;
  }
};
var UnexpectedKey = class extends Base {
  _tag = "UnexpectedKey";
  /**
   * The schema that caused the issue.
   */
  ast;
  constructor(ast, input, options) {
    super(input, options);
    this.ast = ast;
  }
};
var Composite = class extends Base {
  _tag = "Composite";
  /**
   * The schema that caused the issue.
   */
  ast;
  /**
   * The issues that occurred.
   */
  issues;
  constructor(ast, issues, input, options) {
    super(input, options);
    this.ast = ast;
    this.issues = issues;
  }
};
var InvalidType = class extends Base {
  _tag = "InvalidType";
  /**
   * The schema that caused the issue.
   */
  ast;
  constructor(ast, input, options) {
    super(input, options);
    this.ast = ast;
  }
};
var InvalidValue = class extends Base {
  _tag = "InvalidValue";
  /**
   * The metadata for the issue.
   */
  annotations;
  constructor(annotations, input, options) {
    super(input, options);
    this.annotations = annotations;
  }
};
var AnyOf = class extends Base {
  _tag = "AnyOf";
  /**
   * The schema that caused the issue.
   */
  ast;
  /**
   * The issues that occurred.
   */
  issues;
  constructor(ast, issues, input, options) {
    super(input, options);
    this.ast = ast;
    this.issues = issues;
  }
};
var OneOf = class extends Base {
  _tag = "OneOf";
  /**
   * The schema that caused the issue.
   */
  ast;
  /**
   * The schemas that were successful.
   */
  successes;
  constructor(ast, successes, input, options) {
    super(input, options);
    this.ast = ast;
    this.successes = successes;
  }
};
function makeFilterIssue(entry, input, options) {
  if (isIssue(entry)) {
    return entry;
  }
  if (typeof entry === "string") {
    return new InvalidValue({
      message: entry
    }, input, options);
  }
  const inner = typeof entry.issue === "string" ? new InvalidValue({
    message: entry.issue
  }, input, options) : entry.issue;
  return new Pointer(entry.path, inner);
}
function makeSingle(out2, input, options) {
  if (out2 === void 0) {
    return void 0;
  }
  if (typeof out2 === "boolean") {
    return out2 ? void 0 : new InvalidValue(void 0, input, options);
  }
  return makeFilterIssue(out2, input, options);
}
function normalizeFilterOutput(ast, out2, input, options) {
  if (Array.isArray(out2)) {
    if (!isReadonlyArrayNonEmpty(out2)) {
      return void 0;
    }
    return out2.length === 1 ? makeFilterIssue(out2[0], input, options) : new Composite(ast, map2(out2, (entry) => makeFilterIssue(entry, input, options)), input, options);
  }
  return makeSingle(out2, input, options);
}
var defaultLeafHook = (issue) => {
  const message = findMessage(issue);
  if (message !== void 0) return message;
  switch (issue._tag) {
    case "InvalidType":
      return getExpectedMessage(getExpected(issue.ast), issue);
    case "InvalidValue": {
      const expected = findExpected(issue);
      if (expected !== void 0) return getExpectedMessage(expected, issue);
      const input = formatInput(issue);
      return input === void 0 ? "Expected a valid value" : `Invalid data ${input}`;
    }
    case "MissingKey":
      return "Missing key";
    case "UnexpectedKey": {
      const input = formatInput(issue);
      return input === void 0 ? "Expected no excess property" : `Unexpected key with value ${input}`;
    }
    case "Forbidden":
      return "Forbidden operation";
    case "OneOf": {
      const input = formatInput(issue);
      return input === void 0 ? "Expected exactly one member to match" : `Expected exactly one member to match the input ${input}`;
    }
  }
};
var defaultCheckHook = (issue) => findMessage(issue.issue) ?? findMessage(issue);
function formatInput(issue) {
  return hasInput(issue) ? format(issue.input) : void 0;
}
function findExpected(issue) {
  const expected = issue.annotations?.expected;
  return typeof expected === "string" ? expected : void 0;
}
function getExpectedMessage(expected, issue) {
  const input = formatInput(issue);
  return input === void 0 ? `Expected ${expected}` : `Expected ${expected}, got ${input}`;
}
function formatCheck(check2) {
  const expected = check2.annotations?.expected;
  if (typeof expected === "string") return expected;
  switch (check2._tag) {
    case "Filter":
      return "<filter>";
    case "FilterGroup":
      return check2.checks.map((check3) => formatCheck(check3)).join(" & ");
  }
}
function makeFormatterDefault() {
  return (issue) => formatIssue(issue, "");
}
var defaultFormatter = /* @__PURE__ */ makeFormatterDefault();
function formatIssue(issue, path) {
  let message;
  switch (issue._tag) {
    case "Filter": {
      const annotated = defaultCheckHook(issue);
      if (annotated !== void 0) {
        message = annotated;
      } else {
        if (issue.issue._tag !== "InvalidValue") {
          return formatIssue(issue.issue, path);
        }
        const expected = findExpected(issue.issue);
        message = expected === void 0 ? getExpectedMessage(formatCheck(issue.filter), issue) : getExpectedMessage(expected, issue.issue);
      }
      break;
    }
    case "Encoding":
      return formatIssue(issue.issue, path);
    case "Pointer":
      return formatIssue(issue.issue, path + formatPath(issue.path));
    case "Composite":
    case "AnyOf": {
      if (issue._tag === "Composite" || issue.issues.length > 0) {
        return issue.issues.map((issue2) => formatIssue(issue2, path)).join("\n");
      }
      message = findMessage(issue) ?? getExpectedMessage(getExpected(issue.ast), issue);
      break;
    }
    default:
      message = defaultLeafHook(issue);
      break;
  }
  return path ? `${message}
  at ${path}` : message;
}
function findMessage(issue) {
  if (issue._tag === "Pointer") return;
  if (issue._tag === "Encoding") return findMessage(issue.issue);
  const annotations = issue._tag === "Filter" ? issue.filter.annotations : "annotations" in issue ? issue.annotations : issue.ast.annotations;
  const message = annotations?.[issue._tag === "MissingKey" ? "messageMissingKey" : issue._tag === "UnexpectedKey" ? "messageUnexpectedKey" : "message"];
  if (typeof message === "string") return message;
}

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/internal/schema/cause.js
function getSchemaIssue(cause) {
  let issue;
  for (const reason of cause.reasons) {
    if (!isFailReason2(reason) || !isIssue(reason.error)) {
      return void 0;
    }
    issue ??= reason.error;
  }
  return issue;
}
function getSchemaIssueOrThrow(cause, message) {
  const issue = getSchemaIssue(cause);
  if (issue === void 0) {
    throw new Error(message, {
      cause
    });
  }
  return issue;
}

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/SchemaGetter.js
var Getter = class _Getter extends Class {
  run;
  constructor(run3) {
    super();
    this.run = run3;
  }
  map(f) {
    return new _Getter((oe, options) => this.run(oe, options).pipe(mapEager2(map(f))));
  }
  compose(other) {
    if (isPassthrough(this)) {
      return other;
    }
    if (isPassthrough(other)) {
      return this;
    }
    return new _Getter((oe, options) => this.run(oe, options).pipe(flatMapEager2((ot) => other.run(ot, options))));
  }
};
var passthrough_ = /* @__PURE__ */ new Getter(succeed6);
function isPassthrough(getter) {
  return getter.run === passthrough_.run;
}
function passthrough2() {
  return passthrough_;
}
function onSome(f) {
  return new Getter((oe, options) => isNone2(oe) ? succeedNone2 : f(oe.value, options));
}
function transform(f) {
  return transformOptional(map(f));
}
function transformOrFail(f) {
  return onSome((e, options) => f(e, options).pipe(mapEager2(some2)));
}
function transformOptional(f) {
  return new Getter((oe) => succeed6(f(oe)));
}
function withDefault(defaultValue) {
  return new Getter((o) => {
    const filtered = filter(o, isNotUndefined);
    return isSome2(filtered) ? succeed6(filtered) : mapEager2(defaultValue, some2);
  });
}
function String3() {
  return transform(globalThis.String);
}
function Number4() {
  return transform(globalThis.Number);
}
function encodeBase642() {
  return transform(encodeBase64);
}
function decodeBase642() {
  return transformOrFail((input, options) => mapErrorEager2(fromResult2(decodeBase64(input)), () => new InvalidValue({
    expected: "a valid Base64 string"
  }, input, options)));
}

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/SchemaTransformation.js
var TypeId13 = "~effect/SchemaTransformation/Transformation";
var Transformation = class _Transformation {
  [TypeId13] = TypeId13;
  _tag = "Transformation";
  decode;
  encode;
  constructor(decode, encode) {
    this.decode = decode;
    this.encode = encode;
  }
  flip() {
    return new _Transformation(this.encode, this.decode);
  }
  compose(other) {
    return new _Transformation(this.decode.compose(other.decode), other.encode.compose(this.encode));
  }
};
function isTransformation(u) {
  return hasProperty(u, TypeId13) && u[TypeId13] === TypeId13;
}
var make5 = (options) => {
  if (isTransformation(options)) {
    return options;
  }
  return new Transformation(options.decode, options.encode);
};
function transformOrFail2(options) {
  return new Transformation(transformOrFail(options.decode), transformOrFail(options.encode));
}
function transform2(options) {
  return new Transformation(transform(options.decode), transform(options.encode));
}
var passthrough_2 = /* @__PURE__ */ new Transformation(/* @__PURE__ */ passthrough2(), /* @__PURE__ */ passthrough2());
function passthrough3() {
  return passthrough_2;
}
var numberFromString = /* @__PURE__ */ new Transformation(/* @__PURE__ */ Number4(), /* @__PURE__ */ String3());
var urlFromString = /* @__PURE__ */ transformOrFail2({
  decode: (s2, options) => URL.canParse(s2) ? succeed6(new URL(s2)) : fail6(new InvalidValue({
    expected: "a valid URL string"
  }, s2, options)),
  encode: (url) => succeed6(url.href)
});
var uint8ArrayFromBase64String = /* @__PURE__ */ new Transformation(/* @__PURE__ */ decodeBase642(), /* @__PURE__ */ encodeBase642());

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/SchemaAST.js
function makeGuard(tag2) {
  return (ast) => ast._tag === tag2;
}
var isDeclaration = /* @__PURE__ */ makeGuard("Declaration");
var isNever2 = /* @__PURE__ */ makeGuard("Never");
var isLiteral = /* @__PURE__ */ makeGuard("Literal");
var isUniqueSymbol = /* @__PURE__ */ makeGuard("UniqueSymbol");
var isArrays = /* @__PURE__ */ makeGuard("Arrays");
var isObjects = /* @__PURE__ */ makeGuard("Objects");
var isSuspend = /* @__PURE__ */ makeGuard("Suspend");
var Link = class {
  to;
  transformation;
  constructor(to, transformation) {
    this.to = to;
    this.transformation = transformation;
  }
};
var defaultParseOptions = {};
var Context = class {
  isOptional;
  isMutable;
  /** Used for constructor default values (e.g. `withConstructorDefault` API) */
  constructorDefault;
  annotations;
  constructor(isOptional2, isMutable, constructorDefault = void 0, annotations = void 0) {
    this.isOptional = isOptional2;
    this.isMutable = isMutable;
    this.constructorDefault = constructorDefault;
    this.annotations = annotations;
  }
};
var TypeId14 = "~effect/Schema";
var Base2 = class {
  [TypeId14] = TypeId14;
  annotations;
  checks;
  encoding;
  context;
  constructor(annotations = void 0, checks = void 0, encoding = void 0, context3 = void 0) {
    this.annotations = annotations;
    this.checks = checks;
    this.encoding = encoding;
    this.context = context3;
  }
  toString() {
    return `<${this._tag}>`;
  }
};
var Declaration = class _Declaration extends Base2 {
  _tag = "Declaration";
  typeParameters;
  run;
  encodingChecks;
  /**
   * Parser factory {@link flip} swaps in, so a declaration can behave
   * differently when encoding. `undefined` reuses {@link run}.
   */
  encodingRun;
  constructor(typeParameters, run3, annotations, checks, encoding, context3, encodingChecks, encodingRun) {
    super(annotations, checks, encoding, context3);
    this.typeParameters = typeParameters;
    this.run = run3;
    this.encodingChecks = encodingChecks;
    this.encodingRun = encodingRun;
  }
  /** @internal */
  getParser() {
    let run3;
    return (input, options) => {
      if (input === missing) return missingExit;
      return (run3 ??= this.run(this.typeParameters))(input, this, options);
    };
  }
  _rebuild(recur, checks, encodingChecks, run3, encodingRun) {
    const tps = mapOrSame(this.typeParameters, recur);
    return tps === this.typeParameters && checks === this.checks && encodingChecks === this.encodingChecks && run3 === this.run && encodingRun === this.encodingRun ? this : new _Declaration(tps, run3, this.annotations, checks, void 0, this.context, encodingChecks, encodingRun);
  }
  /** @internal */
  recur(recur) {
    return this._rebuild(recur, this.checks, this.encodingChecks, this.run, this.encodingRun);
  }
  /** @internal */
  flip(recur) {
    return this._rebuild(recur, this.encodingChecks, this.checks, this.encodingRun ?? this.run, this.run);
  }
  /** @internal */
  getExpected() {
    const expected = this.annotations?.expected;
    if (typeof expected === "string") return expected;
    return "<Declaration>";
  }
};
var Unknown = class extends Base2 {
  _tag = "Unknown";
  /** @internal */
  getParser() {
    return fromRefinement(this, isUnknown);
  }
  /** @internal */
  getExpected() {
    return "unknown";
  }
};
var unknown = /* @__PURE__ */ new Unknown();
var Literal = class extends Base2 {
  _tag = "Literal";
  literal;
  constructor(literal, annotations, checks, encoding, context3) {
    super(annotations, checks, encoding, context3);
    if (typeof literal === "number" && !globalThis.Number.isFinite(literal)) {
      throw new Error(`A numeric literal must be finite, got ${format(literal)}`);
    }
    this.literal = literal;
  }
  /** @internal */
  getParser() {
    return fromConst(this, this.literal);
  }
  /** @internal */
  matchPart(s2, _options) {
    return s2 === globalThis.String(this.literal) ? this.literal : void 0;
  }
  /** @internal */
  toCodecJson() {
    return typeof this.literal === "bigint" ? literalToString(this) : this;
  }
  /** @internal */
  toCodecStringTree() {
    return typeof this.literal === "string" ? this : literalToString(this);
  }
  /** @internal */
  getExpected() {
    return typeof this.literal === "string" ? JSON.stringify(this.literal) : globalThis.String(this.literal);
  }
};
function literalToString(ast) {
  const literalAsString = globalThis.String(ast.literal);
  return replaceEncoding(ast, [new Link(new Literal(literalAsString), new Transformation(transform(() => ast.literal), transform(() => literalAsString)))]);
}
var String4 = class extends Base2 {
  _tag = "String";
  /** @internal */
  getParser() {
    return fromRefinement(this, isString);
  }
  /** @internal */
  matchPart(s2, options) {
    const checks = this.checks;
    return checks && !options.disableChecks && collectIssues(checks, s2, void 0, this, options) ? void 0 : s2;
  }
  /** @internal */
  getExpected() {
    return "string";
  }
};
var string2 = /* @__PURE__ */ new String4();
var Number5 = class extends Base2 {
  _tag = "Number";
  /** @internal */
  getParser() {
    return fromRefinement(this, isNumber);
  }
  /** @internal */
  matchKey(s2, options) {
    return this._match(isStringNumberRegExp, s2, options);
  }
  /** @internal */
  matchPart(s2, options) {
    return this._match(isStringFiniteRegExp, s2, options);
  }
  _match(regexp, s2, options) {
    if (!regexp.test(s2)) return void 0;
    const value = globalThis.Number(s2);
    if (options.disableChecks || !this.checks) return value;
    return collectIssues(this.checks, value, void 0, this, options) ? void 0 : value;
  }
  /** @internal */
  toCodecJson() {
    if (this.checks && (hasCheck(this.checks, "effect/schema/isFinite") || hasCheck(this.checks, "effect/schema/isInt"))) {
      return this;
    }
    return replaceEncoding(this, [numberToJson]);
  }
  /** @internal */
  toCodecStringTree() {
    if (this.toCodecJson() === this) {
      return replaceEncoding(this, [finiteToString]);
    }
    return replaceEncoding(this, [numberToString]);
  }
  /** @internal */
  getExpected() {
    return "number";
  }
};
function hasCheck(checks, id) {
  return checks.some((check2) => check2.annotations?.representation?.id === id || check2._tag === "FilterGroup" && hasCheck(check2.checks, id));
}
var number2 = /* @__PURE__ */ new Number5();
var Arrays = class _Arrays extends Base2 {
  _tag = "Arrays";
  isMutable;
  elements;
  rest;
  encodingChecks;
  constructor(isMutable, elements, rest, annotations, checks, encoding, context3, encodingChecks) {
    super(annotations, checks, encoding, context3);
    this.isMutable = isMutable;
    this.elements = elements;
    this.rest = rest;
    this.encodingChecks = encodingChecks;
    let hasOptional = false;
    for (let i = 0; i < elements.length; i++) {
      if (isOptional(elements[i])) {
        hasOptional = true;
      } else if (hasOptional) {
        throw new Error("A required element cannot follow an optional element. ts(1257)");
      }
    }
    if (hasOptional && rest.length > 1) {
      throw new Error("A required element cannot follow an optional element. ts(1257)");
    }
    for (let i = 1; i < rest.length; i++) {
      if (isOptional(rest[i])) {
        throw new Error("An optional element cannot follow a rest element. ts(1266)");
      }
    }
  }
  /** @internal */
  getParser(compile, compileConstructorDefault2 = compile) {
    const ast = this;
    let elements;
    let rest;
    const elementLen = ast.elements.length;
    const tailLen = Math.max(0, ast.rest.length - 1);
    function getParser(tailThreshold, index) {
      if (index < elementLen) {
        return elements[index];
      } else if (index >= tailThreshold) {
        return rest[index - tailThreshold + 1];
      }
      return rest[0];
    }
    return fnUntracedEager2(function* (input, options) {
      if (input === missing) {
        return missing;
      }
      if (!Array.isArray(input)) {
        return yield* fail6(new InvalidType(ast, input, options));
      }
      if (!elements) {
        elements = ast.elements.map((ast2) => ({
          ast: ast2,
          parser: compileConstructorDefault2(ast2)
        }));
        rest = ast.rest.map((ast2) => ({
          ast: ast2,
          parser: compileConstructorDefault2(ast2)
        }));
      }
      const len = input.length;
      const state = {
        ast,
        getParser,
        input,
        len,
        tailThreshold: Math.max(elementLen, len - tailLen),
        output: new globalThis.Array(len),
        issues: void 0,
        options
      };
      const concurrency = resolveConcurrency(options?.concurrency);
      const eff = parseArray(state, input, {
        concurrency: concurrency?.concurrency,
        end: ast.rest.length === 0 ? elementLen : Math.max(len, elementLen + tailLen)
      });
      if (eff) yield* eff;
      if (ast.rest.length === 0 && len > elementLen) {
        for (let i = elementLen; i <= len - 1; i++) {
          const unexpected = new UnexpectedKey(ast, input[i], options);
          const issue = new Pointer([i], unexpected);
          if (options.errors === "all") {
            if (state.issues) state.issues.push(issue);
            else state.issues = [issue];
          } else {
            return yield* fail6(new Composite(ast, [issue], input, options));
          }
        }
      }
      if (state.issues) {
        return yield* fail6(new Composite(ast, state.issues, input, options));
      }
      return state.output;
    });
  }
  _rebuild(recur, checks, encodingChecks) {
    const elements = mapOrSame(this.elements, recur);
    const rest = mapOrSame(this.rest, recur);
    return elements === this.elements && rest === this.rest && checks === this.checks && encodingChecks === this.encodingChecks ? this : new _Arrays(this.isMutable, elements, rest, this.annotations, checks, void 0, this.context, encodingChecks);
  }
  /** @internal */
  recur(recur) {
    return this._rebuild(recur, this.checks, this.encodingChecks);
  }
  /** @internal */
  flip(recur) {
    return this._rebuild(recur, this.encodingChecks, this.checks);
  }
  /** @internal */
  getExpected() {
    return "array";
  }
};
var parseArray = /* @__PURE__ */ iterateEager()({
  onItem(s2, item, i) {
    const value = i < s2.len ? item : missing;
    return s2.getParser(s2.tailThreshold, i).parser(value, s2.options);
  },
  step(s2, item, exit3, i) {
    if (exit3._tag === "Failure") {
      return wrapPropertyKeyIssue(s2, s2.ast, i, exit3);
    }
    const value = exit3 === sameExit ? item : exit3[args];
    if (value !== missing) {
      s2.output[i] = value;
    } else {
      const p2 = s2.getParser(s2.tailThreshold, i);
      if (isOptional(p2.ast)) return;
      const issue = new Pointer([i], new MissingKey(p2.ast.context?.annotations));
      if (s2.options.errors === "all") {
        if (s2.issues) s2.issues.push(issue);
        else s2.issues = [issue];
      } else {
        return fail5(new Composite(s2.ast, [issue], s2.input, s2.options));
      }
    }
  }
});
var resolveConcurrency = (value) => {
  value = value === "unbounded" ? Infinity : value ?? 1;
  return value > 1 ? {
    concurrency: value
  } : void 0;
};
var wrapPropertyKeyIssue = (s2, ast, key, exit3) => {
  if (exit3.cause.reasons.length === 0) {
    return exit3;
  }
  const issue = getSchemaIssue(exit3.cause);
  if (issue === void 0) {
    return failCause2(map5(exit3.cause, (issue2) => new Composite(ast, [new Pointer([key], issue2)], s2.input, s2.options)));
  }
  const pointer = new Pointer([key], issue);
  if (s2.options.errors === "all") {
    if (s2.issues) s2.issues.push(pointer);
    else s2.issues = [pointer];
  } else {
    return fail5(new Composite(ast, [pointer], s2.input, s2.options));
  }
};
var FINITE_PATTERN = "[+-]?\\d*\\.?\\d+(?:[Ee][+-]?\\d+)?";
function getIndexSignatureKeys(input, parameter, options = defaultParseOptions) {
  let stringKeys;
  let symbolKeys;
  function go(parameter2) {
    switch (parameter2._tag) {
      case "String":
      case "TemplateLiteral":
        return (stringKeys ??= Object.keys(input)).filter((k) => parameter2.matchPart(k, options) !== void 0);
      case "Number":
        return (stringKeys ??= Object.keys(input)).filter((k) => parameter2.matchKey(k, options) !== void 0);
      case "Symbol":
        return (symbolKeys ??= Object.getOwnPropertySymbols(input)).filter((k) => parameter2.matchKey(k, options) !== void 0);
      case "Union":
        return [...new Set(parameter2.types.flatMap(go))];
      default:
        return [];
    }
  }
  return go(parameterFromPropertyKey(toEncoded(parameter)));
}
var PropertySignature = class {
  name;
  type;
  constructor(name, type) {
    this.name = name;
    this.type = type;
  }
};
function isIndexSignatureParameterSide(ast) {
  switch (ast._tag) {
    case "String":
    case "Number":
    case "Symbol":
    case "TemplateLiteral":
      return true;
    case "Union":
      return ast.types.every(isIndexSignatureParameterSide);
    default:
      return false;
  }
}
function isIndexSignatureParameter(ast) {
  return isIndexSignatureParameterSide(ast) && isIndexSignatureParameterSide(toEncoded(ast));
}
var IndexSignature = class {
  parameter;
  type;
  constructor(parameter, type) {
    if (!isIndexSignatureParameter(parameter)) {
      throw new Error(`Invalid index signature parameter ${parameter._tag}`);
    }
    this.parameter = parameter;
    this.type = type;
    if (isOptional(type) && !containsUndefined(type)) {
      throw new Error("Cannot use `Schema.optionalKey` with index signatures, use `Schema.optional` instead.");
    }
  }
};
var Objects = class _Objects extends Base2 {
  _tag = "Objects";
  propertySignatures;
  indexSignatures;
  encodingChecks;
  constructor(propertySignatures, indexSignatures, annotations, checks, encoding, context3, encodingChecks) {
    super(annotations, checks, encoding, context3);
    this.propertySignatures = propertySignatures;
    this.indexSignatures = indexSignatures;
    this.encodingChecks = encodingChecks;
    const duplicates = propertySignatures.map((ps) => ps.name).filter((name, i, arr) => arr.indexOf(name) !== i);
    if (duplicates.length > 0) {
      throw new Error(`Duplicate identifiers: ${JSON.stringify(duplicates)}. ts(2300)`);
    }
  }
  /** @internal */
  getParser(compile, compileConstructorDefault2 = compile) {
    const ast = this;
    const expectedKeys = [];
    for (const ps of ast.propertySignatures) {
      expectedKeys.push(ps.name);
    }
    const hasProperties = expectedKeys.length;
    const indexCount = ast.indexSignatures.length;
    let expectedKeysSet = hasProperties && indexCount ? new Set(expectedKeys) : void 0;
    if (!hasProperties && !indexCount) {
      return fromRefinement(ast, isNotNullish);
    }
    let properties;
    let indexes;
    const finishIndex = (s2, key, k2, inputValue, exitValue) => {
      if (exitValue._tag === "Failure") {
        return wrapPropertyKeyIssue(s2, ast, key, exitValue) ?? void_2;
      }
      const value = exitValue === sameExit ? inputValue : exitValue[args];
      if (k2 !== missing && value !== missing) {
        if (hasProperties && (expectedKeysSet.has(key) || expectedKeysSet.has(k2))) return void_2;
        assignProperty(s2.out, k2, value);
      }
      return void_2;
    };
    const parseIndex = (s2, key, index, exitKey) => {
      if (!exitKey) {
        const eff = index.parserKey(key, s2.options);
        if (!effectIsExit(eff)) {
          return flatMap4(exit2(eff), (exit3) => parseIndex(s2, key, index, exit3));
        }
        exitKey = eff;
      }
      if (exitKey._tag === "Failure") {
        return wrapPropertyKeyIssue(s2, ast, key, exitKey) ?? void_2;
      }
      const k2 = exitKey === sameExit ? key : exitKey[args];
      const inputValue = s2.input[key];
      const result4 = index.parserValue(inputValue, s2.options);
      return effectIsExit(result4) ? finishIndex(s2, key, k2, inputValue, result4) : flatMap4(exit2(result4), (exit3) => finishIndex(s2, key, k2, inputValue, exit3));
    };
    const parseStringIndex = (s2, key, index) => {
      const inputValue = s2.input[key];
      const result4 = index.parserValue(inputValue, s2.options);
      return effectIsExit(result4) ? finishIndex(s2, key, key, inputValue, result4) : flatMap4(exit2(result4), (exit3) => finishIndex(s2, key, key, inputValue, exit3));
    };
    const parseIndexes = indexCount ? iterateEager()({
      onItem: (s2, [key, index]) => parseIndex(s2, key, index),
      step: (_s, _, exit3) => exit3._tag === "Failure" ? exit3 : void 0
    }) : void 0;
    const compileMembers = () => {
      if (!properties) {
        properties = ast.propertySignatures.map((ps) => ({
          parser: compileConstructorDefault2(ps.type),
          name: ps.name,
          type: ps.type
        }));
        indexes = indexCount ? ast.indexSignatures.map((is2) => ({
          is: is2,
          parserKey: compile(parameterFromPropertyKey(is2.parameter)),
          parserValue: compileConstructorDefault2(is2.type)
        })) : void 0;
      }
      return properties;
    };
    const fallback = fnUntracedEager2(function* (input, options) {
      if (input === missing) {
        return missing;
      }
      if (!(typeof input === "object" && input !== null && !Array.isArray(input))) {
        return yield* fail6(new InvalidType(ast, input, options));
      }
      compileMembers();
      const record2 = input;
      const out2 = {};
      const state = {
        ast,
        input: record2,
        out: out2,
        issues: void 0,
        options
      };
      const errorsAllOption = options.errors === "all";
      const onExcessPropertyError = options.onExcessProperty === "error";
      const onExcessPropertyPreserve = options.onExcessProperty === "preserve";
      let inputKeys;
      if (!indexCount && (onExcessPropertyError || onExcessPropertyPreserve)) {
        expectedKeysSet ??= new Set(expectedKeys);
        inputKeys = Reflect.ownKeys(record2);
        for (let i = 0; i < inputKeys.length; i++) {
          const key = inputKeys[i];
          if (!expectedKeysSet.has(key)) {
            if (onExcessPropertyError) {
              const unexpected = new UnexpectedKey(ast, record2[key], options);
              const issue = new Pointer([key], unexpected);
              if (errorsAllOption) {
                if (state.issues) {
                  state.issues.push(issue);
                } else {
                  state.issues = [issue];
                }
                continue;
              } else {
                return yield* fail6(new Composite(ast, [issue], input, options));
              }
            } else {
              assignProperty(out2, key, record2[key]);
            }
          }
        }
      }
      const concurrency = resolveConcurrency(options?.concurrency);
      if (hasProperties) {
        const eff = parseProperties(state, properties, concurrency);
        if (eff) yield* eff;
      }
      if (indexCount && !concurrency) {
        for (let i = 0; i < indexCount; i++) {
          const index = indexes[i];
          const parse = index.is.parameter === string2 ? parseStringIndex : parseIndex;
          const keys2 = index.is.parameter === string2 ? Object.keys(record2) : getIndexSignatureKeys(record2, index.is.parameter, options);
          for (let j = 0; j < keys2.length; j++) {
            const eff = parse(state, keys2[j], index);
            if (!effectIsExit(eff)) yield* eff;
            else if (eff._tag === "Failure") return yield* eff;
          }
        }
      } else if (parseIndexes) {
        const keyPairs = empty();
        for (let i = 0; i < indexCount; i++) {
          const index = indexes[i];
          const keys2 = getIndexSignatureKeys(record2, index.is.parameter, options);
          for (let j = 0; j < keys2.length; j++) {
            keyPairs.push([keys2[j], index]);
          }
        }
        const eff = parseIndexes(state, keyPairs, concurrency);
        if (eff) yield* eff;
      }
      if (state.issues) {
        return yield* fail6(new Composite(ast, state.issues, input, options));
      }
      if (options.propertyOrder === "original") {
        const keys2 = (inputKeys ?? Reflect.ownKeys(record2)).concat(expectedKeys);
        const preserved = {};
        for (const key of keys2) {
          if (Object.hasOwn(out2, key)) {
            assignProperty(preserved, key, out2[key]);
          }
        }
        return preserved;
      }
      return out2;
    });
    if (indexCount) return fallback;
    const resume = (state, index, pending) => {
      const property = properties[index];
      return flatMap4(exit2(pending), (exit3) => {
        const terminal = stepProperty(state, property, exit3);
        if (terminal) return terminal;
        const done4 = () => succeed7(state.out);
        const eff = parseProperties(state, properties.slice(index + 1));
        return eff ? flatMapEager2(eff, done4) : done4();
      });
    };
    return (input, options) => {
      if (input === missing) return missingExit;
      if (options.errors === "all" || options.onExcessProperty !== void 0 || options.propertyOrder === "original" || options.concurrency !== void 0) {
        return fallback(input, options);
      }
      if (!(typeof input === "object" && input !== null && !Array.isArray(input))) {
        return fail6(new InvalidType(ast, input, options));
      }
      const props = compileMembers();
      const record2 = input;
      const out2 = {};
      const state = {
        ast,
        input: record2,
        out: out2,
        issues: void 0,
        options
      };
      try {
        for (let index = 0; index < props.length; index++) {
          const property = props[index];
          const name = property.name;
          const hasKey = Object.hasOwn(record2, name);
          const value = hasKey ? record2[name] : missing;
          const exit3 = property.parser(value, options);
          if (!effectIsExit(exit3)) {
            return resume(state, index, exit3);
          }
          if (exit3 === sameExit) {
            if (hasKey) assignProperty(out2, name, value);
            continue;
          }
          const terminal = stepProperty(state, property, exit3);
          if (terminal) return terminal;
        }
      } catch (error) {
        return die4(error);
      }
      return succeed7(out2);
    };
  }
  _rebuild(recur, recurParameter, checks, encodingChecks) {
    const props = mapOrSame(this.propertySignatures, (ps) => {
      const t = recur(ps.type);
      return t === ps.type ? ps : new PropertySignature(ps.name, t);
    });
    const indexes = mapOrSame(this.indexSignatures, (is2) => {
      const p2 = recurParameter(is2.parameter);
      const t = recur(is2.type);
      return p2 === is2.parameter && t === is2.type ? is2 : new IndexSignature(p2, t);
    });
    return props === this.propertySignatures && indexes === this.indexSignatures && checks === this.checks && encodingChecks === this.encodingChecks ? this : new _Objects(props, indexes, this.annotations, checks, void 0, this.context, encodingChecks);
  }
  /** @internal */
  flip(recur) {
    return this._rebuild(recur, recur, this.encodingChecks, this.checks);
  }
  /** @internal */
  recur(recur, recurParameter = recur) {
    return this._rebuild(recur, recurParameter, this.checks, this.encodingChecks);
  }
  /** @internal */
  getExpected() {
    if (this.propertySignatures.length === 0 && this.indexSignatures.length === 0) return "object | array";
    return "object";
  }
};
function stepProperty(s2, p2, exit3) {
  if (exit3._tag === "Failure") {
    return wrapPropertyKeyIssue(s2, s2.ast, p2.name, exit3);
  }
  if (exit3 === sameExit) return;
  const value = exit3[args];
  if (value !== missing) {
    assignProperty(s2.out, p2.name, value);
    return;
  }
  delete s2.out[p2.name];
  if (!isOptional(p2.type)) {
    const issue = new Pointer([p2.name], new MissingKey(p2.type.context?.annotations));
    if (s2.options.errors === "all") {
      if (s2.issues) s2.issues.push(issue);
      else s2.issues = [issue];
      return;
    } else {
      return fail5(new Composite(s2.ast, [issue], s2.input, s2.options));
    }
  }
}
var parseProperties = /* @__PURE__ */ iterateEager()({
  onItem(s2, p2) {
    if (!Object.hasOwn(s2.input, p2.name)) {
      return p2.parser(missing, s2.options);
    }
    const value = s2.input[p2.name];
    assignProperty(s2.out, p2.name, value);
    return p2.parser(value, s2.options);
  },
  step: stepProperty
});
function combineChecks(a, b) {
  if (!a) return b;
  if (!b) return a;
  return [...a, ...b];
}
function struct(fields, checks, annotations) {
  return new Objects(Reflect.ownKeys(fields).map((key) => {
    return new PropertySignature(key, fields[key].ast);
  }), [], annotations, checks);
}
function getAST(self) {
  return self.ast;
}
function tuple(elements, checks = void 0) {
  return new Arrays(false, elements.map((e) => e.ast), [], void 0, checks);
}
function union2(members, mode, checks) {
  return new Union(members.map(getAST), mode, void 0, checks);
}
var toCandidate = /* @__PURE__ */ memoizeIdempotent((ast) => {
  while (true) {
    if (isSuspend(ast)) return unknown;
    const encoding = ast.encoding;
    if (!encoding) {
      return ast.recur?.(toCandidate, identity) ?? ast;
    }
    if (encoding.some((link4) => link4.transformation._tag === "Middleware" && link4.transformation.decode !== identity)) return unknown;
    ast = encoding[encoding.length - 1].to;
  }
});
function getCandidateTypes(ast) {
  switch (ast._tag) {
    case "Null":
      return ["null"];
    case "Undefined":
      return ["undefined"];
    case "String":
    case "TemplateLiteral":
      return ["string"];
    case "Number":
      return ["number"];
    case "Boolean":
      return ["boolean"];
    case "Symbol":
    case "UniqueSymbol":
      return ["symbol"];
    case "BigInt":
      return ["bigint"];
    case "Arrays":
      return ["array"];
    case "ObjectKeyword":
      return ["object", "array", "function"];
    case "Objects":
      return ast.propertySignatures.length || ast.indexSignatures.length ? ["object"] : ["string", "number", "boolean", "symbol", "bigint", "object", "array", "function"];
    case "Enum":
      return Array.from(new Set(ast.enums.map(([, v]) => typeof v)));
    case "Literal":
      return [typeof ast.literal];
    case "Union":
      return Array.from(new Set(ast.types.flatMap(getCandidateTypes)));
    default:
      return ["null", "undefined", "string", "number", "boolean", "symbol", "bigint", "object", "array", "function"];
  }
}
function collectSentinels(ast) {
  switch (ast._tag) {
    default:
      return [];
    case "Declaration": {
      const s2 = ast.annotations?.[SENTINELS_ANNOTATION_KEY];
      return Array.isArray(s2) ? s2 : [];
    }
    case "Objects":
      return ast.propertySignatures.flatMap((ps) => {
        const type = ps.type;
        if (!isOptional(type)) {
          if (isLiteral(type)) {
            return [{
              key: ps.name,
              literal: type.literal
            }];
          }
          if (isUniqueSymbol(type)) {
            return [{
              key: ps.name,
              literal: type.symbol
            }];
          }
        }
        return [];
      });
    case "Arrays":
      return ast.elements.flatMap((e, i) => {
        if (!isOptional(e)) {
          if (isLiteral(e)) {
            return [{
              key: i,
              literal: e.literal
            }];
          }
          if (isUniqueSymbol(e)) {
            return [{
              key: i,
              literal: e.symbol
            }];
          }
        }
        return [];
      });
    case "Union": {
      if (ast.types.length === 0) return [];
      const members = ast.types.map((type) => collectSentinels(toCandidate(type)));
      return members[0].filter((s2) => members.every((sentinels) => sentinels.some((o) => o.key === s2.key && o.literal === s2.literal)));
    }
    case "Suspend":
      return collectSentinels(ast.thunk());
  }
}
var candidateIndexCache = /* @__PURE__ */ new WeakMap();
var emptyCandidates = /* @__PURE__ */ Object.freeze([]);
function getIndex(types) {
  let index = candidateIndexCache.get(types);
  if (index) return index;
  let bySentinel;
  let sentinelCandidateCount = 0;
  let otherwise;
  let literalCandidates;
  let onlyLiterals = true;
  for (let i = 0; i < types.length; i++) {
    const a = types[i];
    const encoded = toCandidate(a);
    if (isNever2(encoded)) continue;
    if (onlyLiterals) {
      if (isLiteral(encoded) || isUniqueSymbol(encoded)) {
        literalCandidates ??= /* @__PURE__ */ new Map();
        const literal = isLiteral(encoded) ? encoded.literal : encoded.symbol;
        let arr = literalCandidates.get(literal);
        if (!arr) literalCandidates.set(literal, arr = []);
        arr.push(a);
      } else {
        onlyLiterals = false;
      }
    }
    const sentinels = collectSentinels(encoded);
    if (sentinels.length) {
      bySentinel ??= /* @__PURE__ */ new Map();
      sentinelCandidateCount++;
      for (const {
        key,
        literal
      } of sentinels) {
        let entry = bySentinel.get(key);
        if (!entry) bySentinel.set(key, entry = [/* @__PURE__ */ new Map(), /* @__PURE__ */ new Set()]);
        entry[1].add(i);
        let indexes = entry[0].get(literal);
        if (!indexes) entry[0].set(literal, indexes = /* @__PURE__ */ new Set());
        indexes.add(i);
      }
    } else {
      otherwise ??= {};
      const candidateTypes = getCandidateTypes(encoded);
      for (const t of candidateTypes) (otherwise[t] ??= []).push(i);
    }
  }
  if (onlyLiterals && literalCandidates) {
    literalCandidates.forEach(Object.freeze);
    index = (input) => literalCandidates.get(input) ?? emptyCandidates;
  } else if (bySentinel?.size === 1 && !otherwise) {
    const [key, [byValue]] = bySentinel.entries().next().value;
    const candidates = byValue;
    for (const [literal, indexes] of byValue) {
      candidates.set(literal, Object.freeze(Array.from(indexes, (index2) => types[index2])));
    }
    index = (input, isConstructor) => {
      if (isObjectKeyword(input)) {
        const value = Object.hasOwn(input, key) ? input[key] : void 0;
        if (value !== void 0) return candidates.get(value) ?? emptyCandidates;
        if (isConstructor) return types;
      }
      return emptyCandidates;
    };
  } else if (bySentinel) {
    let commonSentinel;
    for (const entry of bySentinel) {
      if ((!commonSentinel || entry[1][0].size > commonSentinel[1][0].size) && entry[1][1].size === sentinelCandidateCount) {
        commonSentinel = entry;
      }
    }
    index = (input, isConstructor) => {
      const runtimeType = input === null ? "null" : Array.isArray(input) ? "array" : typeof input;
      const base = otherwise?.[runtimeType] ?? emptyCandidates;
      if (!isObjectKeyword(input)) return base.map((i) => types[i]);
      const selected = new Set(base);
      let directKey;
      if (commonSentinel) {
        const [key, [byValue]] = commonSentinel;
        const hasKey = Object.hasOwn(input, key);
        const value = hasKey ? input[key] : void 0;
        if (hasKey && (!isConstructor || value !== void 0)) {
          const match7 = byValue.get(value);
          if (!match7) return base.map((i) => types[i]);
          for (const i of match7) selected.add(i);
          directKey = key;
        }
      }
      if (directKey === void 0) {
        for (const [key, [byValue, all3]] of bySentinel) {
          const hasKey = Object.hasOwn(input, key);
          const value = hasKey ? input[key] : void 0;
          if (hasKey && (!isConstructor || value !== void 0)) {
            const match7 = byValue.get(value);
            if (match7) {
              for (const i of match7) selected.add(i);
            }
          } else if (isConstructor) {
            for (const i of all3) selected.add(i);
          }
        }
      }
      for (const [key, [byValue, all3]] of bySentinel) {
        if (key === directKey) continue;
        const hasKey = Object.hasOwn(input, key);
        const value = hasKey ? input[key] : void 0;
        if (hasKey && (!isConstructor || value !== void 0)) {
          const match7 = byValue.get(value);
          for (const i of selected) {
            if (all3.has(i) && !match7?.has(i)) selected.delete(i);
          }
        }
      }
      return Array.from(selected).sort((a, b) => a - b).map((i) => types[i]);
    };
  } else {
    index = (input) => {
      const runtimeType = input === null ? "null" : Array.isArray(input) ? "array" : typeof input;
      return (otherwise?.[runtimeType] ?? emptyCandidates).map((i) => types[i]).filter(filterLiterals(input));
    };
  }
  candidateIndexCache.set(types, index);
  return index;
}
function filterLiterals(input) {
  return (ast) => {
    const encoded = toCandidate(ast);
    return encoded._tag === "Literal" ? encoded.literal === input : encoded._tag === "UniqueSymbol" ? encoded.symbol === input : true;
  };
}
function getCandidates(input, types, isConstructor = false) {
  return getIndex(types)(input, isConstructor);
}
var Union = class _Union extends Base2 {
  _tag = "Union";
  types;
  mode;
  encodingChecks;
  constructor(types, mode, annotations, checks, encoding, context3, encodingChecks) {
    super(annotations, checks, encoding, context3);
    this.types = types;
    this.mode = mode;
    this.encodingChecks = encodingChecks;
  }
  /** @internal */
  getParser(compile, compileConstructorDefault2) {
    const ast = this;
    return (input, options) => {
      if (input === missing) {
        return missingExit;
      }
      const candidates = getCandidates(input, ast.types, compileConstructorDefault2 !== void 0);
      if (candidates.length === 1) {
        const result4 = compile(candidates[0])(input, options);
        if (result4._tag === "Success") return result4;
        return effectIsExit(result4) ? failSingleUnionCandidate(ast, result4.cause, input, options) : catchCause3(result4, (cause) => failSingleUnionCandidate(ast, cause, input, options));
      }
      const state = {
        ast,
        compile,
        input,
        out: void 0,
        successes: ast.mode === "oneOf" ? [] : void 0,
        issues: void 0,
        options
      };
      const concurrency = resolveConcurrency(options?.concurrency);
      const eff = parseUnion(state, candidates, concurrency ? {
        ...concurrency,
        orderedStep: true
      } : void 0);
      if (!eff) {
        if (state.out) return state.out;
        return fail6(new AnyOf(ast, state.issues ?? [], input, options));
      }
      return flatMapEager2(eff, (_) => {
        if (state.out === sameExit) return succeed6(input);
        if (state.out) return state.out;
        return fail6(new AnyOf(ast, state.issues ?? [], input, options));
      });
    };
  }
  _rebuild(recur, checks, encodingChecks) {
    const types = mapOrSame(this.types, recur);
    return types === this.types && checks === this.checks && encodingChecks === this.encodingChecks ? this : new _Union(types, this.mode, this.annotations, checks, void 0, this.context, encodingChecks);
  }
  /** @internal */
  recur(recur) {
    return this._rebuild(recur, this.checks, this.encodingChecks);
  }
  /** @internal */
  flip(recur) {
    return this._rebuild(recur, this.encodingChecks, this.checks);
  }
  /** @internal */
  matchPart(s2, options) {
    for (const type of this.types) {
      const out2 = type.matchPart(s2, options);
      if (out2 !== void 0) return out2;
    }
    return void 0;
  }
  /** @internal */
  getExpected(getExpected2) {
    const expected = this.annotations?.expected;
    if (typeof expected === "string") return expected;
    if (this.types.length === 0) return "never";
    const types = this.types.map((type) => {
      const encoded = toEncoded(type);
      switch (encoded._tag) {
        case "Arrays": {
          const literals = encoded.elements.filter(isLiteral);
          if (literals.length > 0) {
            return `${formatIsMutable(encoded.isMutable)}[ ${literals.map((e) => getExpected2(e) + formatIsOptional(e.context?.isOptional)).join(", ")}, ... ]`;
          }
          break;
        }
        case "Objects": {
          const literals = encoded.propertySignatures.filter((ps) => isLiteral(ps.type));
          if (literals.length > 0) {
            return `{ ${literals.map((ps) => `${formatIsMutable(ps.type.context?.isMutable)}${formatPropertyKey(ps.name)}${formatIsOptional(ps.type.context?.isOptional)}: ${getExpected2(ps.type)}`).join(", ")}, ... }`;
          }
          break;
        }
      }
      return getExpected2(encoded);
    });
    return Array.from(new Set(types)).join(" | ");
  }
};
function failSingleUnionCandidate(ast, cause, input, options) {
  const issue = getSchemaIssue(cause);
  if (!issue) return failCause2(cause);
  return fail5(new AnyOf(ast, [issue], input, options));
}
var parseUnion = /* @__PURE__ */ iterateEager()({
  onItem(s2, ast) {
    const parser = s2.compile(ast);
    return parser(s2.input, s2.options);
  },
  step(s2, candidate, exit3) {
    if (exit3._tag === "Failure") {
      const issue = getSchemaIssue(exit3.cause);
      if (issue === void 0) {
        return exit3;
      }
      if (s2.issues) s2.issues.push(issue);
      else s2.issues = [issue];
    } else {
      if (s2.out && s2.successes) {
        s2.successes.push(candidate);
        return fail5(new OneOf(s2.ast, s2.successes, s2.input, s2.options));
      }
      s2.out = exit3;
      if (s2.successes) {
        s2.successes.push(candidate);
      } else {
        return void_2;
      }
    }
  }
});
var nonFiniteLiterals = /* @__PURE__ */ new Union([/* @__PURE__ */ new Literal("Infinity"), /* @__PURE__ */ new Literal("-Infinity"), /* @__PURE__ */ new Literal("NaN")], "anyOf");
function formatIsMutable(isMutable) {
  return isMutable ? "" : "readonly ";
}
function formatIsOptional(isOptional2) {
  return isOptional2 ? "?" : "";
}
var Filter2 = class _Filter extends Class {
  _tag = "Filter";
  run;
  annotations;
  /**
   * Whether the parsing process should be aborted after this check has failed.
   */
  aborted;
  constructor(run3, annotations = void 0, aborted = false) {
    super();
    this.run = run3;
    this.annotations = annotations;
    this.aborted = aborted;
  }
  annotate(annotations) {
    return new _Filter(this.run, {
      ...this.annotations,
      ...annotations
    }, this.aborted);
  }
  abort() {
    return new _Filter(this.run, this.annotations, true);
  }
  and(other, annotations) {
    return new FilterGroup([this, other], annotations);
  }
};
var FilterGroup = class _FilterGroup extends Class {
  _tag = "FilterGroup";
  checks;
  annotations;
  constructor(checks, annotations = void 0) {
    super();
    this.checks = checks;
    this.annotations = annotations;
  }
  annotate(annotations) {
    return new _FilterGroup(this.checks, {
      ...this.annotations,
      ...annotations
    });
  }
  and(other, annotations) {
    return new _FilterGroup([this, other], annotations);
  }
};
function makeFilter(filter9, annotations, aborted = false) {
  return new Filter2((input, ast, options) => normalizeFilterOutput(ast, filter9(input, ast, options), input, options), annotations, aborted);
}
function isFinite2(annotations) {
  return makeFilter((n) => globalThis.Number.isFinite(n), {
    expected: "a finite number",
    representation: {
      id: "effect/schema/isFinite",
      payload: null
    },
    toJsonSchema: () => ({
      type: "number"
    }),
    toCode: () => ({
      runtime: "Schema.isFinite()"
    }),
    arbitrary: {
      constraint: {
        noInfinity: true,
        noNaN: true
      }
    },
    ...annotations
  });
}
var finite = /* @__PURE__ */ appendChecks(number2, [/* @__PURE__ */ isFinite2()]);
var numberToJson = /* @__PURE__ */ new Link(/* @__PURE__ */ new Union([finite, nonFiniteLiterals], "anyOf"), /* @__PURE__ */ new Transformation(/* @__PURE__ */ Number4(), /* @__PURE__ */ transform((n) => globalThis.Number.isFinite(n) ? n : globalThis.String(n))));
function isPattern(regExp, annotations) {
  const source = regExp.source;
  const pattern = new globalThis.RegExp(source, regExp.flags);
  return makeFilter((s2) => {
    pattern.lastIndex = 0;
    return pattern.test(s2);
  }, {
    expected: `a string matching the RegExp ${source}`,
    representation: {
      id: "effect/schema/isPattern",
      payload: {
        source,
        flags: regExp.flags
      }
    },
    toJsonSchema: () => ({
      pattern: source
    }),
    arbitrary: {
      constraint: {
        patterns: [regExp.source]
      }
    },
    ...annotations
  });
}
function modifyOwnPropertyDescriptors(ast, f) {
  const d = Object.getOwnPropertyDescriptors(ast);
  f(d);
  return Object.create(Object.getPrototypeOf(ast), d);
}
var contextOwners = /* @__PURE__ */ new WeakMap();
function getContextOwner(ast) {
  return contextOwners.get(ast) ?? ast;
}
function replaceEncoding(ast, encoding) {
  if (ast.encoding === encoding) {
    return ast;
  }
  return modifyOwnPropertyDescriptors(ast, (d) => {
    d.encoding.value = encoding;
  });
}
function replaceContext(ast, context3) {
  if (ast.context === context3) {
    return ast;
  }
  const owner = getContextOwner(ast);
  if (owner.context === context3) {
    return owner;
  }
  const out2 = modifyOwnPropertyDescriptors(ast, (d) => {
    d.context.value = context3;
  });
  contextOwners.set(out2, owner);
  return out2;
}
function annotate(ast, annotations) {
  if (ast.checks) {
    const last = ast.checks[ast.checks.length - 1];
    return replaceChecks(ast, append(ast.checks.slice(0, -1), last.annotate(annotations)));
  }
  return modifyOwnPropertyDescriptors(ast, (d) => {
    d.annotations.value = {
      ...d.annotations.value,
      ...annotations
    };
  });
}
function replaceChecks(ast, checks) {
  if (ast._tag === "Suspend" && checks) {
    throw new Error("Cannot add checks to Suspend");
  }
  if (ast.checks === checks) {
    return ast;
  }
  return modifyOwnPropertyDescriptors(ast, (d) => {
    d.checks.value = checks;
  });
}
function appendChecks(ast, checks) {
  return replaceChecks(ast, combineChecks(ast.checks, checks));
}
function mapLink(link4, f) {
  const to = f(link4.to);
  return to === link4.to ? link4 : new Link(to, link4.transformation);
}
function updateLastLink(encoding, f) {
  const links = encoding;
  const last = links[links.length - 1];
  const out2 = mapLink(last, f);
  return out2 === last ? encoding : append(encoding.slice(0, encoding.length - 1), out2);
}
function applyToSelfOrLastLinkEncodingIdempotent(f, options) {
  function out2(ast) {
    if (ast.encoding) {
      const last = ast.encoding[ast.encoding.length - 1];
      return options?.stopAt?.(last) ? ast : replaceEncoding(ast, updateLastLink(ast.encoding, out2));
    }
    return f(ast);
  }
  return memoizeIdempotent(out2);
}
function appendTransformation(from, transformation, to) {
  const link4 = new Link(from, transformation);
  return replaceEncoding(to, to.encoding ? [...to.encoding, link4] : [link4]);
}
function mapOrSame(as3, f) {
  let changed = false;
  const out2 = new Array(as3.length);
  for (let i = 0; i < as3.length; i++) {
    const a = as3[i];
    const fa = f(a);
    if (fa !== a) {
      changed = true;
    }
    out2[i] = fa;
  }
  return changed ? out2 : as3;
}
function annotateKey(ast, annotations) {
  const context3 = ast.context ? new Context(ast.context.isOptional, ast.context.isMutable, ast.context.constructorDefault, {
    ...ast.context.annotations,
    ...annotations
  }) : new Context(false, false, void 0, annotations);
  return replaceContext(ast, context3);
}
function withConstructorDefault(ast, defaultValue) {
  const transformation = new Transformation(withDefault(defaultValue), passthrough2());
  const constructorDefault = new Link(unknown, transformation);
  const context3 = ast.context ? new Context(ast.context.isOptional, ast.context.isMutable, constructorDefault, ast.context.annotations) : new Context(false, false, constructorDefault);
  return replaceContext(ast, context3);
}
function decodeTo(from, to, transformation) {
  return appendTransformation(from, transformation, to);
}
function isOptional(ast) {
  return ast.context?.isOptional ?? false;
}
function isStructuralCheck(check2) {
  return check2.annotations?.[STRUCTURAL_ANNOTATION_KEY] === true || check2._tag === "FilterGroup" && check2.checks.every(isStructuralCheck);
}
function extractStructuralChecks(checks) {
  function extract(check2) {
    if (isStructuralCheck(check2)) return [check2];
    return check2._tag === "FilterGroup" ? check2.checks.flatMap(extract) : [];
  }
  const out2 = checks.flatMap(extract);
  return isArrayNonEmpty2(out2) ? out2 : void 0;
}
var toType = /* @__PURE__ */ memoizeIdempotent((ast) => {
  if (ast.encoding) {
    return toType(replaceEncoding(ast, void 0));
  }
  const out2 = ast;
  const type = out2.recur?.(toType) ?? out2;
  const encodingChecks = type.encodingChecks;
  if (encodingChecks) {
    const checks = type === ast ? encodingChecks : isArrays(type) || isObjects(type) || isDeclaration(type) && type.typeParameters.length > 0 ? extractStructuralChecks(encodingChecks) : void 0;
    return modifyOwnPropertyDescriptors(type, (d) => {
      d.encodingChecks.value = void 0;
      d.checks.value = combineChecks(type.checks, checks);
    });
  }
  return type;
});
var toEncoded = /* @__PURE__ */ memoizeIdempotent((ast) => {
  return toType(flip3(ast));
});
function flipEncoding(ast, encoding) {
  const links = encoding;
  const len = links.length;
  const last = links[len - 1];
  const ls = [new Link(flip3(replaceEncoding(ast, void 0)), links[0].transformation.flip())];
  for (let i = 1; i < len; i++) {
    ls.unshift(new Link(flip3(links[i - 1].to), links[i].transformation.flip()));
  }
  const to = flip3(last.to);
  if (to.encoding) {
    return replaceEncoding(to, [...to.encoding, ...ls]);
  } else {
    return replaceEncoding(to, ls);
  }
}
var flip3 = /* @__PURE__ */ memoize((ast) => {
  if (ast.encoding) {
    return flipEncoding(ast, ast.encoding);
  }
  const out2 = ast;
  return out2.flip?.(flip3) ?? out2.recur?.(flip3) ?? out2;
});
function containsUndefined(ast) {
  switch (ast._tag) {
    case "Undefined":
      return true;
    case "Union":
      return ast.types.some(containsUndefined);
    default:
      return false;
  }
}
function fromConst(ast, value) {
  const succeed10 = succeed7(value);
  return (input, options) => {
    if (input === missing) return missingExit;
    if (input === value) return succeed10;
    return fail6(new InvalidType(ast, input, options));
  };
}
function fromRefinement(ast, refinement) {
  return (input, options) => {
    if (input === missing) return missingExit;
    if (refinement(input)) return sameExit;
    return fail6(new InvalidType(ast, input, options));
  };
}
var parameterFromPropertyKey = /* @__PURE__ */ applyToSelfOrLastLinkEncodingIdempotent((ast) => {
  switch (ast._tag) {
    default:
      return ast;
    case "Number":
      return ast.toCodecStringTree();
    case "Union":
      return ast.recur(parameterFromPropertyKey);
  }
});
var isStringFiniteRegExp = /* @__PURE__ */ new globalThis.RegExp(`^${FINITE_PATTERN}$`);
var isStringNumberRegExp = /* @__PURE__ */ new globalThis.RegExp(`^(?:${FINITE_PATTERN}|Infinity|-Infinity|NaN)$`);
function isStringFinite(annotations) {
  return isPattern(isStringFiniteRegExp, {
    expected: "a string representing a finite number",
    representation: {
      id: "effect/schema/isStringFinite",
      payload: null
    },
    toJsonSchema: () => ({
      pattern: isStringFiniteRegExp.source
    }),
    ...annotations
  });
}
var finiteString = /* @__PURE__ */ appendChecks(string2, [/* @__PURE__ */ isStringFinite()]);
var finiteToString = /* @__PURE__ */ new Link(finiteString, numberFromString);
var numberToString = /* @__PURE__ */ new Link(/* @__PURE__ */ new Union([finiteString, nonFiniteLiterals], "anyOf"), numberFromString);
var BIGINT_PATTERN = "-?\\d+";
var isStringBigIntRegExp = /* @__PURE__ */ new globalThis.RegExp(`^${BIGINT_PATTERN}$`);
var REGEXP_PATTERN = "Symbol\\((.*)\\)";
var isStringSymbolRegExp = /* @__PURE__ */ new globalThis.RegExp(`^${REGEXP_PATTERN}$`);
function collectIssues(checks, value, issues, ast, options) {
  for (let i = 0; i < checks.length; i++) {
    const check2 = checks[i];
    if (check2._tag === "FilterGroup") {
      issues = collectIssues(check2.checks, value, issues, ast, options);
      if (issues && (options.errors !== "all" || issues[issues.length - 1].filter.aborted)) {
        return issues;
      }
    } else {
      const issue = check2.run(value, ast, options);
      if (issue) {
        const filter9 = new Filter(check2, issue, value, options);
        if (issues) issues.push(filter9);
        else issues = [filter9];
        if (options.errors !== "all" || check2.aborted) {
          return issues;
        }
      }
    }
  }
  return issues;
}
function getConstructorDescriptor(ast) {
  if (!isDeclaration(ast)) return void 0;
  const getDescriptor = ast.annotations?.[CONSTRUCTOR_ANNOTATION_KEY];
  return isFunction(getDescriptor) ? getDescriptor(ast.typeParameters) : void 0;
}

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Brand.js
function nominal() {
  return Object.assign((input) => input, {
    option: (input) => some2(input),
    result: (input) => succeed2(input),
    is: (_) => true
  });
}

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/MutableHashMap.js
var TypeId15 = "~effect/collections/MutableHashMap";
var MutableHashMapProto = {
  [TypeId15]: TypeId15,
  [Symbol.iterator]() {
    return this.backing[Symbol.iterator]();
  },
  toString() {
    return `MutableHashMap(${format(Array.from(this))})`;
  },
  toJSON() {
    return {
      _id: "MutableHashMap",
      values: toJson(Array.from(this))
    };
  },
  [NodeInspectSymbol]() {
    return this.toJSON();
  },
  pipe() {
    return pipeArguments(this, arguments);
  }
};
var empty4 = () => {
  const self = Object.create(MutableHashMapProto);
  self.backing = /* @__PURE__ */ new Map();
  self.buckets = /* @__PURE__ */ new Map();
  return self;
};
var get2 = /* @__PURE__ */ dual(2, (self, key) => {
  if (self.backing.has(key)) {
    return some2(self.backing.get(key));
  } else if (isSimpleKey(key)) {
    return none2();
  }
  const refKey = referentialKeysCache.get(self);
  if (refKey !== void 0) {
    return self.backing.has(refKey) ? some2(self.backing.get(refKey)) : none2();
  }
  const hash2 = hash(key);
  const bucket = self.buckets.get(hash2);
  if (bucket === void 0) {
    return none2();
  }
  return getFromBucket(self, bucket, key);
});
var referentialKeysCache = /* @__PURE__ */ new WeakMap();
var isSimpleKey = (u) => typeof u !== "object" && typeof u !== "function";
var getFromBucket = (self, bucket, key) => {
  for (let i = 0, len = bucket.length; i < len; i++) {
    if (equals(key, bucket[i])) {
      const refKey = bucket[i];
      referentialKeysCache.set(key, refKey);
      return some2(self.backing.get(refKey));
    }
  }
  return none2();
};
var has = /* @__PURE__ */ dual(2, (self, key) => isSome2(get2(self, key)));
var set = /* @__PURE__ */ dual(3, (self, key, value) => {
  if (self.backing.has(key) || isSimpleKey(key)) {
    self.backing.set(key, value);
    return self;
  }
  let refKey = referentialKeysCache.get(self);
  if (refKey !== void 0 && self.backing.has(refKey)) {
    self.backing.set(refKey, value);
    return self;
  }
  const hash2 = hash(key);
  const bucket = self.buckets.get(hash2);
  if (bucket === void 0) {
    self.buckets.set(hash2, [key]);
    self.backing.set(key, value);
    return self;
  }
  refKey = getRefKey(bucket, key);
  if (refKey === void 0) {
    bucket.push(key);
    refKey = key;
  }
  self.backing.set(refKey, value);
  return self;
});
var getRefKey = (bucket, key) => {
  for (let i = 0, len = bucket.length; i < len; i++) {
    if (equals(key, bucket[i])) {
      referentialKeysCache.set(key, bucket[i]);
      return bucket[i];
    }
  }
};
var remove = /* @__PURE__ */ dual(2, (self, key_) => {
  if (isSimpleKey(key_)) {
    self.backing.delete(key_);
    return self;
  }
  const key = referentialKeysCache.get(self) ?? key_;
  const hash2 = hash(key);
  const bucket = self.buckets.get(hash2);
  if (bucket === void 0) {
    return self;
  }
  for (let i = 0, len = bucket.length; i < len; i++) {
    const bkey = bucket[i];
    if (bkey === key || equals(key, bkey)) {
      self.backing.delete(bkey);
      bucket.splice(i, 1);
      break;
    }
  }
  if (bucket.length === 0) {
    self.buckets.delete(hash2);
  }
  return self;
});
var clear = (self) => {
  self.backing.clear();
  self.buckets.clear();
  return self;
};
var size = (self) => self.backing.size;

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Fiber.js
var await_ = fiberAwait;
var join = fiberJoin;
var joinAll = fiberJoinAll;
var interrupt4 = fiberInterrupt;
var getCurrent = getCurrentFiber;
var runIn = fiberRunIn;

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Latch.js
var makeUnsafe4 = makeLatchUnsafe;
var make6 = makeLatch;

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/MutableRef.js
var TypeId16 = "~effect/MutableRef";
var MutableRefProto = {
  [TypeId16]: TypeId16,
  ...PipeInspectableProto,
  toJSON() {
    return {
      _id: "MutableRef",
      current: toJson(this.current)
    };
  }
};
var make7 = (value) => {
  const ref = Object.create(MutableRefProto);
  ref.current = value;
  return ref;
};
var get3 = (self) => self.current;
var set2 = /* @__PURE__ */ dual(2, (self, value) => {
  self.current = value;
  return self;
});

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/MutableList.js
var Empty = /* @__PURE__ */ Symbol.for("effect/MutableList/Empty");
var make8 = () => ({
  head: void 0,
  tail: void 0,
  length: 0
});
var emptyBucket = () => ({
  array: [],
  mutable: true,
  offset: 0,
  next: void 0
});
var append2 = (self, message) => {
  if (!self.tail) {
    self.head = self.tail = emptyBucket();
  } else if (!self.tail.mutable) {
    self.tail.next = emptyBucket();
    self.tail = self.tail.next;
  }
  self.tail.array.push(message);
  self.length++;
};
var prepend = (self, message) => {
  self.head = {
    array: [message],
    mutable: true,
    offset: 0,
    next: self.head
  };
  if (!self.tail) self.tail = self.head;
  self.length++;
};
var appendAll2 = (self, messages) => appendAllUnsafe(self, fromIterable(messages), !Array.isArray(messages));
var appendAllUnsafe = (self, messages, mutable = false) => {
  if (messages.length === 0) {
    return 0;
  }
  const chunk = {
    array: messages,
    mutable,
    offset: 0,
    next: void 0
  };
  if (self.head) {
    self.tail = self.tail.next = chunk;
  } else {
    self.head = self.tail = chunk;
  }
  self.length += messages.length;
  return messages.length;
};
var clear2 = (self) => {
  self.head = self.tail = void 0;
  self.length = 0;
};
var takeN = (self, n) => {
  if (n <= 0 || !self.head) return [];
  n = Math.min(n, self.length);
  if (n === self.length && self.head?.offset === 0 && !self.head.next) {
    const array3 = self.head.array;
    clear2(self);
    return array3;
  }
  const array2 = new Array(n);
  let index = 0;
  let chunk = self.head;
  while (chunk) {
    while (chunk.offset < chunk.array.length) {
      array2[index++] = chunk.array[chunk.offset];
      if (chunk.mutable) chunk.array[chunk.offset] = void 0;
      chunk.offset++;
      if (index === n) {
        self.head = chunk;
        self.length -= n;
        if (self.length === 0) clear2(self);
        return array2;
      }
    }
    chunk = chunk.next;
  }
  clear2(self);
  return array2;
};
var takeNVoid = (self, n) => {
  if (n <= 0 || !self.head) return;
  n = Math.min(n, self.length);
  if (n === self.length && self.head?.offset === 0 && !self.head.next) {
    clear2(self);
    return;
  }
  let count2 = 0;
  let chunk = self.head;
  while (chunk) {
    const size2 = chunk.array.length - chunk.offset;
    if (count2 + size2 > n) {
      chunk.offset += n - count2;
      self.head = chunk;
      self.length -= n;
      return;
    }
    count2 += size2;
    chunk = chunk.next;
  }
  clear2(self);
  return;
};
var takeAll = (self) => takeN(self, self.length);
var take = (self) => {
  if (!self.head) return Empty;
  const message = self.head.array[self.head.offset];
  if (self.head.mutable) self.head.array[self.head.offset] = void 0;
  self.head.offset++;
  self.length--;
  if (self.head.offset === self.head.array.length) {
    if (self.head.next) {
      self.head = self.head.next;
    } else {
      clear2(self);
    }
  }
  return message;
};
var toArrayN = (self, n) => {
  if (n <= 0) return [];
  const length = Math.min(n, self.length);
  const out2 = new Array(length);
  let index = 0;
  let bucket = self.head;
  while (bucket) {
    for (let i = bucket.offset; i < bucket.array.length; i++) {
      out2[index++] = bucket.array[i];
      if (index === length) return out2;
    }
    bucket = bucket.next;
  }
  return out2;
};
var filter6 = (self, f) => {
  const array2 = [];
  let chunk = self.head;
  while (chunk) {
    for (let i = chunk.offset; i < chunk.array.length; i++) {
      if (f(chunk.array[i], i)) {
        array2.push(chunk.array[i]);
      }
    }
    chunk = chunk.next;
  }
  if (array2.length === 0) {
    clear2(self);
    return;
  }
  self.head = self.tail = {
    array: array2,
    mutable: true,
    offset: 0,
    next: void 0
  };
  self.length = array2.length;
};
var remove2 = (self, value) => filter6(self, (v) => v !== value);

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/PubSub.js
var TypeId17 = "~effect/PubSub";
var SubscriptionTypeId = "~effect/PubSub/Subscription";
var make9 = (options) => sync3(() => makePubSubUnsafe(options.atomicPubSub(), /* @__PURE__ */ new Map(), makeUnsafe3(), makeUnsafe4(false), make7(false), options.strategy()));
var bounded = (capacity) => make9({
  atomicPubSub: () => makeAtomicBounded(capacity),
  strategy: () => new BackPressureStrategy()
});
var dropping = (capacity) => make9({
  atomicPubSub: () => makeAtomicBounded(capacity),
  strategy: () => new DroppingStrategy()
});
var sliding = (capacity) => make9({
  atomicPubSub: () => makeAtomicBounded(capacity),
  strategy: () => new SlidingStrategy()
});
var unbounded = (options) => make9({
  atomicPubSub: () => makeAtomicUnbounded(options),
  strategy: () => new DroppingStrategy()
});
var makeAtomicBounded = (capacity) => {
  const options = typeof capacity === "number" ? {
    capacity
  } : capacity;
  ensureCapacity(options.capacity);
  const replayBuffer = options.replay && options.replay > 0 ? new ReplayBuffer(Math.ceil(options.replay)) : void 0;
  if (options.capacity === 1) {
    return new BoundedPubSubSingle(replayBuffer);
  } else if (nextPow2(options.capacity) === options.capacity) {
    return new BoundedPubSubPow2(options.capacity, replayBuffer);
  } else {
    return new BoundedPubSubArb(options.capacity, replayBuffer);
  }
};
var makeAtomicUnbounded = (options) => {
  const replay = options?.replay;
  return new UnboundedPubSub(replay && replay > 0 ? new ReplayBuffer(Math.ceil(replay)) : void 0);
};
var shutdown = (self) => uninterruptible2(withFiber2((fiber3) => {
  set2(self.shutdownFlag, true);
  return close(self.scope, interrupt2(fiber3.id)).pipe(andThen2(self.strategy.shutdown), when2(self.shutdownHook.open), asVoid2);
}));
var publish = /* @__PURE__ */ dual(2, (self, value) => suspend3(() => {
  if (self.shutdownFlag.current) {
    return succeed6(false);
  }
  if (self.pubsub.publish(value)) {
    self.strategy.completeSubscribersUnsafe(self.pubsub, self.subscribers);
    return succeed6(true);
  }
  return self.strategy.handleSurplus(self.pubsub, self.subscribers, [value], self.shutdownFlag);
}));
var publishAll = /* @__PURE__ */ dual(2, (self, elements) => suspend3(() => {
  if (self.shutdownFlag.current) {
    return succeed6(false);
  }
  const surplus = self.pubsub.publishAll(elements);
  self.strategy.completeSubscribersUnsafe(self.pubsub, self.subscribers);
  if (surplus.length === 0) {
    return succeed6(true);
  }
  return self.strategy.handleSurplus(self.pubsub, self.subscribers, surplus, self.shutdownFlag);
}));
var subscribe = (self) => uninterruptible2(contextWith2((services) => {
  const localScope = get(services, Scope);
  const scope3 = forkUnsafe2(self.scope);
  const subscription = makeSubscriptionUnsafe(self.pubsub, self.subscribers, self.strategy);
  return addFinalizer2(scope3, unsubscribe(subscription)).pipe(andThen2(addFinalizerExit(localScope, (exit3) => close(scope3, exit3))), as2(subscription));
}));
var unsubscribe = (self) => uninterruptible2(withFiber2((state) => {
  set2(self.shutdownFlag, true);
  return forEach2(takeAll(self.pollers), (d) => interruptWith(d, state.id), {
    discard: true,
    concurrency: "unbounded"
  }).pipe(tap3(() => sync3(() => {
    self.subscribers.delete(self.subscription);
    self.subscription.unsubscribe();
    self.replayWindow.close();
    self.strategy.onPubSubEmptySpaceUnsafe(self.pubsub, self.subscribers);
  })), when2(self.shutdownHook.open), asVoid2);
}));
var take2 = (self) => suspend3(() => {
  if (self.shutdownFlag.current) {
    return interrupt3;
  }
  if (self.replayWindow.remaining > 0) {
    const message2 = self.replayWindow.take();
    return succeed6(message2);
  }
  const message = self.pollers.length === 0 ? self.subscription.poll() : Empty;
  if (message === Empty) {
    return pollForItem(self);
  } else {
    self.strategy.onPubSubEmptySpaceUnsafe(self.pubsub, self.subscribers);
    return succeed6(message);
  }
});
var takeAll2 = (self) => suspend3(function loop(value) {
  if (self.shutdownFlag.current) {
    return interrupt3;
  }
  let as3 = self.pollers.length === 0 ? self.subscription.pollUpTo(Number.POSITIVE_INFINITY) : [];
  if (value) {
    as3 = value.concat(as3);
  }
  self.strategy.onPubSubEmptySpaceUnsafe(self.pubsub, self.subscribers);
  if (self.replayWindow.remaining > 0) {
    return succeed6(self.replayWindow.takeAll().concat(as3));
  } else if (!isArrayNonEmpty2(as3)) {
    return flatMap4(pollForItem(self), (item) => loop([item]));
  }
  return succeed6(as3);
});
var pollForItem = (self) => {
  const deferred = makeUnsafe2();
  let set3 = self.subscribers.get(self.subscription);
  if (!set3) {
    set3 = /* @__PURE__ */ new Set();
    self.subscribers.set(self.subscription, set3);
  }
  set3.add(self.pollers);
  append2(self.pollers, deferred);
  self.strategy.completePollersUnsafe(self.pubsub, self.subscribers, self.subscription, self.pollers);
  return onInterrupt2(_await(deferred), () => {
    remove2(self.pollers, deferred);
    return void_3;
  });
};
var AbsentValue = /* @__PURE__ */ Symbol.for("effect/PubSub/AbsentValue");
var addSubscribers = (subscribers, subscription, pollers) => {
  if (!subscribers.has(subscription)) {
    subscribers.set(subscription, /* @__PURE__ */ new Set());
  }
  const set3 = subscribers.get(subscription);
  set3.add(pollers);
};
var removeSubscribers = (subscribers, subscription, pollers) => {
  if (!subscribers.has(subscription)) {
    return;
  }
  const set3 = subscribers.get(subscription);
  set3.delete(pollers);
  if (set3.size === 0) {
    subscribers.delete(subscription);
  }
};
var makeSubscriptionUnsafe = (pubsub, subscribers, strategy) => new SubscriptionImpl(pubsub, subscribers, pubsub.subscribe(), make8(), makeUnsafe4(false), make7(false), strategy, pubsub.replayWindow());
var BoundedPubSubArb = class {
  array;
  replayIndices;
  publisherIndex = 0;
  subscribers;
  subscriberCount = 0;
  subscribersIndex = 0;
  capacity;
  replayBuffer;
  constructor(capacity, replayBuffer) {
    this.capacity = capacity;
    this.replayBuffer = replayBuffer;
    this.array = Array.from({
      length: capacity
    });
    this.replayIndices = replayBuffer ? Array.from({
      length: capacity
    }) : [];
    this.subscribers = Array.from({
      length: capacity
    });
  }
  replayWindow() {
    return this.replayBuffer ? new ReplayWindowImpl(this.replayBuffer) : emptyReplayWindow;
  }
  isEmpty() {
    return this.publisherIndex === this.subscribersIndex;
  }
  isFull() {
    return this.publisherIndex === this.subscribersIndex + this.capacity;
  }
  size() {
    return this.publisherIndex - this.subscribersIndex;
  }
  publish(value) {
    if (this.isFull()) {
      return false;
    }
    const replayIndex = this.replayBuffer?.offer(value);
    if (this.subscriberCount !== 0) {
      const index = this.publisherIndex % this.capacity;
      this.array[index] = value;
      if (replayIndex !== void 0) {
        this.replayIndices[index] = replayIndex;
      }
      this.subscribers[index] = this.subscriberCount;
      this.publisherIndex += 1;
    }
    return true;
  }
  publishAll(elements) {
    if (this.subscriberCount === 0) {
      if (this.replayBuffer) {
        this.replayBuffer.offerAll(elements);
      }
      return [];
    }
    const chunk = fromIterable(elements);
    const n = chunk.length;
    const size2 = this.publisherIndex - this.subscribersIndex;
    const available = this.capacity - size2;
    const forPubSub = Math.min(n, available);
    if (forPubSub === 0) {
      return chunk;
    }
    let iteratorIndex = 0;
    const publishAllIndex = this.publisherIndex + forPubSub;
    while (this.publisherIndex !== publishAllIndex) {
      const a = chunk[iteratorIndex++];
      const index = this.publisherIndex % this.capacity;
      this.array[index] = a;
      const replayIndex = this.replayBuffer?.offer(a);
      if (replayIndex !== void 0) {
        this.replayIndices[index] = replayIndex;
      }
      this.subscribers[index] = this.subscriberCount;
      this.publisherIndex += 1;
    }
    return chunk.slice(iteratorIndex);
  }
  slide() {
    if (this.subscribersIndex !== this.publisherIndex) {
      const index = this.subscribersIndex % this.capacity;
      const value = this.array[index];
      this.array[index] = AbsentValue;
      this.subscribers[index] = 0;
      this.subscribersIndex += 1;
      this.replayBuffer?.slide(value, this.replayIndices[index]);
    }
  }
  subscribe() {
    this.subscriberCount += 1;
    return new BoundedPubSubArbSubscription(this, this.publisherIndex, false);
  }
};
var BoundedPubSubArbSubscription = class {
  self;
  subscriberIndex;
  unsubscribed;
  constructor(self, subscriberIndex, unsubscribed) {
    this.self = self;
    this.subscriberIndex = subscriberIndex;
    this.unsubscribed = unsubscribed;
  }
  isEmpty() {
    return this.unsubscribed || this.self.publisherIndex === this.subscriberIndex || this.self.publisherIndex === this.self.subscribersIndex;
  }
  size() {
    if (this.unsubscribed) {
      return 0;
    }
    return this.self.publisherIndex - Math.max(this.subscriberIndex, this.self.subscribersIndex);
  }
  poll() {
    if (this.unsubscribed) {
      return Empty;
    }
    this.subscriberIndex = Math.max(this.subscriberIndex, this.self.subscribersIndex);
    if (this.subscriberIndex !== this.self.publisherIndex) {
      const index = this.subscriberIndex % this.self.capacity;
      const elem = this.self.array[index];
      this.self.subscribers[index] -= 1;
      if (this.self.subscribers[index] === 0) {
        this.self.array[index] = AbsentValue;
        this.self.subscribersIndex += 1;
      }
      this.subscriberIndex += 1;
      return elem;
    }
    return Empty;
  }
  pollUpTo(n) {
    if (this.unsubscribed) {
      return [];
    }
    this.subscriberIndex = Math.max(this.subscriberIndex, this.self.subscribersIndex);
    const size2 = this.self.publisherIndex - this.subscriberIndex;
    const toPoll = Math.min(n, size2);
    if (toPoll <= 0) {
      return [];
    }
    const builder = [];
    const pollUpToIndex = this.subscriberIndex + toPoll;
    while (this.subscriberIndex !== pollUpToIndex) {
      const index = this.subscriberIndex % this.self.capacity;
      const a = this.self.array[index];
      this.self.subscribers[index] -= 1;
      if (this.self.subscribers[index] === 0) {
        this.self.array[index] = AbsentValue;
        this.self.subscribersIndex += 1;
      }
      builder.push(a);
      this.subscriberIndex += 1;
    }
    return builder;
  }
  unsubscribe() {
    if (!this.unsubscribed) {
      this.unsubscribed = true;
      this.self.subscriberCount -= 1;
      this.subscriberIndex = Math.max(this.subscriberIndex, this.self.subscribersIndex);
      while (this.subscriberIndex !== this.self.publisherIndex) {
        const index = this.subscriberIndex % this.self.capacity;
        this.self.subscribers[index] -= 1;
        if (this.self.subscribers[index] === 0) {
          this.self.array[index] = AbsentValue;
          this.self.subscribersIndex += 1;
        }
        this.subscriberIndex += 1;
      }
    }
  }
};
var BoundedPubSubPow2 = class {
  array;
  replayIndices;
  mask;
  publisherIndex = 0;
  subscribers;
  subscriberCount = 0;
  subscribersIndex = 0;
  capacity;
  replayBuffer;
  constructor(capacity, replayBuffer) {
    this.capacity = capacity;
    this.replayBuffer = replayBuffer;
    this.array = Array.from({
      length: capacity
    });
    this.replayIndices = replayBuffer ? Array.from({
      length: capacity
    }) : [];
    this.mask = capacity - 1;
    this.subscribers = Array.from({
      length: capacity
    });
  }
  replayWindow() {
    return this.replayBuffer ? new ReplayWindowImpl(this.replayBuffer) : emptyReplayWindow;
  }
  isEmpty() {
    return this.publisherIndex === this.subscribersIndex;
  }
  isFull() {
    return this.publisherIndex === this.subscribersIndex + this.capacity;
  }
  size() {
    return this.publisherIndex - this.subscribersIndex;
  }
  publish(value) {
    if (this.isFull()) {
      return false;
    }
    const replayIndex = this.replayBuffer?.offer(value);
    if (this.subscriberCount !== 0) {
      const index = this.publisherIndex & this.mask;
      this.array[index] = value;
      if (replayIndex !== void 0) {
        this.replayIndices[index] = replayIndex;
      }
      this.subscribers[index] = this.subscriberCount;
      this.publisherIndex += 1;
    }
    return true;
  }
  publishAll(elements) {
    if (this.subscriberCount === 0) {
      if (this.replayBuffer) {
        this.replayBuffer.offerAll(elements);
      }
      return [];
    }
    const chunk = fromIterable(elements);
    const n = chunk.length;
    const size2 = this.publisherIndex - this.subscribersIndex;
    const available = this.capacity - size2;
    const forPubSub = Math.min(n, available);
    if (forPubSub === 0) {
      return chunk;
    }
    let iteratorIndex = 0;
    const publishAllIndex = this.publisherIndex + forPubSub;
    while (this.publisherIndex !== publishAllIndex) {
      const elem = chunk[iteratorIndex++];
      const index = this.publisherIndex & this.mask;
      this.array[index] = elem;
      const replayIndex = this.replayBuffer?.offer(elem);
      if (replayIndex !== void 0) {
        this.replayIndices[index] = replayIndex;
      }
      this.subscribers[index] = this.subscriberCount;
      this.publisherIndex += 1;
    }
    return chunk.slice(iteratorIndex);
  }
  slide() {
    if (this.subscribersIndex !== this.publisherIndex) {
      const index = this.subscribersIndex & this.mask;
      const value = this.array[index];
      this.array[index] = AbsentValue;
      this.subscribers[index] = 0;
      this.subscribersIndex += 1;
      this.replayBuffer?.slide(value, this.replayIndices[index]);
    }
  }
  subscribe() {
    this.subscriberCount += 1;
    return new BoundedPubSubPow2Subscription(this, this.publisherIndex, false);
  }
};
var BoundedPubSubPow2Subscription = class {
  self;
  subscriberIndex;
  unsubscribed;
  constructor(self, subscriberIndex, unsubscribed) {
    this.self = self;
    this.subscriberIndex = subscriberIndex;
    this.unsubscribed = unsubscribed;
  }
  isEmpty() {
    return this.unsubscribed || this.self.publisherIndex === this.subscriberIndex || this.self.publisherIndex === this.self.subscribersIndex;
  }
  size() {
    if (this.unsubscribed) {
      return 0;
    }
    return this.self.publisherIndex - Math.max(this.subscriberIndex, this.self.subscribersIndex);
  }
  poll() {
    if (this.unsubscribed) {
      return Empty;
    }
    this.subscriberIndex = Math.max(this.subscriberIndex, this.self.subscribersIndex);
    if (this.subscriberIndex !== this.self.publisherIndex) {
      const index = this.subscriberIndex & this.self.mask;
      const elem = this.self.array[index];
      this.self.subscribers[index] -= 1;
      if (this.self.subscribers[index] === 0) {
        this.self.array[index] = AbsentValue;
        this.self.subscribersIndex += 1;
      }
      this.subscriberIndex += 1;
      return elem;
    }
    return Empty;
  }
  pollUpTo(n) {
    if (this.unsubscribed) {
      return [];
    }
    this.subscriberIndex = Math.max(this.subscriberIndex, this.self.subscribersIndex);
    const size2 = this.self.publisherIndex - this.subscriberIndex;
    const toPoll = Math.min(n, size2);
    if (toPoll <= 0) {
      return [];
    }
    const builder = [];
    const pollUpToIndex = this.subscriberIndex + toPoll;
    while (this.subscriberIndex !== pollUpToIndex) {
      const index = this.subscriberIndex & this.self.mask;
      const elem = this.self.array[index];
      this.self.subscribers[index] -= 1;
      if (this.self.subscribers[index] === 0) {
        this.self.array[index] = AbsentValue;
        this.self.subscribersIndex += 1;
      }
      builder.push(elem);
      this.subscriberIndex += 1;
    }
    return builder;
  }
  unsubscribe() {
    if (!this.unsubscribed) {
      this.unsubscribed = true;
      this.self.subscriberCount -= 1;
      this.subscriberIndex = Math.max(this.subscriberIndex, this.self.subscribersIndex);
      while (this.subscriberIndex !== this.self.publisherIndex) {
        const index = this.subscriberIndex & this.self.mask;
        this.self.subscribers[index] -= 1;
        if (this.self.subscribers[index] === 0) {
          this.self.array[index] = AbsentValue;
          this.self.subscribersIndex += 1;
        }
        this.subscriberIndex += 1;
      }
    }
  }
};
var BoundedPubSubSingle = class {
  publisherIndex = 0;
  subscriberCount = 0;
  subscribers = 0;
  value = AbsentValue;
  replayIndex = 0;
  capacity = 1;
  replayBuffer;
  constructor(replayBuffer) {
    this.replayBuffer = replayBuffer;
  }
  replayWindow() {
    return this.replayBuffer ? new ReplayWindowImpl(this.replayBuffer) : emptyReplayWindow;
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
  isEmpty() {
    return this.subscribers === 0;
  }
  isFull() {
    return !this.isEmpty();
  }
  size() {
    return this.isEmpty() ? 0 : 1;
  }
  publish(value) {
    if (this.isFull()) {
      return false;
    }
    const replayIndex = this.replayBuffer?.offer(value);
    if (this.subscriberCount !== 0) {
      this.value = value;
      if (replayIndex !== void 0) {
        this.replayIndex = replayIndex;
      }
      this.subscribers = this.subscriberCount;
      this.publisherIndex += 1;
    }
    return true;
  }
  publishAll(elements) {
    if (this.subscriberCount === 0) {
      if (this.replayBuffer) {
        this.replayBuffer.offerAll(elements);
      }
      return [];
    }
    const chunk = fromIterable(elements);
    if (chunk.length === 0) {
      return chunk;
    }
    if (this.publish(chunk[0])) {
      return chunk.slice(1);
    } else {
      return chunk;
    }
  }
  slide() {
    if (this.isFull()) {
      const value = this.value;
      this.subscribers = 0;
      this.value = AbsentValue;
      this.replayBuffer?.slide(value, this.replayIndex);
    }
  }
  subscribe() {
    this.subscriberCount += 1;
    return new BoundedPubSubSingleSubscription(this, this.publisherIndex, false);
  }
};
var BoundedPubSubSingleSubscription = class {
  self;
  subscriberIndex;
  unsubscribed;
  constructor(self, subscriberIndex, unsubscribed) {
    this.self = self;
    this.subscriberIndex = subscriberIndex;
    this.unsubscribed = unsubscribed;
  }
  isEmpty() {
    return this.unsubscribed || this.self.subscribers === 0 || this.subscriberIndex === this.self.publisherIndex;
  }
  size() {
    return this.isEmpty() ? 0 : 1;
  }
  poll() {
    if (this.isEmpty()) {
      return Empty;
    }
    const elem = this.self.value;
    this.self.subscribers -= 1;
    if (this.self.subscribers === 0) {
      this.self.value = AbsentValue;
    }
    this.subscriberIndex += 1;
    return elem;
  }
  pollUpTo(n) {
    if (this.isEmpty() || n < 1) {
      return [];
    }
    const a = this.self.value;
    this.self.subscribers -= 1;
    if (this.self.subscribers === 0) {
      this.self.value = AbsentValue;
    }
    this.subscriberIndex += 1;
    return [a];
  }
  unsubscribe() {
    if (!this.unsubscribed) {
      this.unsubscribed = true;
      this.self.subscriberCount -= 1;
      if (this.subscriberIndex !== this.self.publisherIndex) {
        this.self.subscribers -= 1;
        if (this.self.subscribers === 0) {
          this.self.value = AbsentValue;
        }
      }
    }
  }
};
var UnboundedPubSub = class {
  publisherHead = {
    value: AbsentValue,
    replayIndex: void 0,
    subscribers: 0,
    next: null
  };
  publisherTail = this.publisherHead;
  publisherIndex = 0;
  subscribersIndex = 0;
  capacity = Number.MAX_SAFE_INTEGER;
  replayBuffer;
  constructor(replayBuffer) {
    this.replayBuffer = replayBuffer;
  }
  replayWindow() {
    return this.replayBuffer ? new ReplayWindowImpl(this.replayBuffer) : emptyReplayWindow;
  }
  isEmpty() {
    return this.publisherHead === this.publisherTail;
  }
  isFull() {
    return false;
  }
  size() {
    return this.publisherIndex - this.subscribersIndex;
  }
  publish(value) {
    const replayIndex = this.replayBuffer?.offer(value);
    const subscribers = this.publisherTail.subscribers;
    if (subscribers !== 0) {
      const node = {
        value,
        replayIndex,
        subscribers,
        next: null
      };
      this.publisherTail.next = node;
      this.publisherTail = this.publisherTail.next;
      this.publisherIndex += 1;
    }
    return true;
  }
  publishAll(elements) {
    if (this.publisherTail.subscribers !== 0) {
      for (const a of elements) {
        this.publish(a);
      }
    } else if (this.replayBuffer) {
      this.replayBuffer.offerAll(elements);
    }
    return [];
  }
  slide() {
    if (this.publisherHead !== this.publisherTail) {
      const node = this.publisherHead.next;
      const value = node.value;
      this.publisherHead = this.publisherHead.next;
      this.publisherHead.value = AbsentValue;
      this.subscribersIndex += 1;
      this.replayBuffer?.slide(value, node.replayIndex);
    }
  }
  subscribe() {
    this.publisherTail.subscribers += 1;
    return new UnboundedPubSubSubscription(this, this.publisherTail, this.publisherIndex, false);
  }
};
var UnboundedPubSubSubscription = class {
  self;
  subscriberHead;
  subscriberIndex;
  unsubscribed;
  constructor(self, subscriberHead, subscriberIndex, unsubscribed) {
    this.self = self;
    this.subscriberHead = subscriberHead;
    this.subscriberIndex = subscriberIndex;
    this.unsubscribed = unsubscribed;
  }
  isEmpty() {
    if (this.unsubscribed) {
      return true;
    }
    let empty7 = true;
    let loop = true;
    while (loop) {
      if (this.subscriberHead === this.self.publisherTail) {
        loop = false;
      } else {
        if (this.subscriberHead.next.value !== AbsentValue) {
          empty7 = false;
          loop = false;
        } else {
          this.subscriberHead = this.subscriberHead.next;
          this.subscriberIndex += 1;
        }
      }
    }
    return empty7;
  }
  size() {
    if (this.unsubscribed) {
      return 0;
    }
    return this.self.publisherIndex - Math.max(this.subscriberIndex, this.self.subscribersIndex);
  }
  poll() {
    if (this.unsubscribed) {
      return Empty;
    }
    let loop = true;
    let polled = Empty;
    while (loop) {
      if (this.subscriberHead === this.self.publisherTail) {
        loop = false;
      } else {
        const elem = this.subscriberHead.next.value;
        if (elem !== AbsentValue) {
          polled = elem;
          this.subscriberHead.subscribers -= 1;
          if (this.subscriberHead.subscribers === 0) {
            this.self.publisherHead = this.self.publisherHead.next;
            this.self.publisherHead.value = AbsentValue;
            this.self.subscribersIndex += 1;
          }
          loop = false;
        }
        this.subscriberHead = this.subscriberHead.next;
        this.subscriberIndex += 1;
      }
    }
    return polled;
  }
  pollUpTo(n) {
    const builder = [];
    let i = 0;
    while (i !== n) {
      const a = this.poll();
      if (a === Empty) {
        i = n;
      } else {
        builder.push(a);
        i += 1;
      }
    }
    return builder;
  }
  unsubscribe() {
    if (!this.unsubscribed) {
      this.unsubscribed = true;
      this.self.publisherTail.subscribers -= 1;
      while (this.subscriberHead !== this.self.publisherTail) {
        if (this.subscriberHead.next.value !== AbsentValue) {
          this.subscriberHead.subscribers -= 1;
          if (this.subscriberHead.subscribers === 0) {
            this.self.publisherHead = this.self.publisherHead.next;
            this.self.publisherHead.value = AbsentValue;
            this.self.subscribersIndex += 1;
          }
        }
        this.subscriberHead = this.subscriberHead.next;
      }
    }
  }
};
var SubscriptionImpl = class {
  [SubscriptionTypeId] = {
    _A: identity
  };
  pubsub;
  subscribers;
  subscription;
  pollers;
  shutdownHook;
  shutdownFlag;
  strategy;
  replayWindow;
  constructor(pubsub, subscribers, subscription, pollers, shutdownHook, shutdownFlag, strategy, replayWindow) {
    this.pubsub = pubsub;
    this.subscribers = subscribers;
    this.subscription = subscription;
    this.pollers = pollers;
    this.shutdownHook = shutdownHook;
    this.shutdownFlag = shutdownFlag;
    this.strategy = strategy;
    this.replayWindow = replayWindow;
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
};
var PubSubImpl = class {
  [TypeId17] = {
    _A: identity
  };
  pubsub;
  subscribers;
  scope;
  shutdownHook;
  shutdownFlag;
  strategy;
  constructor(pubsub, subscribers, scope3, shutdownHook, shutdownFlag, strategy) {
    this.pubsub = pubsub;
    this.subscribers = subscribers;
    this.scope = scope3;
    this.shutdownHook = shutdownHook;
    this.shutdownFlag = shutdownFlag;
    this.strategy = strategy;
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
};
var makePubSubUnsafe = (pubsub, subscribers, scope3, shutdownHook, shutdownFlag, strategy) => new PubSubImpl(pubsub, subscribers, scope3, shutdownHook, shutdownFlag, strategy);
var ensureCapacity = (capacity) => {
  if (capacity <= 0) {
    throw new Error(`Cannot construct PubSub with capacity of ${capacity}`);
  }
};
var BackPressureStrategy = class {
  publishers = /* @__PURE__ */ make8();
  get shutdown() {
    return withFiber2((fiber3) => forEach2(takeAll(this.publishers), ([_, deferred, last]) => last ? interruptWith(deferred, fiber3.id) : void_3, {
      concurrency: "unbounded",
      discard: true
    }));
  }
  handleSurplus(pubsub, subscribers, elements, isShutdown) {
    return suspend3(() => {
      const deferred = makeUnsafe2();
      this.offerUnsafe(elements, deferred);
      this.onPubSubEmptySpaceUnsafe(pubsub, subscribers);
      this.completeSubscribersUnsafe(pubsub, subscribers);
      return (get3(isShutdown) ? interrupt3 : _await(deferred)).pipe(onInterrupt2(() => {
        this.removeUnsafe(deferred);
        return void_3;
      }));
    });
  }
  onPubSubEmptySpaceUnsafe(pubsub, subscribers) {
    let keepPolling = true;
    while (keepPolling && !pubsub.isFull()) {
      const publisher = take(this.publishers);
      if (publisher === Empty) {
        keepPolling = false;
      } else {
        const [value, deferred] = publisher;
        const published = pubsub.publish(value);
        if (published && publisher[2]) {
          doneUnsafe(deferred, succeed4(true));
        } else if (!published) {
          prepend(this.publishers, publisher);
        }
        this.completeSubscribersUnsafe(pubsub, subscribers);
      }
    }
  }
  completePollersUnsafe(pubsub, subscribers, subscription, pollers) {
    return strategyCompletePollersUnsafe(this, pubsub, subscribers, subscription, pollers);
  }
  completeSubscribersUnsafe(pubsub, subscribers) {
    return strategyCompleteSubscribersUnsafe(this, pubsub, subscribers);
  }
  offerUnsafe(elements, deferred) {
    const iterator = elements[Symbol.iterator]();
    let next = iterator.next();
    if (!next.done) {
      while (1) {
        const value = next.value;
        next = iterator.next();
        if (next.done) {
          append2(this.publishers, [value, deferred, true]);
          break;
        }
        append2(this.publishers, [value, deferred, false]);
      }
    }
  }
  removeUnsafe(deferred) {
    filter6(this.publishers, ([_, d]) => d !== deferred);
  }
};
var DroppingStrategy = class {
  get shutdown() {
    return void_3;
  }
  handleSurplus(_pubsub, _subscribers, _elements, _isShutdown) {
    return succeed6(false);
  }
  onPubSubEmptySpaceUnsafe(_pubsub, _subscribers) {
  }
  completePollersUnsafe(pubsub, subscribers, subscription, pollers) {
    return strategyCompletePollersUnsafe(this, pubsub, subscribers, subscription, pollers);
  }
  completeSubscribersUnsafe(pubsub, subscribers) {
    return strategyCompleteSubscribersUnsafe(this, pubsub, subscribers);
  }
};
var SlidingStrategy = class {
  get shutdown() {
    return void_3;
  }
  handleSurplus(pubsub, subscribers, elements, _isShutdown) {
    return sync3(() => {
      this.slidingPublishUnsafe(pubsub, elements);
      this.completeSubscribersUnsafe(pubsub, subscribers);
      return true;
    });
  }
  onPubSubEmptySpaceUnsafe(_pubsub, _subscribers) {
  }
  completePollersUnsafe(pubsub, subscribers, subscription, pollers) {
    return strategyCompletePollersUnsafe(this, pubsub, subscribers, subscription, pollers);
  }
  completeSubscribersUnsafe(pubsub, subscribers) {
    return strategyCompleteSubscribersUnsafe(this, pubsub, subscribers);
  }
  slidingPublishUnsafe(pubsub, elements) {
    const it = elements[Symbol.iterator]();
    let next = it.next();
    if (!next.done && pubsub.capacity > 0) {
      let a = next.value;
      let loop = true;
      while (loop) {
        pubsub.slide();
        const pub = pubsub.publish(a);
        if (pub && (next = it.next()) && !next.done) {
          a = next.value;
        } else if (pub) {
          loop = false;
        }
      }
    }
  }
};
var strategyCompletePollersUnsafe = (strategy, pubsub, subscribers, subscription, pollers) => {
  let keepPolling = true;
  while (keepPolling && !subscription.isEmpty()) {
    const poller = take(pollers);
    if (poller === Empty) {
      removeSubscribers(subscribers, subscription, pollers);
      if (pollers.length === 0) {
        keepPolling = false;
      } else {
        addSubscribers(subscribers, subscription, pollers);
      }
    } else {
      const pollResult = subscription.poll();
      if (pollResult === Empty) {
        prepend(pollers, poller);
      } else {
        doneUnsafe(poller, succeed4(pollResult));
        strategy.onPubSubEmptySpaceUnsafe(pubsub, subscribers);
      }
    }
  }
};
var strategyCompleteSubscribersUnsafe = (strategy, pubsub, subscribers) => {
  for (const [subscription, pollersSet] of subscribers) {
    for (const pollers of pollersSet) {
      strategy.completePollersUnsafe(pubsub, subscribers, subscription, pollers);
    }
  }
};
var ReplayBuffer = class {
  capacity;
  head = {
    value: AbsentValue,
    index: 0,
    next: null
  };
  tail = this.head;
  slideValues = [];
  size = 0;
  index = 0;
  publisherIndex = 0;
  constructor(capacity) {
    this.capacity = capacity;
  }
  slide(value, publisherIndex) {
    this.slideValues[this.index % this.capacity] = {
      value,
      index: publisherIndex
    };
    this.index++;
  }
  offer(a) {
    const index = this.publisherIndex++;
    this.tail.value = a;
    this.tail.index = index;
    this.tail.next = {
      value: AbsentValue,
      index: 0,
      next: null
    };
    this.tail = this.tail.next;
    if (this.size === this.capacity) {
      this.head = this.head.next;
    } else {
      this.size += 1;
    }
    return index;
  }
  offerAll(as3) {
    for (const a of as3) {
      this.offer(a);
    }
  }
};
var ReplayWindowImpl = class {
  buffer;
  values;
  index = 0;
  remaining;
  slideIndex;
  newestIndex = -1;
  constructor(buffer3) {
    this.buffer = buffer3;
    this.remaining = buffer3.size;
    this.slideIndex = buffer3.index;
    this.values = new Array(this.remaining);
    let node = buffer3.head;
    for (let i = 0; i < this.remaining; i++) {
      this.values[i] = node.value;
      this.newestIndex = node.index;
      node = node.next;
    }
  }
  close() {
    this.values.length = 0;
    this.remaining = 0;
  }
  sync() {
    const slides = this.buffer.index - this.slideIndex;
    if (slides === 0 || this.remaining === 0) {
      return;
    }
    const count2 = Math.min(slides, this.buffer.capacity);
    const start = this.buffer.index - count2;
    for (let i = 0; i < count2; i++) {
      const entry = this.buffer.slideValues[(start + i) % this.buffer.capacity];
      if (entry.index > this.newestIndex) {
        this.index = (this.index + 1) % this.values.length;
        this.values[(this.index + this.remaining - 1) % this.values.length] = entry.value;
        this.newestIndex = entry.index;
      }
    }
    this.slideIndex = this.buffer.index;
  }
  take() {
    if (this.remaining === 0) {
      return void 0;
    }
    this.sync();
    const value = this.values[this.index];
    this.values[this.index] = AbsentValue;
    this.index = (this.index + 1) % this.values.length;
    this.remaining--;
    if (this.remaining === 0) {
      this.close();
    }
    return value;
  }
  takeN(n) {
    const len = Math.min(n, this.remaining);
    const items = new Array(len);
    for (let i = 0; i < len; i++) {
      items[i] = this.take();
    }
    return items;
  }
  takeAll() {
    return this.takeN(this.remaining);
  }
};
var emptyReplayWindow = {
  remaining: 0,
  take: () => void 0,
  takeN: () => [],
  takeAll: () => [],
  close: () => void 0
};

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Queue.js
var TypeId18 = "~effect/Queue";
var EnqueueTypeId = "~effect/Queue/Enqueue";
var DequeueTypeId = "~effect/Queue/Dequeue";
var variance = {
  _A: identity,
  _E: identity
};
var QueueProto = {
  [TypeId18]: variance,
  [EnqueueTypeId]: variance,
  [DequeueTypeId]: variance,
  ...PipeInspectableProto,
  toJSON() {
    return {
      _id: "effect/Queue",
      state: this.state._tag,
      size: sizeUnsafe(this)
    };
  }
};
var make10 = (options) => withFiber((fiber3) => {
  const self = Object.create(QueueProto);
  self.dispatcher = fiber3.currentDispatcher;
  self.capacity = options?.capacity ?? Number.POSITIVE_INFINITY;
  self.strategy = options?.strategy ?? "suspend";
  self.messages = make8();
  self.scheduleRunning = false;
  self.state = {
    _tag: "Open",
    takers: /* @__PURE__ */ new Set(),
    offers: /* @__PURE__ */ new Set(),
    awaiters: /* @__PURE__ */ new Set()
  };
  return succeed3(self);
});
var bounded2 = (capacity) => make10({
  capacity
});
var unbounded2 = () => make10();
var offer = (self, message) => suspend(() => {
  if (self.state._tag !== "Open") {
    return exitFalse;
  } else if (self.messages.length >= self.capacity) {
    switch (self.strategy) {
      case "dropping":
        return exitFalse;
      case "suspend":
        if (self.capacity <= 0 && self.state.takers.size > 0) {
          append2(self.messages, message);
          releaseTakers(self);
          return exitTrue;
        }
        return offerRemainingSingle(self, message);
      case "sliding":
        take(self.messages);
        append2(self.messages, message);
        return exitTrue;
    }
  }
  append2(self.messages, message);
  scheduleReleaseTaker(self);
  return exitTrue;
});
var offerUnsafe = (self, message) => {
  if (self.state._tag !== "Open") {
    return false;
  } else if (self.messages.length >= self.capacity) {
    if (self.strategy === "sliding") {
      take(self.messages);
      append2(self.messages, message);
      return true;
    } else if (self.capacity <= 0 && self.state.takers.size > 0) {
      append2(self.messages, message);
      releaseTakers(self);
      return true;
    }
    return false;
  }
  append2(self.messages, message);
  scheduleReleaseTaker(self);
  return true;
};
var offerAll = (self, messages) => suspend(() => {
  if (self.state._tag !== "Open") {
    return succeed3(fromIterable(messages));
  }
  const remaining = offerAllUnsafe(self, messages);
  if (remaining.length === 0) {
    return exitSucceed([]);
  } else if (self.strategy === "dropping") {
    return succeed3(remaining);
  }
  return offerRemainingArray(self, remaining);
});
var offerAllUnsafe = (self, messages) => {
  if (self.state._tag !== "Open") {
    return fromIterable(messages);
  } else if (self.capacity === Number.POSITIVE_INFINITY || self.strategy === "sliding") {
    appendAll2(self.messages, messages);
    if (self.strategy === "sliding") {
      takeN(self.messages, self.messages.length - self.capacity);
    }
    scheduleReleaseTaker(self);
    return [];
  }
  const free = self.capacity <= 0 ? self.state.takers.size : self.capacity - self.messages.length;
  if (free === 0) {
    return fromIterable(messages);
  }
  const remaining = [];
  let i = 0;
  for (const message of messages) {
    if (i < free) {
      append2(self.messages, message);
    } else {
      remaining.push(message);
    }
    i++;
  }
  scheduleReleaseTaker(self);
  return remaining;
};
var failCause5 = /* @__PURE__ */ dual(2, (self, cause) => sync(() => failCauseUnsafe(self, cause)));
var failCauseUnsafe = (self, cause) => {
  if (self.state._tag !== "Open") {
    return false;
  }
  const exit3 = exitFailCause(cause);
  const fail11 = exitZipRight(exit3, exitFailDone);
  if (self.state.offers.size === 0 && self.messages.length === 0) {
    finalize(self, fail11);
    return true;
  }
  self.state = {
    ...self.state,
    _tag: "Closing",
    exit: fail11
  };
  return true;
};
var end = (self) => failCause5(self, causeFail(Done()));
var endUnsafe = (self) => failCauseUnsafe(self, causeFail(Done()));
var shutdown2 = (self) => sync(() => {
  if (self.state._tag === "Done") {
    return true;
  }
  clear2(self.messages);
  const offers = self.state.offers;
  finalize(self, self.state._tag === "Open" ? exitInterrupt2 : self.state.exit);
  if (offers.size > 0) {
    for (const entry of offers) {
      if (entry._tag === "Single") {
        entry.resume(exitFalse);
      } else {
        entry.resume(exitSucceed(entry.remaining.slice(entry.offset)));
      }
    }
    offers.clear();
  }
  return true;
});
var takeAll3 = (self) => takeBetween(self, 1, Number.POSITIVE_INFINITY);
var takeBetween = (self, min2, max2) => suspend(() => takeBetweenUnsafe(self, min2, max2) ?? andThen(awaitTake(self), takeBetween(self, 1, max2)));
var take3 = (self) => suspend(() => takeUnsafe(self) ?? andThen(awaitTake(self), take3(self)));
var poll = (self) => suspend(() => {
  const result4 = takeUnsafe(self);
  if (result4 === void 0) {
    return succeed3(none2());
  }
  if (result4._tag === "Success") {
    return succeed3(some2(result4.value));
  }
  return succeed3(none2());
});
var takeUnsafe = (self) => {
  if (self.state._tag === "Done") {
    return self.state.exit;
  }
  if (self.messages.length > 0) {
    const message = take(self.messages);
    releaseCapacity(self);
    return exitSucceed(message);
  } else if (self.capacity <= 0 && self.state.offers.size > 0) {
    self.capacity = 1;
    releaseCapacity(self);
    self.capacity = 0;
    const message = take(self.messages);
    releaseCapacity(self);
    return exitSucceed(message);
  }
  return void 0;
};
var sizeUnsafe = (self) => self.state._tag === "Done" ? 0 : self.messages.length;
var exitFalse = /* @__PURE__ */ exitSucceed(false);
var exitTrue = /* @__PURE__ */ exitSucceed(true);
var exitFailDone = /* @__PURE__ */ exitFail(/* @__PURE__ */ Done());
var exitInterrupt2 = /* @__PURE__ */ exitInterrupt();
var releaseTakers = (self) => {
  self.scheduleRunning = false;
  if (self.state._tag === "Done" || self.state.takers.size === 0) {
    return;
  }
  for (const taker of self.state.takers) {
    self.state.takers.delete(taker);
    taker(exitVoid);
    if (self.messages.length === 0) {
      break;
    }
  }
};
var scheduleReleaseTaker = (self) => {
  if (self.scheduleRunning || self.state._tag === "Done" || self.state.takers.size === 0) {
    return;
  }
  self.scheduleRunning = true;
  self.dispatcher.scheduleTask(() => releaseTakers(self), 0);
};
var takeBetweenUnsafe = (self, min2, max2) => {
  if (self.state._tag === "Done") {
    return self.state.exit;
  } else if (max2 <= 0 || min2 <= 0) {
    return exitSucceed([]);
  } else if (self.capacity <= 0 && self.state.offers.size > 0) {
    self.capacity = 1;
    releaseCapacity(self);
    self.capacity = 0;
    const messages = [take(self.messages)];
    releaseCapacity(self);
    return exitSucceed(messages);
  }
  min2 = Math.min(min2, self.capacity || 1);
  if (min2 <= self.messages.length) {
    const messages = takeN(self.messages, max2);
    releaseCapacity(self);
    return exitSucceed(messages);
  }
};
var offerRemainingSingle = (self, message) => {
  return callback((resume) => {
    if (self.state._tag !== "Open") {
      return resume(exitFalse);
    }
    const entry = {
      _tag: "Single",
      message,
      resume
    };
    self.state.offers.add(entry);
    return sync(() => {
      if (self.state._tag === "Open") {
        self.state.offers.delete(entry);
      }
    });
  });
};
var offerRemainingArray = (self, remaining) => {
  return callback((resume) => {
    if (self.state._tag !== "Open") {
      return resume(exitSucceed(remaining));
    }
    const entry = {
      _tag: "Array",
      remaining,
      offset: 0,
      resume
    };
    self.state.offers.add(entry);
    return sync(() => {
      if (self.state._tag === "Open") {
        self.state.offers.delete(entry);
      }
    });
  });
};
var releaseCapacity = (self) => {
  if (self.state._tag === "Done") {
    return isDoneCause(self.state.exit.cause);
  } else if (self.state.offers.size === 0) {
    if (self.state._tag === "Closing" && self.messages.length === 0) {
      finalize(self, self.state.exit);
      return isDoneCause(self.state.exit.cause);
    }
    return false;
  }
  let n = self.capacity - self.messages.length;
  for (const entry of self.state.offers) {
    if (n === 0) break;
    else if (entry._tag === "Single") {
      append2(self.messages, entry.message);
      n--;
      entry.resume(exitTrue);
      self.state.offers.delete(entry);
    } else {
      for (; entry.offset < entry.remaining.length; entry.offset++) {
        if (n === 0) return false;
        append2(self.messages, entry.remaining[entry.offset]);
        n--;
      }
      entry.resume(exitSucceed([]));
      self.state.offers.delete(entry);
    }
  }
  return false;
};
var awaitTake = (self) => callback((resume) => {
  if (self.state._tag === "Done") {
    return resume(self.state.exit);
  }
  self.state.takers.add(resume);
  return sync(() => {
    if (self.state._tag !== "Done") {
      self.state.takers.delete(resume);
    }
  });
});
var finalize = (self, exit3) => {
  if (self.state._tag === "Done") {
    return;
  }
  const openState = self.state;
  self.state = {
    _tag: "Done",
    exit: exit3
  };
  for (const taker of openState.takers) {
    taker(exit3);
  }
  openState.takers.clear();
  for (const awaiter of openState.awaiters) {
    awaiter(exit3);
  }
  openState.awaiters.clear();
};

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Semaphore.js
var makeUnsafe5 = (permits) => new SemaphoreImpl(permits);
var waitForPermits = (self, n, effect2) => callback((resume) => {
  if (self.free >= n) return resume(effect2);
  const observer = () => {
    if (self.free < n) return;
    self.waiters.delete(observer);
    resume(effect2);
  };
  self.waiters.add(observer);
  return sync(() => {
    self.waiters.delete(observer);
  });
});
var SemaphoreImpl = class {
  waiters = /* @__PURE__ */ new Set();
  taken = 0;
  permits;
  constructor(permits) {
    this.permits = permits;
  }
  get free() {
    return this.permits - this.taken;
  }
  take(n) {
    const take6 = suspend(() => {
      if (this.free < n) {
        return waitForPermits(this, n, take6);
      }
      this.taken += n;
      return succeed3(n);
    });
    return take6;
  }
  takeIfAvailable(n) {
    return suspend(() => {
      if (this.free < n) return succeed3(false);
      this.taken += n;
      return succeed3(true);
    });
  }
  releaseUnsafe(fiber3, n) {
    this.taken -= n;
    if (this.waiters.size > 0) {
      fiber3.currentDispatcher.scheduleTask(() => {
        for (const observer of this.waiters) {
          if (this.free <= 0) break;
          observer();
        }
      }, 0);
    }
    return this.free;
  }
  resize(permits) {
    return withFiber((fiber3) => {
      this.permits = permits;
      if (this.free < 0) return void_;
      this.releaseUnsafe(fiber3, 0);
      return void_;
    });
  }
  release(n) {
    return withFiber((fiber3) => succeed3(this.releaseUnsafe(fiber3, n)));
  }
  get releaseAll() {
    return withFiber((fiber3) => succeed3(this.releaseUnsafe(fiber3, this.taken)));
  }
  withPermits(n) {
    return (self) => uninterruptibleMask((restore) => {
      const acquire2 = suspend(() => {
        if (this.free < n) {
          const wait = waitForPermits(this, n, void_);
          return flatMap2(restore(wait), () => acquire2);
        }
        this.taken += n;
        return onExitPrimitive(restore(self), () => {
          this.releaseUnsafe(getCurrentFiber(), n);
          return void 0;
        }, true);
      });
      return acquire2;
    });
  }
  withPermit = /* @__PURE__ */ this.withPermits(1);
  withPermitsIfAvailable(n) {
    return (self) => uninterruptibleMask((restore) => {
      if (this.free < n) return succeedNone;
      this.taken += n;
      return onExitPrimitive(restore(asSome(self)), () => {
        this.releaseUnsafe(getCurrentFiber(), n);
        return void 0;
      }, true);
    });
  }
};

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Take.js
var toPull = (take6) => isExit2(take6) ? isSuccess4(take6) ? done2(take6.value) : take6 : succeed6(take6);

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Channel.js
var TypeId19 = "~effect/Channel";
var isChannel = (u) => hasProperty(u, TypeId19);
var ChannelProto = {
  [TypeId19]: {
    _Env: identity,
    _InErr: identity,
    _InElem: identity,
    _OutErr: identity,
    _OutElem: identity
  },
  pipe() {
    return pipeArguments(this, arguments);
  }
};
var fromTransform = (transform3) => {
  const self = Object.create(ChannelProto);
  self.transform = (upstream, scope3) => catchCause3(transform3(upstream, scope3), (cause) => succeed6(failCause4(cause)));
  return self;
};
var transformPull = (self, f) => fromTransform((upstream, scope3) => flatMap4(toTransform(self)(upstream, scope3), (pull) => f(pull, scope3)));
var fromPull = (effect2) => fromTransform((_, __) => effect2);
var fromTransformBracket = (f) => fromTransform(fnUntraced2(function* (upstream, scope3) {
  const closableScope = forkUnsafe2(scope3);
  const onCause = (cause) => close(closableScope, doneExitFromCause(cause));
  const pull = yield* onError2(f(upstream, scope3, closableScope), onCause);
  return onError2(pull, onCause);
}));
var toTransform = (channel) => channel.transform;
var DefaultChunkSize = 4096;
var asyncQueue = (scope3, f, options) => make10({
  capacity: options?.bufferSize,
  strategy: options?.strategy
}).pipe(tap3((queue) => addFinalizer2(scope3, shutdown2(queue))), tap3((queue) => forkIn2(provide(f(queue), scope3), scope3)));
var callbackArray = (f, options) => fromTransform((_, scope3) => map6(asyncQueue(scope3, f, options), takeAll3));
var suspend4 = (evaluate2) => fromTransform((upstream, scope3) => suspend3(() => toTransform(evaluate2())(upstream, scope3)));
var acquireUseRelease3 = (acquire2, use, release2) => fromTransformBracket(fnUntraced2(function* (upstream, scope3, forkedScope) {
  let option3 = none2();
  yield* addFinalizerExit(forkedScope, (exit3) => isSome2(option3) ? release2(option3.value, exit3) : void_3);
  const value = yield* uninterruptible2(acquire2);
  option3 = some2(value);
  return yield* toTransform(use(value))(upstream, scope3);
}));
var fromArray = (array2) => fromPull(sync3(() => {
  let index = 0;
  return suspend3(() => index >= array2.length ? done2() : succeed6(array2[index++]));
}));
var fromIteratorArray = (iterator, chunkSize = DefaultChunkSize) => fromPull(sync3(() => {
  const iter = iterator();
  let done4 = none2();
  return suspend3(() => {
    if (done4._tag === "Some") return done2(done4.value);
    const buffer3 = [];
    while (buffer3.length < chunkSize) {
      const state = iter.next();
      if (state.done) {
        if (buffer3.length === 0) {
          return done2(state.value);
        }
        done4 = some2(state.value);
        break;
      }
      buffer3.push(state.value);
    }
    return succeed6(buffer3);
  });
}));
var fromIterableArray = (iterable, chunkSize = DefaultChunkSize) => fromIteratorArray(() => iterable[Symbol.iterator](), chunkSize);
var succeed8 = (value) => fromEffect(succeed6(value));
var end2 = (value) => fromPull(succeed6(done2(value)));
var sync4 = (evaluate2) => fromEffect(sync3(evaluate2));
var empty5 = /* @__PURE__ */ fromPull(/* @__PURE__ */ succeed6(/* @__PURE__ */ done2()));
var never3 = /* @__PURE__ */ fromPull(/* @__PURE__ */ succeed6(never2));
var fail7 = (error) => fromPull(succeed6(fail6(error)));
var failSync3 = (evaluate2) => fromPull(failSync2(evaluate2));
var failCause6 = (cause) => fromPull(failCause4(cause));
var failCauseSync3 = (evaluate2) => fromPull(failCauseSync2(evaluate2));
var die5 = (defect) => failCause6(die2(defect));
var fromEffect = (effect2) => fromPull(sync3(() => {
  let done4 = false;
  return suspend3(() => {
    if (done4) return done2();
    done4 = true;
    return effect2;
  });
}));
var fromEffectDrain = (effect2) => fromPull(flatMap4(effect2, () => done2()));
var fromEffectTake = (effect2) => fromPull(succeed6(flatMap4(effect2, toPull)));
var fromQueueArray = (queue) => fromPull(succeed6(takeAll3(queue)));
var fromSubscriptionArray = (subscription) => fromPull(succeed6(onInterrupt2(takeAll2(subscription), () => done2())));
var fromPubSubArray = (pubsub) => unwrap2(map6(subscribe(pubsub), fromSubscriptionArray));
var fromPubSubTake = (pubsub) => unwrap2(map6(subscribe(pubsub), (sub) => fromEffectTake(take2(sub))));
var fromReadableStream = (options) => fromTransform((_, scope3) => readableStreamToPullUnsafe({
  scope: scope3,
  readable: options.evaluate(),
  onError: options.onError,
  releaseLockOnEnd: options.releaseLockOnEnd
}));
var readableStreamToPullUnsafe = (options) => {
  const reader = options.readable.getReader();
  const exit3 = options.exit ?? make7(void 0);
  const pull = suspend3(() => {
    if (exit3.current) return exit3.current;
    return matchCauseEffect2(tryPromise2({
      try: () => reader.read(),
      catch: options.onError
    }), {
      onFailure: (cause) => exit3.current ?? failCause4(cause),
      onSuccess: ({
        done: done4,
        value
      }) => {
        if (exit3.current) return exit3.current;
        return done4 ? done2() : succeed6(of(value));
      }
    });
  });
  return as2(addFinalizer2(options.scope, options.releaseLockOnEnd ? sync3(() => reader.releaseLock()) : promise2(() => reader.cancel().catch(constVoid))), pull);
};
var fromAsyncIterable = (iterable, onError5) => fromTransform(fnUntraced2(function* (_, scope3) {
  const iter = iterable[Symbol.asyncIterator]();
  if (iter.return) {
    yield* addFinalizer2(scope3, promise2(() => iter.return()));
  }
  return flatMap4(tryPromise2({
    try: () => iter.next(),
    catch: onError5
  }), (result4) => result4.done ? done2(result4.value) : succeed6(result4.value));
}));
var fromAsyncIterableArray = (iterable, onError5) => map7(fromAsyncIterable(iterable, onError5), of);
var map7 = /* @__PURE__ */ dual(2, (self, f) => transformPull(self, (pull) => sync3(() => {
  let i = 0;
  return map6(pull, (o) => f(o, i++));
})));
var mapDone = /* @__PURE__ */ dual(2, (self, f) => mapDoneEffect(self, (o) => succeed6(f(o))));
var mapDoneEffect = /* @__PURE__ */ dual(2, (self, f) => transformPull(self, (pull) => succeed6(catchDone(pull, (done4) => flatMap4(f(done4), done2)))));
var concurrencyIsSequential = (concurrency) => concurrency === void 0 || concurrency !== "unbounded" && concurrency <= 1;
var mapEffect = /* @__PURE__ */ dual((args2) => isChannel(args2[0]), (self, f, options) => concurrencyIsSequential(options?.concurrency) ? mapEffectSequential(self, f) : mapEffectConcurrent(self, f, options));
var mapEffectSequential = (self, f) => fromTransform((upstream, scope3) => {
  let i = 0;
  return map6(toTransform(self)(upstream, scope3), flatMap4((o) => f(o, i++)));
});
var mapEffectConcurrent = (self, f, options) => fromTransformBracket(fnUntraced2(function* (upstream, scope3, forkedScope) {
  let i = 0;
  const pull = yield* toTransform(self)(upstream, scope3);
  const concurrencyN = options.concurrency === "unbounded" ? Number.MAX_SAFE_INTEGER : options.concurrency;
  const queue = yield* bounded2(0);
  yield* addFinalizer2(forkedScope, shutdown2(queue));
  const runFork3 = runForkWith2(yield* context2());
  const trackFiber = runIn(forkedScope);
  if (options.unordered) {
    const semaphore = makeUnsafe5(concurrencyN);
    const release2 = constant(semaphore.release(1));
    const handle = matchCauseEffect2({
      onFailure: (cause) => flatMap4(failCause5(queue, cause), release2),
      onSuccess: (value) => flatMap4(offer(queue, value), release2)
    });
    yield* semaphore.take(1).pipe(flatMap4(() => pull), flatMap4((value) => {
      trackFiber(runFork3(handle(f(value, i++))));
      return void_3;
    }), forever4({
      disableYield: true
    }), catchCause3((cause) => semaphore.withPermits(concurrencyN - 1)(failCause5(queue, cause))), forkIn2(forkedScope));
  } else {
    const effects = yield* bounded2(concurrencyN - 2);
    yield* addFinalizer2(forkedScope, shutdown2(effects));
    yield* take3(effects).pipe(flatten4, flatMap4((value) => offer(queue, value)), forever4({
      disableYield: true
    }), catchCause3((cause) => failCause5(queue, cause)), forkIn2(forkedScope));
    let errorCause;
    const onExit5 = (exit3) => {
      if (exit3._tag === "Success") return;
      errorCause = exit3.cause;
      failCauseUnsafe(queue, exit3.cause);
    };
    yield* pull.pipe(flatMap4((value) => {
      if (errorCause) return failCause4(errorCause);
      const fiber3 = runFork3(f(value, i++));
      trackFiber(fiber3);
      fiber3.addObserver(onExit5);
      return offer(effects, join(fiber3));
    }), forever4({
      disableYield: true
    }), catchCause3((cause) => offer(effects, failCause2(cause)).pipe(andThen2(failCause5(effects, cause)))), forkIn2(forkedScope));
  }
  return take3(queue);
}));
var flatMap5 = /* @__PURE__ */ dual((args2) => isChannel(args2[0]), (self, f, options) => concurrencyIsSequential(options?.concurrency) ? flatMapSequential(self, f) : flatMapConcurrent(self, f, options));
var flatMapSequential = (self, f) => fromTransform((upstream, scope3) => map6(toTransform(self)(upstream, scope3), (pull) => {
  let childPull;
  let childScope;
  const makePull = flatMap4(pull, (value) => {
    childScope ??= forkUnsafe2(scope3);
    return flatMapEager2(toTransform(f(value))(upstream, childScope), (pull2) => {
      childPull = catchHalt(pull2);
      return childPull;
    });
  });
  const catchHalt = catchDone((_) => {
    childPull = void 0;
    if (childScope.state._tag === "Open" && scopeFinalizerCountUnsafe(childScope) === 1) {
      return makePull;
    }
    const close3 = close(childScope, void_2);
    childScope = void 0;
    return flatMap4(close3, () => makePull);
  });
  return suspend3(() => childPull ?? makePull);
}));
var flatMapConcurrent = (self, f, options) => self.pipe(map7(f), mergeAll3(options));
var concatWith = /* @__PURE__ */ dual(2, (self, f) => fromTransform((upstream, scope3) => sync3(() => {
  let currentPull;
  const forkedScope = forkUnsafe2(scope3);
  const makePull = flatMap4(toTransform(self)(upstream, forkedScope), (pull) => {
    currentPull = catchDone(pull, (leftover) => {
      return close(forkedScope, void_2).pipe(flatMap4(() => toTransform(f(leftover))(upstream, scope3)), flatMap4((pull2) => {
        currentPull = pull2;
        return pull2;
      }));
    });
    return currentPull;
  });
  return suspend3(() => currentPull ?? makePull);
})));
var combine2 = /* @__PURE__ */ dual(4, (self, that, s2, f) => fromTransform(fnUntraced2(function* (upstream, scope3) {
  const leftPull = yield* toTransform(self)(upstream, scope3);
  const rightPull = yield* toTransform(that)(upstream, scope3);
  let state = s2();
  return suspend3(() => {
    const combinedPull = f(state, leftPull, rightPull);
    return map6(combinedPull, ([a, s1]) => {
      state = s1;
      return a;
    });
  });
})));
var orElseIfEmpty = /* @__PURE__ */ dual(2, (self, f) => fromTransform((upstream, scope3) => sync3(() => {
  let currentPull;
  const forkedScope = forkUnsafe2(scope3);
  const makePull = flatMap4(toTransform(self)(upstream, forkedScope), (pull) => {
    const next = pull.pipe(tap3(() => {
      currentPull = pull;
      return void_3;
    }), catchDone((leftover) => close(forkedScope, succeed4(leftover)).pipe(andThen2(toTransform(f(leftover))(upstream, scope3)), flatMap4((pull2) => {
      currentPull = pull2;
      return pull2;
    }))));
    currentPull = next;
    return next;
  });
  return suspend3(() => currentPull ?? makePull);
})));
var flattenArray = (self) => transformPull(self, (pull) => {
  let array2;
  let index = 0;
  const pump = suspend3(function loop() {
    if (array2 === void 0) {
      return flatMap4(pull, (array_) => {
        switch (array_.length) {
          case 0:
            return loop();
          case 1:
            return succeed6(array_[0]);
          default: {
            array2 = array_;
            return succeed6(array_[index++]);
          }
        }
      });
    }
    const next = array2[index++];
    if (index >= array2.length) {
      array2 = void 0;
      index = 0;
    }
    return succeed6(next);
  });
  return succeed6(pump);
});
var flattenTake = (self) => mapEffectSequential(self, toPull);
var drain = (self) => transformPull(self, (pull) => succeed6(forever4(pull, {
  disableYield: true
})));
var repeat4 = /* @__PURE__ */ dual(2, (self, schedule4) => toStepWithMetadata(typeof schedule4 === "function" ? schedule4(identity) : schedule4).pipe(map6((step) => {
  let meta = CurrentMetadata2.defaultValue();
  const loop = concatWith(provideServiceEffect3(self, CurrentMetadata2, sync3(() => meta)), (done4) => step(done4).pipe(map6((meta_) => {
    meta = meta_;
    return loop;
  }), catchDone(() => succeed6(end2(done4))), unwrap2));
  return loop;
}), unwrap2));
var forever5 = (self) => concatWith(self, () => forever5(self));
var schedule2 = /* @__PURE__ */ dual(2, (self, schedule4) => transformPull(self, (pull, _scope) => map6(toStepWithSleep(schedule4), (step) => {
  const pullWithStep = tap3(pull, step);
  return pullWithStep;
})));
var filter7 = /* @__PURE__ */ dual(2, (self, predicate) => fromTransform((upstream, scope3) => map6(toTransform(self)(upstream, scope3), (pull) => flatMap4(pull, function loop(elem) {
  return predicate(elem) ? succeed6(elem) : flatMap4(pull, loop);
}))));
var filterArray = /* @__PURE__ */ dual(2, (self, predicate) => transformPull(self, (pull) => succeed6(flatMap4(pull, function loop(arr) {
  const passes = [];
  for (let i = 0; i < arr.length; i++) {
    if (predicate(arr[i])) {
      passes.push(arr[i]);
    }
  }
  return isReadonlyArrayNonEmpty(passes) ? succeed6(passes) : flatMap4(pull, loop);
}))));
var filterMapArray = /* @__PURE__ */ dual(2, (self, filter9) => transformPull(self, (pull) => succeed6(flatMap4(pull, function loop(arr) {
  const passes = [];
  for (let i = 0; i < arr.length; i++) {
    const result4 = filter9(arr[i]);
    if (isSuccess2(result4)) {
      passes.push(result4.success);
    }
  }
  return isReadonlyArrayNonEmpty(passes) ? succeed6(passes) : flatMap4(pull, loop);
}))));
var filterArrayEffect = /* @__PURE__ */ dual(2, (self, predicate) => transformPull(self, (pull) => {
  const f = flatMap4(pull, (arr) => filter5(arr, predicate));
  return succeed6(flatMap4(f, function loop(arr) {
    return isReadonlyArrayNonEmpty(arr) ? succeed6(arr) : flatMap4(f, loop);
  }));
}));
var filterMapArrayEffect = /* @__PURE__ */ dual(2, (self, filter9) => transformPull(self, (pull) => succeed6(flatMap4(pull, function loop(arr) {
  return flatMap4(filterMapEffect2(arr, filter9), (passes) => isReadonlyArrayNonEmpty(passes) ? succeed6(passes) : flatMap4(pull, loop));
}))));
var mapAccum = /* @__PURE__ */ dual((args2) => isChannel(args2[0]), (self, initial, f, options) => fromTransform((upstream, scope3) => map6(toTransform(self)(upstream, scope3), (pull) => {
  let state = initial();
  let current;
  let index = 0;
  let cause;
  const pullNext = matchCauseEffect2(pull, {
    onFailure(cause_) {
      cause = cause_;
      const b = options?.onHalt && options.onHalt(state);
      return b && b.length > 0 ? succeed6([state, b]) : failCause4(cause_);
    },
    onSuccess(a) {
      const b = f(state, a);
      return isArray(b) ? succeed6(b) : b;
    }
  });
  const pump = suspend3(function loop() {
    if (current === void 0) {
      if (cause) return failCause4(cause);
      return flatMap4(pullNext, ([newState, values]) => {
        state = newState;
        if (values.length === 0) {
          return loop();
        } else if (values.length === 1) {
          return succeed6(values[0]);
        }
        current = values;
        return loop();
      });
    }
    const next = current[index++];
    if (index >= current.length) {
      current = void 0;
      index = 0;
    }
    return succeed6(next);
  });
  return pump;
})));
var scanEffect = /* @__PURE__ */ dual(3, (self, initial, f) => fromTransform((upstream, scope3) => map6(toTransform(self)(upstream, scope3), (pull) => {
  let state = initial;
  let isFirst = true;
  return suspend3(() => {
    if (isFirst) {
      isFirst = false;
      return succeed6(state);
    }
    return map6(flatMap4(pull, (a) => f(state, a)), (newState) => {
      state = newState;
      return state;
    });
  });
})));
var catchCause4 = /* @__PURE__ */ dual(2, (self, f) => fromTransform((upstream, scope3) => {
  let forkedScope = forkUnsafe2(scope3);
  return map6(toTransform(self)(upstream, forkedScope), (pull) => {
    let currentPull = pull.pipe(catchCause3((cause) => {
      if (isDoneCause(cause)) {
        return failCause4(cause);
      }
      const toClose = forkedScope;
      forkedScope = forkUnsafe2(scope3);
      return close(toClose, failCause2(cause)).pipe(andThen2(toTransform(f(cause))(upstream, forkedScope)), flatMap4((childPull) => {
        currentPull = childPull;
        return childPull;
      }));
    }));
    return suspend3(() => currentPull);
  });
}));
var tapCause4 = /* @__PURE__ */ dual(2, (self, f) => catchCause4(self, (cause) => fromEffectDrain(flatMap4(f(cause), (_) => failCause4(cause)))));
var catchCauseIf3 = /* @__PURE__ */ dual(3, (self, predicate, f) => catchCause4(self, (cause) => {
  return predicate(cause) ? f(cause) : failCause6(cause);
}));
var catchCauseFilter3 = /* @__PURE__ */ dual(3, (self, filter9, f) => catchCause4(self, (cause) => {
  const result4 = filter9(cause);
  return isFailure2(result4) ? failCause6(result4.failure) : f(result4.success, cause);
}));
var catch_4 = /* @__PURE__ */ dual(2, (self, f) => catchCauseFilter3(self, findError2, (e) => f(e)));
var tapError4 = /* @__PURE__ */ dual(2, (self, f) => transformPull(self, (pull) => succeed6(tapError3(pull, (err) => isDone2(err) ? void_3 : asVoid2(f(err))))));
var catchIf3 = /* @__PURE__ */ dual((args2) => isChannel(args2[0]), (self, predicate, f, orElse) => catch_4(self, (err) => {
  return predicate(err) ? f(err) : orElse ? orElse(err) : fail7(err);
}));
var catchFilter3 = /* @__PURE__ */ dual((args2) => isChannel(args2[0]), (self, filter9, f, orElse) => catch_4(self, (err) => {
  const result4 = filter9(err);
  return isFailure2(result4) ? orElse ? orElse(result4.failure) : fail7(result4.failure) : f(result4.success);
}));
var catchReason3 = /* @__PURE__ */ dual((args2) => isChannel(args2[0]), (self, errorTag, reasonTag, f, orElse) => catch_4(self, (error) => {
  if (isTagged(error, errorTag) && hasProperty(error, "reason")) {
    const reason = error.reason;
    if (isTagged(reason, reasonTag)) {
      return f(reason, error);
    }
    return orElse ? orElse(reason, error) : fail7(error);
  }
  return fail7(error);
}));
var catchReasons3 = /* @__PURE__ */ dual((args2) => isChannel(args2[0]), (self, errorTag, cases, orElse) => {
  let keys2;
  return catch_4(self, (error) => {
    if (isTagged(error, errorTag) && hasProperty(error, "reason") && hasProperty(error.reason, "_tag") && isString2(error.reason._tag)) {
      const reason = error.reason;
      keys2 ??= new Set(Object.keys(cases));
      if (keys2.has(reason._tag)) {
        return cases[reason._tag](reason, error);
      }
      return orElse ? orElse(reason, error) : fail7(error);
    }
    return fail7(error);
  });
});
var mapError4 = /* @__PURE__ */ dual(2, (self, f) => catch_4(self, (err) => fail7(f(err))));
var orDie4 = (self) => catch_4(self, die5);
var ignore3 = /* @__PURE__ */ dual((args2) => isChannel(args2[0]), (self, options) => {
  if (!options?.log) {
    return catch_4(self, () => empty5);
  }
  const logEffect = logWithLevel2(options.log === true ? void 0 : options.log);
  return catch_4(tapCause4(self, (cause) => hasFails2(cause) ? logEffect(cause) : void_3), () => empty5);
});
var ignoreCause_ = (self) => catchCause4(self, () => empty5);
var ignoreCause3 = /* @__PURE__ */ dual((args2) => isChannel(args2[0]), (self, options) => {
  if (!options?.log) return ignoreCause_(self);
  const logEffect = logWithLevel2(options.log === true ? void 0 : options.log);
  return ignoreCause_(tapCause4(self, (cause) => logEffect(cause)));
});
var retry3 = /* @__PURE__ */ dual(2, (self, schedule4) => suspend4(() => {
  let step = void 0;
  let meta = CurrentMetadata2.defaultValue();
  const selfWithMeta = provideServiceEffect3(self, CurrentMetadata2, sync3(() => meta));
  const withReset = onFirst(selfWithMeta, () => {
    step = void 0;
    return void_3;
  });
  const resolvedSchedule = typeof schedule4 === "function" ? schedule4(identity) : schedule4;
  const loop = catch_4(withReset, fnUntraced2(function* (error) {
    if (!step) {
      step = yield* toStepWithMetadata(resolvedSchedule);
    }
    meta = yield* step(error);
    return loop;
  }, (effect2, error) => catchDone(effect2, () => succeed6(fail7(error))), unwrap2));
  return loop;
}));
var switchMap = /* @__PURE__ */ dual((args2) => isChannel(args2[0]), (self, f, options) => self.pipe(map7(f), mergeAll3({
  ...options,
  concurrency: options?.concurrency ?? 1,
  switch: true
})));
var mergeAll3 = /* @__PURE__ */ dual(2, (channels, {
  bufferSize = 16,
  concurrency,
  switch: switch_ = false
}) => fromTransformBracket(fnUntraced2(function* (upstream, scope3, forkedScope) {
  const concurrencyN = concurrency === "unbounded" ? Number.MAX_SAFE_INTEGER : Math.max(1, concurrency);
  const semaphore = switch_ ? void 0 : makeUnsafe5(concurrencyN);
  const doneLatch = yield* make6(true);
  const fibers = /* @__PURE__ */ new Set();
  const queue = yield* bounded2(bufferSize);
  yield* addFinalizer2(forkedScope, shutdown2(queue));
  const pull = yield* toTransform(channels)(upstream, scope3);
  yield* gen2(function* () {
    while (true) {
      let pullFiber;
      if (semaphore) {
        if (fibers.size < concurrencyN) {
          yield* semaphore.take(1);
        } else {
          pullFiber = yield* forkChild2(pull);
          yield* raceFirst2(semaphore.take(1), andThen2(join(pullFiber), never2));
        }
      }
      const channel = pullFiber === void 0 ? yield* pull : yield* join(pullFiber);
      const childScope = forkUnsafe2(forkedScope);
      const childPull = yield* toTransform(channel)(upstream, childScope);
      while (fibers.size >= concurrencyN) {
        const fiber4 = headUnsafe(fibers);
        fibers.delete(fiber4);
        if (fibers.size === 0) yield* doneLatch.open;
        yield* interrupt4(fiber4);
      }
      const fiber3 = yield* childPull.pipe(tap3(() => yieldNow2), flatMap4((value) => offer(queue, value)), forever4({
        disableYield: true
      }), onError2(fnUntraced2(function* (cause) {
        const halt = filterDone(cause);
        yield* exit2(close(childScope, !isFailure2(halt) ? succeed4(halt.success.value) : failCause2(halt.failure)));
        if (!fibers.has(fiber3)) return;
        fibers.delete(fiber3);
        if (semaphore) yield* semaphore.release(1);
        if (fibers.size === 0) yield* doneLatch.open;
        if (isSuccess2(halt)) return;
        return yield* failCause5(queue, cause);
      })), forkChild2);
      doneLatch.closeUnsafe();
      fibers.add(fiber3);
    }
  }).pipe(catchCause3((cause) => {
    const halt = filterDone(cause);
    if (isSuccess2(halt)) {
      return doneLatch.whenOpen(failCause5(queue, cause));
    }
    return failCause5(queue, cause);
  }), forkIn2(forkedScope));
  return take3(queue);
})));
var merge3 = /* @__PURE__ */ dual((args2) => isChannel(args2[0]) && isChannel(args2[1]), (left, right, options) => fromTransformBracket(fnUntraced2(function* (upstream, _scope, forkedScope) {
  const strategy = options?.haltStrategy ?? "both";
  const queue = yield* bounded2(0);
  yield* addFinalizer2(forkedScope, shutdown2(queue));
  let done4 = 0;
  function onExit5(side, cause) {
    done4++;
    if (!isDoneCause(cause)) {
      return failCause5(queue, cause);
    }
    switch (strategy) {
      case "both": {
        return done4 === 2 ? failCause5(queue, cause) : void_3;
      }
      case "left":
      case "right": {
        return side === strategy ? failCause5(queue, cause) : void_3;
      }
      case "either": {
        return failCause5(queue, cause);
      }
    }
  }
  const runSide = (side, channel, scope3) => toTransform(channel)(upstream, scope3).pipe(flatMap4((pull) => pull.pipe(flatMap4((value) => offer(queue, value)), forever4)), onError2((cause) => andThen2(close(scope3, doneExitFromCause(cause)), onExit5(side, cause))), forkIn2(forkedScope));
  yield* runSide("left", left, forkUnsafe2(forkedScope));
  yield* runSide("right", right, forkUnsafe2(forkedScope));
  return take3(queue);
})));
var mergeEffect = /* @__PURE__ */ dual(2, (self, effect2) => merge3(self, fromEffectDrain(effect2), {
  haltStrategy: "left"
}));
var splitLines = () => fromTransform((upstream, _scope) => sync3(() => {
  let stringBuilder = "";
  let midCRLF = false;
  let done4 = none2();
  function splitLinesArray(chunk) {
    const chunkBuilder = [];
    function pushLine(segment) {
      if (stringBuilder.length === 0) {
        chunkBuilder.push(segment);
      } else {
        chunkBuilder.push(stringBuilder + segment);
        stringBuilder = "";
      }
    }
    for (let i = 0; i < chunk.length; i++) {
      const str = chunk[i];
      if (str.length !== 0) {
        let from = 0;
        let indexOfCR = str.indexOf("\r");
        let indexOfLF = str.indexOf("\n");
        if (midCRLF) {
          if (indexOfLF === 0) {
            pushLine("");
            from = 1;
            indexOfLF = str.indexOf("\n", from);
          } else {
            pushLine("");
          }
          midCRLF = false;
        }
        while (indexOfCR !== -1 || indexOfLF !== -1) {
          if (indexOfCR === -1 || indexOfLF !== -1 && indexOfLF < indexOfCR) {
            pushLine(str.substring(from, indexOfLF));
            from = indexOfLF + 1;
            indexOfLF = str.indexOf("\n", from);
          } else {
            if (str.length === indexOfCR + 1) {
              midCRLF = true;
              indexOfCR = -1;
            } else {
              pushLine(str.substring(from, indexOfCR));
              from = indexOfCR + (indexOfLF === indexOfCR + 1 ? 2 : 1);
              indexOfCR = str.indexOf("\r", from);
              indexOfLF = str.indexOf("\n", from);
            }
          }
        }
        stringBuilder = stringBuilder + str.substring(from, str.length - (midCRLF ? 1 : 0));
      }
    }
    return isReadonlyArrayNonEmpty(chunkBuilder) ? chunkBuilder : null;
  }
  const pullOrFlush = suspend3(() => {
    if (done4._tag === "Some") {
      return done2(done4.value);
    }
    return matchEffect2(upstream, {
      onSuccess: loop,
      onFailure: failCause4,
      onDone: (leftover) => {
        done4 = some2(leftover);
        if (stringBuilder.length > 0 || midCRLF) {
          const last = stringBuilder;
          stringBuilder = "";
          midCRLF = false;
          return succeed6([last]);
        }
        return done2(leftover);
      }
    });
  });
  function loop(chunk) {
    const lines = splitLinesArray(chunk);
    return lines !== null ? succeed6(lines) : pullOrFlush;
  }
  return pullOrFlush;
}));
var pipeTo = /* @__PURE__ */ dual(2, (self, that) => fromTransform((upstream, scope3) => flatMap4(toTransform(self)(upstream, scope3), (upstream2) => toTransform(that)(upstream2, scope3))));
var pipeToOrFail = /* @__PURE__ */ dual(2, (self, that) => fromTransform((upstream, scope3) => flatMap4(toTransform(self)(upstream, scope3), (upstream2) => {
  const upstreamPull = catchCause3(upstream2, (cause) => isDoneCause(cause) ? failCause4(cause) : die4(Done2(cause)));
  return map6(toTransform(that)(upstreamPull, scope3), (pull) => catchDefect2(pull, (defect) => isDone2(defect) ? failCause4(defect.value) : die4(defect)));
})));
var unwrap2 = (channel) => fromTransform((upstream, scope3) => {
  let pull;
  return succeed6(suspend3(() => {
    if (pull) return pull;
    return channel.pipe(provide(scope3), flatMap4((channel2) => toTransform(channel2)(upstream, scope3)), flatMap4((pull_) => pull = pull_));
  }));
});
var scoped3 = (self) => fromTransformBracket((upstream, scope3, forkedScope) => map6(provide(toTransform(self)(upstream, scope3), forkedScope), provide(forkedScope)));
var buffer = /* @__PURE__ */ dual(2, (self, options) => fromTransform(fnUntraced2(function* (upstream, scope3) {
  const pull = yield* toTransform(self)(upstream, scope3);
  const queue = yield* make10({
    capacity: options.capacity === "unbounded" ? void 0 : options.capacity,
    strategy: options.capacity === "unbounded" ? void 0 : options.strategy
  });
  yield* addFinalizer2(scope3, shutdown2(queue));
  yield* pull.pipe(flatMap4((value) => offer(queue, value)), forever4({
    disableYield: true
  }), onError2((cause) => failCause5(queue, cause)), forkIn2(scope3));
  return take3(queue);
})));
var bufferArray = /* @__PURE__ */ dual(2, (self, options) => fromTransform(fnUntraced2(function* (upstream, scope3) {
  const pull = yield* toTransform(self)(upstream, scope3);
  const queue = yield* make10({
    capacity: options.capacity === "unbounded" ? void 0 : options.capacity,
    strategy: options.capacity === "unbounded" ? void 0 : options.strategy
  });
  yield* addFinalizer2(scope3, shutdown2(queue));
  yield* pull.pipe(flatMap4((value) => offerAll(queue, value)), forever4({
    disableYield: true
  }), onError2((cause) => failCause5(queue, cause)), forkIn2(scope3));
  return takeAll3(queue);
})));
var interruptWhen = /* @__PURE__ */ dual(2, (self, effect2) => merge3(self, fromPull(succeed6(flatMap4(effect2, done2))), {
  haltStrategy: "either"
}));
var haltWhen = /* @__PURE__ */ dual(2, (self, effect2) => fromTransformBracket(fnUntraced2(function* (upstream, scope3, forkedScope) {
  const pull = yield* toTransform(self)(upstream, scope3);
  const fiber3 = yield* forkIn2(effect2, forkedScope, {
    startImmediately: true
  });
  return suspend3(() => {
    const exit3 = fiber3.pollUnsafe();
    return exit3 === void 0 ? pull : match5(exit3, {
      onFailure: failCause4,
      onSuccess: done2
    });
  });
})));
var onError3 = /* @__PURE__ */ dual(2, (self, finalizer) => onExit3(self, (exit3) => isFailure4(exit3) ? finalizer(exit3.cause) : void_3));
var onExit3 = /* @__PURE__ */ dual(2, (self, finalizer) => fromTransformBracket((upstream, scope3, forkedScope) => addFinalizerExit(forkedScope, finalizer).pipe(andThen2(toTransform(self)(upstream, scope3)))));
var onStart = /* @__PURE__ */ dual(2, (self, onStart3) => unwrap2(as2(onStart3, self)));
var onFirst = /* @__PURE__ */ dual(2, (self, onFirst3) => transformPull(self, (pull) => sync3(() => {
  let isFirst = true;
  const pullFirst = tap3(pull, (element) => {
    isFirst = false;
    return onFirst3(element);
  });
  return suspend3(() => isFirst ? pullFirst : pull);
})));
var onEnd = /* @__PURE__ */ dual(2, (self, onEnd3) => transformPull(self, (pull) => succeed6(catchDone(pull, (leftover) => flatMap4(onEnd3, () => done2(leftover))))));
var ensuring3 = /* @__PURE__ */ dual(2, (self, finalizer) => onExit3(self, (_) => finalizer));
var runWith = (self, f, onHalt) => suspend3(() => {
  const scope3 = makeUnsafe3();
  const makePull = toTransform(self)(done2(), scope3);
  return catchDone(flatMap4(makePull, f), onHalt ? onHalt : succeed6).pipe(onExit2((exit3) => close(scope3, exit3)));
});
var provideContext3 = /* @__PURE__ */ dual(2, (self, context3) => fromTransform((upstream, scope3) => map6(provideContext2(toTransform(self)(upstream, scope3), context3), provideContext2(context3))));
var provideService3 = /* @__PURE__ */ dual(3, (self, key, service4) => fromTransform((upstream, scope3) => map6(provideService2(toTransform(self)(upstream, scope3), key, service4), provideService2(key, service4))));
var provideServiceEffect3 = /* @__PURE__ */ dual(3, (self, key, service4) => fromTransform((upstream, scope3) => flatMap4(service4, (s2) => toTransform(provideService3(self, key, s2))(upstream, scope3))));
var provide5 = /* @__PURE__ */ dual((args2) => isChannel(args2[0]), (self, layer14, options) => isContext(layer14) ? provideContext3(self, layer14) : fromTransform((upstream, scope3) => flatMap4(options?.local ? buildWithMemoMap(layer14, makeMemoMapUnsafe(), scope3) : buildWithScope(layer14, scope3), (context3) => map6(provideContext2(toTransform(self)(upstream, scope3), context3), provideContext2(context3)))));
var updateContext3 = /* @__PURE__ */ dual(2, (self, f) => fromTransform((upstream, scope3) => contextWith2((context3) => {
  const toProvide = f(context3);
  return toTransform(provideContext3(self, toProvide))(upstream, scope3);
})));
var withSpan4 = function() {
  const dataFirst = isChannel(arguments[0]);
  const name = dataFirst ? arguments[1] : arguments[0];
  const options = addSpanStackTrace(dataFirst ? arguments[2] : arguments[1]);
  if (dataFirst) {
    const self = arguments[0];
    return withSpanImpl(self, name, options);
  }
  return (self) => withSpanImpl(self, name, options);
};
var withSpanImpl = (self, name, options) => acquireUseRelease3(makeSpan2(name, options), (span2) => provideService3(self, ParentSpan, span2), (span2, exit3) => withFiber2((fiber3) => {
  const clock = fiber3.getRef(ClockRef);
  const timingEnabled = fiber3.getRef(TracerTimingEnabled2);
  return endSpan(span2, exit3, clock, timingEnabled);
}));
var runDrain = (self) => runWith(self, (pull) => forever4(pull, {
  disableYield: true
}));
var runForEach = /* @__PURE__ */ dual(2, (self, f) => runWith(self, (pull) => forever4(flatMap4(pull, f), {
  disableYield: true
})));
var runForEachWhile = /* @__PURE__ */ dual(2, (self, f) => runWith(self, (pull) => pull.pipe(flatMap4(f), flatMap4((cont) => cont ? void_3 : done2()), forever4({
  disableYield: true
}))));
var mkUint8Array = (self) => map6(runFold(self, () => ({
  bytes: 0,
  arrays: []
}), (acc, chunk) => {
  for (let i = 0; i < chunk.length; i++) {
    acc.bytes += chunk[i].length;
    acc.arrays.push(chunk[i]);
  }
  return acc;
}), ({
  arrays,
  bytes
}) => {
  const result4 = new Uint8Array(bytes);
  let offset = 0;
  for (let i = 0; i < arrays.length; i++) {
    const array2 = arrays[i];
    result4.set(array2, offset);
    offset += array2.length;
  }
  return result4;
});
var runHead = (self) => suspend3(() => {
  let head3 = none2();
  return runWith(self, (pull) => pull.pipe(asSome2, flatMap4((head_) => {
    head3 = head_;
    return done2();
  })), () => succeed6(head3));
});
var runLast = (self) => suspend3(() => {
  const absent = /* @__PURE__ */ Symbol();
  let last = absent;
  return runWith(self, (pull) => forever4(flatMap4(pull, (item) => {
    last = item;
    return void_3;
  }), {
    disableYield: true
  }), () => last === absent ? succeedNone2 : succeedSome2(last));
});
var runFold = /* @__PURE__ */ dual(3, (self, initial, f) => suspend3(() => {
  let state = initial();
  return runWith(self, (pull) => whileLoop2({
    while: constTrue,
    body: () => pull,
    step: (value) => {
      state = f(state, value);
    }
  }), () => succeed6(state));
}));
var runFoldEffect = /* @__PURE__ */ dual(3, (self, initial, f) => suspend3(() => {
  let state = initial();
  return runWith(self, (pull) => whileLoop2({
    while: constTrue,
    body: constant(pull.pipe(flatMap4((o) => f(state, o)), map6((s2) => {
      state = s2;
    }))),
    step: constVoid
  }), () => succeed6(state));
}));
var toPull2 = /* @__PURE__ */ fnUntraced2(
  function* (self) {
    const semaphore = makeUnsafe5(1);
    const context3 = yield* context2();
    const scope3 = get(context3, Scope);
    const pull = yield* toTransform(self)(done2(), scope3);
    return pull.pipe(provideContext2(context3), semaphore.withPermits(1));
  },
  // ensure errors are redirected to the pull effect
  /* @__PURE__ */ catchCause3((cause) => succeed6(failCause4(cause)))
);
var toPullScoped = (self, scope3) => toTransform(self)(done2(), scope3);
var runIntoQueueArray = /* @__PURE__ */ dual((args2) => isChannel(args2[0]), (self, queue) => uninterruptibleMask2((restore) => runForEach(self, (value) => offerAll(queue, value)).pipe(restore, exit2, flatMap4((exit3) => {
  if (isSuccess4(exit3)) {
    endUnsafe(queue);
  } else {
    failCauseUnsafe(queue, exit3.cause);
  }
  return void_3;
}))));
var toQueueArray = /* @__PURE__ */ dual((args2) => isChannel(args2[0]), /* @__PURE__ */ fnUntraced2(function* (self, options) {
  const scope3 = yield* scope2;
  const queue = yield* make10({
    capacity: typeof options.capacity === "number" ? options.capacity : void 0,
    strategy: typeof options.capacity === "number" ? options.strategy : void 0
  });
  yield* addFinalizer2(scope3, shutdown2(queue));
  yield* forkIn2(runIntoQueueArray(self, queue), scope3);
  return queue;
}));
var makePubSub = (options) => acquireRelease2(options.capacity === "unbounded" ? unbounded(options) : options.strategy === "dropping" ? dropping(options) : options.strategy === "sliding" ? sliding(options) : bounded(options), shutdown);
var toPubSubArray = /* @__PURE__ */ dual(2, /* @__PURE__ */ fnUntraced2(function* (self, options) {
  const pubsub = yield* makePubSub(options);
  yield* forkScoped2(runIntoPubSubArray(self, pubsub, {
    shutdownOnEnd: options.shutdownOnEnd !== false
  }));
  return pubsub;
}));
var runIntoPubSubArray = /* @__PURE__ */ dual((args2) => isChannel(args2[0]), (self, pubsub, options) => runForEach(self, (value) => publishAll(pubsub, value)).pipe(options?.shutdownOnEnd === true ? ensuring2(shutdown(pubsub)) : identity));
var toPubSubTake = /* @__PURE__ */ dual(2, /* @__PURE__ */ fnUntraced2(function* (self, options) {
  const pubsub = yield* makePubSub(options);
  yield* runForEach(self, (value) => publish(pubsub, value)).pipe(onExit2((exit3) => publish(pubsub, exit3)), forkScoped2);
  return pubsub;
}));

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/SchemaParser.js
function makeEffect(schema) {
  const parser = runWithCompiler(constructorCompiler, toType(schema.ast));
  return (input, options) => {
    return parser(input, options?.disableChecks ? options?.parseOptions ? {
      ...options.parseOptions,
      disableChecks: true
    } : {
      disableChecks: true
    } : options?.parseOptions);
  };
}
function makeOption(schema) {
  const parser = makeEffect(schema);
  return (input, options) => {
    const exit3 = runSyncExit2(parser(input, options));
    if (isSuccess4(exit3)) {
      return some2(exit3.value);
    }
    getSchemaIssueOrThrow(exit3.cause, "Option adapter can only return none for schema issues");
    return none2();
  };
}
function make11(schema) {
  const parser = makeEffect(schema);
  return (input, options) => {
    const exit3 = runSyncExit2(parser(input, options));
    if (isSuccess4(exit3)) {
      return exit3.value;
    }
    const issue = getSchemaIssueOrThrow(exit3.cause, "Constructor adapter can only throw schema issues");
    throw new Error("Schema validation failed", {
      cause: issue
    });
  };
}
var mergeParseOptions = (options, overrideOptions) => overrideOptions ? {
  ...options,
  ...overrideOptions
} : options;
var getValue = (value) => {
  if (value === missing) {
    return fail6(new InvalidValue());
  }
  return succeed6(value);
};
function runWithCompiler(compiler, ast) {
  let parser;
  return (input, options) => {
    const result4 = (parser ??= compiler(ast))(input, options ?? defaultParseOptions);
    if (result4 === sameExit) {
      return succeed6(input);
    }
    if (!effectIsExit(result4)) {
      return flatMapEager2(result4, getValue);
    }
    return result4[args] === missing ? getValue(missing) : result4;
  };
}
var constructorCompiler = /* @__PURE__ */ memoize((ast) => makeParser(ast, constructorCompiler, compileConstructorDefault));
var compileDefaulted = /* @__PURE__ */ memoize((ast) => makeParser(ast, constructorCompiler, compileConstructorDefault, ast.context?.constructorDefault));
function compileConstructorDefault(ast) {
  return ast.context?.constructorDefault ? compileDefaulted(ast) : constructorCompiler(ast);
}
function applyTransformation(result4, current, transformation, options) {
  let transformed;
  if (effectIsExit(result4) && result4._tag === "Success") {
    const optional2 = toOption(result4 === sameExit ? current : result4[args]);
    transformed = transformation._tag === "Transformation" ? transformation.decode.run(optional2, options) : transformation.decode(succeed7(optional2), options);
  } else if (transformation._tag === "Transformation") {
    transformed = flatMapEager2(result4, (value) => transformation.decode.run(toOption(value), options));
  } else {
    transformed = transformation.decode(mapEager2(result4, toOption), options);
  }
  return effectIsExit(transformed) && transformed._tag === "Success" ? fromOptionExit(transformed[args]) : flatMapEager2(transformed, fromOptionExit);
}
function makeConstructorParser(descriptor, compile) {
  let sourceParser;
  return (input, options) => {
    if (input === missing) return missingExit;
    if (descriptor.isConstructed(input)) return sameExit;
    const result4 = (sourceParser ??= compile(descriptor.link.to))(input, options);
    return applyTransformation(result4, input, descriptor.link.transformation, options);
  };
}
function makeParser(ast, compile, compileConstructorDefault2, constructorDefault) {
  const descriptor = compileConstructorDefault2 ? getConstructorDescriptor(ast) : void 0;
  const parser = descriptor ? makeConstructorParser(descriptor, compile) : ast.getParser(compile, compileConstructorDefault2);
  const checks = ast.checks;
  const links = constructorDefault ? ast.encoding ? [...ast.encoding, constructorDefault] : [constructorDefault] : ast.encoding;
  const encodingChecks = ast.encodingChecks;
  const astOptions = (checks ? checks[checks.length - 1].annotations : ast.annotations)?.["parseOptions"];
  if (!links && !checks && !encodingChecks) {
    if (!astOptions) {
      return parser;
    }
    return (input, options) => parser(input, mergeParseOptions(options, astOptions));
  }
  let encodingParsers;
  const parseLocal = (input, options) => {
    let result4 = parser(input, options);
    if (encodingChecks && !options.disableChecks) {
      if (effectIsExit(result4)) {
        if (result4._tag === "Success") {
          const output = result4 === sameExit ? input : result4[args];
          if (input !== missing && output !== missing) {
            const issues = collectIssues(encodingChecks, input, void 0, ast, options);
            if (issues) {
              result4 = fail6(new Composite(ast, issues, input, options));
            }
          }
        }
      } else {
        result4 = flatMap4(result4, (value) => {
          if (input !== missing && value !== missing) {
            const issues = collectIssues(encodingChecks, input, void 0, ast, options);
            if (issues) {
              return fail6(new Composite(ast, issues, input, options));
            }
          }
          return succeed6(value);
        });
      }
    }
    if (checks && !options.disableChecks) {
      if (effectIsExit(result4)) {
        if (result4._tag === "Success") {
          const value = result4 === sameExit ? input : result4[args];
          if (value === missing) return result4;
          const issues = collectIssues(checks, value, void 0, ast, options);
          if (issues) {
            result4 = fail6(new Composite(ast, issues, value, options));
          }
        }
      } else {
        result4 = flatMap4(result4, (value) => {
          if (value !== missing) {
            const issues = collectIssues(checks, value, void 0, ast, options);
            if (issues) {
              return fail6(new Composite(ast, issues, value, options));
            }
          }
          return succeed6(value);
        });
      }
    }
    return result4;
  };
  if (!links) {
    return astOptions ? (input, options) => parseLocal(input, mergeParseOptions(options, astOptions)) : parseLocal;
  }
  return (input, options) => {
    if (astOptions) {
      options = mergeParseOptions(options, astOptions);
    }
    const parsers = encodingParsers ??= links.map((link4) => compile(link4.to));
    let current = input;
    let result4 = parsers[parsers.length - 1](input, options);
    for (let i = links.length - 1; i >= 0; i--) {
      result4 = applyTransformation(result4, current, links[i].transformation, options);
      if (i !== 0) {
        const next = parsers[i - 1];
        if (result4._tag === "Success") {
          current = result4[args];
          result4 = next(current, options);
        } else {
          result4 = flatMapEager2(result4, (value) => {
            const nextResult = next(value, options);
            return nextResult === sameExit ? succeed7(value) : nextResult;
          });
        }
      }
    }
    if (result4._tag === "Success") {
      const value = result4[args];
      const local = parseLocal(value, options);
      return local === sameExit ? result4 : local;
    }
    result4 = catchCause3(result4, (cause) => failCauseSync2(() => map5(cause, (issue) => new Encoding(ast, issue, input, options))));
    return flatMapEager2(result4, (value) => {
      const local = parseLocal(value, options);
      return local === sameExit ? succeed7(value) : local;
    });
  };
}

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/internal/schema/schema.js
var TypeId20 = "~effect/Schema/Schema";
var SchemaProto = {
  [TypeId20]: TypeId20,
  pipe() {
    return pipeArguments(this, arguments);
  },
  annotate(annotations) {
    return this.rebuild(annotate(this.ast, annotations));
  },
  annotateKey(annotations) {
    return this.rebuild(annotateKey(this.ast, annotations));
  },
  check(...checks) {
    return this.rebuild(appendChecks(this.ast, checks));
  }
};
function make12(ast, options) {
  function Schema() {
  }
  const self = Object.defineProperties(Object.setPrototypeOf(Schema, SchemaProto), Object.getOwnPropertyDescriptors({
    ...options
  }));
  self.ast = ast;
  self.rebuild = (ast2) => make12(ast2, options);
  self.makeEffect = makeEffect(self);
  self.make = make11(self);
  self.makeOption = makeOption(self);
  return self;
}

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Struct.js
var lambda = (f) => f;

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Schema.js
var TypeId21 = TypeId20;
function declareConstructor() {
  return (typeParameters, run3, annotations) => {
    return make13(new Declaration(typeParameters.map(getAST), (typeParameters2) => run3(typeParameters2.map((ast) => make13(ast))), annotations));
  };
}
function declare(is2, annotations) {
  return declareConstructor()([], () => (input, ast, options) => is2(input) ? succeed6(input) : fail6(new InvalidType(ast, input, options)), annotations);
}
var SchemaErrorTypeId = "~effect/SchemaError/SchemaError";
var SchemaError = class extends (/* @__PURE__ */ TaggedError2("SchemaError")) {
  [SchemaErrorTypeId] = SchemaErrorTypeId;
  constructor(issue) {
    const stackTraceLimit = getStackTraceLimit();
    setStackTraceLimit(0);
    try {
      super({
        issue
      });
    } finally {
      setStackTraceLimit(stackTraceLimit);
    }
  }
  get message() {
    return defaultFormatter(this.issue);
  }
  toString() {
    return `SchemaError(${this.message})`;
  }
};
var make13 = make12;
function isSchema(u) {
  return hasProperty(u, TypeId21) && u[TypeId21] === TypeId21;
}
function Literal2(literal) {
  const out2 = make13(new Literal(literal), {
    literal,
    transform(to) {
      return out2.pipe(decodeTo2(Literal2(to), {
        decode: transform(() => to),
        encode: transform(() => literal)
      }));
    }
  });
  return out2;
}
var String5 = /* @__PURE__ */ make13(string2);
var Number6 = /* @__PURE__ */ make13(number2);
function makeStruct(ast, fields) {
  return make13(ast, {
    fields,
    mapFields(f, options) {
      const fields2 = f(this.fields);
      return makeStruct(struct(fields2, options?.unsafePreserveChecks ? this.ast.checks : void 0), fields2);
    }
  });
}
function Struct(fields) {
  return makeStruct(struct(fields, void 0), fields);
}
function makeTuple(ast, elements) {
  return make13(ast, {
    elements,
    mapElements(f, options) {
      const elements2 = f(this.elements);
      return makeTuple(tuple(elements2, options?.unsafePreserveChecks ? this.ast.checks : void 0), elements2);
    }
  });
}
function Tuple(elements) {
  return makeTuple(tuple(elements), elements);
}
var ArraySchema = /* @__PURE__ */ lambda((schema) => make13(new Arrays(false, [], [schema.ast]), {
  value: schema
}));
function makeUnion(ast, members) {
  return make13(ast, {
    members,
    mapMembers(f, options) {
      const members2 = f(this.members);
      return makeUnion(union2(members2, this.ast.mode, options?.unsafePreserveChecks ? this.ast.checks : void 0), members2);
    }
  });
}
function Union2(members, options) {
  return makeUnion(union2(members, options?.mode ?? "anyOf", void 0), members);
}
function decodeTo2(to, transformation) {
  return (from) => {
    return make13(decodeTo(from.ast, to.ast, transformation ? make5(transformation) : passthrough3()), {
      from,
      to
    });
  };
}
function withConstructorDefault2(defaultValue) {
  return (schema) => make13(withConstructorDefault(schema.ast, defaultValue), {
    schema
  });
}
function tag(literal) {
  return Literal2(literal).pipe(withConstructorDefault2(succeed6(literal)));
}
function instanceOf(constructor, annotations) {
  return declare((u) => u instanceof constructor, annotations);
}
function link() {
  return (encodeTo, transformation) => {
    return new Link(encodeTo.ast, make5(transformation));
  };
}
var makeFilter2 = makeFilter;
function isPattern2(regExp, annotations) {
  const source = regExp.source;
  const flags = regExp.flags;
  const runtimeRegExp = flags === "" ? `new RegExp(${format(source)})` : `new RegExp(${format(source)}, ${format(flags)})`;
  return isPattern(regExp, {
    toCode: () => ({
      runtime: `Schema.isPattern(${runtimeRegExp})`
    }),
    ...annotations
  });
}
function isBase64(annotations) {
  const regExp = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
  return isPattern2(regExp, {
    expected: "a base64 encoded string",
    representation: {
      id: "effect/schema/isBase64",
      payload: null
    },
    toJsonSchema: () => ({
      pattern: regExp.source
    }),
    toCode: () => ({
      runtime: "Schema.isBase64()"
    }),
    ...annotations
  });
}
function isInt(annotations) {
  return makeFilter2((n) => globalThis.Number.isSafeInteger(n), {
    expected: "an integer",
    representation: {
      id: "effect/schema/isInt",
      payload: null
    },
    toJsonSchema: () => ({
      type: "integer"
    }),
    toCode: () => ({
      runtime: "Schema.isInt()"
    }),
    arbitrary: {
      constraint: {
        integer: true
      }
    },
    ...annotations
  });
}
var Int = /* @__PURE__ */ Number6.check(/* @__PURE__ */ isInt());
var RegExp2 = /* @__PURE__ */ instanceOf(globalThis.RegExp, {
  representation: {
    id: "effect/schema/RegExp",
    payload: null
  },
  toCode: () => ({
    runtime: `Schema.RegExp`,
    Type: `globalThis.RegExp`
  }),
  expected: "RegExp",
  toCodecJson: () => link()(Struct({
    source: String5,
    flags: String5
  }), transformOrFail2({
    decode: (e, options) => try_2({
      try: () => new globalThis.RegExp(e.source, e.flags),
      catch: () => new InvalidValue({
        expected: "valid RegExp source and flags"
      }, e, options)
    }),
    encode: (regExp) => succeed6({
      source: regExp.source,
      flags: regExp.flags
    })
  })),
  toArbitrary: () => (fc) => fc.tuple(fc.constantFrom(
    ".",
    ".*",
    "\\d+",
    "\\w+",
    "[a-z]+",
    "[A-Z]+",
    "[0-9]+",
    "^[a-zA-Z0-9]+$",
    "^\\d{4}-\\d{2}-\\d{2}$"
    // date pattern
  ), fc.uniqueArray(fc.constantFrom("g", "i", "m", "s", "u", "y"), {
    minLength: 0,
    maxLength: 6
  }).map((flags) => flags.join(""))).map(([source, flags]) => new globalThis.RegExp(source, flags)),
  toEquivalence: () => (a, b) => a.source === b.source && a.flags === b.flags
});
var URLString = /* @__PURE__ */ String5.annotate({
  expected: "a string that will be decoded as a URL"
});
var URL2 = /* @__PURE__ */ instanceOf(globalThis.URL, {
  representation: {
    id: "effect/schema/URL",
    payload: null
  },
  toCode: () => ({
    runtime: `Schema.URL`,
    Type: `globalThis.URL`
  }),
  expected: "URL",
  toCodecJson: () => link()(URLString, urlFromString),
  toArbitrary: () => (fc) => fc.webUrl().map((s2) => new globalThis.URL(s2)),
  toEquivalence: () => (a, b) => a.toString() === b.toString()
});
var File = /* @__PURE__ */ instanceOf(globalThis.File, {
  representation: {
    id: "effect/schema/File",
    payload: null
  },
  toCode: () => ({
    runtime: `Schema.File`,
    Type: `globalThis.File`
  }),
  expected: "File",
  toCodecJson: () => link()(Struct({
    data: String5.check(isBase64()),
    type: String5,
    name: String5,
    lastModified: Int
  }), transformOrFail2({
    decode: (e, options) => match2(decodeBase64(e.data), {
      onFailure: () => fail6(new InvalidValue({
        expected: "a valid Base64 string"
      }, e.data, options)),
      onSuccess: (bytes) => {
        const buffer3 = new globalThis.Uint8Array(bytes);
        return succeed6(new globalThis.File([buffer3], e.name, {
          type: e.type,
          lastModified: e.lastModified
        }));
      }
    }),
    encode: (file, options) => tryPromise2({
      try: async () => {
        const bytes = new globalThis.Uint8Array(await file.arrayBuffer());
        return {
          data: encodeBase64(bytes),
          type: file.type,
          name: file.name,
          lastModified: file.lastModified
        };
      },
      catch: () => new InvalidValue({
        expected: "a readable File"
      }, file, options)
    })
  }))
});
var FormData2 = /* @__PURE__ */ instanceOf(globalThis.FormData, {
  representation: {
    id: "effect/schema/FormData",
    payload: null
  },
  toCode: () => ({
    runtime: `Schema.FormData`,
    Type: `globalThis.FormData`
  }),
  expected: "FormData",
  toCodecJson: () => link()(ArraySchema(Tuple([String5, Union2([Struct({
    _tag: tag("String"),
    value: String5
  }), Struct({
    _tag: tag("File"),
    value: File
  })])])), transformOrFail2({
    decode: (e) => {
      const out2 = new globalThis.FormData();
      for (const [key, entry] of e) {
        out2.append(key, entry.value);
      }
      return succeed6(out2);
    },
    encode: (formData) => {
      return succeed6(globalThis.Array.from(formData.entries()).map(([key, value]) => {
        if (typeof value === "string") {
          return [key, {
            _tag: "String",
            value
          }];
        } else {
          return [key, {
            _tag: "File",
            value
          }];
        }
      }));
    }
  }))
});
var URLSearchParams2 = /* @__PURE__ */ instanceOf(globalThis.URLSearchParams, {
  representation: {
    id: "effect/schema/URLSearchParams",
    payload: null
  },
  toCode: () => ({
    runtime: `Schema.URLSearchParams`,
    Type: `globalThis.URLSearchParams`
  }),
  expected: "URLSearchParams",
  toCodecJson: () => link()(String5.annotate({
    expected: "a query string that will be decoded as URLSearchParams"
  }), transform2({
    decode: (e) => new globalThis.URLSearchParams(e),
    encode: (params) => params.toString()
  }))
});
var Base64String = /* @__PURE__ */ String5.annotate({
  expected: "a base64 encoded string that will be decoded as Uint8Array",
  format: "byte",
  contentEncoding: "base64"
});
var Uint8Array2 = /* @__PURE__ */ instanceOf(globalThis.Uint8Array, {
  representation: {
    id: "effect/schema/Uint8Array",
    payload: null
  },
  toCode: () => ({
    runtime: `Schema.Uint8Array`,
    Type: `globalThis.Uint8Array`
  }),
  expected: "Uint8Array",
  toCodecJson: () => link()(Base64String, uint8ArrayFromBase64String),
  toArbitrary: () => (fc) => fc.uint8Array()
});
var immerable = /* @__PURE__ */ globalThis.Symbol.for("immer-draftable");
var payloadToken = {};
function makeClass(Inherited, identifier2, struct2, annotations, proto) {
  const getClassSchema = getClassSchemaFactory(struct2, identifier2, annotations);
  const ClassTypeId = getClassTypeId(identifier2);
  const out2 = class extends Inherited {
    constructor(...[input, options]) {
      const internalOptions = options;
      const payload = internalOptions?.["~payload"];
      const value = payload?.token === payloadToken ? payload.value : struct2.make(input ?? {}, options);
      super(value, {
        ...options,
        disableChecks: true,
        "~payload": {
          token: payloadToken,
          value
        }
      });
    }
    static [TypeId21] = TypeId21;
    get [ClassTypeId]() {
      return ClassTypeId;
    }
    static [immerable] = true;
    static identifier = identifier2;
    static fields = struct2.fields;
    static get ast() {
      return getClassSchema(this).ast;
    }
    static pipe() {
      return pipeArguments(this, arguments);
    }
    static rebuild(ast) {
      return getClassSchema(this).rebuild(ast);
    }
    static make(input, options) {
      return new this(input, options);
    }
    static makeOption(input, options) {
      return makeOption(getClassSchema(this))(input ?? {}, options);
    }
    static makeEffect(input, options) {
      return getClassSchema(this).makeEffect(input ?? {}, options);
    }
    static annotate(annotations2) {
      return this.rebuild(annotate(this.ast, annotations2));
    }
    static annotateKey(annotations2) {
      return this.rebuild(annotateKey(this.ast, annotations2));
    }
    static check(...checks) {
      return this.rebuild(appendChecks(this.ast, checks));
    }
    static extend(identifier3) {
      return (schema, annotations2) => {
        const extension = isStruct(schema) ? schema : Struct(schema);
        const fields = {
          ...struct2.fields,
          ...extension.fields
        };
        const ast = struct(fields, struct2.ast.checks, {
          identifier: identifier3
        });
        return makeClass(this, identifier3, makeStruct(appendChecks(ast, extension.ast.checks), fields), annotations2, proto);
      };
    }
    static mapFields(f, options) {
      return struct2.mapFields(f, options);
    }
  };
  if (proto !== void 0) {
    Object.assign(out2.prototype, proto(identifier2));
  }
  return out2;
}
function getClassTransformation(self) {
  return new Transformation(transform((input) => new self(input, {
    "~payload": {
      token: payloadToken,
      value: input
    }
  })), passthrough2());
}
function getClassTypeId(identifier2) {
  return `~effect/Schema/Class/${identifier2}`;
}
function getClassSchemaFactory(from, identifier2, annotations) {
  let memo;
  return (self) => {
    if (memo !== void 0) {
      return memo;
    }
    const ClassTypeId = getClassTypeId(identifier2);
    const isClassValue = (input) => input instanceof self || hasProperty(input, ClassTypeId);
    const transformation = getClassTransformation(self);
    const to = make13(new Declaration([from.ast], () => (input, ast, options) => {
      return isClassValue(input) ? succeed6(input) : fail6(new InvalidType(ast, input, options));
    }, {
      identifier: identifier2,
      [CONSTRUCTOR_ANNOTATION_KEY]: ([from2]) => ({
        isConstructed: isClassValue,
        link: new Link(from2, transformation)
      }),
      toCodec: ([from2]) => new Link(from2.ast, transformation),
      toArbitrary: ([from2]) => () => ({
        arbitrary: from2.arbitrary.map((args2) => new self(args2)),
        terminal: from2.terminal?.map((args2) => new self(args2))
      }),
      toFormatter: ([from2]) => (t) => `${self.identifier}(${from2(t)})`,
      [SENTINELS_ANNOTATION_KEY]: collectSentinels(from.ast),
      ...annotations
    }));
    return memo = decodeTo2(to, transformation)(from);
  };
}
function isStruct(schema) {
  return isSchema(schema);
}
var Error4 = (identifier2) => (schema, annotations) => {
  const struct2 = isStruct(schema) ? schema : Struct(schema);
  const self = makeClass(Error2, identifier2, struct2, annotations, (identifier3) => ({
    name: identifier3
  }));
  return self;
};

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/FileSystem.js
var FileSystem_exports = {};
__export(FileSystem_exports, {
  FileSystem: () => FileSystem,
  FileTypeId: () => FileTypeId,
  GiB: () => GiB,
  KiB: () => KiB,
  MiB: () => MiB,
  PiB: () => PiB,
  Size: () => Size,
  TiB: () => TiB,
  WatchBackend: () => WatchBackend,
  isFile: () => isFile,
  layerNoop: () => layerNoop,
  make: () => make18,
  makeNoop: () => makeNoop
});

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/PlatformError.js
var TypeId22 = "~effect/platform/PlatformError";
var BadArgument = class extends (/* @__PURE__ */ TaggedError2("BadArgument")) {
  /**
   * Formats the module, method, and optional description that rejected the argument.
   *
   * **When to use**
   *
   * Use to read the formatted error message for a rejected platform argument.
   *
   * @since 4.0.0
   */
  get message() {
    return `${this.module}.${this.method}${this.description ? `: ${this.description}` : ""}`;
  }
};
var SystemError = class extends Error3 {
  /**
   * Formats the normalized system error tag with operation and path details.
   *
   * **When to use**
   *
   * Use to read the formatted error message for a normalized system failure.
   *
   * @since 4.0.0
   */
  get message() {
    return `${this._tag}: ${this.module}.${this.method}${this.pathOrDescriptor !== void 0 ? ` (${this.pathOrDescriptor})` : ""}${this.description ? `: ${this.description}` : ""}`;
  }
};
var PlatformError = class extends (/* @__PURE__ */ TaggedError2("PlatformError")) {
  constructor(reason) {
    if ("cause" in reason) {
      super({
        reason,
        cause: reason.cause
      });
    } else {
      super({
        reason
      });
    }
  }
  /**
   * Marks this value as a platform error wrapper for runtime guards.
   *
   * **When to use**
   *
   * Use to identify `PlatformError` values through their runtime type marker.
   *
   * @since 4.0.0
   */
  [TypeId22] = TypeId22;
  get message() {
    return this.reason.message;
  }
};
var systemError = (options) => new PlatformError(new SystemError(options));
var badArgument = (options) => new PlatformError(new BadArgument(options));

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/internal/stream.js
var TypeId23 = "~effect/Stream";
var streamVariance = {
  _R: identity,
  _E: identity,
  _A: identity
};
var StreamProto = {
  [TypeId23]: streamVariance,
  pipe() {
    return pipeArguments(this, arguments);
  }
};
var fromChannel = (channel) => {
  const self = Object.create(StreamProto);
  self.channel = channel;
  return self;
};

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Sink.js
var TypeId24 = "~effect/Sink";
var endVoid = /* @__PURE__ */ succeed6([void 0]);
var sinkVariance = {
  _A: identity,
  _In: identity,
  _L: identity,
  _E: identity,
  _R: identity
};
var SinkProto = {
  [TypeId24]: sinkVariance,
  pipe() {
    return pipeArguments(this, arguments);
  }
};
var isSink = (u) => hasProperty(u, TypeId24);
var fromChannel2 = (channel) => fromTransform2((upstream, scope3) => toTransform(channel)(upstream, scope3).pipe(flatMap4(forever4({
  disableYield: true
})), catchDone(succeed6)));
var fromTransform2 = (transform3) => {
  const self = Object.create(SinkProto);
  self.transform = transform3;
  return self;
};
var toChannel = (self) => fromTransform((upstream, scope3) => succeed6(flatMap4(self.transform(upstream, scope3), done2)));
var fromEffectEnd = (effect2) => fromTransform2(() => effect2);
var fail8 = (e) => fromEffectEnd(fail6(e));
var drain2 = /* @__PURE__ */ fromTransform2((upstream) => catchDone(forever4(upstream, {
  disableYield: true
}), () => endVoid));
var take4 = (n) => fromTransform2((upstream) => {
  const taken = [];
  if (n <= 0) {
    return succeed6([taken]);
  }
  let leftover = void 0;
  return upstream.pipe(flatMap4((arr) => {
    if (taken.length + arr.length <= n) {
      taken.push(...arr);
      if (taken.length === n) {
        return done2();
      }
      return void_3;
    }
    for (let i = 0; i < arr.length; i++) {
      taken.push(arr[i]);
      if (taken.length === n) {
        if (i + 1 < arr.length) {
          leftover = arr.slice(i + 1);
        }
        return done2();
      }
    }
    return void_3;
  }), forever4({
    disableYield: true
  }), catchDone(() => succeed6([taken, leftover])));
});
var forEach3 = (f) => forEachArray(forEach2((_) => f(_), {
  discard: true
}));
var forEachArray = (f) => fromTransform2((upstream) => upstream.pipe(flatMap4(f), forever4({
  disableYield: true
}), catchDone(() => endVoid)));
var unwrap3 = (effect2) => fromChannel2(unwrap2(map6(effect2, toChannel)));

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Stream.js
var Stream_exports = {};
__export(Stream_exports, {
  DefaultChunkSize: () => DefaultChunkSize2,
  Do: () => Do3,
  TypeId: () => TypeId27,
  accumulate: () => accumulate,
  aggregate: () => aggregate,
  aggregateWithin: () => aggregateWithin,
  bind: () => bind4,
  bindEffect: () => bindEffect,
  bindTo: () => bindTo4,
  broadcast: () => broadcast,
  broadcastN: () => broadcastN,
  buffer: () => buffer2,
  bufferArray: () => bufferArray2,
  callback: () => callback3,
  catch: () => catch_5,
  catchCause: () => catchCause5,
  catchCauseFilter: () => catchCauseFilter4,
  catchCauseIf: () => catchCauseIf4,
  catchFilter: () => catchFilter4,
  catchIf: () => catchIf4,
  catchReason: () => catchReason4,
  catchReasons: () => catchReasons4,
  catchTag: () => catchTag4,
  catchTags: () => catchTags3,
  changes: () => changes,
  changesWith: () => changesWith,
  changesWithEffect: () => changesWithEffect,
  chunks: () => chunks,
  collect: () => collect,
  combine: () => combine3,
  combineArray: () => combineArray,
  concat: () => concat,
  cross: () => cross,
  crossWith: () => crossWith,
  debounce: () => debounce,
  decodeText: () => decodeText,
  die: () => die6,
  drain: () => drain3,
  drainFork: () => drainFork,
  drop: () => drop,
  dropRight: () => dropRight,
  dropUntil: () => dropUntil,
  dropUntilEffect: () => dropUntilEffect,
  dropWhile: () => dropWhile,
  dropWhileEffect: () => dropWhileEffect,
  dropWhileFilter: () => dropWhileFilter,
  empty: () => empty6,
  encodeText: () => encodeText,
  ensuring: () => ensuring4,
  fail: () => fail9,
  failCause: () => failCause7,
  failCauseSync: () => failCauseSync4,
  failSync: () => failSync4,
  filter: () => filter8,
  filterEffect: () => filterEffect,
  filterMap: () => filterMap3,
  filterMapEffect: () => filterMapEffect3,
  flatMap: () => flatMap6,
  flatten: () => flatten5,
  flattenArray: () => flattenArray2,
  flattenEffect: () => flattenEffect,
  flattenIterable: () => flattenIterable,
  flattenTake: () => flattenTake2,
  forever: () => forever6,
  fromArray: () => fromArray2,
  fromArrayEffect: () => fromArrayEffect,
  fromArrays: () => fromArrays,
  fromAsyncIterable: () => fromAsyncIterable2,
  fromChannel: () => fromChannel3,
  fromEffect: () => fromEffect2,
  fromEffectDrain: () => fromEffectDrain2,
  fromEffectRepeat: () => fromEffectRepeat,
  fromEffectSchedule: () => fromEffectSchedule,
  fromEventListener: () => fromEventListener,
  fromIterable: () => fromIterable2,
  fromIterableEffect: () => fromIterableEffect,
  fromIterableEffectRepeat: () => fromIterableEffectRepeat,
  fromIteratorSucceed: () => fromIteratorSucceed,
  fromPubSub: () => fromPubSub,
  fromPubSubTake: () => fromPubSubTake2,
  fromPull: () => fromPull2,
  fromQueue: () => fromQueue,
  fromReadableStream: () => fromReadableStream2,
  fromSchedule: () => fromSchedule,
  fromSubscription: () => fromSubscription,
  groupAdjacentBy: () => groupAdjacentBy,
  groupBy: () => groupBy,
  groupByKey: () => groupByKey,
  grouped: () => grouped,
  groupedWithin: () => groupedWithin,
  haltWhen: () => haltWhen2,
  ignore: () => ignore4,
  ignoreCause: () => ignoreCause4,
  interleave: () => interleave,
  interleaveWith: () => interleaveWith,
  interruptWhen: () => interruptWhen2,
  intersperse: () => intersperse,
  intersperseAffixes: () => intersperseAffixes,
  isStream: () => isStream,
  iterate: () => iterate,
  let: () => let_4,
  limitBytes: () => limitBytes,
  make: () => make17,
  map: () => map8,
  mapAccum: () => mapAccum2,
  mapAccumArray: () => mapAccumArray,
  mapAccumArrayEffect: () => mapAccumArrayEffect,
  mapAccumEffect: () => mapAccumEffect,
  mapArray: () => mapArray,
  mapArrayEffect: () => mapArrayEffect,
  mapBoth: () => mapBoth3,
  mapEffect: () => mapEffect2,
  mapError: () => mapError5,
  merge: () => merge4,
  mergeAll: () => mergeAll4,
  mergeEffect: () => mergeEffect2,
  mergeLeft: () => mergeLeft,
  mergeResult: () => mergeResult,
  mergeRight: () => mergeRight,
  mkArrayBuffer: () => mkArrayBuffer,
  mkString: () => mkString,
  mkUint8Array: () => mkUint8Array2,
  never: () => never5,
  onEnd: () => onEnd2,
  onError: () => onError4,
  onExit: () => onExit4,
  onFirst: () => onFirst2,
  onStart: () => onStart2,
  orDie: () => orDie5,
  orElseIfEmpty: () => orElseIfEmpty2,
  orElseSucceed: () => orElseSucceed3,
  paginate: () => paginate,
  partition: () => partition4,
  partitionEffect: () => partitionEffect,
  partitionQueue: () => partitionQueue,
  peel: () => peel,
  pipeThrough: () => pipeThrough,
  pipeThroughChannel: () => pipeThroughChannel,
  pipeThroughChannelOrFail: () => pipeThroughChannelOrFail,
  prepend: () => prepend2,
  provide: () => provide6,
  provideContext: () => provideContext4,
  provideService: () => provideService4,
  provideServiceEffect: () => provideServiceEffect4,
  race: () => race3,
  raceAll: () => raceAll3,
  range: () => range2,
  rechunk: () => rechunk,
  repeat: () => repeat5,
  repeatElements: () => repeatElements,
  result: () => result3,
  retry: () => retry4,
  run: () => run,
  runCollect: () => runCollect,
  runCount: () => runCount,
  runDrain: () => runDrain2,
  runFold: () => runFold2,
  runFoldEffect: () => runFoldEffect2,
  runForEach: () => runForEach2,
  runForEachArray: () => runForEachArray,
  runForEachWhile: () => runForEachWhile2,
  runHead: () => runHead2,
  runIntoPubSub: () => runIntoPubSub,
  runIntoQueue: () => runIntoQueue,
  runLast: () => runLast2,
  runSum: () => runSum,
  scan: () => scan,
  scanEffect: () => scanEffect2,
  schedule: () => schedule3,
  scoped: () => scoped4,
  service: () => service3,
  serviceOption: () => serviceOption3,
  share: () => share,
  sliding: () => sliding2,
  slidingSize: () => slidingSize,
  split: () => split,
  splitLines: () => splitLines2,
  succeed: () => succeed9,
  suspend: () => suspend5,
  switchMap: () => switchMap2,
  sync: () => sync5,
  take: () => take5,
  takeRight: () => takeRight,
  takeUntil: () => takeUntil,
  takeUntilEffect: () => takeUntilEffect,
  takeWhile: () => takeWhile,
  takeWhileEffect: () => takeWhileEffect,
  takeWhileFilter: () => takeWhileFilter,
  tap: () => tap4,
  tapBoth: () => tapBoth,
  tapCause: () => tapCause5,
  tapError: () => tapError5,
  tapSink: () => tapSink,
  throttle: () => throttle,
  throttleEffect: () => throttleEffect,
  tick: () => tick,
  timeout: () => timeout3,
  timeoutOrElse: () => timeoutOrElse3,
  toAsyncIterable: () => toAsyncIterable,
  toAsyncIterableEffect: () => toAsyncIterableEffect,
  toAsyncIterableWith: () => toAsyncIterableWith,
  toChannel: () => toChannel2,
  toPubSub: () => toPubSub,
  toPubSubTake: () => toPubSubTake2,
  toPull: () => toPull3,
  toQueue: () => toQueue,
  toReadableStream: () => toReadableStream,
  toReadableStreamEffect: () => toReadableStreamEffect,
  toReadableStreamWith: () => toReadableStreamWith,
  transduce: () => transduce,
  transformPull: () => transformPull2,
  transformPullBracket: () => transformPullBracket,
  unfold: () => unfold,
  unwrap: () => unwrap4,
  updateContext: () => updateContext4,
  updateService: () => updateService4,
  when: () => when3,
  withExecutionPlan: () => withExecutionPlan3,
  withSpan: () => withSpan5,
  zip: () => zip3,
  zipFlatten: () => zipFlatten,
  zipLatest: () => zipLatest,
  zipLatestAll: () => zipLatestAll,
  zipLatestWith: () => zipLatestWith,
  zipLeft: () => zipLeft,
  zipRight: () => zipRight,
  zipWith: () => zipWith3,
  zipWithArray: () => zipWithArray,
  zipWithIndex: () => zipWithIndex,
  zipWithNext: () => zipWithNext,
  zipWithPrevious: () => zipWithPrevious,
  zipWithPreviousAndNext: () => zipWithPreviousAndNext
});

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/RcMap.js
var TypeId25 = "~effect/RcMap";
var makeUnsafe6 = (options) => ({
  [TypeId25]: TypeId25,
  lookup: options.lookup,
  context: options.context,
  scope: options.scope,
  idleTimeToLive: options.idleTimeToLive,
  capacity: options.capacity,
  state: {
    _tag: "Open",
    map: empty4()
  },
  pipe() {
    return pipeArguments(this, arguments);
  }
});
var make14 = (options) => withFiber2((fiber3) => {
  const context3 = fiber3.context;
  const scope3 = get(context3, Scope);
  const self = makeUnsafe6({
    lookup: options.lookup,
    context: context3,
    scope: scope3,
    idleTimeToLive: typeof options.idleTimeToLive === "function" ? flow(options.idleTimeToLive, fromInputUnsafe) : constant(fromInputUnsafe(options.idleTimeToLive ?? zero)),
    capacity: Math.max(options.capacity ?? Number.POSITIVE_INFINITY, 0)
  });
  return as2(addFinalizerExit(scope3, () => {
    if (self.state._tag === "Closed") {
      return void_3;
    }
    const map9 = self.state.map;
    self.state = {
      _tag: "Closed"
    };
    return forEach2(map9, ([, entry]) => exit2(close(entry.scope, void_2))).pipe(tap3(() => sync3(() => {
      clear(map9);
    })));
  }), self);
});
var get4 = /* @__PURE__ */ dual(2, (self, key) => uninterruptibleMask2((restore) => {
  if (self.state._tag === "Closed") {
    return interrupt3;
  }
  const state = self.state;
  const parent = getCurrent();
  const o = get2(state.map, key);
  let entry;
  if (o._tag === "Some") {
    entry = o.value;
    entry.refCount++;
  } else if (Number.isFinite(self.capacity) && size(self.state.map) >= self.capacity) {
    return fail6(new ExceededCapacityError2(`RcMap attempted to exceed capacity of ${self.capacity}`));
  } else {
    entry = {
      deferred: makeUnsafe2(),
      scope: makeUnsafe3(),
      idleTimeToLive: self.idleTimeToLive(key),
      finalizer: void 0,
      fiber: void 0,
      expiresAt: 0,
      refCount: 1
    };
    entry.finalizer = release(self, key, entry);
    set(state.map, key, entry);
    const context3 = new Map(self.context.mapUnsafe);
    parent.context.mapUnsafe.forEach((value, key2) => {
      context3.set(key2, value);
    });
    context3.set(Scope.key, entry.scope);
    self.lookup(key).pipe(runForkWith2(makeUnsafe(context3)), runIn(entry.scope)).addObserver((exit3) => doneUnsafe(entry.deferred, exit3));
  }
  const scope3 = getUnsafe2(parent.context, Scope);
  return addFinalizer2(scope3, entry.finalizer).pipe(andThen2(restore(_await(entry.deferred))));
}));
var release = (self, key, entry) => withFiber2((fiber3) => {
  entry.refCount--;
  if (entry.refCount > 0) {
    return void_3;
  } else if (self.state._tag === "Closed" || !has(self.state.map, key) || isZero(entry.idleTimeToLive)) {
    if (self.state._tag === "Open") {
      remove(self.state.map, key);
    }
    return close(entry.scope, void_2);
  } else if (!isFinite(entry.idleTimeToLive)) {
    return void_3;
  }
  const clock = fiber3.getRef(Clock);
  entry.expiresAt = clock.currentTimeMillisUnsafe() + toMillis(entry.idleTimeToLive);
  if (entry.fiber) return void_3;
  entry.fiber = interruptibleMask2(function loop(restore) {
    const now2 = clock.currentTimeMillisUnsafe();
    const remaining = entry.expiresAt - now2;
    if (remaining <= 0) {
      if (self.state._tag === "Closed" || entry.refCount > 0) return void_3;
      remove(self.state.map, key);
      return restore(close(entry.scope, void_2));
    }
    return flatMap4(clock.sleep(millis(remaining)), () => loop(restore));
  }).pipe(ensuring2(sync3(() => {
    entry.fiber = void 0;
  })), runForkWith2(fiber3.context), runIn(self.scope));
  return void_3;
});
var touch = /* @__PURE__ */ dual(2, (self, key) => clockWith2((clock) => {
  if (self.state._tag === "Closed") {
    return void_3;
  }
  const o = get2(self.state.map, key);
  if (o._tag === "None" || isZero(o.value.idleTimeToLive)) {
    return void_3;
  }
  const entry = o.value;
  entry.expiresAt = clock.currentTimeMillisUnsafe() + toMillis(entry.idleTimeToLive);
  return void_3;
}));

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/internal/rcRef.js
var TypeId26 = "~effect/RcRef";
var stateEmpty = {
  _tag: "Empty"
};
var stateClosed = {
  _tag: "Closed"
};
var variance2 = {
  _A: identity,
  _E: identity
};
var RcRefImpl = class {
  [TypeId26] = variance2;
  pipe() {
    return pipeArguments(this, arguments);
  }
  state = stateEmpty;
  semaphore = /* @__PURE__ */ makeUnsafe5(1);
  acquire;
  context;
  scope;
  idleTimeToLive;
  constructor(acquire2, context3, scope3, idleTimeToLive) {
    this.acquire = acquire2;
    this.context = context3;
    this.scope = scope3;
    this.idleTimeToLive = idleTimeToLive;
  }
};
var make15 = (options) => withFiber2((fiber3) => {
  const context3 = fiber3.context;
  const scope3 = get(context3, Scope);
  const ref = new RcRefImpl(options.acquire, context3, scope3, options.idleTimeToLive ? fromInputUnsafe(options.idleTimeToLive) : void 0);
  return as2(addFinalizerExit(scope3, () => {
    const close3 = ref.state._tag === "Acquired" ? close(ref.state.scope, void_2) : void_3;
    ref.state = stateClosed;
    return close3;
  }), ref);
});
var getState = (self) => uninterruptibleMask2(function loop(restore) {
  switch (self.state._tag) {
    case "Closed": {
      return interrupt3;
    }
    case "Acquired": {
      self.state.refCount++;
      return self.state.fiber ? as2(interrupt4(self.state.fiber), self.state) : succeed6(self.state);
    }
    case "Empty": {
      const scope3 = makeUnsafe3();
      return self.semaphore.withPermit(suspend3(() => {
        if (self.state._tag !== "Empty") {
          return loop(restore);
        }
        return restore(provideContext2(self.acquire, add(self.context, Scope, scope3))).pipe(map6((value) => {
          const state = {
            _tag: "Acquired",
            value,
            scope: scope3,
            fiber: void 0,
            refCount: 1,
            invalidated: false
          };
          self.state = state;
          return state;
        }), onExit2((exit3) => isFailure4(exit3) ? close(scope3, exit3) : void_3));
      }));
    }
  }
});
var get5 = /* @__PURE__ */ fnUntraced2(function* (self_) {
  const self = self_;
  const state = yield* getState(self);
  const scope3 = yield* scope2;
  const isFinite3 = self.idleTimeToLive !== void 0 && isFinite(self.idleTimeToLive);
  yield* addFinalizerExit(scope3, () => {
    state.refCount--;
    if (state.refCount > 0) {
      return void_3;
    }
    if (self.idleTimeToLive === void 0) {
      self.state = stateEmpty;
      return close(state.scope, void_2);
    } else if (state.invalidated) {
      return close(state.scope, void_2);
    } else if (!isFinite3) {
      return void_3;
    }
    state.fiber = sleep2(self.idleTimeToLive).pipe(flatMap4(() => {
      if (self.state._tag === "Acquired" && self.state.refCount === 0) {
        self.state = stateEmpty;
        return close(state.scope, void_2);
      }
      return void_3;
    }), ensuring2(sync3(() => {
      state.fiber = void 0;
    })), runForkWith2(self.context), runIn(self.scope));
    return void_3;
  });
  return state.value;
});

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/RcRef.js
var make16 = make15;
var get6 = get5;

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Stream.js
var TypeId27 = "~effect/Stream";
var isStream = (u) => hasProperty(u, TypeId27);
var DefaultChunkSize2 = DefaultChunkSize;
var fromChannel3 = fromChannel;
var fromEffect2 = (effect2) => fromChannel3(fromEffect(map6(effect2, of)));
var service3 = (service4) => fromEffect2(service2(service4));
var serviceOption3 = (service4) => fromEffect2(serviceOption2(service4));
var fromEffectDrain2 = (effect2) => fromPull2(succeed6(flatMap4(effect2, () => done2())));
var fromEffectRepeat = (effect2) => fromPull2(succeed6(map6(effect2, of)));
var fromEffectSchedule = (effect2, schedule4) => fromPull2(gen2(function* () {
  const step = yield* toStepWithMetadata(schedule4);
  let s2 = yield* provideService2(effect2, CurrentMetadata2, CurrentMetadata2.defaultValue());
  let initial = true;
  const pull = suspend3(() => step(s2)).pipe(flatMap4((meta) => provideService2(effect2, CurrentMetadata2, meta)), map6((next) => {
    s2 = next;
    return of(next);
  }));
  return suspend3(() => {
    if (initial) {
      initial = false;
      return succeed6(of(s2));
    }
    return pull;
  });
}));
var tick = (interval) => fromPull2(sync3(() => {
  let first = true;
  const effect2 = succeed6(of(void 0));
  const delayed = delay2(effect2, interval);
  return suspend3(() => {
    if (first) {
      first = false;
      return effect2;
    }
    return delayed;
  });
}));
var fromPull2 = (pull) => fromChannel3(fromPull(pull));
var transformPull2 = (self, f) => fromChannel3(fromTransform((_, scope3) => flatMap4(toPullScoped(self.channel, scope3), (pull) => f(pull, scope3))));
var transformPullBracket = (self, f) => fromChannel3(fromTransformBracket((_, scope3, forkedScope) => flatMap4(toPullScoped(self.channel, scope3), (pull) => f(pull, scope3, forkedScope))));
var toChannel2 = (stream) => stream.channel;
var callback3 = (f, options) => fromChannel3(callbackArray(f, options));
var empty6 = /* @__PURE__ */ fromChannel3(empty5);
var succeed9 = (value) => fromChannel3(succeed8(of(value)));
var make17 = (...values) => fromArray2(values);
var sync5 = (evaluate2) => fromChannel3(sync4(() => of(evaluate2())));
var suspend5 = (stream) => fromChannel3(suspend4(() => stream().channel));
var fail9 = (error) => fromChannel3(fail7(error));
var failSync4 = (evaluate2) => fromChannel3(failSync3(evaluate2));
var failCause7 = (cause) => fromChannel3(failCause6(cause));
var die6 = (defect) => fromChannel3(die5(defect));
var failCauseSync4 = (evaluate2) => fromChannel3(failCauseSync3(evaluate2));
var fromIteratorSucceed = (iterator, maxChunkSize) => fromChannel3(fromIteratorArray(() => iterator, maxChunkSize));
var fromIterable2 = (iterable, options) => Array.isArray(iterable) && options?.chunkSize === void 0 ? fromArray2(iterable) : fromChannel3(fromIterableArray(iterable, options?.chunkSize));
var fromIterableEffect = (iterable) => unwrap4(map6(iterable, fromIterable2));
var fromIterableEffectRepeat = (iterable) => flatMap6(fromEffectRepeat(iterable), fromIterable2);
var fromArray2 = (array2) => isReadonlyArrayNonEmpty(array2) ? fromChannel3(succeed8(array2)) : empty6;
var fromArrayEffect = (effect2) => unwrap4(map6(effect2, fromArray2));
var fromArrays = (...arrays) => fromChannel3(fromArray(filter3(arrays, isReadonlyArrayNonEmpty)));
var fromQueue = (queue) => fromChannel3(fromQueueArray(queue));
var fromPubSub = (pubsub) => fromChannel3(fromPubSubArray(pubsub));
var fromPubSubTake2 = (pubsub) => fromChannel3(fromPubSubTake(pubsub));
var fromReadableStream2 = (options) => fromChannel3(fromReadableStream(options));
var fromAsyncIterable2 = (iterable, onError5) => fromChannel3(fromAsyncIterableArray(iterable, onError5));
var fromSchedule = (schedule4) => fromPull2(map6(toStepWithSleep(schedule4), (step) => catchDone(map6(step(void 0), of), () => done2())));
var fromSubscription = (pubsub) => fromChannel3(fromSubscriptionArray(pubsub));
var fromEventListener = (target, type, options) => callback3((queue) => {
  function emit(event) {
    offerUnsafe(queue, event);
  }
  return acquireRelease2(sync3(() => target.addEventListener(type, emit, options)), () => sync3(() => target.removeEventListener(type, emit, options)));
}, {
  bufferSize: typeof options === "object" ? options.bufferSize : void 0
});
var unfold = (s2, f) => fromPull2(sync3(() => {
  let state = s2;
  return flatMap4(suspend3(() => f(state)), (next) => {
    if (next === void 0) return done2();
    state = next[1];
    return succeed6(of(next[0]));
  });
}));
var paginate = (s2, f) => fromPull2(sync3(() => {
  let state = s2;
  let done4 = false;
  return suspend3(function loop() {
    if (done4) return done2();
    return flatMap4(f(state), ([a, s3]) => {
      if (isNone2(s3)) {
        done4 = true;
      } else {
        state = s3.value;
      }
      if (!isReadonlyArrayNonEmpty(a)) return loop();
      return succeed6(a);
    });
  });
}));
var iterate = (value, next) => unfold(value, (a) => succeed6([a, next(a)]));
var range2 = (min2, max2, chunkSize = DefaultChunkSize) => min2 > max2 ? empty6 : fromPull2(sync3(() => {
  const size2 = Math.max(1, chunkSize);
  let start = min2;
  let done4 = false;
  return suspend3(() => {
    if (done4) return done2();
    const remaining = max2 - start + 1;
    if (remaining > size2) {
      const chunk2 = range(start, start + size2 - 1);
      start += size2;
      return succeed6(chunk2);
    }
    const chunk = range(start, start + remaining - 1);
    done4 = true;
    return succeed6(chunk);
  });
}));
var never5 = /* @__PURE__ */ fromChannel3(never3);
var unwrap4 = (effect2) => fromChannel3(unwrap2(map6(effect2, toChannel2)));
var scoped4 = (self) => fromChannel3(scoped3(self.channel));
var map8 = /* @__PURE__ */ dual(2, (self, f) => suspend5(() => {
  let i = 0;
  return fromChannel3(map7(self.channel, map2((o) => f(o, i++))));
}));
var mapBoth3 = /* @__PURE__ */ dual(2, (self, options) => self.pipe(map8(options.onSuccess), mapError5(options.onFailure)));
var mapArray = /* @__PURE__ */ dual(2, (self, f) => fromChannel3(map7(self.channel, f)));
var mapEffect2 = /* @__PURE__ */ dual((args2) => isStream(args2[0]), (self, f, options) => self.channel.pipe(flattenArray, mapEffect(f, options), map7(of), fromChannel3));
var flattenEffect = /* @__PURE__ */ dual((args2) => isStream(args2[0]), (self, options) => mapEffect2(self, identity, options));
var mapArrayEffect = /* @__PURE__ */ dual(2, (self, f) => fromChannel3(mapEffect(self.channel, f)));
var result3 = (self) => self.pipe(map8(succeed2), catch_5((e) => succeed9(fail2(e))));
var tap4 = /* @__PURE__ */ dual((args2) => isStream(args2[0]), (self, f, options) => mapEffect2(self, (a) => as2(f(a), a), options));
var tapBoth = /* @__PURE__ */ dual(2, (self, options) => self.pipe(tapError5(options.onError), tap4(options.onElement, {
  concurrency: options.concurrency
})));
var tapSink = /* @__PURE__ */ dual(2, (self, sink) => transformPullBracket(self, fnUntraced2(function* (pull, _, scope3) {
  const upstreamLatch = makeUnsafe4();
  const sinkLatch = makeUnsafe4();
  let chunk = void 0;
  let causeSink = void 0;
  let sinkDone = false;
  let streamDone = false;
  const sinkUpstream = upstreamLatch.whenOpen(suspend3(() => {
    if (chunk) {
      const arr = chunk;
      chunk = void 0;
      if (!streamDone) upstreamLatch.closeUnsafe();
      return as2(sinkLatch.open, arr);
    }
    return done2();
  }));
  yield* suspend3(() => sink.transform(sinkUpstream, scope3)).pipe((eff) => onExitPrimitive2(eff, (exit3) => {
    sinkDone = true;
    if (isFailure4(exit3)) {
      causeSink = exit3.cause;
    }
    return sinkLatch.open;
  }, true), forkIn2(scope3));
  const pullAndOffer = pull.pipe(flatMap4((chunk_) => {
    chunk = chunk_;
    sinkLatch.closeUnsafe();
    upstreamLatch.openUnsafe();
    return as2(sinkLatch.await, chunk_);
  }), catchDone(() => {
    streamDone = true;
    sinkLatch.closeUnsafe();
    upstreamLatch.openUnsafe();
    return flatMap4(sinkLatch.await, () => done2());
  }));
  return suspend3(() => {
    if (causeSink) {
      return failCause4(causeSink);
    } else if (sinkDone) {
      return pull;
    }
    return pullAndOffer;
  });
})));
var flatMap6 = /* @__PURE__ */ dual((args2) => isStream(args2[0]), (self, f, options) => self.channel.pipe(flattenArray, flatMap5((a) => f(a).channel, options), fromChannel3));
var switchMap2 = /* @__PURE__ */ dual((args2) => isStream(args2[0]), (self, f, options) => self.channel.pipe(flattenArray, switchMap((a) => f(a).channel, options), fromChannel3));
var flatten5 = /* @__PURE__ */ dual((args2) => isStream(args2[0]), (self, options) => flatMap6(self, identity, options));
var flattenArray2 = (self) => fromChannel3(flattenArray(self.channel));
var drain3 = (self) => fromChannel3(drain(self.channel));
var drainFork = /* @__PURE__ */ dual(2, (self, that) => mergeEffect2(self, runDrain2(that)));
var repeat5 = /* @__PURE__ */ dual(2, (self, schedule4) => fromChannel3(repeat4(self.channel, schedule4)));
var schedule3 = /* @__PURE__ */ dual(2, (self, schedule4) => self.channel.pipe(flattenArray, schedule2(schedule4), map7(of), fromChannel3));
var timeout3 = /* @__PURE__ */ dual(2, (self, duration) => timeoutOrElse3(self, {
  duration,
  orElse: () => empty6
}));
var timeoutOrElse3 = /* @__PURE__ */ dual(2, (self, options) => {
  const duration = fromInputUnsafe(options.duration);
  if (!isFinite(duration)) return self;
  if (isZero(duration)) return suspend5(options.orElse);
  const timeoutSymbol = /* @__PURE__ */ Symbol();
  return catchCause5(suspend5(() => {
    const parent = getCurrent();
    const clock = parent.getRef(Clock);
    const durationMs = toMillis(duration);
    let deadline = void 0;
    const latch = makeUnsafe4(false);
    return merge4(transformPull2(self, (pull, _scope) => suspend3(() => {
      deadline = clock.currentTimeMillisUnsafe() + durationMs;
      latch.openUnsafe();
      return pull;
    }).pipe(map6((arr) => {
      latch.closeUnsafe();
      deadline = void 0;
      return arr;
    }), succeed6)), fromEffectDrain2(gen2(function* () {
      while (true) {
        yield* latch.await;
        if (deadline === void 0) continue;
        yield* sleep2(deadline - clock.currentTimeMillisUnsafe());
        if (deadline === void 0) continue;
        const remaining = deadline - clock.currentTimeMillisUnsafe();
        if (remaining > 0) continue;
        return yield* die4(timeoutSymbol);
      }
    })), {
      haltStrategy: "left"
    });
  }), (cause) => {
    const isTimeout = cause.reasons.find((r) => r._tag === "Die" && r.defect === timeoutSymbol);
    if (isTimeout) return options.orElse();
    return failCause7(cause);
  });
});
var repeatElements = /* @__PURE__ */ dual(2, (self, schedule4) => fromChannel3(fromTransform((upstream, scope3) => map6(toTransform(flattenArray(self.channel))(upstream, scope3), (pullElement) => {
  let pullRepeat = void 0;
  const pull = gen2(function* () {
    const element = yield* pullElement;
    const chunk = of(element);
    const step = yield* toStepWithSleep(schedule4);
    pullRepeat = step(element).pipe(as2(chunk), catchDone((_) => {
      pullRepeat = void 0;
      return pull;
    }));
    return chunk;
  });
  return suspend3(() => pullRepeat ?? pull);
}))));
var forever6 = (self) => fromChannel3(forever5(self.channel));
var flattenIterable = (self) => flatMap6(self, fromIterable2);
var flattenTake2 = (self) => self.channel.pipe(flattenArray, flattenTake, fromChannel3);
var concat = /* @__PURE__ */ dual(2, (self, that) => flatten5(fromArray2([self, that])));
var prepend2 = /* @__PURE__ */ dual(2, (self, values) => concat(fromIterable2(values), self));
var merge4 = /* @__PURE__ */ dual((args2) => isStream(args2[0]) && isStream(args2[1]), (self, that, options) => fromChannel3(merge3(toChannel2(self), toChannel2(that), options)));
var mergeEffect2 = /* @__PURE__ */ dual(2, (self, effect2) => self.channel.pipe(mergeEffect(effect2), fromChannel3));
var mergeResult = /* @__PURE__ */ dual(2, (self, that) => merge4(map8(self, succeed2), map8(that, fail2)));
var mergeLeft = /* @__PURE__ */ dual(2, (left, right) => mergeEffect2(left, runDrain2(right)));
var mergeRight = /* @__PURE__ */ dual(2, (left, right) => mergeEffect2(right, runDrain2(left)));
var mergeAll4 = /* @__PURE__ */ dual(2, (streams, options) => flatten5(fromIterable2(streams), options));
var cross = /* @__PURE__ */ dual(2, (left, right) => crossWith(left, right, (l, r) => [l, r]));
var crossWith = /* @__PURE__ */ dual(3, (left, right, f) => flatMap6(left, (l) => map8(right, (r) => f(l, r))));
var zipWith3 = /* @__PURE__ */ dual(3, (left, right, f) => zipWithArray(left, right, zipArrays(f)));
var zipArrays = (f) => (leftArr, rightArr) => {
  const minLength = Math.min(leftArr.length, rightArr.length);
  const result4 = [];
  for (let i = 0; i < minLength; i++) {
    result4.push(f(leftArr[i], rightArr[i]));
  }
  return [result4, leftArr.slice(minLength), rightArr.slice(minLength)];
};
var zipWithArray = /* @__PURE__ */ dual(3, (left, right, f) => fromChannel3(fromTransformBracket(fnUntraced2(function* (_, scope3) {
  const pullLeft = yield* toPullScoped(left.channel, scope3);
  const pullRight = yield* toPullScoped(right.channel, scope3);
  const pullBoth = gen2(function* () {
    const fiberLeft = yield* forkIn2(pullLeft, scope3);
    const fiberRight = yield* forkIn2(pullRight, scope3);
    return yield* joinAll([fiberLeft, fiberRight]);
  });
  let state = {
    _tag: "PullBoth"
  };
  const pull = gen2(function* () {
    const [left2, right2] = state._tag === "PullBoth" ? yield* pullBoth : state._tag === "PullLeft" ? [yield* pullLeft, state.rightArray] : [state.leftArray, yield* pullRight];
    const result4 = f(left2, right2);
    if (isReadonlyArrayNonEmpty(result4[1])) {
      state = {
        _tag: "PullRight",
        leftArray: result4[1]
      };
    } else if (isReadonlyArrayNonEmpty(result4[2])) {
      state = {
        _tag: "PullLeft",
        rightArray: result4[2]
      };
    } else {
      state = {
        _tag: "PullBoth"
      };
    }
    return result4[0];
  });
  return pull;
}))));
var zip3 = /* @__PURE__ */ dual(2, (self, that) => zipWith3(self, that, (a, a2) => [a, a2]));
var zipLeft = /* @__PURE__ */ dual(2, (left, right) => zipWithArray(left, right, (leftArr, rightArr) => {
  const minLength = Math.min(leftArr.length, rightArr.length);
  const output = leftArr.slice(0, minLength);
  const leftoverLeft = leftArr.slice(minLength);
  const leftoverRight = rightArr.slice(minLength);
  return [output, leftoverLeft, leftoverRight];
}));
var zipRight = /* @__PURE__ */ dual(2, (left, right) => zipWithArray(left, right, (leftArr, rightArr) => {
  const minLength = Math.min(leftArr.length, rightArr.length);
  const output = rightArr.slice(0, minLength);
  const leftoverLeft = leftArr.slice(minLength);
  const leftoverRight = rightArr.slice(minLength);
  return [output, leftoverLeft, leftoverRight];
}));
var zipFlatten = /* @__PURE__ */ dual(2, (self, that) => zipWith3(self, that, (a, a2) => [...a, a2]));
var zipWithIndex = (self) => map8(self, (a, i) => [a, i]);
var zipWithNext = (self) => mapAccumArray(self, none2, (acc, arr) => {
  let i = 0;
  if (acc._tag === "None") {
    i = 1;
    acc = some2(arr[0]);
  }
  const pairs = empty();
  for (; i < arr.length; i++) {
    const value = acc.value;
    acc = some2(arr[i]);
    pairs.push([value, acc]);
  }
  return [acc, pairs];
}, {
  onHalt(state) {
    return state._tag === "Some" ? [[state.value, none2()]] : [];
  }
});
var zipWithPrevious = (self) => mapAccumArray(self, none2, (acc, arr) => {
  const pairs = empty();
  for (let i = 0; i < arr.length; i++) {
    const value = arr[i];
    pairs.push([acc, value]);
    acc = some2(arr[i]);
  }
  return [acc, pairs];
});
var zipWithPreviousAndNext = (self) => mapAccumArray(self, () => ({
  prev: none2(),
  current: none2()
}), (acc, arr) => {
  let i = 0;
  let current;
  if (acc.current._tag === "None") {
    i = 1;
    current = arr[0];
    acc.current = some2(current);
  } else {
    current = acc.current.value;
  }
  const pairs = empty();
  for (; i < arr.length; i++) {
    const element = arr[i];
    acc.current = some2(element);
    pairs.push([acc.prev, current, acc.current]);
    acc.prev = some2(current);
    current = element;
  }
  return [acc, pairs];
}, {
  onHalt(acc) {
    return acc.current._tag === "Some" ? [[acc.prev, acc.current.value, none2()]] : [];
  }
});
var zipLatestAll = (...streams) => fromChannel3(suspend4(() => {
  const latest = [];
  const emitted = /* @__PURE__ */ new Set();
  const readyLatch = makeUnsafe4();
  return mergeAll3(fromArray(streams.map((s2, i) => s2.channel.pipe(flattenArray, mapEffect((a) => {
    latest[i] = a;
    if (!emitted.has(i)) {
      emitted.add(i);
      if (emitted.size < streams.length) {
        return readyLatch.await;
      }
      return as2(readyLatch.open, of(latest.slice()));
    }
    return succeed6(of(latest.slice()));
  }), filter7(isNotUndefined)))), {
    concurrency: "unbounded",
    bufferSize: 0
  });
}));
var zipLatest = /* @__PURE__ */ dual(2, (left, right) => zipLatestAll(left, right));
var zipLatestWith = /* @__PURE__ */ dual(3, (left, right, f) => map8(zipLatestAll(left, right), ([a, a2]) => f(a, a2)));
var raceAll3 = (...streams) => fromChannel3(fromTransform((_, scope3) => sync3(() => {
  let winner;
  const race4 = raceAll2(streams.map((stream) => {
    const childScope = forkUnsafe2(scope3);
    return toPullScoped(stream.channel, childScope).pipe(flatMap4((pull) => zip2(succeed6(pull), pull)), onExit2((exit3) => {
      if (exit3._tag === "Success") {
        if (winner) {
          return close(childScope, exit3);
        }
        winner = exit3.value[0];
        return void_3;
      }
      return close(childScope, exit3);
    }), map6(([, chunk]) => chunk));
  }));
  return suspend3(() => winner ?? race4);
})));
var race3 = /* @__PURE__ */ dual(2, (left, right) => raceAll3(left, right));
var filter8 = /* @__PURE__ */ dual(2, (self, predicate) => fromChannel3(filterArray(toChannel2(self), predicate)));
var filterMap3 = /* @__PURE__ */ dual(2, (self, filter9) => fromChannel3(filterMapArray(toChannel2(self), filter9)));
var filterEffect = /* @__PURE__ */ dual(2, (self, predicate) => fromChannel3(filterArrayEffect(toChannel2(self), predicate)));
var filterMapEffect3 = /* @__PURE__ */ dual(2, (self, filter9) => fromChannel3(filterMapArrayEffect(toChannel2(self), filter9)));
var partitionQueue = /* @__PURE__ */ dual((args2) => isStream(args2[0]), /* @__PURE__ */ fnUntraced2(function* (self, filter9, options) {
  const scope3 = yield* scope2;
  const pull = yield* toPullScoped(self.channel, scope3);
  const capacity = options?.capacity === "unbounded" ? void 0 : options?.capacity ?? DefaultChunkSize2;
  const passes = yield* make10({
    capacity
  });
  const fails = yield* make10({
    capacity
  });
  yield* gen2(function* () {
    while (true) {
      const chunk = yield* pull;
      const excluded = [];
      const satisfying = [];
      for (let i = 0; i < chunk.length; i++) {
        const result4 = filter9(chunk[i]);
        if (isFailure2(result4)) {
          excluded.push(result4.failure);
        } else {
          satisfying.push(result4.success);
        }
      }
      let passFiber = void 0;
      if (satisfying.length > 0) {
        const leftover = offerAllUnsafe(passes, satisfying);
        if (leftover.length > 0) {
          passFiber = yield* forkChild2(offerAll(passes, leftover));
        }
      }
      if (excluded.length > 0) {
        const leftover = offerAllUnsafe(fails, excluded);
        if (leftover.length > 0) {
          yield* offerAll(fails, leftover);
        }
      }
      if (passFiber) yield* join(passFiber);
    }
  }).pipe(onError2((cause) => {
    failCauseUnsafe(passes, cause);
    failCauseUnsafe(fails, cause);
    return void_3;
  }), forkIn2(scope3));
  return [passes, fails];
}));
var partitionEffect = /* @__PURE__ */ dual((args2) => isStream(args2[0]), (self, filter9, options) => map6(partitionQueue(mapEffect2(self, (a) => filter9(a), options), (result4) => result4, options), ([passes, fails]) => [fromQueue(passes), fromQueue(fails)]));
var partition4 = /* @__PURE__ */ dual((args2) => isStream(args2[0]), (self, filter9, options) => map6(partitionQueue(self, filter9, {
  capacity: options?.bufferSize ?? 16
}), ([passes, fails]) => [fromQueue(fails), fromQueue(passes)]));
var when3 = /* @__PURE__ */ dual(2, (self, test) => test.pipe(map6((pass) => pass ? self : empty6), unwrap4));
var peel = /* @__PURE__ */ dual(2, /* @__PURE__ */ fnUntraced2(function* (self, sink) {
  let cause = void 0;
  const originalPull = yield* toPull2(self.channel);
  const pull = catchCause3(originalPull, (cause_) => {
    cause = cause_;
    return failCause4(cause_);
  });
  let stream = fromPull2(succeed6(pull));
  const leftover = yield* run(stream, sink);
  if (cause) return [leftover, empty6];
  stream = fromPull2(succeed6(originalPull));
  return [leftover, stream];
}));
var buffer2 = /* @__PURE__ */ dual(2, (self, options) => fromChannel3(bufferArray(self.channel, options)));
var bufferArray2 = /* @__PURE__ */ dual(2, (self, options) => fromChannel3(buffer(self.channel, options)));
var catchCause5 = /* @__PURE__ */ dual(2, (self, f) => self.channel.pipe(catchCause4((cause) => f(cause).channel), fromChannel3));
var tapCause5 = /* @__PURE__ */ dual(2, (self, f) => self.channel.pipe(tapCause4(f), fromChannel3));
var catch_5 = /* @__PURE__ */ dual(2, (self, f) => fromChannel3(catch_4(self.channel, (error) => f(error).channel)));
var tapError5 = /* @__PURE__ */ dual(2, (self, f) => self.channel.pipe(tapError4(f), fromChannel3));
var catchIf4 = /* @__PURE__ */ dual((args2) => isStream(args2[0]), (self, predicate, f, orElse) => fromChannel3(catchIf3(toChannel2(self), predicate, (e) => f(e).channel, orElse && ((e) => orElse(e).channel))));
var catchFilter4 = /* @__PURE__ */ dual((args2) => isStream(args2[0]), (self, filter9, f, orElse) => fromChannel3(catchFilter3(toChannel2(self), filter9, (e) => f(e).channel, orElse && ((e) => orElse(e).channel))));
var catchTag4 = /* @__PURE__ */ dual((args2) => isStream(args2[0]), (self, k, f, orElse) => {
  const pred = Array.isArray(k) ? (e) => hasProperty(e, "_tag") && k.includes(e._tag) : isTagged(k);
  return catchIf4(self, pred, f, orElse);
});
var catchTags3 = /* @__PURE__ */ dual((args2) => isStream(args2[0]), (self, cases, orElse) => {
  let keys2;
  return catchFilter4(self, (e) => {
    keys2 ??= Object.keys(cases);
    return hasProperty(e, "_tag") && isString2(e["_tag"]) && keys2.includes(e["_tag"]) ? succeed2(e) : fail2(e);
  }, (e) => cases[e["_tag"]](e), orElse);
});
var catchReason4 = /* @__PURE__ */ dual((args2) => isStream(args2[0]), (self, errorTag, reasonTag, f, orElse) => fromChannel3(catchReason3(toChannel2(self), errorTag, reasonTag, (reason, error) => f(reason, error).channel, orElse && ((reason, error) => orElse(reason, error).channel))));
var catchReasons4 = /* @__PURE__ */ dual((args2) => isStream(args2[0]), (self, errorTag, cases, orElse) => {
  const handlers = /* @__PURE__ */ Object.create(null);
  for (const key of Object.keys(cases)) {
    const handler = cases[key];
    handlers[key] = (reason, error) => handler(reason, error).channel;
  }
  const orElseHandler = orElse && ((reason, error) => orElse(reason, error).channel);
  return fromChannel3(catchReasons3(self.channel, errorTag, handlers, orElseHandler));
});
var mapError5 = /* @__PURE__ */ dual(2, (self, f) => fromChannel3(mapError4(self.channel, f)));
var catchCauseIf4 = /* @__PURE__ */ dual(3, (self, predicate, f) => fromChannel3(catchCauseIf3(self.channel, predicate, (cause) => f(cause).channel)));
var catchCauseFilter4 = /* @__PURE__ */ dual(3, (self, filter9, f) => fromChannel3(catchCauseFilter3(self.channel, filter9, (failure, cause) => f(failure, cause).channel)));
var orElseIfEmpty2 = /* @__PURE__ */ dual(2, (self, orElse) => fromChannel3(orElseIfEmpty(self.channel, (_) => toChannel2(orElse()))));
var orElseSucceed3 = /* @__PURE__ */ dual(2, (self, f) => catch_5(self, (e) => succeed9(f(e))));
var orDie5 = (self) => fromChannel3(orDie4(self.channel));
var ignore4 = /* @__PURE__ */ dual((args2) => isStream(args2[0]), (self, options) => fromChannel3(ignore3(self.channel, options)));
var ignoreCause4 = /* @__PURE__ */ dual((args2) => isStream(args2[0]), (self, options) => fromChannel3(ignoreCause3(self.channel, options)));
var retry4 = /* @__PURE__ */ dual(2, (self, policy) => fromChannel3(retry3(self.channel, policy)));
var retryWithoutReset = (self, schedule4) => unwrap4(map6(toStepWithMetadata(schedule4), (step) => {
  let meta = CurrentMetadata2.defaultValue();
  const loop = () => catch_5(provideServiceEffect4(self, CurrentMetadata2, sync3(() => meta)), (error) => unwrap4(catchDone(map6(step(error), (meta_) => {
    meta = meta_;
    return unwrap4(as2(yieldNow2, loop()));
  }), () => succeed6(fail9(error)))));
  return loop();
}));
var withExecutionPlan3 = /* @__PURE__ */ dual((args2) => isStream(args2[0]), (self, policy, options) => suspend5(() => {
  const preventFallbackOnPartialStream = options?.preventFallbackOnPartialStream ?? false;
  let i = 0;
  let meta = {
    attempt: 0,
    stepIndex: 0
  };
  const provideMeta = provideServiceEffect4(CurrentMetadata, sync3(() => {
    meta = {
      attempt: meta.attempt + 1,
      stepIndex: i
    };
    return meta;
  }));
  const emitter = options?.onEvent === void 0 ? void 0 : makeEventEmitter(options.onEvent, () => meta);
  let attemptState;
  const instrument = emitter === void 0 ? identity : (attempt2) => onExit4(onStart2(attempt2, map6(emitter.begin, (state) => {
    attemptState = state;
  })), (exit3) => suspend3(() => {
    if (attemptState === void 0) return void_3;
    const state = attemptState;
    attemptState = void 0;
    return emitter.end(state, exit3);
  }));
  let lastError = none2();
  const loop = suspend5(() => {
    const step = policy.steps[i];
    if (!step) {
      return fail9(getOrThrow(lastError));
    }
    let nextStream = provideMeta(instrument(provide6(self, step.provide)));
    let receivedElements = false;
    if (isSome2(lastError)) {
      const error = lastError.value;
      let attempted = false;
      const wrapped = nextStream;
      nextStream = suspend5(() => {
        if (attempted) return wrapped;
        attempted = true;
        return fail9(error);
      });
      nextStream = retryWithoutReset(nextStream, scheduleFromStep(step, false));
    } else {
      const schedule4 = scheduleFromStep(step, true);
      nextStream = schedule4 ? retryWithoutReset(nextStream, schedule4) : nextStream;
    }
    return catch_5(preventFallbackOnPartialStream ? onFirst2(nextStream, (_) => {
      receivedElements = true;
      return void_3;
    }) : nextStream, (error) => {
      i++;
      if (preventFallbackOnPartialStream && receivedElements) {
        return fail9(error);
      }
      lastError = some2(error);
      return loop;
    });
  });
  return loop;
}));
var take5 = /* @__PURE__ */ dual(2, (self, n) => n < 1 ? empty6 : takeUntil(self, (_, i) => i === n - 1));
var limitBytes = /* @__PURE__ */ dual(3, (self, bytes, onLimitReached) => suspend5(() => {
  const limit = BigInt(bytes);
  let size2 = BigInt(0);
  let limitReached = false;
  return concat(takeWhile(self, (chunk) => {
    const nextSize = size2 + BigInt(chunk.length);
    if (nextSize > limit) {
      limitReached = true;
      return false;
    }
    size2 = nextSize;
    return true;
  }), suspend5(() => limitReached ? onLimitReached() : empty6));
}));
var takeRight = /* @__PURE__ */ dual(2, (self, n) => mapAccumArray(self, make8, (list2, arr) => {
  appendAll2(list2, arr);
  if (list2.length > n) {
    takeNVoid(list2, list2.length - n);
  }
  return [list2, emptyArr];
}, {
  onHalt(list2) {
    return takeAll(list2);
  }
}));
var takeUntil = /* @__PURE__ */ dual((args2) => isStream(args2[0]), (self, predicate, options) => transformPull2(self, (pull, _scope) => sync3(() => {
  let i = 0;
  let done4 = false;
  const pump = flatMap4(suspend3(() => done4 ? done2() : pull), (chunk) => {
    const index = chunk.findIndex((a) => predicate(a, i++));
    if (index >= 0) {
      done4 = true;
      const arr = chunk.slice(0, options?.excludeLast ? index : index + 1);
      return isReadonlyArrayNonEmpty(arr) ? succeed6(arr) : done2();
    }
    return succeed6(chunk);
  });
  return pump;
})));
var takeUntilEffect = /* @__PURE__ */ dual((args2) => isStream(args2[0]), (self, predicate, options) => transformPull2(self, (pull, _scope) => sync3(() => {
  let i = 0;
  let done4 = false;
  return gen2(function* () {
    if (done4) return yield* done2();
    const chunk = yield* pull;
    for (let j = 0; j < chunk.length; j++) {
      if (yield* predicate(chunk[j], i++)) {
        done4 = true;
        const arr = chunk.slice(0, options?.excludeLast ? j : j + 1);
        return isReadonlyArrayNonEmpty(arr) ? arr : yield* done2();
      }
    }
    return chunk;
  });
})));
var takeWhile = /* @__PURE__ */ dual(2, (self, predicate) => transformPull2(self, (pull, _scope) => sync3(() => {
  let i = 0;
  let done4 = false;
  const pump = flatMap4(suspend3(() => done4 ? done2() : pull), (chunk) => {
    const out2 = [];
    for (let j = 0; j < chunk.length; j++) {
      if (!predicate(chunk[j], i++)) {
        done4 = true;
        break;
      }
      out2.push(chunk[j]);
    }
    return isReadonlyArrayNonEmpty(out2) ? succeed6(out2) : done4 ? done2() : pump;
  });
  return pump;
})));
var takeWhileFilter = /* @__PURE__ */ dual(2, (self, filter9) => transformPull2(self, (pull, _scope) => sync3(() => {
  let done4 = false;
  const pump = flatMap4(suspend3(() => done4 ? done2() : pull), (chunk) => {
    const out2 = [];
    for (let j = 0; j < chunk.length; j++) {
      const result4 = filter9(chunk[j]);
      if (isFailure2(result4)) {
        done4 = true;
        break;
      }
      out2.push(result4.success);
    }
    return isReadonlyArrayNonEmpty(out2) ? succeed6(out2) : done4 ? done2() : pump;
  });
  return pump;
})));
var takeWhileEffect = /* @__PURE__ */ dual(2, (self, predicate) => takeUntilEffect(self, (a, n) => map6(predicate(a, n), (b) => !b), {
  excludeLast: true
}));
var drop = /* @__PURE__ */ dual(2, (self, n) => transformPull2(self, (pull, _scope) => sync3(() => {
  let dropped = 0;
  const pump = pull.pipe(flatMap4((chunk) => {
    if (dropped >= n) return succeed6(chunk);
    dropped += chunk.length;
    if (dropped <= n) return pump;
    return succeed6(chunk.slice(n - dropped));
  }));
  return pump;
})));
var dropUntil = /* @__PURE__ */ dual(2, (self, predicate) => drop(dropWhile(self, (a, i) => !predicate(a, i)), 1));
var dropUntilEffect = /* @__PURE__ */ dual(2, (self, predicate) => drop(dropWhileEffect(self, (a, i) => map6(predicate(a, i), (b) => !b)), 1));
var dropWhile = /* @__PURE__ */ dual(2, (self, predicate) => transformPull2(self, (pull, _scope) => sync3(() => {
  let dropping2 = true;
  let index = 0;
  const filtered = flatMap4(pull, (arr) => {
    const found = arr.findIndex((a) => !predicate(a, index++));
    if (found === -1) return filtered;
    dropping2 = false;
    return succeed6(arr.slice(found));
  });
  return suspend3(() => dropping2 ? filtered : pull);
})));
var dropWhileFilter = /* @__PURE__ */ dual(2, (self, filter9) => transformPull2(self, (pull, _scope) => sync3(() => {
  let dropping2 = true;
  const filtered = flatMap4(pull, (arr) => {
    const found = arr.findIndex((a) => isFailure2(filter9(a)));
    if (found === -1) return filtered;
    dropping2 = false;
    return succeed6(arr.slice(found));
  });
  return suspend3(() => dropping2 ? filtered : pull);
})));
var dropWhileEffect = /* @__PURE__ */ dual(2, (self, predicate) => transformPull2(self, (pull, _scope) => sync3(() => {
  let dropping2 = true;
  let index = 0;
  const filtered = gen2(function* () {
    while (true) {
      const arr = yield* pull;
      for (let i = 0; i < arr.length; i++) {
        const drop2 = yield* predicate(arr[i], index++);
        if (drop2) continue;
        dropping2 = false;
        return arr.slice(i);
      }
    }
  });
  return suspend3(() => dropping2 ? filtered : pull);
})));
var dropRight = /* @__PURE__ */ dual(2, (self, n) => {
  if (n <= 0) return self;
  return transformPull2(self, (pull, _scope) => sync3(() => {
    const list2 = make8();
    const emit = flatMap4(pull, (arr) => {
      appendAllUnsafe(list2, arr);
      const toTake = list2.length - n;
      const items = takeN(list2, toTake);
      return isArrayNonEmpty2(items) ? succeed6(items) : emit;
    });
    return emit;
  }));
});
var chunks = (self) => self.channel.pipe(map7(of), fromChannel3);
var rechunk = /* @__PURE__ */ dual(2, (self, target) => {
  target = Math.max(1, target);
  return transformPull2(self, (pull, _scope) => sync3(() => {
    let chunk = empty();
    let index = 0;
    let current;
    let done4 = false;
    return suspend3(function loop() {
      if (done4) return done2();
      else if (current === void 0) {
        return flatMap4(pull, (arr) => {
          if (chunk.length === 0 && arr.length === target) {
            return succeed6(arr);
          } else if (chunk.length + arr.length < target) {
            chunk.push(...arr);
            return loop();
          }
          current = arr;
          return loop();
        });
      }
      for (; index < current.length; ) {
        chunk.push(current[index++]);
        if (chunk.length === target) {
          const result4 = chunk;
          chunk = [];
          return succeed6(result4);
        }
      }
      index = 0;
      current = void 0;
      return loop();
    }).pipe(catchDone(() => {
      if (chunk.length === 0) return done2();
      const result4 = chunk;
      done4 = true;
      chunk = [];
      return succeed6(result4);
    }));
  }));
});
var sliding2 = /* @__PURE__ */ dual(2, (self, chunkSize) => slidingSize(self, chunkSize, 1));
var slidingSize = /* @__PURE__ */ dual(3, (self, chunkSize, stepSize) => transformPull2(self, (upstream, _scope) => sync3(() => {
  let cause = null;
  const list2 = make8();
  let emitted = false;
  let skip = 0;
  const pull = matchCauseEffect2(upstream, {
    onSuccess(arr) {
      appendAllUnsafe(list2, arr);
      if (skip > 0) {
        const length = list2.length;
        takeNVoid(list2, skip);
        skip = Math.max(0, skip - length);
      }
      if (list2.length < chunkSize) return pull;
      emitted = true;
      const chunks2 = [];
      while (list2.length >= chunkSize) {
        if (chunkSize === stepSize) {
          chunks2.push(takeN(list2, chunkSize));
        } else {
          chunks2.push(toArrayN(list2, chunkSize));
          if (chunkSize === 1 && stepSize <= 0) {
            take(list2);
          } else {
            const length = list2.length;
            takeNVoid(list2, stepSize);
            skip = Math.max(0, stepSize - length);
          }
        }
      }
      return succeed6(chunks2);
    },
    onFailure(cause_) {
      if (emitted) takeNVoid(list2, chunkSize - stepSize);
      if (list2.length === 0) return failCause4(cause_);
      cause = cause_;
      return succeed6(of(takeAll(list2)));
    }
  });
  return suspend3(() => cause ? failCause4(cause) : pull);
})));
var split = /* @__PURE__ */ dual(2, (self, predicate) => mapAccumArray(self, empty, (acc, arr) => {
  const out2 = empty();
  for (let i = 0; i < arr.length; i++) {
    if (predicate(arr[i])) {
      if (isArrayNonEmpty2(acc)) {
        out2.push(acc);
        acc = [];
      }
    } else {
      acc.push(arr[i]);
    }
  }
  return [acc, out2];
}, {
  onHalt(arr) {
    return isArrayNonEmpty2(arr) ? of(arr) : emptyArr;
  }
}));
var combine3 = /* @__PURE__ */ dual(4, (self, that, s2, f) => combine2(flattenArray(self.channel), flattenArray(that.channel), s2, f).pipe(map7(of), fromChannel3));
var combineArray = /* @__PURE__ */ dual(4, (self, that, s2, f) => fromChannel3(combine2(self.channel, that.channel, s2, f)));
var mapAccum2 = /* @__PURE__ */ dual((args2) => isStream(args2[0]), (self, initial, f, options) => fromChannel3(mapAccum(self.channel, initial, (state, arr) => {
  const acc = empty();
  for (let index = 0; index < arr.length; index++) {
    const [newState, values] = f(state, arr[index]);
    state = newState;
    acc.push(...values);
  }
  return [state, isArrayNonEmpty2(acc) ? of(acc) : emptyArr];
}, options?.onHalt ? {
  onHalt(state) {
    const arr = options.onHalt(state);
    return isReadonlyArrayNonEmpty(arr) ? of(arr) : emptyArr;
  }
} : void 0)));
var mapAccumArray = /* @__PURE__ */ dual((args2) => isStream(args2[0]), (self, initial, f, options) => fromChannel3(mapAccum(self.channel, initial, (state, arr) => {
  const [newState, values] = f(state, arr);
  state = newState;
  return [state, isReadonlyArrayNonEmpty(values) ? of(values) : emptyArr];
}, options?.onHalt ? {
  onHalt(state) {
    const arr = options.onHalt(state);
    return isReadonlyArrayNonEmpty(arr) ? of(arr) : emptyArr;
  }
} : void 0)));
var emptyArr = /* @__PURE__ */ empty();
var mapAccumEffect = /* @__PURE__ */ dual((args2) => isStream(args2[0]), (self, initial, f, options) => self.channel.pipe(flattenArray, mapAccum(initial, (state, a) => map6(f(state, a), ([state2, values]) => [state2, isReadonlyArrayNonEmpty(values) ? of(values) : empty()]), options?.onHalt ? {
  onHalt(state) {
    const arr = options.onHalt(state);
    return isReadonlyArrayNonEmpty(arr) ? of(arr) : emptyArr;
  }
} : void 0), fromChannel3));
var mapAccumArrayEffect = /* @__PURE__ */ dual((args2) => isStream(args2[0]), (self, initial, f, options) => self.channel.pipe(mapAccum(initial, (state, a) => map6(f(state, a), ([state2, values]) => [state2, isReadonlyArrayNonEmpty(values) ? of(values) : emptyArr]), options?.onHalt ? {
  onHalt(state) {
    const arr = options.onHalt(state);
    return isReadonlyArrayNonEmpty(arr) ? of(arr) : emptyArr;
  }
} : void 0), fromChannel3));
var scan = /* @__PURE__ */ dual(3, (self, initial, f) => suspend5(() => {
  let isFirst = true;
  return fromChannel3(mapAccum(self.channel, constant(initial), (state, arr) => {
    const states = empty();
    if (isFirst) {
      isFirst = false;
      states.push(state);
    }
    for (let index = 0; index < arr.length; index++) {
      state = f(state, arr[index]);
      states.push(state);
    }
    return [state, of(states)];
  }));
}));
var scanEffect2 = /* @__PURE__ */ dual(3, (self, initial, f) => self.channel.pipe(flattenArray, scanEffect(initial, f), map7(of), fromChannel3));
var debounce = /* @__PURE__ */ dual(2, (self, duration) => transformPull2(self, fnUntraced2(function* (pull, scope3) {
  const clock = yield* Clock;
  const durationMs = toMillis(fromInputUnsafe(duration));
  let lastArr;
  let cause;
  let emitAtMs = Infinity;
  const pullLatch = makeUnsafe4();
  const emitLatch = makeUnsafe4();
  const endLatch = makeUnsafe4();
  yield* pull.pipe(pullLatch.whenOpen, flatMap4((arr) => {
    emitLatch.openUnsafe();
    lastArr = arr;
    emitAtMs = clock.currentTimeMillisUnsafe() + durationMs;
    return void_3;
  }), forever4({
    disableYield: true
  }), onError2((cause_) => {
    cause = cause_;
    emitAtMs = clock.currentTimeMillisUnsafe();
    emitLatch.openUnsafe();
    endLatch.openUnsafe();
    return void_3;
  }), forkIn2(scope3));
  const sleepLoop = suspend3(function loop() {
    const now2 = clock.currentTimeMillisUnsafe();
    const timeMs = emitAtMs < now2 ? durationMs : Math.min(durationMs, emitAtMs - now2);
    return flatMap4(raceFirst2(sleep2(timeMs), endLatch.await), () => {
      const now3 = clock.currentTimeMillisUnsafe();
      if (now3 < emitAtMs) {
        return loop();
      } else if (lastArr) {
        emitLatch.closeUnsafe();
        pullLatch.closeUnsafe();
        const eff = succeed6(of(lastNonEmpty(lastArr)));
        lastArr = void 0;
        return eff;
      } else if (cause) {
        return failCause4(cause);
      }
      return loop();
    });
  });
  return suspend3(() => {
    if (cause) {
      if (lastArr) {
        const eff = succeed6(of(lastNonEmpty(lastArr)));
        lastArr = void 0;
        return eff;
      }
      return failCause4(cause);
    }
    pullLatch.openUnsafe();
    return emitLatch.whenOpen(sleepLoop);
  });
})));
var throttleEffect = /* @__PURE__ */ dual(2, (self, options) => {
  const burst = options.burst ?? 0;
  if (options.strategy === "enforce") {
    return throttleEnforceEffect(self, options.cost, options.units, options.duration, burst);
  }
  return throttleShapeEffect(self, options.cost, options.units, options.duration, burst);
});
var throttleEnforceEffect = (self, cost, units, duration, burst) => transformPull2(self, (pull) => clockWith2((clock) => {
  const durationMs = toMillis(fromInputUnsafe(duration));
  const max2 = units + burst < 0 ? Number.POSITIVE_INFINITY : units + burst;
  let tokens = units;
  let timestampMs = clock.currentTimeMillisUnsafe();
  return succeed6(flatMap4(pull, function loop(arr) {
    return flatMap4(cost(arr), (weight) => {
      const currentMs = clock.currentTimeMillisUnsafe();
      const elapsed = currentMs - timestampMs;
      const cycles = elapsed / durationMs;
      const sum2 = tokens + cycles * units;
      const available = sum2 < 0 ? max2 : Math.min(sum2, max2);
      if (weight <= available) {
        tokens = available - weight;
        timestampMs = currentMs;
        return succeed6(arr);
      }
      return flatMap4(pull, loop);
    });
  }));
}));
var throttleShapeEffect = (self, cost, units, duration, burst) => transformPull2(self, (pull) => clockWith2((clock) => {
  const durationMs = toMillis(fromInputUnsafe(duration));
  const max2 = units + burst < 0 ? Number.POSITIVE_INFINITY : units + burst;
  let tokens = units;
  let timestampMs = clock.currentTimeMillisUnsafe();
  return succeed6(flatMap4(pull, (arr) => flatMap4(cost(arr), (weight) => {
    const currentMs = clock.currentTimeMillisUnsafe();
    const elapsed = currentMs - timestampMs;
    const cycles = elapsed / durationMs;
    const sum2 = tokens + cycles * units;
    const available = sum2 < 0 ? max2 : Math.min(sum2, max2);
    const remaining = available - weight;
    if (remaining >= 0) {
      tokens = remaining;
      timestampMs = currentMs;
      return succeed6(arr);
    }
    const waitCycles = -remaining / units;
    const delayMs = Math.max(0, waitCycles * durationMs);
    if (delayMs > 0) {
      return flatMap4(sleep2(delayMs), () => {
        tokens = remaining;
        timestampMs = currentMs;
        return succeed6(arr);
      });
    }
    tokens = remaining;
    timestampMs = currentMs;
    return succeed6(arr);
  })));
}));
var throttle = /* @__PURE__ */ dual(2, (self, options) => throttleEffect(self, {
  ...options,
  cost: (arr) => succeed6(options.cost(arr))
}));
var grouped = /* @__PURE__ */ dual(2, (self, n) => chunks(rechunk(self, n)));
var groupedWithin = /* @__PURE__ */ dual(3, (self, chunkSize, duration) => aggregateWithin(self, take4(chunkSize), spaced(duration)));
var groupBy = /* @__PURE__ */ dual((args2) => isStream(args2[0]), (self, f, options) => groupByImpl(self, fnUntraced2(function* (arr, queues, queueMap) {
  for (let i = 0; i < arr.length; i++) {
    const [key, value] = yield* f(arr[i]);
    const oentry = get2(queueMap, key);
    const queue = isSome2(oentry) ? oentry.value : yield* scoped2(get4(queues, key));
    yield* touch(queues, key);
    yield* offer(queue, value);
  }
}), options));
var groupByKey = /* @__PURE__ */ dual((args2) => isStream(args2[0]), (self, f, options) => suspend5(() => {
  const batch = empty4();
  return groupByImpl(self, fnUntraced2(function* (arr, queues, queueMap) {
    for (let i = 0; i < arr.length; i++) {
      const key = f(arr[i]);
      const ovalues = get2(batch, key);
      if (isNone2(ovalues)) {
        set(batch, key, [arr[i]]);
      } else {
        ovalues.value.push(arr[i]);
      }
    }
    for (const [key, values] of batch) {
      const oentry = get2(queueMap, key);
      const queue = isSome2(oentry) ? oentry.value : yield* scoped2(get4(queues, key));
      yield* touch(queues, key);
      yield* offerAll(queue, values);
    }
    clear(batch);
  }), options);
}));
var groupByImpl = (self, f, options) => transformPullBracket(self, fnUntraced2(function* (pull, scope3, forkedScope) {
  const out2 = yield* unbounded2();
  yield* addFinalizer2(scope3, shutdown2(out2));
  const queueMap = empty4();
  const queues = yield* make14({
    lookup: (key) => acquireRelease2(make10({
      capacity: options?.bufferSize ?? 4096
    }).pipe(tap3((queue) => {
      set(queueMap, key, queue);
      return offer(out2, [key, fromQueue(queue)]);
    })), (queue) => {
      remove(queueMap, key);
      return end(queue);
    }),
    idleTimeToLive: options?.idleTimeToLive ?? infinity
  }).pipe(provide(forkedScope));
  yield* whileLoop2({
    while: constTrue,
    body: constant(flatMap4(pull, (arr) => f(arr, queues, queueMap))),
    step: constVoid
  }).pipe(catchCause3((cause) => failCause5(out2, cause)), forkIn2(scope3));
  return takeAll3(out2);
}));
var groupAdjacentBy = /* @__PURE__ */ dual(2, (self, f) => transformPull2(self, (pull, _scope) => sync3(() => {
  let currentKey = void 0;
  let group;
  let toEmit = empty();
  const loop = pull.pipe(flatMap4((chunk) => {
    for (let i = 0; i < chunk.length; i++) {
      const item = chunk[i];
      const key = f(item);
      if (group === void 0) {
        currentKey = key;
        group = [item];
        continue;
      } else if (equals(key, currentKey)) {
        group.push(item);
        continue;
      }
      toEmit.push([currentKey, group]);
      currentKey = key;
      group = [item];
    }
    if (isArrayNonEmpty2(toEmit)) {
      const out2 = toEmit;
      toEmit = [];
      return succeed6(out2);
    }
    return loop;
  }));
  let done4 = false;
  return catchDone(suspend3(() => done4 ? done2() : loop), () => {
    done4 = true;
    const out2 = group;
    group = void 0;
    return out2 && isArrayNonEmpty2(out2) ? succeed6(of([currentKey, out2])) : done2();
  });
})));
var transduce = /* @__PURE__ */ dual(2, (self, sink) => transformPull2(self, (upstream, scope3) => sync3(() => {
  let done4;
  let leftover;
  const upstreamWithLeftover = suspend3(() => {
    if (leftover !== void 0) {
      const chunk = leftover;
      leftover = void 0;
      return succeed6(chunk);
    }
    return upstream;
  }).pipe(catch_3((error) => {
    done4 = fail5(error);
    return done2();
  }));
  const pull = map6(suspend3(() => sink.transform(upstreamWithLeftover, scope3)), ([value, leftover_]) => {
    leftover = leftover_;
    return of(value);
  });
  return suspend3(() => done4 ? done4 : pull);
})));
var aggregate = /* @__PURE__ */ dual(2, (self, sink) => aggregateWithin(self, sink, forever3));
var aggregateWithin = /* @__PURE__ */ dual(3, (self, sink, schedule4) => fromChannel3(fromTransformBracket(fnUntraced2(function* (_upstream, _, scope3) {
  const pull = yield* toPullScoped(self.channel, _);
  const pullLatch = makeUnsafe4(false);
  const scheduleStep = /* @__PURE__ */ Symbol();
  const buffer3 = yield* make10({
    capacity: 0
  });
  yield* pull.pipe(
    pullLatch.whenOpen,
    flatMap4((arr) => {
      pullLatch.closeUnsafe();
      return offer(buffer3, arr);
    }),
    forever4,
    // don't disable autoYield to prevent choking the schedule
    catchCause3((cause) => failCause5(buffer3, cause)),
    forkIn2(scope3)
  );
  let lastOutput = none2();
  let leftover;
  let sinkHasInput = false;
  const step = yield* toStepWithSleep(schedule4);
  const stepLoop = suspend3(function loop() {
    return flatMap4(step(lastOutput), () => !sinkHasInput ? loop() : offer(buffer3, scheduleStep));
  });
  const stepToBuffer = stepLoop.pipe(flatMap4(() => never2), catchDone(() => done2()));
  const pullFromBuffer = take3(buffer3).pipe(flatMap4((arr) => {
    if (arr === scheduleStep) {
      return done2();
    }
    sinkHasInput = true;
    return succeed6(arr);
  }));
  const sinkUpstream = suspend3(() => {
    if (leftover !== void 0) {
      const chunk = leftover;
      leftover = void 0;
      sinkHasInput = true;
      return succeed6(chunk);
    }
    pullLatch.openUnsafe();
    return pullFromBuffer;
  });
  const catchSinkHalt = flatMap4(([value, leftover_]) => {
    if (!sinkHasInput && buffer3.state._tag === "Done") return done2();
    lastOutput = some2(value);
    leftover = leftover_;
    return succeed6(of(value));
  });
  return suspend3(() => {
    if (buffer3.state._tag === "Done" && leftover === void 0) {
      return buffer3.state.exit;
    }
    sinkHasInput = leftover !== void 0;
    return succeed6(suspend3(() => sink.transform(sinkUpstream, scope3)));
  }).pipe(flatMap4((pull2) => raceFirst2(catchSinkHalt(pull2), stepToBuffer)));
}))));
var broadcastN = /* @__PURE__ */ dual(2, /* @__PURE__ */ fnUntraced2(function* (self, options) {
  const pubsub = yield* makePubSub2(options);
  const streams = new Array(options.n);
  const parentScope = yield* Scope;
  for (let i = 0; i < options.n; i++) {
    const scope3 = forkUnsafe2(parentScope);
    const subscription = yield* subscribe(pubsub).pipe(provideService2(Scope, scope3));
    streams[i] = fromEffectTake(take2(subscription)).pipe(onExit3((exit3) => close(scope3, exit3)), fromChannel3);
  }
  yield* runForEach(self.channel, (value) => publish(pubsub, value)).pipe(onExit2((exit3) => publish(pubsub, exit3)), forkScoped2);
  return streams;
}));
var makePubSub2 = (options) => acquireRelease2(options.capacity === "unbounded" ? unbounded(options) : options.strategy === "dropping" ? dropping(options) : options.strategy === "sliding" ? sliding(options) : bounded(options), shutdown);
var broadcast = /* @__PURE__ */ dual(2, (self, options) => map6(toPubSubTake2(self, options), fromPubSubTake2));
var share = /* @__PURE__ */ dual(2, (self, options) => map6(make16({
  acquire: broadcast(self, options),
  idleTimeToLive: options.idleTimeToLive
}), (ref) => unwrap4(get6(ref))));
var pipeThroughChannel = /* @__PURE__ */ dual(2, (self, channel) => fromChannel3(pipeTo(self.channel, channel)));
var pipeThroughChannelOrFail = /* @__PURE__ */ dual(2, (self, channel) => fromChannel3(pipeToOrFail(self.channel, channel)));
var pipeThrough = /* @__PURE__ */ dual(2, (self, sink) => self.channel.pipe(pipeToOrFail(toChannel(sink)), concatWith(([_, leftover]) => leftover ? succeed8(leftover) : empty5), fromChannel3));
var collect = (self) => fromEffect2(runCollect(self));
var accumulate = (self) => mapAccumArray(self, empty, (acc, as3) => {
  const combined = appendAll(acc, as3);
  return [combined, [combined]];
});
var changes = (self) => changesWith(self, equals);
var changesWith = /* @__PURE__ */ dual(2, (self, f) => transformPull2(self, (pull, _scope) => sync3(() => {
  let first = true;
  let last;
  return flatMap4(pull, function loop(arr) {
    const out2 = [];
    let i = 0;
    if (first) {
      first = false;
      last = arr[0];
      i = 1;
      out2.push(last);
    }
    for (; i < arr.length; i++) {
      const a = arr[i];
      if (f(a, last)) continue;
      last = a;
      out2.push(a);
    }
    return isArrayNonEmpty2(out2) ? succeed6(out2) : flatMap4(pull, loop);
  });
})));
var changesWithEffect = /* @__PURE__ */ dual(2, (self, f) => transformPull2(self, (pull, _scope) => sync3(() => {
  let first = true;
  let last;
  return flatMap4(pull, fnUntraced2(function* loop(arr) {
    const out2 = [];
    let i = 0;
    if (first) {
      first = false;
      last = arr[0];
      i = 1;
      out2.push(last);
    }
    for (; i < arr.length; i++) {
      const a = arr[i];
      if (yield* f(a, last)) continue;
      last = a;
      out2.push(a);
    }
    return isArrayNonEmpty2(out2) ? out2 : yield* flatMap4(pull, fnUntraced2(loop));
  }));
})));
var decodeText = /* @__PURE__ */ dual((args2) => isStream(args2[0]), (self, options) => suspend5(() => {
  const decoder = new TextDecoder(options?.encoding);
  return map8(self, (chunk) => decoder.decode(chunk, {
    stream: true
  }));
}));
var encodeText = (self) => suspend5(() => {
  const encoder2 = new TextEncoder();
  return map8(self, (chunk) => encoder2.encode(chunk));
});
var splitLines2 = (self) => self.channel.pipe(pipeTo(splitLines()), fromChannel3);
var intersperse = /* @__PURE__ */ dual(2, (self, element) => mapArray(self, (arr, i) => {
  const out2 = i === 0 ? [] : [element];
  const lastIndex = arr.length - 1;
  for (let j = 0; j < arr.length; j++) {
    if (j === lastIndex) {
      out2.push(arr[j]);
    } else {
      out2.push(arr[j], element);
    }
  }
  return out2;
}));
var intersperseAffixes = /* @__PURE__ */ dual(2, (self, options) => succeed9(options.start).pipe(concat(intersperse(self, options.middle)), concat(succeed9(options.end))));
var interleave = /* @__PURE__ */ dual(2, (self, that) => interleaveWith(self, that, fromIterable2(forever([true, false]))));
var interleaveWith = /* @__PURE__ */ dual(3, (self, that, decider) => fromChannel3(fromTransform(fnUntraced2(function* (upstream, scope3) {
  const pullDecider = yield* toTransform(flattenArray(decider.channel))(upstream, scope3);
  const retry5 = /* @__PURE__ */ Symbol();
  let leftDone = false;
  let rightDone = false;
  const pullLeft = (yield* toTransform(flattenArray(self.channel))(upstream, scope3)).pipe(catchDone(() => {
    leftDone = true;
    return succeed6(retry5);
  }));
  const pullRight = (yield* toTransform(flattenArray(that.channel))(upstream, scope3)).pipe(catchDone(() => {
    rightDone = true;
    return succeed6(retry5);
  }));
  return gen2(function* () {
    while (true) {
      if (leftDone && rightDone) {
        return yield* done2();
      }
      const side = yield* pullDecider;
      if (side && leftDone) continue;
      if (!side && rightDone) continue;
      const elem = yield* side ? pullLeft : pullRight;
      if (elem === retry5) continue;
      return of(elem);
    }
  });
}))));
var interruptWhen2 = /* @__PURE__ */ dual(2, (self, effect2) => fromChannel3(interruptWhen(self.channel, effect2)));
var haltWhen2 = /* @__PURE__ */ dual(2, (self, effect2) => fromChannel3(haltWhen(self.channel, effect2)));
var onExit4 = /* @__PURE__ */ dual(2, (self, finalizer) => fromChannel3(onExit3(self.channel, finalizer)));
var onError4 = /* @__PURE__ */ dual(2, (self, cleanup) => fromChannel3(onError3(self.channel, cleanup)));
var onStart2 = /* @__PURE__ */ dual(2, (self, onStart3) => fromChannel3(onStart(self.channel, onStart3)));
var onFirst2 = /* @__PURE__ */ dual(2, (self, onFirst3) => fromChannel3(onFirst(self.channel, (arr) => onFirst3(arr[0]))));
var onEnd2 = /* @__PURE__ */ dual(2, (self, onEnd3) => fromChannel3(onEnd(self.channel, onEnd3)));
var ensuring4 = /* @__PURE__ */ dual(2, (self, finalizer) => fromChannel3(ensuring3(self.channel, finalizer)));
var provide6 = /* @__PURE__ */ dual((args2) => isStream(args2[0]), (self, layer14, options) => fromChannel3(provide5(self.channel, layer14, options)));
var provideContext4 = /* @__PURE__ */ dual(2, (self, context3) => fromChannel3(provideContext3(self.channel, context3)));
var provideService4 = /* @__PURE__ */ dual(3, (self, key, service4) => fromChannel3(provideService3(self.channel, key, service4)));
var provideServiceEffect4 = /* @__PURE__ */ dual(3, (self, key, service4) => fromChannel3(provideServiceEffect3(self.channel, key, service4)));
var updateContext4 = /* @__PURE__ */ dual(2, (self, f) => fromChannel3(updateContext3(self.channel, f)));
var updateService4 = /* @__PURE__ */ dual(3, (self, service4, f) => updateContext4(self, (context3) => add(context3, service4, f(get(context3, service4)))));
var withSpan5 = function() {
  const dataFirst = isStream(arguments[0]);
  const name = dataFirst ? arguments[1] : arguments[0];
  const options = addSpanStackTrace(dataFirst ? arguments[2] : arguments[1]);
  if (dataFirst) {
    const self = arguments[0];
    return fromChannel3(withSpan4(self.channel, name, options));
  }
  return (self) => fromChannel3(withSpan4(self.channel, name, options));
};
var Do3 = /* @__PURE__ */ succeed9({});
var let_4 = /* @__PURE__ */ dual(3, (self, name, f) => map8(self, (a) => ({
  ...a,
  [name]: f(a)
})));
var bind4 = /* @__PURE__ */ dual((args2) => isStream(args2[0]), (self, tag2, f, options) => flatMap6(self, (a) => map8(f(a), (b) => ({
  ...a,
  [tag2]: b
})), options));
var bindEffect = /* @__PURE__ */ dual((args2) => isStream(args2[0]), (self, tag2, f, options) => mapEffect2(self, (a) => map6(f(a), (b) => ({
  ...a,
  [tag2]: b
})), options));
var bindTo4 = /* @__PURE__ */ dual(2, (self, name) => map8(self, (a) => ({
  [name]: a
})));
var run = /* @__PURE__ */ dual(2, (self, sink) => scopedWith2((scope3) => toPullScoped(self.channel, scope3).pipe(flatMap4((upstream) => sink.transform(upstream, scope3)), map6(([a]) => a))));
var runCollect = (self) => runFold(self.channel, () => [], (acc, chunk) => {
  for (let i = 0; i < chunk.length; i++) {
    acc.push(chunk[i]);
  }
  return acc;
});
var runCount = (self) => runFold(self.channel, () => 0, (acc, chunk) => acc + chunk.length);
var runSum = (self) => runFold(self.channel, () => 0, (acc, chunk) => {
  for (let i = 0; i < chunk.length; i++) {
    acc += chunk[i];
  }
  return acc;
});
var runFold2 = /* @__PURE__ */ dual(3, (self, initial, f) => runFold(self.channel, initial, (acc, arr) => {
  for (let i = 0; i < arr.length; i++) {
    acc = f(acc, arr[i]);
  }
  return acc;
}));
var runFoldEffect2 = /* @__PURE__ */ dual(3, (self, initial, f) => runFoldEffect(self.channel, initial, (acc, arr) => {
  let i = 0;
  let s2 = acc;
  return map6(whileLoop2({
    while: () => i < arr.length,
    body: () => f(s2, arr[i]),
    step(z) {
      s2 = z;
      i++;
    }
  }), () => s2);
}));
var runHead2 = (self) => map6(runHead(self.channel), map(getUnsafe(0)));
var runLast2 = (self) => map6(runLast(self.channel), map(lastNonEmpty));
var runForEach2 = /* @__PURE__ */ dual(2, (self, f) => runForEach(self.channel, (arr) => {
  let i = 0;
  return whileLoop2({
    while: () => i < arr.length,
    body: () => f(arr[i++]),
    step: constVoid
  });
}));
var runForEachWhile2 = /* @__PURE__ */ dual(2, (self, f) => runForEachWhile(self.channel, (arr) => {
  let done4 = false;
  let i = 0;
  return map6(whileLoop2({
    while: () => !done4 && i < arr.length,
    body: () => f(arr[i]),
    step(b) {
      i++;
      if (!b) done4 = true;
    }
  }), () => !done4);
}));
var runForEachArray = /* @__PURE__ */ dual(2, (self, f) => runForEach(self.channel, f));
var runDrain2 = (self) => runDrain(self.channel);
var toPull3 = (self) => toPull2(self.channel);
var mkString = (self) => runFold(self.channel, () => "", (acc, chunk) => acc + chunk.join(""));
var mkArrayBuffer = (self) => map6(mkUint8Array(self.channel), (bytes) => bytes.buffer);
var mkUint8Array2 = (self) => mkUint8Array(self.channel);
var toReadableStreamWith = /* @__PURE__ */ dual((args2) => isStream(args2[0]), (self, context3, options) => {
  let currentResolve = void 0;
  let fiber3 = void 0;
  const latch = makeUnsafe4(false);
  return new ReadableStream({
    start(controller) {
      fiber3 = runFork2(provideContext2(runForEachArray(self, (chunk) => latch.whenOpen(sync3(() => {
        latch.closeUnsafe();
        for (let i = 0; i < chunk.length; i++) {
          controller.enqueue(chunk[i]);
        }
        currentResolve();
        currentResolve = void 0;
      }))), context3));
      fiber3.addObserver((exit3) => {
        if (exit3._tag === "Failure") {
          controller.error(squash(exit3.cause));
        } else {
          controller.close();
        }
      });
    },
    pull() {
      return new Promise((resolve6) => {
        currentResolve = resolve6;
        latch.openUnsafe();
      });
    },
    cancel() {
      if (!fiber3) return;
      return runPromise2(asVoid2(interrupt4(fiber3)));
    }
  }, options?.strategy);
});
var toReadableStream = /* @__PURE__ */ dual((args2) => isStream(args2[0]), (self, options) => toReadableStreamWith(self, empty2(), options));
var toReadableStreamEffect = /* @__PURE__ */ dual((args2) => isStream(args2[0]), (self, options) => map6(context2(), (context3) => toReadableStreamWith(self, context3, options)));
var toAsyncIterableWith = /* @__PURE__ */ dual(2, (self, context3) => ({
  [Symbol.asyncIterator]() {
    const runPromise3 = runPromiseWith2(context3);
    const runFork3 = runForkWith2(context3);
    const scope3 = makeUnsafe3();
    let pull;
    let currentIter;
    let currentFiber;
    let closePromise;
    const close3 = (exit3) => {
      if (closePromise) return closePromise;
      const fiber3 = currentFiber;
      closePromise = runPromise3(as2(andThen2(fiber3 ? interrupt4(fiber3) : void_3, close(scope3, exit3)), {
        done: true,
        value: void 0
      }));
      return closePromise;
    };
    const closeAndReportError = async (exit3) => {
      try {
        await close3(exit3);
      } catch (error) {
        await runPromise3(logError("Suppressed error while closing Stream async iterator", error));
      }
    };
    return {
      async next() {
        if (closePromise) return closePromise;
        if (currentIter) {
          const next = currentIter.next();
          if (!next.done) return next;
          currentIter = void 0;
        }
        const fiber3 = runFork3(pull ?? flatMap4(toPullScoped(self.channel, scope3), (nextPull) => {
          pull = nextPull;
          return nextPull;
        }));
        currentFiber = fiber3;
        const exit3 = await runPromise3(await_(fiber3));
        if (currentFiber === fiber3) {
          currentFiber = void 0;
        }
        if (isSuccess4(exit3)) {
          currentIter = exit3.value[Symbol.iterator]();
          return currentIter.next();
        } else if (isDoneCause(exit3.cause)) {
          return close3(void_2);
        }
        if (closePromise && hasInterruptsOnly2(exit3.cause)) {
          return closePromise;
        }
        await closeAndReportError(exit3);
        throw squash(exit3.cause);
      },
      return() {
        return close3(void_2);
      },
      async throw(error) {
        await closeAndReportError(die3(error));
        throw error;
      }
    };
  }
}));
var toAsyncIterableEffect = (self) => map6(context2(), (context3) => toAsyncIterableWith(self, context3));
var toAsyncIterable = (self) => toAsyncIterableWith(self, empty2());
var runIntoPubSub = /* @__PURE__ */ dual((args2) => isStream(args2[0]), (self, pubsub, options) => runIntoPubSubArray(self.channel, pubsub, options));
var toPubSub = /* @__PURE__ */ dual(2, (self, options) => toPubSubArray(self.channel, options));
var toPubSubTake2 = /* @__PURE__ */ dual(2, (self, options) => toPubSubTake(self.channel, options));
var toQueue = /* @__PURE__ */ dual(2, (self, options) => toQueueArray(self.channel, options));
var runIntoQueue = /* @__PURE__ */ dual(2, (self, queue) => runIntoQueueArray(self.channel, queue));

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/FileSystem.js
var TypeId28 = "~effect/platform/FileSystem";
var Size = (bytes) => typeof bytes === "bigint" ? bytes : BigInt(bytes);
var KiB = (n) => Size(n * 1024);
var MiB = (n) => Size(n * 1024 * 1024);
var GiB = (n) => Size(n * 1024 * 1024 * 1024);
var TiB = (n) => Size(n * 1024 * 1024 * 1024 * 1024);
var bigint1024 = /* @__PURE__ */ BigInt(1024);
var bigintPiB = bigint1024 * bigint1024 * bigint1024 * bigint1024 * bigint1024;
var PiB = (n) => Size(BigInt(n) * bigintPiB);
var FileSystem = /* @__PURE__ */ Service("effect/platform/FileSystem");
var make18 = (impl) => FileSystem.of({
  ...impl,
  [TypeId28]: TypeId28,
  exists: (path) => pipe(impl.access(path), as2(true), catchTag3("PlatformError", (e) => e.reason._tag === "NotFound" ? succeed6(false) : fail6(e))),
  readFileString: (path, encoding) => flatMap4(impl.readFile(path), (_) => try_2({
    try: () => new TextDecoder(encoding).decode(_),
    catch: (cause) => badArgument({
      module: "FileSystem",
      method: "readFileString",
      description: "invalid encoding",
      cause
    })
  })),
  stream: fnUntraced2(function* (path, options) {
    const file = yield* impl.open(path, {
      flag: "r"
    });
    if (options?.offset) {
      yield* file.seek(options.offset, "start");
    }
    const bytesToRead = options?.bytesToRead !== void 0 ? Size(options.bytesToRead) : void 0;
    let totalBytesRead = BigInt(0);
    const chunkSize = Size(options?.chunkSize ?? 64 * 1024);
    const readChunk = file.readAlloc(chunkSize);
    return fromPull2(succeed6(flatMap4(suspend3(() => {
      if (bytesToRead !== void 0 && bytesToRead <= totalBytesRead) {
        return done2();
      }
      return bytesToRead !== void 0 && bytesToRead - totalBytesRead < chunkSize ? file.readAlloc(bytesToRead - totalBytesRead) : readChunk;
    }), match({
      onNone: () => done2(),
      onSome: (buf) => {
        totalBytesRead += BigInt(buf.length);
        return succeed6(of(buf));
      }
    }))));
  }, unwrap4),
  sink: (path, options) => pipe(impl.open(path, {
    flag: "w",
    ...options
  }), map6((file) => forEach3((_) => file.writeAll(_))), unwrap3),
  writeFileString: (path, data, options) => flatMap4(try_2({
    try: () => new TextEncoder().encode(data),
    catch: (cause) => badArgument({
      module: "FileSystem",
      method: "writeFileString",
      description: "could not encode string",
      cause
    })
  }), (_) => impl.writeFile(path, _, options))
});
var notFound2 = (method, path) => systemError({
  module: "FileSystem",
  method,
  _tag: "NotFound",
  description: "No such file or directory",
  pathOrDescriptor: path
});
var makeNoop = (fileSystem) => FileSystem.of({
  [TypeId28]: TypeId28,
  access(path) {
    return fail6(notFound2("access", path));
  },
  chmod(path) {
    return fail6(notFound2("chmod", path));
  },
  chown(path) {
    return fail6(notFound2("chown", path));
  },
  copy(path) {
    return fail6(notFound2("copy", path));
  },
  copyFile(path) {
    return fail6(notFound2("copyFile", path));
  },
  glob(pattern) {
    return fail6(notFound2("glob", pattern));
  },
  exists() {
    return succeed6(false);
  },
  link(path) {
    return fail6(notFound2("link", path));
  },
  makeDirectory() {
    return die4("not implemented");
  },
  makeTempDirectory() {
    return die4("not implemented");
  },
  makeTempDirectoryScoped() {
    return die4("not implemented");
  },
  makeTempFile() {
    return die4("not implemented");
  },
  makeTempFileScoped() {
    return die4("not implemented");
  },
  open(path) {
    return fail6(notFound2("open", path));
  },
  readDirectory(path) {
    return fail6(notFound2("readDirectory", path));
  },
  readFile(path) {
    return fail6(notFound2("readFile", path));
  },
  readFileString(path) {
    return fail6(notFound2("readFileString", path));
  },
  readLink(path) {
    return fail6(notFound2("readLink", path));
  },
  realPath(path) {
    return fail6(notFound2("realPath", path));
  },
  remove() {
    return void_3;
  },
  rename(oldPath) {
    return fail6(notFound2("rename", oldPath));
  },
  sink(path) {
    return fail8(notFound2("sink", path));
  },
  stat(path) {
    return fail6(notFound2("stat", path));
  },
  stream(path) {
    return fail9(notFound2("stream", path));
  },
  symlink(fromPath) {
    return fail6(notFound2("symlink", fromPath));
  },
  truncate(path) {
    return fail6(notFound2("truncate", path));
  },
  utimes(path) {
    return fail6(notFound2("utimes", path));
  },
  watch(path) {
    return fail9(notFound2("watch", path));
  },
  writeFile(path) {
    return fail6(notFound2("writeFile", path));
  },
  writeFileString(path) {
    return fail6(notFound2("writeFileString", path));
  },
  ...fileSystem
});
var layerNoop = (fileSystem) => succeed5(FileSystem)(makeNoop(fileSystem));
var FileTypeId = "~effect/platform/FileSystem/File";
var isFile = (u) => hasProperty(u, FileTypeId);
var WatchBackend = class extends (/* @__PURE__ */ Service()("effect/platform/FileSystem/WatchBackend")) {
};

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Path.js
var TypeId29 = "~effect/platform/Path";
var Path = /* @__PURE__ */ Service("effect/Path");
function normalizeStringPosix(path, allowAboveRoot) {
  let res = "";
  let lastSegmentLength = 0;
  let lastSlash = -1;
  let dots = 0;
  let code;
  for (let i = 0; i <= path.length; ++i) {
    if (i < path.length) {
      code = path.charCodeAt(i);
    } else if (code === 47) {
      break;
    } else {
      code = 47;
    }
    if (code === 47) {
      if (lastSlash === i - 1 || dots === 1) {
      } else if (lastSlash !== i - 1 && dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 || res.charCodeAt(res.length - 2) !== 46) {
          if (res.length > 2) {
            const lastSlashIndex = res.lastIndexOf("/");
            if (lastSlashIndex !== res.length - 1) {
              if (lastSlashIndex === -1) {
                res = "";
                lastSegmentLength = 0;
              } else {
                res = res.slice(0, lastSlashIndex);
                lastSegmentLength = res.length - 1 - res.lastIndexOf("/");
              }
              lastSlash = i;
              dots = 0;
              continue;
            }
          } else if (res.length === 2 || res.length === 1) {
            res = "";
            lastSegmentLength = 0;
            lastSlash = i;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          if (res.length > 0) {
            res += "/..";
          } else {
            res = "..";
          }
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0) {
          res += "/" + path.slice(lastSlash + 1, i);
        } else {
          res = path.slice(lastSlash + 1, i);
        }
        lastSegmentLength = i - lastSlash - 1;
      }
      lastSlash = i;
      dots = 0;
    } else if (code === 46 && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}
function _format(sep, pathObject) {
  const dir = pathObject.dir || pathObject.root;
  const base = pathObject.base || (pathObject.name || "") + (pathObject.ext || "");
  if (!dir) {
    return base;
  }
  if (dir === pathObject.root) {
    return dir + base;
  }
  return dir + sep + base;
}
function fromFileUrl(url) {
  if (url.protocol !== "file:") {
    return fail6(new BadArgument({
      module: "Path",
      method: "fromFileUrl",
      description: "URL must be of scheme file"
    }));
  } else if (url.hostname !== "") {
    return fail6(new BadArgument({
      module: "Path",
      method: "fromFileUrl",
      description: "Invalid file URL host"
    }));
  }
  const pathname = url.pathname;
  for (let n = 0; n < pathname.length; n++) {
    if (pathname[n] === "%") {
      const third = pathname.codePointAt(n + 2) | 32;
      if (pathname[n + 1] === "2" && third === 102) {
        return fail6(new BadArgument({
          module: "Path",
          method: "fromFileUrl",
          description: "must not include encoded / characters"
        }));
      }
    }
  }
  return succeed6(decodeURIComponent(pathname));
}
var resolve2 = function resolve3() {
  let resolvedPath = "";
  let resolvedAbsolute = false;
  let cwd = void 0;
  for (let i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    let path;
    if (i >= 0) {
      path = arguments[i];
    } else {
      const process2 = globalThis.process;
      if (cwd === void 0 && "process" in globalThis && typeof process2 === "object" && process2 !== null && typeof process2.cwd === "function") {
        cwd = process2.cwd();
      }
      path = cwd;
    }
    if (path.length === 0) {
      continue;
    }
    resolvedPath = path + "/" + resolvedPath;
    resolvedAbsolute = path.charCodeAt(0) === 47;
  }
  resolvedPath = normalizeStringPosix(resolvedPath, !resolvedAbsolute);
  if (resolvedAbsolute) {
    if (resolvedPath.length > 0) {
      return "/" + resolvedPath;
    } else {
      return "/";
    }
  } else if (resolvedPath.length > 0) {
    return resolvedPath;
  } else {
    return ".";
  }
};
var CHAR_FORWARD_SLASH = 47;
function toFileUrl(filepath) {
  const outURL = new URL("file://");
  let resolved = resolve2(filepath);
  const filePathLast = filepath.charCodeAt(filepath.length - 1);
  if (filePathLast === CHAR_FORWARD_SLASH && resolved[resolved.length - 1] !== "/") {
    resolved += "/";
  }
  outURL.pathname = encodePathChars(resolved);
  return succeed6(outURL);
}
var percentRegExp = /%/g;
var backslashRegExp = /\\/g;
var newlineRegExp = /\n/g;
var carriageReturnRegExp = /\r/g;
var tabRegExp = /\t/g;
function encodePathChars(filepath) {
  if (filepath.includes("%")) {
    filepath = filepath.replace(percentRegExp, "%25");
  }
  if (filepath.includes("\\")) {
    filepath = filepath.replace(backslashRegExp, "%5C");
  }
  if (filepath.includes("\n")) {
    filepath = filepath.replace(newlineRegExp, "%0A");
  }
  if (filepath.includes("\r")) {
    filepath = filepath.replace(carriageReturnRegExp, "%0D");
  }
  if (filepath.includes("	")) {
    filepath = filepath.replace(tabRegExp, "%09");
  }
  return filepath;
}
var posixImpl = /* @__PURE__ */ Path.of({
  [TypeId29]: TypeId29,
  resolve: resolve2,
  normalize(path) {
    if (path.length === 0) return ".";
    const isAbsolute2 = path.charCodeAt(0) === 47;
    const trailingSeparator = path.charCodeAt(path.length - 1) === 47;
    path = normalizeStringPosix(path, !isAbsolute2);
    if (path.length === 0 && !isAbsolute2) path = ".";
    if (path.length > 0 && trailingSeparator) path += "/";
    if (isAbsolute2) return "/" + path;
    return path;
  },
  isAbsolute(path) {
    return path.length > 0 && path.charCodeAt(0) === 47;
  },
  join() {
    if (arguments.length === 0) {
      return ".";
    }
    let joined;
    for (let i = 0; i < arguments.length; ++i) {
      const arg = arguments[i];
      if (arg.length > 0) {
        if (joined === void 0) {
          joined = arg;
        } else {
          joined += "/" + arg;
        }
      }
    }
    if (joined === void 0) {
      return ".";
    }
    return posixImpl.normalize(joined);
  },
  relative(from, to) {
    if (from === to) return "";
    from = posixImpl.resolve(from);
    to = posixImpl.resolve(to);
    if (from === to) return "";
    let fromStart = 1;
    for (; fromStart < from.length; ++fromStart) {
      if (from.charCodeAt(fromStart) !== 47) {
        break;
      }
    }
    const fromEnd = from.length;
    const fromLen = fromEnd - fromStart;
    let toStart = 1;
    for (; toStart < to.length; ++toStart) {
      if (to.charCodeAt(toStart) !== 47) {
        break;
      }
    }
    const toEnd = to.length;
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i = 0;
    for (; i <= length; ++i) {
      if (i === length) {
        if (toLen > length) {
          if (to.charCodeAt(toStart + i) === 47) {
            return to.slice(toStart + i + 1);
          } else if (i === 0) {
            return to.slice(toStart + i);
          }
        } else if (fromLen > length) {
          if (from.charCodeAt(fromStart + i) === 47) {
            lastCommonSep = i;
          } else if (i === 0) {
            lastCommonSep = 0;
          }
        }
        break;
      }
      const fromCode = from.charCodeAt(fromStart + i);
      const toCode = to.charCodeAt(toStart + i);
      if (fromCode !== toCode) {
        break;
      } else if (fromCode === 47) {
        lastCommonSep = i;
      }
    }
    let out2 = "";
    for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
      if (i === fromEnd || from.charCodeAt(i) === 47) {
        if (out2.length === 0) {
          out2 += "..";
        } else {
          out2 += "/..";
        }
      }
    }
    if (out2.length > 0) {
      return out2 + to.slice(toStart + lastCommonSep);
    } else {
      toStart += lastCommonSep;
      if (to.charCodeAt(toStart) === 47) {
        ++toStart;
      }
      return to.slice(toStart);
    }
  },
  dirname(path) {
    if (path.length === 0) return ".";
    let code = path.charCodeAt(0);
    const hasRoot = code === 47;
    let end3 = -1;
    let matchedSlash = true;
    for (let i = path.length - 1; i >= 1; --i) {
      code = path.charCodeAt(i);
      if (code === 47) {
        if (!matchedSlash) {
          end3 = i;
          break;
        }
      } else {
        matchedSlash = false;
      }
    }
    if (end3 === -1) return hasRoot ? "/" : ".";
    if (hasRoot && end3 === 1) return "//";
    return path.slice(0, end3);
  },
  basename(path, ext) {
    let start = 0;
    let end3 = -1;
    let matchedSlash = true;
    let i;
    if (ext !== void 0 && ext.length > 0 && ext.length <= path.length) {
      if (ext.length === path.length && ext === path) return "";
      let extIdx = ext.length - 1;
      let firstNonSlashEnd = -1;
      for (i = path.length - 1; i >= 0; --i) {
        const code = path.charCodeAt(i);
        if (code === 47) {
          if (!matchedSlash) {
            start = i + 1;
            break;
          }
        } else {
          if (firstNonSlashEnd === -1) {
            matchedSlash = false;
            firstNonSlashEnd = i + 1;
          }
          if (extIdx >= 0) {
            if (code === ext.charCodeAt(extIdx)) {
              if (--extIdx === -1) {
                end3 = i;
              }
            } else {
              extIdx = -1;
              end3 = firstNonSlashEnd;
            }
          }
        }
      }
      if (start === end3) end3 = firstNonSlashEnd;
      else if (end3 === -1) end3 = path.length;
      return path.slice(start, end3);
    } else {
      for (i = path.length - 1; i >= 0; --i) {
        if (path.charCodeAt(i) === 47) {
          if (!matchedSlash) {
            start = i + 1;
            break;
          }
        } else if (end3 === -1) {
          matchedSlash = false;
          end3 = i + 1;
        }
      }
      if (end3 === -1) return "";
      return path.slice(start, end3);
    }
  },
  extname(path) {
    let startDot = -1;
    let startPart = 0;
    let end3 = -1;
    let matchedSlash = true;
    let preDotState = 0;
    for (let i = path.length - 1; i >= 0; --i) {
      const code = path.charCodeAt(i);
      if (code === 47) {
        if (!matchedSlash) {
          startPart = i + 1;
          break;
        }
        continue;
      }
      if (end3 === -1) {
        matchedSlash = false;
        end3 = i + 1;
      }
      if (code === 46) {
        if (startDot === -1) {
          startDot = i;
        } else if (preDotState !== 1) {
          preDotState = 1;
        }
      } else if (startDot !== -1) {
        preDotState = -1;
      }
    }
    if (startDot === -1 || end3 === -1 || // We saw a non-dot character immediately before the dot
    preDotState === 0 || // The (right-most) trimmed path component is exactly '..'
    preDotState === 1 && startDot === end3 - 1 && startDot === startPart + 1) {
      return "";
    }
    return path.slice(startDot, end3);
  },
  format: function format2(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
      throw new TypeError('The "pathObject" argument must be of type Object. Received type ' + typeof pathObject);
    }
    return _format("/", pathObject);
  },
  parse(path) {
    const ret = {
      root: "",
      dir: "",
      base: "",
      ext: "",
      name: ""
    };
    if (path.length === 0) return ret;
    let code = path.charCodeAt(0);
    const isAbsolute2 = code === 47;
    let start;
    if (isAbsolute2) {
      ret.root = "/";
      start = 1;
    } else {
      start = 0;
    }
    let startDot = -1;
    let startPart = 0;
    let end3 = -1;
    let matchedSlash = true;
    let i = path.length - 1;
    let preDotState = 0;
    for (; i >= start; --i) {
      code = path.charCodeAt(i);
      if (code === 47) {
        if (!matchedSlash) {
          startPart = i + 1;
          break;
        }
        continue;
      }
      if (end3 === -1) {
        matchedSlash = false;
        end3 = i + 1;
      }
      if (code === 46) {
        if (startDot === -1) startDot = i;
        else if (preDotState !== 1) preDotState = 1;
      } else if (startDot !== -1) {
        preDotState = -1;
      }
    }
    if (startDot === -1 || end3 === -1 || // We saw a non-dot character immediately before the dot
    preDotState === 0 || // The (right-most) trimmed path component is exactly '..'
    preDotState === 1 && startDot === end3 - 1 && startDot === startPart + 1) {
      if (end3 !== -1) {
        if (startPart === 0 && isAbsolute2) ret.base = ret.name = path.slice(1, end3);
        else ret.base = ret.name = path.slice(startPart, end3);
      }
    } else {
      if (startPart === 0 && isAbsolute2) {
        ret.name = path.slice(1, startDot);
        ret.base = path.slice(1, end3);
      } else {
        ret.name = path.slice(startPart, startDot);
        ret.base = path.slice(startPart, end3);
      }
      ret.ext = path.slice(startDot, end3);
    }
    if (startPart > 0) ret.dir = path.slice(0, startPart - 1);
    else if (isAbsolute2) ret.dir = "/";
    return ret;
  },
  sep: "/",
  fromFileUrl,
  toFileUrl,
  toNamespacedPath: identity
});

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/internal/uuid.js
var hex = (byte) => byte.toString(16).padStart(2, "0");
var stringify = (bytes) => {
  const segments = [bytes.subarray(0, 4), bytes.subarray(4, 6), bytes.subarray(6, 8), bytes.subarray(8, 10), bytes.subarray(10, 16)];
  return segments.map((segment) => Array.from(segment, hex).join("")).join("-");
};
var randomBytes = () => globalThis.crypto.getRandomValues(new Uint8Array(16));
function v4Bytes(bytes = randomBytes()) {
  bytes[6] = bytes[6] & 15 | 64;
  bytes[8] = bytes[8] & 63 | 128;
  return bytes;
}
var v4String = (bytes) => stringify(bytes === void 0 ? v4Bytes() : v4Bytes(bytes));
var maxV7Timestamp = 2 ** 48 - 1;
function v7Bytes(timestampMillis, bytes = randomBytes()) {
  const timestamp = Math.min(Math.max(0, Math.trunc(timestampMillis)), maxV7Timestamp);
  bytes[0] = Math.floor(timestamp / 2 ** 40);
  bytes[1] = Math.floor(timestamp / 2 ** 32) & 255;
  bytes[2] = Math.floor(timestamp / 2 ** 24) & 255;
  bytes[3] = Math.floor(timestamp / 2 ** 16) & 255;
  bytes[4] = Math.floor(timestamp / 2 ** 8) & 255;
  bytes[5] = timestamp & 255;
  bytes[6] = bytes[6] & 15 | 112;
  bytes[8] = bytes[8] & 63 | 128;
  return bytes;
}
var v7String = (timestampMillis, bytes) => stringify(bytes === void 0 ? v7Bytes(timestampMillis) : v7Bytes(timestampMillis, bytes));

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Crypto.js
var TypeId30 = "~effect/platform/Crypto";
var Crypto = /* @__PURE__ */ Service("effect/Crypto");
var make19 = (impl) => {
  const randomBytesUnsafe = impl.randomBytes;
  const randomBytes5 = (size2) => map6(validateSize("randomBytes", size2), randomBytesUnsafe);
  const readUint53 = (bytes) => (bytes[0] & 31) * 2 ** 48 + bytes[1] * 2 ** 40 + bytes[2] * 2 ** 32 + bytes[3] * 2 ** 24 + bytes[4] * 2 ** 16 + bytes[5] * 2 ** 8 + bytes[6];
  const nextDoubleUnsafe = () => readUint53(randomBytesUnsafe(7)) / 2 ** 53;
  const nextIntUnsafe = () => {
    while (true) {
      const bytes = randomBytesUnsafe(7);
      const value = readUint53(bytes);
      if ((bytes[0] & 32) === 0) {
        return value + Number.MIN_SAFE_INTEGER;
      }
      if (value < Number.MAX_SAFE_INTEGER) {
        return value + 1;
      }
    }
  };
  return Crypto.of({
    [TypeId30]: TypeId30,
    randomBytes: randomBytes5,
    nextDoubleUnsafe,
    nextIntUnsafe,
    digest: impl.digest,
    random: sync3(() => nextDoubleUnsafe()),
    randomBoolean: sync3(() => nextDoubleUnsafe() > 0.5),
    randomInt: sync3(() => nextIntUnsafe()),
    randomBetween: (min2, max2) => sync3(() => nextDoubleUnsafe() * (max2 - min2) + min2),
    randomIntBetween(min2, max2, options) {
      const extra = options?.halfOpen === true ? 0 : 1;
      return sync3(() => {
        const minInt = Math.ceil(min2);
        const maxInt = Math.floor(max2);
        return Math.floor(nextDoubleUnsafe() * (maxInt - minInt + extra)) + minInt;
      });
    },
    randomShuffle: (elements) => sync3(() => {
      const buffer3 = Array.from(elements);
      for (let i = buffer3.length - 1; i >= 1; i = i - 1) {
        const index = Math.min(i, Math.floor(nextDoubleUnsafe() * (i + 1)));
        const value = buffer3[i];
        buffer3[i] = buffer3[index];
        buffer3[index] = value;
      }
      return buffer3;
    }),
    randomUUIDv4: sync3(() => v4String(randomBytesUnsafe(16))),
    randomUUIDv7: clockWith2((clock) => succeed6(v7String(clock.currentTimeMillisUnsafe(), randomBytesUnsafe(16))))
  });
};
var validateSize = (method, size2) => Number.isSafeInteger(size2) && size2 >= 0 ? succeed6(size2) : fail6(badArgument({
  module: "Crypto",
  method,
  description: "size must be a non-negative safe integer"
}));

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Stdio.js
var TypeId31 = "~effect/Stdio";
var Stdio = /* @__PURE__ */ Service(TypeId31);
var make20 = (options) => ({
  [TypeId31]: TypeId31,
  stdinIsTerminal: succeed6(false),
  stdoutIsTerminal: succeed6(false),
  ...options
});

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/Terminal.js
var TypeId32 = "~effect/platform/Terminal";
var QuitErrorTypeId = "effect/platform/Terminal/QuitError";
var QuitError = class extends (/* @__PURE__ */ Error4("QuitError")({
  _tag: /* @__PURE__ */ tag("QuitError")
})) {
  /**
   * Marks this value as a terminal quit error for runtime guards.
   *
   * @since 4.0.0
   */
  [QuitErrorTypeId] = QuitErrorTypeId;
};
var Terminal = /* @__PURE__ */ Service("effect/platform/Terminal");
var make21 = (impl) => Terminal.of({
  ...impl,
  [TypeId32]: TypeId32
});

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/unstable/process/ChildProcess.js
var ChildProcess_exports = {};
__export(ChildProcess_exports, {
  fdName: () => fdName,
  isCommand: () => isCommand,
  isPipedCommand: () => isPipedCommand,
  isStandardCommand: () => isStandardCommand,
  make: () => make23,
  parseFdName: () => parseFdName,
  pipeTo: () => pipeTo2,
  prefix: () => prefix,
  setCwd: () => setCwd,
  setEnv: () => setEnv
});

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/unstable/process/ChildProcessSpawner.js
var ChildProcessSpawner_exports = {};
__export(ChildProcessSpawner_exports, {
  ChildProcessSpawner: () => ChildProcessSpawner,
  ExitCode: () => ExitCode,
  ProcessId: () => ProcessId,
  make: () => make22,
  makeHandle: () => makeHandle
});
var ExitCode = /* @__PURE__ */ nominal();
var ProcessId = /* @__PURE__ */ nominal();
var HandleTypeId = "~effect/ChildProcessSpawner/ChildProcessHandle";
var HandleProto = {
  [HandleTypeId]: HandleTypeId,
  ...BaseProto,
  toJSON() {
    return {
      _id: "ChildProcessHandle",
      pid: this.pid
    };
  }
};
var makeHandle = (params) => Object.setPrototypeOf({
  ...params
}, HandleProto);
var make22 = (spawn2) => {
  const streamString = (command, options) => spawn2(command).pipe(map6((handle) => decodeText(options?.includeStderr === true ? handle.all : handle.stdout)), unwrap4);
  const streamLines = (command, options) => splitLines2(streamString(command, options));
  return ChildProcessSpawner.of({
    spawn: spawn2,
    exitCode: (command) => scoped2(flatMap4(spawn2(command), (handle) => handle.exitCode)),
    streamString,
    streamLines,
    lines: (command, options) => runCollect(streamLines(command, options)),
    string: (command, options) => mkString(streamString(command, options))
  });
};
var ChildProcessSpawner = class extends (/* @__PURE__ */ Service()("effect/process/ChildProcessSpawner")) {
};

// node_modules/.pnpm/effect@4.0.0-rc.112/node_modules/effect/dist/unstable/process/ChildProcess.js
var TypeId33 = "~effect/unstable/process/ChildProcess";
var Proto3 = {
  .../* @__PURE__ */ Prototype2({
    label: "Command",
    evaluate(fiber3) {
      return getUnsafe2(fiber3.context, ChildProcessSpawner).spawn(this);
    }
  }),
  [TypeId33]: TypeId33
};
var isCommand = (u) => hasProperty(u, TypeId33);
var isStandardCommand = (command) => command._tag === "StandardCommand";
var isPipedCommand = (command) => command._tag === "PipedCommand";
var makeStandardCommand = (command, args2, options) => Object.assign(Object.create(Proto3), {
  _tag: "StandardCommand",
  command,
  args: args2,
  options
});
var makePipedCommand = (left, right, options = {}) => Object.assign(Object.create(Proto3), {
  _tag: "PipedCommand",
  left,
  right,
  options
});
var make23 = function make24(...args2) {
  if (isTemplateString(args2[0])) {
    const [templates, ...expressions] = args2;
    const tokens = parseTemplates(templates, expressions);
    return makeStandardCommand(tokens[0] ?? "", tokens.slice(1), {});
  }
  if (typeof args2[0] === "object" && !Array.isArray(args2[0]) && !isTemplateString(args2[0])) {
    const options2 = args2[0];
    return function(templates, ...expressions) {
      const tokens = parseTemplates(templates, expressions);
      return makeStandardCommand(tokens[0] ?? "", tokens.slice(1), options2);
    };
  }
  if (typeof args2[0] === "string" && !Array.isArray(args2[1])) {
    const [command2, options2 = {}] = args2;
    return makeStandardCommand(command2, [], options2);
  }
  const [command, cmdArgs = [], options = {}] = args2;
  return makeStandardCommand(command, cmdArgs, options);
};
var pipeTo2 = /* @__PURE__ */ dual((args2) => isCommand(args2[0]) && isCommand(args2[1]), (self, that, options) => makePipedCommand(self, that, options ?? {}));
var prefix = function prefix2(...args2) {
  if (isCommand(args2[0]) && args2.length > 1) {
    const [self, ...rest] = args2;
    const prefixSpec2 = parsePrefixArgs(rest);
    return applyPrefix(self, prefixSpec2);
  }
  const prefixSpec = parsePrefixArgs(args2);
  return (self) => applyPrefix(self, prefixSpec);
};
var parsePrefixArgs = (args2) => {
  if (isTemplateString(args2[0])) {
    const [templates, ...expressions] = args2;
    const tokens = parseTemplates(templates, expressions);
    return {
      command: tokens[0] ?? "",
      args: tokens.slice(1)
    };
  }
  const [command, cmdArgs = []] = args2;
  return {
    command,
    args: cmdArgs
  };
};
var applyPrefix = (self, prefixSpec) => {
  switch (self._tag) {
    case "StandardCommand": {
      return makeStandardCommand(prefixSpec.command, [...prefixSpec.args, self.command, ...self.args], self.options);
    }
    case "PipedCommand": {
      return makePipedCommand(applyPrefix(self.left, prefixSpec), self.right, self.options);
    }
  }
};
var setCwd = /* @__PURE__ */ dual(2, (self, cwd) => {
  switch (self._tag) {
    case "StandardCommand": {
      return makeStandardCommand(self.command, self.args, {
        ...self.options,
        cwd
      });
    }
    case "PipedCommand": {
      return makePipedCommand(setCwd(self.left, cwd), setCwd(self.right, cwd), self.options);
    }
  }
});
var setEnv = /* @__PURE__ */ dual(2, (self, env) => {
  switch (self._tag) {
    case "StandardCommand": {
      const nextEnv = self.options.env === void 0 ? env : {
        ...self.options.env,
        ...env
      };
      return makeStandardCommand(self.command, self.args, {
        ...self.options,
        env: nextEnv
      });
    }
    case "PipedCommand": {
      return makePipedCommand(setEnv(self.left, env), setEnv(self.right, env), self.options);
    }
  }
});
var isTemplateString = (u) => Array.isArray(u) && "raw" in u && Array.isArray(u.raw);
var parseFdName = (name) => {
  const match7 = /^fd(\d+)$/.exec(name);
  if (match7 === null) return void 0;
  const fd = parseInt(match7[1], 10);
  return fd >= 3 ? fd : void 0;
};
var fdName = (fd) => `fd${fd}`;
var parseTemplates = (templates, expressions) => {
  let tokens = [];
  for (const [index, template] of templates.entries()) {
    tokens = parseTemplate(templates, expressions, tokens, template, index);
  }
  return tokens;
};
var parseTemplate = (templates, expressions, prevTokens, template, index) => {
  const rawTemplate = templates.raw[index];
  if (rawTemplate === void 0) {
    throw new Error(`Invalid backslash sequence: ${templates.raw[index]}`);
  }
  const {
    hasLeadingWhitespace,
    hasTrailingWhitespace,
    tokens
  } = splitByWhitespaces(template, rawTemplate);
  const nextTokens = concatTokens(prevTokens, tokens, hasLeadingWhitespace);
  if (index === expressions.length) {
    return nextTokens;
  }
  const expression = expressions[index];
  const expressionTokens = Array.isArray(expression) ? expression.map((expression2) => parseExpression(expression2)) : [parseExpression(expression)];
  return concatTokens(nextTokens, expressionTokens, hasTrailingWhitespace);
};
var parseExpression = (expression) => {
  const type = typeof expression;
  if (type === "string") {
    return expression;
  }
  return String(expression);
};
var DELIMITERS = /* @__PURE__ */ new Set([" ", "	", "\r", "\n"]);
var ESCAPE_LENGTH = {
  x: 3,
  u: 5
};
var splitByWhitespaces = (template, rawTemplate) => {
  if (rawTemplate.length === 0) {
    return {
      tokens: [],
      hasLeadingWhitespace: false,
      hasTrailingWhitespace: false
    };
  }
  const hasLeadingWhitespace = DELIMITERS.has(rawTemplate[0]);
  const tokens = [];
  let templateCursor = 0;
  for (let templateIndex = 0, rawIndex = 0; templateIndex < template.length; templateIndex += 1, rawIndex += 1) {
    const rawCharacter = rawTemplate[rawIndex];
    if (DELIMITERS.has(rawCharacter)) {
      if (templateCursor !== templateIndex) {
        tokens.push(template.slice(templateCursor, templateIndex));
      }
      templateCursor = templateIndex + 1;
    } else if (rawCharacter === "\\") {
      const nextRawCharacter = rawTemplate[rawIndex + 1];
      if (nextRawCharacter === "\n") {
        templateIndex -= 1;
        rawIndex += 1;
      } else if (nextRawCharacter === "u" && rawTemplate[rawIndex + 2] === "{") {
        rawIndex = rawTemplate.indexOf("}", rawIndex + 3);
      } else {
        rawIndex += ESCAPE_LENGTH[nextRawCharacter] ?? 1;
      }
    }
  }
  const hasTrailingWhitespace = templateCursor === template.length;
  if (!hasTrailingWhitespace) {
    tokens.push(template.slice(templateCursor));
  }
  return {
    tokens,
    hasLeadingWhitespace,
    hasTrailingWhitespace
  };
};
var concatTokens = (prevTokens, nextTokens, isSeparated) => isSeparated || prevTokens.length === 0 || nextTokens.length === 0 ? [...prevTokens, ...nextTokens] : [...prevTokens.slice(0, -1), `${prevTokens.at(-1)}${nextTokens.at(0)}`, ...nextTokens.slice(1)];

// node_modules/.pnpm/@effect+platform-node-shared@4.0.0-rc.112_effect@4.0.0-rc.112/node_modules/@effect/platform-node-shared/dist/NodeChildProcessSpawner.js
import * as NodeChildProcess from "node:child_process";
import { PassThrough } from "node:stream";

// node_modules/.pnpm/@effect+platform-node-shared@4.0.0-rc.112_effect@4.0.0-rc.112/node_modules/@effect/platform-node-shared/dist/internal/nodeChildProcessSpawner.js
var buildSpawnOptions = (options, base, platform) => {
  const detached = options.detached ?? platform !== "win32";
  return {
    ...base,
    detached,
    shell: options.shell,
    windowsHide: options.windowsHide ?? !detached
  };
};

// node_modules/.pnpm/@effect+platform-node-shared@4.0.0-rc.112_effect@4.0.0-rc.112/node_modules/@effect/platform-node-shared/dist/internal/utils.js
var handleErrnoException = (module, method) => (err, [path]) => {
  let reason = "Unknown";
  switch (err.code) {
    case "ENOENT":
      reason = "NotFound";
      break;
    case "EACCES":
      reason = "PermissionDenied";
      break;
    case "EEXIST":
      reason = "AlreadyExists";
      break;
    case "EISDIR":
      reason = "BadResource";
      break;
    case "ENOTDIR":
      reason = "BadResource";
      break;
    case "EBUSY":
      reason = "Busy";
      break;
    case "ELOOP":
      reason = "BadResource";
      break;
  }
  return systemError({
    _tag: reason,
    module,
    method,
    pathOrDescriptor: path,
    syscall: err.syscall,
    cause: err
  });
};

// node_modules/.pnpm/@effect+platform-node-shared@4.0.0-rc.112_effect@4.0.0-rc.112/node_modules/@effect/platform-node-shared/dist/NodeSink.js
var fromWritable = (options) => fromChannel2(mapDone(fromWritableChannel(options), (_) => [_]));
var fromWritableChannel = (options) => fromTransform((pull) => {
  const writable = options.evaluate();
  return succeed6(pullIntoWritable({
    ...options,
    writable,
    pull
  }));
});
var pullIntoWritable = (options) => options.pull.pipe(flatMap4((chunk) => {
  let i = 0;
  return callback2(function loop(resume) {
    for (; i < chunk.length; ) {
      const success = options.writable.write(chunk[i++], options.encoding);
      if (!success) {
        options.writable.once("drain", () => loop(resume));
        return;
      }
    }
    resume(void_3);
  });
}), forever4({
  disableYield: true
}), raceFirst2(callback2((resume) => {
  const onError5 = (error) => resume(fail6(options.onError(error)));
  options.writable.once("error", onError5);
  return sync3(() => {
    options.writable.off("error", onError5);
  });
})), options.endOnDone !== false ? catchDone((_) => {
  if ("closed" in options.writable && options.writable.closed) {
    return done2(_);
  }
  return callback2((resume) => {
    options.writable.once("finish", () => resume(done2(_)));
    options.writable.end();
  });
}) : identity);

// node_modules/.pnpm/@effect+platform-node-shared@4.0.0-rc.112_effect@4.0.0-rc.112/node_modules/@effect/platform-node-shared/dist/NodeStream.js
var fromReadable = (options) => fromChannel3(fromReadableChannel(options));
var fromReadableChannel = (options) => fromTransform((_, scope3) => readableToPullUnsafe({
  scope: scope3,
  readable: options.evaluate(),
  onError: options.onError ?? defaultOnError,
  chunkSize: options.chunkSize,
  closeOnDone: options.closeOnDone
}));
var readableToPullUnsafe = (options) => {
  const readable = options.readable;
  const closeOnDone = options.closeOnDone ?? true;
  const exit3 = options.exit ?? make7(void 0);
  const latch = makeUnsafe4(false);
  function onReadable() {
    latch.openUnsafe();
  }
  function onError5(error) {
    exit3.current = fail5(options.onError(error));
    latch.openUnsafe();
  }
  function onEnd3() {
    exit3.current = fail5(Done2());
    latch.openUnsafe();
  }
  readable.on("readable", onReadable);
  readable.once("error", onError5);
  readable.once("end", onEnd3);
  const pull = suspend3(function loop() {
    let item = options.readable.read(options.chunkSize);
    if (item === null) {
      if (exit3.current) {
        return exit3.current;
      }
      if (readable.readableEnded) {
        return fail6(Done2());
      }
      latch.closeUnsafe();
      return flatMap4(latch.await, loop);
    }
    const chunk = of(item);
    while (true) {
      item = options.readable.read(options.chunkSize);
      if (item === null) break;
      chunk.push(item);
    }
    return succeed6(chunk);
  });
  return as2(addFinalizer2(options.scope, sync3(() => {
    readable.off("readable", onReadable);
    readable.off("error", onError5);
    readable.off("end", onEnd3);
    if (closeOnDone && "closed" in options.readable && !options.readable.closed) {
      options.readable.destroy();
    }
  })), pull);
};
var defaultOnError = (error) => new UnknownError2(error);

// node_modules/.pnpm/@effect+platform-node-shared@4.0.0-rc.112_effect@4.0.0-rc.112/node_modules/@effect/platform-node-shared/dist/NodeChildProcessSpawner.js
var toError = (error) => error instanceof globalThis.Error ? error : new globalThis.Error(String(error));
var toPlatformError = (method, error, command) => {
  const {
    commands
  } = flattenCommand(command);
  const commandStr = commands.reduce((acc, curr) => {
    const cmd = `${curr.command} ${curr.args.join(" ")}`;
    return acc.length === 0 ? cmd : `${acc} | ${cmd}`;
  }, "");
  return handleErrnoException("ChildProcess", method)(error, [commandStr]);
};
var taskkill = (childProcess, onExit5 = () => {
}) => NodeChildProcess.execFile("taskkill", ["/pid", String(childProcess.pid), "/T", "/F"], {
  windowsHide: true
}, onExit5);
var make25 = /* @__PURE__ */ gen2(function* () {
  const fs = yield* FileSystem;
  const path = yield* Path;
  const resolveWorkingDirectory = fnUntraced2(function* (options) {
    if (isUndefined(options.cwd)) return void 0;
    yield* fs.access(options.cwd);
    return path.resolve(options.cwd);
  });
  const resolveEnvironment = (options) => {
    return options.extendEnv ? {
      ...globalThis.process.env,
      ...options.env
    } : options.env;
  };
  const inputToStdioOption = (input) => isStream(input) ? "pipe" : input;
  const outputToStdioOption = (input) => isSink(input) ? "pipe" : input;
  const resolveStdinOption = (options) => {
    const defaultConfig = {
      stream: "pipe",
      encoding: "utf-8",
      endOnDone: true
    };
    if (isUndefined(options.stdin)) {
      return defaultConfig;
    }
    if (typeof options.stdin === "string") {
      return {
        ...defaultConfig,
        stream: options.stdin
      };
    }
    if (isStream(options.stdin)) {
      return {
        ...defaultConfig,
        stream: options.stdin
      };
    }
    return {
      stream: options.stdin.stream,
      encoding: options.stdin.encoding ?? defaultConfig.encoding,
      endOnDone: options.stdin.endOnDone ?? defaultConfig.endOnDone
    };
  };
  const resolveOutputOption = (options, streamName) => {
    const option3 = options[streamName];
    if (isUndefined(option3)) {
      return {
        stream: "pipe"
      };
    }
    if (typeof option3 === "string") {
      return {
        stream: option3
      };
    }
    if (isSink(option3)) {
      return {
        stream: option3
      };
    }
    return {
      stream: option3.stream
    };
  };
  const resolveAdditionalFds = (options) => {
    if (isUndefined(options.additionalFds)) {
      return [];
    }
    const result4 = [];
    for (const [name, config] of Object.entries(options.additionalFds)) {
      const fd = parseFdName(name);
      if (isNotUndefined(fd)) {
        result4.push({
          fd,
          config
        });
      }
    }
    return result4.sort((a, b) => a.fd - b.fd);
  };
  const buildStdioArray = (stdinConfig, stdoutConfig, stderrConfig, additionalFds) => {
    const stdio = [inputToStdioOption(stdinConfig.stream), outputToStdioOption(stdoutConfig.stream), outputToStdioOption(stderrConfig.stream)];
    if (additionalFds.length === 0) {
      return stdio;
    }
    const maxFd = additionalFds.reduce((max2, {
      fd
    }) => Math.max(max2, fd), 2);
    for (let i = 3; i <= maxFd; i++) {
      stdio[i] = "ignore";
    }
    for (const {
      fd
    } of additionalFds) {
      stdio[fd] = "pipe";
    }
    return stdio;
  };
  const setupAdditionalFds = fnUntraced2(function* (command, childProcess, additionalFds) {
    if (additionalFds.length === 0) {
      return {
        getInputFd: () => drain2,
        getOutputFd: () => empty6
      };
    }
    const inputSinks = /* @__PURE__ */ new Map();
    const outputStreams = /* @__PURE__ */ new Map();
    for (const {
      config,
      fd
    } of additionalFds) {
      const nodeStream = childProcess.stdio[fd];
      switch (config.type) {
        case "input": {
          let sink = drain2;
          if (nodeStream && "write" in nodeStream) {
            sink = fromWritable({
              evaluate: () => nodeStream,
              onError: (error) => toPlatformError(`fromWritable(fd${fd})`, toError(error), command)
            });
          }
          if (config.stream) {
            yield* forkScoped2(run(config.stream, sink));
          }
          inputSinks.set(fd, sink);
          break;
        }
        case "output": {
          let stream = empty6;
          if (nodeStream && "read" in nodeStream) {
            const passThrough = new PassThrough();
            nodeStream.on("error", (error) => passThrough.destroy(error));
            nodeStream.pipe(passThrough);
            stream = fromReadable({
              evaluate: () => passThrough,
              onError: (error) => toPlatformError(`fromReadable(fd${fd})`, toError(error), command)
            });
          }
          if (config.sink) {
            stream = transduce(stream, config.sink);
          }
          outputStreams.set(fd, stream);
          break;
        }
      }
    }
    return {
      getInputFd: (fd) => inputSinks.get(fd) ?? drain2,
      getOutputFd: (fd) => outputStreams.get(fd) ?? empty6
    };
  });
  const setupChildStdin = (command, childProcess, config) => suspend3(() => {
    let sink = drain2;
    if (isNotNull(childProcess.stdin)) {
      sink = fromWritable({
        evaluate: () => childProcess.stdin,
        onError: (error) => toPlatformError("fromWritable(stdin)", toError(error), command),
        endOnDone: config.endOnDone,
        encoding: config.encoding
      });
    }
    if (isStream(config.stream)) {
      return as2(forkScoped2(run(config.stream, sink)), sink);
    }
    return succeed6(sink);
  });
  const setupChildOutputStreams = (command, childProcess, stdoutConfig, stderrConfig) => {
    let stdout = childProcess.stdout ? (() => {
      const passThrough = new PassThrough();
      childProcess.stdout.on("error", (error) => passThrough.destroy(error));
      childProcess.stdout.pipe(passThrough);
      return fromReadable({
        evaluate: () => passThrough,
        onError: (error) => toPlatformError("fromReadable(stdout)", toError(error), command)
      });
    })() : empty6;
    let stderr = childProcess.stderr ? (() => {
      const passThrough = new PassThrough();
      childProcess.stderr.on("error", (error) => passThrough.destroy(error));
      childProcess.stderr.pipe(passThrough);
      return fromReadable({
        evaluate: () => passThrough,
        onError: (error) => toPlatformError("fromReadable(stderr)", toError(error), command)
      });
    })() : empty6;
    if (isSink(stdoutConfig.stream)) {
      stdout = transduce(stdout, stdoutConfig.stream);
    }
    if (isSink(stderrConfig.stream)) {
      stderr = transduce(stderr, stderrConfig.stream);
    }
    const all3 = merge4(stdout, stderr);
    return {
      stdout,
      stderr,
      all: all3
    };
  };
  const spawn2 = (command, spawnOptions) => callback2((resume) => {
    const deferred = makeUnsafe2();
    const handle = NodeChildProcess.spawn(command.command, command.args, spawnOptions);
    handle.on("error", (error) => {
      resume(fail6(toPlatformError("spawn", error, command)));
    });
    handle.on("exit", (...args2) => {
      doneUnsafe(deferred, succeed4(args2));
    });
    handle.on("spawn", () => {
      resume(succeed6([handle, deferred]));
    });
    return sync3(() => {
      handle.kill("SIGTERM");
    });
  });
  const killProcessGroup = (command, childProcess, signal) => {
    if (globalThis.process.platform === "win32") {
      return callback2((resume) => {
        taskkill(childProcess, (error) => {
          if (error) {
            resume(fail6(toPlatformError("kill", toError(error), command)));
          } else {
            resume(void_3);
          }
        });
      });
    }
    return try_2({
      try: () => {
        globalThis.process.kill(-childProcess.pid, signal);
      },
      catch: (error) => toPlatformError("kill", toError(error), command)
    });
  };
  const killProcessGroupOnExit = (childProcess, signal) => {
    if (globalThis.process.platform === "win32") {
      taskkill(childProcess);
      return;
    }
    try {
      globalThis.process.kill(-childProcess.pid, signal);
    } catch {
    }
  };
  const killProcess = (command, childProcess, signal) => suspend3(() => {
    const killed = childProcess.kill(signal);
    if (!killed) {
      const error = new globalThis.Error("Failed to kill child process");
      return fail6(toPlatformError("kill", error, command));
    }
    return void_3;
  });
  const withTimeout = (childProcess, command, options) => (kill) => {
    const killSignal = options?.killSignal ?? "SIGTERM";
    return isUndefined(options?.forceKillAfter) ? kill(command, childProcess, killSignal) : timeoutOrElse2(kill(command, childProcess, killSignal), {
      duration: options.forceKillAfter,
      orElse: () => kill(command, childProcess, "SIGKILL")
    });
  };
  const getSourceStream = (handle, from) => {
    const fromOption4 = from ?? "stdout";
    switch (fromOption4) {
      case "stdout":
        return handle.stdout;
      case "stderr":
        return handle.stderr;
      case "all":
        return handle.all;
      default: {
        const fd = parseFdName(fromOption4);
        if (isNotUndefined(fd)) {
          return handle.getOutputFd(fd);
        }
        return handle.stdout;
      }
    }
  };
  const spawnCommand = fnUntraced2(function* (cmd) {
    switch (cmd._tag) {
      case "StandardCommand": {
        const stdinConfig = resolveStdinOption(cmd.options);
        const stdoutConfig = resolveOutputOption(cmd.options, "stdout");
        const stderrConfig = resolveOutputOption(cmd.options, "stderr");
        const resolvedAdditionalFds = resolveAdditionalFds(cmd.options);
        let isReferenced = true;
        const cwd = yield* resolveWorkingDirectory(cmd.options);
        const env = resolveEnvironment(cmd.options);
        const stdio = buildStdioArray(stdinConfig, stdoutConfig, stderrConfig, resolvedAdditionalFds);
        const [childProcess, exitSignal] = yield* acquireRelease2(spawn2(cmd, buildSpawnOptions(cmd.options, {
          cwd,
          env,
          stdio
        }, process.platform)), fnUntraced2(function* ([childProcess2, exitSignal2]) {
          const exited = yield* isDone3(exitSignal2);
          const killWithTimeout = withTimeout(childProcess2, cmd, cmd.options);
          if (exited) {
            const [code] = yield* _await(exitSignal2);
            if (code !== 0 && isNotNull(code)) {
              return yield* ignore2(killWithTimeout(killProcessGroup));
            }
            return yield* void_3;
          }
          if (!isReferenced) {
            return yield* void_3;
          }
          return yield* killWithTimeout((command, childProcess3, signal) => killProcessGroup(command, childProcess3, signal).pipe(catch_3(() => killProcess(command, childProcess3, signal)), andThen2(_await(exitSignal2)))).pipe(ignore2);
        }));
        const pid = ProcessId(childProcess.pid);
        childProcess.on("exit", (code) => {
          if (code !== 0 && isNotNull(code)) {
            killProcessGroupOnExit(childProcess, cmd.options.killSignal ?? "SIGTERM");
          }
        });
        const reref = sync3(() => {
          if (!isReferenced) {
            childProcess.ref();
            isReferenced = true;
          }
        });
        const unref = sync3(() => {
          if (isReferenced) {
            childProcess.unref();
            isReferenced = false;
          }
          return reref;
        });
        const stdin = yield* setupChildStdin(cmd, childProcess, stdinConfig);
        const {
          all: all3,
          stderr,
          stdout
        } = setupChildOutputStreams(cmd, childProcess, stdoutConfig, stderrConfig);
        const {
          getInputFd,
          getOutputFd
        } = yield* setupAdditionalFds(cmd, childProcess, resolvedAdditionalFds);
        const isRunning = map6(isDone3(exitSignal), (done4) => !done4);
        const exitCode = flatMap4(_await(exitSignal), ([code, signal]) => {
          if (isNotNull(code)) {
            return succeed6(ExitCode(code));
          }
          const error = new globalThis.Error(`Process interrupted due to receipt of signal: '${signal}'`);
          return fail6(toPlatformError("exitCode", error, cmd));
        });
        const kill = (options) => {
          const killWithTimeout = withTimeout(childProcess, cmd, options);
          return killWithTimeout((command, childProcess2, signal) => killProcessGroup(command, childProcess2, signal).pipe(catch_3(() => killProcess(command, childProcess2, signal)), andThen2(_await(exitSignal)))).pipe(asVoid2);
        };
        return makeHandle({
          pid,
          exitCode,
          isRunning,
          kill,
          stdin,
          stdout,
          stderr,
          all: all3,
          getInputFd,
          getOutputFd,
          unref
        });
      }
      case "PipedCommand": {
        const {
          commands,
          pipeOptions
        } = flattenCommand(cmd);
        const [root, ...pipeline] = commands;
        const handles = [yield* spawnCommand(root)];
        for (let i = 0; i < pipeline.length; i++) {
          const command = pipeline[i];
          const options = pipeOptions[i] ?? {};
          const stdinConfig = resolveStdinOption(command.options);
          const sourceStream = unwrap4(succeed6(getSourceStream(handles[handles.length - 1], options.from)));
          const toOption2 = options.to ?? "stdin";
          if (toOption2 === "stdin") {
            handles.push(yield* spawnCommand(make23(command.command, command.args, {
              ...command.options,
              stdin: {
                ...stdinConfig,
                stream: sourceStream
              }
            })));
          } else {
            const fd = parseFdName(toOption2);
            if (isNotUndefined(fd)) {
              const fdName2 = fdName(fd);
              const existingFds = command.options.additionalFds ?? {};
              handles.push(yield* spawnCommand(make23(command.command, command.args, {
                ...command.options,
                additionalFds: {
                  ...existingFds,
                  [fdName2]: {
                    type: "input",
                    stream: sourceStream
                  }
                }
              })));
            } else {
              handles.push(yield* spawnCommand(make23(command.command, command.args, {
                ...command.options,
                stdin: {
                  ...stdinConfig,
                  stream: sourceStream
                }
              })));
            }
          }
        }
        const handle = handles[handles.length - 1];
        const kill = (options) => forEach2([...handles].reverse(), (handle2) => ignore2(handle2.kill(options)), {
          discard: true
        });
        const unref = gen2(function* () {
          const rerefs = [];
          for (const handle2 of handles) {
            rerefs.push(yield* handle2.unref);
          }
          return forEach2([...rerefs].reverse(), (reref) => reref, {
            discard: true
          });
        });
        return makeHandle({
          pid: handle.pid,
          exitCode: handle.exitCode,
          isRunning: handle.isRunning,
          kill,
          stdin: handle.stdin,
          stdout: handle.stdout,
          stderr: handle.stderr,
          all: handle.all,
          getInputFd: handle.getInputFd,
          getOutputFd: handle.getOutputFd,
          unref
        });
      }
    }
  });
  return make22(spawnCommand);
});
var layer = /* @__PURE__ */ effect(ChildProcessSpawner, make25);
var flattenCommand = (command) => {
  const commands = [];
  const pipeOptions = [];
  const flatten6 = (cmd) => {
    switch (cmd._tag) {
      case "StandardCommand": {
        commands.push(cmd);
        break;
      }
      case "PipedCommand": {
        flatten6(cmd.left);
        pipeOptions.push(cmd.options);
        flatten6(cmd.right);
        break;
      }
    }
  };
  flatten6(command);
  if (commands.length === 0) {
    throw new Error("flattenCommand produced empty commands array");
  }
  const [first, ...rest] = commands;
  const nonEmptyCommands = [first, ...rest];
  return {
    commands: nonEmptyCommands,
    pipeOptions
  };
};

// node_modules/.pnpm/@effect+platform-node-shared@4.0.0-rc.112_effect@4.0.0-rc.112/node_modules/@effect/platform-node-shared/dist/NodeCrypto.js
import * as NodeCrypto from "node:crypto";
var toHashAlgorithm = (algorithm) => {
  switch (algorithm) {
    case "SHA-1":
      return "sha1";
    case "SHA-256":
      return "sha256";
    case "SHA-384":
      return "sha384";
    case "SHA-512":
      return "sha512";
  }
};
var digest = (algorithm, data) => try_2({
  try: () => Uint8Array.from(NodeCrypto.createHash(toHashAlgorithm(algorithm)).update(data).digest()),
  catch: (cause) => systemError({
    module: "Crypto",
    method: "digest",
    _tag: "Unknown",
    description: "Could not compute digest",
    cause
  })
});
var make26 = /* @__PURE__ */ make19({
  randomBytes: NodeCrypto.randomBytes,
  digest
});
var layer2 = /* @__PURE__ */ succeed5(Crypto, make26);

// node_modules/.pnpm/@effect+platform-node@4.0.0-rc.112_effect@4.0.0-rc.112/node_modules/@effect/platform-node/dist/NodeCrypto.js
var layer3 = layer2;

// node_modules/.pnpm/@effect+platform-node-shared@4.0.0-rc.112_effect@4.0.0-rc.112/node_modules/@effect/platform-node-shared/dist/NodeFileSystem.js
import * as Crypto2 from "node:crypto";
import * as NFS from "node:fs";
import * as OS from "node:os";
import * as Path2 from "node:path";
var handleBadArgument = (method) => (err) => badArgument({
  module: "FileSystem",
  method,
  description: err.message ?? String(err)
});
var access2 = /* @__PURE__ */ (() => {
  const nodeAccess = /* @__PURE__ */ effectify(NFS.access, /* @__PURE__ */ handleErrnoException("FileSystem", "access"), /* @__PURE__ */ handleBadArgument("access"));
  return (path, options) => {
    let mode = NFS.constants.F_OK;
    if (options?.readable) {
      mode |= NFS.constants.R_OK;
    }
    if (options?.writable) {
      mode |= NFS.constants.W_OK;
    }
    return nodeAccess(path, mode);
  };
})();
var copy = /* @__PURE__ */ (() => {
  const nodeCp = /* @__PURE__ */ effectify(NFS.cp, /* @__PURE__ */ handleErrnoException("FileSystem", "copy"), /* @__PURE__ */ handleBadArgument("copy"));
  return (fromPath, toPath, options) => nodeCp(fromPath, toPath, {
    force: options?.overwrite ?? false,
    preserveTimestamps: options?.preserveTimestamps ?? false,
    recursive: true
  });
})();
var copyFile2 = /* @__PURE__ */ (() => {
  const nodeCopyFile = /* @__PURE__ */ effectify(NFS.copyFile, /* @__PURE__ */ handleErrnoException("FileSystem", "copyFile"), /* @__PURE__ */ handleBadArgument("copyFile"));
  return (fromPath, toPath) => nodeCopyFile(fromPath, toPath);
})();
var chmod2 = /* @__PURE__ */ (() => {
  const nodeChmod = /* @__PURE__ */ effectify(NFS.chmod, /* @__PURE__ */ handleErrnoException("FileSystem", "chmod"), /* @__PURE__ */ handleBadArgument("chmod"));
  return (path, mode) => nodeChmod(path, mode);
})();
var chown2 = /* @__PURE__ */ (() => {
  const nodeChown = /* @__PURE__ */ effectify(NFS.chown, /* @__PURE__ */ handleErrnoException("FileSystem", "chown"), /* @__PURE__ */ handleBadArgument("chown"));
  return (path, uid, gid) => nodeChown(path, uid, gid);
})();
var glob2 = /* @__PURE__ */ (() => {
  const nodeGlob = /* @__PURE__ */ effectify(NFS.glob, /* @__PURE__ */ handleErrnoException("FileSystem", "glob"), /* @__PURE__ */ handleBadArgument("glob"));
  return (pattern, options) => nodeGlob(pattern, {
    cwd: options?.root,
    exclude: options?.exclude
  });
})();
var link3 = /* @__PURE__ */ (() => {
  const nodeLink = /* @__PURE__ */ effectify(NFS.link, /* @__PURE__ */ handleErrnoException("FileSystem", "link"), /* @__PURE__ */ handleBadArgument("link"));
  return (existingPath, newPath) => nodeLink(existingPath, newPath);
})();
var makeDirectory = /* @__PURE__ */ (() => {
  const nodeMkdir = /* @__PURE__ */ effectify(NFS.mkdir, /* @__PURE__ */ handleErrnoException("FileSystem", "makeDirectory"), /* @__PURE__ */ handleBadArgument("makeDirectory"));
  return (path, options) => nodeMkdir(path, {
    recursive: options?.recursive ?? false,
    mode: options?.mode
  });
})();
var makeTempDirectoryFactory = (method) => {
  const nodeMkdtemp = effectify(NFS.mkdtemp, handleErrnoException("FileSystem", method), handleBadArgument(method));
  return (options) => suspend3(() => {
    const prefix3 = options?.prefix ?? "";
    const directory = typeof options?.directory === "string" ? Path2.join(options.directory, ".") : OS.tmpdir();
    return nodeMkdtemp(prefix3 ? Path2.join(directory, prefix3) : directory + "/");
  });
};
var makeTempDirectory = /* @__PURE__ */ makeTempDirectoryFactory("makeTempDirectory");
var removeFactory = (method) => {
  const nodeRm = effectify(NFS.rm, handleErrnoException("FileSystem", method), handleBadArgument(method));
  return (path, options) => nodeRm(path, {
    recursive: options?.recursive ?? false,
    force: options?.force ?? false
  });
};
var remove3 = /* @__PURE__ */ removeFactory("remove");
var makeTempDirectoryScoped = /* @__PURE__ */ (() => {
  const makeDirectory2 = /* @__PURE__ */ makeTempDirectoryFactory("makeTempDirectoryScoped");
  const removeDirectory = /* @__PURE__ */ removeFactory("makeTempDirectoryScoped");
  return (options) => acquireRelease2(makeDirectory2(options), (directory) => orDie3(removeDirectory(directory, {
    recursive: true
  })));
})();
var openFactory = (method) => {
  const nodeOpen = effectify(NFS.open, handleErrnoException("FileSystem", method), handleBadArgument(method));
  const nodeClose = effectify(NFS.close, handleErrnoException("FileSystem", method), handleBadArgument(method));
  return (path, options) => pipe(acquireRelease2(nodeOpen(path, options?.flag ?? "r", options?.mode), (fd) => orDie3(nodeClose(fd))), map6((fd) => makeFile(fd, options?.flag?.startsWith("a") ?? false)));
};
var open2 = /* @__PURE__ */ openFactory("open");
var makeFile = /* @__PURE__ */ (() => {
  const nodeReadFactory = (method) => effectify(NFS.read, handleErrnoException("FileSystem", method), handleBadArgument(method));
  const nodeRead = /* @__PURE__ */ nodeReadFactory("read");
  const nodeReadAlloc = /* @__PURE__ */ nodeReadFactory("readAlloc");
  const nodeStat = /* @__PURE__ */ effectify(NFS.fstat, /* @__PURE__ */ handleErrnoException("FileSystem", "stat"), /* @__PURE__ */ handleBadArgument("stat"));
  const nodeTruncate = /* @__PURE__ */ effectify(NFS.ftruncate, /* @__PURE__ */ handleErrnoException("FileSystem", "truncate"), /* @__PURE__ */ handleBadArgument("truncate"));
  const nodeSync = /* @__PURE__ */ effectify(NFS.fsync, /* @__PURE__ */ handleErrnoException("FileSystem", "sync"), /* @__PURE__ */ handleBadArgument("sync"));
  const nodeWriteFactory = (method) => effectify(NFS.write, handleErrnoException("FileSystem", method), handleBadArgument(method));
  const nodeWrite = /* @__PURE__ */ nodeWriteFactory("write");
  const nodeWriteAll = /* @__PURE__ */ nodeWriteFactory("writeAll");
  class FileImpl {
    [FileTypeId];
    fd;
    append;
    position = /* @__PURE__ */ BigInt(0);
    constructor(fd, append4) {
      this[FileTypeId] = FileTypeId;
      this.fd = fd;
      this.append = append4;
    }
    get stat() {
      return map6(nodeStat(this.fd), makeFileInfo);
    }
    get sync() {
      return nodeSync(this.fd);
    }
    seek(offset, from) {
      const offsetSize = Size(offset);
      return sync3(() => {
        if (from === "start") {
          this.position = offsetSize;
        } else if (from === "current") {
          this.position = this.position + offsetSize;
        }
        return Size(this.position);
      });
    }
    read(buffer3) {
      return suspend3(() => {
        const position = this.position;
        return map6(nodeRead(this.fd, {
          buffer: buffer3,
          position
        }), (bytesRead) => {
          const sizeRead = Size(bytesRead);
          this.position = position + sizeRead;
          return sizeRead;
        });
      });
    }
    readAlloc(size2) {
      const sizeNumber = Number(size2);
      return suspend3(() => {
        const buffer3 = Buffer.allocUnsafeSlow(sizeNumber);
        const position = this.position;
        return map6(nodeReadAlloc(this.fd, {
          buffer: buffer3,
          position
        }), (bytesRead) => {
          if (bytesRead === 0) {
            return none2();
          }
          this.position = position + BigInt(bytesRead);
          if (bytesRead === sizeNumber) {
            return some2(buffer3);
          }
          const dst = Buffer.allocUnsafeSlow(bytesRead);
          buffer3.copy(dst, 0, 0, bytesRead);
          return some2(dst);
        });
      });
    }
    truncate(length) {
      return map6(nodeTruncate(this.fd, length ? Number(length) : void 0), () => {
        if (!this.append) {
          const len = BigInt(length ?? 0);
          if (this.position > len) {
            this.position = len;
          }
        }
      });
    }
    write(buffer3) {
      return suspend3(() => {
        const position = this.position;
        return map6(nodeWrite(this.fd, buffer3, void 0, void 0, this.append ? void 0 : Number(position)), (bytesWritten) => {
          const sizeWritten = Size(bytesWritten);
          if (!this.append) {
            this.position = position + sizeWritten;
          }
          return sizeWritten;
        });
      });
    }
    writeAllChunk(buffer3) {
      return suspend3(() => {
        const position = this.position;
        return flatMap4(nodeWriteAll(this.fd, buffer3, void 0, void 0, this.append ? void 0 : Number(position)), (bytesWritten) => {
          if (bytesWritten === 0) {
            return fail6(systemError({
              module: "FileSystem",
              method: "writeAll",
              _tag: "WriteZero",
              pathOrDescriptor: this.fd,
              description: "write returned 0 bytes written"
            }));
          }
          if (!this.append) {
            this.position = position + BigInt(bytesWritten);
          }
          return bytesWritten < buffer3.length ? this.writeAllChunk(buffer3.subarray(bytesWritten)) : void_3;
        });
      });
    }
    writeAll(buffer3) {
      return this.writeAllChunk(buffer3);
    }
  }
  return (fd, append4) => new FileImpl(fd, append4);
})();
var makeTempFileFactory = (method) => {
  const makeDirectory2 = makeTempDirectoryFactory(method);
  return fnUntraced2(function* (options) {
    const directory = yield* makeDirectory2(options);
    const random2 = Crypto2.randomBytes(6).toString("hex");
    const name = Path2.join(directory, options?.suffix ? `${random2}${options.suffix}` : random2);
    yield* writeFile2(name, new Uint8Array(0));
    return name;
  });
};
var makeTempFile = /* @__PURE__ */ makeTempFileFactory("makeTempFile");
var makeTempFileScoped = /* @__PURE__ */ (() => {
  const makeFile2 = /* @__PURE__ */ makeTempFileFactory("makeTempFileScoped");
  const removeDirectory = /* @__PURE__ */ removeFactory("makeTempFileScoped");
  return (options) => acquireRelease2(makeFile2(options), (file) => orDie3(removeDirectory(Path2.dirname(file), {
    recursive: true
  })));
})();
var readDirectory = (path, options) => tryPromise2({
  try: () => NFS.promises.readdir(path, options),
  catch: (err) => handleErrnoException("FileSystem", "readDirectory")(err, [path])
});
var readFile2 = (path) => callback2((resume, signal) => {
  try {
    NFS.readFile(path, {
      signal
    }, (err, data) => {
      if (err) {
        resume(fail6(handleErrnoException("FileSystem", "readFile")(err, [path])));
      } else {
        resume(succeed6(data));
      }
    });
  } catch (err) {
    resume(fail6(handleBadArgument("readFile")(err)));
  }
});
var readLink = /* @__PURE__ */ (() => {
  const nodeReadLink = /* @__PURE__ */ effectify(NFS.readlink, /* @__PURE__ */ handleErrnoException("FileSystem", "readLink"), /* @__PURE__ */ handleBadArgument("readLink"));
  return (path) => nodeReadLink(path);
})();
var realPath = /* @__PURE__ */ (() => {
  const nodeRealPath = /* @__PURE__ */ effectify(NFS.realpath, /* @__PURE__ */ handleErrnoException("FileSystem", "realPath"), /* @__PURE__ */ handleBadArgument("realPath"));
  return (path) => nodeRealPath(path);
})();
var rename2 = /* @__PURE__ */ (() => {
  const nodeRename = /* @__PURE__ */ effectify(NFS.rename, /* @__PURE__ */ handleErrnoException("FileSystem", "rename"), /* @__PURE__ */ handleBadArgument("rename"));
  return (oldPath, newPath) => nodeRename(oldPath, newPath);
})();
var makeFileInfo = (stat3) => ({
  type: stat3.isFile() ? "File" : stat3.isDirectory() ? "Directory" : stat3.isSymbolicLink() ? "SymbolicLink" : stat3.isBlockDevice() ? "BlockDevice" : stat3.isCharacterDevice() ? "CharacterDevice" : stat3.isFIFO() ? "FIFO" : stat3.isSocket() ? "Socket" : "Unknown",
  mtime: fromNullishOr(stat3.mtime),
  atime: fromNullishOr(stat3.atime),
  birthtime: fromNullishOr(stat3.birthtime),
  dev: stat3.dev,
  rdev: fromNullishOr(stat3.rdev),
  ino: fromNullishOr(stat3.ino),
  mode: stat3.mode,
  nlink: fromNullishOr(stat3.nlink),
  uid: fromNullishOr(stat3.uid),
  gid: fromNullishOr(stat3.gid),
  size: Size(stat3.size),
  blksize: stat3.blksize !== void 0 ? some2(Size(stat3.blksize)) : none2(),
  blocks: fromNullishOr(stat3.blocks)
});
var stat2 = /* @__PURE__ */ (() => {
  const nodeStat = /* @__PURE__ */ effectify(NFS.stat, /* @__PURE__ */ handleErrnoException("FileSystem", "stat"), /* @__PURE__ */ handleBadArgument("stat"));
  return (path) => map6(nodeStat(path), makeFileInfo);
})();
var symlink2 = /* @__PURE__ */ (() => {
  const nodeSymlink = /* @__PURE__ */ effectify(NFS.symlink, /* @__PURE__ */ handleErrnoException("FileSystem", "symlink"), /* @__PURE__ */ handleBadArgument("symlink"));
  return (target, path) => nodeSymlink(target, path);
})();
var truncate2 = /* @__PURE__ */ (() => {
  const nodeTruncate = /* @__PURE__ */ effectify(NFS.truncate, /* @__PURE__ */ handleErrnoException("FileSystem", "truncate"), /* @__PURE__ */ handleBadArgument("truncate"));
  return (path, length) => nodeTruncate(path, length !== void 0 ? Number(length) : void 0);
})();
var utimes2 = /* @__PURE__ */ (() => {
  const nodeUtimes = /* @__PURE__ */ effectify(NFS.utimes, /* @__PURE__ */ handleErrnoException("FileSystem", "utime"), /* @__PURE__ */ handleBadArgument("utime"));
  return (path, atime, mtime) => nodeUtimes(path, atime, mtime);
})();
var watchNode = (path, options) => callback3((queue) => acquireRelease2(sync3(() => {
  const watcher = NFS.watch(path, {
    recursive: options?.recursive ?? false
  }, (event, path2) => {
    if (!path2) return;
    switch (event) {
      case "rename": {
        runFork2(matchEffect3(stat2(path2), {
          onSuccess: (_) => offer(queue, {
            _tag: "Create",
            path: path2
          }),
          onFailure: (_) => offer(queue, {
            _tag: "Remove",
            path: path2
          })
        }));
        return;
      }
      case "change": {
        offerUnsafe(queue, {
          _tag: "Update",
          path: path2
        });
        return;
      }
    }
  });
  watcher.on("error", (error) => {
    failCauseUnsafe(queue, fail4(systemError({
      module: "FileSystem",
      _tag: "Unknown",
      method: "watch",
      pathOrDescriptor: path,
      cause: error
    })));
  });
  watcher.on("close", () => {
    endUnsafe(queue);
  });
  return watcher;
}), (watcher) => sync3(() => watcher.close())));
var watch2 = (backend, path, options) => stat2(path).pipe(map6((stat3) => backend.pipe(flatMap((_) => _.register(path, stat3, options)), getOrElse(() => watchNode(path, options)))), unwrap4);
var writeFile2 = (path, data, options) => callback2((resume, signal) => {
  try {
    NFS.writeFile(path, data, {
      signal,
      flag: options?.flag,
      mode: options?.mode
    }, (err) => {
      if (err) {
        resume(fail6(handleErrnoException("FileSystem", "writeFile")(err, [path])));
      } else {
        resume(void_3);
      }
    });
  } catch (err) {
    resume(fail6(handleBadArgument("writeFile")(err)));
  }
});
var makeFileSystem = /* @__PURE__ */ map6(/* @__PURE__ */ serviceOption2(WatchBackend), (backend) => make18({
  access: access2,
  chmod: chmod2,
  chown: chown2,
  copy,
  copyFile: copyFile2,
  glob: glob2,
  link: link3,
  makeDirectory,
  makeTempDirectory,
  makeTempDirectoryScoped,
  makeTempFile,
  makeTempFileScoped,
  open: open2,
  readDirectory,
  readFile: readFile2,
  readLink,
  realPath,
  remove: remove3,
  rename: rename2,
  stat: stat2,
  symlink: symlink2,
  truncate: truncate2,
  utimes: utimes2,
  watch(path, options) {
    return watch2(backend, path, options);
  },
  writeFile: writeFile2
}));
var layer4 = /* @__PURE__ */ effect(FileSystem)(makeFileSystem);

// node_modules/.pnpm/@effect+platform-node@4.0.0-rc.112_effect@4.0.0-rc.112/node_modules/@effect/platform-node/dist/NodeFileSystem.js
var layer5 = layer4;

// node_modules/.pnpm/@effect+platform-node-shared@4.0.0-rc.112_effect@4.0.0-rc.112/node_modules/@effect/platform-node-shared/dist/NodePath.js
import * as NodePath from "node:path";
import * as NodeUrl from "node:url";
var fileUrlOps = (windows) => ({
  fromFileUrl: (url) => try_2({
    try: () => NodeUrl.fileURLToPath(url, {
      windows
    }),
    catch: (cause) => new BadArgument({
      module: "Path",
      method: "fromFileUrl",
      cause
    })
  }),
  toFileUrl: (path) => try_2({
    try: () => NodeUrl.pathToFileURL(path, {
      windows
    }),
    catch: (cause) => new BadArgument({
      module: "Path",
      method: "toFileUrl",
      cause
    })
  })
});
var layerPosix = /* @__PURE__ */ succeed5(Path)({
  [TypeId29]: TypeId29,
  ...NodePath.posix,
  .../* @__PURE__ */ fileUrlOps(false)
});
var layerWin32 = /* @__PURE__ */ succeed5(Path)({
  [TypeId29]: TypeId29,
  ...NodePath.win32,
  .../* @__PURE__ */ fileUrlOps(true)
});
var layer6 = /* @__PURE__ */ succeed5(Path)({
  [TypeId29]: TypeId29,
  ...NodePath,
  .../* @__PURE__ */ fileUrlOps(void 0)
});

// node_modules/.pnpm/@effect+platform-node@4.0.0-rc.112_effect@4.0.0-rc.112/node_modules/@effect/platform-node/dist/NodePath.js
var layer7 = layer6;

// node_modules/.pnpm/@effect+platform-node-shared@4.0.0-rc.112_effect@4.0.0-rc.112/node_modules/@effect/platform-node-shared/dist/NodeStdio.js
var layer8 = /* @__PURE__ */ succeed5(Stdio, /* @__PURE__ */ make20({
  args: /* @__PURE__ */ sync3(() => process.argv.slice(2)),
  stdinIsTerminal: /* @__PURE__ */ sync3(() => process.stdin.isTTY === true),
  stdoutIsTerminal: /* @__PURE__ */ sync3(() => process.stdout.isTTY === true),
  stdout: (options) => fromWritable({
    evaluate: () => process.stdout,
    onError: (cause) => systemError({
      module: "Stdio",
      method: "stdout",
      _tag: "Unknown",
      cause
    }),
    endOnDone: options?.endOnDone ?? false
  }),
  stderr: (options) => fromWritable({
    evaluate: () => process.stderr,
    onError: (cause) => systemError({
      module: "Stdio",
      method: "stderr",
      _tag: "Unknown",
      cause
    }),
    endOnDone: options?.endOnDone ?? false
  }),
  stdin: /* @__PURE__ */ fromReadable({
    evaluate: () => process.stdin,
    onError: (cause) => systemError({
      module: "Stdio",
      method: "stdin",
      _tag: "Unknown",
      cause
    }),
    closeOnDone: false
  })
}));

// node_modules/.pnpm/@effect+platform-node@4.0.0-rc.112_effect@4.0.0-rc.112/node_modules/@effect/platform-node/dist/NodeStdio.js
var layer9 = layer8;

// node_modules/.pnpm/@effect+platform-node-shared@4.0.0-rc.112_effect@4.0.0-rc.112/node_modules/@effect/platform-node-shared/dist/NodeTerminal.js
import * as readline from "node:readline";
var make27 = /* @__PURE__ */ fnUntraced2(function* (shouldQuit = defaultShouldQuit) {
  const stdin = process.stdin;
  const stdout = process.stdout;
  const lines = yield* make10();
  let inputEnded = stdin.readableEnded;
  let readlineActive = false;
  const onStdinEnd = () => {
    inputEnded = true;
    if (!readlineActive) {
      endUnsafe(lines);
    }
  };
  stdin.once("end", onStdinEnd);
  yield* addFinalizer3(() => sync3(() => stdin.off("end", onStdinEnd)));
  const rlRef = yield* make16({
    acquire: acquireRelease2(sync3(() => {
      const rl = readline.createInterface({
        input: stdin,
        escapeCodeTimeout: 50
      });
      const onLine = (line) => offerUnsafe(lines, line);
      const onClose = () => {
        readlineActive = false;
        endUnsafe(lines);
      };
      readlineActive = true;
      readline.emitKeypressEvents(stdin, rl);
      rl.on("line", onLine);
      rl.once("close", onClose);
      if (stdin.isTTY) {
        stdin.setRawMode(true);
      }
      return {
        rl,
        onClose,
        onLine
      };
    }), ({
      rl,
      onClose,
      onLine
    }) => sync3(() => {
      readlineActive = false;
      rl.off("line", onLine);
      rl.off("close", onClose);
      if (stdin.isTTY) {
        stdin.setRawMode(false);
      }
      rl.close();
      if (inputEnded) {
        endUnsafe(lines);
      }
    })),
    idleTimeToLive: "10 millis"
  });
  const columns = sync3(() => stdout.columns ?? 0);
  const rows = sync3(() => stdout.rows ?? 0);
  const readInput = gen2(function* () {
    const queue = yield* make10();
    const handleKeypress = (s2, k) => {
      const userInput = {
        input: fromUndefinedOr(s2),
        key: {
          name: k.name ?? "",
          ctrl: !!k.ctrl,
          meta: !!k.meta,
          shift: !!k.shift
        }
      };
      offerUnsafe(queue, userInput);
      if (shouldQuit(userInput)) {
        endUnsafe(queue);
      }
    };
    const keepAlive = setInterval(() => {
    }, 2147483647);
    const handleEnd = () => {
      clearInterval(keepAlive);
      endUnsafe(queue);
    };
    yield* addFinalizer3(() => sync3(() => {
      clearInterval(keepAlive);
      stdin.off("keypress", handleKeypress);
      stdin.off("end", handleEnd);
    }));
    stdin.on("keypress", handleKeypress);
    if (inputEnded) {
      handleEnd();
    } else {
      yield* get6(rlRef);
      stdin.once("end", handleEnd);
    }
    return queue;
  });
  const readLine = suspend3(() => poll(lines).pipe(flatMap4(match({
    onNone: () => scoped2(andThen2(get6(rlRef), take3(lines))),
    onSome: succeed6
  })), mapError2(() => new QuitError({}))));
  const display = (prompt) => uninterruptible2(callback2((resume) => {
    stdout.write(prompt, (err) => isNullish(err) ? resume(void_3) : resume(fail6(badArgument({
      module: "Terminal",
      method: "display",
      description: "Failed to write prompt to stdout",
      cause: err
    }))));
  }));
  return make21({
    columns,
    rows,
    readInput,
    readLine,
    display
  });
});
var layer10 = /* @__PURE__ */ effect(Terminal, /* @__PURE__ */ make27(defaultShouldQuit));
function defaultShouldQuit(input) {
  return input.key.ctrl && (input.key.name === "c" || input.key.name === "d");
}

// node_modules/.pnpm/@effect+platform-node@4.0.0-rc.112_effect@4.0.0-rc.112/node_modules/@effect/platform-node/dist/NodeTerminal.js
var layer11 = layer10;

// node_modules/.pnpm/@effect+platform-node@4.0.0-rc.112_effect@4.0.0-rc.112/node_modules/@effect/platform-node/dist/NodeServices.js
var layer12 = /* @__PURE__ */ provideMerge(layer, /* @__PURE__ */ mergeAll2(layer5, layer3, layer7, layer9, layer11));

// src/main.ts
import * as nodePath9 from "node:path";

// src/hash.ts
import { createHash as createHash2 } from "node:crypto";

// src/pystr.ts
var LETTER = new RegExp("^\\p{L}$", "u");
var ALNUM = /^[\p{L}\p{N}]$/u;
var DIGIT = new RegExp("^\\p{Nd}$", "u");
var IDENT = /^[\p{XID_Start}_][\p{XID_Continue}]*$/u;
var SPACE = /[\t\n\v\f\r\x1c-\x1f \x85\xa0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]/u;
var isAlphaChar = (ch) => LETTER.test(ch);
var isAlnumChar = (ch) => ALNUM.test(ch);
var isDigitChar = (ch) => DIGIT.test(ch);
var isSpaceChar = (ch) => SPACE.test(ch);
var every = (s2, pred) => {
  if (s2.length === 0) return false;
  for (const ch of s2) if (!pred(ch)) return false;
  return true;
};
var isAlpha = (s2) => every(s2, isAlphaChar);
var isDigit = (s2) => every(s2, isDigitChar);
var isIdentifier = (s2) => s2.length > 0 && IDENT.test(s2);
var LOWER = new RegExp("^\\p{Lowercase}$", "u");
var UPPER = new RegExp("^\\p{Uppercase}$", "u");
var TITLECASE = new RegExp("^\\p{Lt}$", "u");
var isCased = (ch) => LOWER.test(ch) || UPPER.test(ch) || TITLECASE.test(ch);
var isLower = (s2) => {
  let cased = false;
  for (const ch of s2) {
    if (UPPER.test(ch) || TITLECASE.test(ch)) return false;
    if (LOWER.test(ch)) cased = true;
  }
  return cased;
};
var isUpper = (s2) => {
  let cased = false;
  for (const ch of s2) {
    if (LOWER.test(ch) || TITLECASE.test(ch)) return false;
    if (UPPER.test(ch)) cased = true;
  }
  return cased;
};
var DIGRAPHS = { "\u01C4": "\u01C5", "\u01C5": "\u01C5", "\u01C6": "\u01C5", "\u01C7": "\u01C8", "\u01C8": "\u01C8", "\u01C9": "\u01C8", "\u01CA": "\u01CB", "\u01CB": "\u01CB", "\u01CC": "\u01CB", "\u01F1": "\u01F2", "\u01F2": "\u01F2", "\u01F3": "\u01F2" };
var titleChar = (ch) => {
  if (DIGRAPHS[ch]) return DIGRAPHS[ch];
  const upper = ch.toUpperCase();
  return upper.length > 1 ? upper[0] + upper.slice(1).toLowerCase() : upper;
};
var title = (s2) => {
  let out2 = "";
  let previousCased = false;
  for (const ch of s2) {
    if (isCased(ch)) {
      out2 += previousCased ? ch.toLowerCase() : titleChar(ch);
      previousCased = true;
    } else {
      out2 += ch;
      previousCased = false;
    }
  }
  return out2;
};
var splitWs = (s2) => {
  const out2 = [];
  let current = "";
  for (const ch of s2) {
    if (isSpaceChar(ch)) {
      if (current) out2.push(current);
      current = "";
    } else current += ch;
  }
  if (current) out2.push(current);
  return out2;
};
var split2 = (s2, sep, maxsplit = -1) => {
  const out2 = [];
  let rest = s2;
  while (maxsplit < 0 || out2.length < maxsplit) {
    const at = rest.indexOf(sep);
    if (at < 0) break;
    out2.push(rest.slice(0, at));
    rest = rest.slice(at + sep.length);
  }
  out2.push(rest);
  return out2;
};
var strip = (s2, chars) => lstrip(rstrip(s2, chars), chars);
var lstrip = (s2, chars) => {
  const drop2 = chars === void 0 ? isSpaceChar : (ch) => chars.includes(ch);
  let i = 0;
  const cps = Array.from(s2);
  while (i < cps.length && drop2(cps[i])) i++;
  return cps.slice(i).join("");
};
var rstrip = (s2, chars) => {
  const drop2 = chars === void 0 ? isSpaceChar : (ch) => chars.includes(ch);
  const cps = Array.from(s2);
  let j = cps.length;
  while (j > 0 && drop2(cps[j - 1])) j--;
  return cps.slice(0, j).join("");
};
var partition5 = (s2, sep) => {
  const at = s2.indexOf(sep);
  return at < 0 ? [s2, "", ""] : [s2.slice(0, at), sep, s2.slice(at + sep.length)];
};
var pyCompare = (a, b) => {
  if (a === b) return 0;
  const ia = a[Symbol.iterator]();
  const ib = b[Symbol.iterator]();
  for (; ; ) {
    const x = ia.next();
    const y = ib.next();
    if (x.done && y.done) return 0;
    if (x.done) return -1;
    if (y.done) return 1;
    const cx = x.value.codePointAt(0);
    const cy = y.value.codePointAt(0);
    if (cx !== cy) return cx < cy ? -1 : 1;
  }
};
var sorted = (values) => Array.from(values).sort(pyCompare);
var sortedTuples = (rows) => [...rows].sort((a, b) => {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const c = pyCompare(a[i], b[i]);
    if (c) return c;
  }
  return a.length - b.length;
});
var maxStr = (values, fallback) => {
  let best;
  for (const v of values) if (best === void 0 || pyCompare(v, best) > 0) best = v;
  return best === void 0 ? fallback : best;
};
var minStr = (values, fallback) => {
  let best;
  for (const v of values) if (best === void 0 || pyCompare(v, best) < 0) best = v;
  return best === void 0 ? fallback : best;
};
var repr = (s2) => {
  const quote = s2.includes("'") && !s2.includes('"') ? '"' : "'";
  let out2 = quote;
  for (const ch of s2) {
    const cp2 = ch.codePointAt(0);
    if (ch === quote || ch === "\\") out2 += "\\" + ch;
    else if (ch === "\n") out2 += "\\n";
    else if (ch === "\r") out2 += "\\r";
    else if (ch === "	") out2 += "\\t";
    else if (cp2 < 32 || cp2 === 127) out2 += "\\x" + cp2.toString(16).padStart(2, "0");
    else if (cp2 >= 128 && !isPrintable(ch)) out2 += cp2 <= 255 ? "\\x" + cp2.toString(16).padStart(2, "0") : cp2 <= 65535 ? "\\u" + cp2.toString(16).padStart(4, "0") : "\\U" + cp2.toString(16).padStart(8, "0");
    else out2 += ch;
  }
  return out2 + quote;
};
var isPrintable = (ch) => !/[\p{Cc}\p{Cf}\p{Cs}\p{Co}\p{Cn}\p{Zl}\p{Zp}\p{Zs}]/u.test(ch) || ch === " ";
var reprList = (items) => "[" + items.map(repr).join(", ") + "]";
var reprTuple = (items) => items.length === 1 ? "(" + repr(items[0]) + ",)" : "(" + items.map(repr).join(", ") + ")";
var zfill = (n, width) => String(n).padStart(width, "0");
var ljust = (s2, width) => s2.padEnd(width, " ");
var pyStr = (v) => {
  if (v === null || v === void 0) return "None";
  if (v === true) return "True";
  if (v === false) return "False";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return "[" + v.map((x) => typeof x === "string" ? repr(x) : pyStr(x)).join(", ") + "]";
  return String(v);
};
var pyGet = (obj, key, fallback) => key in obj ? pyStr(obj[key]) : fallback;

// src/pyjson.ts
var hex4 = (n) => "\\u" + n.toString(16).padStart(4, "0");
var encodeString = (s2, ensureAscii) => {
  let out2 = '"';
  for (let i = 0; i < s2.length; i++) {
    const code = s2.charCodeAt(i);
    const ch = s2[i];
    if (ch === '"') out2 += '\\"';
    else if (ch === "\\") out2 += "\\\\";
    else if (ch === "\n") out2 += "\\n";
    else if (ch === "\r") out2 += "\\r";
    else if (ch === "	") out2 += "\\t";
    else if (ch === "\b") out2 += "\\b";
    else if (ch === "\f") out2 += "\\f";
    else if (code < 32) out2 += hex4(code);
    else if (ensureAscii && code > 126) out2 += hex4(code);
    else out2 += ch;
  }
  return out2 + '"';
};
var encodeNumber = (n) => {
  if (Number.isInteger(n)) return String(n);
  if (!Number.isFinite(n)) return Number.isNaN(n) ? "NaN" : n > 0 ? "Infinity" : "-Infinity";
  return String(n);
};
var pyJsonDumps = (value, options = {}) => {
  const sortKeys = options.sortKeys ?? false;
  const ensureAscii = options.ensureAscii ?? true;
  const indent = options.indent;
  const itemSep = indent === void 0 ? ", " : ",";
  const pad = (level) => indent === void 0 ? "" : "\n" + " ".repeat(indent * level);
  const walk = (v, level) => {
    if (v === null || v === void 0) return "null";
    if (typeof v === "string") return encodeString(v, ensureAscii);
    if (typeof v === "number") return encodeNumber(v);
    if (typeof v === "boolean") return v ? "true" : "false";
    if (Array.isArray(v)) {
      if (v.length === 0) return "[]";
      const inner = v.map((x) => pad(level + 1) + walk(x, level + 1)).join(itemSep);
      return "[" + inner + pad(level) + "]";
    }
    if (typeof v === "object") {
      const keys2 = Object.keys(v);
      if (keys2.length === 0) return "{}";
      const ordered = sortKeys ? [...keys2].sort(pyCompare) : keys2;
      const inner = ordered.map((k) => pad(level + 1) + encodeString(k, ensureAscii) + ": " + walk(v[k], level + 1)).join(itemSep);
      return "{" + inner + pad(level) + "}";
    }
    throw new TypeError(`Object of type ${typeof v} is not JSON serializable`);
  };
  return walk(value, 0);
};

// src/hash.ts
var sha256Hex = (data) => createHash2("sha256").update(data).digest("hex");
var sha1Hex = (data) => createHash2("sha1").update(data).digest("hex");
var sha256Json = (value, options) => sha256Hex(Buffer.from(pyJsonDumps(value, options), "utf8"));
var sha1Json = (value, options) => sha1Hex(Buffer.from(pyJsonDumps(value, options), "utf8"));

// src/state.ts
var CONTENT_FIELDS = [
  "statement",
  "gloss",
  "effect",
  "contract",
  "body",
  "target",
  "walkthrough",
  "composition",
  "decisions",
  "deferred",
  "adaptation",
  "depends",
  "implementation_plan",
  "behavior"
];
var truthy = (v) => {
  if (v === void 0 || v === null || v === false || v === 0 || v === "") return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;
  return true;
};
var fingerprint = (node) => {
  const content = {};
  for (const key of CONTENT_FIELDS) if (truthy(node[key])) content[key] = node[key];
  return sha256Json(content, { sortKeys: true, ensureAscii: false });
};
var currentEvidence = (node) => {
  if (node.design !== "approved" || node.approved_content_hash !== fingerprint(node)) return [];
  return (node.evidence ?? []).map((ev, i) => [`EV-${i + 1}`, ev]).filter(([, ev]) => (ev.dependency_hash ?? "") === (node.evidence_context ?? "") && ev.revision === (node.revision ?? 0) && ev.content_hash === node.approved_content_hash);
};
var coverage = (node) => {
  const clauses = new Set(Object.keys(node.contract ?? {}));
  const records = node.evidence ?? [];
  const evidence = currentEvidence(node);
  const resolved = /* @__PURE__ */ new Set();
  for (const [, ev] of evidence) if (ev.result === "pass" && !ev.withdrawn) for (const ref of ev.resolves ?? []) resolved.add(ref);
  const latest = /* @__PURE__ */ new Map();
  for (const [eid, ev] of evidence) {
    if (ev.withdrawn) continue;
    if (ev.result === "fail" && resolved.has(eid)) continue;
    const list2 = ev.clauses && ev.clauses.length ? ev.clauses : [""];
    for (const clause of list2) latest.set(JSON.stringify([clause, ev.kind ?? null, ev.ref ?? null]), { clause, result: ev.result });
  }
  const failures = sorted(new Set([...latest.values()].filter((v) => v.result === "fail").map((v) => v.clause || "(unscoped)")));
  const passed = new Set([...latest.values()].filter((v) => v.result === "pass" && clauses.has(v.clause)).map((v) => v.clause));
  let status;
  if (failures.length) status = "failed";
  else if (clauses.size && passed.size === clauses.size && [...clauses].every((c) => passed.has(c))) status = "verified";
  else if (latest.size) status = "partial";
  else if (records.length) status = "stale";
  else status = "unverified";
  return { status, covered: sorted(passed), missing: sorted([...clauses].filter((c) => !passed.has(c))), failed: failures };
};
var refresh = (nodes) => {
  for (const node of Object.values(nodes)) node.verification = coverage(node).status;
};
var isPlainObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
var nonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;
var validateBehavior = (value) => {
  if (!isPlainObject(value) || Object.keys(value).some((k) => !["states", "transitions", "participants", "messages"].includes(k))) {
    return "behavior must contain states/transitions and/or participants/messages arrays";
  }
  const ids = {};
  for (const field of ["states", "participants"]) {
    const rows = value[field] ?? [];
    if (!Array.isArray(rows)) return `behavior.${field} must be an array`;
    ids[field] = /* @__PURE__ */ new Set();
    for (const row of rows) {
      if (!isPlainObject(row) || !nonEmptyString(row.id) || !nonEmptyString(row.label)) return `behavior.${field} items need nonempty id and label strings`;
      if (ids[field].has(row.id)) return `behavior.${field}: duplicate id ${row.id}`;
      ids[field].add(row.id);
      for (const flag of ["initial", "terminal"]) if (flag in row && typeof row[flag] !== "boolean") return `behavior.${field}.${flag} must be boolean`;
      if ("node" in row && typeof row.node !== "string") return `behavior.${field}.node must be a node ID`;
    }
  }
  for (const [field, endpoints, label] of [["transitions", "states", "event"], ["messages", "participants", "label"]]) {
    const rows = value[field] ?? [];
    if (!Array.isArray(rows)) return `behavior.${field} must be an array`;
    for (const row of rows) {
      if (!isPlainObject(row) || !nonEmptyString(row[label])) return `behavior.${field} items need a nonempty ${label}`;
      if (typeof row.from !== "string" || typeof row.to !== "string" || !ids[endpoints].has(row.from) || !ids[endpoints].has(row.to)) return `behavior.${field} endpoints must name recorded ${endpoints}`;
      for (const key of ["guard", "action", "node", "kind"]) if (key in row && typeof row[key] !== "string") return `behavior.${field}.${key} must be a string`;
    }
  }
  return "";
};

// src/pseudocode.ts
var splitComment = (line) => {
  let quote = "";
  let escaped = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) quote = "";
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "\u25B7" || line.startsWith("--", i)) {
      const width = ch === "\u25B7" ? 1 : 2;
      return [line.slice(0, i), line.slice(i, i + width), line.slice(i + width)];
    }
  }
  return [line, "", ""];
};
var signature = (statement) => {
  let value = strip(statement);
  let quote = "";
  let depth = 0;
  let escaped = false;
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) quote = "";
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "(") depth += 1;
    else if (ch === ")") depth -= 1;
    else if (depth === 0 && (ch === "\u2190" || value.startsWith("<-", i))) {
      value = strip(value.slice(i + (ch === "\u2190" ? 1 : 2)));
      break;
    }
  }
  for (const prefix3 of ["procedure ", "function ", "return ", "->"]) {
    if (value.toLowerCase().startsWith(prefix3)) {
      value = strip(value.slice(prefix3.length));
      break;
    }
  }
  depth = 0;
  quote = "";
  escaped = false;
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) quote = "";
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "(") depth += 1;
    else if (ch === ")") {
      depth -= 1;
      if (depth === 0) return value.slice(0, i + 1);
    }
  }
  return rstrip(value, ":");
};
var displayCode = (code) => {
  let value = strip(code);
  if (value.startsWith("->")) value = "return " + value.slice(2).replace(/^\s+/u, "");
  let result4 = "";
  let quote = "";
  let escaped = false;
  let i = 0;
  while (i < value.length) {
    const ch = value[i];
    if (quote) {
      result4 += ch;
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) quote = "";
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      result4 += ch;
    } else if (value.startsWith("<-", i)) {
      result4 += "\u2190";
      i += 1;
    } else result4 += ch;
    i += 1;
  }
  return result4;
};
var HEADINGS = { pre: "Require", post: "Ensure", input: "Input", output: "Output" };
var contractHeading = (label) => HEADINGS[label] ?? title(label);
var algorithmLines = (nid, node, tag2) => {
  const out2 = [`Algorithm ${nid}: ${node.gloss || signature(node.statement)}`];
  for (const [k, v] of Object.entries(node.contract ?? {})) out2.push(`${contractHeading(k)}: ${v}`);
  const body = node.body ?? [];
  if (body.length === 0) {
    if (node.target) out2.push("Implementation target: " + node.target);
    else if (node.implementation_plan) {
      out2.push("Implementation approach: " + node.implementation_plan.approach);
      out2.push("Validation plan: " + node.implementation_plan.validation);
    }
    return out2;
  }
  const width = String(body.length + 2).length;
  out2.push(`${"1".padStart(width)}: procedure ${signature(node.statement)}`);
  body.forEach((item, index) => {
    const note = tag2(item);
    const code = " ".repeat(2 + (item.indent ?? 0)) + displayCode(item.code);
    out2.push(`${String(index + 2).padStart(width)}: ${code}` + (note ? `  \u25B7 ${note}` : ""));
  });
  out2.push(`${String(body.length + 2).padStart(width)}: end procedure`);
  return out2;
};
var presentation = (ledger) => {
  const signatures = {};
  const code = {};
  const visit = (value) => {
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
    } else if (value && typeof value === "object") {
      for (const [key, item] of Object.entries(value)) {
        if ((key === "statement" || key === "code") && typeof item === "string") {
          signatures[item] = signature(item);
          code[item] = displayCode(item);
        }
        visit(item);
      }
    }
  };
  visit(ledger);
  return { signatures, code };
};

// src/core.ts
var LEDGER = "ledger.json";
var LOG = ".stepwise.log";
var JOURNAL = ".stepwise-transaction.json";
var LOCK = ".stepwise.lock";
var CODE_COL = 58;
var CONTRACT_KEYS = ["pre", "post", "failure", "cancellation", "invariant", "progress"];
var TEXT_FIELDS = ["gloss", "effect", "statement"];
var LIST_FIELDS = ["walkthrough", "composition", "decisions", "deferred", "adaptation"];
var JSON_SET_FIELDS = [...TEXT_FIELDS, "contract", ...LIST_FIELDS, "depends", "realization", "verification", "implementation_plan", "behavior"];
var REALIZATION = ["not-started", "partial", "implemented"];
var VERIFICATION = ["unverified", "partial", "verified", "stale", "failed"];
var DESIGN = ["draft", "approved", "stale", "superseded", "retired"];
var TRANSITIONS = {
  "draft->approved": "approve",
  "approved->draft": "reopen",
  "stale->draft": "reopen",
  "retired->draft": "reopen",
  "approved->stale": "stale",
  "draft->stale": "stale",
  "approved->superseded": "supersede",
  "stale->superseded": "supersede",
  "draft->superseded": "supersede",
  "approved->retired": "retire",
  "stale->retired": "retire",
  "draft->retired": "retire",
  "approved->approved": "approve"
};
var transition = (from, to) => TRANSITIONS[`${from}->${to}`];
var legalMoves = (from) => sorted(new Set(Object.entries(TRANSITIONS).filter(([k]) => k.startsWith(from + "->")).map(([, v]) => v)));
var NEXT_STEP = {
  draft: "finish the draft (`set`, `answer`, `body`/`terminal`, `set walkthrough`/`composition`) then `approve`",
  approved: "nothing \u2014 refine its children, or `reopen` / `stale` / `supersede` / `retire` when something changes",
  "stale-intact": "`reaffirm --by WHO` after accepting changed dependencies, or `reopen` to revise the node",
  stale: "`reopen` and re-`approve` it, or `retire` / `supersede` it",
  superseded: "nothing \u2014 the replacement carries the work",
  retired: "nothing \u2014 the design dropped it; `reopen` only to revive it"
};
var CONTROL = /* @__PURE__ */ new Set(["if", "else", "elif", "loop", "while", "for", "until", "case", "match", "try", "finally", "repeat", "end", "upon", "atomic", "parallel"]);
var ENTRY_FILE = { term: "terms", fact: "facts", scenario: "scenarios" };
var GENERATED = "_Generated by `stepwise.py` from ledger.json. Use the CLI; never edit this file._";
var isNodeId = (s2) => s2.length === 5 && s2.startsWith("D-") && isDigit(s2.slice(2));
var isCtxId = (s2) => (s2.startsWith("CTX-F") || s2.startsWith("CTX-S")) && isDigit(s2.slice(5));
var isAdrId = (s2) => s2.length === 8 && s2.startsWith("ADR-") && isDigit(s2.slice(4));
var isIdent = (s2) => s2.length > 0 && isIdentifier(s2) && (isAlphaChar(s2[0]) || s2[0] === "_");
var anchorOf = (heading) => {
  let keep = "";
  for (const c of heading) keep += isAlnumChar(c) ? c.toLowerCase() : " -_".includes(c) ? " " : "";
  return splitWs(keep).join("-");
};
var unknowns = (...texts) => {
  const out2 = /* @__PURE__ */ new Set();
  for (const t of texts) {
    for (const w of splitWs(t)) {
      if (w.startsWith("?") && w.length > 1 && isAlphaChar(Array.from(w)[1])) out2.add(rstrip(w.slice(1), ",.;:)]}"));
    }
  }
  return sorted(out2);
};
var fnOf = (statement) => {
  const value = signature(statement);
  const [rawName, sep] = partition5(value, "(");
  const name = strip(rawName);
  return sep && isIdent(name) ? name : "";
};
var NOT_CALLS = /* @__PURE__ */ new Set([...CONTROL, "return", "assert", "invariant"]);
var callNames = (code) => {
  const out2 = [];
  const n = code.length;
  let i = 0;
  while (i < n) {
    const c = code[i];
    if (c === '"' || c === "'") {
      const quote = c;
      i += 1;
      while (i < n) {
        if (code[i] === "\\") {
          i += 2;
          continue;
        }
        if (code[i] === quote) {
          i += 1;
          break;
        }
        i += 1;
      }
      continue;
    }
    if (isAlphaChar(c) || c === "_") {
      let j = i;
      while (j < n && (isAlnumChar(code[j]) || code[j] === "_")) j += 1;
      let k = j;
      while (k < n && code[k] === " ") k += 1;
      const name = code.slice(i, j);
      const prev = i ? code[i - 1] : "";
      if (k < n && code[k] === "(" && prev !== "." && isIdent(name) && !NOT_CALLS.has(name.toLowerCase())) out2.push(name);
      i = j;
    } else i += 1;
  }
  return out2;
};
var stmtKind = (code) => {
  const s2 = strip(code).toLowerCase();
  if (!s2) return "comment";
  if (s2.startsWith("{") || s2.startsWith("assert ") || s2.startsWith("invariant ")) return "assert";
  const head3 = rstrip(split2(s2, " ", 1)[0], ":");
  if (CONTROL.has(head3) && (s2.endsWith(":") || s2.endsWith(" then") || s2.endsWith(" do") || ["else", "repeat", "until", "end"].includes(head3))) return "control";
  return "stmt";
};
var targetOk = (target) => {
  const [head3, sep, rest] = partition5(target, ": ");
  const headOk = head3.length > 0 && Array.from(head3).every((c) => isAlnumChar(c) || c === "-" || c === "_") && isLower(head3[0]);
  if (!sep || !strip(rest) || !head3 || !headOk) {
    return `Target ${repr(target)} must read '<target>: <identifier>' (dbos: DBOS.startWorkflow, postgres: SELECT ... ORDER BY seq, ts: Promise.all)`;
  }
  return "";
};
var indentOf = (line) => line.length - lstrip(line).length;
var count = (s2, ch) => s2.split(ch).length - 1;
var joinContinuations = (raw) => {
  const out2 = [];
  let buf = "";
  let depth = 0;
  for (const ln of raw) {
    if (depth <= 0 && out2.length && strip(ln) && continues(out2[out2.length - 1], ln)) {
      out2[out2.length - 1] = merge5(out2[out2.length - 1], ln);
      continue;
    }
    buf = depth <= 0 ? ln : rstrip(buf) + (strip(ln).startsWith(")") || rstrip(buf).endsWith("(") ? "" : " ") + strip(ln);
    depth += count(ln, "(") - count(ln, ")");
    if (depth <= 0) {
      out2.push(buf);
      buf = "";
      depth = 0;
    }
  }
  if (buf) out2.push(buf);
  return out2;
};
var continues = (prev, ln) => {
  const [code, comment] = splitComment(prev);
  return Boolean(strip(code)) && !comment && stmtKind(code) === "stmt" && !rstrip(code).endsWith(":") && indentOf(ln) > indentOf(prev);
};
var merge5 = (prev, ln) => {
  const [code, sep, tag2] = splitComment(ln);
  const joined = rstrip(prev) + " " + strip(code);
  return sep ? `${joined} --${tag2}` : joined;
};
var BodyError = class extends Error {
};
var parseBody = (text, fn3) => {
  let raw = text.split(/\r\n|[\n\r\v\f\x1c\x1d\x1e\x85\u2028\u2029]/u).filter((ln) => strip(ln));
  if (raw.length) {
    const first = strip(raw[0]);
    const prefix3 = split2(first, " ", 1)[0].toLowerCase();
    if (prefix3 === "procedure" || prefix3 === "function") {
      if (fnOf(first) !== fn3) throw new BodyError(`procedure signature must match ${fn3}`);
      raw = raw.slice(1);
      if (raw.length && ["end procedure", "end function"].includes(strip(raw[raw.length - 1]).toLowerCase())) raw = raw.slice(0, -1);
    } else if (first.endsWith(":") && stmtKind(first) !== "control" && strip(partition5(first, "(")[0]) === fn3) raw = raw.slice(1);
  }
  for (const line of raw) {
    const head3 = strip(line).toLowerCase();
    if (["algorithm ", "require:", "ensure:", "input:", "output:"].some((p2) => head3.startsWith(p2))) {
      throw new BodyError("algorithm captions and contract headers are generated; store requirements with set, and pass only the procedure body");
    }
    if (head3.startsWith("procedure ") || head3.startsWith("function ") || head3 === "end procedure" || head3 === "end function") {
      throw new BodyError("one procedure per node; represent helper procedures as child nodes");
    }
  }
  const lines = joinContinuations(raw);
  const base = lines.length ? Math.min(...lines.map((ln) => ln.length - lstrip(ln).length)) : 0;
  const items = [];
  for (const ln of lines) {
    const [code, sep, tag2] = splitComment(strip(ln));
    const item = { indent: ln.length - lstrip(ln).length - base, code: strip(code) };
    if (sep) {
      let t = strip(tag2);
      if (t.includes(" -- ")) {
        const [head3, , gl] = partition5(t, " -- ");
        t = strip(head3);
        if (strip(gl)) item.gloss = strip(gl);
      }
      const words = splitWs(t);
      if (t.startsWith("\u2197") && words.length > 1) item.reuse = words[1];
      else if (t.startsWith("\u21D2") || t.startsWith("\u2713")) item.target = strip(t.slice(1));
      else if (words.length && isNodeId(rstrip(words[0], ":"))) {
        item.child = rstrip(words[0], ":");
        const rest = strip(lstrip(strip(t.slice(words[0].length)), ":"));
        if (rest) item.gloss = rest;
      } else item.note = t;
    }
    items.push(item);
  }
  return items;
};
var itemTag = (it) => {
  if (it.child !== void 0) return it.gloss ? `${it.child}: ${it.gloss}` : it.child;
  const gloss = it.gloss ? ` -- ${it.gloss}` : "";
  if (it.reuse !== void 0) return `\u2197 ${it.reuse}${gloss}`;
  if (it.target !== void 0) return `\u21D2 ${it.target}${gloss}`;
  return it.note ?? "";
};
var fmt = (code, tag2, indent) => {
  const left = " ".repeat(indent) + code;
  return tag2 ? `${left}${" ".repeat(Math.max(CODE_COL - left.length, 1))}-- ${tag2}` : left;
};
var bodyText = (items, indent = 2) => items.map((it) => fmt(it.code, itemTag(it), indent + it.indent));
var bodyHash = (items) => sha1Json(items, { sortKeys: true }).slice(0, 12);
var proposalHash = (n) => fingerprint(n);
var legacyIntact = (n) => {
  const fields = ["statement", "gloss", "effect", "contract", "body", "walkthrough", "composition", "decisions", "deferred", "target", "adaptation"];
  const content = {};
  for (const f of fields) if (truthy(n[f])) content[f] = n[f];
  const digest3 = sha256Json(content, { sortKeys: true, ensureAscii: false }).slice(0, 16);
  return n.proposal_hash === digest3 && n.approved_hash === bodyHash(n.body ?? []) && n.contract_hash === contractHash(n);
};
var intact = (n) => Boolean(n.approved_content_hash) && n.approved_content_hash === fingerprint(n) && n.approved_hash === bodyHash(n.body ?? []) && n.contract_hash === contractHash(n);
var commaValues = (values) => {
  const out2 = [];
  for (const value of values) for (const part of value.split(",")) {
    const p2 = strip(part);
    if (p2 && !out2.includes(p2)) out2.push(p2);
  }
  return out2;
};
var contractHash = (n) => sha1Json([n.statement ?? "", n.target ?? "", n.contract ?? {}], { sortKeys: true }).slice(0, 12);
var frontierStatement = (code) => {
  const [lhs, sep, rhs] = partition5(code, code.includes("\u2190") ? "\u2190" : "<-");
  if (sep) return `${strip(rhs)} -> ${strip(lhs)}`;
  return code.startsWith("->") ? strip(code.slice(2)) : code.toLowerCase().startsWith("return ") ? strip(code.slice(7)) : code;
};
var nodeUnknowns = (n) => unknowns(n.gloss ?? "", n.effect ?? "", ...Object.values(n.contract ?? {}));
var deepCopy = (v) => v === void 0 ? v : JSON.parse(JSON.stringify(v));

// src/args.ts
var ParseError = class extends Error {
  constructor(verb2, message) {
    super(message);
    this.verb = verb2;
  }
  verb;
};
var store = (dest, def = "", extra = {}) => ({ dest, kind: "store", default: def, ...extra });
var flagTrue = (dest) => ({ dest, kind: "store_true" });
var append3 = (dest) => ({ dest, kind: "append" });
var required = (dest, extra = {}) => ({ dest, kind: "store", required: true, ...extra });
var verb = (name, positionals = [], flags = {}) => ({ name, positionals, flags });
var p = (name, nargs, choices) => ({ name, nargs, choices });
var VERBS = [
  verb("html", [], { "--output": store("output") }),
  verb("proposal", [p("id")]),
  verb("repair"),
  verb("frontier"),
  verb("sync", [], { "--repo": store("repo", null) }),
  verb("check"),
  verb("show", [p("id")]),
  verb("status", [], { "--all": flagTrue("all") }),
  verb("new", [p("id"), p("statement", "?")]),
  verb("adopt", [p("id"), p("statement", "?")], { "--parent": store("parent", null) }),
  verb("bind", [p("id"), p("path")], { "--repo": store("repo", null), "--binding": store("binding", null), "--symbol": store("symbol"), "--lines": store("lines", null) }),
  verb("unbind", [p("id"), p("binding")], { "--reason": required("reason") }),
  verb("observe", [p("id"), p("payload", "?")], { "--file": store("file"), "--at": required("at"), "--by": store("by", "agent inspection") }),
  verb("observation", [p("id")]),
  verb("withdraw-evidence", [p("id"), p("evidence")], { "--reason": required("reason"), "--by": store("by", "agent inspection") }),
  verb("scan", [], { "--repo": store("repo", null), "--json": flagTrue("json") }),
  verb("reconcile", [], { "--repo": store("repo", null), "--output": store("output") }),
  verb("set", [p("id"), p("field"), p("value", "*")]),
  verb("body", [p("id")], { "--file": store("file"), "--text": store("text", null) }),
  verb("batch", [], { "--file": store("file") }),
  verb("ready", [p("id")], { "--approach": required("approach"), "--validation": required("validation") }),
  verb("answer", [p("id"), p("slug"), p("name")]),
  verb("terminal", [p("id"), p("target")]),
  verb("approve", [p("id")], { "--by": store("by", "user"), "--actor": store("actor"), "--proposal-hash": store("proposal_hash") }),
  verb("reaffirm", [p("id")], { "--by": store("by"), "--actor": store("actor") }),
  verb("reopen", [p("id"), p("reason")]),
  verb("stale", [p("id"), p("reason")]),
  verb("retire", [p("id"), p("reason")]),
  verb("supersede", [p("id"), p("new_id"), p("reason")]),
  verb("evidence", [p("id")], {
    "--kind": required("kind"),
    "--ref": required("ref"),
    "--result": required("result", { choices: ["pass", "fail"] }),
    "--note": store("note"),
    "--clause": append3("clause"),
    "--covers": append3("covers"),
    "--resolves": append3("resolves"),
    "--scope": store("scope", "unspecified", { choices: ["unspecified", "implementation", "composition", "correspondence"] }),
    "--scenario": store("scenario"),
    "--assessment": store("assessment")
  }),
  verb("entry", [p("kind", void 0, Object.keys(ENTRY_FILE)), p("heading"), p("definition")], {
    "--source": store("source"),
    "--avoid": store("avoid"),
    "--not": store("not_"),
    "--example": store("example"),
    "--given": store("given"),
    "--when": store("when"),
    "--then": store("then"),
    "--excludes": store("excludes"),
    "--settles": store("settles")
  }),
  verb("change", [p("ref")], { "--definition": store("definition"), "--rename": store("rename"), "--status": store("status", "", { choices: ["", "confirmed", "stale"] }), "--reason": required("reason"), "--minor": flagTrue("minor") }),
  verb("meta", [p("field"), p("value", "+")]),
  verb("ambiguity", [p("claim"), p("conflict", "?"), p("resolves_at", "?")], { "--drop": flagTrue("drop") }),
  verb("adr", [p("action", void 0, ["new", "accept", "supersede", "constrains"]), p("title", "?"), p("new_adr", "?")], { "--constrains": store("constrains") })
];
var BY_NAME = new Map(VERBS.map((v) => [v.name, v]));
var verbNames = () => VERBS.map((v) => v.name);
var classify = (token, spec) => {
  if (!token || token[0] !== "-") return { kind: "positional" };
  if (token in spec.flags) return { kind: "flag", flag: token };
  if (token.length === 1) return { kind: "positional" };
  if (token.includes("=")) {
    const [name, ...rest] = token.split("=");
    if (name in spec.flags) return { kind: "flag", flag: name, inline: rest.join("=") };
  }
  if (token.startsWith("--")) {
    const head3 = token.split("=")[0];
    const matches = Object.keys(spec.flags).filter((f) => f.startsWith(head3));
    if (matches.length > 1) throw new ParseError(spec.name, `ambiguous option: ${head3} could match ${matches.join(", ")}`);
    if (matches.length === 1) return token.includes("=") ? { kind: "flag", flag: matches[0], inline: token.slice(token.indexOf("=") + 1) } : { kind: "flag", flag: matches[0] };
  }
  if (/^-\d+(\.\d*)?$/u.test(token)) return { kind: "positional" };
  if (token.includes(" ")) return { kind: "positional" };
  return { kind: "unknown" };
};
var quoteChoices = (choices) => choices.map((c) => repr(c)).join(", ");
var parseArgs = (argv) => {
  if (!argv.length) throw new ParseError(null, "the following arguments are required: cmd");
  const [name, ...rest] = argv;
  const spec = BY_NAME.get(name);
  if (!spec) throw new ParseError(null, `argument cmd: invalid choice: ${repr(name)} (choose from ${quoteChoices(verbNames())})`);
  const args2 = {};
  for (const f of Object.values(spec.flags)) args2[f.dest] = f.kind === "store_true" ? false : f.kind === "append" ? [] : f.default ?? null;
  const positional = [];
  const seenFlags = /* @__PURE__ */ new Set();
  const unknown2 = [];
  for (let i = 0; i < rest.length; i++) {
    const token = rest[i];
    const kind = classify(token, spec);
    if (kind.kind === "positional") {
      positional.push(token);
      continue;
    }
    if (kind.kind === "unknown") {
      unknown2.push(token);
      continue;
    }
    const flag = spec.flags[kind.flag];
    seenFlags.add(kind.flag);
    if (flag.kind === "store_true") {
      if (kind.inline !== void 0) throw new ParseError(spec.name, `argument ${kind.flag}: ignored explicit argument ${repr(kind.inline)}`);
      args2[flag.dest] = true;
      continue;
    }
    let value;
    if (kind.inline !== void 0) value = kind.inline;
    else {
      const next = rest[i + 1];
      if (next === void 0 || classify(next, spec).kind !== "positional") throw new ParseError(spec.name, `argument ${kind.flag}: expected one argument`);
      value = next;
      i += 1;
    }
    if (flag.choices && !flag.choices.includes(value)) throw new ParseError(spec.name, `argument ${kind.flag}: invalid choice: ${repr(value)} (choose from ${quoteChoices(flag.choices)})`);
    if (flag.kind === "append") args2[flag.dest].push(value);
    else args2[flag.dest] = value;
  }
  const specs = [{ name: "dir" }, ...spec.positionals];
  const fixed = specs.filter((s2) => !s2.nargs || s2.nargs === "+").length;
  if (positional.length < fixed) {
    const missing2 = specs.filter((s2) => !s2.nargs || s2.nargs === "+").slice(positional.length).map((s2) => s2.name);
    throw new ParseError(spec.name, `the following arguments are required: ${missing2.join(", ")}`);
  }
  let cursor = 0;
  let spare = positional.length - fixed;
  for (const s2 of specs) {
    if (s2.nargs === "*" || s2.nargs === "+") {
      const take6 = (s2.nargs === "+" ? 1 : 0) + spare;
      args2[s2.name] = positional.slice(cursor, cursor + take6);
      cursor += take6;
      spare = 0;
    } else if (s2.nargs === "?") {
      if (spare > 0) {
        args2[s2.name] = positional[cursor];
        cursor += 1;
        spare -= 1;
      } else args2[s2.name] = null;
    } else {
      args2[s2.name] = positional[cursor];
      cursor += 1;
    }
    if (s2.choices && typeof args2[s2.name] === "string" && !s2.choices.includes(args2[s2.name])) {
      throw new ParseError(spec.name, `argument ${s2.name}: invalid choice: ${repr(args2[s2.name])} (choose from ${quoteChoices(s2.choices)})`);
    }
  }
  const extra = [...positional.slice(cursor), ...unknown2];
  if (extra.length) throw new ParseError(spec.name, `unrecognized arguments: ${extra.join(" ")}`);
  for (const [flagName, f] of Object.entries(spec.flags)) if (f.required && !seenFlags.has(flagName)) throw new ParseError(spec.name, `the following arguments are required: ${flagName}`);
  const dir = args2.dir;
  delete args2.dir;
  return { cmd: spec.name, dir, args: args2 };
};
var usageLine = (verbName) => verbName ? `usage: stepwise ${verbName} [-h] ...` : `usage: stepwise [-h] {${verbNames().join(",")}} ...`;

// src/errors.ts
var Fail2 = class extends Data_exports.TaggedError("Fail") {
};
var Refused = class extends Data_exports.TaggedError("Refused") {
};
var fail10 = (message) => new Fail2({ message });
var toFail = (error) => error instanceof Fail2 ? error : new Fail2({ message: messageOf(error) });
var asFail = (self) => Effect_exports.mapError(self, toFail);
var messageOf = (error) => {
  if (error instanceof Fail2) return error.message;
  if (error instanceof Error) return error.message;
  return String(error);
};

// src/ledger.ts
import * as nodePath3 from "node:path";

// src/existing.ts
import * as nodePath2 from "node:path";

// src/time.ts
var two = (n) => String(n).padStart(2, "0");
var today = (d = /* @__PURE__ */ new Date()) => `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;
var now = (d = /* @__PURE__ */ new Date()) => `${today(d)}T${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, "0")}000`;

// src/services.ts
var Io = class extends Context_exports.Service()("stepwise/Io") {
};
var processIo = Layer_exports.succeed(Io, {
  out: (text) => {
    process.stdout.write(text);
  },
  err: (text) => {
    process.stderr.write(text);
  },
  stdin: Effect_exports.tryPromise({
    try: async () => {
      const chunks2 = [];
      for await (const chunk of process.stdin) chunks2.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      return Buffer.concat(chunks2).toString("utf8");
    },
    catch: () => ""
  }).pipe(Effect_exports.orElseSucceed(() => ""))
});
var captureIo = (stdin = "") => {
  const all3 = [];
  const outs = [];
  const errs = [];
  return {
    layer: Layer_exports.succeed(Io, {
      out: (text) => {
        all3.push(text);
        outs.push(text);
      },
      err: (text) => {
        all3.push(text);
        errs.push(text);
      },
      stdin: typeof stdin === "string" ? Effect_exports.succeed(stdin) : stdin
    }),
    output: () => all3.join(""),
    stdout: () => outs.join(""),
    stderr: () => errs.join("")
  };
};
var Git = class extends Context_exports.Service()("stepwise/Git") {
};
var gitLive = Layer_exports.effect(Git, Effect_exports.gen(function* () {
  const spawner = yield* ChildProcessSpawner_exports.ChildProcessSpawner;
  return {
    head: (root) => Effect_exports.gen(function* () {
      const handle = yield* ChildProcess_exports.make("git", ["-C", root, "rev-parse", "HEAD"]);
      const text = yield* handle.stdout.pipe(Stream_exports.decodeText, Stream_exports.mkString);
      yield* handle.stderr.pipe(Stream_exports.runDrain);
      const code = yield* handle.exitCode;
      return code === 0 ? text.trim() : null;
    }).pipe(Effect_exports.scoped, Effect_exports.timeoutOption("5 seconds"), Effect_exports.map((o) => o._tag === "Some" ? o.value : null), Effect_exports.catchCause(() => Effect_exports.succeed(null)), Effect_exports.provideService(ChildProcessSpawner_exports.ChildProcessSpawner, spawner))
  };
}));
var gitNone = Layer_exports.succeed(Git, { head: () => Effect_exports.succeed(null) });

// src/paths.ts
import * as nodePath from "node:path";
import * as os from "node:os";
var expandUser = (p2) => p2 === "~" ? os.homedir() : p2.startsWith("~/") ? nodePath.join(os.homedir(), p2.slice(2)) : p2;
var resolvePath = Effect_exports.fn("resolvePath")(function* (p2) {
  const fs = yield* FileSystem_exports.FileSystem;
  const absolute = nodePath.resolve(p2);
  const tail = [];
  let cursor = absolute;
  for (; ; ) {
    const real = yield* fs.realPath(cursor).pipe(Effect_exports.option);
    if (real._tag === "Some") return tail.length ? nodePath.join(real.value, ...tail.reverse()) : real.value;
    const parent = nodePath.dirname(cursor);
    if (parent === cursor) return absolute;
    tail.push(nodePath.basename(cursor));
    cursor = parent;
  }
});
var isRelativeTo = (p2, other) => {
  const r = nodePath.relative(other, p2);
  return r === "" || !r.startsWith("..") && !nodePath.isAbsolute(r);
};
var withParents = (dir) => {
  const out2 = [dir];
  let cursor = dir;
  for (; ; ) {
    const parent = nodePath.dirname(cursor);
    if (parent === cursor) break;
    out2.push(parent);
    cursor = parent;
  }
  return out2;
};
var isDirectory = Effect_exports.fn("isDirectory")(function* (p2) {
  const fs = yield* FileSystem_exports.FileSystem;
  const info = yield* fs.stat(p2).pipe(Effect_exports.option);
  return info._tag === "Some" && info.value.type === "Directory";
});
var isNotFound = (error) => error.reason._tag === "NotFound";

// src/existing.ts
var emptyReport = () => ({ repository: null, commit: null, coverage: {}, assessment_pending: [], nodes: {}, pending: [], notifications: [], current: [], differences: [] });
var stamp = () => now();
var digest2 = (value) => sha256Json(value, { sortKeys: true, ensureAscii: false });
var repository = Effect_exports.fn("repository")(function* (led, override) {
  if (override) return yield* resolvePath(expandUser(override));
  const root = led.data?.source_root;
  return root ? yield* resolvePath(nodePath2.join(led.dir, root)) : null;
});
var setRepository = Effect_exports.fn("setRepository")(function* (led, root) {
  const path = yield* resolvePath(expandUser(root));
  if (!(yield* isDirectory(path))) return yield* fail10(`repository directory does not exist: ${path}`);
  led.data.source_root = nodePath2.relative(led.dir, path) || ".";
  return path;
});
var relativePath = (value) => {
  const parts = value.split("/").filter((p2) => p2 !== "" && p2 !== ".");
  if (!value || value.startsWith("/") || parts.includes("..") || value.includes("\\") || value.includes(":")) {
    throw fail10("source paths must be relative to the repository, without .. or drive prefixes");
  }
  return parts.join("/");
};
var cacheKey = (root, path) => `${root ?? ""}\0${path}`;
var readSource = Effect_exports.fn("readSource")(function* (root, path) {
  const fs = yield* FileSystem_exports.FileSystem;
  try {
    relativePath(path);
  } catch (error) {
    return { state: "unavailable", reason: error.message };
  }
  if (root === null || !(yield* isDirectory(root))) return { state: "unavailable", reason: "repository root is unavailable" };
  const file = yield* resolvePath(nodePath2.join(root, path));
  if (!isRelativeTo(file, root)) return { state: "unavailable", reason: "source resolves outside the repository" };
  const bytes = yield* fs.readFile(file).pipe(Effect_exports.result);
  if (bytes._tag === "Failure") {
    if (isNotFound(bytes.failure)) return { state: "missing", reason: "source file was removed or moved" };
    return { state: "unavailable", reason: bytes.failure.message };
  }
  return { state: "available", sha256: sha256Hex(bytes.success) };
});
var ensureSources = Effect_exports.fn("ensureSources")(function* (led, root, extra = []) {
  const git = yield* Git;
  const rootKey = root ?? "";
  if (!led.commits.has(rootKey)) led.commits.set(rootKey, root === null ? null : yield* git.head(root));
  const paths = new Set(extra);
  for (const n of Object.values(led.nodes)) for (const b of Object.values(n.bindings ?? {})) paths.add(b.path);
  for (const path of paths) {
    const key = cacheKey(root, path);
    if (!led.sourceCache.has(key)) led.sourceCache.set(key, yield* readSource(root, path));
  }
});
var cached3 = (led, root, path) => {
  const hit = led.sourceCache.get(cacheKey(root, path));
  if (!hit) throw new Error(`source cache miss for ${path}`);
  return hit;
};
var edges = (led, nid) => {
  const node = led.nodes[nid];
  const refs = [...node.observed_children ?? [], ...node.depends ?? []];
  for (const body of [node.body ?? [], node.observation?.body ?? []]) for (const line of body) refs.push(line.child || line.reuse);
  return sorted(new Set(refs.filter((ref) => Boolean(ref) && ref in led.nodes && ref !== nid)));
};
var assessment = (node, sourceState) => {
  const contract = node.contract ?? {};
  const observation = node.observation ?? {};
  if (!Object.keys(contract).length) return { status: "unassessed", reason: "No intended contract is recorded." };
  if (sourceState !== "current") return { status: "unknown", reason: "Current source inspection is required." };
  if (observation.design_hash !== fingerprint(node) || observation.design_context !== node.evidence_context) {
    return { status: "unknown", reason: "The intended design changed after this assessment." };
  }
  const comparisons = observation.comparisons ?? {};
  const differences = Object.keys(contract).filter((key) => comparisons[key]?.status === "differs");
  if (differences.length) return { status: "differs", reason: "Differences recorded for: " + differences.join(", ") };
  if (Object.keys(contract).every((key) => comparisons[key]?.status === "matches")) {
    return { status: "matches", reason: "The recorded inspection assesses every intended clause as matching." };
  }
  return { status: "unknown", reason: "Some intended clauses have not been assessed or remain uncertain." };
};
var implementationHash = (files) => {
  const values = Object.values(files);
  if (!values.length) return null;
  if (values.length === 1 && values[0].state === "available") return values[0].sha256;
  return digest2(files);
};
var recordVersion = (node, row, commit2) => {
  const version = row.implementation_version;
  if (!(node.bindings && Object.keys(node.bindings).length) || node.design === "retired" || node.design === "superseded") return;
  if ((node.implementation_version ?? null) !== version) {
    const previous = node.implementation_version ?? null;
    node.implementation_revision = (node.implementation_revision ?? 0) + 1;
    (node.implementation_history ??= []).push({ date: stamp(), revision: node.implementation_revision, previous, version, commit: commit2, reason: row.reason });
    node.implementation_version = version;
  }
  node.implementation_commit = commit2;
};
var historical = (n) => n.design === "retired" || n.design === "superseded";
var scanSync = (led, root) => {
  const trackScope = Boolean(root || led.data?.reconstruction);
  const commit2 = led.commits.get(root ?? "") ?? null;
  const report2 = {};
  for (const [nid, node] of Object.entries(led.nodes)) {
    const bindings = node.bindings ?? {};
    const hasBindings = Object.keys(bindings).length > 0;
    if (!trackScope && !hasBindings && !node.observation && !(node.observed_children ?? []).length && node.origin !== "existing-code") continue;
    const visited = /* @__PURE__ */ new Set();
    const pending = [nid];
    const files = {};
    while (pending.length) {
      const current = pending.pop();
      if (visited.has(current)) continue;
      visited.add(current);
      for (const binding of Object.values(led.nodes[current].bindings ?? {})) files[binding.path] = cached3(led, root, binding.path);
      pending.push(...edges(led, current));
    }
    const identity2 = Object.fromEntries(Object.entries(bindings).map(([sid, b]) => [sid, { path: b.path }]));
    const token = digest2({ bindings: identity2, files });
    const obs = node.observation ?? {};
    const direct = [];
    const details = {};
    for (const [sid, binding] of Object.entries(bindings)) {
      const current = cached3(led, root, binding.path);
      const baseline = obs.inspected_files?.[binding.path]?.sha256 || binding.baseline_sha256;
      const changed = current.sha256 !== baseline || current.state !== "available";
      if (changed) direct.push(sid);
      details[sid] = { ...binding, current, changed, inspected_sha256: baseline };
    }
    let state;
    let reason;
    if (!hasBindings) [state, reason] = ["unbound", "Bind source locations before recording behavior."];
    else if (Object.values(files).some((v) => v.state !== "available")) [state, reason] = ["missing", "One or more bound or dependent source files are missing or unavailable."];
    else if (!node.observation) [state, reason] = ["unobserved", "Sources are bound but behavior has not been recorded."];
    else if (obs.scope_hash !== token) [state, reason] = ["stale", direct.length ? "Bound sources changed." : "A dependency or source binding changed."];
    else [state, reason] = ["current", "Recorded observations match the inspected source fingerprints."];
    report2[nid] = {
      design: node.design,
      state,
      reason,
      inspection_token: token,
      bindings: details,
      scope_files: files,
      scope_nodes: sorted(visited),
      changed_bindings: direct,
      conformance: assessment(node, state),
      implementation_version: implementationHash(files),
      recorded_version: node.implementation_version,
      observed_version: obs.implementation_version
    };
  }
  const pendingIds = Object.entries(report2).filter(([nid, row]) => row.state !== "current" && !historical(led.nodes[nid])).map(([nid]) => nid);
  const assessmentPending = Object.keys(report2).filter((nid) => {
    const n = led.nodes[nid];
    const obs = n.observation ?? {};
    return !historical(n) && Object.keys(n.contract ?? {}).length > 0 && (obs.design_hash !== fingerprint(n) || obs.design_context !== n.evidence_context || Object.keys(n.contract).some((k) => !(k in (obs.comparisons ?? {}))));
  });
  const notifications = pendingIds.map((nid) => ({
    node: nid,
    kind: report2[nid].state === "unbound" ? "source_unbound" : report2[nid].implementation_version !== (report2[nid].observed_version ?? null) ? "implementation_changed" : "inspection_stale",
    previous: report2[nid].observed_version ?? null,
    current: report2[nid].implementation_version,
    reason: report2[nid].reason
  }));
  for (const nid of assessmentPending) if (!pendingIds.includes(nid)) notifications.push({ node: nid, kind: "assessment_required", reason: report2[nid].conformance.reason });
  const active = Object.keys(report2).filter((nid) => !historical(led.nodes[nid]));
  const coverage2 = {
    active: active.length,
    bound: active.filter((nid) => Object.keys(led.nodes[nid].bindings ?? {}).length > 0).length,
    observed: active.filter((nid) => Boolean(led.nodes[nid].observation)).length,
    current: active.filter((nid) => report2[nid].state === "current").length,
    unbound: active.filter((nid) => report2[nid].state === "unbound")
  };
  coverage2.complete = active.length > 0 && coverage2.active === coverage2.current;
  return {
    repository: root,
    commit: commit2,
    coverage: coverage2,
    assessment_pending: assessmentPending,
    nodes: report2,
    pending: pendingIds,
    notifications,
    current: Object.entries(report2).filter(([, row]) => row.state === "current").map(([nid]) => nid),
    differences: Object.entries(report2).filter(([, row]) => row.conformance.status === "differs").map(([nid]) => nid)
  };
};
var scan2 = Effect_exports.fn("scan")(function* (led, override) {
  const root = yield* repository(led, override);
  yield* ensureSources(led, root);
  return scanSync(led, root);
});
var refreshSources = Effect_exports.fn("refreshSources")(function* (led, override) {
  const report2 = yield* scan2(led, override);
  for (const [nid, row] of Object.entries(report2.nodes)) {
    const node = led.nodes[nid];
    node.current_implementation_version = row.implementation_version;
    node.source_state = row.state;
    node.source_scope_hash = row.inspection_token;
    node.conformance = row.conformance;
  }
  return report2;
});
var refreshAssessments = (led, report2) => {
  const pending = [];
  for (const [nid, row] of Object.entries(report2.nodes)) {
    const node = led.nodes[nid];
    row.conformance = assessment(node, row.state);
    node.conformance = row.conformance;
    const obs = node.observation ?? {};
    if (!historical(node) && Object.keys(node.contract ?? {}).length > 0 && (obs.design_hash !== fingerprint(node) || obs.design_context !== node.evidence_context || Object.keys(node.contract).some((k) => !(k in (obs.comparisons ?? {}))))) {
      pending.push(nid);
    }
  }
  report2.assessment_pending = pending;
  report2.differences = Object.entries(report2.nodes).filter(([, row]) => row.conformance.status === "differs").map(([nid]) => nid);
  report2.notifications = report2.notifications.filter((n) => n.kind !== "assessment_required");
  for (const nid of pending) if (!report2.pending.includes(nid)) report2.notifications.push({ node: nid, kind: "assessment_required", reason: report2.nodes[nid].conformance.reason });
};
var adopt = (led, nid, statement, parent) => {
  if (parent && !(parent in led.nodes)) throw fail10(`parent ${parent} does not exist; adopt it first`);
  if (nid in led.nodes) {
    if (historical(led.nodes[nid])) throw fail10("use the live replacement or explicitly reopen a retired node before adopting it");
    if (statement && statement !== led.nodes[nid].statement) throw fail10("adopt cannot change an existing node statement");
    if (!parent) throw fail10("node already exists; use bind/observe or supply --parent to link it");
  } else {
    if (!statement) throw fail10("new observational nodes need an abstract statement");
    if (Object.keys(led.nodes).length && !parent) throw fail10("a root already exists; supply --parent for this observational node");
    led.nodes[nid] = { statement, gloss: "", effect: "", contract: {}, depends: [], design: "draft", realization: "not-started", verification: "unverified", approved: "", origin: "existing-code" };
  }
  if (parent) {
    const children = led.nodes[parent].observed_children ??= [];
    if (!children.includes(nid)) children.push(nid);
  }
  return `${nid} adopted for observation; intended contract and approval are unchanged`;
};
var bind5 = Effect_exports.fn("bind")(function* (led, nid, rawPath, options) {
  const node = led.nodes[nid];
  if (historical(node)) return yield* fail10("cannot rebind a historical node; revive or use its replacement");
  let existingRoot = yield* repository(led);
  if (options.root) {
    const proposed = yield* resolvePath(expandUser(options.root));
    if (existingRoot && existingRoot !== proposed) return yield* fail10("this ledger uses another repository; use sync --repo to relocate it explicitly");
    existingRoot = yield* setRepository(led, options.root);
  }
  if (existingRoot === null) return yield* fail10("the first bind needs --repo pointing at the inspected repository");
  const path = yield* Effect_exports.try({ try: () => relativePath(rawPath), catch: (e) => e });
  const current = yield* readSource(existingRoot, path);
  led.sourceCache.set(cacheKey(existingRoot, path), current);
  if (current.state !== "available") return yield* fail10(`${path}: ${current.reason}`);
  const bindings = node.bindings ??= {};
  const bindingId = options.bindingId ?? null;
  if (bindingId && (!bindingId.startsWith("S") || !isDigit(bindingId.slice(1)))) return yield* fail10("binding IDs use S followed by digits, such as S01");
  const sid = bindingId || `S${zfill(Math.max(0, ...Object.keys(bindings).map((k) => parseInt(k.slice(1), 10))) + 1, 2)}`;
  const binding = { path, baseline_sha256: current.sha256, bound_at: stamp() };
  if (options.symbol) binding.symbol = options.symbol;
  if (options.lines) {
    const parts = options.lines.split(":");
    if (parts.length !== 2 || !parts.every((p2) => isDigit(p2)) || parseInt(parts[0], 10) < 1 || parseInt(parts[1], 10) < parseInt(parts[0], 10)) {
      return yield* fail10("--lines must be a positive START:END range");
    }
    binding.lines = parts.map((p2) => parseInt(p2, 10));
  }
  yield* ensureSources(led, existingRoot);
  binding.commit = led.commits.get(existingRoot) ?? null;
  if (sid in bindings) (node.binding_history ??= []).push({ date: stamp(), id: sid, previous: bindings[sid] });
  bindings[sid] = binding;
  return `${nid} bound ${sid}: ${path}; run scan, inspect the code, then observe with its inspection token`;
});
var unbind = (led, nid, sid, reason) => {
  const node = led.nodes[nid];
  if (historical(node)) throw fail10("historical source bindings cannot be removed");
  if (!strip(reason) || !(sid in (node.bindings ?? {}))) throw fail10("unbind needs an existing binding ID and a reason");
  const previous = node.bindings[sid];
  delete node.bindings[sid];
  (node.binding_history ??= []).push({ date: stamp(), id: sid, previous, reason });
  return `${nid} removed binding ${sid}; previous observations remain in history`;
};
var isPlainObject2 = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
var truthyValue = (v) => Array.isArray(v) ? v.length > 0 : isPlainObject2(v) ? Object.keys(v).length > 0 : Boolean(v);
var observe = Effect_exports.fn("observe")(function* (led, nid, rawPayload, token, by) {
  const node = led.nodes[nid];
  if (historical(node)) return yield* fail10("historical observations cannot be replaced");
  const allowed = /* @__PURE__ */ new Set(["effect", "claims", "unknowns", "pseudocode", "behavior", "comparisons"]);
  if (!isPlainObject2(rawPayload) || Object.keys(rawPayload).some((k) => !allowed.has(k))) return yield* fail10("observation fields: effect, claims, unknowns, pseudocode, behavior, comparisons");
  const payload = deepCopy(rawPayload);
  let previous = node.observation;
  if (previous) {
    const unchanged = previous.scope_hash === token;
    for (const field of ["unknowns", "behavior", "comparisons"]) {
      const prev = previous[field];
      if (!(field in payload) && truthyValue(prev)) {
        if (!unchanged || field === "comparisons" && previous.design_hash !== fingerprint(node)) {
          return yield* fail10(`reassess ${field} explicitly after source/design changes; export with observation first`);
        }
        payload[field] = deepCopy(prev);
      }
    }
    if (!("pseudocode" in payload) && previous.body?.length && !unchanged) {
      return yield* fail10("reinspect and supply pseudocode explicitly after source changes; export with observation first");
    }
  }
  if (typeof payload.effect !== "string" || !strip(payload.effect)) return yield* fail10("observation needs a nonempty effect");
  const claims = payload.claims;
  if (!Array.isArray(claims) || !claims.length) return yield* fail10("observation needs source-backed claims");
  const bindings = node.bindings ?? {};
  for (const claim of claims) {
    if (!isPlainObject2(claim) || Object.keys(claim).some((k) => !["text", "basis", "sources"].includes(k))) return yield* fail10("claims contain text, basis, and sources");
    if (typeof claim.text !== "string" || !strip(claim.text) || claim.basis !== "observed" && claim.basis !== "inferred") return yield* fail10("each claim needs text and basis observed|inferred");
    const refs = claim.sources;
    if (!Array.isArray(refs) || !refs.length || refs.some((ref) => typeof ref !== "string" || !(ref in bindings))) return yield* fail10("each claim must cite existing local binding IDs in sources");
  }
  const unknownsList = payload.unknowns ?? [];
  if (!Array.isArray(unknownsList) || unknownsList.some((v) => typeof v !== "string" || !strip(v))) return yield* fail10("unknowns must be an array of nonempty strings");
  const comparisons = payload.comparisons ?? {};
  if (!isPlainObject2(comparisons) || Object.keys(comparisons).some((k) => !(k in (node.contract ?? {})))) return yield* fail10("comparisons must name intended contract clauses");
  for (const value of Object.values(comparisons)) {
    if (!isPlainObject2(value) || Object.keys(value).sort().join() !== "reason,status" || !["matches", "differs", "unknown"].includes(value.status) || typeof value.reason !== "string" || !strip(value.reason)) {
      return yield* fail10("each comparison needs status matches|differs|unknown and a reason");
    }
  }
  if ("behavior" in payload) {
    const why = validateBehavior(payload.behavior);
    if (why) return yield* fail10(why);
  }
  let body = previous && !("pseudocode" in payload) ? deepCopy(previous.body ?? []) : [];
  if ("pseudocode" in payload) {
    if (typeof payload.pseudocode !== "string") return yield* fail10("pseudocode must be a string");
    body = yield* Effect_exports.try({ try: () => parseBody(payload.pseudocode, fnOf(node.statement)), catch: (e) => fail10(e.message) });
    for (const line of body) {
      const ref = line.child || line.reuse;
      if (ref && !(ref in led.nodes)) return yield* fail10(`observed call refers to missing node ${ref}; adopt it first`);
    }
  }
  previous = node.observation;
  const candidate = { ...deepCopy(payload), body };
  delete candidate.pseudocode;
  node.observation = candidate;
  const probe = yield* scan2(led).pipe(Effect_exports.result);
  if (previous === void 0) delete node.observation;
  else node.observation = previous;
  if (probe._tag === "Failure") return yield* Effect_exports.fail(probe.failure);
  const row = probe.success.nodes[nid];
  if (!Object.keys(bindings).length || Object.values(row.scope_files).some((v) => v.state !== "available")) return yield* fail10("bind accessible source files before recording observations");
  if (row.inspection_token !== token) return yield* fail10("sources or inspection scope changed; bind any new dependencies, rescan and reinspect before observing");
  if (previous) (node.observation_history ??= []).push(deepCopy(previous));
  const root = yield* repository(led);
  Object.assign(candidate, {
    bindings: deepCopy(bindings),
    date: stamp(),
    by,
    revision: (previous?.revision ?? 0) + 1,
    scope_hash: token,
    inspected_files: deepCopy(row.scope_files),
    design_hash: fingerprint(node),
    implementation_version: row.implementation_version,
    implementation_commit: led.commits.get(root ?? "") ?? null,
    design_context: node.evidence_context
  });
  node.observation = candidate;
  recordVersion(node, row, candidate.implementation_commit ?? null);
  return `${nid} observation ${candidate.revision} recorded; intended design and approval unchanged`;
});
var validate3 = (led) => {
  const errors = [];
  for (const [nid, n] of Object.entries(led.nodes)) {
    for (const child of n.observed_children ?? []) if (!(child in led.nodes) || child === nid) errors.push(`${nid}: observed child ${child} must name another existing node`);
  }
  const visiting = /* @__PURE__ */ new Set();
  const visited = /* @__PURE__ */ new Set();
  const walk = (nid) => {
    if (visiting.has(nid)) {
      errors.push(`${nid}: observed hierarchy contains a cycle; put recursive calls in observed pseudocode instead`);
      return;
    }
    if (visited.has(nid)) return;
    visiting.add(nid);
    for (const child of led.nodes[nid].observed_children ?? []) if (child in led.nodes) walk(child);
    visiting.delete(nid);
    visited.add(nid);
  };
  for (const nid of Object.keys(led.nodes)) walk(nid);
  return errors;
};

// src/ledger.ts
var defaultTitle = (dir) => title(nodePath3.basename(dir).replaceAll("-", " "));
var Ledger = class _Ledger {
  dir;
  path;
  data;
  errors = [];
  warnings = [];
  /** Staged file writes (absolute path -> text), committed with the ledger. */
  files = /* @__PURE__ */ new Map();
  messages = [];
  operations = [];
  sourceScan = emptyReport();
  /** Source bytes read once per process; the ledger lock makes this safe. */
  sourceCache = /* @__PURE__ */ new Map();
  commits = /* @__PURE__ */ new Map();
  /** ADR directory discovered on disk at load time and its markdown files. */
  adrDiskDir = null;
  adrDisk = /* @__PURE__ */ new Map();
  constructor(dir, data) {
    this.dir = dir;
    this.path = nodePath3.join(dir, LEDGER);
    this.data = data;
  }
  /** Read <dir>/ledger.json (if any), migrate legacy approval fields, discover ADRs and refresh derived state. */
  static load = Effect_exports.fn("Ledger.load")(function* (dir) {
    const fs = yield* FileSystem_exports.FileSystem;
    const path = nodePath3.join(dir, LEDGER);
    const data = (yield* asFail(fs.exists(path))) ? JSON.parse(yield* asFail(fs.readFileString(path))) : null;
    const led = new _Ledger(dir, data);
    for (const n of Object.values(led.data?.nodes ?? {})) {
      if (!("approved_content_hash" in n) && (n.design === "approved" || n.design === "stale")) {
        if (n.proposal_hash) {
          if (legacyIntact(n)) n.approved_content_hash = fingerprint(n);
          else if (n.design === "approved") n.design = "stale";
        } else if (n.design === "approved") n.approved_content_hash = fingerprint(n);
        if (n.revision === void 0) n.revision = 0;
      }
    }
    yield* led.discoverAdrs();
    if (led.data) yield* refreshLedger(led);
    return led;
  });
  static create = Effect_exports.fn("Ledger.create")(function* (dir, titleText) {
    const fs = yield* FileSystem_exports.FileSystem;
    yield* asFail(fs.makeDirectory(dir, { recursive: true }));
    const led = yield* _Ledger.load(dir);
    led.data = { schema: 1, title: titleText, scope: "", nongoals: [], ambiguities: [], nodes: {}, terms: {}, facts: {}, scenarios: {} };
    return led;
  });
  /** Locate `adr/` next to the ledger or up to four parents above it, and cache its markdown files. */
  discoverAdrs = Effect_exports.fn("Ledger.discoverAdrs")(function* () {
    const fs = yield* FileSystem_exports.FileSystem;
    const candidates = [this.dir];
    let cursor = this.dir;
    while (candidates.length < 5) {
      const parent = nodePath3.dirname(cursor);
      if (parent === cursor) break;
      candidates.push(parent);
      cursor = parent;
    }
    for (const base of candidates) {
      const candidate = nodePath3.join(base, "adr");
      const info = yield* fs.stat(candidate).pipe(Effect_exports.option);
      if (info._tag === "Some" && info.value.type === "Directory") {
        this.adrDiskDir = candidate;
        yield* this.loadAdrFiles(candidate);
        return;
      }
    }
  });
  loadAdrFiles = Effect_exports.fn("Ledger.loadAdrFiles")(function* (dir) {
    const fs = yield* FileSystem_exports.FileSystem;
    const names = yield* fs.readDirectory(dir).pipe(Effect_exports.orElseSucceed(() => []));
    for (const name of names) {
      if (!name.endsWith(".md")) continue;
      const full = nodePath3.join(dir, name);
      const info = yield* fs.stat(full).pipe(Effect_exports.option);
      if (info._tag === "Some" && info.value.type !== "Directory") this.adrDisk.set(full, yield* asFail(fs.readFileString(full)));
    }
  });
  get nodes() {
    const d = this.data;
    if (!d.nodes) d.nodes = {};
    return d.nodes;
  }
  node(nid) {
    return this.nodes[nid];
  }
  get title() {
    return this.data?.title || defaultTitle(this.dir);
  }
  // --- derived structure
  parents(nid) {
    return sorted(Object.entries(this.nodes).filter(([, p2]) => (p2.body ?? []).some((it) => it.child === nid || it.reuse === nid)).map(([pid]) => pid));
  }
  /** Nodes whose own design rests on this one: the bodies that call or reuse it, and anyone naming it in `depends`. */
  dependents(nid) {
    const out2 = new Set(this.parents(nid));
    for (const [m, v] of Object.entries(this.nodes)) if ((v.depends ?? []).includes(nid)) out2.add(m);
    return sorted(out2);
  }
  observedParents(nid) {
    return sorted(Object.entries(this.nodes).filter(([, p2]) => (p2.observed_children ?? []).includes(nid)).map(([pid]) => pid));
  }
  /** Nothing calls it and nothing rests on it. */
  roots() {
    return Object.keys(this.nodes).filter((nid) => this.dependents(nid).length === 0 && this.observedParents(nid).length === 0);
  }
  frontier() {
    const out2 = /* @__PURE__ */ new Map();
    for (const [pid, p2] of Object.entries(this.nodes)) {
      if (["draft", "retired", "superseded"].includes(p2.design)) continue;
      for (const it of p2.body ?? []) {
        const cid = it.child;
        if (cid && !(cid in this.nodes) && !out2.has(cid)) out2.set(cid, [frontierStatement(it.code), pid]);
      }
    }
    return out2;
  }
  status(nid) {
    const n = this.nodes[nid];
    if (n.design === "draft") {
      if (n.adr_pending) return `draft (ADR pending ${n.adr_pending})`;
      const k = nodeUnknowns(n).length;
      return k ? `draft (${k} ?)` : "draft";
    }
    if (n.design === "superseded") return `superseded by ${n.superseded_by ?? "?"}`;
    if (n.design === "retired") return "retired";
    return n.design;
  }
  isTerminal(n) {
    return Boolean(n.target) && !(n.body && n.body.length);
  }
  isCollapsed(n) {
    const stmts = (n.body ?? []).filter((it) => stmtKind(it.code) === "stmt");
    return stmts.length > 0 && stmts.every((it) => "target" in it);
  }
  inlineParent(nid) {
    const ps = this.parents(nid);
    if (ps.length !== 1) return null;
    return (this.nodes[ps[0]].body ?? []).some((it) => it.child === nid) ? ps[0] : null;
  }
  // --- context lookups
  /** [kind-file, key, entry] for a term name or CTX id. */
  entry(ref) {
    const r = strip(ref);
    if (isCtxId(r)) {
      const f = r[4] === "F" ? "facts" : "scenarios";
      const e = this.data?.[f]?.[r];
      return e ? [f, r, e] : null;
    }
    for (const [k, e] of Object.entries(this.data?.terms ?? {})) if (k.toLowerCase() === r.toLowerCase()) return ["terms", k, e];
    return null;
  }
  adrs() {
    return parseAdrs(this.adrDir(), this.files, this.adrDisk);
  }
  adrDir() {
    if (this.data?.reconstruction) return nodePath3.join(this.dir, "adr");
    for (const p2 of this.files.keys()) if (nodePath3.basename(nodePath3.dirname(p2)) === "adr") return nodePath3.dirname(p2);
    return this.adrDiskDir;
  }
  resolves(ref) {
    return isNodeId(ref) && (ref in this.nodes || this.frontier().has(ref)) || isAdrId(ref) && this.adrs().some((a) => a.id === ref) || this.entry(ref) !== null;
  }
  canonical(ref) {
    const e = this.entry(ref);
    return e ? e[1] : strip(ref);
  }
  usedBy() {
    const idx = {};
    const add2 = (k, v) => {
      (idx[k] ??= /* @__PURE__ */ new Set()).add(v);
    };
    for (const [nid, n] of Object.entries(this.nodes)) {
      for (const r of n.depends ?? []) {
        const e = this.entry(r);
        if (e) add2(e[1], nid);
      }
    }
    for (const [sid, s2] of Object.entries(this.data?.scenarios ?? {})) for (const t of this.termsIn(s2.settles ?? "")) add2(t, sid);
    return Object.fromEntries(Object.entries(idx).map(([k, v]) => [k, sorted(v)]));
  }
  termsIn(text) {
    const low = ` ${text.toLowerCase()} `;
    return Object.keys(this.data?.terms ?? {}).filter((t) => low.includes(` ${t.toLowerCase()} `) || strip(low).startsWith(t.toLowerCase()));
  }
  /** Relative link target from a file inside the ledger to another path. */
  rel(from, to) {
    return relpath(to, nodePath3.dirname(from));
  }
};
var relpath = (to, start) => {
  const r = nodePath3.relative(nodePath3.resolve(start), nodePath3.resolve(to));
  return r === "" ? "." : r;
};
var refreshLedger = Effect_exports.fn("refreshLedger")(function* (led) {
  led.sourceScan = yield* refreshSources(led);
  const adrs = new Map(led.adrs().map((a) => [a.id, a]));
  for (const [nid, node] of Object.entries(led.nodes)) {
    const seen = /* @__PURE__ */ new Set([nid]);
    const context3 = {};
    const queue = [nid];
    while (queue.length) {
      const currentId = queue.pop();
      const current = led.nodes[currentId];
      if (current.bindings && Object.keys(current.bindings).length || current.observation || current.observed_children && current.observed_children.length) {
        context3["source:" + currentId] = current.source_scope_hash ?? null;
      }
      const refs = [...current.depends ?? [], ...(current.body ?? []).map((it) => it.child || it.reuse)];
      for (const ref of refs) {
        if (!ref || seen.has(ref)) continue;
        seen.add(ref);
        if (ref in led.nodes) {
          const dep = led.nodes[ref];
          context3[ref] = [dep.revision ?? 0, dep.design, fingerprint(dep)];
          queue.push(ref);
        } else if (adrs.has(ref)) context3[ref] = adrs.get(ref).lines;
        else {
          const entry = led.entry(ref);
          if (entry) context3[ref] = [entry[2].status ?? null, entry[2].changed ?? []];
          else context3[ref] = "unresolved";
        }
      }
    }
    node.evidence_context = sha256Json(context3, { sortKeys: true });
  }
  refresh(led.nodes);
  refreshAssessments(led, led.sourceScan);
});
var setHeader = (lines, field, value) => {
  for (let i = 0; i < Math.min(8, lines.length); i++) {
    const ln = lines[i];
    if (ln.startsWith("#") || !ln.includes(":")) continue;
    const parts = headerParts(ln);
    if (parts.some((x) => x.startsWith(`${field}:`))) {
      lines[i] = parts.map((x) => x.startsWith(`${field}:`) ? `${field}: ${value}` : x).join(" \xB7 ");
      return;
    }
  }
  for (let i = 0; i < Math.min(8, lines.length); i++) {
    if (lines[i].startsWith("Kind:")) {
      lines.splice(i + 1, 0, `${field}: ${value}`);
      return;
    }
  }
};
var headerParts = (line) => line.replaceAll(" | ", " \xB7 ").split(" \xB7 ").map((p2) => strip(p2));
var splitLines3 = (text) => {
  const out2 = text.split(/\r\n|[\n\r\v\f\x1c\x1d\x1e\x85\u2028\u2029]/u);
  if (out2.length && out2[out2.length - 1] === "") out2.pop();
  return out2;
};
var parseAdrs = (adrDir, staged, disk) => {
  const out2 = [];
  const paths = /* @__PURE__ */ new Set();
  if (adrDir) {
    for (const p2 of disk.keys()) if (nodePath3.dirname(p2) === adrDir) paths.add(p2);
    for (const p2 of staged.keys()) if (nodePath3.dirname(p2) === adrDir) paths.add(p2);
  }
  for (const p2 of sorted(paths)) {
    const lines = splitLines3(staged.get(p2) ?? disk.get(p2) ?? "");
    const stem = nodePath3.basename(p2, ".md");
    let aid = stem.slice(0, 4);
    let titleText = stem;
    const header = {};
    for (const ln of lines) {
      if (ln.startsWith("# ")) {
        const head3 = ln.slice(2).replaceAll(" - ", " \u2014 ").replaceAll(" \u2013 ", " \u2014 ");
        const [a, sep, t] = partition5(head3, " \u2014 ");
        if (sep) {
          aid = strip(a);
          titleText = strip(t);
        } else {
          aid = strip(head3);
          titleText = strip(head3);
        }
      } else if (ln.startsWith("## ")) break;
      else {
        for (const part of headerParts(ln)) {
          const [k, sep, v] = partition5(part, ":");
          if (sep && k && isUpper(k[0]) && !strip(k).includes(" ")) header[strip(k)] = strip(v);
        }
      }
    }
    if (!isAdrId(aid)) aid = isDigit(stem.slice(0, 4)) ? `ADR-${stem.slice(0, 4)}` : stem;
    const constrains = splitWs((header.Constrains ?? "").replaceAll("(", " (")).map((w) => strip(w, "[],")).filter((w) => isNodeId(w));
    out2.push({ id: aid, title: titleText, status: header.Status ?? "?", constrains, path: p2, lines });
  }
  return out2;
};
var linkRef = (led, ref, frm) => {
  if (isNodeId(ref) && ref in led.nodes) return `[${ref}](${led.rel(frm, nodePath3.join(led.dir, "nodes", `${ref}.md`))})`;
  if (isAdrId(ref)) {
    const a = led.adrs().find((x) => x.id === ref);
    return a ? `[${ref}](${led.rel(frm, a.path)})` : ref;
  }
  const e = led.entry(ref);
  if (e) return `[${e[1]}](${led.rel(frm, nodePath3.join(led.dir, "CONTEXT.md"))}#${anchorOf(e[0] === "terms" ? e[1] : e[1] + " " + (e[2].name ?? ""))})`;
  return ref;
};

// src/transaction.ts
import * as nodePath4 from "node:path";
import { randomBytes as randomBytes4 } from "node:crypto";
var LOCK_DEADLINE_MS = 1e4;
var atomicWrite = Effect_exports.fn("atomicWrite")(function* (path, value) {
  const fs = yield* FileSystem_exports.FileSystem;
  yield* asFail(fs.makeDirectory(nodePath4.dirname(path), { recursive: true }));
  const tmp = nodePath4.join(nodePath4.dirname(path), `.${nodePath4.basename(path)}.${randomBytes4(6).toString("hex")}`);
  const write2 = Effect_exports.gen(function* () {
    const file = yield* fs.open(tmp, { flag: "wx" });
    yield* file.writeAll(value);
    yield* file.sync;
  }).pipe(Effect_exports.scoped);
  const result4 = yield* Effect_exports.gen(function* () {
    yield* write2;
    yield* fs.rename(tmp, path);
  }).pipe(Effect_exports.result);
  if (result4._tag === "Failure") {
    yield* fs.remove(tmp).pipe(Effect_exports.ignore);
    return yield* Effect_exports.fail(toFail(result4.failure));
  }
});
var recover = Effect_exports.fn("recover")(function* (directory) {
  const fs = yield* FileSystem_exports.FileSystem;
  const journal = nodePath4.join(directory, JOURNAL);
  if (!(yield* asFail(fs.exists(journal)))) return;
  const pending = JSON.parse(yield* asFail(fs.readFileString(journal)));
  for (const [name, value] of pending.files) yield* atomicWrite(name, Buffer.from(value, "base64"));
  yield* asFail(fs.remove(journal));
});
var pidAlive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === "EPERM";
  }
};
var acquire = Effect_exports.fn("acquireLock")(function* (lock) {
  const fs = yield* FileSystem_exports.FileSystem;
  const deadline = Date.now() + LOCK_DEADLINE_MS;
  const mine = String(process.pid);
  for (; ; ) {
    const created = yield* fs.writeFileString(lock, mine, { flag: "wx" }).pipe(Effect_exports.result);
    if (created._tag === "Success") return;
    const holder = yield* fs.readFileString(lock).pipe(Effect_exports.orElseSucceed(() => ""));
    const pid = /^\d+$/u.test(holder.trim()) ? Number(holder.trim()) : NaN;
    if (Number.isNaN(pid) || !pidAlive(pid)) {
      yield* fs.remove(lock).pipe(Effect_exports.ignore);
      continue;
    }
    if (Date.now() > deadline) return yield* fail10("another Stepwise writer holds the ledger lock; retry after it finishes");
    yield* Effect_exports.sleep("50 millis");
  }
});
var locked = (directory, body) => Effect_exports.gen(function* () {
  const fs = yield* FileSystem_exports.FileSystem;
  yield* asFail(fs.makeDirectory(directory, { recursive: true }));
  const lock = nodePath4.join(directory, LOCK);
  return yield* Effect_exports.acquireUseRelease(
    acquire(lock),
    () => Effect_exports.gen(function* () {
      yield* recover(directory);
      return yield* body;
    }),
    () => Effect_exports.gen(function* () {
      const holder = yield* fs.readFileString(lock).pipe(Effect_exports.orElseSucceed(() => ""));
      if (holder.trim() === String(process.pid)) yield* fs.remove(lock).pipe(Effect_exports.ignore);
    })
  );
});
var commit = Effect_exports.fn("commit")(function* (directory, files) {
  const journal = nodePath4.join(directory, JOURNAL);
  const payload = { files: [...files].map(([path, text]) => [path, Buffer.from(text, "utf8").toString("base64")]) };
  yield* atomicWrite(journal, Buffer.from(JSON.stringify(payload), "utf8"));
  yield* recover(directory);
});

// src/batch.ts
var SHAPES = {
  adopt: ["statement", "parent"],
  observe: ["payload", "at"],
  new: ["statement"],
  set: ["fields"],
  body: ["text"],
  terminal: ["target"],
  approve: ["by"],
  ready: ["approach", "validation"],
  reopen: ["reason"],
  stale: ["reason"],
  retire: ["reason"]
};
var OPTIONAL = /* @__PURE__ */ new Set(["new.statement", "adopt.statement", "adopt.parent", "approve.by"]);
var FLAGGED = /* @__PURE__ */ new Set(["text", "by", "approach", "validation", "parent", "at"]);
var isPlainObject3 = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
var operations = (payload) => {
  if (!Array.isArray(payload) || !payload.length) throw fail10("expected a nonempty array of operation objects or argument arrays");
  const result4 = [];
  for (const item of payload) {
    if (Array.isArray(item) && item.length && item.every((v) => typeof v === "string")) {
      result4.push(item);
      continue;
    }
    if (!isPlainObject3(item) || typeof item.verb !== "string") throw fail10("each operation needs a verb");
    const verb2 = item.verb;
    if ("args" in item) {
      if (Object.keys(item).sort().join() !== "args,verb" || !Array.isArray(item.args)) throw fail10("generic operations accept only verb and args");
      result4.push([verb2, ...item.args.map((v) => typeof v === "string" ? v : JSON.stringify(v))]);
      continue;
    }
    const shape = SHAPES[verb2];
    if (!shape || Object.keys(item).some((k) => k !== "verb" && k !== "id" && !shape.includes(k))) throw fail10(`${verb2}: use verb/args for this operation or correct its fields`);
    if (typeof item.id !== "string") throw fail10(`${verb2}: id is required`);
    const args2 = [verb2, item.id];
    for (const field of shape) {
      if (!(field in item)) {
        if (OPTIONAL.has(`${verb2}.${field}`)) continue;
        throw fail10(`${verb2}: ${field} is required`);
      }
      const value = item[field];
      if (field !== "fields" && field !== "payload" && typeof value !== "string") throw fail10(`${verb2}.${field} must be a string`);
      if (FLAGGED.has(field)) args2.push("--" + field);
      args2.push(field === "fields" || field === "payload" ? JSON.stringify(value) : value);
    }
    result4.push(args2);
  }
  return result4;
};

// src/verbs.ts
import * as nodePath8 from "node:path";

// src/render.ts
import * as nodePath5 from "node:path";
var stateLine = (n) => {
  if (n.design === "draft" || n.design === "approved") return [];
  const last = [...n.history ?? []].reverse().find((h) => ["stale", "superseded", "retired", "reopened"].includes(h.event));
  if (!last) return [];
  let line = `${title(last.event)}: ${last.date}` + (last.reason ? ` \u2014 ${last.reason}` : "");
  if (n.design === "stale" && n.stale_by?.length) line += ` \xB7 invalidated by ${n.stale_by.join(", ")}`;
  return [line];
};
var firstSentence = (definition) => split2(definition, ". ")[0].replace(/\.+$/u, "");
var renderNode = (led, nid) => {
  const n = led.nodes[nid];
  const p2 = nodePath5.join(led.dir, "nodes", `${nid}.md`);
  const L = [
    `# ${nid} \u2014 ${fnOf(n.statement) || nid}`,
    "",
    GENERATED,
    "",
    "Kind: node \xB7 Index: [../DESIGN.md](../DESIGN.md)",
    `Design: ${led.status(nid)} \xB7 Realization: ${n.realization} \xB7 Verification: ${n.verification}`,
    `Parents: ${led.parents(nid).map((x) => linkRef(led, x, p2)).join(", ") || "-"}`,
    `Depends on: ${(n.depends ?? []).map((x) => linkRef(led, x, p2)).join(", ") || "-"}`,
    `Approved: ${n.approved || "-"}`,
    ...stateLine(n),
    "",
    "## Statement",
    "",
    `\`${n.statement}\`` + (n.gloss ? ` \u2014 ${n.gloss}` : ""),
    "",
    "## Effect",
    "",
    n.effect || "-",
    "",
    "## Contract",
    ""
  ];
  const contract = Object.entries(n.contract ?? {});
  L.push(...contract.length ? contract.map(([k, v]) => `- ${title(k)}: ${v}`) : ["-"]);
  if (n.body?.length) {
    L.push("", "## Refinement", "");
    if (n.walkthrough?.length) L.push("What it does:", ...n.walkthrough.map((ln) => `${ln}`), "");
    L.push("```pseudo", ...algorithmLines(nid, n, itemTag), "```");
    const lines = n.body.filter((it) => "child" in it || "reuse" in it || "target" in it).map((it) => [
      it.child || it.reuse || it.target || "",
      it.gloss || led.nodes[it.child || it.reuse || ""]?.gloss || ""
    ]);
    if (lines.some(([, g]) => g)) L.push("", ...lines.filter(([, g]) => g).map(([c, g]) => `- ${c} \u2014 ${g}`));
  }
  const children = new Set((n.body ?? []).map((it) => it.child).filter(Boolean));
  const deferred = [...n.deferred ?? [], ...(led.data.ambiguities ?? []).filter((a) => children.has(a.resolves_at)).map((a) => `${a.claim} \u2014 ${a.conflict} \u2192 ${a.resolves_at}`)];
  for (const [heading, items] of [["Composition argument", n.composition ?? []], ["Decisions", n.decisions ?? []], ["Deferred", deferred]]) {
    if (items.length) L.push("", `## ${heading}`, "", ...items.map((b) => `- ${b}`));
  }
  const s2 = n.superseded;
  if (s2) {
    L.push("", "## Superseded refinement", "", `Replaced ${s2.date}` + (s2.reason ? ` \u2014 ${s2.reason}` : ""));
    if (s2.body?.length) L.push("", "```pseudo", ...bodyText(s2.body), "```");
    for (const [f, heading] of [["composition", "Composition argument"], ["decisions", "Decisions"], ["deferred", "Deferred"]]) {
      const items = s2[f];
      if (items?.length) L.push("", `Superseded ${heading.toLowerCase()}:`, ...items.map((b) => `- ${b}`));
    }
  }
  const collapsed = !n.target && led.isCollapsed(n);
  if (n.target || n.adaptation?.length || collapsed) {
    L.push("", "## Realization", "");
    if (n.target) L.push(`Target: \`${n.target}\``);
    else if (collapsed) {
      const heads = [...new Set((n.body ?? []).filter((it) => it.target).map((it) => split2(it.target, ":", 1)[0].trim()))];
      L.push("Collapsed leaf. Targets: " + heads.map((h) => `\`${h}\``).join(", "));
    }
    L.push(...(n.adaptation ?? []).map((a) => `Adaptation: ${a}`));
  }
  if (n.bindings && Object.keys(n.bindings).length || n.observation || n.origin === "existing-code") {
    L.push(
      "",
      "## Existing implementation",
      `Sources: ${pyGet(n, "source_state", "unbound")} \xB7 Conformance: ${n.conformance?.status ?? "unassessed"}`,
      `Current implementation: ${pyGet(n, "current_implementation_version", "unknown")}`,
      `Recorded implementation revision: ${pyGet(n, "implementation_revision", "0")} \xB7 ${pyGet(n, "implementation_version", "none")}`
    );
    for (const [sid, b] of Object.entries(n.bindings ?? {})) L.push(`- ${sid}: \`${b.path}\`` + (b.symbol ? ` \xB7 ${b.symbol}` : "") + ` \xB7 SHA-256 ${b.baseline_sha256}`);
    if (n.observed_children?.length) L.push("", "Observed children: " + n.observed_children.map((cid) => linkRef(led, cid, p2)).join(", "));
    const obs = n.observation;
    if (obs) {
      L.push("", "### Observed behavior", obs.effect, `Inspected: ${obs.date} by ${obs.by} \xB7 implementation ${pyGet(obs, "implementation_version", "unknown")}`);
      L.push(...obs.claims.map((c) => `- ${c.basis}: ${c.text} (sources: ${c.sources.join(", ")})`));
      if (obs.body?.length) L.push("", "```pseudo", ...bodyText(obs.body), "```");
      if (obs.unknowns?.length) L.push("", "### Unknowns", ...obs.unknowns.map((v) => `- ${v}`));
      for (const [clause, value] of Object.entries(obs.comparisons ?? {})) L.push(`- Intended ${clause}: ${value.status} \u2014 ${value.reason}`);
    }
  }
  if (n.implementation_plan) L.push("", "## Implementation plan", ...Object.entries(n.implementation_plan).map(([k, v]) => `- ${title(k)}: ${v}`));
  if (n.behavior && Object.keys(n.behavior).length) L.push("", "## Behavior diagrams", "```json", pyJsonDumps(n.behavior, { indent: 2 }), "```");
  const cov = coverage(n);
  L.push("", "## Evidence coverage", `Covered: ${cov.covered.join(", ") || "none"} \xB7 Missing: ${cov.missing.join(", ") || "none"} \xB7 Failed: ${cov.failed.join(", ") || "none"}`);
  if (n.evidence?.length) {
    L.push("", "## Evidence", "");
    n.evidence.forEach((ev, i) => {
      const result4 = ev.withdrawn ? "withdrawn" : ev.result;
      let detail = `${ev.date} \xB7 ${ev.ref} \xB7 Covers: ${(ev.clauses?.length ? ev.clauses : ev.covers ?? []).join(", ")} \xB7 revision ${pyGet(ev, "revision", "legacy")}`;
      if (ev.scope) detail += ` \xB7 Scope: ${ev.scope}`;
      if (ev.scenario) detail += ` \xB7 Scenario: ${ev.scenario}`;
      if (ev.assessment) detail += ` \xB7 Assessment: ${ev.assessment}`;
      if (ev.resolves?.length) detail += ` \xB7 Resolves: ${ev.resolves.join(", ")}`;
      if (ev.note) detail += ` \xB7 ${ev.note}`;
      if (ev.withdrawn) detail += ` \xB7 Withdrawn ${ev.withdrawn.date} by ${ev.withdrawn.by}: ${ev.withdrawn.reason}`;
      L.push(`### EV-${i + 1} ${ev.kind} \u2014 ${result4}`, detail);
    });
  }
  if (n.history?.length) L.push("", "## History", "", ...n.history.map((h) => `- ${h.date} \u2014 ${h.event}` + (h.reason ? `: ${h.reason}` : "")));
  return L.join("\n") + "\n";
};
var renderProgram = (led) => {
  const main = [];
  const procs = [];
  const roots = new Set(led.roots());
  for (const [nid, n] of Object.entries(led.nodes)) {
    if (!n.body?.length && !roots.has(nid) || ["draft", "retired", "superseded"].includes(n.design)) continue;
    const destination = roots.has(nid) ? main : procs;
    if (destination.length) destination.push("");
    destination.push(`${nid} \xB7 ${led.status(nid)}`);
    destination.push(...algorithmLines(nid, n, itemTag));
  }
  return [main, procs];
};
var renderDesign = (led) => {
  const d = led.dir;
  const fr = led.frontier();
  const frontier = [.../* @__PURE__ */ new Set([...fr.keys(), ...Object.entries(led.nodes).filter(([, n]) => n.design === "draft").map(([nid]) => nid)])].sort(pyCompare);
  const L = [
    `# ${led.title} \u2014 Design`,
    "",
    GENERATED,
    "",
    "Kind: index \xB7 Context: [./CONTEXT.md](./CONTEXT.md)",
    `Root: ${led.roots().join(", ") || "-"} \xB7 Active frontier: ${frontier.join(", ") || "-"}`,
    "",
    "## Applicable ADRs",
    ""
  ];
  const adrs = led.adrs();
  const designPath = nodePath5.join(d, "DESIGN.md");
  L.push(...adrs.length ? adrs.map((a) => `- [${a.id} ${a.title}](${led.rel(designPath, a.path)}) \u2014 ${a.status} \u2014 constrains ${a.constrains.join(", ") || "-"}`) : ["- none"]);
  L.push("", "## Nodes", "", "| ID | Statement | Parents | Design | Realization | Verification | File |", "| --- | --- | --- | --- | --- | --- | --- |");
  const rows = Object.entries(led.nodes).map(([nid, n]) => [nid, n.statement.replaceAll("|", "\\|"), led.parents(nid).join(", ") || "-", led.status(nid), n.realization, n.verification, `[nodes/${nid}.md](nodes/${nid}.md)`]);
  for (const [fid, [s2, p2]] of fr) rows.push([fid, s2.replaceAll("|", "\\|"), p2, "frontier", "not-started", "unverified", "-"]);
  L.push(...sortedTuples(rows).map((r) => "| " + r.join(" | ") + " |"));
  const [main, procs] = renderProgram(led);
  L.push("", "## Program", "", "```pseudo", ...main, "```");
  if (procs.length) L.push("", "### Procedures", "", "```pseudo", ...procs, "```");
  const observed = Object.entries(led.nodes).filter(([, n]) => n.origin === "existing-code" || n.observation);
  if (observed.length) {
    L.push("", "## Observed implementation", "", "| Node | Observed children | Source state | Conformance |", "| --- | --- | --- | --- |");
    L.push(...observed.map(([nid, n]) => `| [${nid}](nodes/${nid}.md) | ${(n.observed_children ?? []).join(", ") || "-"} | ${pyGet(n, "source_state", "unbound")} | ${n.conformance?.status ?? "unassessed"} |`));
    L.push("", "Observed behavior is descriptive; it does not approve an intended contract. Use `scan` to find changes and unfinished inspection.");
  }
  return L.join("\n") + "\n";
};
var changedLines = (e) => (e.changed ?? []).map((c) => `Changed: ${c.at.slice(0, 10)} \u2014 ${c.reason}`);
var byLowerKey = (entries) => [...entries].sort((a, b) => pyCompare(a[0].toLowerCase(), b[0].toLowerCase()));
var byKey = (entries) => [...entries].sort((a, b) => pyCompare(a[0], b[0]));
var renderContext = (led) => {
  const D = led.data;
  const used = led.usedBy();
  const terms = byLowerKey(Object.entries(D.terms ?? {}));
  const facts = byKey(Object.entries(D.facts ?? {}));
  const scenarios = byKey(Object.entries(D.scenarios ?? {}));
  const L = [
    `# ${led.title} \u2014 Shared Context`,
    "",
    GENERATED,
    "",
    "Kind: index \xB7 Status: active \xB7 Design: [./DESIGN.md](./DESIGN.md)",
    "",
    "## Scope",
    "",
    D.scope || "-",
    "",
    "## Vocabulary",
    "",
    "| Term | Is | Avoid | Used by |",
    "| --- | --- | --- | --- |"
  ];
  for (const [k, e] of terms) L.push(`| [${k}](#${anchorOf(k)}) | ${firstSentence(e.definition)} | ${(e.avoid ?? []).join(", ") || "-"} | ${(used[k] ?? []).join(", ") || "-"} |`);
  L.push("", "## Facts and constraints", "", "| ID | Fact | Status | Used by |", "| --- | --- | --- | --- |");
  for (const [k, e] of facts) L.push(`| [${k}](#${anchorOf(k + " " + e.name)}) | ${firstSentence(e.definition)} | ${e.status ?? "confirmed"} | ${(used[k] ?? []).join(", ") || "-"} |`);
  L.push("", "## Scenarios", "", "| ID | Scenario | Settles |", "| --- | --- | --- |");
  for (const [k, e] of scenarios) L.push(`| [${k}](#${anchorOf(k + " " + e.name)}) | ${e.name} | ${e.settles || "-"} |`);
  L.push("", "## Open ambiguities", "", "| Term / claim | Conflict | Resolves at |", "| --- | --- | --- |");
  L.push(...(D.ambiguities ?? []).map((a) => `| ${a.claim} | ${a.conflict} | ${a.resolves_at} |`));
  L.push("", "## Explicit non-goals", "", ...(D.nongoals ?? []).length ? D.nongoals.map((g) => `- ${g}`) : ["- none"]);
  L.push("", "## Terms", "");
  for (const [k, e] of terms) {
    L.push(`### ${k}`, "", `Confirmed: ${e.confirmed}` + (e.source ? ` \xB7 Source: ${e.source}` : ""), "", e.definition);
    for (const [lab, key] of [["Avoid", "avoid"], ["Not", "not"]]) {
      const values = e[key];
      if (values?.length) L.push(`${lab}: ${values.join(", ")}`);
    }
    if (e.example) L.push(`Example: ${e.example}`);
    L.push(`Used by: ${(used[k] ?? []).join(", ") || "-"}`, ...changedLines(e), "");
  }
  L.push("## Facts", "");
  for (const [k, e] of facts) {
    L.push(
      `### ${k} ${e.name}`,
      "",
      `Status: ${e.status ?? "confirmed"} \xB7 Confirmed: ${e.confirmed}` + (e.source ? ` \xB7 Source: ${e.source}` : ""),
      "",
      e.definition,
      `Used by: ${(used[k] ?? []).join(", ") || "-"}`,
      ...changedLines(e),
      ""
    );
  }
  L.push("## Scenario entries", "");
  for (const [k, e] of scenarios) {
    L.push(`### ${k} ${e.name}`, "", `Confirmed: ${e.confirmed}` + (e.settles ? ` \xB7 Settles: ${e.settles}` : ""), "");
    for (const w of ["given", "when", "then"]) if (e[w]) L.push(`${title(w)} ${e[w]}`);
    if (e.excludes) L.push(`Excludes: ${e.excludes}`);
    L.push(...changedLines(e), "");
  }
  return L.join("\n").replace(/\n+$/u, "") + "\n";
};
var renderAll = (led) => {
  const out2 = /* @__PURE__ */ new Map();
  out2.set(nodePath5.join(led.dir, "DESIGN.md"), renderDesign(led));
  out2.set(nodePath5.join(led.dir, "CONTEXT.md"), renderContext(led));
  for (const nid of Object.keys(led.nodes)) out2.set(nodePath5.join(led.dir, "nodes", `${nid}.md`), renderNode(led, nid));
  return out2;
};

// src/check.ts
import * as nodePath6 from "node:path";
var checkSync = (led, viewsOnDisk) => {
  const E = (msg) => {
    led.errors.push(msg);
  };
  const W = (msg) => {
    led.warnings.push(msg);
  };
  const nodes = led.nodes;
  led.errors.push(...validate3(led));
  const fr = led.frontier();
  const liveRoots = led.roots().filter((r) => !["retired", "superseded"].includes(nodes[r].design));
  if (Object.keys(nodes).length && liveRoots.length !== 1) {
    const first = minStr(liveRoots, "");
    const orphans = liveRoots.filter((r) => r !== first);
    E(`ledger: expected exactly one root node; found ${reprList(liveRoots)}.` + (orphans.length ? ` ${orphans.join(", ")} lost every caller when a body was rewritten: \`retire <dir> <id> "reason"\` each node the design dropped, or restore the call in the body that used to make it. Never add a call back to satisfy this message.` : ""));
  }
  const adrs = led.adrs();
  const adrIds = new Set(adrs.map((a) => a.id));
  for (const [nid, n] of Object.entries(nodes)) {
    const where = nid;
    if (!isNodeId(nid)) E(`${where}: invalid node ID`);
    if (!DESIGN.includes(n.design)) E(`${where}: design ${repr(n.design)} not in ${reprTuple(DESIGN)}`);
    if (!REALIZATION.includes(n.realization)) E(`${where}: realization ${repr(n.realization)} not in ${reprTuple(REALIZATION)}`);
    if (!VERIFICATION.includes(n.verification)) E(`${where}: verification ${repr(n.verification)} not in ${reprTuple(VERIFICATION)}`);
    if (n.design === "superseded" && !(n.superseded_by in nodes) && !fr.has(n.superseded_by)) E(`${where}: superseded_by ${n.superseded_by === void 0 ? "None" : repr(n.superseded_by)} does not exist`);
    if (!fnOf(n.statement)) E(`${where}: statement ${repr(n.statement)} has no call \`f(...)\``);
    const body = n.body ?? [];
    const stmts = body.filter((it) => stmtKind(it.code) === "stmt");
    for (const it of stmts) {
      const tagged = "child" in it || "reuse" in it || "target" in it;
      if (!tagged && callNames(it.code).length) E(`${where}: untagged call ${repr(it.code)}; tag \`-- D-NNN\` (new id), \`-- \u2197 D-NNN\` (reuse) or \`-- \u21D2 <target>: <identifier>\``);
      const cid = it.child;
      if (!["superseded", "retired"].includes(n.design) && cid !== void 0 && cid in nodes && nodes[cid].design === "superseded") E(`${where}: calls ${cid} which is ${led.status(cid)}; call the node that replaced it`);
      if (!["superseded", "retired"].includes(n.design) && "reuse" in it && (!(it.reuse in nodes) || nodes[it.reuse].design !== "approved")) E(`${where}: reuse \u2197 ${it.reuse} but it is not an approved node`);
      if ("target" in it) {
        const why = targetOk(it.target);
        if (why) E(`${where}: ${why}`);
      }
    }
    if (n.design === "approved") {
      if (n.approved_content_hash !== fingerprint(n)) E(`${where}: approved content changed; reopen and re-approve it`);
      if (nodeUnknowns(n).length) E(`${where}: approved with unresolved ?${nodeUnknowns(n).join(", ?")}`);
      if (!body.length && !n.target && !n.implementation_plan) E(`${where}: approved needs a refinement body (\`body\`) or a target (\`terminal\`)`);
      if (body.length && !led.isCollapsed(n) && !n.composition?.length) E(`${where}: approved composite lacks composition (\`set ${nid} composition ...\`)`);
      if (n.approved_hash && n.approved_hash !== bodyHash(body)) E(`${where}: body changed since approval; \`reopen\` then \`approve\` again`);
      if (n.adr_pending) E(`${where}: approved while ${n.adr_pending} is pending; \`adr accept\` first`);
    }
    for (const ad of n.adaptation ?? []) {
      const clause = strip(partition5(ad, ":")[0]).toLowerCase();
      if (!ad.includes("\u2192") && !ad.includes("->") && !(clause in (n.contract ?? {}))) {
        E(`${where}: adaptation ${repr(ad)} must name the clause it maps \u2014 '<clause> \u2192 <concrete construct>' or '<Clause>: <concrete construct>' (query text, API call + args, type); behaviour prose is not adaptation`);
      }
    }
    if (n.implementation_plan && (body.length || n.target)) E(`${where}: implementation-ready leaves cannot also have a body or target`);
    if (n.behavior && Object.keys(n.behavior).length) {
      const why = validateBehavior(n.behavior);
      if (why) E(`${where}: ${why}`);
    }
    if (n.target) {
      const why = targetOk(n.target);
      if (why) E(`${where}: ${why}`);
      if (body.length && !led.isCollapsed(n)) E(`${where}: has target and child statements; a terminal has no body, a collapsed leaf tags every statement \`-- \u21D2\``);
    }
    for (const r of n.depends ?? []) {
      if (isNodeId(r) || isAdrId(r)) {
        if (!led.resolves(r)) E(`${where}: depends on ${r} which does not exist`);
        else if (isNodeId(r) && n.design === "approved") {
          const u = nodes[r];
          if (u && ["stale", "superseded", "retired"].includes(u.design)) E(`${where}: depends on ${r} which is ${led.status(r)}; \`stale\` this node and re-approve it against the live design, or re-point the dependency`);
        }
        continue;
      }
      const e = led.entry(r);
      if (!e) E(`${where}: depends on ${repr(r)}: no term / fact / scenario with that name or id (\`entry\` first)`);
      else if (n.design === "approved" && n.approved_at) {
        const last = maxStr((e[2].changed ?? []).map((c) => c.at), "");
        if (last > n.approved_at) E(`${where}: ${e[1]} changed ${last.slice(0, 10)} after approval ${n.approved_at.slice(0, 10)}; \`stale\` or \`reopen\`+\`approve\``);
      }
    }
    if (n.adr_pending && !adrIds.has(n.adr_pending)) E(`${where}: adr_pending ${n.adr_pending} has no file`);
  }
  for (const a of adrs) {
    for (const rid of a.constrains) {
      if (!["superseded", "deprecated"].includes(a.status) && rid in nodes && nodes[rid].design === "superseded") E(`${nodePath6.basename(a.path)}: constrains ${rid} which is ${led.status(rid)}; re-point to the live node`);
      else if (!(rid in nodes) && !fr.has(rid)) E(`${nodePath6.basename(a.path)}: constrains ${rid} which does not exist`);
    }
    if (a.lines.join("\n").includes("<1\u20133 sentences")) W(`${nodePath6.basename(a.path)}: paragraph still a placeholder`);
  }
  const live = Object.values(nodes).filter((n) => !["retired", "superseded"].includes(n.design) && Object.keys(n.contract ?? {}).length);
  const prose = live.map((n) => [n.statement ?? "", n.effect ?? "", ...Object.values(n.contract ?? {})].join(" ").toLowerCase()).join(" ");
  const words = new Set(splitWs(Array.from(prose).map((c) => isAlnumChar(c) ? c : " ").join("")));
  const stateful = ["state", "retry", "durable", "workflow", "transition", "concurrent", "concurrency"].some((w) => words.has(w));
  if (live.length && !fr.size && live.every((n) => n.design === "approved") && !Object.keys(led.data.scenarios ?? {}).length && stateful) {
    W("ledger: complete stateful design has no scenarios; record relevant success and failure paths");
  }
  for (const amb of led.data.ambiguities ?? []) {
    const r = amb.resolves_at;
    if (r in nodes && nodes[r].design === "approved") E(`ambiguity ${repr(amb.claim)} resolves at ${r} which is approved; re-point (\`ambiguity\`) or drop it`);
  }
  for (const f of ["terms", "facts", "scenarios"]) {
    for (const [k, e] of Object.entries(led.data[f] ?? {})) {
      if (!(e.definition || e.then)) E(`${f}/${k}: empty definition`);
      if (f === "scenarios" && e.settles && !led.termsIn(e.settles).length) W(`${f}/${k}: settles ${repr(e.settles)} names no term`);
      for (const t of e.not ?? []) if (!led.entry(t)) W(`${f}/${k}: not ${repr(t)} is not a term`);
    }
  }
  if (viewsOnDisk) {
    for (const [p2, text] of renderAll(led)) {
      const onDisk = viewsOnDisk.get(p2);
      if (onDisk === null || onDisk === void 0) E(`${nodePath6.basename(p2)}: missing; run sync`);
      else if (onDisk !== text) E(`${relpath(p2, led.dir)}: generated view edited or stale; run sync (edit the ledger via the CLI, never the view)`);
    }
  }
};
var readViews = Effect_exports.fn("readViews")(function* (led) {
  const fs = yield* FileSystem_exports.FileSystem;
  const out2 = /* @__PURE__ */ new Map();
  for (const p2 of renderAll(led).keys()) {
    const exists = yield* asFail(fs.exists(p2));
    out2.set(p2, exists ? yield* asFail(fs.readFileString(p2)) : null);
  }
  return out2;
});
var check = Effect_exports.fn("check")(function* (led, options = { views: true }) {
  const views = options.views ? yield* readViews(led) : void 0;
  checkSync(led, views);
});
var compactErrors = (errors) => {
  const grouped2 = /* @__PURE__ */ new Map();
  const rest = [];
  for (const error of errors) {
    const [, marker, tail] = partition5(error, ": constrains ");
    const node = marker ? split2(tail, " ", 1)[0] : "";
    if (marker && isNodeId(node)) {
      if (!grouped2.has(node)) grouped2.set(node, []);
      grouped2.get(node).push(error);
    } else rest.push(error);
  }
  for (const node of [...grouped2.keys()].sort()) {
    const items = grouped2.get(node);
    if (items.length === 1) rest.push(...items);
    else rest.push(`${items.length} ADRs are blocked by ${node}; run \`repair\` for dependency order`);
  }
  return rest;
};
var report = Effect_exports.fn("report")(function* (led, head3 = "") {
  const io = yield* Io;
  if (head3) io.out(head3 + "\n");
  for (const w of led.warnings) io.out(`warn  ${w}
`);
  for (const e of compactErrors(led.errors)) io.out(`error ${e}
`);
  io.out(`${led.errors.length ? "FAIL" : "ok"}  ${nodePath6.basename(led.dir)}: ${Object.keys(led.nodes).length} nodes, ${led.frontier().size} frontier, ${led.errors.length} errors, ${led.warnings.length} warnings
`);
  return led.errors.length ? 1 : 0;
});
var deriveDepends = (led) => {
  const adrs = led.adrs();
  const adrIds = new Set(adrs.map((a) => a.id));
  for (const adr of adrs) {
    for (const nid of adr.constrains) {
      const n = led.nodes[nid];
      if (n !== void 0) {
        n.depends ??= [];
        if (!n.depends.includes(adr.id)) n.depends.push(adr.id);
      }
    }
  }
  for (const [nid, n] of Object.entries(led.nodes)) {
    const text = [n.gloss ?? "", n.effect ?? "", ...Object.values(n.contract ?? {})].join(" ");
    const deps = n.depends ??= [];
    const called = new Set((n.body ?? []).map((it) => it.child || it.reuse));
    for (const word of splitWs(text)) {
      const w = strip(word, ",.;:()[]`");
      if (isCtxId(w) && led.entry(w) || isAdrId(w) && adrIds.has(w) || isNodeId(w) && w !== nid && !called.has(w) && w in led.nodes) {
        if (!deps.includes(w)) deps.push(w);
      }
    }
    for (const rows of Object.values(n.behavior ?? {})) {
      for (const row of rows ?? []) {
        const ref = row.node;
        if (ref && ref !== nid && !deps.includes(ref)) deps.push(ref);
      }
    }
    const padded = ` ${text} `;
    const cleaned = padded.replaceAll(",", " ").replaceAll(".", " ").replaceAll(";", " ").replaceAll("(", " ").replaceAll(")", " ");
    for (const t of Object.keys(led.data.terms ?? {})) if (cleaned.includes(` ${t} `) && !deps.includes(t)) deps.push(t);
  }
};

// src/html.ts
import * as nodePath7 from "node:path";
import { fileURLToPath as fileURLToPath2 } from "node:url";
var DATA_MARKER = "__STEPWISE_DATA__";
var templateCandidates = () => {
  const here = nodePath7.dirname(fileURLToPath2(import.meta.url));
  return [nodePath7.join(here, "design-view.html"), nodePath7.join(here, "..", "dist", "design-view.html")];
};
var readTemplate = Effect_exports.fn("readTemplate")(function* () {
  const fs = yield* FileSystem_exports.FileSystem;
  for (const candidate of templateCandidates()) if (yield* fs.exists(candidate)) return yield* fs.readFileString(candidate).pipe(Effect_exports.mapError((e) => fail10(e.message)));
  return yield* fail10("design-view.html template is missing; run `pnpm run build:viewer` in the skill directory");
});
var encodePayload = (ledger, options) => {
  const payload = { ledger, title: options.title, exported_at: options.exportedAt, adrs: options.adrs, review_key: options.reviewKey ?? "", pseudocode: presentation(ledger) };
  return pyJsonDumps(payload, { ensureAscii: true }).replaceAll("<", "\\u003c").replaceAll(">", "\\u003e").replaceAll("&", "\\u0026");
};
var renderHtml = Effect_exports.fn("renderHtml")(function* (ledger, options) {
  const template = yield* readTemplate();
  return template.replace(DATA_MARKER, () => encodePayload(ledger, options));
});

// src/verbs.ts
var s = (a, key) => a[key] ?? "";
var opt = (a, key) => a[key] ?? null;
var list = (a, key) => a[key] ?? [];
var flagOf = (a, key) => Boolean(a[key]);
var out = Effect_exports.fn("out")(function* (text) {
  const io = yield* Io;
  io.out(text);
});
var need = (led, nid) => {
  const n = led.node(nid);
  if (n === void 0) return fail10(`${nid}: no such node` + (led.frontier().has(nid) ? " \u2014 it is on the frontier; `new` it first" : ""));
  return Effect_exports.succeed(n);
};
var hist = (n, event, reason = "") => {
  ;
  (n.history ??= []).push({ date: today(), event, ...reason ? { reason } : {} });
};
var finish = (led, head3 = "") => Effect_exports.sync(() => {
  if (head3) led.messages.push(head3);
});
var attempt = (thunk) => Effect_exports.try({ try: thunk, catch: (e) => e instanceof Fail2 ? e : fail10(e instanceof Error ? e.message : String(e)) });
var vFrontier = (led) => Effect_exports.gen(function* () {
  const io = yield* Io;
  const fr = led.frontier();
  for (const fid of sorted(fr.keys())) {
    const [stmt, parent] = fr.get(fid);
    io.out(`${fid}  frontier  ${stmt}  (child of ${parent})
`);
  }
  const drafts = Object.entries(led.nodes).filter(([nid, n]) => n.design === "draft" && (n.origin !== "existing-code" || Object.keys(n.contract ?? {}).length || led.dependents(nid).length)).map(([nid]) => nid);
  for (const nid of drafts) io.out(`${nid}  ${led.status(nid)}  ${led.nodes[nid].statement}
`);
  if (!fr.size && !drafts.length) {
    const anyExisting = Object.values(led.nodes).some((n) => n.origin === "existing-code");
    io.out((anyExisting ? "design frontier empty; use scan for existing-code observation work" : Object.keys(led.nodes).length ? "frontier empty \u2014 check approval and leaf readiness" : 'no nodes \u2014 `new <dir> D-000 "outcome <- f(x)"`') + "\n");
  }
});
var vShow = (led, a) => Effect_exports.gen(function* () {
  yield* need(led, s(a, "id"));
  yield* out(renderNode(led, s(a, "id")));
});
var vNew = (led, a) => Effect_exports.gen(function* () {
  const id = s(a, "id");
  const statement = opt(a, "statement");
  if (id in led.nodes) return yield* fail10(`${id} already exists`);
  const fr = led.frontier();
  let code;
  if (fr.has(id)) {
    const pid = fr.get(id)[1];
    code = led.nodes[pid].body.find((it) => it.child === id).code;
  } else if (statement && !Object.keys(led.nodes).length) code = statement;
  else if (statement) return yield* fail10(`${id} is not on the frontier and a root already exists (${reprList(led.roots())}); pick from \`frontier\``);
  else return yield* fail10(`${id} is not on the frontier; a root needs its statement: new <dir> ${id} "outcome <- f(x)"`);
  if (!fnOf(code)) return yield* fail10(`statement ${repr(code)} has no call \`f(...)\``);
  led.nodes[id] = { statement: code, gloss: "", effect: "", contract: {}, depends: [], design: "draft", realization: "not-started", verification: "unverified", approved: "" };
  yield* finish(led, `created ${id} \`${code}\` (draft). Next: \`set <dir> ${id} '<json>'\` with gloss, effect, and contract (unknowns as ?slug), then \`answer\`, \`body\`, \`approve\`.`);
});
var contentEditError = (nid, n) => {
  if (n.design === "draft") return "";
  if (transition(n.design, "draft") === "reopen") return `${nid} is ${n.design}; \`reopen ${nid} "reason"\` before changing approved design content`;
  const state = n.design === "superseded" ? `superseded by ${n.superseded_by ?? "?"}` : n.design;
  return `${nid} is ${state}; its historical content cannot be edited`;
};
var isWordChar = (ch) => /^[\p{L}\p{N}_]$/u.test(ch);
var replaceCallName = (code, oldName, newName) => {
  let result4 = "";
  let i = 0;
  let quote = "";
  let escaped = false;
  while (i < code.length) {
    const ch = code[i];
    if (quote) {
      result4 += ch;
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) quote = "";
      i += 1;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      result4 += ch;
      i += 1;
      continue;
    }
    if (code.startsWith(oldName, i) && (i === 0 || !(isWordChar(code[i - 1]) || code[i - 1] === "."))) {
      const end3 = i + oldName.length;
      let after = end3;
      while (after < code.length && code[after] === " ") after += 1;
      if ((end3 === code.length || !isWordChar(code[end3])) && after < code.length && code[after] === "(") {
        result4 += newName;
        i = end3;
        continue;
      }
    }
    result4 += ch;
    i += 1;
  }
  return result4;
};
var renameStatement = (led, nid, value) => {
  const n = led.nodes[nid];
  const oldName = fnOf(n.statement);
  const newName = fnOf(value);
  const changes2 = [];
  if (oldName !== newName) {
    for (const pid of led.parents(nid)) {
      const parent = led.nodes[pid];
      const rows = (parent.body ?? []).filter((line) => (line.child || line.reuse) === nid && callNames(line.code).includes(oldName));
      if (rows.length && parent.design !== "draft") return `reopen parent ${pid} in the same batch before renaming ${nid}; its tagged call still uses ${oldName}(...)`;
      changes2.push(...rows);
    }
    for (const line of changes2) line.code = replaceCallName(line.code, oldName, newName);
  }
  n.statement = value;
  return "";
};
var isPlainObject4 = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
var isStringArray = (v) => Array.isArray(v) && v.every((x) => typeof x === "string");
var same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
var jsonErrorMessage = (raw, error) => {
  const at = /position (\d+)/u.exec(error.message);
  if (at) {
    const pos = Number(at[1]);
    const before = raw.slice(0, pos);
    const lineno = before.split("\n").length;
    const colno = pos - before.lastIndexOf("\n");
    return `invalid JSON set payload at line ${lineno}, column ${colno}: ${error.message}`;
  }
  return `invalid JSON set payload at line 1, column 1: ${error.message}`;
};
var vSetJson = (led, nid, n, raw) => Effect_exports.gen(function* () {
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (error) {
    return yield* fail10(`${nid}: ${jsonErrorMessage(raw, error)}`);
  }
  if (!isPlainObject4(payload)) return yield* fail10(`${nid}: JSON set payload must be an object`);
  if (!Object.keys(payload).length) return yield* fail10(`${nid}: JSON set payload is empty`);
  const unknown2 = sorted(Object.keys(payload).filter((k) => !JSON_SET_FIELDS.includes(k)));
  if (unknown2.length) return yield* fail10(`${nid}: unknown JSON field(s) ${unknown2.join(", ")}; fields: ${JSON_SET_FIELDS.join(", ")}`);
  const updates = {};
  for (const [f, value] of Object.entries(payload)) {
    if (TEXT_FIELDS.includes(f)) {
      if (typeof value !== "string") return yield* fail10(`${nid}: JSON field ${repr(f)} must be a string`);
      if (f === "statement" && !fnOf(strip(value))) return yield* fail10(`${nid}: statement ${repr(value)} has no call \`f(...)\``);
      updates[f] = strip(value);
    } else if (f === "contract") {
      if (!isPlainObject4(value)) return yield* fail10(`${nid}: JSON field 'contract' must be an object of lowercase label to clause`);
      const contract = {};
      for (const [label, clause] of Object.entries(value)) {
        if (!isAlpha(label) || !isLower(label)) return yield* fail10(`${nid}: contract label ${repr(label)} must be one lowercase word`);
        if (typeof clause !== "string") return yield* fail10(`${nid}: contract clause ${repr(label)} must be a string`);
        contract[label] = strip(clause);
      }
      updates[f] = contract;
    } else if (LIST_FIELDS.includes(f)) {
      if (!isStringArray(value)) return yield* fail10(`${nid}: JSON field ${repr(f)} must be an array of strings`);
      updates[f] = value.map((item) => strip(item)).filter((item) => item);
    } else if (f === "depends") {
      if (!isStringArray(value)) return yield* fail10(`${nid}: JSON field 'depends' must be an array of entry, node, or ADR names`);
      const deps = [];
      for (const item of value) {
        const ref = led.canonical(item);
        if (!led.resolves(ref)) return yield* fail10(`${nid}: ${repr(item)} is not a term / fact / scenario / node / ADR on disk \u2014 \`entry\` first`);
        if (!deps.includes(ref)) deps.push(ref);
      }
      updates[f] = deps;
    } else if (f === "realization") {
      if (typeof value !== "string" || !REALIZATION.includes(value)) return yield* fail10(`${nid}: realization must be one of ${reprTuple(REALIZATION)}`);
      updates[f] = value;
    } else if (f === "verification") {
      if (value !== coverage(n).status) return yield* fail10(`${nid}: verification is derived from current clause evidence; use \`evidence --clause LABEL\``);
    } else if (f === "implementation_plan") {
      if (!isPlainObject4(value) || Object.keys(value).sort().join() !== "approach,validation" || !Object.values(value).every((v) => typeof v === "string" && strip(v))) {
        return yield* fail10(`${nid}: implementation_plan needs nonempty approach and validation strings`);
      }
      updates[f] = value;
    } else if (f === "behavior") {
      const why = validateBehavior(value);
      if (why) return yield* fail10(`${nid}: ${why}`);
      updates[f] = value;
    }
  }
  const contentFields = CONTENT_FIELDS;
  const semanticChanged = Object.entries(updates).some(([f, value]) => contentFields.includes(f) && !same(n[f], value));
  const historicalChanged = ["superseded", "retired"].includes(n.design) && Object.entries(updates).some(([f, value]) => contentFields.includes(f) && !same(n[f], value));
  if (semanticChanged || historicalChanged) {
    const why = contentEditError(nid, n);
    if (why) return yield* fail10(why);
  }
  if ("statement" in updates) {
    const statement = updates.statement;
    delete updates.statement;
    const why = renameStatement(led, nid, statement);
    if (why) return yield* fail10(why);
  }
  Object.assign(n, updates);
  const fields = Object.keys(payload).join(", ");
  yield* finish(led, `${nid} set from JSON: ${fields}` + (nodeUnknowns(n).length ? `; open ?: ${reprList(nodeUnknowns(n))}` : ""));
});
var startsJson = (f) => lstrip(f).startsWith("{") || lstrip(f).startsWith("[");
var vSet = (led, a) => Effect_exports.gen(function* () {
  const id = s(a, "id");
  const n = yield* need(led, id);
  const f = s(a, "field");
  const vals = list(a, "value");
  if (!vals.length && startsJson(f)) return yield* vSetJson(led, id, n, f);
  if (!vals.length) return yield* fail10(`${id}: field ${repr(f)} needs a value; for several fields pass one quoted JSON object`);
  if (startsJson(f)) return yield* fail10(`${id}: JSON set payload must be passed as one quoted argument`);
  const contractField = CONTRACT_KEYS.includes(f) || isAlpha(f) && isLower(f) && ![...LIST_FIELDS, "realization", "verification", "depends"].includes(f);
  const textOrList = [...TEXT_FIELDS, ...LIST_FIELDS, "depends"].includes(f);
  if (["superseded", "retired"].includes(n.design) && (textOrList || contractField)) return yield* fail10(contentEditError(id, n));
  if (CONTENT_FIELDS.includes(f) || contractField) {
    const why = contentEditError(id, n);
    if (why) return yield* fail10(why);
  }
  if (TEXT_FIELDS.includes(f)) {
    if (f === "statement" && !fnOf(strip(vals.join(" ")))) return yield* fail10(`${id}: statement has no call \`f(...)\``);
    if (f === "statement") {
      const why = renameStatement(led, id, strip(vals.join(" ")));
      if (why) return yield* fail10(why);
    } else n[f] = strip(vals.join(" "));
  } else if (contractField) {
    ;
    (n.contract ??= {})[f] = strip(vals.join(" "));
  } else if (LIST_FIELDS.includes(f)) {
    n[f] = vals.map((v) => strip(v)).filter((v) => v);
  } else if (f === "depends") {
    const deps = n.depends ??= [];
    if (vals.length === 1 && vals[0] === "-") {
      deps.length = 0;
      return yield* finish(led, `${id}.depends cleared`);
    }
    for (const v of vals) {
      const ref = led.canonical(v);
      if (!led.resolves(ref)) return yield* fail10(`${repr(v)} is not a term / fact / scenario / node / ADR on disk \u2014 \`entry\` first`);
      if (!deps.includes(ref)) deps.push(ref);
    }
    return yield* finish(led, `${id}.depends = ${reprList(deps)}`);
  } else if (f === "realization") {
    if (!REALIZATION.includes(vals[0])) return yield* fail10(`realization must be one of ${reprTuple(REALIZATION)}`);
    n[f] = vals[0];
  } else if (f === "verification") {
    if (vals[0] !== coverage(n).status) return yield* fail10("verification is derived from current clause evidence; use `evidence --clause LABEL`");
  } else {
    return yield* fail10(`unknown field ${repr(f)}; fields: ${reprTuple([...TEXT_FIELDS, ...CONTRACT_KEYS, ...LIST_FIELDS, "realization", "verification"])}`);
  }
  yield* finish(led, `${id}.${f} set` + (nodeUnknowns(n).length ? `; open ?: ${reprList(nodeUnknowns(n))}` : ""));
});
var vBody = (led, a) => Effect_exports.gen(function* () {
  const id = s(a, "id");
  const n = yield* need(led, id);
  const why = contentEditError(id, n);
  if (why) return yield* fail10(why);
  const file = s(a, "file");
  const text = opt(a, "text");
  if (file && text !== null) return yield* fail10("body accepts --file or --text, not both");
  const fs = yield* FileSystem_exports.FileSystem;
  const io = yield* Io;
  const source = text !== null ? text : file ? yield* fs.readFileString(file).pipe(Effect_exports.mapError((e) => fail10(e.message))) : yield* io.stdin;
  const items = yield* attempt(() => parseBody(source, fnOf(n.statement)));
  if (!items.length) return yield* fail10("empty body");
  n.body = items;
  delete n.implementation_plan;
  delete n.target;
  autotag(led, id);
  const fresh2 = n.body.filter((it) => it.child && !(it.child in led.nodes)).map((it) => it.child);
  yield* finish(led, `${id} body: ${items.length} lines; children ${fresh2.length ? reprList(sorted(new Set(fresh2))) : "none new"}`);
});
var autotag = (led, nid) => {
  const byFn = /* @__PURE__ */ new Map();
  for (const [oid, o] of Object.entries(led.nodes)) {
    const name = fnOf(o.statement);
    if (oid !== nid && name) {
      if (!byFn.has(name)) byFn.set(name, []);
      byFn.get(name).push(oid);
    }
  }
  for (const it of led.nodes[nid].body ?? []) {
    if (stmtKind(it.code) !== "stmt" || "child" in it || "reuse" in it || "target" in it) continue;
    const calls = callNames(it.code);
    if (calls.length === 1 && byFn.get(calls[0])?.length === 1) it.child = byFn.get(calls[0])[0];
  }
};
var vAnswer = (led, a) => Effect_exports.gen(function* () {
  const id = s(a, "id");
  const n = yield* need(led, id);
  const why = contentEditError(id, n);
  if (why) return yield* fail10(why);
  const slug = lstrip(s(a, "slug"), "?");
  if (!nodeUnknowns(n).includes(slug)) return yield* fail10(`${id} has no ?${slug}; open: ${nodeUnknowns(n).length ? reprList(nodeUnknowns(n)) : "none"}`);
  const name = s(a, "name");
  const ref = led.canonical(name);
  if (!led.resolves(ref)) return yield* fail10(`${repr(name)} is not on disk \u2014 \`entry <dir> term|fact|scenario "${name}" "<definition>"\` first`);
  const sub = (t) => t.split(" ").map((w) => {
    const tail = w.slice(slug.length + 1);
    return w.startsWith("?" + slug) && ["", ",", ".", ";", ":", ")", "]"].includes(w.slice(slug.length + 1, slug.length + 2)) ? ref + tail : w;
  }).join(" ");
  for (const f of TEXT_FIELDS) n[f] = sub(n[f] ?? "");
  n.contract = Object.fromEntries(Object.entries(n.contract ?? {}).map(([k, v]) => [k, sub(v)]));
  n.depends ??= [];
  if (!n.depends.includes(ref)) n.depends.push(ref);
  const left = nodeUnknowns(n);
  yield* finish(led, `${id}: ?${slug} -> ${ref}; depends += ${ref}` + (left.length ? `; open: ${reprList(left)}` : "; no ? left \u2014 propose the refinement"));
});
var vTerminal = (led, a) => Effect_exports.gen(function* () {
  const id = s(a, "id");
  const n = yield* need(led, id);
  const why = contentEditError(id, n);
  if (why) return yield* fail10(why);
  const t = strip(strip(s(a, "target")), "`");
  const bad = targetOk(t);
  if (bad) return yield* fail10(bad);
  if (n.body?.length && !led.isCollapsed(n)) return yield* fail10(`${id} has child statements; a terminal has no body (drop it) \u2014 or collapse: tag every statement \`-- \u21D2 <target>: <identifier>\``);
  n.target = t;
  delete n.implementation_plan;
  yield* finish(led, `${id} terminal \u21D2 ${t}. Add \`set <dir> ${id} '{"adaptation":["<clause> \u2192 <real>"]}'\` when shape changes, then \`approve ${id}\``);
});
var vProposal = (led, a) => Effect_exports.gen(function* () {
  const n = yield* need(led, s(a, "id"));
  deriveDepends(led);
  yield* out(`proposal ${s(a, "id")} ${proposalHash(n)}
`);
});
var vApprove = (led, a) => Effect_exports.gen(function* () {
  const id = s(a, "id");
  const n = yield* need(led, id);
  deriveDepends(led);
  const problems = [];
  const actor = strip(s(a, "actor")) || strip(s(a, "by"));
  const actorFlag = s(a, "actor");
  const hash2 = s(a, "proposal_hash");
  if (!actor) problems.push("approval actor missing; pass --by or --actor");
  if (actorFlag && !hash2) problems.push("proposal hash missing; use proposal then --proposal-hash with --actor");
  if (hash2 && hash2 !== proposalHash(n)) problems.push(`approval hash does not match current proposal ${proposalHash(n)}`);
  if (nodeUnknowns(n).length) problems.push(`unresolved ?${nodeUnknowns(n).join(", ?")} \u2014 \`answer\` each`);
  for (const f of ["gloss", "effect"]) if (!n[f]) problems.push(`${f} empty \u2014 \`set ${id} ${f} ...\``);
  if (Object.values(n.contract ?? {}).some((clause) => !strip(clause))) problems.push("contract clauses must be nonempty");
  if (!Object.keys(n.contract ?? {}).length) problems.push(`contract empty \u2014 \`set ${id} pre|post|failure|invariant ...\``);
  const body = n.body ?? [];
  if (!body.length && !n.target && !n.implementation_plan) problems.push("needs a body, terminal target, or bounded `ready` implementation plan");
  if (body.length && !n.walkthrough?.length) problems.push(`walkthrough missing \u2014 \`set ${id} walkthrough "..."\` (what the function does)`);
  if (body.length && !led.isCollapsed(n) && !n.composition?.length) problems.push(`composition missing \u2014 \`set ${id} composition ...\``);
  for (const it of body) {
    const tagged = "child" in it ? "child" : "reuse" in it ? "reuse" : "target" in it ? "target" : "";
    const known = led.nodes[it.child || it.reuse || ""]?.gloss;
    if (tagged && !it.gloss && !known) {
      const how = tagged === "child" ? `-- ${it.child}: <one line>` : `-- ${itemTag(it)} -- <one line>`;
      problems.push(`${repr(it.code)} says nothing about what it does \u2014 tag it \`${how}\``);
    }
  }
  for (const it of body) {
    if (stmtKind(it.code) === "stmt" && !("child" in it || "reuse" in it || "target" in it) && callNames(it.code).length) problems.push(`untagged call ${repr(it.code)}`);
  }
  if (n.target) {
    const why = targetOk(n.target);
    if (why) problems.push(why);
  }
  if (n.adr_pending) problems.push(`${n.adr_pending} pending \u2014 \`adr accept ${n.adr_pending}\` after the user accepts it`);
  if (problems.length) return yield* new Refused({ lines: [`refused ${id}:`, ...problems.map((p2) => `  - ${p2}`)] });
  if (transition(n.design, "approved") === void 0) {
    const legal = legalMoves(n.design);
    return yield* fail10(`${id} is ${n.design}; \`approve\` moves a draft. From ${n.design}: ${legal.join(", ") || "none"}`);
  }
  const reApproval = Boolean(n.approved);
  const contractChanged = reApproval && (n.contract_hash ?? contractHash(n)) !== contractHash(n);
  delete n.stale_by;
  n.design = "approved";
  n.approved = `${today()} by ${actor}`;
  n.approved_by = actor;
  n.proposal_hash = proposalHash(n);
  n.approved_at = now();
  n.revision = (n.revision ?? 0) + 1;
  n.approved_content_hash = fingerprint(n);
  n.approved_hash = bodyHash(body);
  n.contract_hash = contractHash(n);
  if (reApproval) hist(n, "re-approved");
  const cascaded = contractChanged ? cascadeStale(led, id, "contract changed") : [];
  const ambs = led.data.ambiguities ?? [];
  const resolved = ambs.filter((x) => x.resolves_at === id).map((x) => x.claim);
  led.data.ambiguities = ambs.filter((x) => x.resolves_at !== id);
  yield* finish(led, `approved ${id}` + (cascaded.length ? `; contract changed, now stale: ${cascaded.join(", ")}` : "") + (resolved.length ? `; resolved ambiguities dropped: ${resolved.join(", ")}` : ""));
  const fr = led.frontier();
  const fresh2 = body.filter((it) => it.child && fr.has(it.child)).map((it) => it.child);
  if (fresh2.length) yield* out(`next: \`new <dir> ${fresh2[0]}\`  (frontier: ${sorted(fr.keys()).join(", ")})
`);
  else if (!fr.size && !Object.values(led.nodes).some((x) => x.design === "draft")) yield* out("frontier empty \u2014 check remaining stale or unapproved nodes before declaring completion\n");
});
var flip4 = (led, nid, design, event, reason, extra = {}) => Effect_exports.gen(function* () {
  const n = yield* need(led, nid);
  const verb2 = transition(n.design, design);
  if (verb2 === void 0) {
    const legal = legalMoves(n.design);
    return yield* fail10(`${nid} is ${n.design}; it cannot become ${design}. From ${n.design} the legal moves are: ${legal.join(", ") || "none"}`);
  }
  if (design !== "stale") delete n.stale_by;
  n.design = design;
  Object.assign(n, extra);
  if (design !== "approved" && n.verification === "verified") n.verification = "stale";
  hist(n, event, reason);
  const cascaded = ["stale", "superseded", "retired"].includes(design) ? cascadeStale(led, nid, event) : [];
  yield* finish(led, `${nid} -> ${led.status(nid)}` + (cascaded.length ? `; now stale: ${cascaded.join(", ")}` : ""));
});
var vReopen = (led, a) => Effect_exports.gen(function* () {
  const id = s(a, "id");
  const reason = s(a, "reason");
  const n = led.nodes[id];
  if (n && ["approved", "stale", "retired"].includes(n.design)) {
    const content = {};
    for (const f of CONTENT_FIELDS) if (f in n) content[f] = deepCopy(n[f]);
    (n.revisions ??= []).push({ date: now(), reason, approved: n.approved ?? null, revision: n.revision ?? 0, content });
  }
  if (n && n.body?.length) {
    const record2 = { date: today(), reason };
    for (const f of ["body", "composition", "decisions", "deferred"]) if (n[f]?.length) record2[f] = n[f];
    n.superseded = record2;
  }
  yield* flip4(led, id, "draft", "reopened", reason);
});
var vRetire = (led, a) => Effect_exports.gen(function* () {
  const id = s(a, "id");
  if (led.parents(id).length) return yield* fail10(`${id} is still called by ${led.parents(id).join(", ")}; remove the call first, or this node is not retired`);
  yield* flip4(led, id, "retired", "retired", s(a, "reason"));
});
var changedDeps = (led, n) => {
  const since = n.approved_at ?? "";
  const result4 = [];
  for (const r of n.depends ?? []) {
    if (isNodeId(r)) {
      const u = led.nodes[r];
      if (u && (["stale", "superseded", "retired"].includes(u.design) || (u.approved_at ?? "") > since)) result4.push(`${r} (${led.status(r)})`);
    } else {
      const e = led.entry(r);
      if (e) {
        const last = maxStr((e[2].changed ?? []).map((c) => c.at), "");
        if (last > since) result4.push(`${e[1]} (${last.slice(0, 10)})`);
      }
    }
  }
  return result4;
};
var cascadeStale = (led, origin, why) => {
  const seen = /* @__PURE__ */ new Set([origin]);
  const queue = led.dependents(origin);
  const result4 = [];
  while (queue.length) {
    const nid = queue.pop();
    if (seen.has(nid)) continue;
    seen.add(nid);
    queue.push(...led.dependents(nid));
    const n = led.nodes[nid];
    if (n.design !== "approved") continue;
    n.design = "stale";
    n.stale_by = [`${origin} (${why} ${today()})`];
    if (n.verification === "verified") n.verification = "stale";
    hist(n, "stale", `${origin} ${why}`);
    result4.push(nid);
  }
  return sorted(result4);
};
var vStale = (led, a) => Effect_exports.gen(function* () {
  const id = s(a, "id");
  const n = led.nodes[id];
  if (n !== void 0) n.stale_by = changedDeps(led, n);
  yield* flip4(led, id, "stale", "stale", s(a, "reason"));
});
var vReaffirm = (led, a) => Effect_exports.gen(function* () {
  const id = s(a, "id");
  const n = yield* need(led, id);
  if (n.design !== "stale") return yield* fail10(`${id} is ${n.design}; \`reaffirm\` returns a stale node, nothing else`);
  const actor = strip(s(a, "actor")) || strip(s(a, "by"));
  if (!actor) return yield* fail10(`approval actor missing \u2014 pass \`--actor <name>\`; a reaffirmation is still someone accepting ${id}`);
  if (!intact(n)) {
    return yield* fail10(`${id} changed since it was approved; \`reopen ${id} "<reason>"\` then \`proposal\` + \`approve\` \u2014 reaffirm only returns a node whose own statement, contract and body are untouched`);
  }
  const why = (n.stale_by ?? []).join(", ") || "changed dependencies";
  delete n.stale_by;
  n.design = "approved";
  n.approved = `${n.approved || today()}; reaffirmed ${today()} by ${actor}`;
  n.approved_by = actor;
  n.approved_at = now();
  n.revision = (n.revision ?? 0) + 1;
  hist(n, "reaffirmed", why);
  yield* refreshLedger(led);
  yield* finish(led, `reaffirmed ${id} against ${why}; verification stays ${n.verification}`);
});
var vSupersede = (led, a) => Effect_exports.gen(function* () {
  const newId = s(a, "new_id");
  if (!led.resolves(newId)) return yield* fail10(`${newId} does not exist and is not on the frontier`);
  yield* flip4(led, s(a, "id"), "superseded", "superseded", s(a, "reason"), { superseded_by: newId });
});
var vEvidence = (led, a) => Effect_exports.gen(function* () {
  const id = s(a, "id");
  const n = yield* need(led, id);
  const result4 = s(a, "result");
  const note = s(a, "note");
  const assessment2 = s(a, "assessment");
  const kind = s(a, "kind");
  const scenario = s(a, "scenario");
  const scope3 = s(a, "scope");
  const withdrawnWord = (t) => strip(t).toLowerCase().startsWith("withdrawn") || strip(t).toLowerCase().startsWith("retracted");
  if (result4 === "pass" && (withdrawnWord(note) || withdrawnWord(assessment2))) return yield* fail10("withdrawn evidence cannot be passing evidence; use withdraw-evidence");
  if (scope3 === "unspecified" || !strip(assessment2)) return yield* fail10("evidence requires --scope implementation|composition|correspondence and --assessment explaining what it establishes and its limits");
  if (["test", "e2e", "integration", "property"].some((word) => kind.toLowerCase().includes(word)) && !strip(scenario)) return yield* fail10("test evidence requires --scenario naming the exercised path and configuration");
  const clauses = commaValues([...list(a, "clause"), ...list(a, "covers")]);
  if (!clauses.length) return yield* fail10("evidence requires --clause LABEL or --covers LABEL[,LABEL]");
  const missing2 = clauses.filter((c) => !(c in (n.contract ?? {})));
  if (missing2.length) return yield* fail10(`unknown contract clauses: ${sorted(missing2).join(", ")}`);
  if (n.design !== "approved") return yield* fail10("approve the current design before recording scoped evidence");
  yield* refreshLedger(led);
  const resolves = commaValues(list(a, "resolves"));
  if (resolves.length && result4 !== "pass") return yield* fail10("only passing evidence can resolve failed evidence");
  const current = new Map(currentEvidence(n));
  for (const ref of resolves) {
    const ev = current.get(ref);
    if (!ev || ev.withdrawn || ev.result !== "fail") return yield* fail10(`${ref} is not current failed evidence on ${id}`);
    if (!(ev.clauses ?? []).every((c) => clauses.includes(c))) return yield* fail10(`resolving ${ref} must cover every failed obligation`);
  }
  ;
  (n.evidence ??= []).push({
    date: now(),
    kind,
    ref: s(a, "ref"),
    result: result4,
    clauses,
    resolves,
    revision: n.revision ?? 0,
    content_hash: fingerprint(n),
    dependency_hash: n.evidence_context,
    scope: scope3,
    scenario,
    assessment: assessment2,
    ...note ? { note } : {}
  });
  n.verification = coverage(n).status;
  yield* finish(led, `${id} evidence EV-${n.evidence.length}; verification ${n.verification}; missing clauses ${reprList(coverage(n).missing)}`);
});
var vWithdrawEvidence = (led, a) => Effect_exports.gen(function* () {
  const id = s(a, "id");
  const n = yield* need(led, id);
  const evidence = s(a, "evidence");
  const index = evidence.startsWith("EV-") && isDigit(evidence.slice(3)) ? parseInt(evidence.slice(3), 10) : NaN;
  if (Number.isNaN(index) || !(1 <= index && index <= (n.evidence ?? []).length)) return yield* fail10("expected an existing EV-N evidence identifier");
  const reason = s(a, "reason");
  if (!strip(reason)) return yield* fail10("withdrawal requires a reason");
  const ev = n.evidence[index - 1];
  if (ev.withdrawn) return yield* fail10("evidence is already withdrawn");
  ev.withdrawn = { date: now(), by: s(a, "by"), reason };
  hist(n, "evidence withdrawn", evidence + ": " + reason);
  yield* finish(led, id + " withdrew " + evidence);
});
var vObservation = (led, a) => Effect_exports.gen(function* () {
  const n = yield* need(led, s(a, "id"));
  const obs = n.observation;
  if (!obs) return yield* fail10("no observation recorded");
  const payload = {};
  for (const k of ["effect", "claims", "unknowns", "behavior", "comparisons"]) if (k in obs) payload[k] = deepCopy(obs[k]);
  payload.pseudocode = bodyText(obs.body ?? [], 0).join("\n");
  yield* out(pyJsonDumps(payload, { indent: 2, ensureAscii: false }) + "\n");
});
var vReady = (led, a) => Effect_exports.gen(function* () {
  const id = s(a, "id");
  const n = yield* need(led, id);
  const why = contentEditError(id, n);
  if (why) return yield* fail10(why);
  const approach = s(a, "approach");
  const validation = s(a, "validation");
  if (!strip(approach) || !strip(validation)) return yield* fail10("ready requires a bounded implementation approach and a validation plan");
  delete n.body;
  delete n.target;
  n.implementation_plan = { approach: strip(approach), validation: strip(validation) };
  yield* finish(led, `${id} implementation-ready; approve its contract and plan`);
});
var vEntry = (led, a) => Effect_exports.gen(function* () {
  const kind = s(a, "kind");
  const f = ENTRY_FILE[kind];
  const data = led.data;
  const store2 = data[f] ??= {};
  let heading = strip(s(a, "heading"));
  let key;
  let e;
  if (kind === "term") {
    if (led.entry(heading)) return yield* fail10(`${repr(heading)} already exists; \`change <dir> "${heading}" --definition ... --reason ...\``);
    key = heading;
    e = { definition: strip(s(a, "definition")), confirmed: today() };
    if (s(a, "avoid")) e.avoid = s(a, "avoid").split(",").map((x) => strip(x)).filter((x) => x);
    if (s(a, "not_")) e.not = s(a, "not_").split(",").map((x) => strip(x)).filter((x) => x);
    if (s(a, "example")) e.example = s(a, "example");
  } else {
    const prefix3 = kind === "fact" ? "CTX-F" : "CTX-S";
    const head3 = split2(heading, " ", 1)[0];
    if (isCtxIdLike(head3)) {
      key = head3;
      heading = heading.includes(" ") ? strip(split2(heading, " ", 1)[1]) : "";
      if (key in store2) return yield* fail10(`${key} already exists; \`change <dir> ${key} ...\``);
    } else {
      key = `${prefix3}${zfill(Math.max(0, ...Object.keys(store2).map((k) => parseInt(k.slice(5), 10))) + 1, 2)}`;
    }
    e = { name: heading, definition: strip(s(a, "definition")), confirmed: today() };
    if (kind === "fact") e.status = "confirmed";
    else for (const w of ["given", "when", "then", "excludes", "settles"]) if (s(a, w)) e[w] = strip(s(a, w));
  }
  if (s(a, "source")) e.source = s(a, "source");
  store2[key] = e;
  yield* finish(led, `entry ${f}/${key}` + (kind !== "term" ? ` ${heading}` : "") + `; refer to it as \`${key}\``);
});
var isCtxIdLike = (v) => (v.startsWith("CTX-F") || v.startsWith("CTX-S")) && isDigit(v.slice(5));
var vChange = (led, a) => Effect_exports.gen(function* () {
  const ref = s(a, "ref");
  const hit = led.entry(ref);
  if (!hit) return yield* fail10(`${repr(ref)}: no term / fact / scenario`);
  let [f, key] = hit;
  const e = hit[2];
  if (s(a, "definition")) e.definition = strip(s(a, "definition"));
  if (s(a, "status")) {
    if (f !== "facts") return yield* fail10("--status applies to facts only");
    e.status = s(a, "status");
  }
  if (s(a, "rename")) {
    const head3 = strip(s(a, "rename"));
    const store2 = led.data[f];
    if (f === "terms") {
      if (head3 in store2) return yield* fail10(`${repr(head3)} already exists`);
      const entry = store2[key];
      delete store2[key];
      store2[head3] = entry;
      for (const n of Object.values(led.nodes)) n.depends = (n.depends ?? []).map((x) => x === key ? head3 : x);
      for (const x of led.data.ambiguities ?? []) if (x.claim === key) x.claim = head3;
      key = head3;
    } else e.name = head3;
  }
  if (flagOf(a, "minor")) return yield* finish(led, `${f}/${key} reworded (minor, no invalidation)`);
  const reason = s(a, "reason");
  (e.changed ??= []).push({ at: now(), reason });
  const users = led.usedBy()[key] ?? [];
  for (const nid of users) {
    const n = led.nodes[nid];
    if (n && n.design === "approved") {
      n.design = "stale";
      n.stale_by = [key];
      hist(n, "stale", `${key} changed: ${reason}`);
      cascadeStale(led, nid, `${key} changed`);
    }
  }
  yield* finish(led, `${f}/${key} changed; dependents to re-check: ${users.join(", ") || "none"} (\`stale\` or \`reopen\`+\`approve\` each approved one)`);
});
var vMeta = (led, a) => Effect_exports.gen(function* () {
  const field = s(a, "field");
  const values = list(a, "value");
  if (field === "title" || field === "scope") led.data[field] = strip(values.join(" "));
  else if (field === "nongoals") led.data.nongoals = values.map((v) => strip(v)).filter((v) => v);
  else return yield* fail10("meta field must be title | scope | nongoals");
  yield* finish(led, `${field} set`);
});
var vAmbiguity = (led, a) => Effect_exports.gen(function* () {
  const claim = s(a, "claim");
  const data = led.data;
  data.ambiguities ??= [];
  data.ambiguities = data.ambiguities.filter((x) => x.claim.toLowerCase() !== strip(claim).toLowerCase());
  if (flagOf(a, "drop")) return yield* finish(led, `ambiguity ${repr(claim)} dropped`);
  const conflict = opt(a, "conflict");
  const at = opt(a, "resolves_at");
  if (!conflict || !at) return yield* fail10('ambiguity <dir> "claim" "conflict" D-NNN   (or --drop)');
  if (!isNodeId(at)) return yield* fail10(`${repr(at)} is not a D-NNN id`);
  data.ambiguities.push({ claim: strip(claim), conflict: strip(conflict), resolves_at: at });
  yield* finish(led, `ambiguity ${repr(claim)} -> resolves at ${at}`);
});
var ADR_STUB = (id, titleText, date, constrains) => `# ${id} \u2014 ${titleText}

Kind: adr \xB7 Status: proposed \xB7 Date: ${date}
Constrains: ${constrains}
Supersedes: \u2014 \xB7 Superseded by: \u2014

<1\u20133 sentences: what's the context, what did we decide, and why.>

## Invariants imposed

- <one line: property every constrained refinement must preserve>
`;
var vAdr = (led, a) => Effect_exports.gen(function* () {
  const action = s(a, "action");
  const titleArg = opt(a, "title");
  const constrainsArg = s(a, "constrains");
  const ids = constrainsArg.split(",").map((w) => strip(w)).filter((w) => isNodeId(w));
  if (action === "new") {
    if (!titleArg || !ids.length) return yield* fail10('adr <dir> new "Title" --constrains D-NNN[,D-MMM]');
    const parents = withParents(led.dir).slice(1);
    const adrDir = led.adrDir() ?? (parents.length > 1 ? nodePath8.join(parents[1], "adr") : nodePath8.join(led.dir, "adr"));
    const num = Math.max(0, ...led.adrs().filter((x) => isAdrId(x.id)).map((x) => parseInt(x.id.slice(4), 10))) + 1;
    const slug = splitWs(Array.from(titleArg).map((c) => /^[\p{L}\p{N}]$/u.test(c) ? c.toLowerCase() : " ").join("")).join("-").slice(0, 50);
    const path = nodePath8.join(adrDir, `${zfill(num, 4)}-${slug}.md`);
    const aid = `ADR-${zfill(num, 4)}`;
    led.files.set(path, ADR_STUB(aid, strip(titleArg), today(), ids.join(", ")));
    for (const nid of ids) {
      if (nid in led.nodes) {
        led.nodes[nid].adr_pending = aid;
        if (led.nodes[nid].design === "approved") {
          led.nodes[nid].design = "draft";
          hist(led.nodes[nid], "reopened", `${aid} proposed`);
        }
      }
    }
    return yield* finish(led, `created ${relpath(path, process.cwd())} (${aid}, proposed). Write the paragraph + invariants by hand, then \`sync\`; after the user accepts: \`adr accept ${aid}\``);
  }
  if (action === "accept") {
    const adr = led.adrs().find((x) => x.id === titleArg);
    if (!adr) return yield* fail10(`${pyRepr(titleArg)}: no such ADR`);
    const lines = adr.lines;
    setHeader(lines, "Status", "accepted");
    led.files.set(adr.path, lines.join("\n") + "\n");
    const freed = Object.entries(led.nodes).filter(([, n]) => n.adr_pending === adr.id).map(([nid]) => nid);
    for (const nid of freed) delete led.nodes[nid].adr_pending;
    return yield* finish(led, `${adr.id} accepted; unblocked ${freed.join(", ") || "nothing"}`);
  }
  if (action === "constrains") {
    const adr = led.adrs().find((x) => x.id === titleArg);
    if (!adr) return yield* fail10(`${pyRepr(titleArg)}: no such ADR`);
    if (!ids.length) return yield* fail10("adr <dir> constrains ADR-NNNN --constrains D-NNN[,D-MMM]");
    const missing2 = ids.filter((x) => !led.resolves(x));
    if (missing2.length) return yield* fail10(`${missing2.join(", ")}: not a node or frontier id`);
    setHeader(adr.lines, "Constrains", ids.join(", "));
    led.files.set(adr.path, adr.lines.join("\n") + "\n");
    return yield* finish(led, `${adr.id} constrains ${ids.join(", ")}`);
  }
  if (action === "supersede") {
    const byId = new Map(led.adrs().map((x) => [x.id, x]));
    const old = byId.get(titleArg ?? "");
    const fresh2 = byId.get(opt(a, "new_adr") ?? "");
    if (!old || !fresh2) return yield* fail10("adr <dir> supersede ADR-OLD ADR-NEW (both must exist)");
    setHeader(old.lines, "Status", "superseded");
    setHeader(old.lines, "Superseded by", fresh2.id);
    setHeader(fresh2.lines, "Supersedes", old.id);
    led.files.set(old.path, old.lines.join("\n") + "\n");
    led.files.set(fresh2.path, fresh2.lines.join("\n") + "\n");
    return yield* finish(led, `${old.id} superseded by ${fresh2.id}`);
  }
  return yield* fail10("adr <dir> new ... | accept ADR-NNNN | supersede ADR-OLD ADR-NEW | constrains ADR-NNNN --constrains D-NNN");
});
var pyRepr = (v) => v === null ? "None" : repr(v);
var vAdopt = (led, a) => Effect_exports.gen(function* () {
  const statement = opt(a, "statement");
  if (statement && !fnOf(statement)) return yield* fail10("an adopted statement needs an abstract call such as result <- process(input)");
  const message = yield* attempt(() => adopt(led, s(a, "id"), statement, opt(a, "parent")));
  yield* finish(led, message);
});
var vBind = (led, a) => Effect_exports.gen(function* () {
  yield* need(led, s(a, "id"));
  const message = yield* bind5(led, s(a, "id"), s(a, "path"), { root: opt(a, "repo"), bindingId: opt(a, "binding"), symbol: s(a, "symbol"), lines: opt(a, "lines") });
  yield* finish(led, message);
});
var vUnbind = (led, a) => Effect_exports.gen(function* () {
  yield* need(led, s(a, "id"));
  const message = yield* attempt(() => unbind(led, s(a, "id"), s(a, "binding"), s(a, "reason")));
  yield* finish(led, message);
});
var vObserve = (led, a) => Effect_exports.gen(function* () {
  yield* need(led, s(a, "id"));
  const file = s(a, "file");
  const payloadArg = opt(a, "payload");
  if (Boolean(file) === Boolean(payloadArg)) return yield* fail10("observe needs either a JSON payload argument or --file");
  const fs = yield* FileSystem_exports.FileSystem;
  const raw = file ? yield* fs.readFileString(file).pipe(Effect_exports.mapError((e) => fail10(e.message))) : payloadArg;
  const payload = yield* attempt(() => JSON.parse(raw));
  yield* refreshLedger(led);
  const message = yield* observe(led, s(a, "id"), payload, s(a, "at"), s(a, "by"));
  yield* finish(led, message);
});
var scanText = (rep) => {
  const lines = [];
  for (const [nid, row] of Object.entries(rep.nodes)) {
    lines.push(`${nid} ${row.state} \xB7 conformance ${row.conformance.status} \xB7 implementation ${(row.implementation_version || "unbound").slice(0, 12)} \u2014 ${row.reason}`);
  }
  const c = rep.coverage;
  lines.push(`Source coverage: ${pyStr(c.current ?? 0)}/${pyStr(c.active ?? 0)} active current; bound ${pyStr(c.bound ?? 0)}; observed ${pyStr(c.observed ?? 0)}; unbound ${(c.unbound ?? []).join(", ") || "none"}`);
  lines.push(`Inspection pending: ${rep.pending.join(", ") || "none"}; assessment pending: ${rep.assessment_pending.join(", ") || "none"}; recorded differences: ${rep.differences.join(", ") || "none"}`);
  return lines.join("\n");
};
var vScan = (led, a) => Effect_exports.gen(function* () {
  const rep = yield* scan2(led, opt(a, "repo"));
  yield* out((flagOf(a, "json") ? pyJsonDumps(rep, { indent: 2 }) : scanText(rep)) + "\n");
});
var vReconcile = (led, a) => Effect_exports.gen(function* () {
  const fs = yield* FileSystem_exports.FileSystem;
  const outputArg = s(a, "output");
  const destination = outputArg ? yield* resolvePath(expandUser(outputArg)) : nodePath8.join(nodePath8.dirname(led.dir), nodePath8.basename(led.dir) + "-rebuild-" + now().replaceAll(":", "-"));
  const parentsOfLed = withParents(led.dir).slice(1);
  const parentsOfDest = withParents(destination).slice(1);
  if (destination === led.dir || parentsOfLed.includes(destination) || parentsOfDest.includes(led.dir)) return yield* fail10("reconcile needs a separate output directory, outside the previous ledger");
  yield* locked(destination, Effect_exports.gen(function* () {
    const entries = yield* asFail(fs.readDirectory(destination));
    if (entries.some((name) => name !== ".stepwise.lock")) return yield* fail10("reconcile output must be empty; resume an existing rebuild with adopt/observe and sync");
    const fresh2 = yield* Ledger.create(destination, led.title);
    fresh2.data.scope = led.data.scope ?? "";
    fresh2.data.nongoals = deepCopy(led.data.nongoals ?? []);
    const previousBytes = yield* asFail(fs.readFile(led.path));
    fresh2.data.reconstruction = { previous_ledger: relpath(led.path, destination), previous_sha256: sha256Hex(previousBytes), started_at: now() };
    const repo = opt(a, "repo") ?? (led.data.source_root ? yield* resolvePath(nodePath8.join(led.dir, led.data.source_root)) : null);
    if (repo) yield* setRepository(fresh2, repo);
    fresh2.operations.push("reconcile: initialize independent reconstruction");
    yield* finish(fresh2, `Fresh reconstruction: ${destination}. No nodes or approvals copied. Inspect source, then adopt/bind/observe the new hierarchy; initialization is not completion.`);
    const rc = yield* finalize2(fresh2, "reconcile");
    if (rc) return yield* new Fail2({ message: "" });
  }));
});
var vSync = (led, a) => Effect_exports.gen(function* () {
  const repo = opt(a, "repo");
  if (repo) yield* setRepository(led, repo);
  const rep = yield* refreshSources(led);
  for (const [nid, row] of Object.entries(rep.nodes)) recordVersion(led.nodes[nid], row, rep.commit);
  yield* finish(led, scanText(rep));
});
var vRepair = (led) => Effect_exports.gen(function* () {
  const io = yield* Io;
  const invalidApproved = new Set(Object.entries(led.nodes).filter(([, n]) => n.design === "approved" && (changedDeps(led, n).length || (n.body ?? []).some((it) => ["stale", "superseded", "retired"].includes(led.nodes[it.child || it.reuse || ""]?.design ?? "")))).map(([nid]) => nid));
  let pending = /* @__PURE__ */ new Set([...Object.entries(led.nodes).filter(([, n]) => n.design === "draft" || n.design === "stale").map(([nid]) => nid), ...invalidApproved]);
  pending = new Set([...pending].filter((nid) => !(led.nodes[nid].origin === "existing-code" && !Object.keys(led.nodes[nid].contract ?? {}).length && !led.dependents(nid).length)));
  if (!pending.size) {
    io.out("repair empty \u2014 no draft or stale nodes\n");
    return;
  }
  const deps = /* @__PURE__ */ new Map();
  for (const nid of pending) {
    const n = led.nodes[nid];
    const called = new Set((n.body ?? []).map((it) => it.child || it.reuse));
    deps.set(nid, new Set([...(n.depends ?? []).filter((x) => isNodeId(x)), ...called].filter((x) => Boolean(x) && pending.has(x))));
  }
  const order = [];
  const left = new Set(pending);
  while (left.size) {
    let ready = sorted([...left].filter((nid) => ![...deps.get(nid)].some((d) => left.has(d))));
    if (!ready.length) ready = [minStr(left, "")];
    order.push(...ready);
    for (const r of ready) left.delete(r);
  }
  io.out("repair plan (group related changes in one batch):\n");
  order.forEach((nid, i) => {
    const n = led.nodes[nid];
    const action = invalidApproved.has(nid) ? "`stale` for later, or `reopen` and re-approve against changed dependencies" : NEXT_STEP[n.design === "stale" && intact(n) ? "stale-intact" : n.design];
    io.out(`${i + 1}. ${nid} (${led.status(nid)}) \u2014 ${action}
`);
  });
  const constrained = /* @__PURE__ */ new Map();
  for (const adr of led.adrs()) for (const nid of adr.constrains) if (pending.has(nid)) constrained.set(nid, [...constrained.get(nid) ?? [], adr.id]);
  for (const nid of sorted(constrained.keys())) io.out(`ADRs blocked by ${nid}: ${constrained.get(nid).length} (${constrained.get(nid).join(", ")})
`);
});
var vStatus = (led, a) => Effect_exports.gen(function* () {
  const io = yield* Io;
  for (const [nid, n] of Object.entries(led.nodes)) {
    const state = n.design;
    if ((state === "superseded" || state === "retired") && !flagOf(a, "all")) continue;
    if (n.origin === "existing-code" && !Object.keys(n.contract ?? {}).length && !led.dependents(nid).length) {
      io.out(`${nid}  observed-only (${pyStr(n.source_state ?? "unbound")})  inspect sources and record observations; no intended contract required
`);
    } else io.out(`${nid}  ${ljust(led.status(nid), 28)}  ${NEXT_STEP[state === "stale" && intact(n) ? "stale-intact" : state]}
`);
    if (n.bindings && Object.keys(n.bindings).length && n.source_state !== "current") io.out(`  implementation notification: ${pyStr(n.source_state)} \u2014 \`scan <dir> --json\` for current versions and inspection tokens
`);
  }
  const fr = led.frontier();
  for (const fid of sorted(fr.keys())) {
    const [stmt, parent] = fr.get(fid);
    io.out(`${fid}  ${ljust("frontier", 28)}  \`new <dir> ${fid}\` \u2014 ${stmt} (child of ${parent})
`);
  }
});
var vHtml = (led, a) => Effect_exports.gen(function* () {
  const fs = yield* FileSystem_exports.FileSystem;
  const outputArg = s(a, "output");
  const output = yield* resolvePath(outputArg ? expandUser(outputArg) : nodePath8.join(led.dir, "DESIGN.html"));
  if (nodePath8.extname(output).toLowerCase() !== ".html") return yield* fail10("HTML output must have a .html extension; ledger files and Markdown views are not export targets");
  const adrs = led.adrs().map((adr) => ({ id: adr.id, text: adr.lines.join("\n") }));
  const snapshot = deepCopy(led.data);
  snapshot.source_coverage = deepCopy(led.sourceScan.coverage ?? {});
  for (const [nid, row] of Object.entries(led.sourceScan.nodes)) snapshot.nodes[nid].source_report = { ...row, commit: led.sourceScan.commit ?? null };
  for (const n of Object.values(snapshot.nodes)) n.coverage = coverage(n);
  const document = yield* asFail(renderHtml(snapshot, { title: led.title, exportedAt: now(), adrs, reviewKey: sha256Hex(led.path) }));
  const written = yield* Effect_exports.gen(function* () {
    yield* fs.makeDirectory(nodePath8.dirname(output), { recursive: true });
    yield* fs.writeFileString(output, document);
  }).pipe(Effect_exports.result);
  if (written._tag === "Failure") return yield* fail10(`could not export HTML: ${written.failure.message}`);
  yield* out(`HTML snapshot: ${output}
`);
});
var vCheck = (led) => Effect_exports.gen(function* () {
  yield* check(led);
  const rc = yield* report(led);
  if (rc) return yield* new Fail2({ message: "" });
});
var finalize2 = Effect_exports.fn("finalize")(function* (led, command) {
  const fs = yield* FileSystem_exports.FileSystem;
  const io = yield* Io;
  deriveDepends(led);
  for (const [nid, n] of Object.entries(led.nodes)) {
    if (n.design === "approved" && n.approved_content_hash !== fingerprint(n)) {
      n.design = "stale";
      hist(n, "stale", "derived dependencies changed");
      cascadeStale(led, nid, "derived dependencies changed");
    }
  }
  yield* refreshLedger(led);
  for (const [nid, row] of Object.entries(led.sourceScan.nodes)) if (!led.nodes[nid].implementation_version) recordVersion(led.nodes[nid], row, led.sourceScan.commit);
  yield* check(led, { views: false });
  if (led.errors.length) return yield* report(led, "No changes committed. Resolve related changes together with `batch`.");
  const files = new Map([...led.files, ...renderAll(led)]);
  const audit = nodePath8.join(led.dir, LOG);
  const data = led.data;
  data.nodes = Object.fromEntries(sorted(Object.keys(led.nodes)).map((k) => [k, led.nodes[k]]));
  const ledgerText = pyJsonDumps(data, { indent: 1, ensureAscii: false }) + "\n";
  files.set(led.path, ledgerText);
  const before = (yield* asFail(fs.exists(led.path))) ? sha256Hex(yield* asFail(fs.readFile(led.path))) : "-";
  const after = sha256Hex(Buffer.from(ledgerText, "utf8"));
  const previousAudit = (yield* asFail(fs.exists(audit))) ? yield* asFail(fs.readFileString(audit)) : "";
  files.set(audit, previousAudit + `${now()} exit=0 ${command} operations=${led.operations.join("; ")} | result=applied applied=true before=${before} after=${after}
`);
  yield* commit(led.dir, files);
  if (led.sourceScan.pending.length && command !== "reconcile") io.out("Implementation inspection pending: " + led.sourceScan.pending.join(", ") + "; run scan --json\n");
  return yield* report(led, led.messages.length ? led.messages[led.messages.length - 1] : command);
});

// src/main.ts
var READ_ONLY = /* @__PURE__ */ new Set(["check", "show", "frontier", "status", "html", "scan", "proposal", "repair", "reconcile", "observation"]);
var CREATES = /* @__PURE__ */ new Set(["new", "entry", "meta", "batch", "adopt"]);
var VERB_TABLE = {
  frontier: vFrontier,
  show: vShow,
  new: vNew,
  set: vSet,
  body: vBody,
  answer: vAnswer,
  terminal: vTerminal,
  proposal: vProposal,
  approve: vApprove,
  reopen: vReopen,
  retire: vRetire,
  stale: vStale,
  reaffirm: vReaffirm,
  supersede: vSupersede,
  evidence: vEvidence,
  "withdraw-evidence": vWithdrawEvidence,
  observation: vObservation,
  ready: vReady,
  entry: vEntry,
  change: vChange,
  meta: vMeta,
  ambiguity: vAmbiguity,
  adr: vAdr,
  adopt: vAdopt,
  bind: vBind,
  unbind: vUnbind,
  observe: vObserve,
  scan: vScan,
  reconcile: vReconcile,
  sync: vSync,
  repair: vRepair,
  status: vStatus,
  html: vHtml,
  check: vCheck
};
var dispatch = (led, a) => Effect_exports.gen(function* () {
  for (const key of ["id", "new_id", "parent"]) {
    const value = a.args[key];
    if (typeof value === "string" && !isNodeId(value)) return yield* fail10(`${repr(value)}: expected a D-NNN node ID`);
  }
  if (!READ_ONLY.has(a.cmd) && a.cmd !== "batch") {
    let label = a.cmd + ("id" in a.args ? " " + String(a.args.id) : "");
    if (a.cmd === "set") {
      const field = String(a.args.field);
      let payload;
      try {
        payload = JSON.parse(field);
      } catch {
        payload = void 0;
      }
      if (payload !== void 0 && payload !== null && typeof payload === "object" && !Array.isArray(payload)) label += " <json:" + Object.keys(payload).join(",") + ">";
      else if (payload !== void 0 && payload !== null && typeof payload === "object") label += " <json:" + payload.map(String).join(",") + ">";
      else label += field.trimStart().startsWith("{") || field.trimStart().startsWith("[") ? " <invalid-json>" : " " + field;
    }
    led.operations.push(label);
  }
  if (a.cmd === "batch") return yield* vBatch(led, a);
  yield* VERB_TABLE[a.cmd](led, a.args);
});
var renderFailure = (error) => error._tag === "Refused" ? error.lines.join("\n") + "\n" : error.message ? `error ${error.message}
` : "";
var vBatch = (led, a) => Effect_exports.gen(function* () {
  const fs = yield* FileSystem_exports.FileSystem;
  const io = yield* Io;
  const file = String(a.args.file ?? "");
  const raw = file ? yield* fs.readFileString(file).pipe(Effect_exports.mapError((e) => fail10(e.message))) : yield* io.stdin;
  const commands = yield* Effect_exports.try({
    try: () => operations(JSON.parse(raw)),
    catch: (e) => fail10(`invalid batch: ${e instanceof Error ? e.message : String(e)}`)
  });
  let index = 0;
  for (const args2 of commands) {
    index += 1;
    if (!args2.length || READ_ONLY.has(args2[0]) || args2[0] === "batch") return yield* fail10(`batch operation ${index}: only ledger mutation commands are allowed`);
    const captured = captureIo("");
    const result4 = yield* Effect_exports.gen(function* () {
      const op = yield* Effect_exports.try({ try: () => parseArgs([args2[0], led.dir, ...args2.slice(1)]), catch: (e) => e });
      yield* dispatch(led, op);
    }).pipe(Effect_exports.provide(captured.layer), Effect_exports.result);
    if (result4._tag === "Failure") {
      const failure = result4.failure;
      const text = failure instanceof ParseError ? `${usageLine(failure.verb)}
stepwise ${failure.verb ?? ""}: error: ${failure.message}
` : renderFailure(failure);
      return yield* fail10(`batch operation ${index} failed; no changes committed: ${(captured.output() + text).trim()}`);
    }
  }
  led.messages.push(`batch: ${commands.length} operations`);
});
var printUsageError = (io, error) => {
  io.err(`${usageLine(error.verb)}
stepwise${error.verb ? " " + error.verb : ""}: error: ${error.message}
`);
  return 2;
};
var run2 = (argv) => Effect_exports.gen(function* () {
  const io = yield* Io;
  const fs = yield* FileSystem_exports.FileSystem;
  let a;
  try {
    a = parseArgs(argv);
  } catch (error2) {
    return printUsageError(io, error2);
  }
  const d = yield* resolvePath(a.dir);
  const ledgerPath = nodePath9.join(d, LEDGER);
  const journal = nodePath9.join(d, JOURNAL);
  if (READ_ONLY.has(a.cmd) && !(yield* fs.exists(ledgerPath)) && !(yield* fs.exists(journal))) {
    io.err(`error ${ledgerPath} missing
`);
    return 1;
  }
  const body = Effect_exports.gen(function* () {
    let led = yield* Ledger.load(d);
    if (!led.data) {
      if (CREATES.has(a.cmd)) led = yield* Ledger.create(d, defaultTitle(d));
      else return yield* fail10(`${ledgerPath} missing; start with \`new\` or \`batch\``);
    }
    if (READ_ONLY.has(a.cmd)) {
      yield* dispatch(led, a);
      return 0;
    }
    const captured = captureIo(io.stdin);
    const outcome = yield* dispatch(led, a).pipe(Effect_exports.provide(captured.layer), Effect_exports.result);
    if (outcome._tag === "Failure") {
      io.out(captured.stdout());
      return yield* Effect_exports.fail(outcome.failure);
    }
    return yield* finalize2(led, a.cmd);
  });
  const exit3 = yield* locked(d, body).pipe(Effect_exports.result);
  if (exit3._tag === "Success") return exit3.success;
  const error = exit3.failure;
  const recovery = (yield* fs.exists(journal)) ? " A prepared transaction remains; run sync to recover it before resubmitting changes." : "";
  if (error instanceof Refused) io.err(error.lines.join("\n") + "\n");
  else if (error instanceof Fail2) {
    if (error.message) io.err(`error ${error.message}${recovery}
`);
  } else io.err(`error ${error.message ?? String(error)}${recovery}
`);
  return 1;
}).pipe(Effect_exports.catchCause((cause) => Effect_exports.gen(function* () {
  const io = yield* Io;
  io.err(`error ${String(cause)}
`);
  return 1;
})));

// src/cli.ts
var layer13 = Layer_exports.mergeAll(layer12, processIo, gitLive.pipe(Layer_exports.provide(layer12)));
Effect_exports.runPromise(run2(process.argv.slice(2)).pipe(Effect_exports.provide(layer13))).then((code) => {
  process.exitCode = code;
}).catch((error) => {
  process.stderr.write(`error ${error instanceof Error ? error.message : String(error)}
`);
  process.exitCode = 1;
});
