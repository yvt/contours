
// License: WTFPL
// Created by YVT (http://twitter.com/YVT, http://yvt.jp/)

function GrayscaleImage(w, h) {
    this.pixels = new Array(w * h);
    this.w = w;
    this.h = h;
}
GrayscaleImage.prototype = {
    /** @return {GrayscaleImage} */
    convolveSymmetricX: function(kernel) {
        var out = new GrayscaleImage(this.w, this.h);
        var w = this.w, h = this.h;
        var inPixels = this.pixels;
        var outPixels = out.pixels;
        var maxX = w - 1;
        for(var y = 0; y < h; y++) {
            var i = y * w;
            for(var x = 0; x < w; x++) {
                var sum = inPixels[i + x] * kernel[0];
                for(var j = 1; j < kernel.length; j++) {
                    sum += (inPixels[i + Math.max(x - j, 0)]
                            + inPixels[i + Math.min(x + j, maxX)])
                        * kernel[j];
                }
                outPixels[i + x] = sum;
            }
        }
        return out;
    },
    /** @return {GrayscaleImage} */
    convolveSymmetricY: function(kernel) {
        var out = new GrayscaleImage(this.w, this.h);
        var w = this.w, h = this.h;
        var inPixels = this.pixels;
        var outPixels = out.pixels;
        var maxY = h - 1;
        for(var x = 0; x < w; x++) {
            var i = x;
            for(var y = 0; y < h; y++) {
                var sum = inPixels[i + y * w] * kernel[0];
                for(var j = 1; j < kernel.length; j++) {
                    sum += (inPixels[i + Math.max(y - j, 0) * w]
                            + inPixels[i + Math.min(y + j, maxY) * w])
                        * kernel[j];
                }
                outPixels[i + y * w] = sum;
            }
        }
        return out;
    },
    /** @return {GrayscaleImage} */
    convolveSymmetricXDifferental: function(kernel) {
        var out = new GrayscaleImage(this.w, this.h);
        var w = this.w, h = this.h;
        var inPixels = this.pixels;
        var outPixels = out.pixels;
        var maxX = w - 1;
        for(var y = 0; y < h; y++) {
            var i = y * w;
            for(var x = 0; x < w; x++) {
                var sum = 0;
                for(var j = 1; j < kernel.length; j++) {
                    sum += (inPixels[i + Math.max(x - j, 0)]
                            - inPixels[i + Math.min(x + j, maxX)])
                        * kernel[j];
                }
                outPixels[i + x] = sum;
            }
        }
        return out;
    },
    /** @return {GrayscaleImage} */
    convolveSymmetricYDifferental: function(kernel) {
        var out = new GrayscaleImage(this.w, this.h);
        var w = this.w, h = this.h;
        var inPixels = this.pixels;
        var outPixels = out.pixels;
        var maxY = h - 1;
        for(var x = 0; x < w; x++) {
            var i = x;
            for(var y = 0; y < h; y++) {
                var sum = 0;
                for(var j = 1; j < kernel.length; j++) {
                    sum += (inPixels[i + Math.max(y - j, 0) * w]
                            - inPixels[i + Math.min(y + j, maxY) * w])
                        * kernel[j];
                }
                outPixels[i + y * w] = sum;
            }
        }
        return out;
    },
    
    equals: function(o) {
        if(this.w != o.w || this.h != o.h) return false;
        var b1 = this.pixels;
        var b2 = o.pixels;
        for(var i = this.w * this.h - 1; i >= 0; i--) {
            if(b1[i] != b2[i]) return false;
        }
        return true;
    }
};

/** 
 * @param imageData {ImageData} 
 * @param channel {Number}
 * @return {GrayscaleImage} */
