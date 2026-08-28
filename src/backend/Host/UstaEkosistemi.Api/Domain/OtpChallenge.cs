namespace UstaEkosistemi.Api.Domain;

public sealed class OtpChallenge
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string PhoneNumber { get; set; }
    public required string CodeHash { get; set; }
    public required string CodeSalt { get; set; }
    public int FailedAttempts { get; set; }
    public int MaxAttempts { get; set; } = 5;
    public DateTimeOffset ExpiresAtUtc { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UsedAtUtc { get; set; }
}
