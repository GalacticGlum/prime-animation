import CCapture from 'ccapture.js';
import '../scss/sketch.scss';

export default function sketch(p5) {
    // The FPS of the animation recording.
    const RECORDING_FPS = 30;
    // The total number of frames that consist of the recording.
    var TOTAL_RECORDING_FRAMES;
    // A boolean indicating whether we should record the animation.
    const RECORD_ANIMATION = true;
    // The duration of the recording in milliseconds.
    const RECORDING_DURATION = 270000;
    // The width of a recorded frame.
    const RECORDING_FRAME_WIDTH = 1920;
    // The height of a recorded frame.
    const RECORDING_FRAME_HEIGHT = 1080;
    // The CCapture instance.
    var capturer;
    // A boolean indicating whether the recording has finished.
    var hasFinishedRecording = false;
    // The current number of frames that have been recorded.
    var currentRecordingFrameCount = 0;

    var recordingProgressBarParentElement;
    var recordingProgressBarElement;
    var recordingProgressStatusTextElement;

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
    const MAX_N = 10000;

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
        },
        {
            initial: 2,
            target: 1,
            duration: 120000,
            curve: function(t) {
                return p5.lerp(0, 1, t);
            },
            delay: 30000
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
        },
        {
            initial: 200,
            target: 1,
            duration: 60000,
            curve: function(t) {
                return p5.lerp(0, 1, t);
            },
            delay: 40000
        }
    ]

    // The radius of the spiral
    var SPIRAL_RADIUS;

    var width;
    var height;

    var lastPointUpdateTime = 0;
    var previousPoints = [];
    var currentPoints = [];

    // Delta time calculation
    var deltaTime = 0;
    var lastFrameTime = 0;
    var startTime;  

    // A dictionary mapping the natural numbers to their factor counts
    var factors;
    var MAX_FACTOR_COUNT = 0;

    p5.setup = () => {        
        factors = new Array(MAX_N + 1).fill(0);
        factors[0] = 0;
        factors[1] = 1;
        for (var i = 2; i <= MAX_N; ++i)
        {
            for (var j = 2; j <= Math.floor(Math.sqrt(i)); ++j)
            {
                if (i % j == 0)
                {
                    factors[i] += 1;
                }
            }

            MAX_FACTOR_COUNT = Math.max(MAX_FACTOR_COUNT, factors[i]);
        }

        // Setup the capturer
        var frameRate = 60;
        if (RECORD_ANIMATION)
        {
            frameRate = RECORDING_FPS;
            width = RECORDING_FRAME_WIDTH;
            height = RECORDING_FRAME_HEIGHT;

            capturer = new CCapture({ format: 'png', framerate: RECORDING_FPS });
            capturer.start();
            capturer.capture(document.getElementById('defaultCanvas0'));

            TOTAL_RECORDING_FRAMES = (RECORDING_DURATION / 1000) * RECORDING_FPS;

            // Create a progress bar to indicate the recording progress
            recordingProgressBarParentElement = p5.createElement('div').addClass('recordingProgressBar').id('recordingProgressBarParentElement');
            recordingProgressBarElement = p5.createElement('div').addClass('bar').id('recordingProgressBarElement');
            recordingProgressStatusTextElement = p5.createElement('h2').addClass('statusText').id('recordingProgressStatusTextElement');

            recordingProgressStatusTextElement.parent(recordingProgressBarParentElement);
            recordingProgressBarElement.parent(recordingProgressBarParentElement);
        }
        else
        {
            p5.windowResized();
        }

        p5.createCanvas(width, height);
        p5.frameRate(frameRate);

        SPIRAL_RADIUS = Math.max(width, height) * 0.25;
    };

    p5.draw = () => {
        p5.background(p5.color(0, 0, 0));
        
        if (RECORD_ANIMATION && hasFinishedRecording) return;

        updateDeltaTime();
        updateRecording();
        updateTransformations();
        drawSpiral();

        if (RECORD_ANIMATION)
        {
            currentRecordingFrameCount += 1;
            console.log('Saved frame ' + currentRecordingFrameCount);
            capturer.capture(document.getElementById('defaultCanvas0'));
        }
    };

    function updateRecording()
    {
        if (!RECORD_ANIMATION) return;
        updateRecordingProgressBar();
        
        if (startTime == null)
        {
            startTime = p5.millis();
        }

        const elapsed = p5.millis() - startTime;
        if (elapsed > RECORDING_DURATION)
        {
            console.log('Finished recording...');
            capturer.stop();
            capturer.save();

            hasFinishedRecording = true;
        }
    }

    function updateRecordingProgressBar()
    {
        const recordingProgress = currentRecordingFrameCount / TOTAL_RECORDING_FRAMES;
        recordingProgressBarElement.style('width',  (recordingProgress * 100).toString() + '%');

        const progressStatus =  Math.round(recordingProgress * 100).toString() + '% (Frame ' + 
            currentRecordingFrameCount + ' / ' + TOTAL_RECORDING_FRAMES + ')';
        recordingProgressStatusTextElement.html(progressStatus);
    }

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

        lastPointUpdateTime += deltaTime;
        if (N <= MAX_N && lastPointUpdateTime >= currentCooldown)
        {
            lastPointUpdateTime = 0;

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
            const t = lastPointUpdateTime / currentCooldown;           
            let p = lerpVector(previousPoints[i], currentPoints[i], t);

            p5.noStroke();
                
            const factorCount = factors[i];
            var colour;

            if (factorCount == 0)
            {
                colour = p5.color(255, 30, 30)
            }
            else
            {
                colour = colourGradient([p5.color(10, 10, 10), p5.color(150, 0, 10)], factors[i] / MAX_FACTOR_COUNT, p5.lerp)
            }

            p5.fill(colour);
            p5.circle(p.x, p.y, POINT_RADIUS); 
        }
    }

    p5.windowResized = () => {
        // We don't want to resize the canvas if we are recording an animation...
        if (RECORD_ANIMATION) return;

        width = window.innerWidth;
        height = window.innerHeight;    
        p5.resizeCanvas(width, height);
    }

    function isPrime(n)
    {
        return factors[n] == 0;
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

    function interpolateColour(a, b, t, func)
    {
        return p5.color(func(p5.red(a), p5.red(b), t), func(p5.green(a), p5.green(b), t), func(p5.blue(a), p5.blue(b), t));
    }

    function colourGradient(colours, t, gradientFunction)
    {
        const interval = 1 / (colours.length - 1);
        var currentThreshold = 1;
        while (t > currentThreshold * interval)
        {
            currentThreshold += 1;
        }

        currentThreshold = Math.min(currentThreshold, colours.length - 1);
        const adjustedT = (t - (currentThreshold - 1) * interval) / interval;
        return interpolateColour(colours[currentThreshold - 1], colours[currentThreshold], adjustedT, gradientFunction);
    }
}