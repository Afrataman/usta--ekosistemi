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
    public ICollection<RiskCaseAction> Actions { get; set; } = [];
}

public enum RiskCaseStatus { Open, InReview, Resolved, Rejected }

public sealed class RiskCaseAction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RiskCaseId { get; set; }
    public Guid AdminUserId { get; set; }
    public RiskCaseStatus Status { get; set; }
    public required string DecisionNote { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public RiskCase RiskCase { get; set; } = null!;
    public AdminUser AdminUser { get; set; } = null!;
}
