using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;
using UstaEkosistemi.Api.Loyalty;

namespace UstaEkosistemi.Api.Controllers;

[ApiController]
[Route("api/craftsmen")]
public sealed class CraftsmenController(UstaEkosistemiDbContext dbContext) : ControllerBase
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
