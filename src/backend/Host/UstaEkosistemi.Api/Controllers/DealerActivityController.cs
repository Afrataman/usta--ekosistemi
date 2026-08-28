using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Security;

namespace UstaEkosistemi.Api.Controllers;

[ApiController]
[Route("api/dealer/activity")]
public sealed class DealerActivityController(UstaEkosistemiDbContext dbContext, DealerSessionAuthenticator authenticator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(string? type, int take = 100, CancellationToken token = default)
    {
        var employee = await authenticator.AuthenticateAsync(Request.Headers.Authorization, token);
        if (employee is null) return Unauthorized(new { message = "Bayi oturumu geçersiz veya süresi dolmuş." });
        take = Math.Clamp(take, 1, 200); var dealerId = employee.DealerId;
        var includeSales = string.IsNullOrWhiteSpace(type) || type.Equals("Sale", StringComparison.OrdinalIgnoreCase);
        var includeCoupons = string.IsNullOrWhiteSpace(type) || type.Equals("Coupon", StringComparison.OrdinalIgnoreCase);
        var includeReturns = string.IsNullOrWhiteSpace(type) || type.Equals("Return", StringComparison.OrdinalIgnoreCase);
        var includeRisks = string.IsNullOrWhiteSpace(type) || type.Equals("Risk", StringComparison.OrdinalIgnoreCase);

        var sales = includeSales ? await dbContext.DealerSales.AsNoTracking().Where(x => x.DealerId == dealerId).OrderByDescending(x => x.CreatedAtUtc).Take(take)
            .Select(x => new DealerActivityRow(x.Id, "Sale", "Satış eşleştirildi", x.SaleReference, x.Craftsman.FullName, x.DealerEmployee.FullName, x.TotalAmount + " TL", "Completed", x.CreatedAtUtc)).ToListAsync(token) : [];
        var coupons = includeCoupons ? await dbContext.RewardRedemptions.AsNoTracking().Where(x => x.FulfilledByDealerEmployee != null && x.FulfilledByDealerEmployee.DealerId == dealerId).OrderByDescending(x => x.FulfilledAtUtc).Take(take)
            .Select(x => new DealerActivityRow(x.Id, "Coupon", "Ödül teslim edildi", x.FulfillmentCode, x.Craftsman.FullName, x.FulfilledByDealerEmployee!.FullName, x.Reward.Name, x.Status.ToString(), x.FulfilledAtUtc!.Value)).ToListAsync(token) : [];
        var returns = includeReturns ? await dbContext.ProductCodes.AsNoTracking().Where(x => x.ReturnedByDealerEmployee != null && x.ReturnedByDealerEmployee.DealerId == dealerId && x.ReturnedAtUtc != null).OrderByDescending(x => x.ReturnedAtUtc).Take(take)
            .Select(x => new DealerActivityRow(x.Id, "Return", "Ürün iade edildi", x.Id.ToString(), x.RedeemedByCraftsman == null ? "—" : x.RedeemedByCraftsman.FullName, x.ReturnedByDealerEmployee!.FullName, x.Product.Name + " · " + x.ReturnReason, "Completed", x.ReturnedAtUtc!.Value)).ToListAsync(token) : [];
        var risks = includeRisks ? await dbContext.RiskCases.AsNoTracking().Where(x => x.ReportedByDealerEmployee.DealerId == dealerId).OrderByDescending(x => x.CreatedAtUtc).Take(take)
            .Select(x => new DealerActivityRow(x.Id, "Risk", "Şüpheli işlem bildirildi", x.ReferenceValue, "—", x.ReportedByDealerEmployee.FullName, x.Reason, x.Status.ToString(), x.CreatedAtUtc)).ToListAsync(token) : [];

        var rows = sales.Concat(coupons).Concat(returns).Concat(risks).OrderByDescending(x => x.OccurredAtUtc).Take(take).ToList();
        return Ok(new { dealerId, rows, summary = new { sales = sales.Count, coupons = coupons.Count, returns = returns.Count, risks = risks.Count } });
    }
}

public sealed record DealerActivityRow(Guid Id, string Type, string Title, string Reference, string Craftsman, string Employee, string Detail, string Status, DateTimeOffset OccurredAtUtc);
