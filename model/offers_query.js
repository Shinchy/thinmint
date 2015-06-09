ThinMint.RequestMethod.add('Offers.Query', new ThinMint.RpcRequest({
  eventName: ThinMint.Event.RPC_OFFERS_QUERY,
  method: 'offers.query',
  params: [{
    format_for: 'mustache',
    view: 'cart_user_visible'
  }]
}));