GrayscaleImage.fromImageDataSingle = function(imageData, channel) {
    var w = imageData.width, h = imageData.height;
    var img = new GrayscaleImage(w, h);
    var d = img.pixels;
    var bmp = imageData.data;
    var i = channel;
    var j = 0;
    for(var y = 0; y < h; y++) {
        for(var x = 0; x < w; x++) {
            d[j] = bmp[i];
            i+=4; j++;
        }
    }
    return img;
};

/** 
 * @param imageData {ImageData} 
 * @return {GrayscaleImage[]} */
GrayscaleImage.fromImageData = function(imageData) {
    return [
        GrayscaleImage.fromImageDataSingle(imageData, 0),
        GrayscaleImage.fromImageDataSingle(imageData, 1),
        GrayscaleImage.fromImageDataSingle(imageData, 2)
    ];
};

GrayscaleImage.createImageData = function(images, context, filter) {
    var w = images[0].w;
    var h = images[0].h;
    var imageData = context.createImageData(w, h);
    var pixels1 = images[0].pixels;
    var pixels2 = images[1].pixels;
    var pixels3 = images[2].pixels;
    var data = imageData.data;
    var i = 0, j = 0;
    if(!filter)
        filter = function(f){return f;}
    for(var k = w * h; k > 0; k--) {
        data[i++] = filter(pixels1[j]);
        data[i++] = filter(pixels2[j]);
        data[i++] = filter(pixels3[j]);
        data[i++] = 255;
        
        j++;
    }
    return imageData;
};

var Utils = {
    map: function(arr, func, out) {
        if(!out)
            out = [];
        if(out.length == 0) {
            for(var i = 0; i < arr.length; i++) {
                out.push(func(arr[i], i));
            }
        }else{
            for(i = 0; i < arr.length; i++) {
                out[i] = (func(arr[i], i));
            }
        }
        return out;
    }
};

