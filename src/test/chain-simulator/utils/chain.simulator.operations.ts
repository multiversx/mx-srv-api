import axios from 'axios';
import { AddressUtils } from "@multiversx/sdk-nestjs-common";

const VM_TYPE = '0500';
const CODE_METADATA = '0100';
const SC_DEPLOY_ADDRESS =
  'erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu';
const ESDT_ADDRESS =
  'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u';

export async function fundAddress(chainSimulatorUrl: string, address: string) {
  const payload = [
    {
      address: address,
      balance: '100000000000000000000000',
    },
  ];
  await axios.post(`${chainSimulatorUrl}/simulator/set-state`, payload);
}

export async function getNonce(
  chainSimulatorUrl: string,
  address: string,
): Promise<number> {
  try {
    const currentNonceResponse = await axios.get(
      `${chainSimulatorUrl}/address/${address}/nonce`,
    );
    return currentNonceResponse.data.data.nonce;
  } catch (e) {
    console.error(e);
    return 0;
  }
}

export async function deploySc(args: DeployScArgs): Promise<string> {
  try {
    const contractCodeHex = Buffer.from(args.contractCodeRaw).toString('hex');
    const contractArgs = [VM_TYPE, CODE_METADATA, ...args.hexArguments];
    const contractPayload = contractCodeHex + '@' + contractArgs.join('@');

    const txHash = await sendTransaction(
      new SendTransactionArgs({
        chainSimulatorUrl: args.chainSimulatorUrl,
        sender: args.deployer,
        receiver: SC_DEPLOY_ADDRESS,
        dataField: contractPayload,
      }),
    );

    const txResponse = await axios.get(
      `${args.chainSimulatorUrl}/transaction/${txHash}?withResults=true`,
    );
    const scDeployLog = txResponse?.data?.data?.transaction?.logs?.events?.find(
      (event: { identifier: string }) => event.identifier === 'SCDeploy',
    );
    console.log(
      `Deployed SC. tx hash: ${txHash}. address: ${scDeployLog?.address}`,
    );
    return scDeployLog?.address;
  } catch (e) {
    console.error(e);
    return 'n/a';
  }
}

export async function issueEsdt(args: IssueEsdtArgs) {
  const txHash = await sendTransaction(
    new SendTransactionArgs({
      chainSimulatorUrl: args.chainSimulatorUrl,
      sender: args.issuer,
      receiver: ESDT_ADDRESS,
      dataField: `issue@${Buffer.from(args.tokenName).toString(
        'hex',
      )}@${Buffer.from(args.tokenTicker).toString(
        'hex',
      )}@1e9b0e04e39e5845000000@12`,
      value: '50000000000000000',
    }),
  );

  const txResponse = await axios.get(
    `${args.chainSimulatorUrl}/transaction/${txHash}?withResults=true`,
  );
  const esdtIssueLog = txResponse?.data?.data?.transaction?.logs?.events?.find(
    (event: { identifier: string }) => event.identifier === 'issue',
  );
  const tokenIdentifier = Buffer.from(
    esdtIssueLog.topics[0],
    'base64',
  ).toString();
  console.log(
    `Issued token with ticker ${args.tokenTicker}. tx hash: ${txHash}. identifier: ${tokenIdentifier}`,
  );
  return tokenIdentifier;
}

export async function transferEsdt(args: TransferEsdtArgs) {
  const transferValue = args.plainAmountOfTokens * 10 ** 18;
  return await sendTransaction(
    new SendTransactionArgs({
      chainSimulatorUrl: args.chainSimulatorUrl,
      sender: args.sender,
      receiver: args.receiver,
      dataField: `ESDTTransfer@${Buffer.from(args.tokenIdentifier).toString(
        'hex',
      )}@${transferValue.toString(16)}`,
      value: '0',
    }),
  );
}

export async function sendTransaction(
  args: SendTransactionArgs,
): Promise<string> {
  try {
    const nonce = await getNonce(args.chainSimulatorUrl, args.sender);

    const tx = {
      sender: args.sender,
      receiver: args.receiver,
      nonce: nonce + (args.nonceOffset ?? 0),
      value: args.value,
      gasPrice: 1000000000,
      gasLimit: args.gasLimit ?? (50_000 + 1_500 * args.dataField.length),
      data: Buffer.from(args.dataField).toString('base64'),
      signature: 'a'.repeat(128),
      chainID: 'chain',
      version: 1,
    };

    const txHashResponse = await axios.post(
      `${args.chainSimulatorUrl}/transaction/send`,
      tx,
    );
    const txHash = txHashResponse.data.data.txHash;
    if (args.nonceOffset) {
      // when a nonce offset is present, it means that the transaction won't be executed in real time, so we should early exit
      console.log(`Broadcasted tx hash ${txHash} of sender ${args.sender} with nonce ${tx.nonce}`);
      console.log(JSON.stringify(tx));
      await axios.post(
        `${args.chainSimulatorUrl}/simulator/generate-blocks/1`,
      );
      return txHash;
    }

    await axios.post(
      `${args.chainSimulatorUrl}/simulator/generate-blocks-until-transaction-processed/${txHash}`,
    );
    return txHash;
  } catch (e) {
    console.error(e);
    return 'n/a';
  }
}

