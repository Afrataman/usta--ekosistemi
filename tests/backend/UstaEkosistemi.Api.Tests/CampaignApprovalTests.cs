using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Controllers;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;

namespace UstaEkosistemi.Api.Tests;

public sealed class CampaignApprovalTests
{
    [Fact]
    public async Task High_multiplier_campaign_requires_a_different_admin_approval_before_activation()
    {
        var options = new DbContextOptionsBuilder<UstaEkosistemiDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;
        await using var db = new UstaEkosistemiDbContext(options);
        var requester = new AdminUser { FullName = "Kampanya Yöneticisi", UserName = "requester", PasswordHash = "test", PasswordSalt = "test" };
        var approver = new AdminUser { FullName = "Onay Yöneticisi", UserName = "approver", PasswordHash = "test", PasswordSalt = "test", Role = "Approver" };
        db.AdminUsers.AddRange(requester, approver);
        await db.SaveChangesAsync();

        var createController = ControllerFor(db, requester.Id);
        var createResult = await createController.Create(
            new CreateCampaignRequest("Ağustos 2X", "Seçili ürünlerde iki kat puan kampanyası.", 2, DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(1), true, 0, null),
            CancellationToken.None);

        Assert.IsType<CreatedResult>(createResult);
        var campaign = await db.Campaigns.SingleAsync();
        var approval = await db.CampaignApprovals.SingleAsync();
        Assert.False(campaign.IsActive);
        Assert.Equal(CampaignApprovalStatus.Pending, approval.Status);

        var ownApproval = await createController.Approve(approval.Id, new CampaignApprovalDecisionRequest("Kendi kampanyamı onaylıyorum."), CancellationToken.None);
        Assert.IsType<ConflictObjectResult>(ownApproval);

        var approvalController = ControllerFor(db, approver.Id);
        var approved = await approvalController.Approve(approval.Id, new CampaignApprovalDecisionRequest("Bütçe ve kampanya koşulları kontrol edildi."), CancellationToken.None);

        Assert.IsType<OkObjectResult>(approved);
        Assert.True((await db.Campaigns.SingleAsync()).IsActive);
        Assert.Equal(CampaignApprovalStatus.Approved, (await db.CampaignApprovals.SingleAsync()).Status);
    }

    private static AdminCampaignsController ControllerFor(UstaEkosistemiDbContext db, Guid adminId)
    {
        var controller = new AdminCampaignsController(db);
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };
        controller.HttpContext.Items["AdminUserId"] = adminId;
        return controller;
    }
}
