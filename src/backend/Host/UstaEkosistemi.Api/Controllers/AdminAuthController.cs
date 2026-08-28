using System.Security.Cryptography;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;
using UstaEkosistemi.Api.Security;

namespace UstaEkosistemi.Api.Controllers;

[ApiController]
[Route("api/admin/auth")]
public sealed class AdminAuthController(UstaEkosistemiDbContext dbContext, IMemoryCache cache) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login(AdminLoginRequest request, CancellationToken token)
    {
        var userName = request.UserName.Trim().ToLowerInvariant(); var key = $"admin-login:{userName}:{HttpContext.Connection.RemoteIpAddress}"; var attempts = cache.Get<int>(key);
        if (attempts >= 5) return StatusCode(429, new { message = "Çok fazla hatalı deneme. 15 dakika sonra tekrar deneyin." });
        var user = await dbContext.AdminUsers.SingleOrDefaultAsync(x => x.UserName == userName && x.IsActive, token);
        if (user is null || !OtpCodeHasher.Verify(request.Password, user.PasswordHash, user.PasswordSalt)) { cache.Set(key, attempts + 1, TimeSpan.FromMinutes(15)); return Unauthorized(new { message = "Kullanıcı adı veya parola hatalı." }); }
        cache.Remove(key); var rawToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)); var expires = DateTimeOffset.UtcNow.AddHours(8);
        dbContext.AdminSessions.Add(new AdminSession { AdminUserId = user.Id, TokenHash = AdminSessionSecurity.HashToken(rawToken), ExpiresAtUtc = expires }); await dbContext.SaveChangesAsync(token);
        return Ok(new { token = rawToken, expiresAtUtc = expires, user = user.FullName, user.Role });
    }
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken token)
    {
        var authorization = Request.Headers.Authorization.ToString(); if (!authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)) return Unauthorized();
        var hash = AdminSessionSecurity.HashToken(authorization[7..].Trim()); var session = await dbContext.AdminSessions.SingleOrDefaultAsync(x => x.TokenHash == hash && x.RevokedAtUtc == null, token); if (session is null) return Unauthorized(); session.RevokedAtUtc = DateTimeOffset.UtcNow; await dbContext.SaveChangesAsync(token); return NoContent();
    }
}

public sealed record AdminLoginRequest(string UserName, string Password);