export async function issueMultipleEsdts(
  chainSimulatorUrl: string,
  issuer: string,
  numTokens: number,
) {
  const tokenIdentifiers = [];
  for (let i = 1; i <= numTokens; i++) {
    const tokenName = `Token${i}`;
    const tokenTicker = `TKN${i}`;
    const tokenIdentifier = await issueEsdt(
      new IssueEsdtArgs({
        chainSimulatorUrl,
        issuer,
        tokenName,
        tokenTicker,
      }),
    );
    tokenIdentifiers.push(tokenIdentifier);
  }
  return tokenIdentifiers;
}

export class SendTransactionArgs {
  chainSimulatorUrl: string = '';
  sender: string = '';
  receiver: string = '';
  dataField: string = '';
  value?: string = '0';
  gasLimit?: number = 100_000_000;
  nonceOffset?: number = 0; // useful for scenarios where a higher nonce is desired

  constructor(options: Partial<SendTransactionArgs> = {}) {
    Object.assign(this, options);
  }
}

export class IssueEsdtArgs {
  chainSimulatorUrl: string = '';
  issuer: string = '';
  tokenName: string = '';
  tokenTicker: string = '';

  constructor(options: Partial<IssueEsdtArgs> = {}) {
    Object.assign(this, options);
  }
}

export class TransferEsdtArgs {
  chainSimulatorUrl: string = '';
  sender: string = '';
  receiver: string = '';
  tokenIdentifier: string = '';
  plainAmountOfTokens: number = 1;

  constructor(options: Partial<TransferEsdtArgs> = {}) {
    Object.assign(this, options);
  }
}

export class DeployScArgs {
  chainSimulatorUrl: string = '';
  deployer: string = '';
  contractCodeRaw: Buffer = Buffer.from('');
  hexArguments: string[] = [];

  constructor(options: Partial<DeployScArgs> = {}) {
    Object.assign(this, options);
  }
}

export async function issueCollection(args: IssueNftArgs, type: 'NonFungible' | 'SemiFungible'): Promise<string> {
  const properties = [
    'canFreeze',
    'canWipe',
    'canPause',
    'canTransferNFTCreateRole',
    'canChangeOwner',
    'canUpgrade',
    'canAddSpecialRoles',
  ];

  const dataFields = [
    `issue${type}`,
    Buffer.from(args.tokenName).toString('hex'),
    Buffer.from(args.tokenTicker).toString('hex'),
  ];

  // Add all properties and their values in hex
  for (const prop of properties) {
    dataFields.push(Buffer.from(prop).toString('hex'));
    dataFields.push(Buffer.from('true').toString('hex'));
  }

  const txHash = await sendTransaction(
    new SendTransactionArgs({
      chainSimulatorUrl: args.chainSimulatorUrl,
      sender: args.issuer,
      receiver: ESDT_ADDRESS,
      dataField: dataFields.join('@'),
      value: '50000000000000000',
      gasLimit: 60000000,
    })
  );

  const txResponse = await axios.get(
    `${args.chainSimulatorUrl}/transaction/${txHash}?withResults=true`
  );

  const issueLog = txResponse?.data?.data?.transaction?.logs?.events?.find(
    (event: { identifier: string }) => event.identifier === `issue${type}`
  );

  const tokenIdentifier = Buffer.from(
    issueLog.topics[0],
    'base64'
  ).toString();

  console.log(
    `Issued ${type} collection with ticker ${args.tokenTicker}. tx hash: ${txHash}. identifier: ${tokenIdentifier}`
  );

  return tokenIdentifier;
}

export async function issueNftCollection(args: IssueNftArgs): Promise<string> {
  return await issueCollection(args, 'NonFungible');
}

export async function issueSftCollection(args: IssueNftArgs): Promise<string> {
  return await issueCollection(args, 'SemiFungible');
}

