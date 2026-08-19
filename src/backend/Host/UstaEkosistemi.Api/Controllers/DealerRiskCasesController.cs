using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;

namespace UstaEkosistemi.Api.Controllers;

[ApiController]
[Route("api/dealer/risk-cases")]
public sealed class DealerRiskCasesController(UstaEkosistemiDbContext dbContext) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create(CreateRiskCaseRequest request, CancellationToken cancellationToken)
    {
        if (!await dbContext.DealerEmployees.AnyAsync(x => x.Id == request.DealerEmployeeId && x.IsActive && x.Dealer.IsActive, cancellationToken)) return Unauthorized(new { message = "Yetkili bayi çalışanı bulunamadı." });
        var referenceType = request.ReferenceType.Trim(); var referenceValue = request.ReferenceValue.Trim(); var reason = request.Reason.Trim(); var description = request.Description.Trim();
        if (referenceType is not ("ProductCode" or "Coupon" or "Sale")) return ValidationProblem("Geçerli bir işlem türü seçin.");
        if (referenceValue.Length is < 4 or > 120 || reason.Length is < 3 or > 80 || description.Length is < 10 or > 1000) return ValidationProblem("Referans, neden veya açıklama uzunluğu geçersiz.");
        var riskCase = new RiskCase { ReportedByDealerEmployeeId = request.DealerEmployeeId, ReferenceType = referenceType, ReferenceValue = referenceValue, Reason = reason, Description = description };
        dbContext.RiskCases.Add(riskCase); await dbContext.SaveChangesAsync(cancellationToken);
        return Created($"/api/dealer/risk-cases/{riskCase.Id}", new { riskCase.Id, status = riskCase.Status.ToString(), riskCase.CreatedAtUtc });
    }
}

public sealed record CreateRiskCaseRequest(Guid DealerEmployeeId, string ReferenceType, string ReferenceValue, string Reason, string Description);
