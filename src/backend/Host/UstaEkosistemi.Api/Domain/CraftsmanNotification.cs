namespace UstaEkosistemi.Api.Domain;

public sealed class CraftsmanNotification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CraftsmanId { get; set; }
    public required string Type { get; set; }
    public required string Title { get; set; }
    public required string Message { get; set; }
    public string? ReferenceType { get; set; }
    public Guid? ReferenceId { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ReadAtUtc { get; set; }
    public Craftsman Craftsman { get; set; } = null!;
}
