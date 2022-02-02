const transactionDetails =
	{
		txHash: "87db96d4a04dc5729049a3faf6e7cd6064ecc91f48bdbef3a7889b8fb61538e8",
		gasLimit: 500000,
		gasPrice: 1000000000,
		gasUsed: 316000,
		miniBlockHash: "cdeb341007a49ef11d1ccbf0e08eef0e2e472341d77587d670f261b29ae53aaa",
		nonce: 3,
		receiver: "erd1e6uwqpljusj58t0fuwucqtjadep3xyuhvah76a6y7frurmqgm2dqkv8pcd",
		receiverShard: 2,
		round: 7916240,
		sender: "erd137esrr64ker9cspja6ey4wna7kqau3fyzawk9xgyr9n6925u6f2sm2rja6",
		senderShard: 1,
		signature: "3d1cabf5fca4c95748f2bad1367ffa1cea8ea628267f7e799cde46f70fcf179662e6f554ce13f49fc3f0e947a6d7c2a22b06c2366d6c5a1e9c925d9ee5d6fe0b",
		status: "success",
		value: "0",
		fee: "118000000000000",
		timestamp: 1643615040,
		data: "RVNEVFRyYW5zZmVyQDUxNTc1NDJkMzQzNjYxNjMzMDMxQDAzN2UxMWQ2MDA=",
		tokenIdentifier: "QWT-46ac01",
		tokenValue: "15000000000",
		action: {
			category: "esdtNft",
			name: "transfer",
			description: "Transfer 0.000000015 QoWatt (QWT) to erd1e6uwqpljusj58t0fuwucqtjadep3xyuhvah76a6y7frurmqgm2dqkv8pcd",
			arguments: {
				transfers: [
					{
						type: "FungibleESDT",
						token: "QWT-46ac01",
						ticker: "QWT",
						name: "QoWatt",
						value: "15000000000",
						decimals: 6,
					},
				],
				receiver: "erd1e6uwqpljusj58t0fuwucqtjadep3xyuhvah76a6y7frurmqgm2dqkv8pcd",
			},
		},
		results: [
			{
				hash: "aff3f111c43816ea483ee6f241fc214a12f761778bf6c596f2442f628265344f",
				timestamp: 1643615016,
				nonce: 4,
				gasLimit: 0,
				gasPrice: 1000000000,
				value: "1840000000000",
				sender: "erd1e6uwqpljusj58t0fuwucqtjadep3xyuhvah76a6y7frurmqgm2dqkv8pcd",
				receiver: "erd137esrr64ker9cspja6ey4wna7kqau3fyzawk9xgyr9n6925u6f2sm2rja6",
				data: "QDZmNmI=",
				prevTxHash: "87db96d4a04dc5729049a3faf6e7cd6064ecc91f48bdbef3a7889b8fb61538e8",
				originalTxHash: "87db96d4a04dc5729049a3faf6e7cd6064ecc91f48bdbef3a7889b8fb61538e8",
				callType: "0",
			},
			{
				hash: "1dddba667a478701d2cc0bd0a84d26fdbd86166174b22c4545530174f10d25bd",
				timestamp: 1643615064,
				nonce: 4,
				gasLimit: 0,
				gasPrice: 1000000000,
				value: "0",
				sender: "erd1e6uwqpljusj58t0fuwucqtjadep3xyuhvah76a6y7frurmqgm2dqkv8pcd",
				receiver: "erd137esrr64ker9cspja6ey4wna7kqau3fyzawk9xgyr9n6925u6f2sm2rja6",
				data: "QDZmNmI=",
				prevTxHash: "87db96d4a04dc5729049a3faf6e7cd6064ecc91f48bdbef3a7889b8fb61538e8",
				originalTxHash: "87db96d4a04dc5729049a3faf6e7cd6064ecc91f48bdbef3a7889b8fb61538e8",
				callType: "0",
			},
		],

		operations: [
			{
				action: "transfer",
				type: "esdt",
				esdtType: "FungibleESDT",
				identifier: "QWT-46ac01",
				name: "QoWatt",
				sender: "erd137esrr64ker9cspja6ey4wna7kqau3fyzawk9xgyr9n6925u6f2sm2rja6",
				receiver: "erd1e6uwqpljusj58t0fuwucqtjadep3xyuhvah76a6y7frurmqgm2dqkv8pcd",
				value: "15000000000",
				decimals: 6,
			},
		],
	};
	export default transactionDetails;
