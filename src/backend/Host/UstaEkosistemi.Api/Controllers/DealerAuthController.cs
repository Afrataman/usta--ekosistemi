using System.Security.Cryptography;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;
using UstaEkosistemi.Api.Security;

namespace UstaEkosistemi.Api.Controllers;

[ApiController]
[Route("api/dealer/auth")]
public sealed class DealerAuthController(UstaEkosistemiDbContext dbContext, DealerSessionAuthenticator authenticator, IMemoryCache cache) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login(DealerLoginRequest request, CancellationToken token)
    {
        var dealerCode = request.DealerCode.Trim().ToUpperInvariant();
        var attemptKey = $"dealer-login:{dealerCode}:{HttpContext.Connection.RemoteIpAddress}";
        var attempts = cache.Get<int>(attemptKey); if (attempts >= 5) return StatusCode(StatusCodes.Status429TooManyRequests, new { message = "Çok fazla hatalı deneme. 15 dakika sonra tekrar deneyin." });
        if (request.Pin.Length != 6 || request.Pin.Any(x => !char.IsDigit(x))) return Unauthorized(new { message = "Bayi kodu veya çalışan kodu hatalı." });
        var employees = await dbContext.DealerEmployees.Include(x => x.Dealer).Where(x => x.Dealer.Code == dealerCode && x.Dealer.IsActive && x.IsActive).ToListAsync(token);
        var employee = employees.SingleOrDefault(x => x.PinHash is not null && x.PinSalt is not null && OtpCodeHasher.Verify(request.Pin, x.PinHash, x.PinSalt));
        if (employee is null) { cache.Set(attemptKey, attempts + 1, TimeSpan.FromMinutes(15)); return Unauthorized(new { message = "Bayi kodu veya çalışan kodu hatalı." }); }
        cache.Remove(attemptKey);
        var rawToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)); var expires = DateTimeOffset.UtcNow.AddHours(12);
        dbContext.DealerSessions.Add(new DealerSession { DealerEmployeeId = employee.Id, TokenHash = DealerSessionAuthenticator.HashToken(rawToken), ExpiresAtUtc = expires }); await dbContext.SaveChangesAsync(token);
        return Ok(new { token = rawToken, expiresAtUtc = expires, employee = employee.FullName, dealer = employee.Dealer.Name });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken token)
    {
        var employee = await authenticator.AuthenticateAsync(Request.Headers.Authorization, token); if (employee is null) return Unauthorized();
        var hash = DealerSessionAuthenticator.HashToken(Request.Headers.Authorization.ToString()[7..].Trim()); var session = await dbContext.DealerSessions.SingleAsync(x => x.TokenHash == hash, token); session.RevokedAtUtc = DateTimeOffset.UtcNow; await dbContext.SaveChangesAsync(token); return NoContent();
    }
}

public sealed record DealerLoginRequest(string DealerCode, string Pin);
