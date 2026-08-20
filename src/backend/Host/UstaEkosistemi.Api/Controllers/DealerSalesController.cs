using System.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;
using UstaEkosistemi.Api.Security;

namespace UstaEkosistemi.Api.Controllers;

[ApiController]
[Route("api/dealer/sales")]
public sealed class DealerSalesController(UstaEkosistemiDbContext dbContext, DealerSessionAuthenticator dealerAuth) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create(CreateDealerSale request, CancellationToken token)
    {
        var employee = await dealerAuth.AuthenticateAsync(Request.Headers.Authorization, token); if (employee is null) return Unauthorized(new { message = "Bayi oturumu geçersiz." });
        var reference = request.SaleReference.Trim().ToUpperInvariant(); if (reference.Length is < 3 or > 80 || request.TotalAmount < 0) return ValidationProblem("Satış referansı veya tutar geçersiz.");
        await using var transaction = await dbContext.Database.BeginTransactionAsync(IsolationLevel.Serializable, token); var now = DateTimeOffset.UtcNow;
        var pass = await dbContext.MembershipPasses.Include(x => x.Craftsman).SingleOrDefaultAsync(x => x.TokenHash == ProductCodeHasher.Hash(request.MembershipToken), token);
        if (pass is null || pass.ExpiresAtUtc <= now || pass.UsedAtUtc is not null || !pass.Craftsman.IsActive) return Conflict(new { message = "Üyelik QR’ı geçersiz, kullanılmış veya süresi dolmuş." });
        if (await dbContext.DealerSales.AnyAsync(x => x.DealerId == employee.DealerId && x.SaleReference == reference, token)) return Conflict(new { message = "Bu satış referansı daha önce eşleştirilmiş." });
        var sale = new DealerSale { DealerId = employee.DealerId, DealerEmployeeId = employee.Id, CraftsmanId = pass.CraftsmanId, MembershipPassId = pass.Id, SaleReference = reference, TotalAmount = request.TotalAmount }; pass.UsedAtUtc = now; dbContext.DealerSales.Add(sale); await dbContext.SaveChangesAsync(token); await transaction.CommitAsync(token);
        return Ok(new { sale.Id, sale.SaleReference, sale.TotalAmount, craftsman = pass.Craftsman.FullName, sale.CreatedAtUtc });
    }

    [HttpGet]
    public async Task<IActionResult> GetMine(CancellationToken token)
    {
        var employee = await dealerAuth.AuthenticateAsync(Request.Headers.Authorization, token); if (employee is null) return Unauthorized();
        return Ok(await dbContext.DealerSales.AsNoTracking().Where(x => x.DealerId == employee.DealerId).OrderByDescending(x => x.CreatedAtUtc).Take(50).Select(x => new { x.Id, x.SaleReference, x.TotalAmount, craftsman = x.Craftsman.FullName, employee = x.DealerEmployee.FullName, x.CreatedAtUtc }).ToListAsync(token));
    }
}

public sealed record CreateDealerSale(string MembershipToken, string SaleReference, decimal TotalAmount);
