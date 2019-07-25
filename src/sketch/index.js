export default function sketch(p5) {
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
    // The direction of the spiral (either +1 or -1).
    const DIRECTION = -1;

    // The current number of points.
    var N = 0;

    const SCALE_CURVE_PERIODS = [
        { 
            initial: 10,
            target: 3,
            duration: 60000,
            curve: function (t) {
                return 1 - 1 / (1 + Math.pow(10 * t / 3, 9.4));
            },
            curveDomain: {
                start: 0,
                end: 1
            },
            curveDomainCutoff: 1
        },
        {
            initial: 3,
            target: 1,
            duration: 60000,
            curve: function (t) {
                return 3 * Math.pow(t, 2) - 2 * Math.pow(t, 3);
            },
            curveDomain: {
                start: 0,
                end: 1
            },
            curveDomainCutoff: 1
        }
    ]

    var scaleCurvePeriodIndex = 0;
    var scaleCurvePeriodTimeleft;

    const COOLDOWN_CURVE_PERIODS = [
        {
            initial: 500,
            target: 100,
            duration: 60000,
            curve: function(t) {
                return p5.lerp(0, 1, t);
            }
        },
        {
            initial: 100,
            target: 1,
            duration: 60000,
            curve: function(t) {
                return 3 * Math.pow(t, 2) - 2 * Math.pow(t, 3);
            }
        }
    ]

    // The current amount of time, in milliseconds, to wait between increment N.
    var currentCooldown;
    var cooldownCurvePeriodIndex = 0;
    var cooldownCurvePeriodTimeleft;

    var width;
    var height;

    var lastPointUpdateTime = 0;
    var previousPoints = [];
    var currentPoints = [];

    // Delta time calculation
    var deltaTime = 0;
    var lastFrameTime = 0;    

    p5.setup = () => {
        // Initialize the window dimension variables
        p5.windowResized();
        p5.createCanvas(width, height);

        SPIRAL_RADIUS = Math.min(width, height) * 0.5;
        
        scaleCurvePeriodTimeleft = SCALE_CURVE_PERIODS[0].duration;
        cooldownCurvePeriodTimeleft = COOLDOWN_CURVE_PERIODS[0].duration;
    };

    p5.draw = () => {
        p5.background(p5.color(0, 0, 0));
        updateDeltaTime();
        updateTransformations();
        updateCooldown();
        drawSpiral();
    };

    function updateDeltaTime()
    {
        const currentFrameTime = p5.millis();
        deltaTime = currentFrameTime - lastFrameTime;
        lastFrameTime = currentFrameTime;
    }

    function updateTransformations()
    {
        p5.translate((width - POINT_RADIUS) / 2, (height - POINT_RADIUS) / 2);

        // Calculate the scale
        var currentScale;
        if (scaleCurvePeriodIndex < SCALE_CURVE_PERIODS.length)
        {
            const currentScaleCurvePeriod = SCALE_CURVE_PERIODS[scaleCurvePeriodIndex];

            const t = currentScaleCurvePeriod.curveDomain.end - (scaleCurvePeriodTimeleft / currentScaleCurvePeriod.duration) * 
                (currentScaleCurvePeriod.curveDomain.end - currentScaleCurvePeriod.curveDomain.start);

            const interpolation = currentScaleCurvePeriod.curve(t);
            currentScale = currentScaleCurvePeriod.initial + (currentScaleCurvePeriod.target - currentScaleCurvePeriod.initial) * interpolation;
            scaleCurvePeriodTimeleft -= deltaTime;

            if (scaleCurvePeriodTimeleft <= 0 || t >= currentScaleCurvePeriod.curveDomainCutoff)
            {
                scaleCurvePeriodIndex++;
                if (scaleCurvePeriodIndex < SCALE_CURVE_PERIODS.length)
                {
                    scaleCurvePeriodTimeleft = SCALE_CURVE_PERIODS[scaleCurvePeriodIndex].duration;
                }
            }
        }
        else
        {
            currentScale = SCALE_CURVE_PERIODS[SCALE_CURVE_PERIODS.length - 1].target;
        }

        p5.scale(currentScale);
    }

    function updateCooldown()
    {
        if (cooldownCurvePeriodIndex < COOLDOWN_CURVE_PERIODS.length)
        {
            const currentCooldownCurvePeriod = COOLDOWN_CURVE_PERIODS[cooldownCurvePeriodIndex];
            const interpolation = currentCooldownCurvePeriod.curve(1 - cooldownCurvePeriodTimeleft / currentCooldownCurvePeriod.duration);
            
            currentCooldown = currentCooldownCurvePeriod.initial + (currentCooldownCurvePeriod.target - 
                currentCooldownCurvePeriod.initial) * interpolation;
            
            cooldownCurvePeriodTimeleft -= deltaTime;
            if (cooldownCurvePeriodTimeleft <= 0)
            {
                cooldownCurvePeriodIndex++;
                if (cooldownCurvePeriodIndex < COOLDOWN_CURVE_PERIODS.length)
                {
                    cooldownCurvePeriodTimeleft = COOLDOWN_CURVE_PERIODS[cooldownCurvePeriodIndex].duration;
                }
            }

            console.log(currentCooldown);
        }
        else
        {
            currentCooldown = COOLDOWN_CURVE_PERIODS[COOLDOWN_CURVE_PERIODS.length - 1].target;
        }
    }

    function drawSpiral()
    {
        if (p5.millis() >= lastPointUpdateTime + currentCooldown)
        {
            lastPointUpdateTime = p5.millis();

            N += 1;
            COILS = Math.sqrt(N + 10);

            previousPoints = [...currentPoints];
            currentPoints = [];

            // The value of theta corresponding to the end of the last coil
            var thetaMax = COILS * 2 * Math.PI;
            // How far to step away on each side from the centre
            var awayStep = SPIRAL_RADIUS / thetaMax; 

            var count = 0;
            for (var theta = CHORD / awayStep; theta <= thetaMax && count < N; ++count)
            {
                var away = awayStep * theta;
                var around = DIRECTION * theta + ROTATION;
                var x = Math.cos(around) * away;
                var y = Math.sin(around) * away;
    
                currentPoints.push(p5.createVector(x, y));     
                theta += CHORD / away;
            }
        }

        // Render the points
        for (var i = 0; i < currentPoints.length - 1; ++i)
        {
            const t = (p5.millis() - lastPointUpdateTime) / currentCooldown;           
            let p = lerpVector(previousPoints[i], currentPoints[i], t);
 
            p5.noStroke();
            p5.fill(p5.color(255, 255, 255));
            p5.circle(p.x, p.y, POINT_RADIUS);
        }
    }

    p5.windowResized = () => {
        width = window.innerWidth;
        height = window.innerHeight;    
        p5.createCanvas(width, height);
    }

    function lerpVector(a, b, t)
    {
        return p5.createVector(p5.lerp(a.x, b.x, t), p5.lerp(a.y, b.y, t), p5.lerp(a.z, b.z, t));
    }
}
