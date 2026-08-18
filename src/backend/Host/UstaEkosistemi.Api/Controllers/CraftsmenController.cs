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
}

public sealed record CreateCraftsmanRequest(string PhoneNumber, string FullName, string? City);
