'use client';
import Head from 'next/head';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import GradientBG from './components/GradientBG.js'
import styles from '../styles/Home.module.css';
import heroMinaLogo from '../public/assets/hero-mina-logo.svg';
import arrowRightSmall from '../public/assets/arrow-right-small.svg';
import ZkWorkerClient from './zkWorkerClient';
import { ethers, SigningKey, Wallet } from 'ethers';

export default function Home() {
  const [ethWallet] = useState(Wallet.createRandom());
  const [zkWorkerClient] = useState(new ZkWorkerClient());
  const [hasBeenCompiled, sethasBeenCompiled] = useState(false);

  const [connected, setConnected] = useState(false);
  const [ethWalletAddress, setEthAddress] = useState("");
  const [ethSigner, setEthSigner] = useState<ethers.JsonRpcSigner | null>(null);

  const [message, setMessage] = useState("");
  const [ethSignature, setEthSignature] = useState("");

  // Function to connect/disconnect the wallet
  async function connectEthWallet() {
    if (!connected) {
      // Connect the wallet using ethers.js
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      setConnected(true);
      // setEthAddress(address);
      setEthAddress(ethWallet.address);
      setEthSigner(signer);
    } else {
      // Disconnect the wallet
      window.ethereum.selectedAddress = null;
      setConnected(false);
      setEthAddress("");
      setEthSigner(null);
    }
  }

  async function getPublicKeyFromSignature() {
    const address = ethWalletAddress;
    console.log("Wallet Address:", address);

    // Hash the message (to match Ethereum's signing behavior)
    const messageHash = ethers.hashMessage(message);

    const ethPublicKey = SigningKey.recoverPublicKey(messageHash, ethSignature);
    const compressedPublicKey = SigningKey.computePublicKey(ethPublicKey, true);
    
    // The public key is in uncompressed form (starts with "04" prefix)
    console.log("Recovered Public Key:", compressedPublicKey);
    return compressedPublicKey;
    // return ethWallet.signingKey.compressedPublicKey;
}

  async function signMessageEthers(message: string) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const ethSignature = await signer.signMessage(message);
    console.log('signing message with ethers.js')
    console.log('message:', message)
    // const ethSignature = await ethWallet.signMessage(message);
    setEthSignature(ethSignature);
    return ethSignature;
  }

  async function verifyMessageMina(message: string) {
    const ethPublicKey = await getPublicKeyFromSignature();
    const result = await zkWorkerClient.verifySignature(message, ethSignature, ethPublicKey);
    console.log(result);
  }

  useEffect(() => {
    (async () => {
      const { Mina, PublicKey } = await import('o1js');
      const { EthSignatureProgram } = await import('../../zk/build/src/ethSignatureProgram.js');

      console.log('compiling...')
      await zkWorkerClient.loadProgram();
      await zkWorkerClient.compileProgram();
      console.log('compiled!')

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
              built with
              <code className={styles.code}> o1js</code>
            </p>
          </div>
          <p className={styles.start}>
            Get started by editing
            <code className={styles.code}> app/page.tsx</code>
          </p>
          <div className={styles.grid}>
            <a
              href="https://docs.minaprotocol.com/zkapps"
              className={styles.card}
              target="_blank"
              rel="noopener noreferrer"
            >
              <h2>
                <span>DOCS</span>
                <div>
                  <Image
                    src={arrowRightSmall}
                    alt="Mina Logo"
                    width={16}
                    height={16}
                    priority
                  />
                </div>
              </h2>
              <p>Explore zkApps, how to build one, and in-depth references</p>
            </a>
            <a
              href="https://docs.minaprotocol.com/zkapps/tutorials/hello-world"
              className={styles.card}
              target="_blank"
              rel="noopener noreferrer"
            >
              <h2>
                <span>TUTORIALS</span>
                <div>
                  <Image
                    src={arrowRightSmall}
                    alt="Mina Logo"
                    width={16}
                    height={16}
                    priority
                  />
                </div>
              </h2>
              <p>Learn with step-by-step o1js tutorials</p>
            </a>
            <a
              href="https://discord.gg/minaprotocol"
              className={styles.card}
              target="_blank"
              rel="noopener noreferrer"
            >
              <h2>
                <span>QUESTIONS</span>
                <div>
                  <Image
                    src={arrowRightSmall}
                    alt="Mina Logo"
                    width={16}
                    height={16}
                    priority
                  />
                </div>
              </h2>
              <p>Ask questions on our Discord server</p>
            </a>
            <a
              href="https://docs.minaprotocol.com/zkapps/how-to-deploy-a-zkapp"
              className={styles.card}
              target="_blank"
              rel="noopener noreferrer"
            >
              <h2>
                <span>DEPLOY</span>
                <div>
                  <Image
                    src={arrowRightSmall}
                    alt="Mina Logo"
                    width={16}
                    height={16}
                    priority
                  />
                </div>
              </h2>
              <p>Deploy a zkApp to Testnet</p>
            </a>
          </div>
          <div>
          <button className="btn" onClick={connectEthWallet}>
            {connected ? "Disconnect Eth Wallet" : "Connect Eth Wallet"}
          </button>
          </div>
          {connected && (
            <div>
              <p>Connected eth wallet address: {ethWalletAddress}</p>
              <div>
                <input id="message" type="text" placeholder="Message to sign" value={message} onChange={
                  (e) => setMessage(e.target.value.padEnd(32, '0'))
                }/>
                <button
                  className="btn"
                  onClick={async () => {
                    const ethSignature = await signMessageEthers(message);
                    console.log(ethSignature);
                  }}>Sign Message Ethers</button>
              </div>
            </div>
          )}
          {!!ethSignature && (
            <div>
              <p>Signature: {ethSignature}</p>
              <button className="btn" onClick={async () => {
                if(hasBeenCompiled) {
                  await verifyMessageMina(message);
                } else {
                  console.log('zkProgram not compiled yet')
                }
              }}>Verify Signature</button>
            </div>
          )}
        </main>
      </GradientBG>
    </>
  );
}
