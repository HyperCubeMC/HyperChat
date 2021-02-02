onmessage = (event) => {
  const { messageId, code } = event.data;
  importScripts('/resources/node_modules/@highlightjs/cdn-assets/highlight.min.js');
  const highlightedCode = self.hljs.highlightAuto(code).value;
  postMessage({messageId: messageId, code: highlightedCode});
}
