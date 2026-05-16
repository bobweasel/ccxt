# -*- coding: utf-8 -*-

# -----------------------------------------------------------------------------

from ccxt.base.exchange import Exchange
from ccxt.base.errors import ArgumentsRequired, NotSupported

# -----------------------------------------------------------------------------


class moomoo(Exchange):
    """Broker adapter scaffold for Moomoo. Configure options['brokerAdapter'] with deterministic callbacks to bridge the vendor SDK/API."""

    def describe(self):
        return self.deep_extend(super(moomoo, self).describe(), {
            'id': 'moomoo',
            'name': 'Moomoo',
            'countries': ['US', 'HK', 'SG'],
            'rateLimit': 1000,
            'certified': False,
            'pro': False,
            'has': {
                'CORS': None,
                'spot': True,
                'margin': True,
                'swap': False,
                'future': False,
                'option': True,
                'createOrder': True,
                'cancelOrder': True,
                'fetchBalance': True,
                'fetchMarkets': 'emulated',
                'fetchMyTrades': True,
                'fetchOpenOrders': True,
                'fetchOrder': True,
                'fetchOrderBook': True,
                'fetchPositions': True,
                'fetchTicker': True,
                'fetchTrades': True,
            },
            'urls': {
                'www': 'https://www.moomoo.com',
                'doc': ['https://openapi.moomoo.com/'],
                'api': {
                    'broker': 'moomoo://local-adapter',
                },
            },
            'requiredCredentials': {
                'apiKey': False,
                'secret': False,
                'uid': False,
                'accountId': False,
            },
            'options': {
                'markets': [],
                'brokerAdapter': None,
            },
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
        response = self.call_broker('fetchBalance', params)
        return self.safe_balance(response)

    def fetch_ticker(self, symbol, params={}):
        if symbol is None:
            raise ArgumentsRequired(self.id + ' fetch_ticker() requires a symbol argument')
        self.load_markets()
        market = self.market(symbol)
        request = {'symbol': symbol, 'market': market}
        response = self.call_broker('fetchTicker', self.extend(request, params))
        return self.safe_ticker(response, market)

    def fetch_order_book(self, symbol, limit=None, params={}):
        self.load_markets()
        market = self.market(symbol)
        request = {'symbol': symbol, 'market': market, 'limit': limit}
        response = self.call_broker('fetchOrderBook', self.extend(request, params))
        return self.parse_order_book(response, market['symbol'])

    def create_order(self, symbol, type, side, amount, price=None, params={}):
        self.load_markets()
        market = self.market(symbol)
        request = {'symbol': symbol, 'market': market, 'type': type, 'side': side, 'amount': amount, 'price': price}
        response = self.call_broker('createOrder', self.extend(request, params))
        return self.parse_order(response, market)

    def cancel_order(self, id, symbol=None, params={}):
        response = self.call_broker('cancelOrder', self.extend({'id': id, 'symbol': symbol}, params))
        return self.parse_order(response)

    def fetch_order(self, id, symbol=None, params={}):
        response = self.call_broker('fetchOrder', self.extend({'id': id, 'symbol': symbol}, params))
        return self.parse_order(response)

    def fetch_open_orders(self, symbol=None, since=None, limit=None, params={}):
        request = {'symbol': symbol, 'since': since, 'limit': limit}
        response = self.call_broker('fetchOpenOrders', self.extend(request, params))
        return self.parse_orders(response, None, since, limit)

    def fetch_my_trades(self, symbol=None, since=None, limit=None, params={}):
        request = {'symbol': symbol, 'since': since, 'limit': limit}
        response = self.call_broker('fetchMyTrades', self.extend(request, params))
        return self.parse_trades(response, None, since, limit)

    def fetch_trades(self, symbol, since=None, limit=None, params={}):
        request = {'symbol': symbol, 'since': since, 'limit': limit}
        response = self.call_broker('fetchTrades', self.extend(request, params))
        return self.parse_trades(response, None, since, limit)

    def fetch_positions(self, symbols=None, params={}):
        response = self.call_broker('fetchPositions', self.extend({'symbols': symbols}, params))
        return self.parse_positions(response, symbols)