function edgeDetect(image) {
    // based on http://www.tomgibara.com/computer-vision/CannyEdgeDetector.java
    var gaussian = function (x, sigma) {
        return Math.exp(-(x*x)/(2*sigma*sigma));
    }
    var hypot = function (x,y){
        return Math.abs(x)+Math.abs(y);
    }
    
    var kernelRadius = 2;
    var kernelWidth = 10;
    
    var kernel = [];
    var diffKernel = [];
    var factor = 1/3/(2*Math.PI*kernelRadius*kernelRadius);
    for(var i = 0; i < kernelWidth; i++) {
        var g1 = gaussian(i, kernelRadius);
        var g2 = gaussian(i - 0.5, kernelRadius);
        var g3 = gaussian(i + 0.5, kernelRadius);
        kernel.push((g1+g2+g3)*factor);
        diffKernel.push(g3-g2);
    }
    
    var xConv = image.convolveSymmetricX(kernel);
    var yConv = image.convolveSymmetricY(kernel);
    var xGradient = yConv.convolveSymmetricXDifferental(diffKernel);
    var yGradient = xConv.convolveSymmetricYDifferental(diffKernel);
    
    var outImage = new GrayscaleImage(image.w, image.h);
    var w = image.w;
    var h = image.h;
    var out = outImage.pixels;
    factor = kernelRadius;
    var processPixel = function (i, iN, iS, iW, iE, iNW, iNE, iSW, iSE) {
        var xGrad = xGradient.pixels[i];
        var yGrad = yGradient.pixels[i];
        var gradMag = hypot(xGrad, yGrad);
        var nMag = hypot(xGradient.pixels[iN], yGradient.pixels[iN]);
        var sMag = hypot(xGradient.pixels[iS], yGradient.pixels[iS]);
        var wMag = hypot(xGradient.pixels[iW], yGradient.pixels[iW]);
        var eMag = hypot(xGradient.pixels[iE], yGradient.pixels[iE]);
        var nwMag = hypot(xGradient.pixels[iNW], yGradient.pixels[iNW]);
        var neMag = hypot(xGradient.pixels[iNE], yGradient.pixels[iNE]);
        var swMag = hypot(xGradient.pixels[iSW], yGradient.pixels[iSW]);
        var seMag = hypot(xGradient.pixels[iSE], yGradient.pixels[iSE]);
        
        var tmp;
        //return gradMag;
        if(xGrad * yGrad <= 0) {
            if(Math.abs(xGrad) >= Math.abs(yGrad)) {
                tmp = Math.abs(xGrad * gradMag);
                if(tmp < Math.abs(yGrad * neMag - (xGrad + yGrad) * eMag) ||
                    tmp <= Math.abs(yGrad * swMag - (xGrad + yGrad) * wMag))
                    return 0;
            }else{
                tmp = Math.abs(yGrad * gradMag);
                if(tmp < Math.abs(xGrad * neMag - (xGrad + yGrad) * nMag) ||
                    tmp <= Math.abs(xGrad * swMag - (xGrad + yGrad) * sMag))
                    return 0;
            }
        }else {
            if(Math.abs(xGrad) >= Math.abs(yGrad)) {
                tmp = Math.abs(xGrad * gradMag);
                if(tmp < Math.abs(yGrad * seMag + (xGrad - yGrad) * eMag) ||
                    tmp <= Math.abs(yGrad * nwMag + (xGrad - yGrad) * wMag))
                    return 0;
            }else {
                tmp = Math.abs(yGrad * gradMag);
                if(tmp < Math.abs(xGrad * seMag + (yGrad - xGrad) * sMag) ||
                    tmp <= Math.abs(xGrad * nwMag + (yGrad - xGrad) * nMag))
                    return 0;
            }
        }
        return gradMag * factor;
    }
    
    for(var y = 0; y < h; y++) {
        i = y * w;
        iN = Math.max(y - 1, 0) * w;
        iS = Math.min(y + 1, h - 1) * w;
        if(w == 1) {
            out[i] = processPixel(i, iN, iS, i, i,
                iN, iN, iS, iS);
        }else {
            out[i] = processPixel(i, iN, iS, i, i + 1,
                iN, iN + 1, iS, iS + 1);
            i++; iN++; iS++;
            for(var x = 0; x < w; x++) {
                out[i] = processPixel(i, iN, iS, i - 1, i + 1,
                    iN - 1, iN + 1, iS - 1, iS + 1);
                i++; iN++; iS++;
            }
            out[i] = processPixel(i, iN, iS, i - 1, i,
                iN - 1, iN, iS - 1, iS);
        }
    }
    
    return outImage;
}

function applyMorphologicalOperation(image, op, dest) {
    var w = image.w;
    var h = image.h;
    // FIXME: support small images?
    var p = image.pixels;
    if(!dest) {
        dest = new GrayscaleImage(w, h);
    }
    var out = dest.pixels;
    for(var y = 0; y < h; y++) {
        var i = y * w;
        var i1 = Math.max(0, y - 1) * w;
        var i2 = Math.min(h - 1, y + 1) * w;
        out[i] = op[(p[i1]?0x3:0x0) | (p[i1+1]?0x4:0x0) | 
                      (p[i]?0x18:0x0) | (p[i+1]?0x20:0x0) |
                      (p[i2]?0xc0:0x0) | (p[i2+1]?0x100:0x0)];
        
        out[i+w-1] = op[(p[i1]?0x6:0x0) | (p[i1-1]?0x1:0x0) | 
                          (p[i]?0x30:0x0) | (p[i-1]?0x8:0x0) |
                          (p[i2]?0x180:0x0) | (p[i2-1]?0x40:0x0)];
        i++; i1++; i2++;
        //actually x = 1, ..., w - 2
        for(var x = 2; x < w; x++) {
            out[i] = op[(p[i1-1]?0x1:0x0) | (p[i1]?0x2:0x0) | (p[i1+1]?0x4:0x0) | 
                          (p[i-1]?0x8:0x0) | (p[i]?0x10:0x0) | (p[i+1]?0x20:0x0) |
                          (p[i2-1]?0x40:0x0) | (p[i2]?0x80:0x0) | (p[i2+1]?0x100:0x0)];
            i++; i1++; i2++;
        }
    }
    return dest;
}

