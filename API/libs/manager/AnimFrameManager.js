

// exported classes:
// AnimationFrameHander, AnimFrameTime

const AnimFrameTime = (function() {
  "use strict";

  function AnimFrameTime() {
    this.time = Date.now();
    this.timePrev = this.time;
    this.deltaTime = 0.0;
    this.deltaTimePrev = this.deltaTime;
    this.deltaSmoothTime = 1.0;
    this.frameCount = 0|0;
    this.frameSkip = 1|0; // permet de ralentir l'animation générale.
    this.fps = 1.0 / (this.deltaTime || 1.0);
    this.fpsMax = 60.0;

    this.t = 0.0;
    this.dt = 0.01;
    this.accumulator = 0.0;
  }
  
  //const instance = new AnimFrameTime();
  //return new AnimFrameTime(); // similli singleton
  return new AnimFrameTime();
})();



// this class inherit from List class
const EventList = (function() {
  "use strict";

  function ListNode(data) {
    this.data = data;
    this.prev = null;
    this.next = null;
  }

  // class
  function EventList(elem, domEvent, parentHandler) {
    this.first = null;
    this.length = 0|0;
    this.elem = elem;
    this.domEvent = domEvent;
    this.parentHandler = parentHandler;
    this.eventsArray = [];
  }
  //EventList.prototype = Object.create(List.prototype);


  function nodeOf(item, start) {
    var cur = this.first, next = cur;
    if (!cur) return null;
    if (start) {
      if (start < 0 || start >= this.length) return null;
      for (var i = 0; i < start; ++i) {
        if ((cur = cur.next) === this.first) return null;
      }
    }
    do {
      next = cur.next;
      if (item === cur.data) return cur;
    } while ((cur = next) !== this.first);
    return null;
  }

  function push() {
    if (arguments.length === 0) return null;

    // first one
    var first = this.first;
    var n = new ListNode(arguments[0]);
    if (!first) {
      this.first = n;
      n.prev = n;
      n.next = n;
    } else {
      n.next = first;
      n.prev = first.prev;
      first.prev.next = n;
      first.prev = n;
    }
    // all others
    for (var i = 1; i < arguments.length; ++i) {
      first = this.first;
      n = new ListNode(arguments[i]);
      n.next = first;
      n.prev = first.prev;
      first.prev.next = n;
      first.prev = n;
    }
    this.length += arguments.length;
    return n;
  }

  function remove(itemOrListNode) {
    var node;
    if (!itemOrListNode || !this.first) return undefined;
    if (itemOrListNode instanceof ListNode) {
      node = itemOrListNode;
    } else if (!(node = nodeOf.call(this, itemOrListNode))) return undefined;

    if (node === node.prev) {
      this.first = null;
    } else {
      if (node === this.first) this.first = node.next;
      node.prev.next = node.next;
      node.next.prev = node.prev;
      //node = null; // useless
    }
    --this.length;
    return node.data;
  }


  function addEvent(fn) {
    if (!fn) return;
    var wrapper = { callback: e => fn(e,this.parentHandler) };
    if (fn.name) this.eventsArray[fn.name] = wrapper;
    if (this.elem.addEventListener) {
      this.elem.addEventListener(this.domEvent, wrapper.callback, false);
    } else if (this.elem.attachEvent) {
      this.elem.attachEvent('on' + this.domEvent, wrapper.callback);
    }
    //console.log("Add event:" + this.domEvent + " argument:" + fn.name);
  }

  function removeEvent(fn) {
    if (!fn) return;
    var wrapper = this.eventsArray[fn.name];
    if (!wrapper) return;
    if (this.elem.removeEventListener) {
      this.elem.removeEventListener(this.domEvent, wrapper.callback, false);
    } else if (this.elem.detachEvent) {
      this.elem.detachEvent('on' + this.domEvent, wrapper.callback);
    }
    this.eventsArray[fn.name] = undefined;
  }



  EventList.prototype.add = function() {
    if (this.domEvent && this.elem) {
      for (var i = 0; i < arguments.length; i++) {
        var arg = arguments[i];
        if (typeof(arg) !== 'function') continue;
        addEvent.call(this, arg);
      }
    }
    push.apply(this, arguments);
  };


  EventList.prototype.remove = function() {
    if (this.domEvent && this.elem) {
      for (var i = 0; i < arguments.length; i++) {
        var arg = arguments[i];
        if (typeof(arg) !== 'function') continue;
        removeEvent.call(this, arg);
      }
    }
    remove.apply(this, arguments);
  };


  EventList.prototype.forEach = function(callback) {
    var cur = this.first, next = cur;
    var index = 0;
    if (cur && callback) {
      do {
        next = cur.next;
        callback(cur.data, index++, cur);
      } while ((cur = next) !== this.first);
    }
  };

  return EventList;
})();





