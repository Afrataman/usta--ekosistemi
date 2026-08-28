namespace UstaEkosistemi.Api.Domain;

public sealed class PointLedgerEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CraftsmanId { get; set; }
    public int Amount { get; set; }
    public PointTransactionType TransactionType { get; set; }
    public required string ReferenceType { get; set; }
    public Guid ReferenceId { get; set; }
    public required string Description { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public Craftsman Craftsman { get; set; } = null!;
}

public enum PointTransactionType
{
    ProductCodeEarned,
    RewardRedeemed,
    ReturnReversal,
    ManualAdjustment
}