export async function issueMultipleNftsCollections(
  chainSimulatorUrl: string,
  issuer: string,
  numCollections: number,
  numNfts: number,
  collectionType: 'nft' | 'sft' | 'both' = 'nft' // Default to NFT for backward compatibility
) {
  const nftCollectionIdentifiers = [];
  for (let i = 1; i <= numCollections; i++) {
    if (collectionType === 'nft' || collectionType === 'both') {
      const nftTokenName = `NFTCollection${i}`;
      const nftTokenTicker = `NFT${i}`;
      const nftTokenIdentifier = await issueNftCollection(
        new IssueNftArgs({
          chainSimulatorUrl,
          issuer,
          tokenName: nftTokenName,
          tokenTicker: nftTokenTicker,
        }),
      );
      nftCollectionIdentifiers.push({ identifier: nftTokenIdentifier, type: 'nft' });
    }

    if (collectionType === 'sft' || collectionType === 'both') {
      const sftTokenName = `SFTCollection${i}`;
      const sftTokenTicker = `SFT${i}`;
      const sftTokenIdentifier = await issueSftCollection(
        new IssueNftArgs({
          chainSimulatorUrl,
          issuer,
          tokenName: sftTokenName,
          tokenTicker: sftTokenTicker,
        }),
      );
      nftCollectionIdentifiers.push({ identifier: sftTokenIdentifier, type: 'sft' });
    }
  }

  // Wait a bit before setting roles
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Set roles for each collection
  for (const { identifier: tokenIdentifier, type } of nftCollectionIdentifiers) {
    const roles = [];
    if (type === 'sft') {
      roles.push(
        Buffer.from('ESDTRoleNFTCreate').toString('hex'),
        Buffer.from('ESDTRoleNFTBurn').toString('hex'),
        Buffer.from('ESDTRoleNFTAddQuantity').toString('hex'),
        Buffer.from('ESDTTransferRole').toString('hex')
      );
    } else {
      roles.push(
        Buffer.from('ESDTRoleNFTCreate').toString('hex'),
        Buffer.from('ESDTRoleNFTBurn').toString('hex'),
        Buffer.from('ESDTRoleNFTUpdateAttributes').toString('hex'),
        Buffer.from('ESDTRoleNFTAddURI').toString('hex'),
        Buffer.from('ESDTTransferRole').toString('hex')
      );
    }

    const dataFields = [
      'setSpecialRole',
      Buffer.from(tokenIdentifier).toString('hex'),
      AddressUtils.bech32Decode(issuer),
      ...roles,
    ];

    const txHash = await sendTransaction(
      new SendTransactionArgs({
        chainSimulatorUrl,
        sender: issuer,
        receiver: ESDT_ADDRESS,
        dataField: dataFields.join('@'),
        value: '0',
        gasLimit: 60000000,
      })
    );

    console.log(
      `Set special roles for collection ${tokenIdentifier}. tx hash: ${txHash}`
    );

    // Wait a bit after setting roles before creating NFT
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Create multiple NFT's / SFT's for each collection
    for (let j = 1; j <= numNfts; j++) {
      const nftCreateDataFields = [
        'ESDTNFTCreate',
        Buffer.from(tokenIdentifier).toString('hex'),
        type === 'sft' ? '0a' : '01',
        Buffer.from(`Test${type === 'sft' ? 'SFT' : 'NFT'}${j}`).toString('hex'),
        '0064',
        Buffer.from('TestHash').toString('hex'),
        Buffer.from(`tags:test,example;description:Test ${type === 'sft' ? 'SFT' : 'NFT'} ${j}`).toString('hex'),
        Buffer.from('https://example.com/nft.png').toString('hex'),
        Buffer.from('https://example.com/nft.json').toString('hex'),
      ];

      const createTxHash = await sendTransaction(
        new SendTransactionArgs({
          chainSimulatorUrl,
          sender: issuer,
          receiver: issuer,
          dataField: nftCreateDataFields.join('@'),
          value: '0',
          gasLimit: 100000000,
        })
      );

      // Check transaction status
      const txResponse = await axios.get(
        `${chainSimulatorUrl}/transaction/${createTxHash}?withResults=true`
      );

      if (txResponse?.data?.data?.status === 'fail') {
        console.error(`Failed to create NFT ${j} for collection ${tokenIdentifier}. tx hash: ${createTxHash}`);
        console.error('Error:', txResponse?.data?.data?.logs?.events[0]?.topics[1]);
      } else {
        console.log(
          `Created ${type === 'sft' ? 'SFT' : 'NFT'}${j} for collection ${tokenIdentifier}. tx hash: ${createTxHash}`
        );
      }
    }
  }

  return nftCollectionIdentifiers.map(x => x.identifier);
}

