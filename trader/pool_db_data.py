from dataclasses import dataclass
from typing import Union

class PublicKey:
    """
    A placeholder class to represent a PublicKey.
    Replace this with the actual PublicKey implementation as required.
    """
    def __init__(self, value: str):
        self.value = value

    def __repr__(self):
        return f"PublicKey({self.value})"

    def __str__(self):
        return self.value

@dataclass
class PoolDBData:
    rpcData: str
    baseReserve: str
    quoteReserve: str
    mintAAmount: str
    mintBAmount: str
    poolPrice: str
    lastUpdated: int  # Unix timestamp (seconds since epoch)
    isValid: bool
    accountId: PublicKey
    programId: PublicKey

    def __post_init__(self):
        """
        Post-initialization to validate or process any fields if necessary.
        """
        if not isinstance(self.accountId, PublicKey):
            raise ValueError("accountId must be an instance of PublicKey")
        if not isinstance(self.programId, PublicKey):
            raise ValueError("programId must be an instance of PublicKey")

    def __repr__(self):
        return (
            f"PoolDBData(rpcData={self.rpcData}, baseReserve={self.baseReserve}, "
            f"quoteReserve={self.quoteReserve}, mintAAmount={self.mintAAmount}, "
            f"mintBAmount={self.mintBAmount}, poolPrice={self.poolPrice}, "
            f"lastUpdated={self.lastUpdated}, isValid={self.isValid}, "
            f"accountId={self.accountId}, programId={self.programId})"
        )
