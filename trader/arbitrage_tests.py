"""Tests for identifying arbitrage opportunities among pool data.

This module contains test cases for verifying the functionality of arbitrage
detection algorithms when analyzing pool data.
"""

from typing import Tuple
# pylint: disable=import-error
import pytest

from pool_db_data import PoolDBData, PublicKey
from arbitrage import find_arbitrage_opportunities


@pytest.fixture(name='pool_keys')
def fixture_pool_keys() -> Tuple[PublicKey, PublicKey]:
    """Provide common account and program keys for tests.

    Returns:
        Tuple[PublicKey, PublicKey]: A tuple containing account and program PublicKey instances.
    """
    account_key = PublicKey("test_account_id")
    program_key = PublicKey("test_program_id")
    return account_key, program_key


def test_no_arbitrage_opportunities(pool_keys: Tuple[PublicKey, PublicKey]) -> None:
    """Test scenario where all pools have the same price.

    Tests the case where no arbitrage opportunities should exist due to
    uniform pricing across all pools.

    Args:
        pool_keys: Fixture providing test keys.
    """
    account_key, program_key = pool_keys
    pools_same_price = [
        PoolDBData(
            rpc_data="RPC1",
            base_reserve="1000",
            quote_reserve="500",
            mint_a_amount="200",
            mint_b_amount="300",
            pool_price="2.0",
            last_updated=1629212345,
            is_valid=True,
            account_id=account_key,
            program_id=program_key
        ),
        PoolDBData(
            rpc_data="RPC2",
            base_reserve="2000",
            quote_reserve="1000",
            mint_a_amount="400",
            mint_b_amount="600",
            pool_price="2.0",
            last_updated=1629212346,
            is_valid=True,
            account_id=account_key,
            program_id=program_key
        )
    ]

    # Using direct assertion instead of assignment
    assert find_arbitrage_opportunities(pools_same_price) is None, (
        "Expected no arbitrage opportunities, but some were found."
    )


def test_arbitrage_opportunities_exist(pool_keys: Tuple[PublicKey, PublicKey]) -> None:
    """Test scenario with price differences creating arbitrage opportunities.

    Tests the case where pools have different prices, creating potential
    arbitrage opportunities between them.

    Args:
        pool_keys: Fixture providing test keys.
    """
    account_key, program_key = pool_keys
    pools_arbitrage = [
        PoolDBData(
            rpc_data="RPC1",
            base_reserve="1000",
            quote_reserve="500",
            mint_a_amount="200",
            mint_b_amount="300",
            pool_price="1.8",
            last_updated=1629212345,
            is_valid=True,
            account_id=account_key,
            program_id=program_key
        ),
        PoolDBData(
            rpc_data="RPC2",
            base_reserve="2000",
            quote_reserve="1000",
            mint_a_amount="400",
            mint_b_amount="600",
            pool_price="2.0",
            last_updated=1629212346,
            is_valid=True,
            account_id=account_key,
            program_id=program_key
        ),
        PoolDBData(
            rpc_data="RPC3",
            base_reserve="1500",
            quote_reserve="750",
            mint_a_amount="300",
            mint_b_amount="450",
            pool_price="2.0",
            last_updated=1629212347,
            is_valid=False,  # Invalid pool should be ignored
            account_id=account_key,
            program_id=program_key
        )
    ]

    # Get arbitrage opportunities
    # pylint: disable=assignment-from-none
    # pylint: disable=unsubscriptable-object
    result = find_arbitrage_opportunities(pools_arbitrage)
    if result is None:
        pytest.fail("Expected arbitrage opportunities, but none were found.")

    # Safely handle result
    if not isinstance(result, (tuple, list)) or len(result) != 5:
        pytest.fail("Invalid result format: expected 5-element sequence")
    buy_rpc, buy_price, sell_rpc, sell_price, margin = (
            str(result[0]),
            float(result[1]),
            str(result[2]),
            float(result[3]),
            float(result[4])
        )

    margin = round(margin, 3)
    assert buy_rpc == "RPC1", "Expected to buy from RPC1."
    assert buy_price == 1.8, "Expected buy price of 1.8."
    assert sell_rpc == "RPC2", "Expected to sell to RPC2."
    assert sell_price == 2.0, "Expected sell price of 2.0."
    assert margin == 0.2, "Expected margin of 0.2."


def test_no_valid_pools(pool_keys: Tuple[PublicKey, PublicKey]) -> None:
    """Test scenario with no valid pools.

    Tests the case where all pools are marked as invalid, ensuring
    no arbitrage opportunities are found.

    Args:
        pool_keys: Fixture providing test keys.
    """
    account_key, program_key = pool_keys
    pools_no_valid = [
        PoolDBData(
            rpc_data="RPC1",
            base_reserve="1000",
            quote_reserve="500",
            mint_a_amount="200",
            mint_b_amount="300",
            pool_price="2.0",
            last_updated=1629212345,
            is_valid=False,  # Invalid pool
            account_id=account_key,
            program_id=program_key
        )
    ]

    # Using direct assertion instead of assignment
    assert find_arbitrage_opportunities(pools_no_valid) is None, (
        "Expected no arbitrage opportunities with no valid pools."
    )
