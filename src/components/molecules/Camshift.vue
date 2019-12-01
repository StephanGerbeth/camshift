<template>
  <div>
    <cam
      class="cam"
      @loadedmetadata.native="onLoad"
      @click.native="onClick"
    />
    <canvas
      ref="canvas"
      :width="width"
      :height="height"
    />
  </div>
</template>

<script>
import Cam from '@/components/atoms/Cam';
import { loopByFPS } from '@/utils/animationFrame';
import { getPointer } from '@/utils/pointer';

export default {
  components: {
    Cam
  },

  props: {
    resize: {
      type: Number,
      default () {
        return 0.25;
      }
    }
  },

  data () {
    return {
      context: null,
      fps: 1,
      video: null,
      worker: null,
      lastTime: 0
    };
  },

  computed: {
    width () {
      // return this.video.videoWidth;
      return (this.video ? this.video.videoWidth : 0);
      // return (this.video ? this.video.videoWidth : 0) * this.resize;
    },

    height () {
      // return this.video.videoHeight;
      return (this.video ? this.video.videoHeight : 0);
      // return (this.video ? this.video.videoHeight : 0) * this.resize;
    }
  },

  mounted () {
    this.context = this.$refs.canvas.getContext('2d');
    this.worker = import('@/worker/Sample').then(({ default: Worker }) => new Worker());
  },

  methods: {
    onLoad (e) {
      this.video = e.target;
      // setTimeout(() => {

      // }, 2000);
    },

    onClick (e) {
      let pointer = getPointer(e, e.target.getBoundingClientRect());

      let cap = new global.cv.VideoCapture(this.video);
      this.cap = cap;
      let frame = new global.cv.Mat(this.video.videoHeight, this.video.videoWidth, global.cv.CV_8UC4);
      this.frame = frame;
      cap.read(frame);

      let trackWindow = new global.cv.Rect(pointer.x - 10, pointer.y - 10, 20, 20);
      this.trackWindow = trackWindow;
      let roi = frame.roi(trackWindow);
      let hsvRoi = new global.cv.Mat();
      global.cv.cvtColor(roi, hsvRoi, global.cv.COLOR_RGBA2RGB);
      global.cv.cvtColor(hsvRoi, hsvRoi, global.cv.COLOR_RGB2HSV);

      let mask = new global.cv.Mat();
      let lowScalar = new global.cv.Scalar(30, 30, 0);
      let highScalar = new global.cv.Scalar(180, 180, 180);
      let low = new global.cv.Mat(hsvRoi.rows, hsvRoi.cols, hsvRoi.type(), lowScalar);
      let high = new global.cv.Mat(hsvRoi.rows, hsvRoi.cols, hsvRoi.type(), highScalar);
      global.cv.inRange(hsvRoi, low, high, mask);

      let roiHist = new global.cv.Mat();
      this.roiHist = roiHist;
      let hsvRoiVec = new global.cv.MatVector();
      hsvRoiVec.push_back(hsvRoi);
      global.cv.calcHist(hsvRoiVec, [
        0
      ], mask, roiHist, [
        180
      ], [
        0, 180
      ]);
      global.cv.normalize(roiHist, roiHist, 0, 255, global.cv.NORM_MINMAX);

      // delete useless mats.
      roi.delete(); hsvRoi.delete(); mask.delete(); low.delete(); high.delete(); hsvRoiVec.delete();

      // Setup the termination criteria, either 10 iteration or move by atleast 1 pt
      let termCrit = new global.cv.TermCriteria(global.cv.TERM_CRITERIA_EPS | global.cv.TERM_CRITERIA_COUNT, 10, 1);
      this.termCrit = termCrit;

      let hsv = new global.cv.Mat(this.video.videoHeight, this.video.videoWidth, global.cv.CV_8UC3);
      this.hsv = hsv;
      let hsvVec = new global.cv.MatVector();
      this.hsvVec = hsvVec;
      hsvVec.push_back(hsv);
      let dst = new global.cv.Mat();
      this.dst = dst;
      let trackBox = null;
      this.trackBox = trackBox;

      let ani = loopByFPS(60, this.updateFrame);
      ani.start();
    },

    updateFrame () {
      // this.context.drawImage(this.video, 0, 0, this.width, this.height);
      // this.$nextTick(() => {
      //   let imageData = this.context.getImageData(0, 0, this.width, this.height);
      //   this.worker
      //     .then((worker) => worker.postMessage({ event: 'detect', data: imageData.data }))
      //     .catch((e) => { throw e; });
      // });

      // start processing.
      this.cap.read(this.frame);
      global.cv.cvtColor(this.frame, this.hsv, global.cv.COLOR_RGBA2RGB);
      global.cv.cvtColor(this.hsv, this.hsv, global.cv.COLOR_RGB2HSV);
      global.cv.calcBackProject(this.hsvVec, [
        0
      ], this.roiHist, this.dst, [
        0, 180
      ], 1);

      // apply camshift to get the new location
      let [
        trackBox,
        trackWindow
      ] = global.cv.CamShift(this.dst, this.trackWindow, this.termCrit);
      this.trackWindow = trackWindow;
      // Draw it on image
      let pts = global.cv.rotatedRectPoints(trackBox);
      // console.log(pts);
      global.cv.line(this.frame, pts[0], pts[1], [
        255, 0, 0, 255
      ], 3);
      global.cv.line(this.frame, pts[1], pts[2], [
        255, 0, 0, 255
      ], 3);
      global.cv.line(this.frame, pts[2], pts[3], [
        255, 0, 0, 255
      ], 3);
      global.cv.line(this.frame, pts[3], pts[0], [
        255, 0, 0, 255
      ], 3);
      global.cv.imshow(this.$refs.canvas, this.frame);
    }
  }
};
</script>

<style lang="postcss" scoped>
.cam {
  /* display: none; */
}
</style>