export class IssueNftArgs {
  chainSimulatorUrl: string = '';
  issuer: string = '';
  tokenName: string = '';
  tokenTicker: string = '';

  constructor(options: Partial<IssueNftArgs> = {}) {
    Object.assign(this, options);
  }
}

export async function issueMultipleMetaESDTCollections(
  chainSimulatorUrl: string,
  issuer: string,
  numberOfCollections: number,
  tokensPerCollection: number
): Promise<string[]> {
  const metaEsdtCollectionIdentifiers: { identifier: string }[] = [];

  for (let i = 0; i < numberOfCollections; i++) {
    const tokenName = `MetaESDTCollection${i}`;
    const tokenTicker = `META${i}`;

    const txHash = await sendTransaction(
      new SendTransactionArgs({
        chainSimulatorUrl: chainSimulatorUrl,
        sender: issuer,
        receiver: ESDT_ADDRESS,
        value: '50000000000000000',
        gasLimit: 60000000,
        dataField: [
          'registerMetaESDT',
          Buffer.from(tokenName).toString('hex'),
          Buffer.from(tokenTicker).toString('hex'),
          '12', // number of decimals
          Buffer.from('canFreeze').toString('hex'),
          Buffer.from('true').toString('hex'),
          Buffer.from('canWipe').toString('hex'),
          Buffer.from('true').toString('hex'),
          Buffer.from('canPause').toString('hex'),
          Buffer.from('true').toString('hex'),
          Buffer.from('canTransferNFTCreateRole').toString('hex'),
          Buffer.from('true').toString('hex'),
          Buffer.from('canChangeOwner').toString('hex'),
          Buffer.from('true').toString('hex'),
          Buffer.from('canUpgrade').toString('hex'),
          Buffer.from('true').toString('hex'),
          Buffer.from('canAddSpecialRoles').toString('hex'),
          Buffer.from('true').toString('hex'),
        ].join('@'),
      }),
    );

    const txResponse = await axios.get(
      `${chainSimulatorUrl}/transaction/${txHash}?withResults=true`,
    );

    const esdtIssueLog = txResponse?.data?.data?.transaction?.logs?.events?.find(
      (event: { identifier: string }) => event.identifier === 'registerMetaESDT',
    );

    if (esdtIssueLog) {
      const tokenIdentifier = Buffer.from(
        esdtIssueLog.topics[0],
        'base64',
      ).toString();

      metaEsdtCollectionIdentifiers.push({ identifier: tokenIdentifier });

      console.log(
        `Issued MetaESDT collection ${tokenName}. tx hash: ${txHash}. identifier: ${tokenIdentifier}`,
      );

      // Set special roles for the MetaESDT collection
      const setRolesTxHash = await sendTransaction(
        new SendTransactionArgs({
          chainSimulatorUrl: chainSimulatorUrl,
          sender: issuer,
          receiver: ESDT_ADDRESS,
          value: '0',
          gasLimit: 60000000,
          dataField: [
            'setSpecialRole',
            Buffer.from(tokenIdentifier).toString('hex'),
            AddressUtils.bech32Decode(issuer),
            Buffer.from('ESDTRoleNFTCreate').toString('hex'),
            Buffer.from('ESDTRoleNFTBurn').toString('hex'),
            Buffer.from('ESDTRoleNFTAddQuantity').toString('hex'),
          ].join('@'),
        }),
      );

      console.log(
        `Set special roles for collection ${tokenIdentifier}. tx hash: ${setRolesTxHash}`
      );

      // Wait a bit after setting roles
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Create MetaESDT tokens for this collection
      for (let j = 1; j <= tokensPerCollection; j++) {
        const createTxHash = await sendTransaction(
          new SendTransactionArgs({
            chainSimulatorUrl,
            sender: issuer,
            receiver: issuer,
            dataField: [
              'ESDTNFTCreate',
              Buffer.from(tokenIdentifier).toString('hex'),
              '0a', // Initial quantity (10)
              Buffer.from(`TestMetaESDT${j}`).toString('hex'),
              '0064', // Royalties (100 = 1%)
              Buffer.from('TestHash').toString('hex'),
              Buffer.from(`tags:test,example;description:Test MetaESDT ${j}`).toString('hex'),
              Buffer.from('https://example.com/nft.png').toString('hex'),
              Buffer.from('https://example.com/nft.json').toString('hex'),
            ].join('@'),
            value: '0',
            gasLimit: 100000000,
          })
        );

        console.log(
          `Created MetaESDT${j} for collection ${tokenIdentifier}. tx hash: ${createTxHash}`
        );
      }
    }
  }

  return metaEsdtCollectionIdentifiers.map(x => x.identifier);
}


