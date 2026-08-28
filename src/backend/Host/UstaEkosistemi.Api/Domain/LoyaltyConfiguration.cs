namespace UstaEkosistemi.Api.Domain;

public sealed class LoyaltyConfiguration
{
    public static readonly Guid DefaultId = Guid.Parse("88888888-8888-8888-8888-888888888881");
    public Guid Id { get; set; } = DefaultId;
    public int SilverThreshold { get; set; } = 5_000;
    public int GoldThreshold { get; set; } = 12_500;
    public int PointsPerRewardTry { get; set; } = 20;
    public DateTimeOffset UpdatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class LoyaltyConfigurationAudit
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int SilverThreshold { get; set; }
    public int GoldThreshold { get; set; }
    public int PointsPerRewardTry { get; set; }
    public required string ChangeNote { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
