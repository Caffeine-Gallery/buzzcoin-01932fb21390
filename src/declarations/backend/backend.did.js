export const idlFactory = ({ IDL }) => {
  const TxRecord = IDL.Record({
    'to' : IDL.Principal,
    'from' : IDL.Principal,
    'timestamp' : IDL.Int,
    'txType' : IDL.Text,
    'amount' : IDL.Nat,
  });
  const Result = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const Caffeine = IDL.Service({
    'balanceOf' : IDL.Func([IDL.Principal], [IDL.Nat], ['query']),
    'getMetadata' : IDL.Func(
        [],
        [
          IDL.Record({
            'decimals' : IDL.Nat8,
            'name' : IDL.Text,
            'totalSupply' : IDL.Nat,
            'symbol' : IDL.Text,
          }),
        ],
        ['query'],
      ),
    'getTransactions' : IDL.Func(
        [IDL.Nat, IDL.Nat],
        [IDL.Vec(TxRecord)],
        ['query'],
      ),
    'initialize' : IDL.Func([], [], []),
    'mine' : IDL.Func([], [Result], []),
    'transfer' : IDL.Func([IDL.Principal, IDL.Nat], [Result], []),
  });
  return Caffeine;
};
export const init = ({ IDL }) => { return []; };
