using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;

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

        return Ok(new { craftsman.Id, craftsman.FullName, craftsman.Level, balance, movements });
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

        return profile is null ? NotFound(new { message = "Usta bulunamadı." }) : Ok(profile);
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

        craftsman.FullName = request.FullName.Trim();
        craftsman.City = string.IsNullOrWhiteSpace(request.City) ? null : request.City.Trim();
        craftsman.CampaignNotificationsEnabled = request.CampaignNotificationsEnabled;
        craftsman.SmsNotificationsEnabled = request.SmsNotificationsEnabled;
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
    bool SmsNotificationsEnabled);
