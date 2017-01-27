import Ember from "ember";
import { test } from "ember-qunit";
import AudioRecorder, { AudioRecorderError } from "phone/app/lib/webrtc/audio-recorder";
import { factorizeLocalMediaStreamManagerUIMock, getUserMediaMp3Mock, closeAudioContext } from  "phone/app/tests/helpers/mock-media-stream";

/* global module, deepEqual, throws, equal, ok, Blob */

module("CSWRTC - lib - webrtc - audio-recorder ", {});

test("should throw errors when it's API is misused", () => {
    expect(5);

    let audioRecorder = new AudioRecorder();

    let output = audioRecorder.output("test");
    ok(output.size === 0);

    try {
        audioRecorder.stop("test");
    }
    catch (AudioRecorderError) {
        ok(true);
    }

    try {
        audioRecorder.setStreams("test");
    }
    catch (AudioRecorderError) {
        ok(true);
    }

    try {
        audioRecorder.start("test");
    }
    catch (AudioRecorderError) {
        ok(true);
    }

    output = audioRecorder.output("test");
    ok(output.size === 0);

});

test("should record single stream and expose recording status properly", assert => {
    expect(5);

    const done = assert.async();
    let audioRecorder = new AudioRecorder();

    getUserMediaMp3Mock({ audio: true }, stream => {
        audioRecorder.setStreams(stream);
    }, err => console.error(err));

    setTimeout(() => {
        isRecording(audioRecorder);
    }, 150);

    setTimeout(() => {

        testOutput(audioRecorder.stop(true));

        setTimeout(() => {
            isNotRecording(audioRecorder);
        done();
        });

    }, 300);
});

test("should record multiple streams properly", assert => {
    expect(3);

    const done = assert.async();
    let audioRecorder = new AudioRecorder();
    setMockedStreams(audioRecorder);

    setTimeout(() => {

        testOutput(audioRecorder.stop(true));
        done();

    }, 300);
});

test("should handle switching streams during recording", assert => {
    expect(3);

    const done = assert.async();
    let audioRecorder = new AudioRecorder();
    setMockedStreams(audioRecorder);

    setTimeout(() => {

        setMockedStreams(audioRecorder);

    }, 1000);

    setTimeout(() => {

        testOutput(audioRecorder.stop(true));
        done();

    }, 2000);
});

test("should handle stopping and resuming recording", assert => {
    expect(7);

    const done = assert.async();
    let audioRecorder = new AudioRecorder();
    setMockedStreams(audioRecorder);

    setTimeout(() => {

        isRecording(audioRecorder);
        audioRecorder.stop();

    }, 500);


    setTimeout(() => {

        isNotRecording(audioRecorder);
        audioRecorder.start();

    }, 1500);

    setTimeout(() => {

        isRecording(audioRecorder);
        setMockedStreams(audioRecorder);

    }, 2000);

    setTimeout(() => {

        isRecording(audioRecorder);
        testOutput(audioRecorder.stop(true));
        done();

    }, 2500);
});

function setMockedStreams(recorder) {
    getUserMediaMp3Mock({ audio: true }, stream1 => {
        getUserMediaMp3Mock({ audio: true }, stream2 => {
            recorder.setStreams(stream1, stream2);
        }, err => console.error(err));
    }, err => console.error(err));
}

function testOutput(output) {
    ok(output instanceof Blob, "Output isn't a Blob instance.");
    ok(output.size, "Output has zero size.");
    ok(output.type === "audio/webm", "Output has wrong mime type.");
}

function isRecording(audioRecorder) {
    ok(audioRecorder.recording, "AudioRecorder should be recording now.");
}

function isNotRecording(audioRecorder) {
    ok(!audioRecorder.recording, "AudioRecorder should not be recording now.");
}
