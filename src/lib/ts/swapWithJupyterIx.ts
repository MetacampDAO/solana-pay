import type { 
    Keypair,
    Connection,
    PublicKey,
    Transaction
} from "@solana/web3.js";


export async function swapWithJupyterIx(keypair : Keypair, amount : Number, connection : Connection) {
    // retrieve indexed routed map
    const indexedRouteMap = await (await fetch('https://quote-api.jup.ag/v1/indexed-route-map')).json()
    const getMint = (index) => indexedRouteMap["mintKeys"][index]
    const getIndex = (mint) => indexedRouteMap["mintKeys"].indexOf(mint)

    // generate route map by replacing indexes with mint addresses
    var generatedRouteMap = {}
    Object.keys(indexedRouteMap['indexedRouteMap']).forEach((key, index) => {
    generatedRouteMap[getMint(key)] = indexedRouteMap["indexedRouteMap"][key].map((index) => getMint(index))
    })

    // list all possible input tokens by mint Address
    const allInputMints = Object.keys(generatedRouteMap)

    // list tokens can swap by mint addressfor SOL
    const swappableOutputForSol = generatedRouteMap['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v']
    // console.log({ allInputMints, swappableOutputForSol })


    
    // swapping USDC to SOL with input 0.01 USDC and 0.5% slippage
    const data = await (
    await fetch(`https://quote-api.jup.ag/v1/quote?inputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&outputMint=So11111111111111111111111111111111111111112&amount=${amount}&slippage=0.5`)
    ).json()
    const routes = data.data
    // console.log(routes)

    // get serialized transactions for the swap
    const transactions = await (
        await fetch('https://quote-api.jup.ag/v1/swap', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            // route from /quote api
            route: routes[0],
            // user public key to be used for the swap
            userPublicKey: keypair.publicKey.toString(),
            // auto wrap and unwrap SOL. default is true
            wrapUnwrapSOL: false,
            // feeAccount is optional. Use if you want to charge a fee.  feeBps must have been passed in /quote API.
            // This is the ATA account for the output token where the fee will be sent to. If you are swapping from SOL->USDC then this would be the USDC ATA you want to collect the fee.
            // feeAccount: "KRRRgpvA3tq9Upi9L1Svmk18nFtjLTYzeCeqJtWK547"  
        })
        })
    ).json()
    
    const { setupTransaction, swapTransaction, cleanupTransaction } = transactions

    return [ swapTransaction ].filter(Boolean)


    // // Execute the transactions
    // for (let serializedTransaction of [setupTransaction, swapTransaction, cleanupTransaction].filter(Boolean)) {
    //     // get transaction object from serialized transaction
    //     const transaction = Transaction.from(Buffer.from(serializedTransaction, 'base64'))
    //     // perform the swap
    //     const txid = await connection.sendTransaction(transaction, [keypair], {
    //     skipPreflight: true
    //     })
    //     // await connection.confirmTransaction(txid)
    //     // console.log(`https://solscan.io/tx/${txid}`)
    // }
    

}