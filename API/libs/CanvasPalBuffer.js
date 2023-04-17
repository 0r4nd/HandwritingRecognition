

const CanvasPalBuffer = (function() {
  "use strict";

  // class
  function CanvasPalBuffer(opts = {}) {
    this.width = opts.width;
    this.height = opts.height;

    this.palette = new Uint32Array(256);
    this.palette.fill(0xffffff);
    this.backbuffer = new Uint8Array(this.width*this.height);
    this.frontbuffer = new Uint8Array(this.width*this.height);
    this.curbuffer = this.backbuffer;
    this.curbuffer32 = new Uint32Array(this.curbuffer.buffer);
  }
  

  // private
  function isImage(elem) { return elem instanceof HTMLImageElement; }
  function isCanvas(elem) { return elem instanceof HTMLCanvasElement; }
  function toHexString(val, len=8) { return val.toString(16).padStart(len, "0"); }


  function swapBuffers() {
    if (this.curbuffer == this.frontbuffer) this.curbuffer = this.backbuffer;
    else this.curbuffer = this.frontbuffer;
    this.curbuffer32 = new Uint32Array(this.curbuffer.buffer);
  }


  CanvasPalBuffer.prototype.drawOnCanvas = function(canvas) {
    if (!canvas) return this;
    var ctx = canvas.getContext("2d");
    var width = Math.min(canvas.width, this.width);
    var height = Math.min(canvas.height, this.height);
    var res = 1;
    var c1 = 0, c2 = 0;
    //ctx.clearRect(0,0, width,height);

    for (var y = 0; y < height; y++) {
      var yres = y*res;
      for (var x = 0; x < width; x++) {
        var offset = y * this.width + x;
        var idx = this.curbuffer[offset];
        c1 = this.palette[idx];
        if (c1 != c2) {
          ctx.fillStyle = `rgb(${c1&255},${(c1>>8)&255},${(c1>>16)&255})`;
          c2 = c1;
        }
        ctx.fillRect(x*res,yres, res,res);
        //if (curbuffer[i][j]) {
        //  context.fillRect(i * res, j * res, res, res);
        //  sum += rows / res;
        //  if (val == 0) val = (rows - j) / rows;
        //}
      }
    }
    return this;
  };


  function pixel_set8to32(dst, src, x, offset) {
    var shl = (x & 3) << 3;
    dst[offset] = (dst[offset] & ~(0xff << shl)) | (src << shl);
  }

  // src32 must have 4x the same byte! (ex: (1|1<<8|1<<16|1<<24))
  function hline_set8to32(dst32,src32, x,width, doff) {
    var mask32 = 0xffffffff;
    var maskL = x & 3;
    var maskR = (x + width) & 3;
    var shl = maskL << 3;
    var shr = (32 - (maskR << 3)) >> 1;

    // small input
    if (width <= 4) {
      mask32 >>>= (32 - (width << 3));
      shr = (32 - shl) >> 1;
      //src32 = (0|(0<<8)|(0<<16)|(0<<24)); // debug
      maskL = mask32 << shl;
      dst32[doff] = (dst32[doff] & ~maskL) | (src32 & maskL);
      //src32 = (2|(2<<8)|(2<<16)|(2<<24)); // debug
      maskR = (mask32 >>> shr) >>> shr;
      dst32[++doff] = (dst32[doff] & ~maskR) | (src32 & maskR);
      return width;
    }

    // left align
    var align = (maskL | (maskL >> 1)) & 1; // is aligned?
    var width4 = ((width + maskL) >> 2) - align;

    //src32 = (0|(0<<8)|(0<<16)|(0<<24)); // debug
    maskL = mask32 << shl;
    dst32[doff] = (dst32[doff] & ~maskL) | (src32 & maskL);
    doff += align;

    // loop
    //src32 = (1|(1<<8)|(1<<16)|(1<<24)); // debug
    while (width4-- > 0) dst32[doff++] = src32;

    // right align
    //src32 = (2|(2<<8)|(2<<16)|(2<<24)); // debug
    maskR = (mask32 >>> shr) >>> shr;
    dst32[doff] = (dst32[doff] & ~maskR) | (src32 & maskR);
    return width;
  }

  function hline_copy8to32(dst32,src8, x, width, doff,soff) {
    var mask32 = 0xffffffff;
    var x2 = (x + width - 1);
    var alignL = x & 3;
    var alignR = x2 & 3;
    var chunks = width >> 2;
    var i = 0, src32 = 0;

    // small input
    if (width <= 4) {
      for (chunks = width << 3; i < chunks; i += 8) src32 |= src8[soff++] << i;
      mask32 >>>= 32 - chunks;
      i = alignL << 3;
      //console.log(dst32[doff])
      dst32[doff] = (dst32[doff] & ~(mask32 << i)) | (src32 << i);
      if ((x >> 2) != (x2 >> 2)) {
        i = 32 - i; // 8-16-24 -> 24-16-8 (can't be 0 or 32 here)
        dst32[++doff] = (dst32[doff] & ~(mask32 >>> i)) | (src32 >> i);
      }
      return width;
    }

    // left align
    if (alignL > 0) {
      alignL <<= 3; // 1-2-3 -> 8-16-24 (can't be zero here)
      for (chunks = 32-alignL; i < chunks; i += 8) src32 |= src8[soff++] << i;
      dst32[doff] = (dst32[doff] & ~(mask32 << alignL)) | (src32 << alignL);
      doff++;
      chunks = ((x + width) >> 2) - ((x >> 2) + 1);
    }

    // dword aligned loop
    while (chunks-- > 0) {
      dst32[doff++] = src8[soff++] | (src8[soff++]<<8) | (src8[soff++]<<16) | (src8[soff++]<<24); // push
    }
    
    // right align
    if (alignR < 3) {
      alignR = (alignR + 1) << 3; // 0-1-2 -> 8-16-24 (can't be 3 here)
      for (i = src32 = 0; i < alignR; i += 8) src32 |= src8[soff++] << i;
      dst32[doff] = (dst32[doff] & ~(mask32 >>> (32 - alignR))) | src32;
    }
    return width;
  }

  //i += hline_copy8toArray(a32,a8, i, width, i>>2,0);
  function hline_copy8toArray(dst32,src8, x, width, doff,soff) {
    var mask32 = 0xffffffff;
    var x2 = (x + width - 1);
    var alignL = x & 3;
    var alignR = x2 & 3;
    var chunks = width >> 2;
    var i = 0, src32 = 0;

    // avoid an overflow-read
    if (doff >= dst32.length) dst32[doff] = 0;
    
    // small input
    if (width <= 4) {
      for (chunks = width << 3; i < chunks; i += 8) src32 |= src8[soff++] << i;
      mask32 >>>= 32 - chunks;
      i = alignL << 3;
      //console.log(dst32[doff])
      dst32[doff] = (dst32[doff] & ~(mask32 << i)) | (src32 << i);
      if ((x >> 2) != (x2 >> 2)) {
        i = 32 - i; // 8-16-24 -> 24-16-8 (can't be 0 or 32 here)
        dst32[++doff] = src32 >> i;
      }
      return width;
    }

    // left align
    if (alignL > 0) {
      alignL <<= 3; // 1-2-3 -> 8-16-24 (can't be zero here)
      for (chunks = 32-alignL; i < chunks; i += 8) src32 |= src8[soff++] << i;
      dst32[doff] = (dst32[doff] & ~(mask32 << alignL)) | (src32 << alignL);
      doff++;
      chunks = ((x + width) >> 2) - ((x >> 2) + 1);
    }

    // dword aligned loop
    while (chunks-- > 0) {
      dst32[doff++] = src8[soff++] | (src8[soff++]<<8) | (src8[soff++]<<16) | (src8[soff++]<<24); // push
    }
    
    // right align
    if (alignR < 3) {
      alignR = (alignR + 1) << 3; // 0-1-2 -> 8-16-24 (can't be 3 here)
      for (i = src32 = 0; i < alignR; i += 8) src32 |= src8[soff++] << i;
      dst32[doff] = src32;
    }
    return width;
  }




  CanvasPalBuffer.prototype.drawIndexArrayXY = function(data, x,y, width,height, u1,v1,u2,v2) {
    u1 = u1 || 0;
    v1 = v1 || 0;
    u2 = u2 || width;
    v2 = v2 || height;

    var i = 0;
    var len = 3;
    var a32 = [];
    var a8 = new Uint8Array([255,255,255,255,255,255,255,255]);
    i += hline_copy8toArray(a32,a8, i, len, i>>2,0);
    i += hline_copy8toArray(a32,a8, i, len, i>>2,0);

    var data32 = data[0] | data[0]<<8 | data[0]<<16 | data[0]<<24;
    for (var j = 0; j < (v2-v1); j++) {
      hline_set8to32(this.curbuffer32, data32, x,u2-u1, ((y+j)*this.width+x)>>2);
    }
    y += height + 1;
    for (var j = 0; j < (v2-v1); j++) {
      hline_copy8to32(this.curbuffer32, data, x,u2-u1, ((y+j)*this.width+x)>>2, (u1+j)*width);
    }
    y += height + 1;
    for (var j = 0; j < (v2-v1); j++) {
      for (var i = 0; i < (u2-u1); i++) {
        pixel_set8to32(this.curbuffer32, data[(j+v1)*width + (i+u1)], x+i, ((y+j)*this.width+(x+i))>>2);
      }
    }

  };



  CanvasPalBuffer.prototype.drawPixel = function(x,y, colorMapIndex) {
    var offset = (y * this.width + x) >> 2;
    pixel_set8to32(this.curbuffer32, colorMapIndex, x, offset);
  };


  //void Line(SDL_Surface* surf,int x1,int y1, int x2,int y2,Uint32 couleur)  // Bresenham
  CanvasPalBuffer.prototype.drawBresenhamLine = function(x1,y1, x2,y2, color) {
    if (x1 > x2) { // swap
      [x1,x2] = [x2,x1];
      [y1,y2] = [y2,y1];
    }
    var dx = x2 - x1;
    var dy = y2 - y1;
    var xincr = 1;
    var yincr = this.width;

    if (dy < 0) {
      yincr = -this.width;
      dy = -dy;
    }

    y1 *= this.width;


    if (dx > dy) {
      var err = dx >> 1;
      if (dy == 0) { // horizontal line
        //if (x1 > x2) [x1,x2] = [x2,x1];
        hline_set8to32(this.curbuffer32,
                       color|color<<8|color<<16|color<<24,
                       x1, (x2-x1)+1, (y1/**this.width*/+x1)>>2);
        return;
      }
      for (var i = 0; i < dx; i++) {
        pixel_set8to32(this.curbuffer32, color, x1, (y1/**this.width*/+x1)>>2);
        x1 += xincr;
        err += dy;
        if (err > dx) {
          err -= dx;
          y1 += yincr;
        }
      }
        
    } else {
      var err = dy >> 1;
      if (dx == 0) { // vertical line
        //console.log("vertical line");
      }
      for (var i = 0; i < dy; i++) {
        pixel_set8to32(this.curbuffer32, color, x1, (y1/**this.width*/+x1)>>2);
        y1 += yincr;
        err += dx;
        if (err > dy) {
          err -= dy;
          x1 += xincr;
        }
      }
    }

    pixel_set8to32(this.curbuffer32, color, x2, (y2*this.width+x2)>>2);
  }

  function pixelCircle_set8to32(buffer, color, xo,yo, x,y, width) {
    pixel_set8to32(buffer, color,  xo + x, (( yo + y)*width+xo + x)>>2);
    pixel_set8to32(buffer, color,  yo + x, (( xo + y)*width+yo + x)>>2);
    pixel_set8to32(buffer, color,  yo + x, ((-xo + y)*width+yo + x)>>2);
    pixel_set8to32(buffer, color,  xo + x, ((-yo + y)*width+xo + x)>>2);
    pixel_set8to32(buffer, color, -xo + x, ((-yo + y)*width-xo + x)>>2);
    pixel_set8to32(buffer, color, -yo + x, ((-xo + y)*width-yo + x)>>2);
    pixel_set8to32(buffer, color, -yo + x, (( xo + y)*width-yo + x)>>2);
    pixel_set8to32(buffer, color, -xo + x, (( yo + y)*width-xo + x)>>2);
  }


  CanvasPalBuffer.prototype.drawCircle = function(x,y,rayon, color) {
    var xo = 0;
    var yo = rayon;
    var d = 1 - rayon;
    if (rayon < 1) {
      pixel_set8to32(this.curbuffer32, color, x, (y*this.width+x)>>2);
      return;
    }

    pixelCircle_set8to32(this.curbuffer32, color, xo,yo, x,y, this.width);
    while (yo > xo) {
      if (d < 0) d += 2*xo + 3;
      else {
        d += 2*xo - 2*yo + 5;
        yo -= 1;
      }
      pixelCircle_set8to32(this.curbuffer32, color, xo++,yo, x,y, this.width);
    }
  };

  CanvasPalBuffer.prototype.draw = function(elem) {
    if (isCanvas(elem)) this.drawOnCanvas(elem);
    this.curbuffer.fill(0);
    swapBuffers.call(this);
    return this;
  };

  return CanvasPalBuffer;
})();


