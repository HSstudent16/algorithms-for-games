// jshint esnext: true
let externals;
const CnvHelper = (function () {
  // Global context
  const root = this;
  
  // Active library pointer
  var activeLib = null;

  /**
   * Prepares Event Listeners for a Canvas Element Linked to CanvasHelper
   * @param {LibJS} that - Library Instance
   */
  function attachEvents (that) {
    let _cnv = that.cnv;
    _cnv.tabIndex = -1;
    _cnv.addEventListener ("wheel", function (e) {
        if (that.looping) {
          e.preventDefault();
          if (typeof that.mouseWheel === "function") {
            that.mouseWheel (e);
          }
        }
    });
    _cnv.addEventListener ("click", function (e) {
        if (that.enteredFocus) {
          return;
        }
        that.clicked = true;
        if (typeof that.mouseClicked === "function" && that.looping) {
            that.mouseClicked (e);
        }
    });
    _cnv.addEventListener ("mousedown", function (e) {
        if (that.enteredFocus) {
          return;
        }
        if (typeof that.mousePressed === "function" && that.looping) {
            that.mousePressed (e);
        }
    });
    _cnv.addEventListener ("mouseup", function (e) {
        if (that.enteredFocus) {
          return;
        }
        if (typeof that.mouseReleased === "function" && that.looping) {
            that.mouseReleased (e);
        }
    });
    _cnv.addEventListener ("keydown", function (e) {
        if (that.enteredFocus) {
          return;
        }
        that.keyCode = e.keyCode;
        e.preventDefault();
        if (typeof that.keyPressed === "function" && that.looping) {
            that.keyPressed (e);
        }
    });
    _cnv.addEventListener ("keyup", function (e) {
        if (that.enteredFocus) {
          return;
        }
        that.keyCode = e.keyCode;
        e.preventDefault();
        if (typeof that.keyReleased === "function" && that.looping) {
            that.keyReleased (e);
        }
    });
    _cnv.addEventListener ("mousemove", function (e) {
      /** Adapted form p5.js **/
      var a = _cnv.getBoundingClientRect();
      that.mouseX = (e.clientX - a.left) / (_cnv.scrollWidth / _cnv.width || 1) | 0;
      that.mouseY = (e.clientY - a.top) / (_cnv.scrollHeight / _cnv.height || 1) | 0;
    });
    _cnv.addEventListener ("blur", function () {
        that.noLoop();
    });
    _cnv.addEventListener ("focus", function () {
        that.loop();
        that.enteredFocus = true;
    });
    _cnv.hasEventListeners = true;
  }

  /**
   * Draws a "paused" symbol on an inactive canvas
   * @param {LibJS} that - Library Instance
   */
  function drawPaused (that) {
    var ctx = that.ctx, cnv = that.cnv, w = cnv.width, h = cnv.height;
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.fillRect (w*0.5 - h*0.25, h*0.25, h*0.2, h*0.5);
    ctx.fillRect (w*0.5 + h*0.05, h*0.25, h*0.2, h*0.5);
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = Math.ceil(h * 0.15) + "px sans-serif";
    ctx.fillStyle = "black";
    ctx.fillText ("Click to begin.", w * 0.5, h * 0.8);
    ctx.fillStyle = "white";
    ctx.fillText ("Click to begin.", w * 0.49, h * 0.79);
    ctx.restore();
    
  }
  
  /**
   * Handels Draw Loop execution
   * @param {number} deltaTime - Difference in milliseconds between the current
   *                 call and the previous
   */
  function handleDrawLoop (deltaTime) {
    if (!activeLib) {
      return;
    }
    else if (!activeLib.looping) {
      drawPaused(activeLib);
      return;
    }
    if (typeof activeLib.draw === "function") {
      activeLib.draw(deltaTime);
      activeLib.clicked = false;
      activeLib.enteredFocus = false;
      root.requestAnimationFrame(handleDrawLoop);
    }
  }
  
  /**
   * Initialize the library
   * @param {HTMLCanvasElement} $cnv - Canvas Element
   * @param {CanvasRenderingContext2D} $ctx - Optional; Context from the canvas
   */
  function LibJS ($cnv, $ctx) {
    this.cnv = $cnv;
    /** @type {CanvasRenderingContext2D} */
    this.ctx = ($ctx && $ctx.canvas === $cnv) ? $ctx : $cnv.getContext('2d');
    this.draw = null;
    this.mouseClicked = null;
    this.mousePressed = null;
    this.mouseReleased = null;
    this.mouseX = 0;
    this.mouseY = 0;
    this.width = $cnv.width;
    this.height = $cnv.height;
    this.keyPressed = null;
    this.keyReleased = null;
    this.keyCode = NaN;
    this.looping = false;
    this.clicked = false;
    this.enteredFocus = false;
    attachEvents (this);
  }

  LibJS.prototype.resize = function (w, h) {
    this.width = this.cnv.width = w;
    this.height = this.cnv.height = h;
    drawPaused(this);
  };

  /**
   * Halts draw loop execution
   */
  LibJS.prototype.noLoop = function () {
    this.looping = false;
    root.cancelAnimationFrame(handleDrawLoop);
  };

  /**
   * Resumes draw loop execution
   */
  LibJS.prototype.loop = function () {
    this.looping = true;
    activeLib = this;
    handleDrawLoop ();
  };

  Math.lerp = function (a, b, c) {
      return a + c * (b - a);
  };
  Math.TWO_PI = 6.283185307;
  root[["document"]].get = root[["document"]].querySelector;

  for(let i = root.requestAnimationFrame (Math.cos);
      i >= 0; root.cancelAnimationFrame(i--)){}
  
  if (externals) {
    let ctx = externals.context, cnv = externals.canvas;
    cnv.width = "50";
    cnv.height = "50";
    ctx.fillStyle = "#055";
    ctx.beginPath ();
    ctx.moveTo (25, 0);
    ctx.lineTo (50, 25);
    ctx.lineTo (42, 25);
    ctx.lineTo (42, 50);
    ctx.lineTo (30, 50);
    ctx.lineTo (30, 30);
    ctx.lineTo (20, 30);
    ctx.lineTo (20, 50);
    ctx.lineTo (8, 50);
    ctx.lineTo (8, 25);
    ctx.lineTo (0, 25);
    ctx.fill ();
    println(cnv.toDataURL());
  }
  
  return (
    root.CnvHelper = LibJS
  );
}) ();