function colorToBinary(images, threshold, upper, lower) {
    var image = new GrayscaleImage(images[0].w, images[0].h);
    var pixels1 = images[0].pixels;
    var pixels2 = images[1].pixels;
    var pixels3 = images[2].pixels;
    var out = image.pixels;
    upper = upper || 255;
    lower = lower || 0;
    for(var i = image.w * image.h - 1; i >= 0; i--) {
        var v = pixels1[i] + pixels2[i] + pixels3[i];
        out[i] = v > threshold ? upper : lower;
    }
    return image;
}

var getThinningOperator1 = (function() {
    var cache = null;
    return function() {
        if(!cache) {
            cache = [];
            for(var i = 0; i < 512; i++) {
                if((i & 0x10) == 0) {
                    cache.push(0); continue;
                }
                if((i & ~0x10) == 0) {
                    cache.push(255); continue;
                }
                
                // 1 1  
                // 1 1 0
                //   0 0
                if((i & 0x2) << 6 == (i & 0x80) ||
                    (i & 0x8) << 2 == (i & 0x20)) {
                    cache.push(255);
                    continue;
                }
                if(i & 0x2) {
                    if(i & 0x20) {
                        if((i & 0x40) != 0 || (i & 0x4) == 0) {
                            cache.push(255);
                             continue;
                        }
                    }else {
                        if((i & 0x100) != 0 || (i & 0x1) == 0) {
                            cache.push(255);
                             continue;
                        }
                    }
                }else{
                    if(i & 0x20) {
                        if((i & 0x1) != 0 || (i & 0x100) == 0) {
                            cache.push(255);
                             continue;
                        }
                    }else {
                        if((i & 0x4) != 0 || (i & 0x40) == 0) {
                            cache.push(255);
                             continue;
                        }
                    }
                }
                cache.push(0);
            }
        }
        return cache;
    };
})();

var getThinningOperator2 = (function() {
    var cache = null;
    return function() {
        if(!cache) {
            cache = [];
            for(var i = 0; i < 512; i++) {
                if((i & 0x10) == 0) {
                    cache.push(0); continue;
                }
                // 1 1 1
                //   1 
                // 0 0 0
                if((i & 0x7) == 0x0 && (i & 0x1c0) == 0x1c0) {
                    cache[i] = 0; continue;
                }
                if((i & 0x49) == 0 && (i & 0x124) == 0x124) {
                    cache[i] = 0; continue;
                }
                cache[i] = 255; continue;
            }
        }
        return cache;
    };
})();

var getThinningOperator3 = (function() {
    var cache = null;
    return function() {
        if(!cache) {
            cache = [];
            for(var i = 0; i < 512; i++) {
                if((i & 0x10) == 0) {
                    cache.push(0); continue;
                }
                // 1 1 1
                //   1 
                // 0 0 0
                if((i & 0x7) == 0x7 && (i & 0x1c0) == 0) {
                    cache[i] = 0; continue;
                }
                if((i & 0x49) == 0x49 && (i & 0x124) == 0) {
                    cache[i] = 0; continue;
                }
                cache[i] = 255; continue;
            }
        }
        return cache;
    };
})();


