using System.Security.Cryptography;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;
using UstaEkosistemi.Api.Security;

namespace UstaEkosistemi.Api.Controllers;

[ApiController]
public sealed class MembershipPassesController(UstaEkosistemiDbContext dbContext, DealerSessionAuthenticator dealerAuth) : ControllerBase
{
    [HttpPost("api/craftsmen/{craftsmanId:guid}/membership-pass")]
    public async Task<IActionResult> Create(Guid craftsmanId, CancellationToken token)
    {
        if (!await dbContext.Craftsmen.AnyAsync(x => x.Id == craftsmanId && x.IsActive, token)) return NotFound(new { message = "Aktif usta bulunamadı." });
        var rawToken = $"UKM-{Convert.ToHexString(RandomNumberGenerator.GetBytes(16))}"; var expires = DateTimeOffset.UtcNow.AddMinutes(2);
        dbContext.MembershipPasses.Add(new MembershipPass { CraftsmanId = craftsmanId, TokenHash = ProductCodeHasher.Hash(rawToken), ExpiresAtUtc = expires }); await dbContext.SaveChangesAsync(token);
        return Ok(new { token = rawToken, expiresAtUtc = expires });
    }

    [HttpGet("api/dealer/membership-passes/{passToken}")]
    public async Task<IActionResult> Verify(string passToken, CancellationToken token)
    {
        if (await dealerAuth.AuthenticateAsync(Request.Headers.Authorization, token) is null) return Unauthorized(new { message = "Bayi oturumu geçersiz." });
        var now = DateTimeOffset.UtcNow; var pass = await dbContext.MembershipPasses.AsNoTracking().Where(x => x.TokenHash == ProductCodeHasher.Hash(passToken) && x.ExpiresAtUtc > now && x.UsedAtUtc == null && x.Craftsman.IsActive).Select(x => new { x.Id, x.ExpiresAtUtc, craftsman = x.Craftsman.FullName, level = x.Craftsman.Level.ToString() }).SingleOrDefaultAsync(token);
        return pass is null ? NotFound(new { message = "Üyelik QR’ı geçersiz, kullanılmış veya süresi dolmuş." }) : Ok(pass);
    }
}
