<template>
  <button>
    <slot>Toggle</slot>
  </button>
</template>

<script>
export default {
  mounted () {
    console.log('test');
  }
};
</script>

<style lang="postcss" scoped>
</style>
