import networkx as nx
from typing import List, Tuple

# class ShortTicker:
#     def __init__(self, symbol, last_price, reversed=False):
#         self.symbol = symbol
#         self.last_price = last_price
#         self.reversed = reversed
#
# class Symbol:
#     def __init__(self, base, quote):
#         self.base = base
#         self.quote = quote

def get_triangular_opportunity(tickers: List['ShortTicker']) -> Tuple[List['ShortTicker'], float]:
    # Build a directed graph of currencies
    graph = nx.DiGraph()

    for ticker in tickers:
        if ticker.symbol is not None:
            # Add forward edge
            graph.add_edge(ticker.symbol.base, ticker.symbol.quote, ticker=ticker)
            # Add reverse edge with inverted price
            reversed_ticker = ShortTicker(symbols.Symbol(f"{ticker.symbol.quote}/{ticker.symbol.base}"),
                                          1 / ticker.last_price, reversed=True)
            graph.add_edge(ticker.symbol.quote, ticker.symbol.base, ticker=reversed_ticker)

    best_profit = 0
    best_triplet = None

    # Find all cycles in the graph (specifically triplets)
    for cycle in nx.simple_cycles(graph):
        if len(cycle) != 3:
            continue

        # Extract the currencies in the cycle
        a, b, c = cycle
        a_to_b = graph[a][b]['ticker']
        b_to_c = graph[b][c]['ticker']
        c_to_a = graph[c][a]['ticker']

        # Calculate profit for this cycle
        profit = a_to_b.last_price * b_to_c.last_price * c_to_a.last_price

        # Update the best cycle if this one is better
        if profit > best_profit:
            best_profit = profit
            best_triplet = [a_to_b, b_to_c, c_to_a]

    # If we found a profitable cycle, restore the original symbols for reversed pairs
    if best_triplet is not None:
        best_triplet = [
            ShortTicker(symbols.Symbol(f"{triplet.symbol.quote}/{triplet.symbol.base}"), triplet.last_price,
                        reversed=True)
            if triplet.reversed else triplet
            for triplet in best_triplet
        ]

    return best_triplet, best_profit
