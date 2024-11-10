'use client';
import { ethers, SigningKey } from 'ethers';
import Head from 'next/head';
import Image from 'next/image';
import { JsonProof } from 'o1js';
import { useEffect, useState } from 'react';
import heroMinaLogo from './../public/assets/hero-mina-logo.svg';
import styles from './../styles/Home.module.css';
import GradientBG from './components/GradientBG.js';
import ZkWorkerClient from './zkWorkerClient';

/**
 * home component
 * @returns 
 */
export default function Home() {
  const [zkWorkerClient] = useState(new ZkWorkerClient());
  const [hasBeenCompiled, sethasBeenCompiled] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [proof, setProof] = useState<JsonProof | null>(null);

  const [connected, setConnected] = useState(false);
  const [ethWalletAddress, setEthAddress] = useState('');
  const [ethSigner, setEthSigner] = useState<ethers.JsonRpcSigner | null>(null);

  const [message, setMessage] = useState('');
  const [ethSignature, setEthSignature] = useState('');

  function shortenString(str: string) {
    return `${str.slice(0, 20)}...${str.slice(-6)}`;
  }

  // Function to connect/disconnect the wallet
  async function connectEthWallet() {
    if (!connected) {
      // Connect the wallet using ethers.js
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setConnected(true);
      setEthAddress(address);
      setEthSigner(signer);
    } else {
      // Disconnect the wallet
      window.ethereum.selectedAddress = null;
      setConnected(false);
      setEthAddress('');
      setEthSigner(null);
    }
  }

  /**
   * 署名データから公開鍵を取得する。
   * @returns 
   */
  async function getPublicKeyFromSignature() {
    const address = ethWalletAddress;
    console.log('Wallet Address:', address);

    // Hash the message (to match Ethereum's signing behavior)
    const paddedMessage = message.padEnd(32, '0');
    const messageHash = ethers.hashMessage(paddedMessage);
    // メッセージハッシュと署名データから公開鍵を復元する。
    const ethPublicKey = SigningKey.recoverPublicKey(messageHash, ethSignature);
    const compressedPublicKey = SigningKey.computePublicKey(ethPublicKey, true);

    // The public key is in uncompressed form (starts with "04" prefix)
    console.log('Recovered Public Key:', compressedPublicKey);
    return compressedPublicKey;
    // return ethWallet.signingKey.compressedPublicKey;
  }

  /**
   * メッセージから署名データを作成する。
   * @param message 
   * @returns 
   */
  async function signMessageEthers(message: string) {
    const paddedMessage = message.padEnd(32, '0');
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    // 署名データを作成する。
    const ethSignature = await signer.signMessage(paddedMessage);
    console.log('signing message with ethers.js');
    console.log('message:', paddedMessage);
    setEthSignature(ethSignature);
    return ethSignature;
  }

  /**
   * メッセージを渡して検証する。
   * @param message 
   * @returns 
   */
  async function verifyMessageMina(message: string) {
    const paddedMessage = message.padEnd(32, '0');
    // 署名データから公開鍵を取得する。
    const ethPublicKey = await getPublicKeyFromSignature();
    // 検証する。
    const result = await zkWorkerClient.verifySignature(
      paddedMessage,
      ethSignature,
      ethPublicKey
    );
    return result;
  }

  useEffect(() => {
    (async () => {
      console.log('compiling...');
      // プログラムをロードしてコンパイルする
      await zkWorkerClient.loadProgram();
      await zkWorkerClient.compileProgram();
      console.log('compiled!');

      sethasBeenCompiled(true);
    })();
  }, [zkWorkerClient, sethasBeenCompiled]);

  return (
    <>
      <Head>
        <title>Mina zkApp UI</title>
        <meta name="description" content="built with o1js" />
        <link rel="icon" href="/assets/favicon.ico" />
      </Head>
      <GradientBG>
        <main className={styles.main}>
          <div className={styles.center}>
            <a
              href="https://minaprotocol.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                className={styles.logo}
                src={heroMinaLogo}
                alt="Mina Logo"
                width="191"
                height="174"
                priority
              />
            </a>
            <p className={styles.tagline}>
              built with &nbsp;
              <code className="font-weight-bold">o1js</code>
            </p>
            <div className="pt-10">
              <p className="text-black text-shadow-white text-2xl">
                Eth to Mina Signature Verification Example
              </p>
              <div>
                <button
                  className="mt-4 mb-4 w-full text-lg text-white font-bold rounded-lg p-2 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-700 hover:to-blue-900"
                  onClick={connectEthWallet}
                >
                  {connected ? 'Disconnect Eth Wallet' : 'Connect Eth Wallet'}
                </button>
              </div>
              {connected && (
                <div className="p-4 bg-gray-100 rounded-lg shadow-md mb-10">
                  <p className="mb-4 text-lg font-semibold text-gray-700">
                    Connected eth wallet address: {ethWalletAddress}
                  </p>
                  <div className="flex flex-col space-y-4">
                    <input
                      id="message"
                      type="text"
                      placeholder="Message to sign"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      className="mt-4 mb-4 w-full text-lg text-white font-bold rounded-lg p-2 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-700 hover:to-blue-900"
                      onClick={async () => {
                        const ethSignature = await signMessageEthers(message);
                        console.log(ethSignature);
                      }}
                    >
                      Sign Message Ethers
                    </button>
                  </div>
                </div>
              )}
              {!!ethSignature && (
                <div className="p-4 bg-gray-100 rounded-lg shadow-md">
                  {!hasBeenCompiled && (
                    <div>
                      <p className="mb-4 text-lg font-semibold text-gray-700">
                        Compiling zkProgram...
                      </p>
                    </div>
                  )}
                  {hasBeenCompiled && (
                    <div>
                      <p className="mb-4 text-lg font-semibold text-gray-700">
                        Signature: {shortenString(ethSignature)}
                      </p>
                      <p className="mb-4 text-lg font-semibold text-gray-700">
                        Public Key: {ethWalletAddress}
                      </p>
                      <p className="mb-4 text-lg font-semibold text-gray-700">
                        Message: {message}
                      </p>
                      <button
                        className="mt-4 mb-4 w-full text-lg text-white font-bold rounded-lg p-2 bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-700 hover:to-purple-900"
                        onClick={async () => {
                          if (hasBeenCompiled) {
                            setIsVerifying(true);
                            const result = await verifyMessageMina(message);
                            console.log(result);
                            setIsVerified(result.valid);
                            setProof(result.proof);
                            setIsVerifying(false);
                          } else {
                            console.log('zkProgram not compiled yet');
                          }
                        }}
                      >
                        Verify Signature o1js
                      </button>
                      {isVerifying && (
                        <div>
                          <p className="mb-4 text-lg font-semibold text-gray-700">
                            Verifying signature...
                          </p>
                        </div>
                      )}
                      {!isVerifying && isVerified !== null && (
                        <div className="overflow-scroll max-w-xl">
                          <p className="mb-4 text-lg font-semibold text-gray-700">
                            Verification: {isVerified ? 'Success' : 'Failed'}
                          </p>
                          <p className="mb-4 text-lg font-semibold text-gray-700">
                            Public Output:
                          </p>
                          <pre className="bg-gray-200 p-4 rounded-lg max-w-3/4 mx-auto whitespace-pre-wrap break-words">
                            {proof?.publicOutput || ''}
                          </pre>
                          <p className="mb-4 text-lg font-semibold text-gray-700">
                            Public Input:
                          </p>
                          <pre className="bg-gray-200 p-4 rounded-lg max-w-3/4 mx-auto whitespace-pre-wrap break-words">
                            {proof?.publicInput || ''}
                          </pre>
                          <p className="mb-4 text-lg font-semibold text-gray-700">
                            Proof:
                          </p>
                          <pre className="bg-gray-200 p-4 rounded-lg max-w-3/4 mx-auto whitespace-pre-wrap break-words">
                            {proof?.proof || ''}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </GradientBG>
    </>
  );
}
