namespace UstaEkosistemi.Api.Domain;

public sealed class CraftsmanSession
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CraftsmanId { get; set; }
    public required string TokenHash { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset ExpiresAtUtc { get; set; }
    public DateTimeOffset? RevokedAtUtc { get; set; }
    public Craftsman Craftsman { get; set; } = null!;
}
