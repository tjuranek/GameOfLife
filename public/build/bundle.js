
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
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

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
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
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
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
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
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
        flushing = false;
        seen_callbacks.clear();
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
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
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
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
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
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
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
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
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
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.23.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
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
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    // there aren't any parent/child relationships between my components so i'm using a writable store to do so

    // the current iteration number
    const iterationCount = writable(0);

    // the time in milliseconds between each iteration in the game loop
    const iterationInterval = writable(0);

    // the matrix that's help by the gameboard. i can't figure out how to have the gameboard object be in store and still call it's functions, like randomlyPopulate
    const matrix = writable([]);

    /* src/components/Canvas.svelte generated by Svelte v3.23.0 */
    const file = "src/components/Canvas.svelte";

    function create_fragment(ctx) {
    	let main;
    	let div;
    	let canvas_1;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			canvas_1 = element("canvas");
    			attr_dev(canvas_1, "width", "990");
    			attr_dev(canvas_1, "height", "540");
    			add_location(canvas_1, file, 37, 8, 1110);
    			attr_dev(div, "class", "container svelte-ro5i9u");
    			add_location(div, file, 36, 4, 1078);
    			add_location(main, file, 35, 0, 1067);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div);
    			append_dev(div, canvas_1);
    			/*canvas_1_binding*/ ctx[3](canvas_1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			/*canvas_1_binding*/ ctx[3](null);
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
    	let canvas;
    	let context;

    	// this takes the matrix and spits it onto the canvas. cells are red if they're alive. #gobigred
    	const drawGridOnCanvas = matrix => {
    		context.fillStyle = "black";
    		context.fillRect(0, 0, 330, 180);
    		context.fillStyle = "red";

    		for (let x = 0; x < 330; x++) {
    			for (let y = 0; y < 180; y++) {
    				if (matrix[x][y].livesRemaining > 0) {
    					context.fillRect(x, y, 1, 1);
    				}
    			}
    		}
    	};

    	// the canvas binding is undefined until the component mounts. 
    	onMount(() => {
    		context = canvas.getContext("2d");
    		context.scale(3, 3);

    		// this subscribes to the matrix in store and runs drawOnCanvas every time it has a new value. gotta subscribe after the canvas context is defined though.
    		matrix.subscribe(updatedMatrix => {
    			drawGridOnCanvas(updatedMatrix);
    		});
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Canvas> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Canvas", $$slots, []);

    	function canvas_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(0, canvas = $$value);
    		});
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		matrix,
    		canvas,
    		context,
    		drawGridOnCanvas
    	});

    	$$self.$inject_state = $$props => {
    		if ("canvas" in $$props) $$invalidate(0, canvas = $$props.canvas);
    		if ("context" in $$props) context = $$props.context;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [canvas, context, drawGridOnCanvas, canvas_1_binding];
    }

    class Canvas extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Canvas",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    // the node is a cell in the grid. i should've named it cell but I thought it was really funny to have a file named node.js. 
    // the cool thing here is they have a lives remaining. so not only did the rules change from conways game of life with neighbors, but each cells can be better than each other
    function Node (livesRemaining, x, y) {
        this.x = x;
    	this.y = y;
    	this.livesRemaining = livesRemaining;

        // never allow more than five health/lives to a single node
    	this.incrementLivesRemaining = (count) => {
    		for (let i = 0; i < count; i++) {
    			if (this.livesRemaining < 5) this.livesRemaining++;
    		} 
    	};

        // never let the health go below zero
    	this.decrementLivesRemaining = (count) => {
    		for (let i = 0; i < count; i++) {
    			if (this.livesRemaining > 0) this.livesRemaining--;
    		}
        };
        
        // take in a matrix and determine the next state of the node given how many alive neighbors it has. most people realize that the gameboard should handle this.
        // most people realize this before the last day of the deadline.
        this.getNextState = (matrix, height, width) => {
            // there are eight potential neighbors and these are their positions relative to the node
    		const relativeNeighborPositions = [[-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1]];

    		let liveNeighborCount = 0;

            // get how many neightbors are live nodes
    		relativeNeighborPositions.forEach(direction => {
    			const x = this.x + direction[0];
    			const y = this.y + direction[1];

    			if (x >= 0 && y >= 0 && x < width && y < height) {
    				if (matrix[x][y].livesRemaining > 0) liveNeighborCount++;
    			}
    		});

            // cases for incrementing or decrementing lives from a node depending on if it's currently living and how many live neighbors there are
    		if (this.livesRemaining > 0) {
    			switch (liveNeighborCount) {
    				case 0: case 1:
    					this.decrementLivesRemaining(2);
    					break;
    				case 2: case 3: case 4:
    					break;
    				case 5: case 6: case 7:
    					this.decrementLivesRemaining(3);
    					break;
    				case 7:
    					this.incrementLivesRemaining(1);
    					break;
    				case 8:
    					this.decrementLivesRemaining(5);
    					break;
    			}
    		}
    		else {
    			switch (liveNeighborCount) {
    				case 0: case 1: case 2: 
    					break;
    				case 3: case 4:
    					this.incrementLivesRemaining(2);
    					break;
    				case 5: case 6:
    					this.incrementLivesRemaining(1);
    					break;
    			}
    		}

            // we need to return the whole node after we get the next state cause I wrote this poorly
    		return this;
    	};
    }

    // the gameboard holds all the nodes, can iterate to a new state, populate itself, tell if it's empty. it's half the game logic. it should be almost all the game logic but I
    // made a dumb decision to get new node state in the node instead of in here and I don't have time to fix it.
    function Gameboard(height, width) {
        this.height = height;
        this.width = width;
    	this.matrix = [];

        // it took me like two days to realize canvases can't register clicks. oof. instead of my original idea to let the users set configurations, it's random. 
    	this.randomlyPopulate = () => {
    		for (let x = 0; x < width; x++) {
    			this.matrix[x] = [];
    	
    			for (let y = 0; y < height; y++) {
    				this.matrix[x][y] = new Node(Math.floor(Math.random() * Math.floor(4)), x, y,);
    			}
            }
    	};

        // TODO: after each iteration this should make sure the game isn't over, like if the grid doesn't have any live cells
    	this.checkHasLivesCells = () => {
    		const hasLiveCells = false;

    		for (let x = 0; x < width; x++) {
    			for (let y = 0; y < height; y++) {
    				if (this.matrix[x][y].livesRemaining > 0) {
    					hasLiveCell = true;
    					return hasLiveCells;
    				}
    			}
    		}

    		return hasLiveCells;
        };

        // an iteration is going over all the nodes for the current state and getting a new state for that node. after this is done we have to save the matrix in the svelte store. 
    	this.iterate = () => {
    		const nextState = [...this.matrix];

    		for (let x = 0; x < this.width; x++) {
    			for (let y = 0; y < this.height; y++) {
    				nextState[x][y] = this.matrix[x][y].getNextState(this.matrix, this.height, this.width);
    			}
    		}
    		
            this.matrix = [...nextState];
        };
    }

    /* src/components/Controls.svelte generated by Svelte v3.23.0 */
    const file$1 = "src/components/Controls.svelte";

    function create_fragment$1(ctx) {
    	let main_1;
    	let div;
    	let button0;
    	let t1;
    	let button1;
    	let t3;
    	let button2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main_1 = element("main");
    			div = element("div");
    			button0 = element("button");
    			button0.textContent = "slower";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "pause/play";
    			t3 = space();
    			button2 = element("button");
    			button2.textContent = "faster";
    			add_location(button0, file$1, 87, 8, 2734);
    			add_location(button1, file$1, 88, 8, 2792);
    			add_location(button2, file$1, 89, 8, 2855);
    			attr_dev(div, "class", "container svelte-lz29yw");
    			add_location(div, file$1, 86, 4, 2702);
    			add_location(main_1, file$1, 85, 0, 2691);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main_1, anchor);
    			append_dev(main_1, div);
    			append_dev(div, button0);
    			append_dev(div, t1);
    			append_dev(div, button1);
    			append_dev(div, t3);
    			append_dev(div, button2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", handleSlowDown, false, false, false),
    					listen_dev(button1, "click", handlePausePlay, false, false, false),
    					listen_dev(button2, "click", handleSpeedUp, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main_1);
    			mounted = false;
    			run_all(dispose);
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

    const gameboard = new Gameboard(180, 330);
    gameboard.randomlyPopulate();

    // set the initial gameboard matrix in store
    matrix.set([...gameboard.matrix]);

    // since we can pause/play, add a isRunning value that will get checked every render
    let isRunning = false;

    // set a default main loop interval
    let mainInterval = 500;

    // we show the interval in stats, so set it in state
    iterationInterval.set(500);

    // add a couple counters for determining if it's time to render a new iteration or not
    let lastFrameTime = 0;

    let lastRenderTime = 0;

    // animation frame id, this is how we start or stop rendering
    let requestId;

    // the main game loop, it's always called by requestAnimationFrame which gives a timestamp which lets me have intervals.
    const main = time => {
    	// big undefined boy for success in start/stop
    	requestId = undefined;

    	const timeSinceLastRender = time - lastRenderTime;

    	// if time since last render is past our interval render it up
    	if (timeSinceLastRender > mainInterval) {
    		lastRenderTime = time;
    		iterationCount.update(currentValue => currentValue + 1);
    		gameboard.iterate();

    		// after every interval update the store matrix, this will automatically draw in the canvas component because subscriptions. svelte is cool.
    		matrix.set([...gameboard.matrix]);
    	}

    	// if we are running, keep going, else stop
    	isRunning ? start() : stop();
    };

    // starts the loop up
    const start = () => {
    	if (!requestId) {
    		requestId = requestAnimationFrame(main);
    	}
    };

    // stops the loop
    const stop = () => {
    	if (requestId) {
    		cancelAnimationFrame(requestId);
    		requestId = undefined;
    	}
    };

    // toggle isRunning and go through game loop one time
    const handlePausePlay = () => {
    	isRunning = !isRunning;
    	start();
    };

    // slows speed by increasing the interval, but never let the user be slower than 1 second
    const handleSlowDown = () => {
    	if (mainInterval < 1000) mainInterval = mainInterval + 100;
    	iterationInterval.set(mainInterval);
    };

    // increase speed by decreasing interval, never going below a 0ms interval.
    const handleSpeedUp = () => {
    	if (mainInterval > 0) mainInterval = mainInterval - 100;
    	iterationInterval.set(mainInterval);
    };

    function instance$1($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Controls> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Controls", $$slots, []);

    	$$self.$capture_state = () => ({
    		iterationCount,
    		iterationInterval,
    		matrix,
    		Gameboard,
    		gameboard,
    		isRunning,
    		mainInterval,
    		lastFrameTime,
    		lastRenderTime,
    		requestId,
    		main,
    		start,
    		stop,
    		handlePausePlay,
    		handleSlowDown,
    		handleSpeedUp
    	});

    	return [];
    }

    class Controls extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Controls",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/components/Heading.svelte generated by Svelte v3.23.0 */

    const file$2 = "src/components/Heading.svelte";

    function create_fragment$2(ctx) {
    	let main;
    	let div;
    	let h1;
    	let t1;
    	let p;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "Cellular Automaton";
    			t1 = space();
    			p = element("p");
    			p.textContent = "My simple version of cellular automaton inspired by John Conway's Game of Life. Created for a Nextek Development employee coding challenge.";
    			add_location(h1, file$2, 4, 8, 62);
    			add_location(p, file$2, 6, 8, 99);
    			attr_dev(div, "class", "container svelte-i75aw7");
    			add_location(div, file$2, 3, 4, 30);
    			add_location(main, file$2, 2, 0, 19);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div);
    			append_dev(div, h1);
    			append_dev(div, t1);
    			append_dev(div, p);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
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

    function instance$2($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Heading> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Heading", $$slots, []);
    	return [];
    }

    class Heading extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Heading",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/components/Stats.svelte generated by Svelte v3.23.0 */
    const file$3 = "src/components/Stats.svelte";

    function create_fragment$3(ctx) {
    	let main;
    	let div;
    	let p0;
    	let t0;
    	let t1;
    	let t2;
    	let p1;
    	let t3;
    	let t4;
    	let t5;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			p0 = element("p");
    			t0 = text("Iteration Count: ");
    			t1 = text(/*$iterationCount*/ ctx[0]);
    			t2 = space();
    			p1 = element("p");
    			t3 = text("Iteration Interval: ");
    			t4 = text(/*$iterationInterval*/ ctx[1]);
    			t5 = text(" ms");
    			add_location(p0, file$3, 6, 8, 132);
    			add_location(p1, file$3, 7, 8, 182);
    			attr_dev(div, "class", "container svelte-gocctf");
    			add_location(div, file$3, 5, 4, 100);
    			add_location(main, file$3, 4, 0, 89);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div);
    			append_dev(div, p0);
    			append_dev(p0, t0);
    			append_dev(p0, t1);
    			append_dev(div, t2);
    			append_dev(div, p1);
    			append_dev(p1, t3);
    			append_dev(p1, t4);
    			append_dev(p1, t5);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$iterationCount*/ 1) set_data_dev(t1, /*$iterationCount*/ ctx[0]);
    			if (dirty & /*$iterationInterval*/ 2) set_data_dev(t4, /*$iterationInterval*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
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
    	let $iterationCount;
    	let $iterationInterval;
    	validate_store(iterationCount, "iterationCount");
    	component_subscribe($$self, iterationCount, $$value => $$invalidate(0, $iterationCount = $$value));
    	validate_store(iterationInterval, "iterationInterval");
    	component_subscribe($$self, iterationInterval, $$value => $$invalidate(1, $iterationInterval = $$value));
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Stats> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Stats", $$slots, []);

    	$$self.$capture_state = () => ({
    		iterationCount,
    		iterationInterval,
    		$iterationCount,
    		$iterationInterval
    	});

    	return [$iterationCount, $iterationInterval];
    }

    class Stats extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Stats",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.23.0 */
    const file$4 = "src/App.svelte";

    function create_fragment$4(ctx) {
    	let main;
    	let t0;
    	let t1;
    	let t2;
    	let current;
    	const heading = new Heading({ $$inline: true });
    	const canvas = new Canvas({ $$inline: true });
    	const controls = new Controls({ $$inline: true });
    	const stats = new Stats({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(heading.$$.fragment);
    			t0 = space();
    			create_component(canvas.$$.fragment);
    			t1 = space();
    			create_component(controls.$$.fragment);
    			t2 = space();
    			create_component(stats.$$.fragment);
    			add_location(main, file$4, 7, 0, 224);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(heading, main, null);
    			append_dev(main, t0);
    			mount_component(canvas, main, null);
    			append_dev(main, t1);
    			mount_component(controls, main, null);
    			append_dev(main, t2);
    			mount_component(stats, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(heading.$$.fragment, local);
    			transition_in(canvas.$$.fragment, local);
    			transition_in(controls.$$.fragment, local);
    			transition_in(stats.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(heading.$$.fragment, local);
    			transition_out(canvas.$$.fragment, local);
    			transition_out(controls.$$.fragment, local);
    			transition_out(stats.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(heading);
    			destroy_component(canvas);
    			destroy_component(controls);
    			destroy_component(stats);
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
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);
    	$$self.$capture_state = () => ({ Canvas, Controls, Heading, Stats });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
