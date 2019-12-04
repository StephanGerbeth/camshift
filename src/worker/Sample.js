self.importScripts('/opencv.js');

self.addEventListener('message', () => {
  console.log('hello', self.cv);
});
