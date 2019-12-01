<template>
  <video
    autoplay
    playsinline
    :width="width"
    :height="height"
    @loadedmetadata="onLoad"
  />
</template>

<script>
export default {
  props: {
    frameRate: {
      type: Number,
      default () {
        return 60;
      }
    },
    facingMode: {
      type: String,
      default () {
        return 'environment';
      }
    },
    audio: {
      type: Boolean,
      default () {
        return false;
      }
    }
  },

  data () {
    return {
      width: 0,
      height: 0
    };
  },

  computed: {
    constraints () {
      return {
        video: {
          facingMode: this.facingMode,
        },
        audio: false
      };
    }
  },

  mounted () {
    global.navigator.mediaDevices
      .getUserMedia(this.constraints)
      .then(stream => {
        this.$el.srcObject = stream;
        return navigator.mediaDevices.enumerateDevices();
      })
      .catch(error => {
        console.error(error);
      });
  },

  methods: {
    onLoad (e) {
      this.width = e.target.videoWidth;
      this.height = e.target.videoHeight;
    }
  }
};
</script>

<style lang="postcss" scoped>
</style>