const AnimFrameManager = (function() {
  "use strict";

  const clamp = (v,min,max) => Math.min(Math.max(v,min),max);

  function getMouseCoords(elem, event) {
    var rect = elem.getBoundingClientRect();
    return [event.clientX - rect.left, event.clientY - rect.top];
  }

  // Window, Document, HTMLElement
  // https://en.wikipedia.org/wiki/DOM_events
  const globalEventHandlers = {
    abort: {categorie:'HTML frame/object'},
    blur: {categorie:'HTML form'},
    cancel: {categorie:''},
    canplay: {categorie:''},
    canplaythrough: {categorie:''},
    change: {categorie:'HTML form'},
    click: {categorie:'Mouse'},
    close: {categorie:''},
    contextmenu: {categorie:'Mouse'},
    cuechange: {categorie:''},
    dblclick: {categorie:'Mouse'},
    drag: {categorie:'Mouse'},
    dragend: {categorie:'Mouse'},
    dragenter: {categorie:'Mouse'},
    dragleave: {categorie:'Mouse'},
    dragover: {categorie:'Mouse'},
    dragstart: {categorie:'Mouse'},
    drop: {categorie:'Mouse'},
    durationchange: {categorie:''},
    emptied: {categorie:''},
    ended: {categorie:''},
    error: {categorie:'HTML frame/object'},
    focus: {categorie:'HTML form'},
    input: {categorie:''},
    invalid: {categorie:''},
    keydown: {categorie:'Keyboard'},
    keypress: {categorie:'Keyboard'},
    keyup: {categorie:'Keyboard'},
    load: {categorie:'HTML frame/object'},
    loadeddata: {categorie:''},
    loadedmetadata: {categorie:''},
    loadstart: {categorie:'Progress'},
    mousedown: {categorie:'Mouse'},
    mouseenter: {categorie:'Mouse'},
    mouseleave: {categorie:'Mouse'},
    mousemove: {categorie:'Mouse'},
    mouseout: {categorie:'Mouse'},
    mouseover: {categorie:'Mouse'},
    mouseup: {categorie:'Mouse'},
    mousewheel: {categorie:''},
    pause: {categorie:''},
    play: {categorie:''},
    playing: {categorie:''},
    progress: {categorie:'Progress'},
    ratechange: {categorie:''},
    reset: {categorie:'HTML form'},
    resize: {categorie:'HTML frame/object'},
    scroll: {categorie:'HTML frame/object'},
    seeked: {categorie:''},
    seeking: {categorie:''},
    select: {categorie:'HTML form'},
    show: {categorie:''},
    stalled: {categorie:''},
    submit: {categorie:'HTML form'},
    suspend: {categorie:''},
    timeupdate: {categorie:''},
    volumechange: {categorie:''},
    waiting: {categorie:''},
  };

  // Window, body, frameset
  // https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers
  const windowEventHandlers = {
    afterprint: {categorie:'Miscellaneous'},
    beforeprint: {categorie:'Miscellaneous'},
    beforeunload: {categorie:''},
    hashchange: {categorie:''},
    languagechange: {categorie:''},
    message: {categorie:''},
    messageerror: {categorie:''},
    offline: {categorie:''},
    online: {categorie:''},
    pagehide: {categorie:''},
    pageshow: {categorie:''},
    popstate: {categorie:''},
    storage: {categorie:''},
    unhandledrejection: {categorie:''},
    unload: {categorie:'HTML frame/object'},
  };

  // Document, HTMLElement
  const documentAndElementEventHandlers = {
    beforecopy: {categorie:'Clipboard'},
    beforecut: {categorie:'Clipboard'},
    beforepaste: {categorie:'Clipboard'},
    copy: {categorie:'Clipboard'},
    cut: {categorie:'Clipboard'},
    paste: {categorie:'Clipboard'},
    readystatechange: {categorie:''},
    search: {categorie:''},
    securitypolicyviolation: {categorie:''},
    selectionchange: {categorie:''},
    selectstart: {categorie:'Mouse'},
    touchcancel: {categorie:'Touch'},
    touchend: {categorie:'Touch'},
    touchmove: {categorie:'Touch'},
    touchstart: {categorie:'Touch'},
    webkitfullscreenchange: {categorie:''},
    webkitfullscreenerror: {categorie:''},
    webkitpointerlockchange: {categorie:''},
    webkitpointerlockerror: {categorie:''},
    wheel: {categorie:''},
  };




  const animationFrameEventTypes = {
    init: "Fired when the start() function is being called",
    physic: "Fired many times each frame",
    animate: "Fired at each frame in 60fps",
  };

  // https://developer.mozilla.org/en-US/docs/Web/Events
  const viewEventTypes = {
    fullscreenchange: "An element was turned to fullscreen mode or back to normal mode",
    fullscreenerror: "It was impossible to switch to fullscreen mode for technical reasons or because the permission was denied",
    resize: "The document view has been resized",
    scroll: "The document view or an element has been scrolled",
  };

  const keyboardEventTypes = {
    keydown: "ANY key is pressed",
    keypress: "ANY key except Shift, Fn, CapsLock is in pressed position (Fired continously)",
    keyup: "ANY key is released",
  };

  const mouseEventTypes = {
    auxclick: "A pointing device button (ANY non-primary button) has been pressed and released on an element",
    click: "A pointing device button (ANY button; soon to be primary button only) has been pressed and released on an element",
    contextmenu: "The right button of the mouse is clicked (before the context menu is displayed)",
    dblclick: "A pointing device button is clicked twice on an element",
    mousedown: "A pointing device button is pressed on an element",
    mouseenter: "A pointing device is moved onto the element that has the listener attached",
    mouseleave: "A pointing device is moved off the element that has the listener attached",
    mousemove: "A pointing device is moved over an element (Fired continously as the mouse moves)",
    mouseover: "A pointing device is moved onto the element that has the listener attached or onto one of its children",
    mouseout: "A pointing device is moved off the element that has the listener attached or off one of its children",
    mouseup: "A pointing device button is released over an element",
    pointerlockchange: "The pointer was locked or released",
    pointerlockerror: "It was impossible to lock the pointer for technical reasons or because the permission was denied",
    select: "Some text is being selected",
    wheel: "A wheel button of a pointing device is rotated in any direction",
  };

  const dragEventTypes = {
    drag: "An element or text selection is being dragged (Fired continuously every 350ms)",
    dragend: "A drag operation is being ended (by releasing a mouse button or hitting the escape key)",
    dragenter: "A dragged element or text selection enters a valid drop target",
    dragstart: "The user starts dragging an element or text selection",
    dragleave: "A dragged element or text selection leaves a valid drop target",
    dragover: "An element or text selection is being dragged over a valid drop target (Fired continuously every 350ms)",
    drop: "An element is dropped on a valid drop target",
  };

  const progressEventTypes = {
    abort: "Progression has been terminated (not due to an error)",
    error: "Progression has failed",
    load: "Progression has been successful",
    loadend: 'Progress has stopped (after "error", "abort" or "load" have been dispatched)',
    loadstart: "Progress has begun",
    progress: "In progress",
    timeout: "Progression is terminated due to preset time expiring",
  };


  function eventTypeToString(elementEvent, ...events) {
    var ret = "";
    var keys = Object.keys(elementEvent);

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var values = elementEvent[key];

      // check for type.
      var found = false;
      for (var ev = 0; ev < events.length; ev++) {
        var eventTypesKeys = Object.keys(events[ev].type);
        for (var j = 0; j < eventTypesKeys.length; j++) {
          if (key === (events[ev].prefix||"") + eventTypesKeys[j]) {
            found = true;
            ev = events.length; // break double loop
            break;
          }
        }
        //if (found == true || exclude == true) break;
      }
      if (found == false) continue;

      var str = "";
      if (values) {
        values.forEach(function(e){
          if (str !== "") str += ",";
          str += e.name? e.name : '<unnamed>';
        });
      }
      
      //ret += `${key}: [${str}]\n`;
      ret += key+': ';
      ret += str==''?'null\n': `[${str}]\n`;
    }

    return ret;
  }


  function AnimFrameManager(target_HTMLElement) {
    this.target = target_HTMLElement;
    this.requestId = 0;
    this.customData = {}; // for users
    this.prevCall = this.stop; // dernière fonction appelée


    // target element (not a reals dom events)
    this.elementEvent = [];
    this.elementEvent['init'] = new EventList(this.target);
    this.elementEvent['physic'] = new EventList(this.target);
    this.elementEvent['animate'] = new EventList(this.target);

    // all target(dom) events
    this.setEventListTypes(viewEventTypes);
    this.setEventListTypes(keyboardEventTypes);
    this.setEventListTypes(mouseEventTypes);
    this.setEventListTypes(dragEventTypes);
    this.setEventListTypes(progressEventTypes);

    // window
    this.windowEvent = [];
    this.windowEvent['focus'] = new EventList(window, "focus");
    this.windowEvent['blur'] = new EventList(window, "blur");
    this.windowEvent['beforeunload'] = new EventList(window, "beforeunload");
    
    // document
    this.documentEvent = [];
    this.documentEvent['keydown'] = new EventList(document, "keydown");
    this.documentEvent['keyup'] = new EventList(document, "keyup");
  }

  AnimFrameManager.prototype.getMouseCoords = function(event) {
    var rect = event.target.getBoundingClientRect();
    return [event.clientX - rect.left, event.clientY - rect.top];
  };


  AnimFrameManager.prototype.setEventListTypes = function(eventTypes) {
    if (!this.elementEvent || !this.target || !eventTypes) return;
    var keys = Object.keys(eventTypes);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      this.elementEvent[/*'on'+*/key] = new EventList(this.target, key, this);
    }
  };


  AnimFrameManager.prototype.log = function(target = 'element') {
    //var allEvents = eventTypeToString(this.elementEvent, {type:basicEventTypes}, {type:mouseEventTypes,prefix:"on"});
    var animationFrameEvents,viewEvents,keyboardEvents,mouseEvents,dragEvents,progressEvents;
    if (target === 'element') {
      animationFrameEvents = eventTypeToString(this.elementEvent, {type:animationFrameEventTypes});
      viewEvents = eventTypeToString(this.elementEvent, {type:viewEventTypes/*,prefix:"on"*/});
      keyboardEvents = eventTypeToString(this.elementEvent, {type:keyboardEventTypes/*,prefix:"on"*/});
      mouseEvents = eventTypeToString(this.elementEvent, {type:mouseEventTypes,/*prefix:"on"*/});
      dragEvents = eventTypeToString(this.elementEvent, {type:dragEventTypes/*,prefix:"on"*/});
      progressEvents = eventTypeToString(this.elementEvent, {type:progressEventTypes/*,prefix:"on"*/});
    } else if (target === 'window') {
      viewEvents = eventTypeToString(this.windowEvent, {type:viewEventTypes});
      keyboardEvents = eventTypeToString(this.windowEvent, {type:keyboardEventTypes});
      mouseEvents = eventTypeToString(this.windowEvent, {type:mouseEventTypes});
      dragEvents = eventTypeToString(this.windowEvent, {type:dragEventTypes});
      progressEvents = eventTypeToString(this.windowEvent, {type:progressEventTypes});
    } else if (target === 'document') {
      viewEvents = eventTypeToString(this.documentEvent, {type:viewEventTypes});
      keyboardEvents = eventTypeToString(this.documentEvent, {type:keyboardEventTypes});
      mouseEvents = eventTypeToString(this.documentEvent, {type:mouseEventTypes});
      dragEvents = eventTypeToString(this.documentEvent, {type:dragEventTypes});
      progressEvents = eventTypeToString(this.documentEvent, {type:progressEventTypes});
    }
    if (animationFrameEvents) {
      console.log("-- animationFrameEvents --\n" + animationFrameEvents);
    }
    console.log("-- viewEvents(DOM) --\n" + viewEvents);
    console.log("-- keyboardEvents(DOM) --\n" + keyboardEvents);
    console.log("-- mouseEvents(DOM) --\n" + mouseEvents);
    console.log("-- dragEvents(DOM) --\n" + dragEvents);
    console.log("-- progressEvents(DOM) --\n" + progressEvents);
  };



  // https://gafferongames.com/post/fix_your_timestep/
  // https://github.com/onedayitwillmake/RealtimeMultiplayerNodeJs
  AnimFrameManager.prototype.loop = function(timestamp) {
    const Time = AnimFrameTime;
    Time.timePrev = Time.time;
    Time.time = Date.now();
    Time.deltaTimePrev = Time.deltaTime;
    Time.deltaTime = (Time.time - Time.timePrev) / 1000;
    Time.deltaTime = clamp(Time.deltaTime, 0,0.25);
    Time.fps = 1.0 / (Time.deltaTime || 1.0);

    var frameTime = (Time.time - Time.timePrev) / 1000; // test
    var ret = 0;

    Time.accumulator += frameTime;

    // physic event
    var physicEvent = this.elementEvent['physic'];
    var skip = Time.frameCount % (Time.frameSkip || 1);
    if (physicEvent && !skip) {

      while (Time.accumulator >= Time.dt) {
        Time.deltaTime = Time.dt;
        physicEvent.forEach(callback => {
          //if (typeof(this.customData) !== 'object') this.customData = {};
          ret |= callback.call(this.customData, this) | 0;
        });
        
        if (this.prevCall !== this.start || ret) break;
        Time.t += Time.dt;
        Time.accumulator -= Time.dt;
      }

      var alpha = Time.accumulator / Time.dt;
    }
    

    // animate event
    var animateEvent = this.elementEvent['animate'];
    if (animateEvent && !skip) {
      animateEvent.forEach(callback => {
        //if (typeof(this.customData) !== 'object') this.customData = {};
        callback.call(this.customData, this);
      });
    }

    //console.log(this.requestId)
    if (this.prevCall !== this.start || ret) {
      /// RECOPIER PLUS BAS (et à tester)
      if (ret) this.stop();
      else this.prevCall(); // pause or stop
      return;
    }

    AnimFrameTime.frameCount++;
    this.requestId = requestAnimationFrame(timestamp => this.loop(timestamp));
  }


  AnimFrameManager.prototype.start = function() {
    var ret = 0;
    if (this.prevCall === this.start) return;

    if (this.prevCall === this.stop) {
      //console.log("start(): premier appel");
      
      var initEvent = this.elementEvent['init'];
      if (initEvent) {
        this.prevCall = this.start;
        initEvent.forEach(callback => {
          if (typeof(callback) === 'function') {
            //if (typeof(this.customData) !== 'object') this.customData = {};
            ret |= callback.call(this.customData, this) | 0;
          }
        });
        // l'event peut être stoppé même depuis les fonctions d'init
        if (this.prevCall !== this.start || ret) {
          /// RECOPIER ICI de plus haut (et à tester)
          return;
        }
        this.prevCall = this.stop;
      }

    }

    if (this.prevCall !== this.start) {
      AnimFrameTime.time = Date.now();
      this.prevCall = this.start;
      this.loop();
    }
  };


  AnimFrameManager.prototype.pause = function() {
    if (this.prevCall === this.pause) return;
    this.prevCall = this.pause;
    if (this.requestId) {
      cancelAnimationFrame(this.requestId);
      this.requestId = 0;
    }
  };


  AnimFrameManager.prototype.stop = function() {
    if (this.prevCall === this.stop) return;
    this.prevCall = this.stop;
    if (this.requestId) {
      cancelAnimationFrame(this.requestId);
      this.requestId = 0;
    }
  };


  AnimFrameManager.prototype.getStatus = function() {
    var ret = "";
    if (this.prevCall === this.start) ret += "start";
    else if (this.prevCall === this.pause) ret += "pause";
    else if (this.prevCall === this.stop) ret += "stop";
    return ret;
  };

  return AnimFrameManager;
})();


