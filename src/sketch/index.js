export default function sketch(p5) {
    let x, y, backgroundColor;
    var width;
    var height;

    var MAX_N = 1;

    // The number of coils in the spiral
    var COILS = 10;
    // The distance between points
    const CHORD = 20;
    // The radius of a point on the spiral.
    const POINT_RADIUS = 10;
    // The radius of the spiral
    var SPIRAL_RADIUS = 450;
    // The rotation of the spiral in radians
    var ROTATION = -Math.PI / 2;
    // The value of theta corresponding to the end of the last coil
    var THETA_MAX = COILS * 2 * Math.PI;
    // How far to step away on each side from the centre
    var AWAY_STEP = (SPIRAL_RADIUS / THETA_MAX) * 0.5; 
    // The direction of the spiral (either +1 or -1).
    const DIRECTION = -1;

    p5.setup = () => {
        // Initialize the window dimension variables
        p5.windowResized();
        p5.createCanvas(width, height);
    };

    const COOLDOWN = 500;
    var lastTime = 0;

    p5.draw = () => {
        p5.background(p5.color(0, 0, 0));

        // Wait to begin the animation...
        if (p5.millis() >= lastTime + COOLDOWN)
        {
            lastTime = p5.millis();
            MAX_N += 1;
        }

        COILS = Math.sqrt(MAX_N);
        // SPIRAL_RADIUS = 450 * Math.sqrt(MAX_N);
        THETA_MAX = COILS * 2 * Math.PI;
        AWAY_STEP = (SPIRAL_RADIUS / THETA_MAX) * 0.5; 

        p5.translate((width - POINT_RADIUS) / 2, (height - POINT_RADIUS) / 2);
        p5.scale(1);

        var count = 0;
        for (var theta = CHORD / AWAY_STEP; theta <= THETA_MAX && count < MAX_N; ++count)
        {
            var away = AWAY_STEP * theta;
            var around = DIRECTION * theta + ROTATION;
            var x = Math.cos(around) * away;
            var y = Math.sin(around) * away;

            p5.noStroke();
            p5.fill(p5.color(255, 255, 255));
            p5.circle(x, y, POINT_RADIUS);

            theta += CHORD / away;
        }
    };

    p5.windowResized = () => {
        width = window.innerWidth;
        height = window.innerHeight;    
        p5.createCanvas(width, height);
    }
}
