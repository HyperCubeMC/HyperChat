importScripts('/resources/node_modules/@highlightjs/cdn-assets/highlight.min.js');

onmessage = (event) => {
  const { messageId, code } = event.data;
  const highlightedCode = self.hljs.highlightAuto(code).value;
  console.log(highlightedCode);
  if (highlightedCode != null) {
    postMessage({messageId: messageId, code: highlightedCode});
  } else {
    console.log(`Unable to highlight the following code for message with id ${messageId}:`)
  }
}
