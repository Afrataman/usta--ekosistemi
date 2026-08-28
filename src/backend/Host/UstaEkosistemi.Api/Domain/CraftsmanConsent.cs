namespace UstaEkosistemi.Api.Domain;

public enum CraftsmanConsentType { PrivacyNotice, ExplicitConsent, CommercialCommunication }

public sealed class CraftsmanConsent
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CraftsmanId { get; set; }
    public CraftsmanConsentType Type { get; set; }
    public required string DocumentVersion { get; set; }
    public bool Granted { get; set; }
    public DateTimeOffset RecordedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public Craftsman Craftsman { get; set; } = null!;
}
