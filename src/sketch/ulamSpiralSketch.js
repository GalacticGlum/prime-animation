import '../scss/_captureOverlay.scss';

export default function sketch(p5)
{
    // The FPS of the animation recording.
    const RECORDING_FPS = 30;
    // The total number of frames that consist of the recording.
    var TOTAL_RECORDING_FRAMES;
    // A boolean indicating whether we should record the animation.
    const RECORD_ANIMATION = false;
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

    // Canvas size
    var width;
    var height;

    // Delta time calculation
    var deltaTime = 0;
    var lastFrameTime = 0;
    var startTime;

    // The current number of points.
    var N = 0;
    const MAX_N = 10000;
    var primes;

    // The time between adding another point in milliseconds.
    const COOLDOWN = 100;
    var lastPointUpdateTime = 0;

    // The size of a cell in the grid.
    const CELL_SIZE = 5;
    // The size of a circle cell as a ratio of the cell size.
    const CIRCLE_CELL_SIZE_RATIO = 0.85;
    const SCALE = 10;

    // A boolean indicating whether the prime numbers should be coloured.
    const COLOUR_PRIME_NUMBERS = true;
    // The colour of the prime numbers.
    const PRIME_NUMBER_COLOUR = p5.color(255);
    // The colour of the number text when the circle represents a prime number and prime number circles have their own colour.
    const PRIME_NUMBER_TEXT_COLOUR = p5.color(0);
    // A boolean indicating whether non-prime numbers should be coloured.
    const COLOUR_NON_PRIME_NUMBERS = true;
    // The source colour for the non-prime number colour lerp.
    const NON_PRIME_NUMBER_COLOUR_FROM = p5.color(10, 10, 10);
    // The destination colour for the non-prime number colour lerp.
    const NON_PRIME_NUMBER_COLOUR_TO = p5.color(125, 0, 10);
    // The colour of the number text when the circle represents a non-prime number and non-prime number circles have their own colour.
    const NON_PRIME_NUMBER_TEXT_COLOUR = p5.color(255);
    // The default colour of a circle if no overrides are applied.
    const DEFAULT_CIRCLE_COLOUR = p5.color(255);
    // A boolean indicating whether the numbers should be displayed.
    const DISPLAY_NUMBERS = true;
    // The colour of the number text when the circle has its default colour.
    const DEFAULT_NUMBER_TEXT_COLOUR = p5.color(0, 0, 0); 
    // The maximum number of circles that have text drawn on them.
    // A non-positive value indicates no limit.
    const MAX_TEXT_CIRCLES = 16;

    p5.setup = () =>
    {
        var frameRate = 60;
        if (RECORD_ANIMATION) 
        {
            frameRate = RECORDING_FPS;
            width = RECORDING_FRAME_WIDTH;
            height = RECORDING_FRAME_HEIGHT;
            
            capturer = new CCapture({
                format: 'png',
                display: true,
                autoSaveTime: 30,
                framerate: RECORDING_FPS
            });

            capturer.start();

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

        // Initialize the prime list
        primes = new Array(MAX_N + 1).fill(true);
        primes[0] = primes[1] = false;
        for (var i = 2; i <= Math.floor(Math.sqrt(MAX_N)); ++i)
        {
            if (!primes[i]) continue;
            for (var j = i * i; j <= MAX_N; j += i)
            {
                primes[j] = false;
            }
        }
    }

    p5.draw = () =>
    {
        p5.background(p5.color(0, 0, 0));
       
        if (RECORD_ANIMATION && hasFinishedRecording) return;

        updateDeltaTime();
        updateRecording();
        updateTransformations();
        drawSpiral();

        if (RECORD_ANIMATION)
        {
            currentRecordingFrameCount += 1;
            capturer.capture(document.getElementById('defaultCanvas0'));
        }
    }

    function updateDeltaTime()
    {
        const currentFrameTime = p5.millis();
        deltaTime = currentFrameTime - lastFrameTime;
        lastFrameTime = currentFrameTime;
    }

    function updateTransformations()
    {
        p5.translate(width / 2, height / 2);
        p5.scale(SCALE);
    }

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

    function drawSpiral()
    {
        lastPointUpdateTime += deltaTime;
        if (N <= MAX_N && lastPointUpdateTime >= COOLDOWN)
        {
            lastPointUpdateTime = 0;
            N += 1;
        }

        var x = -1;
        var y = 0;
        // The direction that points are currently being placed in.
        // North: 0, East: 1, South: 2, West: 3
        var direction = 1;
        var sideLength = 1;
        var sideCount = 0;

        for (var i = 0; i <= N; ++i)
        {
            switch(direction)
            {
                case 0:
                    y -= 1;
                    break;
                case 1:
                    x += 1;
                    break;
                case 2:
                    y += 1;
                    break;
                case 3:
                    x -= 1;
                    break;
            }

            if (i > 0)
            {
                sideCount += 1;
                if (sideCount % sideLength == 0)
                {
                    var multiple = sideCount / sideLength;
                    if (multiple == 2)
                    {
                        sideCount = 0;
                        sideLength += 1;
                    }
    
                    direction = (direction + 1) % 4;
                }    
            }

            var colour = DEFAULT_CIRCLE_COLOUR;
            var textColour = DEFAULT_NUMBER_TEXT_COLOUR;
            if (primes[i])
            {
                if (COLOUR_PRIME_NUMBERS)
                {
                    colour = PRIME_NUMBER_COLOUR;
                    textColour = PRIME_NUMBER_TEXT_COLOUR;
                }
            }
            else if (COLOUR_NON_PRIME_NUMBERS)
            {
                colour = i > 0 ? p5.lerpColor(NON_PRIME_NUMBER_COLOUR_FROM, NON_PRIME_NUMBER_COLOUR_TO, getFactorRatio(i)) : NON_PRIME_NUMBER_COLOUR_FROM;
                textColour = NON_PRIME_NUMBER_TEXT_COLOUR;
            }

            const px = x * CELL_SIZE;
            const py = y * CELL_SIZE;

            p5.noStroke();
            p5.fill(colour);
            p5.circle(px, py, CELL_SIZE * CIRCLE_CELL_SIZE_RATIO);

            if (DISPLAY_NUMBERS && (MAX_TEXT_CIRCLES <= 0 || i < MAX_TEXT_CIRCLES))
            {      
                p5.fill(textColour);
                p5.textSize(CELL_SIZE * 0.5);
                p5.textAlign(p5.CENTER, p5.CENTER);
                p5.textStyle(p5.BOLDITALIC);
                p5.text(i.toString(), px - CELL_SIZE * 0.5, py - CELL_SIZE * 0.5, CELL_SIZE, CELL_SIZE);
            }
        }
    }

    function getFactorRatio(n)
    {
        var i = 2;
        var foundFactor = false;
        const sqrtN = Math.sqrt(n);

        while (i <= sqrtN && !foundFactor)
        {
            if (n % i == 0)
            {
                foundFactor = true;
            }
            else
            {
                i += 1;
            }
        }

        return 1 - i / sqrtN;
    }

    p5.windowResized = () =>
    {
        // We don't want to resize the canvas if we are recording an animation...
        if (RECORD_ANIMATION) return;

        width = window.innerWidth;
        height = window.innerHeight;    
        p5.resizeCanvas(width, height);
    }
}