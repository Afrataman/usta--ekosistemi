using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;
using UstaEkosistemi.Api.Security;

namespace UstaEkosistemi.Api.Controllers;

[ApiController]
[Route("api/dealer/risk-cases")]
public sealed class DealerRiskCasesController(UstaEkosistemiDbContext dbContext, DealerSessionAuthenticator authenticator) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create(CreateRiskCaseRequest request, CancellationToken cancellationToken)
    {
        var employee = await authenticator.AuthenticateAsync(Request.Headers.Authorization, cancellationToken); if (employee is null) return Unauthorized(new { message = "Bayi oturumu geçersiz veya süresi dolmuş." });
        var referenceType = request.ReferenceType.Trim(); var referenceValue = request.ReferenceValue.Trim(); var reason = request.Reason.Trim(); var description = request.Description.Trim();
        if (referenceType is not ("ProductCode" or "Coupon" or "Sale")) return ValidationProblem("Geçerli bir işlem türü seçin.");
        if (referenceValue.Length is < 4 or > 120 || reason.Length is < 3 or > 80 || description.Length is < 10 or > 1000) return ValidationProblem("Referans, neden veya açıklama uzunluğu geçersiz.");
        var riskCase = new RiskCase { ReportedByDealerEmployeeId = employee.Id, ReferenceType = referenceType, ReferenceValue = referenceValue, Reason = reason, Description = description };
        dbContext.RiskCases.Add(riskCase); await dbContext.SaveChangesAsync(cancellationToken);
        return Created($"/api/dealer/risk-cases/{riskCase.Id}", new { riskCase.Id, status = riskCase.Status.ToString(), riskCase.CreatedAtUtc });
    }
}

public sealed record CreateRiskCaseRequest(string ReferenceType, string ReferenceValue, string Reason, string Description);
