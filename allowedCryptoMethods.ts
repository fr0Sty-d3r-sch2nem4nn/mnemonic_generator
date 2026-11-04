import {ethers} from 'ethers'
import bip39, {mnemonicToSeedSync } from "bip39"
import { createWalletFull, MoneroNetworkType } from "monero-ts"
import encodeQR from 'qr'
import { createKeyPairSignerFromPrivateKeyBytes } from "@solana/kit";
import { networks, payments} from "bitcoinjs-lib";
import BIP32Factory from 'bip32';
import * as ecc from 'tiny-secp256k1';
import {exec} from "child_process"
import { writeFileSync } from 'fs';

function sleep(time: number) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

function writeDetailsInFile(coin:string, address:string, height?:number, mnemonic?:string){
    const value = `Address:\n${address}${height ? `\nHeight:\n${height}` : ''}${mnemonic && `\nMnemonic:\n${mnemonic.split(" ").join("\n")}\nQR-Code:\n${encodeQR(mnemonic, 'ascii')}`}`;
    const date = new Date()

    const file_name =`${date.toLocaleTimeString()}-${date.toDateString()}-${coin}-${address}.txt`

    writeFileSync(file_name, value);
    
    console.log(`Value saved to ${file_name}`)
}

function copyMnemonicToClipboard(mnemonic:string) {  
// Escape the mnemonic for shell safety  
const escapedMnemonic = mnemonic.replace(/'/g, "'\\''");

exec(`echo '${escapedMnemonic}' | clipboard`, (error, stdout, stderr) => {    
    if (error) {      
    console.error(`Error copying to clipboard: ${error.message}`);      
    return;    
}    
console.log('Mnemonic copied to clipboard successfully!');  });
}

const BIP39sizeToBytes: Record<number, number> = {
    12: 128,
    15: 160,
    18: 192,
    21: 224,
    24: 256,
}

const configureSolanaWallet = async (mnemonic: string) => {
    try {
        const seed = mnemonicToSeedSync(mnemonic, "");

        // Extract the first 32 bytes for the private key
        const privateKeyBytes = seed.subarray(0, 32);

        const signer = await createKeyPairSignerFromPrivateKeyBytes(
            new Uint8Array(privateKeyBytes),
        );

        return signer.address

    } catch (err) {
        console.log("Configuration for Solana Wallet failed: ", err)
    }
}

const configureEthereumWallet = async (mnemonic: string) => {
try{
    const wallet = ethers.Wallet.fromPhrase(mnemonic)

    return wallet.address
}catch(err){
    console.log("Ethereum wallet configuration failed: ", err)
}

}
const configureBitcoinWallet = async (mnemonic: string) => { 
    try{
        const network = networks.bitcoin
        const seed = mnemonicToSeedSync(mnemonic)

        // You must wrap a tiny-secp256k1 compatible implementation
        const bip32 = BIP32Factory(ecc);
        
        // HD wallet root
        const root = bip32.fromSeed(seed)

        const path = "m/44'/0'/0'/0/0";
        const child = root.derivePath(path);
        
        const { address } = payments.p2pkh({  pubkey: child.publicKey});

        return address
    }
    catch(err){
        console.log("Bitcoin wallet configuration went unsuccessful", err)
    }
}

const configureXmrWallet = async () => {
    try {
        const moneroWallet = await createWalletFull({
            networkType: MoneroNetworkType.MAINNET,
            seed: undefined,
            server:'https://xmr.marritt.ca:443'
        })

        const mnemonic = await moneroWallet.getSeed()
        const primaryAddress = await moneroWallet.getPrimaryAddress()
        const height = await moneroWallet.getDaemonHeight()

        await moneroWallet.close()

        console.log(encodeQR(primaryAddress, 'term', {scale:1}))

        console.log("XMR wallet address:", primaryAddress)

        copyMnemonicToClipboard(mnemonic)

        console.log("Succcessfully stored mnemonic of XMR Wallet in clipboard !")

        writeDetailsInFile('xmr', primaryAddress, height, mnemonic)

        return 1
    } catch (err) {
        console.log("There was an error while generating XMR wallet:", err)
    }
}


const allowedCrypto = {
    "btc": configureBitcoinWallet,
    "eth": configureEthereumWallet,
    "xmr": configureXmrWallet,
    'sol': configureSolanaWallet
}

export const generateBIP39Wallet = async (coinType: 'btc' | 'sol' | 'eth', mnemonicSize: number) => {
    try {
        const isMnemonicSizeAllowed = mnemonicSize in BIP39sizeToBytes

        if (isNaN(mnemonicSize)) throw Error("The mnemonic size is required to properly generate the seed phrase")

        console.log("Checking mnemonic size...")
        if (!isMnemonicSizeAllowed) throw Error(`The provided size of ${mnemonicSize} the mnemonic is not in the list of allowed sizes.`)

        sleep(1000)
        console.log("Size provided is valid to generate mnemonic !")

        sleep(500)
        console.log("Generating mnemonic...")
        const generatedMnemonic = bip39.generateMnemonic(BIP39sizeToBytes[mnemonicSize])

        sleep(1000)
        console.log("Mnemonic has been successfully generated !")

        sleep(500)
        console.log("Validating mnemonic...")

        if (!bip39.validateMnemonic(generatedMnemonic)) throw new Error(`The mnemonic provided is not valid !`)

        sleep(1000)
        console.log("Mnemonic has been correctly validated !")

        sleep(500)

        const address = await allowedCrypto[coinType](generatedMnemonic)

        if(!address){
            throw new Error("Address has not been successfully generated.")
        }

        console.log(encodeQR(address,'term'))

        console.log(coinType.toUpperCase(), address)
        copyMnemonicToClipboard(generatedMnemonic)
        console.log("Mnemonic successfully saved in clipboard !")

        writeDetailsInFile(coinType, address, undefined, generatedMnemonic)

    } catch (err) {
        console.log(err)
    }

}

export async function generateWallet(coinTicker: 'btc' | 'sol' | 'eth' | 'xmr', mnemonicSize?: 12 | 15 | 18 | 21 | 24){
    try{
        if(!(coinTicker in allowedCrypto)){
            throw new Error(`${coinTicker} is not in the list of allowed crypto`)
        }

        if(coinTicker != 'xmr' && !mnemonicSize){
            throw new Error('You did not specify the size of the mnemonic !')
        }

        if(coinTicker != 'xmr' && mnemonicSize){
            await generateBIP39Wallet(coinTicker, mnemonicSize)
            return
        }

        await configureXmrWallet()
    }catch(err){
        console.log("Wallet generation went unsuccessfull", err)
    }
}