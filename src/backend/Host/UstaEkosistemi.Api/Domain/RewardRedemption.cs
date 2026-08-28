namespace UstaEkosistemi.Api.Domain;

public sealed class RewardRedemption
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public byte[] RowVersion { get; set; } = [];
    public Guid CraftsmanId { get; set; }
    public Guid RewardId { get; set; }
    public Guid? RedemptionRequestId { get; set; }
    public int PointsSpent { get; set; }
    public RewardRedemptionStatus Status { get; set; } = RewardRedemptionStatus.Created;
    public required string FulfillmentCode { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ExpiresAtUtc { get; set; }
    public DateTimeOffset? FulfilledAtUtc { get; set; }
    public Guid? FulfilledByDealerEmployeeId { get; set; }
    public Craftsman Craftsman { get; set; } = null!;
    public Reward Reward { get; set; } = null!;
    public DealerEmployee? FulfilledByDealerEmployee { get; set; }
}

public enum RewardRedemptionStatus
{
    Created,
    Fulfilled,
    Cancelled
}
