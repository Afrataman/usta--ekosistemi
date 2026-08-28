namespace UstaEkosistemi.Api.Domain;

public sealed class MembershipPass
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CraftsmanId { get; set; }
    public required string TokenHash { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset ExpiresAtUtc { get; set; }
    public DateTimeOffset? UsedAtUtc { get; set; }
    public Craftsman Craftsman { get; set; } = null!;
}

public sealed class DealerSale
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DealerId { get; set; }
    public Guid DealerEmployeeId { get; set; }
    public Guid CraftsmanId { get; set; }
    public Guid MembershipPassId { get; set; }
    public required string SaleReference { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public Dealer Dealer { get; set; } = null!;
    public DealerEmployee DealerEmployee { get; set; } = null!;
    public Craftsman Craftsman { get; set; } = null!;
    public MembershipPass MembershipPass { get; set; } = null!;
}
