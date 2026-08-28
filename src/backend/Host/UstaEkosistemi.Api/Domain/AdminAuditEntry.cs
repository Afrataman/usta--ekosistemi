namespace UstaEkosistemi.Api.Domain;

public sealed class AdminAuditEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AdminUserId { get; set; }
    public required string Actor { get; set; }
    public required string Action { get; set; }
    public required string EntityType { get; set; }
    public Guid? EntityId { get; set; }
    public required string Details { get; set; }
    public string? CorrelationId { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public AdminUser AdminUser { get; set; } = null!;
}
