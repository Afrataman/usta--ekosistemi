using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;

namespace UstaEkosistemi.Api.Security;

public sealed class DealerSessionAuthenticator(UstaEkosistemiDbContext dbContext)
{
    public async Task<DealerEmployee?> AuthenticateAsync(string? authorization, CancellationToken token)
    {
        if (string.IsNullOrWhiteSpace(authorization) || !authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)) return null;
        var hash = HashToken(authorization[7..].Trim()); var now = DateTimeOffset.UtcNow;
        return await dbContext.DealerSessions.Where(x => x.TokenHash == hash && x.RevokedAtUtc == null && x.ExpiresAtUtc > now && x.DealerEmployee.IsActive && x.DealerEmployee.Dealer.IsActive).Select(x => x.DealerEmployee).SingleOrDefaultAsync(token);
    }
    public static string HashToken(string token) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
}
