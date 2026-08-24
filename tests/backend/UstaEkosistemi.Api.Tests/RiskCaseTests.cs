using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Controllers;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;

namespace UstaEkosistemi.Api.Tests;

public sealed class RiskCaseTests
{
    [Fact]
    public async Task Resolving_a_risk_case_requires_a_reason_and_records_the_reviewer()
    {
        var options = new DbContextOptionsBuilder<UstaEkosistemiDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;
        await using var db = new UstaEkosistemiDbContext(options);
        var reviewer = new AdminUser { FullName = "Risk İnceleme", UserName = "risk", PasswordHash = "test", PasswordSalt = "test", Role = "Approver" };
        var dealer = new Dealer { Code = "RISK-DEALER", Name = "Risk Test Bayi" };
        var employee = new DealerEmployee { Dealer = dealer, FullName = "Bayi Çalışanı" };
        var riskCase = new RiskCase { ReportedByDealerEmployee = employee, ReferenceType = "ProductCode", ReferenceValue = "URUN-1234", Reason = "Tekrar deneme", Description = "Aynı ürün kodu kısa süre içinde tekrar okutulmaya çalışıldı." };
        db.AddRange(reviewer, dealer, employee, riskCase);
        await db.SaveChangesAsync();
        var controller = ControllerFor(db, reviewer.Id);

        Assert.IsType<ObjectResult>(await controller.UpdateRiskStatus(riskCase.Id, new UpdateRiskStatusRequest("Resolved", "kısa"), CancellationToken.None));
        Assert.Empty(await db.RiskCaseActions.ToListAsync());

        Assert.IsType<OkObjectResult>(await controller.UpdateRiskStatus(riskCase.Id, new UpdateRiskStatusRequest("Resolved", "İşlem kayıtları incelendi ve geçersiz deneme olduğu doğrulandı."), CancellationToken.None));

        var saved = await db.RiskCases.SingleAsync();
        var action = await db.RiskCaseActions.SingleAsync();
        Assert.Equal(RiskCaseStatus.Resolved, saved.Status);
        Assert.NotNull(saved.ReviewedAtUtc);
        Assert.Equal(reviewer.Id, action.AdminUserId);
        Assert.Equal(RiskCaseStatus.Resolved, action.Status);
    }

    private static AdminDashboardController ControllerFor(UstaEkosistemiDbContext db, Guid adminId)
    {
        var controller = new AdminDashboardController(db);
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };
        controller.HttpContext.Items["AdminUserId"] = adminId;
        return controller;
    }
}
