namespace UstaEkosistemi.Api.Domain;

public sealed class RewardRedemption
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CraftsmanId { get; set; }
    public Guid RewardId { get; set; }
    public int PointsSpent { get; set; }
    public RewardRedemptionStatus Status { get; set; } = RewardRedemptionStatus.Created;
    public required string FulfillmentCode { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? FulfilledAtUtc { get; set; }
    public Craftsman Craftsman { get; set; } = null!;
    public Reward Reward { get; set; } = null!;
}

public enum RewardRedemptionStatus
{
    Created,
    Fulfilled,
    Cancelled
}
