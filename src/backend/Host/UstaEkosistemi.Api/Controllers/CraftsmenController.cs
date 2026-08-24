using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using System.Security.Cryptography;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;
using UstaEkosistemi.Api.Loyalty;
using UstaEkosistemi.Api.ReliableDelivery;
using UstaEkosistemi.Api.Security;
using UstaEkosistemi.Api.Sms;

namespace UstaEkosistemi.Api.Controllers;

[ApiController]
[Route("api/craftsmen")]
public sealed class CraftsmenController(UstaEkosistemiDbContext dbContext, IWebHostEnvironment environment, IMemoryCache cache, ISmsDelivery smsDelivery) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create(CreateCraftsmanRequest request, CancellationToken cancellationToken)
    {
        var phoneNumber = request.PhoneNumber.Trim();
        if (phoneNumber.Length is < 10 or > 20 || string.IsNullOrWhiteSpace(request.FullName))
        {
            return ValidationProblem("Telefon numarası ve ad soyad zorunludur.");
        }

        if (await dbContext.Craftsmen.AnyAsync(x => x.PhoneNumber == phoneNumber, cancellationToken))
        {
            return Conflict(new { message = "Bu telefon numarasıyla kayıtlı bir usta zaten var." });
        }

        var craftsman = new Craftsman
        {
            PhoneNumber = phoneNumber,
            FullName = request.FullName.Trim(),
            City = string.IsNullOrWhiteSpace(request.City) ? null : request.City.Trim()
        };

        dbContext.Craftsmen.Add(craftsman);
        await dbContext.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetWallet), new { id = craftsman.Id }, new { craftsman.Id, craftsman.FullName, craftsman.Level });
    }

    [HttpGet("{id:guid}/wallet")]
    public async Task<IActionResult> GetWallet(Guid id, CancellationToken cancellationToken)
    {
        var craftsman = await dbContext.Craftsmen.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (craftsman is null)
        {
            return NotFound(new { message = "Usta bulunamadı." });
        }

        var balance = await dbContext.PointLedgerEntries
            .Where(x => x.CraftsmanId == id)
            .SumAsync(x => (int?)x.Amount, cancellationToken) ?? 0;
        var movements = await dbContext.PointLedgerEntries.AsNoTracking()
            .Where(x => x.CraftsmanId == id)
            .OrderByDescending(x => x.CreatedAtUtc)
            .Take(20)
            .Select(x => new { x.Id, x.Amount, x.TransactionType, x.Description, x.CreatedAtUtc })
            .ToListAsync(cancellationToken);

        return Ok(new
        {
            craftsman.Id,
            craftsman.FullName,
            craftsman.Level,
            balance,
            availablePoints = Math.Max(0, balance),
            pointDebt = Math.Max(0, -balance),
            canRedeemRewards = balance >= 0,
            movements
        });
    }

    [HttpGet("{id:guid}/profile")]
    public async Task<IActionResult> GetProfile(Guid id, CancellationToken cancellationToken)
    {
        var profile = await dbContext.Craftsmen.AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => new
            {
                x.Id,
                x.FullName,
                x.PhoneNumber,
                x.City,
                level = x.Level.ToString(),
                x.CampaignNotificationsEnabled,
                x.SmsNotificationsEnabled,
                x.CreatedAtUtc
            })
            .SingleOrDefaultAsync(cancellationToken);

        if (profile is null) return NotFound(new { message = "Usta bulunamadı." });
        var consents = await dbContext.CraftsmanConsents.AsNoTracking().Where(x => x.CraftsmanId == id).OrderByDescending(x => x.RecordedAtUtc).ToListAsync(cancellationToken);
        bool latest(CraftsmanConsentType type) => consents.FirstOrDefault(x => x.Type == type)?.Granted ?? false;
        var version = consents.FirstOrDefault(x => x.Type == CraftsmanConsentType.PrivacyNotice)?.DocumentVersion ?? "2026-08-dev";
        return Ok(new { profile.Id, profile.FullName, profile.PhoneNumber, profile.City, profile.level, profile.CampaignNotificationsEnabled, profile.SmsNotificationsEnabled, profile.CreatedAtUtc, privacyNoticeAcknowledged = latest(CraftsmanConsentType.PrivacyNotice), explicitConsent = latest(CraftsmanConsentType.ExplicitConsent), commercialCommunicationConsent = latest(CraftsmanConsentType.CommercialCommunication), consentVersion = version });
    }

    [HttpGet("{id:guid}/dashboard")]
    public async Task<IActionResult> GetDashboard(Guid id, CancellationToken cancellationToken)
    {
        var craftsman = await dbContext.Craftsmen.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id && x.IsActive, cancellationToken);
        if (craftsman is null) return NotFound(new { message = "Aktif usta bulunamadı." });
        var balance = await dbContext.PointLedgerEntries.Where(x => x.CraftsmanId == id).SumAsync(x => (int?)x.Amount, cancellationToken) ?? 0;
        var movements = await dbContext.PointLedgerEntries.AsNoTracking().Where(x => x.CraftsmanId == id).OrderByDescending(x => x.CreatedAtUtc).Take(3)
            .Select(x => new { x.Description, x.CreatedAtUtc, x.Amount }).ToListAsync(cancellationToken);
        var qualifyingPoints = await dbContext.PointLedgerEntries.Where(x => x.CraftsmanId == id && x.Amount > 0).SumAsync(x => (int?)x.Amount, cancellationToken) ?? 0;
        var loyaltyConfig = await dbContext.LoyaltyConfigurations.AsNoTracking().SingleAsync(x => x.Id == LoyaltyConfiguration.DefaultId, cancellationToken);
        var level = LoyaltyPolicy.GetLevel(qualifyingPoints, loyaltyConfig.SilverThreshold, loyaltyConfig.GoldThreshold);
        var availablePoints = Math.Max(0, balance);
        return Ok(new
        {
            craftsmanId = craftsman.Id,
            craftsman.FullName,
            level = level.ToString(),
            balance,
            availablePoints,
            pointDebt = Math.Max(0, -balance),
            canRedeemRewards = balance >= 0,
            rewardValueTry = availablePoints / loyaltyConfig.PointsPerRewardTry,
            pointsToNextLevel = LoyaltyPolicy.PointsToNextLevel(qualifyingPoints, loyaltyConfig.SilverThreshold, loyaltyConfig.GoldThreshold),
            movements,
            updatedAtUtc = DateTimeOffset.UtcNow
        });
    }

    [HttpPut("{id:guid}/profile")]
    public async Task<IActionResult> UpdateProfile(Guid id, UpdateCraftsmanProfileRequest request, CancellationToken cancellationToken)
    {
        var craftsman = await dbContext.Craftsmen.SingleOrDefaultAsync(x => x.Id == id && x.IsActive, cancellationToken);
        if (craftsman is null)
        {
            return NotFound(new { message = "Aktif usta bulunamadı." });
        }

        if (string.IsNullOrWhiteSpace(request.FullName) || request.FullName.Trim().Length is < 3 or > 120)
        {
            return ValidationProblem("Ad soyad 3 ile 120 karakter arasında olmalıdır.");
        }

        if (request.City?.Trim().Length > 80)
        {
            return ValidationProblem("Şehir 80 karakterden uzun olamaz.");
        }
        var version = request.ConsentVersion?.Trim();
        if (string.IsNullOrWhiteSpace(version) || version.Length > 40) return ValidationProblem("Onay metni sürümü zorunludur.");
        if (craftsman.FullName == "Yeni Usta" && !request.PrivacyNoticeAcknowledged) return ValidationProblem("Kulübe katılmak için aydınlatma metnini okuduğunuzu onaylamalısınız.");

        craftsman.FullName = request.FullName.Trim();
        craftsman.City = string.IsNullOrWhiteSpace(request.City) ? null : request.City.Trim();
        craftsman.CampaignNotificationsEnabled = request.CampaignNotificationsEnabled;
        craftsman.SmsNotificationsEnabled = request.SmsNotificationsEnabled;
        dbContext.CraftsmanConsents.AddRange(
            new CraftsmanConsent { CraftsmanId = id, Type = CraftsmanConsentType.PrivacyNotice, DocumentVersion = version, Granted = request.PrivacyNoticeAcknowledged },
            new CraftsmanConsent { CraftsmanId = id, Type = CraftsmanConsentType.ExplicitConsent, DocumentVersion = version, Granted = request.ExplicitConsent },
            new CraftsmanConsent { CraftsmanId = id, Type = CraftsmanConsentType.CommercialCommunication, DocumentVersion = version, Granted = request.CommercialCommunicationConsent });
        await dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new
        {
            craftsman.Id,
            craftsman.FullName,
            craftsman.City,
            craftsman.CampaignNotificationsEnabled,
            craftsman.SmsNotificationsEnabled
        });
    }

    [HttpPost("{id:guid}/phone-change/request")]
    public async Task<IActionResult> RequestPhoneChange(Guid id, PhoneChangeRequest request, CancellationToken cancellationToken)
    {
        var phone = NormalizePhone(request.NewPhoneNumber);
        if (phone is null) return ValidationProblem("Geçerli yeni telefon numarası girin.");
        var craftsman = await dbContext.Craftsmen.SingleOrDefaultAsync(x => x.Id == id && x.IsActive, cancellationToken);
        if (craftsman is null) return NotFound(new { message = "Aktif usta bulunamadı." });
        if (phone == craftsman.PhoneNumber) return Conflict(new { message = "Yeni numara mevcut telefon numaranızla aynı." });
        if (await dbContext.Craftsmen.AnyAsync(x => x.PhoneNumber == phone, cancellationToken)) return Conflict(new { message = "Bu telefon numarası başka bir hesapta kayıtlı." });
        var remoteAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var networkKey = $"phone-change-network:{remoteAddress}"; var attempts = cache.Get<int>(networkKey);
        if (attempts >= 5) return StatusCode(StatusCodes.Status429TooManyRequests, new { message = "Bu bağlantıdan çok fazla telefon değişikliği istendi. 10 dakika sonra tekrar deneyin." });
        var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
        var secured = OtpCodeHasher.Hash(code);
        try { await smsDelivery.SendOtpAsync(phone, code, cancellationToken); }
        catch (SmsProviderNotConfiguredException) { return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = "SMS doğrulama servisi henüz yapılandırılmadı." }); }
        var challenge = new OtpChallenge { PhoneNumber = phone, CodeHash = secured.Hash, CodeSalt = secured.Salt, ExpiresAtUtc = DateTimeOffset.UtcNow.AddMinutes(3) };
        dbContext.OtpChallenges.Add(challenge); await dbContext.SaveChangesAsync(cancellationToken); cache.Set(networkKey, attempts + 1, TimeSpan.FromMinutes(10));
        return Ok(new { challenge.Id, expiresInSeconds = 180, developmentCode = environment.IsDevelopment() ? code : null });
    }

    [HttpPost("{id:guid}/phone-change/confirm")]
    public async Task<IActionResult> ConfirmPhoneChange(Guid id, ConfirmPhoneChangeRequest request, CancellationToken cancellationToken)
    {
        var challenge = await dbContext.OtpChallenges.SingleOrDefaultAsync(x => x.Id == request.ChallengeId, cancellationToken);
        if (challenge is null || challenge.UsedAtUtc.HasValue || challenge.ExpiresAtUtc <= DateTimeOffset.UtcNow) return Unauthorized(new { message = "Kodun süresi dolmuş veya geçersiz." });
        if (challenge.FailedAttempts >= challenge.MaxAttempts) return Unauthorized(new { message = "Deneme sınırı aşıldı. Yeni kod isteyin." });
        if (request.Code.Length != 6 || !OtpCodeHasher.Verify(request.Code, challenge.CodeHash, challenge.CodeSalt)) { challenge.FailedAttempts++; await dbContext.SaveChangesAsync(cancellationToken); return Unauthorized(new { message = "Doğrulama kodu hatalı." }); }
        var craftsman = await dbContext.Craftsmen.SingleOrDefaultAsync(x => x.Id == id && x.IsActive, cancellationToken);
        if (craftsman is null) return NotFound(new { message = "Aktif usta bulunamadı." });
        if (await dbContext.Craftsmen.AnyAsync(x => x.PhoneNumber == challenge.PhoneNumber && x.Id != id, cancellationToken)) return Conflict(new { message = "Bu telefon numarası başka bir hesapta kayıtlı." });
        challenge.UsedAtUtc = DateTimeOffset.UtcNow; craftsman.PhoneNumber = challenge.PhoneNumber;
        var sessions = await dbContext.CraftsmanSessions.Where(x => x.CraftsmanId == id && x.RevokedAtUtc == null).ToListAsync(cancellationToken); foreach (var session in sessions) session.RevokedAtUtc = DateTimeOffset.UtcNow;
        dbContext.QueueCraftsmanNotification(id, "Security", "Telefon numaranız değiştirildi", "Hesabınızın telefon numarası güvenlik doğrulamasıyla güncellendi. Yeni numaranızla tekrar giriş yapın.", "PhoneChange", Guid.NewGuid());
        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new { phoneNumber = craftsman.PhoneNumber, requiresReauthentication = true });
    }

    private static string? NormalizePhone(string input)
    {
        var digits = new string(input.Where(char.IsDigit).ToArray());
        return digits.Length is >= 10 and <= 15 ? digits : null;
    }
}

public sealed record CreateCraftsmanRequest(string PhoneNumber, string FullName, string? City);
public sealed record UpdateCraftsmanProfileRequest(
    string FullName,
    string? City,
    bool CampaignNotificationsEnabled,
    bool SmsNotificationsEnabled,
    bool PrivacyNoticeAcknowledged,
    bool ExplicitConsent,
    bool CommercialCommunicationConsent,
    string? ConsentVersion);
public sealed record PhoneChangeRequest(string NewPhoneNumber);
public sealed record ConfirmPhoneChangeRequest(Guid ChallengeId, string Code);
