# -*- coding: utf-8 -*-

from ccxt.base.exchange import Exchange
from ccxt.base.errors import ArgumentsRequired, NotSupported


class ig(Exchange):
    """Broker adapter scaffold for IG. Configure options['brokerAdapter'] with deterministic callbacks to bridge the vendor SDK/API."""

    def describe(self):
        return self.deep_extend(super(ig, self).describe(), {
            'id': 'ig',
            'name': 'IG',
            'countries': ['GB'],
            'rateLimit': 1000,
            'certified': False,
            'pro': False,
            'has': {
                'CORS': None, 'spot': True, 'margin': True,
                'swap': False, 'future': True, 'option': True,
                'createOrder': True, 'cancelOrder': True, 'fetchBalance': True, 'fetchMarkets': 'emulated',
                'fetchMyTrades': True, 'fetchOpenOrders': True, 'fetchOrder': True, 'fetchOrderBook': True,
                'fetchPositions': True, 'fetchTicker': True, 'fetchTrades': True,
            },
            'urls': {'www': 'https://www.ig.com', 'doc': ['https://labs.ig.com/rest-trading-api-guide'], 'api': {'broker': 'ig://local-adapter'}},
            'requiredCredentials': {'apiKey': False, 'secret': False, 'uid': False, 'accountId': False},
            'options': {'markets': [], 'brokerAdapter': None},
        })

    def call_broker(self, method, params={}):
        adapter = self.safe_value(self.options, 'brokerAdapter')
        if adapter is None:
            raise NotSupported(self.id + ' requires options.brokerAdapter.' + method + ' for this operation')
        callback = adapter.get(method) if isinstance(adapter, dict) else getattr(adapter, method, None)
        if callback is None:
            raise NotSupported(self.id + ' requires options.brokerAdapter.' + method + ' for this operation')
        return callback(params)

    def fetch_markets(self, params={}):
        return self.safe_value(self.options, 'markets', [])

    def fetch_balance(self, params={}):
        return self.safe_balance(self.call_broker('fetchBalance', params))

    def fetch_ticker(self, symbol, params={}):
        if symbol is None:
            raise ArgumentsRequired(self.id + ' fetch_ticker() requires a symbol argument')
        self.load_markets()
        market = self.market(symbol)
        return self.safe_ticker(self.call_broker('fetchTicker', self.extend({'symbol': symbol, 'market': market}, params)), market)

    def fetch_order_book(self, symbol, limit=None, params={}):
        self.load_markets()
        market = self.market(symbol)
        return self.parse_order_book(self.call_broker('fetchOrderBook', self.extend({'symbol': symbol, 'market': market, 'limit': limit}, params)), market['symbol'])

    def create_order(self, symbol, type, side, amount, price=None, params={}):
        self.load_markets()
        market = self.market(symbol)
        return self.parse_order(self.call_broker('createOrder', self.extend({'symbol': symbol, 'market': market, 'type': type, 'side': side, 'amount': amount, 'price': price}, params)), market)

    def cancel_order(self, id, symbol=None, params={}):
        return self.parse_order(self.call_broker('cancelOrder', self.extend({'id': id, 'symbol': symbol}, params)))

    def fetch_order(self, id, symbol=None, params={}):
        return self.parse_order(self.call_broker('fetchOrder', self.extend({'id': id, 'symbol': symbol}, params)))

    def fetch_open_orders(self, symbol=None, since=None, limit=None, params={}):
        return self.parse_orders(self.call_broker('fetchOpenOrders', self.extend({'symbol': symbol, 'since': since, 'limit': limit}, params)), None, since, limit)

    def fetch_my_trades(self, symbol=None, since=None, limit=None, params={}):
        return self.parse_trades(self.call_broker('fetchMyTrades', self.extend({'symbol': symbol, 'since': since, 'limit': limit}, params)), None, since, limit)

    def fetch_trades(self, symbol, since=None, limit=None, params={}):
        return self.parse_trades(self.call_broker('fetchTrades', self.extend({'symbol': symbol, 'since': since, 'limit': limit}, params)), None, since, limit)

    def fetch_positions(self, symbols=None, params={}):
        return self.parse_positions(self.call_broker('fetchPositions', self.extend({'symbols': symbols}, params)), symbols)
