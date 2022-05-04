var app = (function () {
  'use strict';

  var CLASS_PATTERN = /^class /;


  /**
   * @param {function} fn
   *
   * @return {boolean}
   */
  function isClass(fn) {
    return CLASS_PATTERN.test(fn.toString());
  }

  /**
   * @param {any} obj
   *
   * @return {boolean}
   */
  function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
  }

  /**
   * @param {any} obj
   * @param {string} prop
   *
   * @return {boolean}
   */
  function hasOwnProp(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  }

  /**
   * @typedef {import('./index').InjectAnnotated } InjectAnnotated
   */

  /**
   * @template T
   *
   * @params {[...string[], T] | ...string[], T} args
   *
   * @return {T & InjectAnnotated}
   */
  function annotate() {
    var args = Array.prototype.slice.call(arguments);

    if (args.length === 1 && isArray(args[0])) {
      args = args[0];
    }

    var fn = args.pop();

    fn.$inject = args;

    return fn;
  }


  // Current limitations:
  // - can't put into "function arg" comments
  // function /* (no parenthesis like this) */ (){}
  // function abc( /* xx (no parenthesis like this) */ a, b) {}
  //
  // Just put the comment before function or inside:
  // /* (((this is fine))) */ function(a, b) {}
  // function abc(a) { /* (((this is fine))) */}
  //
  // - can't reliably auto-annotate constructor; we'll match the
  // first constructor(...) pattern found which may be the one
  // of a nested class, too.

  var CONSTRUCTOR_ARGS = /constructor\s*[^(]*\(\s*([^)]*)\)/m;
  var FN_ARGS = /^(?:async )?(?:function\s*)?[^(]*\(\s*([^)]*)\)/m;
  var FN_ARG = /\/\*([^*]*)\*\//m;

  /**
   * @param {unknown} fn
   *
   * @return {string[]}
   */
  function parseAnnotations(fn) {

    if (typeof fn !== 'function') {
      throw new Error('Cannot annotate "' + fn + '". Expected a function!');
    }

    var match = fn.toString().match(isClass(fn) ? CONSTRUCTOR_ARGS : FN_ARGS);

    // may parse class without constructor
    if (!match) {
      return [];
    }

    return match[1] && match[1].split(',').map(function(arg) {
      match = arg.match(FN_ARG);
      return match ? match[1].trim() : arg.trim();
    }) || [];
  }

  /**
   * @typedef {import('./index').ModuleProvider} ModuleProvider
   * @typedef {import('./index').FactoryDefinition<unknown>} FactoryDefinition
   * @typedef {import('./index').ValueDefinition<unknown>} ValueDefinition
   * @typedef {import('./index').TypeDefinition<unknown>} TypeDefinition
   */

  function Module() {
    var providers = /** @type {ModuleProvider[]} */ ([]);

    /**
     * Create a named service via a factory function.
     *
     * @param {string} name
     * @param {FactoryDefinition} factory
     *
     * @return {Module}
     */
    this.factory = function(name, factory) {
      providers.push([name, 'factory', factory]);
      return this;
    };

    /**
     * Provide a named service by value.
     *
     * @param {string} name
     * @param {ValueDefinition} value
     *
     * @return {Module}
     */
    this.value = function(name, value) {
      providers.push([name, 'value', value]);
      return this;
    };

    /**
     * Provide a named service via a constructor.
     *
     * @param {string} name
     * @param {TypeDefinition} type
     *
     * @return {Module}
     */
    this.type = function(name, type) {
      providers.push([name, 'type', type]);
      return this;
    };

    /**
     * Iterate over all providers.
     *
     * @param { (provider: ModuleProvider) => void } iterator
     */
    this.forEach = function(iterator) {
      providers.forEach(iterator);
    };

  }

  /**
   * @typedef { import('./index').ModuleDeclaration } ModuleDeclaration
   * @typedef { import('./index').ModuleDefinition } ModuleDefinition
   * @typedef { import('./index').InjectorContext } InjectorContext
   */

  /**
   * Create a new injector with the given modules.
   *
   * @param {ModuleDefinition[]} modules
   * @param {InjectorContext} [parent]
   */
  function Injector(modules, parent) {
    parent = parent || {
      get: function(name, strict) {
        currentlyResolving.push(name);

        if (strict === false) {
          return null;
        } else {
          throw error('No provider for "' + name + '"!');
        }
      }
    };

    var currentlyResolving = [];
    var providers = this._providers = Object.create(parent._providers || null);
    var instances = this._instances = Object.create(null);

    var self = instances.injector = this;

    var error = function(msg) {
      var stack = currentlyResolving.join(' -> ');
      currentlyResolving.length = 0;
      return new Error(stack ? msg + ' (Resolving: ' + stack + ')' : msg);
    };

    /**
     * Return a named service.
     *
     * @param {string} name
     * @param {boolean} [strict=true] if false, resolve missing services to null
     *
     * @return {any}
     */
    function get(name, strict) {
      if (!providers[name] && name.indexOf('.') !== -1) {
        var parts = name.split('.');
        var pivot = get(parts.shift());

        while (parts.length) {
          pivot = pivot[parts.shift()];
        }

        return pivot;
      }

      if (hasOwnProp(instances, name)) {
        return instances[name];
      }

      if (hasOwnProp(providers, name)) {
        if (currentlyResolving.indexOf(name) !== -1) {
          currentlyResolving.push(name);
          throw error('Cannot resolve circular dependency!');
        }

        currentlyResolving.push(name);
        instances[name] = providers[name][0](providers[name][1]);
        currentlyResolving.pop();

        return instances[name];
      }

      return parent.get(name, strict);
    }

    var fnDef = function(fn, locals) {

      if (typeof locals === 'undefined') {
        locals = {};
      }

      if (typeof fn !== 'function') {
        if (isArray(fn)) {
          fn = annotate(fn.slice());
        } else {
          throw new Error('Cannot invoke "' + fn + '". Expected a function!');
        }
      }

      var inject = fn.$inject || parseAnnotations(fn);
      var dependencies = inject.map(function(dep) {
        if (hasOwnProp(locals, dep)) {
          return locals[dep];
        } else {
          return get(dep);
        }
      });

      return {
        fn: fn,
        dependencies: dependencies
      };
    };

    function instantiate(Type) {
      var def = fnDef(Type);

      var fn = def.fn,
          dependencies = def.dependencies;

      // instantiate var args constructor
      var Constructor = Function.prototype.bind.apply(fn, [ null ].concat(dependencies));

      return new Constructor();
    }

    function invoke(func, context, locals) {
      var def = fnDef(func, locals);

      var fn = def.fn,
          dependencies = def.dependencies;

      return fn.apply(context, dependencies);
    }

    /**
     * @param {Injector} childInjector
     *
     * @return {Function}
     */
    function createPrivateInjectorFactory(childInjector) {
      return annotate(function(key) {
        return childInjector.get(key);
      });
    }

    /**
     * @param {ModuleDefinition[]} modules
     * @param {string[]} [forceNewInstances]
     *
     * @return {Injector}
     */
    function createChild(modules, forceNewInstances) {
      if (forceNewInstances && forceNewInstances.length) {
        var fromParentModule = Object.create(null);
        var matchedScopes = Object.create(null);

        var privateInjectorsCache = [];
        var privateChildInjectors = [];
        var privateChildFactories = [];

        var provider;
        var cacheIdx;
        var privateChildInjector;
        var privateChildInjectorFactory;
        for (var name in providers) {
          provider = providers[name];

          if (forceNewInstances.indexOf(name) !== -1) {
            if (provider[2] === 'private') {
              cacheIdx = privateInjectorsCache.indexOf(provider[3]);
              if (cacheIdx === -1) {
                privateChildInjector = provider[3].createChild([], forceNewInstances);
                privateChildInjectorFactory = createPrivateInjectorFactory(privateChildInjector);
                privateInjectorsCache.push(provider[3]);
                privateChildInjectors.push(privateChildInjector);
                privateChildFactories.push(privateChildInjectorFactory);
                fromParentModule[name] = [privateChildInjectorFactory, name, 'private', privateChildInjector];
              } else {
                fromParentModule[name] = [privateChildFactories[cacheIdx], name, 'private', privateChildInjectors[cacheIdx]];
              }
            } else {
              fromParentModule[name] = [provider[2], provider[1]];
            }
            matchedScopes[name] = true;
          }

          if ((provider[2] === 'factory' || provider[2] === 'type') && provider[1].$scope) {
            /* jshint -W083 */
            forceNewInstances.forEach(function(scope) {
              if (provider[1].$scope.indexOf(scope) !== -1) {
                fromParentModule[name] = [provider[2], provider[1]];
                matchedScopes[scope] = true;
              }
            });
          }
        }

        forceNewInstances.forEach(function(scope) {
          if (!matchedScopes[scope]) {
            throw new Error('No provider for "' + scope + '". Cannot use provider from the parent!');
          }
        });

        modules.unshift(fromParentModule);
      }

      return new Injector(modules, self);
    }

    var factoryMap = {
      factory: invoke,
      type: instantiate,
      value: function(value) {
        return value;
      }
    };

    modules.forEach(function(module) {

      function arrayUnwrap(type, value) {
        if (type !== 'value' && isArray(value)) {
          value = annotate(value.slice());
        }

        return value;
      }

      // TODO(vojta): handle wrong inputs (modules)
      if (module instanceof Module) {
        module.forEach(function(provider) {
          var name = provider[0];
          var type = provider[1];
          var value = provider[2];

          providers[name] = [factoryMap[type], arrayUnwrap(type, value), type];
        });
      } else if (typeof module === 'object') {

        var moduleDefinition = /** @type { ModuleDeclaration } */ (module);

        if (moduleDefinition.__exports__) {
          var clonedModule = /** @type { ModuleDeclaration } */ (Object.keys(moduleDefinition).reduce(function(m, key) {
            if (key.substring(0, 2) !== '__') {
              m[key] = moduleDefinition[key];
            }
            return m;
          }, Object.create(null)));

          var childModules = /** @type {ModuleDeclaration[]} */ (moduleDefinition.__modules__ || []).concat(clonedModule);

          var privateInjector = new Injector(childModules, self);
          var getFromPrivateInjector = annotate(function(key) {
            return privateInjector.get(key);
          });
          (/** @type string[] */ (moduleDefinition.__exports__)).forEach(function(key) {
            providers[key] = [getFromPrivateInjector, key, 'private', privateInjector];
          });
        } else {
          Object.keys(moduleDefinition).forEach(function(name) {
            if (moduleDefinition[name][2] === 'private') {
              providers[name] = moduleDefinition[name];
              return;
            }

            var type = moduleDefinition[name][0];
            var value = moduleDefinition[name][1];

            providers[name] = [factoryMap[type], arrayUnwrap(type, value), type];
          });
        }
      }
    });

    // public API
    this.get = get;
    this.invoke = invoke;
    this.instantiate = instantiate;
    this.createChild = createChild;
  }

  function noop() { }
  function assign(tar, src) {
      // @ts-ignore
      for (const k in src)
          tar[k] = src[k];
      return tar;
  }
  function is_promise(value) {
      return value && typeof value === 'object' && typeof value.then === 'function';
  }
  function run(fn) {
      return fn();
  }
  function blank_object() {
      return Object.create(null);
  }
  function run_all(fns) {
      fns.forEach(run);
  }
  function is_function(thing) {
      return typeof thing === 'function';
  }
  function safe_not_equal(a, b) {
      return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
  }
  function is_empty(obj) {
      return Object.keys(obj).length === 0;
  }
  function subscribe(store, ...callbacks) {
      if (store == null) {
          return noop;
      }
      const unsub = store.subscribe(...callbacks);
      return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
  }
  function component_subscribe(component, store, callback) {
      component.$$.on_destroy.push(subscribe(store, callback));
  }
  function create_slot(definition, ctx, $$scope, fn) {
      if (definition) {
          const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
          return definition[0](slot_ctx);
      }
  }
  function get_slot_context(definition, ctx, $$scope, fn) {
      return definition[1] && fn
          ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
          : $$scope.ctx;
  }
  function get_slot_changes(definition, $$scope, dirty, fn) {
      if (definition[2] && fn) {
          const lets = definition[2](fn(dirty));
          if ($$scope.dirty === undefined) {
              return lets;
          }
          if (typeof lets === 'object') {
              const merged = [];
              const len = Math.max($$scope.dirty.length, lets.length);
              for (let i = 0; i < len; i += 1) {
                  merged[i] = $$scope.dirty[i] | lets[i];
              }
              return merged;
          }
          return $$scope.dirty | lets;
      }
      return $$scope.dirty;
  }
  function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
      if (slot_changes) {
          const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
          slot.p(slot_context, slot_changes);
      }
  }
  function get_all_dirty_from_scope($$scope) {
      if ($$scope.ctx.length > 32) {
          const dirty = [];
          const length = $$scope.ctx.length / 32;
          for (let i = 0; i < length; i++) {
              dirty[i] = -1;
          }
          return dirty;
      }
      return -1;
  }
  function action_destroyer(action_result) {
      return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
  }
  function append(target, node) {
      target.appendChild(node);
  }
  function insert(target, node, anchor) {
      target.insertBefore(node, anchor || null);
  }
  function detach(node) {
      node.parentNode.removeChild(node);
  }
  function destroy_each(iterations, detaching) {
      for (let i = 0; i < iterations.length; i += 1) {
          if (iterations[i])
              iterations[i].d(detaching);
      }
  }
  function element(name) {
      return document.createElement(name);
  }
  function text(data) {
      return document.createTextNode(data);
  }
  function space() {
      return text(' ');
  }
  function empty() {
      return text('');
  }
  function listen(node, event, handler, options) {
      node.addEventListener(event, handler, options);
      return () => node.removeEventListener(event, handler, options);
  }
  function attr(node, attribute, value) {
      if (value == null)
          node.removeAttribute(attribute);
      else if (node.getAttribute(attribute) !== value)
          node.setAttribute(attribute, value);
  }
  function set_custom_element_data(node, prop, value) {
      if (prop in node) {
          node[prop] = typeof node[prop] === 'boolean' && value === '' ? true : value;
      }
      else {
          attr(node, prop, value);
      }
  }
  function children(element) {
      return Array.from(element.childNodes);
  }
  function set_data(text, data) {
      data = '' + data;
      if (text.wholeText !== data)
          text.data = data;
  }
  function toggle_class(element, name, toggle) {
      element.classList[toggle ? 'add' : 'remove'](name);
  }
  function custom_event(type, detail, bubbles = false) {
      const e = document.createEvent('CustomEvent');
      e.initCustomEvent(type, bubbles, false, detail);
      return e;
  }

  let current_component;
  function set_current_component(component) {
      current_component = component;
  }
  function get_current_component() {
      if (!current_component)
          throw new Error('Function called outside component initialization');
      return current_component;
  }
  function afterUpdate(fn) {
      get_current_component().$$.after_update.push(fn);
  }
  function onDestroy(fn) {
      get_current_component().$$.on_destroy.push(fn);
  }
  function createEventDispatcher() {
      const component = get_current_component();
      return (type, detail) => {
          const callbacks = component.$$.callbacks[type];
          if (callbacks) {
              // TODO are there situations where events could be dispatched
              // in a server (non-DOM) environment?
              const event = custom_event(type, detail);
              callbacks.slice().forEach(fn => {
                  fn.call(component, event);
              });
          }
      };
  }
  function getContext(key) {
      return get_current_component().$$.context.get(key);
  }
  // TODO figure out if we still want to support
  // shorthand events, or if we want to implement
  // a real bubbling mechanism
  function bubble(component, event) {
      const callbacks = component.$$.callbacks[event.type];
      if (callbacks) {
          // @ts-ignore
          callbacks.slice().forEach(fn => fn.call(this, event));
      }
  }

  const dirty_components = [];
  const binding_callbacks = [];
  const render_callbacks = [];
  const flush_callbacks = [];
  const resolved_promise = Promise.resolve();
  let update_scheduled = false;
  function schedule_update() {
      if (!update_scheduled) {
          update_scheduled = true;
          resolved_promise.then(flush);
      }
  }
  function tick() {
      schedule_update();
      return resolved_promise;
  }
  function add_render_callback(fn) {
      render_callbacks.push(fn);
  }
  // flush() calls callbacks in this order:
  // 1. All beforeUpdate callbacks, in order: parents before children
  // 2. All bind:this callbacks, in reverse order: children before parents.
  // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
  //    for afterUpdates called during the initial onMount, which are called in
  //    reverse order: children before parents.
  // Since callbacks might update component values, which could trigger another
  // call to flush(), the following steps guard against this:
  // 1. During beforeUpdate, any updated components will be added to the
  //    dirty_components array and will cause a reentrant call to flush(). Because
  //    the flush index is kept outside the function, the reentrant call will pick
  //    up where the earlier call left off and go through all dirty components. The
  //    current_component value is saved and restored so that the reentrant call will
  //    not interfere with the "parent" flush() call.
  // 2. bind:this callbacks cannot trigger new flush() calls.
  // 3. During afterUpdate, any updated components will NOT have their afterUpdate
  //    callback called a second time; the seen_callbacks set, outside the flush()
  //    function, guarantees this behavior.
  const seen_callbacks = new Set();
  let flushidx = 0; // Do *not* move this inside the flush() function
  function flush() {
      const saved_component = current_component;
      do {
          // first, call beforeUpdate functions
          // and update components
          while (flushidx < dirty_components.length) {
              const component = dirty_components[flushidx];
              flushidx++;
              set_current_component(component);
              update(component.$$);
          }
          set_current_component(null);
          dirty_components.length = 0;
          flushidx = 0;
          while (binding_callbacks.length)
              binding_callbacks.pop()();
          // then, once components are updated, call
          // afterUpdate functions. This may cause
          // subsequent updates...
          for (let i = 0; i < render_callbacks.length; i += 1) {
              const callback = render_callbacks[i];
              if (!seen_callbacks.has(callback)) {
                  // ...so guard against infinite loops
                  seen_callbacks.add(callback);
                  callback();
              }
          }
          render_callbacks.length = 0;
      } while (dirty_components.length);
      while (flush_callbacks.length) {
          flush_callbacks.pop()();
      }
      update_scheduled = false;
      seen_callbacks.clear();
      set_current_component(saved_component);
  }
  function update($$) {
      if ($$.fragment !== null) {
          $$.update();
          run_all($$.before_update);
          const dirty = $$.dirty;
          $$.dirty = [-1];
          $$.fragment && $$.fragment.p($$.ctx, dirty);
          $$.after_update.forEach(add_render_callback);
      }
  }
  const outroing = new Set();
  let outros;
  function group_outros() {
      outros = {
          r: 0,
          c: [],
          p: outros // parent group
      };
  }
  function check_outros() {
      if (!outros.r) {
          run_all(outros.c);
      }
      outros = outros.p;
  }
  function transition_in(block, local) {
      if (block && block.i) {
          outroing.delete(block);
          block.i(local);
      }
  }
  function transition_out(block, local, detach, callback) {
      if (block && block.o) {
          if (outroing.has(block))
              return;
          outroing.add(block);
          outros.c.push(() => {
              outroing.delete(block);
              if (callback) {
                  if (detach)
                      block.d(1);
                  callback();
              }
          });
          block.o(local);
      }
  }

  function handle_promise(promise, info) {
      const token = info.token = {};
      function update(type, index, key, value) {
          if (info.token !== token)
              return;
          info.resolved = value;
          let child_ctx = info.ctx;
          if (key !== undefined) {
              child_ctx = child_ctx.slice();
              child_ctx[key] = value;
          }
          const block = type && (info.current = type)(child_ctx);
          let needs_flush = false;
          if (info.block) {
              if (info.blocks) {
                  info.blocks.forEach((block, i) => {
                      if (i !== index && block) {
                          group_outros();
                          transition_out(block, 1, 1, () => {
                              if (info.blocks[i] === block) {
                                  info.blocks[i] = null;
                              }
                          });
                          check_outros();
                      }
                  });
              }
              else {
                  info.block.d(1);
              }
              block.c();
              transition_in(block, 1);
              block.m(info.mount(), info.anchor);
              needs_flush = true;
          }
          info.block = block;
          if (info.blocks)
              info.blocks[index] = block;
          if (needs_flush) {
              flush();
          }
      }
      if (is_promise(promise)) {
          const current_component = get_current_component();
          promise.then(value => {
              set_current_component(current_component);
              update(info.then, 1, info.value, value);
              set_current_component(null);
          }, error => {
              set_current_component(current_component);
              update(info.catch, 2, info.error, error);
              set_current_component(null);
              if (!info.hasCatch) {
                  throw error;
              }
          });
          // if we previously had a then/catch block, destroy it
          if (info.current !== info.pending) {
              update(info.pending, 0);
              return true;
          }
      }
      else {
          if (info.current !== info.then) {
              update(info.then, 1, info.value, promise);
              return true;
          }
          info.resolved = promise;
      }
  }
  function update_await_block_branch(info, ctx, dirty) {
      const child_ctx = ctx.slice();
      const { resolved } = info;
      if (info.current === info.then) {
          child_ctx[info.value] = resolved;
      }
      if (info.current === info.catch) {
          child_ctx[info.error] = resolved;
      }
      info.block.p(child_ctx, dirty);
  }
  function outro_and_destroy_block(block, lookup) {
      transition_out(block, 1, 1, () => {
          lookup.delete(block.key);
      });
  }
  function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
      let o = old_blocks.length;
      let n = list.length;
      let i = o;
      const old_indexes = {};
      while (i--)
          old_indexes[old_blocks[i].key] = i;
      const new_blocks = [];
      const new_lookup = new Map();
      const deltas = new Map();
      i = n;
      while (i--) {
          const child_ctx = get_context(ctx, list, i);
          const key = get_key(child_ctx);
          let block = lookup.get(key);
          if (!block) {
              block = create_each_block(key, child_ctx);
              block.c();
          }
          else if (dynamic) {
              block.p(child_ctx, dirty);
          }
          new_lookup.set(key, new_blocks[i] = block);
          if (key in old_indexes)
              deltas.set(key, Math.abs(i - old_indexes[key]));
      }
      const will_move = new Set();
      const did_move = new Set();
      function insert(block) {
          transition_in(block, 1);
          block.m(node, next);
          lookup.set(block.key, block);
          next = block.first;
          n--;
      }
      while (o && n) {
          const new_block = new_blocks[n - 1];
          const old_block = old_blocks[o - 1];
          const new_key = new_block.key;
          const old_key = old_block.key;
          if (new_block === old_block) {
              // do nothing
              next = new_block.first;
              o--;
              n--;
          }
          else if (!new_lookup.has(old_key)) {
              // remove old block
              destroy(old_block, lookup);
              o--;
          }
          else if (!lookup.has(new_key) || will_move.has(new_key)) {
              insert(new_block);
          }
          else if (did_move.has(old_key)) {
              o--;
          }
          else if (deltas.get(new_key) > deltas.get(old_key)) {
              did_move.add(new_key);
              insert(new_block);
          }
          else {
              will_move.add(old_key);
              o--;
          }
      }
      while (o--) {
          const old_block = old_blocks[o];
          if (!new_lookup.has(old_block.key))
              destroy(old_block, lookup);
      }
      while (n)
          insert(new_blocks[n - 1]);
      return new_blocks;
  }

  function get_spread_update(levels, updates) {
      const update = {};
      const to_null_out = {};
      const accounted_for = { $$scope: 1 };
      let i = levels.length;
      while (i--) {
          const o = levels[i];
          const n = updates[i];
          if (n) {
              for (const key in o) {
                  if (!(key in n))
                      to_null_out[key] = 1;
              }
              for (const key in n) {
                  if (!accounted_for[key]) {
                      update[key] = n[key];
                      accounted_for[key] = 1;
                  }
              }
              levels[i] = n;
          }
          else {
              for (const key in o) {
                  accounted_for[key] = 1;
              }
          }
      }
      for (const key in to_null_out) {
          if (!(key in update))
              update[key] = undefined;
      }
      return update;
  }
  function get_spread_object(spread_props) {
      return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
  }
  function create_component(block) {
      block && block.c();
  }
  function mount_component(component, target, anchor, customElement) {
      const { fragment, on_mount, on_destroy, after_update } = component.$$;
      fragment && fragment.m(target, anchor);
      if (!customElement) {
          // onMount happens before the initial afterUpdate
          add_render_callback(() => {
              const new_on_destroy = on_mount.map(run).filter(is_function);
              if (on_destroy) {
                  on_destroy.push(...new_on_destroy);
              }
              else {
                  // Edge case - component was destroyed immediately,
                  // most likely as a result of a binding initialising
                  run_all(new_on_destroy);
              }
              component.$$.on_mount = [];
          });
      }
      after_update.forEach(add_render_callback);
  }
  function destroy_component(component, detaching) {
      const $$ = component.$$;
      if ($$.fragment !== null) {
          run_all($$.on_destroy);
          $$.fragment && $$.fragment.d(detaching);
          // TODO null out other refs, including component.$$ (but need to
          // preserve final state?)
          $$.on_destroy = $$.fragment = null;
          $$.ctx = [];
      }
  }
  function make_dirty(component, i) {
      if (component.$$.dirty[0] === -1) {
          dirty_components.push(component);
          schedule_update();
          component.$$.dirty.fill(0);
      }
      component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
  }
  function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
      const parent_component = current_component;
      set_current_component(component);
      const $$ = component.$$ = {
          fragment: null,
          ctx: null,
          // state
          props,
          update: noop,
          not_equal,
          bound: blank_object(),
          // lifecycle
          on_mount: [],
          on_destroy: [],
          on_disconnect: [],
          before_update: [],
          after_update: [],
          context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
          // everything else
          callbacks: blank_object(),
          dirty,
          skip_bound: false,
          root: options.target || parent_component.$$.root
      };
      append_styles && append_styles($$.root);
      let ready = false;
      $$.ctx = instance
          ? instance(component, options.props || {}, (i, ret, ...rest) => {
              const value = rest.length ? rest[0] : ret;
              if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                  if (!$$.skip_bound && $$.bound[i])
                      $$.bound[i](value);
                  if (ready)
                      make_dirty(component, i);
              }
              return ret;
          })
          : [];
      $$.update();
      ready = true;
      run_all($$.before_update);
      // `false` as a special case of no DOM component
      $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
      if (options.target) {
          if (options.hydrate) {
              const nodes = children(options.target);
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              $$.fragment && $$.fragment.l(nodes);
              nodes.forEach(detach);
          }
          else {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              $$.fragment && $$.fragment.c();
          }
          if (options.intro)
              transition_in(component.$$.fragment);
          mount_component(component, options.target, options.anchor, options.customElement);
          flush();
      }
      set_current_component(parent_component);
  }
  /**
   * Base class for Svelte components. Used when dev=false.
   */
  class SvelteComponent {
      $destroy() {
          destroy_component(this, 1);
          this.$destroy = noop;
      }
      $on(type, callback) {
          const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
          callbacks.push(callback);
          return () => {
              const index = callbacks.indexOf(callback);
              if (index !== -1)
                  callbacks.splice(index, 1);
          };
      }
      $set($$props) {
          if (this.$$set && !is_empty($$props)) {
              this.$$.skip_bound = true;
              this.$$set($$props);
              this.$$.skip_bound = false;
          }
      }
  }

  /* src/infrastructure/view/templates/table/Tooltip.svelte generated by Svelte v3.44.3 */

  function get_each_context$4(ctx, list, i) {
  	const child_ctx = ctx.slice();
  	child_ctx[1] = list[i];
  	return child_ctx;
  }

  // (4:0) {#if tooltip.length !== 0}
  function create_if_block$5(ctx) {
  	let span;
  	let each_value = /*tooltip*/ ctx[0].split('\n');
  	let each_blocks = [];

  	for (let i = 0; i < each_value.length; i += 1) {
  		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
  	}

  	return {
  		c() {
  			span = element("span");

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].c();
  			}

  			attr(span, "class", "tooltip-text svelte-rzzl1m");
  		},
  		m(target, anchor) {
  			insert(target, span, anchor);

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].m(span, null);
  			}
  		},
  		p(ctx, dirty) {
  			if (dirty & /*tooltip*/ 1) {
  				each_value = /*tooltip*/ ctx[0].split('\n');
  				let i;

  				for (i = 0; i < each_value.length; i += 1) {
  					const child_ctx = get_each_context$4(ctx, each_value, i);

  					if (each_blocks[i]) {
  						each_blocks[i].p(child_ctx, dirty);
  					} else {
  						each_blocks[i] = create_each_block$4(child_ctx);
  						each_blocks[i].c();
  						each_blocks[i].m(span, null);
  					}
  				}

  				for (; i < each_blocks.length; i += 1) {
  					each_blocks[i].d(1);
  				}

  				each_blocks.length = each_value.length;
  			}
  		},
  		d(detaching) {
  			if (detaching) detach(span);
  			destroy_each(each_blocks, detaching);
  		}
  	};
  }

  // (6:4) {#each tooltip.split('\n') as text}
  function create_each_block$4(ctx) {
  	let t0_value = /*text*/ ctx[1] + "";
  	let t0;
  	let t1;
  	let br;

  	return {
  		c() {
  			t0 = text(t0_value);
  			t1 = space();
  			br = element("br");
  		},
  		m(target, anchor) {
  			insert(target, t0, anchor);
  			insert(target, t1, anchor);
  			insert(target, br, anchor);
  		},
  		p(ctx, dirty) {
  			if (dirty & /*tooltip*/ 1 && t0_value !== (t0_value = /*text*/ ctx[1] + "")) set_data(t0, t0_value);
  		},
  		d(detaching) {
  			if (detaching) detach(t0);
  			if (detaching) detach(t1);
  			if (detaching) detach(br);
  		}
  	};
  }

  function create_fragment$j(ctx) {
  	let if_block_anchor;
  	let if_block = /*tooltip*/ ctx[0].length !== 0 && create_if_block$5(ctx);

  	return {
  		c() {
  			if (if_block) if_block.c();
  			if_block_anchor = empty();
  		},
  		m(target, anchor) {
  			if (if_block) if_block.m(target, anchor);
  			insert(target, if_block_anchor, anchor);
  		},
  		p(ctx, [dirty]) {
  			if (/*tooltip*/ ctx[0].length !== 0) {
  				if (if_block) {
  					if_block.p(ctx, dirty);
  				} else {
  					if_block = create_if_block$5(ctx);
  					if_block.c();
  					if_block.m(if_block_anchor.parentNode, if_block_anchor);
  				}
  			} else if (if_block) {
  				if_block.d(1);
  				if_block = null;
  			}
  		},
  		i: noop,
  		o: noop,
  		d(detaching) {
  			if (if_block) if_block.d(detaching);
  			if (detaching) detach(if_block_anchor);
  		}
  	};
  }

  function instance$g($$self, $$props, $$invalidate) {
  	let { tooltip } = $$props;

  	$$self.$$set = $$props => {
  		if ('tooltip' in $$props) $$invalidate(0, tooltip = $$props.tooltip);
  	};

  	return [tooltip];
  }

  class Tooltip$1 extends SvelteComponent {
  	constructor(options) {
  		super();
  		init(this, options, instance$g, create_fragment$j, safe_not_equal, { tooltip: 0 });
  	}
  }

  /* src/infrastructure/view/templates/table/Cell.svelte generated by Svelte v3.44.3 */

  function create_fragment$i(ctx) {
  	let td;
  	let t0_value = /*cell*/ ctx[0].getValue() + "";
  	let t0;
  	let t1;
  	let tooltip;
  	let current;
  	let mounted;
  	let dispose;

  	tooltip = new Tooltip$1({
  			props: { tooltip: /*cell*/ ctx[0].getTooltip() }
  		});

  	return {
  		c() {
  			td = element("td");
  			t0 = text(t0_value);
  			t1 = space();
  			create_component(tooltip.$$.fragment);
  			attr(td, "class", "sensitivity-data has-tooltip svelte-1adbs72");
  			toggle_class(td, "active", /*cell*/ ctx[0].getActive());
  			toggle_class(td, "highlighted", /*cell*/ ctx[0].getHighlighted());
  		},
  		m(target, anchor) {
  			insert(target, td, anchor);
  			append(td, t0);
  			append(td, t1);
  			mount_component(tooltip, td, null);
  			current = true;

  			if (!mounted) {
  				dispose = [
  					listen(td, "focus", /*focus_handler*/ ctx[1]),
  					listen(td, "mouseover", /*mouseover_handler*/ ctx[2]),
  					listen(td, "blur", /*blur_handler*/ ctx[3]),
  					listen(td, "mouseout", /*mouseout_handler*/ ctx[4])
  				];

  				mounted = true;
  			}
  		},
  		p(ctx, [dirty]) {
  			if ((!current || dirty & /*cell*/ 1) && t0_value !== (t0_value = /*cell*/ ctx[0].getValue() + "")) set_data(t0, t0_value);
  			const tooltip_changes = {};
  			if (dirty & /*cell*/ 1) tooltip_changes.tooltip = /*cell*/ ctx[0].getTooltip();
  			tooltip.$set(tooltip_changes);

  			if (dirty & /*cell*/ 1) {
  				toggle_class(td, "active", /*cell*/ ctx[0].getActive());
  			}

  			if (dirty & /*cell*/ 1) {
  				toggle_class(td, "highlighted", /*cell*/ ctx[0].getHighlighted());
  			}
  		},
  		i(local) {
  			if (current) return;
  			transition_in(tooltip.$$.fragment, local);
  			current = true;
  		},
  		o(local) {
  			transition_out(tooltip.$$.fragment, local);
  			current = false;
  		},
  		d(detaching) {
  			if (detaching) detach(td);
  			destroy_component(tooltip);
  			mounted = false;
  			run_all(dispose);
  		}
  	};
  }

  function instance$f($$self, $$props, $$invalidate) {
  	let { cell } = $$props;

  	function focus_handler(event) {
  		bubble.call(this, $$self, event);
  	}

  	function mouseover_handler(event) {
  		bubble.call(this, $$self, event);
  	}

  	function blur_handler(event) {
  		bubble.call(this, $$self, event);
  	}

  	function mouseout_handler(event) {
  		bubble.call(this, $$self, event);
  	}

  	$$self.$$set = $$props => {
  		if ('cell' in $$props) $$invalidate(0, cell = $$props.cell);
  	};

  	return [cell, focus_handler, mouseover_handler, blur_handler, mouseout_handler];
  }

  class Cell$1 extends SvelteComponent {
  	constructor(options) {
  		super();
  		init(this, options, instance$f, create_fragment$i, safe_not_equal, { cell: 0 });
  	}
  }

  /* src/infrastructure/view/templates/table/RowHeader.svelte generated by Svelte v3.44.3 */

  function create_fragment$h(ctx) {
  	let th;
  	let div;
  	let t0_value = /*rowHeader*/ ctx[0].getValue() + "";
  	let t0;
  	let t1;
  	let tooltip;
  	let current;
  	let mounted;
  	let dispose;

  	tooltip = new Tooltip$1({
  			props: {
  				tooltip: /*rowHeader*/ ctx[0].getTooltip()
  			}
  		});

  	return {
  		c() {
  			th = element("th");
  			div = element("div");
  			t0 = text(t0_value);
  			t1 = space();
  			create_component(tooltip.$$.fragment);
  			attr(div, "class", "organism-name svelte-rp7coy");
  			toggle_class(div, "bold", /*rowHeader*/ ctx[0].isBold());
  			attr(th, "class", "row-header has-tooltip svelte-rp7coy");
  			attr(th, "width", "200px");
  			toggle_class(th, "active", /*rowHeader*/ ctx[0].getActive());
  			toggle_class(th, "highlighted", /*rowHeader*/ ctx[0].getHighlighted());
  			toggle_class(th, "warn", /*rowHeader*/ ctx[0].hasWarning());
  		},
  		m(target, anchor) {
  			insert(target, th, anchor);
  			append(th, div);
  			append(div, t0);
  			append(th, t1);
  			mount_component(tooltip, th, null);
  			current = true;

  			if (!mounted) {
  				dispose = [
  					listen(th, "focus", /*focus_handler*/ ctx[1]),
  					listen(th, "mouseover", /*mouseover_handler*/ ctx[2]),
  					listen(th, "blur", /*blur_handler*/ ctx[3]),
  					listen(th, "mouseout", /*mouseout_handler*/ ctx[4])
  				];

  				mounted = true;
  			}
  		},
  		p(ctx, [dirty]) {
  			if ((!current || dirty & /*rowHeader*/ 1) && t0_value !== (t0_value = /*rowHeader*/ ctx[0].getValue() + "")) set_data(t0, t0_value);

  			if (dirty & /*rowHeader*/ 1) {
  				toggle_class(div, "bold", /*rowHeader*/ ctx[0].isBold());
  			}

  			const tooltip_changes = {};
  			if (dirty & /*rowHeader*/ 1) tooltip_changes.tooltip = /*rowHeader*/ ctx[0].getTooltip();
  			tooltip.$set(tooltip_changes);

  			if (dirty & /*rowHeader*/ 1) {
  				toggle_class(th, "active", /*rowHeader*/ ctx[0].getActive());
  			}

  			if (dirty & /*rowHeader*/ 1) {
  				toggle_class(th, "highlighted", /*rowHeader*/ ctx[0].getHighlighted());
  			}

  			if (dirty & /*rowHeader*/ 1) {
  				toggle_class(th, "warn", /*rowHeader*/ ctx[0].hasWarning());
  			}
  		},
  		i(local) {
  			if (current) return;
  			transition_in(tooltip.$$.fragment, local);
  			current = true;
  		},
  		o(local) {
  			transition_out(tooltip.$$.fragment, local);
  			current = false;
  		},
  		d(detaching) {
  			if (detaching) detach(th);
  			destroy_component(tooltip);
  			mounted = false;
  			run_all(dispose);
  		}
  	};
  }

  function instance$e($$self, $$props, $$invalidate) {
  	let { rowHeader } = $$props;

  	function focus_handler(event) {
  		bubble.call(this, $$self, event);
  	}

  	function mouseover_handler(event) {
  		bubble.call(this, $$self, event);
  	}

  	function blur_handler(event) {
  		bubble.call(this, $$self, event);
  	}

  	function mouseout_handler(event) {
  		bubble.call(this, $$self, event);
  	}

  	$$self.$$set = $$props => {
  		if ('rowHeader' in $$props) $$invalidate(0, rowHeader = $$props.rowHeader);
  	};

  	return [rowHeader, focus_handler, mouseover_handler, blur_handler, mouseout_handler];
  }

  class RowHeader extends SvelteComponent {
  	constructor(options) {
  		super();
  		init(this, options, instance$e, create_fragment$h, safe_not_equal, { rowHeader: 0 });
  	}
  }

  /* src/infrastructure/view/templates/table/TableRow.svelte generated by Svelte v3.44.3 */

  function get_each_context$3(ctx, list, i) {
  	const child_ctx = ctx.slice();
  	child_ctx[14] = list[i];
  	child_ctx[16] = i;
  	return child_ctx;
  }

  // (19:2) {#each rowOfCells as cell, j (cell.id)}
  function create_each_block$3(key_1, ctx) {
  	let first;
  	let cell;
  	let current;

  	function focus_handler_1() {
  		return /*focus_handler_1*/ ctx[10](/*j*/ ctx[16]);
  	}

  	function mouseover_handler_1() {
  		return /*mouseover_handler_1*/ ctx[11](/*j*/ ctx[16]);
  	}

  	function blur_handler_1() {
  		return /*blur_handler_1*/ ctx[12](/*j*/ ctx[16]);
  	}

  	function mouseout_handler_1() {
  		return /*mouseout_handler_1*/ ctx[13](/*j*/ ctx[16]);
  	}

  	cell = new Cell$1({ props: { cell: /*cell*/ ctx[14] } });
  	cell.$on("focus", focus_handler_1);
  	cell.$on("mouseover", mouseover_handler_1);
  	cell.$on("blur", blur_handler_1);
  	cell.$on("mouseout", mouseout_handler_1);

  	return {
  		key: key_1,
  		first: null,
  		c() {
  			first = empty();
  			create_component(cell.$$.fragment);
  			this.first = first;
  		},
  		m(target, anchor) {
  			insert(target, first, anchor);
  			mount_component(cell, target, anchor);
  			current = true;
  		},
  		p(new_ctx, dirty) {
  			ctx = new_ctx;
  			const cell_changes = {};
  			if (dirty & /*rowOfCells*/ 1) cell_changes.cell = /*cell*/ ctx[14];
  			cell.$set(cell_changes);
  		},
  		i(local) {
  			if (current) return;
  			transition_in(cell.$$.fragment, local);
  			current = true;
  		},
  		o(local) {
  			transition_out(cell.$$.fragment, local);
  			current = false;
  		},
  		d(detaching) {
  			if (detaching) detach(first);
  			destroy_component(cell, detaching);
  		}
  	};
  }

  function create_fragment$g(ctx) {
  	let tr;
  	let rowheader;
  	let t;
  	let each_blocks = [];
  	let each_1_lookup = new Map();
  	let current;

  	rowheader = new RowHeader({
  			props: { rowHeader: /*rowHeader*/ ctx[1] }
  		});

  	rowheader.$on("focus", /*focus_handler*/ ctx[6]);
  	rowheader.$on("mouseover", /*mouseover_handler*/ ctx[7]);
  	rowheader.$on("blur", /*blur_handler*/ ctx[8]);
  	rowheader.$on("mouseout", /*mouseout_handler*/ ctx[9]);
  	let each_value = /*rowOfCells*/ ctx[0];
  	const get_key = ctx => /*cell*/ ctx[14].id;

  	for (let i = 0; i < each_value.length; i += 1) {
  		let child_ctx = get_each_context$3(ctx, each_value, i);
  		let key = get_key(child_ctx);
  		each_1_lookup.set(key, each_blocks[i] = create_each_block$3(key, child_ctx));
  	}

  	return {
  		c() {
  			tr = element("tr");
  			create_component(rowheader.$$.fragment);
  			t = space();

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].c();
  			}

  			attr(tr, "class", "svelte-10qq66u");
  			toggle_class(tr, "warn", /*rowHeader*/ ctx[1].hasWarning());
  		},
  		m(target, anchor) {
  			insert(target, tr, anchor);
  			mount_component(rowheader, tr, null);
  			append(tr, t);

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].m(tr, null);
  			}

  			current = true;
  		},
  		p(ctx, [dirty]) {
  			const rowheader_changes = {};
  			if (dirty & /*rowHeader*/ 2) rowheader_changes.rowHeader = /*rowHeader*/ ctx[1];
  			rowheader.$set(rowheader_changes);

  			if (dirty & /*rowOfCells, highlightCells, unhighlightCells*/ 13) {
  				each_value = /*rowOfCells*/ ctx[0];
  				group_outros();
  				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, tr, outro_and_destroy_block, create_each_block$3, null, get_each_context$3);
  				check_outros();
  			}

  			if (dirty & /*rowHeader*/ 2) {
  				toggle_class(tr, "warn", /*rowHeader*/ ctx[1].hasWarning());
  			}
  		},
  		i(local) {
  			if (current) return;
  			transition_in(rowheader.$$.fragment, local);

  			for (let i = 0; i < each_value.length; i += 1) {
  				transition_in(each_blocks[i]);
  			}

  			current = true;
  		},
  		o(local) {
  			transition_out(rowheader.$$.fragment, local);

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				transition_out(each_blocks[i]);
  			}

  			current = false;
  		},
  		d(detaching) {
  			if (detaching) detach(tr);
  			destroy_component(rowheader);

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].d();
  			}
  		}
  	};
  }

  function instance$d($$self, $$props, $$invalidate) {
  	let { rowOfCells } = $$props;
  	let { rowHeader } = $$props;
  	let { highlightCells } = $$props;
  	let { unhighlightCells } = $$props;
  	let { highlight } = $$props;
  	let { unhighlight } = $$props;
  	const focus_handler = () => highlight();
  	const mouseover_handler = () => highlight();
  	const blur_handler = () => unhighlight();
  	const mouseout_handler = () => unhighlight();
  	const focus_handler_1 = j => highlightCells(j);
  	const mouseover_handler_1 = j => highlightCells(j);
  	const blur_handler_1 = j => unhighlightCells(j);
  	const mouseout_handler_1 = j => unhighlightCells(j);

  	$$self.$$set = $$props => {
  		if ('rowOfCells' in $$props) $$invalidate(0, rowOfCells = $$props.rowOfCells);
  		if ('rowHeader' in $$props) $$invalidate(1, rowHeader = $$props.rowHeader);
  		if ('highlightCells' in $$props) $$invalidate(2, highlightCells = $$props.highlightCells);
  		if ('unhighlightCells' in $$props) $$invalidate(3, unhighlightCells = $$props.unhighlightCells);
  		if ('highlight' in $$props) $$invalidate(4, highlight = $$props.highlight);
  		if ('unhighlight' in $$props) $$invalidate(5, unhighlight = $$props.unhighlight);
  	};

  	return [
  		rowOfCells,
  		rowHeader,
  		highlightCells,
  		unhighlightCells,
  		highlight,
  		unhighlight,
  		focus_handler,
  		mouseover_handler,
  		blur_handler,
  		mouseout_handler,
  		focus_handler_1,
  		mouseover_handler_1,
  		blur_handler_1,
  		mouseout_handler_1
  	];
  }

  class TableRow$1 extends SvelteComponent {
  	constructor(options) {
  		super();

  		init(this, options, instance$d, create_fragment$g, safe_not_equal, {
  			rowOfCells: 0,
  			rowHeader: 1,
  			highlightCells: 2,
  			unhighlightCells: 3,
  			highlight: 4,
  			unhighlight: 5
  		});
  	}
  }

  /* src/infrastructure/view/templates/table/ColumnHeader.svelte generated by Svelte v3.44.3 */

  function create_fragment$f(ctx) {
  	let th;
  	let span;
  	let t0_value = /*columnHeader*/ ctx[0].getValue() + "";
  	let t0;
  	let t1;
  	let tooltip;
  	let current;
  	let mounted;
  	let dispose;

  	tooltip = new Tooltip$1({
  			props: {
  				tooltip: /*columnHeader*/ ctx[0].getTooltip()
  			}
  		});

  	return {
  		c() {
  			th = element("th");
  			span = element("span");
  			t0 = text(t0_value);
  			t1 = space();
  			create_component(tooltip.$$.fragment);
  			attr(span, "class", "antibiotic-name svelte-k48di3");
  			attr(th, "scope", "col");
  			attr(th, "class", "column-header has-tooltip svelte-k48di3");
  			toggle_class(th, "active", /*columnHeader*/ ctx[0].getActive());
  			toggle_class(th, "highlighted", /*columnHeader*/ ctx[0].getHighlighted());
  		},
  		m(target, anchor) {
  			insert(target, th, anchor);
  			append(th, span);
  			append(span, t0);
  			append(th, t1);
  			mount_component(tooltip, th, null);
  			current = true;

  			if (!mounted) {
  				dispose = [
  					listen(th, "focus", /*focus_handler*/ ctx[3]),
  					listen(th, "mouseover", /*mouseover_handler*/ ctx[4]),
  					listen(th, "blur", /*blur_handler*/ ctx[5]),
  					listen(th, "mouseout", /*mouseout_handler*/ ctx[6])
  				];

  				mounted = true;
  			}
  		},
  		p(ctx, [dirty]) {
  			if ((!current || dirty & /*columnHeader*/ 1) && t0_value !== (t0_value = /*columnHeader*/ ctx[0].getValue() + "")) set_data(t0, t0_value);
  			const tooltip_changes = {};
  			if (dirty & /*columnHeader*/ 1) tooltip_changes.tooltip = /*columnHeader*/ ctx[0].getTooltip();
  			tooltip.$set(tooltip_changes);

  			if (dirty & /*columnHeader*/ 1) {
  				toggle_class(th, "active", /*columnHeader*/ ctx[0].getActive());
  			}

  			if (dirty & /*columnHeader*/ 1) {
  				toggle_class(th, "highlighted", /*columnHeader*/ ctx[0].getHighlighted());
  			}
  		},
  		i(local) {
  			if (current) return;
  			transition_in(tooltip.$$.fragment, local);
  			current = true;
  		},
  		o(local) {
  			transition_out(tooltip.$$.fragment, local);
  			current = false;
  		},
  		d(detaching) {
  			if (detaching) detach(th);
  			destroy_component(tooltip);
  			mounted = false;
  			run_all(dispose);
  		}
  	};
  }

  function instance$c($$self, $$props, $$invalidate) {
  	let { columnHeader } = $$props;
  	let { highlight } = $$props;
  	let { unhighlight } = $$props;
  	const focus_handler = () => highlight();
  	const mouseover_handler = () => highlight();
  	const blur_handler = () => unhighlight();
  	const mouseout_handler = () => unhighlight();

  	$$self.$$set = $$props => {
  		if ('columnHeader' in $$props) $$invalidate(0, columnHeader = $$props.columnHeader);
  		if ('highlight' in $$props) $$invalidate(1, highlight = $$props.highlight);
  		if ('unhighlight' in $$props) $$invalidate(2, unhighlight = $$props.unhighlight);
  	};

  	return [
  		columnHeader,
  		highlight,
  		unhighlight,
  		focus_handler,
  		mouseover_handler,
  		blur_handler,
  		mouseout_handler
  	];
  }

  class ColumnHeader extends SvelteComponent {
  	constructor(options) {
  		super();

  		init(this, options, instance$c, create_fragment$f, safe_not_equal, {
  			columnHeader: 0,
  			highlight: 1,
  			unhighlight: 2
  		});
  	}
  }

  /* src/infrastructure/view/templates/table/EmptyCorner.svelte generated by Svelte v3.44.3 */

  function create_fragment$e(ctx) {
  	let th;

  	return {
  		c() {
  			th = element("th");
  			attr(th, "class", "top-left-block svelte-tpo9u9");
  		},
  		m(target, anchor) {
  			insert(target, th, anchor);
  		},
  		p: noop,
  		i: noop,
  		o: noop,
  		d(detaching) {
  			if (detaching) detach(th);
  		}
  	};
  }

  function instance$b($$self) {
  	return [];
  }

  class EmptyCorner extends SvelteComponent {
  	constructor(options) {
  		super();
  		init(this, options, instance$b, create_fragment$e, safe_not_equal, {});
  	}
  }

  /* src/infrastructure/view/templates/table/Table.svelte generated by Svelte v3.44.3 */

  function get_each_context$2(ctx, list, i) {
  	const child_ctx = ctx.slice();
  	child_ctx[9] = list[i];
  	child_ctx[11] = i;
  	return child_ctx;
  }

  function get_each_context_1$1(ctx, list, i) {
  	const child_ctx = ctx.slice();
  	child_ctx[12] = list[i];
  	child_ctx[14] = i;
  	return child_ctx;
  }

  // (19:8) {#each ourTable.columnHeaders as columnHeader, j (columnHeader.id)}
  function create_each_block_1$1(key_1, ctx) {
  	let first;
  	let columnheader;
  	let current;

  	function func() {
  		return /*func*/ ctx[3](/*j*/ ctx[14]);
  	}

  	function func_1() {
  		return /*func_1*/ ctx[4](/*j*/ ctx[14]);
  	}

  	columnheader = new ColumnHeader({
  			props: {
  				columnHeader: /*columnHeader*/ ctx[12],
  				highlight: /*s*/ ctx[1](func),
  				unhighlight: /*s*/ ctx[1](func_1)
  			}
  		});

  	return {
  		key: key_1,
  		first: null,
  		c() {
  			first = empty();
  			create_component(columnheader.$$.fragment);
  			this.first = first;
  		},
  		m(target, anchor) {
  			insert(target, first, anchor);
  			mount_component(columnheader, target, anchor);
  			current = true;
  		},
  		p(new_ctx, dirty) {
  			ctx = new_ctx;
  			const columnheader_changes = {};
  			if (dirty & /*ourTable*/ 1) columnheader_changes.columnHeader = /*columnHeader*/ ctx[12];
  			if (dirty & /*ourTable*/ 1) columnheader_changes.highlight = /*s*/ ctx[1](func);
  			if (dirty & /*ourTable*/ 1) columnheader_changes.unhighlight = /*s*/ ctx[1](func_1);
  			columnheader.$set(columnheader_changes);
  		},
  		i(local) {
  			if (current) return;
  			transition_in(columnheader.$$.fragment, local);
  			current = true;
  		},
  		o(local) {
  			transition_out(columnheader.$$.fragment, local);
  			current = false;
  		},
  		d(detaching) {
  			if (detaching) detach(first);
  			destroy_component(columnheader, detaching);
  		}
  	};
  }

  // (29:6) {#each ourTable.rowHeaders as rowHeader, i (rowHeader.id)}
  function create_each_block$2(key_1, ctx) {
  	let first;
  	let tablerow;
  	let current;

  	function func_2(...args) {
  		return /*func_2*/ ctx[5](/*i*/ ctx[11], ...args);
  	}

  	function func_3(...args) {
  		return /*func_3*/ ctx[6](/*i*/ ctx[11], ...args);
  	}

  	function func_4() {
  		return /*func_4*/ ctx[7](/*i*/ ctx[11]);
  	}

  	function func_5() {
  		return /*func_5*/ ctx[8](/*i*/ ctx[11]);
  	}

  	tablerow = new TableRow$1({
  			props: {
  				rowHeader: /*rowHeader*/ ctx[9],
  				rowOfCells: /*ourTable*/ ctx[0].grid[/*i*/ ctx[11]],
  				highlightCells: /*s*/ ctx[1](func_2),
  				unhighlightCells: /*s*/ ctx[1](func_3),
  				highlight: /*s*/ ctx[1](func_4),
  				unhighlight: /*s*/ ctx[1](func_5)
  			}
  		});

  	return {
  		key: key_1,
  		first: null,
  		c() {
  			first = empty();
  			create_component(tablerow.$$.fragment);
  			this.first = first;
  		},
  		m(target, anchor) {
  			insert(target, first, anchor);
  			mount_component(tablerow, target, anchor);
  			current = true;
  		},
  		p(new_ctx, dirty) {
  			ctx = new_ctx;
  			const tablerow_changes = {};
  			if (dirty & /*ourTable*/ 1) tablerow_changes.rowHeader = /*rowHeader*/ ctx[9];
  			if (dirty & /*ourTable*/ 1) tablerow_changes.rowOfCells = /*ourTable*/ ctx[0].grid[/*i*/ ctx[11]];
  			if (dirty & /*ourTable*/ 1) tablerow_changes.highlightCells = /*s*/ ctx[1](func_2);
  			if (dirty & /*ourTable*/ 1) tablerow_changes.unhighlightCells = /*s*/ ctx[1](func_3);
  			if (dirty & /*ourTable*/ 1) tablerow_changes.highlight = /*s*/ ctx[1](func_4);
  			if (dirty & /*ourTable*/ 1) tablerow_changes.unhighlight = /*s*/ ctx[1](func_5);
  			tablerow.$set(tablerow_changes);
  		},
  		i(local) {
  			if (current) return;
  			transition_in(tablerow.$$.fragment, local);
  			current = true;
  		},
  		o(local) {
  			transition_out(tablerow.$$.fragment, local);
  			current = false;
  		},
  		d(detaching) {
  			if (detaching) detach(first);
  			destroy_component(tablerow, detaching);
  		}
  	};
  }

  function create_fragment$d(ctx) {
  	let div;
  	let table_1;
  	let thead;
  	let tr;
  	let emptycorner;
  	let t0;
  	let each_blocks_1 = [];
  	let each0_lookup = new Map();
  	let t1;
  	let tbody;
  	let each_blocks = [];
  	let each1_lookup = new Map();
  	let current;
  	emptycorner = new EmptyCorner({});
  	let each_value_1 = /*ourTable*/ ctx[0].columnHeaders;
  	const get_key = ctx => /*columnHeader*/ ctx[12].id;

  	for (let i = 0; i < each_value_1.length; i += 1) {
  		let child_ctx = get_each_context_1$1(ctx, each_value_1, i);
  		let key = get_key(child_ctx);
  		each0_lookup.set(key, each_blocks_1[i] = create_each_block_1$1(key, child_ctx));
  	}

  	let each_value = /*ourTable*/ ctx[0].rowHeaders;
  	const get_key_1 = ctx => /*rowHeader*/ ctx[9].id;

  	for (let i = 0; i < each_value.length; i += 1) {
  		let child_ctx = get_each_context$2(ctx, each_value, i);
  		let key = get_key_1(child_ctx);
  		each1_lookup.set(key, each_blocks[i] = create_each_block$2(key, child_ctx));
  	}

  	return {
  		c() {
  			div = element("div");
  			table_1 = element("table");
  			thead = element("thead");
  			tr = element("tr");
  			create_component(emptycorner.$$.fragment);
  			t0 = space();

  			for (let i = 0; i < each_blocks_1.length; i += 1) {
  				each_blocks_1[i].c();
  			}

  			t1 = space();
  			tbody = element("tbody");

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].c();
  			}

  			attr(tr, "class", "svelte-1vk9uqa");
  			attr(table_1, "class", "antibiogram-table svelte-1vk9uqa");
  			attr(div, "class", "table-container svelte-1vk9uqa");
  		},
  		m(target, anchor) {
  			insert(target, div, anchor);
  			append(div, table_1);
  			append(table_1, thead);
  			append(thead, tr);
  			mount_component(emptycorner, tr, null);
  			append(tr, t0);

  			for (let i = 0; i < each_blocks_1.length; i += 1) {
  				each_blocks_1[i].m(tr, null);
  			}

  			append(table_1, t1);
  			append(table_1, tbody);

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].m(tbody, null);
  			}

  			current = true;
  		},
  		p(ctx, [dirty]) {
  			if (dirty & /*ourTable, s*/ 3) {
  				each_value_1 = /*ourTable*/ ctx[0].columnHeaders;
  				group_outros();
  				each_blocks_1 = update_keyed_each(each_blocks_1, dirty, get_key, 1, ctx, each_value_1, each0_lookup, tr, outro_and_destroy_block, create_each_block_1$1, null, get_each_context_1$1);
  				check_outros();
  			}

  			if (dirty & /*ourTable, s*/ 3) {
  				each_value = /*ourTable*/ ctx[0].rowHeaders;
  				group_outros();
  				each_blocks = update_keyed_each(each_blocks, dirty, get_key_1, 1, ctx, each_value, each1_lookup, tbody, outro_and_destroy_block, create_each_block$2, null, get_each_context$2);
  				check_outros();
  			}
  		},
  		i(local) {
  			if (current) return;
  			transition_in(emptycorner.$$.fragment, local);

  			for (let i = 0; i < each_value_1.length; i += 1) {
  				transition_in(each_blocks_1[i]);
  			}

  			for (let i = 0; i < each_value.length; i += 1) {
  				transition_in(each_blocks[i]);
  			}

  			current = true;
  		},
  		o(local) {
  			transition_out(emptycorner.$$.fragment, local);

  			for (let i = 0; i < each_blocks_1.length; i += 1) {
  				transition_out(each_blocks_1[i]);
  			}

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				transition_out(each_blocks[i]);
  			}

  			current = false;
  		},
  		d(detaching) {
  			if (detaching) detach(div);
  			destroy_component(emptycorner);

  			for (let i = 0; i < each_blocks_1.length; i += 1) {
  				each_blocks_1[i].d();
  			}

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].d();
  			}
  		}
  	};
  }

  function instance$a($$self, $$props, $$invalidate) {
  	let { table } = $$props;
  	let ourTable = table;

  	const s = fn => (...args) => {
  		const res = fn(...args);
  		$$invalidate(0, ourTable);
  		return res;
  	};

  	const func = j => ourTable.highlightColumn(j);
  	const func_1 = j => ourTable.unhighlightColumn(j);
  	const func_2 = (i, j) => ourTable.highlightCell(i, j);
  	const func_3 = (i, j) => ourTable.unhighlightCell(i, j);
  	const func_4 = i => ourTable.highlightRow(i);
  	const func_5 = i => ourTable.unhighlightRow(i);

  	$$self.$$set = $$props => {
  		if ('table' in $$props) $$invalidate(2, table = $$props.table);
  	};

  	return [ourTable, s, table, func, func_1, func_2, func_3, func_4, func_5];
  }

  class Table extends SvelteComponent {
  	constructor(options) {
  		super();
  		init(this, options, instance$a, create_fragment$d, safe_not_equal, { table: 2 });
  	}
  }

  /* src/infrastructure/view/templates/table/NoTable.svelte generated by Svelte v3.44.3 */

  function create_fragment$c(ctx) {
  	let div;

  	return {
  		c() {
  			div = element("div");
  			div.textContent = "Sorry no data yet.";
  		},
  		m(target, anchor) {
  			insert(target, div, anchor);
  		},
  		p: noop,
  		i: noop,
  		o: noop,
  		d(detaching) {
  			if (detaching) detach(div);
  		}
  	};
  }

  function instance$9($$self) {
  	return [];
  }

  class NoTable extends SvelteComponent {
  	constructor(options) {
  		super();
  		init(this, options, instance$9, create_fragment$c, safe_not_equal, {});
  	}
  }

  /* src/infrastructure/view/templates/antibiogram/Antibiogram.svelte generated by Svelte v3.44.3 */

  function create_else_block$4(ctx) {
  	let header;
  	let h1;
  	let t0_value = /*vm*/ ctx[0].info + "";
  	let t0;
  	let t1;
  	let ul;
  	let li;
  	let t2_value = /*vm*/ ctx[0].publishedAt + "";
  	let t2;
  	let t3;
  	let t4_value = '\u2212' + "";
  	let t4;
  	let t5;
  	let t6_value = /*vm*/ ctx[0].expiresAt + "";
  	let t6;
  	let t7;
  	let table;
  	let current;
  	table = new Table({ props: { table: /*vm*/ ctx[0].table } });

  	return {
  		c() {
  			header = element("header");
  			h1 = element("h1");
  			t0 = text(t0_value);
  			t1 = space();
  			ul = element("ul");
  			li = element("li");
  			t2 = text(t2_value);
  			t3 = space();
  			t4 = text(t4_value);
  			t5 = space();
  			t6 = text(t6_value);
  			t7 = space();
  			create_component(table.$$.fragment);
  			attr(h1, "class", "header-title svelte-3sgy1");
  			attr(header, "class", "header svelte-3sgy1");
  		},
  		m(target, anchor) {
  			insert(target, header, anchor);
  			append(header, h1);
  			append(h1, t0);
  			append(header, t1);
  			append(header, ul);
  			append(ul, li);
  			append(li, t2);
  			append(li, t3);
  			append(li, t4);
  			append(li, t5);
  			append(li, t6);
  			insert(target, t7, anchor);
  			mount_component(table, target, anchor);
  			current = true;
  		},
  		p(ctx, dirty) {
  			if ((!current || dirty & /*vm*/ 1) && t0_value !== (t0_value = /*vm*/ ctx[0].info + "")) set_data(t0, t0_value);
  			if ((!current || dirty & /*vm*/ 1) && t2_value !== (t2_value = /*vm*/ ctx[0].publishedAt + "")) set_data(t2, t2_value);
  			if ((!current || dirty & /*vm*/ 1) && t6_value !== (t6_value = /*vm*/ ctx[0].expiresAt + "")) set_data(t6, t6_value);
  			const table_changes = {};
  			if (dirty & /*vm*/ 1) table_changes.table = /*vm*/ ctx[0].table;
  			table.$set(table_changes);
  		},
  		i(local) {
  			if (current) return;
  			transition_in(table.$$.fragment, local);
  			current = true;
  		},
  		o(local) {
  			transition_out(table.$$.fragment, local);
  			current = false;
  		},
  		d(detaching) {
  			if (detaching) detach(header);
  			if (detaching) detach(t7);
  			destroy_component(table, detaching);
  		}
  	};
  }

  // (7:2) {#if !vm}
  function create_if_block$4(ctx) {
  	let notable;
  	let current;
  	notable = new NoTable({});

  	return {
  		c() {
  			create_component(notable.$$.fragment);
  		},
  		m(target, anchor) {
  			mount_component(notable, target, anchor);
  			current = true;
  		},
  		p: noop,
  		i(local) {
  			if (current) return;
  			transition_in(notable.$$.fragment, local);
  			current = true;
  		},
  		o(local) {
  			transition_out(notable.$$.fragment, local);
  			current = false;
  		},
  		d(detaching) {
  			destroy_component(notable, detaching);
  		}
  	};
  }

  function create_fragment$b(ctx) {
  	let section;
  	let current_block_type_index;
  	let if_block;
  	let current;
  	const if_block_creators = [create_if_block$4, create_else_block$4];
  	const if_blocks = [];

  	function select_block_type(ctx, dirty) {
  		if (!/*vm*/ ctx[0]) return 0;
  		return 1;
  	}

  	current_block_type_index = select_block_type(ctx);
  	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

  	return {
  		c() {
  			section = element("section");
  			if_block.c();
  			attr(section, "class", "svelte-3sgy1");
  		},
  		m(target, anchor) {
  			insert(target, section, anchor);
  			if_blocks[current_block_type_index].m(section, null);
  			current = true;
  		},
  		p(ctx, [dirty]) {
  			let previous_block_index = current_block_type_index;
  			current_block_type_index = select_block_type(ctx);

  			if (current_block_type_index === previous_block_index) {
  				if_blocks[current_block_type_index].p(ctx, dirty);
  			} else {
  				group_outros();

  				transition_out(if_blocks[previous_block_index], 1, 1, () => {
  					if_blocks[previous_block_index] = null;
  				});

  				check_outros();
  				if_block = if_blocks[current_block_type_index];

  				if (!if_block) {
  					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  					if_block.c();
  				} else {
  					if_block.p(ctx, dirty);
  				}

  				transition_in(if_block, 1);
  				if_block.m(section, null);
  			}
  		},
  		i(local) {
  			if (current) return;
  			transition_in(if_block);
  			current = true;
  		},
  		o(local) {
  			transition_out(if_block);
  			current = false;
  		},
  		d(detaching) {
  			if (detaching) detach(section);
  			if_blocks[current_block_type_index].d();
  		}
  	};
  }

  function instance$8($$self, $$props, $$invalidate) {
  	let { vm } = $$props;

  	$$self.$$set = $$props => {
  		if ('vm' in $$props) $$invalidate(0, vm = $$props.vm);
  	};

  	return [vm];
  }

  class Antibiogram$1 extends SvelteComponent {
  	constructor(options) {
  		super();
  		init(this, options, instance$8, create_fragment$b, safe_not_equal, { vm: 0 });
  	}
  }

  const subscriber_queue = [];
  /**
   * Creates a `Readable` store that allows reading by subscription.
   * @param value initial value
   * @param {StartStopNotifier}start start and stop notifications for subscriptions
   */
  function readable(value, start) {
      return {
          subscribe: writable(value, start).subscribe
      };
  }
  /**
   * Create a `Writable` store that allows both updating and reading by subscription.
   * @param {*=}value initial value
   * @param {StartStopNotifier=}start start and stop notifications for subscriptions
   */
  function writable(value, start = noop) {
      let stop;
      const subscribers = new Set();
      function set(new_value) {
          if (safe_not_equal(value, new_value)) {
              value = new_value;
              if (stop) { // store is ready
                  const run_queue = !subscriber_queue.length;
                  for (const subscriber of subscribers) {
                      subscriber[1]();
                      subscriber_queue.push(subscriber, value);
                  }
                  if (run_queue) {
                      for (let i = 0; i < subscriber_queue.length; i += 2) {
                          subscriber_queue[i][0](subscriber_queue[i + 1]);
                      }
                      subscriber_queue.length = 0;
                  }
              }
          }
      }
      function update(fn) {
          set(fn(value));
      }
      function subscribe(run, invalidate = noop) {
          const subscriber = [run, invalidate];
          subscribers.add(subscriber);
          if (subscribers.size === 1) {
              stop = start(set) || noop;
          }
          run(value);
          return () => {
              subscribers.delete(subscriber);
              if (subscribers.size === 0) {
                  stop();
                  stop = null;
              }
          };
      }
      return { set, update, subscribe };
  }
  function derived(stores, fn, initial_value) {
      const single = !Array.isArray(stores);
      const stores_array = single
          ? [stores]
          : stores;
      const auto = fn.length < 2;
      return readable(initial_value, (set) => {
          let inited = false;
          const values = [];
          let pending = 0;
          let cleanup = noop;
          const sync = () => {
              if (pending) {
                  return;
              }
              cleanup();
              const result = fn(single ? values[0] : values, set);
              if (auto) {
                  set(result);
              }
              else {
                  cleanup = is_function(result) ? result : noop;
              }
          };
          const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
              values[i] = value;
              pending &= ~(1 << i);
              if (inited) {
                  sync();
              }
          }, () => {
              pending |= (1 << i);
          }));
          inited = true;
          sync();
          return function stop() {
              run_all(unsubscribers);
              cleanup();
          };
      });
  }

  function parse(str, loose) {
  	if (str instanceof RegExp) return { keys:false, pattern:str };
  	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
  	arr[0] || arr.shift();

  	while (tmp = arr.shift()) {
  		c = tmp[0];
  		if (c === '*') {
  			keys.push('wild');
  			pattern += '/(.*)';
  		} else if (c === ':') {
  			o = tmp.indexOf('?', 1);
  			ext = tmp.indexOf('.', 1);
  			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
  			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
  			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
  		} else {
  			pattern += '/' + tmp;
  		}
  	}

  	return {
  		keys: keys,
  		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
  	};
  }

  /* node_modules/svelte-spa-router/Router.svelte generated by Svelte v3.44.3 */

  function create_else_block$3(ctx) {
  	let switch_instance;
  	let switch_instance_anchor;
  	let current;
  	const switch_instance_spread_levels = [/*props*/ ctx[2]];
  	var switch_value = /*component*/ ctx[0];

  	function switch_props(ctx) {
  		let switch_instance_props = {};

  		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
  			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
  		}

  		return { props: switch_instance_props };
  	}

  	if (switch_value) {
  		switch_instance = new switch_value(switch_props());
  		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
  	}

  	return {
  		c() {
  			if (switch_instance) create_component(switch_instance.$$.fragment);
  			switch_instance_anchor = empty();
  		},
  		m(target, anchor) {
  			if (switch_instance) {
  				mount_component(switch_instance, target, anchor);
  			}

  			insert(target, switch_instance_anchor, anchor);
  			current = true;
  		},
  		p(ctx, dirty) {
  			const switch_instance_changes = (dirty & /*props*/ 4)
  			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[2])])
  			: {};

  			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
  				if (switch_instance) {
  					group_outros();
  					const old_component = switch_instance;

  					transition_out(old_component.$$.fragment, 1, 0, () => {
  						destroy_component(old_component, 1);
  					});

  					check_outros();
  				}

  				if (switch_value) {
  					switch_instance = new switch_value(switch_props());
  					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
  					create_component(switch_instance.$$.fragment);
  					transition_in(switch_instance.$$.fragment, 1);
  					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
  				} else {
  					switch_instance = null;
  				}
  			} else if (switch_value) {
  				switch_instance.$set(switch_instance_changes);
  			}
  		},
  		i(local) {
  			if (current) return;
  			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
  			current = true;
  		},
  		o(local) {
  			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
  			current = false;
  		},
  		d(detaching) {
  			if (detaching) detach(switch_instance_anchor);
  			if (switch_instance) destroy_component(switch_instance, detaching);
  		}
  	};
  }

  // (244:0) {#if componentParams}
  function create_if_block$3(ctx) {
  	let switch_instance;
  	let switch_instance_anchor;
  	let current;
  	const switch_instance_spread_levels = [{ params: /*componentParams*/ ctx[1] }, /*props*/ ctx[2]];
  	var switch_value = /*component*/ ctx[0];

  	function switch_props(ctx) {
  		let switch_instance_props = {};

  		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
  			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
  		}

  		return { props: switch_instance_props };
  	}

  	if (switch_value) {
  		switch_instance = new switch_value(switch_props());
  		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
  	}

  	return {
  		c() {
  			if (switch_instance) create_component(switch_instance.$$.fragment);
  			switch_instance_anchor = empty();
  		},
  		m(target, anchor) {
  			if (switch_instance) {
  				mount_component(switch_instance, target, anchor);
  			}

  			insert(target, switch_instance_anchor, anchor);
  			current = true;
  		},
  		p(ctx, dirty) {
  			const switch_instance_changes = (dirty & /*componentParams, props*/ 6)
  			? get_spread_update(switch_instance_spread_levels, [
  					dirty & /*componentParams*/ 2 && { params: /*componentParams*/ ctx[1] },
  					dirty & /*props*/ 4 && get_spread_object(/*props*/ ctx[2])
  				])
  			: {};

  			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
  				if (switch_instance) {
  					group_outros();
  					const old_component = switch_instance;

  					transition_out(old_component.$$.fragment, 1, 0, () => {
  						destroy_component(old_component, 1);
  					});

  					check_outros();
  				}

  				if (switch_value) {
  					switch_instance = new switch_value(switch_props());
  					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
  					create_component(switch_instance.$$.fragment);
  					transition_in(switch_instance.$$.fragment, 1);
  					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
  				} else {
  					switch_instance = null;
  				}
  			} else if (switch_value) {
  				switch_instance.$set(switch_instance_changes);
  			}
  		},
  		i(local) {
  			if (current) return;
  			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
  			current = true;
  		},
  		o(local) {
  			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
  			current = false;
  		},
  		d(detaching) {
  			if (detaching) detach(switch_instance_anchor);
  			if (switch_instance) destroy_component(switch_instance, detaching);
  		}
  	};
  }

  function create_fragment$a(ctx) {
  	let current_block_type_index;
  	let if_block;
  	let if_block_anchor;
  	let current;
  	const if_block_creators = [create_if_block$3, create_else_block$3];
  	const if_blocks = [];

  	function select_block_type(ctx, dirty) {
  		if (/*componentParams*/ ctx[1]) return 0;
  		return 1;
  	}

  	current_block_type_index = select_block_type(ctx);
  	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

  	return {
  		c() {
  			if_block.c();
  			if_block_anchor = empty();
  		},
  		m(target, anchor) {
  			if_blocks[current_block_type_index].m(target, anchor);
  			insert(target, if_block_anchor, anchor);
  			current = true;
  		},
  		p(ctx, [dirty]) {
  			let previous_block_index = current_block_type_index;
  			current_block_type_index = select_block_type(ctx);

  			if (current_block_type_index === previous_block_index) {
  				if_blocks[current_block_type_index].p(ctx, dirty);
  			} else {
  				group_outros();

  				transition_out(if_blocks[previous_block_index], 1, 1, () => {
  					if_blocks[previous_block_index] = null;
  				});

  				check_outros();
  				if_block = if_blocks[current_block_type_index];

  				if (!if_block) {
  					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  					if_block.c();
  				} else {
  					if_block.p(ctx, dirty);
  				}

  				transition_in(if_block, 1);
  				if_block.m(if_block_anchor.parentNode, if_block_anchor);
  			}
  		},
  		i(local) {
  			if (current) return;
  			transition_in(if_block);
  			current = true;
  		},
  		o(local) {
  			transition_out(if_block);
  			current = false;
  		},
  		d(detaching) {
  			if_blocks[current_block_type_index].d(detaching);
  			if (detaching) detach(if_block_anchor);
  		}
  	};
  }

  /**
   * @typedef {Object} Location
   * @property {string} location - Location (page/view), for example `/book`
   * @property {string} [querystring] - Querystring from the hash, as a string not parsed
   */
  /**
   * Returns the current location from the hash.
   *
   * @returns {Location} Location object
   * @private
   */
  function getLocation() {
  	const hashPosition = window.location.href.indexOf('#/');

  	let location = hashPosition > -1
  	? window.location.href.substr(hashPosition + 1)
  	: '/';

  	// Check if there's a querystring
  	const qsPosition = location.indexOf('?');

  	let querystring = '';

  	if (qsPosition > -1) {
  		querystring = location.substr(qsPosition + 1);
  		location = location.substr(0, qsPosition);
  	}

  	return { location, querystring };
  }

  const loc = readable(null, // eslint-disable-next-line prefer-arrow-callback
  function start(set) {
  	set(getLocation());

  	const update = () => {
  		set(getLocation());
  	};

  	window.addEventListener('hashchange', update, false);

  	return function stop() {
  		window.removeEventListener('hashchange', update, false);
  	};
  });

  const location = derived(loc, $loc => $loc.location);
  const querystring = derived(loc, $loc => $loc.querystring);
  const params = writable(undefined);

  function link(node, opts) {
  	opts = linkOpts(opts);

  	// Only apply to <a> tags
  	if (!node || !node.tagName || node.tagName.toLowerCase() != 'a') {
  		throw Error('Action "link" can only be used with <a> tags');
  	}

  	updateLink(node, opts);

  	return {
  		update(updated) {
  			updated = linkOpts(updated);
  			updateLink(node, updated);
  		}
  	};
  }

  // Internal function used by the link function
  function updateLink(node, opts) {
  	let href = opts.href || node.getAttribute('href');

  	// Destination must start with '/' or '#/'
  	if (href && href.charAt(0) == '/') {
  		// Add # to the href attribute
  		href = '#' + href;
  	} else if (!href || href.length < 2 || href.slice(0, 2) != '#/') {
  		throw Error('Invalid value for "href" attribute: ' + href);
  	}

  	node.setAttribute('href', href);

  	node.addEventListener('click', event => {
  		// Prevent default anchor onclick behaviour
  		event.preventDefault();

  		if (!opts.disabled) {
  			scrollstateHistoryHandler(event.currentTarget.getAttribute('href'));
  		}
  	});
  }

  // Internal function that ensures the argument of the link action is always an object
  function linkOpts(val) {
  	if (val && typeof val == 'string') {
  		return { href: val };
  	} else {
  		return val || {};
  	}
  }

  /**
   * The handler attached to an anchor tag responsible for updating the
   * current history state with the current scroll state
   *
   * @param {string} href - Destination
   */
  function scrollstateHistoryHandler(href) {
  	// Setting the url (3rd arg) to href will break clicking for reasons, so don't try to do that
  	history.replaceState(
  		{
  			...history.state,
  			__svelte_spa_router_scrollX: window.scrollX,
  			__svelte_spa_router_scrollY: window.scrollY
  		},
  		undefined,
  		undefined
  	);

  	// This will force an update as desired, but this time our scroll state will be attached
  	window.location.hash = href;
  }

  function instance$7($$self, $$props, $$invalidate) {
  	let { routes = {} } = $$props;
  	let { prefix = '' } = $$props;
  	let { restoreScrollState = false } = $$props;

  	/**
   * Container for a route: path, component
   */
  	class RouteItem {
  		/**
   * Initializes the object and creates a regular expression from the path, using regexparam.
   *
   * @param {string} path - Path to the route (must start with '/' or '*')
   * @param {SvelteComponent|WrappedComponent} component - Svelte component for the route, optionally wrapped
   */
  		constructor(path, component) {
  			if (!component || typeof component != 'function' && (typeof component != 'object' || component._sveltesparouter !== true)) {
  				throw Error('Invalid component object');
  			}

  			// Path must be a regular or expression, or a string starting with '/' or '*'
  			if (!path || typeof path == 'string' && (path.length < 1 || path.charAt(0) != '/' && path.charAt(0) != '*') || typeof path == 'object' && !(path instanceof RegExp)) {
  				throw Error('Invalid value for "path" argument - strings must start with / or *');
  			}

  			const { pattern, keys } = parse(path);
  			this.path = path;

  			// Check if the component is wrapped and we have conditions
  			if (typeof component == 'object' && component._sveltesparouter === true) {
  				this.component = component.component;
  				this.conditions = component.conditions || [];
  				this.userData = component.userData;
  				this.props = component.props || {};
  			} else {
  				// Convert the component to a function that returns a Promise, to normalize it
  				this.component = () => Promise.resolve(component);

  				this.conditions = [];
  				this.props = {};
  			}

  			this._pattern = pattern;
  			this._keys = keys;
  		}

  		/**
   * Checks if `path` matches the current route.
   * If there's a match, will return the list of parameters from the URL (if any).
   * In case of no match, the method will return `null`.
   *
   * @param {string} path - Path to test
   * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
   */
  		match(path) {
  			// If there's a prefix, check if it matches the start of the path.
  			// If not, bail early, else remove it before we run the matching.
  			if (prefix) {
  				if (typeof prefix == 'string') {
  					if (path.startsWith(prefix)) {
  						path = path.substr(prefix.length) || '/';
  					} else {
  						return null;
  					}
  				} else if (prefix instanceof RegExp) {
  					const match = path.match(prefix);

  					if (match && match[0]) {
  						path = path.substr(match[0].length) || '/';
  					} else {
  						return null;
  					}
  				}
  			}

  			// Check if the pattern matches
  			const matches = this._pattern.exec(path);

  			if (matches === null) {
  				return null;
  			}

  			// If the input was a regular expression, this._keys would be false, so return matches as is
  			if (this._keys === false) {
  				return matches;
  			}

  			const out = {};
  			let i = 0;

  			while (i < this._keys.length) {
  				// In the match parameters, URL-decode all values
  				try {
  					out[this._keys[i]] = decodeURIComponent(matches[i + 1] || '') || null;
  				} catch(e) {
  					out[this._keys[i]] = null;
  				}

  				i++;
  			}

  			return out;
  		}

  		/**
   * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoading`, `routeLoaded` and `conditionsFailed` events
   * @typedef {Object} RouteDetail
   * @property {string|RegExp} route - Route matched as defined in the route definition (could be a string or a reguar expression object)
   * @property {string} location - Location path
   * @property {string} querystring - Querystring from the hash
   * @property {object} [userData] - Custom data passed by the user
   * @property {SvelteComponent} [component] - Svelte component (only in `routeLoaded` events)
   * @property {string} [name] - Name of the Svelte component (only in `routeLoaded` events)
   */
  		/**
   * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
   * 
   * @param {RouteDetail} detail - Route detail
   * @returns {boolean} Returns true if all the conditions succeeded
   */
  		async checkConditions(detail) {
  			for (let i = 0; i < this.conditions.length; i++) {
  				if (!await this.conditions[i](detail)) {
  					return false;
  				}
  			}

  			return true;
  		}
  	}

  	// Set up all routes
  	const routesList = [];

  	if (routes instanceof Map) {
  		// If it's a map, iterate on it right away
  		routes.forEach((route, path) => {
  			routesList.push(new RouteItem(path, route));
  		});
  	} else {
  		// We have an object, so iterate on its own properties
  		Object.keys(routes).forEach(path => {
  			routesList.push(new RouteItem(path, routes[path]));
  		});
  	}

  	// Props for the component to render
  	let component = null;

  	let componentParams = null;
  	let props = {};

  	// Event dispatcher from Svelte
  	const dispatch = createEventDispatcher();

  	// Just like dispatch, but executes on the next iteration of the event loop
  	async function dispatchNextTick(name, detail) {
  		// Execute this code when the current call stack is complete
  		await tick();

  		dispatch(name, detail);
  	}

  	// If this is set, then that means we have popped into this var the state of our last scroll position
  	let previousScrollState = null;

  	let popStateChanged = null;

  	if (restoreScrollState) {
  		popStateChanged = event => {
  			// If this event was from our history.replaceState, event.state will contain
  			// our scroll history. Otherwise, event.state will be null (like on forward
  			// navigation)
  			if (event.state && event.state.__svelte_spa_router_scrollY) {
  				previousScrollState = event.state;
  			} else {
  				previousScrollState = null;
  			}
  		};

  		// This is removed in the destroy() invocation below
  		window.addEventListener('popstate', popStateChanged);

  		afterUpdate(() => {
  			// If this exists, then this is a back navigation: restore the scroll position
  			if (previousScrollState) {
  				window.scrollTo(previousScrollState.__svelte_spa_router_scrollX, previousScrollState.__svelte_spa_router_scrollY);
  			} else {
  				// Otherwise this is a forward navigation: scroll to top
  				window.scrollTo(0, 0);
  			}
  		});
  	}

  	// Always have the latest value of loc
  	let lastLoc = null;

  	// Current object of the component loaded
  	let componentObj = null;

  	// Handle hash change events
  	// Listen to changes in the $loc store and update the page
  	// Do not use the $: syntax because it gets triggered by too many things
  	const unsubscribeLoc = loc.subscribe(async newLoc => {
  		lastLoc = newLoc;

  		// Find a route matching the location
  		let i = 0;

  		while (i < routesList.length) {
  			const match = routesList[i].match(newLoc.location);

  			if (!match) {
  				i++;
  				continue;
  			}

  			const detail = {
  				route: routesList[i].path,
  				location: newLoc.location,
  				querystring: newLoc.querystring,
  				userData: routesList[i].userData,
  				params: match && typeof match == 'object' && Object.keys(match).length
  				? match
  				: null
  			};

  			// Check if the route can be loaded - if all conditions succeed
  			if (!await routesList[i].checkConditions(detail)) {
  				// Don't display anything
  				$$invalidate(0, component = null);

  				componentObj = null;

  				// Trigger an event to notify the user, then exit
  				dispatchNextTick('conditionsFailed', detail);

  				return;
  			}

  			// Trigger an event to alert that we're loading the route
  			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
  			dispatchNextTick('routeLoading', Object.assign({}, detail));

  			// If there's a component to show while we're loading the route, display it
  			const obj = routesList[i].component;

  			// Do not replace the component if we're loading the same one as before, to avoid the route being unmounted and re-mounted
  			if (componentObj != obj) {
  				if (obj.loading) {
  					$$invalidate(0, component = obj.loading);
  					componentObj = obj;
  					$$invalidate(1, componentParams = obj.loadingParams);
  					$$invalidate(2, props = {});

  					// Trigger the routeLoaded event for the loading component
  					// Create a copy of detail so we don't modify the object for the dynamic route (and the dynamic route doesn't modify our object too)
  					dispatchNextTick('routeLoaded', Object.assign({}, detail, {
  						component,
  						name: component.name,
  						params: componentParams
  					}));
  				} else {
  					$$invalidate(0, component = null);
  					componentObj = null;
  				}

  				// Invoke the Promise
  				const loaded = await obj();

  				// Now that we're here, after the promise resolved, check if we still want this component, as the user might have navigated to another page in the meanwhile
  				if (newLoc != lastLoc) {
  					// Don't update the component, just exit
  					return;
  				}

  				// If there is a "default" property, which is used by async routes, then pick that
  				$$invalidate(0, component = loaded && loaded.default || loaded);

  				componentObj = obj;
  			}

  			// Set componentParams only if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
  			// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
  			if (match && typeof match == 'object' && Object.keys(match).length) {
  				$$invalidate(1, componentParams = match);
  			} else {
  				$$invalidate(1, componentParams = null);
  			}

  			// Set static props, if any
  			$$invalidate(2, props = routesList[i].props);

  			// Dispatch the routeLoaded event then exit
  			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
  			dispatchNextTick('routeLoaded', Object.assign({}, detail, {
  				component,
  				name: component.name,
  				params: componentParams
  			})).then(() => {
  				params.set(componentParams);
  			});

  			return;
  		}

  		// If we're still here, there was no match, so show the empty component
  		$$invalidate(0, component = null);

  		componentObj = null;
  		params.set(undefined);
  	});

  	onDestroy(() => {
  		unsubscribeLoc();
  		popStateChanged && window.removeEventListener('popstate', popStateChanged);
  	});

  	function routeEvent_handler(event) {
  		bubble.call(this, $$self, event);
  	}

  	function routeEvent_handler_1(event) {
  		bubble.call(this, $$self, event);
  	}

  	$$self.$$set = $$props => {
  		if ('routes' in $$props) $$invalidate(3, routes = $$props.routes);
  		if ('prefix' in $$props) $$invalidate(4, prefix = $$props.prefix);
  		if ('restoreScrollState' in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
  	};

  	$$self.$$.update = () => {
  		if ($$self.$$.dirty & /*restoreScrollState*/ 32) {
  			// Update history.scrollRestoration depending on restoreScrollState
  			history.scrollRestoration = restoreScrollState ? 'manual' : 'auto';
  		}
  	};

  	return [
  		component,
  		componentParams,
  		props,
  		routes,
  		prefix,
  		restoreScrollState,
  		routeEvent_handler,
  		routeEvent_handler_1
  	];
  }

  class Router extends SvelteComponent {
  	constructor(options) {
  		super();

  		init(this, options, instance$7, create_fragment$a, safe_not_equal, {
  			routes: 3,
  			prefix: 4,
  			restoreScrollState: 5
  		});
  	}
  }

  /* src/infrastructure/view/templates/table-view-screen/TableViewScreen.svelte generated by Svelte v3.44.3 */

  function get_each_context$1(ctx, list, i) {
  	const child_ctx = ctx.slice();
  	child_ctx[5] = list[i];
  	return child_ctx;
  }

  // (19:2) {:else}
  function create_else_block$2(ctx) {
  	let await_block_anchor;
  	let promise;
  	let current;

  	let info = {
  		ctx,
  		current: null,
  		token: null,
  		hasCatch: false,
  		pending: create_pending_block_1,
  		then: create_then_block_1,
  		catch: create_catch_block_1,
  		value: 6,
  		blocks: [,,,]
  	};

  	handle_promise(promise = /*controller*/ ctx[1].showMany(/*ids*/ ctx[0]), info);

  	return {
  		c() {
  			await_block_anchor = empty();
  			info.block.c();
  		},
  		m(target, anchor) {
  			insert(target, await_block_anchor, anchor);
  			info.block.m(target, info.anchor = anchor);
  			info.mount = () => await_block_anchor.parentNode;
  			info.anchor = await_block_anchor;
  			current = true;
  		},
  		p(new_ctx, dirty) {
  			ctx = new_ctx;
  			info.ctx = ctx;

  			if (dirty & /*ids*/ 1 && promise !== (promise = /*controller*/ ctx[1].showMany(/*ids*/ ctx[0])) && handle_promise(promise, info)) ; else {
  				update_await_block_branch(info, ctx, dirty);
  			}
  		},
  		i(local) {
  			if (current) return;
  			transition_in(info.block);
  			current = true;
  		},
  		o(local) {
  			for (let i = 0; i < 3; i += 1) {
  				const block = info.blocks[i];
  				transition_out(block);
  			}

  			current = false;
  		},
  		d(detaching) {
  			if (detaching) detach(await_block_anchor);
  			info.block.d(detaching);
  			info.token = null;
  			info = null;
  		}
  	};
  }

  // (13:29) 
  function create_if_block_1$1(ctx) {
  	let await_block_anchor;
  	let promise;
  	let current;

  	let info = {
  		ctx,
  		current: null,
  		token: null,
  		hasCatch: false,
  		pending: create_pending_block,
  		then: create_then_block,
  		catch: create_catch_block,
  		value: 5,
  		blocks: [,,,]
  	};

  	handle_promise(promise = /*controller*/ ctx[1].showComposite(/*ids*/ ctx[0][0], /*ids*/ ctx[0][1]), info);

  	return {
  		c() {
  			await_block_anchor = empty();
  			info.block.c();
  		},
  		m(target, anchor) {
  			insert(target, await_block_anchor, anchor);
  			info.block.m(target, info.anchor = anchor);
  			info.mount = () => await_block_anchor.parentNode;
  			info.anchor = await_block_anchor;
  			current = true;
  		},
  		p(new_ctx, dirty) {
  			ctx = new_ctx;
  			info.ctx = ctx;

  			if (dirty & /*ids*/ 1 && promise !== (promise = /*controller*/ ctx[1].showComposite(/*ids*/ ctx[0][0], /*ids*/ ctx[0][1])) && handle_promise(promise, info)) ; else {
  				update_await_block_branch(info, ctx, dirty);
  			}
  		},
  		i(local) {
  			if (current) return;
  			transition_in(info.block);
  			current = true;
  		},
  		o(local) {
  			for (let i = 0; i < 3; i += 1) {
  				const block = info.blocks[i];
  				transition_out(block);
  			}

  			current = false;
  		},
  		d(detaching) {
  			if (detaching) detach(await_block_anchor);
  			info.block.d(detaching);
  			info.token = null;
  			info = null;
  		}
  	};
  }

  // (11:2) {#if !ids || ids.length === 0}
  function create_if_block$2(ctx) {
  	let p;

  	return {
  		c() {
  			p = element("p");
  			p.textContent = "No antibiogram selected...";
  		},
  		m(target, anchor) {
  			insert(target, p, anchor);
  		},
  		p: noop,
  		i: noop,
  		o: noop,
  		d(detaching) {
  			if (detaching) detach(p);
  		}
  	};
  }

  // (1:0) <script lang="ts">import Antibiogram from '@/infrastructure/view/templates/antibiogram/Antibiogram.svelte'; import { getContext }
  function create_catch_block_1(ctx) {
  	return {
  		c: noop,
  		m: noop,
  		p: noop,
  		i: noop,
  		o: noop,
  		d: noop
  	};
  }

  // (22:4) {:then vms}
  function create_then_block_1(ctx) {
  	let each_1_anchor;
  	let current;
  	let each_value = /*vms*/ ctx[6];
  	let each_blocks = [];

  	for (let i = 0; i < each_value.length; i += 1) {
  		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
  	}

  	const out = i => transition_out(each_blocks[i], 1, 1, () => {
  		each_blocks[i] = null;
  	});

  	return {
  		c() {
  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].c();
  			}

  			each_1_anchor = empty();
  		},
  		m(target, anchor) {
  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].m(target, anchor);
  			}

  			insert(target, each_1_anchor, anchor);
  			current = true;
  		},
  		p(ctx, dirty) {
  			if (dirty & /*controller, ids*/ 3) {
  				each_value = /*vms*/ ctx[6];
  				let i;

  				for (i = 0; i < each_value.length; i += 1) {
  					const child_ctx = get_each_context$1(ctx, each_value, i);

  					if (each_blocks[i]) {
  						each_blocks[i].p(child_ctx, dirty);
  						transition_in(each_blocks[i], 1);
  					} else {
  						each_blocks[i] = create_each_block$1(child_ctx);
  						each_blocks[i].c();
  						transition_in(each_blocks[i], 1);
  						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
  					}
  				}

  				group_outros();

  				for (i = each_value.length; i < each_blocks.length; i += 1) {
  					out(i);
  				}

  				check_outros();
  			}
  		},
  		i(local) {
  			if (current) return;

  			for (let i = 0; i < each_value.length; i += 1) {
  				transition_in(each_blocks[i]);
  			}

  			current = true;
  		},
  		o(local) {
  			each_blocks = each_blocks.filter(Boolean);

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				transition_out(each_blocks[i]);
  			}

  			current = false;
  		},
  		d(detaching) {
  			destroy_each(each_blocks, detaching);
  			if (detaching) detach(each_1_anchor);
  		}
  	};
  }

  // (23:6) {#each vms as vm}
  function create_each_block$1(ctx) {
  	let antibiogram;
  	let current;
  	antibiogram = new Antibiogram$1({ props: { vm: /*vm*/ ctx[5] } });

  	return {
  		c() {
  			create_component(antibiogram.$$.fragment);
  		},
  		m(target, anchor) {
  			mount_component(antibiogram, target, anchor);
  			current = true;
  		},
  		p(ctx, dirty) {
  			const antibiogram_changes = {};
  			if (dirty & /*ids*/ 1) antibiogram_changes.vm = /*vm*/ ctx[5];
  			antibiogram.$set(antibiogram_changes);
  		},
  		i(local) {
  			if (current) return;
  			transition_in(antibiogram.$$.fragment, local);
  			current = true;
  		},
  		o(local) {
  			transition_out(antibiogram.$$.fragment, local);
  			current = false;
  		},
  		d(detaching) {
  			destroy_component(antibiogram, detaching);
  		}
  	};
  }

  // (20:37)        <p>Loading antibiograms</p>     {:then vms}
  function create_pending_block_1(ctx) {
  	let p;

  	return {
  		c() {
  			p = element("p");
  			p.textContent = "Loading antibiograms";
  		},
  		m(target, anchor) {
  			insert(target, p, anchor);
  		},
  		p: noop,
  		i: noop,
  		o: noop,
  		d(detaching) {
  			if (detaching) detach(p);
  		}
  	};
  }

  // (1:0) <script lang="ts">import Antibiogram from '@/infrastructure/view/templates/antibiogram/Antibiogram.svelte'; import { getContext }
  function create_catch_block(ctx) {
  	return {
  		c: noop,
  		m: noop,
  		p: noop,
  		i: noop,
  		o: noop,
  		d: noop
  	};
  }

  // (16:4) {:then vm}
  function create_then_block(ctx) {
  	let antibiogram;
  	let current;
  	antibiogram = new Antibiogram$1({ props: { vm: /*vm*/ ctx[5] } });

  	return {
  		c() {
  			create_component(antibiogram.$$.fragment);
  		},
  		m(target, anchor) {
  			mount_component(antibiogram, target, anchor);
  			current = true;
  		},
  		p(ctx, dirty) {
  			const antibiogram_changes = {};
  			if (dirty & /*ids*/ 1) antibiogram_changes.vm = /*vm*/ ctx[5];
  			antibiogram.$set(antibiogram_changes);
  		},
  		i(local) {
  			if (current) return;
  			transition_in(antibiogram.$$.fragment, local);
  			current = true;
  		},
  		o(local) {
  			transition_out(antibiogram.$$.fragment, local);
  			current = false;
  		},
  		d(detaching) {
  			destroy_component(antibiogram, detaching);
  		}
  	};
  }

  // (14:53)        <p>Loading antibiograms</p>     {:then vm}
  function create_pending_block(ctx) {
  	let p;

  	return {
  		c() {
  			p = element("p");
  			p.textContent = "Loading antibiograms";
  		},
  		m(target, anchor) {
  			insert(target, p, anchor);
  		},
  		p: noop,
  		i: noop,
  		o: noop,
  		d(detaching) {
  			if (detaching) detach(p);
  		}
  	};
  }

  function create_fragment$9(ctx) {
  	let main;
  	let current_block_type_index;
  	let if_block;
  	let current;
  	const if_block_creators = [create_if_block$2, create_if_block_1$1, create_else_block$2];
  	const if_blocks = [];

  	function select_block_type(ctx, dirty) {
  		if (!/*ids*/ ctx[0] || /*ids*/ ctx[0].length === 0) return 0;
  		if (/*ids*/ ctx[0].length === 2) return 1;
  		return 2;
  	}

  	current_block_type_index = select_block_type(ctx);
  	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

  	return {
  		c() {
  			main = element("main");
  			if_block.c();
  		},
  		m(target, anchor) {
  			insert(target, main, anchor);
  			if_blocks[current_block_type_index].m(main, null);
  			current = true;
  		},
  		p(ctx, [dirty]) {
  			let previous_block_index = current_block_type_index;
  			current_block_type_index = select_block_type(ctx);

  			if (current_block_type_index === previous_block_index) {
  				if_blocks[current_block_type_index].p(ctx, dirty);
  			} else {
  				group_outros();

  				transition_out(if_blocks[previous_block_index], 1, 1, () => {
  					if_blocks[previous_block_index] = null;
  				});

  				check_outros();
  				if_block = if_blocks[current_block_type_index];

  				if (!if_block) {
  					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  					if_block.c();
  				} else {
  					if_block.p(ctx, dirty);
  				}

  				transition_in(if_block, 1);
  				if_block.m(main, null);
  			}
  		},
  		i(local) {
  			if (current) return;
  			transition_in(if_block);
  			current = true;
  		},
  		o(local) {
  			transition_out(if_block);
  			current = false;
  		},
  		d(detaching) {
  			if (detaching) detach(main);
  			if_blocks[current_block_type_index].d();
  		}
  	};
  }

  function instance$6($$self, $$props, $$invalidate) {
  	let param;
  	let ids;
  	let $querystring;
  	component_subscribe($$self, querystring, $$value => $$invalidate(4, $querystring = $$value));
  	const params = {};
  	const controller = getContext('antibiogramController');

  	$$self.$$.update = () => {
  		if ($$self.$$.dirty & /*$querystring*/ 16) {
  			$$invalidate(3, param = new URLSearchParams($querystring).get('ids'));
  		}

  		if ($$self.$$.dirty & /*param*/ 8) {
  			$$invalidate(0, ids = param === null || param === void 0
  			? void 0
  			: param.split(','));
  		}
  	};

  	return [ids, controller, params, param, $querystring];
  }

  class TableViewScreen extends SvelteComponent {
  	constructor(options) {
  		super();
  		init(this, options, instance$6, create_fragment$9, safe_not_equal, { params: 2 });
  	}

  	get params() {
  		return this.$$.ctx[2];
  	}
  }

  /* src/infrastructure/view/templates/index-screen/Card.svelte generated by Svelte v3.44.3 */

  function create_fragment$8(ctx) {
  	let figure;
  	let div0;
  	let ion_icon0;
  	let t0;
  	let h1;
  	let t1;
  	let t2;
  	let p;
  	let t3;
  	let t4;
  	let button;
  	let t5;
  	let div1;
  	let current;
  	let mounted;
  	let dispose;
  	const default_slot_template = /*#slots*/ ctx[6].default;
  	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);

  	return {
  		c() {
  			figure = element("figure");
  			div0 = element("div");
  			ion_icon0 = element("ion-icon");
  			t0 = space();
  			h1 = element("h1");
  			t1 = text(/*title*/ ctx[0]);
  			t2 = space();
  			p = element("p");
  			t3 = text(/*subtitle*/ ctx[1]);
  			t4 = space();
  			button = element("button");
  			button.innerHTML = `<ion-icon name="chevron-up-outline" class="icon svelte-rl4ujf"></ion-icon>`;
  			t5 = space();
  			div1 = element("div");
  			if (default_slot) default_slot.c();
  			set_custom_element_data(ion_icon0, "name", "medical-outline");
  			set_custom_element_data(ion_icon0, "class", "icon thumbnail svelte-rl4ujf");
  			attr(h1, "class", "title svelte-rl4ujf");
  			attr(p, "class", "subtitle svelte-rl4ujf");
  			attr(button, "class", "toggle svelte-rl4ujf");
  			toggle_class(button, "toggle-inactive", /*bodyHidden*/ ctx[2]);
  			attr(div0, "class", "header svelte-rl4ujf");
  			attr(div1, "class", "body svelte-rl4ujf");
  			attr(figure, "class", "card svelte-rl4ujf");
  			toggle_class(figure, "body-hidden", /*bodyHidden*/ ctx[2]);
  			toggle_class(figure, "undo-transition", /*undoTransition*/ ctx[3]);
  		},
  		m(target, anchor) {
  			insert(target, figure, anchor);
  			append(figure, div0);
  			append(div0, ion_icon0);
  			append(div0, t0);
  			append(div0, h1);
  			append(h1, t1);
  			append(div0, t2);
  			append(div0, p);
  			append(p, t3);
  			append(div0, t4);
  			append(div0, button);
  			append(figure, t5);
  			append(figure, div1);

  			if (default_slot) {
  				default_slot.m(div1, null);
  			}

  			current = true;

  			if (!mounted) {
  				dispose = listen(button, "click", /*handleToggle*/ ctx[4]);
  				mounted = true;
  			}
  		},
  		p(ctx, [dirty]) {
  			if (!current || dirty & /*title*/ 1) set_data(t1, /*title*/ ctx[0]);
  			if (!current || dirty & /*subtitle*/ 2) set_data(t3, /*subtitle*/ ctx[1]);

  			if (dirty & /*bodyHidden*/ 4) {
  				toggle_class(button, "toggle-inactive", /*bodyHidden*/ ctx[2]);
  			}

  			if (default_slot) {
  				if (default_slot.p && (!current || dirty & /*$$scope*/ 32)) {
  					update_slot_base(
  						default_slot,
  						default_slot_template,
  						ctx,
  						/*$$scope*/ ctx[5],
  						!current
  						? get_all_dirty_from_scope(/*$$scope*/ ctx[5])
  						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[5], dirty, null),
  						null
  					);
  				}
  			}

  			if (dirty & /*bodyHidden*/ 4) {
  				toggle_class(figure, "body-hidden", /*bodyHidden*/ ctx[2]);
  			}

  			if (dirty & /*undoTransition*/ 8) {
  				toggle_class(figure, "undo-transition", /*undoTransition*/ ctx[3]);
  			}
  		},
  		i(local) {
  			if (current) return;
  			transition_in(default_slot, local);
  			current = true;
  		},
  		o(local) {
  			transition_out(default_slot, local);
  			current = false;
  		},
  		d(detaching) {
  			if (detaching) detach(figure);
  			if (default_slot) default_slot.d(detaching);
  			mounted = false;
  			dispose();
  		}
  	};
  }

  function instance$5($$self, $$props, $$invalidate) {
  	let { $$slots: slots = {}, $$scope } = $$props;
  	let { title } = $$props;
  	let { subtitle } = $$props;
  	let bodyHidden = false;
  	let undoTransition = false;

  	const handleToggle = () => {
  		$$invalidate(2, bodyHidden = !bodyHidden);

  		if (!bodyHidden) {
  			$$invalidate(3, undoTransition = true);
  			setTimeout(() => $$invalidate(3, undoTransition = false), 400);
  		} else {
  			$$invalidate(3, undoTransition = false);
  		}
  	};

  	$$self.$$set = $$props => {
  		if ('title' in $$props) $$invalidate(0, title = $$props.title);
  		if ('subtitle' in $$props) $$invalidate(1, subtitle = $$props.subtitle);
  		if ('$$scope' in $$props) $$invalidate(5, $$scope = $$props.$$scope);
  	};

  	return [title, subtitle, bodyHidden, undoTransition, handleToggle, $$scope, slots];
  }

  class Card extends SvelteComponent {
  	constructor(options) {
  		super();
  		init(this, options, instance$5, create_fragment$8, safe_not_equal, { title: 0, subtitle: 1 });
  	}
  }

  /* src/infrastructure/view/templates/index-screen/List.svelte generated by Svelte v3.44.3 */

  function create_fragment$7(ctx) {
  	let ul;
  	let current;
  	const default_slot_template = /*#slots*/ ctx[1].default;
  	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

  	return {
  		c() {
  			ul = element("ul");
  			if (default_slot) default_slot.c();
  			attr(ul, "class", "list svelte-12a3vld");
  		},
  		m(target, anchor) {
  			insert(target, ul, anchor);

  			if (default_slot) {
  				default_slot.m(ul, null);
  			}

  			current = true;
  		},
  		p(ctx, [dirty]) {
  			if (default_slot) {
  				if (default_slot.p && (!current || dirty & /*$$scope*/ 1)) {
  					update_slot_base(
  						default_slot,
  						default_slot_template,
  						ctx,
  						/*$$scope*/ ctx[0],
  						!current
  						? get_all_dirty_from_scope(/*$$scope*/ ctx[0])
  						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[0], dirty, null),
  						null
  					);
  				}
  			}
  		},
  		i(local) {
  			if (current) return;
  			transition_in(default_slot, local);
  			current = true;
  		},
  		o(local) {
  			transition_out(default_slot, local);
  			current = false;
  		},
  		d(detaching) {
  			if (detaching) detach(ul);
  			if (default_slot) default_slot.d(detaching);
  		}
  	};
  }

  function instance$4($$self, $$props, $$invalidate) {
  	let { $$slots: slots = {}, $$scope } = $$props;

  	$$self.$$set = $$props => {
  		if ('$$scope' in $$props) $$invalidate(0, $$scope = $$props.$$scope);
  	};

  	return [$$scope, slots];
  }

  class List extends SvelteComponent {
  	constructor(options) {
  		super();
  		init(this, options, instance$4, create_fragment$7, safe_not_equal, {});
  	}
  }

  /* src/infrastructure/view/templates/index-screen/ListItem.svelte generated by Svelte v3.44.3 */

  function create_fragment$6(ctx) {
  	let li;
  	let ion_icon;
  	let t0;
  	let div;
  	let h2;
  	let t1;
  	let t2;
  	let p;
  	let t3;

  	return {
  		c() {
  			li = element("li");
  			ion_icon = element("ion-icon");
  			t0 = space();
  			div = element("div");
  			h2 = element("h2");
  			t1 = text(/*title*/ ctx[0]);
  			t2 = space();
  			p = element("p");
  			t3 = text(/*subtitle*/ ctx[1]);
  			set_custom_element_data(ion_icon, "name", "file-tray-full-outline");
  			set_custom_element_data(ion_icon, "class", "icon svelte-lr7xpq");
  			attr(h2, "class", "title svelte-lr7xpq");
  			attr(p, "class", "subtitle svelte-lr7xpq");
  			attr(div, "class", "label svelte-lr7xpq");
  			attr(li, "class", "item svelte-lr7xpq");
  		},
  		m(target, anchor) {
  			insert(target, li, anchor);
  			append(li, ion_icon);
  			append(li, t0);
  			append(li, div);
  			append(div, h2);
  			append(h2, t1);
  			append(div, t2);
  			append(div, p);
  			append(p, t3);
  		},
  		p(ctx, [dirty]) {
  			if (dirty & /*title*/ 1) set_data(t1, /*title*/ ctx[0]);
  			if (dirty & /*subtitle*/ 2) set_data(t3, /*subtitle*/ ctx[1]);
  		},
  		i: noop,
  		o: noop,
  		d(detaching) {
  			if (detaching) detach(li);
  		}
  	};
  }

  function instance$3($$self, $$props, $$invalidate) {
  	let { title } = $$props;
  	let { subtitle } = $$props;

  	$$self.$$set = $$props => {
  		if ('title' in $$props) $$invalidate(0, title = $$props.title);
  		if ('subtitle' in $$props) $$invalidate(1, subtitle = $$props.subtitle);
  	};

  	return [title, subtitle];
  }

  class ListItem extends SvelteComponent {
  	constructor(options) {
  		super();
  		init(this, options, instance$3, create_fragment$6, safe_not_equal, { title: 0, subtitle: 1 });
  	}
  }

  /* src/infrastructure/view/templates/index-screen/IndexScreen.svelte generated by Svelte v3.44.3 */

  function get_each_context(ctx, list, i) {
  	const child_ctx = ctx.slice();
  	child_ctx[2] = list[i].place;
  	child_ctx[3] = list[i].intervals;
  	return child_ctx;
  }

  function get_each_context_1(ctx, list, i) {
  	const child_ctx = ctx.slice();
  	child_ctx[6] = list[i].interval;
  	child_ctx[7] = list[i].groups;
  	return child_ctx;
  }

  function get_each_context_2(ctx, list, i) {
  	const child_ctx = ctx.slice();
  	child_ctx[10] = list[i].title;
  	child_ctx[11] = list[i].antibiograms;
  	return child_ctx;
  }

  // (14:2) {:else}
  function create_else_block$1(ctx) {
  	let ul;
  	let current;
  	let each_value = /*vm*/ ctx[0];
  	let each_blocks = [];

  	for (let i = 0; i < each_value.length; i += 1) {
  		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
  	}

  	const out = i => transition_out(each_blocks[i], 1, 1, () => {
  		each_blocks[i] = null;
  	});

  	return {
  		c() {
  			ul = element("ul");

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].c();
  			}

  			attr(ul, "class", "institution-list svelte-evzpiz");
  		},
  		m(target, anchor) {
  			insert(target, ul, anchor);

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].m(ul, null);
  			}

  			current = true;
  		},
  		p(ctx, dirty) {
  			if (dirty & /*vm*/ 1) {
  				each_value = /*vm*/ ctx[0];
  				let i;

  				for (i = 0; i < each_value.length; i += 1) {
  					const child_ctx = get_each_context(ctx, each_value, i);

  					if (each_blocks[i]) {
  						each_blocks[i].p(child_ctx, dirty);
  						transition_in(each_blocks[i], 1);
  					} else {
  						each_blocks[i] = create_each_block(child_ctx);
  						each_blocks[i].c();
  						transition_in(each_blocks[i], 1);
  						each_blocks[i].m(ul, null);
  					}
  				}

  				group_outros();

  				for (i = each_value.length; i < each_blocks.length; i += 1) {
  					out(i);
  				}

  				check_outros();
  			}
  		},
  		i(local) {
  			if (current) return;

  			for (let i = 0; i < each_value.length; i += 1) {
  				transition_in(each_blocks[i]);
  			}

  			current = true;
  		},
  		o(local) {
  			each_blocks = each_blocks.filter(Boolean);

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				transition_out(each_blocks[i]);
  			}

  			current = false;
  		},
  		d(detaching) {
  			if (detaching) detach(ul);
  			destroy_each(each_blocks, detaching);
  		}
  	};
  }

  // (12:2) {#if vm.length === 0}
  function create_if_block$1(ctx) {
  	let p;

  	return {
  		c() {
  			p = element("p");
  			p.textContent = "No results yet...";
  		},
  		m(target, anchor) {
  			insert(target, p, anchor);
  		},
  		p: noop,
  		i: noop,
  		o: noop,
  		d(detaching) {
  			if (detaching) detach(p);
  		}
  	};
  }

  // (24:16) {#each groups as { title, antibiograms }}
  function create_each_block_2(ctx) {
  	let a;
  	let listitem;
  	let t;
  	let a_href_value;
  	let current;
  	let mounted;
  	let dispose;

  	listitem = new ListItem({
  			props: {
  				title: /*title*/ ctx[10],
  				subtitle: /*interval*/ ctx[6]
  			}
  		});

  	return {
  		c() {
  			a = element("a");
  			create_component(listitem.$$.fragment);
  			t = space();
  			attr(a, "href", a_href_value = '/antibiogram?ids=' + /*antibiograms*/ ctx[11].map(func).join(','));
  			attr(a, "class", "link svelte-evzpiz");
  		},
  		m(target, anchor) {
  			insert(target, a, anchor);
  			mount_component(listitem, a, null);
  			append(a, t);
  			current = true;

  			if (!mounted) {
  				dispose = action_destroyer(link.call(null, a));
  				mounted = true;
  			}
  		},
  		p(ctx, dirty) {
  			const listitem_changes = {};
  			if (dirty & /*vm*/ 1) listitem_changes.title = /*title*/ ctx[10];
  			if (dirty & /*vm*/ 1) listitem_changes.subtitle = /*interval*/ ctx[6];
  			listitem.$set(listitem_changes);

  			if (!current || dirty & /*vm*/ 1 && a_href_value !== (a_href_value = '/antibiogram?ids=' + /*antibiograms*/ ctx[11].map(func).join(','))) {
  				attr(a, "href", a_href_value);
  			}
  		},
  		i(local) {
  			if (current) return;
  			transition_in(listitem.$$.fragment, local);
  			current = true;
  		},
  		o(local) {
  			transition_out(listitem.$$.fragment, local);
  			current = false;
  		},
  		d(detaching) {
  			if (detaching) detach(a);
  			destroy_component(listitem);
  			mounted = false;
  			dispose();
  		}
  	};
  }

  // (23:14) {#each intervals as { interval, groups }}
  function create_each_block_1(ctx) {
  	let each_1_anchor;
  	let current;
  	let each_value_2 = /*groups*/ ctx[7];
  	let each_blocks = [];

  	for (let i = 0; i < each_value_2.length; i += 1) {
  		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
  	}

  	const out = i => transition_out(each_blocks[i], 1, 1, () => {
  		each_blocks[i] = null;
  	});

  	return {
  		c() {
  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].c();
  			}

  			each_1_anchor = empty();
  		},
  		m(target, anchor) {
  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].m(target, anchor);
  			}

  			insert(target, each_1_anchor, anchor);
  			current = true;
  		},
  		p(ctx, dirty) {
  			if (dirty & /*vm*/ 1) {
  				each_value_2 = /*groups*/ ctx[7];
  				let i;

  				for (i = 0; i < each_value_2.length; i += 1) {
  					const child_ctx = get_each_context_2(ctx, each_value_2, i);

  					if (each_blocks[i]) {
  						each_blocks[i].p(child_ctx, dirty);
  						transition_in(each_blocks[i], 1);
  					} else {
  						each_blocks[i] = create_each_block_2(child_ctx);
  						each_blocks[i].c();
  						transition_in(each_blocks[i], 1);
  						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
  					}
  				}

  				group_outros();

  				for (i = each_value_2.length; i < each_blocks.length; i += 1) {
  					out(i);
  				}

  				check_outros();
  			}
  		},
  		i(local) {
  			if (current) return;

  			for (let i = 0; i < each_value_2.length; i += 1) {
  				transition_in(each_blocks[i]);
  			}

  			current = true;
  		},
  		o(local) {
  			each_blocks = each_blocks.filter(Boolean);

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				transition_out(each_blocks[i]);
  			}

  			current = false;
  		},
  		d(detaching) {
  			destroy_each(each_blocks, detaching);
  			if (detaching) detach(each_1_anchor);
  		}
  	};
  }

  // (22:12) <List>
  function create_default_slot_1(ctx) {
  	let each_1_anchor;
  	let current;
  	let each_value_1 = /*intervals*/ ctx[3];
  	let each_blocks = [];

  	for (let i = 0; i < each_value_1.length; i += 1) {
  		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
  	}

  	const out = i => transition_out(each_blocks[i], 1, 1, () => {
  		each_blocks[i] = null;
  	});

  	return {
  		c() {
  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].c();
  			}

  			each_1_anchor = empty();
  		},
  		m(target, anchor) {
  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].m(target, anchor);
  			}

  			insert(target, each_1_anchor, anchor);
  			current = true;
  		},
  		p(ctx, dirty) {
  			if (dirty & /*vm*/ 1) {
  				each_value_1 = /*intervals*/ ctx[3];
  				let i;

  				for (i = 0; i < each_value_1.length; i += 1) {
  					const child_ctx = get_each_context_1(ctx, each_value_1, i);

  					if (each_blocks[i]) {
  						each_blocks[i].p(child_ctx, dirty);
  						transition_in(each_blocks[i], 1);
  					} else {
  						each_blocks[i] = create_each_block_1(child_ctx);
  						each_blocks[i].c();
  						transition_in(each_blocks[i], 1);
  						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
  					}
  				}

  				group_outros();

  				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
  					out(i);
  				}

  				check_outros();
  			}
  		},
  		i(local) {
  			if (current) return;

  			for (let i = 0; i < each_value_1.length; i += 1) {
  				transition_in(each_blocks[i]);
  			}

  			current = true;
  		},
  		o(local) {
  			each_blocks = each_blocks.filter(Boolean);

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				transition_out(each_blocks[i]);
  			}

  			current = false;
  		},
  		d(detaching) {
  			destroy_each(each_blocks, detaching);
  			if (detaching) detach(each_1_anchor);
  		}
  	};
  }

  // (18:10) <Card             title={place.split(' \u2212 ').shift() ?? ''}             subtitle={place.split(' \u2212 ').pop() ?? ''}           >
  function create_default_slot(ctx) {
  	let list;
  	let current;

  	list = new List({
  			props: {
  				$$slots: { default: [create_default_slot_1] },
  				$$scope: { ctx }
  			}
  		});

  	return {
  		c() {
  			create_component(list.$$.fragment);
  		},
  		m(target, anchor) {
  			mount_component(list, target, anchor);
  			current = true;
  		},
  		p(ctx, dirty) {
  			const list_changes = {};

  			if (dirty & /*$$scope, vm*/ 16385) {
  				list_changes.$$scope = { dirty, ctx };
  			}

  			list.$set(list_changes);
  		},
  		i(local) {
  			if (current) return;
  			transition_in(list.$$.fragment, local);
  			current = true;
  		},
  		o(local) {
  			transition_out(list.$$.fragment, local);
  			current = false;
  		},
  		d(detaching) {
  			destroy_component(list, detaching);
  		}
  	};
  }

  // (16:6) {#each vm as { place, intervals }}
  function create_each_block(ctx) {
  	let li;
  	let card;
  	let t;
  	let current;

  	card = new Card({
  			props: {
  				title: /*place*/ ctx[2].split(' \u2212 ').shift() ?? '',
  				subtitle: /*place*/ ctx[2].split(' \u2212 ').pop() ?? '',
  				$$slots: { default: [create_default_slot] },
  				$$scope: { ctx }
  			}
  		});

  	return {
  		c() {
  			li = element("li");
  			create_component(card.$$.fragment);
  			t = space();
  			attr(li, "class", "institution-card");
  		},
  		m(target, anchor) {
  			insert(target, li, anchor);
  			mount_component(card, li, null);
  			append(li, t);
  			current = true;
  		},
  		p(ctx, dirty) {
  			const card_changes = {};
  			if (dirty & /*vm*/ 1) card_changes.title = /*place*/ ctx[2].split(' \u2212 ').shift() ?? '';
  			if (dirty & /*vm*/ 1) card_changes.subtitle = /*place*/ ctx[2].split(' \u2212 ').pop() ?? '';

  			if (dirty & /*$$scope, vm*/ 16385) {
  				card_changes.$$scope = { dirty, ctx };
  			}

  			card.$set(card_changes);
  		},
  		i(local) {
  			if (current) return;
  			transition_in(card.$$.fragment, local);
  			current = true;
  		},
  		o(local) {
  			transition_out(card.$$.fragment, local);
  			current = false;
  		},
  		d(detaching) {
  			if (detaching) detach(li);
  			destroy_component(card);
  		}
  	};
  }

  function create_fragment$5(ctx) {
  	let main;
  	let current_block_type_index;
  	let if_block;
  	let current;
  	const if_block_creators = [create_if_block$1, create_else_block$1];
  	const if_blocks = [];

  	function select_block_type(ctx, dirty) {
  		if (/*vm*/ ctx[0].length === 0) return 0;
  		return 1;
  	}

  	current_block_type_index = select_block_type(ctx);
  	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

  	return {
  		c() {
  			main = element("main");
  			if_block.c();
  		},
  		m(target, anchor) {
  			insert(target, main, anchor);
  			if_blocks[current_block_type_index].m(main, null);
  			current = true;
  		},
  		p(ctx, [dirty]) {
  			let previous_block_index = current_block_type_index;
  			current_block_type_index = select_block_type(ctx);

  			if (current_block_type_index === previous_block_index) {
  				if_blocks[current_block_type_index].p(ctx, dirty);
  			} else {
  				group_outros();

  				transition_out(if_blocks[previous_block_index], 1, 1, () => {
  					if_blocks[previous_block_index] = null;
  				});

  				check_outros();
  				if_block = if_blocks[current_block_type_index];

  				if (!if_block) {
  					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  					if_block.c();
  				} else {
  					if_block.p(ctx, dirty);
  				}

  				transition_in(if_block, 1);
  				if_block.m(main, null);
  			}
  		},
  		i(local) {
  			if (current) return;
  			transition_in(if_block);
  			current = true;
  		},
  		o(local) {
  			transition_out(if_block);
  			current = false;
  		},
  		d(detaching) {
  			if (detaching) detach(main);
  			if_blocks[current_block_type_index].d();
  		}
  	};
  }

  const func = a => a.id;

  function instance$2($$self, $$props, $$invalidate) {
  	const groupController = getContext('antibiogramGroupController');
  	let vm = [];
  	groupController.index().then(res => res !== null && $$invalidate(0, vm = res));
  	return [vm];
  }

  class IndexScreen extends SvelteComponent {
  	constructor(options) {
  		super();
  		init(this, options, instance$2, create_fragment$5, safe_not_equal, {});
  	}
  }

  /* src/infrastructure/view/templates/not-found-screen/NotFoundScreen.svelte generated by Svelte v3.44.3 */

  function create_fragment$4(ctx) {
  	let main;
  	let h1;
  	let t0;
  	let t1;
  	let t2;
  	let br;
  	let t3;
  	let p;
  	let a;
  	let mounted;
  	let dispose;

  	return {
  		c() {
  			main = element("main");
  			h1 = element("h1");
  			t0 = text("Sorry we couldn't find ");
  			t1 = text(/*$location*/ ctx[0]);
  			t2 = space();
  			br = element("br");
  			t3 = space();
  			p = element("p");
  			a = element("a");
  			a.textContent = "Click here to go to homepage";
  			attr(h1, "class", "title svelte-x279wo");
  			attr(a, "href", "/");
  			attr(main, "class", "container svelte-x279wo");
  		},
  		m(target, anchor) {
  			insert(target, main, anchor);
  			append(main, h1);
  			append(h1, t0);
  			append(h1, t1);
  			append(main, t2);
  			append(main, br);
  			append(main, t3);
  			append(main, p);
  			append(p, a);

  			if (!mounted) {
  				dispose = action_destroyer(link.call(null, a));
  				mounted = true;
  			}
  		},
  		p(ctx, [dirty]) {
  			if (dirty & /*$location*/ 1) set_data(t1, /*$location*/ ctx[0]);
  		},
  		i: noop,
  		o: noop,
  		d(detaching) {
  			if (detaching) detach(main);
  			mounted = false;
  			dispose();
  		}
  	};
  }

  function instance$1($$self, $$props, $$invalidate) {
  	let $location;
  	component_subscribe($$self, location, $$value => $$invalidate(0, $location = $$value));
  	return [$location];
  }

  class NotFoundScreen extends SvelteComponent {
  	constructor(options) {
  		super();
  		init(this, options, instance$1, create_fragment$4, safe_not_equal, {});
  	}
  }

  const routes = {
    // Exact path
    '/': IndexScreen,

    // Using named parameters, with last being optional
    '/antibiogram': TableViewScreen,

    // Catch-all
    // This is optional, but if present it must be the last
    '*': NotFoundScreen,
  };

  /* src/infrastructure/view/templates/General information/About.svelte generated by Svelte v3.44.3 */

  function create_fragment$3(ctx) {
  	let span;

  	return {
  		c() {
  			span = element("span");
  			span.textContent = "This application is currently under development by medical students Sam Chen\n  and Andrew Goldmann under the direction of Dr. Joshua Steinberg";
  		},
  		m(target, anchor) {
  			insert(target, span, anchor);
  		},
  		p: noop,
  		i: noop,
  		o: noop,
  		d(detaching) {
  			if (detaching) detach(span);
  		}
  	};
  }

  class About extends SvelteComponent {
  	constructor(options) {
  		super();
  		init(this, options, null, create_fragment$3, safe_not_equal, {});
  	}
  }

  /* src/infrastructure/view/templates/General information/Disclaimer.svelte generated by Svelte v3.44.3 */

  function create_fragment$2(ctx) {
  	let span;

  	return {
  		c() {
  			span = element("span");
  			span.textContent = "Dear Colleague, Please note carefully that these antibiograms only reflect the\n  testing results for the year and locales noted. You have to know how to\n  interpret the data here and you have to know how to use antibiogram\n  information when making clinical care decisions. This app is no substitute for\n  knowledge, training, and experience treating infections. The app is merely a\n  quick reference for commonly used information to assist local clinicians.\n  Remember, always do your own thinking.";
  		},
  		m(target, anchor) {
  			insert(target, span, anchor);
  		},
  		p: noop,
  		i: noop,
  		o: noop,
  		d(detaching) {
  			if (detaching) detach(span);
  		}
  	};
  }

  class Disclaimer extends SvelteComponent {
  	constructor(options) {
  		super();
  		init(this, options, null, create_fragment$2, safe_not_equal, {});
  	}
  }

  /* src/infrastructure/view/templates/navigation/Navigation.svelte generated by Svelte v3.44.3 */

  function create_if_block_3(ctx) {
  	let a;
  	let link_action;
  	let mounted;
  	let dispose;

  	return {
  		c() {
  			a = element("a");
  			a.innerHTML = `<ion-icon name="arrow-back-outline"></ion-icon>`;
  			attr(a, "class", "back svelte-m4nghh");
  			attr(a, "href", "/");
  		},
  		m(target, anchor) {
  			insert(target, a, anchor);

  			if (!mounted) {
  				dispose = action_destroyer(link_action = link.call(null, a));
  				mounted = true;
  			}
  		},
  		d(detaching) {
  			if (detaching) detach(a);
  			mounted = false;
  			dispose();
  		}
  	};
  }

  // (32:4) {:else}
  function create_else_block(ctx) {
  	let t0_value = /*vm*/ ctx[1].institution + "";
  	let t0;
  	let t1;
  	let t2_value = /*vm*/ ctx[1].info + "";
  	let t2;

  	return {
  		c() {
  			t0 = text(t0_value);
  			t1 = space();
  			t2 = text(t2_value);
  		},
  		m(target, anchor) {
  			insert(target, t0, anchor);
  			insert(target, t1, anchor);
  			insert(target, t2, anchor);
  		},
  		p(ctx, dirty) {
  			if (dirty & /*vm*/ 2 && t0_value !== (t0_value = /*vm*/ ctx[1].institution + "")) set_data(t0, t0_value);
  			if (dirty & /*vm*/ 2 && t2_value !== (t2_value = /*vm*/ ctx[1].info + "")) set_data(t2, t2_value);
  		},
  		d(detaching) {
  			if (detaching) detach(t0);
  			if (detaching) detach(t1);
  			if (detaching) detach(t2);
  		}
  	};
  }

  // (30:26) 
  function create_if_block_2(ctx) {
  	let t;

  	return {
  		c() {
  			t = text("Retrieving...");
  		},
  		m(target, anchor) {
  			insert(target, t, anchor);
  		},
  		p: noop,
  		d(detaching) {
  			if (detaching) detach(t);
  		}
  	};
  }

  // (28:27) 
  function create_if_block_1(ctx) {
  	let t;

  	return {
  		c() {
  			t = text("Not Found");
  		},
  		m(target, anchor) {
  			insert(target, t, anchor);
  		},
  		p: noop,
  		d(detaching) {
  			if (detaching) detach(t);
  		}
  	};
  }

  // (26:4) {#if onHomePage}
  function create_if_block(ctx) {
  	let t;

  	return {
  		c() {
  			t = text("Available Antibiograms");
  		},
  		m(target, anchor) {
  			insert(target, t, anchor);
  		},
  		p: noop,
  		d(detaching) {
  			if (detaching) detach(t);
  		}
  	};
  }

  function create_fragment$1(ctx) {
  	let nav;
  	let t0;
  	let h1;
  	let t1;
  	let button;
  	let t2;
  	let ul;
  	let li0;
  	let t4;
  	let li1;
  	let about;
  	let t5;
  	let li2;
  	let t7;
  	let li3;
  	let disclaimer;
  	let current;
  	let mounted;
  	let dispose;
  	let if_block0 = !/*onHomePage*/ ctx[5] && create_if_block_3();

  	function select_block_type(ctx, dirty) {
  		if (/*onHomePage*/ ctx[5]) return create_if_block;
  		if (!/*onTablePage*/ ctx[0]) return create_if_block_1;
  		if (/*vm*/ ctx[1] === null) return create_if_block_2;
  		return create_else_block;
  	}

  	let current_block_type = select_block_type(ctx);
  	let if_block1 = current_block_type(ctx);
  	about = new About({});
  	disclaimer = new Disclaimer({});

  	return {
  		c() {
  			nav = element("nav");
  			if (if_block0) if_block0.c();
  			t0 = space();
  			h1 = element("h1");
  			if_block1.c();
  			t1 = space();
  			button = element("button");
  			button.innerHTML = `<ion-icon name="ellipsis-vertical"></ion-icon>`;
  			t2 = space();
  			ul = element("ul");
  			li0 = element("li");
  			li0.textContent = "About";
  			t4 = space();
  			li1 = element("li");
  			create_component(about.$$.fragment);
  			t5 = space();
  			li2 = element("li");
  			li2.textContent = "Disclaimer";
  			t7 = space();
  			li3 = element("li");
  			create_component(disclaimer.$$.fragment);
  			attr(h1, "class", "title svelte-m4nghh");
  			attr(button, "class", "nav-menu-toggle svelte-m4nghh");
  			attr(li0, "class", "nav-link svelte-m4nghh");
  			attr(li1, "class", "nav-link svelte-m4nghh");
  			toggle_class(li1, "info-about--hidden", /*infoAboutHidden*/ ctx[3]);
  			attr(li2, "class", "nav-link svelte-m4nghh");
  			attr(li3, "class", "nav-link svelte-m4nghh");
  			toggle_class(li3, "info-disclaimer--hidden", /*infoDisclaimerHidden*/ ctx[4]);
  			attr(ul, "class", "nav-link-list svelte-m4nghh");
  			toggle_class(ul, "nav-link-list--hidden", /*navMenuHidden*/ ctx[2]);
  			attr(nav, "class", "svelte-m4nghh");
  		},
  		m(target, anchor) {
  			insert(target, nav, anchor);
  			if (if_block0) if_block0.m(nav, null);
  			append(nav, t0);
  			append(nav, h1);
  			if_block1.m(h1, null);
  			append(nav, t1);
  			append(nav, button);
  			append(nav, t2);
  			append(nav, ul);
  			append(ul, li0);
  			append(ul, t4);
  			append(ul, li1);
  			mount_component(about, li1, null);
  			append(ul, t5);
  			append(ul, li2);
  			append(ul, t7);
  			append(ul, li3);
  			mount_component(disclaimer, li3, null);
  			current = true;

  			if (!mounted) {
  				dispose = [
  					listen(button, "click", /*click_handler*/ ctx[11]),
  					listen(li0, "click", /*click_handler_1*/ ctx[12]),
  					listen(li2, "click", /*click_handler_2*/ ctx[13])
  				];

  				mounted = true;
  			}
  		},
  		p(ctx, [dirty]) {
  			if (!/*onHomePage*/ ctx[5]) {
  				if (if_block0) ; else {
  					if_block0 = create_if_block_3();
  					if_block0.c();
  					if_block0.m(nav, t0);
  				}
  			} else if (if_block0) {
  				if_block0.d(1);
  				if_block0 = null;
  			}

  			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block1) {
  				if_block1.p(ctx, dirty);
  			} else {
  				if_block1.d(1);
  				if_block1 = current_block_type(ctx);

  				if (if_block1) {
  					if_block1.c();
  					if_block1.m(h1, null);
  				}
  			}

  			if (dirty & /*infoAboutHidden*/ 8) {
  				toggle_class(li1, "info-about--hidden", /*infoAboutHidden*/ ctx[3]);
  			}

  			if (dirty & /*infoDisclaimerHidden*/ 16) {
  				toggle_class(li3, "info-disclaimer--hidden", /*infoDisclaimerHidden*/ ctx[4]);
  			}

  			if (dirty & /*navMenuHidden*/ 4) {
  				toggle_class(ul, "nav-link-list--hidden", /*navMenuHidden*/ ctx[2]);
  			}
  		},
  		i(local) {
  			if (current) return;
  			transition_in(about.$$.fragment, local);
  			transition_in(disclaimer.$$.fragment, local);
  			current = true;
  		},
  		o(local) {
  			transition_out(about.$$.fragment, local);
  			transition_out(disclaimer.$$.fragment, local);
  			current = false;
  		},
  		d(detaching) {
  			if (detaching) detach(nav);
  			if (if_block0) if_block0.d();
  			if_block1.d();
  			destroy_component(about);
  			destroy_component(disclaimer);
  			mounted = false;
  			run_all(dispose);
  		}
  	};
  }

  function instance($$self, $$props, $$invalidate) {
  	let onHomePage;
  	let onTablePage;
  	let abgIds;
  	let $querystring;
  	let $location;
  	component_subscribe($$self, querystring, $$value => $$invalidate(9, $querystring = $$value));
  	component_subscribe($$self, location, $$value => $$invalidate(10, $location = $$value));
  	var _a, _b;
  	let vm = null;
  	const controller = getContext('antibiogramController');
  	let navMenuHidden = true;
  	let infoAboutHidden = true;
  	let infoDisclaimerHidden = true;
  	const click_handler = () => $$invalidate(2, navMenuHidden = !navMenuHidden);
  	const click_handler_1 = () => $$invalidate(3, infoAboutHidden = !infoAboutHidden);
  	const click_handler_2 = () => $$invalidate(4, infoDisclaimerHidden = !infoDisclaimerHidden);

  	$$self.$$.update = () => {
  		if ($$self.$$.dirty & /*$location*/ 1024) {
  			$$invalidate(5, onHomePage = $location === '/');
  		}

  		if ($$self.$$.dirty & /*$location*/ 1024) {
  			$$invalidate(0, onTablePage = $location === '/antibiogram');
  		}

  		if ($$self.$$.dirty & /*onTablePage, $querystring, _a, _b*/ 705) {
  			$$invalidate(8, abgIds = onTablePage
  			? $$invalidate(7, _b = $$invalidate(6, _a = new URLSearchParams($querystring).get('ids')) === null || _a === void 0
  				? void 0
  				: _a.split(',')) !== null && _b !== void 0
  				? _b
  				: null
  			: null);
  		}

  		if ($$self.$$.dirty & /*abgIds*/ 256) {
  			abgIds !== null && controller.show(abgIds[0]).then(abg => $$invalidate(1, vm = abg));
  		}
  	};

  	return [
  		onTablePage,
  		vm,
  		navMenuHidden,
  		infoAboutHidden,
  		infoDisclaimerHidden,
  		onHomePage,
  		_a,
  		_b,
  		abgIds,
  		$querystring,
  		$location,
  		click_handler,
  		click_handler_1,
  		click_handler_2
  	];
  }

  class Navigation extends SvelteComponent {
  	constructor(options) {
  		super();
  		init(this, options, instance, create_fragment$1, safe_not_equal, {});
  	}
  }

  /* src/infrastructure/view/templates/App.svelte generated by Svelte v3.44.3 */

  function create_fragment(ctx) {
  	let navigation;
  	let t;
  	let router;
  	let current;
  	navigation = new Navigation({});
  	router = new Router({ props: { routes } });

  	return {
  		c() {
  			create_component(navigation.$$.fragment);
  			t = space();
  			create_component(router.$$.fragment);
  		},
  		m(target, anchor) {
  			mount_component(navigation, target, anchor);
  			insert(target, t, anchor);
  			mount_component(router, target, anchor);
  			current = true;
  		},
  		p: noop,
  		i(local) {
  			if (current) return;
  			transition_in(navigation.$$.fragment, local);
  			transition_in(router.$$.fragment, local);
  			current = true;
  		},
  		o(local) {
  			transition_out(navigation.$$.fragment, local);
  			transition_out(router.$$.fragment, local);
  			current = false;
  		},
  		d(detaching) {
  			destroy_component(navigation, detaching);
  			if (detaching) detach(t);
  			destroy_component(router, detaching);
  		}
  	};
  }

  class App extends SvelteComponent {
  	constructor(options) {
  		super();
  		init(this, options, null, create_fragment, safe_not_equal, {});
  	}
  }

  const svelte = (antibiogramController, antibiogramGroupController) => {
      return new App({
          target: document.body,
          context: new Map([
              ['antibiogramController', antibiogramController],
              ['antibiogramGroupController', antibiogramGroupController],
          ]),
      });
  };

  /*! *****************************************************************************
  Copyright (c) Microsoft Corporation.

  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted.

  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.
  ***************************************************************************** */

  function __awaiter(thisArg, _arguments, P, generator) {
      function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
      return new (P || (P = Promise))(function (resolve, reject) {
          function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
          function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
          function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
  }

  function __classPrivateFieldGet(receiver, state, kind, f) {
      if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
      if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
      return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
  }

  function __classPrivateFieldSet(receiver, state, value, kind, f) {
      if (kind === "m") throw new TypeError("Private method is not writable");
      if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
      if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
      return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
  }

  class Entity {
      constructor(id) {
          this.id = id;
      }
      is(e) {
          const { constructor } = Object.getPrototypeOf(e);
          if (!(this instanceof constructor))
              return false;
          return this.id.is(e.id);
      }
      static filterUniqueEntity(arr) {
          const memo = new Set();
          const isUnique = (e) => memo.has(e.id.getValue()) ? false : memo.add(e.id.getValue());
          return arr.filter(isUnique);
      }
  }

  class ValueObject {
      is(v) {
          const { constructor } = Object.getPrototypeOf(v);
          if (!(this instanceof constructor))
              return false;
          return this.isIdentical(v);
      }
      static filterUniqueValues(arr) {
          const uniqueValues = [];
          for (const val of arr) {
              const match = uniqueValues.find((v) => v.isIdentical(val));
              const seen = !(typeof match === 'undefined');
              if (seen)
                  continue;
              uniqueValues.push(val);
          }
          return uniqueValues;
      }
  }

  class GramValue extends ValueObject {
      isIdentical() {
          return true;
      }
  }

  class GramPositive extends GramValue {
      toString() {
          return 'Gram Positive';
      }
  }

  class GramNegative extends GramValue {
      toString() {
          return 'Gram Negative';
      }
  }

  class Unspecified extends GramValue {
      toString() {
          return 'Gram Positive and Negative';
      }
  }

  const GramValues = {
      get POSITIVE() {
          return new GramPositive();
      },
      get NEGATIVE() {
          return new GramNegative();
      },
      get UNSPECIFIED() {
          return new Unspecified();
      },
  };

  var _SampleInfo_instances, _SampleInfo_itemsByType, _SampleInfo_itemsByConstructor, _SampleInfo_hasSameKeys;
  class SampleInfo extends ValueObject {
      constructor(items) {
          super();
          _SampleInfo_instances.add(this);
          _SampleInfo_itemsByType.set(this, void 0);
          _SampleInfo_itemsByConstructor.set(this, void 0);
          __classPrivateFieldSet(this, _SampleInfo_itemsByType, items.reduce((a, v) => a.set(v.getType(), v), new Map()), "f");
          __classPrivateFieldSet(this, _SampleInfo_itemsByConstructor, items.reduce((a, v) => a.set(Object.getPrototypeOf(v).constructor, v), new Map()), "f");
      }
      getItems() {
          return __classPrivateFieldGet(this, _SampleInfo_itemsByType, "f");
      }
      itemsToArray() {
          return [...__classPrivateFieldGet(this, _SampleInfo_itemsByType, "f").values()];
      }
      getItem(type) {
          if (typeof type === 'string')
              return __classPrivateFieldGet(this, _SampleInfo_itemsByType, "f").get(type);
          return __classPrivateFieldGet(this, _SampleInfo_itemsByConstructor, "f").get(type);
      }
      hasItem(value) {
          const type = value.getType();
          const ourValue = __classPrivateFieldGet(this, _SampleInfo_itemsByType, "f").get(type);
          if (!ourValue)
              return false;
          return ourValue.is(value);
      }
      intersect(info) {
          const common = info.itemsToArray().filter((item) => this.hasItem(item));
          return new SampleInfo(common);
      }
      subtract(info) {
          const onlyOurs = this.itemsToArray().filter((item) => !info.hasItem(item));
          return new SampleInfo(onlyOurs);
      }
      toString() {
          const values = this.itemsToArray();
          return values.length > 0
              ? values.map((x) => x.toString()).join('\n')
              : 'No Sample Info Items';
      }
      isIdentical(v) {
          var _a;
          if (!__classPrivateFieldGet(this, _SampleInfo_instances, "m", _SampleInfo_hasSameKeys).call(this, v.getItems()))
              return false;
          for (const [key, value] of v.getItems()) {
              const valueIsSame = (_a = __classPrivateFieldGet(this, _SampleInfo_itemsByType, "f").get(key)) === null || _a === void 0 ? void 0 : _a.is(value);
              if (!valueIsSame)
                  return false;
          }
          return true;
      }
  }
  _SampleInfo_itemsByType = new WeakMap(), _SampleInfo_itemsByConstructor = new WeakMap(), _SampleInfo_instances = new WeakSet(), _SampleInfo_hasSameKeys = function _SampleInfo_hasSameKeys(facts) {
      const theirKeys = Array.from(facts.keys());
      const ourKeys = Array.from(__classPrivateFieldGet(this, _SampleInfo_itemsByType, "f").keys());
      return areShallowEqual(ourKeys, theirKeys);
  };
  function areShallowEqual(ourKeys, theirKeys) {
      if (ourKeys.length !== theirKeys.length)
          return false;
      for (const key of ourKeys) {
          if (!theirKeys.includes(key))
              return false;
      }
      return true;
  }

  class SampleInfoItem extends ValueObject {
      getType() {
          return this.type;
      }
  }

  var _Setting_value;
  class Setting extends SampleInfoItem {
      constructor(value) {
          super();
          this.type = 'Setting';
          _Setting_value.set(this, void 0);
          __classPrivateFieldSet(this, _Setting_value, value, "f");
      }
      getValue() {
          return __classPrivateFieldGet(this, _Setting_value, "f");
      }
      toString() {
          return __classPrivateFieldGet(this, _Setting_value, "f").toString();
      }
      isIdentical(v) {
          return __classPrivateFieldGet(this, _Setting_value, "f").is(v.getValue());
      }
  }
  _Setting_value = new WeakMap();

  class SettingValue extends ValueObject {
  }

  class InPatient extends SettingValue {
      toString() {
          return 'Inpatient Setting';
      }
      isIdentical() {
          return true;
      }
  }

  class OutPatient extends SettingValue {
      toString() {
          return 'Outpatient Setting';
      }
      isIdentical() {
          return true;
      }
  }

  const Settings = {
      get INPATIENT() {
          return new Setting(new InPatient());
      },
      get OUTPATIENT() {
          return new Setting(new OutPatient());
      },
  };

  var _Source_value;
  class Source extends SampleInfoItem {
      constructor(value) {
          super();
          this.type = 'Infectious Source';
          _Source_value.set(this, void 0);
          __classPrivateFieldSet(this, _Source_value, value, "f");
      }
      getValue() {
          return __classPrivateFieldGet(this, _Source_value, "f");
      }
      toString() {
          return __classPrivateFieldGet(this, _Source_value, "f").toString();
      }
      isIdentical(v) {
          return __classPrivateFieldGet(this, _Source_value, "f").is(v.getValue());
      }
  }
  _Source_value = new WeakMap();

  class SourceValue extends ValueObject {
  }

  class Urine extends SourceValue {
      toString() {
          return 'Urine';
      }
      isIdentical() {
          return true;
      }
  }

  class NonUrine extends SourceValue {
      toString() {
          return 'Non-Urine';
      }
      isIdentical() {
          return true;
      }
  }

  class NonMeningitis extends SourceValue {
      toString() {
          return 'Non-Meningitis';
      }
      isIdentical() {
          return true;
      }
  }

  class Meningitis extends SourceValue {
      toString() {
          return 'Meningitis';
      }
      isIdentical() {
          return true;
      }
  }

  class Oral extends SourceValue {
      toString() {
          return 'Oral';
      }
      isIdentical() {
          return true;
      }
  }

  const Sources = {
      get URINE() {
          return new Source(new Urine());
      },
      get NONURINE() {
          return new Source(new NonUrine());
      },
      get MENINGITIS() {
          return new Source(new Meningitis());
      },
      get NONMENINGITIS() {
          return new Source(new NonMeningitis());
      },
      get ORAL() {
          return new Source(new Oral());
      },
  };

  var _Place_region, _Place_institution;
  class Place extends ValueObject {
      constructor(state, institution) {
          super();
          _Place_region.set(this, void 0);
          _Place_institution.set(this, void 0);
          __classPrivateFieldSet(this, _Place_institution, institution, "f");
          __classPrivateFieldSet(this, _Place_region, state, "f");
      }
      getState() {
          return __classPrivateFieldGet(this, _Place_region, "f");
      }
      getInstitution() {
          return __classPrivateFieldGet(this, _Place_institution, "f");
      }
      toString() {
          return `${__classPrivateFieldGet(this, _Place_institution, "f")} \u2212 ${__classPrivateFieldGet(this, _Place_region, "f")}`;
      }
      isIdentical(that) {
          if (that.getState() !== this.getState())
              return false;
          if (that.getInstitution() !== this.getInstitution())
              return false;
          return true;
      }
  }
  _Place_region = new WeakMap(), _Place_institution = new WeakMap();
  class UnknownPlace extends Place {
      constructor() {
          super('Unknown', 'Unknown');
      }
  }

  var _Interval_instances, _Interval_publishedAt, _Interval_expiresAt, _Interval_dateToString;
  class Interval extends ValueObject {
      constructor(publishedAt, expiresAt) {
          super();
          _Interval_instances.add(this);
          _Interval_publishedAt.set(this, void 0);
          _Interval_expiresAt.set(this, void 0);
          __classPrivateFieldSet(this, _Interval_publishedAt, publishedAt, "f");
          __classPrivateFieldSet(this, _Interval_expiresAt, expiresAt, "f");
      }
      getPublishedDate() {
          return __classPrivateFieldGet(this, _Interval_publishedAt, "f");
      }
      getExpiryDate() {
          return __classPrivateFieldGet(this, _Interval_expiresAt, "f");
      }
      isIdentical(v) {
          if (v.getPublishedDate().getTime() !== __classPrivateFieldGet(this, _Interval_publishedAt, "f").getTime())
              return false;
          if (v.getExpiryDate().getTime() !== __classPrivateFieldGet(this, _Interval_expiresAt, "f").getTime())
              return false;
          return true;
      }
      toString() {
          return this.publishedAtToString() + ' \u2212 ' + this.expiresAtToString();
      }
      publishedAtToString() {
          return __classPrivateFieldGet(this, _Interval_instances, "m", _Interval_dateToString).call(this, __classPrivateFieldGet(this, _Interval_publishedAt, "f"));
      }
      expiresAtToString() {
          return __classPrivateFieldGet(this, _Interval_instances, "m", _Interval_dateToString).call(this, __classPrivateFieldGet(this, _Interval_expiresAt, "f"));
      }
  }
  _Interval_publishedAt = new WeakMap(), _Interval_expiresAt = new WeakMap(), _Interval_instances = new WeakSet(), _Interval_dateToString = function _Interval_dateToString(d) {
      return d.toLocaleString('en-us', {
          month: 'short',
          year: 'numeric',
      });
  };
  class DefaultInterval extends Interval {
      constructor() {
          const today = new Date();
          const janThisYear = new Date(today.getFullYear(), 0);
          const janOneYearLater = new Date(today.getFullYear() + 1, 0);
          super(janThisYear, janOneYearLater);
      }
  }

  class MetadataValue extends ValueObject {
      isIdentical(v) {
          if (v.getValue().length !== this.getValue().length)
              return false;
          if (v.getValue().find((f, i) => this.getValue()[i] !== f))
              return false;
          return true;
      }
  }
  MetadataValue.slug = 'value';

  var _Footnotes_footnotes;
  class Footnotes extends MetadataValue {
      constructor(footnotes) {
          super();
          _Footnotes_footnotes.set(this, void 0);
          __classPrivateFieldSet(this, _Footnotes_footnotes, footnotes, "f");
      }
      getSlug() {
          return Footnotes.slug;
      }
      getValue() {
          return __classPrivateFieldGet(this, _Footnotes_footnotes, "f");
      }
  }
  _Footnotes_footnotes = new WeakMap();
  Footnotes.slug = 'footnotes';

  var _Metadata_values;
  class Metadata extends ValueObject {
      constructor(values) {
          super();
          _Metadata_values.set(this, void 0);
          __classPrivateFieldSet(this, _Metadata_values, new Map(values.map((v) => [v.getSlug(), v])), "f");
      }
      get(slug) {
          return __classPrivateFieldGet(this, _Metadata_values, "f").get(slug);
      }
      isIdentical(v) {
          var _a;
          for (const [key, value] of __classPrivateFieldGet(this, _Metadata_values, "f").entries()) {
              if (!((_a = v.get(key)) === null || _a === void 0 ? void 0 : _a.is(value)))
                  return false;
          }
          return true;
      }
  }
  _Metadata_values = new WeakMap();

  var _Order_order;
  class Order extends MetadataValue {
      constructor(order) {
          super();
          _Order_order.set(this, void 0);
          __classPrivateFieldSet(this, _Order_order, order, "f");
      }
      getValue() {
          return __classPrivateFieldGet(this, _Order_order, "f");
      }
  }
  _Order_order = new WeakMap();

  class RowOrder extends Order {
      getSlug() {
          return RowOrder.slug;
      }
  }
  RowOrder.slug = 'row-order';

  class ColumnOrder extends Order {
      getSlug() {
          return ColumnOrder.slug;
      }
  }
  ColumnOrder.slug = 'column-order';

  class Antibiogram extends Entity {
      constructor(id, data, params) {
          var _a, _b, _c, _d, _e;
          super(id);
          this.sensitivities = data;
          this.antibiotics = ValueObject.filterUniqueValues(data.map((d) => d.getAntibiotic()));
          this.organisms = ValueObject.filterUniqueValues(data.map((d) => d.getOrganism()));
          this.info = (_a = params === null || params === void 0 ? void 0 : params.info) !== null && _a !== void 0 ? _a : new SampleInfo([]);
          this.gram = (_b = params === null || params === void 0 ? void 0 : params.gram) !== null && _b !== void 0 ? _b : GramValues.UNSPECIFIED;
          this.place = (_c = params === null || params === void 0 ? void 0 : params.place) !== null && _c !== void 0 ? _c : new UnknownPlace();
          this.interval = (_d = params === null || params === void 0 ? void 0 : params.interval) !== null && _d !== void 0 ? _d : new DefaultInterval();
          this.metadata = (_e = params === null || params === void 0 ? void 0 : params.metadata) !== null && _e !== void 0 ? _e : new Metadata([]);
      }
      isEmpty() {
          return this.sensitivities.length === 0;
      }
      getSensitivities() {
          return this.sensitivities;
      }
      getValues() {
          return this.sensitivities.map((s) => s.getValue());
      }
      findUniqueOrganismAndSampleInfo() {
          return this.sensitivities
              .reduce((ag, data) => ag.find((d) => data.describesSameOrganismAndSamples(d))
              ? ag
              : ag.concat(data), [])
              .map((data) => ({
              org: data.getOrganism(),
              info: data.getSampleInfo(),
              iso: data.getIsolates(),
          }));
      }
  }

  var _EntityId_value;
  class EntityId extends ValueObject {
      constructor(id) {
          super();
          _EntityId_value.set(this, void 0);
          __classPrivateFieldSet(this, _EntityId_value, id, "f");
      }
      getValue() {
          return __classPrivateFieldGet(this, _EntityId_value, "f");
      }
      isIdentical(v) {
          return __classPrivateFieldGet(this, _EntityId_value, "f") === v.getValue();
      }
  }
  _EntityId_value = new WeakMap();

  class AntibiogramId extends EntityId {
      constructor(id) {
          super(id);
      }
  }

  class IVPORoute extends ValueObject {
      isIdentical() {
          return true;
      }
      toString() {
          return 'IV/PO';
      }
  }

  class PORoute extends ValueObject {
      isIdentical() {
          return true;
      }
      toString() {
          return 'PO';
      }
  }

  class IVRoute extends ValueObject {
      isIdentical() {
          return true;
      }
      toString() {
          return 'IV';
      }
  }

  class UnknownRoute extends ValueObject {
      isIdentical() {
          return true;
      }
      toString() {
          return 'unknown';
      }
  }

  const routeFactory = {
      get IV_PO() {
          return new IVPORoute();
      },
      get PO() {
          return new PORoute();
      },
      get IV() {
          return new IVRoute();
      },
      get UNKNOWN() {
          return new UnknownRoute();
      },
  };

  var _SingleAntibioticValue_name, _SingleAntibioticValue_route;
  class SingleAntibioticValue extends ValueObject {
      constructor(name, route) {
          super();
          _SingleAntibioticValue_name.set(this, void 0);
          _SingleAntibioticValue_route.set(this, void 0);
          __classPrivateFieldSet(this, _SingleAntibioticValue_name, name, "f");
          __classPrivateFieldSet(this, _SingleAntibioticValue_route, route !== null && route !== void 0 ? route : routeFactory.UNKNOWN, "f");
      }
      getAntibiotics() {
          return [this];
      }
      getRoute() {
          return __classPrivateFieldGet(this, _SingleAntibioticValue_route, "f");
      }
      getName() {
          return __classPrivateFieldGet(this, _SingleAntibioticValue_name, "f");
      }
      isSameAntibiotic(v) {
          if (!(v instanceof SingleAntibioticValue))
              return false;
          return __classPrivateFieldGet(this, _SingleAntibioticValue_name, "f") === v.getName();
      }
      isIdentical(antibioticValue) {
          if (__classPrivateFieldGet(this, _SingleAntibioticValue_name, "f") !== antibioticValue.getName())
              return false;
          if (!__classPrivateFieldGet(this, _SingleAntibioticValue_route, "f").is(antibioticValue.getRoute()))
              return false;
          return true;
      }
  }
  _SingleAntibioticValue_name = new WeakMap(), _SingleAntibioticValue_route = new WeakMap();

  var _OrganismValue_name, _OrganismValue_organism;
  class OrganismValue extends ValueObject {
      constructor(name, organism) {
          super();
          _OrganismValue_name.set(this, void 0);
          _OrganismValue_organism.set(this, void 0);
          __classPrivateFieldSet(this, _OrganismValue_name, name, "f");
          __classPrivateFieldSet(this, _OrganismValue_organism, organism, "f");
      }
      getName() {
          return __classPrivateFieldGet(this, _OrganismValue_name, "f");
      }
      getOrganism() {
          return __classPrivateFieldGet(this, _OrganismValue_organism, "f");
      }
      isIdentical(organismValue) {
          return __classPrivateFieldGet(this, _OrganismValue_name, "f") === organismValue.getName();
      }
  }
  _OrganismValue_name = new WeakMap(), _OrganismValue_organism = new WeakMap();

  var _IntegerNumberOfIsolates_value;
  class IntegerNumberOfIsolates extends ValueObject {
      constructor(value) {
          super();
          _IntegerNumberOfIsolates_value.set(this, void 0);
          validateNumberOfIsolates(value);
          __classPrivateFieldSet(this, _IntegerNumberOfIsolates_value, value, "f");
      }
      getValue() {
          return __classPrivateFieldGet(this, _IntegerNumberOfIsolates_value, "f");
      }
      isEnough() {
          return __classPrivateFieldGet(this, _IntegerNumberOfIsolates_value, "f") >= 30;
      }
      toString() {
          return '' + __classPrivateFieldGet(this, _IntegerNumberOfIsolates_value, "f");
      }
      isUnknown() {
          return false;
      }
      isIdentical(v) {
          return __classPrivateFieldGet(this, _IntegerNumberOfIsolates_value, "f") === v.getValue();
      }
  }
  _IntegerNumberOfIsolates_value = new WeakMap();
  function validateNumberOfIsolates(value) {
      const hasDecimal = Math.round(value) !== value;
      if (hasDecimal)
          throw new DecimalNumberOfIsolatesError(value);
      const isNegative = value < 0;
      if (isNegative)
          throw new NegativeNumberOfIsolatesError(value);
  }
  class DecimalNumberOfIsolatesError extends Error {
      constructor(value) {
          super();
          this.message = 'Non-integer number of isolates: ' + value;
      }
  }
  class NegativeNumberOfIsolatesError extends Error {
      constructor(value) {
          super();
          this.message = 'Negative number of isolates: ' + value;
      }
  }

  class UnknownNumberOfIsolates extends ValueObject {
      isUnknown() {
          return true;
      }
      getValue() {
          return NaN;
      }
      toString() {
          return 'unknown';
      }
      isIdentical() {
          return false;
      }
  }

  var _SensitivityData_organism, _SensitivityData_antibiotic, _SensitivityData_value, _SensitivityData_isolates, _SensitivityData_sampleInfo;
  class SensitivityData extends ValueObject {
      constructor(p) {
          var _a, _b;
          super();
          _SensitivityData_organism.set(this, void 0);
          _SensitivityData_antibiotic.set(this, void 0);
          _SensitivityData_value.set(this, void 0);
          _SensitivityData_isolates.set(this, void 0);
          _SensitivityData_sampleInfo.set(this, void 0);
          __classPrivateFieldSet(this, _SensitivityData_organism, p.organism, "f");
          __classPrivateFieldSet(this, _SensitivityData_antibiotic, p.antibiotic, "f");
          __classPrivateFieldSet(this, _SensitivityData_value, p.value, "f");
          __classPrivateFieldSet(this, _SensitivityData_isolates, (_a = p.isolates) !== null && _a !== void 0 ? _a : new UnknownNumberOfIsolates(), "f");
          __classPrivateFieldSet(this, _SensitivityData_sampleInfo, (_b = p.sampleInfo) !== null && _b !== void 0 ? _b : new SampleInfo([]), "f");
      }
      getOrganism() {
          return __classPrivateFieldGet(this, _SensitivityData_organism, "f");
      }
      getAntibiotic() {
          return __classPrivateFieldGet(this, _SensitivityData_antibiotic, "f");
      }
      getValue() {
          return __classPrivateFieldGet(this, _SensitivityData_value, "f");
      }
      getIsolates() {
          return __classPrivateFieldGet(this, _SensitivityData_isolates, "f");
      }
      getSampleInfo() {
          return __classPrivateFieldGet(this, _SensitivityData_sampleInfo, "f");
      }
      describesSameOrganismAndSamples(v) {
          if (!__classPrivateFieldGet(this, _SensitivityData_organism, "f").is(v.getOrganism()))
              return false;
          if (!__classPrivateFieldGet(this, _SensitivityData_sampleInfo, "f").is(v.getSampleInfo()))
              return false;
          return true;
      }
      isIdentical(v) {
          if (!__classPrivateFieldGet(this, _SensitivityData_antibiotic, "f").is(v.getAntibiotic()))
              return false;
          if (!__classPrivateFieldGet(this, _SensitivityData_organism, "f").is(v.getOrganism()))
              return false;
          if (!__classPrivateFieldGet(this, _SensitivityData_value, "f").is(v.getValue()))
              return false;
          if (!__classPrivateFieldGet(this, _SensitivityData_sampleInfo, "f").is(v.getSampleInfo()))
              return false;
          return true;
      }
  }
  _SensitivityData_organism = new WeakMap(), _SensitivityData_antibiotic = new WeakMap(), _SensitivityData_value = new WeakMap(), _SensitivityData_isolates = new WeakMap(), _SensitivityData_sampleInfo = new WeakMap();

  class ResistantValue {
      getValue() {
          return 'R';
      }
      toString() {
          return 'R';
      }
      valueOf() {
          return NaN;
      }
      isResistant() {
          return true;
      }
  }

  var _PercentValue_instances, _PercentValue_value, _PercentValue_validateInput;
  class PercentValue {
      constructor(value) {
          _PercentValue_instances.add(this);
          _PercentValue_value.set(this, void 0);
          __classPrivateFieldGet(this, _PercentValue_instances, "m", _PercentValue_validateInput).call(this, value);
          __classPrivateFieldSet(this, _PercentValue_value, value, "f");
      }
      getValue() {
          return __classPrivateFieldGet(this, _PercentValue_value, "f");
      }
      toString() {
          return '' + Math.round(__classPrivateFieldGet(this, _PercentValue_value, "f")) + '%';
      }
      valueOf() {
          return this.getValue();
      }
      isResistant() {
          return false;
      }
  }
  _PercentValue_value = new WeakMap(), _PercentValue_instances = new WeakSet(), _PercentValue_validateInput = function _PercentValue_validateInput(value) {
      if (value > 100)
          throw new PercentSensitivityValueValidationError(value);
      if (value < 0)
          throw new PercentSensitivityValueValidationError(value);
  };
  class PercentSensitivityValueValidationError extends Error {
      constructor(input) {
          super();
          this.message = 'Invalid sensitivity value: ' + input + '%';
      }
  }

  var _SensitivityValue_instances, _SensitivityValue_value, _SensitivityValue_validateInput;
  class SensitivityValue extends ValueObject {
      constructor(value) {
          super();
          _SensitivityValue_instances.add(this);
          _SensitivityValue_value.set(this, void 0);
          __classPrivateFieldGet(this, _SensitivityValue_instances, "m", _SensitivityValue_validateInput).call(this, value);
          if (value === 'R')
              __classPrivateFieldSet(this, _SensitivityValue_value, new ResistantValue(), "f");
          else
              __classPrivateFieldSet(this, _SensitivityValue_value, new PercentValue(+value), "f");
      }
      isResistent() {
          return __classPrivateFieldGet(this, _SensitivityValue_value, "f").isResistant();
      }
      getValue() {
          return __classPrivateFieldGet(this, _SensitivityValue_value, "f").getValue();
      }
      toString() {
          return __classPrivateFieldGet(this, _SensitivityValue_value, "f").toString();
      }
      valueOf() {
          return __classPrivateFieldGet(this, _SensitivityValue_value, "f").valueOf();
      }
      isIdentical(v) {
          return __classPrivateFieldGet(this, _SensitivityValue_value, "f").getValue() === v.getValue();
      }
  }
  _SensitivityValue_value = new WeakMap(), _SensitivityValue_instances = new WeakSet(), _SensitivityValue_validateInput = function _SensitivityValue_validateInput(value) {
      if (value === 'R')
          return;
      if (!stringContainsNumber(value))
          throw new SensitivityValueValidationError(value);
  };
  function stringContainsNumber(input) {
      const trimmedInput = input.trim();
      if (trimmedInput.length === 0)
          return false;
      const coercedToNaN = Number.isNaN(+trimmedInput);
      if (coercedToNaN)
          return false;
      return true;
  }
  class SensitivityValueValidationError extends Error {
      constructor(inputValue) {
          super();
          this.message = 'Invalid sensitivity value: ' + inputValue;
      }
  }

  var _WebAntibiogramPresenter_instances, _WebAntibiogramPresenter_tablePresenter, _WebAntibiogramPresenter_abg, _WebAntibiogramPresenter_makeSampleInfoString;
  class WebAntibiogramPresenter {
      constructor(webTablePresenter) {
          _WebAntibiogramPresenter_instances.add(this);
          _WebAntibiogramPresenter_tablePresenter.set(this, void 0);
          _WebAntibiogramPresenter_abg.set(this, null);
          __classPrivateFieldSet(this, _WebAntibiogramPresenter_tablePresenter, webTablePresenter, "f");
      }
      setData(data) {
          __classPrivateFieldGet(this, _WebAntibiogramPresenter_tablePresenter, "f").setData(data.table);
          __classPrivateFieldSet(this, _WebAntibiogramPresenter_abg, data.antibiogram, "f");
      }
      buildViewModel() {
          const table = __classPrivateFieldGet(this, _WebAntibiogramPresenter_tablePresenter, "f").buildViewModel();
          if (!__classPrivateFieldGet(this, _WebAntibiogramPresenter_abg, "f") || !table)
              return null;
          return {
              table,
              antibiogramId: __classPrivateFieldGet(this, _WebAntibiogramPresenter_abg, "f").id.getValue(),
              region: __classPrivateFieldGet(this, _WebAntibiogramPresenter_abg, "f").place.getState(),
              institution: __classPrivateFieldGet(this, _WebAntibiogramPresenter_abg, "f").place.getInstitution(),
              publishedAt: __classPrivateFieldGet(this, _WebAntibiogramPresenter_abg, "f").interval.publishedAtToString(),
              expiresAt: __classPrivateFieldGet(this, _WebAntibiogramPresenter_abg, "f").interval.expiresAtToString(),
              gram: __classPrivateFieldGet(this, _WebAntibiogramPresenter_abg, "f").gram.toString(),
              info: __classPrivateFieldGet(this, _WebAntibiogramPresenter_instances, "m", _WebAntibiogramPresenter_makeSampleInfoString).call(this, __classPrivateFieldGet(this, _WebAntibiogramPresenter_abg, "f").info),
          };
      }
  }
  _WebAntibiogramPresenter_tablePresenter = new WeakMap(), _WebAntibiogramPresenter_abg = new WeakMap(), _WebAntibiogramPresenter_instances = new WeakSet(), _WebAntibiogramPresenter_makeSampleInfoString = function _WebAntibiogramPresenter_makeSampleInfoString(info) {
      return !info.is(new SampleInfo([])) ? info.toString() : 'Antibiogram';
  };

  class Cell extends ValueObject {
      toString() {
          return this.getValue();
      }
      isIdentical(c) {
          if (this.getValue() !== c.getValue())
              return false;
          if (!this.getTooltip().is(c.getTooltip()))
              return false;
          return true;
      }
  }

  class AlertLevel extends ValueObject {
      isIdentical(level) {
          return this.valueOf() === level.valueOf();
      }
  }

  class None extends AlertLevel {
      constructor() {
          super(...arguments);
          this.level = 'none';
      }
      valueOf() {
          return -1;
      }
  }

  class Info extends AlertLevel {
      constructor() {
          super(...arguments);
          this.level = 'info';
      }
      valueOf() {
          return 0;
      }
  }

  class Warn extends AlertLevel {
      constructor() {
          super(...arguments);
          this.level = 'warn';
      }
      valueOf() {
          return 1;
      }
  }

  class Error$1 extends AlertLevel {
      constructor() {
          super(...arguments);
          this.level = 'error';
      }
      valueOf() {
          return 2;
      }
  }

  const AlertLevels = {
      get NONE() {
          return new None();
      },
      get INFO() {
          return new Info();
      },
      get WARN() {
          return new Warn();
      },
      get ERROR() {
          return new Error$1();
      },
  };

  class BaseTooltipBehavior extends ValueObject {
  }

  var _CompositeTooltipBehavior_children;
  class CompositeTooltipBehavior extends BaseTooltipBehavior {
      constructor(children) {
          super();
          _CompositeTooltipBehavior_children.set(this, void 0);
          __classPrivateFieldSet(this, _CompositeTooltipBehavior_children, children, "f");
      }
      toString() {
          return __classPrivateFieldGet(this, _CompositeTooltipBehavior_children, "f").map((t) => t.toString()).join('\n');
      }
      getChildren() {
          return __classPrivateFieldGet(this, _CompositeTooltipBehavior_children, "f");
      }
      getAlertLevel() {
          let max = AlertLevels.NONE;
          for (const child of __classPrivateFieldGet(this, _CompositeTooltipBehavior_children, "f")) {
              const level = child.getAlertLevel();
              if (level > max) {
                  max = level;
              }
          }
          return max;
      }
      isIdentical(t) {
          for (const child of t.getChildren()) {
              const match = __classPrivateFieldGet(this, _CompositeTooltipBehavior_children, "f").find((c) => c.is(child));
              if (!match)
                  return false;
          }
          return true;
      }
  }
  _CompositeTooltipBehavior_children = new WeakMap();

  var _SingleTooltipBehavior_content, _SingleTooltipBehavior_level;
  class SingleTooltipBehavior extends BaseTooltipBehavior {
      constructor(content, level) {
          super();
          _SingleTooltipBehavior_content.set(this, void 0);
          _SingleTooltipBehavior_level.set(this, void 0);
          __classPrivateFieldSet(this, _SingleTooltipBehavior_content, content, "f");
          __classPrivateFieldSet(this, _SingleTooltipBehavior_level, level, "f");
      }
      toString() {
          return __classPrivateFieldGet(this, _SingleTooltipBehavior_content, "f");
      }
      getAlertLevel() {
          return __classPrivateFieldGet(this, _SingleTooltipBehavior_level, "f");
      }
      isIdentical(t) {
          return __classPrivateFieldGet(this, _SingleTooltipBehavior_content, "f") === t.toString();
      }
  }
  _SingleTooltipBehavior_content = new WeakMap(), _SingleTooltipBehavior_level = new WeakMap();

  class EmptyTooltipBehavior extends BaseTooltipBehavior {
      toString() {
          return '';
      }
      getAlertLevel() {
          return AlertLevels.NONE;
      }
      isIdentical() {
          return true;
      }
  }

  var _Tooltip_tooltip;
  class Tooltip extends ValueObject {
      constructor(arg, level) {
          super();
          _Tooltip_tooltip.set(this, void 0);
          if (typeof arg === 'string') {
              __classPrivateFieldSet(this, _Tooltip_tooltip, new SingleTooltipBehavior(arg, level !== null && level !== void 0 ? level : AlertLevels.NONE), "f");
          }
          else if (typeof arg === 'undefined') {
              __classPrivateFieldSet(this, _Tooltip_tooltip, new EmptyTooltipBehavior(), "f");
          }
          else {
              __classPrivateFieldSet(this, _Tooltip_tooltip, new CompositeTooltipBehavior(arg), "f");
          }
      }
      toString() {
          return __classPrivateFieldGet(this, _Tooltip_tooltip, "f").toString();
      }
      getAlertLevel() {
          return __classPrivateFieldGet(this, _Tooltip_tooltip, "f").getAlertLevel();
      }
      isIdentical(t) {
          if (this.toString() !== t.toString())
              return false;
          if (!this.getAlertLevel().is(t.getAlertLevel()))
              return false;
          return true;
      }
  }
  _Tooltip_tooltip = new WeakMap();

  class EmptyCell extends Cell {
      getValue() {
          return 'NA';
      }
      getTooltip() {
          return new Tooltip();
      }
      getAlertLevel() {
          return AlertLevels.NONE;
      }
  }

  var _FilledCell_value, _FilledCell_tooltip, _FilledCell_alert;
  class FilledCell extends Cell {
      constructor(value, params) {
          var _a, _b;
          super();
          _FilledCell_value.set(this, void 0);
          _FilledCell_tooltip.set(this, void 0);
          _FilledCell_alert.set(this, void 0);
          __classPrivateFieldSet(this, _FilledCell_value, value, "f");
          __classPrivateFieldSet(this, _FilledCell_tooltip, (_a = params === null || params === void 0 ? void 0 : params.tooltip) !== null && _a !== void 0 ? _a : new Tooltip(), "f");
          __classPrivateFieldSet(this, _FilledCell_alert, (_b = params === null || params === void 0 ? void 0 : params.alert) !== null && _b !== void 0 ? _b : __classPrivateFieldGet(this, _FilledCell_tooltip, "f").getAlertLevel(), "f");
      }
      getValue() {
          return __classPrivateFieldGet(this, _FilledCell_value, "f");
      }
      getTooltip() {
          return __classPrivateFieldGet(this, _FilledCell_tooltip, "f");
      }
      getAlertLevel() {
          return __classPrivateFieldGet(this, _FilledCell_alert, "f");
      }
  }
  _FilledCell_value = new WeakMap(), _FilledCell_tooltip = new WeakMap(), _FilledCell_alert = new WeakMap();

  function validate$1(rules) {
      for (const rule of rules) {
          rule.check();
      }
  }

  class NoInconsistentRowColumnNumber {
      constructor(input) {
          this.input = input;
      }
      check() {
          const { input } = this;
          const rowNumber = input.length;
          if (rowNumber === 0)
              return;
          const columnNumber = input[0].length;
          input.find((r, i) => {
              if (r.length !== columnNumber)
                  throw new InconsistentRowColumnNumberError(i);
          });
      }
  }
  class InconsistentRowColumnNumberError extends Error {
      constructor(rowNumber) {
          super();
          this.message = 'Inconsistent number of columns or rows at row ' + rowNumber;
      }
  }

  class NoInconsistentRowColumnLabelNumber {
      constructor(input, labels) {
          this.input = input;
          this.labels = labels;
      }
      check() {
          var _a, _b;
          if (typeof this.labels === 'undefined')
              return;
          const numRows = this.input.length;
          const numColumns = (_b = (_a = this.input[0]) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0;
          const unequalRows = numRows !== this.labels.rows.length;
          const unequalColumns = numColumns !== this.labels.columns.length;
          if (unequalRows)
              throw new InconsistentRowLabelsError();
          if (unequalColumns)
              throw new InconsistentColumnLabelsError();
      }
  }
  class InconsistentRowLabelsError extends Error {
      constructor() {
          super();
          this.message = 'Row labels do not match number of rows in data';
      }
  }
  class InconsistentColumnLabelsError extends Error {
      constructor() {
          super();
          this.message = 'Column labels do not match number of columns in data';
      }
  }

  var _NoUndefinedValues_instances, _NoUndefinedValues_isUndefined;
  class NoUndefinedValues {
      constructor(input) {
          _NoUndefinedValues_instances.add(this);
          this.input = input;
      }
      check() {
          const { input } = this;
          input.forEach((r, i) => {
              if (__classPrivateFieldGet(this, _NoUndefinedValues_instances, "m", _NoUndefinedValues_isUndefined).call(this, r))
                  throw new UndefinedValueError(i);
              r.forEach((c, j) => {
                  if (__classPrivateFieldGet(this, _NoUndefinedValues_instances, "m", _NoUndefinedValues_isUndefined).call(this, c))
                      throw new UndefinedValueError(i, j);
              });
              const hasEmpty = r.includes(undefined);
              if (hasEmpty)
                  throw new UndefinedValueError(i);
          });
      }
  }
  _NoUndefinedValues_instances = new WeakSet(), _NoUndefinedValues_isUndefined = function _NoUndefinedValues_isUndefined(value) {
      return typeof value === 'undefined';
  };
  class UndefinedValueError extends Error {
      constructor(row, column) {
          super();
          this.message = 'Undefined value at ' + row;
          this.message += column ? ', ' + column : '';
      }
  }

  class NoIntersectingGroupRanges {
      constructor(data, groups) {
          this.data = data;
          this.groupInfo = groups === null || groups === void 0 ? void 0 : groups.rows;
      }
      check() {
          if (!this.groupInfo)
              return;
          if (this.groupInfo.length < 2)
              return;
          for (let i = 0; i < this.groupInfo.length; i++) {
              const range = this.groupInfo[i].getRange();
              for (let j = i + 1; j < this.groupInfo.length; j++) {
                  const otherRange = this.groupInfo[j].getRange();
                  compareRanges(range, otherRange);
              }
          }
      }
  }
  class DuplicateGroupRangeError extends Error {
      constructor(r1, r2) {
          super();
          this.message =
              'Duplicate group ranges: ' +
                  JSON.stringify(r1) +
                  ' and ' +
                  JSON.stringify(r2);
      }
  }
  class IntersectingGroupRangeError extends Error {
      constructor(r1, r2) {
          super();
          this.message =
              'Intersecting group ranges: ' +
                  JSON.stringify(r1) +
                  ' and ' +
                  JSON.stringify(r2);
      }
  }
  function isInRange(r, num) {
      return r[0] <= num && r[1] > num;
  }
  function isSameRange(r1, r2) {
      return r1[0] === r2[0] && r1[1] === r2[1];
  }
  function hasOverlapLeft(r1, r2) {
      return isInRange(r2, r1[0]) && !isInRange(r2, r1[1]);
  }
  function hasOverlapRight(r1, r2) {
      return hasOverlapLeft(r2, r1);
  }
  function compareRanges(r1, r2) {
      if (isSameRange(r1, r2))
          throw new DuplicateGroupRangeError(r1, r2);
      if (hasOverlapLeft(r1, r2) || hasOverlapRight(r1, r2))
          throw new IntersectingGroupRangeError(r1, r2);
  }

  class NoZeroOrOneRowGroups {
      constructor(groups) {
          this.groupInfo = groups === null || groups === void 0 ? void 0 : groups.rows;
      }
      check() {
          if (!this.groupInfo)
              return;
          for (const group of this.groupInfo) {
              const range = group.getExpandedRange();
              if (!includesMoreThanTwoIntegers(range))
                  throw new GroupOfLessThanTwoRowsError(range);
          }
      }
  }
  function includesMoreThanTwoIntegers(r) {
      return r[1] - r[0] !== 1 && r[1] - r[0] !== 0;
  }
  class GroupOfLessThanTwoRowsError extends Error {
      constructor(range) {
          super();
          this.message =
              'Group must have at least two rows. Got range: ' + JSON.stringify(range);
      }
  }

  class NoInvalidRowRanges {
      constructor(groups) {
          this.groupInfo = groups === null || groups === void 0 ? void 0 : groups.rows;
      }
      check() {
          if (!this.groupInfo)
              return;
          for (const group of this.groupInfo) {
              const range = group.getRange();
              if (firstNumberIsGreaterThanSecond(range))
                  throw new InvalidRangeError(range);
              if (rangeIncludesNegativeNumbers(range))
                  throw new InvalidRangeError(range);
          }
      }
  }
  function firstNumberIsGreaterThanSecond(r) {
      return r[0] > r[1];
  }
  function rangeIncludesNegativeNumbers(r) {
      return r[0] < 0 || r[1] < 0;
  }
  class InvalidRangeError extends Error {
      constructor(range) {
          super();
          this.message = 'Invalid range: ' + JSON.stringify(range);
      }
  }

  var rules = (data, params) => [
      new NoUndefinedValues(data),
      new NoInconsistentRowColumnNumber(data),
      new NoInconsistentRowColumnLabelNumber(data, params === null || params === void 0 ? void 0 : params.labels),
      new NoIntersectingGroupRanges(data, params === null || params === void 0 ? void 0 : params.groups),
      new NoZeroOrOneRowGroups(params === null || params === void 0 ? void 0 : params.groups),
      new NoInvalidRowRanges(params === null || params === void 0 ? void 0 : params.groups),
  ];

  var _BaseLabelBehavior_cell;
  class BaseLabelBehavior extends Cell {
      constructor() {
          super(...arguments);
          _BaseLabelBehavior_cell.set(this, null);
      }
      getCell() {
          if (!__classPrivateFieldGet(this, _BaseLabelBehavior_cell, "f"))
              __classPrivateFieldSet(this, _BaseLabelBehavior_cell, this.makeCell(), "f");
          return __classPrivateFieldGet(this, _BaseLabelBehavior_cell, "f");
      }
      toString() {
          return this.getCell().toString();
      }
      getValue() {
          return this.getCell().getValue();
      }
      getTooltip() {
          return this.getCell().getTooltip();
      }
      getAlertLevel() {
          return this.getCell().getAlertLevel();
      }
  }
  _BaseLabelBehavior_cell = new WeakMap();

  var _FilledLabelBehavior_title, _FilledLabelBehavior_tooltip, _FilledLabelBehavior_alert, _FilledLabelBehavior_bold;
  class FilledLabelBehavior extends BaseLabelBehavior {
      constructor(title, params) {
          super();
          _FilledLabelBehavior_title.set(this, void 0);
          _FilledLabelBehavior_tooltip.set(this, void 0);
          _FilledLabelBehavior_alert.set(this, void 0);
          _FilledLabelBehavior_bold.set(this, void 0);
          __classPrivateFieldSet(this, _FilledLabelBehavior_title, title, "f");
          __classPrivateFieldSet(this, _FilledLabelBehavior_alert, params === null || params === void 0 ? void 0 : params.alert, "f");
          __classPrivateFieldSet(this, _FilledLabelBehavior_tooltip, params === null || params === void 0 ? void 0 : params.tooltip, "f");
          __classPrivateFieldSet(this, _FilledLabelBehavior_bold, !!(params === null || params === void 0 ? void 0 : params.bold), "f");
      }
      makeCell() {
          return new FilledCell(__classPrivateFieldGet(this, _FilledLabelBehavior_title, "f"), {
              tooltip: __classPrivateFieldGet(this, _FilledLabelBehavior_tooltip, "f"),
              alert: __classPrivateFieldGet(this, _FilledLabelBehavior_alert, "f"),
          });
      }
      isBold() {
          return __classPrivateFieldGet(this, _FilledLabelBehavior_bold, "f");
      }
  }
  _FilledLabelBehavior_title = new WeakMap(), _FilledLabelBehavior_tooltip = new WeakMap(), _FilledLabelBehavior_alert = new WeakMap(), _FilledLabelBehavior_bold = new WeakMap();

  class EmptyLabelBehavior extends BaseLabelBehavior {
      isBold() {
          return false;
      }
      makeCell() {
          return new EmptyCell();
      }
  }

  var _Label_label;
  class Label extends Cell {
      constructor(title, params) {
          super();
          _Label_label.set(this, void 0);
          if (title) {
              __classPrivateFieldSet(this, _Label_label, new FilledLabelBehavior(title, params), "f");
          }
          else
              __classPrivateFieldSet(this, _Label_label, new EmptyLabelBehavior(), "f");
      }
      toString() {
          return __classPrivateFieldGet(this, _Label_label, "f").toString();
      }
      getValue() {
          return __classPrivateFieldGet(this, _Label_label, "f").getValue();
      }
      getTooltip() {
          return __classPrivateFieldGet(this, _Label_label, "f").getTooltip();
      }
      getAlertLevel() {
          return __classPrivateFieldGet(this, _Label_label, "f").getAlertLevel();
      }
      isBold() {
          return __classPrivateFieldGet(this, _Label_label, "f").isBold();
      }
  }
  _Label_label = new WeakMap();

  class TableLabels {
      getRowLabels() {
          return this.rows;
      }
      getColumnLabels() {
          return this.columns;
      }
  }
  class FilledTableLabels extends TableLabels {
      constructor(rows, columns) {
          super();
          this.rows = rows;
          this.columns = columns;
      }
  }
  class EmptyTableLabels extends TableLabels {
      constructor(nRow, nCol) {
          super();
          this.rows = new Array(nRow).fill(undefined).map(() => new Label());
          this.columns = new Array(nCol).fill(undefined).map(() => new Label());
      }
  }

  var _CompositeTable_table1, _CompositeTable_table2, _CompositeTable_rowMapping, _CompositeTable_columnMapping, _CompositeTable_makeEmptyCell;
  class CompositeTable {
      constructor(table1, table2, makeEmptyCell = defaultMakeEmptyCell$1) {
          _CompositeTable_table1.set(this, void 0);
          _CompositeTable_table2.set(this, void 0);
          _CompositeTable_rowMapping.set(this, void 0);
          _CompositeTable_columnMapping.set(this, void 0);
          _CompositeTable_makeEmptyCell.set(this, void 0);
          __classPrivateFieldSet(this, _CompositeTable_table1, table1, "f");
          __classPrivateFieldSet(this, _CompositeTable_table2, table2, "f");
          const rowLabels1 = table1.getRowLabels();
          const rowLabels2 = table2.getRowLabels();
          const colLabels1 = table1.getColumnLabels();
          const colLabels2 = table2.getColumnLabels();
          __classPrivateFieldSet(this, _CompositeTable_rowMapping, mapArr2ToArr1(rowLabels1, rowLabels2), "f");
          __classPrivateFieldSet(this, _CompositeTable_columnMapping, mapArr2ToArr1(colLabels1, colLabels2), "f");
          __classPrivateFieldSet(this, _CompositeTable_makeEmptyCell, makeEmptyCell, "f");
      }
      getData() {
          const data1 = __classPrivateFieldGet(this, _CompositeTable_table1, "f").getData();
          const data2 = __classPrivateFieldGet(this, _CompositeTable_table2, "f").getData();
          const data = applyMappingToMatrix(__classPrivateFieldGet(this, _CompositeTable_rowMapping, "f"), __classPrivateFieldGet(this, _CompositeTable_columnMapping, "f"), data1, data2, __classPrivateFieldGet(this, _CompositeTable_makeEmptyCell, "f"));
          return data;
      }
      getShape() {
          return findShapeOfResultMatrix(__classPrivateFieldGet(this, _CompositeTable_table1, "f").getData(), __classPrivateFieldGet(this, _CompositeTable_table2, "f").getData(), __classPrivateFieldGet(this, _CompositeTable_rowMapping, "f"), __classPrivateFieldGet(this, _CompositeTable_columnMapping, "f"));
      }
      getRowLabels() {
          return applyMapping(__classPrivateFieldGet(this, _CompositeTable_rowMapping, "f"), __classPrivateFieldGet(this, _CompositeTable_table1, "f").getRowLabels(), __classPrivateFieldGet(this, _CompositeTable_table2, "f").getRowLabels());
      }
      getColumnLabels() {
          return applyMapping(__classPrivateFieldGet(this, _CompositeTable_columnMapping, "f"), __classPrivateFieldGet(this, _CompositeTable_table1, "f").getColumnLabels(), __classPrivateFieldGet(this, _CompositeTable_table2, "f").getColumnLabels());
      }
      getRowGroups() {
          return [];
      }
      clone(params) {
          const t1 = __classPrivateFieldGet(this, _CompositeTable_table1, "f").clone(params);
          const t2 = __classPrivateFieldGet(this, _CompositeTable_table2, "f").clone(params);
          return new CompositeTable(t1, t2);
      }
      merge(table) {
          return new CompositeTable(this, table);
      }
  }
  _CompositeTable_table1 = new WeakMap(), _CompositeTable_table2 = new WeakMap(), _CompositeTable_rowMapping = new WeakMap(), _CompositeTable_columnMapping = new WeakMap(), _CompositeTable_makeEmptyCell = new WeakMap();
  function mapArr2ToArr1(arr1, arr2) {
      const mapping = {};
      for (const [i, item] of arr2.entries()) {
          const arr1Index = arr1.findIndex((v) => v.is(item));
          if (arr1Index >= 0)
              mapping[i] = arr1Index;
      }
      return mapping;
  }
  function applyMapping(mapping, arr1, arr2) {
      const result = arr1.slice();
      for (const [arr2Idx, item] of arr2.entries()) {
          const arr1Idx = mapping[arr2Idx];
          if (typeof arr1Idx !== 'undefined')
              result[arr1Idx] = item;
          else
              result.push(item);
      }
      return result;
  }
  function applyMappingToMatrix(rowMapping, colMapping, mat1, mat2, makeEmptyCell) {
      const [nRow, nCol] = findShapeOfResultMatrix(mat1, mat2, rowMapping, colMapping);
      const result = new Array(nRow)
          .fill(undefined)
          .map(() => new Array(nCol).fill(undefined).map(makeEmptyCell));
      for (const [i, row] of mat1.entries()) {
          for (const [j, cell] of row.entries())
              result[i][j] = cell;
      }
      for (const [i, row] of mat2.entries()) {
          for (const [j, cell] of row.entries()) {
              const mappedRowIdx = rowMapping[i];
              const mappedColIdx = colMapping[j];
              const rowMappingOffset = Object.keys(rowMapping).filter((k) => +k < i).length;
              const colMappingOffset = Object.keys(colMapping).filter((k) => +k < j).length;
              const unmappedRowIdx = mat1.length + i - rowMappingOffset;
              const unmappedColIdx = mat1[0].length + j - colMappingOffset;
              if (typeof mappedRowIdx !== 'undefined' &&
                  typeof mappedColIdx !== 'undefined') {
                  result[mappedRowIdx][mappedColIdx] = cell;
              }
              else if (typeof mappedRowIdx !== 'undefined') {
                  result[mappedRowIdx][unmappedColIdx] = cell;
              }
              else if (typeof mappedColIdx !== 'undefined') {
                  result[unmappedRowIdx][mappedColIdx] = cell;
              }
              else
                  result[unmappedRowIdx][unmappedColIdx] = cell;
          }
      }
      return result;
  }
  function defaultMakeEmptyCell$1() {
      return new EmptyCell();
  }
  function findShapeOfResultMatrix(mat1, mat2, rowMapping, colMapping) {
      const nRow = mat1.length + mat2.length - Object.values(rowMapping).length;
      const nCol = mat1[0].length + mat2[0].length - Object.values(colMapping).length;
      return [nRow, nCol];
  }

  var _BaseTable_data, _BaseTable_labels, _BaseTable_rowGroups, _BaseTable_params;
  class BaseTable {
      constructor(data, params = {}) {
          var _a;
          _BaseTable_data.set(this, void 0);
          _BaseTable_labels.set(this, void 0);
          _BaseTable_rowGroups.set(this, void 0);
          _BaseTable_params.set(this, void 0);
          const { labels, groups } = params;
          __classPrivateFieldSet(this, _BaseTable_params, params, "f");
          __classPrivateFieldSet(this, _BaseTable_data, data, "f");
          __classPrivateFieldSet(this, _BaseTable_labels, labels
              ? new FilledTableLabels(labels.rows, labels.columns)
              : new EmptyTableLabels(...this.getShape()), "f");
          __classPrivateFieldSet(this, _BaseTable_rowGroups, (_a = groups === null || groups === void 0 ? void 0 : groups.rows) !== null && _a !== void 0 ? _a : [], "f");
      }
      getRowGroups() {
          return __classPrivateFieldGet(this, _BaseTable_rowGroups, "f");
      }
      getData() {
          return __classPrivateFieldGet(this, _BaseTable_data, "f");
      }
      getShape() {
          var _a, _b;
          return [__classPrivateFieldGet(this, _BaseTable_data, "f").length, (_b = (_a = __classPrivateFieldGet(this, _BaseTable_data, "f")[0]) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0];
      }
      getRowLabels() {
          return __classPrivateFieldGet(this, _BaseTable_labels, "f").getRowLabels();
      }
      getColumnLabels() {
          return __classPrivateFieldGet(this, _BaseTable_labels, "f").getColumnLabels();
      }
      clone(params) {
          const newParams = Object.assign(Object.assign({}, __classPrivateFieldGet(this, _BaseTable_params, "f")), params);
          return new BaseTable(__classPrivateFieldGet(this, _BaseTable_data, "f"), newParams);
      }
      merge(table) {
          return new CompositeTable(this, table);
      }
  }
  _BaseTable_data = new WeakMap(), _BaseTable_labels = new WeakMap(), _BaseTable_rowGroups = new WeakMap(), _BaseTable_params = new WeakMap();

  var _Group_instances, _Group_findRangeLength;
  class Group extends ValueObject {
      constructor(params) {
          var _a;
          super();
          _Group_instances.add(this);
          this.rangeStart = params.range[0];
          this.rangeLength = __classPrivateFieldGet(this, _Group_instances, "m", _Group_findRangeLength).call(this, (_a = params.expandedRange) !== null && _a !== void 0 ? _a : params.range);
      }
      hasRange(range) {
          if (this.getRange()[0] !== range[0])
              return false;
          if (this.getRange()[1] !== range[1])
              return false;
          return true;
      }
      getExpandedRange() {
          return [this.rangeStart, this.rangeStart + this.rangeLength];
      }
      getHideableRange() {
          return [this.rangeStart + 1, this.rangeStart + this.rangeLength];
      }
      getRangeLength() {
          return __classPrivateFieldGet(this, _Group_instances, "m", _Group_findRangeLength).call(this, this.getRange());
      }
      getExpandedRangeLength() {
          return this.rangeLength;
      }
      asGroupParams() {
          return {
              range: this.getRange(),
              expandedRange: this.getExpandedRange(),
          };
      }
      isIdentical(v) {
          return this.hasRange(v.getRange());
      }
  }
  _Group_instances = new WeakSet(), _Group_findRangeLength = function _Group_findRangeLength(r) {
      return r[1] - r[0];
  };

  class ExpandedGroup$1 extends Group {
      collapse() {
          return this.makeCollapsedGroup(this.asGroupParams());
      }
      expand() {
          return this;
      }
      isCollapsed() {
          return false;
      }
      getRange() {
          return [this.rangeStart, this.rangeStart + this.rangeLength];
      }
  }

  class CollapsedGroup$1 extends Group {
      collapse() {
          return this;
      }
      expand() {
          return this.makeExpandedGroup(this.asGroupParams());
      }
      isCollapsed() {
          return true;
      }
      getRange() {
          return [this.rangeStart, this.rangeStart + 1];
      }
  }

  class ExpandedGroup extends ExpandedGroup$1 {
      makeCollapsedGroup(params) {
          return new CollapsedGroup(params);
      }
  }
  class CollapsedGroup extends CollapsedGroup$1 {
      makeExpandedGroup(params) {
          return new ExpandedGroup(params);
      }
  }

  var _CollapseBehavior_hiddenRanges;
  class CollapseBehavior {
      constructor(rowGroups) {
          _CollapseBehavior_hiddenRanges.set(this, void 0);
          __classPrivateFieldSet(this, _CollapseBehavior_hiddenRanges, rowGroups
              .filter((g) => g.isCollapsed())
              .map((g) => g.getHideableRange()), "f");
      }
      filterData(data) {
          return data.filter((x, i) => !inRanges(__classPrivateFieldGet(this, _CollapseBehavior_hiddenRanges, "f"), i));
      }
      filterLabels(labels) {
          return labels.filter((x, i) => !inRanges(__classPrivateFieldGet(this, _CollapseBehavior_hiddenRanges, "f"), i));
      }
      findNumberOfCollapsedRows() {
          return __classPrivateFieldGet(this, _CollapseBehavior_hiddenRanges, "f").reduce((ag, r) => findRangeLength(r) + ag, 0);
      }
      collapseGroups(groups) {
          return groups.map((g) => __classPrivateFieldGet(this, _CollapseBehavior_hiddenRanges, "f")
              .filter((r) => groupComesAfter$1(g, r))
              .map((r) => findRangeLength(r))
              .reduce((g, len) => shiftGroupUp(g, len), g));
      }
  }
  _CollapseBehavior_hiddenRanges = new WeakMap();
  function shiftGroupUp(g, spots) {
      const Group = g.isCollapsed() ? CollapsedGroup : ExpandedGroup;
      return new Group({
          range: subtract(g.getRange(), spots),
          expandedRange: subtract(g.getExpandedRange(), spots),
      });
  }
  function inRanges(ranges, index) {
      return !!ranges.find((r) => inRange(r, index));
  }
  function inRange(range, index) {
      const [low, high] = range;
      return index >= low && index < high;
  }
  function subtract(range, value) {
      return [range[0] - value, range[1] - value];
  }
  function findRangeLength(r) {
      return r[1] - r[0];
  }
  function groupComesAfter$1(g, r2) {
      const r1 = g.getRange();
      return r2[1] <= r1[0];
  }

  var _RowCollapsible_table, _RowCollapsible_collapse;
  class RowCollapsible {
      constructor(table) {
          _RowCollapsible_table.set(this, void 0);
          _RowCollapsible_collapse.set(this, void 0);
          __classPrivateFieldSet(this, _RowCollapsible_table, table, "f");
          const rowGroups = table.getRowGroups();
          __classPrivateFieldSet(this, _RowCollapsible_collapse, new CollapseBehavior(rowGroups), "f");
      }
      getRowGroups() {
          const rowGroups = __classPrivateFieldGet(this, _RowCollapsible_table, "f").getRowGroups();
          return __classPrivateFieldGet(this, _RowCollapsible_collapse, "f").collapseGroups(rowGroups);
      }
      getData() {
          const data = __classPrivateFieldGet(this, _RowCollapsible_table, "f").getData();
          return __classPrivateFieldGet(this, _RowCollapsible_collapse, "f").filterData(data);
      }
      getShape() {
          const [r, c] = __classPrivateFieldGet(this, _RowCollapsible_table, "f").getShape();
          const collapsedRows = __classPrivateFieldGet(this, _RowCollapsible_collapse, "f").findNumberOfCollapsedRows();
          return [r - collapsedRows, c];
      }
      getRowLabels() {
          const labels = __classPrivateFieldGet(this, _RowCollapsible_table, "f").getRowLabels();
          return __classPrivateFieldGet(this, _RowCollapsible_collapse, "f").filterLabels(labels);
      }
      getColumnLabels() {
          return __classPrivateFieldGet(this, _RowCollapsible_table, "f").getColumnLabels();
      }
      clone(params) {
          const newInnerTable = __classPrivateFieldGet(this, _RowCollapsible_table, "f").clone(params);
          return new RowCollapsible(newInnerTable);
      }
      merge(table) {
          return new CompositeTable(this, table);
      }
  }
  _RowCollapsible_table = new WeakMap(), _RowCollapsible_collapse = new WeakMap();

  var _SortBehavior_mapping;
  class SortBehavior {
      constructor(newOrder, originalOrder) {
          _SortBehavior_mapping.set(this, void 0);
          __classPrivateFieldSet(this, _SortBehavior_mapping, originalOrder
              .slice()
              .sort((o1, o2) => {
              const idx1 = newOrder.indexOf(o1);
              const idx2 = newOrder.indexOf(o2);
              if (idx1 < 0)
                  return 1;
              if (idx2 < 0)
                  return -1;
              return idx1 - idx2;
          })
              .map((l) => originalOrder.indexOf(l)), "f");
      }
      arrange(arr) {
          const { length } = arr;
          return new Array(length)
              .fill(undefined)
              .map((_, i) => arr[__classPrivateFieldGet(this, _SortBehavior_mapping, "f")[i]]);
      }
      arrangeColumns(mat) {
          return mat.map((r) => this.arrange(r));
      }
  }
  _SortBehavior_mapping = new WeakMap();

  var _Ordered_table, _Ordered_rowBehavior, _Ordered_columnBehavior, _Ordered_params;
  class Ordered {
      constructor(table, order) {
          _Ordered_table.set(this, void 0);
          _Ordered_rowBehavior.set(this, void 0);
          _Ordered_columnBehavior.set(this, void 0);
          _Ordered_params.set(this, void 0);
          __classPrivateFieldSet(this, _Ordered_table, table, "f");
          __classPrivateFieldSet(this, _Ordered_params, order, "f");
          const columnLabels = table.getColumnLabels().map((l) => l.toString());
          const rowLabels = table.getRowLabels().map((l) => l.toString());
          __classPrivateFieldSet(this, _Ordered_rowBehavior, order.rows && new SortBehavior(order.rows, rowLabels), "f");
          __classPrivateFieldSet(this, _Ordered_columnBehavior, order.columns && new SortBehavior(order.columns, columnLabels), "f");
      }
      getData() {
          let data = __classPrivateFieldGet(this, _Ordered_table, "f").getData();
          if (__classPrivateFieldGet(this, _Ordered_rowBehavior, "f"))
              data = __classPrivateFieldGet(this, _Ordered_rowBehavior, "f").arrange(data);
          if (__classPrivateFieldGet(this, _Ordered_columnBehavior, "f"))
              data = __classPrivateFieldGet(this, _Ordered_columnBehavior, "f").arrangeColumns(data);
          return data;
      }
      getShape() {
          return __classPrivateFieldGet(this, _Ordered_table, "f").getShape();
      }
      getRowLabels() {
          const labels = __classPrivateFieldGet(this, _Ordered_table, "f").getRowLabels();
          return __classPrivateFieldGet(this, _Ordered_rowBehavior, "f") ? __classPrivateFieldGet(this, _Ordered_rowBehavior, "f").arrange(labels) : labels;
      }
      getColumnLabels() {
          const labels = __classPrivateFieldGet(this, _Ordered_table, "f").getColumnLabels();
          return __classPrivateFieldGet(this, _Ordered_columnBehavior, "f") ? __classPrivateFieldGet(this, _Ordered_columnBehavior, "f").arrange(labels) : labels;
      }
      getRowGroups() {
          return __classPrivateFieldGet(this, _Ordered_table, "f").getRowGroups();
      }
      clone(params) {
          return new Ordered(__classPrivateFieldGet(this, _Ordered_table, "f").clone(params), Object.assign(Object.assign({}, __classPrivateFieldGet(this, _Ordered_params, "f")), params.order));
      }
      merge(table) {
          return new CompositeTable(this, table);
      }
  }
  _Ordered_table = new WeakMap(), _Ordered_rowBehavior = new WeakMap(), _Ordered_columnBehavior = new WeakMap(), _Ordered_params = new WeakMap();

  var _Labeled_table, _Labeled_label, _Labeled_makeEmptyCell;
  class Labeled {
      constructor(table, label, makeEmptyCell = defaultMakeEmptyCell) {
          _Labeled_table.set(this, void 0);
          _Labeled_label.set(this, void 0);
          _Labeled_makeEmptyCell.set(this, defaultMakeEmptyCell);
          __classPrivateFieldSet(this, _Labeled_table, table, "f");
          __classPrivateFieldSet(this, _Labeled_label, label, "f");
          __classPrivateFieldSet(this, _Labeled_makeEmptyCell, makeEmptyCell, "f");
      }
      getData() {
          const data = __classPrivateFieldGet(this, _Labeled_table, "f").getData().slice();
          data.splice(0, 0, new Array(data[0].length).fill(__classPrivateFieldGet(this, _Labeled_makeEmptyCell, "f").call(this)));
          return data;
      }
      getShape() {
          const [r, c] = __classPrivateFieldGet(this, _Labeled_table, "f").getShape();
          return [r + 1, c];
      }
      getRowLabels() {
          const labels = __classPrivateFieldGet(this, _Labeled_table, "f").getRowLabels();
          labels.splice(0, 0, new Label(__classPrivateFieldGet(this, _Labeled_label, "f"), { bold: true }));
          return labels;
      }
      getColumnLabels() {
          const labels = __classPrivateFieldGet(this, _Labeled_table, "f").getColumnLabels();
          return labels;
      }
      getRowGroups() {
          return __classPrivateFieldGet(this, _Labeled_table, "f").getRowGroups();
      }
      clone(params) {
          const table = __classPrivateFieldGet(this, _Labeled_table, "f").clone(params);
          return new Labeled(table, __classPrivateFieldGet(this, _Labeled_label, "f"));
      }
      merge(table) {
          return new CompositeTable(this, table);
      }
  }
  _Labeled_table = new WeakMap(), _Labeled_label = new WeakMap(), _Labeled_makeEmptyCell = new WeakMap();
  function defaultMakeEmptyCell() {
      return new EmptyCell();
  }

  var _TableCell_cell, _TableCell_row, _TableCell_column, _TableCell_rowGroup;
  class TableCell extends Cell {
      constructor(cell, params) {
          super();
          _TableCell_cell.set(this, void 0);
          _TableCell_row.set(this, void 0);
          _TableCell_column.set(this, void 0);
          _TableCell_rowGroup.set(this, void 0);
          const { row, column, rowGroup } = params;
          __classPrivateFieldSet(this, _TableCell_cell, cell, "f");
          __classPrivateFieldSet(this, _TableCell_row, row, "f");
          __classPrivateFieldSet(this, _TableCell_column, column, "f");
          __classPrivateFieldSet(this, _TableCell_rowGroup, rowGroup, "f");
      }
      getRow() {
          return __classPrivateFieldGet(this, _TableCell_row, "f");
      }
      getColumn() {
          return __classPrivateFieldGet(this, _TableCell_column, "f");
      }
      getGroup() {
          return __classPrivateFieldGet(this, _TableCell_rowGroup, "f");
      }
      getValue() {
          return __classPrivateFieldGet(this, _TableCell_cell, "f").getValue();
      }
      getTooltip() {
          return __classPrivateFieldGet(this, _TableCell_cell, "f").getTooltip();
      }
      getAlertLevel() {
          return __classPrivateFieldGet(this, _TableCell_cell, "f").getAlertLevel();
      }
      toString() {
          return __classPrivateFieldGet(this, _TableCell_cell, "f").toString();
      }
  }
  _TableCell_cell = new WeakMap(), _TableCell_row = new WeakMap(), _TableCell_column = new WeakMap(), _TableCell_rowGroup = new WeakMap();

  var _TableRow_data, _TableRow_group, _TableRow_label;
  class TableRow {
      constructor(label, group) {
          _TableRow_data.set(this, []);
          _TableRow_group.set(this, void 0);
          _TableRow_label.set(this, void 0);
          __classPrivateFieldSet(this, _TableRow_label, label, "f");
          __classPrivateFieldSet(this, _TableRow_group, group !== null && group !== void 0 ? group : null, "f");
      }
      setCells(data) {
          __classPrivateFieldSet(this, _TableRow_data, data, "f");
      }
      getCells() {
          return __classPrivateFieldGet(this, _TableRow_data, "f");
      }
      getLabel() {
          return __classPrivateFieldGet(this, _TableRow_label, "f");
      }
      getLength() {
          return __classPrivateFieldGet(this, _TableRow_data, "f").length;
      }
      getGroup() {
          return __classPrivateFieldGet(this, _TableRow_group, "f");
      }
  }
  _TableRow_data = new WeakMap(), _TableRow_group = new WeakMap(), _TableRow_label = new WeakMap();

  var _TableColumn_data, _TableColumn_label;
  class TableColumn {
      constructor(label) {
          _TableColumn_data.set(this, []);
          _TableColumn_label.set(this, void 0);
          __classPrivateFieldSet(this, _TableColumn_label, label, "f");
      }
      setCells(data) {
          __classPrivateFieldSet(this, _TableColumn_data, data, "f");
      }
      getCells() {
          return __classPrivateFieldGet(this, _TableColumn_data, "f");
      }
      getLabel() {
          return __classPrivateFieldGet(this, _TableColumn_label, "f");
      }
      getLength() {
          return __classPrivateFieldGet(this, _TableColumn_data, "f").length;
      }
  }
  _TableColumn_data = new WeakMap(), _TableColumn_label = new WeakMap();

  var _TableGroup_group, _TableGroup_handlers;
  class TableGroup {
      constructor(group, handlers) {
          _TableGroup_group.set(this, void 0);
          _TableGroup_handlers.set(this, void 0);
          __classPrivateFieldSet(this, _TableGroup_group, group, "f");
          __classPrivateFieldSet(this, _TableGroup_handlers, handlers, "f");
      }
      getRange() {
          return __classPrivateFieldGet(this, _TableGroup_group, "f").getRange();
      }
      getExpandedRange() {
          return __classPrivateFieldGet(this, _TableGroup_group, "f").getExpandedRange();
      }
      isCollapsed() {
          return __classPrivateFieldGet(this, _TableGroup_group, "f").isCollapsed();
      }
      collapse() {
          return __classPrivateFieldGet(this, _TableGroup_handlers, "f").handleCollapse(__classPrivateFieldGet(this, _TableGroup_group, "f"));
      }
      expand() {
          return __classPrivateFieldGet(this, _TableGroup_handlers, "f").handleExpand(__classPrivateFieldGet(this, _TableGroup_group, "f"));
      }
      hasRange(r) {
          return __classPrivateFieldGet(this, _TableGroup_group, "f").hasRange(r);
      }
      includes(index) {
          const [from, to] = this.getRange();
          return from <= index && to > index;
      }
  }
  _TableGroup_group = new WeakMap(), _TableGroup_handlers = new WeakMap();

  var _TableFacade_instances, _TableFacade_table, _TableFacade_rows, _TableFacade_columns, _TableFacade_cells, _TableFacade_groups, _TableFacade_collapseRowGroup, _TableFacade_expandRowGroup, _TableFacade_clone, _TableFacade_buildRows, _TableFacade_buildGroups, _TableFacade_buildColumns, _TableFacade_setColumnData, _TableFacade_setRowData, _TableFacade_buildCells;
  class TableFacade {
      constructor(table) {
          _TableFacade_instances.add(this);
          _TableFacade_table.set(this, void 0);
          _TableFacade_rows.set(this, void 0);
          _TableFacade_columns.set(this, void 0);
          _TableFacade_cells.set(this, void 0);
          _TableFacade_groups.set(this, void 0);
          __classPrivateFieldSet(this, _TableFacade_table, table, "f");
          __classPrivateFieldSet(this, _TableFacade_groups, __classPrivateFieldGet(this, _TableFacade_instances, "m", _TableFacade_buildGroups).call(this, table), "f");
          __classPrivateFieldSet(this, _TableFacade_rows, __classPrivateFieldGet(this, _TableFacade_instances, "m", _TableFacade_buildRows).call(this, table), "f");
          __classPrivateFieldSet(this, _TableFacade_columns, __classPrivateFieldGet(this, _TableFacade_instances, "m", _TableFacade_buildColumns).call(this, table), "f");
          __classPrivateFieldSet(this, _TableFacade_cells, __classPrivateFieldGet(this, _TableFacade_instances, "m", _TableFacade_buildCells).call(this, table), "f");
          __classPrivateFieldGet(this, _TableFacade_instances, "m", _TableFacade_setRowData).call(this, __classPrivateFieldGet(this, _TableFacade_cells, "f"));
          __classPrivateFieldGet(this, _TableFacade_instances, "m", _TableFacade_setColumnData).call(this, __classPrivateFieldGet(this, _TableFacade_cells, "f"));
      }
      getCells() {
          return __classPrivateFieldGet(this, _TableFacade_cells, "f");
      }
      getRows() {
          return __classPrivateFieldGet(this, _TableFacade_rows, "f");
      }
      getColumns() {
          return __classPrivateFieldGet(this, _TableFacade_columns, "f");
      }
      getRowGroups() {
          return __classPrivateFieldGet(this, _TableFacade_groups, "f").sort((g1, g2) => g1.getRange()[0] - g2.getRange()[0]);
      }
      getRowGroupByRange(r) {
          return __classPrivateFieldGet(this, _TableFacade_groups, "f").find((g) => g.hasRange(r));
      }
      getShape() {
          return __classPrivateFieldGet(this, _TableFacade_table, "f").getShape();
      }
      getRowLabels() {
          return __classPrivateFieldGet(this, _TableFacade_table, "f").getRowLabels();
      }
      getColumnLabels() {
          return __classPrivateFieldGet(this, _TableFacade_table, "f").getColumnLabels();
      }
      getBase() {
          return __classPrivateFieldGet(this, _TableFacade_table, "f");
      }
      merge(table, theirSubheader, ourSubheader, params) {
          let theirTable = table.getBase();
          if (theirSubheader)
              theirTable = new Labeled(theirTable, theirSubheader);
          let ourTable = __classPrivateFieldGet(this, _TableFacade_table, "f");
          if (ourSubheader)
              ourTable = new Labeled(ourTable, ourSubheader);
          let newTable = ourTable.merge(theirTable);
          if (params === null || params === void 0 ? void 0 : params.order)
              newTable = new Ordered(newTable, params.order);
          return new TableFacade(newTable);
      }
  }
  _TableFacade_table = new WeakMap(), _TableFacade_rows = new WeakMap(), _TableFacade_columns = new WeakMap(), _TableFacade_cells = new WeakMap(), _TableFacade_groups = new WeakMap(), _TableFacade_instances = new WeakSet(), _TableFacade_collapseRowGroup = function _TableFacade_collapseRowGroup(old) {
      const rowGroups = __classPrivateFieldGet(this, _TableFacade_table, "f").getRowGroups();
      const newGroups = rowGroups.filter((g) => !g.is(old));
      return __classPrivateFieldGet(this, _TableFacade_instances, "m", _TableFacade_clone).call(this, {
          groups: {
              rows: [...newGroups, old.collapse()],
          },
      });
  }, _TableFacade_expandRowGroup = function _TableFacade_expandRowGroup(old) {
      const otherGroups = __classPrivateFieldGet(this, _TableFacade_table, "f").getRowGroups().filter((g) => !g.is(old));
      const newGroups = [
          ...otherGroups.filter((g) => !groupComesAfter(g, old)),
          old.expand(),
      ];
      for (const g of otherGroups.filter((g) => groupComesAfter(g, old))) {
          const Group = g.isCollapsed() ? CollapsedGroup : ExpandedGroup;
          newGroups.push(new Group({
              range: addToRange(g.getRange(), old.getRangeLength()),
              expandedRange: addToRange(g.getExpandedRange(), old.getRangeLength()),
          }));
      }
      return __classPrivateFieldGet(this, _TableFacade_instances, "m", _TableFacade_clone).call(this, {
          groups: {
              rows: newGroups,
          },
      });
  }, _TableFacade_clone = function _TableFacade_clone(params) {
      const newInnerTable = __classPrivateFieldGet(this, _TableFacade_table, "f").clone(params);
      return new TableFacade(newInnerTable);
  }, _TableFacade_buildRows = function _TableFacade_buildRows(table) {
      const [nRow] = table.getShape();
      const rowLabels = table.getRowLabels();
      return makeArray(nRow).map((v, i) => new TableRow(rowLabels[i], __classPrivateFieldGet(this, _TableFacade_groups, "f").find((g) => g.includes(i))));
  }, _TableFacade_buildGroups = function _TableFacade_buildGroups(table) {
      const rowGroups = table.getRowGroups();
      return rowGroups.map((g) => new TableGroup(g, {
          handleCollapse: (group) => group.isCollapsed() ? this : __classPrivateFieldGet(this, _TableFacade_instances, "m", _TableFacade_collapseRowGroup).call(this, group),
          handleExpand: (group) => group.isCollapsed() ? __classPrivateFieldGet(this, _TableFacade_instances, "m", _TableFacade_expandRowGroup).call(this, group) : this,
      }));
  }, _TableFacade_buildColumns = function _TableFacade_buildColumns(table) {
      const [, nCol] = table.getShape();
      const columnLabels = table.getColumnLabels();
      return makeArray(nCol).map((v, i) => new TableColumn(columnLabels[i]));
  }, _TableFacade_setColumnData = function _TableFacade_setColumnData(cells) {
      for (const [j, column] of __classPrivateFieldGet(this, _TableFacade_columns, "f").entries()) {
          const values = cells.map((c) => c[j]);
          column.setCells(values);
      }
  }, _TableFacade_setRowData = function _TableFacade_setRowData(cells) {
      for (const [i, row] of __classPrivateFieldGet(this, _TableFacade_rows, "f").entries()) {
          const values = cells[i];
          row.setCells(values);
      }
  }, _TableFacade_buildCells = function _TableFacade_buildCells(table) {
      const result = makeMatrix(...table.getShape());
      for (const [i, row] of table.getData().entries()) {
          for (const [j, cell] of row.entries()) {
              result[i][j] = new TableCell(cell, {
                  row: __classPrivateFieldGet(this, _TableFacade_rows, "f")[i],
                  column: __classPrivateFieldGet(this, _TableFacade_columns, "f")[j],
                  rowGroup: __classPrivateFieldGet(this, _TableFacade_rows, "f")[i].getGroup(),
              });
          }
      }
      return result;
  };
  function makeArray(n) {
      return new Array(n).fill(undefined);
  }
  function makeMatrix(n, m) {
      return makeArray(n).map(() => makeArray(m));
  }
  function addToRange(r, v) {
      return [r[0] + v, r[1] + v];
  }
  function groupComesAfter(g1, g2) {
      const r1 = g1.getRange();
      const r2 = g2.getRange();
      return r1[0] >= r2[1];
  }

  function makeTable(data, params) {
      validate$1(rules(data, params));
      let table = new BaseTable(data, params);
      table = new RowCollapsible(table);
      if (params === null || params === void 0 ? void 0 : params.order)
          table = new Ordered(table, params.order);
      if (params === null || params === void 0 ? void 0 : params.label)
          table = new Labeled(table, params.label);
      return new TableFacade(table);
  }

  var _WebTableElement_highlighted, _WebTableElement_active, _WebTableElement_value, _WebTableElement_tooltip;
  class WebTableElement {
      constructor(id, cell) {
          _WebTableElement_highlighted.set(this, false);
          _WebTableElement_active.set(this, false);
          _WebTableElement_value.set(this, void 0);
          _WebTableElement_tooltip.set(this, void 0);
          this.id = id;
          __classPrivateFieldSet(this, _WebTableElement_value, cell.getValue() === 'NA' ? '\u00a0' : cell.getValue(), "f");
          __classPrivateFieldSet(this, _WebTableElement_tooltip, cell.getTooltip().toString(), "f");
      }
      getHighlighted() {
          return __classPrivateFieldGet(this, _WebTableElement_highlighted, "f");
      }
      getActive() {
          return __classPrivateFieldGet(this, _WebTableElement_active, "f");
      }
      toggleActive() {
          __classPrivateFieldSet(this, _WebTableElement_active, !__classPrivateFieldGet(this, _WebTableElement_active, "f"), "f");
      }
      toggleHighlighted() {
          __classPrivateFieldSet(this, _WebTableElement_highlighted, !__classPrivateFieldGet(this, _WebTableElement_highlighted, "f"), "f");
      }
      setActive() {
          __classPrivateFieldSet(this, _WebTableElement_active, true, "f");
      }
      unsetActive() {
          __classPrivateFieldSet(this, _WebTableElement_active, false, "f");
      }
      highlight() {
          __classPrivateFieldSet(this, _WebTableElement_highlighted, true, "f");
      }
      unHighlight() {
          __classPrivateFieldSet(this, _WebTableElement_highlighted, false, "f");
      }
      getValue() {
          return __classPrivateFieldGet(this, _WebTableElement_value, "f");
      }
      getTooltip() {
          return __classPrivateFieldGet(this, _WebTableElement_tooltip, "f");
      }
  }
  _WebTableElement_highlighted = new WeakMap(), _WebTableElement_active = new WeakMap(), _WebTableElement_value = new WeakMap(), _WebTableElement_tooltip = new WeakMap();

  var _WebRowHeader_isCollapsed, _WebRowHeader_inGroup, _WebRowHeader_group, _WebRowHeader_firstOfGroup, _WebRowHeader_isBold, _WebRowHeader_hasWarning;
  class WebRowHeader extends WebTableElement {
      constructor(id, label, group) {
          super(id, label);
          _WebRowHeader_isCollapsed.set(this, void 0);
          _WebRowHeader_inGroup.set(this, void 0);
          _WebRowHeader_group.set(this, void 0);
          _WebRowHeader_firstOfGroup.set(this, void 0);
          _WebRowHeader_isBold.set(this, void 0);
          _WebRowHeader_hasWarning.set(this, void 0);
          __classPrivateFieldSet(this, _WebRowHeader_group, group, "f");
          __classPrivateFieldSet(this, _WebRowHeader_inGroup, group !== null, "f");
          __classPrivateFieldSet(this, _WebRowHeader_isCollapsed, group === null || group === void 0 ? void 0 : group.isCollapsed(), "f");
          __classPrivateFieldSet(this, _WebRowHeader_firstOfGroup, id === (group === null || group === void 0 ? void 0 : group.getRange()[0]), "f");
          __classPrivateFieldSet(this, _WebRowHeader_isBold, label.isBold(), "f");
          __classPrivateFieldSet(this, _WebRowHeader_hasWarning, label.getAlertLevel() >= AlertLevels.WARN, "f");
      }
      isCollapsed() {
          return __classPrivateFieldGet(this, _WebRowHeader_isCollapsed, "f");
      }
      inGroup() {
          return __classPrivateFieldGet(this, _WebRowHeader_inGroup, "f");
      }
      getGroup() {
          return __classPrivateFieldGet(this, _WebRowHeader_group, "f");
      }
      isFirstOfGroup() {
          return __classPrivateFieldGet(this, _WebRowHeader_firstOfGroup, "f");
      }
      isBold() {
          return __classPrivateFieldGet(this, _WebRowHeader_isBold, "f");
      }
      hasWarning() {
          return __classPrivateFieldGet(this, _WebRowHeader_hasWarning, "f");
      }
  }
  _WebRowHeader_isCollapsed = new WeakMap(), _WebRowHeader_inGroup = new WeakMap(), _WebRowHeader_group = new WeakMap(), _WebRowHeader_firstOfGroup = new WeakMap(), _WebRowHeader_isBold = new WeakMap(), _WebRowHeader_hasWarning = new WeakMap();

  var _WebTable_instances, _WebTable_highlightColumn, _WebTable_unhighlightColumn, _WebTable_highlightRow, _WebTable_unhighlightRow;
  class WebTable {
      constructor(table) {
          _WebTable_instances.add(this);
          this.grid = table
              .getCells()
              .map((r) => r.map((c, i) => new WebTableElement(i, c)));
          this.rowHeaders = table
              .getRows()
              .map((r, i) => new WebRowHeader(i, r.getLabel(), r.getGroup()));
          this.columnHeaders = table
              .getColumnLabels()
              .map((l, i) => new WebTableElement(i, l));
      }
      highlightColumn(i) {
          this.columnHeaders[i].setActive();
          __classPrivateFieldGet(this, _WebTable_instances, "m", _WebTable_highlightColumn).call(this, i);
      }
      unhighlightColumn(i) {
          this.columnHeaders[i].unsetActive();
          __classPrivateFieldGet(this, _WebTable_instances, "m", _WebTable_unhighlightColumn).call(this, i);
      }
      highlightCell(i, j) {
          this.grid[i][j].setActive();
          __classPrivateFieldGet(this, _WebTable_instances, "m", _WebTable_highlightRow).call(this, i);
          __classPrivateFieldGet(this, _WebTable_instances, "m", _WebTable_highlightColumn).call(this, j);
      }
      unhighlightCell(i, j) {
          this.grid[i][j].unsetActive();
          __classPrivateFieldGet(this, _WebTable_instances, "m", _WebTable_unhighlightRow).call(this, i);
          __classPrivateFieldGet(this, _WebTable_instances, "m", _WebTable_unhighlightColumn).call(this, j);
      }
      highlightRow(i) {
          this.rowHeaders[i].setActive();
          __classPrivateFieldGet(this, _WebTable_instances, "m", _WebTable_highlightRow).call(this, i);
      }
      unhighlightRow(i) {
          this.rowHeaders[i].unsetActive();
          __classPrivateFieldGet(this, _WebTable_instances, "m", _WebTable_unhighlightRow).call(this, i);
      }
  }
  _WebTable_instances = new WeakSet(), _WebTable_highlightColumn = function _WebTable_highlightColumn(i) {
      this.grid.forEach((row) => {
          row[i].highlight();
      });
      this.columnHeaders[i].highlight();
  }, _WebTable_unhighlightColumn = function _WebTable_unhighlightColumn(i) {
      this.grid.forEach((row) => {
          row[i].unHighlight();
      });
      this.columnHeaders[i].unHighlight();
  }, _WebTable_highlightRow = function _WebTable_highlightRow(i) {
      this.grid[i].forEach((cell) => {
          cell.highlight();
      });
      this.rowHeaders[i].highlight();
  }, _WebTable_unhighlightRow = function _WebTable_unhighlightRow(i) {
      this.grid[i].forEach((cell) => {
          cell.unHighlight();
      });
      this.rowHeaders[i].unHighlight();
  };

  var _WebTablePresenter_table;
  class WebTablePresenter {
      constructor() {
          _WebTablePresenter_table.set(this, null);
      }
      setData(t) {
          __classPrivateFieldSet(this, _WebTablePresenter_table, t, "f");
      }
      buildViewModel() {
          if (!__classPrivateFieldGet(this, _WebTablePresenter_table, "f"))
              return null;
          return new WebTable(__classPrivateFieldGet(this, _WebTablePresenter_table, "f"));
      }
  }
  _WebTablePresenter_table = new WeakMap();

  var _AntibiogramController_instances, _AntibiogramController_showOne, _AntibiogramController_showComposite, _AntibiogramController_sortAntibiograms;
  class AntibiogramController {
      constructor(showAntibiogramAction, showGramPositiveAndNegativeAntibiogramAction) {
          _AntibiogramController_instances.add(this);
          _AntibiogramController_showOne.set(this, void 0);
          _AntibiogramController_showComposite.set(this, void 0);
          __classPrivateFieldSet(this, _AntibiogramController_showOne, showAntibiogramAction, "f");
          __classPrivateFieldSet(this, _AntibiogramController_showComposite, showGramPositiveAndNegativeAntibiogramAction, "f");
      }
      show(id) {
          return __awaiter(this, void 0, void 0, function* () {
              const presenter = new WebAntibiogramPresenter(new WebTablePresenter());
              yield __classPrivateFieldGet(this, _AntibiogramController_showOne, "f").present(presenter, id);
              return presenter.buildViewModel();
          });
      }
      showComposite(id1, id2) {
          return __awaiter(this, void 0, void 0, function* () {
              const presenter = new WebAntibiogramPresenter(new WebTablePresenter());
              yield __classPrivateFieldGet(this, _AntibiogramController_showComposite, "f").present(presenter, id1, id2);
              return presenter.buildViewModel();
          });
      }
      showMany(ids) {
          return __awaiter(this, void 0, void 0, function* () {
              const promises = ids.map((id) => this.show(id));
              const abgs = yield Promise.all(promises);
              return __classPrivateFieldGet(this, _AntibiogramController_instances, "m", _AntibiogramController_sortAntibiograms).call(this, abgs);
          });
      }
  }
  _AntibiogramController_showOne = new WeakMap(), _AntibiogramController_showComposite = new WeakMap(), _AntibiogramController_instances = new WeakSet(), _AntibiogramController_sortAntibiograms = function _AntibiogramController_sortAntibiograms(abgs) {
      abgs.sort((v1, v2) => (v1 && v2 ? ((v1 === null || v1 === void 0 ? void 0 : v1.gram) > (v2 === null || v2 === void 0 ? void 0 : v2.gram) ? 1 : -1) : 0));
      return abgs;
  };

  var _WebAntibiogramGroupPresenter_instances, _WebAntibiogramGroupPresenter_data, _WebAntibiogramGroupPresenter_group, _WebAntibiogramGroupPresenter_findUnique;
  class WebAntibiogramGroupPresenter {
      constructor() {
          _WebAntibiogramGroupPresenter_instances.add(this);
          _WebAntibiogramGroupPresenter_data.set(this, null);
      }
      setData(data) {
          __classPrivateFieldSet(this, _WebAntibiogramGroupPresenter_data, data, "f");
      }
      buildViewModel() {
          if (__classPrivateFieldGet(this, _WebAntibiogramGroupPresenter_data, "f") === null)
              return null;
          const data = __classPrivateFieldGet(this, _WebAntibiogramGroupPresenter_data, "f");
          const places = __classPrivateFieldGet(this, _WebAntibiogramGroupPresenter_instances, "m", _WebAntibiogramGroupPresenter_group).call(this, (d) => d.place, data);
          const result = places.map(([place, data]) => ({
              place: place.toString(),
              intervals: __classPrivateFieldGet(this, _WebAntibiogramGroupPresenter_instances, "m", _WebAntibiogramGroupPresenter_group).call(this, (d) => d.interval, data).map(([interval, data]) => ({
                  interval: interval.toString(),
                  groups: __classPrivateFieldGet(this, _WebAntibiogramGroupPresenter_instances, "m", _WebAntibiogramGroupPresenter_group).call(this, (d) => d.info, data).map(([si, data]) => ({
                      title: !si.is(new SampleInfo([])) ? si.toString() : 'Antibiogram',
                      antibiograms: data.map((abg) => ({
                          gram: abg.gram.toString(),
                          id: abg.id.getValue(),
                      })),
                  })),
              })),
          }));
          return result;
      }
  }
  _WebAntibiogramGroupPresenter_data = new WeakMap(), _WebAntibiogramGroupPresenter_instances = new WeakSet(), _WebAntibiogramGroupPresenter_group = function _WebAntibiogramGroupPresenter_group(accessor, arr) {
      const uq = __classPrivateFieldGet(this, _WebAntibiogramGroupPresenter_instances, "m", _WebAntibiogramGroupPresenter_findUnique).call(this, accessor, arr);
      const map = new Map();
      for (const item of uq) {
          const ingroup = arr.filter((v) => accessor(v).is(item));
          map.set(item, ingroup);
      }
      return Array.from(map.entries());
  }, _WebAntibiogramGroupPresenter_findUnique = function _WebAntibiogramGroupPresenter_findUnique(accessor, arr) {
      const seen = [];
      for (const item of arr.map((v) => accessor(v))) {
          if (seen.find((p) => p.is(item)))
              continue;
          seen.push(item);
      }
      return seen;
  };

  var _AntibiogramGroupController_action;
  class AntibiogramGroupController {
      constructor(indexAntibiogramGroupsAction) {
          _AntibiogramGroupController_action.set(this, void 0);
          __classPrivateFieldSet(this, _AntibiogramGroupController_action, indexAntibiogramGroupsAction, "f");
      }
      index() {
          return __awaiter(this, void 0, void 0, function* () {
              const presenter = new WebAntibiogramGroupPresenter();
              yield __classPrivateFieldGet(this, _AntibiogramGroupController_action, "f").present(presenter);
              return presenter.buildViewModel();
          });
      }
  }
  _AntibiogramGroupController_action = new WeakMap();

  var EOL = {},
      EOF = {},
      QUOTE = 34,
      NEWLINE = 10,
      RETURN = 13;

  function objectConverter(columns) {
    return new Function("d", "return {" + columns.map(function(name, i) {
      return JSON.stringify(name) + ": d[" + i + "] || \"\"";
    }).join(",") + "}");
  }

  function customConverter(columns, f) {
    var object = objectConverter(columns);
    return function(row, i) {
      return f(object(row), i, columns);
    };
  }

  // Compute unique columns in order of discovery.
  function inferColumns(rows) {
    var columnSet = Object.create(null),
        columns = [];

    rows.forEach(function(row) {
      for (var column in row) {
        if (!(column in columnSet)) {
          columns.push(columnSet[column] = column);
        }
      }
    });

    return columns;
  }

  function pad(value, width) {
    var s = value + "", length = s.length;
    return length < width ? new Array(width - length + 1).join(0) + s : s;
  }

  function formatYear(year) {
    return year < 0 ? "-" + pad(-year, 6)
      : year > 9999 ? "+" + pad(year, 6)
      : pad(year, 4);
  }

  function formatDate(date) {
    var hours = date.getUTCHours(),
        minutes = date.getUTCMinutes(),
        seconds = date.getUTCSeconds(),
        milliseconds = date.getUTCMilliseconds();
    return isNaN(date) ? "Invalid Date"
        : formatYear(date.getUTCFullYear()) + "-" + pad(date.getUTCMonth() + 1, 2) + "-" + pad(date.getUTCDate(), 2)
        + (milliseconds ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2) + "." + pad(milliseconds, 3) + "Z"
        : seconds ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2) + "Z"
        : minutes || hours ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + "Z"
        : "");
  }

  function dsv(delimiter) {
    var reFormat = new RegExp("[\"" + delimiter + "\n\r]"),
        DELIMITER = delimiter.charCodeAt(0);

    function parse(text, f) {
      var convert, columns, rows = parseRows(text, function(row, i) {
        if (convert) return convert(row, i - 1);
        columns = row, convert = f ? customConverter(row, f) : objectConverter(row);
      });
      rows.columns = columns || [];
      return rows;
    }

    function parseRows(text, f) {
      var rows = [], // output rows
          N = text.length,
          I = 0, // current character index
          n = 0, // current line number
          t, // current token
          eof = N <= 0, // current token followed by EOF?
          eol = false; // current token followed by EOL?

      // Strip the trailing newline.
      if (text.charCodeAt(N - 1) === NEWLINE) --N;
      if (text.charCodeAt(N - 1) === RETURN) --N;

      function token() {
        if (eof) return EOF;
        if (eol) return eol = false, EOL;

        // Unescape quotes.
        var i, j = I, c;
        if (text.charCodeAt(j) === QUOTE) {
          while (I++ < N && text.charCodeAt(I) !== QUOTE || text.charCodeAt(++I) === QUOTE);
          if ((i = I) >= N) eof = true;
          else if ((c = text.charCodeAt(I++)) === NEWLINE) eol = true;
          else if (c === RETURN) { eol = true; if (text.charCodeAt(I) === NEWLINE) ++I; }
          return text.slice(j + 1, i - 1).replace(/""/g, "\"");
        }

        // Find next delimiter or newline.
        while (I < N) {
          if ((c = text.charCodeAt(i = I++)) === NEWLINE) eol = true;
          else if (c === RETURN) { eol = true; if (text.charCodeAt(I) === NEWLINE) ++I; }
          else if (c !== DELIMITER) continue;
          return text.slice(j, i);
        }

        // Return last token before EOF.
        return eof = true, text.slice(j, N);
      }

      while ((t = token()) !== EOF) {
        var row = [];
        while (t !== EOL && t !== EOF) row.push(t), t = token();
        if (f && (row = f(row, n++)) == null) continue;
        rows.push(row);
      }

      return rows;
    }

    function preformatBody(rows, columns) {
      return rows.map(function(row) {
        return columns.map(function(column) {
          return formatValue(row[column]);
        }).join(delimiter);
      });
    }

    function format(rows, columns) {
      if (columns == null) columns = inferColumns(rows);
      return [columns.map(formatValue).join(delimiter)].concat(preformatBody(rows, columns)).join("\n");
    }

    function formatBody(rows, columns) {
      if (columns == null) columns = inferColumns(rows);
      return preformatBody(rows, columns).join("\n");
    }

    function formatRows(rows) {
      return rows.map(formatRow).join("\n");
    }

    function formatRow(row) {
      return row.map(formatValue).join(delimiter);
    }

    function formatValue(value) {
      return value == null ? ""
          : value instanceof Date ? formatDate(value)
          : reFormat.test(value += "") ? "\"" + value.replace(/"/g, "\"\"") + "\""
          : value;
    }

    return {
      parse: parse,
      parseRows: parseRows,
      format: format,
      formatBody: formatBody,
      formatRows: formatRows,
      formatRow: formatRow,
      formatValue: formatValue
    };
  }

  var csv = dsv(",");

  var csvParse = csv.parse;
  var csvParseRows = csv.parseRows;
  var csvFormat = csv.format;
  var csvFormatBody = csv.formatBody;
  var csvFormatRows = csv.formatRows;
  var csvFormatRow = csv.formatRow;
  var csvFormatValue = csv.formatValue;

  var tsv = dsv("\t");

  var tsvParse = tsv.parse;
  var tsvParseRows = tsv.parseRows;
  var tsvFormat = tsv.format;
  var tsvFormatBody = tsv.formatBody;
  var tsvFormatRows = tsv.formatRows;
  var tsvFormatRow = tsv.formatRow;
  var tsvFormatValue = tsv.formatValue;

  function autoType(object) {
    for (var key in object) {
      var value = object[key].trim(), number, m;
      if (!value) value = null;
      else if (value === "true") value = true;
      else if (value === "false") value = false;
      else if (value === "NaN") value = NaN;
      else if (!isNaN(number = +value)) value = number;
      else if (m = value.match(/^([-+]\d{2})?\d{4}(-\d{2}(-\d{2})?)?(T\d{2}:\d{2}(:\d{2}(\.\d{3})?)?(Z|[-+]\d{2}:\d{2})?)?$/)) {
        if (fixtz && !!m[4] && !m[7]) value = value.replace(/-/g, "/").replace(/T/, " ");
        value = new Date(value);
      }
      else continue;
      object[key] = value;
    }
    return object;
  }

  // https://github.com/d3/d3-dsv/issues/45
  const fixtz = new Date("2019-01-01T00:00").getHours() || new Date("2019-07-01T00:00").getHours();

  var d3Dsv = /*#__PURE__*/Object.freeze({
    __proto__: null,
    dsvFormat: dsv,
    csvParse: csvParse,
    csvParseRows: csvParseRows,
    csvFormat: csvFormat,
    csvFormatBody: csvFormatBody,
    csvFormatRows: csvFormatRows,
    csvFormatRow: csvFormatRow,
    csvFormatValue: csvFormatValue,
    tsvParse: tsvParse,
    tsvParseRows: tsvParseRows,
    tsvFormat: tsvFormat,
    tsvFormatBody: tsvFormatBody,
    tsvFormatRows: tsvFormatRows,
    tsvFormatRow: tsvFormatRow,
    tsvFormatValue: tsvFormatValue,
    autoType: autoType
  });

  Object.assign({}, d3Dsv);

  function parseCsv(csv) {
      return csvParse(csv, (row) => {
          var _a;
          for (const col in row) {
              row[col] = (_a = row[col]) === null || _a === void 0 ? void 0 : _a.trim();
              if (row[col] === '#N/A')
                  row[col] = undefined;
              if (row[col] === '')
                  row[col] = undefined;
          }
          return row;
      });
  }

  var _CsvMissingRequiredValueError_field, _CsvMissingRequiredValueError_rowNumber;
  class CsvMissingRequiredValueError extends Error {
      constructor(field, rowNumber) {
          super();
          _CsvMissingRequiredValueError_field.set(this, void 0);
          _CsvMissingRequiredValueError_rowNumber.set(this, void 0);
          __classPrivateFieldSet(this, _CsvMissingRequiredValueError_field, field, "f");
          __classPrivateFieldSet(this, _CsvMissingRequiredValueError_rowNumber, rowNumber, "f");
      }
      setRowNumber(n) {
          __classPrivateFieldSet(this, _CsvMissingRequiredValueError_rowNumber, n, "f");
      }
      get message() {
          let message = 'Missing required field "' + __classPrivateFieldGet(this, _CsvMissingRequiredValueError_field, "f") + '"';
          if (__classPrivateFieldGet(this, _CsvMissingRequiredValueError_rowNumber, "f"))
              message += ' on at row number ' + __classPrivateFieldGet(this, _CsvMissingRequiredValueError_rowNumber, "f");
          return message;
      }
  }
  _CsvMissingRequiredValueError_field = new WeakMap(), _CsvMissingRequiredValueError_rowNumber = new WeakMap();

  function validate(requiredFields, rows) {
      rows.forEach((r, i) => {
          try {
              validateRow(requiredFields, r);
          }
          catch (e) {
              if (e instanceof CsvMissingRequiredValueError)
                  e.setRowNumber(i);
              throw e;
          }
      });
  }
  function validateRow(requiredFields, row) {
      for (const [column, value] of Object.entries(row)) {
          for (const req in requiredFields) {
              if (column === req && typeof value === 'undefined')
                  throw new CsvMissingRequiredValueError(column);
          }
      }
  }

  var _Csv_csv, _Csv_parsed;
  class Csv {
      constructor(csv) {
          _Csv_csv.set(this, void 0);
          _Csv_parsed.set(this, null);
          __classPrivateFieldSet(this, _Csv_csv, csv, "f");
      }
      parse() {
          if (!__classPrivateFieldGet(this, _Csv_parsed, "f")) {
              const parsed = parseCsv(__classPrivateFieldGet(this, _Csv_csv, "f"));
              const required = this.getRequiredFields();
              validate(required, parsed);
              __classPrivateFieldSet(this, _Csv_parsed, parsed, "f");
          }
          return __classPrivateFieldGet(this, _Csv_parsed, "f");
      }
  }
  _Csv_csv = new WeakMap(), _Csv_parsed = new WeakMap();

  var AtlasRequiredFields;
  (function (AtlasRequiredFields) {
      AtlasRequiredFields["year_month_start"] = "year_month_start";
      AtlasRequiredFields["year_month_end"] = "year_month_end";
      AtlasRequiredFields["antibiogram_id"] = "antibiogram_id";
      AtlasRequiredFields["csv"] = "csv";
  })(AtlasRequiredFields || (AtlasRequiredFields = {}));
  var AtlasNullableFields;
  (function (AtlasNullableFields) {
      AtlasNullableFields["region"] = "region";
      AtlasNullableFields["institution"] = "institution";
      AtlasNullableFields["sample_info"] = "sample_info";
      AtlasNullableFields["gram"] = "gram";
      AtlasNullableFields["metadata"] = "metadata";
  })(AtlasNullableFields || (AtlasNullableFields = {}));
  class AtlasCsv extends Csv {
      getRequiredFields() {
          return AtlasRequiredFields;
      }
  }

  var DataRequiredFields;
  (function (DataRequiredFields) {
      DataRequiredFields["organism_name"] = "organism_name";
      DataRequiredFields["antibiotic_name"] = "antibiotic_name";
      DataRequiredFields["value"] = "value";
  })(DataRequiredFields || (DataRequiredFields = {}));
  var DataNullableFields;
  (function (DataNullableFields) {
      DataNullableFields["isolates"] = "isolates";
      DataNullableFields["antibiotic_route"] = "antibiotic_route";
      DataNullableFields["sample_info"] = "sample_info";
  })(DataNullableFields || (DataNullableFields = {}));
  class DataCsv extends Csv {
      getRequiredFields() {
          return DataRequiredFields;
      }
  }

  const org = (name) => new OrganismValue(name);
  const abx = (name, route) => new SingleAntibioticValue(name, route);
  const value = (value) => new SensitivityValue(value);
  const route = (name) => {
      if (name === 'PO')
          return routeFactory.PO;
      if (name === 'IV')
          return routeFactory.IV;
      if (name === 'IV/PO')
          return routeFactory.IV_PO;
      throw new Error('Unknown Route');
  };
  const iso = (value) => {
      return new IntegerNumberOfIsolates(+value);
  };
  const infoItem = (value) => {
      if (value === 'inpatient')
          return Settings.INPATIENT;
      if (value === 'outpatient')
          return Settings.OUTPATIENT;
      if (value === 'urine')
          return Sources.URINE;
      if (value === 'non-urine')
          return Sources.NONURINE;
      if (value === 'meningitis')
          return Sources.MENINGITIS;
      if (value === 'non-meningitis')
          return Sources.NONMENINGITIS;
      if (value === 'oral')
          return Sources.ORAL;
      throw new Error('Unknown Sample Info Item' + value);
  };
  const info = (listStr) => {
      const list = listStr.split(/, ?/g).map((l) => infoItem(l));
      return new SampleInfo(list);
  };
  const gram = (value) => {
      if (value === 'positive')
          return GramValues.POSITIVE;
      if (value === 'negative')
          return GramValues.NEGATIVE;
      if (value === 'unspecified')
          return GramValues.UNSPECIFIED;
      throw new Error('Unknown Gram Value ' + value);
  };
  const place = (region, institution) => new Place(region, institution);
  const interval = (start, stop) => {
      const startYear = +start.slice(0, 4);
      const startMonth = +start.slice(4, 6);
      const endYear = +stop.slice(0, 4);
      const endMonth = +stop.slice(4, 6);
      return new Interval(new Date(+startYear, +startMonth - 1), new Date(+endYear, +endMonth - 1));
  };
  const id = (id) => new AntibiogramId(id);
  const metadata = (metadata) => {
      const constructors = {
          [RowOrder.slug]: RowOrder,
          [ColumnOrder.slug]: ColumnOrder,
          [Footnotes.slug]: Footnotes,
      };
      const entries = Object.entries(metadata);
      return new Metadata(entries.map(([k, v]) => new constructors[k](v)));
  };

  var _FileAntibiogramRepository_instances, _FileAntibiogramRepository_fs, _FileAntibiogramRepository_atlas, _FileAntibiogramRepository_loadAtlas, _FileAntibiogramRepository_getByAtlasRow;
  class FileAntibiogramRepository {
      constructor(filesystem) {
          _FileAntibiogramRepository_instances.add(this);
          _FileAntibiogramRepository_fs.set(this, void 0);
          _FileAntibiogramRepository_atlas.set(this, null);
          __classPrivateFieldSet(this, _FileAntibiogramRepository_fs, filesystem, "f");
      }
      getById(id$1) {
          return __awaiter(this, void 0, void 0, function* () {
              if (!__classPrivateFieldGet(this, _FileAntibiogramRepository_atlas, "f"))
                  __classPrivateFieldSet(this, _FileAntibiogramRepository_atlas, yield __classPrivateFieldGet(this, _FileAntibiogramRepository_instances, "m", _FileAntibiogramRepository_loadAtlas).call(this), "f");
              const meta = __classPrivateFieldGet(this, _FileAntibiogramRepository_atlas, "f").find((row) => {
                  const abgId = id(row['antibiogram_id']);
                  return id$1.is(abgId);
              });
              if (!meta)
                  throw new Error('Unable to find antibiogram with id of ' + id$1.getValue());
              return __classPrivateFieldGet(this, _FileAntibiogramRepository_instances, "m", _FileAntibiogramRepository_getByAtlasRow).call(this, meta);
          });
      }
      getAll() {
          return __awaiter(this, void 0, void 0, function* () {
              if (!__classPrivateFieldGet(this, _FileAntibiogramRepository_atlas, "f"))
                  __classPrivateFieldSet(this, _FileAntibiogramRepository_atlas, yield __classPrivateFieldGet(this, _FileAntibiogramRepository_instances, "m", _FileAntibiogramRepository_loadAtlas).call(this), "f");
              return Promise.all(__classPrivateFieldGet(this, _FileAntibiogramRepository_atlas, "f").map((meta) => __classPrivateFieldGet(this, _FileAntibiogramRepository_instances, "m", _FileAntibiogramRepository_getByAtlasRow).call(this, meta)));
          });
      }
  }
  _FileAntibiogramRepository_fs = new WeakMap(), _FileAntibiogramRepository_atlas = new WeakMap(), _FileAntibiogramRepository_instances = new WeakSet(), _FileAntibiogramRepository_loadAtlas = function _FileAntibiogramRepository_loadAtlas() {
      return __awaiter(this, void 0, void 0, function* () {
          const csv = yield __classPrivateFieldGet(this, _FileAntibiogramRepository_fs, "f").getDataFile('atlas.csv').getContents();
          return yield new AtlasCsv(csv).parse();
      });
  }, _FileAntibiogramRepository_getByAtlasRow = function _FileAntibiogramRepository_getByAtlasRow(atlasRow) {
      return __awaiter(this, void 0, void 0, function* () {
          const csv = yield __classPrivateFieldGet(this, _FileAntibiogramRepository_fs, "f").getDataFile(atlasRow['csv']).getContents();
          const metadata$1 = atlasRow['metadata'] &&
              JSON.parse(yield __classPrivateFieldGet(this, _FileAntibiogramRepository_fs, "f").getDataFile(atlasRow['metadata']).getContents());
          const data = new DataCsv(csv).parse().map((r) => new SensitivityData({
              organism: org(r['organism_name']),
              antibiotic: abx(r['antibiotic_name'], r['antibiotic_route'] ? route(r['antibiotic_route']) : undefined),
              value: value(r['value']),
              isolates: r['isolates'] ? iso(r['isolates']) : undefined,
              sampleInfo: r['sample_info'] ? info(r['sample_info']) : undefined,
          }));
          const id$1 = id(atlasRow['antibiogram_id']);
          return new Antibiogram(id$1, data, {
              info: atlasRow['sample_info']
                  ? info(atlasRow['sample_info'])
                  : undefined,
              gram: atlasRow['gram'] ? gram(atlasRow['gram']) : undefined,
              place: atlasRow['region'] && atlasRow['institution']
                  ? place(atlasRow['region'], atlasRow['institution'])
                  : undefined,
              interval: atlasRow['year_month_start'] && atlasRow['year_month_end']
                  ? interval(atlasRow['year_month_start'], atlasRow['year_month_end'])
                  : undefined,
              metadata: metadata$1 ? metadata(metadata$1) : undefined,
          });
      });
  };

  class CellInfo {
      constructor(org, abx, data) {
          this.data = data;
          this.org = org;
          this.abx = abx;
      }
  }

  class ColumnInfo {
      constructor(abx, commonInfo) {
          this.antibiotic = abx;
          this.info = commonInfo;
      }
      describes(abx) {
          return this.antibiotic.is(abx);
      }
  }

  class ColumnInfoAssembler {
      constructor(data, abx, info) {
          this.data = data;
          this.info = info;
          this.antibiotics = abx;
          this.dataByAntibiotic = abx.map((abx) => [abx, data.filter((d) => d.getAntibiotic().is(abx))]);
      }
      assembleColumns() {
          return this.dataByAntibiotic.map(([abx, data]) => {
              const commonInfo = data
                  .map((d) => d.getSampleInfo())
                  .map((si) => si.subtract(this.info))
                  .reduce((ag, v) => ag.intersect(v));
              return new ColumnInfo(abx, commonInfo);
          });
      }
  }

  class RowInfo {
      constructor(org, info, data) {
          var _a, _b;
          this.organism = org;
          this.info = info;
          this.data = data;
          this.isolates =
              (_b = (_a = data.find((d) => d.getSampleInfo().is(this.info))) === null || _a === void 0 ? void 0 : _a.getIsolates()) !== null && _b !== void 0 ? _b : new UnknownNumberOfIsolates();
      }
      describes(org, info) {
          if (!info)
              return this.organism.is(org);
          return this.organism.is(org) && this.info.is(info);
      }
  }

  var _RowInfoAssembler_instances, _RowInfoAssembler_isAboveThreshold, _RowInfoAssembler_getSensitivitiyDataForOrganism, _RowInfoAssembler_getUniqueSisForData, _RowInfoAssembler_buildDatumForOrganism, _RowInfoAssembler_findBestSiMatch, _RowInfoAssembler_assembleAboveThresholdRows, _RowInfoAssembler_addBelowThresholdRows;
  const SPLIT_THRESHOLD = 0.3;
  class RowInfoAssembler {
      constructor(data, org, abx) {
          _RowInfoAssembler_instances.add(this);
          this.SPLIT_THRESHOLD = 0.3;
          this.data = data;
          this.antibiotics = abx;
          this.dataByOrganism = org.map((o) => __classPrivateFieldGet(this, _RowInfoAssembler_instances, "m", _RowInfoAssembler_buildDatumForOrganism).call(this, o));
      }
      assembleRows() {
          const [rows, belowThreshold] = __classPrivateFieldGet(this, _RowInfoAssembler_instances, "m", _RowInfoAssembler_assembleAboveThresholdRows).call(this);
          return __classPrivateFieldGet(this, _RowInfoAssembler_instances, "m", _RowInfoAssembler_addBelowThresholdRows).call(this, rows, belowThreshold);
      }
  }
  _RowInfoAssembler_instances = new WeakSet(), _RowInfoAssembler_isAboveThreshold = function _RowInfoAssembler_isAboveThreshold(nCol, numUniqueSis) {
      if (numUniqueSis < 2)
          return true;
      const minNCol = this.antibiotics.length;
      return nCol / minNCol > SPLIT_THRESHOLD;
  }, _RowInfoAssembler_getSensitivitiyDataForOrganism = function _RowInfoAssembler_getSensitivitiyDataForOrganism(org) {
      return this.data.filter((d) => d.getOrganism().is(org));
  }, _RowInfoAssembler_getUniqueSisForData = function _RowInfoAssembler_getUniqueSisForData(data) {
      return data
          .map((d) => d.getSampleInfo())
          .reduce((ag, v) => (ag.find((si) => si.is(v)) ? ag : [...ag, v]), []);
  }, _RowInfoAssembler_buildDatumForOrganism = function _RowInfoAssembler_buildDatumForOrganism(org) {
      const dataForOrg = __classPrivateFieldGet(this, _RowInfoAssembler_instances, "m", _RowInfoAssembler_getSensitivitiyDataForOrganism).call(this, org);
      const uniqueSis = __classPrivateFieldGet(this, _RowInfoAssembler_instances, "m", _RowInfoAssembler_getUniqueSisForData).call(this, dataForOrg);
      const dataForOrgBySi = uniqueSis.map((si) => [si, dataForOrg.filter((d) => d.getSampleInfo().is(si))]);
      return { org, data: dataForOrg, sis: uniqueSis, dataBySi: dataForOrgBySi };
  }, _RowInfoAssembler_findBestSiMatch = function _RowInfoAssembler_findBestSiMatch(thisSi, allSis) {
      return allSis
          .map((si) => [si, si.intersect(thisSi)])
          .filter(([o]) => !o.is(thisSi))
          .reduce(([agO, agIxt], [o, ixt]) => {
          const numMatching = ixt.itemsToArray().length;
          const numInBest = agIxt.itemsToArray().length;
          return numMatching > numInBest ? [o, ixt] : [agO, agIxt];
      });
  }, _RowInfoAssembler_assembleAboveThresholdRows = function _RowInfoAssembler_assembleAboveThresholdRows() {
      return this.dataByOrganism.reduce(([rows, belowThreshold], { org, dataBySi }) => {
          const allInfo = dataBySi.map(([si, data]) => new RowInfo(org, si, data));
          const above = allInfo.filter(({ data }) => __classPrivateFieldGet(this, _RowInfoAssembler_instances, "m", _RowInfoAssembler_isAboveThreshold).call(this, data.length, dataBySi.length));
          const below = allInfo.filter(({ data }) => !__classPrivateFieldGet(this, _RowInfoAssembler_instances, "m", _RowInfoAssembler_isAboveThreshold).call(this, data.length, dataBySi.length));
          return [rows.concat(above), belowThreshold.concat(below)];
      }, [[], []]);
  }, _RowInfoAssembler_addBelowThresholdRows = function _RowInfoAssembler_addBelowThresholdRows(_rows, _belowThreshold) {
      const rows = _rows.slice();
      const belowThreshold = _belowThreshold.slice();
      for (const { org, sis } of this.dataByOrganism) {
          const belowThresholdForOrg = belowThreshold.filter(({ organism }) => org.is(organism));
          for (const { info: thisSi, data } of belowThresholdForOrg) {
              const [bestMatch] = __classPrivateFieldGet(this, _RowInfoAssembler_instances, "m", _RowInfoAssembler_findBestSiMatch).call(this, thisSi, sis);
              let row = rows
                  .filter(({ organism }) => organism.is(org))
                  .find(({ data }) => data.find((d) => d.getSampleInfo().is(bestMatch)));
              if (!row) {
                  row = new RowInfo(org, new SampleInfo([]), data);
                  rows.push(row);
              }
              else {
                  row.data.push(...data);
              }
          }
      }
      return rows;
  };

  class TableElementFactory {
      makeCell(c) {
          const data = c.data;
          const value = data.map((d) => d.getValue().toString()).join('\n');
          return new FilledCell(value);
      }
      makeLabel(text, tooltip, alert) {
          const params = {};
          if (tooltip)
              params.tooltip = tooltip;
          if (alert)
              params.alert = alert;
          return new Label(text, params);
      }
      makeRowLabel(r) {
          const isolates = r.data[0].getIsolates();
          let hasEnoughIsolates = false;
          let alert = AlertLevels.NONE;
          if (isolates instanceof IntegerNumberOfIsolates) {
              hasEnoughIsolates = isolates.isEnough();
          }
          const tooltips = r.info
              .itemsToArray()
              .map((si) => new Tooltip(si.toString()));
          tooltips.push(new Tooltip(`${r.isolates} Isolates`));
          if (!hasEnoughIsolates) {
              tooltips.push(new Tooltip('\u26a0 low or unknown number of isolates'));
              alert = AlertLevels.WARN;
          }
          const labelText = `${r.organism.getName()}`;
          return this.makeLabel(labelText, new Tooltip(tooltips), alert);
      }
      makeColumnLabel(c) {
          const route = c.antibiotic
              .getAntibiotics()
              .filter((abx) => !abx.getRoute().is(routeFactory.UNKNOWN))
              .map((abx) => abx.getRoute().toString())
              .join(', ');
          const si = c.info.itemsToArray();
          const tooltips = [si, route]
              .map((s) => '' + s)
              .filter((s) => s !== '')
              .map((s) => new Tooltip(s));
          return this.makeLabel(c.antibiotic.getName(), new Tooltip(tooltips));
      }
      makeEmptyMatrix(nRow, nCol) {
          return new Array(nRow).fill(undefined).map(() => this.makeEmptyRow(nCol));
      }
      makeEmptyRow(size) {
          return new Array(size).fill(undefined).map(() => new EmptyCell());
      }
  }

  function assembleRowsAndColumns(abg) {
      const rowAssembler = new RowInfoAssembler(abg.getSensitivities(), abg.organisms, abg.antibiotics);
      const columnAssembler = new ColumnInfoAssembler(abg.getSensitivities(), abg.antibiotics, abg.info);
      const rows = rowAssembler.assembleRows();
      const columns = columnAssembler.assembleColumns();
      return [rows, columns];
  }
  function fillMatrix(makeCell, rows, columns, matrix) {
      const result = matrix.slice().map((r) => r.slice());
      for (const [i, row] of rows.entries()) {
          for (const [j, column] of columns.entries()) {
              const data = row.data.filter((d) => column.describes(d.getAntibiotic()));
              if (data.length < 1)
                  continue;
              const cellInfo = new CellInfo(row.organism, column.antibiotic, data);
              result[i][j] = makeCell(cellInfo);
          }
      }
      return result;
  }
  function makeAntibiogramTable(abg) {
      var _a;
      const factory = new TableElementFactory();
      const [rows, columns] = assembleRowsAndColumns(abg);
      const nRow = rows.length;
      const nCol = columns.length;
      const rowLabels = rows.map((r) => factory.makeRowLabel(r));
      const columnLabels = columns.map((c) => factory.makeColumnLabel(c));
      const matrix = fillMatrix((c) => factory.makeCell(c), rows, columns, factory.makeEmptyMatrix(nRow, nCol));
      const { metadata } = abg;
      return makeTable(matrix, {
          labels: { rows: rowLabels, columns: columnLabels },
          order: {
              rows: (_a = metadata.get(RowOrder.slug)) === null || _a === void 0 ? void 0 : _a.getValue(),
          },
      });
  }
  function makeCompositeAntibiogramTable(abg1, abg2) {
      var _a;
      const abgs = [abg1, abg2].sort((a1, a2) => {
          if (a1.gram.toString() < a2.gram.toString())
              return -1;
          if (a1.gram.toString() > a2.gram.toString())
              return 1;
          return 0;
      });
      const table1 = makeAntibiogramTable(abgs[0]);
      const table2 = makeAntibiogramTable(abgs[1]);
      return table1.merge(table2, abgs[1].gram.toString(), abgs[0].gram.toString(), {
          order: {
              columns: (_a = abg1.metadata.get(ColumnOrder.slug)) === null || _a === void 0 ? void 0 : _a.getValue(),
          },
      });
  }
  function buildAntibiogramTable (abg1, abg2) {
      if (abg2)
          return makeCompositeAntibiogramTable(abg1, abg2);
      return makeAntibiogramTable(abg1);
  }

  class ShowAntibiogramAction {
      constructor(antibiogramRepository) {
          this.antibiogramRepository = antibiogramRepository;
      }
      execute(id) {
          return __awaiter(this, void 0, void 0, function* () {
              const abgId = new AntibiogramId(id);
              const antibiogram = yield this.antibiogramRepository.getById(abgId);
              const table = buildAntibiogramTable(antibiogram);
              return { antibiogram, table };
          });
      }
      present(p, id) {
          return __awaiter(this, void 0, void 0, function* () {
              const result = yield this.execute(id);
              p.setData(result);
              return p;
          });
      }
  }

  var _IndexAntibiogramAction_repo;
  class IndexAntibiogramAction {
      constructor(antibiogramRepository) {
          _IndexAntibiogramAction_repo.set(this, void 0);
          __classPrivateFieldSet(this, _IndexAntibiogramAction_repo, antibiogramRepository, "f");
      }
      execute() {
          return __awaiter(this, void 0, void 0, function* () {
              return yield __classPrivateFieldGet(this, _IndexAntibiogramAction_repo, "f").getAll();
          });
      }
      present(p) {
          return __awaiter(this, void 0, void 0, function* () {
              const result = yield this.execute();
              p.setData(result);
              return p;
          });
      }
  }
  _IndexAntibiogramAction_repo = new WeakMap();

  var _WebFile_instances, _WebFile_uri, _WebFile_fetch, _WebFile_validateUri;
  class WebFile {
      constructor(fetch, uri) {
          _WebFile_instances.add(this);
          _WebFile_uri.set(this, void 0);
          _WebFile_fetch.set(this, void 0);
          __classPrivateFieldSet(this, _WebFile_uri, uri, "f");
          __classPrivateFieldSet(this, _WebFile_fetch, fetch, "f");
          __classPrivateFieldGet(this, _WebFile_instances, "m", _WebFile_validateUri).call(this, uri);
      }
      getContents() {
          return __awaiter(this, void 0, void 0, function* () {
              return yield __classPrivateFieldGet(this, _WebFile_fetch, "f").call(this, __classPrivateFieldGet(this, _WebFile_uri, "f")).then((r) => r.text());
          });
      }
  }
  _WebFile_uri = new WeakMap(), _WebFile_fetch = new WeakMap(), _WebFile_instances = new WeakSet(), _WebFile_validateUri = function _WebFile_validateUri(uri) {
      if (uri[0] !== '/')
          throw new UriNotAbsoluteError(uri);
  };
  class UriNotAbsoluteError extends Error {
      constructor(uri) {
          super('Uri path must be absolute for file uri: ' + uri);
      }
  }

  const GH_PAGES_URL_PREFIX = 'bugs-and-drugs/';

  var _WebFileSystem_instances, _WebFileSystem_fetch, _WebFileSystem_resolve;
  const PUBLIC_DATA_DIR = 'data/';
  class WebFileSystem {
      constructor(fetch) {
          _WebFileSystem_instances.add(this);
          _WebFileSystem_fetch.set(this, void 0);
          __classPrivateFieldSet(this, _WebFileSystem_fetch, fetch, "f");
      }
      getDataFile(name) {
          return this.getFile(__classPrivateFieldGet(this, _WebFileSystem_instances, "m", _WebFileSystem_resolve).call(this, PUBLIC_DATA_DIR, name));
      }
      getFile(uri) {
          return new WebFile(__classPrivateFieldGet(this, _WebFileSystem_fetch, "f"), __classPrivateFieldGet(this, _WebFileSystem_instances, "m", _WebFileSystem_resolve).call(this, GH_PAGES_URL_PREFIX, uri));
      }
  }
  _WebFileSystem_fetch = new WeakMap(), _WebFileSystem_instances = new WeakSet(), _WebFileSystem_resolve = function _WebFileSystem_resolve(base, ...paths) {
      if (base === '')
          throw Error('Invalid uri: ');
      const exploded = paths.flatMap((p) => p.split('/')).filter((p) => p !== '');
      if (base[0] !== '/')
          return '/' + base + exploded.join('/');
      if (base === '/')
          return '/' + exploded.join('/');
      return base + '/' + exploded.join('/');
  };

  class ShowGramPositiveAndNegativeAntibiogramAction {
      constructor(antibiogramRepository) {
          this.antibiogramRepository = antibiogramRepository;
      }
      execute(id1, id2) {
          return __awaiter(this, void 0, void 0, function* () {
              const abgId1 = new AntibiogramId(id1);
              const antibiogram1 = yield this.antibiogramRepository.getById(abgId1);
              const abgId2 = new AntibiogramId(id2);
              const antibiogram2 = yield this.antibiogramRepository.getById(abgId2);
              const table = buildAntibiogramTable(antibiogram1, antibiogram2);
              return { antibiogram: antibiogram1, table };
          });
      }
      present(p, id1, id2) {
          return __awaiter(this, void 0, void 0, function* () {
              const result = yield this.execute(id1, id2);
              p.setData(result);
              return p;
          });
      }
  }

  const dependencies = new Module();
  dependencies.type('showAntibiogramAction', ShowAntibiogramAction);
  dependencies.type('indexAntibiogramGroupsAction', IndexAntibiogramAction);
  dependencies.type('showGramPositiveAndNegativeAntibiogramAction', ShowGramPositiveAndNegativeAntibiogramAction);
  dependencies.type('antibiogramRepository', FileAntibiogramRepository);
  dependencies.type('filesystem', WebFileSystem);
  dependencies.type('antibiogramController', AntibiogramController);
  dependencies.type('antibiogramGroupController', AntibiogramGroupController);
  dependencies.value('fetch', fetch.bind(window));
  dependencies.factory('svelte', svelte);

  const container = new Injector([dependencies]);

  var main = container.get('svelte');

  return main;

})();
//# sourceMappingURL=bundle.js.map
