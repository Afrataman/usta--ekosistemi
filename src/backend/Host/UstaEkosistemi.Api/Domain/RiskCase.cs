namespace UstaEkosistemi.Api.Domain;

public sealed class RiskCase
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ReportedByDealerEmployeeId { get; set; }
    public required string ReferenceType { get; set; }
    public required string ReferenceValue { get; set; }
    public required string Reason { get; set; }
    public required string Description { get; set; }
    public RiskCaseStatus Status { get; set; } = RiskCaseStatus.Open;
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ReviewedAtUtc { get; set; }
    public DealerEmployee ReportedByDealerEmployee { get; set; } = null!;
}

public enum RiskCaseStatus { Open, InReview, Resolved, Rejected }
