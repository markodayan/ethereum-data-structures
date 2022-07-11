import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();
import * as utils from '@lib/utils/conversion';
import { exportToJSONFile } from '@lib/utils/export';
import { LONDON_HARDFORK_BLOCK } from '@src/constants';

interface ISeedBlock {
  blockNumber: number;
  path?: string;
}

declare module 'axios' {
  type AxiosReponse<T> = Promise<T>;
}

abstract class HttpClient {
  protected readonly instance: AxiosInstance;
  public baseURL: string;

  public constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.instance = axios.create({
      baseURL,
    });

    this._initializeResponseInterceptor();
  }

  private _initializeResponseInterceptor(): void {
    this.instance.interceptors.response.use(this._handleResponse, this._handleError);
  }

  private _handleResponse = (data: AxiosResponse) => data;

  protected _handleError = (error: Error) => Promise.reject(error);
}

const config = {
  headers: {
    'Content-Type': 'application/json',
  },
};

class Provider extends HttpClient {
  private static instance: Provider;
  protected readonly config: { headers: { 'Content-Type': string } };
  public company: string;

  private constructor(company: string, key: string) {
    const url =
      company === 'infura'
        ? `https://${process.env.INFURA_URL}${key}#
`
        : `https://${process.env.ALCHEMY_URL}${key}`;

    super(url);
    this.config = config;
    this.company = company;
  }

  public static getInstance(company: string, key: string): Provider {
    if (!this.instance) {
      this.instance = new Provider(company, key);
    }

    return this.instance;
  }

  /**
   * Fetch raw block by number via JSON-RPC
   * @param {string} blockNumber - 12396599
   * @param {boolean} verbose - true
   * @returns {Promise<IRawBlock>}
   */
  public async getBlockByNumber(blockNumber: number, verbose = false): Promise<IRawBlock> {
    // @ts-ignore
    if (isNaN(blockNumber) || blockNumber === '') {
      throw new Error('User supplied invalid string as block number');
    }

    if (+blockNumber < 0) {
      throw new Error('User supplied block number that does not exist');
    }

    const res = await this.instance.post(
      this.company === 'infura' ? 'eth_getBlockByNumber' : '',
      {
        jsonrpc: '2.0',
        method: 'eth_getBlockByNumber',
        params: ['0x' + blockNumber.toString(16), verbose],
        id: 0,
      },
      this.config
    );

    if (res.data.error?.code) {
      throw new Error(res.data.error.code);
    }

    const { result } = res.data;
    return result;
  }

  /**
   * Fetch latest raw block via JSON-RPC
   * @param {boolean} verbose - true
   * @returns {Promise<IRawBlock>}
   */
  public async getLatestBlock(verbose = false): Promise<IRawBlock> {
    const res = await this.instance.post(
      this.company === 'infura' ? 'eth_getBlockByNumber' : '',
      {
        jsonrpc: '2.0',
        method: 'eth_getBlockByNumber',
        params: ['latest', verbose],
        id: 0,
      },
      this.config
    );

    const { result } = res.data;
    return result;
  }

  /**
   * Generate JSON file of latest block in specified directory
   * @param {string} path - optional parameter: string path from project root to destination
   */
  public async seedLatestBlock(path = '/junk/blocks/1559') {
    const block = this.getLatestBlock();
    const blockNumber = parseInt((await block).number, 16);
    exportToJSONFile(block, blockNumber.toString(), path);
  }

  public async seedBlockByNumber(...args: [number, string?]) {
    let [blockNumber, path] = args;
    if (!blockNumber) throw new Error('No block number specified');

    const block = this.getBlockByNumber(blockNumber);

    if (!path) {
      path = blockNumber >= LONDON_HARDFORK_BLOCK ? '/junk/blocks/1559' : '/junk/blocks/legacy';
    }

    exportToJSONFile(block, blockNumber.toString(), path);
  }
}

/*
 * Class that the developer will instantiate supplying provider name
 */
class ProviderClientInterface {
  public provider: Provider;

  constructor(company: string, key: string) {
    if (!['infura', 'alchemy'].includes(company)) {
      throw new Error(`Must supply either 'infura' or 'alchemy' as company name argument to instantiate the provider`);
    }

    this.provider = Provider.getInstance(company, key);
  }
}

export default ProviderClientInterface;
