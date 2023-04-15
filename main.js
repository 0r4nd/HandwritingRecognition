

//import {TouchScroller} from "./libs/TouchScroller.js";

const sprites = [];
const Time = AnimFrameTime;

function init() {
  console.log("init");
}

// be careful: this function must use Time.deltaTime
// this function can be call more than 1x on each frame (depend on fps)
function physic() {
  for (var i = 0, keys = Object.keys(sprites); i < keys.length; i++) {
    var sprite = sprites[keys[i]];
    sprite.physic(Time.deltaTime);
  }
}


function animate() {
  for (var i = 0, keys = Object.keys(sprites); i < keys.length; i++) {
    var sprite = sprites[keys[i]];
    sprite.animate(Time.deltaTime);

    // collisions
    var ysize = sprite.framesets[sprite.actionId].frameImages[0].height * sprite.scale[1];
    if (sprite.position[1] + ysize > 400) {
      sprite.position[1] = 400 - ysize;
      sprite.velocity[1] = 0;
    }
  }

}

function draw() {
  for (var i = 0, keys = Object.keys(sprites); i < keys.length; i++) {
    var sprite = sprites[keys[i]];
    sprite.draw();
  }
}




/*
this is a keydown event.
this function is called every 5ms ~ 20ms (sometimes more) when you keep a key down.
use this function only for state changes. (don't change vectors/physic values here)
*/
function keydown(event) {
  var sprite = sprites["alex"];
  switch (event.key) {
    case "Down": // IE/Edge specific value
    case "ArrowDown":
      //sprite.position[1] 
      // Do something for "down arrow" key press.
      break;
    case "Up": // IE/Edge specific value
    case "ArrowUp":
      // Do something for "up arrow" key press.
      //sprite.actionId = 'jump';
      sprite.velocity[1] = -12;
      break;
    case "Left": // IE/Edge specific value
    case "ArrowLeft":
      sprite.actionId = 'run';
      sprite.direction = -1;
      break;
    case "Right": // IE/Edge specific value
    case "ArrowRight":
      sprite.actionId = 'run';
      sprite.direction = 1;
      break;
    case "Enter":
      // Do something for "enter" or "return" key press.
      break;
    case "Esc": // IE/Edge specific value
    case "Escape":
      // Do something for "esc" key press.
      break;
    default:
      sprite.actionId = 'idle';
      return;
  }

}

function keyup(event) {
  var sprite = sprites["alex"];
  switch (event.key) {
    case "Left": // IE/Edge specific value
    case "ArrowLeft":
      sprite.actionId = 'idle';
      break;
    case "Right": // IE/Edge specific value
    case "ArrowRight":
      sprite.actionId = 'idle';
      break;
    default:
      break;
  }

}



function main() {
  console.clear();
  var body = document.getElementById("body");

  UnitParser.test();
  //EntityManager.test();

  // player sprite
  sprites["alex"] = new Sprite({
    parent: body,
    actionId: 'idle',
    position: [50,50,1],
    scale: [0.5,0.5],
    idle: {
      srcImages: ["images/alex/idle.png"],
      grid: [2,1],
      speed: 8.0,
    },
    run: {
      srcImages: ["images/alex/run.png"],
      grid: [6,1],
      speed: 24.0,
    },
    jump: {
      srcImages: ["images/alex/jump.png"],
      grid: [2,1],
      speed: 8.0,
    },
  });


  sprites["suzy"] = new Sprite({
    parent: body,
    actionId: 'idle',
    position: [600,300,0],
    scale: [0.3,0.3],
    direction: -1,
    idle: {
      srcImages: ["images/alex/idle.png"],
      grid: [2,1],
      speed: 8.0,
    },
    run: {
      srcImages: ["images/alex/run.png"],
      grid: [6,1],
      speed: 24.0,
    },
    jump: {
      srcImages: ["images/alex/jump.png"],
      grid: [2,1],
      speed: 8.0,
    },
  });


  // other sprite



  // init + animation
  var anim = new AnimFrameManager(body);
  // 'frame perfect' game event's
  anim.elementEvent['init'].add(init);
  anim.elementEvent['physic'].add(physic);
  anim.elementEvent['animate'].add(animate,draw);

  // javascript dom event's
  // theses events are far from 'frame perfect' (firefox or chrome: 5ms to 20ms)
  // this is very unstable... thoses events can occure every 3-15 frames.
  anim.documentEvent['keydown'].add(keydown);
  anim.documentEvent['keyup'].add(keyup);
  anim.start();
}