var getPruningOperator = (function() {
    var cache = null;
    function hogehoge(bits) {
        var first = 0;
        for(var i = 0; i < 8; i++) {
            if(bits & (1 << i)) {
                first = i;
                break;
            }
        }
        if(first == 0) {
            for(i = 7; i >= 0; i--) {
                if(bits & (1 << i)) {
                    first = i;
                }else{
                    break;
                }
            }
        }
        if(i == 8)
            throw "hogehoge failed!";
        var cnt = 0, cnt2 = 0;
        var old = false;
        for(i = 0; i < 8; i++) {
            var k = (i + first) & 7;
            var vl = (bits & (1 << k)) != 0;
            if(vl) cnt2++;
            if(vl != old) {
                if(vl) {
                    cnt++;
                }
                old = vl;
            }
        }
        return [cnt,cnt2];
    }
    return function() {
        if(!cache) {
            cache = [];
            for(var i = 0; i < 512; i++) {
                if((i & 0x10) == 0) {
                    cache.push(0); continue;
                }
                if((i & ~0x10) == 0x1ef) {
                    cache.push(0); continue;
                }
                if((i & ~0x10) == 0) {
                    cache.push(0); continue;
                }
                if((i&0xba) == 0xba) {
                    cache.push(0); continue;
                }
                
                var hparam = i & 0x7;
                hparam |= (i & 0x20) ? 0x8 : 0;
                hparam |= (i & 0x100) ? 0x10 : 0;
                hparam |= (i & 0x80) ? 0x20 : 0;
                hparam |= (i & 0x40) ? 0x40 : 0;
                hparam |= (i & 0x8) ? 0x80 : 0;
                
                var cnt = hogehoge(hparam);
                if(cnt[1] == 1){
                    cache.push(0); continue;
                } else if(cnt[1] == 2 && cnt[0] == 1){
                    cache.push(0); continue;
                }
                
                cache.push(255);
            }
        }
        return cache;
    };
})();


var getDilatingOperator = (function() {
    var cache = null;
    
    return function() {
        if(!cache) {
            cache = [];
            for(var i = 0; i < 512; i++) {
                cache.push((i != 0) ? 255 : 0);
            }
        }
        return cache;
    };
})();

var applyThinning = (function() {
    var thinCount = 0;
    return function(image, limit) {
        var other = null, other2 = null;
        var op1 = getThinningOperator1();
        var op2 = getThinningOperator2();
        var op3 = getThinningOperator3();
        do {
            thinCount++;
            other = applyMorphologicalOperation(image, op1, other);
            other2 = applyMorphologicalOperation(other, op2, other2);
            other = applyMorphologicalOperation(other2, op3, other);
            var tmp = other;
            other = image;
            image = tmp;
        } while((limit--) > 0 && !image.equals(other));
        return [image, limit < 0];
    }
})();

function binaryImageToLines(image) {
    var lines = [];
    var w = image.w;
    var h = image.h;
    var p = image.pixels;
    function trace(x, y) {
        var points = [];
        while(true){
            if(p[x + y * w]) {
                points.push(x); points.push(y); p[x + y * w] = 0;
            }else if(x > 0 && p[(x - 1) + y * w]) {
                points.push(--x); points.push(y); p[x + y * w] = 0;
            }else if(y > 0 && p[x + (y - 1) * w]) {
                points.push(x); points.push(--y); p[x + y * w] = 0;
            }else if(x < w - 1 && p[(x + 1) + y * w]) {
                points.push(++x); points.push(y); p[x + y * w] = 0;
            }else if(y < h - 1 && p[x + (y + 1) * w]) {
                points.push(x); points.push(++y); p[x + y * w] = 0;
            }else if(x > 0 && y > 0 && p[(x - 1) + (y - 1) * w]) {
                points.push(--x); points.push(--y); p[x + y * w] = 0;
            }else if(x < w - 1 && y > 0 && p[(x + 1) + (y - 1) * w]) {
                points.push(++x); points.push(--y); p[x + y * w] = 0;
            }else if(x > 0 && y < h - 1 && p[(x - 1) + (y + 1) * w]) {
                points.push(--x); points.push(++y); p[x + y * w] = 0;
            }else if(x < w - 1 && y < h - 1 && p[(x + 1) + (y + 1) * w]) {
                points.push(++x); points.push(++y); p[x + y * w] = 0;
            }else{
                break;
            }
        }
        return points;
    }
    function forceCloseLine(line) {
        var size = line.length;
        for(var i = 2; i < size; i += 2) {
            line.push(line[size - i]);
            line.push(line[size - i + 1]);
        }
    }
    for(var y = 0; y < h; y++){
        for(var x = 0; x < w; x++) {
            if(p[x + y * w]) {
                var pts = trace(x, y);
                // find another end
                var pts2 = trace(x, y);
                for(var i = 0, j = pts2.length - 2; i < j; i+=2, j-=2) {
                    var k = pts2[i]; pts2[i] = pts2[j]; pts2[j] = k;
                    k = pts2[i+1]; pts2[i+1] = pts2[j+1]; pts2[j+1] = k;
                }
                pts = pts2.concat(pts);
                if(pts.length > 1){
                    
                    // check closed
                    var dx = pts[0] - pts[pts.length - 2];
                    var dy = pts[1] - pts[pts.length - 1];
                    if(dx*dx+dy*dy > 3) {
                        forceCloseLine(pts);
                    }
                    
                    lines.push(pts);
                }
            }
        }
    }
    return lines;
}


