import { polyfill as polyfillReadableStream } from 'react-native-polyfill-globals/src/readable-stream';
import { Buffer } from 'buffer';
import { process } from 'process';
import { ReadableStream as WebReadableStream } from 'web-streams-polyfill/ponyfill';

// Set up global ReadableStream
global.ReadableStream = WebReadableStream;

// Set up other required globals
global.Buffer = Buffer;
global.process = process;

// Call the polyfill explicitly after ReadableStream is defined
try {
  polyfillReadableStream();
} catch (error) {
  console.warn("ReadableStream polyfill error:", error);
}

// Make sure your global polyfills are specifically targeting what you need
if (typeof global.btoa === 'undefined') {
  global.btoa = function(str) {
    return Buffer.from(str, 'binary').toString('base64');
  };
}

if (typeof global.atob === 'undefined') {
  global.atob = function(b64Encoded) {
    return Buffer.from(b64Encoded, 'base64').toString('binary');
  };
}