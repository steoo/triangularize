(function (window, document) {

    var $upload = document.querySelector("#uploadBtn"),
        $canvasContainer = document.querySelector("#canvas-container"),
        canvas = document.createElement('canvas'),
        context = canvas.getContext("2d");

    var colors = ["#1abc9c", "#2ecc71", "#f1c40f", "#e74c3c", "#2c3e50", "#bdc3c7", "#8e44ad"],
        nColors = colors.length,
        setColor = null; //se ne vogliamo settare uno da prima

    var dimensions = {
        width: 600,
        height: 600,
        delaunayWidth: 400,
        delaunayHeight: 400,
        brandLogoWidth: 64,
        brandLogoHeight: 64,
        borderMargin: 30,
        stroke: 4 //Lo spessore del bordo
    }
    /* Inserisco il canvas nel documento a fine pagina in un container */
    $canvasContainer.appendChild(canvas);

    $upload.addEventListener("change", drawCanvas, false);
    $(document).on("click", ".block-color", changeBackgroundColor);


    function rndmColor() {
        return setColor !== null ? setColor : colors[Math.floor(Math.random() * nColors)];
    }

    function drawBackground() {
        context.rect(0, 0, dimensions["width"], dimensions["height"])
        context.fillStyle = rndmColor();
        context.fill();
        return context;
    }

    function drawLogo() {
        var img = new Image(dimensions["brandLogoWidth"], dimensions["brandLogoHeight"]);
        img.src = "assets/img/logo64x64.jpg";
        img.onload = function () {
            var x = dimensions["width"] / 2 - dimensions["brandLogoWidth"] / 2; //posiziono al centro orizzontalmente
            var y = dimensions["height"] - dimensions["borderMargin"] - dimensions["brandLogoHeight"] - dimensions["stroke"] * 2 //posiziono in basso dal fondo
            context.drawImage(img, x, y, dimensions["brandLogoWidth"], dimensions["brandLogoHeight"]);
        }
        return this;
    }

    function drawBorder() {
        var dim = dimensions["width"] - (dimensions["borderMargin"] * 2);
        context.rect(dimensions["borderMargin"], dimensions["borderMargin"], dim, dim);
        context.lineWidth = dimensions["stroke"].toString();
        context.strokeStyle = "white";
        context.stroke();
    }

    function drawImage(src) {
        var img = new Image(dimensions["delaunayWidth"], dimensions["delaunayHeight"]);
        img.src = src;
        img.onload = function(){
            var x, y;
            x = dimensions["width"]/2 - dimensions["delaunayWidth"]/2;
            y = dimensions["borderMargin"] * 2 + dimensions["stroke"];
            context.drawImage(img, x, y, dimensions["delaunayWidth"], dimensions["delaunayHeight"]);
        }
    }

    function drawCanvas(e) {
        e.preventDefault();
        canvas.width = dimensions["width"];
        canvas.height = dimensions["height"];

        drawBackground();
        drawLogo();
        drawBorder();
        upload(e, function (file) {
            new Triangularize({
                imageToProcess: file,
                onCompleteCallback: drawImage,
                beforeGenerating: beforeGenerating,
                afterGenerating: afterGenerating
            });
        });
    }

    function upload(e, callback) {
        e.preventDefault();

        if (!window.FileReader) {
            console.error("File reader not supported");
            return;
        }

        /* Takes the file and set it when it's ready */
        var reader = new FileReader();
        reader.addEventListener('load', function(e) {
            //setSource(e.target.result);
            callback(e.target.result);
        }, false);
        reader.readAsDataURL(e.target.files[0]);
    }

    function changeBackgroundColor(e){
        var $target = $(e.target);
        $(".block-color.active").removeClass("active");
        $target.addClass("active");
        setColor = $target.data("color");
    }

    (function drawColors(){
        var i = 0, divs = "";
        for(; i<nColors; i++){
            var block = document.createElement("div");
            block.setAttribute("data-color", colors[i]);
            block.className = "block-color";
            block.style.backgroundColor = colors[i];
            divs += block.outerHTML;
        }
        document.querySelector("#colors").innerHTML = divs;
    })()

    function beforeGenerating(){
        console.log("Generating");
    }
    function afterGenerating(){
        console.log("After Generating");
    }

})(window, window.document)