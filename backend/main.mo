import Nat8 "mo:base/Nat8";

import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Time "mo:base/Time";
import Error "mo:base/Error";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Debug "mo:base/Debug";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Float "mo:base/Float";
import Blob "mo:base/Blob";
import Nat64 "mo:base/Nat64";
import Hash "mo:base/Hash";

actor class Caffeine() = this {
    private stable var CANISTER_ID = Principal.fromActor(this);
    
    // ICRC3 Token Implementation
    private stable var totalSupply : Nat = 0;
    private stable var symbol : Text = "CAFF";
    private stable var name : Text = "Caffeine Token";
    private stable var decimals : Nat8 = 8;
    private stable var fee : Nat = 1;
    
    // Mining rate: 1 ICP = 1000 CAFF
    private let MINING_RATE : Nat = 1000;
    
    private type Account = {
        owner: Principal;
        balance: Nat;
    };

    private type TxRecord = {
        from: Principal;
        to: Principal;
        amount: Nat;
        timestamp: Int;
        txType: Text; // "transfer", "mint", "burn"
    };

    private var balances = HashMap.HashMap<Principal, Nat>(1, Principal.equal, Principal.hash);
    private var transactions = HashMap.HashMap<Nat, TxRecord>(1, Nat.equal, Hash.hash);
    private stable var txCounter : Nat = 0;

    // Initialize the ledger
    public shared(msg) func initialize() : async () {
        assert(msg.caller == CANISTER_ID);
        balances.put(msg.caller, totalSupply);
    };

    // Get token metadata
    public query func getMetadata() : async {
        symbol: Text;
        name: Text;
        decimals: Nat8;
        totalSupply: Nat;
    } {
        return {
            symbol = symbol;
            name = name;
            decimals = decimals;
            totalSupply = totalSupply;
        };
    };

    // Get balance
    public query func balanceOf(account: Principal) : async Nat {
        switch (balances.get(account)) {
            case (null) { return 0; };
            case (?balance) { return balance; };
        };
    };

    // Mine tokens by paying ICP
    public shared(msg) func mine() : async Result.Result<Text, Text> {
        let amount = 1_000_000_000; // 1 ICP in e8s
        let icpCanister = actor "ryjl3-tyaaa-aaaaa-aaaba-cai" : actor {
            transfer : shared {
                memo: Nat64;
                amount: { e8s: Nat64 };
                fee: { e8s: Nat64 };
                from_subaccount: ?[Nat8];
                to: Principal;
                created_at_time: ?Nat64;
            } -> async { height: Nat64 };
        };

        try {
            let result = await icpCanister.transfer({
                memo = 0;
                amount = { e8s = Nat64.fromNat(amount) };
                fee = { e8s = 10000 };
                from_subaccount = null;
                to = CANISTER_ID;
                created_at_time = null;
            });

            // Mint CAFF tokens
            let mintAmount = MINING_RATE * (amount / 100000000);
            await mint(msg.caller, mintAmount);
            
            #ok("Successfully mined " # Nat.toText(mintAmount) # " CAFF tokens")
        } catch (e) {
            #err("Mining failed: " # Error.message(e))
        };
    };

    // Internal mint function
    private func mint(to: Principal, amount: Nat) : async () {
        let currentBalance = switch (balances.get(to)) {
            case (null) { 0 };
            case (?balance) { balance };
        };
        
        balances.put(to, currentBalance + amount);
        totalSupply += amount;
        
        // Record transaction
        let tx : TxRecord = {
            from = CANISTER_ID;
            to = to;
            amount = amount;
            timestamp = Time.now();
            txType = "mint";
        };
        transactions.put(txCounter, tx);
        txCounter += 1;
    };

    // Transfer tokens
    public shared(msg) func transfer(to: Principal, amount: Nat) : async Result.Result<Text, Text> {
        let from = msg.caller;
        
        switch (balances.get(from)) {
            case (null) { return #err("Insufficient balance"); };
            case (?fromBalance) {
                if (fromBalance < amount + fee) {
                    return #err("Insufficient balance");
                };
                
                let toBalance = switch (balances.get(to)) {
                    case (null) { 0 };
                    case (?balance) { balance };
                };
                
                balances.put(from, fromBalance - amount - fee);
                balances.put(to, toBalance + amount);
                
                // Record transaction
                let tx : TxRecord = {
                    from = from;
                    to = to;
                    amount = amount;
                    timestamp = Time.now();
                    txType = "transfer";
                };
                transactions.put(txCounter, tx);
                txCounter += 1;
                
                #ok("Transfer successful")
            };
        };
    };

    // Get transaction history
    public query func getTransactions(start: Nat, limit: Nat) : async [TxRecord] {
        let txs = Iter.toArray(transactions.vals());
        let end = if (start + limit > txs.size()) { txs.size() } else { start + limit };
        Array.subArray(txs, start, end - start);
    };
};
