// game.js
var game_settings = {
    fps:     15,  /* The game's framerate */
    cellw:   10,  /* Width of a cell. Snake pieces, food, and grid are based on these. Should divide into bwidth and bheight. */
    cellh:   10,  /* Height of a cell. */
    bwidth:  640, /* board width in pixels.  */
    bheight: 400, /* board height in pixels. */
    npieces: 10,  /* Number of pieces snake starts out with */
    scmode:  0,   /* Snake color mode. 0 = color moves with snake. 1 = "Chowder" effect. 2 = black/white */
};

var game = (function(args){
// private:
    var running = 1,
        fps = args.fps,
        snakep;

    function game_over(){
        draw.clear();
        draw.text(args.bwidth/2, args.bheight/2, "Game Over");
    }

    function loop(){
        draw.clear();
        snakep.run();
        if(running){
            setTimeout(loop, 1000 / fps);
        } else {
            game_over();
            return;
        }
    }

// public:
    var board = {
            width:  args.bwidth / args.cellw,
            height: args.bheight / args.cellh,
        },
        direction = {
            up:    0,
            right: 1,
            down:  2,
            left:  3,
        },
        cellw = args.cellw,
        cellh = args.cellh;

    function collision(e1, e2){
        return e1.x == e2.x && e1.y == e2.y;
    }

    function die(msg){
        console.error(msg);
        running = 0;
    }

    function main(){
        if(!draw || !snake || !food || !input){
            console.error("Error: some modules are missing");
            return;
        }

        draw.init(document.getElementById("canvas"), args.bwidth, args.bheight);
        input.init(document.getElementById("canvas"));
        snakep = snake.Snake(game.board.width / 2, game.board.height / 2, cellw, cellh, args.npieces);
        snake.color_mode = args.scmode;
        loop();
    }

    function rand(n){
        return parseInt(Math.random() * 1000000000) % n;
    }

    function randcolor(){
        var _keys = Object.keys(draw.color);
        return draw.color[_keys[rand(_keys.length)]];
    }

    return {
        //vars
        board:     board,
        direction: direction,
        cellw:     cellw,
        cellh:     cellh,
        //functions
        collision: collision,
        die:       die,
        main:      main,
        rand:      rand,
        randcolor: randcolor,
    };
})(game_settings);

//draw.js
var draw = (function(){
// private:
    var ctx,
        cwidth,
        cheight;

// public:
    var color = {
        red:    { r: 0xcc, g: 0x11, b: 0x00 },
        green:  { r: 0x00, g: 0xcc, b: 0x33 },
        blue:   { r: 0x00, g: 0x33, b: 0xcc },
        yellow: { r: 0xcc, g: 0xbb, b: 0x11 },
        violet: { r: 0xcc, g: 0x11, b: 0xbb },
        cyan:   { r: 0x11, g: 0xaa, b: 0xcc },
        black:  { r: 0x33, g: 0x33, b: 0x33 },
        white:  { r: 0xee, g: 0xee, b: 0xee },
    };

    function clear(){
        var bgcol = { r: 0x00, g: 0x00, b: 0x00 };
        rect(0, 0, cwidth, cheight, bgcol);
    }

    function entity(e, _color){
        if(_color && snake.color_mode == 0){ // color override
            rect(e.x * game.cellw, e.y * game.cellh, e.w, e.h, _color);
        } else if (snake.color_mode == 2){ // black/white
            rect(e.x * game.cellw, e.y * game.cellh, e.w, e.h, color.white);
        } else { // chowder effect
            rect(e.x * game.cellw, e.y * game.cellh, e.w, e.h, e.color);
        }
    }

    function init(canvas, width, height){
        ctx = canvas.getContext('2d');
        canvas.width = cwidth = width;
        canvas.height = cheight = height;
        console.log("Canvas is ready");
    }

    function rect(x, y, w, h, color){
        if(color){
            set_color(color);
        } else {
            ctx.fillStyle = "#000000";
        }
        ctx.fillRect(x, x, w, h);
    }

    function set_color(color){
        ctx.fillStyle = "rgb(" + color.r + "," + color.g + "," + color.b + ")";
    }

    function text(x, y, msg){
        set_color(color.white);
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.font = "bold 50px monospace";
        ctx.fillText(msg, x, y);
    }

    return {
        //vars
        color:     color,
        //functions
        clear:     clear,
        entity:    entity,
        init:      init,
        rect:      rect,
        set_color: set_color,
        text:      text,
    };
})();