function fftLine(line) {
    
    function downSampleLine(line, count) {
        if(count * 2 >= line.length)
            return line;
        var newLine = [];
        var cnt = line.length >> 1;
        // TODO: better algorithm to reduce error
        for(var i = 0; i < count; i++) {
            var j = Math.floor(i * cnt / count) * 2;
            newLine.push(line[j]);
            newLine.push(line[j + 1]);
        }
        return newLine;
    }

    function convertToFftArrays(line) {
        var real1 = [];
        var imag1 = [];
        var real2 = [];
        var imag2 = [];
        for(var i = 0; i < line.length; i+= 2) {
            real1.push(line[i]);
            imag1.push(0);
            real2.push(line[i+1]);
            imag2.push(0);
        }
        return [real1, imag1, real2, imag2];
    }
    var len = 1;
    while(len < (line.length >> 1)) len <<= 1;
    len >>= 1;
    line = downSampleLine(line, len);
    line = convertToFftArrays(line);
    transform(line[0], line[1]);
    transform(line[2], line[3]);
    // real FFT - we don't need the second half part'
    line[0] = line[0].slice(0,(len >> 1) + 1);
    line[1] = line[1].slice(0,(len >> 1) + 1);
    line[2] = line[2].slice(0,(len >> 1) + 1);
    line[3] = line[3].slice(0,(len >> 1) + 1);
    return line;
}

function truncateFftLine(line, size) {
    Utils.map(line, function(arr) {
        for(var i = size; i < arr.length; i++)
            arr[i] = 0;
    });
    if(line.length != 4)
        throw "invalid line!";
    return line;
}

function ifftLine(line) {
    function generateNegativeFreq(real, imag) {
        var size = real.length - 1;
        for(var i = 1; i < size; i++) {
            real.push(real[size - i]);
            imag.push(-imag[size - i]);
        }
    }
    generateNegativeFreq(line[0], line[1]);
    generateNegativeFreq(line[2], line[3]);
    
    inverseTransform(line[0], line[1]);
    inverseTransform(line[2], line[3]);
    
    var outLine = [];
    var real1 = line[0];
    var real2 = line[2];
    var factor = 1/real1.length;
    for(var i = 0; i < real1.length; i++) {
        outLine.push(real1[i]*factor);
        outLine.push(real2[i]*factor);
    }
    return outLine;
}

var processSession = 1;
var needsUpdate = false;
var updateFunc = null;
var outputFormat = 'png';
var useColor = true;

