<template>
  <div class="text-center py-12">
    <p>Count: {{ count }}</p>
    <button class="mt-4 px-3 py-1 ring-1 rounded-lg" @click="count++">incr</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const count = ref(0)
</script>
