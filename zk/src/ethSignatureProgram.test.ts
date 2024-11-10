import { Wallet } from 'ethers';
import { Bytes, createEcdsa, createForeignCurve, Crypto } from 'o1js';
import { beforeAll, describe, expect, it } from 'vitest';
import { EthSignatureProgram } from './ethSignatureProgram.js';

class Secp256k1 extends createForeignCurve(Crypto.CurveParams.Secp256k1) {}
class ECDSA extends createEcdsa(Secp256k1) {}
class Bytes32 extends Bytes(32) {}

/**
 * ZK回路を使用して、署名データを検証するためのテスト
 */
describe('EthSignatureProgram', () => {
  // Padding the messages to 32 bytes so that both signing libraries handle them the same
  const message = 'Hello, world!'.padEnd(32, '0');
  const spoofedMessage = 'Goodbye, world!'.padEnd(32, '0');

  // Convert ethereum public key to o1js Secp256k1 point
  const ethWallet = Wallet.createRandom();
  const compressedPublicKey = ethWallet.signingKey.compressedPublicKey;
  const publicKey = Secp256k1.fromEthers(compressedPublicKey);

  beforeAll(async () => {
    // Compile the program
    await EthSignatureProgram.compile();
  });

  it('should verify a valid signature', async () => {
    // 署名データを作成
    const ethSignature = await ethWallet.signMessage(message);
    // proofを作成(元のメッセージ、署名データ、公開鍵を使う。)
    const proof = (
      await EthSignatureProgram.verifySignature(
        Bytes32.fromString(message),
        ECDSA.fromHex(ethSignature),
        publicKey
      )
    ).proof;

    expect(proof.publicOutput.toBoolean()).toBe(true);
  });
  it('should not verify an invalid signature', async () => {
    const ethSignature = await ethWallet.signMessage(message);
    // 異なる署名データを与える。(元の署名データを変える。)
    const proof = (
      await EthSignatureProgram.verifySignature(
        Bytes32.fromString(spoofedMessage),
        ECDSA.fromHex(ethSignature),
        publicKey
      )
    ).proof;

    expect(proof.publicOutput.toBoolean()).toBe(false);
  });
});
