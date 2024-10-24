import {
  Bool,
  Bytes,
  createEcdsa,
  createForeignCurve,
  ZkProgram,
  Crypto,
} from 'o1js';

class Secp256k1 extends createForeignCurve(Crypto.CurveParams.Secp256k1) {}
class ECDSA extends createEcdsa(Secp256k1) {}
class Bytes32 extends Bytes(32) {}

export const EthSignatureProgram = ZkProgram({
  name: 'EthSignatureProgram',
  publicInput: Bytes32,
  publicOutput: Bool,
  methods: {
    verifySignature: {
      privateInputs: [ECDSA, Secp256k1],
      async method(message: Bytes32, signature: ECDSA, publicKey: Secp256k1) {
        return { publicOutput: signature.verifyEthers(message, publicKey) };
      },
    },
  },
});
