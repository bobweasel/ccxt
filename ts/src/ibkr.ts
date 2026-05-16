// ---------------------------------------------------------------------------

import Exchange from './base/Exchange.js';
import { ArgumentsRequired, NotSupported } from './base/errors.js';
import type { Balances, Dict, Market, Num, Order, OrderBook, OrderSide, OrderType, Str, Ticker, Trade, int } from './base/types.js';

// ---------------------------------------------------------------------------

/**
 * @class ibkr
 * @augments Exchange
 * @description Broker adapter scaffold for Interactive Brokers. Configure options.brokerAdapter with deterministic callbacks to bridge the vendor SDK/API.
 */
export default class ibkr extends Exchange {
    describe (): any {
        return this.deepExtend (super.describe (), {
            'id': 'ibkr',
            'name': 'Interactive Brokers',
            'countries': [ 'US' ],
            'rateLimit': 1000,
            'certified': false,
            'pro': false,
            'has': {
                'CORS': undefined,
                'spot': true,
                'margin': true,
                'swap': false,
                'future': true,
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
                'www': 'https://www.interactivebrokers.com',
                'doc': [ 'https://interactivebrokers.github.io/cpwebapi/' ],
                'api': { 'broker': 'ibkr://local-adapter' },
            },
            'requiredCredentials': { 'apiKey': false, 'secret': false, 'uid': false, 'accountId': false },
            'options': {
                'markets': [],
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
        if (symbol === undefined) throw new ArgumentsRequired (this.id + ' fetchTicker() requires a symbol argument');
        await this.loadMarkets ();
        const market = this.market (symbol);
        const response = await this.callBroker ('fetchTicker', this.extend ({ 'symbol': symbol, 'market': market }, params));
        return this.safeTicker (response, market);
    }

    async fetchOrderBook (symbol: string, limit: int = undefined, params = {}): Promise<OrderBook> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const response = await this.callBroker ('fetchOrderBook', this.extend ({ 'symbol': symbol, 'market': market, 'limit': limit }, params));
        return this.parseOrderBook (response, market['symbol']);
    }

    async createOrder (symbol: string, type: OrderType, side: OrderSide, amount: Num, price: Num = undefined, params = {}): Promise<Order> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const response = await this.callBroker ('createOrder', this.extend ({ 'symbol': symbol, 'market': market, 'type': type, 'side': side, 'amount': amount, 'price': price }, params));
        return this.parseOrder (response, market);
    }

    async cancelOrder (id: string, symbol: Str = undefined, params = {}): Promise<Order> {
        const response = await this.callBroker ('cancelOrder', this.extend ({ 'id': id, 'symbol': symbol }, params));
        return this.parseOrder (response);
    }

    async fetchOrder (id: string, symbol: Str = undefined, params = {}): Promise<Order> {
        const response = await this.callBroker ('fetchOrder', this.extend ({ 'id': id, 'symbol': symbol }, params));
        return this.parseOrder (response);
    }

    async fetchOpenOrders (symbol: Str = undefined, since: int = undefined, limit: int = undefined, params = {}): Promise<Order[]> {
        const response = await this.callBroker ('fetchOpenOrders', this.extend ({ 'symbol': symbol, 'since': since, 'limit': limit }, params));
        return this.parseOrders (response, undefined, since, limit);
    }

    async fetchMyTrades (symbol: Str = undefined, since: int = undefined, limit: int = undefined, params = {}): Promise<Trade[]> {
        const response = await this.callBroker ('fetchMyTrades', this.extend ({ 'symbol': symbol, 'since': since, 'limit': limit }, params));
        return this.parseTrades (response, undefined, since, limit);
    }

    async fetchTrades (symbol: string, since: int = undefined, limit: int = undefined, params = {}): Promise<Trade[]> {
        const response = await this.callBroker ('fetchTrades', this.extend ({ 'symbol': symbol, 'since': since, 'limit': limit }, params));
        return this.parseTrades (response, undefined, since, limit);
    }

    async fetchPositions (symbols: Str[] = undefined, params = {}): Promise<any[]> {
        const response = await this.callBroker ('fetchPositions', this.extend ({ 'symbols': symbols }, params));
        return this.parsePositions (response, symbols);
    }
}
