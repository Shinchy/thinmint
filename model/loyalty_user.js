ThinMint.RequestMethod.add('Loyalty.User', new ThinMint.RpcRequest({
  eventName: ThinMint.Event.RPC_LOYALTY_USER,
  method: 'loyalty.user.get',
  save: {
    method: 'loyalty_join' //'loyalty.user.post'
  }
}));
