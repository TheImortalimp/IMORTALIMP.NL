(function (root) {
    'use strict';

    class LocalMediaPlayback {
        constructor(bridge, onStatus, onError) {
            this.bridge = bridge;
            this.onStatus = onStatus;
            this.onError = onError;
            this.generation = 0;
            this.requestId = 0;
            this.pending = null;
            this.objectUrl = null;
            this.element = null;
            if (bridge) bridge.addEventListener('message', event => this.receive(event.data));
        }

        receive(message) {
            if (typeof message !== 'string' || !message.startsWith('media:result|') || !this.pending) return;
            let result;
            try {
                result = JSON.parse(message.substring(13));
            } catch (error) {
                this.pending.reject(new Error('Invalid local media conversion response: ' + error.message));
                return;
            }
            if (result.id !== this.pending.id) return;
            if (result.error) {
                this.pending.reject(new Error(result.error));
            } else if (typeof result.url === 'string' && /^https:\/\/media\.warp\.local\/[a-f0-9]{64}\.(mp4|m4a)$/.test(result.url)) {
                this.pending.resolve(result.url);
            } else {
                this.pending.reject(new Error('Invalid converted media URL.'));
            }
        }

        cancel() {
            this.generation++;
            if (this.pending) {
                this.bridge.postMessage('media:cancel|' + this.pending.id);
                this.pending.reject(new DOMException('Playback changed.', 'AbortError'));
                this.pending = null;
                this.onStatus('LOCAL CONVERSION CANCELLED', false);
            }
            if (this.element) {
                this.element.onerror = null;
                if (this.cancelAttempt) this.cancelAttempt();
                this.element.pause();
                this.element.removeAttribute('src');
                this.element.load();
                this.element = null;
            }
            if (this.objectUrl) {
                URL.revokeObjectURL(this.objectUrl);
                this.objectUrl = null;
            }
        }

        async convert(file, kind) {
            if (!this.bridge || typeof this.bridge.postMessageWithAdditionalObjects !== 'function') {
                throw new Error('This codec/container cannot play in this browser. Convert the file locally to H.264/AAC MP4 (video) or AAC M4A (audio), or use the updated Windows app.');
            }
            const id = String(++this.requestId);
            this.onStatus('WINDOWS NATIVE CONVERSION: ' + file.name + ' - requires installed codecs; original stays unchanged', true);
            try {
                return await new Promise((resolve, reject) => {
                    this.pending = { id, resolve, reject };
                    this.bridge.postMessageWithAdditionalObjects('media:convert|' + JSON.stringify({ id, kind }), [file]);
                });
            } finally {
                if (this.pending && this.pending.id === id) this.pending = null;
            }
        }

        attempt(element, url) {
            return new Promise((resolve, reject) => {
                let settled = false;
                const finish = error => {
                    if (settled) return;
                    settled = true;
                    this.cancelAttempt = null;
                    if (error) reject(error); else resolve();
                };
                this.cancelAttempt = () => finish(new DOMException('Playback changed.', 'AbortError'));
                element.onerror = () => {
                    const error = new Error(element.error && element.error.message || 'Media decoding failed.');
                    error.mediaCode = element.error && element.error.code;
                    finish(error);
                };
                element.crossOrigin = 'anonymous';
                element.src = url;
                element.load();
                element.play().then(() => finish(), finish);
            });
        }

        async play(element, file, kind) {
            const generation = this.generation;
            this.element = element;
            const isFile = typeof file !== 'string';
            const url = isFile ? URL.createObjectURL(file) : file;
            if (isFile) this.objectUrl = url;
            try {
                await this.attempt(element, url);
            } catch (error) {
                if (generation !== this.generation || error.name === 'AbortError') throw new DOMException('Playback changed.', 'AbortError');
                if (!isFile || !(error.name === 'NotSupportedError' || error.mediaCode === 3 || error.mediaCode === 4)) throw error;
                element.onerror = null;
                const converted = await this.convert(file, kind);
                if (generation !== this.generation) throw new DOMException('Playback changed.', 'AbortError');
                await this.attempt(element, converted);
                if (generation !== this.generation) throw new DOMException('Playback changed.', 'AbortError');
                if (this.objectUrl) {
                    URL.revokeObjectURL(this.objectUrl);
                    this.objectUrl = null;
                }
                this.onStatus('LOCAL CONVERSION READY: ' + file.name, false);
            }
            if (generation !== this.generation) throw new DOMException('Playback changed.', 'AbortError');
            element.onerror = () => this.onError('LOCAL MEDIA PLAYBACK FAILED', new Error(element.error && element.error.message || 'Media decoding failed.'));
        }
    }

    root.LocalMediaPlayback = LocalMediaPlayback;
})(typeof window !== 'undefined' ? window : this);
