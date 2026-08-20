namespace UstaEkosistemi.Api.Domain;

public sealed class SupportRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CraftsmanId { get; set; }
    public required string Category { get; set; }
    public required string Subject { get; set; }
    public required string Description { get; set; }
    public SupportRequestStatus Status { get; set; } = SupportRequestStatus.Open;
    public SupportPriority Priority { get; set; } = SupportPriority.Normal;
    public string? AssignedTo { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ResolvedAtUtc { get; set; }
    public Craftsman Craftsman { get; set; } = null!;
    public ICollection<SupportResponse> Responses { get; set; } = [];
}

public enum SupportRequestStatus { Open, InProgress, Resolved, Closed }
public enum SupportPriority { Low, Normal, High, Urgent }

public sealed class SupportResponse
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SupportRequestId { get; set; }
    public required string Author { get; set; }
    public required string Message { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public SupportRequest SupportRequest { get; set; } = null!;
}
