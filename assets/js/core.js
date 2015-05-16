// forked from akm2's "エッジ検出のテスト" http://jsdo.it/akm2/89lF

/*
* TODO: How to upload images?
*  1) Drop
*  2) Upload
* */

function Triangularize(options){
    "use strict";

    return this.init(options);
}

(function (window, document) {

    'use strict';

    // Configs

    // (int) 0~255
    var EDGE_DETECT_VALUE = 50;
    // (number)
    var POINT_RATE = 0.075;
    // (int) Number of maximux points
    var POINT_MAX_NUM = 2500;
    // (int) Size of the blur
    var BLUR_SIZE = 2;
    // (int)
    var EDGE_SIZE = 3;
    // (int)
    var PIXEL_LIMIT = 360000;

    var GENERAL_MESSAGE = 'Drop image to change source.';
    var GENERATIONG_MESSAGE = 'Generating...';

    var imagesUrl = "assets/img/img";

    // Default images, maybe to be removed
    var IMG_PRESETS = [];
    for(var i = 0; i<7; i++){
        IMG_PRESETS.push(imagesUrl+(i+1)+".jpg");
    }

    // Vars

    var image, source,
        canvas, context,
        //imageIndex = IMG_PRESETS.length * Math.random() | 0,
        imageIndex = 0,
        message,
        generating = true,
        timeoutId = null;

    var generateTime = 0;

    /* Shuffles the array of presets
     * Lo fa per cambiare l'immagine quando premi sul document.
     * */
/*    var imagePresets = (function(presets) {
        *//* Copia l'array *//*
        presets = presets.slice();
        var i = presets.length, j, t;
        while (i) {
            *//* Fa una OR di un numero random con 0  *//*
            j = Math.random() * i | 0;
            t = presets[--i];
            presets[i] = presets[j];
            presets[j] = t;
        }
        return presets;
    })(IMG_PRESETS);*/
    var imagePresets = [imagesUrl + "8.jpg"];
    var blur = (function(size) {
        var matrix = [];
        var side = size * 2 + 1;
        var i, len = side * side;
        for (i = 0; i < len; i++) matrix[i] = 1;
        return matrix;
    })(BLUR_SIZE);

    /*  Edge Array */
    var edge = (function(size) {
        var matrix = [];
        var side = size * 2 + 1;
        var i, len = side * side;
        var center = len * 0.5 | 0;
        for (i = 0; i < len; i++) matrix[i] = i === center ? -len + 1 : 1;
        return matrix;
    })(EDGE_SIZE);

    var _default = {
        imageSelector: "#output",
        imageToProcess: null,
        canvas: undefined,
        beforeGenerating: null,
        afterGenerating: null
    }

    /**
     * Init
     */
    //function init(options) {
    Triangularize.prototype.init = function (options) {
        var that = this;
        this.options = options !== undefined ?  _.extend({}, _default, options) : _.extend({}, _default);
        /* Create basic canvas */
        canvas = this.options.canvas || document.createElement('canvas');
        /* Save the current context of the canvas */
        context = canvas.getContext('2d');

        /* Select the image from the DOM. Passed as option to the plugin */
        image = document.querySelector(this.options.imageSelector); //was "output"
        /* Binding adjustImage to load event */
        image.addEventListener('load', adjustImage, false);

        /* Messaggio di caricamento,elaborazione, etc.
         * TODO: commento e sostituisco con delle callback di before e complete*/
        /*message = document.getElementById('message');
        message.innerHTML = GENERATIONG_MESSAGE;*/
        if(_.isFunction(this.options.beforeGenerating)){
            this.options.beforeGenerating();
        }

        /* TODO: da rimuovere */
        //document.addEventListener('click', documentClick, false);

        /*
        document.addEventListener('drop', documentDrop, false);
        var eventPreventDefault = function(e) { e.preventDefault(); };
        document.addEventListener('dragover', eventPreventDefault, false);
        document.addEventListener('dragleave', eventPreventDefault, false);
        */
        window.addEventListener('resize', adjustImage, false);

        source = new Image();
        //source.addEventListener('load', this.sourceLoadComplete, false);
        source.addEventListener('load', function() {
            that.sourceLoadComplete.call(that);
        }, false);
        //setSource(imagePresets[imageIndex]);
        if(this.options.imageToProcess !== null){
            this.setSource(this.options.imageToProcess);
        }

        return this;
    }

    /**
     * Document click event handler
     * Quando clicchi sul documento lui prende un'altra immagine
     * e genera un nuovo triangolamento
     * TODO: da rimuovere, feature inutile deve essere fatto solo ondemand
     */
    function documentClick(e) {
        /* Check if already generating */
        if (generating) return;

        //imageIndex = (imageIndex + 1) % imagePresets.length;
        //setSource(imagePresets[imageIndex]);
        setSource(imagePresets[0]);
    }

    /**
     * Document drop event handler
     */
    function documentDrop(e) {
        if (generating) return;

        e.preventDefault();

        if (!window.FileReader) {
            console.error("File reader not supported");
            return;
        }

        /* Takes the file and set it when it's ready */
        var reader = new FileReader();
        reader.addEventListener('load', function(e) {
            setSource(e.target.result);
        }, false);
        reader.readAsDataURL(e.dataTransfer.files[0]);
    }


    /**
     * Aggiusta l'immagine dandogli sempre dei valori interi
     * L' | 0 sta per una sorta di floor() -> cambiato in floor, era illegibile
     */
    function adjustImage() {
        image.removeAttribute('width');
        image.removeAttribute('height');
        var width  = image.width;
        var height = image.height;

        if (width > window.innerWidth || height > window.innerHeight) {
            var scale = Math.min(window.innerWidth / width, window.innerHeight / height);
            image.width  = width * scale | 0;
            image.height = height * scale | 0;
        }

        image.style.left = (window.innerWidth - image.width) / 2 | 0 + 'px';
        image.style.top  = (window.innerHeight - image.height) / 2 | 0 + 'px';
    }

    /* Setta la sorgente dell'immagine
     *
     * @param {String} URL or data
     */
    Triangularize.prototype.setSource = function (src) {
        /* TODO: sostituire con un bel loader */
        generating = true;
        //message.innerHTML = GENERATIONG_MESSAGE;

        /* Se cambia la src, rimuovo width, height e cambio src */
        if (source.src !== src) {
            source.removeAttribute('width');
            source.removeAttribute('height');
            source.src = src;
        } else {
            /* Vado a completare il sourceLoad */
            this.sourceLoadComplete(null);
        }
    }

    /**
     * Source load event handler
     *
     * @see setSource()
     */
    Triangularize.prototype.sourceLoadComplete = function(e) {
        var width  = source.width;
        var height = source.height;
        var pixelNum = width * height;
        var that = this;
        if (pixelNum > PIXEL_LIMIT) {
            var scale = Math.sqrt(PIXEL_LIMIT / pixelNum);
            source.width  = width * scale | 0;
            source.height = height * scale | 0;

            // Log
            console.log('Source resizing ' + width + 'px x ' + height + 'px' + ' -> ' + source.width + 'px x ' + source.height + 'px');
        }

        if (timeoutId) clearTimeout(timeoutId);
        generateTime = new Date().getTime();
        console.log('Generate start...');
        timeoutId = setTimeout(function(){
            generate.call(that);
        }, 0);
    }

    /**
     * Genera l'immagine triangolarizzata
     */
    function generate() {
        /* Setto le dimensioni uguali alla dimensione del canvas e source */
        var width  = canvas.width = source.width;
        var height = canvas.height = source.height;

        /* Scrive l'immagine sul canvas */
        context.drawImage(source, 0, 0, width, height);

        /* Recupera dati immagine e colori */
        var imageData = context.getImageData(0, 0, width, height);
        /*
        *   Is a Uint8ClampedArray representing a one-dimensional array containing the data in the RGBA order,
        *   with integer values between 0 and 255 (included).
        *   https://developer.mozilla.org/en-US/docs/Web/API/ImageData
        * */
        var colorData = context.getImageData(0, 0, width, height).data;

        /* Applico dei filtri all'immagine */
        Filter.grayscaleFilterR(imageData);
        Filter.convolutionFilterR(blur, imageData, blur.length);
        Filter.convolutionFilterR(edge, imageData);

        // Rileva bordo
        var temp = getEdgePoint(imageData);
        // Salvo la lunghezza della matrice
        var detectionNum = temp.length;

        var points = [];
        var i = 0, ilen = temp.length;
        var tlen = ilen;
        var j, limit = Math.round(ilen * POINT_RATE);
        if (limit > POINT_MAX_NUM) limit = POINT_MAX_NUM;

        // Floor dei punti
        while (i < limit && i < ilen) {
            j = tlen * Math.random() | 0;
            points.push(temp[j]);
            temp.splice(j, 1);
            tlen--;
            i++;
        }

        // Triangolazione
        var delaunay = new Delaunay(width, height);
        var triangles = delaunay.insert(points).getTriangles();

        var t, p0, p1, p2, cx, cy;

        // Scrive i triangoli
        for (ilen = triangles.length, i = 0; i < ilen; i++) {
            t = triangles[i];
            p0 = t.nodes[0]; p1 = t.nodes[1]; p2 = t.nodes[2];

            context.beginPath();
            context.moveTo(p0.x, p0.y);
            context.lineTo(p1.x, p1.y);
            context.lineTo(p2.x, p2.y);
            context.lineTo(p0.x, p0.y);

            // Riempire triangolo nel colore della coordinata ottenendo il baricentro
            cx = (p0.x + p1.x + p2.x) * 0.33333;
            cy = (p0.y + p1.y + p2.y) * 0.33333;

            j = ((cx | 0) + (cy | 0) * width) << 2;

            context.fillStyle = 'rgb(' + colorData[j] + ', ' + colorData[j + 1] + ', ' + colorData[j + 2] + ')';
            context.fill();
        }

        /* Mette il canvas nell'immagine */
        //image.src = canvas.toDataURL('image/png');

        /* Faccio eseguire la callback con l'immagine che è appena stata creata, piuttosto che metterla
         * nell'immagine selezionata */
        this.options.onCompleteCallback(canvas.toDataURL('image/png'));

        // Log del tempo impiegato
        generateTime = new Date().getTime() - generateTime;
        console.log(
            'Generate completed ' + generateTime + 'ms, ' +
            points.length + ' points (out of ' + detectionNum + ' points, ' + (points.length / detectionNum * 100).toFixed(2) + ' %), ' +
            triangles.length + ' triangles'
        );

        // Generazione completata
        generating = false;
        //message.innerHTML = GENERAL_MESSAGE;
        if(_.isFunction(this.options.afterGenerating)){
            this.options.afterGenerating();
        }
    }

    /**
     * Prende i punti del bordo
     *
     * @param imageData L'immagin da cui rilevare il bordo ImageData
     * @return Matrice di punti sul bordo
     * @see EDGE_DETECT_VALUE Leggerezza del valore medio del bordo con matrice 3x3
     */
    function getEdgePoint(imageData) {
        var width  = imageData.width;
        var height = imageData.height;
        var data = imageData.data;

        var E = EDGE_DETECT_VALUE; // local copy

        var points = [];
        var x, y, row, col, sx, sy, step, sum, total;

        for (y = 0; y < height; y++) {
            for (x = 0; x < width; x++) {
                sum = total = 0;

                for (row = -1; row <= 1; row++) {
                    sy = y + row;
                    step = sy * width;
                    if (sy >= 0 && sy < height) {
                        for (col = -1; col <= 1; col++) {
                            sx = x + col;

                            if (sx >= 0 && sx < width) {
                                sum += data[(sx + step) << 2];
                                total++;
                            }
                        }
                    }
                }

                if (total) sum /= total;
                if (sum > E) points.push(new Array(x, y));
            }
        }

        return points;
    }


    /**
     * Filter
     */
    var Filter = {

        /* Filtro scala di grigio per il canale red
         * TODO: Da capire cosa faccia
         * * */
        grayscaleFilterR: function (imageData) {
            var width  = imageData.width | 0;
            var height = imageData.height | 0;
            var data = imageData.data;

            var x, y;
            var i, step;
            var r, g, b;

            /* Scorre immagine in altezza */
            for (y = 0; y < height; y++) {
                /* Prende un passo pari a y * larghezza dell'immagine */
                step = y * width;

                for (x = 0; x < width; x++) {
                    i = (x + step) << 2;
                    r = data[i];
                    g = data[i + 1];
                    b = data[i + 2];

                    data[i] = (Math.max(r, g, b) + Math.min(r, g, b)) >> 2;
                }
            }

            return imageData;
        },

        /**
         * Filtro di convoluzione per canale rosso
         *
         * @see http://jsdo.it/akm2/iMsL
         */
        convolutionFilterR: function(matrix, imageData, divisor) {
            matrix  = matrix.slice();
            divisor = divisor || 1;

            /* Divisore per la matrice */
            var divscalar = divisor ? 1 / divisor : 0;
            var k, len;
            if (divscalar !== 1) {
                for (k = 0, len = matrix.length; k < matrix.length; k++) {
                    matrix[k] *= divscalar;
                }
            }

            var data = imageData.data;

            len = data.length >> 2;
            var copy = new Uint8Array(len);
            for (i = 0; i < len; i++) copy[i] = data[i << 2];

            var width  = imageData.width | 0;
            var height = imageData.height | 0;
            var size  = Math.sqrt(matrix.length);
            var range = size * 0.5 | 0;

            var x, y;
            var r, g, b, v;
            var col, row, sx, sy;
            var i, istep, jstep, kstep;

            for (y = 0; y < height; y++) {
                istep = y * width;

                for (x = 0; x < width; x++) {
                    r = g = b = 0;

                    for (row = -range; row <= range; row++) {
                        sy = y + row;
                        jstep = sy * width;
                        kstep = (row + range) * size;

                        if (sy >= 0 && sy < height) {
                            for (col = -range; col <= range; col++) {
                                sx = x + col;

                                if (
                                    sx >= 0 && sx < width &&
                                    (v = matrix[(col + range) + kstep])
                                ) {
                                    r += copy[sx + jstep] * v;
                                }
                            }
                        }
                    }

                    if (r < 0) r = 0; else if (r > 255) r = 255;

                    data[(x + istep) << 2] = r & 0xFF;
                }
            }

            return imageData;
        }
    };


    /**
     * Delaunay - Triangolazione
     *
     * @see http://jsdo.it/akm2/wTcC
     */
    var Delaunay = (function() {

        /**
         * Node
         *
         * @param {Number} x
         * @param {Number} y
         * @param {Number} id
         */
        function Node(x, y, id) {
            this.x = x;
            this.y = y;
            this.id = !isNaN(id) && isFinite(id) ? id : null;
        }

        Node.prototype = {
            eq: function(p) {
                var dx = this.x - p.x;
                var dy = this.y - p.y;
                return (dx < 0 ? -dx : dx) < 0.0001 && (dy < 0 ? -dy : dy) < 0.0001;
            },

            toString: function() {
                return '(x: ' + this.x + ', y: ' + this.y + ')';
            }
        };

        /**
         * Edge
         *
         * @param {Node} p0
         * @param {Node} p1
         */
        function Edge(p0, p1) {
            this.nodes = [p0, p1];
        }

        Edge.prototype = {
            eq: function(edge) {
                var na = this.nodes,
                    nb = edge.nodes;
                var na0 = na[0], na1 = na[1],
                    nb0 = nb[0], nb1 = nb[1];
                return (na0.eq(nb0) && na1.eq(nb1)) || (na0.eq(nb1) && na1.eq(nb0));
            }
        };

        /**
         * Triangle
         *
         * @param {Node} p0
         * @param {Node} p1
         * @param {Node} p2
         */
        function Triangle(p0, p1, p2) {
            this.nodes = [p0, p1, p2];
            this.edges = [new Edge(p0, p1), new Edge(p1, p2), new Edge(p2, p0)];

            // L'id non viene utilizzato
            this.id = null;

            // Vogliamo creare un cerchio circoscritto del triangolo

            var circle = this.circle = new Object();

            var ax = p1.x - p0.x, ay = p1.y - p0.y,
                bx = p2.x - p0.x, by = p2.y - p0.y,
                t = (p1.x * p1.x - p0.x * p0.x + p1.y * p1.y - p0.y * p0.y),
                u = (p2.x * p2.x - p0.x * p0.x + p2.y * p2.y - p0.y * p0.y);

            var s = 1 / (2 * (ax * by - ay * bx));

            circle.x = ((p2.y - p0.y) * t + (p0.y - p1.y) * u) * s;
            circle.y = ((p0.x - p2.x) * t + (p1.x - p0.x) * u) * s;

            var dx = p0.x - circle.x;
            var dy = p0.y - circle.y;
            circle.radiusSq = dx * dx + dy * dy;
        }


        /**
         * Delaunay
         *
         * @param {Number} width
         * @param {Number} height
         */
        function Delaunay(width, height) {
            this.width = width;
            this.height = height;

            this._triangles = null;

            this.clear();
        }

        Delaunay.prototype = {

            clear: function() {
                var p0 = new Node(0, 0);
                var p1 = new Node(this.width, 0);
                var p2 = new Node(this.width, this.height);
                var p3 = new Node(0, this.height);

                this._triangles = [
                    new Triangle(p0, p1, p2),
                    new Triangle(p0, p2, p3)
                ];

                return this;
            },

            insert: function(points) {
                var k, klen, i, ilen, j, jlen;
                var triangles, t, temps, edges, edge, polygon;
                var x, y, circle, dx, dy, distSq;

                for (k = 0, klen = points.length; k < klen; k++) {
                    //x = points[k][0]; //Default script
                    x = points[k][0];
                    y = points[k][1];

                    triangles = this._triangles;
                    temps = [];
                    edges = [];

                    for (ilen = triangles.length, i = 0; i < ilen; i++) {
                        t = triangles[i];

                        // Esaminare se le coordinate sono incluse nel cerchio circoscritto di triangolo
                        circle  = t.circle;
                        dx = circle.x - x;
                        dy = circle.y - y;
                        distSq = dx * dx + dy * dy;

                        if (distSq < circle.radiusSq) {
                            // Salva i lati di un triangolo ( se compreso nel cerchio )
                            edges.push(t.edges[0], t.edges[1], t.edges[2]);
                        } else {
                            // riporto se non sono inclusi
                            temps.push(t);
                        }
                    }

                    polygon = [];

                    // Verificare la presenza di parti duplicate, se si desidera duplicare cancello
                    edgesLoop: for (ilen = edges.length, i = 0; i < ilen; i++) {
                        edge = edges[i];

                        // Rimuovere e se duplicato confrontando i bordi
                        for (jlen = polygon.length, j = 0; j < jlen; j++) {
                            if (edge.eq(polygon[j])) {
                                polygon.splice(j, 1);
                                continue edgesLoop;
                            }
                        }

                        polygon.push(edge);
                    }

                    for (ilen = polygon.length, i = 0; i < ilen; i++) {
                        edge = polygon[i];
                        temps.push(new Triangle(edge.nodes[0], edge.nodes[1], new Node(x, y)));
                    }

                    this._triangles = temps;
                }

                return this;
            },

            getTriangles: function() {
                return this._triangles.slice();
            }
        };

        Delaunay.Node = Node;

        return Delaunay;

    })();

    (function rndmNumber () {
        var array = [], i = 0, k = 5;
        for(; i<k; i++){
            array.push(parseFloat(Math.ceil(Math.random()*10)/10));
        }
        return function () {
            return array[Math.ceil(Math.random()*10)];
        }
    })()
    /**
     * Point
     *
     * @super Delaunay.Node
     */
    function Point(x, y) {
        this.x = x;
        this.y = y;
        this.id = null;
    }

    Point.prototype = new Delaunay.Node();


    // Init
    //window.addEventListener('load', init, false);

    return Triangularize;

})(window, window.document);
