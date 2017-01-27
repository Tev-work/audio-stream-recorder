export class AudioRecorderError extends Error {
  constructor(message) {
    super(message);
    this.name = "AudioRecorderError";
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Wraps the native MediaRecorder API and stream mixing for recording a single WebRTC call.
 * @constructor
 * @param {Object} [options] - Configuration of the AudioRecorder.
 * @param {string} [options.mimeType=audio/webm] - Desired output format (currently only audio/webm is supported, due to browser limitations)
 * @param {number} [options.audioBitsPerSecond=12800] - Desired bitrate of the output
 * @param {...MediaStream} [streams] - Streams to be recorded (can be supplied later via setStreams)
 */
export default class AudioRecorder {

    constructor(options, ...streams) {

        options = options || {};
        options.mimeType = options.mimeType || "audio/webm";
        options.outputType = options.outputType || options.mimeType.replace(/(.*);.*/, "$1");
        options.audioBitsPerSecond = options.audioBitsPerSecond || 128000;

        this._options = options;
        this._recordingOptions = {
            mimeType: options.mimeType,
            audioBitsPerSecond: options.audioBitsPerSecond
        };
        this._recordedChunks = [];

        this._audioCtx = new window.AudioContext();
        this._ctxDestination = this._audioCtx.createMediaStreamDestination();
        this._streamSources = [];

        this.recording = false;

        if (streams.length) {
            this.setStreams(...streams);
        }

    }

    /**
     * Replaces current streams with new ones (or just erases old ones). Recording starts immediately (if valid streams are given).
     * @param {...MediaStream} streams - Streams to be recorded.
     */
    setStreams(...streams) {

        this._clearStreams();

        streams.forEach(stream => {
            if (stream instanceof window.MediaStream) {
                const source = this._audioCtx.createMediaStreamSource(stream);
                source.connect(this._ctxDestination);
                this._streamSources.push(source);
            } else {
                throw new AudioRecorderError(stream + " is not an instance of MediaStream.");
            }
        });

        if (streams.length) {
            this.start();
        }

    }

    start() {

        if (!this._streamSources.length) {
            throw new AudioRecorderError("No streams for recording.");
        }

        if (!this._recorder) {
            this._recorder = new window.MediaRecorder(this._ctxDestination.stream, this._recordingOptions);
            this._recorder.ondataavailable = event => this._recordedChunks.push(event.data);
        }

        if (this._recorder.state !== "recording") {
            this._recorder.start();
            this.recording = true;
        } else {
            throw new AudioRecorderError("Already recording.");
        }

    }

    stop(output) {

        if (this._recorder && this._recorder.state !== "inactive") {
            this._recorder.stop();
            this.recording = false;
        } else {
            throw new AudioRecorderError("Not recording.");
        }

        if (output) {
            return this.output();
        }

    }

    output() {

        return new Blob(this._recordedChunks, { type: this._options.outputType });

    }

    _clearStreams() {

        if (this._recorder) {
            if (this.recording) {
                this.stop();
            }
            this._recorder = null;
        }

        this._streamSources.forEach(streamSource => streamSource.disconnect());
        this._streamSources = [];

    }

}
