namespace UstaEkosistemi.Api.Domain;

public sealed class ReportExportAudit
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string ReportType { get; set; }
    public required string Actor { get; set; }
    public DateTimeOffset StartsAtUtc { get; set; }
    public DateTimeOffset EndsAtUtc { get; set; }
    public int RowCount { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
