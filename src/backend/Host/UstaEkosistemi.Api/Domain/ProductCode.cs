namespace UstaEkosistemi.Api.Domain;

public sealed class ProductCode
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProductId { get; set; }
    public required string CodeHash { get; set; }
    public ProductCodeStatus Status { get; set; } = ProductCodeStatus.Available;
    public Guid? RedeemedByCraftsmanId { get; set; }
    public DateTimeOffset? RedeemedAtUtc { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public Product Product { get; set; } = null!;
    public Craftsman? RedeemedByCraftsman { get; set; }
}

public enum ProductCodeStatus
{
    Available,
    Redeemed,
    Cancelled
}
