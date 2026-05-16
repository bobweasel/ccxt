// ---------------------------------------------------------------------------

import Exchange from './base/Exchange.js';
import { ArgumentsRequired, NotSupported } from './base/errors.js';
import type { Balances, Dict, Market, Num, Order, OrderBook, OrderSide, OrderType, Str, Ticker, Trade, int } from './base/types.js';

// ---------------------------------------------------------------------------

/**
 * @class moomoo
 * @augments Exchange
 * @description Broker adapter scaffold for Moomoo. Configure options.brokerAdapter with deterministic callbacks to bridge the vendor SDK/API.
 */
export default class moomoo extends Exchange {
    describe (): any {
        return this.deepExtend (super.describe (), {
            'id': 'moomoo',
            'name': 'Moomoo',
            'countries': [ 'US', 'HK', 'SG' ],
            'rateLimit': 1000,
            'certified': false,
            'pro': false,
            'has': {
                'CORS': undefined,
                'spot': true,
                'margin': true,
                'swap': false,
                'future': false,
                'option': true,
                'createOrder': true,
                'cancelOrder': true,
                'fetchBalance': true,
                'fetchMarkets': 'emulated',
                'fetchMyTrades': true,
                'fetchOpenOrders': true,
                'fetchOrder': true,
                'fetchOrderBook': true,
                'fetchPositions': true,
                'fetchTicker': true,
                'fetchTrades': true,
            },
            'urls': {
                'www': 'https://www.moomoo.com',
                'doc': [ 'https://openapi.moomoo.com/' ],
                'api': {
                    'broker': 'moomoo://local-adapter',
                },
            },
            'requiredCredentials': {
                'apiKey': false,
                'secret': false,
                'uid': false,
                'accountId': false,
            },
            'options': {
                // Markets can be provided by the embedding app when the vendor API does not expose a CCXT-style catalogue.
                'markets': [],
                // brokerAdapter methods: fetchBalance, fetchTicker, fetchOrderBook, createOrder, cancelOrder,
                // fetchOpenOrders, fetchOrder, fetchMyTrades, fetchTrades, fetchPositions.
                'brokerAdapter': undefined,
            },
        });
    }

    async callBroker (method: string, params: Dict = {}): Promise<any> {
        const adapter = this.safeValue (this.options, 'brokerAdapter');
        if ((adapter === undefined) || (adapter[method] === undefined)) {
            throw new NotSupported (this.id + ' requires options.brokerAdapter.' + method + ' for this operation');
        }
        return await adapter[method] (params);
    }

    async fetchMarkets (params = {}): Promise<Market[]> {
        const markets = this.safeValue (this.options, 'markets', []);
        return markets as Market[];
    }

    async fetchBalance (params = {}): Promise<Balances> {
        const response = await this.callBroker ('fetchBalance', params);
        return this.safeBalance (response);
    }

    async fetchTicker (symbol: string, params = {}): Promise<Ticker> {
        if (symbol === undefined) {
            throw new ArgumentsRequired (this.id + ' fetchTicker() requires a symbol argument');
        }
        await this.loadMarkets ();
        const market = this.market (symbol);
        const response = await this.callBroker ('fetchTicker', this.extend ({ 'symbol': symbol, 'market': market }, params));
        return this.safeTicker (response, market);
    }

    async fetchOrderBook (symbol: string, limit: int = undefined, params = {}): Promise<OrderBook> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = { 'symbol': symbol, 'market': market, 'limit': limit };
        const response = await this.callBroker ('fetchOrderBook', this.extend (request, params));
        return this.parseOrderBook (response, market['symbol']);
    }

    async createOrder (symbol: string, type: OrderType, side: OrderSide, amount: Num, price: Num = undefined, params = {}): Promise<Order> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'symbol': symbol,
            'market': market,
            'type': type,
            'side': side,
            'amount': amount,
            'price': price,
        };
        const response = await this.callBroker ('createOrder', this.extend (request, params));
        return this.parseOrder (response, market);
    }

    async cancelOrder (id: string, symbol: Str = undefined, params = {}): Promise<Order> {
        const request = { 'id': id, 'symbol': symbol };
        const response = await this.callBroker ('cancelOrder', this.extend (request, params));
        return this.parseOrder (response);
    }

    async fetchOrder (id: string, symbol: Str = undefined, params = {}): Promise<Order> {
        const request = { 'id': id, 'symbol': symbol };
        const response = await this.callBroker ('fetchOrder', this.extend (request, params));
        return this.parseOrder (response);
    }

    async fetchOpenOrders (symbol: Str = undefined, since: int = undefined, limit: int = undefined, params = {}): Promise<Order[]> {
        const request = { 'symbol': symbol, 'since': since, 'limit': limit };
        const response = await this.callBroker ('fetchOpenOrders', this.extend (request, params));
        return this.parseOrders (response, undefined, since, limit);
    }

    async fetchMyTrades (symbol: Str = undefined, since: int = undefined, limit: int = undefined, params = {}): Promise<Trade[]> {
        const request = { 'symbol': symbol, 'since': since, 'limit': limit };
        const response = await this.callBroker ('fetchMyTrades', this.extend (request, params));
        return this.parseTrades (response, undefined, since, limit);
    }

    async fetchTrades (symbol: string, since: int = undefined, limit: int = undefined, params = {}): Promise<Trade[]> {
        const request = { 'symbol': symbol, 'since': since, 'limit': limit };
        const response = await this.callBroker ('fetchTrades', this.extend (request, params));
        return this.parseTrades (response, undefined, since, limit);
    }

    async fetchPositions (symbols: Str[] = undefined, params = {}): Promise<any[]> {
        const response = await this.callBroker ('fetchPositions', this.extend ({ 'symbols': symbols }, params));
        return this.parsePositions (response, symbols);
    }
}
