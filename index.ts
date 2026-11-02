import { ArgumentParser } from 'argparse'
import { generateWallet } from './allowedCryptoMethods'

const parser = new ArgumentParser({
    description: "A simple tool for generating the mnemonic written in typescript"
})



parser.add_argument('--mnemonic_size', '--size', '-ms', { type: "int", help: "The number of words the mnemonic shall comprise of." })
parser.add_argument('--network', '--coin', '-c', {type:'str', help:'The address that should be generated'})

try {
    const args = parser.parse_args()
    const mnemonicSize = args.mnemonic_size
    const coinTicker = args.network

    await generateWallet(coinTicker, mnemonicSize)
} catch (err) {
    console.log(err)
}