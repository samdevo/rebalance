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

def get_best_opportunity(tickers: List[ShortTicker], max_cycle: int = 10) -> Tuple[List[ShortTicker], float]:
    # Build a directed graph of currencies
    graph = nx.DiGraph()

    for ticker in tickers:
        if ticker.symbol is not None:
            graph.add_edge(ticker.symbol.base, ticker.symbol.quote, ticker=ticker)
            graph.add_edge(ticker.symbol.quote, ticker.symbol.base,
                           ticker=ShortTicker(Symbol(f"{ticker.symbol.quote}/{ticker.symbol.base}"),
                                              1 / ticker.last_price, reversed=True))

    best_profit = 1
    best_cycle = None

    # Find all cycles in the graph with a length <= max_cycle
    for cycle in nx.simple_cycles(graph):
        if len(cycle) > max_cycle:
            continue  # Skip cycles longer than max_cycle

        profit = 1
        tickers_in_cycle = []

        # Calculate the profits along the cycle
        for i, base in enumerate(cycle):
            quote = cycle[(i + 1) % len(cycle)]  # Wrap around to complete the cycle
            ticker = graph[base][quote]['ticker']
            tickers_in_cycle.append(ticker)
            profit *= ticker.last_price

        if profit > best_profit:
            best_profit = profit
            best_cycle = tickers_in_cycle

    if best_cycle is not None:
        best_cycle = [
            ShortTicker(Symbol(f"{ticker.symbol.quote}/{ticker.symbol.base}"), ticker.last_price, reversed=True)
            if ticker.reversed else ticker
            for ticker in best_cycle
        ]

    return best_cycle, best_profit

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

    if best_cycle:
        print("\nBest Arbitrage Opportunity:")
        for ticker in best_cycle:
            print(ticker)
        print(f"Total Profit: {profit}")
    else:
        print("No profitable arbitrage opportunity detected.")
        