function runProcess(img) {
    processSession++;
    var curSession = processSession;
    
    function checkCancel() {
        if(curSession != processSession){
            //reportProgress(1, "キャンセルされました");
            return true;
        }
        return false;
    }
    
    function reportProgress(per, text) {
        $('#progressBar').css('width', String(per * 100) + '%');
        if(text)
            $('#statusText').text(text);
    }
    
    var width = img.width;
    var height = img.height;
    
    // rescale image to make it not too large
    var scale = 512 / Math.max(512, Math.max(width, height));
    width *= scale; height *= scale;
    width = Math.ceil(width);
    height = Math.ceil(height);
    
    var canvas = $('#canvas').get(0);
    var ctx = canvas.getContext('2d');
    
    canvas.width = width;
    canvas.height = height;
    
    updateFunc = null;
    
    var data, images, image;
    
    // debug output
    function setFinal(v, omitSetImage){
        if(v){
            $('#image').show();
            $('#canvas').hide();
            if(!omitSetImage)
                $('#image').attr('src', canvas.toDataURL());
        }else{
            $('#image').hide();
            $('#canvas').show();
        }
    }
    
    function output(im, isFinal) {
        var data = GrayscaleImage.createImageData([im,im,im], ctx,
            function(v){return Math.max(Math.min(255-v, 255),0);});
        ctx.putImageData(data, 0, 0);
        setFinal(isFinal);
    }

    function outputLine(lines, isFinal) {
        function rcc() {
            return Math.floor(Math.random() * 160);
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 512, 512);
        var colored = useColor;
        for(var i = 0; i < lines.length; i++) {
            var line = lines[i];
            ctx.beginPath();
            for(var j = 0; j < line.length; j += 2) {
                if(j == 0) ctx.moveTo(line[j], line[j+1]);
                else ctx.lineTo(line[j], line[j+1]);
            }
            if(colored){
                ctx.strokeStyle = "rgb("+rcc()+","+rcc()+","+rcc()+")";
                
            }else{
                ctx.strokeStyle = "black";
            }
            ctx.closePath();
            ctx.stroke();
        }
        setFinal(isFinal);
    }
    
    function outputSvgLine(lines) {
        function rcc() {
            return Math.floor(Math.random() * 160);
        }
        
        setFinal(true, true);
        var colored = useColor;
        var str = ['<?xml version="1.0" standalone="no"?>'];
        str.push('<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" '); 
        str.push('"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">');
        str.push('<svg xmlns="http://www.w3.org/2000/svg" version="1.1" ');
        str.push('width="' + width + '" height="' + height + '">');
        str.push('<g stroke="black" stroke-linecap="round" stroke-linejoin="round" ');
        str.push('fill="transparent">');
        for(var i = 0; i < lines.length; i++) {
            var line = lines[i];
            str.push('<polygon points="');
            for(var j = 0; j < line.length; j += 2) {
                str.push(line[j]);
                str.push(','); str.push(line[j+1]);
                str.push(' ');
            }
            str.push('" ');
            if(colored){
                str.push('stroke="rgb('+rcc()+','+rcc()+','+rcc()+')" ');
            }
            str.push(' />');
        }
        str.push('</g>');
        str.push('</svg>');
        
        var base64Txt = ['data:image/svg+xml;utf8,'];
        base64Txt.push(str.join(''));
        
        $('#image').attr('src', base64Txt.join(''));
    }
    
    reportProgress(0, "画像を読み込み中...");
    setTimeout(acquireImage, 100);
    
    function acquireImage() {
        if(checkCancel()) return;
        ctx.drawImage(img, 0, 0, width, height);
        data = ctx.getImageData(0, 0, width, height);
        images = GrayscaleImage.fromImageData(data);
        
        reportProgress(0.1, "輪郭抽出中...");
        setTimeout(detectEdge, 100);
    }

    function detectEdge() {
        if(checkCancel()) return;
        
        images = Utils.map(images, function(image) {
            //return image;
            return edgeDetect(image);
        });
        
        reportProgress(0.5, "しきい値処理中...");
        setTimeout(applyThreshold, 100);
    }

    function applyThreshold() {
        if(checkCancel()) return;
        
        image = colorToBinary(images, 20); 
        
        reportProgress(0.6, "細線化処理中...");
        setTimeout(doThinning, 100);
    }

    function doThinning() {
        if(checkCancel()) return;
        
        var f;
        var stp = 0;

        output(image);

        f = function() {
            stp++;
            reportProgress(0.6 + Math.min(10,stp)/10*0.1);
            var ret = applyThinning(image, 1);
            if(ret[1]) {
                // continue
                image = ret[0];
                setTimeout(f, 50);
            }else{
                image = applyMorphologicalOperation(image, getPruningOperator());
                reportProgress(0.7, "ベクトル化中...");
                setTimeout(vectorize, 100);
                return;
            }
            output(image);
        };
        setTimeout(f, 50);
    }

    var lines, wetLines;
    function vectorize() {
        if(checkCancel()) return;
        
        lines = binaryImageToLines(image);
        outputLine(lines);
        reportProgress(0.8, "フーリエ級数を計算中...");
        setTimeout(doFFT, 100);
    }

    var numEqs;
    function doFFT() {
        if(checkCancel()) return;
        
        wetLines = [];
        numEqs = $('#numEqs').slider('value');
        numEqs = Math.floor(numEqs + 0.5);
        for(var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if(line.length < 16) continue; // too short!
            line = fftLine(line);
            line = truncateFftLine(line, numEqs + 1);
            line = ifftLine(line);
            wetLines.push(line);
        }
        needsUpdate = false;
        
        //window.status = "generated " + lines.length + " curve(s)";
        reportProgress(0.9, "描画中...");
        setTimeout(doOutput, 100);
    }
    
    function doOutput() {
        if(checkCancel()) return;
        if(outputFormat == 'svg')
            outputSvgLine(wetLines);
        else
            outputLine(wetLines, true);
        reportProgress(1, "完了 (" + numEqs + "次フーリエ級数 × " + wetLines.length + "本)");
        if(needsUpdate) {
            reportProgress(0.8, "フーリエ級数を計算中...");
            setTimeout(doFFT, 50);
        }else{
            updateFunc = function(){
                reportProgress(0.8, "フーリエ級数を計算中...");
                setTimeout(doFFT, 50);
            };
        }
    }
}

