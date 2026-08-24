using System.Security.Cryptography;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;
using UstaEkosistemi.Api.Security;
using UstaEkosistemi.Api.ReliableDelivery;
using UstaEkosistemi.Api.Sms;

namespace UstaEkosistemi.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(UstaEkosistemiDbContext dbContext, IWebHostEnvironment environment, IMemoryCache cache, ISmsDelivery smsDelivery) : ControllerBase
{
    [HttpPost("request-code")]
    public async Task<IActionResult> RequestCode(RequestOtpCode request, CancellationToken cancellationToken)
    {
        var phone = NormalizePhone(request.PhoneNumber);
        if (phone is null) return ValidationProblem("Geçerli bir telefon numarası girin.");
        var remoteAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var networkKey = $"otp-request-network:{remoteAddress}";
        var networkAttempts = cache.Get<int>(networkKey);
        if (networkAttempts >= 20) return StatusCode(StatusCodes.Status429TooManyRequests, new { message = "Bu bağlantıdan çok fazla kod istendi. 10 dakika sonra tekrar deneyin." });
        var windowStart = DateTimeOffset.UtcNow.AddMinutes(-10);
        var recentCount = await dbContext.OtpChallenges.CountAsync(x => x.PhoneNumber == phone && x.CreatedAtUtc >= windowStart, cancellationToken);
        if (recentCount >= 3) return StatusCode(StatusCodes.Status429TooManyRequests, new { message = "Çok fazla kod istendi. 10 dakika sonra tekrar deneyin." });

        var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
        var secured = OtpCodeHasher.Hash(code);
        try { await smsDelivery.SendOtpAsync(phone, code, cancellationToken); }
        catch (SmsProviderNotConfiguredException) { return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = "SMS doğrulama servisi henüz yapılandırılmadı." }); }
        catch (SmsDeliveryException) { return StatusCode(StatusCodes.Status502BadGateway, new { message = "SMS doğrulama kodu gönderilemedi. Lütfen tekrar deneyin." }); }
        var challenge = new OtpChallenge { PhoneNumber = phone, CodeHash = secured.Hash, CodeSalt = secured.Salt, ExpiresAtUtc = DateTimeOffset.UtcNow.AddMinutes(3) };
        dbContext.OtpChallenges.Add(challenge); await dbContext.SaveChangesAsync(cancellationToken); cache.Set(networkKey, networkAttempts + 1, TimeSpan.FromMinutes(10));
        return Ok(new { challenge.Id, expiresInSeconds = 180, developmentCode = environment.IsDevelopment() ? code : null });
    }

    [HttpPost("verify-code")]
    public async Task<IActionResult> VerifyCode(VerifyOtpCode request, CancellationToken cancellationToken)
    {
        var challenge = await dbContext.OtpChallenges.SingleOrDefaultAsync(x => x.Id == request.ChallengeId, cancellationToken);
        if (challenge is null || challenge.UsedAtUtc.HasValue || challenge.ExpiresAtUtc <= DateTimeOffset.UtcNow) return Unauthorized(new { message = "Kodun süresi dolmuş veya geçersiz." });
        if (challenge.FailedAttempts >= challenge.MaxAttempts) return Unauthorized(new { message = "Deneme sınırı aşıldı. Yeni kod isteyin." });
        if (request.Code.Length != 6 || !OtpCodeHasher.Verify(request.Code, challenge.CodeHash, challenge.CodeSalt))
        {
            challenge.FailedAttempts++; await dbContext.SaveChangesAsync(cancellationToken);
            return Unauthorized(new { message = "Doğrulama kodu hatalı.", remainingAttempts = challenge.MaxAttempts - challenge.FailedAttempts });
        }

        challenge.UsedAtUtc = DateTimeOffset.UtcNow;
        var craftsman = await dbContext.Craftsmen.SingleOrDefaultAsync(x => x.PhoneNumber == challenge.PhoneNumber, cancellationToken);
        if (craftsman is null)
        {
            craftsman = new Craftsman { PhoneNumber = challenge.PhoneNumber, FullName = "Yeni Usta" };
            dbContext.Craftsmen.Add(craftsman);
            dbContext.QueueCraftsmanNotification(craftsman.Id, "Welcome", "Usta Kulübü'ne hoş geldiniz", "Ürün kodlarını okutarak puan kazanabilir, puanlarınızı program ödüllerinde kullanabilirsiniz.", nameof(Craftsman), craftsman.Id);
        }
        var rawToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        var session = new CraftsmanSession { CraftsmanId = craftsman.Id, TokenHash = CraftsmanSessionSecurity.HashToken(rawToken), ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30) };
        dbContext.CraftsmanSessions.Add(session);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new { craftsmanId = craftsman.Id, craftsman.FullName, needsProfile = craftsman.FullName == "Yeni Usta", token = rawToken, session.ExpiresAtUtc });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        var authorization = Request.Headers.Authorization.ToString();
        if (authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            var hash = CraftsmanSessionSecurity.HashToken(authorization[7..].Trim());
            var session = await dbContext.CraftsmanSessions.SingleOrDefaultAsync(x => x.TokenHash == hash && x.RevokedAtUtc == null, cancellationToken);
            if (session is not null) { session.RevokedAtUtc = DateTimeOffset.UtcNow; await dbContext.SaveChangesAsync(cancellationToken); }
        }
        return NoContent();
    }

    private static string? NormalizePhone(string input)
    {
        var digits = new string(input.Where(char.IsDigit).ToArray());
        return digits.Length is >= 10 and <= 15 ? digits : null;
    }
}

public sealed record RequestOtpCode(string PhoneNumber);
public sealed record VerifyOtpCode(Guid ChallengeId, string Code);
