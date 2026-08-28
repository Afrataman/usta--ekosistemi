namespace UstaEkosistemi.Api.Domain;

public sealed class Craftsman
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string PhoneNumber { get; set; }
    public required string FullName { get; set; }
    public string? City { get; set; }
    public CraftsmanLevel Level { get; set; } = CraftsmanLevel.Bronze;
    public bool IsActive { get; set; } = true;
    public bool CampaignNotificationsEnabled { get; set; } = true;
    public bool SmsNotificationsEnabled { get; set; } = true;
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public ICollection<PointLedgerEntry> PointLedgerEntries { get; set; } = [];
}

public enum CraftsmanLevel
{
    Bronze,
    Silver,
    Gold
}
