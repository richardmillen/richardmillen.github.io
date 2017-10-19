"use strict";

START_POS = {
    Column: 14,
    Row: 7
}
Object.freeze(START_POS);

FINISH_POS = {
    Column: 0,
    Row: 2
}
Object.freeze(FINISH_POS);

MapFeature = {
    Wall: 1,
    Path: 2,
    Start: 5,
    Finish: 8
}
Object.freeze(MapPos);

function makeMaze(width, height) {
    var mazeMap = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1],
        [8, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 1],
        [1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 1],
        [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 0, 1],
        [1, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 5],
        [1, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ];
    return new Map(mazeMap, width, height);
}

function emptyMap(width, height) {
    var map = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ];
    return new Map(map, width, height);
}

function Map(points) {
    var _points = points;

    Object.defineProperties(this, {
        height: {
            get: function() {
                return _points.length;
            },
            enumerable: true,
            configurable: false
        },
        width: {
            get: function() {
                // IMPORTANT: we're assuming this check isn't necessary here
                //return _points.length > 0 ? _points[0].length : 0;
                return _points[0].length;
            },
            enumerable: true,
            configurable: false
        }
    });

    /* canMoveTo checks that it's possible to
     * move to the specified row/column in the map.
     * 1) does array bounds checking.
     * 2. checks for collisions. */
    this.canMoveTo = function(row, column) {
        if (row < 0 || row >= this.height)
            return false;
        if (column < 0 || column >= this.width)
            return false;
        
        if (_points[row][column] == MapFeature.Wall)
            return false;
        
        return true;
    };

    /* moveTo sets the specified row/col position 
     * as a position along a path.
     * NOTE:
     * 'canMoveTo' should be called before 'moveTo'. */
    this.moveTo = function(row, column) {
        _points[row][column] = MapFeature.Path;
    };

    /* render draws whatever walls, paths etc
     * that exist in the map to a 2d context. */
    this.render = function(ctx, width, height) {
        var border = 20;

        ctx.strokeStyle = "red";
        ctx.lineWidth = 5;
        ctx.strokeRect(0, 0, width, height);

        var cellHeight = (height - border * 2) / this.height;
        var cellWidth = (width - border * 2) / this.width;

        for (var row = 0; row < this.height; row++) {
            for (var col = 0; col < this.width; col++) {
                var colour = null;
                switch (this._map[row][col]) {
                    case MapFeature.Wall:
                        colour = "black";
                        break;
                    case MapFeature.Path:
                        colour = "yellow";
                        break;
                    case MapFeature.Start:
                        colour = "green";
                        break;
                    case MapFeature.Finish:
                        colour = "orange"
                        break;
                }
                
                if (colour != null) {
                    ctx.fillStyle = colour;
                    ctx.fillRect(border + col * cellWidth, 
                        border + row * cellWidth,
                        cellWidth,
                        cellHeight);
                }
            }
        }
    };
};
