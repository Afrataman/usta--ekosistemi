using System.Security.Cryptography;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;
using UstaEkosistemi.Api.Security;

namespace UstaEkosistemi.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(UstaEkosistemiDbContext dbContext, IWebHostEnvironment environment) : ControllerBase
{
    [HttpPost("request-code")]
    public async Task<IActionResult> RequestCode(RequestOtpCode request, CancellationToken cancellationToken)
    {
        var phone = NormalizePhone(request.PhoneNumber);
        if (phone is null) return ValidationProblem("Geçerli bir telefon numarası girin.");
        var windowStart = DateTimeOffset.UtcNow.AddMinutes(-10);
        var recentCount = await dbContext.OtpChallenges.CountAsync(x => x.PhoneNumber == phone && x.CreatedAtUtc >= windowStart, cancellationToken);
        if (recentCount >= 3) return StatusCode(StatusCodes.Status429TooManyRequests, new { message = "Çok fazla kod istendi. 10 dakika sonra tekrar deneyin." });

        var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
        var secured = OtpCodeHasher.Hash(code);
        var challenge = new OtpChallenge { PhoneNumber = phone, CodeHash = secured.Hash, CodeSalt = secured.Salt, ExpiresAtUtc = DateTimeOffset.UtcNow.AddMinutes(3) };
        dbContext.OtpChallenges.Add(challenge); await dbContext.SaveChangesAsync(cancellationToken);
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
        }
        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new { craftsman.Id, craftsman.FullName, needsProfile = craftsman.FullName == "Yeni Usta" });
    }

    private static string? NormalizePhone(string input)
    {
        var digits = new string(input.Where(char.IsDigit).ToArray());
        return digits.Length is >= 10 and <= 15 ? digits : null;
    }
}

public sealed record RequestOtpCode(string PhoneNumber);
public sealed record VerifyOtpCode(Guid ChallengeId, string Code);
