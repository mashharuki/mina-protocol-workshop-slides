import {
  Bool,
  Bytes,
  createEcdsa,
  createForeignCurve,
  Crypto,
  ZkProgram,
} from 'o1js';

class Secp256k1 extends createForeignCurve(Crypto.CurveParams.Secp256k1) {}
class ECDSA extends createEcdsa(Secp256k1) {}
class Bytes32 extends Bytes(32) {}

/**
 * 署名データを検証するためのZK回路
 */
export const EthSignatureProgram = ZkProgram({
  name: 'EthSignatureProgram',
  publicInput: Bytes32, // インプット
  publicOutput: Bool, // アウトプット
  methods: { // 検証用のメソッドを定義。使用するアルゴリズムなどを指定。
    // 今回は、verifySignatureというメソッドを定義している。
    verifySignature: {
      privateInputs: [ECDSA, Secp256k1],
      async method(
        message: Bytes32, 
        signature: ECDSA, 
        publicKey: Secp256k1
      ) {
        return { 
          // 戻り値して、検証結果のみを返す。
          publicOutput: signature.verifyEthers(message, publicKey) 
        };
      },
    },
  },
});
