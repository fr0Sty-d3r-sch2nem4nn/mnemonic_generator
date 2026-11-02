import bip39 from "bip39"
import { ArgumentParser } from 'argparse'
import encodeQR from 'qr'


function sleep(time:number) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

const clipboard = new Clipboard()

const parser = new ArgumentParser({
    description: "A simple tool for generating the mnemonic written in typescript"
})

const sizeToBytes: Record<number, number> = {
    12: 128,
    15: 160,
    18: 192,
    21: 224,
    24: 256
}

parser.add_argument('--mnemonic_size', '--size', '-ms', { type: "int", help: "The number of words the mnemonic shall comprise of." })

try {
    const args = parser.parse_args()
    const mnemonicSize = args.mnemonic_size
    const isMnemonicSizeAllowed = mnemonicSize in sizeToBytes

    if (isNaN(mnemonicSize)) throw Error("The mnemonic size is required to properly generate the seed phrase")

    console.log("Checking mnemonic size...")
    if (!isMnemonicSizeAllowed) throw Error(`The provided size of ${mnemonicSize} the mnemonic is not in the list of allowed sizes.`)

    sleep(1000)
    console.log("Size provided is valid to generate mnemonic !")

    sleep(500)
    console.log("Generating mnemonic...")
    const generatedMnemonic = bip39.generateMnemonic(sizeToBytes[mnemonicSize])
    const mnemonicInArray = generatedMnemonic.split(" ")

    sleep(1000)
    console.log("Mnemonic has been successfully generated !")

    sleep(500)
    console.log("Validating mnemonic...")

    if (!bip39.validateMnemonic(generatedMnemonic)) throw new Error(`The mnemonic provided is not valid !`)

    sleep(1000)
    console.log("Mnemonic has been correctly validated !")

    sleep(500)

    console.log(encodeQR(generatedMnemonic, 'ascii', { optimize: true, scale: 1 }))

    console.log(`${mnemonicInArray.length} words of mnemonic`)
    console.log("Mnemonic generated:")
    console.log(generatedMnemonic)

    clipboard.writeText(generatedMnemonic)
    console.log("Mnemonic successfully saved in clipboard !")

} catch (err) {
    console.log(err)
}