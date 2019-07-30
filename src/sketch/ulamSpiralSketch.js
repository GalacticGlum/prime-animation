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

    // The time between adding another point in milliseconds.
    const COOLDOWN = 500;
    var lastPointUpdateTime = 0;

    // The size of a cell in the grid.
    const CELL_SIZE = 5;
    const SCALE = 10;

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

            p5.noStroke();
            p5.color(p5.color(255, 255, 255));
            p5.circle(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE);
        }
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