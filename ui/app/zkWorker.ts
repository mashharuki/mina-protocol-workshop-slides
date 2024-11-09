import {
  Mina,
  PublicKey,
  createForeignCurve,
  Crypto,
  createEcdsa,
  Bytes,
} from "o1js";
import * as Comlink from "comlink";
import type { EthSignatureProgram } from "../../zk/build/src/ethSignatureProgram.js";

const state = {
  zkProgram: null as null | typeof EthSignatureProgram,
};

class Secp256k1 extends createForeignCurve(Crypto.CurveParams.Secp256k1) {}
class ECDSA extends createEcdsa(Secp256k1) {}
class Bytes32 extends Bytes(32) {}

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
  async verifySignature(
    message: string,
    ethSignature: string,
    ethPublicKey: string
  ) {
    const messageBytes = Bytes32.fromString(message);
    const signature = ECDSA.fromHex(ethSignature);
    const publicKey = Secp256k1.fromEthers(ethPublicKey);

    const result = await state.zkProgram!.verifySignature(
      messageBytes,
      signature,
      publicKey
    );

    const valid = result.proof.publicOutput.toBoolean();
    if (!valid) {
      console.error("Invalid signature");
      return {
        valid: false,
        proof: result.proof.toJSON(),
      };
    }

    return {
      valid: true,
      proof: result.proof.toJSON(),
    };
  },
};

// Expose the API to be used by the main thread
Comlink.expose(api);
