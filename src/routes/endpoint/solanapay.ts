import * as dotenv from 'dotenv'
import { clusterApiUrl, Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { createTransferCheckedInstruction, getAccount, getAssociatedTokenAddress, getMint } from '@solana/spl-token';
import { connectedCluster } from '$lib/stores';
import { createSplTransferIx } from '$lib/ts/createSplTransferIx';
import { createSolTransferIx } from '$lib/ts/createSolTransferIx';
import { swapWithJupyterIx } from '$lib/ts/swapWithJupyterIx';
import solanaPayKeypair from '$lib/secret/solanapay_wallet.json';

dotenv.config()

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function GET() {

  const label = "Metacamp";
  const icon = 'https://cdn-images-1.medium.com/max/92/1*Yf3Gdugb3O6euueo9wKmTA@2x.jpeg';

  return {
    status: 200,
    header: {
      "Content-Type": "application/json"
    },
    body: {
      label: label,
      icon: icon
    }
  };
}


const USDC = new PublicKey(process.env.USDC_MINT as String);
const keypair = Keypair.fromSeed(Uint8Array.from(solanaPayKeypair.slice(0,32)));
const connection = new Connection(`${process.env.HTTPS_RPC_ENDPOINT}`, 'confirmed');
const MERCHANT_WALLET = keypair.publicKey;
// const MERCHANT_WALLET = new PublicKey(process.env.MERCHANT_WALLET as String);


/** @type {import('@sveltejs/kit').RequestHandler} */
export async function POST({ request }) {

  console.log(request.url)

  // Account provided in the transaction request body by the wallet.
  let accountField = (await request.json()).account
  if (!accountField) throw new Error('missing account');
  const sender = new PublicKey(accountField);
  

  // create spl transfer instruction
  const splTransferIx = await createSplTransferIx(sender, connection, USDC, MERCHANT_WALLET);

  // create the transaction
  const latestBlockhash = await connection.getLatestBlockhash()
  const transaction = new Transaction(
    {
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      feePayer: MERCHANT_WALLET
    }
  )

  // add the instruction to the transaction

  // Jupyter instructions
  // const jupyterTransaction = await swapWithJupyterIx(keypair, 10000, connection)
  // console.log(jupyterTransaction)
  // for (let serializedJupyterTransaction of jupyterTransaction) {
  //   transaction.add(Transaction.from(Buffer.from(serializedJupyterTransaction, 'base64')))
  // }

  // Transfer instruction
  transaction.add(splTransferIx);
  transaction.partialSign( keypair );

  // Serialize and return the unsigned transaction.
  const serializedTransaction = transaction.serialize({
      verifySignatures: false,
      requireAllSignatures: false,
  });

  const base64Transaction = serializedTransaction.toString('base64');
  const message = 'WAGMI Metacamp 🔥';

  return { 
    status: 200, 
    body: {
      transaction: base64Transaction,
      message
    }
  };
}
