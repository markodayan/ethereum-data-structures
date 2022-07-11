import { Provider } from '@src/packages';

const { provider } = new Provider('infura', process.env.INFURA_PROJECT_ID as string);

// provider.getLatestBlock().then((block) => {
//   const blockNumber = parseInt(block.number, 16);
//   exportToJSONFile(block, blockNumber.toString(), '/junk/blocks/1559');
// });

// provider.seedLatestBlock();
// provider.seedBlockByNumber(12_964_600);
// provider.seedBlockByNumber(13_968_600);

// provider.getBlockByNumber(12_964_760).then((block) => {
//   const blockNumber = parseInt(block.number, 16);
//   exportToJSONFile(block, blockNumber.toString(), '/junk/blocks/legacy');
// });