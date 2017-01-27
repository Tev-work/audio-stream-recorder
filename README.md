# webrtc-stream-recorder

Library spun off the work of me and https://github.com/janmisek in our daily job.

It's purpose is easy composition of streams originating from webrtc calls, thus **enabling webrtc call recording**.
As current browsers' implementation doesn't support recording multiple streams with the MediaRecorder API, we can compose only audio streams, using the Web Audio API.

Therefore **only audio recording is supported.**
