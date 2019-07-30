import p5 from 'p5';
import 'p5/lib/addons/p5.sound';
import 'p5/lib/addons/p5.dom';
import './scss/_baseSketch.scss';

export function withSketch(sketch) {
    return new p5(sketch);
}