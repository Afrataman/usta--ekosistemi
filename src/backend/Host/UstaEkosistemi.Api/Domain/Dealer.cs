namespace UstaEkosistemi.Api.Domain;

public sealed class Dealer
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Code { get; set; }
    public required string Name { get; set; }
    public bool IsActive { get; set; } = true;
    public ICollection<DealerEmployee> Employees { get; set; } = [];
}

public sealed class DealerEmployee
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DealerId { get; set; }
    public required string FullName { get; set; }
    public string? PinHash { get; set; }
    public string? PinSalt { get; set; }
    public bool IsActive { get; set; } = true;
    public Dealer Dealer { get; set; } = null!;
    public ICollection<DealerSession> Sessions { get; set; } = [];
}

public sealed class DealerSession
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DealerEmployeeId { get; set; }
    public required string TokenHash { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset ExpiresAtUtc { get; set; }
    public DateTimeOffset? RevokedAtUtc { get; set; }
    public DealerEmployee DealerEmployee { get; set; } = null!;
}
