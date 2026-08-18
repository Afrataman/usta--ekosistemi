namespace UstaEkosistemi.Api.Domain;

public sealed class Reward
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Name { get; set; }
    public required string Description { get; set; }
    public int PointCost { get; set; }
    public RewardDeliveryType DeliveryType { get; set; }
    public required string ImageKey { get; set; }
    public int? StockQuantity { get; set; }
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}

public enum RewardDeliveryType
{
    Digital,
    DealerPickup
}
