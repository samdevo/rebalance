import pytest
from pool_db_data import PoolDBData, PublicKey
from arbitrage import find_arbitrage_opportunities

@pytest.fixture
def account_and_program_keys():
    """
    Fixture to provide common account and program keys for tests.
    """
    account_key = PublicKey("test_account_id")
    program_key = PublicKey("test_program_id")
    return account_key, program_key

def test_no_arbitrage_opportunities(account_and_program_keys):
    """
    Test Scenario 1: All pools have the same price (no arbitrage).
    Expectation: No arbitrage opportunities should be found.
    """
    account_key, program_key = account_and_program_keys
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

    arbitrage_opps = find_arbitrage_opportunities(pools_same_price)
    assert not arbitrage_opps, "Expected no arbitrage opportunities, but some were found."

def test_arbitrage_opportunities_exist(account_and_program_keys):
    """
    Test Scenario 2: One pool cheaper, one pool more expensive (arbitrage opportunity).
    Expectation: Arbitrage opportunities should be identified.
    """
    account_key, program_key = account_and_program_keys
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
            isValid=False,  # Invalid pool should be ignored
            accountId=account_key,
            programId=program_key
        )
    ]

    arbitrage_opps = find_arbitrage_opportunities(pools_arbitrage)
    assert arbitrage_opps, "Expected arbitrage opportunities, but none were found."
    
    # Example assertion: Check specific arbitrage opportunity details
    # This depends on what find_arbitrage_opportunities returns
    # For instance:
    # expected_opportunity = {...}
    # assert expected_opportunity in arbitrage_opps

def test_no_valid_pools(account_and_program_keys):
    """
    Test Scenario 3: No valid pools.
    Expectation: No arbitrage opportunities should be found.
    """
    account_key, program_key = account_and_program_keys
    pools_no_valid = [
        PoolDBData(
            rpcData="RPC1",
            baseReserve="1000",
            quoteReserve="500",
            mintAAmount="200",
            mintBAmount="300",
            poolPrice="2.0",
            lastUpdated=1629212345,
            isValid=False,  # Invalid pool
            accountId=account_key,
            programId=program_key
        )
    ]

    arbitrage_opps = find_arbitrage_opportunities(pools_no_valid)
    assert not arbitrage_opps, "Expected no arbitrage opportunities with no valid pools, but some were found."
