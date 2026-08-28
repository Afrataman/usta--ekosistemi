using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;
using UstaEkosistemi.Api.Security;

namespace UstaEkosistemi.Api.Controllers;

[ApiController]
[Route("api/dealer/dashboard")]
public sealed class DealerDashboardController(UstaEkosistemiDbContext dbContext, DealerSessionAuthenticator dealerAuth) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken token)
    {
        var employee = await dealerAuth.AuthenticateAsync(Request.Headers.Authorization, token);
        if (employee is null) return Unauthorized(new { message = "Bayi oturumu geçersiz veya süresi dolmuş." });

        var now = DateTimeOffset.UtcNow;
        var today = new DateTimeOffset(now.UtcDateTime.Date, TimeSpan.Zero);
        var month = new DateTimeOffset(new DateTime(now.Year, now.Month, 1), TimeSpan.Zero);
        var sales = dbContext.DealerSales.AsNoTracking().Where(x => x.DealerId == employee.DealerId);
        var monthSales = sales.Where(x => x.CreatedAtUtc >= month);
        var dealerName = await dbContext.Dealers.Where(x => x.Id == employee.DealerId).Select(x => x.Name).SingleAsync(token);
        var todayCount = await sales.CountAsync(x => x.CreatedAtUtc >= today, token);
        var todayAmount = await sales.Where(x => x.CreatedAtUtc >= today).SumAsync(x => (decimal?)x.TotalAmount, token) ?? 0;
        var monthCount = await monthSales.CountAsync(token);
        var monthAmount = await monthSales.SumAsync(x => (decimal?)x.TotalAmount, token) ?? 0;
        var uniqueCraftsmen = await monthSales.Select(x => x.CraftsmanId).Distinct().CountAsync(token);
        var fulfilledRewards = await dbContext.RewardRedemptions.CountAsync(x => x.FulfilledAtUtc >= month && x.FulfilledByDealerEmployee != null && x.FulfilledByDealerEmployee.DealerId == employee.DealerId, token);
        var returns = await dbContext.ProductCodes.CountAsync(x => x.ReturnedAtUtc >= month && x.ReturnedByDealerEmployee != null && x.ReturnedByDealerEmployee.DealerId == employee.DealerId, token);
        var recentSales = await sales.OrderByDescending(x => x.CreatedAtUtc).Take(5).Select(x => new { x.Id, x.SaleReference, x.TotalAmount, craftsman = x.Craftsman.FullName, employee = x.DealerEmployee.FullName, x.CreatedAtUtc }).ToListAsync(token);

        return Ok(new { dealer = dealerName, today = new { sales = todayCount, amount = todayAmount }, month = new { sales = monthCount, amount = monthAmount, uniqueCraftsmen, fulfilledRewards, returns }, recentSales });
    }
}
