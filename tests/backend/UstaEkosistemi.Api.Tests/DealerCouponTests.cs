using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using UstaEkosistemi.Api.Controllers;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;
using UstaEkosistemi.Api.Security;

namespace UstaEkosistemi.Api.Tests;

public sealed class DealerCouponTests
{
    [Fact]
    public async Task Verifying_does_not_consume_and_fulfilling_twice_delivers_once()
    {
        var options = new DbContextOptionsBuilder<UstaEkosistemiDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .ConfigureWarnings(warnings => warnings.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        await using var db = new UstaEkosistemiDbContext(options);
        var craftsman = new Craftsman { PhoneNumber = "905551234567", FullName = "Test Ustası" };
        var reward = new Reward { Name = "Takım Çantası", Description = "Bayiden teslim test ödülü", PointCost = 2_500, DeliveryType = RewardDeliveryType.DealerPickup, ImageKey = "tool-bag" };
        var dealer = new Dealer { Code = "TEST-DEALER", Name = "Test Bayi" };
        var employee = new DealerEmployee { Dealer = dealer, FullName = "Test Çalışanı" };
        var redemption = new RewardRedemption { Craftsman = craftsman, Reward = reward, PointsSpent = 2_500, FulfillmentCode = "TESLIM-001" };
        db.AddRange(craftsman, reward, dealer, employee, redemption);
        db.DealerSessions.Add(new DealerSession { DealerEmployee = employee, TokenHash = DealerSessionAuthenticator.HashToken("dealer-token"), ExpiresAtUtc = DateTimeOffset.UtcNow.AddHours(1) });
        await db.SaveChangesAsync();
        var controller = ControllerFor(db);

        Assert.IsType<OkObjectResult>(await controller.Verify("TESLIM-001", CancellationToken.None));
        Assert.Equal(RewardRedemptionStatus.Created, (await db.RewardRedemptions.SingleAsync()).Status);

        Assert.IsType<OkObjectResult>(await controller.Fulfill("TESLIM-001", CancellationToken.None));
        Assert.IsType<OkObjectResult>(await controller.Fulfill("TESLIM-001", CancellationToken.None));

        var saved = await db.RewardRedemptions.SingleAsync();
        Assert.Equal(RewardRedemptionStatus.Fulfilled, saved.Status);
        Assert.Equal(employee.Id, saved.FulfilledByDealerEmployeeId);
        Assert.Single(await db.OutboxMessages.Where(message => message.Type == "CraftsmanNotification").ToListAsync());
    }

    private static DealerCouponsController ControllerFor(UstaEkosistemiDbContext db)
    {
        var controller = new DealerCouponsController(db, new DealerSessionAuthenticator(db));
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };
        controller.Request.Headers.Authorization = "Bearer dealer-token";
        return controller;
    }
}