//input.js
var input = (function(){
//private:
    var keysd = {};

    function listen(e){
        keysd[e.keyCode] = e.type == "keydown";
        return false;
    }

//public:
    var key = {
        up    : 38,
        right : 39,
        down  : 40,
        left  : 37,
        q     : 81,
    };

    function init(canvas){
        canvas.onkeydown = canvas.onkeyup = listen;
        canvas.tabIndex = 0;
    }

    function key_down(_key){
        if(keysd[_key]){
            keysd = {};
            return 1;
        } else{
            return 0;
        }
    }

    return {
        //vars
        key:      key,
        //functions
        init:     init,
        key_down: key_down,
    };
})();

//food.js
var food = (function(){
// public:
    function Food(w, h){
        //private:
        var _keys,
            _sel;

        //public:
        var x,
            y,
            w = w,
            h = h,
            color,

            _keys = Object.keys(draw.color);
        _sel = _keys[game.rand(_keys.length)];
        color = draw.color[_sel];

        x = game.rand(game.board.width);
        y = game.rand(game.board.height);

        return {
            x:     x,
            y:     y,
            w:     w,
            h:     h,
            color: color,
        };
    }

    return {
        Food: Food,
    };
})();

//snake.js
var snake = (function(){
//public:
    var color_mode = 0;

    function Snake_piece(x, y, w, h){
        // private:
        var _keys,
            _sel;

        // public:
        var x,
            y,
            w,
            h,
            color;

        _keys = Object.keys(draw.color);
        _sel = _keys[game.rand(_keys.length)];
        color = draw.color[_sel];

        return {
            x: x,
            y: y,
            w: w,
            h: h,
            color: color,
        };
    }

    function Snake(x, y, cellw, cellh, npieces){
        // private:
        var x = x,
            y = y,
            dir = game.rand(4),
            cellw = cellw,
            cellh = cellh,
            npieces = npieces,
            pieces = [],
            colors = [],
            _food = food.Food(cellw, cellh),
            i;

        for(i = 0; i < npieces; i++){
            pushl(Snake_piece(-1, -1, cellw, cellh));
            colors.push(game.randcolor());
        }

        function check_input(){
            var d_up = game.direction.up,
                d_dn = game.direction.down,
                d_rt = game.direction.right,
                d_lt = game.direction.left,
                k_up = input.key.up,
                k_dn = input.key.down,
                k_rt = input.key.right,
                k_lt = input.key.left,
                k_q  = input.key.q,
                isdn = input.key_down;

            if(isdn(k_up)){
                dir = (dir != d_dn) ? d_up : d_dn;
            } else if(isdn(k_dn)){
                dir = (dir != d_up) ? d_dn : d_up;
            } else if(isdn(k_lt)){
                dir = (dir != d_rt) ? d_lt : d_rt;
            } else if(isdn(k_rt)){
                dir = (dir != d_lt) ? d_rt : d_lt;
            } else if(isdn(k_q)){
                game.die("Thanks for playing.");
            }
        }

        function move(){
            var tmppc;

            switch(dir){
                case game.direction.up:
                    y--;
                    break;
                case game.direction.down:
                    y++;
                    break;
                case game.direction.left:
                    x--;
                    break;
                case game.direction.right:
                    x++;
                    break;
                default:
                    game.die("Error: Invalid direction");
                    return;
            }

            if(x < 0){
                x = game.board.width - 1;
            } else if(x >= game.board.width){
                x = 0;
            }

            if(y < 0){
                y = game.board.height - 1;
            } else if(y >= game.board.height){
                y = 0;
            }

            tmppc = popr();
            tmppc.x = x;
            tmppc.y = y;
            pushl(tmppc);
        }

        function popr(){
            return pieces.pop();
        }

        function pushl(piece){
            pieces.unshift(piece);
        }

        // public:
        function run(){
            var i;

            check_input();
            move();
            draw.entity(_food);
            for(i = 0; i < pieces.length; i++){
                draw.entity(pieces[i], colors[i]);
                if(game.collision(pieces[i], _food)){
                    _food = food.Food(cellw, cellh);
                    pushl(Snake_piece(-1, -1, cellw, cellh));
                    colors.push(game.randcolor());
                }
                if(game.collision(pieces[i], pieces[0]) && i > 1 && pieces[0].x != -1 && pieces[0].y != -1){
                    /* piece is touching head, it's not the head or neck, and they aren't outside of the screen (edge case/bugfix) */
                    game.die("You just ate yourself!");
                }
            }
        }

        return {
            run: run,
        };
    }

    return {
        color_mode:  color_mode,
        Snake:       Snake,
        Snake_piece: Snake_piece
    };
})();

game.main();
