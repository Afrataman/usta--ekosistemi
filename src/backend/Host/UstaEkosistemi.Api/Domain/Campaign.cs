namespace UstaEkosistemi.Api.Domain;

public sealed class Campaign
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Title { get; set; }
    public required string Summary { get; set; }
    public decimal PointMultiplier { get; set; } = 1;
    public DateTimeOffset StartsAtUtc { get; set; }
    public DateTimeOffset EndsAtUtc { get; set; }
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; }
    public Guid? ProductId { get; set; }
    public Product? Product { get; set; }
}
