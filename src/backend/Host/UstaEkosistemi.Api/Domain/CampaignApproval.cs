namespace UstaEkosistemi.Api.Domain;

public enum CampaignApprovalStatus { Pending, Approved, Rejected }

public sealed class CampaignApproval
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CampaignId { get; set; }
    public Guid RequestedByAdminUserId { get; set; }
    public Guid? DecidedByAdminUserId { get; set; }
    public CampaignApprovalStatus Status { get; set; } = CampaignApprovalStatus.Pending;
    public DateTimeOffset RequestedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? DecidedAtUtc { get; set; }
    public string? DecisionNote { get; set; }
    public Campaign Campaign { get; set; } = null!;
    public AdminUser RequestedByAdminUser { get; set; } = null!;
    public AdminUser? DecidedByAdminUser { get; set; }
}
