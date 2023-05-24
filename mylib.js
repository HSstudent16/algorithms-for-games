// Grrr....

function noop () {}

class CnvHelper {
  constructor (cnv, ctx) {
    this.cnv = cnv;
    this.ctx = ctx ?? cnv.getContext('2d');
    
    this.width = cnv.width;
    this.height = cnv.height;
    
    this.mouseX = 0;
    this.mouseY = 0;
    this.clicked = false;
    
    this.keyCode = null;
    
    this.looping = false;    
    this.#draw = noop;
    
    this.keyPressed = noop;
    this.keyReleased = noop;
    this.mousePressed = noop;
    this.mouseReleased = noop;
    
    this.attach(cnv);
  }
  attach () {}
  loop () {}
  noLoop () {}
  drawWrapper () {}
  get draw () {
    return this.#draw;
  }
  set draw (f) {
    if (typeof f === "function") {
      this.draw = f;
      this.loop();
    } else {
      this.draw = noop;
      this.noLoop();
    }
  }
}
