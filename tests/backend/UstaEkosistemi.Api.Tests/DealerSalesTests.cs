using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using UstaEkosistemi.Api.Controllers;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;
using UstaEkosistemi.Api.Security;

namespace UstaEkosistemi.Api.Tests;

public sealed class DealerSalesTests
{
    [Fact]
    public async Task Sale_reference_is_unique_per_dealer_and_membership_pass_is_single_use()
    {
        var options = new DbContextOptionsBuilder<UstaEkosistemiDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .ConfigureWarnings(warnings => warnings.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        await using var db = new UstaEkosistemiDbContext(options);
        var craftsman = new Craftsman { PhoneNumber = "905551234567", FullName = "Test Ustası" };
        var dealer = new Dealer { Code = "TEST-DEALER", Name = "Test Bayi" };
        var employee = new DealerEmployee { Dealer = dealer, FullName = "Test Çalışanı" };
        var firstPass = new MembershipPass { Craftsman = craftsman, TokenHash = ProductCodeHasher.Hash("pass-one"), ExpiresAtUtc = DateTimeOffset.UtcNow.AddMinutes(5) };
        var secondPass = new MembershipPass { Craftsman = craftsman, TokenHash = ProductCodeHasher.Hash("pass-two"), ExpiresAtUtc = DateTimeOffset.UtcNow.AddMinutes(5) };
        db.AddRange(craftsman, dealer, employee, firstPass, secondPass);
        db.DealerSessions.Add(new DealerSession { DealerEmployee = employee, TokenHash = DealerSessionAuthenticator.HashToken("dealer-token"), ExpiresAtUtc = DateTimeOffset.UtcNow.AddHours(1) });
        await db.SaveChangesAsync();
        var controller = ControllerFor(db);

        Assert.IsType<OkObjectResult>(await controller.Create(new CreateDealerSale("pass-one", "SATIS-001", 1_250), CancellationToken.None));
        Assert.IsType<ConflictObjectResult>(await controller.Create(new CreateDealerSale("pass-one", "SATIS-002", 1_250), CancellationToken.None));
        Assert.IsType<ConflictObjectResult>(await controller.Create(new CreateDealerSale("pass-two", "SATIS-001", 1_250), CancellationToken.None));

        Assert.Single(await db.DealerSales.ToListAsync());
        Assert.NotNull((await db.MembershipPasses.SingleAsync(x => x.Id == firstPass.Id)).UsedAtUtc);
        Assert.Null((await db.MembershipPasses.SingleAsync(x => x.Id == secondPass.Id)).UsedAtUtc);
    }

    private static DealerSalesController ControllerFor(UstaEkosistemiDbContext db)
    {
        var controller = new DealerSalesController(db, new DealerSessionAuthenticator(db));
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };
        controller.Request.Headers.Authorization = "Bearer dealer-token";
        return controller;
    }
}
