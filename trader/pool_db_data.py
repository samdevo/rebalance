"""Module for managing pool database data and public keys."""

from dataclasses import dataclass


class PublicKey:
    """
    A placeholder class to represent a PublicKey.

    Replace this with the actual PublicKey implementation as required.
    """

    def __init__(self, value: str) -> None:
        """
        Initialize a PublicKey instance.

        Args:
            value (str): The value of the public key.
        """
        self.value = value

    def __repr__(self) -> str:
        """Return the official string representation of the PublicKey."""
        return f"PublicKey({self.value})"

    def __str__(self) -> str:
        """Return the informal string representation of the PublicKey."""
        return self.value


# pylint: disable=too-many-instance-attributes
@dataclass
class PoolDBData:
    """
    Data class representing pool database information.

    Attributes:
        rpc_data (str): RPC data related to the pool.
        base_reserve (str): Base reserve amount.
        quote_reserve (str): Quote reserve amount.
        mint_a_amount (str): Amount of mint A.
        mint_b_amount (str): Amount of mint B.
        pool_price (str): Current pool price.
        last_updated (int): Unix timestamp of the last update.
        is_valid (bool): Validity status of the pool data.
        account_id (PublicKey): Account ID associated with the pool.
        program_id (PublicKey): Program ID associated with the pool.
    """

    rpc_data: str
    base_reserve: str
    quote_reserve: str
    mint_a_amount: str
    mint_b_amount: str
    pool_price: str
    last_updated: int  # Unix timestamp (seconds since epoch)
    is_valid: bool
    account_id: PublicKey
    program_id: PublicKey

    def __post_init__(self) -> None:
        """
        Post-initialization to validate fields.

        Raises:
            ValueError: If account_id or program_id is not an instance of PublicKey.
        """
        if not isinstance(self.account_id, PublicKey):
            raise ValueError("account_id must be an instance of PublicKey")
        if not isinstance(self.program_id, PublicKey):
            raise ValueError("program_id must be an instance of PublicKey")

    def __repr__(self) -> str:
        """Return the official string representation of the PoolDBData."""
        return (
            f"PoolDBData(rpc_data={self.rpc_data}, base_reserve={self.base_reserve}, "
            f"quote_reserve={self.quote_reserve}, mint_a_amount={self.mint_a_amount}, "
            f"mint_b_amount={self.mint_b_amount}, pool_price={self.pool_price}, "
            f"last_updated={self.last_updated}, is_valid={self.is_valid}, "
            f"account_id={self.account_id}, program_id={self.program_id})"
        )
