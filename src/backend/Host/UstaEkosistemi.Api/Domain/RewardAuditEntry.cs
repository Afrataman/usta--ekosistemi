namespace UstaEkosistemi.Api.Domain;

public sealed class RewardAuditEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RewardId { get; set; }
    public required string Action { get; set; }
    public required string Details { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public Reward Reward { get; set; } = null!;
}
