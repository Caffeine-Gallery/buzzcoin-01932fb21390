import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Caffeine {
  'balanceOf' : ActorMethod<[Principal], bigint>,
  'getMetadata' : ActorMethod<
    [],
    {
      'decimals' : number,
      'name' : string,
      'totalSupply' : bigint,
      'symbol' : string,
    }
  >,
  'getTransactions' : ActorMethod<[bigint, bigint], Array<TxRecord>>,
  'initialize' : ActorMethod<[], undefined>,
  'mine' : ActorMethod<[], Result>,
  'transfer' : ActorMethod<[Principal, bigint], Result>,
}
export type Result = { 'ok' : string } |
  { 'err' : string };
export interface TxRecord {
  'to' : Principal,
  'from' : Principal,
  'timestamp' : bigint,
  'txType' : string,
  'amount' : bigint,
}
export interface _SERVICE extends Caffeine {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
