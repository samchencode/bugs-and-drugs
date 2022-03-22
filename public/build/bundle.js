
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
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
  function add_location(element, file, line, column, char) {
      element.__svelte_meta = {
          loc: { file, line, column, char }
      };
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
  function validate_store(store, name) {
      if (store != null && typeof store.subscribe !== 'function') {
          throw new Error(`'${name}' is not a store with a 'subscribe' method`);
      }
  }
  function subscribe$1(store, ...callbacks) {
      if (store == null) {
          return noop;
      }
      const unsub = store.subscribe(...callbacks);
      return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
  }
  function component_subscribe(component, store, callback) {
      component.$$.on_destroy.push(subscribe$1(store, callback));
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
  function onMount(fn) {
      get_current_component().$$.on_mount.push(fn);
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
              update$1(component.$$);
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
  function update$1($$) {
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

  const globals = (typeof window !== 'undefined'
      ? window
      : typeof globalThis !== 'undefined'
          ? globalThis
          : global);
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
  function validate_each_keys(ctx, list, get_context, get_key) {
      const keys = new Set();
      for (let i = 0; i < list.length; i++) {
          const key = get_key(get_context(ctx, list, i));
          if (keys.has(key)) {
              throw new Error('Cannot have duplicate keys in a keyed each');
          }
          keys.add(key);
      }
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

  function dispatch_dev(type, detail) {
      document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.3' }, detail), true));
  }
  function append_dev(target, node) {
      dispatch_dev('SvelteDOMInsert', { target, node });
      append(target, node);
  }
  function insert_dev(target, node, anchor) {
      dispatch_dev('SvelteDOMInsert', { target, node, anchor });
      insert(target, node, anchor);
  }
  function detach_dev(node) {
      dispatch_dev('SvelteDOMRemove', { node });
      detach(node);
  }
  function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
      const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
      if (has_prevent_default)
          modifiers.push('preventDefault');
      if (has_stop_propagation)
          modifiers.push('stopPropagation');
      dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
      const dispose = listen(node, event, handler, options);
      return () => {
          dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
          dispose();
      };
  }
  function attr_dev(node, attribute, value) {
      attr(node, attribute, value);
      if (value == null)
          dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
      else
          dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
  }
  function set_data_dev(text, data) {
      data = '' + data;
      if (text.wholeText === data)
          return;
      dispatch_dev('SvelteDOMSetData', { node: text, data });
      text.data = data;
  }
  function validate_each_argument(arg) {
      if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
          let msg = '{#each} only iterates over array-like objects.';
          if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
              msg += ' You can use a spread to convert this iterable into an array.';
          }
          throw new Error(msg);
      }
  }
  function validate_slots(name, slot, keys) {
      for (const slot_key of Object.keys(slot)) {
          if (!~keys.indexOf(slot_key)) {
              console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
          }
      }
  }
  /**
   * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
   */
  class SvelteComponentDev extends SvelteComponent {
      constructor(options) {
          if (!options || (!options.target && !options.$$inline)) {
              throw new Error("'target' is a required option");
          }
          super();
      }
      $destroy() {
          super.$destroy();
          this.$destroy = () => {
              console.warn('Component was already destroyed'); // eslint-disable-line no-console
          };
      }
      $capture_state() { }
      $inject_state() { }
  }

  /* src\infrastructure\view\templates\common\TopBar.svelte generated by Svelte v3.44.3 */

  const file$g = "src\\infrastructure\\view\\templates\\common\\TopBar.svelte";

  function create_fragment$k(ctx) {
  	let div2;
  	let div1;
  	let div0;
  	let ion_icon;
  	let t0;
  	let span;

  	const block = {
  		c: function create() {
  			div2 = element("div");
  			div1 = element("div");
  			div0 = element("div");
  			ion_icon = element("ion-icon");
  			t0 = space();
  			span = element("span");
  			span.textContent = "Inpatient 2019-2020";
  			set_custom_element_data(ion_icon, "name", "arrow-back-outline");
  			add_location(ion_icon, file$g, 3, 6, 96);
  			attr_dev(div0, "class", "arrow clickable svelte-1p3a9mr");
  			add_location(div0, file$g, 2, 4, 60);
  			add_location(span, file$g, 5, 4, 150);
  			attr_dev(div1, "class", "antibiogram-title svelte-1p3a9mr");
  			add_location(div1, file$g, 1, 2, 24);
  			attr_dev(div2, "class", "top-bar svelte-1p3a9mr");
  			add_location(div2, file$g, 0, 0, 0);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, div2, anchor);
  			append_dev(div2, div1);
  			append_dev(div1, div0);
  			append_dev(div0, ion_icon);
  			append_dev(div1, t0);
  			append_dev(div1, span);
  		},
  		p: noop,
  		i: noop,
  		o: noop,
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(div2);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$k.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$k($$self, $$props) {
  	let { $$slots: slots = {}, $$scope } = $$props;
  	validate_slots('TopBar', slots, []);
  	const writable_props = [];

  	Object.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TopBar> was created with unknown prop '${key}'`);
  	});

  	return [];
  }

  class TopBar extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$k, create_fragment$k, safe_not_equal, {});

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "TopBar",
  			options,
  			id: create_fragment$k.name
  		});
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
          const unsubscribers = stores_array.map((store, i) => subscribe$1(store, (value) => {
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

  var _TableElement_highlighted, _TableElement_active, _TableElement_value, _TableElement_tooltip;
  class TableElement {
      constructor(id, cell) {
          _TableElement_highlighted.set(this, false);
          _TableElement_active.set(this, false);
          _TableElement_value.set(this, void 0);
          _TableElement_tooltip.set(this, void 0);
          this.id = id;
          __classPrivateFieldSet(this, _TableElement_value, cell.getValue(), "f");
          __classPrivateFieldSet(this, _TableElement_tooltip, cell.getTooltip().toString(), "f");
      }
      getHighlighted() {
          return __classPrivateFieldGet(this, _TableElement_highlighted, "f");
      }
      getActive() {
          return __classPrivateFieldGet(this, _TableElement_active, "f");
      }
      toggleActive() {
          __classPrivateFieldSet(this, _TableElement_active, !__classPrivateFieldGet(this, _TableElement_active, "f"), "f");
      }
      toggleHighlighted() {
          __classPrivateFieldSet(this, _TableElement_highlighted, !__classPrivateFieldGet(this, _TableElement_highlighted, "f"), "f");
      }
      getValue() {
          return __classPrivateFieldGet(this, _TableElement_value, "f");
      }
      getTooltip() {
          return __classPrivateFieldGet(this, _TableElement_tooltip, "f");
      }
  }
  _TableElement_highlighted = new WeakMap(), _TableElement_active = new WeakMap(), _TableElement_value = new WeakMap(), _TableElement_tooltip = new WeakMap();

  var _RowHeader_isCollapsed, _RowHeader_inGroup, _RowHeader_group, _RowHeader_firstOfGroup;
  class RowHeader$1 extends TableElement {
      constructor(id, cell, group) {
          super(id, cell);
          _RowHeader_isCollapsed.set(this, void 0);
          _RowHeader_inGroup.set(this, void 0);
          _RowHeader_group.set(this, void 0);
          _RowHeader_firstOfGroup.set(this, void 0);
          __classPrivateFieldSet(this, _RowHeader_group, group, "f");
          __classPrivateFieldSet(this, _RowHeader_inGroup, group !== null, "f");
          __classPrivateFieldSet(this, _RowHeader_isCollapsed, group === null || group === void 0 ? void 0 : group.isCollapsed(), "f");
          __classPrivateFieldSet(this, _RowHeader_firstOfGroup, id === (group === null || group === void 0 ? void 0 : group.getRange()[0]), "f");
      }
      isCollapsed() {
          return __classPrivateFieldGet(this, _RowHeader_isCollapsed, "f");
      }
      inGroup() {
          return __classPrivateFieldGet(this, _RowHeader_inGroup, "f");
      }
      getGroup() {
          return __classPrivateFieldGet(this, _RowHeader_group, "f");
      }
      isFirstOfGroup() {
          return __classPrivateFieldGet(this, _RowHeader_firstOfGroup, "f");
      }
  }
  _RowHeader_isCollapsed = new WeakMap(), _RowHeader_inGroup = new WeakMap(), _RowHeader_group = new WeakMap(), _RowHeader_firstOfGroup = new WeakMap();

  const { subscribe, update, set } = writable({
      rowHeaders: [],
      columnHeaders: [],
      grid: [],
      groups: [],
  });
  function _toggleHighlightRow(row, grid, header) {
      grid[row].forEach((cell) => {
          cell.toggleHighlighted();
      });
      header[row].toggleHighlighted();
      return { grid, header };
  }
  function _toggleHighlightColumn(column, grid, header) {
      grid.forEach((row) => {
          row[column].toggleHighlighted();
      });
      header[column].toggleHighlighted();
      return { grid, header };
  }
  const toggleHighlightRow = (i) => {
      update((s) => {
          s.rowHeaders[i].toggleActive();
          const { grid, header } = _toggleHighlightRow(i, s.grid, s.rowHeaders);
          return Object.assign(Object.assign({}, s), { grid, rowHeaders: header });
      });
  };
  const toggleHighlightColumn = (j) => {
      update((s) => {
          s.columnHeaders[j].toggleActive();
          const { grid, header } = _toggleHighlightColumn(j, s.grid, s.columnHeaders);
          return Object.assign(Object.assign({}, s), { grid, columnHeaders: header });
      });
  };
  const toggleHighlightCell = (i, j) => {
      update((s) => {
          let newGrid = s.grid.slice();
          let newRowHeaders = s.rowHeaders.slice();
          let newColumnHeaders = s.columnHeaders.slice();
          newGrid[i][j].toggleActive();
          ({ grid: newGrid, header: newRowHeaders } = _toggleHighlightRow(i, newGrid, newRowHeaders));
          ({ grid: newGrid, header: newColumnHeaders } = _toggleHighlightColumn(j, newGrid, newColumnHeaders));
          return {
              grid: newGrid,
              rowHeaders: newRowHeaders,
              columnHeaders: newColumnHeaders,
              groups: s.groups,
          };
      });
  };
  const expandGroup = (group) => {
      loadTable(group.expand());
      console.log('expanded one');
  };
  const collapseGroup = (group) => {
      loadTable(group.collapse());
      console.log('collapsed one');
  };
  const loadTable = (table) => {
      const groupArray = [];
      table.getRows().forEach((row) => {
          const group = row.getGroup();
          if (group) {
              let unique = true;
              groupArray.forEach((g) => {
                  if (g == group) {
                      unique = false;
                  }
              });
              if (unique)
                  groupArray.push(group);
          }
      });
      set({
          grid: table === null || table === void 0 ? void 0 : table.getCells().map((row) => row.map((cell, index) => new TableElement(index, cell))),
          rowHeaders: table === null || table === void 0 ? void 0 : table.getRows().map((row, index) => new RowHeader$1(index, row.getLabel(), row.getGroup())),
          columnHeaders: table === null || table === void 0 ? void 0 : table.getColumnLabels().map((label, index) => new TableElement(index, label)),
          groups: groupArray,
      });
      console.log('table loaded');
  };
  const expandAllGroups = () => {
      update((s) => {
          s.groups.forEach((group) => group.expand());
          return s;
      });
      console.log('expanded all');
  };
  const collapseAllGroups = () => {
      update((s) => {
          s.groups.forEach((group) => group.expand());
          return s;
      });
      console.log('collapsed all');
  };
  const state = {
      subscribe,
      loadTable,
      toggleHighlightCell,
      toggleHighlightColumn,
      toggleHighlightRow,
      expandGroup,
      collapseGroup,
      expandAllGroups,
      collapseAllGroups,
  };

  /* src\infrastructure\view\templates\table\Selectors\CollapseGroups.svelte generated by Svelte v3.44.3 */
  const file$f = "src\\infrastructure\\view\\templates\\table\\Selectors\\CollapseGroups.svelte";

  function create_fragment$j(ctx) {
  	let button;
  	let span;
  	let mounted;
  	let dispose;

  	const block = {
  		c: function create() {
  			button = element("button");
  			span = element("span");
  			span.textContent = "Collapse Groups";
  			add_location(span, file$f, 7, 2, 205);
  			attr_dev(button, "class", "tool-bar-button vertically-center");
  			add_location(button, file$f, 3, 0, 104);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, button, anchor);
  			append_dev(button, span);

  			if (!mounted) {
  				dispose = listen_dev(button, "click", /*click_handler*/ ctx[0], false, false, false);
  				mounted = true;
  			}
  		},
  		p: noop,
  		i: noop,
  		o: noop,
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(button);
  			mounted = false;
  			dispose();
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$j.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$j($$self, $$props, $$invalidate) {
  	let { $$slots: slots = {}, $$scope } = $$props;
  	validate_slots('CollapseGroups', slots, []);
  	const writable_props = [];

  	Object.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CollapseGroups> was created with unknown prop '${key}'`);
  	});

  	const click_handler = () => state.collapseAllGroups();
  	$$self.$capture_state = () => ({ state });
  	return [click_handler];
  }

  class CollapseGroups extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$j, create_fragment$j, safe_not_equal, {});

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "CollapseGroups",
  			options,
  			id: create_fragment$j.name
  		});
  	}
  }

  /* src\infrastructure\view\templates\table\Selectors\ExpandGroups.svelte generated by Svelte v3.44.3 */
  const file$e = "src\\infrastructure\\view\\templates\\table\\Selectors\\ExpandGroups.svelte";

  function create_fragment$i(ctx) {
  	let button;
  	let span;
  	let mounted;
  	let dispose;

  	const block = {
  		c: function create() {
  			button = element("button");
  			span = element("span");
  			span.textContent = "Expand Groups";
  			add_location(span, file$e, 7, 2, 203);
  			attr_dev(button, "class", "tool-bar-button vertically-center");
  			add_location(button, file$e, 3, 0, 104);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, button, anchor);
  			append_dev(button, span);

  			if (!mounted) {
  				dispose = listen_dev(button, "click", /*click_handler*/ ctx[0], false, false, false);
  				mounted = true;
  			}
  		},
  		p: noop,
  		i: noop,
  		o: noop,
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(button);
  			mounted = false;
  			dispose();
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$i.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$i($$self, $$props, $$invalidate) {
  	let { $$slots: slots = {}, $$scope } = $$props;
  	validate_slots('ExpandGroups', slots, []);
  	const writable_props = [];

  	Object.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ExpandGroups> was created with unknown prop '${key}'`);
  	});

  	const click_handler = () => state.expandAllGroups();
  	$$self.$capture_state = () => ({ state });
  	return [click_handler];
  }

  class ExpandGroups extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$i, create_fragment$i, safe_not_equal, {});

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "ExpandGroups",
  			options,
  			id: create_fragment$i.name
  		});
  	}
  }

  /* src\infrastructure\view\templates\table\Selectors\GramSelector.svelte generated by Svelte v3.44.3 */

  const file$d = "src\\infrastructure\\view\\templates\\table\\Selectors\\GramSelector.svelte";

  function create_fragment$h(ctx) {
  	let button;
  	let span;
  	let t1;
  	let ion_icon;

  	const block = {
  		c: function create() {
  			button = element("button");
  			span = element("span");
  			span.textContent = "Gram";
  			t1 = space();
  			ion_icon = element("ion-icon");
  			add_location(span, file$d, 4, 2, 97);
  			set_custom_element_data(ion_icon, "class", "vertically-center");
  			set_custom_element_data(ion_icon, "name", "add-outline");
  			add_location(ion_icon, file$d, 5, 2, 117);
  			attr_dev(button, "class", "tool-bar-button vertically-center");
  			add_location(button, file$d, 3, 0, 44);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, button, anchor);
  			append_dev(button, span);
  			append_dev(button, t1);
  			append_dev(button, ion_icon);
  		},
  		p: noop,
  		i: noop,
  		o: noop,
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(button);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$h.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$h($$self, $$props) {
  	let { $$slots: slots = {}, $$scope } = $$props;
  	validate_slots('GramSelector', slots, []);
  	const writable_props = [];

  	Object.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<GramSelector> was created with unknown prop '${key}'`);
  	});

  	return [];
  }

  class GramSelector extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$h, create_fragment$h, safe_not_equal, {});

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "GramSelector",
  			options,
  			id: create_fragment$h.name
  		});
  	}
  }

  /* src\infrastructure\view\templates\table\Selectors\SelectorBar.svelte generated by Svelte v3.44.3 */
  const file$c = "src\\infrastructure\\view\\templates\\table\\Selectors\\SelectorBar.svelte";

  function create_fragment$g(ctx) {
  	let div1;
  	let div0;
  	let ion_icon0;
  	let t0;
  	let gramselector;
  	let t1;
  	let expandgroups;
  	let t2;
  	let collapsegroups;
  	let t3;
  	let ion_icon1;
  	let current;
  	gramselector = new GramSelector({ $$inline: true });
  	expandgroups = new ExpandGroups({ $$inline: true });
  	collapsegroups = new CollapseGroups({ $$inline: true });

  	const block = {
  		c: function create() {
  			div1 = element("div");
  			div0 = element("div");
  			ion_icon0 = element("ion-icon");
  			t0 = space();
  			create_component(gramselector.$$.fragment);
  			t1 = space();
  			create_component(expandgroups.$$.fragment);
  			t2 = space();
  			create_component(collapsegroups.$$.fragment);
  			t3 = space();
  			ion_icon1 = element("ion-icon");
  			set_custom_element_data(ion_icon0, "class", "vertically-center clickable");
  			set_custom_element_data(ion_icon0, "name", "chevron-back-outline");
  			add_location(ion_icon0, file$c, 7, 4, 309);
  			set_custom_element_data(ion_icon1, "class", "vertically-center clickable");
  			set_custom_element_data(ion_icon1, "name", "chevron-forward-outline");
  			add_location(ion_icon1, file$c, 11, 4, 455);
  			attr_dev(div0, "class", "bar-positioner tool-bar svelte-np714e");
  			add_location(div0, file$c, 6, 2, 267);
  			attr_dev(div1, "class", "tool-bar-container svelte-np714e");
  			add_location(div1, file$c, 5, 0, 232);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, div1, anchor);
  			append_dev(div1, div0);
  			append_dev(div0, ion_icon0);
  			append_dev(div0, t0);
  			mount_component(gramselector, div0, null);
  			append_dev(div0, t1);
  			mount_component(expandgroups, div0, null);
  			append_dev(div0, t2);
  			mount_component(collapsegroups, div0, null);
  			append_dev(div0, t3);
  			append_dev(div0, ion_icon1);
  			current = true;
  		},
  		p: noop,
  		i: function intro(local) {
  			if (current) return;
  			transition_in(gramselector.$$.fragment, local);
  			transition_in(expandgroups.$$.fragment, local);
  			transition_in(collapsegroups.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(gramselector.$$.fragment, local);
  			transition_out(expandgroups.$$.fragment, local);
  			transition_out(collapsegroups.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(div1);
  			destroy_component(gramselector);
  			destroy_component(expandgroups);
  			destroy_component(collapsegroups);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$g.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$g($$self, $$props, $$invalidate) {
  	let { $$slots: slots = {}, $$scope } = $$props;
  	validate_slots('SelectorBar', slots, []);
  	const writable_props = [];

  	Object.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SelectorBar> was created with unknown prop '${key}'`);
  	});

  	$$self.$capture_state = () => ({
  		CollapseGroups,
  		ExpandGroups,
  		GramSelector
  	});

  	return [];
  }

  class SelectorBar extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$g, create_fragment$g, safe_not_equal, {});

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "SelectorBar",
  			options,
  			id: create_fragment$g.name
  		});
  	}
  }

  /* src\infrastructure\view\templates\table\Tooltip.svelte generated by Svelte v3.44.3 */

  const file$b = "src\\infrastructure\\view\\templates\\table\\Tooltip.svelte";

  function get_each_context$3(ctx, list, i) {
  	const child_ctx = ctx.slice();
  	child_ctx[1] = list[i];
  	return child_ctx;
  }

  // (4:0) {#if tooltip.length !== 0}
  function create_if_block$5(ctx) {
  	let span;
  	let each_value = /*tooltip*/ ctx[0].split('\n');
  	validate_each_argument(each_value);
  	let each_blocks = [];

  	for (let i = 0; i < each_value.length; i += 1) {
  		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
  	}

  	const block = {
  		c: function create() {
  			span = element("span");

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].c();
  			}

  			attr_dev(span, "class", "tooltip-text svelte-rzzl1m");
  			add_location(span, file$b, 4, 2, 79);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, span, anchor);

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].m(span, null);
  			}
  		},
  		p: function update(ctx, dirty) {
  			if (dirty & /*tooltip*/ 1) {
  				each_value = /*tooltip*/ ctx[0].split('\n');
  				validate_each_argument(each_value);
  				let i;

  				for (i = 0; i < each_value.length; i += 1) {
  					const child_ctx = get_each_context$3(ctx, each_value, i);

  					if (each_blocks[i]) {
  						each_blocks[i].p(child_ctx, dirty);
  					} else {
  						each_blocks[i] = create_each_block$3(child_ctx);
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
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(span);
  			destroy_each(each_blocks, detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block$5.name,
  		type: "if",
  		source: "(4:0) {#if tooltip.length !== 0}",
  		ctx
  	});

  	return block;
  }

  // (6:4) {#each tooltip.split('\n') as text}
  function create_each_block$3(ctx) {
  	let t0_value = /*text*/ ctx[1] + "";
  	let t0;
  	let t1;
  	let br;

  	const block = {
  		c: function create() {
  			t0 = text(t0_value);
  			t1 = space();
  			br = element("br");
  			add_location(br, file$b, 7, 6, 166);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, t0, anchor);
  			insert_dev(target, t1, anchor);
  			insert_dev(target, br, anchor);
  		},
  		p: function update(ctx, dirty) {
  			if (dirty & /*tooltip*/ 1 && t0_value !== (t0_value = /*text*/ ctx[1] + "")) set_data_dev(t0, t0_value);
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(t0);
  			if (detaching) detach_dev(t1);
  			if (detaching) detach_dev(br);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_each_block$3.name,
  		type: "each",
  		source: "(6:4) {#each tooltip.split('\\n') as text}",
  		ctx
  	});

  	return block;
  }

  function create_fragment$f(ctx) {
  	let if_block_anchor;
  	let if_block = /*tooltip*/ ctx[0].length !== 0 && create_if_block$5(ctx);

  	const block = {
  		c: function create() {
  			if (if_block) if_block.c();
  			if_block_anchor = empty();
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			if (if_block) if_block.m(target, anchor);
  			insert_dev(target, if_block_anchor, anchor);
  		},
  		p: function update(ctx, [dirty]) {
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
  		d: function destroy(detaching) {
  			if (if_block) if_block.d(detaching);
  			if (detaching) detach_dev(if_block_anchor);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$f.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$f($$self, $$props, $$invalidate) {
  	let { $$slots: slots = {}, $$scope } = $$props;
  	validate_slots('Tooltip', slots, []);
  	let { tooltip } = $$props;
  	const writable_props = ['tooltip'];

  	Object.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Tooltip> was created with unknown prop '${key}'`);
  	});

  	$$self.$$set = $$props => {
  		if ('tooltip' in $$props) $$invalidate(0, tooltip = $$props.tooltip);
  	};

  	$$self.$capture_state = () => ({ tooltip });

  	$$self.$inject_state = $$props => {
  		if ('tooltip' in $$props) $$invalidate(0, tooltip = $$props.tooltip);
  	};

  	if ($$props && "$$inject" in $$props) {
  		$$self.$inject_state($$props.$$inject);
  	}

  	return [tooltip];
  }

  class Tooltip$1 extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$f, create_fragment$f, safe_not_equal, { tooltip: 0 });

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "Tooltip",
  			options,
  			id: create_fragment$f.name
  		});

  		const { ctx } = this.$$;
  		const props = options.props || {};

  		if (/*tooltip*/ ctx[0] === undefined && !('tooltip' in props)) {
  			console.warn("<Tooltip> was created without expected prop 'tooltip'");
  		}
  	}

  	get tooltip() {
  		throw new Error("<Tooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set tooltip(value) {
  		throw new Error("<Tooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}
  }

  /* src\infrastructure\view\templates\table\Cell.svelte generated by Svelte v3.44.3 */
  const file$a = "src\\infrastructure\\view\\templates\\table\\Cell.svelte";

  // (16:2) {:else}
  function create_else_block$3(ctx) {
  	let t_value = /*cell*/ ctx[0].getValue() + "";
  	let t;

  	const block = {
  		c: function create() {
  			t = text(t_value);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, t, anchor);
  		},
  		p: function update(ctx, dirty) {
  			if (dirty & /*cell*/ 1 && t_value !== (t_value = /*cell*/ ctx[0].getValue() + "")) set_data_dev(t, t_value);
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(t);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_else_block$3.name,
  		type: "else",
  		source: "(16:2) {:else}",
  		ctx
  	});

  	return block;
  }

  // (14:2) {#if cell.getValue() == 'NA'}
  function create_if_block$4(ctx) {
  	let t;

  	const block = {
  		c: function create() {
  			t = text("-");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, t, anchor);
  		},
  		p: noop,
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(t);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block$4.name,
  		type: "if",
  		source: "(14:2) {#if cell.getValue() == 'NA'}",
  		ctx
  	});

  	return block;
  }

  function create_fragment$e(ctx) {
  	let td;
  	let show_if;
  	let t;
  	let tooltip;
  	let current;
  	let mounted;
  	let dispose;

  	function select_block_type(ctx, dirty) {
  		if (show_if == null || dirty & /*cell*/ 1) show_if = !!(/*cell*/ ctx[0].getValue() == 'NA');
  		if (show_if) return create_if_block$4;
  		return create_else_block$3;
  	}

  	let current_block_type = select_block_type(ctx, -1);
  	let if_block = current_block_type(ctx);

  	tooltip = new Tooltip$1({
  			props: { tooltip: /*cell*/ ctx[0].getTooltip() },
  			$$inline: true
  		});

  	const block = {
  		c: function create() {
  			td = element("td");
  			if_block.c();
  			t = space();
  			create_component(tooltip.$$.fragment);
  			attr_dev(td, "class", "sensitivity-data has-tooltip svelte-1uu4wbt");
  			toggle_class(td, "active", /*cell*/ ctx[0].getActive());
  			toggle_class(td, "highlighted", /*cell*/ ctx[0].getHighlighted());
  			add_location(td, file$a, 4, 0, 124);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, td, anchor);
  			if_block.m(td, null);
  			append_dev(td, t);
  			mount_component(tooltip, td, null);
  			current = true;

  			if (!mounted) {
  				dispose = [
  					listen_dev(td, "focus", /*focus_handler*/ ctx[1], false, false, false),
  					listen_dev(td, "mouseover", /*mouseover_handler*/ ctx[2], false, false, false),
  					listen_dev(td, "blur", /*blur_handler*/ ctx[3], false, false, false),
  					listen_dev(td, "mouseout", /*mouseout_handler*/ ctx[4], false, false, false)
  				];

  				mounted = true;
  			}
  		},
  		p: function update(ctx, [dirty]) {
  			if (current_block_type === (current_block_type = select_block_type(ctx, dirty)) && if_block) {
  				if_block.p(ctx, dirty);
  			} else {
  				if_block.d(1);
  				if_block = current_block_type(ctx);

  				if (if_block) {
  					if_block.c();
  					if_block.m(td, t);
  				}
  			}

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
  		i: function intro(local) {
  			if (current) return;
  			transition_in(tooltip.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(tooltip.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(td);
  			if_block.d();
  			destroy_component(tooltip);
  			mounted = false;
  			run_all(dispose);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$e.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$e($$self, $$props, $$invalidate) {
  	let { $$slots: slots = {}, $$scope } = $$props;
  	validate_slots('Cell', slots, []);
  	let { cell } = $$props;
  	const writable_props = ['cell'];

  	Object.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Cell> was created with unknown prop '${key}'`);
  	});

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

  	$$self.$capture_state = () => ({ cell, ToolTip: Tooltip$1 });

  	$$self.$inject_state = $$props => {
  		if ('cell' in $$props) $$invalidate(0, cell = $$props.cell);
  	};

  	if ($$props && "$$inject" in $$props) {
  		$$self.$inject_state($$props.$$inject);
  	}

  	return [cell, focus_handler, mouseover_handler, blur_handler, mouseout_handler];
  }

  class Cell$1 extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$e, create_fragment$e, safe_not_equal, { cell: 0 });

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "Cell",
  			options,
  			id: create_fragment$e.name
  		});

  		const { ctx } = this.$$;
  		const props = options.props || {};

  		if (/*cell*/ ctx[0] === undefined && !('cell' in props)) {
  			console.warn("<Cell> was created without expected prop 'cell'");
  		}
  	}

  	get cell() {
  		throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set cell(value) {
  		throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}
  }

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

  /* src\infrastructure\view\templates\table\RowHeader.svelte generated by Svelte v3.44.3 */

  const { console: console_1$3 } = globals;
  const file$9 = "src\\infrastructure\\view\\templates\\table\\RowHeader.svelte";

  // (26:2) {#if rowHeader.inGroup() === true}
  function create_if_block$3(ctx) {
  	let show_if = /*rowHeader*/ ctx[0].isFirstOfGroup() === true;
  	let if_block_anchor;
  	let if_block = show_if && create_if_block_1(ctx);

  	const block = {
  		c: function create() {
  			if (if_block) if_block.c();
  			if_block_anchor = empty();
  		},
  		m: function mount(target, anchor) {
  			if (if_block) if_block.m(target, anchor);
  			insert_dev(target, if_block_anchor, anchor);
  		},
  		p: function update(ctx, dirty) {
  			if (dirty & /*rowHeader*/ 1) show_if = /*rowHeader*/ ctx[0].isFirstOfGroup() === true;

  			if (show_if) {
  				if (if_block) {
  					if_block.p(ctx, dirty);
  				} else {
  					if_block = create_if_block_1(ctx);
  					if_block.c();
  					if_block.m(if_block_anchor.parentNode, if_block_anchor);
  				}
  			} else if (if_block) {
  				if_block.d(1);
  				if_block = null;
  			}
  		},
  		d: function destroy(detaching) {
  			if (if_block) if_block.d(detaching);
  			if (detaching) detach_dev(if_block_anchor);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block$3.name,
  		type: "if",
  		source: "(26:2) {#if rowHeader.inGroup() === true}",
  		ctx
  	});

  	return block;
  }

  // (27:4) {#if rowHeader.isFirstOfGroup() === true}
  function create_if_block_1(ctx) {
  	let show_if;
  	let show_if_1;
  	let if_block_anchor;

  	function select_block_type(ctx, dirty) {
  		if (show_if == null || dirty & /*rowHeader*/ 1) show_if = !!(/*rowHeader*/ ctx[0].isCollapsed() === true);
  		if (show_if) return create_if_block_2;
  		if (show_if_1 == null || dirty & /*rowHeader*/ 1) show_if_1 = !!(/*rowHeader*/ ctx[0].isCollapsed() === false);
  		if (show_if_1) return create_if_block_3;
  	}

  	let current_block_type = select_block_type(ctx, -1);
  	let if_block = current_block_type && current_block_type(ctx);

  	const block = {
  		c: function create() {
  			if (if_block) if_block.c();
  			if_block_anchor = empty();
  		},
  		m: function mount(target, anchor) {
  			if (if_block) if_block.m(target, anchor);
  			insert_dev(target, if_block_anchor, anchor);
  		},
  		p: function update(ctx, dirty) {
  			if (current_block_type === (current_block_type = select_block_type(ctx, dirty)) && if_block) {
  				if_block.p(ctx, dirty);
  			} else {
  				if (if_block) if_block.d(1);
  				if_block = current_block_type && current_block_type(ctx);

  				if (if_block) {
  					if_block.c();
  					if_block.m(if_block_anchor.parentNode, if_block_anchor);
  				}
  			}
  		},
  		d: function destroy(detaching) {
  			if (if_block) {
  				if_block.d(detaching);
  			}

  			if (detaching) detach_dev(if_block_anchor);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block_1.name,
  		type: "if",
  		source: "(27:4) {#if rowHeader.isFirstOfGroup() === true}",
  		ctx
  	});

  	return block;
  }

  // (41:50) 
  function create_if_block_3(ctx) {
  	let div;
  	let ion_icon;
  	let mounted;
  	let dispose;

  	const block = {
  		c: function create() {
  			div = element("div");
  			ion_icon = element("ion-icon");
  			set_custom_element_data(ion_icon, "name", "chevron-down-outline");
  			set_custom_element_data(ion_icon, "class", "clickable horizontally-center");
  			add_location(ion_icon, file$9, 48, 10, 1380);
  			attr_dev(div, "class", "groupIcon clickable svelte-1jrwzdc");
  			add_location(div, file$9, 41, 8, 1183);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, div, anchor);
  			append_dev(div, ion_icon);

  			if (!mounted) {
  				dispose = listen_dev(div, "click", /*click_handler_2*/ ctx[7], false, false, false);
  				mounted = true;
  			}
  		},
  		p: noop,
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(div);
  			mounted = false;
  			dispose();
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block_3.name,
  		type: "if",
  		source: "(41:50) ",
  		ctx
  	});

  	return block;
  }

  // (28:6) {#if rowHeader.isCollapsed() === true}
  function create_if_block_2(ctx) {
  	let div;
  	let ion_icon;
  	let mounted;
  	let dispose;

  	const block = {
  		c: function create() {
  			div = element("div");
  			ion_icon = element("ion-icon");
  			set_custom_element_data(ion_icon, "name", "chevron-forward-outline");
  			set_custom_element_data(ion_icon, "class", "clickable horizontally-center");
  			add_location(ion_icon, file$9, 35, 10, 993);
  			attr_dev(div, "class", "groupIcon clickable svelte-1jrwzdc");
  			add_location(div, file$9, 28, 8, 799);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, div, anchor);
  			append_dev(div, ion_icon);

  			if (!mounted) {
  				dispose = listen_dev(div, "click", /*click_handler_1*/ ctx[6], false, false, false);
  				mounted = true;
  			}
  		},
  		p: noop,
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(div);
  			mounted = false;
  			dispose();
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block_2.name,
  		type: "if",
  		source: "(28:6) {#if rowHeader.isCollapsed() === true}",
  		ctx
  	});

  	return block;
  }

  function create_fragment$d(ctx) {
  	let th;
  	let div;
  	let t0_value = /*rowHeader*/ ctx[0].getValue() + "";
  	let t0;
  	let t1;
  	let show_if = /*rowHeader*/ ctx[0].inGroup() === true;
  	let t2;
  	let tooltip;
  	let current;
  	let mounted;
  	let dispose;
  	let if_block = show_if && create_if_block$3(ctx);

  	tooltip = new Tooltip$1({
  			props: {
  				tooltip: /*rowHeader*/ ctx[0].getTooltip()
  			},
  			$$inline: true
  		});

  	const block = {
  		c: function create() {
  			th = element("th");
  			div = element("div");
  			t0 = text(t0_value);
  			t1 = space();
  			if (if_block) if_block.c();
  			t2 = space();
  			create_component(tooltip.$$.fragment);
  			attr_dev(div, "class", "organism-name svelte-1jrwzdc");
  			toggle_class(div, "indented", /*rowHeader*/ ctx[0].inGroup() === true && /*rowHeader*/ ctx[0].isFirstOfGroup() === false);
  			add_location(div, file$9, 16, 2, 434);
  			attr_dev(th, "class", "row-header has-tooltip svelte-1jrwzdc");
  			attr_dev(th, "width", "200px");
  			toggle_class(th, "active", /*rowHeader*/ ctx[0].getActive());
  			toggle_class(th, "highlighted", /*rowHeader*/ ctx[0].getHighlighted());
  			add_location(th, file$9, 6, 0, 239);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, th, anchor);
  			append_dev(th, div);
  			append_dev(div, t0);
  			append_dev(th, t1);
  			if (if_block) if_block.m(th, null);
  			append_dev(th, t2);
  			mount_component(tooltip, th, null);
  			current = true;

  			if (!mounted) {
  				dispose = [
  					listen_dev(div, "click", /*click_handler*/ ctx[5], false, false, false),
  					listen_dev(th, "focus", /*focus_handler*/ ctx[1], false, false, false),
  					listen_dev(th, "mouseover", /*mouseover_handler*/ ctx[2], false, false, false),
  					listen_dev(th, "blur", /*blur_handler*/ ctx[3], false, false, false),
  					listen_dev(th, "mouseout", /*mouseout_handler*/ ctx[4], false, false, false)
  				];

  				mounted = true;
  			}
  		},
  		p: function update(ctx, [dirty]) {
  			if ((!current || dirty & /*rowHeader*/ 1) && t0_value !== (t0_value = /*rowHeader*/ ctx[0].getValue() + "")) set_data_dev(t0, t0_value);

  			if (dirty & /*rowHeader*/ 1) {
  				toggle_class(div, "indented", /*rowHeader*/ ctx[0].inGroup() === true && /*rowHeader*/ ctx[0].isFirstOfGroup() === false);
  			}

  			if (dirty & /*rowHeader*/ 1) show_if = /*rowHeader*/ ctx[0].inGroup() === true;

  			if (show_if) {
  				if (if_block) {
  					if_block.p(ctx, dirty);
  				} else {
  					if_block = create_if_block$3(ctx);
  					if_block.c();
  					if_block.m(th, t2);
  				}
  			} else if (if_block) {
  				if_block.d(1);
  				if_block = null;
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
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(tooltip.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(tooltip.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(th);
  			if (if_block) if_block.d();
  			destroy_component(tooltip);
  			mounted = false;
  			run_all(dispose);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$d.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$d($$self, $$props, $$invalidate) {
  	let { $$slots: slots = {}, $$scope } = $$props;
  	validate_slots('RowHeader', slots, []);
  	let { rowHeader } = $$props;
  	const writable_props = ['rowHeader'];

  	Object.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$3.warn(`<RowHeader> was created with unknown prop '${key}'`);
  	});

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

  	const click_handler = () => state.expandGroup(rowHeader.getGroup());

  	const click_handler_1 = () => {
  		state.expandGroup(rowHeader.getGroup());
  		console.log('expanded');
  	};

  	const click_handler_2 = () => {
  		state.collapseGroup(rowHeader.getGroup());
  		console.log('collapsed');
  	};

  	$$self.$$set = $$props => {
  		if ('rowHeader' in $$props) $$invalidate(0, rowHeader = $$props.rowHeader);
  	};

  	$$self.$capture_state = () => ({
  		rowHeader,
  		NoIntersectingGroupRanges,
  		ToolTip: Tooltip$1,
  		state
  	});

  	$$self.$inject_state = $$props => {
  		if ('rowHeader' in $$props) $$invalidate(0, rowHeader = $$props.rowHeader);
  	};

  	if ($$props && "$$inject" in $$props) {
  		$$self.$inject_state($$props.$$inject);
  	}

  	return [
  		rowHeader,
  		focus_handler,
  		mouseover_handler,
  		blur_handler,
  		mouseout_handler,
  		click_handler,
  		click_handler_1,
  		click_handler_2
  	];
  }

  class RowHeader extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$d, create_fragment$d, safe_not_equal, { rowHeader: 0 });

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "RowHeader",
  			options,
  			id: create_fragment$d.name
  		});

  		const { ctx } = this.$$;
  		const props = options.props || {};

  		if (/*rowHeader*/ ctx[0] === undefined && !('rowHeader' in props)) {
  			console_1$3.warn("<RowHeader> was created without expected prop 'rowHeader'");
  		}
  	}

  	get rowHeader() {
  		throw new Error("<RowHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set rowHeader(value) {
  		throw new Error("<RowHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}
  }

  /* src\infrastructure\view\templates\table\TableRow.svelte generated by Svelte v3.44.3 */
  const file$8 = "src\\infrastructure\\view\\templates\\table\\TableRow.svelte";

  function get_each_context$2(ctx, list, i) {
  	const child_ctx = ctx.slice();
  	child_ctx[12] = list[i];
  	child_ctx[14] = i;
  	return child_ctx;
  }

  // (17:2) {#each rowOfCells as cell, j (cell.id)}
  function create_each_block$2(key_1, ctx) {
  	let first;
  	let cell;
  	let current;

  	function focus_handler_1() {
  		return /*focus_handler_1*/ ctx[8](/*j*/ ctx[14]);
  	}

  	function mouseover_handler_1() {
  		return /*mouseover_handler_1*/ ctx[9](/*j*/ ctx[14]);
  	}

  	function blur_handler_1() {
  		return /*blur_handler_1*/ ctx[10](/*j*/ ctx[14]);
  	}

  	function mouseout_handler_1() {
  		return /*mouseout_handler_1*/ ctx[11](/*j*/ ctx[14]);
  	}

  	cell = new Cell$1({
  			props: { cell: /*cell*/ ctx[12] },
  			$$inline: true
  		});

  	cell.$on("focus", focus_handler_1);
  	cell.$on("mouseover", mouseover_handler_1);
  	cell.$on("blur", blur_handler_1);
  	cell.$on("mouseout", mouseout_handler_1);

  	const block = {
  		key: key_1,
  		first: null,
  		c: function create() {
  			first = empty();
  			create_component(cell.$$.fragment);
  			this.first = first;
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, first, anchor);
  			mount_component(cell, target, anchor);
  			current = true;
  		},
  		p: function update(new_ctx, dirty) {
  			ctx = new_ctx;
  			const cell_changes = {};
  			if (dirty & /*rowOfCells*/ 1) cell_changes.cell = /*cell*/ ctx[12];
  			cell.$set(cell_changes);
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(cell.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(cell.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(first);
  			destroy_component(cell, detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_each_block$2.name,
  		type: "each",
  		source: "(17:2) {#each rowOfCells as cell, j (cell.id)}",
  		ctx
  	});

  	return block;
  }

  function create_fragment$c(ctx) {
  	let tr;
  	let rowheader;
  	let t;
  	let each_blocks = [];
  	let each_1_lookup = new Map();
  	let current;

  	rowheader = new RowHeader({
  			props: { rowHeader: /*rowHeader*/ ctx[1] },
  			$$inline: true
  		});

  	rowheader.$on("focus", /*focus_handler*/ ctx[4]);
  	rowheader.$on("mouseover", /*mouseover_handler*/ ctx[5]);
  	rowheader.$on("blur", /*blur_handler*/ ctx[6]);
  	rowheader.$on("mouseout", /*mouseout_handler*/ ctx[7]);
  	let each_value = /*rowOfCells*/ ctx[0];
  	validate_each_argument(each_value);
  	const get_key = ctx => /*cell*/ ctx[12].id;
  	validate_each_keys(ctx, each_value, get_each_context$2, get_key);

  	for (let i = 0; i < each_value.length; i += 1) {
  		let child_ctx = get_each_context$2(ctx, each_value, i);
  		let key = get_key(child_ctx);
  		each_1_lookup.set(key, each_blocks[i] = create_each_block$2(key, child_ctx));
  	}

  	const block = {
  		c: function create() {
  			tr = element("tr");
  			create_component(rowheader.$$.fragment);
  			t = space();

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].c();
  			}

  			add_location(tr, file$8, 8, 0, 219);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, tr, anchor);
  			mount_component(rowheader, tr, null);
  			append_dev(tr, t);

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].m(tr, null);
  			}

  			current = true;
  		},
  		p: function update(ctx, [dirty]) {
  			const rowheader_changes = {};
  			if (dirty & /*rowHeader*/ 2) rowheader_changes.rowHeader = /*rowHeader*/ ctx[1];
  			rowheader.$set(rowheader_changes);

  			if (dirty & /*rowOfCells, toggleHighlightCells*/ 5) {
  				each_value = /*rowOfCells*/ ctx[0];
  				validate_each_argument(each_value);
  				group_outros();
  				validate_each_keys(ctx, each_value, get_each_context$2, get_key);
  				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, tr, outro_and_destroy_block, create_each_block$2, null, get_each_context$2);
  				check_outros();
  			}
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(rowheader.$$.fragment, local);

  			for (let i = 0; i < each_value.length; i += 1) {
  				transition_in(each_blocks[i]);
  			}

  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(rowheader.$$.fragment, local);

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				transition_out(each_blocks[i]);
  			}

  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(tr);
  			destroy_component(rowheader);

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].d();
  			}
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$c.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$c($$self, $$props, $$invalidate) {
  	let { $$slots: slots = {}, $$scope } = $$props;
  	validate_slots('TableRow', slots, []);
  	let { rowOfCells } = $$props;
  	let { rowHeader } = $$props;
  	let { toggleHighlightCells } = $$props;
  	let { toggleHighlight } = $$props;
  	const writable_props = ['rowOfCells', 'rowHeader', 'toggleHighlightCells', 'toggleHighlight'];

  	Object.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TableRow> was created with unknown prop '${key}'`);
  	});

  	const focus_handler = () => toggleHighlight();
  	const mouseover_handler = () => toggleHighlight();
  	const blur_handler = () => toggleHighlight();
  	const mouseout_handler = () => toggleHighlight();
  	const focus_handler_1 = j => toggleHighlightCells(j);
  	const mouseover_handler_1 = j => toggleHighlightCells(j);
  	const blur_handler_1 = j => toggleHighlightCells(j);
  	const mouseout_handler_1 = j => toggleHighlightCells(j);

  	$$self.$$set = $$props => {
  		if ('rowOfCells' in $$props) $$invalidate(0, rowOfCells = $$props.rowOfCells);
  		if ('rowHeader' in $$props) $$invalidate(1, rowHeader = $$props.rowHeader);
  		if ('toggleHighlightCells' in $$props) $$invalidate(2, toggleHighlightCells = $$props.toggleHighlightCells);
  		if ('toggleHighlight' in $$props) $$invalidate(3, toggleHighlight = $$props.toggleHighlight);
  	};

  	$$self.$capture_state = () => ({
  		Cell: Cell$1,
  		RowHeader,
  		rowOfCells,
  		rowHeader,
  		toggleHighlightCells,
  		toggleHighlight
  	});

  	$$self.$inject_state = $$props => {
  		if ('rowOfCells' in $$props) $$invalidate(0, rowOfCells = $$props.rowOfCells);
  		if ('rowHeader' in $$props) $$invalidate(1, rowHeader = $$props.rowHeader);
  		if ('toggleHighlightCells' in $$props) $$invalidate(2, toggleHighlightCells = $$props.toggleHighlightCells);
  		if ('toggleHighlight' in $$props) $$invalidate(3, toggleHighlight = $$props.toggleHighlight);
  	};

  	if ($$props && "$$inject" in $$props) {
  		$$self.$inject_state($$props.$$inject);
  	}

  	return [
  		rowOfCells,
  		rowHeader,
  		toggleHighlightCells,
  		toggleHighlight,
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

  class TableRow$1 extends SvelteComponentDev {
  	constructor(options) {
  		super(options);

  		init(this, options, instance$c, create_fragment$c, safe_not_equal, {
  			rowOfCells: 0,
  			rowHeader: 1,
  			toggleHighlightCells: 2,
  			toggleHighlight: 3
  		});

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "TableRow",
  			options,
  			id: create_fragment$c.name
  		});

  		const { ctx } = this.$$;
  		const props = options.props || {};

  		if (/*rowOfCells*/ ctx[0] === undefined && !('rowOfCells' in props)) {
  			console.warn("<TableRow> was created without expected prop 'rowOfCells'");
  		}

  		if (/*rowHeader*/ ctx[1] === undefined && !('rowHeader' in props)) {
  			console.warn("<TableRow> was created without expected prop 'rowHeader'");
  		}

  		if (/*toggleHighlightCells*/ ctx[2] === undefined && !('toggleHighlightCells' in props)) {
  			console.warn("<TableRow> was created without expected prop 'toggleHighlightCells'");
  		}

  		if (/*toggleHighlight*/ ctx[3] === undefined && !('toggleHighlight' in props)) {
  			console.warn("<TableRow> was created without expected prop 'toggleHighlight'");
  		}
  	}

  	get rowOfCells() {
  		throw new Error("<TableRow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set rowOfCells(value) {
  		throw new Error("<TableRow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get rowHeader() {
  		throw new Error("<TableRow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set rowHeader(value) {
  		throw new Error("<TableRow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get toggleHighlightCells() {
  		throw new Error("<TableRow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set toggleHighlightCells(value) {
  		throw new Error("<TableRow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get toggleHighlight() {
  		throw new Error("<TableRow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set toggleHighlight(value) {
  		throw new Error("<TableRow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}
  }

  /* src\infrastructure\view\templates\table\ColumnHeader.svelte generated by Svelte v3.44.3 */
  const file$7 = "src\\infrastructure\\view\\templates\\table\\ColumnHeader.svelte";

  function create_fragment$b(ctx) {
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
  			},
  			$$inline: true
  		});

  	const block = {
  		c: function create() {
  			th = element("th");
  			span = element("span");
  			t0 = text(t0_value);
  			t1 = space();
  			create_component(tooltip.$$.fragment);
  			attr_dev(span, "class", "antibiotic-name svelte-qt761x");
  			add_location(span, file$7, 15, 2, 467);
  			attr_dev(th, "scope", "col");
  			attr_dev(th, "class", "column-header has-tooltip svelte-qt761x");
  			toggle_class(th, "active", /*columnHeader*/ ctx[0].getActive());
  			toggle_class(th, "highlighted", /*columnHeader*/ ctx[0].getHighlighted());
  			add_location(th, file$7, 5, 0, 161);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, th, anchor);
  			append_dev(th, span);
  			append_dev(span, t0);
  			append_dev(th, t1);
  			mount_component(tooltip, th, null);
  			current = true;

  			if (!mounted) {
  				dispose = [
  					listen_dev(th, "focus", /*focus_handler*/ ctx[2], false, false, false),
  					listen_dev(th, "mouseover", /*mouseover_handler*/ ctx[3], false, false, false),
  					listen_dev(th, "blur", /*blur_handler*/ ctx[4], false, false, false),
  					listen_dev(th, "mouseout", /*mouseout_handler*/ ctx[5], false, false, false)
  				];

  				mounted = true;
  			}
  		},
  		p: function update(ctx, [dirty]) {
  			if ((!current || dirty & /*columnHeader*/ 1) && t0_value !== (t0_value = /*columnHeader*/ ctx[0].getValue() + "")) set_data_dev(t0, t0_value);
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
  		i: function intro(local) {
  			if (current) return;
  			transition_in(tooltip.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(tooltip.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(th);
  			destroy_component(tooltip);
  			mounted = false;
  			run_all(dispose);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$b.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$b($$self, $$props, $$invalidate) {
  	let { $$slots: slots = {}, $$scope } = $$props;
  	validate_slots('ColumnHeader', slots, []);
  	let { columnHeader } = $$props;
  	let { toggleHighlight } = $$props;
  	const writable_props = ['columnHeader', 'toggleHighlight'];

  	Object.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ColumnHeader> was created with unknown prop '${key}'`);
  	});

  	const focus_handler = () => toggleHighlight();
  	const mouseover_handler = () => toggleHighlight();
  	const blur_handler = () => toggleHighlight();
  	const mouseout_handler = () => toggleHighlight();

  	$$self.$$set = $$props => {
  		if ('columnHeader' in $$props) $$invalidate(0, columnHeader = $$props.columnHeader);
  		if ('toggleHighlight' in $$props) $$invalidate(1, toggleHighlight = $$props.toggleHighlight);
  	};

  	$$self.$capture_state = () => ({ columnHeader, ToolTip: Tooltip$1, toggleHighlight });

  	$$self.$inject_state = $$props => {
  		if ('columnHeader' in $$props) $$invalidate(0, columnHeader = $$props.columnHeader);
  		if ('toggleHighlight' in $$props) $$invalidate(1, toggleHighlight = $$props.toggleHighlight);
  	};

  	if ($$props && "$$inject" in $$props) {
  		$$self.$inject_state($$props.$$inject);
  	}

  	return [
  		columnHeader,
  		toggleHighlight,
  		focus_handler,
  		mouseover_handler,
  		blur_handler,
  		mouseout_handler
  	];
  }

  class ColumnHeader extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$b, create_fragment$b, safe_not_equal, { columnHeader: 0, toggleHighlight: 1 });

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "ColumnHeader",
  			options,
  			id: create_fragment$b.name
  		});

  		const { ctx } = this.$$;
  		const props = options.props || {};

  		if (/*columnHeader*/ ctx[0] === undefined && !('columnHeader' in props)) {
  			console.warn("<ColumnHeader> was created without expected prop 'columnHeader'");
  		}

  		if (/*toggleHighlight*/ ctx[1] === undefined && !('toggleHighlight' in props)) {
  			console.warn("<ColumnHeader> was created without expected prop 'toggleHighlight'");
  		}
  	}

  	get columnHeader() {
  		throw new Error("<ColumnHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set columnHeader(value) {
  		throw new Error("<ColumnHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get toggleHighlight() {
  		throw new Error("<ColumnHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set toggleHighlight(value) {
  		throw new Error("<ColumnHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}
  }

  /* src\infrastructure\view\templates\table\NoTable.svelte generated by Svelte v3.44.3 */

  const file$6 = "src\\infrastructure\\view\\templates\\table\\NoTable.svelte";

  function create_fragment$a(ctx) {
  	let div;

  	const block = {
  		c: function create() {
  			div = element("div");
  			div.textContent = "Sorry no data yet.";
  			add_location(div, file$6, 3, 0, 44);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, div, anchor);
  		},
  		p: noop,
  		i: noop,
  		o: noop,
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(div);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$a.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$a($$self, $$props) {
  	let { $$slots: slots = {}, $$scope } = $$props;
  	validate_slots('NoTable', slots, []);
  	const writable_props = [];

  	Object.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<NoTable> was created with unknown prop '${key}'`);
  	});

  	return [];
  }

  class NoTable extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "NoTable",
  			options,
  			id: create_fragment$a.name
  		});
  	}
  }

  /* src\infrastructure\view\templates\table\EmptyCorner.svelte generated by Svelte v3.44.3 */

  const file$5 = "src\\infrastructure\\view\\templates\\table\\EmptyCorner.svelte";

  function create_fragment$9(ctx) {
  	let th;

  	const block = {
  		c: function create() {
  			th = element("th");
  			attr_dev(th, "class", "topLeftBlock svelte-8ex4ab");
  			add_location(th, file$5, 3, 0, 44);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, th, anchor);
  		},
  		p: noop,
  		i: noop,
  		o: noop,
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(th);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$9.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$9($$self, $$props) {
  	let { $$slots: slots = {}, $$scope } = $$props;
  	validate_slots('EmptyCorner', slots, []);
  	const writable_props = [];

  	Object.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<EmptyCorner> was created with unknown prop '${key}'`);
  	});

  	return [];
  }

  class EmptyCorner extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "EmptyCorner",
  			options,
  			id: create_fragment$9.name
  		});
  	}
  }

  /* src\infrastructure\view\templates\table\Table.svelte generated by Svelte v3.44.3 */
  const file$4 = "src\\infrastructure\\view\\templates\\table\\Table.svelte";

  function get_each_context$1(ctx, list, i) {
  	const child_ctx = ctx.slice();
  	child_ctx[7] = list[i];
  	child_ctx[9] = i;
  	return child_ctx;
  }

  function get_each_context_1(ctx, list, i) {
  	const child_ctx = ctx.slice();
  	child_ctx[10] = list[i];
  	child_ctx[12] = i;
  	return child_ctx;
  }

  // (30:2) {:else}
  function create_else_block$2(ctx) {
  	let table;
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
  	emptycorner = new EmptyCorner({ $$inline: true });
  	let each_value_1 = /*$state*/ ctx[1].columnHeaders;
  	validate_each_argument(each_value_1);
  	const get_key = ctx => /*columnHeader*/ ctx[10].id;
  	validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);

  	for (let i = 0; i < each_value_1.length; i += 1) {
  		let child_ctx = get_each_context_1(ctx, each_value_1, i);
  		let key = get_key(child_ctx);
  		each0_lookup.set(key, each_blocks_1[i] = create_each_block_1(key, child_ctx));
  	}

  	let each_value = /*$state*/ ctx[1].rowHeaders;
  	validate_each_argument(each_value);
  	const get_key_1 = ctx => /*rowHeader*/ ctx[7].id;
  	validate_each_keys(ctx, each_value, get_each_context$1, get_key_1);

  	for (let i = 0; i < each_value.length; i += 1) {
  		let child_ctx = get_each_context$1(ctx, each_value, i);
  		let key = get_key_1(child_ctx);
  		each1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
  	}

  	const block = {
  		c: function create() {
  			table = element("table");
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

  			attr_dev(tr, "class", "svelte-mhzzwi");
  			add_location(tr, file$4, 32, 8, 942);
  			add_location(thead, file$4, 31, 6, 926);
  			add_location(tbody, file$4, 42, 6, 1241);
  			attr_dev(table, "class", "antibiogram-table svelte-mhzzwi");
  			attr_dev(table, "id", "table");
  			add_location(table, file$4, 30, 4, 875);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, table, anchor);
  			append_dev(table, thead);
  			append_dev(thead, tr);
  			mount_component(emptycorner, tr, null);
  			append_dev(tr, t0);

  			for (let i = 0; i < each_blocks_1.length; i += 1) {
  				each_blocks_1[i].m(tr, null);
  			}

  			append_dev(table, t1);
  			append_dev(table, tbody);

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].m(tbody, null);
  			}

  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			if (dirty & /*$state, state*/ 2) {
  				each_value_1 = /*$state*/ ctx[1].columnHeaders;
  				validate_each_argument(each_value_1);
  				group_outros();
  				validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);
  				each_blocks_1 = update_keyed_each(each_blocks_1, dirty, get_key, 1, ctx, each_value_1, each0_lookup, tr, outro_and_destroy_block, create_each_block_1, null, get_each_context_1);
  				check_outros();
  			}

  			if (dirty & /*$state, state*/ 2) {
  				each_value = /*$state*/ ctx[1].rowHeaders;
  				validate_each_argument(each_value);
  				group_outros();
  				validate_each_keys(ctx, each_value, get_each_context$1, get_key_1);
  				each_blocks = update_keyed_each(each_blocks, dirty, get_key_1, 1, ctx, each_value, each1_lookup, tbody, outro_and_destroy_block, create_each_block$1, null, get_each_context$1);
  				check_outros();
  			}
  		},
  		i: function intro(local) {
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
  		o: function outro(local) {
  			transition_out(emptycorner.$$.fragment, local);

  			for (let i = 0; i < each_blocks_1.length; i += 1) {
  				transition_out(each_blocks_1[i]);
  			}

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				transition_out(each_blocks[i]);
  			}

  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(table);
  			destroy_component(emptycorner);

  			for (let i = 0; i < each_blocks_1.length; i += 1) {
  				each_blocks_1[i].d();
  			}

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].d();
  			}
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_else_block$2.name,
  		type: "else",
  		source: "(30:2) {:else}",
  		ctx
  	});

  	return block;
  }

  // (28:2) {#if !$state.grid}
  function create_if_block$2(ctx) {
  	let notable;
  	let current;
  	notable = new NoTable({ $$inline: true });

  	const block = {
  		c: function create() {
  			create_component(notable.$$.fragment);
  		},
  		m: function mount(target, anchor) {
  			mount_component(notable, target, anchor);
  			current = true;
  		},
  		p: noop,
  		i: function intro(local) {
  			if (current) return;
  			transition_in(notable.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(notable.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			destroy_component(notable, detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block$2.name,
  		type: "if",
  		source: "(28:2) {#if !$state.grid}",
  		ctx
  	});

  	return block;
  }

  // (35:10) {#each $state.columnHeaders as columnHeader, j (columnHeader.id)}
  function create_each_block_1(key_1, ctx) {
  	let first;
  	let columnheader;
  	let current;

  	function func() {
  		return /*func*/ ctx[3](/*j*/ ctx[12]);
  	}

  	columnheader = new ColumnHeader({
  			props: {
  				columnHeader: /*columnHeader*/ ctx[10],
  				toggleHighlight: func
  			},
  			$$inline: true
  		});

  	const block = {
  		key: key_1,
  		first: null,
  		c: function create() {
  			first = empty();
  			create_component(columnheader.$$.fragment);
  			this.first = first;
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, first, anchor);
  			mount_component(columnheader, target, anchor);
  			current = true;
  		},
  		p: function update(new_ctx, dirty) {
  			ctx = new_ctx;
  			const columnheader_changes = {};
  			if (dirty & /*$state*/ 2) columnheader_changes.columnHeader = /*columnHeader*/ ctx[10];
  			if (dirty & /*$state*/ 2) columnheader_changes.toggleHighlight = func;
  			columnheader.$set(columnheader_changes);
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(columnheader.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(columnheader.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(first);
  			destroy_component(columnheader, detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_each_block_1.name,
  		type: "each",
  		source: "(35:10) {#each $state.columnHeaders as columnHeader, j (columnHeader.id)}",
  		ctx
  	});

  	return block;
  }

  // (44:8) {#each $state.rowHeaders as rowHeader, i (rowHeader.id)}
  function create_each_block$1(key_1, ctx) {
  	let first;
  	let tablerow;
  	let current;

  	function func_1(...args) {
  		return /*func_1*/ ctx[4](/*i*/ ctx[9], ...args);
  	}

  	function func_2() {
  		return /*func_2*/ ctx[5](/*i*/ ctx[9]);
  	}

  	tablerow = new TableRow$1({
  			props: {
  				rowHeader: /*rowHeader*/ ctx[7],
  				rowOfCells: /*$state*/ ctx[1].grid[/*i*/ ctx[9]],
  				toggleHighlightCells: func_1,
  				toggleHighlight: func_2
  			},
  			$$inline: true
  		});

  	const block = {
  		key: key_1,
  		first: null,
  		c: function create() {
  			first = empty();
  			create_component(tablerow.$$.fragment);
  			this.first = first;
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, first, anchor);
  			mount_component(tablerow, target, anchor);
  			current = true;
  		},
  		p: function update(new_ctx, dirty) {
  			ctx = new_ctx;
  			const tablerow_changes = {};
  			if (dirty & /*$state*/ 2) tablerow_changes.rowHeader = /*rowHeader*/ ctx[7];
  			if (dirty & /*$state*/ 2) tablerow_changes.rowOfCells = /*$state*/ ctx[1].grid[/*i*/ ctx[9]];
  			if (dirty & /*$state*/ 2) tablerow_changes.toggleHighlightCells = func_1;
  			if (dirty & /*$state*/ 2) tablerow_changes.toggleHighlight = func_2;
  			tablerow.$set(tablerow_changes);
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(tablerow.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(tablerow.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(first);
  			destroy_component(tablerow, detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_each_block$1.name,
  		type: "each",
  		source: "(44:8) {#each $state.rowHeaders as rowHeader, i (rowHeader.id)}",
  		ctx
  	});

  	return block;
  }

  function create_fragment$8(ctx) {
  	let div;
  	let current_block_type_index;
  	let if_block;
  	let current;
  	const if_block_creators = [create_if_block$2, create_else_block$2];
  	const if_blocks = [];

  	function select_block_type(ctx, dirty) {
  		if (!/*$state*/ ctx[1].grid) return 0;
  		return 1;
  	}

  	current_block_type_index = select_block_type(ctx);
  	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

  	const block = {
  		c: function create() {
  			div = element("div");
  			if_block.c();
  			attr_dev(div, "class", "table-window svelte-mhzzwi");
  			attr_dev(div, "id", "table-container");
  			toggle_class(div, "small-table", /*smallTable*/ ctx[0]);
  			add_location(div, file$4, 26, 0, 745);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, div, anchor);
  			if_blocks[current_block_type_index].m(div, null);
  			current = true;
  		},
  		p: function update(ctx, [dirty]) {
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
  				if_block.m(div, null);
  			}

  			if (dirty & /*smallTable*/ 1) {
  				toggle_class(div, "small-table", /*smallTable*/ ctx[0]);
  			}
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(if_block);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(if_block);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(div);
  			if_blocks[current_block_type_index].d();
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$8.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$8($$self, $$props, $$invalidate) {
  	let $state;
  	validate_store(state, 'state');
  	component_subscribe($$self, state, $$value => $$invalidate(1, $state = $$value));
  	let { $$slots: slots = {}, $$scope } = $$props;
  	validate_slots('Table', slots, []);
  	let { id } = $$props;

  	getContext('tableController').showTable(id).then(table => {
  		state.loadTable(table);
  		tableSize();
  	});

  	let smallTable = true;

  	const tableSize = () => {
  		const table = document.getElementById('table');

  		if (table && window.visualViewport.width < table.offsetWidth) {
  			$$invalidate(0, smallTable = false);
  		} else $$invalidate(0, smallTable = true);
  	};

  	window.addEventListener('resize', tableSize);
  	tableSize();
  	const writable_props = ['id'];

  	Object.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Table> was created with unknown prop '${key}'`);
  	});

  	const func = j => state.toggleHighlightColumn(j);
  	const func_1 = (i, j) => state.toggleHighlightCell(i, j);
  	const func_2 = i => state.toggleHighlightRow(i);

  	$$self.$$set = $$props => {
  		if ('id' in $$props) $$invalidate(2, id = $$props.id);
  	};

  	$$self.$capture_state = () => ({
  		getContext,
  		TableRow: TableRow$1,
  		ColumnHeader,
  		NoTable,
  		EmptyCorner,
  		state,
  		id,
  		smallTable,
  		tableSize,
  		$state
  	});

  	$$self.$inject_state = $$props => {
  		if ('id' in $$props) $$invalidate(2, id = $$props.id);
  		if ('smallTable' in $$props) $$invalidate(0, smallTable = $$props.smallTable);
  	};

  	if ($$props && "$$inject" in $$props) {
  		$$self.$inject_state($$props.$$inject);
  	}

  	return [smallTable, $state, id, func, func_1, func_2];
  }

  class Table extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$8, create_fragment$8, safe_not_equal, { id: 2 });

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "Table",
  			options,
  			id: create_fragment$8.name
  		});

  		const { ctx } = this.$$;
  		const props = options.props || {};

  		if (/*id*/ ctx[2] === undefined && !('id' in props)) {
  			console.warn("<Table> was created without expected prop 'id'");
  		}
  	}

  	get id() {
  		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set id(value) {
  		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}
  }

  /* src\infrastructure\view\templates\table-view-screen\TableViewScreen.svelte generated by Svelte v3.44.3 */

  const { console: console_1$2 } = globals;

  function create_fragment$7(ctx) {
  	let table;
  	let current;

  	table = new Table({
  			props: { id: /*params*/ ctx[0].id ?? 0 },
  			$$inline: true
  		});

  	const block = {
  		c: function create() {
  			create_component(table.$$.fragment);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			mount_component(table, target, anchor);
  			current = true;
  		},
  		p: function update(ctx, [dirty]) {
  			const table_changes = {};
  			if (dirty & /*params*/ 1) table_changes.id = /*params*/ ctx[0].id ?? 0;
  			table.$set(table_changes);
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(table.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(table.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			destroy_component(table, detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$7.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$7($$self, $$props, $$invalidate) {
  	let { $$slots: slots = {}, $$scope } = $$props;
  	validate_slots('TableViewScreen', slots, []);
  	let { params = {} } = $$props;
  	const writable_props = ['params'];

  	Object.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$2.warn(`<TableViewScreen> was created with unknown prop '${key}'`);
  	});

  	$$self.$$set = $$props => {
  		if ('params' in $$props) $$invalidate(0, params = $$props.params);
  	};

  	$$self.$capture_state = () => ({ TopBar, SelectorBar, Table, params });

  	$$self.$inject_state = $$props => {
  		if ('params' in $$props) $$invalidate(0, params = $$props.params);
  	};

  	if ($$props && "$$inject" in $$props) {
  		$$self.$inject_state($$props.$$inject);
  	}

  	$$self.$$.update = () => {
  		if ($$self.$$.dirty & /*params*/ 1) {
  			console.log('rendered!' + params.id);
  		}
  	};

  	return [params];
  }

  class TableViewScreen extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$7, create_fragment$7, safe_not_equal, { params: 0 });

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "TableViewScreen",
  			options,
  			id: create_fragment$7.name
  		});
  	}

  	get params() {
  		throw new Error("<TableViewScreen>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set params(value) {
  		throw new Error("<TableViewScreen>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}
  }

  /**
   * @typedef {Object} WrappedComponent Object returned by the `wrap` method
   * @property {SvelteComponent} component - Component to load (this is always asynchronous)
   * @property {RoutePrecondition[]} [conditions] - Route pre-conditions to validate
   * @property {Object} [props] - Optional dictionary of static props
   * @property {Object} [userData] - Optional user data dictionary
   * @property {bool} _sveltesparouter - Internal flag; always set to true
   */

  /**
   * @callback AsyncSvelteComponent
   * @returns {Promise<SvelteComponent>} Returns a Promise that resolves with a Svelte component
   */

  /**
   * @callback RoutePrecondition
   * @param {RouteDetail} detail - Route detail object
   * @returns {boolean|Promise<boolean>} If the callback returns a false-y value, it's interpreted as the precondition failed, so it aborts loading the component (and won't process other pre-condition callbacks)
   */

  /**
   * @typedef {Object} WrapOptions Options object for the call to `wrap`
   * @property {SvelteComponent} [component] - Svelte component to load (this is incompatible with `asyncComponent`)
   * @property {AsyncSvelteComponent} [asyncComponent] - Function that returns a Promise that fulfills with a Svelte component (e.g. `{asyncComponent: () => import('Foo.svelte')}`)
   * @property {SvelteComponent} [loadingComponent] - Svelte component to be displayed while the async route is loading (as a placeholder); when unset or false-y, no component is shown while component
   * @property {object} [loadingParams] - Optional dictionary passed to the `loadingComponent` component as params (for an exported prop called `params`)
   * @property {object} [userData] - Optional object that will be passed to events such as `routeLoading`, `routeLoaded`, `conditionsFailed`
   * @property {object} [props] - Optional key-value dictionary of static props that will be passed to the component. The props are expanded with {...props}, so the key in the dictionary becomes the name of the prop.
   * @property {RoutePrecondition[]|RoutePrecondition} [conditions] - Route pre-conditions to add, which will be executed in order
   */

  /**
   * Wraps a component to enable multiple capabilities:
   * 1. Using dynamically-imported component, with (e.g. `{asyncComponent: () => import('Foo.svelte')}`), which also allows bundlers to do code-splitting.
   * 2. Adding route pre-conditions (e.g. `{conditions: [...]}`)
   * 3. Adding static props that are passed to the component
   * 4. Adding custom userData, which is passed to route events (e.g. route loaded events) or to route pre-conditions (e.g. `{userData: {foo: 'bar}}`)
   * 
   * @param {WrapOptions} args - Arguments object
   * @returns {WrappedComponent} Wrapped component
   */
  function wrap$1(args) {
      if (!args) {
          throw Error('Parameter args is required')
      }

      // We need to have one and only one of component and asyncComponent
      // This does a "XNOR"
      if (!args.component == !args.asyncComponent) {
          throw Error('One and only one of component and asyncComponent is required')
      }

      // If the component is not async, wrap it into a function returning a Promise
      if (args.component) {
          args.asyncComponent = () => Promise.resolve(args.component);
      }

      // Parameter asyncComponent and each item of conditions must be functions
      if (typeof args.asyncComponent != 'function') {
          throw Error('Parameter asyncComponent must be a function')
      }
      if (args.conditions) {
          // Ensure it's an array
          if (!Array.isArray(args.conditions)) {
              args.conditions = [args.conditions];
          }
          for (let i = 0; i < args.conditions.length; i++) {
              if (!args.conditions[i] || typeof args.conditions[i] != 'function') {
                  throw Error('Invalid parameter conditions[' + i + ']')
              }
          }
      }

      // Check if we have a placeholder component
      if (args.loadingComponent) {
          args.asyncComponent.loading = args.loadingComponent;
          args.asyncComponent.loadingParams = args.loadingParams || undefined;
      }

      // Returns an object that contains all the functions to execute too
      // The _sveltesparouter flag is to confirm the object was created by this router
      const obj = {
          component: args.asyncComponent,
          userData: args.userData,
          conditions: (args.conditions && args.conditions.length) ? args.conditions : undefined,
          props: (args.props && Object.keys(args.props).length) ? args.props : {},
          _sveltesparouter: true
      };

      return obj
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

  /* node_modules\svelte-spa-router\Router.svelte generated by Svelte v3.44.3 */

  const { Error: Error_1, Object: Object_1, console: console_1$1 } = globals;

  // (251:0) {:else}
  function create_else_block$1(ctx) {
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

  		return {
  			props: switch_instance_props,
  			$$inline: true
  		};
  	}

  	if (switch_value) {
  		switch_instance = new switch_value(switch_props());
  		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
  	}

  	const block = {
  		c: function create() {
  			if (switch_instance) create_component(switch_instance.$$.fragment);
  			switch_instance_anchor = empty();
  		},
  		m: function mount(target, anchor) {
  			if (switch_instance) {
  				mount_component(switch_instance, target, anchor);
  			}

  			insert_dev(target, switch_instance_anchor, anchor);
  			current = true;
  		},
  		p: function update(ctx, dirty) {
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
  		i: function intro(local) {
  			if (current) return;
  			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(switch_instance_anchor);
  			if (switch_instance) destroy_component(switch_instance, detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_else_block$1.name,
  		type: "else",
  		source: "(251:0) {:else}",
  		ctx
  	});

  	return block;
  }

  // (244:0) {#if componentParams}
  function create_if_block$1(ctx) {
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

  		return {
  			props: switch_instance_props,
  			$$inline: true
  		};
  	}

  	if (switch_value) {
  		switch_instance = new switch_value(switch_props());
  		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
  	}

  	const block = {
  		c: function create() {
  			if (switch_instance) create_component(switch_instance.$$.fragment);
  			switch_instance_anchor = empty();
  		},
  		m: function mount(target, anchor) {
  			if (switch_instance) {
  				mount_component(switch_instance, target, anchor);
  			}

  			insert_dev(target, switch_instance_anchor, anchor);
  			current = true;
  		},
  		p: function update(ctx, dirty) {
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
  		i: function intro(local) {
  			if (current) return;
  			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(switch_instance_anchor);
  			if (switch_instance) destroy_component(switch_instance, detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block$1.name,
  		type: "if",
  		source: "(244:0) {#if componentParams}",
  		ctx
  	});

  	return block;
  }

  function create_fragment$6(ctx) {
  	let current_block_type_index;
  	let if_block;
  	let if_block_anchor;
  	let current;
  	const if_block_creators = [create_if_block$1, create_else_block$1];
  	const if_blocks = [];

  	function select_block_type(ctx, dirty) {
  		if (/*componentParams*/ ctx[1]) return 0;
  		return 1;
  	}

  	current_block_type_index = select_block_type(ctx);
  	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

  	const block = {
  		c: function create() {
  			if_block.c();
  			if_block_anchor = empty();
  		},
  		l: function claim(nodes) {
  			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			if_blocks[current_block_type_index].m(target, anchor);
  			insert_dev(target, if_block_anchor, anchor);
  			current = true;
  		},
  		p: function update(ctx, [dirty]) {
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
  		i: function intro(local) {
  			if (current) return;
  			transition_in(if_block);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(if_block);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if_blocks[current_block_type_index].d(detaching);
  			if (detaching) detach_dev(if_block_anchor);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$6.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function wrap(component, userData, ...conditions) {
  	// Use the new wrap method and show a deprecation warning
  	// eslint-disable-next-line no-console
  	console.warn('Method `wrap` from `svelte-spa-router` is deprecated and will be removed in a future version. Please use `svelte-spa-router/wrap` instead. See http://bit.ly/svelte-spa-router-upgrading');

  	return wrap$1({ component, userData, conditions });
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

  async function push(location) {
  	if (!location || location.length < 1 || location.charAt(0) != '/' && location.indexOf('#/') !== 0) {
  		throw Error('Invalid parameter location');
  	}

  	// Execute this code when the current call stack is complete
  	await tick();

  	// Note: this will include scroll state in history even when restoreScrollState is false
  	history.replaceState(
  		{
  			...history.state,
  			__svelte_spa_router_scrollX: window.scrollX,
  			__svelte_spa_router_scrollY: window.scrollY
  		},
  		undefined,
  		undefined
  	);

  	window.location.hash = (location.charAt(0) == '#' ? '' : '#') + location;
  }

  async function pop() {
  	// Execute this code when the current call stack is complete
  	await tick();

  	window.history.back();
  }

  async function replace(location) {
  	if (!location || location.length < 1 || location.charAt(0) != '/' && location.indexOf('#/') !== 0) {
  		throw Error('Invalid parameter location');
  	}

  	// Execute this code when the current call stack is complete
  	await tick();

  	const dest = (location.charAt(0) == '#' ? '' : '#') + location;

  	try {
  		const newState = { ...history.state };
  		delete newState['__svelte_spa_router_scrollX'];
  		delete newState['__svelte_spa_router_scrollY'];
  		window.history.replaceState(newState, undefined, dest);
  	} catch(e) {
  		// eslint-disable-next-line no-console
  		console.warn('Caught exception while replacing the current page. If you\'re running this in the Svelte REPL, please note that the `replace` method might not work in this environment.');
  	}

  	// The method above doesn't trigger the hashchange event, so let's do that manually
  	window.dispatchEvent(new Event('hashchange'));
  }

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

  function instance$6($$self, $$props, $$invalidate) {
  	let { $$slots: slots = {}, $$scope } = $$props;
  	validate_slots('Router', slots, []);
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

  	const writable_props = ['routes', 'prefix', 'restoreScrollState'];

  	Object_1.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Router> was created with unknown prop '${key}'`);
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

  	$$self.$capture_state = () => ({
  		readable,
  		writable,
  		derived,
  		tick,
  		_wrap: wrap$1,
  		wrap,
  		getLocation,
  		loc,
  		location,
  		querystring,
  		params,
  		push,
  		pop,
  		replace,
  		link,
  		updateLink,
  		linkOpts,
  		scrollstateHistoryHandler,
  		onDestroy,
  		createEventDispatcher,
  		afterUpdate,
  		parse,
  		routes,
  		prefix,
  		restoreScrollState,
  		RouteItem,
  		routesList,
  		component,
  		componentParams,
  		props,
  		dispatch,
  		dispatchNextTick,
  		previousScrollState,
  		popStateChanged,
  		lastLoc,
  		componentObj,
  		unsubscribeLoc
  	});

  	$$self.$inject_state = $$props => {
  		if ('routes' in $$props) $$invalidate(3, routes = $$props.routes);
  		if ('prefix' in $$props) $$invalidate(4, prefix = $$props.prefix);
  		if ('restoreScrollState' in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
  		if ('component' in $$props) $$invalidate(0, component = $$props.component);
  		if ('componentParams' in $$props) $$invalidate(1, componentParams = $$props.componentParams);
  		if ('props' in $$props) $$invalidate(2, props = $$props.props);
  		if ('previousScrollState' in $$props) previousScrollState = $$props.previousScrollState;
  		if ('popStateChanged' in $$props) popStateChanged = $$props.popStateChanged;
  		if ('lastLoc' in $$props) lastLoc = $$props.lastLoc;
  		if ('componentObj' in $$props) componentObj = $$props.componentObj;
  	};

  	if ($$props && "$$inject" in $$props) {
  		$$self.$inject_state($$props.$$inject);
  	}

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

  class Router extends SvelteComponentDev {
  	constructor(options) {
  		super(options);

  		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
  			routes: 3,
  			prefix: 4,
  			restoreScrollState: 5
  		});

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "Router",
  			options,
  			id: create_fragment$6.name
  		});
  	}

  	get routes() {
  		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set routes(value) {
  		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get prefix() {
  		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set prefix(value) {
  		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get restoreScrollState() {
  		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set restoreScrollState(value) {
  		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}
  }

  /* src\infrastructure\view\templates\index-screen\Card.svelte generated by Svelte v3.44.3 */

  const file$3 = "src\\infrastructure\\view\\templates\\index-screen\\Card.svelte";

  function create_fragment$5(ctx) {
  	let div1;
  	let div0;
  	let h2;
  	let t0;
  	let t1;
  	let p0;
  	let t2;
  	let t3;
  	let p1;
  	let t4;
  	let t5;
  	let button;
  	let ion_icon0;
  	let t6;
  	let ion_icon1;

  	const block = {
  		c: function create() {
  			div1 = element("div");
  			div0 = element("div");
  			h2 = element("h2");
  			t0 = text(/*title*/ ctx[0]);
  			t1 = space();
  			p0 = element("p");
  			t2 = text(/*subtitle*/ ctx[1]);
  			t3 = space();
  			p1 = element("p");
  			t4 = text(/*dates*/ ctx[2]);
  			t5 = space();
  			button = element("button");
  			ion_icon0 = element("ion-icon");
  			t6 = space();
  			ion_icon1 = element("ion-icon");
  			attr_dev(h2, "class", "title svelte-nu7w9k");
  			add_location(h2, file$3, 7, 4, 138);
  			attr_dev(p0, "class", "subtitle svelte-nu7w9k");
  			add_location(p0, file$3, 8, 4, 173);
  			attr_dev(p1, "class", "dates svelte-nu7w9k");
  			add_location(p1, file$3, 9, 4, 212);
  			attr_dev(div0, "class", "card-left svelte-nu7w9k");
  			add_location(div0, file$3, 6, 2, 110);
  			set_custom_element_data(ion_icon0, "name", "star-outline");
  			set_custom_element_data(ion_icon0, "class", "icon svelte-nu7w9k");
  			add_location(ion_icon0, file$3, 12, 4, 308);
  			set_custom_element_data(ion_icon1, "name", "star");
  			set_custom_element_data(ion_icon1, "class", "icon svelte-nu7w9k");
  			add_location(ion_icon1, file$3, 13, 4, 358);
  			attr_dev(button, "class", "fav-button button--unset clickable svelte-nu7w9k");
  			add_location(button, file$3, 11, 2, 252);
  			attr_dev(div1, "class", "card svelte-nu7w9k");
  			add_location(div1, file$3, 5, 0, 89);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, div1, anchor);
  			append_dev(div1, div0);
  			append_dev(div0, h2);
  			append_dev(h2, t0);
  			append_dev(div0, t1);
  			append_dev(div0, p0);
  			append_dev(p0, t2);
  			append_dev(div0, t3);
  			append_dev(div0, p1);
  			append_dev(p1, t4);
  			append_dev(div1, t5);
  			append_dev(div1, button);
  			append_dev(button, ion_icon0);
  			append_dev(button, t6);
  			append_dev(button, ion_icon1);
  		},
  		p: function update(ctx, [dirty]) {
  			if (dirty & /*title*/ 1) set_data_dev(t0, /*title*/ ctx[0]);
  			if (dirty & /*subtitle*/ 2) set_data_dev(t2, /*subtitle*/ ctx[1]);
  			if (dirty & /*dates*/ 4) set_data_dev(t4, /*dates*/ ctx[2]);
  		},
  		i: noop,
  		o: noop,
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(div1);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$5.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$5($$self, $$props, $$invalidate) {
  	let { $$slots: slots = {}, $$scope } = $$props;
  	validate_slots('Card', slots, []);
  	let { title } = $$props;
  	let { subtitle } = $$props;
  	let { dates } = $$props;
  	const writable_props = ['title', 'subtitle', 'dates'];

  	Object.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Card> was created with unknown prop '${key}'`);
  	});

  	$$self.$$set = $$props => {
  		if ('title' in $$props) $$invalidate(0, title = $$props.title);
  		if ('subtitle' in $$props) $$invalidate(1, subtitle = $$props.subtitle);
  		if ('dates' in $$props) $$invalidate(2, dates = $$props.dates);
  	};

  	$$self.$capture_state = () => ({ title, subtitle, dates });

  	$$self.$inject_state = $$props => {
  		if ('title' in $$props) $$invalidate(0, title = $$props.title);
  		if ('subtitle' in $$props) $$invalidate(1, subtitle = $$props.subtitle);
  		if ('dates' in $$props) $$invalidate(2, dates = $$props.dates);
  	};

  	if ($$props && "$$inject" in $$props) {
  		$$self.$inject_state($$props.$$inject);
  	}

  	return [title, subtitle, dates];
  }

  class Card extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$5, create_fragment$5, safe_not_equal, { title: 0, subtitle: 1, dates: 2 });

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "Card",
  			options,
  			id: create_fragment$5.name
  		});

  		const { ctx } = this.$$;
  		const props = options.props || {};

  		if (/*title*/ ctx[0] === undefined && !('title' in props)) {
  			console.warn("<Card> was created without expected prop 'title'");
  		}

  		if (/*subtitle*/ ctx[1] === undefined && !('subtitle' in props)) {
  			console.warn("<Card> was created without expected prop 'subtitle'");
  		}

  		if (/*dates*/ ctx[2] === undefined && !('dates' in props)) {
  			console.warn("<Card> was created without expected prop 'dates'");
  		}
  	}

  	get title() {
  		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set title(value) {
  		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get subtitle() {
  		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set subtitle(value) {
  		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get dates() {
  		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set dates(value) {
  		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
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

  var _Quality_value;
  class Quality extends ValueObject {
      constructor(value) {
          super();
          _Quality_value.set(this, void 0);
          __classPrivateFieldSet(this, _Quality_value, value, "f");
      }
      getName() {
          return this.type;
      }
      getValue() {
          return __classPrivateFieldGet(this, _Quality_value, "f");
      }
      isIdentical(v) {
          return __classPrivateFieldGet(this, _Quality_value, "f").is(v.getValue());
      }
  }
  _Quality_value = new WeakMap();

  class GramStain extends Quality {
      constructor(gramStainResult) {
          super(gramStainResult);
          this.type = 'Gram Stain';
      }
      toString() {
          return this.getValue().toString();
      }
  }

  /* src\infrastructure\view\templates\index-screen\IndexScreen.svelte generated by Svelte v3.44.3 */

  const { console: console_1 } = globals;
  const file$2 = "src\\infrastructure\\view\\templates\\index-screen\\IndexScreen.svelte";

  function get_each_context(ctx, list, i) {
  	const child_ctx = ctx.slice();
  	child_ctx[4] = list[i].state;
  	child_ctx[5] = list[i].institution;
  	child_ctx[6] = list[i].interval;
  	child_ctx[7] = list[i].details;
  	child_ctx[8] = list[i].gramStain;
  	child_ctx[9] = list[i].id;
  	return child_ctx;
  }

  // (84:2) {:else}
  function create_else_block(ctx) {
  	let ul;
  	let current;
  	let each_value = /*testVm*/ ctx[0];
  	validate_each_argument(each_value);
  	let each_blocks = [];

  	for (let i = 0; i < each_value.length; i += 1) {
  		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
  	}

  	const out = i => transition_out(each_blocks[i], 1, 1, () => {
  		each_blocks[i] = null;
  	});

  	const block = {
  		c: function create() {
  			ul = element("ul");

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].c();
  			}

  			attr_dev(ul, "class", "list svelte-12z7958");
  			add_location(ul, file$2, 84, 4, 2664);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, ul, anchor);

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].m(ul, null);
  			}

  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			if (dirty & /*testVm*/ 1) {
  				each_value = /*testVm*/ ctx[0];
  				validate_each_argument(each_value);
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
  		i: function intro(local) {
  			if (current) return;

  			for (let i = 0; i < each_value.length; i += 1) {
  				transition_in(each_blocks[i]);
  			}

  			current = true;
  		},
  		o: function outro(local) {
  			each_blocks = each_blocks.filter(Boolean);

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				transition_out(each_blocks[i]);
  			}

  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(ul);
  			destroy_each(each_blocks, detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_else_block.name,
  		type: "else",
  		source: "(84:2) {:else}",
  		ctx
  	});

  	return block;
  }

  // (82:2) {#if testVm === null}
  function create_if_block(ctx) {
  	let p;

  	const block = {
  		c: function create() {
  			p = element("p");
  			p.textContent = "Sorry no results yet...";
  			add_location(p, file$2, 82, 4, 2619);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, p, anchor);
  		},
  		p: noop,
  		i: noop,
  		o: noop,
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(p);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block.name,
  		type: "if",
  		source: "(82:2) {#if testVm === null}",
  		ctx
  	});

  	return block;
  }

  // (86:6) {#each testVm as { state, institution, interval, details, gramStain, id }}
  function create_each_block(ctx) {
  	let li;
  	let a;
  	let card;
  	let t;
  	let current;
  	let mounted;
  	let dispose;

  	card = new Card({
  			props: {
  				title: /*institution*/ ctx[5] + ', ' + /*state*/ ctx[4],
  				subtitle: /*details*/ ctx[7] + ', ' + /*gramStain*/ ctx[8],
  				dates: /*interval*/ ctx[6].toString()
  			},
  			$$inline: true
  		});

  	const block = {
  		c: function create() {
  			li = element("li");
  			a = element("a");
  			create_component(card.$$.fragment);
  			t = space();
  			attr_dev(a, "class", "card-nav svelte-12z7958");
  			attr_dev(a, "href", '/antibiogram/' + /*id*/ ctx[9]);
  			add_location(a, file$2, 87, 10, 2786);
  			add_location(li, file$2, 86, 8, 2771);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, li, anchor);
  			append_dev(li, a);
  			mount_component(card, a, null);
  			append_dev(li, t);
  			current = true;

  			if (!mounted) {
  				dispose = action_destroyer(link.call(null, a));
  				mounted = true;
  			}
  		},
  		p: noop,
  		i: function intro(local) {
  			if (current) return;
  			transition_in(card.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(card.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(li);
  			destroy_component(card);
  			mounted = false;
  			dispose();
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_each_block.name,
  		type: "each",
  		source: "(86:6) {#each testVm as { state, institution, interval, details, gramStain, id }}",
  		ctx
  	});

  	return block;
  }

  function create_fragment$4(ctx) {
  	let main;
  	let current_block_type_index;
  	let if_block;
  	let current;
  	const if_block_creators = [create_if_block, create_else_block];
  	const if_blocks = [];

  	function select_block_type(ctx, dirty) {
  		if (/*testVm*/ ctx[0] === null) return 0;
  		return 1;
  	}

  	current_block_type_index = select_block_type(ctx);
  	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

  	const block = {
  		c: function create() {
  			main = element("main");
  			if_block.c();
  			attr_dev(main, "class", "svelte-12z7958");
  			add_location(main, file$2, 80, 0, 2584);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, main, anchor);
  			if_blocks[current_block_type_index].m(main, null);
  			current = true;
  		},
  		p: function update(ctx, [dirty]) {
  			if_block.p(ctx, dirty);
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(if_block);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(if_block);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(main);
  			if_blocks[current_block_type_index].d();
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$4.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$4($$self, $$props, $$invalidate) {
  	let { $$slots: slots = {}, $$scope } = $$props;
  	validate_slots('IndexScreen', slots, []);

  	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
  		function adopt(value) {
  			return value instanceof P
  			? value
  			: new P(function (resolve) {
  						resolve(value);
  					});
  		}

  		return new (P || (P = Promise))(function (resolve, reject) {
  				function fulfilled(value) {
  					try {
  						step(generator.next(value));
  					} catch(e) {
  						reject(e);
  					}
  				}

  				function rejected(value) {
  					try {
  						step(generator["throw"](value));
  					} catch(e) {
  						reject(e);
  					}
  				}

  				function step(result) {
  					result.done
  					? resolve(result.value)
  					: adopt(result.value).then(fulfilled, rejected);
  				}

  				step((generator = generator.apply(thisArg, _arguments || [])).next());
  			});
  	};

  	const controller = getContext('antibiogramGroupController');
  	let vm = null;

  	let testVm = [
  		{
  			state: 'Binghamton, NY',
  			institution: 'Lourdes',
  			interval: 'June 2019-June 2020',
  			details: 'inpatient',
  			gramStain: 'positive',
  			id: 1
  		},
  		{
  			state: 'Binghamton, NY',
  			institution: 'Lourdes',
  			interval: 'June 2019-June 2020',
  			details: 'inpatient',
  			gramStain: 'negative',
  			id: 2
  		},
  		{
  			state: 'Binghamton, NY',
  			institution: 'Lourdes',
  			interval: 'June 2019-June 2020',
  			details: 'outpatient',
  			gramStain: 'positive',
  			id: 3
  		},
  		{
  			state: 'Binghamton, NY',
  			institution: 'Lourdes',
  			interval: 'June 2019-June 2020',
  			details: 'outpatient',
  			gramStain: 'negative',
  			id: 4
  		},
  		{
  			state: 'Binghamton, NY',
  			institution: 'UHS',
  			interval: 'January 2020-January 2021',
  			details: 'non-urine',
  			gramStain: 'negative',
  			id: 5
  		},
  		{
  			state: 'Binghamton, NY',
  			institution: 'UHS',
  			interval: 'January 2020-January 2021',
  			details: 'non-urine',
  			gramStain: 'positive',
  			id: 6
  		},
  		{
  			state: 'Binghamton, NY',
  			institution: 'UHS',
  			interval: 'January 2020-January 2021',
  			details: 'non-urine',
  			gramStain: 'unspecified',
  			id: 7
  		}
  	];

  	onMount(() => __awaiter(void 0, void 0, void 0, function* () {
  		vm = yield controller.index();
  		console.log(vm);
  		console.log(testVm);
  	}));

  	const writable_props = [];

  	Object.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<IndexScreen> was created with unknown prop '${key}'`);
  	});

  	$$self.$capture_state = () => ({
  		__awaiter,
  		getContext,
  		onMount,
  		link,
  		Card,
  		GramStain,
  		controller,
  		vm,
  		testVm
  	});

  	$$self.$inject_state = $$props => {
  		if ('__awaiter' in $$props) __awaiter = $$props.__awaiter;
  		if ('vm' in $$props) vm = $$props.vm;
  		if ('testVm' in $$props) $$invalidate(0, testVm = $$props.testVm);
  	};

  	if ($$props && "$$inject" in $$props) {
  		$$self.$inject_state($$props.$$inject);
  	}

  	return [testVm];
  }

  class IndexScreen extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "IndexScreen",
  			options,
  			id: create_fragment$4.name
  		});
  	}
  }

  const routes = {
    // Exact path
    '/': IndexScreen,

    // Using named parameters, with last being optional
    '/antibiogram/:id': TableViewScreen,

    // Catch-all
    // This is optional, but if present it must be the last
    // '*': NotFound,
  };

  /* src\infrastructure\view\templates\navigation\Navigation.svelte generated by Svelte v3.44.3 */

  const file$1 = "src\\infrastructure\\view\\templates\\navigation\\Navigation.svelte";

  function create_fragment$3(ctx) {
  	let nav;
  	let h1;
  	let t1;
  	let button;
  	let ion_icon;
  	let t2;
  	let ul;
  	let li0;
  	let t4;
  	let li1;
  	let mounted;
  	let dispose;

  	const block = {
  		c: function create() {
  			nav = element("nav");
  			h1 = element("h1");
  			h1.textContent = "Bugs 'n Drugs";
  			t1 = space();
  			button = element("button");
  			ion_icon = element("ion-icon");
  			t2 = space();
  			ul = element("ul");
  			li0 = element("li");
  			li0.textContent = "About";
  			t4 = space();
  			li1 = element("li");
  			li1.textContent = "Disclaimer";
  			attr_dev(h1, "class", "title svelte-h5uj4p");
  			add_location(h1, file$1, 5, 2, 79);
  			set_custom_element_data(ion_icon, "name", "ellipsis-vertical");
  			add_location(ion_icon, file$1, 10, 4, 216);
  			attr_dev(button, "class", "nav-menu-toggle svelte-h5uj4p");
  			add_location(button, file$1, 6, 2, 118);
  			attr_dev(li0, "class", "nav-link svelte-h5uj4p");
  			add_location(li0, file$1, 13, 4, 343);
  			attr_dev(li1, "class", "nav-link svelte-h5uj4p");
  			add_location(li1, file$1, 14, 4, 379);
  			attr_dev(ul, "class", "nav-link-list svelte-h5uj4p");
  			toggle_class(ul, "nav-link-list--hidden", /*navMenuHidden*/ ctx[0]);
  			add_location(ul, file$1, 12, 2, 268);
  			attr_dev(nav, "class", "svelte-h5uj4p");
  			add_location(nav, file$1, 4, 0, 71);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, nav, anchor);
  			append_dev(nav, h1);
  			append_dev(nav, t1);
  			append_dev(nav, button);
  			append_dev(button, ion_icon);
  			append_dev(nav, t2);
  			append_dev(nav, ul);
  			append_dev(ul, li0);
  			append_dev(ul, t4);
  			append_dev(ul, li1);

  			if (!mounted) {
  				dispose = listen_dev(button, "click", /*click_handler*/ ctx[1], false, false, false);
  				mounted = true;
  			}
  		},
  		p: function update(ctx, [dirty]) {
  			if (dirty & /*navMenuHidden*/ 1) {
  				toggle_class(ul, "nav-link-list--hidden", /*navMenuHidden*/ ctx[0]);
  			}
  		},
  		i: noop,
  		o: noop,
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(nav);
  			mounted = false;
  			dispose();
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$3.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$3($$self, $$props, $$invalidate) {
  	let { $$slots: slots = {}, $$scope } = $$props;
  	validate_slots('Navigation', slots, []);
  	let navMenuHidden = true;
  	const writable_props = [];

  	Object.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Navigation> was created with unknown prop '${key}'`);
  	});

  	const click_handler = () => $$invalidate(0, navMenuHidden = !navMenuHidden);
  	$$self.$capture_state = () => ({ navMenuHidden });

  	$$self.$inject_state = $$props => {
  		if ('navMenuHidden' in $$props) $$invalidate(0, navMenuHidden = $$props.navMenuHidden);
  	};

  	if ($$props && "$$inject" in $$props) {
  		$$self.$inject_state($$props.$$inject);
  	}

  	return [navMenuHidden, click_handler];
  }

  class Navigation extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "Navigation",
  			options,
  			id: create_fragment$3.name
  		});
  	}
  }

  /* src\infrastructure\view\templates\navigation\BackNavigation.svelte generated by Svelte v3.44.3 */
  const file = "src\\infrastructure\\view\\templates\\navigation\\BackNavigation.svelte";

  function create_fragment$2(ctx) {
  	let nav;
  	let a;
  	let ion_icon0;
  	let t0;
  	let h1;
  	let t2;
  	let button;
  	let ion_icon1;
  	let t3;
  	let ul;
  	let li0;
  	let t5;
  	let li1;
  	let mounted;
  	let dispose;

  	const block = {
  		c: function create() {
  			nav = element("nav");
  			a = element("a");
  			ion_icon0 = element("ion-icon");
  			t0 = space();
  			h1 = element("h1");
  			h1.textContent = "Bugs 'n Drugs";
  			t2 = space();
  			button = element("button");
  			ion_icon1 = element("ion-icon");
  			t3 = space();
  			ul = element("ul");
  			li0 = element("li");
  			li0.textContent = "About";
  			t5 = space();
  			li1 = element("li");
  			li1.textContent = "Disclaimer";
  			set_custom_element_data(ion_icon0, "name", "arrow-back-outline");
  			add_location(ion_icon0, file, 6, 4, 146);
  			attr_dev(a, "class", "back svelte-owfs5m");
  			attr_dev(a, "href", "/");
  			add_location(a, file, 5, 2, 107);
  			attr_dev(h1, "class", "title svelte-owfs5m");
  			add_location(h1, file, 8, 2, 194);
  			set_custom_element_data(ion_icon1, "name", "ellipsis-vertical");
  			add_location(ion_icon1, file, 13, 4, 331);
  			attr_dev(button, "class", "nav-menu-toggle svelte-owfs5m");
  			add_location(button, file, 9, 2, 233);
  			attr_dev(li0, "class", "nav-link svelte-owfs5m");
  			add_location(li0, file, 16, 4, 458);
  			attr_dev(li1, "class", "nav-link svelte-owfs5m");
  			add_location(li1, file, 17, 4, 494);
  			attr_dev(ul, "class", "nav-link-list svelte-owfs5m");
  			toggle_class(ul, "nav-link-list--hidden", /*navMenuHidden*/ ctx[0]);
  			add_location(ul, file, 15, 2, 383);
  			attr_dev(nav, "class", "svelte-owfs5m");
  			add_location(nav, file, 4, 0, 99);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, nav, anchor);
  			append_dev(nav, a);
  			append_dev(a, ion_icon0);
  			append_dev(nav, t0);
  			append_dev(nav, h1);
  			append_dev(nav, t2);
  			append_dev(nav, button);
  			append_dev(button, ion_icon1);
  			append_dev(nav, t3);
  			append_dev(nav, ul);
  			append_dev(ul, li0);
  			append_dev(ul, t5);
  			append_dev(ul, li1);

  			if (!mounted) {
  				dispose = [
  					action_destroyer(link.call(null, a)),
  					listen_dev(button, "click", /*click_handler*/ ctx[1], false, false, false)
  				];

  				mounted = true;
  			}
  		},
  		p: function update(ctx, [dirty]) {
  			if (dirty & /*navMenuHidden*/ 1) {
  				toggle_class(ul, "nav-link-list--hidden", /*navMenuHidden*/ ctx[0]);
  			}
  		},
  		i: noop,
  		o: noop,
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(nav);
  			mounted = false;
  			run_all(dispose);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$2.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$2($$self, $$props, $$invalidate) {
  	let { $$slots: slots = {}, $$scope } = $$props;
  	validate_slots('BackNavigation', slots, []);
  	let navMenuHidden = true;
  	const writable_props = [];

  	Object.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<BackNavigation> was created with unknown prop '${key}'`);
  	});

  	const click_handler = () => $$invalidate(0, navMenuHidden = !navMenuHidden);
  	$$self.$capture_state = () => ({ link, navMenuHidden });

  	$$self.$inject_state = $$props => {
  		if ('navMenuHidden' in $$props) $$invalidate(0, navMenuHidden = $$props.navMenuHidden);
  	};

  	if ($$props && "$$inject" in $$props) {
  		$$self.$inject_state($$props.$$inject);
  	}

  	return [navMenuHidden, click_handler];
  }

  class BackNavigation extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "BackNavigation",
  			options,
  			id: create_fragment$2.name
  		});
  	}
  }

  /* src\infrastructure\view\templates\navigation\index.svelte generated by Svelte v3.44.3 */

  function create_fragment$1(ctx) {
  	let router;
  	let current;

  	router = new Router({
  			props: { routes: /*routes*/ ctx[0] },
  			$$inline: true
  		});

  	const block = {
  		c: function create() {
  			create_component(router.$$.fragment);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			mount_component(router, target, anchor);
  			current = true;
  		},
  		p: noop,
  		i: function intro(local) {
  			if (current) return;
  			transition_in(router.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(router.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			destroy_component(router, detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$1.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$1($$self, $$props, $$invalidate) {
  	let { $$slots: slots = {}, $$scope } = $$props;
  	validate_slots('Navigation', slots, []);
  	const routes = { '/': Navigation, '*': BackNavigation };
  	const writable_props = [];

  	Object.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Navigation> was created with unknown prop '${key}'`);
  	});

  	$$self.$capture_state = () => ({
  		Router,
  		Navigation,
  		BackNavigation,
  		routes
  	});

  	return [routes];
  }

  class Navigation_1 extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "Navigation_1",
  			options,
  			id: create_fragment$1.name
  		});
  	}
  }

  /* src\infrastructure\view\templates\App.svelte generated by Svelte v3.44.3 */

  function create_fragment(ctx) {
  	let navigation;
  	let t;
  	let router;
  	let current;
  	navigation = new Navigation_1({ $$inline: true });
  	router = new Router({ props: { routes }, $$inline: true });

  	const block = {
  		c: function create() {
  			create_component(navigation.$$.fragment);
  			t = space();
  			create_component(router.$$.fragment);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			mount_component(navigation, target, anchor);
  			insert_dev(target, t, anchor);
  			mount_component(router, target, anchor);
  			current = true;
  		},
  		p: noop,
  		i: function intro(local) {
  			if (current) return;
  			transition_in(navigation.$$.fragment, local);
  			transition_in(router.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(navigation.$$.fragment, local);
  			transition_out(router.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			destroy_component(navigation, detaching);
  			if (detaching) detach_dev(t);
  			destroy_component(router, detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance($$self, $$props, $$invalidate) {
  	let { $$slots: slots = {}, $$scope } = $$props;
  	validate_slots('App', slots, []);
  	const writable_props = [];

  	Object.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
  	});

  	$$self.$capture_state = () => ({ routes, Router, Navigation: Navigation_1 });
  	return [];
  }

  class App extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance, create_fragment, safe_not_equal, {});

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "App",
  			options,
  			id: create_fragment.name
  		});
  	}
  }

  const svelte = (tableController, antibiogramGroupController) => {
      return new App({
          target: document.body,
          context: new Map([
              ['tableController', tableController],
              ['antibiogramGroupController', antibiogramGroupController],
          ]),
      });
  };

  class TableController {
      constructor(showAntibiogramAction) {
          this.showAbg = showAntibiogramAction;
      }
      showTable(id) {
          return __awaiter(this, void 0, void 0, function* () {
              return yield this.showAbg.execute(id);
          });
      }
  }

  var _AntibiogramGroupController_action, _AntibiogramGroupController_presenter;
  class AntibiogramGroupController {
      constructor(indexAntibiogramGroupsAction, webAntibiogramGroupsPresenter) {
          _AntibiogramGroupController_action.set(this, void 0);
          _AntibiogramGroupController_presenter.set(this, void 0);
          __classPrivateFieldSet(this, _AntibiogramGroupController_action, indexAntibiogramGroupsAction, "f");
          __classPrivateFieldSet(this, _AntibiogramGroupController_presenter, webAntibiogramGroupsPresenter, "f");
      }
      index() {
          return __awaiter(this, void 0, void 0, function* () {
              yield __classPrivateFieldGet(this, _AntibiogramGroupController_action, "f").present(__classPrivateFieldGet(this, _AntibiogramGroupController_presenter, "f"));
              return __classPrivateFieldGet(this, _AntibiogramGroupController_presenter, "f").buildViewModel();
          });
      }
  }
  _AntibiogramGroupController_action = new WeakMap(), _AntibiogramGroupController_presenter = new WeakMap();

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
          return 'Unspecified';
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
          return Array.from(__classPrivateFieldGet(this, _SampleInfo_itemsByType, "f").values())
              .map((x) => x.toString())
              .join('\n');
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

  const Sources = {
      get URINE() {
          return new Source(new Urine());
      },
      get NONURINE() {
          return new Source(new NonUrine());
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
          return (__classPrivateFieldGet(this, _Interval_instances, "m", _Interval_dateToString).call(this, __classPrivateFieldGet(this, _Interval_publishedAt, "f")) +
              ' \u2212 ' +
              __classPrivateFieldGet(this, _Interval_instances, "m", _Interval_dateToString).call(this, __classPrivateFieldGet(this, _Interval_expiresAt, "f")));
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

  class Antibiogram extends Entity {
      constructor(id, data, params) {
          var _a, _b, _c, _d;
          super(id);
          this.sensitivities = data;
          this.antibiotics = ValueObject.filterUniqueValues(data.map((d) => d.getAntibiotic()));
          this.organisms = ValueObject.filterUniqueValues(data.map((d) => d.getOrganism()));
          this.info = (_a = params === null || params === void 0 ? void 0 : params.info) !== null && _a !== void 0 ? _a : new SampleInfo([]);
          this.gram = (_b = params === null || params === void 0 ? void 0 : params.gram) !== null && _b !== void 0 ? _b : GramValues.UNSPECIFIED;
          this.place = (_c = params === null || params === void 0 ? void 0 : params.place) !== null && _c !== void 0 ? _c : new UnknownPlace();
          this.interval = (_d = params === null || params === void 0 ? void 0 : params.interval) !== null && _d !== void 0 ? _d : new DefaultInterval();
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

  var _CsvAntibiogramRepository_instances, _CsvAntibiogramRepository_fs, _CsvAntibiogramRepository_atlas, _CsvAntibiogramRepository_loadAtlas, _CsvAntibiogramRepository_getByMeta;
  class CsvAntibiogramRepository {
      constructor(filesystem) {
          _CsvAntibiogramRepository_instances.add(this);
          _CsvAntibiogramRepository_fs.set(this, void 0);
          _CsvAntibiogramRepository_atlas.set(this, null);
          __classPrivateFieldSet(this, _CsvAntibiogramRepository_fs, filesystem, "f");
      }
      getById(id$1) {
          return __awaiter(this, void 0, void 0, function* () {
              if (!__classPrivateFieldGet(this, _CsvAntibiogramRepository_atlas, "f"))
                  __classPrivateFieldSet(this, _CsvAntibiogramRepository_atlas, yield __classPrivateFieldGet(this, _CsvAntibiogramRepository_instances, "m", _CsvAntibiogramRepository_loadAtlas).call(this), "f");
              const meta = __classPrivateFieldGet(this, _CsvAntibiogramRepository_atlas, "f").find((row) => {
                  const abgId = id(row['antibiogram_id']);
                  return id$1.is(abgId);
              });
              if (!meta)
                  throw new Error('Unable to find antibiogram with id of ' + id$1.getValue());
              return __classPrivateFieldGet(this, _CsvAntibiogramRepository_instances, "m", _CsvAntibiogramRepository_getByMeta).call(this, meta);
          });
      }
      getAll() {
          return __awaiter(this, void 0, void 0, function* () {
              if (!__classPrivateFieldGet(this, _CsvAntibiogramRepository_atlas, "f"))
                  __classPrivateFieldSet(this, _CsvAntibiogramRepository_atlas, yield __classPrivateFieldGet(this, _CsvAntibiogramRepository_instances, "m", _CsvAntibiogramRepository_loadAtlas).call(this), "f");
              return Promise.all(__classPrivateFieldGet(this, _CsvAntibiogramRepository_atlas, "f").map((meta) => __classPrivateFieldGet(this, _CsvAntibiogramRepository_instances, "m", _CsvAntibiogramRepository_getByMeta).call(this, meta)));
          });
      }
  }
  _CsvAntibiogramRepository_fs = new WeakMap(), _CsvAntibiogramRepository_atlas = new WeakMap(), _CsvAntibiogramRepository_instances = new WeakSet(), _CsvAntibiogramRepository_loadAtlas = function _CsvAntibiogramRepository_loadAtlas() {
      return __awaiter(this, void 0, void 0, function* () {
          const csv = yield __classPrivateFieldGet(this, _CsvAntibiogramRepository_fs, "f").getDataFile('atlas.csv').getContents();
          return yield new AtlasCsv(csv).parse();
      });
  }, _CsvAntibiogramRepository_getByMeta = function _CsvAntibiogramRepository_getByMeta(meta) {
      return __awaiter(this, void 0, void 0, function* () {
          const csv = yield __classPrivateFieldGet(this, _CsvAntibiogramRepository_fs, "f").getDataFile(meta['csv']).getContents();
          const data = new DataCsv(csv).parse().map((r) => new SensitivityData({
              organism: org(r['organism_name']),
              antibiotic: abx(r['antibiotic_name'], r['antibiotic_route'] ? route(r['antibiotic_route']) : undefined),
              value: value(r['value']),
              isolates: r['isolates'] ? iso(r['isolates']) : undefined,
              sampleInfo: r['sample_info'] ? info(r['sample_info']) : undefined,
          }));
          const id$1 = id(meta['antibiogram_id']);
          return new Antibiogram(id$1, data, {
              info: meta['sample_info'] ? info(meta['sample_info']) : undefined,
              gram: meta['gram'] ? gram(meta['gram']) : undefined,
              place: meta['region'] && meta['institution']
                  ? place(meta['region'], meta['institution'])
                  : undefined,
              interval: meta['year_month_start'] && meta['year_month_end']
                  ? interval(meta['year_month_start'], meta['year_month_end'])
                  : undefined,
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
          return __classPrivateFieldGet(this, _Tooltip_tooltip, "f").is(t);
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

  var _FilledLabelBehavior_title, _FilledLabelBehavior_tooltip, _FilledLabelBehavior_alert;
  class FilledLabelBehavior extends BaseLabelBehavior {
      constructor(title, params) {
          super();
          _FilledLabelBehavior_title.set(this, void 0);
          _FilledLabelBehavior_tooltip.set(this, void 0);
          _FilledLabelBehavior_alert.set(this, void 0);
          __classPrivateFieldSet(this, _FilledLabelBehavior_title, title, "f");
          __classPrivateFieldSet(this, _FilledLabelBehavior_alert, params === null || params === void 0 ? void 0 : params.alert, "f");
          __classPrivateFieldSet(this, _FilledLabelBehavior_tooltip, params === null || params === void 0 ? void 0 : params.tooltip, "f");
      }
      makeCell() {
          return new FilledCell(__classPrivateFieldGet(this, _FilledLabelBehavior_title, "f"), {
              tooltip: __classPrivateFieldGet(this, _FilledLabelBehavior_tooltip, "f"),
              alert: __classPrivateFieldGet(this, _FilledLabelBehavior_alert, "f"),
          });
      }
  }
  _FilledLabelBehavior_title = new WeakMap(), _FilledLabelBehavior_tooltip = new WeakMap(), _FilledLabelBehavior_alert = new WeakMap();

  class EmptyLabelBehavior extends BaseLabelBehavior {
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
  }
  _RowCollapsible_table = new WeakMap(), _RowCollapsible_collapse = new WeakMap();

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
      return new TableFacade(table);
  }

  class TableElementFactory {
      makeCell(c) {
          const data = c.data;
          const value = data.map((d) => d.getValue() + '').join('\n');
          return new FilledCell(value);
      }
      makeLabel(text, tooltipText) {
          const params = {};
          if (tooltipText)
              params.tooltip = new Tooltip(tooltipText);
          return new Label(text, params);
      }
      makeRowLabel(r) {
          const tooltips = r.info
              .itemsToArray()
              .map((si) => new Tooltip(si.toString()));
          const tooltip = new Tooltip(tooltips);
          const labelText = `${r.organism.getName()} (${r.isolates})`;
          return this.makeLabel(labelText, tooltip.toString());
      }
      makeColumnLabel(c) {
          const route = c.antibiotic
              .getAntibiotics()
              .map((abx) => abx.getRoute().toString())
              .join(', ');
          const si = c.info.itemsToArray();
          const tooltip = new Tooltip([...si, route].map((si) => new Tooltip(si.toString())));
          return this.makeLabel(c.antibiotic.getName(), tooltip.toString());
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
      const factory = new TableElementFactory();
      const [rows, columns] = assembleRowsAndColumns(abg);
      const nRow = rows.length;
      const nCol = columns.length;
      const rowLabels = rows.map((r) => factory.makeRowLabel(r));
      const columnLabels = columns.map((c) => factory.makeColumnLabel(c));
      const matrix = fillMatrix((c) => factory.makeCell(c), rows, columns, factory.makeEmptyMatrix(nRow, nCol));
      return makeTable(matrix, {
          labels: { rows: rowLabels, columns: columnLabels },
      });
  }

  class ShowAntibiogramAction {
      constructor(antibiogramRepository) {
          this.antibiogramRepository = antibiogramRepository;
      }
      execute(id) {
          return __awaiter(this, void 0, void 0, function* () {
              const abg = (yield this.antibiogramRepository.getAll())[id];
              const table = makeAntibiogramTable(abg);
              return table;
          });
      }
  }

  var _IndexAntibiogramGroupsAction_instances, _IndexAntibiogramGroupsAction_repo, _IndexAntibiogramGroupsAction_findUniquePlaceAndInterval;
  class IndexAntibiogramGroupsAction {
      constructor(antibiogramRepository) {
          _IndexAntibiogramGroupsAction_instances.add(this);
          _IndexAntibiogramGroupsAction_repo.set(this, void 0);
          __classPrivateFieldSet(this, _IndexAntibiogramGroupsAction_repo, antibiogramRepository, "f");
      }
      execute() {
          return __awaiter(this, void 0, void 0, function* () {
              const abgs = yield __classPrivateFieldGet(this, _IndexAntibiogramGroupsAction_repo, "f").getAll();
              const placesAndIntervals = abgs.map((v) => [
                  v.place,
                  v.interval,
              ]);
              return __classPrivateFieldGet(this, _IndexAntibiogramGroupsAction_instances, "m", _IndexAntibiogramGroupsAction_findUniquePlaceAndInterval).call(this, placesAndIntervals).map(([place, interval]) => ({ place, interval }));
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
  _IndexAntibiogramGroupsAction_repo = new WeakMap(), _IndexAntibiogramGroupsAction_instances = new WeakSet(), _IndexAntibiogramGroupsAction_findUniquePlaceAndInterval = function _IndexAntibiogramGroupsAction_findUniquePlaceAndInterval(arr) {
      const seenPlaces = [];
      const seenIntervals = new Map();
      const result = [];
      for (const [p, i] of arr) {
          const seenPlace = seenPlaces.find((v) => p.is(v));
          if (!seenPlace) {
              seenPlaces.push(p);
              seenIntervals.set(p, [i]);
              result.push([p, i]);
          }
          else {
              const intervals = seenIntervals.get(seenPlace);
              const hasSameInterval = intervals === null || intervals === void 0 ? void 0 : intervals.find((v) => i.is(v));
              if (hasSameInterval)
                  continue;
              intervals === null || intervals === void 0 ? void 0 : intervals.push(i);
              result.push([p, i]);
          }
      }
      return result;
  };

  var _WebAntibiogramGroupPresenter_data;
  class WebAntibiogramGroupPresenter {
      constructor() {
          _WebAntibiogramGroupPresenter_data.set(this, null);
      }
      setData(data) {
          __classPrivateFieldSet(this, _WebAntibiogramGroupPresenter_data, data, "f");
      }
      buildViewModel() {
          if (__classPrivateFieldGet(this, _WebAntibiogramGroupPresenter_data, "f") === null)
              return null;
          return __classPrivateFieldGet(this, _WebAntibiogramGroupPresenter_data, "f").map((g) => ({
              institution: g.place.getInstitution(),
              state: g.place.getState(),
              interval: g.interval.toString(),
          }));
      }
  }
  _WebAntibiogramGroupPresenter_data = new WeakMap();

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

  const dependencies = new Module();
  dependencies.type('showAntibiogramAction', ShowAntibiogramAction);
  dependencies.type('indexAntibiogramGroupsAction', IndexAntibiogramGroupsAction);
  dependencies.type('antibiogramRepository', CsvAntibiogramRepository);
  dependencies.type('filesystem', WebFileSystem);
  dependencies.type('tableController', TableController);
  dependencies.type('antibiogramGroupController', AntibiogramGroupController);
  dependencies.type('webAntibiogramGroupsPresenter', WebAntibiogramGroupPresenter);
  dependencies.value('fetch', fetch.bind(window));
  dependencies.factory('svelte', svelte);

  const container = new Injector([dependencies]);

  var main = container.get('svelte');

  return main;

})();
//# sourceMappingURL=bundle.js.map
