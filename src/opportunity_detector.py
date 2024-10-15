import networkx as nx
from typing import List, Tuple, Optional

# Assuming ShortTicker and Symbol classes are defined elsewhere
# Here's a basic implementation for completeness
class Symbol:
    def __init__(self, base, quote):
        self.base = base
        self.quote = quote

class ShortTicker:
    def __init__(self, symbol: Symbol, last_price: float, reversed: bool = False):
        self.symbol = symbol
        self.last_price = last_price
        self.reversed = reversed

    def __repr__(self):
        direction = f"{self.symbol.base}/{self.symbol.quote}"
        if self.reversed:
            direction += " (Reversed)"
        return f"{direction} @ {self.last_price}"


# A simple cycle, or elementary circuit, is a closed path where no node appears twice.
# In a directed graph, two simple cycles are distinct if they are not cyclic permutations of each other. 
# In an undirected graph, two simple cycles are distinct if they are not cyclic permutations of each other nor of the other’s reversal.

# Optionally, the cycles are bounded in length. In the unbounded case, we use a nonrecursive, iterator/generator version of Johnson’s algorithm.
# In the bounded case, we use a version of the algorithm of Gupta and Suzumura. There may be better algorithms for some cases.

# The algorithms of Johnson, and Gupta and Suzumura, are enhanced by some well-known preprocessing techniques. 
# When G is directed, we restrict our attention to strongly connected components of G, generate all simple cycles
# containing a certain node, remove that node, and further decompose the remainder into strongly connected components.
# When G is undirected, we restrict our attention to biconnected components, generate all simple cycles containing a particular edge,
# remove that edge, and further decompose the remainder into biconnected components.

def get_best_opportunity(tickers: List[ShortTicker]) -> Tuple[Optional[List[ShortTicker]], float]:
    """
    Finds the most profitable arbitrage opportunity by searching for cycles of any length.

    :param tickers: List of available ShortTicker objects representing currency pairs.
    :return: A tuple containing the list of ShortTickers forming the best cycle and the total profit.
             Returns (None, 0) if no arbitrage opportunity is found.
    """
    # Build a directed graph of currencies
    graph = nx.DiGraph()

    for ticker in tickers:
        if ticker.symbol is not None:
            # Add forward edge
            graph.add_edge(ticker.symbol.base, ticker.symbol.quote, ticker=ticker)
            # Add reverse edge with inverted price
            reversed_symbol = Symbol(ticker.symbol.quote, ticker.symbol.base)
            reversed_ticker = ShortTicker(symbol=reversed_symbol, last_price=1 / ticker.last_price, reversed=True)
            graph.add_edge(ticker.symbol.quote, ticker.symbol.base, ticker=reversed_ticker)

    best_profit = 1.0  # Start with no profit
    best_cycle = None

    # Find all simple cycles in the graph
    # Note: For large graphs, this can be computationally expensive
    print("Searching for all possible cycles...")
    cycles = list(nx.simple_cycles(graph))
    print(f"Total cycles found: {len(cycles)}")

    for cycle in cycles:
        # Calculate the profit for the current cycle
        profit = 1.0
        cycle_tickers = []
        cycle_length = len(cycle)
        is_profitable = False

        for i in range(cycle_length):
            from_currency = cycle[i]
            to_currency = cycle[(i + 1) % cycle_length]
            ticker = graph[from_currency][to_currency]['ticker']
            cycle_tickers.append(ticker)
            profit *= ticker.last_price

        # Check if this cycle yields a profit greater than current best
        if profit > best_profit:
            best_profit = profit
            best_cycle = cycle_tickers
            print(f"New best cycle found: {[str(t) for t in best_cycle]} with profit {best_profit}")

    # If a profitable cycle is found, return it
    if best_cycle is not None:
        # Optionally, reverse the tickers back to original direction if they were reversed
        best_cycle = [
            ShortTicker(symbol=ticker.symbol, last_price=ticker.last_price, reversed=ticker.reversed)
            for ticker in best_cycle
        ]

    else:
        print("No arbitrage opportunity found.")

    return best_cycle, best_profit if best_cycle else (None, 0)

# Example usage:
if __name__ == "__main__":
    # Define some sample tickers using the corrected Symbol class
    tickers = [
        ShortTicker(Symbol("USD", "EUR"), 0.85),
        ShortTicker(Symbol("EUR", "GBP"), 0.9),
        ShortTicker(Symbol("GBP", "USD"), 1.3),
        ShortTicker(Symbol("USD", "JPY"), 110.0),
        ShortTicker(Symbol("JPY", "EUR"), 0.0075),
        ShortTicker(Symbol("EUR", "JPY"), 133.33),
        # Add more tickers as needed
    ]

    best_cycle, profit = get_best_opportunity(tickers)
    best_cycle, profit = get_triangular_opportunity(tickers)
    if best_cycle:
        print("\nBest Arbitrage Opportunity:")
        for ticker in best_cycle:
            print(ticker)
        print(f"Total Profit: {profit}")
    else:
        print("No profitable arbitrage opportunity detected.")