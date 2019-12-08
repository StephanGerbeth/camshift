<template>
  <video
    autoplay
    playsinline
    muted
    :srcObject.prop="stream"
    @loadedmetadata="onLoad"
  />
</template>

<script>
export default {
  props: {
    stream: {
      type: global.MediaStream,
      default () {
        return null;
      }
    }
  },

  methods: {
    onLoad () {
      console.log('-> cam: loaded');
      this.$emit('load', this.stream);
    }
  }
};
</script>

<style lang="postcss" scoped>
video {
  width: 160px;
  height: auto !important;
}
</style>
