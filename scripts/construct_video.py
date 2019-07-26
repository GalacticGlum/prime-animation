"""
Constructs a video from a directory of frames.

"""

import cv2
import argparse
import numpy as np

from progress.bar import IncrementalBar
from glob import glob

parser = argparse.ArgumentParser(description='Constructs a video from a directory of frames.')
parser.add_argument('--input', type=str, help='The directory containing the frames.', required=True)
parser.add_argument('--output', type=str, help='The path to the output video file.', required=True)
parser.add_argument('--fps', type=float, help='The FPS of the video', default=24)
parser.add_argument('--pattern', type=str, help='The pattern for matching frames.', default='*.png')
parser.add_argument('--codec', type=str, help='The FOURCC video codec.', default='mp4v')
parser.add_argument('--resolution', type=int, help='The resolution of the output video.', nargs=2, default=(1920, 1080))
args = parser.parse_args()

filenames = glob('{}/{}'.format(args.input, args.pattern))
if len(filenames) > 0:
    out = cv2.VideoWriter(args.output, cv2.VideoWriter_fourcc(*args.codec), args.fps, args.resolution)
    with IncrementalBar('Generating', max=len(filenames), suffix='%(percent).1f%% - %(eta)ds') as bar:
        for filename in filenames:
            out.write(cv2.imread(filename))
            bar.next()

    out.release()
else:
    print('No frames matching the specified pattern (\'{}\') found.'.format(args.pattern))

    