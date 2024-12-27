# test.py
from pool_db_data import PoolDBData, PublicKey
from arbitrage import find_arbitrage_opportunities

def run_test_scenarios():
    account_key = PublicKey("test_account_id")
    program_key = PublicKey("test_program_id")

    # Scenario 1: All pools have the same price (no arbitrage)
    pools_same_price = [
        PoolDBData(
            rpcData="RPC1",
            baseReserve="1000",
            quoteReserve="500",
            mintAAmount="200",
            mintBAmount="300",
            poolPrice="2.0",
            lastUpdated=1629212345,
            isValid=True,
            accountId=account_key,
            programId=program_key
        ),
        PoolDBData(
            rpcData="RPC2",
            baseReserve="2000",
            quoteReserve="1000",
            mintAAmount="400",
            mintBAmount="600",
            poolPrice="2.0",
            lastUpdated=1629212346,
            isValid=True,
            accountId=account_key,
            programId=program_key
        )
    ]

    # Scenario 2: One pool cheaper, one pool more expensive (arbitrage opportunity)
    pools_arbitrage = [
        PoolDBData(
            rpcData="RPC1",
            baseReserve="1000",
            quoteReserve="500",
            mintAAmount="200",
            mintBAmount="300",
            poolPrice="1.8",
            lastUpdated=1629212345,
            isValid=True,
            accountId=account_key,
            programId=program_key
        ),
        PoolDBData(
            rpcData="RPC2",
            baseReserve="2000",
            quoteReserve="1000",
            mintAAmount="400",
            mintBAmount="600",
            poolPrice="2.0",
            lastUpdated=1629212346,
            isValid=True,
            accountId=account_key,
            programId=program_key
        ),
        PoolDBData(
            rpcData="RPC3",
            baseReserve="1500",
            quoteReserve="750",
            mintAAmount="300",
            mintBAmount="450",
            poolPrice="2.0",
            lastUpdated=1629212347,
            isValid=False,
            accountId=account_key,
            programId=program_key
        )
    ]

    # Scenario 3: No valid pools
    pools_no_valid = [
        PoolDBData(
            rpcData="RPC1",
            baseReserve="1000",
            quoteReserve="500",
            mintAAmount="200",
            mintBAmount="300",
            poolPrice="2.0",
            lastUpdated=1629212345,
            isValid=False,
            accountId=account_key,
            programId=program_key
        )
    ]

    print("---- TEST SCENARIO 1: All Pools Same Price ----")
    find_arbitrage_opportunities(pools_same_price)

    print("\n---- TEST SCENARIO 2: Arbitrage Exists ----")
    find_arbitrage_opportunities(pools_arbitrage)

    print("\n---- TEST SCENARIO 3: No Valid Pools ----")
    find_arbitrage_opportunities(pools_no_valid)
    
