"""Module for identifying arbitrage opportunities among pool data."""

from typing import List, Optional, Tuple

from pool_db_data import PoolDBData


def find_arbitrage_opportunities(
    pool_data: List[PoolDBData]
) -> Optional[Tuple[str, float, str, float, float]]:
    """
    Identify arbitrage opportunities based on pool prices.

    This function filters valid pools, extracts their prices, identifies the pools
    with the minimum and maximum prices, and determines if a profitable arbitrage
    opportunity exists between them.

    Args:
        pool_data (List[PoolDBData]): A list of PoolDBData instances representing
                                      different liquidity pools.

    Returns:
        Optional[Tuple[str, float, str, float, float]]:
            - A tuple containing:
                1. RPC address to buy from (str)
                2. Buy price (float)
                3. RPC address to sell to (str)
                4. Sell price (float)
                5. Potential margin per base token (float)
            - Returns None if no arbitrage opportunity is found.
    """
    # Filter only valid pools
    valid_pools = [pool for pool in pool_data if pool.is_valid]
    print(f"Valid pools count: {len(valid_pools)}")

    # Extract prices as floats
    # Note: pool_price is assumed to be the direct ratio price (quote per base).
    pool_prices = []
    for pool in valid_pools:
        price = float(pool.pool_price)
        pool_prices.append((pool.rpc_data, price))
        print(f"Processed pool {pool.rpc_data} with price {price}")

    if not pool_prices:
        print("No valid pools with valid prices available.")
        return None

    # Identify pools with minimum and maximum prices
    min_price_pool = min(pool_prices, key=lambda x: x[1])
    max_price_pool = max(pool_prices, key=lambda x: x[1])

    min_price = min_price_pool[1]
    max_price = max_price_pool[1]

    print(f"Minimum price pool: {min_price_pool[0]} at price {min_price}")
    print(f"Maximum price pool: {max_price_pool[0]} at price {max_price}")

    # Check if there's a profitable price difference
    if max_price > min_price:
        # Potential arbitrage margin per base unit
        margin = max_price - min_price
        print("Arbitrage opportunity found:")
        print(
            f"Buy from {min_price_pool[0]} at price {min_price} and sell to "
            f"{max_price_pool[0]} at price {max_price}."
        )
        print(f"Potential margin per base token: {margin}")
        return (
            min_price_pool[0],
            min_price,
            max_price_pool[0],
            max_price,
            margin
        )
    print("No arbitrage opportunity found.")
    return None
