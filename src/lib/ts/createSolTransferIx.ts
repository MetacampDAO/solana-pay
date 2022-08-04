import { 
    Keypair,
    Connection,
    PublicKey,
    SystemProgram,
    LAMPORTS_PER_SOL
} from "@solana/web3.js";

import * as dotenv from 'dotenv'

dotenv.config()

export async function createSolTransferIx(sender : PublicKey, connection: Connection, merchant: PublicKey) {
    const senderInfo = await connection.getAccountInfo(sender);
    if (!senderInfo) throw new Error('sender not found');

    // Get the sender's ATA and check that the account exists and can send tokens
    const senderAccount = await connection.getAccountInfo(sender);

    // You should always calculate the order total on the server to prevent
    // people from directly manipulating the amount on the client
    let amount = 0.001;
    amount = amount * LAMPORTS_PER_SOL;

    // Check that the sender has enough tokens
    if (amount > senderAccount!.lamports) throw new Error('insufficient funds');

    // Create an instruction to transfer SPL tokens, asserting the mint and decimals match

    const solTransferIx = SystemProgram.transfer({
        fromPubkey: sender,
        toPubkey: merchant,
        lamports: amount
    });

    // Create a reference that is unique to each checkout session
    const references = [new Keypair().publicKey];

    // add references to the instruction
    for (const pubkey of references) {
        solTransferIx.keys.push({ pubkey, isWritable: false, isSigner: false });
    }

    return solTransferIx;
}