import * as Comlink from "comlink";
import {
  Bytes,
  Crypto,
  Mina,
  createEcdsa,
  createForeignCurve
} from "o1js";
import type { EthSignatureProgram } from "../../zk/build/src/ethSignatureProgram.js";

const state = {
  zkProgram: null as null | typeof EthSignatureProgram,
};

class Secp256k1 extends createForeignCurve(Crypto.CurveParams.Secp256k1) {}
class ECDSA extends createEcdsa(Secp256k1) {}
class Bytes32 extends Bytes(32) {}

/**
 * ZK回路操作関連のAPI
 */
export const api = {
  /**
   * デフォルトのMinaインスタンスをDevnetに設定します。
   */
  async setActiveInstanceToDevnet() {
    const Network = Mina.Network(
      "https://api.minascan.io/node/devnet/v1/graphql"
    );
    console.log("Devnet network instance configured");
    Mina.setActiveInstance(Network);
  },
  /**
   * プログラムをロードします。
   */
  async loadProgram() {
    const { EthSignatureProgram } = await import(
      "../../zk/build/src/ethSignatureProgram.js"
    );
    state.zkProgram = EthSignatureProgram;
  },
  /**
   * プログラムをコンパイルします。
   */
  async compileProgram() {
    await state.zkProgram!.compile();
  },
  /**
   * 署名を検証するためのメソッド
   * @param message 
   * @param ethSignature 
   * @param ethPublicKey 
   * @returns 
   */
  async verifySignature(
    message: string,
    ethSignature: string,
    ethPublicKey: string
  ) {
    const messageBytes = Bytes32.fromString(message);
    const signature = ECDSA.fromHex(ethSignature);
    const publicKey = Secp256k1.fromEthers(ethPublicKey);
    // 検証
    const result = await state.zkProgram!.verifySignature(
      messageBytes,
      signature,
      publicKey
    );
    // 検証結果を取得
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
