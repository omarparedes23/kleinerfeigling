/**
 * VoiceRecorder Utility
 * A browser-native MediaRecorder wrapper class that handles audio recording,
 * prioritizing 'audio/webm' format and falling back to 'audio/ogg' if needed.
 */
export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private mimeType: string = "";

  constructor() {
    this.determineMimeType();
  }

  /**
   * Checks for supported audio formats in the browser.
   * Prioritizes audio/webm, then audio/ogg, and defaults to standard MediaRecorder options.
   */
  private determineMimeType() {
    if (typeof window === "undefined" || !window.MediaRecorder) {
      return;
    }

    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/ogg",
      "audio/wav",
      "audio/mp4",
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        this.mimeType = type;
        break;
      }
    }
  }

  /**
   * Starts recording audio from the user's microphone.
   */
  async start(): Promise<void> {
    if (typeof window === "undefined" || !navigator.mediaDevices) {
      throw new Error("La grabación de audio no está soportada en este entorno.");
    }

    try {
      // 1. Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.chunks = [];

      // 2. Initialize MediaRecorder with the supported MimeType
      const options = this.mimeType ? { mimeType: this.mimeType } : undefined;
      this.mediaRecorder = new MediaRecorder(this.stream, options);

      // 3. Handle data availability
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };

      // 4. Start recording (requesting data chunks every 250ms is optional but good)
      this.mediaRecorder.start(250);
    } catch (error) {
      console.error("[VoiceRecorder.start] Error starting audio recording:", error);
      this.cleanup();
      throw error;
    }
  }

  /**
   * Pauses the current recording.
   */
  pause(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
      this.mediaRecorder.pause();
    }
  }

  /**
   * Resumes the paused recording.
   */
  resume(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === "paused") {
      this.mediaRecorder.resume();
    }
  }

  /**
   * Stops recording and returns the compiled audio Blob.
   */
  async stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === "inactive") {
        reject(new Error("No hay ninguna grabación activa para detener."));
        return;
      }

      this.mediaRecorder.onstop = () => {
        try {
          const blobMimeType = this.mimeType || "audio/webm";
          const audioBlob = new Blob(this.chunks, { type: blobMimeType });
          this.cleanup();

          if (audioBlob.size === 0) {
            reject(new Error("EMPTY_AUDIO"));
            return;
          }

          resolve(audioBlob);
        } catch (error) {
          reject(error);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Stops recording and cleans up all hardware streams.
   */
  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.chunks = [];
  }
}
