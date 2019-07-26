export default function sketch(p5) {
    // The number of coils in the spiral
    var COILS = 10;
    // The distance between points
    const CHORD = 20;
    // The radius of a point on the spiral.
    const POINT_RADIUS = 10;
    // The rotation of the spiral in radians
    var ROTATION = -Math.PI / 2;
    // The direction of the spiral (either +1 or -1).
    const DIRECTION = -1;

    // The current number of points.
    var N = 0;
    const MAX_N = 100000;

    const SCALE_CURVE_PERIODS = [
        { 
            initial: 10,
            target: 3,
            duration: 60000,
            curve: function (t) {
                return 1 - 1 / (1 + Math.pow(10 * t / 3, 9.4));
            }
        },
        {
            initial: 3,
            target: 2,
            duration: 60000,
            curve: function (t) {
                return p5.lerp(0, 1, t);
            }
        }
    ]

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
            target: 50,
            duration: 30000,
            curve: function(t) {
                return 3 * Math.pow(t, 2) - 2 * Math.pow(t, 3);
            }
        },
        {
            initial: 50,
            target: 200,
            duration: 40000,
            curve: function(t) {
                return p5.lerp(0, 1, t);
            }
        }
    ]

    // The radius of the spiral
    var SPIRAL_RADIUS_CURVE_PERIODS;

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
        p5.frameRate(60);

        SPIRAL_RADIUS_CURVE_PERIODS = [
            {
                initial: Math.min(width, height) * 0.25,
                target: Math.min(width, height) * 0.5,
                duration: 40000,
                curve: function(t) {
                    return p5.lerp(0, 1, t);
                },
                delay: 120000
            }
        ];
    };

    p5.draw = () => {
        p5.background(p5.color(0, 0, 0));
        updateDeltaTime();
        updateTransformations();
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

        const scale = handleCurvePeriods(SCALE_CURVE_PERIODS);
        p5.scale(scale);
    }

    function drawSpiral()
    {
        const currentCooldown = handleCurvePeriods(COOLDOWN_CURVE_PERIODS);
        const spiralRadius = handleCurvePeriods(SPIRAL_RADIUS_CURVE_PERIODS);

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
            var awayStep = spiralRadius / thetaMax; 

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

    function handleCurvePeriods(curvePeriods)
    {
        if (curvePeriods.currentIndex === undefined)
        {
            curvePeriods.currentIndex = 0;
        }

        if (curvePeriods.timeLeft === undefined)
        {
            curvePeriods.timeLeft = curvePeriods[curvePeriods.currentIndex].duration;
        }

        if (curvePeriods.delayTimeLeft === undefined)
        {
            curvePeriods.delayTimeLeft = curvePeriods[curvePeriods.currentIndex].delay || 0;
        }

        var result;
        if (curvePeriods.currentIndex < curvePeriods.length)
        {
            const currentPeriod = curvePeriods[curvePeriods.currentIndex];
            if (currentPeriod.delay === undefined || curvePeriods.delay <= 0 || curvePeriods.delayTimeLeft <= 0)
            {
                const curveDomain = currentPeriod.curveDomain || {start: 0, end: 1};
                const t = curveDomain.end - (curvePeriods.timeLeft / currentPeriod.duration) * (curveDomain.end - curveDomain.start);
                
                result = currentPeriod.initial + (currentPeriod.target - currentPeriod.initial) * currentPeriod.curve(t);
                curvePeriods.timeLeft -= deltaTime;

                const curveDomainCutoff = currentPeriod.curveDomainCutoff || 1;
                if (curvePeriods.timeLeft <= 0 || t >= curveDomainCutoff)
                {
                    curvePeriods.currentIndex += 1;
                    if (curvePeriods.currentIndex < curvePeriods.length)
                    {
                        curvePeriods.timeLeft = curvePeriods[curvePeriods.currentIndex].duration;
                        curvePeriods.delayTimeLeft = curvePeriods[curvePeriods.currentIndex].delay || 0;
                    }
                }
            }
            else
            {
                curvePeriods.delayTimeLeft -= deltaTime;
                result = currentPeriod.initial;
            }
        }
        else
        {
            result = curvePeriods[curvePeriods.length - 1].target;
        }

        return result;
    }
}
