export default function sketch(p5) {
    let x, y, backgroundColor;
    var width;
    var height;

    var MAX_N = 0;

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

        SPIRAL_RADIUS = Math.min(width, height);
    };

    const COOLDOWN = 100;
    var lastTime = 0;

    var previousPoints = [];
    var currentPoints = [];

    function lerpVector(a, b, t)
    {
        return p5.createVector(p5.lerp(a.x, b.x, t), p5.lerp(a.y, b.y, t), p5.lerp(a.z, b.z, t));
    }

    let scale = 10;

    p5.draw = () => {
        p5.background(p5.color(0, 0, 0));

        // Wait to begin the animation...
        if (p5.millis() >= lastTime + COOLDOWN)
        {
            lastTime = p5.millis();

            MAX_N += 1;

            previousPoints = [...currentPoints];
            currentPoints = [];

            var count = 0;
            for (var theta = CHORD / AWAY_STEP; theta <= THETA_MAX && count < MAX_N; ++count)
            {
                var away = AWAY_STEP * theta;
                var around = DIRECTION * theta + ROTATION;
                var x = Math.cos(around) * away;
                var y = Math.sin(around) * away;
    
                currentPoints.push(p5.createVector(x, y));     
                theta += CHORD / away;
            }

            console.log(currentPoints, previousPoints);
        }

        COILS = Math.sqrt(MAX_N + 10);
        SPIRAL_RADIUS = 450;
        THETA_MAX = COILS * 2 * Math.PI;
        AWAY_STEP = (SPIRAL_RADIUS / THETA_MAX) * 0.5; 

        p5.translate((width - POINT_RADIUS) / 2, (height - POINT_RADIUS) / 2);

        scale -= scale * 0.001;
        p5.scale(scale);

        for (var i = 0; i < currentPoints.length; ++i)
        {       
            const t = (p5.millis() - lastTime) / COOLDOWN;  
            let p;

            // We don't lerp the last point...
            if (i == currentPoints.length - 1)
            {
                continue;
            }
            else
            {
                p = lerpVector(previousPoints[i], currentPoints[i], t);            
            }
 
            p5.noStroke();
            p5.fill(p5.color(255, 255, 255));
            p5.circle(p.x, p.y, POINT_RADIUS);
        }
    };

    p5.windowResized = () => {
        width = window.innerWidth;
        height = window.innerHeight;    
        p5.createCanvas(width, height);
    }
}
