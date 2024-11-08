import { Mina, PublicKey, fetchAccount } from "o1js";
import * as Comlink from "comlink";
import type { EthSignatureProgram } from "../../zk/build/src/ethSignatureProgram.js";

const state = {
  zkProgram: null as null | typeof EthSignatureProgram,
};

export const api = {
  async setActiveInstanceToDevnet() {
    const Network = Mina.Network(
      "https://api.minascan.io/node/devnet/v1/graphql"
    );
    console.log("Devnet network instance configured");
    Mina.setActiveInstance(Network);
  },
  async loadProgram() {
    const { EthSignatureProgram } = await import(
      "../../zk/build/src/ethSignatureProgram.js"
    );
    state.zkProgram = EthSignatureProgram;
  },
  async compileProgram() {
    await state.zkProgram!.compile();
  },
};

// Expose the API to be used by the main thread
Comlink.expose(api);
