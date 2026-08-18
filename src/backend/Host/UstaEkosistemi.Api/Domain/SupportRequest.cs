namespace UstaEkosistemi.Api.Domain;

public sealed class SupportRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CraftsmanId { get; set; }
    public required string Category { get; set; }
    public required string Subject { get; set; }
    public required string Description { get; set; }
    public SupportRequestStatus Status { get; set; } = SupportRequestStatus.Open;
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ResolvedAtUtc { get; set; }
    public Craftsman Craftsman { get; set; } = null!;
}

public enum SupportRequestStatus { Open, InProgress, Resolved, Closed }
