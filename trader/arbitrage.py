from typing import List
from pool_db_data import PoolDBData
 
def find_arbitrage_opportunities(pool_data: List[PoolDBData]):
    # Filter only valid pools
    valid_pools = [p for p in pool_data if p.isValid]

    # Extract prices as floats
    # Note: poolPrice is assumed to be the direct ratio price (quote per base).
    pool_prices = [(p.rpcData, float(p.poolPrice)) for p in valid_pools]

    if not pool_prices:
        print("No valid pools available.")
        return

    # Identify min and max price pools
    min_price_pool = min(pool_prices, key=lambda x: x[1])
    max_price_pool = max(pool_prices, key=lambda x: x[1])

    min_price = min_price_pool[1]
    max_price = max_price_pool[1]

    # Check if there's a profitable price difference
    if max_price > min_price:
        # Potential arbitrage margin per base unit
        margin = max_price - min_price
        print(f"Arbitrage opportunity found:")
        print(f"Buy from {min_price_pool[0]} at price {min_price} and sell to {max_price_pool[0]} at price {max_price}.")
        print(f"Potential margin per base token: {margin}")
    else:
        print("No arbitrage opportunity found.")
