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
    public bool IsActive { get; set; } = true;
    public Dealer Dealer { get; set; } = null!;
}
