namespace UstaEkosistemi.Api.Domain;

public sealed class AdminUser
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string UserName { get; set; }
    public required string FullName { get; set; }
    public required string PasswordHash { get; set; }
    public required string PasswordSalt { get; set; }
    public string Role { get; set; } = "Administrator";
    public bool IsActive { get; set; } = true;
    public ICollection<AdminSession> Sessions { get; set; } = [];
}

public sealed class AdminSession
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AdminUserId { get; set; }
    public required string TokenHash { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset ExpiresAtUtc { get; set; }
    public DateTimeOffset? RevokedAtUtc { get; set; }
    public AdminUser AdminUser { get; set; } = null!;
}