var currentImage = null;
$(function() {
    var im = new Image();
    currentImage = im;
    im.onload = function() {
        runProcess(im);
    };
    im.src = "test.jpg";
    
    $('#numEqs').slider({
        value: 16,min:1,max:32,
        change: function(){
            needsUpdate = true;
            $('#numEqsLabel').text($('#numEqs').slider('value'));
            if(updateFunc != null)
                updateFunc();
        }
    });
    
    $('#pngOption').change(function() {
        needsUpdate = true;
        outputFormat = 'png';
        if(updateFunc != null)
            updateFunc();
    });
    $('#svgOption').change(function() {
        needsUpdate = true;
        outputFormat = 'svg';
        if(updateFunc != null)
            updateFunc();
    });
    $('#useColor').change(function() {
        needsUpdate = true;
        useColor = $('#useColor').is(':checked');
        if(updateFunc != null)
            updateFunc();
    });
    
    // check file API support
    if(window.File && window.FileReader && window.FileList && window.Blob) {
        var uploader = $('#uploader');
        $('#uploadButton').click(function(){
            uploader.click();
        });
        
        uploader.bind('change', function(e){
            var files = uploader.get(0).files;
            var file = files[0];
            if(!file) return;
            if(file.size > 32 * 1024 * 1024) {
                alert("ファイルが大きすぎます。");
                return;
            }
            var reader = new FileReader();
            reader.onload = function(e) {
                var im = new Image();
                currentImage = im;
                im.onload = function() {
                    runProcess(im);
                };
                im.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
        
    }else{
        $('#uploadButton').attr('disabled', 'disabled');
        $('#notSupportedAlert').show();
    }
});



