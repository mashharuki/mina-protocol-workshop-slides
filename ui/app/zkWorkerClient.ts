import * as Comlink from "comlink";

/**
 * ZkWorkerCllient Class
 */
export default class ZkWorkerCllient {
  // ---------------------------------------------------------------------------------------
  worker: Worker;
  // Proxy to interact with the worker's methods as if they were local
  remoteApi: Comlink.Remote<typeof import("./zkWorker").api>;

  constructor() {
    // Initialize the worker from the zkappWorker module
    const worker = new Worker(new URL("./zkWorker.ts", import.meta.url), {
      type: "module",
    });
    this.worker = worker;
    // Wrap the worker with Comlink to enable direct method invocation
    this.remoteApi = Comlink.wrap(worker);
  }

  async loadProgram() {
    return this.remoteApi.loadProgram();
  }

  async compileProgram() {
    return this.remoteApi.compileProgram();
  }

  async verifySignature(
    message: string,
    ethSignature: string,
    ethPublicKey: string
  ) {
    console.log("Verifying signature...");
    console.log("Message: ", message);
    console.log("Signature: ", ethSignature);
    console.log("Public key: ", ethPublicKey);
    return this.remoteApi.verifySignature(message, ethSignature, ethPublicKey);
  }
}
